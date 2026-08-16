import { ref, onValue, set, get } from 'firebase/database';
import { db, isFirebaseConfigured } from '../config/firebase';
import type { Player, Match, TournamentSeries, SeriesBreakTimer } from '../types/cricket';
import { api } from './api';

export interface CloudSyncData {
  players: Player[];
  matches: Match[];
  series: TournamentSeries[];
  activeMatchId: string | null;
  activeScorer: { deviceId: string; deviceName: string } | null;
  seriesBreakTimer?: SeriesBreakTimer | null;
  timestamp: number;
}

const ensureArray = <T>(val: any): T[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return Object.values(val);
  return [];
};

export const sanitizeMatch = (match: any): Match => {
  if (!match) return match;
  const m = { ...match };
  if (m.teamA) m.teamA = { ...m.teamA, playerIds: ensureArray(m.teamA.playerIds) };
  if (m.teamB) m.teamB = { ...m.teamB, playerIds: ensureArray(m.teamB.playerIds) };
  if (m.timeline) m.timeline = ensureArray(m.timeline);

  const sanitizeInnings = (inn: any) => {
    if (!inn) return inn;
    return {
      ...inn,
      ballLogs: ensureArray(inn.ballLogs),
      recentBalls: ensureArray(inn.recentBalls),
      fow: ensureArray(inn.fow),
      batsmenStats: inn.batsmenStats || {},
      bowlerStats: inn.bowlerStats || {},
      extrasTotal: inn.extrasTotal || { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 },
    };
  };

  if (m.innings1) m.innings1 = sanitizeInnings(m.innings1);
  if (m.innings2) m.innings2 = sanitizeInnings(m.innings2);
  return m as Match;
};

export const sanitizeSyncData = (data: any): CloudSyncData => {
  if (!data) return data;
  const now = Date.now();
  let activeScorer = data.activeScorer || null;
  if (activeScorer && activeScorer.timestamp && (now - activeScorer.timestamp > 10 * 60 * 1000)) {
    activeScorer = null;
  }
  return {
    players: ensureArray(data.players),
    matches: ensureArray(data.matches).map(sanitizeMatch),
    series: ensureArray(data.series),
    activeMatchId: data.activeMatchId || null,
    activeScorer,
    seriesBreakTimer: data.seriesBreakTimer || null,
    timestamp: data.timestamp || Date.now(),
  };
};

export const cloudSync = {
  // Push full state update to Cloud (Firebase RTDB + Express API + BroadcastChannel + LocalStorage)
  async pushState(data: Partial<CloudSyncData>): Promise<boolean> {
    // 🛡️ Strip Heavy History Payload for 90% bandwidth reduction & ultra-fast sync
    const lightweightMatches = (data.matches || []).map(m => {
      const { history, ...lightweightMatch } = m as any;
      return lightweightMatch;
    });

    let cachedPlayers: Player[] = [];
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('cricket_players_v1');
        if (raw) cachedPlayers = JSON.parse(raw);
      }
    } catch {
      // Ignore
    }

    const payload: CloudSyncData = {
      players: (data.players && data.players.length > 0) ? data.players : cachedPlayers,
      matches: lightweightMatches,
      series: data.series || [],
      activeMatchId: data.activeMatchId || null,
      activeScorer: data.activeScorer || null,
      timestamp: Date.now(),
    };

    let firebaseSuccess = false;
    if (isFirebaseConfigured) {
      try {
        const syncRef = ref(db, 'cricpulse_live_state');
        await set(syncRef, payload);
        firebaseSuccess = true;
      } catch (err) {
        console.warn('Firebase RTDB sync error:', err);
      }
    }

    // Push full live state to REST API backend for all spectator devices on network
    try {
      await api.pushSync(payload);
    } catch {
      // Ignore
    }

    // Broadcast across same-browser tabs (0ms latency)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cricpulse_live_sync_state', JSON.stringify(payload));
        if (typeof BroadcastChannel !== 'undefined') {
          const ch = new BroadcastChannel('cricpulse_live_sync');
          ch.postMessage({ type: 'LIVE_STATE_PUSH', data: payload, timestamp: Date.now() });
          ch.close();
        }
      }
    } catch {
      // Ignore
    }

    return firebaseSuccess;
  },

  // Subscribe to real-time changes from Cloud (Firebase, BroadcastChannel, Storage, and Fast Polling)
  subscribe(onUpdate: (data: CloudSyncData) => void): () => void {
    let active = true;

    // 1. Firebase Realtime Database Listener (Instant WebSockets)
    let unsubscribeFirebase = () => {};
    if (isFirebaseConfigured) {
      try {
        const syncRef = ref(db, 'cricpulse_live_state');
        unsubscribeFirebase = onValue(syncRef, (snapshot) => {
          if (!active) return;
          if (!snapshot.exists() || !snapshot.val()) return;
          const val = snapshot.val();
          if (val) {
            const sanitized = sanitizeSyncData(val);
            onUpdate(sanitized);
          }
        });
      } catch (err) {
        console.warn('Firebase subscription failed, falling back to polling:', err);
      }
    }

    // 2. BroadcastChannel Listener (0ms instant cross-tab live match updates)
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('cricpulse_live_sync');
        channel.onmessage = (event) => {
          if (!active) return;
          if (event.data?.type === 'LIVE_STATE_PUSH' && event.data.data) {
            const sanitized = sanitizeSyncData(event.data.data);
            onUpdate(sanitized);
          }
        };
      }
    } catch {
      // Ignore
    }

    // 3. LocalStorage Event Listener for multi-window sync
    const handleStorageEvent = (e: StorageEvent) => {
      if (!active) return;
      if (e.key === 'cricpulse_live_sync_state' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const sanitized = sanitizeSyncData(parsed);
          onUpdate(sanitized);
        } catch {
          // Ignore
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageEvent);
    }

    // 4. Fast Polling to backend REST API (every 750ms for live spectator devices)
    const interval = setInterval(async () => {
      if (!active) return;
      try {
        const syncData = await api.getSync();
        if (syncData && active) {
          const sanitized = sanitizeSyncData(syncData);
          onUpdate(sanitized);
        }
      } catch {
        // Offline
      }
    }, 750);

    return () => {
      active = false;
      unsubscribeFirebase();
      if (channel) {
        try {
          channel.close();
        } catch {
          // Ignore
        }
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageEvent);
      }
      clearInterval(interval);
    };
  },

  // Pull latest snapshot once
  async pullLatest(): Promise<CloudSyncData | null> {
    if (isFirebaseConfigured) {
      try {
        const syncRef = ref(db, 'cricpulse_live_state');
        const snap = await get(syncRef);
        if (snap.exists()) {
          return sanitizeSyncData(snap.val());
        }
      } catch (err) {
        console.warn('Error pulling from Firebase:', err);
      }
    }

    try {
      const res = await api.getSync();
      if (res) {
        return sanitizeSyncData(res);
      }
    } catch {
      // Backend offline
    }

    try {
      if (typeof window !== 'undefined') {
        const localRaw = localStorage.getItem('cricpulse_live_sync_state');
        if (localRaw) {
          return sanitizeSyncData(JSON.parse(localRaw));
        }
      }
    } catch {
      // Ignore
    }

    return null;
  },

  // 🔒 Distributed Scorer Lock via Firebase RTDB + REST API + BroadcastChannel + LocalStorage
  async getActiveScorerLock(): Promise<{ deviceId: string; deviceName: string; userName?: string; timestamp: number } | null> {
    const now = Date.now();
    const LOCK_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

    // 1. Firebase RTDB
    if (isFirebaseConfigured) {
      try {
        const scorerRef = ref(db, 'cricpulse_active_scorer');
        const snap = await get(scorerRef);
        if (snap.exists()) {
          const val = snap.val();
          if (val && val.timestamp && (now - val.timestamp < LOCK_EXPIRY_MS)) {
            return val;
          }
        }
      } catch (err) {
        console.warn('Firebase getActiveScorerLock error:', err);
      }
    }

    // 2. REST API Status
    try {
      const statusRes = await api.getScorerStatus();
      if (statusRes && statusRes.isLocked && statusRes.activeScorer) {
        return {
          deviceId: statusRes.activeScorer.deviceId,
          deviceName: statusRes.activeScorer.deviceName,
          userName: statusRes.activeScorer.userName,
          timestamp: statusRes.activeScorer.timestamp || now,
        };
      }
    } catch {
      // Backend offline
    }

    // 3. LocalStorage cross-tab lock
    try {
      if (typeof window !== 'undefined') {
        const localRaw = localStorage.getItem('cricpulse_active_scorer_lock');
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (parsed && parsed.deviceId && parsed.timestamp && (now - parsed.timestamp < LOCK_EXPIRY_MS)) {
            return parsed;
          }
        }
      }
    } catch {
      // Ignore
    }

    return null;
  },

  async acquireScorerLock(deviceId: string, deviceName: string, userName?: string): Promise<{
    success: boolean;
    isLocked?: boolean;
    activeScorer?: { deviceId: string; deviceName: string; userName?: string; timestamp: number };
    message?: string;
  }> {
    const now = Date.now();
    const cleanUserName = (userName || '').trim() || 'Official Scorer';

    // 1. Check Local Cross-Tab Lock first
    try {
      if (typeof window !== 'undefined') {
        const localRaw = localStorage.getItem('cricpulse_active_scorer_lock');
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (parsed && parsed.deviceId && parsed.deviceId !== deviceId && (now - (parsed.timestamp || 0) < 10 * 60 * 1000)) {
            const lockedByName = parsed.userName ? `${parsed.userName}` : (parsed.deviceName || 'another official scorer');
            return {
              success: false,
              isLocked: true,
              activeScorer: parsed,
              message: `🔒 Access Denied: Match scoring is already locked by official scorer: "${lockedByName}". Only 1 official scorer is allowed at a time. Please login as Spectator.`,
            };
          }
        }
      }
    } catch {
      // Ignore
    }

    // 2. Check Firebase RTDB
    if (isFirebaseConfigured) {
      try {
        const scorerRef = ref(db, 'cricpulse_active_scorer');
        const snap = await get(scorerRef);
        const currentLock = snap.exists() ? snap.val() : null;

        // Strict Check: If another user/device holds an active lock
        if (currentLock && currentLock.deviceId && currentLock.deviceId !== deviceId && (now - (currentLock.timestamp || 0) < 10 * 60 * 1000)) {
          const lockedByName = currentLock.userName ? `${currentLock.userName}` : (currentLock.deviceName || 'another official scorer');
          return {
            success: false,
            isLocked: true,
            activeScorer: currentLock,
            message: `🔒 Access Denied: Match scoring is already locked by official scorer: "${lockedByName}". Only 1 official scorer is allowed at a time. Please login as Spectator.`,
          };
        }
      } catch (err) {
        console.warn('Firebase acquireScorerLock check error:', err);
      }
    }

    // 3. Call REST API endpoint
    try {
      const apiRes = await api.acquireScorerLock(deviceId, deviceName, cleanUserName);
      if (apiRes && !apiRes.success && apiRes.isLocked) {
        const lockedByName = apiRes.activeScorer?.userName || apiRes.activeScorer?.deviceName || 'another official scorer';
        return {
          success: false,
          isLocked: true,
          activeScorer: apiRes.activeScorer ? { ...apiRes.activeScorer, timestamp: apiRes.activeScorer.timestamp || now } : undefined,
          message: apiRes.message || `🔒 Access Denied: Match scoring is already locked by official scorer: "${lockedByName}". Only 1 official scorer is allowed at a time. Please login as Spectator.`,
        };
      }
    } catch {
      // Offline fallback
    }

    // 4. Lock acquired successfully: Broadcast & persist to all tiers
    const newLock = { deviceId, deviceName, userName: cleanUserName, timestamp: now };

    if (isFirebaseConfigured) {
      try {
        const scorerRef = ref(db, 'cricpulse_active_scorer');
        await set(scorerRef, newLock);
      } catch (err) {
        console.warn('Firebase set scorer lock error:', err);
      }
    }

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cricpulse_active_scorer_lock', JSON.stringify(newLock));
        if (typeof BroadcastChannel !== 'undefined') {
          const ch = new BroadcastChannel('cricpulse_live_sync');
          ch.postMessage({ type: 'SCORER_LOCK_UPDATE', lock: newLock, timestamp: now });
          ch.close();
        }
      }
    } catch {
      // Ignore
    }

    return { success: true, activeScorer: newLock };
  },

  async releaseScorerLock(deviceId: string, force = false): Promise<boolean> {
    if (isFirebaseConfigured) {
      try {
        const scorerRef = ref(db, 'cricpulse_active_scorer');
        const snap = await get(scorerRef);
        if (snap.exists()) {
          const current = snap.val();
          if (force || current?.deviceId === deviceId) {
            await set(scorerRef, null);
          }
        }
      } catch (err) {
        console.warn('Firebase releaseScorerLock error:', err);
      }
    }

    try {
      if (typeof window !== 'undefined') {
        const localRaw = localStorage.getItem('cricpulse_active_scorer_lock');
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (force || parsed?.deviceId === deviceId) {
            localStorage.removeItem('cricpulse_active_scorer_lock');
          }
        }
        if (typeof BroadcastChannel !== 'undefined') {
          const ch = new BroadcastChannel('cricpulse_live_sync');
          ch.postMessage({ type: 'SCORER_LOCK_UPDATE', lock: null, timestamp: Date.now() });
          ch.close();
        }
      }
    } catch {
      // Ignore
    }

    return await api.releaseScorerLock(deviceId, force);
  },

  async heartbeatScorerLock(deviceId: string, deviceName: string, userName?: string): Promise<void> {
    const now = Date.now();
    const cleanUserName = (userName || '').trim() || 'Official Scorer';
    const lockPayload = { deviceId, deviceName, userName: cleanUserName, timestamp: now };

    if (isFirebaseConfigured) {
      try {
        const scorerRef = ref(db, 'cricpulse_active_scorer');
        await set(scorerRef, lockPayload);
      } catch {
        // Ignore
      }
    }

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cricpulse_active_scorer_lock', JSON.stringify(lockPayload));
      }
    } catch {
      // Ignore
    }

    api.heartbeatScorerLock(deviceId);
  },

  subscribeScorerLock(onUpdate: (scorer: { deviceId: string; deviceName: string; userName?: string; timestamp: number } | null) => void): () => void {
    let active = true;

    // 1. Check local lock immediately on registration
    try {
      if (typeof window !== 'undefined') {
        const localRaw = localStorage.getItem('cricpulse_active_scorer_lock');
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          if (parsed && (Date.now() - (parsed.timestamp || 0) < 10 * 60 * 1000)) {
            onUpdate(parsed);
          }
        }
      }
    } catch {
      // Ignore
    }

    // 2. Firebase Listener
    let unsubscribeFirebase = () => {};
    if (isFirebaseConfigured) {
      try {
        const scorerRef = ref(db, 'cricpulse_active_scorer');
        unsubscribeFirebase = onValue(scorerRef, (snapshot) => {
          if (!active) return;
          if (!snapshot.exists()) {
            onUpdate(null);
            return;
          }
          const val = snapshot.val();
          if (val && val.timestamp && (Date.now() - val.timestamp > 10 * 60 * 1000)) {
            // Expired lock
            onUpdate(null);
          } else {
            onUpdate(val);
          }
        });
      } catch {
        // Ignore
      }
    }

    // 3. BroadcastChannel Listener (Instant 0ms cross-tab updates)
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('cricpulse_live_sync');
        channel.onmessage = (event) => {
          if (!active) return;
          if (event.data?.type === 'SCORER_LOCK_UPDATE') {
            onUpdate(event.data.lock || null);
          }
        };
      }
    } catch {
      // Ignore
    }

    // 4. LocalStorage StorageEvent listener (detects lock updates from other windows/tabs)
    const handleStorageEvent = (e: StorageEvent) => {
      if (!active) return;
      if (e.key === 'cricpulse_active_scorer_lock') {
        if (!e.newValue) {
          onUpdate(null);
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            onUpdate(parsed);
          } catch {
            // Ignore
          }
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageEvent);
    }

    // 5. REST API Polling every 1.5 seconds to sync lock across network devices
    const interval = setInterval(async () => {
      if (!active) return;
      try {
        const status = await api.getScorerStatus();
        if (status) {
          if (status.isLocked && status.activeScorer) {
            onUpdate({
              deviceId: status.activeScorer.deviceId,
              deviceName: status.activeScorer.deviceName,
              userName: status.activeScorer.userName,
              timestamp: status.activeScorer.timestamp || Date.now(),
            });
          } else if (!status.isLocked) {
            const localRaw = typeof window !== 'undefined' ? localStorage.getItem('cricpulse_active_scorer_lock') : null;
            if (localRaw) {
              try {
                const parsed = JSON.parse(localRaw);
                if (parsed && parsed.deviceId && (Date.now() - (parsed.timestamp || 0) < 10 * 60 * 1000)) {
                  onUpdate(parsed);
                } else {
                  onUpdate(null);
                }
              } catch {
                onUpdate(null);
              }
            } else {
              onUpdate(null);
            }
          }
        }
      } catch {
        // Offline
      }
    }, 1500);

    return () => {
      active = false;
      unsubscribeFirebase();
      if (channel) {
        try {
          channel.close();
        } catch {
          // Ignore
        }
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageEvent);
      }
      clearInterval(interval);
    };
  }
};

export default cloudSync;

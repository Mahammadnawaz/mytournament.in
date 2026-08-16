import { ref, onValue, set, get } from 'firebase/database';
import { db, isFirebaseConfigured } from '../config/firebase';
import type { Player, Match, TournamentSeries } from '../types/cricket';
import { api } from './api';

export interface CloudSyncData {
  players: Player[];
  matches: Match[];
  series: TournamentSeries[];
  activeMatchId: string | null;
  activeScorer: { deviceId: string; deviceName: string } | null;
  timestamp: number;
}

// Global in-memory cache to prevent unnecessary state overwrites
let lastSyncedTimestamp = 0;

export const cloudSync = {
  // Push full state update to Cloud (Firebase RTDB + Express API)
  async pushState(data: Partial<CloudSyncData>): Promise<boolean> {
    // 🛡️ Strip Heavy History Payload for 90% bandwidth reduction & ultra-fast sync
    const lightweightMatches = (data.matches || []).map(m => {
      const { history, ...lightweightMatch } = m as any;
      return lightweightMatch;
    });

    const payload: CloudSyncData = {
      players: data.players || [],
      matches: lightweightMatches,
      series: data.series || [],
      activeMatchId: data.activeMatchId || null,
      activeScorer: data.activeScorer || null,
      timestamp: Date.now(),
    };

    lastSyncedTimestamp = payload.timestamp;

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

    // Also push to REST API endpoint if reachable
    try {
      if (data.activeMatchId) {
        await api.setActiveMatchId(data.activeMatchId);
      }
    } catch {
      // Ignore
    }

    return firebaseSuccess;
  },

  // Subscribe to real-time changes from Cloud (Firebase or Polling)
  subscribe(onUpdate: (data: CloudSyncData) => void): () => void {
    // 1. Firebase Realtime Database Listener (Instant WebSockets)
    if (isFirebaseConfigured) {
      try {
        const syncRef = ref(db, 'cricpulse_live_state');
        const unsubscribe = onValue(syncRef, (snapshot) => {
          if (!snapshot.exists() || !snapshot.val()) return;
          const val = snapshot.val();
          if (val && val.timestamp && val.timestamp > lastSyncedTimestamp) {
            lastSyncedTimestamp = val.timestamp;
            onUpdate(val);
          }
        });
        return unsubscribe;
      } catch (err) {
        console.warn('Firebase subscription failed, falling back to polling:', err);
      }
    }

    // 2. Fallback: Fast polling to backend API
    const interval = setInterval(async () => {
      try {
        const syncData = await api.getSync();
        if (syncData) {
          onUpdate({
            players: syncData.players || [],
            matches: syncData.matches || [],
            series: syncData.series || [],
            activeMatchId: syncData.activeMatchId || null,
            activeScorer: syncData.activeScorer || null,
            timestamp: syncData.timestamp || Date.now(),
          });
        }
      } catch {
        // Offline
      }
    }, 800);

    return () => clearInterval(interval);
  },

  // Pull latest snapshot once
  async pullLatest(): Promise<CloudSyncData | null> {
    if (isFirebaseConfigured) {
      try {
        const syncRef = ref(db, 'cricpulse_live_state');
        const snap = await get(syncRef);
        if (snap.exists()) {
          return snap.val();
        }
      } catch (err) {
        console.warn('Error pulling from Firebase:', err);
      }
    }

    try {
      const res = await api.getSync();
      if (res) {
        return {
          players: res.players || [],
          matches: res.matches || [],
          series: res.series || [],
          activeMatchId: res.activeMatchId || null,
          activeScorer: res.activeScorer || null,
          timestamp: res.timestamp || Date.now(),
        };
      }
    } catch {
      // Backend offline
    }

    return null;
  },

  // 🔒 Distributed Scorer Lock via Firebase RTDB + REST API
  async acquireScorerLock(deviceId: string, deviceName: string): Promise<{
    success: boolean;
    isLocked?: boolean;
    activeScorer?: { deviceId: string; deviceName: string; timestamp: number };
    message?: string;
  }> {
    if (isFirebaseConfigured) {
      try {
        const scorerRef = ref(db, 'cricpulse_active_scorer');
        const snap = await get(scorerRef);
        const currentLock = snap.exists() ? snap.val() : null;

        // Check if another device holds an active, fresh lock (< 45 seconds old)
        const isFresh = currentLock && currentLock.timestamp && (Date.now() - currentLock.timestamp < 45000);
        if (isFresh && currentLock.deviceId !== deviceId) {
          return {
            success: false,
            isLocked: true,
            activeScorer: currentLock,
            message: `🔒 Access Denied: Scoring controls are locked by ${currentLock.deviceName || 'another device'}. Only 1 device is allowed to score at a time.`,
          };
        }

        // Claim lock in Firebase RTDB
        const newLock = { deviceId, deviceName, timestamp: Date.now() };
        await set(scorerRef, newLock);
        return { success: true, activeScorer: newLock };
      } catch (err) {
        console.warn('Firebase acquireScorerLock error:', err);
      }
    }

    // Fallback to Express backend if Firebase not configured
    const apiRes = await api.acquireScorerLock(deviceId, deviceName);
    return {
      ...apiRes,
      activeScorer: apiRes.activeScorer ? { ...apiRes.activeScorer, timestamp: Date.now() } : undefined,
    };
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
    return await api.releaseScorerLock(deviceId, force);
  },

  async heartbeatScorerLock(deviceId: string, deviceName: string): Promise<void> {
    if (isFirebaseConfigured) {
      try {
        const scorerRef = ref(db, 'cricpulse_active_scorer');
        await set(scorerRef, { deviceId, deviceName, timestamp: Date.now() });
      } catch {
        // Ignore
      }
    }
    api.heartbeatScorerLock(deviceId);
  },

  subscribeScorerLock(onUpdate: (scorer: { deviceId: string; deviceName: string; timestamp: number } | null) => void): () => void {
    if (isFirebaseConfigured) {
      try {
        const scorerRef = ref(db, 'cricpulse_active_scorer');
        const unsubscribe = onValue(scorerRef, (snapshot) => {
          if (!snapshot.exists()) {
            onUpdate(null);
            return;
          }
          const val = snapshot.val();
          if (val && val.timestamp && (Date.now() - val.timestamp > 45000)) {
            // Expired lock
            onUpdate(null);
          } else {
            onUpdate(val);
          }
        });
        return unsubscribe;
      } catch {
        // Ignore
      }
    }
    return () => {};
  }
};

export default cloudSync;

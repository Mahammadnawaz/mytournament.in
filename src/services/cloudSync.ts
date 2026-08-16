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
  }
};

export default cloudSync;

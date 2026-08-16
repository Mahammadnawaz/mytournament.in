import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, set, update } from 'firebase/database';
import { db, isFirebaseConfigured, subscribeConnectionStatus } from '../config/firebase';
import type { Player, Match, TournamentSeries } from '../types/cricket';
import { INITIAL_PLAYERS, INITIAL_MATCHES, INITIAL_SERIES } from '../utils/initialData';
import { aggregateMatchStatsToPlayers, calculateMatchPOTM } from '../utils/cricketEngine';

export type UserRole = 'scorer' | 'spectator';

export interface UseCricketSyncOptions {
  initialRole?: UserRole;
  onSyncError?: (error: Error) => void;
}

export interface UseCricketSyncReturn {
  // State
  players: Player[];
  matches: Match[];
  seriesList: TournamentSeries[];
  activeMatch: Match | null;
  activeMatchId: string | null;
  userRole: UserRole;
  isScorer: boolean;
  isSpectator: boolean;
  isOnline: boolean;
  isSyncing: boolean;

  // Actions / Mutations (Guarded for Scorers)
  setUserRole: (role: UserRole) => void;
  syncActiveMatchState: (match: Match) => Promise<boolean>;
  syncNewMatchCreated: (match: Match) => Promise<boolean>;
  syncPlayerAdded: (player: Player) => Promise<boolean>;
  syncPlayerUpdated: (player: Player) => Promise<boolean>;
  syncPlayerDeleted: (playerId: string) => Promise<boolean>;
  syncSeriesUpdated: (series: TournamentSeries) => Promise<boolean>;
  finishMatchAndBatchAggregateStats: (completedMatch: Match) => Promise<boolean>;
  setActiveMatchId: (matchId: string | null) => Promise<void>;
  rollbackOptimisticUpdate: () => void;
}

const STORAGE_PLAYERS_KEY = 'cricpulse_firebase_players_backup';
const STORAGE_MATCHES_KEY = 'cricpulse_firebase_matches_backup';
const STORAGE_ACTIVE_MATCH_KEY = 'cricpulse_firebase_active_match_backup';
const STORAGE_ROLE_KEY = 'cricpulse_user_role';

export const useCricketSync = (options: UseCricketSyncOptions = {}): UseCricketSyncReturn => {
  // Determine initial role from URL query param (?role=spectator or ?role=scorer) or localStorage
  const [userRole, setUserRoleState] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get('role');
      if (urlRole === 'spectator' || urlRole === 'scorer') {
        return urlRole as UserRole;
      }
      const savedRole = localStorage.getItem(STORAGE_ROLE_KEY) as UserRole;
      if (savedRole === 'spectator' || savedRole === 'scorer') {
        return savedRole;
      }
    }
    return options.initialRole || 'scorer';
  });

  const isScorer = userRole === 'scorer';
  const isSpectator = userRole === 'spectator';

  // Core Data States initialized with LocalStorage Cache / Seed Fallbacks
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_PLAYERS_KEY);
      return cached ? JSON.parse(cached) : INITIAL_PLAYERS;
    } catch {
      return INITIAL_PLAYERS;
    }
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_MATCHES_KEY);
      return cached ? JSON.parse(cached) : INITIAL_MATCHES;
    } catch {
      return INITIAL_MATCHES;
    }
  });

  const [seriesList, setSeriesList] = useState<TournamentSeries[]>(INITIAL_SERIES);
  const [activeMatchId, setActiveMatchIdState] = useState<string | null>(null);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Update Lock Guard to prevent delayed Firebase echoes from overwriting local state
  const isLocalAction = useRef<boolean>(false);

  // Rollback Backup Ref for Optimistic UI Updates
  const rollbackSnapshotRef = useRef<{
    players: Player[];
    matches: Match[];
    activeMatch: Match | null;
  }>({
    players: INITIAL_PLAYERS,
    matches: INITIAL_MATCHES,
    activeMatch: null,
  });

  // Role Setter with URL Reflection
  const setUserRole = useCallback((newRole: UserRole) => {
    setUserRoleState(newRole);
    localStorage.setItem(STORAGE_ROLE_KEY, newRole);
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.set('role', newRole);
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // 1. Connection Health Listener
  useEffect(() => {
    const unsubConnection = subscribeConnectionStatus((connected) => {
      setIsOnline(connected);
    });

    const handleBrowserOnline = () => setIsOnline(true);
    const handleBrowserOffline = () => setIsOnline(false);

    window.addEventListener('online', handleBrowserOnline);
    window.addEventListener('offline', handleBrowserOffline);

    return () => {
      unsubConnection();
      window.removeEventListener('online', handleBrowserOnline);
      window.removeEventListener('offline', handleBrowserOffline);
    };
  }, []);

  // 2. Real-Time Subscriptions (/players, /matches, /activeMatches, /meta)
  useEffect(() => {
    if (!isFirebaseConfigured) {
      // If Firebase credentials are not yet configured, use local sync mode
      return;
    }

    setIsSyncing(true);

    // /players subscription (Lifetime career stats sync)
    const playersRef = ref(db, 'players');
    const unsubPlayers = onValue(playersRef, (snapshot) => {
      // Guard 1: Ignore delayed echo from local action write
      if (isLocalAction.current) return;
      // Guard 2: Prevent resetting to empty if snapshot is null
      if (!snapshot.exists() || snapshot.val() == null) return;

      const val = snapshot.val();
      const playersList: Player[] = Object.values(val);
      if (playersList.length > 0) {
        setPlayers(playersList);
        localStorage.setItem(STORAGE_PLAYERS_KEY, JSON.stringify(playersList));
      }
      setIsSyncing(false);
    }, (error) => {
      options.onSyncError?.(error);
      setIsSyncing(false);
    });

    // /matches subscription (Archived completed matches)
    const matchesRef = ref(db, 'matches');
    const unsubMatches = onValue(matchesRef, (snapshot) => {
      // Guard 1: Ignore delayed echo from local action write
      if (isLocalAction.current) return;
      // Guard 2: Prevent resetting to empty if snapshot is null
      if (!snapshot.exists() || snapshot.val() == null) return;

      const val = snapshot.val();
      const matchesList: Match[] = Object.values(val);
      if (matchesList.length > 0) {
        setMatches(matchesList);
        localStorage.setItem(STORAGE_MATCHES_KEY, JSON.stringify(matchesList));
      }
    });

    // /meta/currentActiveMatchId subscription (Global active match pointer)
    const activeMetaRef = ref(db, 'meta/currentActiveMatchId');
    const unsubActiveMeta = onValue(activeMetaRef, (snapshot) => {
      if (isLocalAction.current) return;
      if (!snapshot.exists()) return;

      const matchId = snapshot.val() as string | null;
      if (matchId) {
        setActiveMatchIdState(matchId);
      }
    });

    return () => {
      unsubPlayers();
      unsubMatches();
      unsubActiveMeta();
    };
  }, [isScorer, options]);

// Helper to safely format arrays (e.g. timeline, ballLogs, recentBalls, fow) from Firebase snapshots
const ensureArray = <T>(val: any): T[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return Object.values(val);
};

const sanitizeMatchFromFirebase = (data: any): Match => {
  if (!data) return data;
  const match = { ...data };
  
  if (match.teamA?.playerIds) {
    match.teamA.playerIds = ensureArray(match.teamA.playerIds);
  }
  if (match.teamB?.playerIds) {
    match.teamB.playerIds = ensureArray(match.teamB.playerIds);
  }
  if (match.timeline) {
    match.timeline = ensureArray(match.timeline);
  }

  const sanitizeInnings = (inn: any) => {
    if (!inn) return inn;
    return {
      ...inn,
      ballLogs: ensureArray(inn.ballLogs),
      recentBalls: ensureArray(inn.recentBalls),
      fow: ensureArray(inn.fow),
      ...(inn.timeline ? { timeline: ensureArray(inn.timeline) } : {}),
    };
  };

  if (match.innings1) match.innings1 = sanitizeInnings(match.innings1);
  if (match.innings2) match.innings2 = sanitizeInnings(match.innings2);

  return match as Match;
};

  // 3. Sub-100ms Active Match Live State Subscription (/activeMatches/{activeMatchId})
  // 🛡️ COMPLETELY DISABLED FOR SCORER: Scorer handles 100% of UI via local state & write-only pushes.
  // ONLY Spectators listen to onValue to eliminate all feedback loops and double-counting.
  useEffect(() => {
    // 1. Block onValue Listener on Scorer Device: exit early if isScorer === true
    if (isScorer || !isFirebaseConfigured || !activeMatchId) {
      return;
    }

    const liveMatchRef = ref(db, `activeMatches/${activeMatchId}`);
    const unsubLiveMatch = onValue(liveMatchRef, (snapshot) => {
      // 2. Add Null / Empty Payload Guard:
      if (!snapshot.exists() || !snapshot.val()) return;

      const rawData = snapshot.val();
      const liveMatchData = sanitizeMatchFromFirebase(rawData);

      if (liveMatchData && liveMatchData.id) {
        setActiveMatch(liveMatchData);
        localStorage.setItem(STORAGE_ACTIVE_MATCH_KEY, JSON.stringify(liveMatchData));
      }
    }, (error) => {
      options.onSyncError?.(error);
    });

    return () => {
      unsubLiveMatch();
    };
  }, [isScorer, activeMatchId, options]);

  // Snapshot for Rollback
  const captureRollbackSnapshot = useCallback(() => {
    rollbackSnapshotRef.current = {
      players,
      matches,
      activeMatch,
    };
  }, [players, matches, activeMatch]);

  const rollbackOptimisticUpdate = useCallback(() => {
    const snap = rollbackSnapshotRef.current;
    setPlayers(snap.players);
    setMatches(snap.matches);
    setActiveMatch(snap.activeMatch);
  }, []);

  // Helper to release local action lock after delay
  const scheduleReleaseLocalActionLock = useCallback((delayMs = 800) => {
    setTimeout(() => {
      isLocalAction.current = false;
    }, delayMs);
  }, []);

  // 4. Scorer Mutations with Optimistic Updates and Automatic Cloud Sync

  // Sync active live match ball-by-ball score to /activeMatches/{matchId}
  const syncActiveMatchState = useCallback(async (updatedMatch: Match): Promise<boolean> => {
    if (!isScorer) {
      console.warn('Unauthorized: Spectator mode is read-only.');
      return false;
    }

    // Step 1: Set Local Action Flag before executing local dispatch and Firebase push
    isLocalAction.current = true;

    captureRollbackSnapshot();

    // Optimistic local update
    setActiveMatch(updatedMatch);
    localStorage.setItem(STORAGE_ACTIVE_MATCH_KEY, JSON.stringify(updatedMatch));

    if (!isFirebaseConfigured) {
      scheduleReleaseLocalActionLock();
      return true;
    }

    try {
      const liveRef = ref(db, `activeMatches/${updatedMatch.id}`);

      // 3. Strip history Array Before Firebase Write: eliminates latency spikes
      const { history, ...lightweightPayload } = (updatedMatch as any);

      await set(liveRef, lightweightPayload);
      scheduleReleaseLocalActionLock();
      return true;
    } catch (err) {
      console.error('Firebase active match sync error, rolling back:', err);
      rollbackOptimisticUpdate();
      scheduleReleaseLocalActionLock();
      options.onSyncError?.(err as Error);
      return false;
    }
  }, [isScorer, captureRollbackSnapshot, rollbackOptimisticUpdate, scheduleReleaseLocalActionLock, options]);

  // Create & Register New Match in /activeMatches & /meta/currentActiveMatchId
  const syncNewMatchCreated = useCallback(async (newMatch: Match): Promise<boolean> => {
    if (!isScorer) return false;
    isLocalAction.current = true;
    captureRollbackSnapshot();

    setActiveMatchIdState(newMatch.id);
    setActiveMatch(newMatch);

    if (!isFirebaseConfigured) {
      scheduleReleaseLocalActionLock();
      return true;
    }

    try {
      const updates: Record<string, any> = {};
      updates[`activeMatches/${newMatch.id}`] = newMatch;
      updates['meta/currentActiveMatchId'] = newMatch.id;
      await update(ref(db), updates);
      scheduleReleaseLocalActionLock();
      return true;
    } catch (err) {
      rollbackOptimisticUpdate();
      scheduleReleaseLocalActionLock();
      options.onSyncError?.(err as Error);
      return false;
    }
  }, [isScorer, captureRollbackSnapshot, rollbackOptimisticUpdate, scheduleReleaseLocalActionLock, options]);

  // Atomically Batch-Update Career Stats on Match Finish and Move to /matches Archive
  const finishMatchAndBatchAggregateStats = useCallback(async (completedMatch: Match): Promise<boolean> => {
    if (!isScorer) return false;
    isLocalAction.current = true;
    captureRollbackSnapshot();

    const finalizedMatch: Match = {
      ...completedMatch,
      status: 'completed',
    };

    // Calculate POTM
    const potm = calculateMatchPOTM(finalizedMatch);
    if (potm) finalizedMatch.potmInfo = potm;

    // Aggregate lifetime career stats to player roster
    const updatedPlayers = aggregateMatchStatsToPlayers(players, finalizedMatch);

    // Optimistic UI updates
    setPlayers(updatedPlayers);
    setMatches(prev => [finalizedMatch, ...prev.filter(m => m.id !== finalizedMatch.id)]);
    setActiveMatch(finalizedMatch);

    if (!isFirebaseConfigured) {
      scheduleReleaseLocalActionLock();
      return true;
    }

    try {
      const updates: Record<string, any> = {};
      
      // 1. Move to /matches archive
      updates[`matches/${finalizedMatch.id}`] = finalizedMatch;

      // 2. Remove from /activeMatches
      updates[`activeMatches/${finalizedMatch.id}`] = null;

      // 3. Clear active pointer
      updates['meta/currentActiveMatchId'] = null;

      // 4. Batch update player lifetime records
      updatedPlayers.forEach((p) => {
        updates[`players/${p.id}`] = p;
      });

      await update(ref(db), updates);
      scheduleReleaseLocalActionLock();
      return true;
    } catch (err) {
      rollbackOptimisticUpdate();
      scheduleReleaseLocalActionLock();
      options.onSyncError?.(err as Error);
      return false;
    }
  }, [isScorer, players, captureRollbackSnapshot, rollbackOptimisticUpdate, scheduleReleaseLocalActionLock, options]);

  // Player Roster Mutations (/players/{playerId})
  const syncPlayerAdded = useCallback(async (newPlayer: Player): Promise<boolean> => {
    if (!isScorer) return false;
    setPlayers(prev => [newPlayer, ...prev]);

    if (!isFirebaseConfigured) return true;
    try {
      await set(ref(db, `players/${newPlayer.id}`), newPlayer);
      return true;
    } catch (err) {
      options.onSyncError?.(err as Error);
      return false;
    }
  }, [isScorer, options]);

  const syncPlayerUpdated = useCallback(async (updatedPlayer: Player): Promise<boolean> => {
    if (!isScorer) return false;
    setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));

    if (!isFirebaseConfigured) return true;
    try {
      await set(ref(db, `players/${updatedPlayer.id}`), updatedPlayer);
      return true;
    } catch (err) {
      options.onSyncError?.(err as Error);
      return false;
    }
  }, [isScorer, options]);

  const syncPlayerDeleted = useCallback(async (playerId: string): Promise<boolean> => {
    if (!isScorer) return false;
    setPlayers(prev => prev.filter(p => p.id !== playerId));

    if (!isFirebaseConfigured) return true;
    try {
      await set(ref(db, `players/${playerId}`), null);
      return true;
    } catch (err) {
      options.onSyncError?.(err as Error);
      return false;
    }
  }, [isScorer, options]);

  const syncSeriesUpdated = useCallback(async (series: TournamentSeries): Promise<boolean> => {
    if (!isScorer) return false;
    setSeriesList(prev => prev.map(s => s.id === series.id ? series : s));

    if (!isFirebaseConfigured) return true;
    try {
      await set(ref(db, `series/${series.id}`), series);
      return true;
    } catch (err) {
      options.onSyncError?.(err as Error);
      return false;
    }
  }, [isScorer, options]);

  const setActiveMatchId = useCallback(async (matchId: string | null) => {
    setActiveMatchIdState(matchId);
    if (!isFirebaseConfigured || !isScorer) return;
    try {
      await set(ref(db, 'meta/currentActiveMatchId'), matchId);
    } catch (err) {
      options.onSyncError?.(err as Error);
    }
  }, [isScorer, options]);

  return {
    players,
    matches,
    seriesList,
    activeMatch,
    activeMatchId,
    userRole,
    isScorer,
    isSpectator,
    isOnline,
    isSyncing,
    setUserRole,
    syncActiveMatchState,
    syncNewMatchCreated,
    syncPlayerAdded,
    syncPlayerUpdated,
    syncPlayerDeleted,
    syncSeriesUpdated,
    finishMatchAndBatchAggregateStats,
    setActiveMatchId,
    rollbackOptimisticUpdate,
  };
};

export default useCricketSync;

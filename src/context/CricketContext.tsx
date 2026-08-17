import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Player, Match, InningsState, TournamentSeries, SeriesBreakTimer } from '../types/cricket';
import { INITIAL_PLAYERS, INITIAL_MATCHES, INITIAL_SERIES } from '../utils/initialData';
import { processBall, aggregateMatchStatsToPlayers, calculateMatchPOTM, calculateSeriesMVP } from '../utils/cricketEngine';
import type { ScoreBallParams } from '../utils/cricketEngine';
import { api } from '../services/api';
import { cloudSync } from '../services/cloudSync';

export type ThemeMode = 'testcricket' | 'county' | 'lords' | 'oceaniablue' | 'daylight';

export type UserRole = 'scorer' | 'spectator';

interface CricketContextType {
  players: Player[];
  matches: Match[];
  seriesList: TournamentSeries[];
  activeMatch: Match | null;
  activeInnings: InningsState | null;
  activeTab: 'scoring' | 'players' | 'scorecard' | 'analytics' | 'history' | 'series';
  setActiveTab: (tab: 'scoring' | 'players' | 'scorecard' | 'analytics' | 'history' | 'series') => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  userRole: UserRole | null;
  userName: string | null;
  isLoggedIn: boolean;
  isScorer: boolean;
  isSpectator: boolean;
  isOnline: boolean;
  deviceId: string;
  activeScorer: { deviceId: string; deviceName: string; userName?: string } | null;
  setUserRole: (role: UserRole) => Promise<void>;
  loginAsScorer: (name: string) => Promise<{ success: boolean; message?: string }>;
  loginAsSpectator: (name: string) => void;
  logoutRole: () => Promise<void>;
  releaseScorerLock: (force?: boolean) => Promise<void>;
  addPlayer: (player: Omit<Player, 'id' | 'stats'>) => void;
  updatePlayer: (player: Player) => void;
  deletePlayer: (id: string) => void;
  createMatch: (match: Omit<Match, 'id' | 'status' | 'currentInnings'> & {
    openingStrikerId?: string;
    openingNonStrikerId?: string;
    openingBowlerId?: string;
  }) => void;
  createSeries: (seriesData: Omit<TournamentSeries, 'id' | 'matchIds' | 'status'>) => void;
  completeSeries: (seriesId: string) => void;
  scoreBall: (params: ScoreBallParams) => { needBowlerChange: boolean; overCompleted: boolean; inningsCompleted: boolean } | undefined;
  undoLastBall: () => void;
  changeBowler: (newBowlerId: string) => void;
  swapStriker: () => void;
  startSecondInnings: (strikerId: string, nonStrikerId: string, bowlerId: string) => void;
  applyDLSTarget: (revisedTarget: number, revisedOvers: number) => void;
  declareCurrentInnings: () => void;
  finishMatch: (resultMessage?: string) => void;
  setActiveMatchId: (id: string | null) => void;
  resetToDemoData: () => void;
  seriesBreakTimer: SeriesBreakTimer | null;
  startSeriesBreak: (seriesId: string, nextMatchNo: number, durationMinutes: number) => void;
  cancelSeriesBreak: () => void;
  customAddedTeams: string[];
  addCustomTeamName: (teamName: string) => void;
}

const CricketContext = createContext<CricketContextType | undefined>(undefined);

export const CricketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('cricket_theme_v1') as ThemeMode;
    return (saved === 'testcricket' || saved === 'county' || saved === 'lords' || saved === 'oceaniablue' || saved === 'daylight') ? saved : 'testcricket';
  });

  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem('cricket_players_v1');
    return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    const saved = localStorage.getItem('cricket_matches_v1');
    return saved ? JSON.parse(saved) : INITIAL_MATCHES;
  });

  const [seriesList, setSeriesList] = useState<TournamentSeries[]>(() => {
    const saved = localStorage.getItem('cricket_series_v1');
    return saved ? JSON.parse(saved) : INITIAL_SERIES;
  });

  const [seriesBreakTimer, setSeriesBreakTimer] = useState<SeriesBreakTimer | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cricpulse_series_break_timer');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.endTime > Date.now()) return parsed;
        } catch (e) {}
      }
    }
    return null;
  });

  const startSeriesBreak = (seriesId: string, nextMatchNo: number, durationMinutes: number) => {
    const timer: SeriesBreakTimer = {
      seriesId,
      nextMatchNo,
      durationMinutes,
      endTime: Date.now() + durationMinutes * 60 * 1000,
    };
    setSeriesBreakTimer(timer);
    localStorage.setItem('cricpulse_series_break_timer', JSON.stringify(timer));
    cloudSync.pushState({ players, matches, series: seriesList, activeMatchId, activeScorer, seriesBreakTimer: timer });
    broadcastSync();
  };

  const cancelSeriesBreak = () => {
    setSeriesBreakTimer(null);
    localStorage.removeItem('cricpulse_series_break_timer');
    cloudSync.pushState({ players, matches, series: seriesList, activeMatchId, activeScorer, seriesBreakTimer: null });
    broadcastSync();
  };

  const [activeMatchId, setActiveMatchId] = useState<string | null>(() => {
    return localStorage.getItem('cricket_active_match_v1') || null;
  });

  const [activeTab, setActiveTabState] = useState<'scoring' | 'players' | 'scorecard' | 'analytics' | 'history' | 'series'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cricpulse_active_tab') as any;
      if (saved) return saved;
    }
    return 'scoring';
  });

  const setActiveTab = (tab: 'scoring' | 'players' | 'scorecard' | 'analytics' | 'history' | 'series') => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cricpulse_active_tab', tab);
    }
  };

  const [customAddedTeams, setCustomAddedTeams] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cricket_added_teams_v1');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return [];
        }
      }
    }
    return [];
  });

  const addCustomTeamName = (teamName: string) => {
    if (!teamName || !teamName.trim()) return;
    const trimmed = teamName.trim();
    setCustomAddedTeams(prev => {
      if (prev.includes(trimmed)) return prev;
      const updated = [...prev, trimmed];
      localStorage.setItem('cricket_added_teams_v1', JSON.stringify(updated));
      return updated;
    });
  };

  // Persistent device ID per browser/device
  const [deviceId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('cricpulse_device_id');
      if (!id) {
        id = 'dev-' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('cricpulse_device_id', id);
      }
      return id;
    }
    return 'dev-default';
  });

  const [activeScorer, setActiveScorer] = useState<{ deviceId: string; deviceName: string; userName?: string } | null>(() => {
    if (typeof window !== 'undefined') {
      const localRaw = localStorage.getItem('cricpulse_active_scorer_lock');
      if (localRaw) {
        try {
          const parsed = JSON.parse(localRaw);
          if (parsed && parsed.deviceId && (Date.now() - (parsed.timestamp || 0) < 10 * 60 * 1000)) {
            return parsed;
          }
        } catch {
          // Ignore
        }
      }
    }
    return null;
  });

  useEffect(() => {
    if (activeScorer) {
      localStorage.setItem('cricpulse_active_scorer_lock', JSON.stringify(activeScorer));
    } else {
      localStorage.removeItem('cricpulse_active_scorer_lock');
    }
  }, [activeScorer]);

  const [userRole, setUserRoleState] = useState<UserRole | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get('role');
      if (urlRole === 'spectator' || urlRole === 'scorer') {
        return urlRole as UserRole;
      }
      const savedRole = localStorage.getItem('cricpulse_user_role') as UserRole;
      if (savedRole === 'spectator' || savedRole === 'scorer') {
        return savedRole;
      }
    }
    return null;
  });

  const [userName, setUserNameState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cricpulse_user_name') || null;
    }
    return null;
  });

  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? (navigator.onLine ?? true) : true);

  const isLoggedIn = Boolean(userRole);
  const isScorer = userRole === 'scorer';
  const isSpectator = userRole === 'spectator';

  // Real-time Cloud Scorer Lock subscription: sync active scorer status
  useEffect(() => {
    const unsubscribe = cloudSync.subscribeScorerLock((lock) => {
      setActiveScorer(lock);
    });

    return () => unsubscribe();
  }, [deviceId]);

  // Periodic heartbeat for active scorer to keep lock fresh every 4 seconds
  useEffect(() => {
    if (!isScorer) return;

    const devName = typeof navigator !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile Phone' : 'Laptop / PC';
    cloudSync.heartbeatScorerLock(deviceId, devName, userName || 'Official Scorer');

    const interval = setInterval(() => {
      cloudSync.heartbeatScorerLock(deviceId, devName, userName || 'Official Scorer');
    }, 4000);

    return () => clearInterval(interval);
  }, [isScorer, deviceId, userName]);

  const loginAsScorer = async (name: string): Promise<{ success: boolean; message?: string }> => {
    const devName = typeof navigator !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile Phone' : 'Laptop / PC';
    const cleanName = (name || '').trim() || 'Official Scorer';
    const lockRes = await cloudSync.acquireScorerLock(deviceId, devName, cleanName);

    if (!lockRes.success) {
      if (lockRes.activeScorer) {
        setActiveScorer(lockRes.activeScorer);
      }
      return {
        success: false,
        message: lockRes.message || `🔒 Scorer role is locked: Another user is already scoring this match. Please login as Spectator.`,
      };
    }

    if (lockRes.activeScorer) {
      setActiveScorer(lockRes.activeScorer);
    }
    setUserNameState(cleanName);
    setUserRoleState('scorer');
    setActiveTab('scoring');
    localStorage.setItem('cricpulse_user_role', 'scorer');
    localStorage.setItem('cricpulse_user_name', cleanName);
    cloudSync.pushState({ players, matches, series: seriesList, activeMatchId, activeScorer: lockRes.activeScorer || null });
    broadcastSync();
    return { success: true };
  };

  const loginAsSpectator = (name: string) => {
    const cleanName = (name || '').trim() || 'Spectator';
    setUserNameState(cleanName);
    setUserRoleState('spectator');
    setActiveTab('scoring');
    localStorage.setItem('cricpulse_user_role', 'spectator');
    localStorage.setItem('cricpulse_user_name', cleanName);
    broadcastSync();
  };

  const logoutRole = async () => {
    if (userRole === 'scorer' || isScorer) {
      await cloudSync.releaseScorerLock(deviceId, true);
      setActiveScorer(null);
      cloudSync.pushState({ players, matches, series: seriesList, activeMatchId, activeScorer: null });
    }
    setUserRoleState(null);
    setUserNameState(null);
    localStorage.removeItem('cricpulse_user_role');
    localStorage.removeItem('cricpulse_user_name');
    if (typeof window !== 'undefined' && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.delete('role');
      window.history.replaceState({}, '', url.toString());
    }
    broadcastSync();
  };

  const setUserRole = async (newRole: UserRole) => {
    if (newRole === 'scorer') {
      const res = await loginAsScorer(userName || 'Official Scorer');
      if (!res.success) {
        alert(res.message);
        setUserRoleState('spectator');
        localStorage.setItem('cricpulse_user_role', 'spectator');
      }
    } else {
      loginAsSpectator(userName || 'Spectator');
    }
  };

  const releaseScorerLock = async (force?: boolean) => {
    await cloudSync.releaseScorerLock(deviceId, force);
    setActiveScorer(null);
    if (force) {
      setUserRoleState('spectator');
      localStorage.setItem('cricpulse_user_role', 'spectator');
    }
    broadcastSync();
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('cricket_theme_v1', newTheme);
  };

  useEffect(() => {
    document.documentElement.classList.remove(
      'theme-daylight', 'theme-testcricket', 'theme-county', 'theme-lords', 'theme-oceaniablue',
      'theme-midnight', 'theme-cyber', 'theme-royal', 'theme-grass', 'theme-broadcast',
      'theme-iplnight', 'theme-lawngreen', 'theme-ashesgold', 'dark'
    );
    if (theme === 'daylight' || theme === 'testcricket' || theme === 'county' || theme === 'lords') {
      document.documentElement.classList.add(`theme-${theme}`);
    } else {
      document.documentElement.classList.add('dark', `theme-${theme}`);
    }
  }, [theme]);

  // BroadcastChannel helper for 0ms same-browser cross-tab live sync
  const broadcastSync = (payload?: any) => {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const ch = new BroadcastChannel('cricpulse_live_sync');
        ch.postMessage({ type: 'SYNC', payload: payload || null, timestamp: Date.now() });
        ch.close();
      }
    } catch {
      // Ignore
    }
  };

  // Monotonic Timestamp Guard to guarantee score never goes backwards or accepts stale echoes
  const lastSyncTimestamp = useRef<number>(0);
  const isLocalAction = useRef<boolean>(false);

  const releaseLocalActionLock = (delayMs = 500) => {
    setTimeout(() => {
      isLocalAction.current = false;
    }, delayMs);
  };

  // Realtime Multi-Device Sync Hook (Firebase WebSockets + REST API Polling + BroadcastChannel)
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('cricpulse_live_sync');
      }
    } catch {
      // Ignore
    }

    const applyIncomingSync = (syncData: any) => {
      if (!syncData) return;
      if (isLocalAction.current) return;

      const incomingTime = syncData.timestamp || Date.now();
      if (incomingTime < lastSyncTimestamp.current - 5000) {
        return;
      }
      lastSyncTimestamp.current = Math.max(lastSyncTimestamp.current, incomingTime);

      if (syncData.players && Array.isArray(syncData.players)) {
        setPlayers(syncData.players);
        localStorage.setItem('cricket_players_v1', JSON.stringify(syncData.players));
      }
      if (syncData.matches && syncData.matches.length > 0) {
        setMatches(prev => {
          const mMap = new Map(prev.map(m => [m.id, m]));
          syncData.matches.forEach((m: any) => {
            const existing = mMap.get(m.id);
            if (existing) {
              mMap.set(m.id, { ...existing, ...m, history: m.history || (existing as any).history });
            } else {
              mMap.set(m.id, m);
            }
          });
          const merged = Array.from(mMap.values());
          localStorage.setItem('cricket_matches_v1', JSON.stringify(merged));
          return merged;
        });
      }
      if (syncData.series && syncData.series.length > 0) {
        setSeriesList(prev => {
          const sMap = new Map(prev.map(s => [s.id, s]));
          syncData.series.forEach((s: any) => sMap.set(s.id, s));
          const merged = Array.from(sMap.values());
          localStorage.setItem('cricket_series_v1', JSON.stringify(merged));
          return merged;
        });
      }
      if (syncData.activeScorer !== undefined) {
        if (isScorer && !syncData.activeScorer) {
          // Keep local scorer lock active if user is scorer
        } else {
          setActiveScorer(syncData.activeScorer);
        }
      }

      if (syncData.seriesBreakTimer !== undefined) {
        if (syncData.seriesBreakTimer && syncData.seriesBreakTimer.endTime > Date.now()) {
          setSeriesBreakTimer(syncData.seriesBreakTimer);
          localStorage.setItem('cricpulse_series_break_timer', JSON.stringify(syncData.seriesBreakTimer));
        } else {
          setSeriesBreakTimer(null);
          localStorage.removeItem('cricpulse_series_break_timer');
        }
      }

      if (syncData.activeMatchId) {
        setActiveMatchId(prev => (prev !== syncData.activeMatchId ? syncData.activeMatchId : prev));
        localStorage.setItem('cricket_active_match_v1', syncData.activeMatchId);
      } else {
        const liveMatch = (syncData.matches || []).find((m: any) => m.status === 'live');
        if (liveMatch) {
          setActiveMatchId(prev => (prev !== liveMatch.id ? liveMatch.id : prev));
          localStorage.setItem('cricket_active_match_v1', liveMatch.id);
        }
      }
    };

    if (channel) {
      channel.onmessage = (evt) => {
        if (evt.data?.type === 'SYNC') {
          if (evt.data.payload) {
            applyIncomingSync(evt.data.payload);
          } else {
            cloudSync.pullLatest().then(data => {
              if (data) applyIncomingSync(data);
            });
          }
        }
      };
    }

    // 1. Initial snapshot pull on load/refresh
    cloudSync.pullLatest().then(data => {
      if (data) {
        applyIncomingSync(data);
      }
    });

    // 2. Real-time subscription: Firebase WebSocket
    let unsubscribe = () => {};
    if (!isScorer) {
      unsubscribe = cloudSync.subscribe((syncData) => {
        applyIncomingSync(syncData);
      });
    }

    // 3. Fast 1-second interval polling for spectator screens
    let pollInterval: any = null;
    if (!isScorer) {
      pollInterval = setInterval(() => {
        cloudSync.pullLatest().then(data => {
          if (data) applyIncomingSync(data);
        });
      }, 1000);
    }

    return () => {
      unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
      if (channel) channel.close();
    };
  }, [isScorer]);

  // Persistence & Database Sync Effects
  useEffect(() => {
    localStorage.setItem('cricket_players_v1', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('cricket_matches_v1', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('cricket_series_v1', JSON.stringify(seriesList));
  }, [seriesList]);

  useEffect(() => {
    if (activeMatchId) {
      localStorage.setItem('cricket_active_match_v1', activeMatchId);
    } else {
      localStorage.removeItem('cricket_active_match_v1');
    }
  }, [activeMatchId]);

  useEffect(() => {
    const liveMatch = matches.find(m => m.status === 'live');
    if (liveMatch) {
      setActiveMatchId(liveMatch.id);
      localStorage.setItem('cricket_active_match_v1', liveMatch.id);
    } else if (activeMatchId && !matches.some(m => m.id === activeMatchId)) {
      setActiveMatchId(null);
      localStorage.removeItem('cricket_active_match_v1');
    }
  }, [matches]);

  const liveMatch = matches.find(m => m.status === 'live');
  const activeMatch = liveMatch || (activeMatchId ? matches.find(m => m.id === activeMatchId) : null) || matches[0] || null;
  const activeInnings = activeMatch 
    ? (activeMatch.currentInnings === 1 ? activeMatch.innings1 : (activeMatch.innings2 || activeMatch.innings1)) || null
    : null;

  // Player Actions (Permanently saved to LocalStorage & Cloud across all devices)
  const addPlayer = (newPlayerData: Omit<Player, 'id' | 'stats'>) => {
    isLocalAction.current = true;
    const newPlayer: Player = {
      ...newPlayerData,
      id: `p-${Date.now()}`,
      stats: {
        matches: 0,
        inningsBatted: 0,
        totalRuns: 0,
        ballsFaced: 0,
        highestScore: 0,
        notOuts: 0,
        fours: 0,
        sixes: 0,
        inningsBowled: 0,
        oversBowled: 0,
        ballsBowled: 0,
        runsConceded: 0,
        wicketsTaken: 0,
        bestBowlingWickets: 0,
        bestBowlingRuns: 0,
        maidens: 0,
      }
    };
    const updatedPlayers = [newPlayer, ...players];
    setPlayers(updatedPlayers);
    localStorage.setItem('cricket_players_v1', JSON.stringify(updatedPlayers));
    cloudSync.pushState({ players: updatedPlayers, matches, series: seriesList, activeMatchId, activeScorer });
    api.addPlayer(newPlayer);
    broadcastSync();
    releaseLocalActionLock(800);
  };

  const updatePlayer = (updatedPlayer: Player) => {
    isLocalAction.current = true;
    const updatedPlayers = players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p);
    setPlayers(updatedPlayers);
    localStorage.setItem('cricket_players_v1', JSON.stringify(updatedPlayers));
    cloudSync.pushState({ players: updatedPlayers, matches, series: seriesList, activeMatchId, activeScorer });
    api.updatePlayer(updatedPlayer);
    broadcastSync();
    releaseLocalActionLock(800);
  };

  const deletePlayer = (id: string) => {
    isLocalAction.current = true;
    const updatedPlayers = players.filter(p => p.id !== id);
    setPlayers(updatedPlayers);
    localStorage.setItem('cricket_players_v1', JSON.stringify(updatedPlayers));
    cloudSync.pushState({ players: updatedPlayers, matches, series: seriesList, activeMatchId, activeScorer });
    api.deletePlayer(id);
    broadcastSync();
    releaseLocalActionLock(800);
  };

  // Tournament / Series Actions (Permanently synced across all devices)
  const createSeries = (seriesData: Omit<TournamentSeries, 'id' | 'matchIds' | 'status'>) => {
    addCustomTeamName(seriesData.teamA);
    addCustomTeamName(seriesData.teamB);
    if (seriesData.teamC) addCustomTeamName(seriesData.teamC);

    const newSeries: TournamentSeries = {
      ...seriesData,
      id: `series-${Date.now()}`,
      matchIds: [],
      status: 'ongoing',
    };
    const updatedSeriesList = [newSeries, ...seriesList];
    setSeriesList(updatedSeriesList);
    localStorage.setItem('cricket_series_v1', JSON.stringify(updatedSeriesList));
    cloudSync.pushState({ players, matches, series: updatedSeriesList, activeMatchId, activeScorer });
    api.addSeries(newSeries);
    broadcastSync();
    setActiveTab('series');
  };

  const completeSeries = (seriesId: string) => {
    const targetSeries = seriesList.find(s => s.id === seriesId);
    if (!targetSeries) return;

    const { potS } = calculateSeriesMVP(targetSeries, matches);

    const updatedSeriesList = seriesList.map(s => {
      if (s.id === seriesId) {
        const updated = {
          ...s,
          status: 'completed' as const,
          playerOfSeriesId: potS?.playerId,
          playerOfSeriesSummary: potS?.summary || 'Outstanding all-round series performance',
        };
        api.updateSeries(updated);
        return updated;
      }
      return s;
    });

    setSeriesList(updatedSeriesList);
    localStorage.setItem('cricket_series_v1', JSON.stringify(updatedSeriesList));
    cloudSync.pushState({ players, matches, series: updatedSeriesList, activeMatchId, activeScorer });
    broadcastSync();
  };

  // Match Actions
  const createMatch = (
    matchData: Omit<Match, 'id' | 'status' | 'currentInnings'> & {
      openingStrikerId?: string;
      openingNonStrikerId?: string;
      openingBowlerId?: string;
    }
  ) => {
    const { openingStrikerId, openingNonStrikerId, openingBowlerId, ...cleanMatchData } = matchData;

    addCustomTeamName(cleanMatchData.teamA.name);
    addCustomTeamName(cleanMatchData.teamB.name);

    const battingTeamName = cleanMatchData.tossChoice === 'bat' ? cleanMatchData.tossWinner : (cleanMatchData.tossWinner === cleanMatchData.teamA.name ? cleanMatchData.teamB.name : cleanMatchData.teamA.name);
    const bowlingTeamName = battingTeamName === cleanMatchData.teamA.name ? cleanMatchData.teamB.name : cleanMatchData.teamA.name;

    const battingTeamObj = battingTeamName === cleanMatchData.teamA.name ? cleanMatchData.teamA : cleanMatchData.teamB;
    const bowlingTeamObj = bowlingTeamName === cleanMatchData.teamA.name ? cleanMatchData.teamA : cleanMatchData.teamB;

    const strikerId = openingStrikerId || battingTeamObj.playerIds[0] || players[0]?.id || '';
    const nonStrikerId = openingNonStrikerId || battingTeamObj.playerIds[1] || players[1]?.id || '';
    const bowlerId = openingBowlerId || bowlingTeamObj.playerIds[bowlingTeamObj.playerIds.length - 1] || players[2]?.id || '';

    const initialInnings: InningsState = {
      inningsNo: 1,
      battingTeam: battingTeamName,
      bowlingTeam: bowlingTeamName,
      totalRuns: 0,
      wickets: 0,
      overs: 0,
      balls: 0,
      strikerId,
      nonStrikerId,
      currentBowlerId: bowlerId,
      batsmenStats: {
        [strikerId]: { playerId: strikerId, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
        [nonStrikerId]: { playerId: nonStrikerId, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false }
      },
      bowlerStats: {
        [bowlerId]: { playerId: bowlerId, overs: 0, balls: 0, maidens: 0, runsConceded: 0, wickets: 0, wides: 0, noBalls: 0, dots: 0 }
      },
      ballLogs: [],
      recentBalls: [],
      extrasTotal: { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 },
      isCompleted: false,
      fow: [],
    };

    const newMatch: Match = {
      ...matchData,
      id: `match-${Date.now()}`,
      status: 'live',
      currentInnings: 1,
      innings1: initialInnings,
    };

    let updatedSeriesList = seriesList;
    if (newMatch.seriesId) {
      updatedSeriesList = seriesList.map(s => {
        if (s.id === newMatch.seriesId) {
          const matchIds = s.matchIds ? (s.matchIds.includes(newMatch.id) ? s.matchIds : [...s.matchIds, newMatch.id]) : [newMatch.id];
          const updatedSeries = { ...s, matchIds };
          api.updateSeries(updatedSeries);
          return updatedSeries;
        }
        return s;
      });
      setSeriesList(updatedSeriesList);
      localStorage.setItem('cricket_series_v1', JSON.stringify(updatedSeriesList));
    }

    const updatedMatches = [newMatch, ...matches];
    isLocalAction.current = true;
    setMatches(updatedMatches);
    localStorage.setItem('cricket_matches_v1', JSON.stringify(updatedMatches));
    cloudSync.pushState({ players, matches: updatedMatches, series: updatedSeriesList, activeMatchId: newMatch.id, activeScorer });
    api.addMatch(newMatch);
    api.setActiveMatchId(newMatch.id);
    setActiveMatchId(newMatch.id);
    broadcastSync();
    releaseLocalActionLock(800);
    setActiveTab('scoring');
  };

  // Live Scorekeeper Engine Action (Permanently synced to Cloud & Storage)
  const scoreBall = (params: ScoreBallParams) => {
    if (!activeMatch || !activeInnings || activeMatch.status !== 'live' || activeInnings.isCompleted) return;

    const maxOvers = activeMatch.dlsRevisedOvers || activeMatch.totalOvers;
    if (activeInnings.overs >= maxOvers || activeInnings.wickets >= 10) return;

    // Step 1: Set Local Action Flag before executing local dispatch and sync
    isLocalAction.current = true;

    const engineResult = processBall(activeInnings, params, maxOvers);

    const updatedMatch: Match = JSON.parse(JSON.stringify(activeMatch));
    if (activeMatch.currentInnings === 1) {
      updatedMatch.innings1 = engineResult.nextInningsState;
    } else {
      updatedMatch.innings2 = engineResult.nextInningsState;
    }

    let finalPlayers = players;

    if (engineResult.matchResultBanner || engineResult.inningsCompleted) {
      if (activeMatch.currentInnings === 1) {
        if (updatedMatch.innings1) updatedMatch.innings1.isCompleted = true;
        updatedMatch.currentInnings = 2;
        updatedMatch.innings2 = undefined;
      } else {
        if (updatedMatch.innings2) updatedMatch.innings2.isCompleted = true;
        updatedMatch.status = 'completed';
        if (engineResult.matchResultBanner) {
          updatedMatch.result = engineResult.matchResultBanner;
        }
        if (engineResult.winnerTeam) {
          updatedMatch.winnerTeam = engineResult.winnerTeam;
        }

        // Calculate POTM (Player of the Match MVP)
        const potm = calculateMatchPOTM(updatedMatch);
        if (potm) {
          updatedMatch.potmInfo = potm;
        }

        // Aggregate stats to players
        finalPlayers = aggregateMatchStatsToPlayers(players, updatedMatch);
        setPlayers(finalPlayers);
        localStorage.setItem('cricket_players_v1', JSON.stringify(finalPlayers));
        finalPlayers.forEach(p => api.updatePlayer(p));
      }
    }

    // 🎩 Hat-Trick Event Alert Trigger
    if (engineResult.isHatTrick && engineResult.hatTrickBowlerId) {
      const bowlerPlayer = players.find(p => p.id === engineResult.hatTrickBowlerId);
      updatedMatch.currentAlert = {
        type: 'hat-trick',
        title: 'HAT-TRICK! 🎩🔥',
        subtitle: `${bowlerPlayer?.name || 'Bowler'} takes 3 wickets in 3 consecutive balls!`,
        playerName: bowlerPlayer?.name || 'Bowler',
        timestamp: Date.now(),
      };
    } else {
      updatedMatch.currentAlert = null;
    }

    // 🎯 Live Delivery Score Pop Burst Event (for all Spectator screens)
    if (engineResult.isHatTrick) {
      updatedMatch.latestDeliveryBurst = {
        id: `burst-${Date.now()}`,
        text: '🎩🔥',
        subText: 'HAT-TRICK! (3 in 3)',
        colorType: 'hattrick',
        timestamp: Date.now(),
      };
    } else if (params.isWicket) {
      updatedMatch.latestDeliveryBurst = {
        id: `burst-${Date.now()}`,
        text: 'OUT',
        subText: 'WICKET! ☝️',
        colorType: 'wicket',
        timestamp: Date.now(),
      };
    } else if (params.extraType === 'no-ball') {
      const extraRuns = (params.runsScored || 0) > 0 ? `+${params.runsScored}` : '';
      updatedMatch.latestDeliveryBurst = {
        id: `burst-${Date.now()}`,
        text: `NB${extraRuns}`,
        subText: extraRuns ? `NO BALL ${extraRuns} RUNS ⚠️` : 'NO BALL ⚠️',
        colorType: 'noball',
        timestamp: Date.now(),
      };
    } else if (params.extraType === 'wide') {
      const extraRuns = (params.extraRuns || 0) > 0 ? `+${params.extraRuns}` : '';
      updatedMatch.latestDeliveryBurst = {
        id: `burst-${Date.now()}`,
        text: extraRuns ? `WD${extraRuns}` : 'WD',
        subText: extraRuns ? `WIDE ${extraRuns} ↔️` : 'WIDE BALL ↔️',
        colorType: 'wide',
        timestamp: Date.now(),
      };
    } else if (params.extraType === 'bye') {
      updatedMatch.latestDeliveryBurst = {
        id: `burst-${Date.now()}`,
        text: `B+${params.extraRuns || 1}`,
        subText: `BYES (+${params.extraRuns || 1}) 🛡️`,
        colorType: 'byes',
        timestamp: Date.now(),
      };
    } else if (params.extraType === 'leg-bye') {
      updatedMatch.latestDeliveryBurst = {
        id: `burst-${Date.now()}`,
        text: `LB+${params.extraRuns || 1}`,
        subText: `LEG BYES (+${params.extraRuns || 1}) 🦵`,
        colorType: 'legbyes',
        timestamp: Date.now(),
      };
    } else if (params.runsScored === 6) {
      updatedMatch.latestDeliveryBurst = {
        id: `burst-${Date.now()}`,
        text: '6',
        subText: 'MAXIMUM SIX! 🚀',
        colorType: 'six',
        timestamp: Date.now(),
      };
    } else if (params.runsScored === 4) {
      updatedMatch.latestDeliveryBurst = {
        id: `burst-${Date.now()}`,
        text: '4',
        subText: 'FOUR! 💥',
        colorType: 'four',
        timestamp: Date.now(),
      };
    } else if (params.runsScored === 3) {
      updatedMatch.latestDeliveryBurst = {
        id: `burst-${Date.now()}`,
        text: '3',
        subText: '3 RUNS (TRIPLE) ⚡',
        colorType: 'three',
        timestamp: Date.now(),
      };
    } else if (params.runsScored === 2) {
      updatedMatch.latestDeliveryBurst = {
        id: `burst-${Date.now()}`,
        text: '2',
        subText: '2 RUNS (DOUBLE) 🏃‍♂️',
        colorType: 'two',
        timestamp: Date.now(),
      };
    } else if (params.runsScored === 1) {
      updatedMatch.latestDeliveryBurst = {
        id: `burst-${Date.now()}`,
        text: '1',
        subText: '1 RUN (SINGLE) 🏏',
        colorType: 'one',
        timestamp: Date.now(),
      };
    } else {
      updatedMatch.latestDeliveryBurst = {
        id: `burst-${Date.now()}`,
        text: '0',
        subText: 'DOT BALL 🎯',
        colorType: 'dot',
        timestamp: Date.now(),
      };
    }

    const updatedMatches = matches.map(m => m.id === updatedMatch.id ? updatedMatch : m);
    setMatches(updatedMatches);
    localStorage.setItem('cricket_matches_v1', JSON.stringify(updatedMatches));

    const syncPayload = {
      players: finalPlayers || players,
      matches: updatedMatches,
      series: seriesList,
      activeMatchId: updatedMatch.id,
      activeScorer,
      timestamp: Date.now(),
    };

    cloudSync.pushState(syncPayload);
    api.updateMatch(updatedMatch);
    broadcastSync(syncPayload);
    releaseLocalActionLock(500);

    return {
      needBowlerChange: engineResult.needBowlerChange,
      overCompleted: engineResult.overCompleted,
      inningsCompleted: engineResult.inningsCompleted,
    };
  };

  const undoLastBall = () => {
    if (!activeMatch || !activeInnings || activeInnings.ballLogs.length === 0) return;

    isLocalAction.current = true;

    const newBallLogs = [...activeInnings.ballLogs];
    newBallLogs.pop();

    let resetInnings: InningsState = {
      inningsNo: activeInnings.inningsNo,
      battingTeam: activeInnings.battingTeam,
      bowlingTeam: activeInnings.bowlingTeam,
      totalRuns: 0,
      wickets: 0,
      overs: 0,
      balls: 0,
      target: activeInnings.target,
      strikerId: activeInnings.strikerId,
      nonStrikerId: activeInnings.nonStrikerId,
      currentBowlerId: activeInnings.currentBowlerId,
      batsmenStats: {},
      bowlerStats: {},
      ballLogs: [],
      recentBalls: [],
      extrasTotal: { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 },
      isCompleted: false,
      fow: [],
    };

    const updatedMatch: Match = JSON.parse(JSON.stringify(activeMatch));
    let tempInnings = resetInnings;
    newBallLogs.forEach(ball => {
      const res = processBall(tempInnings, {
        runsScored: ball.runsScored,
        extraType: ball.extras.type,
        extraRuns: ball.extras.runs > 0 && ball.extras.type !== 'none' ? ball.extras.runs - 1 : ball.extras.runs,
        isWicket: ball.isWicket,
        wicketInfo: ball.wicketInfo,
      }, activeMatch.totalOvers);
      tempInnings = res.nextInningsState;
    });

    if (activeMatch.currentInnings === 1) {
      updatedMatch.innings1 = tempInnings;
    } else {
      updatedMatch.innings2 = tempInnings;
    }
    updatedMatch.status = 'live';

    const updatedMatches = matches.map(m => m.id === updatedMatch.id ? updatedMatch : m);
    setMatches(updatedMatches);
    localStorage.setItem('cricket_matches_v1', JSON.stringify(updatedMatches));
    cloudSync.pushState({ players, matches: updatedMatches, series: seriesList, activeMatchId: updatedMatch.id, activeScorer });

    api.updateMatch(updatedMatch);
    broadcastSync();
    releaseLocalActionLock(800);
  };

  const changeBowler = (newBowlerId: string) => {
    if (!activeMatch || !activeInnings) return;
    isLocalAction.current = true;
    const updatedMatch: Match = JSON.parse(JSON.stringify(activeMatch));
    const targetInnings = updatedMatch.currentInnings === 1 ? updatedMatch.innings1 : updatedMatch.innings2;
    if (targetInnings) {
      targetInnings.currentBowlerId = newBowlerId;
      if (!targetInnings.bowlerStats[newBowlerId]) {
        targetInnings.bowlerStats[newBowlerId] = {
          playerId: newBowlerId, overs: 0, balls: 0, maidens: 0, runsConceded: 0, wickets: 0, wides: 0, noBalls: 0, dots: 0
        };
      }
    }
    const updatedMatches = matches.map(m => m.id === updatedMatch.id ? updatedMatch : m);
    setMatches(updatedMatches);
    localStorage.setItem('cricket_matches_v1', JSON.stringify(updatedMatches));
    cloudSync.pushState({ players, matches: updatedMatches, series: seriesList, activeMatchId: updatedMatch.id, activeScorer });

    api.updateMatch(updatedMatch);
    broadcastSync();
    releaseLocalActionLock(800);
  };

  const swapStriker = () => {
    if (!activeMatch || !activeInnings) return;
    isLocalAction.current = true;
    const updatedMatch: Match = JSON.parse(JSON.stringify(activeMatch));
    const targetInnings = updatedMatch.currentInnings === 1 ? updatedMatch.innings1 : updatedMatch.innings2;
    if (targetInnings) {
      const temp = targetInnings.strikerId;
      targetInnings.strikerId = targetInnings.nonStrikerId;
      targetInnings.nonStrikerId = temp;
    }
    const updatedMatches = matches.map(m => m.id === updatedMatch.id ? updatedMatch : m);
    setMatches(updatedMatches);
    localStorage.setItem('cricket_matches_v1', JSON.stringify(updatedMatches));
    cloudSync.pushState({ players, matches: updatedMatches, series: seriesList, activeMatchId: updatedMatch.id, activeScorer });

    api.updateMatch(updatedMatch);
    broadcastSync();
    releaseLocalActionLock(800);
  };

  const startSecondInnings = (strikerId: string, nonStrikerId: string, bowlerId: string) => {
    if (!activeMatch || !activeMatch.innings1) return;

    const targetRuns = activeMatch.innings1.totalRuns + 1;
    const battingTeamName = activeMatch.innings1.bowlingTeam;
    const bowlingTeamName = activeMatch.innings1.battingTeam;

    const innings2: InningsState = {
      inningsNo: 2,
      battingTeam: battingTeamName,
      bowlingTeam: bowlingTeamName,
      totalRuns: 0,
      wickets: 0,
      overs: 0,
      balls: 0,
      target: targetRuns,
      strikerId,
      nonStrikerId,
      currentBowlerId: bowlerId,
      batsmenStats: {
        [strikerId]: { playerId: strikerId, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
        [nonStrikerId]: { playerId: nonStrikerId, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false }
      },
      bowlerStats: {
        [bowlerId]: { playerId: bowlerId, overs: 0, balls: 0, maidens: 0, runsConceded: 0, wickets: 0, wides: 0, noBalls: 0, dots: 0 }
      },
      ballLogs: [],
      recentBalls: [],
      extrasTotal: { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 },
      isCompleted: false,
      fow: [],
    };

    const updatedMatch: Match = {
      ...activeMatch,
      currentInnings: 2,
      innings2,
    };

    const updatedMatches = matches.map(m => m.id === updatedMatch.id ? updatedMatch : m);
    setMatches(updatedMatches);
    localStorage.setItem('cricket_matches_v1', JSON.stringify(updatedMatches));
    cloudSync.pushState({ players, matches: updatedMatches, series: seriesList, activeMatchId: updatedMatch.id, activeScorer });

    api.updateMatch(updatedMatch);
    broadcastSync();
  };

  const applyDLSTarget = (revisedTarget: number, revisedOvers: number) => {
    if (!activeMatch) return;
    const updatedMatch: Match = JSON.parse(JSON.stringify(activeMatch));
    updatedMatch.dlsApplied = true;
    updatedMatch.dlsRevisedTarget = revisedTarget;
    updatedMatch.dlsRevisedOvers = revisedOvers;
    if (updatedMatch.innings2) {
      updatedMatch.innings2.target = revisedTarget;
    }
    const updatedMatches = matches.map(m => m.id === updatedMatch.id ? updatedMatch : m);
    setMatches(updatedMatches);
    localStorage.setItem('cricket_matches_v1', JSON.stringify(updatedMatches));
    cloudSync.pushState({ players, matches: updatedMatches, series: seriesList, activeMatchId: updatedMatch.id, activeScorer });

    api.updateMatch(updatedMatch);
    broadcastSync();
  };

  const finishMatch = (resultMessage?: string) => {
    if (!activeMatch) return;
    isLocalAction.current = true;
    const updatedMatch: Match = JSON.parse(JSON.stringify(activeMatch));
    updatedMatch.status = 'completed';
    if (resultMessage) updatedMatch.result = resultMessage;

    const updatedPlayers = aggregateMatchStatsToPlayers(players, updatedMatch);
    const updatedMatches = matches.map(m => m.id === updatedMatch.id ? updatedMatch : m);

    let updatedSeriesList = seriesList;
    if (updatedMatch.seriesId) {
      updatedSeriesList = seriesList.map(s => {
        if (s.id === updatedMatch.seriesId) {
          const matchIds = s.matchIds ? (s.matchIds.includes(updatedMatch.id) ? s.matchIds : [...s.matchIds, updatedMatch.id]) : [updatedMatch.id];
          const sMatches = updatedMatches.filter(m => m.seriesId === s.id || matchIds.includes(m.id));
          const completedCount = sMatches.filter(m => m.status === 'completed').length;
          const status = completedCount >= s.totalMatches ? 'completed' : s.status;
          const updatedS = { ...s, matchIds, status };
          api.updateSeries(updatedS);
          return updatedS;
        }
        return s;
      });
      setSeriesList(updatedSeriesList);
      localStorage.setItem('cricket_series_v1', JSON.stringify(updatedSeriesList));
    }

    setPlayers(updatedPlayers);
    setMatches(updatedMatches);
    setActiveMatchId(null);
    localStorage.setItem('cricket_players_v1', JSON.stringify(updatedPlayers));
    localStorage.setItem('cricket_matches_v1', JSON.stringify(updatedMatches));
    localStorage.removeItem('cricket_active_match_v1');

    cloudSync.pushState({ players: updatedPlayers, matches: updatedMatches, series: updatedSeriesList, activeMatchId: null, activeScorer: null });

    api.updateMatch(updatedMatch);
    api.setActiveMatchId(null);
    updatedPlayers.forEach(p => api.updatePlayer(p));
    broadcastSync();
    releaseLocalActionLock(800);
  };

  const declareCurrentInnings = () => {
    if (!activeMatch || !activeInnings || activeMatch.status !== 'live') return;

    isLocalAction.current = true;
    const updatedMatch: Match = JSON.parse(JSON.stringify(activeMatch));

    if (activeMatch.currentInnings === 1) {
      if (updatedMatch.innings1) {
        updatedMatch.innings1.isCompleted = true;
        updatedMatch.innings1.isDeclared = true;
      }
      updatedMatch.currentInnings = 2;
      updatedMatch.innings2 = undefined;
    } else {
      if (updatedMatch.innings2) {
        updatedMatch.innings2.isCompleted = true;
      }
      updatedMatch.status = 'completed';
      const inn1 = updatedMatch.innings1?.totalRuns || 0;
      const inn2 = updatedMatch.innings2?.totalRuns || 0;
      if (inn1 > inn2) {
        const margin = inn1 - inn2;
        updatedMatch.result = `${updatedMatch.innings1?.battingTeam} won by ${margin} runs (Declared)`;
        updatedMatch.winnerTeam = updatedMatch.innings1?.battingTeam;
      } else if (inn2 > inn1) {
        const wktsRemaining = 10 - (updatedMatch.innings2?.wickets || 0);
        updatedMatch.result = `${updatedMatch.innings2?.battingTeam} won by ${wktsRemaining} wickets (Declared)`;
        updatedMatch.winnerTeam = updatedMatch.innings2?.battingTeam;
      } else {
        updatedMatch.result = `Match Tied (Declared)`;
      }

      const potm = calculateMatchPOTM(updatedMatch);
      if (potm) updatedMatch.potmInfo = potm;

      const finalPlayers = aggregateMatchStatsToPlayers(players, updatedMatch);
      setPlayers(finalPlayers);
      localStorage.setItem('cricket_players_v1', JSON.stringify(finalPlayers));
    }

    const updatedMatches = matches.map(m => m.id === updatedMatch.id ? updatedMatch : m);
    setMatches(updatedMatches);
    localStorage.setItem('cricket_matches_v1', JSON.stringify(updatedMatches));
    setActiveTab('scoring');

    const syncPayload = {
      players,
      matches: updatedMatches,
      series: seriesList,
      activeMatchId: updatedMatch.id,
      activeScorer,
      timestamp: Date.now(),
    };
    cloudSync.pushState(syncPayload);
    api.updateMatch(updatedMatch);
    broadcastSync(syncPayload);
    releaseLocalActionLock(500);
  };

  const handleSetActiveMatchId = (id: string | null) => {
    setActiveMatchId(id);
    api.setActiveMatchId(id);
    broadcastSync();
  };

  const resetToDemoData = () => {
    setPlayers(INITIAL_PLAYERS);
    setMatches(INITIAL_MATCHES);
    setSeriesList(INITIAL_SERIES);
    setActiveMatchId(INITIAL_MATCHES[0]?.id || null);
    localStorage.setItem('cricket_players_v1', JSON.stringify(INITIAL_PLAYERS));
    localStorage.setItem('cricket_matches_v1', JSON.stringify(INITIAL_MATCHES));
    localStorage.setItem('cricket_series_v1', JSON.stringify(INITIAL_SERIES));
    cloudSync.pushState({ players: INITIAL_PLAYERS, matches: INITIAL_MATCHES, series: INITIAL_SERIES, activeMatchId: INITIAL_MATCHES[0]?.id || null });
    api.resetDemo();
    broadcastSync();
  };

  return (
    <CricketContext.Provider
      value={{
        players,
        matches,
        seriesList,
        activeMatch,
        activeInnings,
        activeTab,
        setActiveTab,
        theme,
        setTheme,
        userRole,
        userName,
        isLoggedIn,
        isScorer,
        isSpectator,
        isOnline,
        deviceId,
        activeScorer,
        setUserRole,
        loginAsScorer,
        loginAsSpectator,
        logoutRole,
        releaseScorerLock,
        addPlayer,
        updatePlayer,
        deletePlayer,
        createMatch,
        createSeries,
        completeSeries,
        scoreBall,
        undoLastBall,
        changeBowler,
        swapStriker,
        startSecondInnings,
        applyDLSTarget,
        declareCurrentInnings,
        finishMatch,
        setActiveMatchId: handleSetActiveMatchId,
        resetToDemoData,
        seriesBreakTimer,
        startSeriesBreak,
        cancelSeriesBreak,
        customAddedTeams,
        addCustomTeamName,
      }}
    >
      {children}
    </CricketContext.Provider>
  );
};

export const useCricket = () => {
  const context = useContext(CricketContext);
  if (!context) {
    throw new Error('useCricket must be used within a CricketProvider');
  }
  return context;
};

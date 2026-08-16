import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Player, Match, InningsState, TournamentSeries } from '../types/cricket';
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
  finishMatch: (resultMessage?: string) => void;
  setActiveMatchId: (id: string | null) => void;
  resetToDemoData: () => void;
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

  const [activeMatchId, setActiveMatchId] = useState<string | null>(() => {
    return localStorage.getItem('cricket_active_match_v1') || null;
  });

  const [activeTab, setActiveTab] = useState<'scoring' | 'players' | 'scorecard' | 'analytics' | 'history' | 'series'>('scoring');

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

  const [activeScorer, setActiveScorer] = useState<{ deviceId: string; deviceName: string; userName?: string } | null>(null);

  const [userRole, setUserRoleState] = useState<UserRole | null>(null);
  const [userName, setUserNameState] = useState<string | null>(null);

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine ?? true);

  const isLoggedIn = Boolean(userRole);
  const isScorer = userRole === 'scorer' && (!activeScorer || activeScorer.deviceId === deviceId);
  const isSpectator = userRole === 'spectator' || !isScorer;

  // Real-time Cloud Scorer Lock subscription: sync active scorer across all devices
  useEffect(() => {
    const unsubscribe = cloudSync.subscribeScorerLock((lock) => {
      setActiveScorer(lock);
      if (lock && lock.deviceId !== deviceId && userRole === 'scorer') {
        // Another device holds the lock, switch to spectator
        setUserRoleState('spectator');
        localStorage.setItem('cricpulse_user_role', 'spectator');
      }
    });

    return () => unsubscribe();
  }, [deviceId, userRole]);

  // Periodic heartbeat for active scorer to keep lock fresh every 10 seconds
  useEffect(() => {
    if (!isScorer) return;

    const devName = typeof navigator !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile Phone' : 'Laptop / PC';
    cloudSync.heartbeatScorerLock(deviceId, devName, userName || 'Official Scorer');

    const interval = setInterval(() => {
      cloudSync.heartbeatScorerLock(deviceId, devName, userName || 'Official Scorer');
    }, 10000);

    return () => clearInterval(interval);
  }, [isScorer, deviceId, userName]);

  const loginAsScorer = async (name: string): Promise<{ success: boolean; message?: string }> => {
    const devName = typeof navigator !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile Phone' : 'Laptop / PC';
    const cleanName = (name || '').trim() || 'Official Scorer';
    const lockRes = await cloudSync.acquireScorerLock(deviceId, devName, cleanName);

    if (!lockRes.success) {
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
    localStorage.setItem('cricpulse_user_role', 'scorer');
    localStorage.setItem('cricpulse_user_name', cleanName);
    broadcastSync();
    return { success: true };
  };

  const loginAsSpectator = (name: string) => {
    const cleanName = (name || '').trim() || 'Spectator';
    setUserNameState(cleanName);
    setUserRoleState('spectator');
    localStorage.setItem('cricpulse_user_role', 'spectator');
    localStorage.setItem('cricpulse_user_name', cleanName);
    broadcastSync();
  };

  const logoutRole = async () => {
    if (userRole === 'scorer') {
      await cloudSync.releaseScorerLock(deviceId);
      setActiveScorer(null);
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
  const broadcastSync = () => {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const ch = new BroadcastChannel('cricpulse_live_sync');
        ch.postMessage({ type: 'SYNC', timestamp: Date.now() });
        ch.close();
      }
    } catch {
      // Ignore
    }
  };

  // Update Lock Guard to prevent delayed Firebase/Cloud echoes from overwriting local state
  const isLocalAction = useRef<boolean>(false);

  const releaseLocalActionLock = (delayMs = 800) => {
    setTimeout(() => {
      isLocalAction.current = false;
    }, delayMs);
  };

  // Realtime Multi-Device Sync Hook (Firebase WebSockets + Fallback Polling)
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('cricpulse_live_sync');
      }
    } catch {
      // Ignore
    }

    // 1. Initial snapshot pull: Load latest persistent roster & match history for all devices
    cloudSync.pullLatest().then(data => {
      if (data) {
        if (data.players && data.players.length > 0) {
          setPlayers(data.players);
          localStorage.setItem('cricket_players_v1', JSON.stringify(data.players));
        }
        if (data.matches && data.matches.length > 0) {
          setMatches(data.matches);
          localStorage.setItem('cricket_matches_v1', JSON.stringify(data.matches));
        }
        if (data.series && data.series.length > 0) {
          setSeriesList(data.series);
          localStorage.setItem('cricket_series_v1', JSON.stringify(data.series));
        }
        if (data.activeMatchId) setActiveMatchId(data.activeMatchId);
        if (data.activeScorer !== undefined) setActiveScorer(data.activeScorer);
      }
    });

    // 2. Real-time subscription: Sync roster, past matches, scorecards, and live match to spectators
    // Local state handles 100% of instant UI updates on the Scorer device.
    let unsubscribe = () => {};
    if (!isScorer) {
      unsubscribe = cloudSync.subscribe((syncData) => {
        // 🛡️ Null Data Protection: Ignore empty/null snapshots
        if (!syncData) return;

        if (syncData.players && syncData.players.length > 0) {
          setPlayers(syncData.players);
          localStorage.setItem('cricket_players_v1', JSON.stringify(syncData.players));
        }
        if (syncData.matches && syncData.matches.length > 0) {
          setMatches(syncData.matches);
          localStorage.setItem('cricket_matches_v1', JSON.stringify(syncData.matches));
        }
        if (syncData.series && syncData.series.length > 0) {
          setSeriesList(syncData.series);
          localStorage.setItem('cricket_series_v1', JSON.stringify(syncData.series));
        }
        if (syncData.activeScorer !== undefined) setActiveScorer(syncData.activeScorer);

        if (syncData.activeMatchId) {
          setActiveMatchId(prev => (prev !== syncData.activeMatchId ? syncData.activeMatchId : prev));
        } else {
          const liveMatch = (syncData.matches || []).find(m => m.status === 'live');
          if (liveMatch) {
            setActiveMatchId(prev => (prev !== liveMatch.id ? liveMatch.id : prev));
          }
        }
      });
    }

    return () => {
      unsubscribe();
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

  const activeMatch = matches.find(m => m.id === activeMatchId) || null;
  const activeInnings = activeMatch 
    ? (activeMatch.currentInnings === 1 ? activeMatch.innings1 : activeMatch.innings2) || null
    : null;

  // Player Actions (Permanently saved to LocalStorage & Cloud across all devices)
  const addPlayer = (newPlayerData: Omit<Player, 'id' | 'stats'>) => {
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
  };

  const updatePlayer = (updatedPlayer: Player) => {
    const updatedPlayers = players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p);
    setPlayers(updatedPlayers);
    localStorage.setItem('cricket_players_v1', JSON.stringify(updatedPlayers));
    cloudSync.pushState({ players: updatedPlayers, matches, series: seriesList, activeMatchId, activeScorer });
    api.updatePlayer(updatedPlayer);
    broadcastSync();
  };

  const deletePlayer = (id: string) => {
    const updatedPlayers = players.filter(p => p.id !== id);
    setPlayers(updatedPlayers);
    localStorage.setItem('cricket_players_v1', JSON.stringify(updatedPlayers));
    cloudSync.pushState({ players: updatedPlayers, matches, series: seriesList, activeMatchId, activeScorer });
    api.deletePlayer(id);
    broadcastSync();
  };

  // Tournament / Series Actions (Permanently synced across all devices)
  const createSeries = (seriesData: Omit<TournamentSeries, 'id' | 'matchIds' | 'status'>) => {
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

    // If attached to a series, update series matchIds
    if (newMatch.seriesId) {
      setSeriesList(prev => prev.map(s => {
        if (s.id === newMatch.seriesId) {
          const updatedSeries = { ...s, matchIds: [...s.matchIds, newMatch.id] };
          api.updateSeries(updatedSeries);
          return updatedSeries;
        }
        return s;
      }));
    }

    const updatedMatches = [newMatch, ...matches];
    isLocalAction.current = true;
    setMatches(updatedMatches);
    localStorage.setItem('cricket_matches_v1', JSON.stringify(updatedMatches));
    cloudSync.pushState({ players, matches: updatedMatches, series: seriesList, activeMatchId: newMatch.id, activeScorer });
    api.addMatch(newMatch);
    api.setActiveMatchId(newMatch.id);
    setActiveMatchId(newMatch.id);
    broadcastSync();
    releaseLocalActionLock(800);
    setActiveTab('scoring');
  };

  // Live Scorekeeper Engine Action (Permanently synced to Cloud & Storage)
  const scoreBall = (params: ScoreBallParams) => {
    if (!activeMatch || !activeInnings || activeMatch.status !== 'live') return;

    // Step 1: Set Local Action Flag before executing local dispatch and sync
    isLocalAction.current = true;

    const engineResult = processBall(activeInnings, params, activeMatch.totalOvers);

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

    const updatedMatches = matches.map(m => m.id === updatedMatch.id ? updatedMatch : m);
    setMatches(updatedMatches);
    localStorage.setItem('cricket_matches_v1', JSON.stringify(updatedMatches));
    cloudSync.pushState({ players: finalPlayers, matches: updatedMatches, series: seriesList, activeMatchId: updatedMatch.id, activeScorer });

    api.updateMatch(updatedMatch);
    broadcastSync();
    releaseLocalActionLock(800);

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
    const updatedMatch: Match = JSON.parse(JSON.stringify(activeMatch));
    updatedMatch.status = 'completed';
    if (resultMessage) updatedMatch.result = resultMessage;

    const potm = calculateMatchPOTM(updatedMatch);
    if (potm) updatedMatch.potmInfo = potm;

    const updatedPlayers = aggregateMatchStatsToPlayers(players, updatedMatch);
    const updatedMatches = matches.map(m => m.id === updatedMatch.id ? updatedMatch : m);

    setPlayers(updatedPlayers);
    setMatches(updatedMatches);
    localStorage.setItem('cricket_players_v1', JSON.stringify(updatedPlayers));
    localStorage.setItem('cricket_matches_v1', JSON.stringify(updatedMatches));

    cloudSync.pushState({ players: updatedPlayers, matches: updatedMatches, series: seriesList, activeMatchId: null, activeScorer });

    api.updateMatch(updatedMatch);
    updatedPlayers.forEach(p => api.updatePlayer(p));
    broadcastSync();
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
        finishMatch,
        setActiveMatchId: handleSetActiveMatchId,
        resetToDemoData,
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

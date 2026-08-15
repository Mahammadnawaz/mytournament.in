import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Player, Match, InningsState, TournamentSeries } from '../types/cricket';
import { INITIAL_PLAYERS, INITIAL_MATCHES, INITIAL_SERIES } from '../utils/initialData';
import { processBall, aggregateMatchStatsToPlayers, calculateMatchPOTM, calculateSeriesMVP } from '../utils/cricketEngine';
import type { ScoreBallParams } from '../utils/cricketEngine';
import { api } from '../services/api';

export type ThemeMode = 'testcricket' | 'county' | 'lords' | 'oceaniablue' | 'daylight';

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

  // Fetch initial data from Node.js Express REST API backend if running
  useEffect(() => {
    async function loadBackendData() {
      const isOnline = await api.checkHealth();
      if (isOnline) {
        const [apiPlayers, apiMatches, apiSeries] = await Promise.all([
          api.getPlayers(),
          api.getMatches(),
          api.getSeries(),
        ]);

        if (apiPlayers && apiPlayers.length > 0) {
          setPlayers(prev => {
            const mergedMap = new Map<string, Player>();
            prev.forEach(p => mergedMap.set(p.id, p));
            apiPlayers.forEach(p => mergedMap.set(p.id, p));
            const merged = Array.from(mergedMap.values());
            // Sync any local players missing on backend
            const apiPlayerIds = new Set(apiPlayers.map(p => p.id));
            prev.forEach(p => {
              if (!apiPlayerIds.has(p.id)) {
                api.addPlayer(p);
              }
            });
            return merged;
          });
        }

        if (apiMatches && apiMatches.length > 0) {
          setMatches(prev => {
            const mergedMap = new Map<string, Match>();
            prev.forEach(m => mergedMap.set(m.id, m));
            apiMatches.forEach(m => mergedMap.set(m.id, m));
            const merged = Array.from(mergedMap.values());
            // Sync any local matches missing on backend
            const apiMatchIds = new Set(apiMatches.map(m => m.id));
            prev.forEach(m => {
              if (!apiMatchIds.has(m.id)) {
                api.addMatch(m);
              }
            });
            return merged;
          });
        }

        if (apiSeries && apiSeries.length > 0) {
          setSeriesList(prev => {
            const mergedMap = new Map<string, TournamentSeries>();
            prev.forEach(s => mergedMap.set(s.id, s));
            apiSeries.forEach(s => mergedMap.set(s.id, s));
            const merged = Array.from(mergedMap.values());
            // Sync any local series missing on backend
            const apiSeriesIds = new Set(apiSeries.map(s => s.id));
            prev.forEach(s => {
              if (!apiSeriesIds.has(s.id)) {
                api.addSeries(s);
              }
            });
            return merged;
          });
        }
      }
    }
    loadBackendData();
  }, []);

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

  // Player Actions
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
    setPlayers(prev => [newPlayer, ...prev]);
    api.addPlayer(newPlayer);
  };

  const updatePlayer = (updatedPlayer: Player) => {
    setPlayers(prev => prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
    api.updatePlayer(updatedPlayer);
  };

  const deletePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    api.deletePlayer(id);
  };

  // Tournament / Series Actions
  const createSeries = (seriesData: Omit<TournamentSeries, 'id' | 'matchIds' | 'status'>) => {
    const newSeries: TournamentSeries = {
      ...seriesData,
      id: `series-${Date.now()}`,
      matchIds: [],
      status: 'ongoing',
    };
    setSeriesList(prev => [newSeries, ...prev]);
    api.addSeries(newSeries);
    setActiveTab('series');
  };

  const completeSeries = (seriesId: string) => {
    const targetSeries = seriesList.find(s => s.id === seriesId);
    if (!targetSeries) return;

    const { potS } = calculateSeriesMVP(targetSeries, matches);

    setSeriesList(prev => prev.map(s => {
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
    }));
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

    setMatches(prev => [newMatch, ...prev]);
    api.addMatch(newMatch);
    setActiveMatchId(newMatch.id);
    setActiveTab('scoring');
  };

  // Live Scorekeeper Engine Action
  const scoreBall = (params: ScoreBallParams) => {
    if (!activeMatch || !activeInnings || activeMatch.status !== 'live') return;

    const engineResult = processBall(activeInnings, params, activeMatch.totalOvers);

    const updatedMatch: Match = JSON.parse(JSON.stringify(activeMatch));
    if (activeMatch.currentInnings === 1) {
      updatedMatch.innings1 = engineResult.nextInningsState;
    } else {
      updatedMatch.innings2 = engineResult.nextInningsState;
    }

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
        const updatedPlayers = aggregateMatchStatsToPlayers(players, updatedMatch);
        setPlayers(updatedPlayers);
        updatedPlayers.forEach(p => api.updatePlayer(p));
      }
    }

    setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
    api.updateMatch(updatedMatch);

    return {
      needBowlerChange: engineResult.needBowlerChange,
      overCompleted: engineResult.overCompleted,
      inningsCompleted: engineResult.inningsCompleted,
    };
  };

  const undoLastBall = () => {
    if (!activeMatch || !activeInnings || activeInnings.ballLogs.length === 0) return;

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
    setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
    api.updateMatch(updatedMatch);
  };

  const changeBowler = (newBowlerId: string) => {
    if (!activeMatch || !activeInnings) return;
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
    setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
    api.updateMatch(updatedMatch);
  };

  const swapStriker = () => {
    if (!activeMatch || !activeInnings) return;
    const updatedMatch: Match = JSON.parse(JSON.stringify(activeMatch));
    const targetInnings = updatedMatch.currentInnings === 1 ? updatedMatch.innings1 : updatedMatch.innings2;
    if (targetInnings) {
      const temp = targetInnings.strikerId;
      targetInnings.strikerId = targetInnings.nonStrikerId;
      targetInnings.nonStrikerId = temp;
    }
    setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
    api.updateMatch(updatedMatch);
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

    setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
    api.updateMatch(updatedMatch);
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
    setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
    api.updateMatch(updatedMatch);
  };

  const finishMatch = (resultMessage?: string) => {
    if (!activeMatch) return;
    const updatedMatch: Match = JSON.parse(JSON.stringify(activeMatch));
    updatedMatch.status = 'completed';
    if (resultMessage) updatedMatch.result = resultMessage;

    const potm = calculateMatchPOTM(updatedMatch);
    if (potm) updatedMatch.potmInfo = potm;

    const updatedPlayers = aggregateMatchStatsToPlayers(players, updatedMatch);
    setPlayers(updatedPlayers);
    setMatches(prev => prev.map(m => m.id === updatedMatch.id ? updatedMatch : m));
    api.updateMatch(updatedMatch);
    updatedPlayers.forEach(p => api.updatePlayer(p));
  };

  const resetToDemoData = () => {
    setPlayers(INITIAL_PLAYERS);
    setMatches(INITIAL_MATCHES);
    setSeriesList(INITIAL_SERIES);
    setActiveMatchId(INITIAL_MATCHES[0]?.id || null);
    api.resetDemo();
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
        setActiveMatchId,
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

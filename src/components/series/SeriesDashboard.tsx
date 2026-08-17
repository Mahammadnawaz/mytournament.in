import React, { useState, useEffect, useMemo } from 'react';
import { useCricket } from '../../context/CricketContext';
import type { TournamentSeries } from '../../types/cricket';
import { calculateSeriesMVP } from '../../utils/cricketEngine';
import { Trophy, Plus, Award, Check, X, Star, Calendar, Swords, Play, Table, Activity, Coffee } from 'lucide-react';
import confetti from 'canvas-confetti';
import MatchSetupModal from '../match/MatchSetupModal';

export const SeriesDashboard: React.FC = () => {
  const { seriesList, matches, players, completeSeries, setActiveTab, setActiveMatchId, isScorer, startSeriesBreak, cancelSeriesBreak, seriesBreakTimer } = useCricket();

  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(seriesList[0]?.id || '');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if ((!selectedSeriesId || !seriesList.some(s => s.id === selectedSeriesId)) && seriesList.length > 0) {
      setSelectedSeriesId(seriesList[0].id);
    }
  }, [seriesList, selectedSeriesId]);

  const [setupMatchParams, setSetupMatchParams] = useState<{
    seriesId: string;
    matchName: string;
    teamA: string;
    teamB: string;
  } | null>(null);

  const selectedSeries = seriesList.find(s => s.id === selectedSeriesId) || seriesList[0];

  // Check if there is an active live match for this series
  const liveSeriesMatch = matches.find(
    m => m.status === 'live' && (selectedSeries?.matchIds?.includes(m.id) || m.seriesId === selectedSeries?.id || (m.teamA.name === selectedSeries?.teamA && m.teamB.name === selectedSeries?.teamB))
  ) || (selectedSeries?.status === 'ongoing' ? matches.find(m => m.status === 'live') : null);

  const liveInnings = liveSeriesMatch
    ? (liveSeriesMatch.currentInnings === 1 ? liveSeriesMatch.innings1 : liveSeriesMatch.innings2)
    : null;

  // Calculate Series matches & win counts (strictly linked to selected series)
  const seriesMatches = selectedSeries
    ? matches.filter(m => {
        if (m.matchCategory === 'individual') return false;
        if (m.seriesId) return m.seriesId === selectedSeries.id;
        if (selectedSeries.matchIds?.includes(m.id)) return true;
        return false;
      })
    : [];

  const completedSeriesMatches = seriesMatches.filter(m => m.status === 'completed');
  const completedCount = Math.min(selectedSeries?.totalMatches || 3, completedSeriesMatches.length);

  // Calculate Series MVP table and Player of Series for ONLY the selected series matches
  const { leaderboard, potS } = selectedSeries
    ? calculateSeriesMVP(selectedSeries, seriesMatches)
    : { leaderboard: [], potS: undefined };

  const potSPlayer = potS
    ? players.find(p => p.id === potS.playerId)
    : (selectedSeries?.playerOfSeriesId 
        ? players.find(p => p.id === selectedSeries.playerOfSeriesId) 
        : (leaderboard[0] ? players.find(p => p.id === leaderboard[0].playerId) : undefined));

  const topPerformer = leaderboard[0];

  let teamAWins = 0;
  let teamBWins = 0;
  let tiesCount = 0;

  completedSeriesMatches.forEach(m => {
    const winner = m.winnerTeam || (m.result?.includes(' won by ') ? m.result.split(' won by ')[0].trim() : undefined);
    if (winner === selectedSeries?.teamA) teamAWins++;
    else if (winner === selectedSeries?.teamB) teamBWins++;
    else if (m.result?.toLowerCase().includes('tied') || m.result?.toLowerCase().includes('draw')) tiesCount++;
  });

  const isSeriesCompleted = selectedSeries?.status === 'completed' || completedCount >= (selectedSeries?.totalMatches || 0);

  // ── Head-to-Head computation ──────────────────────────────────
  interface H2HStats {
    played: number;
    wins: number;
    losses: number;
    draws: number;
    runsScored: number;
    runsConceded: number;
    highestScore: number;
    lowestScore: number;
    winPct: number;
  }

  function buildH2H(teamName: string, opponent: string): H2HStats {
    const h: H2HStats = { played: 0, wins: 0, losses: 0, draws: 0, runsScored: 0, runsConceded: 0, highestScore: 0, lowestScore: Infinity, winPct: 0 };
    completedSeriesMatches.forEach(m => {
      const isHeadToHead = (m.teamA.name === teamName && m.teamB.name === opponent) || (m.teamA.name === opponent && m.teamB.name === teamName);
      if (!isHeadToHead) return;
      h.played += 1;

      const battedInnings = [m.innings1, m.innings2].filter(i => i?.battingTeam === teamName);
      const concededInnings = [m.innings1, m.innings2].filter(i => i?.battingTeam === opponent);

      battedInnings.forEach(i => {
        if (!i) return;
        h.runsScored += i.totalRuns;
        if (i.totalRuns > h.highestScore) h.highestScore = i.totalRuns;
        if (i.totalRuns < h.lowestScore) h.lowestScore = i.totalRuns;
      });
      concededInnings.forEach(i => {
        if (!i) return;
        h.runsConceded += i.totalRuns;
      });

      const winner = m.winnerTeam || (m.result?.includes(' won by ') ? m.result.split(' won by ')[0].trim() : undefined);
      if (winner === teamName) h.wins += 1;
      else if (!winner || m.result?.toLowerCase().includes('tied')) h.draws += 1;
      else h.losses += 1;
    });
    if (h.lowestScore === Infinity) h.lowestScore = 0;
    h.winPct = h.played > 0 ? Math.round((h.wins / h.played) * 100) : 0;
    return h;
  }

  const teamAName = selectedSeries?.teamA || 'Team A';
  const teamBName = selectedSeries?.teamB || 'Team B';
  const teamCName = selectedSeries?.teamC || 'Team C';

  const isTriSeries = Boolean(selectedSeries?.teamC || selectedSeries?.seriesType === 'triseries');

  const [triSeriesFixture, setTriSeriesFixture] = useState<string>('');

  const buildTeamStats = (tName: string) => {
    let played = 0;
    let wins = 0;
    let losses = 0;
    let ties = 0;
    let runsScored = 0;
    let runsConceded = 0;

    completedSeriesMatches.forEach(m => {
      const isTeamA = m.teamA.name === tName;
      const isTeamB = m.teamB.name === tName;
      if (!isTeamA && !isTeamB) return;

      played++;
      const batInn = [m.innings1, m.innings2].find(i => i?.battingTeam === tName);
      const bowlInn = [m.innings1, m.innings2].find(i => i?.bowlingTeam === tName);
      if (batInn) runsScored += batInn.totalRuns;
      if (bowlInn) runsConceded += bowlInn.totalRuns;

      const winner = m.winnerTeam || (m.result?.includes(' won by ') ? m.result.split(' won by ')[0].trim() : undefined);
      if (winner === tName) wins++;
      else if (m.result?.toLowerCase().includes('tied') || m.result?.toLowerCase().includes('draw')) ties++;
      else if (winner) losses++;
    });

    const pts = wins * 2 + ties * 1;
    const nrr = played > 0 ? ((runsScored - runsConceded) / (played * 5)).toFixed(2) : '0.00';
    return { team: tName, p: played, w: wins, l: losses, t: ties, pts, nrr };
  };

  const [h2hPair, setH2hPair] = useState<'AB' | 'BC' | 'CA'>('AB');

  let activeH2HTeamA = teamAName;
  let activeH2HTeamB = teamBName;
  if (isTriSeries) {
    if (h2hPair === 'BC') {
      activeH2HTeamA = teamBName;
      activeH2HTeamB = teamCName;
    } else if (h2hPair === 'CA') {
      activeH2HTeamA = teamCName;
      activeH2HTeamB = teamAName;
    }
  }

  const h2hA = selectedSeries ? buildH2H(activeH2HTeamA, activeH2HTeamB) : null;
  const h2hB = selectedSeries ? buildH2H(activeH2HTeamB, activeH2HTeamA) : null;

  const pointsTableData = selectedSeries
    ? (isTriSeries
        ? [buildTeamStats(teamAName), buildTeamStats(teamBName), buildTeamStats(teamCName)]
        : [buildTeamStats(teamAName), buildTeamStats(teamBName)]
      ).sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : Number(b.nrr) - Number(a.nrr))
    : [];

  const handleCompleteSeriesTrigger = () => {
    if (!selectedSeries) return;
    completeSeries(selectedSeries.id);
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.5 }
    });
  };

  const handleStartNextSeriesMatch = (customTeamA?: string, customTeamB?: string) => {
    if (!selectedSeries) return;
    const matchNumber = seriesMatches.length + 1;
    const tA = customTeamA || selectedSeries.teamA;
    const tB = customTeamB || selectedSeries.teamB;
    setSetupMatchParams({
      seriesId: selectedSeries.id,
      matchName: `${selectedSeries.name} - Match ${matchNumber}`,
      teamA: tA,
      teamB: tB,
    });
  };

  const anyLiveMatch = matches.find(m => m.status === 'live');

  return (
    <div className="space-y-6">
      
      {/* ⚡ LIVE STREAM MATCH REDIRECT BANNER */}
      {anyLiveMatch && (
        <div 
          onClick={() => {
            setActiveMatchId(anyLiveMatch.id);
            setActiveTab('scoring');
          }}
          className="bg-gradient-to-r from-red-600 via-emerald-600 to-teal-600 p-0.5 rounded-2xl shadow-xl cursor-pointer transition transform hover:scale-[1.01] active:scale-95 group"
        >
          <div className="bg-slate-950/90 rounded-[14px] px-5 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black text-red-400 uppercase tracking-widest">LIVE STREAM MATCH</span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs font-bold text-white">{anyLiveMatch.name} ({anyLiveMatch.teamA.name} vs {anyLiveMatch.teamB.name})</span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium mt-0.5">Match in progress! Click anywhere on this banner to jump straight to live scoreboard.</p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 group-hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-md">
              <Activity className="w-4 h-4 animate-pulse" />
              <span>Watch Live Score →</span>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 QUICK LAUNCH NEXT MATCH BANNER FOR SCORER */}
      {isScorer && selectedSeries && !isSeriesCompleted && seriesMatches.length < selectedSeries.totalMatches && (
        <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 p-0.5 rounded-2xl shadow-2xl animate-pulse">
          <div className="bg-slate-950/95 rounded-[14px] px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest block">
                  {selectedSeries.name} • Match {seriesMatches.length + 1} of {selectedSeries.totalMatches}
                </span>
                <h4 className="text-sm sm:text-base font-extrabold text-white">
                  Ready to launch Match {seriesMatches.length + 1}?
                </h4>
              </div>
            </div>

            {isTriSeries ? (
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                <select
                  value={triSeriesFixture || `${teamAName}|||${teamBName}`}
                  onChange={(e) => setTriSeriesFixture(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-extrabold text-xs outline-none cursor-pointer"
                >
                  <option value={`${teamAName}|||${teamBName}`}>
                    🏏 Match Fixture: {teamAName} vs {teamBName}
                  </option>
                  <option value={`${teamBName}|||${teamCName}`}>
                    🏏 Match Fixture: {teamBName} vs {teamCName}
                  </option>
                  <option value={`${teamCName}|||${teamAName}`}>
                    🏏 Match Fixture: {teamCName} vs {teamAName}
                  </option>
                </select>

                <button
                  onClick={() => {
                    const fixture = triSeriesFixture || `${teamAName}|||${teamBName}`;
                    const [tA, tB] = fixture.split('|||');
                    handleStartNextSeriesMatch(tA, tB);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs transition shadow-lg flex items-center justify-center space-x-1.5 shrink-0 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current text-slate-950" />
                  <span>Start Match {seriesMatches.length + 1} ➔</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleStartNextSeriesMatch()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs transition shadow-lg flex items-center justify-center space-x-1.5 shrink-0 active:scale-95"
              >
                <Play className="w-4 h-4 fill-current text-slate-950" />
                <span>▶️ Start Match {seriesMatches.length + 1} of Series ➔</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center space-x-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            <span>Tournament & Series Center</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Track bilateral series standings, Points Table, Head-to-Head stats, Match MVPs, and Series POTS.
          </p>
        </div>

        {isScorer && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition active:scale-95 self-start md:self-auto"
          >
            <Plus className="w-5 h-5" />
            <span>New Series / Tournament</span>
          </button>
        )}
      </div>

      {/* Series Selector Pills with Status Badges */}
      {seriesList.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
          {seriesList.map((s) => {
            const isOngoing = s.status === 'ongoing';
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSeriesId(s.id)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition border flex items-center space-x-2 active:scale-95 ${
                  selectedSeriesId === s.id
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isOngoing ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{s.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-black ${
                  selectedSeriesId === s.id 
                    ? 'bg-slate-950/20 text-slate-950' 
                    : isOngoing ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isOngoing ? 'Ongoing' : 'Completed'}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {selectedSeries ? (
        <div className="space-y-6">
          
          {/* LIVE MATCH IN PROGRESS STREAM CARD FOR THIS SERIES */}
          {liveSeriesMatch && liveInnings && (
            <div 
              onClick={() => {
                setActiveMatchId(liveSeriesMatch.id);
                setActiveTab('scoring');
              }}
              className="relative overflow-hidden bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-2 border-emerald-500/50 hover:border-emerald-400 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-fade-in cursor-pointer transition transform hover:scale-[1.005]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="text-xs font-black text-red-400 uppercase tracking-wider">
                    LIVE MATCH STREAMING NOW
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-bold text-slate-300">
                    {liveSeriesMatch.name}
                  </span>
                </div>

                <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg shadow-emerald-500/25">
                  <Activity className="w-4 h-4" />
                  <span>Watch Live Broadcast Scoreboard →</span>
                </div>
              </div>

              {/* Live Match Score Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-7 space-y-1">
                  <span className="text-xs text-emerald-400 font-extrabold uppercase">Currently Batting</span>
                  <h4 className="text-xl sm:text-2xl font-black text-white">
                    {liveInnings.battingTeam}
                  </h4>
                  <div className="flex items-baseline space-x-3">
                    <span className="text-4xl sm:text-5xl font-black text-white font-mono">
                      {liveInnings.totalRuns}/{liveInnings.wickets}
                    </span>
                    <span className="text-slate-400 text-base font-bold font-mono">
                      ({liveInnings.overs}.{liveInnings.balls} / {liveSeriesMatch.dlsRevisedOvers || liveSeriesMatch.totalOvers} ov)
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-5 bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl space-y-2 text-xs">
                  {/* Batter on strike */}
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-bold flex items-center space-x-1">
                      <span>🏏 {players.find(p => p.id === liveInnings.strikerId)?.name || 'Striker'}</span>
                      <span className="text-emerald-400 text-[10px]">*</span>
                    </span>
                    <span className="font-mono font-black text-white">
                      {liveInnings.batsmenStats[liveInnings.strikerId]?.runs || 0} ({liveInnings.batsmenStats[liveInnings.strikerId]?.balls || 0}b)
                    </span>
                  </div>

                  {/* Bowler */}
                  <div className="flex justify-between items-center text-slate-400 border-t border-slate-800/80 pt-1.5">
                    <span className="font-medium">
                      ⚾ {players.find(p => p.id === liveInnings.currentBowlerId)?.name || 'Bowler'}
                    </span>
                    <span className="font-mono font-bold text-slate-300">
                      {liveInnings.bowlerStats[liveInnings.currentBowlerId]?.wickets || 0}/{liveInnings.bowlerStats[liveInnings.currentBowlerId]?.runsConceded || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Series Scorecard Banner */}
          <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4 text-xs text-slate-400">
              <span className="font-extrabold text-amber-400 text-sm uppercase tracking-wider">
                {selectedSeries.format}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-bold font-mono">
                Matches Played: {completedCount} / {selectedSeries.totalMatches}
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl sm:text-3xl font-black text-white">
                  {selectedSeries.name}
                </h3>

                {/* Mobile-Perfect Head-to-Head Banner */}
                <div className="flex items-center justify-between gap-2 mt-3 bg-slate-950/80 p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-inner">
                  {/* Team A */}
                  <div className="flex-1 text-left min-w-0">
                    <span className="text-sm sm:text-xl font-black text-emerald-400 truncate block">
                      {selectedSeries.teamA}
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-400 font-extrabold block">
                      {teamAWins} {teamAWins === 1 ? 'Win' : 'Wins'}
                    </span>
                  </div>

                  {/* Head-to-Head Score Badge */}
                  <div className="flex flex-col items-center justify-center px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex-shrink-0 shadow-sm">
                    <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-wider">
                      {teamAWins} - {teamBWins}
                    </span>
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                      {tiesCount > 0 ? `(${tiesCount} ${tiesCount === 1 ? 'Tie' : 'Ties'})` : 'Series Score'}
                    </span>
                  </div>

                  {/* Team B */}
                  <div className="flex-1 text-right min-w-0">
                    <span className="text-sm sm:text-xl font-black text-blue-400 truncate block">
                      {selectedSeries.teamB}
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-400 font-extrabold block">
                      {teamBWins} {teamBWins === 1 ? 'Win' : 'Wins'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start md:self-auto pt-1 md:pt-0">
                {/* PROMINENT START NEXT MATCH BUTTON & BREAK BUTTONS */}
                {isScorer && !isSeriesCompleted && (
                  <>
                    {seriesBreakTimer ? (
                      <div className="flex items-center space-x-2 bg-indigo-950/90 border border-indigo-500/50 px-4 py-2.5 rounded-2xl shadow-lg">
                        <Coffee className="w-4 h-4 text-amber-400 animate-bounce" />
                        <span className="text-xs font-black text-indigo-200 uppercase tracking-wide">
                          Break Active ({seriesBreakTimer.durationMinutes}m)
                        </span>
                        <button
                          onClick={cancelSeriesBreak}
                          className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg text-[10px] font-extrabold border border-red-500/30 transition"
                        >
                          Cancel Break
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartNextSeriesMatch()}
                          className="flex items-center space-x-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm transition shadow-xl shadow-emerald-500/30 active:scale-95 animate-pulse"
                        >
                          <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-slate-950" />
                          <span>▶️ Start Match {completedCount + 1} of Series ➔</span>
                        </button>

                        <button
                          onClick={() => startSeriesBreak(selectedSeries.id, completedCount + 1, 15)}
                          className="flex items-center space-x-1.5 px-3.5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold text-xs transition border border-amber-500/40 active:scale-95 shadow-md"
                        >
                          <Coffee className="w-4 h-4 text-amber-400" />
                          <span>15 Min Break ☕</span>
                        </button>

                        <button
                          onClick={() => startSeriesBreak(selectedSeries.id, completedCount + 1, 30)}
                          className="flex items-center space-x-1.5 px-3.5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold text-xs transition border border-amber-500/40 active:scale-95 shadow-md"
                        >
                          <Coffee className="w-4 h-4 text-amber-400" />
                          <span>30 Min Break ☕</span>
                        </button>

                        <button
                          onClick={() => startSeriesBreak(selectedSeries.id, completedCount + 1, 45)}
                          className="flex items-center space-x-1.5 px-3.5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold text-xs transition border border-amber-500/40 active:scale-95 shadow-md"
                        >
                          <Coffee className="w-4 h-4 text-amber-400" />
                          <span>45 Min Break ☕</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={handleCompleteSeriesTrigger}
                      className="px-3.5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold text-xs transition border border-slate-800"
                    >
                      Declare Complete
                    </button>
                  </>
                )}

                {isSeriesCompleted && (
                  <div className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-400/20 to-amber-500/20 border-2 border-amber-400 text-amber-300 font-black text-sm shadow-xl flex items-center space-x-2 animate-pulse">
                    <Trophy className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <span>
                      {teamAWins > teamBWins
                        ? `Series won by ${selectedSeries.teamA}!`
                        : teamBWins > teamAWins
                        ? `Series won by ${selectedSeries.teamB}!`
                        : `Series drawn between ${selectedSeries.teamA} and ${selectedSeries.teamB}!`}
                    </span>
                  </div>
                )}
              </div>
            </div>


          </div>

          {/* ── PLAYER OF THE SERIES / TOURNAMENT MVP SHOWCASE (COMPACT MOBILE READY) ── */}
          <div className="relative overflow-hidden pots-card-container rounded-2xl p-4 sm:p-5 shadow-lg border">
            {/* Header Mini-Bar */}
            <div className="flex items-center justify-between gap-2 border-b border-amber-500/30 pb-2.5 mb-3.5">
              <div className="flex items-center space-x-2 text-amber-500 font-bold text-xs">
                <Trophy className="w-4 h-4" />
                <span className="font-extrabold">{isSeriesCompleted ? '🏆 Official Player of the Series' : '⭐ Series MVP Leader'}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 font-mono text-[10px] font-bold">
                {isSeriesCompleted ? 'Concluded' : 'Live Leader'}
              </span>
            </div>

            {potSPlayer ? (
              <div className="space-y-3">
                {/* Main Row: Avatar + Name + 3 Mini Stats */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Avatar + Details */}
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      {potSPlayer.avatarUrl ? (
                        <img
                          src={potSPlayer.avatarUrl}
                          alt={potSPlayer.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-amber-400/80 shadow-md"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center font-black text-base shadow-md">
                          {potSPlayer.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 p-0.5 rounded-md bg-amber-500 text-slate-950 font-black shadow">
                        <Trophy className="w-2.5 h-2.5" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-black pots-player-name truncate leading-tight">
                        {potSPlayer.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] pots-citation-text">
                        <span className="font-bold text-amber-500">{potSPlayer.role}</span>
                        {potSPlayer.country && (
                          <>
                            <span>•</span>
                            <span>{potSPlayer.country}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: 3 Mini Stats */}
                  <div className="grid grid-cols-3 gap-2 flex-shrink-0">
                    {/* Runs */}
                    <div className="pots-stat-box px-3 py-1.5 rounded-xl text-center border">
                      <span className="pots-stat-label text-[9px] font-bold uppercase block">Runs</span>
                      <span className="pots-stat-value text-sm sm:text-base font-black font-mono block">
                        {topPerformer?.runs || 0}
                      </span>
                    </div>

                    {/* Wickets */}
                    <div className="pots-stat-box px-3 py-1.5 rounded-xl text-center border">
                      <span className="pots-stat-label text-[9px] font-bold uppercase block">Wkts</span>
                      <span className="text-sm sm:text-base font-black text-emerald-500 font-mono block">
                        {topPerformer?.wickets || 0}
                      </span>
                    </div>

                    {/* MVP Points */}
                    <div className="pots-stat-box px-3 py-1.5 rounded-xl text-center border border-amber-500/40 bg-amber-500/10">
                      <span className="text-[9px] font-bold uppercase text-amber-500 block">MVP Pts</span>
                      <span className="text-sm sm:text-base font-black text-amber-500 font-mono block">
                        {potS?.points || topPerformer?.mvpPoints || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Optional Citation Footer (1 compact line) */}
                {(selectedSeries.playerOfSeriesSummary || potS?.summary) && (
                  <p className="text-[11px] pots-citation-text truncate border-t border-amber-500/20 pt-2">
                    <span className="text-amber-500 font-bold">Citation: </span>
                    {selectedSeries.playerOfSeriesSummary || potS?.summary}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-3 text-xs pots-citation-text">
                ⭐ MVP Award will be calculated as matches progress.
              </div>
            )}
          </div>

          {/* ── SERIES POINTS TABLE ──────────────────────────── */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Table className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-extrabold text-white">Tournament Points Table</h3>
              <span className="ml-auto text-xs text-slate-500 font-mono">Win: 2 pts • Tie: 1 pt</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Pos</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4 text-center">P</th>
                    <th className="py-3 px-4 text-center">W</th>
                    <th className="py-3 px-4 text-center">L</th>
                    <th className="py-3 px-4 text-center">T</th>
                    <th className="py-3 px-4 text-right">NRR</th>
                    <th className="py-3 px-4 text-right font-black text-amber-400">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {pointsTableData.map((row, idx) => (
                    <tr key={row.team} className={`hover:bg-slate-800/40 transition ${idx === 0 ? 'bg-amber-500/10' : ''}`}>
                      <td className="py-3.5 px-4 font-bold">
                        <span className={`w-6 h-6 rounded-md inline-flex items-center justify-center font-extrabold text-xs ${
                          idx === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white font-sans">{row.team}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-200">{row.p}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-400">{row.w}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-red-400">{row.l}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">{row.t}</td>
                      <td className="py-3.5 px-4 text-right text-slate-300">{Number(row.nrr) >= 0 ? `+${row.nrr}` : row.nrr}</td>
                      <td className="py-3.5 px-4 text-right text-base font-black text-amber-400">{row.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── HEAD-TO-HEAD STATS CARD ──────────────────────────── */}
          {h2hA && h2hB && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                  <h3 className="text-sm sm:text-base font-extrabold text-white">Head-to-Head Comparison</h3>
                </div>

                {isTriSeries && (
                  <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setH2hPair('AB')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${h2hPair === 'AB' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
                    >
                      {teamAName} vs {teamBName}
                    </button>
                    <button
                      onClick={() => setH2hPair('BC')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${h2hPair === 'BC' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
                    >
                      {teamBName} vs {teamCName}
                    </button>
                    <button
                      onClick={() => setH2hPair('CA')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${h2hPair === 'CA' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
                    >
                      {teamCName} vs {teamAName}
                    </button>
                  </div>
                )}
              </div>

              {/* Win Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px] sm:text-xs font-black">
                  <span className="text-emerald-400 font-black text-xs sm:text-sm truncate flex-1">{activeH2HTeamA}</span>
                  <span className="text-slate-400 font-extrabold text-[10px] uppercase tracking-widest px-2 flex-shrink-0">HEAD TO HEAD WINS</span>
                  <span className="text-blue-400 font-black text-xs sm:text-sm truncate flex-1 text-right">{activeH2HTeamB}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg sm:text-2xl font-black text-emerald-400 font-mono w-5 sm:w-6 text-right">{h2hA.wins}</span>
                  <div className="flex-1 flex h-3 sm:h-4 rounded-full overflow-hidden bg-slate-800">
                    <div
                      className="bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
                      style={{ width: `${h2hA.played > 0 ? (h2hA.wins / h2hA.played) * 100 : 0}%` }}
                    />
                    {h2hA.draws > 0 && (
                      <div
                        className="bg-slate-600"
                        style={{ width: `${(h2hA.draws / h2hA.played) * 100}%` }}
                      />
                    )}
                    <div
                      className="bg-gradient-to-r from-blue-400 to-blue-600 ml-auto transition-all duration-700"
                      style={{ width: `${h2hB.played > 0 ? (h2hB.wins / h2hB.played) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-lg sm:text-2xl font-black text-blue-400 font-mono w-5 sm:w-6">{h2hB.wins}</span>
                </div>
                {h2hA.draws > 0 && (
                  <p className="text-center text-[11px] text-slate-500">{h2hA.draws} draw{h2hA.draws > 1 ? 's' : ''}</p>
                )}
              </div>

              {/* Detailed Stats Grid */}
              <div className="grid grid-cols-3 gap-0 divide-x divide-slate-800 rounded-xl sm:rounded-2xl bg-slate-950/60 border border-slate-800 overflow-hidden">

                <div className="p-2 sm:p-4 space-y-3 sm:space-y-4 text-center">
                  <p className="text-[10px] sm:text-xs font-extrabold text-emerald-400 truncate">{activeH2HTeamA}</p>
                  <StatRow label="Win %" value={`${h2hA.winPct}%`} color="text-emerald-400" />
                  <StatRow label="Runs Scored" value={String(h2hA.runsScored)} color="text-white" />
                  <StatRow label="Runs Conceded" value={String(h2hA.runsConceded)} color="text-slate-300" />
                  <StatRow label="Highest Score" value={String(h2hA.highestScore)} color="text-amber-400" />
                  <StatRow label="Lowest Score" value={String(h2hA.lowestScore)} color="text-slate-400" />
                  <StatRow
                    label="Net Run Diff"
                    value={(h2hA.runsScored - h2hA.runsConceded >= 0 ? '+' : '') + (h2hA.runsScored - h2hA.runsConceded)}
                    color={h2hA.runsScored >= h2hA.runsConceded ? 'text-emerald-400' : 'text-red-400'}
                  />
                </div>

                <div className="p-2 sm:p-4 space-y-3 sm:space-y-4 text-center text-[9px] sm:text-[11px] text-slate-500 font-semibold">
                  <p className="text-[9px] sm:text-[11px] font-bold text-slate-400 invisible">-</p>
                  <p>Win %</p>
                  <p>Runs Scored</p>
                  <p>Runs Conceded</p>
                  <p>Highest Score</p>
                  <p>Lowest Score</p>
                  <p>Net Run Diff</p>
                </div>

                <div className="p-2 sm:p-4 space-y-3 sm:space-y-4 text-center">
                  <p className="text-[10px] sm:text-xs font-extrabold text-blue-400 truncate">{activeH2HTeamB}</p>
                  <StatRow label="Win %" value={`${h2hB.winPct}%`} color="text-blue-400" />
                  <StatRow label="Runs Scored" value={String(h2hB.runsScored)} color="text-white" />
                  <StatRow label="Runs Conceded" value={String(h2hB.runsConceded)} color="text-slate-300" />
                  <StatRow label="Highest Score" value={String(h2hB.highestScore)} color="text-amber-400" />
                  <StatRow label="Lowest Score" value={String(h2hB.lowestScore)} color="text-slate-400" />
                  <StatRow
                    label="Net Run Diff"
                    value={(h2hB.runsScored - h2hB.runsConceded >= 0 ? '+' : '') + (h2hB.runsScored - h2hB.runsConceded)}
                    color={h2hB.runsScored >= h2hB.runsConceded ? 'text-emerald-400' : 'text-red-400'}
                  />
                </div>

              </div>

            </div>
          )}

          {/* SERIES PLAYER MVP LEADERBOARD TABLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-amber-400 font-extrabold text-base">
                <Star className="w-5 h-5 fill-current" />
                <h3>Series MVP Fantasy Points Leaderboard</h3>
              </div>
              <span className="text-xs text-slate-400 font-medium font-mono">Series Standings</span>
            </div>

            {leaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm text-slate-300">
                  <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Rank</th>
                      <th className="py-3.5 px-4">Player</th>
                      <th className="py-3.5 px-4 text-center">Mat</th>
                      <th className="py-3.5 px-4 text-right">Runs</th>
                      <th className="py-3.5 px-4 text-right">4s / 6s</th>
                      <th className="py-3.5 px-4 text-right">Wkts</th>
                      <th className="py-3.5 px-4 text-right">Econ</th>
                      <th className="py-3.5 px-4 text-right font-bold text-amber-400">MVP Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {leaderboard.map((item, index) => {
                      const player = players.find(p => p.id === item.playerId);
                      const econ = item.oversBowled > 0 ? (item.runsConceded / item.oversBowled).toFixed(2) : '-';

                      return (
                        <tr key={item.playerId} className={`hover:bg-slate-800/40 transition ${index === 0 ? 'bg-amber-500/10' : ''}`}>
                          <td className="py-3.5 px-4">
                            <span className={`w-7 h-7 rounded-lg inline-flex items-center justify-center font-extrabold text-xs ${
                              index === 0 ? 'bg-amber-500 text-slate-950 font-black' :
                              index === 1 ? 'bg-slate-300 text-slate-950' :
                              index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                            }`}>
                              #{index + 1}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-white font-sans flex items-center space-x-3">
                            {player?.avatarUrl ? (
                              <img src={player.avatarUrl} alt={player.name} className="w-8 h-8 rounded-lg object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs">
                                {player?.name.substring(0, 2)}
                              </div>
                            )}
                            <div>
                              <span>{player?.name || 'Player'}</span>
                              <span className="text-[11px] text-slate-400 block font-normal">
                                {player?.country ? `${player.country} • ` : ''}{player?.role}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-center font-bold text-slate-200">{item.matchesPlayed}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-amber-300">{item.runs}</td>
                          <td className="py-3.5 px-4 text-right text-slate-400">{item.fours} / {item.sixes}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-400">{item.wickets}</td>
                          <td className="py-3.5 px-4 text-right text-slate-400">{econ}</td>
                          <td className="py-3.5 px-4 text-right text-base font-black text-amber-400">
                            {item.mvpPoints}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                No completed match stats available in this series yet.
              </div>
            )}

          </div>

          {/* Series Matches List */}
          {/* Series Matches List */}
          <div className="theme-bg-card border theme-border rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold theme-text-main flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              <span>Series Matches ({seriesMatches.length})</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seriesMatches.map((m) => {
                const potmPlayer = m.potmInfo ? players.find(p => p.id === m.potmInfo?.playerId) : undefined;

                return (
                  <div key={m.id} className="theme-bg-card border theme-border rounded-2xl p-4 space-y-3 shadow-md">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold theme-text-sub">{m.date} • {m.venue}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-[10px] font-extrabold">
                        {m.status.toUpperCase()}
                      </span>
                    </div>

                    <h4 className="font-black theme-text-main text-base sm:text-lg">
                      {m.teamA.name} vs {m.teamB.name}
                    </h4>

                    {m.result && (
                      <p className="text-xs font-extrabold text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 inline-block">
                        🏆 {m.result}
                      </p>
                    )}

                    {potmPlayer && (
                      <div className="potm-player-row bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center space-x-3 text-xs shadow-sm">
                        <Award className="w-6 h-6 text-amber-500 flex-shrink-0" />
                        <div>
                          <span className="text-[10px] uppercase font-black text-amber-500 block tracking-wider">
                            Player of the Match (POTM)
                          </span>
                          <span className="potm-player-name font-black theme-text-main text-xs sm:text-sm">{potmPlayer.name}</span>
                          <span className="potm-summary-text theme-text-sub block text-[11px] font-semibold mt-0.5">{m.potmInfo?.summary}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          No series found. Click "New Series / Tournament" to create one.
        </div>
      )}

      {/* CREATE SERIES MODAL */}
      {showCreateModal && (
        <CreateSeriesModal
          onClose={() => setShowCreateModal(false)}
          onSeriesCreated={(s) => {
            setSelectedSeriesId(s.id);
            setSetupMatchParams({
              seriesId: s.id,
              matchName: `${s.name} - Match 1`,
              teamA: s.teamA,
              teamB: s.teamB,
            });
          }}
        />
      )}

      {/* MATCH SETUP MODAL PRE-FILLED FOR SERIES */}
      {setupMatchParams && (
        <MatchSetupModal
          onClose={() => setSetupMatchParams(null)}
          initialSeriesId={setupMatchParams.seriesId}
          initialMatchName={setupMatchParams.matchName}
          initialTeamA={setupMatchParams.teamA}
          initialTeamB={setupMatchParams.teamB}
        />
      )}

    </div>
  );
};

// Sub-component: Create Series Modal
const CreateSeriesModal: React.FC<{
  onClose: () => void;
  onSeriesCreated: (series: TournamentSeries) => void;
}> = ({ onClose, onSeriesCreated }) => {
  const { createSeries, seriesList, matches, customAddedTeams } = useCricket();

  const addedTeams = useMemo(() => {
    const set = new Set<string>();
    customAddedTeams.forEach(t => {
      if (t && t.trim()) set.add(t.trim());
    });
    seriesList.forEach(s => {
      if (!s.id.startsWith('series-triseries') && !s.id.startsWith('series-1') && !s.id.startsWith('demo-')) {
        if (s.teamA) set.add(s.teamA);
        if (s.teamB) set.add(s.teamB);
        if (s.teamC) set.add(s.teamC);
      }
    });
    matches.forEach(m => {
      if (!m.id.startsWith('m-sample') && !m.id.startsWith('demo-')) {
        if (m.teamA?.name) set.add(m.teamA.name);
        if (m.teamB?.name) set.add(m.teamB.name);
      }
    });

    return Array.from(set).filter(Boolean);
  }, [customAddedTeams, seriesList, matches]);

  const [useCustomInputs, setUseCustomInputs] = useState<boolean>(addedTeams.length === 0);

  const [seriesType, setSeriesType] = useState<'bilateral' | 'triseries'>('triseries');
  const [name, setName] = useState('International Tri-Series Cup 2026');
  const [format, setFormat] = useState('Tri-Series (3 Teams)');
  const [totalMatches, setTotalMatches] = useState<number | string>(7);

  const [teamA, setTeamA] = useState<string>(addedTeams[0] || '');
  const [teamB, setTeamB] = useState<string>(addedTeams[1] || '');
  const [teamC, setTeamC] = useState<string>(addedTeams[2] || '');

  useEffect(() => {
    if (!useCustomInputs && addedTeams.length > 0) {
      if (!teamA || !addedTeams.includes(teamA)) setTeamA(addedTeams[0] || '');
      if (!teamB || !addedTeams.includes(teamB)) setTeamB(addedTeams[1] || addedTeams[0] || '');
      if (!teamC || !addedTeams.includes(teamC)) setTeamC(addedTeams[2] || addedTeams[0] || '');
    }
  }, [useCustomInputs, addedTeams]);

  const handleTypeToggle = (type: 'bilateral' | 'triseries') => {
    setSeriesType(type);
    if (type === 'triseries') {
      setFormat('Tri-Series (3 Teams)');
      setTotalMatches(7);
    } else {
      setFormat('3-Match T20 Series');
      setTotalMatches(3);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !teamA.trim() || !teamB.trim()) return;

    const newSeries: TournamentSeries = {
      id: `series-${Date.now()}`,
      name: name.trim(),
      seriesType,
      format: format.trim(),
      totalMatches: Math.max(1, Number(totalMatches) || (seriesType === 'triseries' ? 7 : 3)),
      teamA: teamA.trim(),
      teamB: teamB.trim(),
      teamC: seriesType === 'triseries' ? teamC.trim() : undefined,
      matchIds: [],
      status: 'ongoing' as const,
    };

    createSeries(newSeries);
    onSeriesCreated(newSeries);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Create Series / Tournament</h2>
            <p className="text-xs text-slate-400">Choose Bilateral or 3-Team Tri-Series format</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          {/* Series Format Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Series Type Classification</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeToggle('triseries')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold transition flex items-center justify-center space-x-2 ${
                  seriesType === 'triseries'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Tri-Series (3 Teams)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeToggle('bilateral')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold transition flex items-center justify-center space-x-2 ${
                  seriesType === 'bilateral'
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Swords className="w-4 h-4 text-emerald-400" />
                <span>Bilateral (2 Teams)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Series Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Format Label</label>
              <input
                type="text"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Total Matches *</label>
              <input
                type="number"
                min="1"
                max="50"
                value={totalMatches}
                onChange={(e) => setTotalMatches(e.target.value)}
                placeholder="e.g. 3, 7"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs font-bold outline-none"
              />
            </div>
          </div>

          {/* Teams Selection Header & Mode Toggle */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-300">Team Names</span>
            {addedTeams.length > 0 && (
              <button
                type="button"
                onClick={() => setUseCustomInputs(!useCustomInputs)}
                className="text-[11px] font-extrabold text-amber-400 hover:text-amber-300 underline"
              >
                {useCustomInputs ? 'Select from Added Teams 🔽' : '+ Add New Custom Team ✏️'}
              </button>
            )}
          </div>

          <div className={`grid ${seriesType === 'triseries' ? 'grid-cols-3' : 'grid-cols-2'} gap-2.5`}>
            {/* Team A */}
            <div>
              <label className="block text-xs font-semibold text-emerald-400 mb-1">Team A *</label>
              {!useCustomInputs && addedTeams.length > 0 ? (
                <select
                  value={teamA}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTeamA(val);
                    if (val === teamB) {
                      const next = addedTeams.find(t => t !== val && t !== teamC);
                      if (next) setTeamB(next);
                    }
                    if (val === teamC) {
                      const next = addedTeams.find(t => t !== val && t !== teamB);
                      if (next) setTeamC(next);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold text-xs outline-none cursor-pointer"
                >
                  {addedTeams.map(t => (
                    <option key={t} value={t} disabled={t === teamB || t === teamC}>
                      {t}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  placeholder="e.g. India"
                  value={teamA}
                  onChange={(e) => setTeamA(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold text-xs outline-none"
                />
              )}
            </div>

            {/* Team B */}
            <div>
              <label className="block text-xs font-semibold text-blue-400 mb-1">Team B *</label>
              {!useCustomInputs && addedTeams.length > 0 ? (
                <select
                  value={teamB}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTeamB(val);
                    if (val === teamA) {
                      const next = addedTeams.find(t => t !== val && t !== teamC);
                      if (next) setTeamA(next);
                    }
                    if (val === teamC) {
                      const next = addedTeams.find(t => t !== val && t !== teamA);
                      if (next) setTeamC(next);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold text-xs outline-none cursor-pointer"
                >
                  {addedTeams.map(t => (
                    <option key={t} value={t} disabled={t === teamA || t === teamC}>
                      {t}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  placeholder="e.g. Australia"
                  value={teamB}
                  onChange={(e) => setTeamB(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold text-xs outline-none"
                />
              )}
            </div>

            {/* Team C */}
            {seriesType === 'triseries' && (
              <div>
                <label className="block text-xs font-semibold text-cyan-400 mb-1">Team C *</label>
                {!useCustomInputs && addedTeams.length > 0 ? (
                  <select
                    value={teamC}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTeamC(val);
                      if (val === teamA) {
                        const next = addedTeams.find(t => t !== val && t !== teamB);
                        if (next) setTeamA(next);
                      }
                      if (val === teamB) {
                        const next = addedTeams.find(t => t !== val && t !== teamA);
                        if (next) setTeamB(next);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold text-xs outline-none cursor-pointer"
                  >
                    {addedTeams.map(t => (
                      <option key={t} value={t} disabled={t === teamA || t === teamB}>
                        {t}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. South Africa"
                    value={teamC}
                    onChange={(e) => setTeamC(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold text-xs outline-none"
                  />
                )}
              </div>
            )}
          </div>

          <div className="pt-3 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20 transition active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{seriesType === 'bilateral' ? 'Start the Bilateral series →' : 'Start the Tri series →'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

const StatRow: React.FC<{ label: string; value: string; color: string }> = ({ value, color }) => (
  <p className={`text-sm font-black font-mono ${color}`}>{value}</p>
);

export default SeriesDashboard;

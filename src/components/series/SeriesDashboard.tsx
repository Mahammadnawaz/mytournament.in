import React, { useState } from 'react';
import { useCricket } from '../../context/CricketContext';
import type { TournamentSeries } from '../../types/cricket';
import { calculateSeriesMVP } from '../../utils/cricketEngine';
import { Trophy, Plus, Award, Check, X, Star, Calendar, Swords, Play, Table } from 'lucide-react';
import confetti from 'canvas-confetti';
import MatchSetupModal from '../match/MatchSetupModal';

export const SeriesDashboard: React.FC = () => {
  const { seriesList, matches, players, completeSeries } = useCricket();

  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(seriesList[0]?.id || '');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [setupMatchParams, setSetupMatchParams] = useState<{
    seriesId: string;
    matchName: string;
    teamA: string;
    teamB: string;
  } | null>(null);

  const selectedSeries = seriesList.find(s => s.id === selectedSeriesId) || seriesList[0];

  // Calculate Series MVP table and Player of Series
  const { leaderboard, potS } = selectedSeries
    ? calculateSeriesMVP(selectedSeries, matches)
    : { leaderboard: [], potS: undefined };

  const potSPlayer = potS ? players.find(p => p.id === potS.playerId) : undefined;

  // Calculate Series matches & win counts
  const seriesMatches = selectedSeries
    ? matches.filter(m => (selectedSeries.matchIds?.includes(m.id) || m.seriesId === selectedSeries.id) && m.status === 'completed')
    : [];

  let teamAWins = 0;
  let teamBWins = 0;
  let tiesCount = 0;

  seriesMatches.forEach(m => {
    const winner = m.winnerTeam || (m.result?.includes(' won by ') ? m.result.split(' won by ')[0].trim() : undefined);
    if (winner === selectedSeries?.teamA) teamAWins++;
    else if (winner === selectedSeries?.teamB) teamBWins++;
    else if (m.result?.toLowerCase().includes('tied') || m.result?.toLowerCase().includes('draw')) tiesCount++;
  });

  const isSeriesCompleted = selectedSeries?.status === 'completed' || seriesMatches.length >= (selectedSeries?.totalMatches || 0);

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
    seriesMatches.forEach(m => {
      const isTeamA = m.teamA.name === teamName || m.teamB.name === teamName;
      if (!isTeamA) return;
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

  const h2hA = selectedSeries ? buildH2H(selectedSeries.teamA, selectedSeries.teamB) : null;
  const h2hB = selectedSeries ? buildH2H(selectedSeries.teamB, selectedSeries.teamA) : null;

  // Compute Net Run Rate approximation
  const nrrA = h2hA && h2hA.played > 0 ? ((h2hA.runsScored - h2hA.runsConceded) / (h2hA.played * 5)).toFixed(2) : '0.00';
  const nrrB = h2hB && h2hB.played > 0 ? ((h2hB.runsScored - h2hB.runsConceded) / (h2hB.played * 5)).toFixed(2) : '0.00';

  const ptsA = teamAWins * 2 + tiesCount * 1;
  const ptsB = teamBWins * 2 + tiesCount * 1;

  const pointsTableData = [
    { team: selectedSeries?.teamA || 'Team A', p: seriesMatches.length, w: teamAWins, l: teamBWins, t: tiesCount, pts: ptsA, nrr: nrrA },
    { team: selectedSeries?.teamB || 'Team B', p: seriesMatches.length, w: teamBWins, l: teamAWins, t: tiesCount, pts: ptsB, nrr: nrrB },
  ].sort((a, b) => b.pts !== a.pts ? b.pts - a.pts : Number(b.nrr) - Number(a.nrr));

  const handleCompleteSeriesTrigger = () => {
    if (!selectedSeries) return;
    completeSeries(selectedSeries.id);
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.5 }
    });
  };

  const handleStartNextSeriesMatch = () => {
    if (!selectedSeries) return;
    const matchNumber = seriesMatches.length + 1;
    setSetupMatchParams({
      seriesId: selectedSeries.id,
      matchName: `${selectedSeries.name} - Match ${matchNumber}`,
      teamA: selectedSeries.teamA,
      teamB: selectedSeries.teamB,
    });
  };

  return (
    <div className="space-y-6">
      
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

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition active:scale-95 self-start md:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span>New Series / Tournament</span>
        </button>
      </div>

      {/* Series Selector Pills */}
      {seriesList.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
          {seriesList.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSeriesId(s.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                selectedSeriesId === s.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {s.name} ({s.format})
            </button>
          ))}
        </div>
      )}

      {selectedSeries ? (
        <div className="space-y-6">
          
          {/* Active Series Scorecard Banner */}
          <div className="relative overflow-hidden bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4 text-xs text-slate-400">
              <span className="font-extrabold text-amber-400 text-sm uppercase tracking-wider">
                {selectedSeries.format}
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-bold">
                Matches Played: {seriesMatches.length} / {selectedSeries.totalMatches}
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-3xl font-black text-white">
                  {selectedSeries.name}
                </h3>
                <div className="flex items-center justify-center sm:justify-start flex-wrap gap-2 sm:gap-3 mt-2">
                  <span className="text-base sm:text-2xl font-extrabold text-emerald-400 truncate max-w-[120px] sm:max-w-none">{selectedSeries.teamA}</span>
                  <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono flex-shrink-0">{teamAWins} - {teamBWins}</span>
                  <span className="text-base sm:text-2xl font-extrabold text-blue-400 truncate max-w-[120px] sm:max-w-none">{selectedSeries.teamB}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                {/* HIDE START NEXT MATCH BUTTON WHEN SERIES IS COMPLETED */}
                {!isSeriesCompleted && (
                  <button
                    onClick={handleStartNextSeriesMatch}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Match {seriesMatches.length + 1}</span>
                  </button>
                )}

                {!isSeriesCompleted ? (
                  <button
                    onClick={handleCompleteSeriesTrigger}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                  >
                    Declare Complete
                  </button>
                ) : (
                  <div className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-xs">
                    🏆 Series Completed
                  </div>
                )}
              </div>
            </div>


          </div>

          {/* ── PLAYER OF THE SERIES — shown ONLY after series is completed ── */}
          {isSeriesCompleted && (
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-950/60 via-slate-900 to-yellow-950/40 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl">
              {/* Background glow */}
              <div className="absolute -top-10 -right-10 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Trophy icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/30 flex-shrink-0">
                  <Trophy className="w-9 h-9" />
                </div>

                {/* Player info */}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 block mb-1">
                    🏏 Player of the Series
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white truncate">
                    {potSPlayer?.name || 'Series MVP'}
                  </h3>
                  {(selectedSeries.playerOfSeriesSummary || potS?.summary) && (
                    <p className="text-sm text-slate-300 font-medium mt-1">
                      {selectedSeries.playerOfSeriesSummary || potS?.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {potSPlayer?.role && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {potSPlayer.role}
                      </span>
                    )}
                    {potSPlayer?.country && (
                      <span className="text-[11px] text-slate-400 font-medium">{potSPlayer.country}</span>
                    )}
                  </div>
                </div>

                {/* MVP Points badge */}
                <div className="flex-shrink-0 text-center bg-amber-500/15 border border-amber-500/30 rounded-2xl px-5 py-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block mb-1">Total MVP Pts</span>
                  <span className="text-4xl font-black text-amber-400 font-mono leading-none">{potS?.points || 0}</span>
                </div>
              </div>
            </div>
          )}

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
          {h2hA && h2hB && seriesMatches.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5">

              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                <h3 className="text-sm sm:text-base font-extrabold text-white">Head-to-Head Stats</h3>
                <span className="ml-auto text-[10px] sm:text-xs text-slate-500 font-medium">{seriesMatches.length} match{seriesMatches.length > 1 ? 'es' : ''}</span>
              </div>

              {/* Win Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] sm:text-xs font-bold">
                  <span className="text-emerald-400 truncate max-w-[90px] sm:max-w-none">{selectedSeries.teamA}</span>
                  <span className="text-slate-500 text-[10px] sm:text-[11px]">WINS</span>
                  <span className="text-blue-400 truncate max-w-[90px] sm:max-w-none text-right">{selectedSeries.teamB}</span>
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
                  <p className="text-[10px] sm:text-xs font-extrabold text-emerald-400 truncate">{selectedSeries.teamA}</p>
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
                  <p className="text-[10px] sm:text-xs font-extrabold text-blue-400 truncate">{selectedSeries.teamB}</p>
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span>Series Matches ({seriesMatches.length})</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seriesMatches.map((m) => {
                const potmPlayer = m.potmInfo ? players.find(p => p.id === m.potmInfo?.playerId) : undefined;

                return (
                  <div key={m.id} className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-400">{m.date} • {m.venue}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
                        COMPLETED
                      </span>
                    </div>

                    <h4 className="font-black text-white text-base">
                      {m.teamA.name} vs {m.teamB.name}
                    </h4>

                    {m.result && (
                      <p className="text-xs font-bold text-amber-400">{m.result}</p>
                    )}

                    {potmPlayer && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-2.5 flex items-center space-x-3 text-xs">
                        <Award className="w-5 h-5 text-emerald-400" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                            Player of the Match (POTM)
                          </span>
                          <span className="font-bold text-white">{potmPlayer.name}</span>
                          <span className="text-slate-400 block text-[11px]">{m.potmInfo?.summary}</span>
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
  const { createSeries } = useCricket();

  const [name, setName] = useState('Super Cricket Tri-Series 2026');
  const [format, setFormat] = useState('3-Match T20 Series');
  const [totalMatches, setTotalMatches] = useState(3);
  const [teamA, setTeamA] = useState('Royal Titans');
  const [teamB, setTeamB] = useState('Super Strikers');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !teamA.trim() || !teamB.trim()) return;

    const newSeries = {
      id: `series-${Date.now()}`,
      name: name.trim(),
      format: format.trim(),
      totalMatches: Number(totalMatches),
      teamA: teamA.trim(),
      teamB: teamB.trim(),
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
            <p className="text-xs text-slate-400">Set up tournament format & team pairings</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">Format</label>
              <input
                type="text"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Total Matches</label>
              <input
                type="number"
                min="1"
                max="20"
                value={totalMatches}
                onChange={(e) => setTotalMatches(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs font-bold outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-emerald-400 mb-1">Team A Name</label>
              <input
                type="text"
                required
                value={teamA}
                onChange={(e) => setTeamA(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-blue-400 mb-1">Team B Name</label>
              <input
                type="text"
                required
                value={teamB}
                onChange={(e) => setTeamB(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold outline-none"
              />
            </div>
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
              <span>Create & Launch Setup →</span>
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

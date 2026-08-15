import React from 'react';
import { useCricket } from '../../context/CricketContext';
import { Trophy, ChevronRight, Award } from 'lucide-react';

export const HomeSeriesCard: React.FC = () => {
  const { seriesList, matches, setActiveTab, activeMatch } = useCricket();

  if (!seriesList || seriesList.length === 0) {
    return null;
  }

  // Find currently ongoing series or series associated with active match or latest series
  const activeSeries = (activeMatch?.seriesId ? seriesList.find(s => s.id === activeMatch.seriesId) : null)
    || seriesList.find(s => s.status === 'ongoing')
    || seriesList[0];

  if (!activeSeries) return null;

  const seriesMatches = matches.filter(
    m => (activeSeries.matchIds?.includes(m.id) || m.seriesId === activeSeries.id) && m.status === 'completed'
  );

  let teamAWins = 0;
  let teamBWins = 0;
  let tiesCount = 0;

  seriesMatches.forEach(m => {
    const winner = m.winnerTeam || (m.result?.includes(' won by ') ? m.result.split(' won by ')[0].trim() : undefined);
    if (winner === activeSeries.teamA) teamAWins++;
    else if (winner === activeSeries.teamB) teamBWins++;
    else if (m.result?.toLowerCase().includes('tied') || m.result?.toLowerCase().includes('draw')) tiesCount++;
  });

  const isCompleted = activeSeries.status === 'completed' || seriesMatches.length >= activeSeries.totalMatches;
  const progressPercent = Math.min(100, Math.round((seriesMatches.length / (activeSeries.totalMatches || 1)) * 100));

  return (
    <div 
      onClick={() => setActiveTab('series')}
      className="relative overflow-hidden bg-gradient-to-br from-amber-950/70 via-slate-900 to-yellow-950/50 border-2 border-amber-500/40 hover:border-amber-400/70 rounded-3xl p-4 sm:p-6 shadow-2xl transition cursor-pointer group active:scale-[0.99]"
    >
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-3 mb-4 text-xs">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Trophy className="w-4 h-4" />
          </div>
          <span className="font-black text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{isCompleted ? 'Tournament Archive' : 'Series Center • Ongoing Tournament'}</span>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300 font-bold">{activeSeries.format}</span>
        </div>

        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-black">
          Matches: {seriesMatches.length} of {activeSeries.totalMatches} Played ({progressPercent}%)
        </span>
      </div>

      {/* Main Series Content */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Series Title & Teams Head-to-Head */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-2xl font-black text-white group-hover:text-amber-300 transition truncate">
              {activeSeries.name}
            </h3>
          </div>

          {/* Head-to-Head Visual Card */}
          <div className="flex items-center justify-between gap-2 bg-slate-950/80 border border-amber-500/20 p-3 sm:p-4 rounded-2xl shadow-inner">
            {/* Team A */}
            <div className="flex-1 min-w-0 text-left">
              <span className="text-sm sm:text-lg font-black text-emerald-400 truncate block">
                {activeSeries.teamA}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-extrabold block">
                {teamAWins} {teamAWins === 1 ? 'Win' : 'Wins'}
              </span>
            </div>

            {/* Score Pill */}
            <div className="flex flex-col items-center justify-center px-4 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 flex-shrink-0 shadow-md">
              <span className="text-lg sm:text-2xl font-black text-amber-400 font-mono tracking-wider">
                {teamAWins} - {teamBWins}
              </span>
              <span className="text-[9px] font-extrabold text-amber-300/80 uppercase tracking-widest">
                {tiesCount > 0 ? `(${tiesCount} Ties)` : 'Series Score'}
              </span>
            </div>

            {/* Team B */}
            <div className="flex-1 min-w-0 text-right">
              <span className="text-sm sm:text-lg font-black text-blue-400 truncate block">
                {activeSeries.teamB}
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-extrabold block">
                {teamBWins} {teamBWins === 1 ? 'Win' : 'Wins'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center md:flex-col justify-end gap-2 flex-shrink-0">
          <button 
            className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition group-hover:scale-105"
          >
            <Award className="w-4 h-4" />
            <span>Open Series Center & Standings</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Bottom Progress Bar */}
      <div className="mt-4 pt-3 border-t border-amber-500/15 flex items-center justify-between text-[11px] text-slate-400 font-bold">
        <span>Tournament Progress</span>
        <div className="w-48 sm:w-64 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800 ml-3 flex-1 max-w-xs">
          <div 
            className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="ml-3 text-amber-400 font-mono">{progressPercent}%</span>
      </div>

    </div>
  );
};

export default HomeSeriesCard;

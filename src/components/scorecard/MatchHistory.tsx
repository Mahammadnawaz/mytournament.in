import React, { useState } from 'react';
import { useCricket } from '../../context/CricketContext';
import MatchScorecard from './MatchScorecard';
import { History, Trophy, ChevronDown, ChevronUp, Play, Calendar } from 'lucide-react';

export const MatchHistory: React.FC = () => {
  const { matches, setActiveMatchId, setActiveTab, isScorer } = useCricket();
  
  // Track open match accordion IDs (default to the first match open)
  const [expandedMatchIds, setExpandedMatchIds] = useState<Record<string, boolean>>(() => {
    return matches.length > 0 ? { [matches[0].id]: true } : {};
  });

  const toggleMatchDropdown = (matchId: string) => {
    setExpandedMatchIds(prev => ({
      ...prev,
      [matchId]: !prev[matchId]
    }));
  };

  if (matches.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h2 className="text-2xl font-black text-white flex items-center space-x-3">
            <History className="w-7 h-7 text-emerald-400" />
            <span>Match History & Archive</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Review completed matches, scores, and full analytical scorecards.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3 max-w-lg mx-auto">
          <History className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-200">No Matches Recorded Yet</h3>
          <p className="text-xs text-slate-400">
            Start a cricket match from the Live Scoring section to record deliveries and review full match scorecards.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center space-x-3">
            <History className="w-7 h-7 text-emerald-400" />
            <span>Match History & Archive</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Tap any match to expand its complete dropdown scorecard, ball-by-ball figures, and awards.
          </p>
        </div>

        <span className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs self-start sm:self-auto">
          Total Matches: {matches.length}
        </span>
      </div>

      {/* Accordion Dropdown Match List */}
      <div className="space-y-4">
        {matches.map((m) => {
          const isExpanded = !!expandedMatchIds[m.id];
          const isLive = m.status === 'live';

          const innings1Runs = m.innings1 ? `${m.innings1.totalRuns}/${m.innings1.wickets} (${m.innings1.overs}.${m.innings1.balls} ov)` : 'Yet to Bat';
          const innings2Runs = m.innings2 ? `${m.innings2.totalRuns}/${m.innings2.wickets} (${m.innings2.overs}.${m.innings2.balls} ov)` : '';

          return (
            <div
              key={m.id}
              className={`rounded-3xl border transition overflow-hidden shadow-xl ${
                isExpanded
                  ? 'bg-slate-900 border-emerald-500/50 shadow-emerald-950/20'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              {/* Match Header Button (Click to toggle Dropdown) */}
              <div
                onClick={() => toggleMatchDropdown(m.id)}
                className="p-5 sm:p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
              >
                {/* Left Column: Match Details & Scores */}
                <div className="flex-1 min-w-0 space-y-2">
                  
                  {/* Meta Bar */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold flex items-center space-x-1.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{m.date}</span>
                    </span>

                    {isLive ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-black text-[10px] animate-pulse flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                        <span>LIVE NOW</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold text-[10px]">
                        COMPLETED
                      </span>
                    )}

                    <span className="text-slate-400 font-medium">
                      {m.venue} • {m.totalOvers} Overs
                    </span>
                  </div>

                  {/* Team Names & Scores */}
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-lg sm:text-xl font-black text-white">
                      {m.teamA.name} <span className="text-slate-500 font-medium text-sm">vs</span> {m.teamB.name}
                    </h3>
                  </div>

                  {/* Innings Summary */}
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                    <span className="text-slate-300 font-bold">
                      {m.innings1?.battingTeam || m.teamA.name}: <strong className="text-emerald-400">{innings1Runs}</strong>
                    </span>
                    {innings2Runs && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-300 font-bold">
                          {m.innings2?.battingTeam || m.teamB.name}: <strong className="text-blue-400">{innings2Runs}</strong>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Result & POTM Banner */}
                  {m.result && (
                    <div className="inline-flex items-center space-x-2 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
                      <Trophy className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{m.result}</span>
                    </div>
                  )}
                </div>

                {/* Right Column: Actions & Dropdown Indicator */}
                <div className="flex items-center space-x-3 flex-shrink-0 self-end md:self-center">
                  
                  {isLive && isScorer && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMatchId(m.id);
                        setActiveTab('scoring');
                      }}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition shadow-md shadow-emerald-500/20 active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Resume Scoring</span>
                    </button>
                  )}

                  {/* Toggle Dropdown Pill Button */}
                  <div className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border text-xs font-extrabold transition ${
                    isExpanded 
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}>
                    <span>{isExpanded ? 'Hide Scorecard' : 'View Scorecard'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-emerald-400 transition-transform duration-200" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 transition-transform duration-200" />
                    )}
                  </div>

                </div>

              </div>

              {/* ── EXPANDABLE SCORECARD DROPDOWN PANEL ── */}
              {isExpanded && (
                <div className="border-t border-slate-800 bg-slate-950/60 p-4 sm:p-6 animate-fade-in">
                  <MatchScorecard matchOverride={m} />
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default MatchHistory;

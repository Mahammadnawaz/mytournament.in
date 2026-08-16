import React, { useState, useMemo } from 'react';
import { useCricket } from '../../context/CricketContext';
import MatchScorecard from './MatchScorecard';
import { History, Trophy, ChevronDown, ChevronUp, Play, Calendar, Search, Database, CheckCircle2 } from 'lucide-react';

export const MatchHistory: React.FC = () => {
  const { matches, setActiveMatchId, setActiveTab, isScorer } = useCricket();
  
  const [filterMode, setFilterMode] = useState<'all' | 'completed' | 'live'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      // 1. Status Filter
      if (filterMode === 'completed' && m.status === 'live') return false;
      if (filterMode === 'live' && m.status !== 'live') return false;

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (m.name || '').toLowerCase();
        const teamAName = (m.teamA?.name || '').toLowerCase();
        const teamBName = (m.teamB?.name || '').toLowerCase();
        const venue = (m.venue || '').toLowerCase();
        return matchName.includes(q) || teamAName.includes(q) || teamBName.includes(q) || venue.includes(q);
      }

      return true;
    });
  }, [matches, filterMode, searchQuery]);

  const completedCount = matches.filter(m => m.status !== 'live').length;
  const liveCount = matches.filter(m => m.status === 'live').length;

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
            All completed matches and full detailed scorecards are permanently saved in the match archive.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center space-x-1.5 shadow-sm">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>{completedCount} Completed Matches Saved</span>
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
        
        {/* Filter Buttons */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterMode === 'all'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({matches.length})
          </button>

          <button
            onClick={() => setFilterMode('completed')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterMode === 'completed'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Completed ({completedCount})
          </button>

          {liveCount > 0 && (
            <button
              onClick={() => setFilterMode('live')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center space-x-1 ${
                filterMode === 'live'
                  ? 'bg-red-500 text-white font-black shadow-sm'
                  : 'text-red-400 hover:text-red-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              <span>Live ({liveCount})</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-xs min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams, venues, matches..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

      </div>

      {/* Filtered Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-sm bg-slate-900 border border-slate-800 rounded-3xl">
          No matches found matching your current filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((m) => {
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
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/20 font-bold text-[10px] flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>COMPLETED & ARCHIVED</span>
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
                      <span>{isExpanded ? 'Hide Scorecard' : 'View Full Scorecard'}</span>
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
                  <div className="p-4 sm:p-6 border-t border-slate-800/90 bg-slate-950/60 animate-fade-in space-y-6">
                    <MatchScorecard matchOverride={m} />
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default MatchHistory;

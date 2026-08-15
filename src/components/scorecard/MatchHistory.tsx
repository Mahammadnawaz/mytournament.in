import React, { useState } from 'react';
import { useCricket } from '../../context/CricketContext';
import MatchScorecard from './MatchScorecard';
import { History, Trophy } from 'lucide-react';

export const MatchHistory: React.FC = () => {
  const { matches, setActiveMatchId, setActiveTab } = useCricket();
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(matches[0]?.id || null);
  const selectedMatch = matches.find(m => m.id === selectedMatchId) || matches[0] || null;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-2xl font-extrabold text-white flex items-center space-x-3">
          <History className="w-7 h-7 text-emerald-400" />
          <span>Match History & Archive</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Review completed matches, scores, and full analytical scorecards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Match List Sidebar (Col 4) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Saved Matches ({matches.length})
          </h3>

          <div className="space-y-2.5">
            {matches.map((m) => {
              const isSelected = selectedMatch?.id === m.id;
              const isLive = m.status === 'live';

              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMatchId(m.id)}
                  className={`w-full p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-950/30'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400">{m.date}</span>
                    {isLive ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white animate-pulse">
                        LIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400">
                        FINISHED
                      </span>
                    )}
                  </div>

                  <div className="font-extrabold text-base text-white">
                    {m.teamA.name} <span className="text-slate-500 text-xs font-normal">vs</span> {m.teamB.name}
                  </div>

                  {m.result && (
                    <div className="text-xs text-amber-400 font-semibold mt-2 flex items-center space-x-1">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>{m.result}</span>
                    </div>
                  )}

                  {isLive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMatchId(m.id);
                        setActiveTab('scoring');
                      }}
                      className="mt-3 w-full py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition"
                    >
                      Resume Live Scoring
                    </button>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Scorecard View (Col 8) */}
        <div className="lg:col-span-8">
          {selectedMatch ? (
            <MatchScorecard matchOverride={selectedMatch} />
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              Select a match from the left list to inspect detailed scorecard.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
export default MatchHistory;

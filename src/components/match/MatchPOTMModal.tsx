import React from 'react';
import { useCricket } from '../../context/CricketContext';
import { Trophy, Star, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MatchPOTMModalProps {
  onClose: () => void;
}

export const MatchPOTMModal: React.FC<MatchPOTMModalProps> = ({ onClose }) => {
  const { activeMatch, players } = useCricket();

  if (!activeMatch || !activeMatch.potmInfo) return null;

  const potmInfo = activeMatch.potmInfo;
  const player = players.find(p => p.id === potmInfo.playerId);

  // Trigger confetti burst when this modal mounts
  React.useEffect(() => {
    const burst = () => {
      confetti({ particleCount: 50, spread: 50, origin: { x: 0.5, y: 0.5 }, colors: ['#f59e0b', '#fbbf24', '#10b981', '#fff'] });
    };
    burst();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative max-w-sm w-full">

        {/* Glowing background hint */}
        <div className="absolute inset-0 rounded-2xl bg-amber-500/10 blur-xl scale-105 pointer-events-none" />

        {/* Main Compact Card */}
        <div className="relative bg-slate-900 border border-amber-500/40 rounded-2xl overflow-hidden shadow-xl shadow-slate-950">

          {/* Slim Header */}
          <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-slate-950 fill-slate-950" />
              <span className="text-slate-950 font-black text-xs uppercase tracking-wider">
                Match Completed • Player of the Match
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-950/70 hover:text-slate-950 transition p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Compact Body */}
          <div className="p-4 space-y-3">
            
            {/* Player Info + MVP Points Row */}
            <div className="flex items-center space-x-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              {player?.avatarUrl ? (
                <div className="relative flex-shrink-0">
                  <img
                    src={player.avatarUrl}
                    alt={player.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-amber-500/40"
                  />
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                    <Star className="w-2.5 h-2.5 text-slate-950 fill-current" />
                  </div>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm flex-shrink-0">
                  {player?.name?.slice(0, 2).toUpperCase() || 'POTM'}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h3 className="font-extrabold text-white text-sm truncate">
                    {player?.name || 'MVP Winner'}
                  </h3>
                  {player?.role && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold">
                      {player.role}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                  {potmInfo.summary || 'Match Winning Performance'}
                </p>
              </div>

              {/* Points Badge */}
              <div className="text-right flex-shrink-0 pl-2 border-l border-slate-800">
                <span className="text-[9px] font-bold text-slate-500 block uppercase leading-none">MVP</span>
                <span className="text-lg font-black text-amber-400 font-mono leading-tight">
                  {potmInfo.points}
                </span>
              </div>
            </div>

            {/* Match Result Banner */}
            {activeMatch.result && (
              <div className="text-center py-1.5 px-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <p className="text-xs font-bold text-emerald-400 truncate">
                  🏆 {activeMatch.result}
                </p>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={onClose}
              className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-md active:scale-95"
            >
              Continue to Scorecard →
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MatchPOTMModal;

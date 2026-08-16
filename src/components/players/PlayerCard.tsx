import React from 'react';
import type { Player } from '../../types/cricket';
import { User, Award, Flame, Shield, Edit2, Trash2, Globe } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  isScorer?: boolean;
  onSelect: (player: Player) => void;
  onEdit: (player: Player) => void;
  onDelete: (id: string) => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({ player, isScorer = false, onSelect, onEdit, onDelete }) => {
  const { stats } = player;
  
  // Calculate Batting Average & Strike Rate
  const batDismissals = stats.inningsBatted - stats.notOuts;
  const batAvg = batDismissals > 0 ? (stats.totalRuns / batDismissals).toFixed(1) : (stats.totalRuns > 0 ? stats.totalRuns.toString() : '-');
  const strikeRate = stats.ballsFaced > 0 ? ((stats.totalRuns / stats.ballsFaced) * 100).toFixed(1) : '-';

  // Calculate Bowling Economy Rate & Average
  const totalOvers = stats.oversBowled + (stats.ballsBowled % 6) / 6;
  const economy = totalOvers > 0 ? (stats.runsConceded / totalOvers).toFixed(2) : '-';
  const bowlAvg = stats.wicketsTaken > 0 ? (stats.runsConceded / stats.wicketsTaken).toFixed(1) : '-';

  const roleColors = {
    'Batsman': 'bg-blue-500/15 text-blue-300 border-blue-500/40 font-bold',
    'Bowler': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-bold',
    'All-Rounder': 'bg-amber-500/15 text-amber-300 border-amber-500/40 font-bold',
    'Wicket-Keeper': 'bg-purple-500/15 text-purple-300 border-purple-500/40 font-bold',
  };

  return (
    <div className="group relative theme-bg-card theme-border rounded-2xl p-5 border hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/30 transition duration-300 flex flex-col justify-between shadow-md">
      
      {/* Action Buttons Top Right (Only for Scorers) */}
      {isScorer && (
        <div className="absolute top-4 right-4 flex items-center space-x-1 sm:opacity-0 sm:group-hover:opacity-100 transition duration-200 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(player); }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition shadow"
            title="Edit Player Profile"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Are you sure you want to remove ${player.name} from the roster?`)) {
                onDelete(player.id);
              }
            }}
            className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800/60 transition shadow"
            title="Remove Player Profile"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="cursor-pointer" onClick={() => onSelect(player)}>
        <div className="flex items-start space-x-3.5 mb-4">
          <div className="relative flex-shrink-0">
            {player.avatarUrl ? (
              <img
                src={player.avatarUrl}
                alt={player.name}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/30 group-hover:ring-emerald-400/60 transition shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-200 ring-2 ring-slate-700">
                <User className="w-7 h-7" />
              </div>
            )}
            {player.jerseyNumber && (
              <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-md font-mono text-[10px] font-black border border-slate-900 shadow">
                #{player.jerseyNumber}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-extrabold text-white text-base group-hover:text-emerald-400 transition flex items-center space-x-1.5 truncate">
              <span className="truncate">{player.name}</span>
            </h3>
            
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] border ${roleColors[player.role]}`}>
                {player.role}
              </span>
              {player.country && (
                <span className="text-[11px] text-slate-200 font-bold flex items-center space-x-1 bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800/90">
                  <Globe className="w-3 h-3 text-emerald-400" />
                  <span>{player.country}</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 font-medium mt-1 truncate">
              {player.battingStyle} {player.bowlingStyle !== 'None' ? `• ${player.bowlingStyle}` : ''}
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-2 py-3 border-t border-b border-slate-800/80 my-2 text-xs">
          
          {/* Batting Stats */}
          <div className="bg-slate-900/60 dark:bg-slate-950/70 p-2.5 rounded-xl border border-slate-700/50 dark:border-slate-800/60">
            <div className="flex items-center space-x-1 text-slate-300 font-bold mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Batting</span>
            </div>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-slate-400 font-medium">Runs:</span>
              <span className="font-black text-white">{stats.totalRuns}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-400 font-medium">Avg / SR:</span>
              <span className="font-bold text-emerald-400">{batAvg} / {strikeRate}</span>
            </div>
          </div>

          {/* Bowling Stats */}
          <div className="bg-slate-900/60 dark:bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/60">
            <div className="flex items-center space-x-1 text-slate-300 font-bold mb-1">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bowling</span>
            </div>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-slate-400 font-medium">Wkts:</span>
              <span className="font-black text-white">{stats.wicketsTaken}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-400 font-medium">Econ / Avg:</span>
              <span className="font-bold text-emerald-400">{economy} / {bowlAvg}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 flex justify-between items-center text-xs text-slate-300 font-medium">
        <span>Matches: <strong className="text-white font-bold">{stats.matches}</strong></span>
        <button
          onClick={() => onSelect(player)}
          className="flex items-center space-x-1 text-emerald-400 font-bold hover:underline"
        >
          <Award className="w-3.5 h-3.5" />
          <span>Full Profile &rarr;</span>
        </button>
      </div>

    </div>
  );
};
export default PlayerCard;

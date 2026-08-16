import React from 'react';
import type { Player } from '../../types/cricket';
import { X, Globe, Camera, Flame, Shield, Trash2 } from 'lucide-react';

interface PlayerProfileModalProps {
  player: Player;
  onEdit?: (player: Player) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ player, onEdit, onDelete, onClose }) => {
  const { stats } = player;

  // Batting calculations
  const batDismissals = stats.inningsBatted - stats.notOuts;
  const batAvg = batDismissals > 0 ? (stats.totalRuns / batDismissals).toFixed(2) : (stats.totalRuns > 0 ? stats.totalRuns.toString() : '0.00');
  const strikeRate = stats.ballsFaced > 0 ? ((stats.totalRuns / stats.ballsFaced) * 100).toFixed(2) : '0.00';

  // Bowling calculations
  const totalOvers = stats.oversBowled + (stats.ballsBowled % 6) / 6;
  const economy = totalOvers > 0 ? (stats.runsConceded / totalOvers).toFixed(2) : '0.00';
  const bowlAvg = stats.wicketsTaken > 0 ? (stats.runsConceded / stats.wicketsTaken).toFixed(2) : '0.00';
  const bowlStrikeRate = stats.wicketsTaken > 0 ? (stats.ballsBowled / stats.wicketsTaken).toFixed(1) : '0.00';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="theme-bg-card theme-border border rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Close & Remove Buttons Header */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Player Career Profile</span>
          <div className="flex items-center space-x-2 pr-10">
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to remove ${player.name} from the roster?`)) {
                    onDelete(player.id);
                    onClose();
                  }
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-800/50 text-xs font-extrabold transition active:scale-95"
                title="Remove Player Profile"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Remove Profile</span>
              </button>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Section */}
        <div className="flex items-center space-x-4 mb-6 pb-6 border-b border-slate-800">
          <div className="relative group">
            {player.avatarUrl ? (
              <img
                src={player.avatarUrl}
                alt={player.name}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-emerald-500/20 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-800 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg">
                {player.name.substring(0, 2).toUpperCase()}
              </div>
            )}

            {/* Change Profile Photo Icon Overlay */}
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(player);
                }}
                className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/30 transition active:scale-95 border-2 border-slate-900"
                title="Change Profile Photo & Details"
              >
                <Camera className="w-4 h-4 font-black" />
              </button>
            )}

            {player.jerseyNumber && !onEdit && (
              <span className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 px-2 py-0.5 rounded-lg font-mono text-xs font-black border-2 border-slate-900 shadow">
                #{player.jerseyNumber}
              </span>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white player-card-name-text flex items-center space-x-2">
              <span>{player.name}</span>
            </h2>
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {player.role}
              </span>
              {player.country && (
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-950 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center space-x-1">
                  <Globe className="w-3 h-3 text-emerald-400" />
                  <span>{player.country}</span>
                </span>
              )}
              {player.age && (
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-950 text-slate-400 text-xs font-medium border border-slate-800">
                  Age: {player.age}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-2">
              {player.battingStyle} {player.bowlingStyle !== 'None' ? `• ${player.bowlingStyle}` : ''}
            </p>
          </div>
        </div>

        {/* Career Key Highlights Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl text-center shadow-sm">
            <p className="text-[11px] text-slate-400 font-black uppercase tracking-wider">Matches</p>
            <p className="text-2xl font-black text-slate-100 mt-1">{stats.matches}</p>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl text-center shadow-sm">
            <p className="text-[11px] text-slate-400 font-black uppercase tracking-wider">Runs</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{stats.totalRuns}</p>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl text-center shadow-sm">
            <p className="text-[11px] text-slate-400 font-black uppercase tracking-wider">Wickets</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{stats.wicketsTaken}</p>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl text-center shadow-sm">
            <p className="text-[11px] text-slate-400 font-black uppercase tracking-wider">High Score</p>
            <p className="text-2xl font-black text-blue-400 mt-1">{stats.highestScore}</p>
          </div>
        </div>

        {/* Batting Career Breakdown */}
        <div className="mb-6 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-amber-400 font-black text-base mb-4 border-b border-slate-800/60 pb-2.5">
            <Flame className="w-5 h-5" />
            <h3 className="text-slate-100">Batting Career Record</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">Innings Batted</span>
              <strong className="text-slate-100 font-black text-base">{stats.inningsBatted}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">Balls Faced</span>
              <strong className="text-slate-100 font-black text-base">{stats.ballsFaced}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">Not Outs</span>
              <strong className="text-slate-100 font-black text-base">{stats.notOuts}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">Batting Average</span>
              <strong className="text-emerald-400 font-black text-base">{batAvg}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">Strike Rate</span>
              <strong className="text-amber-400 font-black text-base">{strikeRate}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">Fours (4s)</span>
              <strong className="text-amber-400 font-black text-base">{stats.fours}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">Sixes (6s)</span>
              <strong className="text-amber-400 font-black text-base">{stats.sixes}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">Boundary Runs</span>
              <strong className="text-amber-400 font-black text-base">{stats.fours * 4 + stats.sixes * 6}</strong>
            </div>
          </div>
        </div>

        {/* Bowling Career Breakdown */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-emerald-400 font-black text-base mb-4 border-b border-slate-800/60 pb-2.5">
            <Shield className="w-5 h-5" />
            <h3 className="text-slate-100">Bowling Career Record</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">Innings Bowled</span>
              <strong className="text-slate-100 font-black text-base">{stats.inningsBowled}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">Overs Bowled</span>
              <strong className="text-slate-100 font-black text-base">{stats.oversBowled}.{stats.ballsBowled % 6}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">Runs Conceded</span>
              <strong className="text-slate-100 font-black text-base">{stats.runsConceded}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">Economy Rate</span>
              <strong className="text-emerald-400 font-black text-base">{economy}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">Bowling Average</span>
              <strong className="text-amber-400 font-black text-base">{bowlAvg}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">Bowling SR</span>
              <strong className="text-slate-100 font-black text-base">{bowlStrikeRate}</strong>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">Best Bowling</span>
              <strong className="text-emerald-400 font-black text-base">
                {stats.bestBowlingWickets > 0 ? `${stats.bestBowlingWickets}/${stats.bestBowlingRuns}` : 'N/A'}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold block mb-0.5">Maidens</span>
              <strong className="text-slate-100 font-black text-base">{stats.maidens}</strong>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default PlayerProfileModal;

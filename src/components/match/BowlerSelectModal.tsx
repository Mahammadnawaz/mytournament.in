import React, { useState } from 'react';
import { useCricket } from '../../context/CricketContext';
import { Shield, X, Check } from 'lucide-react';

interface BowlerSelectModalProps {
  onSelect: (bowlerId: string) => void;
  onClose: () => void;
  title?: string;
}

export const BowlerSelectModal: React.FC<BowlerSelectModalProps> = ({ onSelect, onClose, title }) => {
  const { players, activeMatch, activeInnings } = useCricket();

  if (!activeMatch || !activeInnings) return null;

  const bowlingTeamConfig = activeInnings.bowlingTeam === activeMatch.teamA.name ? activeMatch.teamA : activeMatch.teamB;
  const bowlingPlayers = players.filter(p => bowlingTeamConfig.playerIds.includes(p.id));

  const [selectedId, setSelectedId] = useState<string>(
    bowlingPlayers.find(p => p.id !== activeInnings.currentBowlerId)?.id || bowlingPlayers[0]?.id || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedId) {
      onSelect(selectedId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">{title || 'Select Next Bowler'}</h2>
            <p className="text-xs text-slate-400">Choose who will bowl the upcoming over</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {bowlingPlayers.map(p => {
              const bStats = activeInnings.bowlerStats[p.id];
              const isCurrent = p.id === activeInnings.currentBowlerId;
              const isSelected = p.id === selectedId;

              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full p-3 rounded-xl text-left border flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-bold text-sm flex items-center space-x-2">
                      <span>{p.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                          Bowled Last Over
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 block">
                      {p.bowlingStyle !== 'None' ? p.bowlingStyle : p.role}
                    </span>
                  </div>

                  <div className="text-right text-xs font-mono">
                    <div className="font-bold text-slate-200">
                      {bStats ? `${bStats.wickets}/${bStats.runsConceded}` : '0/0'}
                    </div>
                    <div className="text-slate-500">
                      {bStats ? `${bStats.overs}.${bStats.balls} ov` : '0 ov'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition text-sm active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Select Bowler</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
export default BowlerSelectModal;

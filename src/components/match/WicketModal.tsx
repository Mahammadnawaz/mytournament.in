import React, { useState } from 'react';
import { useCricket } from '../../context/CricketContext';
import type { DismissalType, WicketDetails } from '../../types/cricket';
import { Skull, X, Shield, User, Flame } from 'lucide-react';

interface WicketModalProps {
  onConfirm: (wicketInfo: WicketDetails, nextBatsmanId: string, isNoBall?: boolean) => void;
  onClose: () => void;
  initialDismissalType?: DismissalType;
  initialIsNoBall?: boolean;
}

export const WicketModal: React.FC<WicketModalProps> = ({ onConfirm, onClose, initialDismissalType, initialIsNoBall }) => {
  const { players, activeMatch, activeInnings } = useCricket();

  const [dismissalType, setDismissalType] = useState<DismissalType>(initialDismissalType || 'bowled');
  const [isNoBall, setIsNoBall] = useState<boolean>(initialIsNoBall || false);
  const [fielderId, setFielderId] = useState<string>('');
  const [runsCompleted, setRunsCompleted] = useState<number>(0);
  
  if (!activeMatch || !activeInnings) return null;

  const currentStrikerId = activeInnings.strikerId;
  const currentNonStrikerId = activeInnings.nonStrikerId;
  const currentBowlerId = activeInnings.currentBowlerId;

  const strikerPlayer = players.find(p => p.id === currentStrikerId);
  const nonStrikerPlayer = players.find(p => p.id === currentNonStrikerId);
  const bowlerPlayer = players.find(p => p.id === currentBowlerId);

  // Determine who got out (default striker, or user selects non-striker in run-out case)
  const [dismissedPlayerId, setDismissedPlayerId] = useState<string>(currentStrikerId);

  // Available batsmen from batting team who haven't batted or been out
  const battingTeamConfig = activeInnings.battingTeam === activeMatch.teamA.name ? activeMatch.teamA : activeMatch.teamB;
  const bowlingTeamConfig = activeInnings.bowlingTeam === activeMatch.teamA.name ? activeMatch.teamA : activeMatch.teamB;

  const outPlayerIds = Object.keys(activeInnings.batsmenStats).filter(id => activeInnings.batsmenStats[id].isOut);
  
  const availableNextBatsmen = players.filter(p => 
    battingTeamConfig.playerIds.includes(p.id) &&
    !outPlayerIds.includes(p.id) &&
    p.id !== currentStrikerId &&
    p.id !== currentNonStrikerId
  );

  const availableFielders = players.filter(p => bowlingTeamConfig.playerIds.includes(p.id));

  const [nextBatsmanId, setNextBatsmanId] = useState<string>(availableNextBatsmen[0]?.id || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(
      {
        type: dismissalType,
        dismissedPlayerId,
        bowlerId: currentBowlerId,
        fielderId: fielderId || undefined,
        runsCompleted: dismissalType === 'run-out' ? runsCompleted : 0,
      },
      nextBatsmanId,
      isNoBall
    );
    onClose();
  };

  const dismissalOptions: { type: DismissalType; label: string; icon: string }[] = [
    { type: 'bowled', label: 'Bowled (b)', icon: '🎳' },
    { type: 'caught', label: 'Caught (c)', icon: '🤲' },
    { type: 'run-out', label: 'Run Out', icon: '⚡' },
    { type: 'lbw', label: 'LBW', icon: '🦵' },
    { type: 'stumped', label: 'Stumped (st)', icon: '🏏' },
    { type: 'hit-wicket', label: 'Hit Wicket', icon: '💥' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-md w-full p-3.5 sm:p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-2.5 mb-3 pb-2.5 border-b border-slate-800">
          <div className="p-2 sm:p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
            <Skull className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">Record Wicket Dismissal</h2>
            <p className="text-[11px] text-slate-400 font-medium">Select dismissal type & incoming batsman</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3.5 text-xs">
          
          {/* Dismissal Method Selector Pills */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-200 mb-1.5">Select Dismissal Method *</label>
            <div className="grid grid-cols-3 gap-1.5">
              {dismissalOptions.map(opt => (
                <button
                  type="button"
                  key={opt.type}
                  onClick={() => setDismissalType(opt.type)}
                  className={`py-1.5 sm:py-2 px-1.5 rounded-xl text-[11px] font-bold transition flex items-center justify-center space-x-1 border ${
                    dismissalType === opt.type
                      ? 'bg-red-600 text-white border-red-400 shadow-md shadow-red-600/30'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            {/* No-Ball Penalty Toggle Button */}
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => setIsNoBall(prev => !prev)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-between border ${
                  isNoBall
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <span>⚠️</span>
                  <span>No-Ball Penalty (+1 Extra Run, Illegal Ball)</span>
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-black ${isNoBall ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {isNoBall ? 'ACTIVE (+1 NB)' : 'OFF'}
                </span>
              </button>
            </div>
          </div>

          {/* Dismissed Batsman */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-200 mb-1 flex items-center space-x-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Batsman Out *</span>
            </label>
            <select
              value={dismissedPlayerId}
              onChange={(e) => setDismissedPlayerId(e.target.value)}
              className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold outline-none text-xs"
            >
              <option value={currentStrikerId}>
                {strikerPlayer?.name || 'Striker'} (Striker)
              </option>
              {currentNonStrikerId && (
                <option value={currentNonStrikerId}>
                  {nonStrikerPlayer?.name || 'Non-Striker'} (Non-Striker)
                </option>
              )}
            </select>
          </div>

          {/* Bowler Badge */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center space-x-1.5 text-[11px]">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Active Bowler:</span>
            </span>
            <span className="font-bold text-white text-xs">{bowlerPlayer?.name || 'Current Bowler'}</span>
          </div>

          {/* Fielder / Catcher Selection (for Caught, Run Out, Stumped) */}
          {(dismissalType === 'caught' || dismissalType === 'run-out' || dismissalType === 'stumped') && (
            <div>
              <label className="block text-[11px] font-extrabold text-cyan-400 mb-1 flex items-center space-x-1">
                <User className="w-3.5 h-3.5" />
                <span>{dismissalType === 'caught' ? 'Catcher / Fielder Name *' : dismissalType === 'run-out' ? 'Fielder / Thrower Name *' : 'Wicket Keeper / Fielder *'}</span>
              </label>
              <select
                value={fielderId}
                onChange={(e) => setFielderId(e.target.value)}
                className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-slate-950 border border-cyan-500/50 text-slate-100 font-bold outline-none text-xs"
              >
                <option value="">Select Fielder ({activeInnings.bowlingTeam})...</option>
                {availableFielders.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.role})</option>
                ))}
              </select>
            </div>
          )}

          {/* Runs Completed Before Run Out (for Run Out dismissal) */}
          {dismissalType === 'run-out' && (
            <div>
              <label className="block text-[11px] font-extrabold text-amber-400 mb-1 flex items-center space-x-1">
                <Flame className="w-3.5 h-3.5" />
                <span>Runs Completed Before Run Out *</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 1, 2, 3].map((r) => (
                  <button
                    key={`runout-run-${r}`}
                    type="button"
                    onClick={() => setRunsCompleted(r)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-black transition border ${
                      runsCompleted === r
                        ? 'bg-amber-500 text-slate-950 border-white shadow'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {r} {r === 1 ? 'Run' : 'Runs'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Next Incoming Batsman */}
          <div>
            <label className="block text-[11px] font-extrabold text-emerald-400 mb-1">Next Incoming Batsman ({activeInnings.battingTeam}) *</label>
            {availableNextBatsmen.length > 0 ? (
              <select
                required
                value={nextBatsmanId}
                onChange={(e) => setNextBatsmanId(e.target.value)}
                className="w-full px-3 py-1.5 sm:py-2 rounded-xl bg-slate-950 border border-emerald-500/50 text-slate-100 font-bold outline-none text-xs"
              >
                {availableNextBatsmen.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                ))}
              </select>
            ) : (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-400 font-bold text-center">
                All out! No remaining batsmen left in playing XI.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-1.5 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-1.5 sm:py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold shadow-lg shadow-red-600/30 transition active:scale-95 text-xs"
            >
              <Skull className="w-3.5 h-3.5" />
              <span>Confirm Wicket</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default WicketModal;

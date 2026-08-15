import React, { useState } from 'react';
import { useCricket } from '../../context/CricketContext';
import { Trophy, CloudRain, Ban, ShieldAlert, X, Check, Handshake } from 'lucide-react';

interface EndMatchModalProps {
  onClose: () => void;
}

export const EndMatchModal: React.FC<EndMatchModalProps> = ({ onClose }) => {
  const { activeMatch, finishMatch, isScorer } = useCricket();

  if (!isScorer || !activeMatch) return null;

  const [decisionType, setDecisionType] = useState<'declare_winner' | 'rain_abandoned' | 'tied_draw' | 'called_off'>('declare_winner');
  const [selectedWinner, setSelectedWinner] = useState<string>(activeMatch.teamA.name);
  const [customReason, setCustomReason] = useState<string>('');

  const handleConfirm = () => {
    let resultMessage = '';

    if (decisionType === 'declare_winner') {
      const margin = customReason.trim() ? ` (${customReason.trim()})` : ' by Official Declaration';
      resultMessage = `${selectedWinner} won${margin}`;
    } else if (decisionType === 'rain_abandoned') {
      resultMessage = customReason.trim() ? `Match Abandoned: ${customReason.trim()}` : 'Match Abandoned due to Rain (No Result)';
    } else if (decisionType === 'tied_draw') {
      resultMessage = customReason.trim() ? `Match Drawn: ${customReason.trim()}` : 'Match Tied / Drawn';
    } else if (decisionType === 'called_off') {
      resultMessage = customReason.trim() ? `Match Called Off: ${customReason.trim()}` : 'Match Called Off by Umpires';
    }

    finishMatch(resultMessage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5 text-amber-400">
            <ShieldAlert className="w-6 h-6" />
            <h3 className="text-xl font-black text-white">End Match or Call Off</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Selection Tabs */}
        <div className="grid grid-cols-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setDecisionType('declare_winner')}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition ${
              decisionType === 'declare_winner'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span>Declare Winner</span>
          </button>

          <button
            type="button"
            onClick={() => setDecisionType('rain_abandoned')}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition ${
              decisionType === 'rain_abandoned'
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudRain className="w-5 h-5" />
            <span>Rain / Abandoned</span>
          </button>

          <button
            type="button"
            onClick={() => setDecisionType('tied_draw')}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition ${
              decisionType === 'tied_draw'
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Handshake className="w-5 h-5" />
            <span>Match Tied / Draw</span>
          </button>

          <button
            type="button"
            onClick={() => setDecisionType('called_off')}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition ${
              decisionType === 'called_off'
                ? 'bg-red-500/20 border-red-500/50 text-red-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ban className="w-5 h-5" />
            <span>Called Off / Cancel</span>
          </button>
        </div>

        {/* Configuration Details based on Decision */}
        <div className="space-y-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800 text-xs">
          {decisionType === 'declare_winner' && (
            <div className="space-y-3">
              <label className="block text-slate-300 font-bold">Select Winning Team</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWinner(activeMatch.teamA.name)}
                  className={`p-3 rounded-xl border text-center font-black truncate transition ${
                    selectedWinner === activeMatch.teamA.name
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  {activeMatch.teamA.name}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWinner(activeMatch.teamB.name)}
                  className={`p-3 rounded-xl border text-center font-black truncate transition ${
                    selectedWinner === activeMatch.teamB.name
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  {activeMatch.teamB.name}
                </button>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Winning Margin / Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. by 15 runs, by 4 wickets, by DLS method"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-medium outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {decisionType === 'rain_abandoned' && (
            <div className="space-y-2">
              <p className="text-slate-300 font-bold">🌧️ Match will be recorded as Abandoned / No Result.</p>
              <input
                type="text"
                placeholder="Reason (Optional e.g. Persistent Heavy Rain / Wet Outfield)"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-medium outline-none focus:border-cyan-500"
              />
            </div>
          )}

          {decisionType === 'tied_draw' && (
            <div className="space-y-2">
              <p className="text-slate-300 font-bold">🤝 Match will be finalized as a Tie / Draw with shared points.</p>
              <input
                type="text"
                placeholder="Remarks (Optional e.g. Scores level after 20 overs)"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-medium outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {decisionType === 'called_off' && (
            <div className="space-y-2">
              <p className="text-slate-300 font-bold">⛔ Match will be concluded as Called Off / Cancelled.</p>
              <input
                type="text"
                placeholder="Reason (Optional e.g. Bad Light, Ground Damage)"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-medium outline-none focus:border-red-500"
              />
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Confirm & Conclude Match</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default EndMatchModal;

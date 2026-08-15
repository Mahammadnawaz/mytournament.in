import React, { useState } from 'react';
import { useCricket } from '../../context/CricketContext';
import { calculateDLSParScore, calculateDLSRevisedTarget } from '../../utils/dlsEngine';
import { CloudRain, X, Calculator, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DLSModalProps {
  onClose: () => void;
}

export const DLSModal: React.FC<DLSModalProps> = ({ onClose }) => {
  const { activeMatch, applyDLSTarget } = useCricket();

  const originalOvers = activeMatch?.totalOvers || 20;
  const innings1Score = activeMatch?.innings1?.totalRuns || 150;

  // Interruption / Revision Form
  const [revisedOvers, setRevisedOvers] = useState<number>(
    activeMatch?.dlsRevisedOvers || Math.max(1, originalOvers - 2)
  );

  // DLS Calculation result
  const dlsResult = calculateDLSRevisedTarget(innings1Score, originalOvers, revisedOvers);

  // Standalone Interactive Calculator Tab state
  const [calcInnings1Runs, setCalcInnings1Runs] = useState<number>(innings1Score);
  const [calcTotalOvers, setCalcTotalOvers] = useState<number>(originalOvers);
  const [calcOversBowled, setCalcOversBowled] = useState<number>(3.4);
  const [calcWicketsLost, setCalcWicketsLost] = useState<number>(2);

  const calcParResult = calculateDLSParScore(
    calcInnings1Runs,
    calcTotalOvers,
    calcOversBowled,
    calcWicketsLost
  );

  const handleApplyDLS = () => {
    if (applyDLSTarget) {
      applyDLSTarget(dlsResult.revisedTarget, revisedOvers);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <CloudRain className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Duckworth-Lewis-Stern (DLS) Manager</h2>
            <p className="text-xs text-slate-400">Recalculate target for rain interruptions or check live DLS Par Score</p>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* SECTION 1: MATCH RAIN REVISION FORM */}
          {activeMatch ? (
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-cyan-400 tracking-wider flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Rain Interruption Adjustment</span>
                </span>
                {activeMatch.dlsApplied && (
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/40">
                    DLS APPLIED
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block font-medium">Original Overs</span>
                  <span className="text-lg font-black text-white font-mono">{originalOvers} ov</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block font-medium">Innings 1 Runs</span>
                  <span className="text-lg font-black text-amber-400 font-mono">{innings1Score} runs</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Revised Overs Limit (Due to Rain Delay)
                </label>
                <input
                  type="number"
                  min="1"
                  max={originalOvers}
                  value={revisedOvers}
                  onChange={(e) => setRevisedOvers(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-bold font-mono outline-none"
                />
              </div>

              {/* DLS Result Preview */}
              <div className="bg-gradient-to-r from-cyan-500/10 via-teal-500/15 to-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-cyan-400 block">DLS Calculated Target</span>
                  <span className="text-xs text-slate-300 font-medium">
                    {activeMatch.teamB.name} needs in {revisedOvers} overs
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    {dlsResult.revisedTarget} Runs
                  </span>
                </div>
              </div>

              <button
                onClick={handleApplyDLS}
                className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center justify-center space-x-2"
              >
                <Check className="w-4 h-4" />
                <span>Apply DLS Revised Target to Active Match</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-center text-xs text-slate-500">
              No active match in progress. Use interactive calculator below.
            </div>
          )}

          {/* SECTION 2: STANDALONE DLS PAR SCORE CALCULATOR TOOL */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 text-xs font-bold text-slate-300">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>Interactive DLS Par Score Simulator</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Innings 1 Total</label>
                <input
                  type="number"
                  value={calcInnings1Runs}
                  onChange={(e) => setCalcInnings1Runs(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Max Overs</label>
                <input
                  type="number"
                  value={calcTotalOvers}
                  onChange={(e) => setCalcTotalOvers(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Overs Bowled (Inn 2)</label>
                <input
                  type="number"
                  step="0.1"
                  value={calcOversBowled}
                  onChange={(e) => setCalcOversBowled(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Wickets Lost (Inn 2)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={calcWicketsLost}
                  onChange={(e) => setCalcWicketsLost(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">Calculated DLS Par Score</span>
              </div>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {calcParResult.parScore} Runs
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
export default DLSModal;

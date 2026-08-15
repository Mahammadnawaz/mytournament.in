import React, { useState } from 'react';
import { useCricket } from '../../context/CricketContext';
import type { ExtraType, WicketDetails, ShotZone } from '../../types/cricket';
import WicketModal from './WicketModal';
import BowlerSelectModal from './BowlerSelectModal';
import ShotZoneModal from './ShotZoneModal';
import { Undo2, Skull, Flame, Rocket, Zap, ChevronRight, X, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const ScoringControlPanel: React.FC = () => {
  const { activeMatch, activeInnings, scoreBall, undoLastBall, changeBowler } = useCricket();

  const [showWicketModal, setShowWicketModal] = useState(false);
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  
  // Pending Extra Runs Modal state
  const [pendingExtraType, setPendingExtraType] = useState<ExtraType | null>(null);

  // Pending Boundary Shot Zone Modal state (for 4s & 6s)
  const [pendingBoundaryRuns, setPendingBoundaryRuns] = useState<number | null>(null);

  // Interactive Live Event Flash Banner state
  const [liveEventAlert, setLiveEventAlert] = useState<{
    type: 'four' | 'six' | 'wicket' | 'over';
    title: string;
    subtitle: string;
  } | null>(null);

  if (!activeMatch || !activeInnings || activeMatch.status !== 'live') {
    return null;
  }

  const triggerEventAlert = (type: 'four' | 'six' | 'wicket' | 'over', title: string, subtitle: string) => {
    setLiveEventAlert({ type, title, subtitle });
    setTimeout(() => setLiveEventAlert(null), 2000);
  };

  const handleProcessBallResult = (result?: { needBowlerChange: boolean; overCompleted: boolean; inningsCompleted: boolean }) => {
    if (result?.needBowlerChange) {
      triggerEventAlert('over', '🔔 OVER COMPLETED!', 'Select next bowler to continue scoring');
      setShowBowlerModal(true);
    }
  };

  const handleNormalRunClick = (runs: number) => {
    if (runs === 4 || runs === 6) {
      setPendingBoundaryRuns(runs);
      return;
    }

    const result = scoreBall({
      runsScored: runs,
      extraType: 'none',
      extraRuns: 0,
      isWicket: false,
    });

    handleProcessBallResult(result);
  };

  const handleBoundaryShotConfirm = (shotZone: ShotZone) => {
    const runs = pendingBoundaryRuns || 4;
    setPendingBoundaryRuns(null);

    if (runs === 4) {
      triggerEventAlert('four', `🔥 BOUNDARY FOUR! (${shotZone})`, 'Smashed to the fence!');
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.85 } });
    } else if (runs === 6) {
      triggerEventAlert('six', `🚀 MAXIMUM SIX! (${shotZone})`, 'Out of the stadium!');
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.75 } });
    }

    const result = scoreBall({
      runsScored: runs,
      extraType: 'none',
      extraRuns: 0,
      isWicket: false,
      shotZone,
    });

    handleProcessBallResult(result);
  };

  const handleExtraRunSubmit = (additionalRuns: number) => {
    if (!pendingExtraType) return;

    const extraType = pendingExtraType;
    setPendingExtraType(null);

    let runsScored = 0;
    let extraRuns = 0;

    if (extraType === 'no-ball') {
      runsScored = additionalRuns; // Bat runs scored off No Ball
      extraRuns = 1;               // No ball penalty
    } else if (extraType === 'wide') {
      runsScored = 0;
      extraRuns = additionalRuns;  // Wide extra runs (includes penalty + bye runs)
    } else if (extraType === 'bye' || extraType === 'leg-bye') {
      runsScored = 0;
      extraRuns = additionalRuns;  // Bye / Leg Bye runs
    }

    if (additionalRuns === 4) {
      triggerEventAlert('four', '🔥 BOUNDARY FOUR!', `4 Runs off ${extraType.toUpperCase()}`);
    } else if (additionalRuns === 6) {
      triggerEventAlert('six', '🚀 MAXIMUM SIX!', `6 Runs off ${extraType.toUpperCase()}`);
    }

    const result = scoreBall({
      runsScored,
      extraType,
      extraRuns,
      isWicket: false,
    });

    handleProcessBallResult(result);
  };

  const handleWicketConfirm = (wicketInfo: WicketDetails, nextBatsmanId: string) => {
    triggerEventAlert('wicket', '⚡ WICKET DOWN! OUT!', `${wicketInfo.type.toUpperCase()}`);
    const result = scoreBall({
      runsScored: 0,
      extraType: 'none',
      extraRuns: 0,
      isWicket: true,
      wicketInfo,
      nextBatsmanId,
    });

    handleProcessBallResult(result);
  };

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-2xl space-y-3 sm:space-y-5 relative overflow-hidden">
        
        {/* INTERACTIVE EVENT FLASH BANNER (4, 6, WICKET, OVER) */}
        {liveEventAlert && (
          <div
            className={`absolute inset-x-0 top-0 z-20 py-2 px-3 text-center font-black transition animate-bounce-subtle flex items-center justify-center space-x-2 ${
              liveEventAlert.type === 'six'
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/50'
                : liveEventAlert.type === 'four'
                ? 'bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50'
                : liveEventAlert.type === 'over'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 text-white shadow-lg shadow-blue-500/50'
                : 'bg-gradient-to-r from-red-600 via-rose-500 to-red-600 text-white shadow-lg shadow-red-500/50'
            }`}
          >
            {liveEventAlert.type === 'six' && <Rocket className="w-4 h-4 animate-pulse" />}
            {liveEventAlert.type === 'four' && <Flame className="w-4 h-4 animate-pulse" />}
            {liveEventAlert.type === 'wicket' && <Zap className="w-4 h-4 animate-pulse" />}
            {liveEventAlert.type === 'over' && <ChevronRight className="w-4 h-4 animate-pulse" />}
            <div>
              <span className="text-xs sm:text-sm uppercase tracking-wide">{liveEventAlert.title}</span>
              <span className="text-[10px] sm:text-xs font-semibold ml-2 opacity-90">• {liveEventAlert.subtitle}</span>
            </div>
          </div>
        )}

        {/* Controls Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 sm:pb-3 text-xs">
          <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] sm:text-xs">
            Live Scoring Controls
          </span>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              onClick={() => setShowBowlerModal(true)}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-400 font-bold transition text-[11px] sm:text-xs flex items-center space-x-1"
            >
              <span>Change Bowler</span>
            </button>

            <button
              onClick={undoLastBall}
              disabled={activeInnings.ballLogs.length === 0}
              className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-semibold transition text-[11px] sm:text-xs active:scale-95"
              title="Undo last recorded ball"
            >
              <Undo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span>Undo Ball</span>
            </button>
          </div>
        </div>

        {/* Extras Quick Trigger Selector Pills */}
        <div>
          <span className="text-[10px] sm:text-xs text-slate-400 font-medium block mb-1.5">Select Extra Type:</span>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setPendingExtraType('wide')}
              className="py-1.5 sm:py-2.5 px-1.5 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition border bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 active:scale-95 flex items-center justify-between"
            >
              <span>Wd</span>
              <span className="text-[9px] sm:text-[10px] bg-amber-500/20 px-1 py-0.2 rounded font-mono">+Runs</span>
            </button>

            <button
              type="button"
              onClick={() => setPendingExtraType('no-ball')}
              className="py-1.5 sm:py-2.5 px-1.5 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition border bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20 active:scale-95 flex items-center justify-between"
            >
              <span>NB</span>
              <span className="text-[9px] sm:text-[10px] bg-rose-500/20 px-1 py-0.2 rounded font-mono">+Runs</span>
            </button>

            <button
              type="button"
              onClick={() => setPendingExtraType('bye')}
              className="py-1.5 sm:py-2.5 px-1.5 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition border bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20 active:scale-95 flex items-center justify-between"
            >
              <span>Bye</span>
              <span className="text-[9px] sm:text-[10px] bg-cyan-500/20 px-1 py-0.2 rounded font-mono">+Runs</span>
            </button>

            <button
              type="button"
              onClick={() => setPendingExtraType('leg-bye')}
              className="py-1.5 sm:py-2.5 px-1.5 sm:px-3 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition border bg-teal-500/10 text-teal-400 border-teal-500/30 hover:bg-teal-500/20 active:scale-95 flex items-center justify-between"
            >
              <span>LB</span>
              <span className="text-[9px] sm:text-[10px] bg-teal-500/20 px-1 py-0.2 rounded font-mono">+Runs</span>
            </button>
          </div>
        </div>

        {/* Quick Action Normal Scoring Buttons Grid (Single 7-Column Row on Mobile) */}
        <div className="space-y-1.5">
          <span className="text-[10px] sm:text-xs text-slate-400 font-medium block">Batting Runs & Wicket:</span>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
            {[0, 1, 2, 3, 4, 6].map((run) => (
              <button
                key={`run-${run}`}
                onClick={() => handleNormalRunClick(run)}
                className={`py-2 sm:py-4 rounded-xl sm:rounded-2xl font-black text-base sm:text-2xl font-mono shadow-md transition active:scale-95 flex flex-col items-center justify-center border ${
                  run === 6
                    ? 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 hover:from-purple-500 hover:to-indigo-500 text-white border-amber-400 shadow-amber-500/20 ring-1 sm:ring-2 ring-amber-400/40'
                    : run === 4
                    ? 'bg-gradient-to-tr from-blue-600 via-cyan-600 to-emerald-500 hover:from-blue-500 hover:to-cyan-500 text-white border-emerald-400 shadow-emerald-500/20 ring-1 sm:ring-2 ring-emerald-400/40'
                    : run === 0
                    ? 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
                    : 'run-btn-green shadow-emerald-950/50'
                }`}
              >
                <span className="text-white">{run}</span>
                <span className="text-[8px] sm:text-[10px] font-sans font-medium text-slate-100 opacity-90 leading-tight">
                  {run === 0 ? 'Dot' : run === 4 ? '4' : run === 6 ? '6' : `${run}R`}
                </span>
              </button>
            ))}

            {/* Wicket Button */}
            <button
              onClick={() => setShowWicketModal(true)}
              className="py-2 sm:py-4 rounded-xl sm:rounded-2xl font-black text-base sm:text-2xl font-mono bg-gradient-to-tr from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white border border-red-400 shadow-md shadow-red-950/50 transition active:scale-95 flex flex-col items-center justify-center ring-1 sm:ring-2 ring-red-500/40"
              title="Record Wicket Out"
            >
              <Skull className="w-4 h-4 sm:w-6 sm:h-6 mb-0.5" />
              <span className="text-[8px] sm:text-xs font-bold uppercase font-sans">OUT</span>
            </button>
          </div>
        </div>

      </div>

      {/* POPUP MODAL FOR EXTRAS RUNS SELECTION (WIDE, NO BALL, BYES, LEG BYES) */}
      {pendingExtraType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            
            <button
              onClick={() => setPendingExtraType(null)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-5">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white uppercase">
                  {pendingExtraType === 'wide' ? 'Wide Ball (Wd)' : pendingExtraType === 'no-ball' ? 'No Ball (NB)' : pendingExtraType === 'bye' ? 'Byes (B)' : 'Leg Byes (LB)'}
                </h3>
                <p className="text-xs text-slate-400">Select additional runs scored off this extra ball</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1">
                {pendingExtraType === 'wide' && (
                  <p>1 penalty run added automatically + selected extra runs below.</p>
                )}
                {pendingExtraType === 'no-ball' && (
                  <p>1 penalty run added automatically + bat runs scored by batsman.</p>
                )}
                {(pendingExtraType === 'bye' || pendingExtraType === 'leg-bye') && (
                  <p>Ball counts as legal. Select total bye runs taken by batsmen.</p>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                {[0, 1, 2, 3, 4, 5, 6].map((addRun) => (
                  <button
                    key={`extra-run-${addRun}`}
                    type="button"
                    onClick={() => handleExtraRunSubmit(addRun)}
                    className={`py-3.5 rounded-2xl font-mono font-black text-lg transition active:scale-95 border ${
                      addRun === 4
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                        : addRun === 6
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-slate-950 hover:bg-slate-800 text-white border-slate-800'
                    }`}
                  >
                    <span>+{addRun}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setPendingExtraType(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Ground Zone Selector Modal for 4s & 6s */}
      {pendingBoundaryRuns !== null && (
        <ShotZoneModal
          runs={pendingBoundaryRuns}
          onSelectZone={handleBoundaryShotConfirm}
          onClose={() => setPendingBoundaryRuns(null)}
        />
      )}

      {/* Wicket Details Modal */}
      {showWicketModal && (
        <WicketModal
          onConfirm={handleWicketConfirm}
          onClose={() => setShowWicketModal(false)}
        />
      )}

      {/* Change / Next Bowler Selection Modal */}
      {showBowlerModal && (
        <BowlerSelectModal
          onSelect={(bowlerId) => {
            changeBowler(bowlerId);
            setShowBowlerModal(false);
          }}
          onClose={() => setShowBowlerModal(false)}
        />
      )}
    </>
  );
};
export default ScoringControlPanel;

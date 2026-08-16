import React, { useState, useEffect } from 'react';
import { useCricket } from '../../context/CricketContext';
import { Trophy, Activity, CloudRain, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import MatchPOTMModal from './MatchPOTMModal';
import DLSModal from './DLSModal';
import EndMatchModal from './EndMatchModal';
import { calculateDLSParScore } from '../../utils/dlsEngine';

export const LiveScoreboard: React.FC = () => {
  const { activeMatch, activeInnings, setActiveTab, isScorer } = useCricket();

  const [showPOTM, setShowPOTM] = useState(false);
  const [showDLSModal, setShowDLSModal] = useState(false);
  const [showEndMatchModal, setShowEndMatchModal] = useState(false);

  // Auto-show POTM modal ONCE right when match flips to 'completed'
  useEffect(() => {
    if (
      activeMatch?.status === 'completed' &&
      activeMatch.potmInfo &&
      !sessionStorage.getItem(`potm_shown_${activeMatch.id}`)
    ) {
      sessionStorage.setItem(`potm_shown_${activeMatch.id}`, 'true');
      const timer = setTimeout(() => setShowPOTM(true), 600);
      return () => clearTimeout(timer);
    }
  }, [activeMatch?.status, activeMatch?.id, activeMatch?.potmInfo]);

  // Confetti on match completion
  useEffect(() => {
    if (activeMatch?.status === 'completed' && activeMatch.result) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [activeMatch?.status, activeMatch?.result]);

  if (!activeMatch || !activeInnings) {
    return null;
  }

  const { totalRuns, wickets, overs, balls, target } = activeInnings;
  const oversFloat = overs + balls / 6;
  const currentRunRate = oversFloat > 0 ? (totalRuns / oversFloat).toFixed(2) : '0.00';

  let requiredRunRate = '0.00';
  let runsNeeded = 0;
  let remainingBalls = 0;
  let dlsParInfo: { parScore: number; statusMessage: string; isAhead: boolean } | null = null;

  if (activeMatch.currentInnings === 2 && target) {
    runsNeeded = Math.max(0, target - totalRuns);
    const totalMatchBalls = activeMatch.totalOvers * 6;
    const currentBallsBowled = overs * 6 + balls;
    remainingBalls = Math.max(0, totalMatchBalls - currentBallsBowled);
    const remainingOversFloat = remainingBalls / 6;
    requiredRunRate = remainingOversFloat > 0 ? (runsNeeded / remainingOversFloat).toFixed(2) : '0.00';

    // Calculate live DLS Par score for Innings 2
    const innings1Runs = activeMatch.innings1?.totalRuns || 100;
    dlsParInfo = calculateDLSParScore(innings1Runs, activeMatch.totalOvers, oversFloat, wickets);
  }

  const handlePOTMClose = () => {
    setShowPOTM(false);
    setActiveTab('scorecard');
  };

  return (
    <>
      <div className="relative overflow-hidden theme-bg-card theme-border rounded-3xl p-4 sm:p-8 shadow-2xl border live-scoreboard-card">
        
        {/* Background Subtle Gradient Overlay */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Innings Break Banner (Visible to Spectators & Scorers) */}
        {activeMatch.currentInnings === 1 && activeMatch.innings1?.isCompleted && !activeMatch.innings2 && (
          <div className="mb-6 bg-gradient-to-r from-emerald-500/15 via-teal-500/20 to-emerald-500/15 border border-emerald-500/40 rounded-2xl p-4 text-center space-y-1.5 animate-fade-in">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center justify-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>☕ Innings Break • Target: {activeMatch.innings1.totalRuns + 1} Runs</span>
            </span>
            <p className="text-sm sm:text-base font-extrabold scoreboard-team-name">
              {activeMatch.innings1.bowlingTeam} needs <span className="text-emerald-500 font-mono text-lg">{activeMatch.innings1.totalRuns + 1}</span> runs in {activeMatch.totalOvers} overs to win
            </p>
            <p className="text-xs scoreboard-overs-text">
              Waiting for the official scorer to start the 2nd innings chase...
            </p>
          </div>
        )}

        {/* Match Result Banner */}
        {activeMatch.status === 'completed' && (
          <div className="mb-6 bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-amber-500/40 rounded-2xl p-4 text-center space-y-3">
            <div className="flex items-center justify-center space-x-2 text-amber-500 font-extrabold text-lg sm:text-xl">
              <Trophy className="w-6 h-6" />
              <span>{activeMatch.result || 'Match Ended'}</span>
            </div>

            {activeMatch.potmInfo && (() => {
              const { players } = useCricket();
              const potmPlayer = players.find(p => p.id === activeMatch.potmInfo?.playerId);
              return potmPlayer ? (
                <button
                  onClick={() => setShowPOTM(true)}
                  className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold hover:bg-amber-500/30 transition"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>🌟 POTM: {potmPlayer.name} — tap to see award</span>
                </button>
              ) : null;
            })()}
          </div>
        )}

        {/* Match Info Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4 mb-6 text-xs scoreboard-overs-text">
          <div className="flex items-center space-x-2 font-medium">
            <span className="scoreboard-team-name font-bold">{activeMatch.name}</span>
            <span>•</span>
            <span>{activeMatch.venue}</span>
            {activeMatch.dlsApplied && (
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold text-[10px]">
                DLS REVISED ({activeMatch.dlsRevisedOvers} OV)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {isScorer && activeMatch.status === 'live' && (
              <button
                onClick={() => setShowEndMatchModal(true)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-[11px] transition active:scale-95 shadow-sm"
                title="Conclude match early or call off due to rain/draw"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>End Match / Call Off</span>
              </button>
            )}

            {isScorer && (
              <button
                onClick={() => setShowDLSModal(true)}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold text-[11px] transition"
                title="Duckworth-Lewis-Stern Rain Calculator & Adjustment"
              >
                <CloudRain className="w-3.5 h-3.5" />
                <span>DLS Manager</span>
              </button>
            )}

            <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 scoreboard-team-name font-bold text-[11px]">
              Innings {activeMatch.currentInnings} of 2
            </span>
            <span className="flex items-center space-x-1 text-emerald-500 font-semibold text-[11px]">
              <Activity className="w-3.5 h-3.5" />
              <span>Max Overs: {activeMatch.dlsRevisedOvers || activeMatch.totalOvers}</span>
            </span>
          </div>
        </div>

        {/* Main Score Board Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Left/Center: Team & Huge Score */}
          <div className="md:col-span-8 space-y-2">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-wide scoreboard-team-name">
                {activeInnings.battingTeam}
              </h2>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-bold">
                Batting
              </span>
            </div>

            <div className="flex items-baseline space-x-4">
              <div className="text-5xl sm:text-7xl font-black tracking-tight font-mono scoreboard-score-runs">
                {totalRuns}<span className="text-slate-400 text-4xl sm:text-5xl">/</span>{wickets}
              </div>

              <div className="text-lg sm:text-xl font-semibold font-mono scoreboard-overs-text">
                ({overs}.{balls} / {activeMatch.dlsRevisedOvers || activeMatch.totalOvers} overs)
              </div>
            </div>

            <p className="text-xs scoreboard-overs-text">
              vs <strong className="scoreboard-team-name">{activeInnings.bowlingTeam}</strong>
            </p>
          </div>

          {/* Right Column: Run Rates & DLS Target Tracker */}
          <div className="md:col-span-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 theme-runrate-panel">
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold theme-crr-label">Current Run Rate (CRR):</span>
              <span className="text-emerald-400 font-black text-base font-mono theme-crr-value">{currentRunRate}</span>
            </div>

            {activeMatch.currentInnings === 2 && target && (
              <>
                <div className="border-t border-slate-800/80 pt-2.5 flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold theme-target-label">
                    {activeMatch.dlsApplied ? 'DLS Revised Target:' : 'Target Score:'}
                  </span>
                  <span className="text-amber-400 font-black text-base font-mono theme-target-value">{target}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold theme-rrr-label">Required Run Rate (RRR):</span>
                  <span className="text-amber-400 font-black text-base font-mono theme-rrr-value">{requiredRunRate}</span>
                </div>

                {/* LIVE DLS PAR SCORE BADGE */}
                {dlsParInfo && (
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-2.5 text-xs space-y-1 theme-dls-badge">
                    <div className="flex justify-between items-center">
                      <span className="text-cyan-400 font-extrabold flex items-center space-x-1">
                        <CloudRain className="w-3.5 h-3.5" />
                        <span>DLS Par Score:</span>
                      </span>
                      <span className="font-mono font-black text-cyan-300 text-sm">
                        {dlsParInfo.parScore}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex justify-between font-semibold">
                      <span>Current: {totalRuns} runs</span>
                      <span className={totalRuns >= dlsParInfo.parScore ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {totalRuns >= dlsParInfo.parScore 
                          ? `(Ahead by ${totalRuns - dlsParInfo.parScore} runs)` 
                          : `(Behind by ${dlsParInfo.parScore - totalRuns} runs)`}
                      </span>
                    </div>
                  </div>
                )}

                {activeMatch.status === 'live' && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-center text-xs theme-runs-needed-badge">
                    <span className="text-amber-300 font-extrabold">
                      Need {runsNeeded} runs off {remainingBalls} balls
                    </span>
                  </div>
                )}
              </>
            )}

            {activeMatch.currentInnings === 1 && (
              <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-2.5 text-center text-xs font-bold text-slate-300 theme-innings-subtext">
                Setting target score for 2nd innings
              </div>
            )}

          </div>

        </div>

      </div>

      {/* POTM Award Modal */}
      {showPOTM && <MatchPOTMModal onClose={handlePOTMClose} />}

      {/* DLS Manager Modal */}
      {showDLSModal && <DLSModal onClose={() => setShowDLSModal(false)} />}

      {/* End Match / Call Off Modal */}
      {showEndMatchModal && <EndMatchModal onClose={() => setShowEndMatchModal(false)} />}
    </>
  );
};

export default LiveScoreboard;

import React, { useState, useEffect, useRef } from 'react';
import { useCricket } from '../../context/CricketContext';
import confetti from 'canvas-confetti';

export interface DuckEvent {
  id: string;
  batsmanName: string;
  battingStyle: string;
  direction: 'right' | 'left';
}

export interface ScoreBurstEvent {
  id: string;
  text: string;
  subText?: string;
  colorType: 'four' | 'six' | 'wicket' | 'runs' | 'extra';
}

export const LiveCelebrationOverlay: React.FC = () => {
  const { activeInnings, players } = useCricket();
  const [duckEvent, setDuckEvent] = useState<DuckEvent | null>(null);
  const [scoreBurst, setScoreBurst] = useState<ScoreBurstEvent | null>(null);
  const lastProcessedBallIdRef = useRef<string | null>(null);

  // Detect live ball events from activeInnings.ballLogs
  useEffect(() => {
    if (!activeInnings || !activeInnings.ballLogs || activeInnings.ballLogs.length === 0) {
      return;
    }

    const latestBall = activeInnings.ballLogs[activeInnings.ballLogs.length - 1];
    if (!latestBall || latestBall.id === lastProcessedBallIdRef.current) {
      return;
    }

    lastProcessedBallIdRef.current = latestBall.id;

    // 1. Duck Dismissal: Wicket with 0 runs
    if (latestBall.isWicket && latestBall.wicketInfo) {
      const outBatsmanId = latestBall.wicketInfo.dismissedPlayerId || latestBall.strikerId;
      const outPlayer = players.find(p => p.id === outBatsmanId);
      const outBatsmanStats = activeInnings.batsmenStats[outBatsmanId];
      
      const isDuck = outBatsmanStats && outBatsmanStats.runs === 0;
      if (isDuck) {
        const isLeftHand = outPlayer?.battingStyle?.toLowerCase().includes('left');
        const direction: 'right' | 'left' = isLeftHand ? 'left' : 'right';

        setDuckEvent({
          id: `duck-${Date.now()}`,
          batsmanName: outPlayer?.name || 'Batsman',
          battingStyle: outPlayer?.battingStyle || 'Right-hand',
          direction,
        });

        setTimeout(() => setDuckEvent(null), 6000);
      }
    }

    // 2. Determine Score Burst Number & Celebration
    if (latestBall.isWicket) {
      setScoreBurst({
        id: `burst-${Date.now()}`,
        text: 'W',
        subText: 'WICKET!',
        colorType: 'wicket',
      });
    } else if (latestBall.runsScored === 6) {
      // Golden Maximum Six Celebration
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.65 },
        colors: ['#f59e0b', '#fbbf24', '#ef4444', '#10b981', '#38bdf8']
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.65 },
        colors: ['#f59e0b', '#fbbf24', '#ef4444', '#10b981', '#38bdf8']
      });
      confetti({
        particleCount: 110,
        spread: 100,
        origin: { y: 0.45 },
        colors: ['#f59e0b', '#fbbf24', '#ef4444', '#10b981', '#38bdf8']
      });

      setScoreBurst({
        id: `burst-${Date.now()}`,
        text: '6',
        subText: 'MAXIMUM SIX!',
        colorType: 'six',
      });
    } else if (latestBall.runsScored === 4) {
      // Emerald Four Celebration
      confetti({
        particleCount: 65,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#059669', '#38bdf8']
      });

      setScoreBurst({
        id: `burst-${Date.now()}`,
        text: '4',
        subText: 'FOUR!',
        colorType: 'four',
      });
    } else if (latestBall.extras && latestBall.extras.type !== 'none') {
      const extraLabel = latestBall.extras.type === 'wide' ? 'WD' : latestBall.extras.type === 'no-ball' ? 'NB' : 'EXT';
      setScoreBurst({
        id: `burst-${Date.now()}`,
        text: `${extraLabel}+${latestBall.totalRuns}`,
        subText: 'EXTRA',
        colorType: 'extra',
      });
    } else if (latestBall.runsScored > 0) {
      setScoreBurst({
        id: `burst-${Date.now()}`,
        text: `${latestBall.runsScored}`,
        subText: latestBall.runsScored === 1 ? 'SINGLE' : latestBall.runsScored === 2 ? 'DOUBLE' : 'THREE',
        colorType: 'runs',
      });
    } else {
      setScoreBurst({
        id: `burst-${Date.now()}`,
        text: '0',
        subText: 'DOT BALL',
        colorType: 'runs',
      });
    }

    const timer = setTimeout(() => setScoreBurst(null), 2200);
    return () => clearTimeout(timer);

  }, [activeInnings?.ballLogs?.length, players, activeInnings]);

  return (
    <>
      {/* ── LIVE SCORE ON SCREEN BURST ANIMATION (2.2s AUTO DISAPPEAR) ── */}
      {scoreBurst && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="flex flex-col items-center justify-center animate-score-pop-fade">
            <div
              className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center font-black font-mono shadow-2xl border-4 backdrop-blur-md transition-transform ${
                scoreBurst.colorType === 'six'
                  ? 'bg-amber-500/90 border-amber-300 text-slate-950 shadow-amber-500/60 text-6xl sm:text-7xl animate-pulse ring-8 ring-amber-400/30'
                  : scoreBurst.colorType === 'four'
                  ? 'bg-emerald-500/90 border-emerald-300 text-slate-950 shadow-emerald-500/60 text-6xl sm:text-7xl animate-pulse ring-8 ring-emerald-400/30'
                  : scoreBurst.colorType === 'wicket'
                  ? 'bg-red-600/95 border-red-300 text-white shadow-red-600/60 text-6xl sm:text-7xl ring-8 ring-red-500/30'
                  : scoreBurst.colorType === 'extra'
                  ? 'bg-cyan-500/90 border-cyan-300 text-slate-950 shadow-cyan-500/50 text-4xl sm:text-5xl'
                  : 'bg-slate-900/90 border-slate-700 text-white shadow-slate-950/60 text-5xl sm:text-6xl'
              }`}
            >
              {scoreBurst.text}
            </div>

            {scoreBurst.subText && (
              <span className="mt-2 px-3.5 py-1 rounded-full bg-slate-950/90 border border-slate-800 text-xs sm:text-sm font-black uppercase tracking-widest text-white shadow-xl">
                {scoreBurst.subText}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── DUCK OUT TRANSPARENT WALKING CHARACTER ── */}
      {duckEvent && (
        <div className="fixed bottom-14 sm:bottom-20 left-0 right-0 z-50 pointer-events-none overflow-hidden h-40">
          <div 
            className={`absolute flex items-center space-x-3 pointer-events-none drop-shadow-2xl ${
              duckEvent.direction === 'right' 
                ? 'animate-duck-walk-right' 
                : 'animate-duck-walk-left'
            }`}
          >
            <div className="relative flex flex-col items-center">
              {/* Sad Tears Animation */}
              <div className="absolute -top-3 left-6 flex space-x-1 animate-bounce">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-md shadow-cyan-300"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-300"></span>
              </div>

              {/* Reference Duck Image with Cricket Bat */}
              <img
                src="/assets/cricket_duck.png"
                alt="Duck with Bat"
                className={`w-28 h-28 sm:w-36 sm:h-36 object-contain select-none filter drop-shadow-2xl ${
                  duckEvent.direction === 'left' ? 'scale-x-[-1]' : ''
                }`}
              />

              <span className="text-[10px] sm:text-xs font-black bg-red-600/90 text-white px-2.5 py-0.5 rounded-full shadow-lg mt-0.5 whitespace-nowrap border border-red-400/50">
                0 Runs (Duck)
              </span>
            </div>

            {/* Transparent floating speech pill */}
            <div className="bg-slate-950/85 backdrop-blur-sm border border-slate-700/80 px-3.5 py-2 rounded-2xl shadow-2xl">
              <span className="text-xs sm:text-sm font-black text-amber-300 block whitespace-nowrap">
                😢 {duckEvent.batsmanName}
              </span>
              <span className="text-[10px] text-slate-300 font-bold block whitespace-nowrap">
                {duckEvent.direction === 'right' ? 'Walking to Right Pavilion ➔' : '⬅ Walking to Left Pavilion'}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LiveCelebrationOverlay;

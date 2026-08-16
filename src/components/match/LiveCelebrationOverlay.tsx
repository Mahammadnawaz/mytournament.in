import React, { useState, useEffect, useRef } from 'react';
import { useCricket } from '../../context/CricketContext';
import type { BallLog } from '../../types/cricket';
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
  colorType: 'four' | 'six' | 'three' | 'two' | 'one' | 'dot' | 'wicket' | 'hattrick' | 'wide' | 'noball' | 'byes' | 'legbyes';
}

export const LiveCelebrationOverlay: React.FC = () => {
  const { activeMatch, activeInnings, players, isScorer } = useCricket();
  const [duckEvent, setDuckEvent] = useState<DuckEvent | null>(null);
  const [scoreBurst, setScoreBurst] = useState<ScoreBurstEvent | null>(null);
  const isInitialMount = useRef(true);
  const lastProcessedBallKeyRef = useRef<string | null>(null);

  // Helper to ensure array conversion
  const ensureArray = <T,>(val: any): T[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'object') return Object.values(val);
    return [];
  };

  // Set initial mount bookmark on first render so only existing historical balls are silenced
  useEffect(() => {
    const initialBalls = ensureArray<BallLog>(activeInnings?.ballLogs);
    if (initialBalls.length > 0) {
      const initLatest = initialBalls[initialBalls.length - 1];
      lastProcessedBallKeyRef.current = initLatest.id || `${activeInnings?.inningsNo}-${activeInnings?.overs}.${activeInnings?.balls}-${initLatest.timestamp || initLatest.totalRuns}-${initialBalls.length}`;
    }
    const timer = setTimeout(() => {
      isInitialMount.current = false;
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const lastBurstTimestampRef = useRef<number>(0);

  // 1. Direct Real-Time Delivery Score Pop Trigger from Firebase for Spectators
  useEffect(() => {
    if (isScorer) return;
    const burst = activeMatch?.latestDeliveryBurst;
    if (!burst || !burst.timestamp) return;
    if (lastBurstTimestampRef.current === burst.timestamp) return;

    lastBurstTimestampRef.current = burst.timestamp;
    setScoreBurst({
      id: burst.id,
      text: burst.text,
      subText: burst.subText,
      colorType: burst.colorType,
    });

    if (burst.colorType === 'six' || burst.colorType === 'four') {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.65 }, colors: ['#f59e0b', '#fbbf24', '#ef4444', '#10b981', '#38bdf8'] });
    } else if (burst.colorType === 'hattrick') {
      confetti({ particleCount: 140, spread: 120, origin: { y: 0.4 }, colors: ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981'] });
    }

    const timer = setTimeout(() => setScoreBurst(null), 2200);
    return () => clearTimeout(timer);
  }, [activeMatch?.latestDeliveryBurst?.timestamp, isScorer]);

  // Sync real-time alerts (e.g. Hat-Trick) from Firebase activeMatch.currentAlert for Spectators
  useEffect(() => {
    if (isScorer) return;
    if (activeMatch?.currentAlert && activeMatch.currentAlert.type === 'hat-trick') {
      confetti({ particleCount: 90, spread: 80, origin: { x: 0.2, y: 0.5 }, colors: ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981'] });
      confetti({ particleCount: 90, spread: 80, origin: { x: 0.8, y: 0.5 }, colors: ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981'] });
      confetti({ particleCount: 140, spread: 120, origin: { y: 0.4 }, colors: ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981'] });

      setScoreBurst({
        id: `alert-hattrick-${activeMatch.currentAlert.timestamp}`,
        text: '🎩🔥',
        subText: `${activeMatch.currentAlert.title} ${activeMatch.currentAlert.subtitle}`,
        colorType: 'hattrick',
      });

      const timer = setTimeout(() => setScoreBurst(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [activeMatch?.currentAlert?.timestamp, isScorer]);

  // Detect live ball events from activeInnings.ballLogs exclusively for Spectators
  useEffect(() => {
    if (isScorer) return;

    const ballLogs = ensureArray<BallLog>(activeInnings?.ballLogs);
    if (!activeInnings || ballLogs.length === 0) {
      return;
    }

    const latestBall = ballLogs[ballLogs.length - 1];
    if (!latestBall) return;

    // Unique delivery signature
    const ballKey = latestBall.id || `${activeInnings.inningsNo}-${activeInnings.overs}.${activeInnings.balls}-${latestBall.timestamp || latestBall.totalRuns}-${ballLogs.length}`;

    // If initial loading phase and already bookmarked, skip historical ball
    if (isInitialMount.current && lastProcessedBallKeyRef.current === ballKey) {
      return;
    }

    // Skip if already displayed
    if (lastProcessedBallKeyRef.current === ballKey) {
      return;
    }

    lastProcessedBallKeyRef.current = ballKey;

    // Duck Dismissal: Wicket with 0 runs
    if (latestBall.isWicket && latestBall.wicketInfo) {
      const outBatsmanId = latestBall.wicketInfo.dismissedPlayerId || latestBall.strikerId;
      const outPlayer = players.find(p => p.id === outBatsmanId);
      const outBatsmanStats = activeInnings.batsmenStats?.[outBatsmanId];
      
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

        setTimeout(() => setDuckEvent(null), 6500);
      }
    }

    const isEligibleWicket = (b: any) => b.isWicket && b.wicketInfo?.type !== 'run-out' && b.wicketInfo?.type !== 'retired-hurt';
    const bowlerBalls = ballLogs.filter(b => b.bowlerId === latestBall.bowlerId);
    const last3Wickets = latestBall.isWicket && bowlerBalls.length >= 3 && bowlerBalls.slice(-3).every(isEligibleWicket);
    const was4thBallWicket = bowlerBalls.length >= 4 && isEligibleWicket(bowlerBalls[bowlerBalls.length - 4]);
    const isHatTrick = last3Wickets && !was4thBallWicket;

    if (isHatTrick) {
      // 🎩🔥 Massive Hat-Trick Confetti Extravaganza
      confetti({ particleCount: 90, spread: 80, origin: { x: 0.2, y: 0.5 }, colors: ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981'] });
      confetti({ particleCount: 90, spread: 80, origin: { x: 0.8, y: 0.5 }, colors: ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981'] });
      confetti({ particleCount: 140, spread: 120, origin: { y: 0.4 }, colors: ['#f59e0b', '#ef4444', '#8b5cf6', '#10b981'] });

      const bowler = players.find(p => p.id === latestBall.bowlerId);

      setScoreBurst({
        id: `hattrick-${Date.now()}`,
        text: '🎩🔥',
        subText: `HAT-TRICK! ${bowler?.name || 'Bowler'} (3 in 3)`,
        colorType: 'hattrick',
      });
    } else if (latestBall.isWicket) {
      setScoreBurst({
        id: `burst-${Date.now()}`,
        text: 'OUT',
        subText: 'WICKET! ☝️',
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
        subText: 'MAXIMUM SIX! 🚀',
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
        subText: 'FOUR! 💥',
        colorType: 'four',
      });
    } else if (latestBall.runsScored === 3) {
      setScoreBurst({
        id: `burst-${Date.now()}`,
        text: '3',
        subText: '3 RUNS (TRIPLE) ⚡',
        colorType: 'three',
      });
    } else if (latestBall.runsScored === 2) {
      setScoreBurst({
        id: `burst-${Date.now()}`,
        text: '2',
        subText: '2 RUNS (DOUBLE) 🏃‍♂️',
        colorType: 'two',
      });
    } else if (latestBall.runsScored === 1) {
      setScoreBurst({
        id: `burst-${Date.now()}`,
        text: '1',
        subText: '1 RUN (SINGLE) 🏏',
        colorType: 'one',
      });
    } else if (latestBall.extras && latestBall.extras.type === 'wide') {
      const extraRuns = latestBall.extras.runs > 1 ? `+${latestBall.extras.runs - 1}` : '';
      setScoreBurst({
        id: `burst-${Date.now()}`,
        text: `WD${extraRuns}`,
        subText: `WIDE BALL (+${latestBall.totalRuns}) ↔️`,
        colorType: 'wide',
      });
    } else if (latestBall.extras && latestBall.extras.type === 'no-ball') {
      const totalNb = latestBall.totalRuns || ((latestBall.runsScored || 0) + 1);
      setScoreBurst({
        id: `burst-${Date.now()}`,
        text: `NB+${totalNb}`,
        subText: `NO BALL (${totalNb} RUNS TOTAL) ⚠️`,
        colorType: 'noball',
      });
    } else if (latestBall.extras && latestBall.extras.type === 'bye') {
      setScoreBurst({
        id: `burst-${Date.now()}`,
        text: `B+${latestBall.totalRuns}`,
        subText: `BYES (+${latestBall.totalRuns}) 🛡️`,
        colorType: 'byes',
      });
    } else if (latestBall.extras && latestBall.extras.type === 'leg-bye') {
      setScoreBurst({
        id: `burst-${Date.now()}`,
        text: `LB+${latestBall.totalRuns}`,
        subText: `LEG BYES (+${latestBall.totalRuns}) 🦵`,
        colorType: 'legbyes',
      });
    } else {
      setScoreBurst({
        id: `burst-${Date.now()}`,
        text: '0',
        subText: 'DOT BALL 🎯',
        colorType: 'dot',
      });
    }

    const timer = setTimeout(() => setScoreBurst(null), 2200);
    return () => clearTimeout(timer);

  }, [activeInnings?.ballLogs, activeInnings?.totalRuns, activeInnings?.overs, activeInnings?.balls, players]);

  return (
    <>
      {/* ── LIVE SCORE ON SCREEN BURST ANIMATION (2.2s AUTO DISAPPEAR) ── */}
      {scoreBurst && (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center p-4">
          <div className="flex flex-col items-center justify-center animate-score-pop-fade">
            <div
              className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center font-black font-mono shadow-2xl border-4 backdrop-blur-md transition-transform ${
                scoreBurst.colorType === 'six'
                  ? 'bg-amber-500/95 border-amber-200 text-slate-950 shadow-amber-500/80 text-6xl sm:text-7xl animate-pulse ring-8 ring-amber-400/50 scale-110'
                  : scoreBurst.colorType === 'four'
                  ? 'bg-emerald-500/95 border-emerald-200 text-slate-950 shadow-emerald-500/80 text-6xl sm:text-7xl animate-pulse ring-8 ring-emerald-400/50 scale-110'
                  : scoreBurst.colorType === 'three'
                  ? 'bg-purple-600/95 border-purple-200 text-white shadow-purple-600/80 text-6xl sm:text-7xl ring-8 ring-purple-400/40'
                  : scoreBurst.colorType === 'two'
                  ? 'bg-cyan-500/95 border-cyan-200 text-slate-950 shadow-cyan-500/80 text-6xl sm:text-7xl ring-8 ring-cyan-400/40'
                  : scoreBurst.colorType === 'one'
                  ? 'bg-blue-600/95 border-blue-200 text-white shadow-blue-600/70 text-6xl sm:text-7xl ring-8 ring-blue-400/40'
                  : scoreBurst.colorType === 'hattrick'
                  ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 border-amber-200 text-white shadow-rose-500/90 text-4xl sm:text-5xl ring-8 ring-amber-400/50 animate-bounce scale-110'
                  : scoreBurst.colorType === 'wicket'
                  ? 'bg-red-600/95 border-red-200 text-white shadow-red-600/90 text-5xl sm:text-6xl ring-8 ring-red-500/50 animate-pulse'
                  : scoreBurst.colorType === 'wide'
                  ? 'bg-orange-500/95 border-orange-200 text-slate-950 shadow-orange-500/80 text-5xl sm:text-6xl ring-8 ring-orange-400/40'
                  : scoreBurst.colorType === 'noball'
                  ? 'bg-yellow-400/95 border-yellow-100 text-slate-950 shadow-yellow-500/80 text-5xl sm:text-6xl ring-8 ring-yellow-400/50 animate-pulse'
                  : scoreBurst.colorType === 'byes'
                  ? 'bg-indigo-600/95 border-indigo-200 text-white shadow-indigo-600/70 text-4xl sm:text-5xl ring-8 ring-indigo-400/40'
                  : scoreBurst.colorType === 'legbyes'
                  ? 'bg-teal-600/95 border-teal-200 text-white shadow-teal-600/70 text-4xl sm:text-5xl ring-8 ring-teal-400/40'
                  : 'bg-slate-900/95 border-slate-700 text-white shadow-slate-950/80 text-5xl sm:text-6xl ring-4 ring-slate-800'
              }`}
            >
              {scoreBurst.text}
            </div>

            {scoreBurst.subText && (
              <span className="mt-3 px-5 py-2 rounded-full bg-slate-950/95 border border-slate-700 text-sm sm:text-base font-black uppercase tracking-widest text-white shadow-2xl backdrop-blur-md">
                {scoreBurst.subText}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── DUCK OUT TRANSPARENT WALKING CHARACTER ── */}
      {duckEvent && (
        <div className="fixed bottom-6 sm:bottom-12 left-0 right-0 z-50 pointer-events-none overflow-hidden h-28 sm:h-32">
          {/* Translating container across the pitch */}
          <div 
            className={`absolute flex items-center space-x-2.5 pointer-events-none drop-shadow-2xl ${
              duckEvent.direction === 'right' 
                ? 'animate-duck-walk-right' 
                : 'animate-duck-walk-left'
            }`}
          >
            {/* Waddling step bobbing & rocking animation */}
            <div className="relative flex flex-col items-center animate-duck-waddle">
              {/* Sad Tears Animation */}
              <div className="absolute -top-2 left-4 flex space-x-1 animate-bounce">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-300"></span>
                <span className="w-1 h-1 rounded-full bg-cyan-300"></span>
              </div>

              {/* Reference Duck Image with Cricket Bat (Reduced Compact Size) */}
              <div className="relative">
                <img
                  src="/assets/cricket_duck.png"
                  alt="Duck with Bat"
                  className={`w-14 h-14 sm:w-18 sm:h-18 object-contain select-none filter drop-shadow-xl ${
                    duckEvent.direction === 'left' ? 'scale-x-[-1]' : ''
                  }`}
                />

                {/* Animated Webbed Walking Feet */}
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 flex space-x-2.5 pointer-events-none">
                  <div className="w-2.5 h-1.5 bg-amber-500 rounded-full border border-amber-600 shadow-xs animate-duck-foot-left" />
                  <div className="w-2.5 h-1.5 bg-amber-500 rounded-full border border-amber-600 shadow-xs animate-duck-foot-right" />
                </div>
              </div>

              <span className="text-[9px] sm:text-[10px] font-black bg-red-600/95 text-white px-2 py-0.2 rounded-full shadow-md mt-0.5 whitespace-nowrap border border-red-300/60">
                0 Runs (Duck)
              </span>
            </div>

            {/* Transparent floating speech pill with waddle sync */}
            <div className="bg-slate-950/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-2xl shadow-xl animate-duck-waddle">
              <span className="text-xs sm:text-xs font-black text-amber-300 block whitespace-nowrap">
                😢 {duckEvent.batsmanName}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-300 font-bold block whitespace-nowrap">
                {duckEvent.direction === 'right' ? 'Walking to Pavilion ➔' : '⬅ Walking to Pavilion'}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LiveCelebrationOverlay;

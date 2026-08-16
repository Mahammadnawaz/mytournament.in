import React, { useState, useEffect, useRef } from 'react';
import { useCricket } from '../../context/CricketContext';
import { MessageSquare, Volume2, VolumeX, Radio } from 'lucide-react';
import type { BallLog } from '../../types/cricket';

// Fallback Cricket Shot Zone Placement Map
const FALLBACK_SHOT_ZONES: Record<string, string[]> = {
  four: [
    'crisply driven through extra cover',
    'pulled powerfully past deep square leg',
    'slashed through backward point',
    'flicked exquisitely through mid-wicket',
    'punched past mid-off to the boundary',
    'steered deftly past third man',
    'drilled straight down the ground',
    'swept handsomely through fine leg',
  ],
  six: [
    'smashed high and handsome over deep mid-wicket into the stands',
    'lofted majestically over long-on for a monster maximum',
    'launched over wide long-off with pure power',
    'hooked deep over fine leg for six',
    'hammered over extra cover into the crowd',
    'muscled over deep square leg into the second tier',
  ],
  single: [
    'worked into the gap on the on-side for a single',
    'pushed down to long-on for one run',
    'tapped towards cover-point and hustled for a quick single',
    'nudged behind square on the leg side for a run',
    'guided towards third man for an easy single',
  ],
  double: [
    'placed nicely into the deep cover gap, coming back for the second',
    'clipped through mid-wicket, running hard for a brace of runs',
    'driven wide of long-off, comfortable two runs taken',
    'flicked off the pads into the deep backward square region for two',
  ],
  three: [
    'drilled through the covers, exceptional fielding stops the four, three runs saved',
    'pulled into the deep vacant mid-wicket pocket, ran hard for three',
  ],
  dot: [
    'defended watchfully on a good length back to the bowler. No run',
    'beaten outside off-stump with seam movement. Dot ball',
    'pushed straight to cover, fielder intercepts quickly. No run',
    'length delivery on middle stump, defended solidly. Dot ball',
    'left alone outside off-stump through to the wicketkeeper',
  ],
};

function getPlacementByIndex(list: string[], seed: number): string {
  return list[Math.abs(seed) % list.length];
}

function getShotZoneAction(shotZone: string, isSix: boolean): { verb: string; prep: string } {
  const z = shotZone.toLowerCase();
  if (isSix) {
    if (z.includes('mid-wicket') || z.includes('midwicket')) return { verb: 'smashes it over', prep: 'into the stands' };
    if (z.includes('long-on') || z.includes('long on')) return { verb: 'lofts it towering over', prep: 'for a massive six' };
    if (z.includes('long-off') || z.includes('long off')) return { verb: 'launches it straight over', prep: 'into the crowd' };
    if (z.includes('cover')) return { verb: 'strikes an inside-out loft over', prep: 'clearing the boundary rope' };
    if (z.includes('fine leg') || z.includes('fine-leg')) return { verb: 'picks it up cleanly over', prep: 'all the way for six' };
    if (z.includes('square leg')) return { verb: 'pulls it fiercely over', prep: 'into the upper tier' };
    if (z.includes('third man') || z.includes('third-man')) return { verb: 'upper-cuts it high over', prep: 'for six' };
    if (z.includes('point')) return { verb: 'slashes it high over', prep: 'into the stands' };
    return { verb: 'smashes it over', prep: 'for a maximum six' };
  } else {
    if (z.includes('cover')) return { verb: 'drives crisply through', prep: 'for a glorious four' };
    if (z.includes('point')) return { verb: 'slashes it past', prep: 'racing away to the boundary' };
    if (z.includes('fine leg') || z.includes('fine-leg')) return { verb: 'flicks it exquisitely past', prep: 'to find the fence' };
    if (z.includes('square leg')) return { verb: 'clips it cleanly through', prep: 'for a boundary' };
    if (z.includes('mid-wicket') || z.includes('midwicket')) return { verb: 'pulls it with authority through', prep: 'to the rope' };
    if (z.includes('third man') || z.includes('third-man')) return { verb: 'steers it deftly past', prep: 'for four runs' };
    if (z.includes('long-on') || z.includes('long-off') || z.includes('straight')) return { verb: 'drills it down the ground towards', prep: 'for a bullet four' };
    if (z.includes('mid-on') || z.includes('mid-off')) return { verb: 'punches it past', prep: 'to the boundary' };
    return { verb: 'hits it cleanly through', prep: 'for four' };
  }
}

export function formatBallCommentary(
  ball: BallLog,
  striker: string,
  bowler: string
): { headline: string; description: string; speechText: string } {
  const seed = (ball.overNumber * 10) + ball.ballNumber + (ball.runsScored * 7);
  const clickedZone = ball.shotZone?.trim();

  // 1. WICKET
  if (ball.isWicket) {
    const wType = ball.wicketInfo?.type ? ball.wicketInfo.type.toUpperCase() : 'WICKET';
    const detail = ball.wicketInfo?.description ? ` (${ball.wicketInfo.description})` : '';
    const headline = `🔴 OUT! ${wType}`;
    const description = `WICKET! ${bowler} strikes! ${striker} is dismissed${detail}. Huge breakthrough in over ${ball.overNumber + 1}!`;
    const speechText = `Out! Wicket falls! ${bowler} dismisses ${striker} in over ${ball.overNumber + 1}!`;
    return { headline, description, speechText };
  }

  // 2. WIDE BALL (with optional extra runs)
  if (ball.extras?.type === 'wide') {
    const extraRuns = ball.extras.runs || 1;
    const totalRunsThisBall = ball.runsScored; // total runs from wide + bye runs

    if (extraRuns > 1 || totalRunsThisBall > 1) {
      const additional = totalRunsThisBall - 1;
      const headline = `WIDE + ${additional} ${additional === 1 ? 'RUN' : 'RUNS'} ⚡`;
      const description = `WIDE + ${additional} (${totalRunsThisBall} runs total)! ${bowler} strays down the leg side, keeper fumbles and batsmen sneak ${additional} extra run${additional > 1 ? 's' : ''}.`;
      const speechText = `Wide plus ${additional}`;
      return { headline, description, speechText };
    }

    const headline = 'WIDE BALL ⚡';
    const description = `Wide ball! ${bowler} sprays it outside the tramlines. 1 extra run added.`;
    const speechText = `Wide plus 1`;
    return { headline, description, speechText };
  }

  // 3. NO BALL (with optional off-the-bat or extra runs)
  if (ball.extras?.type === 'no-ball') {
    const batRuns = ball.runsScored > 1 ? ball.runsScored - 1 : 0;

    if (batRuns === 6) {
      if (clickedZone) {
        const { verb, prep } = getShotZoneAction(clickedZone, true);
        const headline = `NO BALL + SIX! 🚀 (${clickedZone.toUpperCase()})`;
        const description = `NO BALL + SIX (7 runs total)! ${bowler} oversteps and ${striker} ${verb} ${clickedZone} ${prep}! Free Hit next!`;
        const speechText = `No ball plus 6`;
        return { headline, description, speechText };
      }
      const headline = 'NO BALL + SIX! 🚀 (7 RUNS)';
      const description = `NO BALL + SIX (7 runs total)! ${bowler} oversteps and ${striker} punishes it ${getPlacementByIndex(FALLBACK_SHOT_ZONES.six, seed)}! Free Hit coming up!`;
      const speechText = `No ball plus 6`;
      return { headline, description, speechText };
    }

    if (batRuns === 4) {
      if (clickedZone) {
        const { verb, prep } = getShotZoneAction(clickedZone, false);
        const headline = `NO BALL + FOUR! ⚡ (${clickedZone.toUpperCase()})`;
        const description = `NO BALL + FOUR (5 runs total)! High full toss / overstepping, ${striker} ${verb} ${clickedZone} ${prep}! Free Hit next!`;
        const speechText = `No ball plus 4`;
        return { headline, description, speechText };
      }
      const headline = 'NO BALL + FOUR! ⚡ (5 RUNS)';
      const description = `NO BALL + FOUR (5 runs total)! High full toss / overstepping, ${striker} hammers it ${getPlacementByIndex(FALLBACK_SHOT_ZONES.four, seed)} for four! Free Hit next!`;
      const speechText = `No ball plus 4`;
      return { headline, description, speechText };
    }

    if (batRuns > 0) {
      const zoneText = clickedZone ? ` towards ${clickedZone}` : '';
      const headline = `NO BALL + ${batRuns} ${batRuns === 1 ? 'RUN' : 'RUNS'} (${batRuns + 1} TOTAL)`;
      const description = `NO BALL + ${batRuns} runs! ${bowler} oversteps the bowling crease. ${striker} works it${zoneText} for ${batRuns} run${batRuns > 1 ? 's' : ''}. Free Hit next!`;
      const speechText = `No ball plus ${batRuns}`;
      return { headline, description, speechText };
    }

    const headline = 'NO BALL ⚠️ (FREE HIT)';
    const description = `No ball called! ${bowler} oversteps the crease. 1 run added and Free Hit awarded next delivery!`;
    const speechText = `No ball plus 1`;
    return { headline, description, speechText };
  }

  // 4. LEG BYES / BYES
  if (ball.extras?.type === 'leg-bye' || ball.extras?.type === 'bye') {
    const isLB = ball.extras.type === 'leg-bye';
    const r = ball.runsScored || ball.extras.runs || 1;
    const zoneText = clickedZone ? ` through ${clickedZone}` : '';
    const headline = `${isLB ? 'LEG BYES' : 'BYES'} + ${r} 🦵`;
    const description = `${isLB ? 'Leg Byes' : 'Byes'} (${r} run${r > 1 ? 's' : ''})! Deflected${zoneText} into the outfield as batsmen scramble through.`;
    const speechText = `${isLB ? 'Leg byes' : 'Byes'} plus ${r}`;
    return { headline, description, speechText };
  }

  // 5. SIX (6 RUNS) WITH USER-CLICKED BOUNDARY PLACEMENT
  if (ball.runsScored === 6) {
    if (clickedZone) {
      const { verb, prep } = getShotZoneAction(clickedZone, true);
      const headline = `SIX 🚀 (${clickedZone.toUpperCase()})`;
      const description = `🚀 MAXIMUM SIX! ${striker} ${verb} ${clickedZone} ${prep}! Magnificent power hitting!`;
      const speechText = `Massive Six! ${striker} ${verb} ${clickedZone}!`;
      return { headline, description, speechText };
    }
    const placement = getPlacementByIndex(FALLBACK_SHOT_ZONES.six, seed);
    const headline = 'SIX RUNS 🚀 MAXIMUM';
    const description = `🚀 MAXIMUM SIX! ${striker} ${placement}! Clean strike into the stands!`;
    const speechText = `Massive Six! ${striker} smashes it ${placement}!`;
    return { headline, description, speechText };
  }

  // 6. FOUR (4 RUNS) WITH USER-CLICKED BOUNDARY PLACEMENT
  if (ball.runsScored === 4) {
    if (clickedZone) {
      const { verb, prep } = getShotZoneAction(clickedZone, false);
      const headline = `FOUR ⚡ (${clickedZone.toUpperCase()})`;
      const description = `⚡ BOUNDARY FOUR! ${striker} ${verb} ${clickedZone} ${prep}! Perfectly timed.`;
      const speechText = `Four runs! ${striker} ${verb} ${clickedZone}!`;
      return { headline, description, speechText };
    }
    const placement = getPlacementByIndex(FALLBACK_SHOT_ZONES.four, seed);
    const headline = 'FOUR RUNS ⚡ BOUNDARY';
    const description = `⚡ BOUNDARY FOUR! ${striker} ${placement}! Superb timing and placement to find the fence.`;
    const speechText = `Four runs! ${striker} hits it ${placement}!`;
    return { headline, description, speechText };
  }

  // 7. 3 RUNS
  if (ball.runsScored === 3) {
    const placement = clickedZone ? `towards ${clickedZone}` : getPlacementByIndex(FALLBACK_SHOT_ZONES.three, seed);
    const headline = clickedZone ? `3 RUNS (${clickedZone.toUpperCase()})` : '3 RUNS (HARD RUNNING)';
    const description = `${striker} drills it ${placement}. Great hustle between the wickets for three runs.`;
    const speechText = `Three runs scored by ${striker} towards ${clickedZone || 'the outfield'}.`;
    return { headline, description, speechText };
  }

  // 8. 2 RUNS
  if (ball.runsScored === 2) {
    const placement = clickedZone ? `towards ${clickedZone}` : getPlacementByIndex(FALLBACK_SHOT_ZONES.double, seed);
    const headline = clickedZone ? `2 RUNS (${clickedZone.toUpperCase()})` : '2 RUNS';
    const description = `${striker} places it ${placement}. Back for a comfortable second run.`;
    const speechText = `Two runs taken by ${striker} towards ${clickedZone || 'the gap'}.`;
    return { headline, description, speechText };
  }

  // 9. 1 RUN
  if (ball.runsScored === 1) {
    const placement = clickedZone ? `towards ${clickedZone}` : getPlacementByIndex(FALLBACK_SHOT_ZONES.single, seed);
    const headline = clickedZone ? `1 RUN (${clickedZone.toUpperCase()})` : '1 RUN (SINGLE)';
    const description = `${striker} works it ${placement}. Rotating the strike.`;
    const speechText = `Single taken by ${striker} towards ${clickedZone || 'the field'}.`;
    return { headline, description, speechText };
  }

  // 10. DOT BALL (0 RUNS)
  const dotDesc = getPlacementByIndex(FALLBACK_SHOT_ZONES.dot, seed);
  const headline = 'DOT BALL 🎯';
  const description = `${bowler} to ${striker}: ${dotDesc}.`;
  const speechText = `Dot ball from ${bowler}.`;
  return { headline, description, speechText };
}

export const LiveCommentaryFeed: React.FC = () => {
  const { activeMatch, activeInnings, players } = useCricket();
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const lastSpokenBallId = useRef<string | null>(null);

  // Audio commentary announcement using SpeechSynthesis
  useEffect(() => {
    if (!isAudioEnabled || !activeInnings || activeInnings.ballLogs.length === 0) return;
    const latestBall = activeInnings.ballLogs[activeInnings.ballLogs.length - 1];
    const ballKey = `${latestBall.overNumber}.${latestBall.ballNumber}-${latestBall.runsScored}-${latestBall.isWicket}-${latestBall.extras?.type}-${latestBall.extras?.runs}-${latestBall.shotZone || ''}`;

    if (lastSpokenBallId.current !== ballKey && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      lastSpokenBallId.current = ballKey;
      const bStriker = players.find(p => p.id === latestBall.strikerId)?.name || 'Batsman';
      const bBowler = players.find(p => p.id === latestBall.bowlerId)?.name || 'Bowler';
      
      const { speechText } = formatBallCommentary(latestBall, bStriker, bBowler);

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, [activeInnings?.ballLogs, isAudioEnabled, players]);

  if (!activeMatch || !activeInnings) return null;

  const reversedLogs = [...(activeInnings.ballLogs || [])].reverse();

  return (
    <div className="theme-bg-card border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl space-y-0 transition-all duration-300">
      
      {/* Commentary Header */}
      <div className="bg-slate-950/90 px-4 sm:px-6 py-3.5 border-b border-slate-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center space-x-2">
              <span>Live Ball-by-Ball Commentary</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Real-time boundary placement & shot-by-shot commentary feed</p>
          </div>
        </div>

        {/* Audio Commentary Voice Toggle */}
        <button
          onClick={() => setIsAudioEnabled(prev => !prev)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
            isAudioEnabled
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700/80'
          }`}
          title={isAudioEnabled ? 'Voice Commentary Active' : 'Enable Voice Commentary'}
        >
          {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          <span className="hidden sm:inline">{isAudioEnabled ? 'Voice ON' : 'Voice Audio'}</span>
        </button>
      </div>

      {/* Commentary Feed Body */}
      <div className="p-4 sm:p-6 bg-slate-950/40 space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar">
        {reversedLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs space-y-1">
            <Radio className="w-6 h-6 mx-auto text-slate-600 animate-pulse" />
            <p className="font-semibold text-slate-400">Match in progress. Ready for the opening delivery.</p>
            <p className="text-[11px] text-slate-600">Ball-by-ball commentary with clicked boundary placements will stream here live.</p>
          </div>
        ) : (
          reversedLogs.map((ball, idx) => {
            const bStriker = players.find(p => p.id === ball.strikerId)?.name || 'Batsman';
            const bBowler = players.find(p => p.id === ball.bowlerId)?.name || 'Bowler';
            const { headline, description } = formatBallCommentary(ball, bStriker, bBowler);

            const isBoundary6 = ball.runsScored === 6;
            const isBoundary4 = ball.runsScored === 4;
            const isExtra = Boolean(ball.extras?.type && ball.extras.type !== 'none');

            return (
              <div
                key={ball.id || idx}
                className={`p-3.5 rounded-2xl border transition-all ${
                  ball.isWicket
                    ? 'bg-red-500/10 border-red-500/30'
                    : isBoundary6
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : isBoundary4
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : isExtra
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs pb-1.5">
                  <div className="flex items-center space-x-2 font-mono font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 text-[11px] border border-slate-700">
                      {ball.overNumber}.{ball.ballNumber}
                    </span>
                    <span className="text-slate-200 font-semibold">{bBowler} to {bStriker}</span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      ball.isWicket
                        ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                        : isBoundary6
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                        : isBoundary4
                        ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20'
                        : isExtra
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                        : ball.runsScored === 0
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {headline}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-medium pt-0.5 leading-relaxed">
                  {description}
                </p>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default LiveCommentaryFeed;

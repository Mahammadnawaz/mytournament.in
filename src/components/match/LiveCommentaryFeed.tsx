import React, { useState, useEffect, useRef } from 'react';
import { useCricket } from '../../context/CricketContext';
import { MessageSquare, Volume2, VolumeX, Radio } from 'lucide-react';

export const LiveCommentaryFeed: React.FC = () => {
  const { activeMatch, activeInnings, players } = useCricket();
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const lastSpokenBallId = useRef<string | null>(null);

  // Audio commentary announcement using SpeechSynthesis
  useEffect(() => {
    if (!isAudioEnabled || !activeInnings || activeInnings.ballLogs.length === 0) return;
    const latestBall = activeInnings.ballLogs[activeInnings.ballLogs.length - 1];
    const ballKey = `${latestBall.overNumber}.${latestBall.ballNumber}-${latestBall.runsScored}-${latestBall.isWicket}`;

    if (lastSpokenBallId.current !== ballKey && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      lastSpokenBallId.current = ballKey;
      const bStriker = players.find(p => p.id === latestBall.strikerId)?.name || 'Batsman';
      const bBowler = players.find(p => p.id === latestBall.bowlerId)?.name || 'Bowler';
      
      let text = '';
      if (latestBall.isWicket) {
        text = `Out! Wicket falls! ${bStriker} is dismissed in over ${latestBall.overNumber + 1}!`;
      } else if (latestBall.runsScored === 6) {
        text = `Huge six by ${bStriker}! Smashed over the boundary ropes!`;
      } else if (latestBall.runsScored === 4) {
        text = `Four runs! Beautiful boundary struck by ${bStriker}.`;
      } else if (latestBall.runsScored === 0) {
        text = `Dot ball from ${bBowler}.`;
      } else {
        text = `${latestBall.runsScored} run${latestBall.runsScored > 1 ? 's' : ''} scored by ${bStriker}.`;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
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
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Real-time instant live match commentary feed</p>
          </div>
        </div>

        {/* Audio Commentary Voice Toggle */}
        <button
          onClick={() => setIsAudioEnabled(prev => !prev)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
            isAudioEnabled
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700/80'
          }`}
          title={isAudioEnabled ? 'Voice Commentary Active' : 'Enable Voice Commentary'}
        >
          {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5 animate-pulse text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
          <span className="hidden sm:inline">{isAudioEnabled ? 'Voice ON' : 'Voice Audio'}</span>
        </button>
      </div>

      {/* Commentary Feed Body */}
      <div className="p-4 sm:p-6 bg-slate-950/40 space-y-3 max-h-[380px] overflow-y-auto custom-scrollbar">
        {reversedLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs space-y-1">
            <Radio className="w-6 h-6 mx-auto text-slate-600 animate-pulse" />
            <p className="font-semibold text-slate-400">Match in progress. Ready for the opening delivery.</p>
            <p className="text-[11px] text-slate-600">Ball-by-ball commentary will stream here in real-time.</p>
          </div>
        ) : (
          reversedLogs.map((ball, idx) => {
            const bStriker = players.find(p => p.id === ball.strikerId)?.name || 'Batsman';
            const bBowler = players.find(p => p.id === ball.bowlerId)?.name || 'Bowler';

            return (
              <div
                key={ball.id || idx}
                className={`p-3.5 rounded-2xl border transition-all ${
                  ball.isWicket
                    ? 'bg-red-500/10 border-red-500/30'
                    : ball.runsScored === 6
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : ball.runsScored === 4
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs pb-1">
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
                        : ball.runsScored === 6
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                        : ball.runsScored === 4
                        ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20'
                        : ball.runsScored === 0
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {ball.isWicket ? 'WICKET' : ball.runsScored === 6 ? 'SIX 🚀' : ball.runsScored === 4 ? 'FOUR ⚡' : `${ball.runsScored} RUNS`}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-medium pt-1 leading-relaxed">
                  {ball.isWicket
                    ? `🔴 OUT! ${ball.wicketInfo?.type ? ball.wicketInfo.type.toUpperCase() : 'Wicket'}! ${bStriker} departs${ball.wicketInfo?.description ? ` - ${ball.wicketInfo.description}` : ''}.`
                    : ball.runsScored === 6
                    ? `🚀 MAXIMUM! Smashed high and handsome over the ropes by ${bStriker}! Fantastic power shot.`
                    : ball.runsScored === 4
                    ? `⚡ BOUNDARY! Driven cleanly through the field by ${bStriker} for four runs.`
                    : ball.extras?.type && ball.extras.type !== 'none'
                    ? `Extra: ${ball.extras.type.toUpperCase()} conceded (${ball.extras.runs || 1} run).`
                    : ball.runsScored === 0
                    ? `Defended solidly by ${bStriker}. Dot ball.`
                    : `Pushed into the gap for ${ball.runsScored} run${ball.runsScored > 1 ? 's' : ''}.`}
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

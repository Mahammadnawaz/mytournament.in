import React, { useState, useEffect, useRef } from 'react';
import { useCricket } from '../../context/CricketContext';
import { 
  Radio, 
  Tv, 
  Volume2, 
  VolumeX, 
  Flame, 
  Sparkles, 
  Play, 
  MessageSquare, 
  Eye 
} from 'lucide-react';

interface FloatingReaction {
  id: number;
  emoji: string;
  left: number;
}

export const LiveStreamSection: React.FC = () => {
  const { activeMatch, activeInnings, players } = useCricket();

  const [streamTab, setStreamTab] = useState<'arena' | 'commentary' | 'video'>('arena');
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>('https://www.youtube.com/embed/live_stream?channel=');
  const [customVideoInput, setCustomVideoInput] = useState('');
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [viewerCount, setViewerCount] = useState(1280);

  const lastSpokenBallId = useRef<string | null>(null);

  // Dynamic viewer count with subtle realistic micro-fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 7) - 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Real-time Text-to-Speech audio commentary on new balls
  useEffect(() => {
    if (!isAudioEnabled || !activeInnings || activeInnings.ballLogs.length === 0) return;
    const latestBall = activeInnings.ballLogs[activeInnings.ballLogs.length - 1];
    const ballKey = `${latestBall.overNumber}.${latestBall.ballNumber}-${latestBall.runsScored}-${latestBall.isWicket}`;

    if (lastSpokenBallId.current !== ballKey && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      lastSpokenBallId.current = ballKey;
      let text = '';
      if (latestBall.isWicket) {
        text = `Wicket! Out! Wicket falls in over ${latestBall.overNumber + 1}!`;
      } else if (latestBall.runsScored === 6) {
        text = `Huge shot! That is a maximum, six runs!`;
      } else if (latestBall.runsScored === 4) {
        text = `Cracking boundary! Four runs to the batsman!`;
      } else if (latestBall.runsScored === 0) {
        text = `Dot ball bowled. No run scored.`;
      } else {
        text = `${latestBall.runsScored} run${latestBall.runsScored > 1 ? 's' : ''} taken.`;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, [activeInnings?.ballLogs, isAudioEnabled]);

  if (!activeMatch || !activeInnings) return null;

  const strikerPlayer = players.find(p => p.id === activeInnings.strikerId);
  const bowlerPlayer = players.find(p => p.id === activeInnings.currentBowlerId);

  const strikerStats = activeInnings.batsmenStats[activeInnings.strikerId];
  const bowlerStats = activeInnings.bowlerStats[activeInnings.currentBowlerId];

  const recentBalls = activeInnings.recentBalls || [];
  const latestBall = activeInnings.ballLogs.length > 0 ? activeInnings.ballLogs[activeInnings.ballLogs.length - 1] : null;

  // Trigger floating reaction burst
  const handleAddReaction = (emoji: string) => {
    const newReaction: FloatingReaction = {
      id: Date.now() + Math.random(),
      emoji,
      left: 15 + Math.random() * 70,
    };
    setReactions(prev => [...prev.slice(-15), newReaction]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 2000);
  };

  const handleApplyVideoUrl = (e: React.FormEvent) => {
    e.preventDefault();
    let url = customVideoInput.trim();
    if (!url) return;
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('watch?v=')[1]?.split('&')[0];
      url = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      url = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    setVideoUrl(url);
    setShowVideoInput(false);
  };

  return (
    <div className="theme-bg-card border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl space-y-0 transition-all duration-300 relative animate-fade-in">
      
      {/* ── BROADCAST STREAM TOP BAR ── */}
      <div className="bg-slate-950/90 px-4 sm:px-6 py-3.5 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Live Status & Viewers */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-[11px] font-black text-red-400 uppercase tracking-wider flex items-center space-x-1">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>LIVE MATCH STREAM</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono font-bold text-white">{viewerCount.toLocaleString()}</span>
            <span className="text-slate-400 text-[11px]">watching</span>
          </div>
        </div>

        {/* Center/Right: Stream Mode Switchers */}
        <div className="flex items-center space-x-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setStreamTab('arena')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition ${
              streamTab === 'arena'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Virtual Arena</span>
          </button>

          <button
            onClick={() => setStreamTab('commentary')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition ${
              streamTab === 'commentary'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Live Commentary</span>
          </button>

          <button
            onClick={() => setStreamTab('video')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl transition ${
              streamTab === 'video'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Live Video / TV</span>
          </button>

          {/* Audio Commentary Toggle */}
          <button
            onClick={() => setIsAudioEnabled(prev => !prev)}
            className={`p-1.5 rounded-xl transition border ml-1 ${
              isAudioEnabled
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={isAudioEnabled ? 'Audio Commentary Active (Speech ON)' : 'Turn On Audio Voice Commentary'}
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* ── TAB 1: 3D VIRTUAL BROADCAST ARENA ── */}
      {streamTab === 'arena' && (
        <div className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 min-h-[280px] sm:min-h-[360px] p-4 sm:p-6 flex flex-col justify-between overflow-hidden">
          
          {/* Animated Stadium Floodlight ambience */}
          <div className="absolute top-0 left-1/4 w-96 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-96 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Floating Match Context */}
          <div className="flex flex-wrap items-center justify-between gap-2 relative z-10">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
                {activeMatch.name}
              </span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl sm:text-2xl font-black text-white">{activeInnings.battingTeam}</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                  {activeInnings.totalRuns}/{activeInnings.wickets}
                </span>
                <span className="text-xs text-slate-400 font-bold font-mono">
                  ({activeInnings.overs}.{activeInnings.balls} / {activeMatch.dlsRevisedOvers || activeMatch.totalOvers} ov)
                </span>
              </div>
            </div>

            {/* Over Ball Indicators Ticker */}
            <div className="bg-slate-900/90 border border-slate-800/80 px-3 py-1.5 rounded-2xl flex items-center space-x-1.5 shadow-lg backdrop-blur-md">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase mr-1">This Over:</span>
              {recentBalls.length === 0 ? (
                <span className="text-xs text-slate-500 italic">Ready for first ball</span>
              ) : (
                recentBalls.slice(-6).map((b, i) => (
                  <span
                    key={i}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shadow-sm ${
                      b.isWicket
                        ? 'bg-red-500 text-white'
                        : b.runsScored === 6
                        ? 'bg-purple-500 text-white'
                        : b.runsScored === 4
                        ? 'bg-amber-400 text-slate-950'
                        : b.runsScored === 0
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {b.isWicket ? 'W' : b.runsScored}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* 🏟️ Isometric Pitch Field Simulation */}
          <div className="relative my-4 flex-1 flex items-center justify-center min-h-[150px]">
            {/* Outer Oval Ground */}
            <div className="w-full max-w-xl h-44 sm:h-52 rounded-[100px] bg-gradient-to-tr from-emerald-950/60 via-emerald-900/40 to-teal-950/60 border-2 border-emerald-500/30 shadow-inner relative flex items-center justify-center overflow-hidden">
              
              {/* Grass Pattern stripes */}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(16,185,129,0.05)_50%,transparent_100%)] bg-[length:40px_100%]" />
              
              {/* 30-Yard Inner Circle */}
              <div className="w-72 sm:w-96 h-28 sm:h-36 rounded-[80px] border border-dashed border-emerald-400/25 flex items-center justify-center">
                
                {/* 22-Yard Pitch Strip */}
                <div className="w-36 sm:w-44 h-14 sm:h-16 rounded-xl bg-amber-200/15 border border-amber-400/30 shadow-md relative flex items-center justify-between px-3">
                  
                  {/* Bowling Crease & Stumps */}
                  <div className="flex flex-col items-center">
                    <div className="w-1.5 h-6 bg-amber-400/80 rounded-sm shadow-sm" />
                    <span className="text-[8px] font-bold text-amber-300 uppercase mt-0.5">Bowler</span>
                  </div>

                  {/* Ball Delivery Radar / Latest Trajectory */}
                  {latestBall && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-ping absolute" />
                      <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/80 flex items-center justify-center text-[7px] font-black text-white">
                        {latestBall.runsScored}
                      </div>
                    </div>
                  )}

                  {/* Batting Crease & Stumps */}
                  <div className="flex flex-col items-center">
                    <div className="w-1.5 h-6 bg-amber-400/80 rounded-sm shadow-sm" />
                    <span className="text-[8px] font-bold text-emerald-300 uppercase mt-0.5">Striker</span>
                  </div>

                </div>

              </div>

              {/* Dynamic Broadcast Flash Banner Overlay on Key Events */}
              {latestBall && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
                  <div
                    className={`px-4 py-1.5 rounded-full font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl flex items-center space-x-1.5 animate-bounce ${
                      latestBall.isWicket
                        ? 'bg-red-500 text-white shadow-red-500/40'
                        : latestBall.runsScored === 6
                        ? 'bg-purple-600 text-white shadow-purple-500/40'
                        : latestBall.runsScored === 4
                        ? 'bg-amber-400 text-slate-950 shadow-amber-400/40'
                        : 'bg-emerald-500/90 text-slate-950 shadow-emerald-500/30'
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                    <span>
                      {latestBall.isWicket
                        ? '💥 WICKET FALLEN!'
                        : latestBall.runsScored === 6
                        ? '🚀 MAXIMUM SIX (98m)!'
                        : latestBall.runsScored === 4
                        ? '✨ BOUNDARY FOUR!'
                        : `+${latestBall.runsScored} RUNS`}
                    </span>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* 📺 Lower-Third TV Broadcast Graphic Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
            
            {/* Batter on Strike TV Banner */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
                  🏏
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-white text-xs sm:text-sm">{strikerPlayer?.name || 'Striker'}</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-400 text-slate-950 font-black text-[9px] uppercase">
                      ON STRIKE *
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    4s: {strikerStats?.fours || 0} • 6s: {strikerStats?.sixes || 0}
                  </span>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-base sm:text-lg font-black text-emerald-400">
                  {strikerStats?.runs || 0}
                </span>
                <span className="text-xs text-slate-400"> ({strikerStats?.balls || 0}b)</span>
              </div>
            </div>

            {/* Current Bowler TV Banner */}
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center justify-center font-bold text-xs">
                  ⚡
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-white text-xs sm:text-sm">{bowlerPlayer?.name || 'Bowler'}</span>
                    <span className="text-[9px] text-sky-400 font-bold uppercase">Bowling</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Econ: {bowlerStats ? ((bowlerStats.runsConceded / Math.max(0.1, bowlerStats.overs + bowlerStats.balls / 6)).toFixed(2)) : '0.00'}
                  </span>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-base sm:text-lg font-black text-sky-400">
                  {bowlerStats?.wickets || 0} - {bowlerStats?.runsConceded || 0}
                </span>
                <span className="text-xs text-slate-400"> ({bowlerStats?.overs || 0}.{bowlerStats?.balls || 0} ov)</span>
              </div>
            </div>

          </div>

          {/* Floating Reaction Emojis Animation */}
          {reactions.map(r => (
            <div
              key={r.id}
              style={{ left: `${r.left}%` }}
              className="absolute bottom-16 text-2xl sm:text-3xl pointer-events-none animate-float-up z-30 transition-all"
            >
              {r.emoji}
            </div>
          ))}

          {/* Floating Reaction Bar for Spectators */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-800/80 mt-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Live Fan Cheers:
            </span>
            <div className="flex items-center space-x-2">
              {['🔥', '🚀', '👏', '❤️', '💯', '⚡'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleAddReaction(emoji)}
                  className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 hover:scale-125 transition-all text-sm active:scale-95 shadow-sm"
                  title={`Cheer with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ── TAB 2: LIVE BALL-BY-BALL COMMENTARY STREAM ── */}
      {streamTab === 'commentary' && (
        <div className="p-4 sm:p-6 bg-slate-950/90 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real-Time Ball-by-Ball Feed</span>
            </h4>
            <span className="text-[10px] text-slate-400">Auto-updates on every ball</span>
          </div>

          {activeInnings.ballLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Waiting for play to begin. Ball-by-ball commentary will stream here live.
            </div>
          ) : (
            <div className="space-y-3">
              {[...activeInnings.ballLogs].reverse().map((b, idx) => {
                const bStriker = players.find(p => p.id === b.strikerId)?.name || 'Batsman';
                const bBowler = players.find(p => p.id === b.bowlerId)?.name || 'Bowler';
                
                return (
                  <div
                    key={b.id || idx}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      b.isWicket
                        ? 'bg-red-500/10 border-red-500/30'
                        : b.runsScored === 6
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : b.runsScored === 4
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs pb-1">
                      <div className="flex items-center space-x-2 font-mono font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 text-[11px]">
                          {b.overNumber}.{b.ballNumber}
                        </span>
                        <span className="text-slate-300">{bBowler} to {bStriker}</span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          b.isWicket
                            ? 'bg-red-500 text-white'
                            : b.runsScored === 6
                            ? 'bg-purple-500 text-white'
                            : b.runsScored === 4
                            ? 'bg-amber-400 text-slate-950'
                            : b.runsScored === 0
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {b.isWicket ? 'WICKET' : b.runsScored === 6 ? 'SIX 🚀' : b.runsScored === 4 ? 'FOUR ⚡' : `${b.runsScored} RUNS`}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium pt-1">
                      {b.isWicket
                        ? `🔴 OUT! ${b.wicketInfo?.type ? b.wicketInfo.type.toUpperCase() : 'Wicket'}! ${bStriker} departs.`
                        : b.runsScored === 6
                        ? `🚀 SIX! Smashed high and handsome over the boundary ropes! Pure power.`
                        : b.runsScored === 4
                        ? `⚡ FOUR! Driven crisply through the field for a classical boundary.`
                        : b.runsScored === 0
                        ? `Good length delivery on off-stump, defended solidly. No run.`
                        : `Pushed into the gap for ${b.runsScored} run${b.runsScored > 1 ? 's' : ''}.`}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: LIVE VIDEO / TV EMBED STREAM ── */}
      {streamTab === 'video' && (
        <div className="bg-slate-950 p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Tv className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black text-white">Live Broadcast Video Feed</span>
            </div>

            <button
              onClick={() => setShowVideoInput(prev => !prev)}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold underline"
            >
              {showVideoInput ? 'Hide Stream Setup' : 'Custom Stream URL / Channel'}
            </button>
          </div>

          {showVideoInput && (
            <form onSubmit={handleApplyVideoUrl} className="flex gap-2 animate-fade-in">
              <input
                type="text"
                value={customVideoInput}
                onChange={(e) => setCustomVideoInput(e.target.value)}
                placeholder="Paste YouTube Live / Embed Video URL..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition"
              >
                Set Stream
              </button>
            </form>
          )}

          {/* Embedded Video Player or Stream Placeholder */}
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex items-center justify-center">
            {videoUrl && videoUrl.includes('embed') ? (
              <iframe
                src={videoUrl}
                title="Live Match Broadcast Stream"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="text-center space-y-3 p-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                  <Play className="w-6 h-6 ml-0.5" />
                </div>
                <h5 className="text-sm font-bold text-white">Live Broadcast Stream Ready</h5>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click 'Custom Stream URL' above to connect your YouTube Live or RTMP stadium video feed.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default LiveStreamSection;

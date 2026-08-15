import React from 'react';
import { useCricket } from '../../context/CricketContext';
import { Flame, Shield, ArrowLeftRight } from 'lucide-react';

interface LivePitchCardProps {
  onChangeBowlerClick: () => void;
}

export const LivePitchCard: React.FC<LivePitchCardProps> = ({ onChangeBowlerClick }) => {
  const { players, activeInnings, swapStriker } = useCricket();

  if (!activeInnings) return null;

  const strikerPlayer = players.find(p => p.id === activeInnings.strikerId);
  const nonStrikerPlayer = players.find(p => p.id === activeInnings.nonStrikerId);
  const bowlerPlayer = players.find(p => p.id === activeInnings.currentBowlerId);

  const strikerStats = activeInnings.batsmenStats[activeInnings.strikerId];
  const nonStrikerStats = activeInnings.batsmenStats[activeInnings.nonStrikerId];
  const bowlerStats = activeInnings.bowlerStats[activeInnings.currentBowlerId];

  const getBatsmanSR = (runs: number = 0, balls: number = 0) => {
    return balls > 0 ? ((runs / balls) * 100).toFixed(1) : '0.0';
  };

  const getBowlerEconomy = (runsConceded: number = 0, overs: number = 0, balls: number = 0) => {
    const totalOvers = overs + balls / 6;
    return totalOvers > 0 ? (runsConceded / totalOvers).toFixed(2) : '0.00';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      
      {/* Batsmen Card (Col 8) */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <Flame className="w-4 h-4" />
            <span>On Pitch Batsmen</span>
          </div>

          <button
            onClick={swapStriker}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition active:scale-95"
            title="Swap striker and non-striker positions"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>Swap Strike</span>
          </button>
        </div>

        {/* Batsmen Table / Grid */}
        <div className="space-y-2.5">
          
          {/* Striker */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <span className="font-bold text-slate-100 text-sm sm:text-base flex items-center space-x-1">
                  <span>{strikerPlayer?.name || 'Striker'}</span>
                  <span className="text-emerald-400 font-extrabold">*</span>
                </span>
                <span className="text-xs text-slate-400 block">Striker</span>
              </div>
            </div>

            <div className="flex items-baseline space-x-4 text-right">
              <div>
                <span className="text-lg sm:text-2xl font-black text-white font-mono">
                  {strikerStats?.runs || 0}
                </span>
                <span className="text-xs text-slate-400 font-mono"> ({strikerStats?.balls || 0})</span>
              </div>
              <div className="text-xs text-slate-400 font-mono hidden sm:block">
                <span>4s: <strong className="text-slate-200">{strikerStats?.fours || 0}</strong></span> • 
                <span> 6s: <strong className="text-slate-200">{strikerStats?.sixes || 0}</strong></span>
              </div>
              <div className="text-xs font-bold text-emerald-400 font-mono">
                SR: {getBatsmanSR(strikerStats?.runs, strikerStats?.balls)}
              </div>
            </div>
          </div>

          {/* Non-Striker */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
              <div>
                <span className="font-bold text-slate-200 text-sm sm:text-base">
                  {nonStrikerPlayer?.name || 'Non-Striker'}
                </span>
                <span className="text-xs text-slate-400 block">Non-Striker</span>
              </div>
            </div>

            <div className="flex items-baseline space-x-4 text-right">
              <div>
                <span className="text-lg sm:text-2xl font-black text-slate-200 font-mono">
                  {nonStrikerStats?.runs || 0}
                </span>
                <span className="text-xs text-slate-400 font-mono"> ({nonStrikerStats?.balls || 0})</span>
              </div>
              <div className="text-xs text-slate-400 font-mono hidden sm:block">
                <span>4s: <strong className="text-slate-200">{nonStrikerStats?.fours || 0}</strong></span> • 
                <span> 6s: <strong className="text-slate-200">{nonStrikerStats?.sixes || 0}</strong></span>
              </div>
              <div className="text-xs font-bold text-slate-400 font-mono">
                SR: {getBatsmanSR(nonStrikerStats?.runs, nonStrikerStats?.balls)}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Active Bowler Card (Col 4) */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <Shield className="w-4 h-4" />
              <span>Current Bowler</span>
            </div>

            <button
              onClick={onChangeBowlerClick}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
            >
              Change Bowler
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="font-extrabold text-white text-base sm:text-lg">
              {bowlerPlayer?.name || 'Bowler'}
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Overs</span>
                <strong className="text-sm font-bold text-slate-100 font-mono">
                  {bowlerStats?.overs || 0}.{bowlerStats?.balls || 0}
                </strong>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Wickets/Runs</span>
                <strong className="text-sm font-bold text-emerald-400 font-mono">
                  {bowlerStats?.wickets || 0} / {bowlerStats?.runsConceded || 0}
                </strong>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Economy</span>
                <strong className="text-sm font-bold text-slate-100 font-mono">
                  {getBowlerEconomy(bowlerStats?.runsConceded, bowlerStats?.overs, bowlerStats?.balls)}
                </strong>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Maidens</span>
                <strong className="text-sm font-bold text-slate-100 font-mono">
                  {bowlerStats?.maidens || 0}
                </strong>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
export default LivePitchCard;

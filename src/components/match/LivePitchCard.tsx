import React from 'react';
import { useCricket } from '../../context/CricketContext';
import { Flame, Shield, ArrowLeftRight } from 'lucide-react';

interface LivePitchCardProps {
  onChangeBowlerClick: () => void;
}

export const LivePitchCard: React.FC<LivePitchCardProps> = ({ onChangeBowlerClick }) => {
  const { players, activeInnings, swapStriker, isScorer } = useCricket();

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

          {isScorer && (
            <button
              onClick={swapStriker}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition active:scale-95"
              title="Swap striker and non-striker positions"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>Swap Strike</span>
            </button>
          )}
        </div>

        {/* Batsmen Table / Grid */}
        <div className="space-y-2.5">
          
          {/* Striker */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-extrabold text-white text-sm sm:text-base">
                    {strikerPlayer?.name || 'Striker'}
                  </h4>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                    Striker *
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  {strikerPlayer?.role || 'Batsman'} • {strikerPlayer?.battingStyle || 'Right-hand'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-base sm:text-lg font-black text-white font-mono">
                <span className="text-emerald-400">{strikerStats?.runs || 0}</span>
                <span className="text-slate-400 text-xs font-normal"> ({strikerStats?.balls || 0}b)</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium font-mono">
                4s: {strikerStats?.fours || 0} | 6s: {strikerStats?.sixes || 0} | SR: {getBatsmanSR(strikerStats?.runs, strikerStats?.balls)}
              </div>
            </div>
          </div>

          {/* Non-Striker */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-extrabold text-slate-200 text-sm sm:text-base">
                    {nonStrikerPlayer?.name || 'Non-Striker'}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold">Non-Striker</span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {nonStrikerPlayer?.role || 'Batsman'} • {nonStrikerPlayer?.battingStyle || 'Right-hand'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-base sm:text-lg font-black text-slate-200 font-mono">
                <span>{nonStrikerStats?.runs || 0}</span>
                <span className="text-slate-400 text-xs font-normal"> ({nonStrikerStats?.balls || 0}b)</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium font-mono">
                4s: {nonStrikerStats?.fours || 0} | 6s: {nonStrikerStats?.sixes || 0} | SR: {getBatsmanSR(nonStrikerStats?.runs, nonStrikerStats?.balls)}
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

            {isScorer && (
              <button
                onClick={onChangeBowlerClick}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition active:scale-95"
              >
                Change Bowler
              </button>
            )}
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

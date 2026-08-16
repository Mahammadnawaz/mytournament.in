import React from 'react';
import type { BallLog } from '../../types/cricket';
import { Activity } from 'lucide-react';

interface OverTimelineProps {
  recentBalls: BallLog[];
}

export const OverTimeline: React.FC<OverTimelineProps> = ({ recentBalls }) => {
  const getBallBadgeStyle = (ball: BallLog) => {
    if (ball.isWicket) {
      return 'bg-red-500 text-white font-extrabold shadow-lg shadow-red-500/30 border-red-400';
    }
    if (ball.runsScored === 6) {
      return 'bg-purple-600 text-white font-extrabold shadow-lg shadow-purple-500/30 border-purple-400';
    }
    if (ball.runsScored === 4) {
      return 'bg-blue-600 text-white font-bold border-blue-400';
    }
    if (ball.extras.type === 'wide') {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
    }
    if (ball.extras.type === 'no-ball') {
      return 'bg-amber-600/20 text-amber-300 border-amber-600/40 font-bold';
    }
    if (ball.totalRuns === 0) {
      return 'bg-slate-800 text-slate-400 border-slate-700';
    }
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold';
  };

  const getBallLabel = (ball: BallLog) => {
    if (ball.isWicket) return 'W';
    if (ball.extras.type === 'wide') return `Wd${ball.totalRuns > 1 ? '+' + (ball.totalRuns - 1) : ''}`;
    if (ball.extras.type === 'no-ball') return `NB${ball.runsScored > 0 ? '+' + ball.runsScored : ''}`;
    if (ball.extras.type === 'bye') return `${ball.extras.runs}B`;
    if (ball.extras.type === 'leg-bye') return `${ball.extras.runs}LB`;
    return ball.runsScored.toString();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex items-center justify-between">
      <div className="flex items-center space-x-2 text-slate-300 text-xs font-semibold uppercase tracking-wider">
        <Activity className="w-4 h-4 text-emerald-400" />
        <span>Current Over:</span>
      </div>

      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
        {recentBalls.length > 0 ? (
          recentBalls.map((ball) => (
            <div
              key={ball.id}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-mono transition transform hover:scale-110 ${getBallBadgeStyle(
                ball
              )}`}
            >
              {getBallLabel(ball)}
            </div>
          ))
        ) : (
          <span className="text-xs text-slate-500 italic">No balls bowled yet in this over</span>
        )}
      </div>
    </div>
  );
};
export default OverTimeline;

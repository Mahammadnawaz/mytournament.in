import React, { useState } from 'react';
import { useCricket } from '../../context/CricketContext';
import { ArrowRight } from 'lucide-react';

export const InningsTransitionModal: React.FC = () => {
  const { players, activeMatch, startSecondInnings } = useCricket();

  if (!activeMatch || !activeMatch.innings1) return null;

  const innings1 = activeMatch.innings1;
  const target = innings1.totalRuns + 1;

  const battingTeamConfig = innings1.bowlingTeam === activeMatch.teamA.name ? activeMatch.teamA : activeMatch.teamB;
  const bowlingTeamConfig = innings1.battingTeam === activeMatch.teamA.name ? activeMatch.teamA : activeMatch.teamB;

  const battingPlayers = players.filter(p => battingTeamConfig.playerIds.includes(p.id));
  const bowlingPlayers = players.filter(p => bowlingTeamConfig.playerIds.includes(p.id));

  const [strikerId, setStrikerId] = useState<string>(battingPlayers[0]?.id || '');
  const [nonStrikerId, setNonStrikerId] = useState<string>(battingPlayers[1]?.id || '');
  const [bowlerId, setBowlerId] = useState<string>(bowlingPlayers[0]?.id || '');

  const handleStart = () => {
    if (strikerId && nonStrikerId && bowlerId && strikerId !== nonStrikerId) {
      startSecondInnings(strikerId, nonStrikerId, bowlerId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-500/40 p-5 rounded-2xl text-center space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
            Innings 1 Completed
          </span>
          <h2 className="text-3xl font-black text-white">
            {innings1.battingTeam}: {innings1.totalRuns}/{innings1.wickets}
          </h2>
          <p className="text-sm font-bold text-amber-400">
            {innings1.bowlingTeam} needs <span className="text-2xl">{target}</span> runs to win off {activeMatch.totalOvers} overs
          </p>
        </div>

        {/* 2nd Innings Openers Setup */}
        <div className="space-y-4 text-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Select 2nd Innings Opening Lineup
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">Opening Striker</label>
              <select
                value={strikerId}
                onChange={(e) => setStrikerId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold outline-none"
              >
                {battingPlayers.map(p => (
                  <option key={`str-${p.id}`} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">Non-Striker</label>
              <select
                value={nonStrikerId}
                onChange={(e) => setNonStrikerId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold outline-none"
              >
                {battingPlayers.filter(p => p.id !== strikerId).map(p => (
                  <option key={`non-${p.id}`} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1 font-semibold">Opening Bowler</label>
            <select
              value={bowlerId}
              onChange={(e) => setBowlerId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold outline-none"
            >
              {bowlingPlayers.map(p => (
                <option key={`bw-${p.id}`} value={p.id}>{p.name} ({p.bowlingStyle})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleStart}
          className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-base shadow-lg shadow-emerald-500/25 transition active:scale-95"
        >
          <span>Start 2nd Innings Chase</span>
          <ArrowRight className="w-5 h-5" />
        </button>

      </div>
    </div>
  );
};
export default InningsTransitionModal;

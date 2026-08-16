import React, { useState } from 'react';
import { useCricket } from '../../context/CricketContext';
import type { InningsState, Match } from '../../types/cricket';
import { FileText, Trophy, Shield, Flame, Award } from 'lucide-react';

interface MatchScorecardProps {
  matchOverride?: Match;
}

export const MatchScorecard: React.FC<MatchScorecardProps> = ({ matchOverride }) => {
  const { activeMatch, matches, players } = useCricket();
  const [selectedMatchId, setSelectedMatchId] = useState<string>(() => {
    return matchOverride?.id || activeMatch?.id || (matches.length > 0 ? matches[0].id : '');
  });
  const [selectedInningsNo, setSelectedInningsNo] = useState<1 | 2>(1);

  // Determine active match to display
  const match = matchOverride || matches.find(m => m.id === selectedMatchId) || activeMatch || matches[0];

  if (!match) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-2xl space-y-3">
        <FileText className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">No Matches Recorded Yet</h3>
        <p className="text-xs text-slate-400">Start a match or select one from history to view the full detailed scorecard.</p>
      </div>
    );
  }

  const currentInningsState: InningsState | undefined =
    selectedInningsNo === 1 ? match.innings1 : match.innings2;

  const potmPlayer = match.potmInfo ? players.find(p => p.id === match.potmInfo?.playerId) : undefined;

  const renderInningsTable = (innings?: InningsState) => {
    if (!innings) {
      return (
        <div className="p-8 text-center text-slate-500 italic text-sm">
          Innings 2 has not started yet.
        </div>
      );
    }

    const batsmenList = Object.values(innings.batsmenStats);
    const bowlerList = Object.values(innings.bowlerStats);

    return (
      <div className="space-y-6">
        
        {/* Batting Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="bg-slate-950/80 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
              <Flame className="w-4 h-4" />
              <span>{innings.battingTeam} Batting Scorecard</span>
            </div>
            <span className="font-bold text-white text-sm">
              {innings.totalRuns}/{innings.wickets} ({innings.overs}.{innings.balls} ov)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-950/40 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Batsman</th>
                  <th className="py-3 px-4">Dismissal</th>
                  <th className="py-3 px-4 text-right">R</th>
                  <th className="py-3 px-4 text-right">B</th>
                  <th className="py-3 px-4 text-right">4s</th>
                  <th className="py-3 px-4 text-right">6s</th>
                  <th className="py-3 px-4 text-right">SR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {batsmenList.map((b) => {
                  const player = players.find(p => p.id === b.playerId);
                  const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0';

                  // Build proper cricket dismissal text from stored IDs
                  const bowlerName = b.bowlerId ? players.find(p => p.id === b.bowlerId)?.name : null;
                  const fielderName = b.fielderId ? players.find(p => p.id === b.fielderId)?.name : null;

                  let dismissalDisplay = '';
                  if (b.isOut) {
                    if (b.dismissalText && b.dismissalText.trim() !== '') {
                      // use pre-stored text only if it's meaningful (not empty or raw IDs)
                      dismissalDisplay = b.dismissalText;
                    } else if (b.dismissalType === 'bowled') {
                      dismissalDisplay = bowlerName ? `b ${bowlerName}` : 'bowled';
                    } else if (b.dismissalType === 'caught') {
                      if (fielderName && bowlerName) {
                        dismissalDisplay = `c ${fielderName} b ${bowlerName}`;
                      } else if (bowlerName) {
                        dismissalDisplay = `c & b ${bowlerName}`;
                      } else {
                        dismissalDisplay = 'caught';
                      }
                    } else if (b.dismissalType === 'lbw') {
                      dismissalDisplay = bowlerName ? `lbw b ${bowlerName}` : 'lbw';
                    } else if (b.dismissalType === 'stumped') {
                      if (fielderName && bowlerName) {
                        dismissalDisplay = `st ${fielderName} b ${bowlerName}`;
                      } else if (bowlerName) {
                        dismissalDisplay = `st b ${bowlerName}`;
                      } else {
                        dismissalDisplay = 'stumped';
                      }
                    } else if (b.dismissalType === 'run-out') {
                      dismissalDisplay = fielderName ? `run out (${fielderName})` : 'run out';
                    } else if (b.dismissalType === 'hit-wicket') {
                      dismissalDisplay = bowlerName ? `hit wkt b ${bowlerName}` : 'hit wicket';
                    } else if (b.dismissalType === 'retired-hurt') {
                      dismissalDisplay = 'retired hurt';
                    } else {
                      dismissalDisplay = 'out';
                    }
                  }

                  return (
                    <tr key={b.playerId} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-white flex items-center space-x-2">
                        <span>{player?.name || 'Batsman'}</span>
                        {!b.isOut && <span className="text-emerald-400 font-extrabold">*</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs italic">
                        {b.isOut
                          ? <span title={dismissalDisplay}>{dismissalDisplay}</span>
                          : <span className="text-emerald-400 font-semibold not-italic">not out</span>
                        }
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-100 font-mono">{b.runs}</td>
                      <td className="py-3 px-4 text-right text-slate-400 font-mono">{b.balls}</td>
                      <td className="py-3 px-4 text-right text-slate-300 font-mono">{b.fours}</td>
                      <td className="py-3 px-4 text-right text-slate-300 font-mono">{b.sixes}</td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-400 font-mono">{sr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Extras Footer */}
          <div className="bg-slate-950/60 px-5 py-3 border-t border-slate-800 text-xs flex flex-wrap justify-between text-slate-400">
            <div>
              <span>Extras: </span>
              <strong className="text-slate-200">{innings.extrasTotal.total}</strong> (w {innings.extrasTotal.wides}, nb {innings.extrasTotal.noBalls}, b {innings.extrasTotal.byes}, lb {innings.extrasTotal.legByes})
            </div>
            <div>
              <span>Total Score: </span>
              <strong className="text-emerald-400">{innings.totalRuns}/{innings.wickets}</strong> ({innings.overs}.{innings.balls} Overs)
            </div>
          </div>
        </div>

        {/* Bowling Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="bg-slate-950/80 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <Shield className="w-4 h-4" />
              <span>{innings.bowlingTeam} Bowling Figures</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-950/40 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Bowler</th>
                  <th className="py-3 px-4 text-right">O</th>
                  <th className="py-3 px-4 text-right">M</th>
                  <th className="py-3 px-4 text-right">R</th>
                  <th className="py-3 px-4 text-right">W</th>
                  <th className="py-3 px-4 text-right">Econ</th>
                  <th className="py-3 px-4 text-right">Wd/NB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bowlerList.map((bw) => {
                  const player = players.find(p => p.id === bw.playerId);
                  const totalOversFloat = bw.overs + bw.balls / 6;
                  const econ = totalOversFloat > 0 ? (bw.runsConceded / totalOversFloat).toFixed(2) : '0.00';

                  return (
                    <tr key={bw.playerId} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-bold text-white">
                        {player?.name || 'Bowler'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">{bw.overs}.{bw.balls}</td>
                      <td className="py-3 px-4 text-right text-slate-400 font-mono">{bw.maidens}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-200">{bw.runsConceded}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-400 font-mono">{bw.wickets}</td>
                      <td className="py-3 px-4 text-right font-semibold text-amber-400 font-mono">{econ}</td>
                      <td className="py-3 px-4 text-right text-slate-400 font-mono">{bw.wides}/{bw.noBalls}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fall of Wickets (FOW) Timeline */}
        {innings.fow.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Fall of Wickets (FOW)
            </h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {innings.fow.map((fow) => {
                const player = players.find(p => p.id === fow.playerId);
                return (
                  <div key={fow.wicketNo} className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
                    <span className="font-bold text-emerald-400">{fow.runs}-{fow.wicketNo}</span>{' '}
                    <span className="text-slate-300">({player?.name || 'Batsman'}, {fow.overs} ov)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Match Result Banner & POTM Award */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        
        {/* Match Switcher Dropdown if multiple matches exist */}
        {!matchOverride && matches.length > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Select Match from History:
            </span>
            <select
              value={match.id}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 max-w-xs"
            >
              {matches.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.teamA.name} vs {m.teamB.name}) - {m.status === 'live' ? '🔴 LIVE' : 'COMPLETED'}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">
              {match.name} • {match.venue}
            </span>
            <h2 className="text-2xl font-black text-white">
              {match.teamA.name} vs {match.teamB.name}
            </h2>
            {match.result && (
              <p className="text-sm font-bold text-amber-400 mt-1 flex items-center space-x-1.5">
                <Trophy className="w-4 h-4" />
                <span>{match.result}</span>
              </p>
            )}
          </div>

          {/* Innings Selector Tabs */}
          <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 self-start md:self-auto">
            <button
              onClick={() => setSelectedInningsNo(1)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                selectedInningsNo === 1
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1st Innings
            </button>
            <button
              onClick={() => setSelectedInningsNo(2)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                selectedInningsNo === 2
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2nd Innings
            </button>
          </div>
        </div>

        {/* PLAYER OF THE MATCH — micro badge */}
        {potmPlayer && (
          <div className="potm-player-row flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-1.5 self-start shadow-sm">
            <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-wide whitespace-nowrap">POTM</span>
            <span className="potm-player-name font-bold text-white text-xs sm:text-sm">{potmPlayer.name}</span>
            {match.potmInfo?.summary && (
              <span className="potm-summary-text hidden md:block text-[11px] text-slate-400 truncate max-w-[200px]">• {match.potmInfo.summary}</span>
            )}
            <span className="potm-points-text text-xs sm:text-sm font-black text-amber-400 font-mono ml-1 pl-2 border-l border-slate-700">{match.potmInfo?.points}pts</span>
          </div>
        )}

      </div>

      {/* Selected Innings Tables */}
      {renderInningsTable(currentInningsState)}

    </div>
  );
};
export default MatchScorecard;

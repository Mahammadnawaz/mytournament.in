import React, { useState, useEffect } from 'react';
import { CricketProvider, useCricket } from './context/CricketContext';
import Navbar from './components/layout/Navbar';
import LoginPage from './components/auth/LoginPage';
import PlayerDirectory from './components/players/PlayerDirectory';
import LiveScoreboard from './components/match/LiveScoreboard';
import LiveCommentaryFeed from './components/match/LiveCommentaryFeed';
import LivePitchCard from './components/match/LivePitchCard';
import OverTimeline from './components/match/OverTimeline';
import ScoringControlPanel from './components/match/ScoringControlPanel';
import InningsTransitionModal from './components/match/InningsTransitionModal';
import BowlerSelectModal from './components/match/BowlerSelectModal';
import MatchSetupModal from './components/match/MatchSetupModal';
import MatchScorecard from './components/scorecard/MatchScorecard';
import MatchHistory from './components/scorecard/MatchHistory';
import MatchAnalytics from './components/analytics/MatchAnalytics';
import SeriesDashboard from './components/series/SeriesDashboard';
import LiveCelebrationOverlay from './components/match/LiveCelebrationOverlay';
import { calculateSeriesMVP } from './utils/cricketEngine';
import { Plus, Swords, RotateCw, Trophy, Play, Coffee, Star } from 'lucide-react';

class TabErrorBoundary extends React.Component<{ children: React.ReactNode; tabName: string }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: { tabName: string }) {
    if (prevProps.tabName !== this.props.tabName) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error(`Tab ${this.props.tabName} rendering error:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center max-w-md mx-auto my-8 shadow-2xl space-y-3">
          <h3 className="text-lg font-bold text-white">Loading View...</h3>
          <p className="text-xs text-slate-400">Section components are loading.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow hover:bg-emerald-400 transition"
          >
            Retry Loading ↻
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainContent: React.FC = () => {
  const { activeMatch, activeInnings, activeTab, changeBowler, isScorer, isLoggedIn, resetToDemoData, seriesList, matches, players, seriesBreakTimer, startSeriesBreak, cancelSeriesBreak } = useCricket();
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupMatchParams, setSetupMatchParams] = useState<{
    seriesId?: string;
    matchName?: string;
    teamA?: string;
    teamB?: string;
  } | null>(null);

  const [breakRemainingSecs, setBreakRemainingSecs] = useState<number>(() => {
    if (!seriesBreakTimer) return 0;
    return Math.max(0, Math.floor((seriesBreakTimer.endTime - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!seriesBreakTimer) {
      setBreakRemainingSecs(0);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((seriesBreakTimer.endTime - Date.now()) / 1000));
      setBreakRemainingSecs(remaining);
      if (remaining <= 0) {
        cancelSeriesBreak();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [seriesBreakTimer]);

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  const renderScoringTab = () => {
    const currentRemainingSecs = seriesBreakTimer ? Math.max(0, Math.floor((seriesBreakTimer.endTime - Date.now()) / 1000)) : breakRemainingSecs;

    // Inter-Match Break Banner (visible to SPECTATORS & SCORERS on Home Screen)
    const breakBanner = seriesBreakTimer && currentRemainingSecs > 0 ? (
      <div className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 p-0.5 rounded-3xl shadow-2xl animate-pulse my-4">
        <div className="bg-slate-950/95 rounded-[22px] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shrink-0">
              <Coffee className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-400/20 text-indigo-300 text-xs font-black uppercase tracking-widest border border-indigo-400/30">
                  INTER-MATCH BREAK IN PROGRESS ({seriesBreakTimer.durationMinutes} MINS)
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1 flex items-center space-x-3">
                <span>Break Remaining:</span>
                <span className="font-mono text-emerald-400 text-2xl sm:text-3xl font-black bg-slate-900 px-3.5 py-1 rounded-xl border border-slate-800">
                  {Math.floor(currentRemainingSecs / 60).toString().padStart(2, '0')}:{(currentRemainingSecs % 60).toString().padStart(2, '0')}
                </span>
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Teams are taking a strategy break before Match {seriesBreakTimer.nextMatchNo} starts.
              </p>
            </div>
          </div>

          {isScorer && (
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  const targetSeries = seriesList.find(s => s.id === seriesBreakTimer.seriesId);
                  cancelSeriesBreak();
                  if (targetSeries) {
                    setSetupMatchParams({
                      seriesId: targetSeries.id,
                      matchName: `${targetSeries.name} - Match ${seriesBreakTimer.nextMatchNo}`,
                      teamA: targetSeries.teamA,
                      teamB: targetSeries.teamB,
                    });
                    setShowSetupModal(true);
                  }
                }}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition shadow-lg flex items-center justify-center space-x-1.5"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>End Break & Start Match {seriesBreakTimer.nextMatchNo} Now ➔</span>
              </button>
              <button
                onClick={cancelSeriesBreak}
                className="px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition border border-slate-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    ) : null;

    if (!activeMatch) {
      // Find latest ongoing or active series for prompt
      const ongoingSeries = seriesList.find(s => {
        const sMatches = matches.filter(m => m.seriesId === s.id || s.matchIds?.includes(m.id));
        const doneCount = sMatches.filter(m => m.status === 'completed').length;
        return doneCount < s.totalMatches;
      });

      let seriesPrompt = null;
      if (ongoingSeries) {
        const sMatches = matches.filter(m => m.seriesId === ongoingSeries.id || ongoingSeries.matchIds?.includes(m.id));
        const doneCount = sMatches.filter(m => m.status === 'completed').length;
        const nextNo = Math.min(ongoingSeries.totalMatches, doneCount + 1);

        let winsA = 0;
        let winsB = 0;
        sMatches.filter(m => m.status === 'completed').forEach(m => {
          const winner = m.winnerTeam || (m.result?.includes(' won by ') ? m.result.split(' won by ')[0].trim() : undefined);
          if (winner === ongoingSeries.teamA) winsA++;
          else if (winner === ongoingSeries.teamB) winsB++;
        });

        seriesPrompt = !seriesBreakTimer ? (
          <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 p-0.5 rounded-3xl shadow-2xl animate-pulse space-y-3 mb-6">
            <div className="bg-slate-950/95 rounded-[22px] p-5 sm:p-6 flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-widest border border-amber-400/30">
                        {ongoingSeries.name} • Match {doneCount} of {ongoingSeries.totalMatches} Completed
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-2xl font-extrabold text-white mt-1">
                      Start Match {nextNo} of {ongoingSeries.totalMatches} Series?
                    </h3>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">
                      Ready for Match {nextNo} ({ongoingSeries.teamA} vs {ongoingSeries.teamB})? Choose to start now or schedule a break:
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-center self-start sm:self-auto shrink-0">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">Series Head-to-Head</span>
                  <div className="flex items-center space-x-2 text-xs sm:text-sm font-black mt-0.5">
                    <span className="text-emerald-400">{ongoingSeries.teamA} ({winsA})</span>
                    <span className="text-slate-500">-</span>
                    <span className="text-cyan-400">({winsB}) {ongoingSeries.teamB}</span>
                  </div>
                </div>
              </div>

              {isScorer && (
                <div className="flex flex-wrap items-center gap-2.5 pt-1 justify-end">
                  <button
                    onClick={() => {
                      setSetupMatchParams({
                        seriesId: ongoingSeries.id,
                        matchName: `${ongoingSeries.name} - Match ${nextNo}`,
                        teamA: ongoingSeries.teamA,
                        teamB: ongoingSeries.teamB,
                      });
                      setShowSetupModal(true);
                    }}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-xl transition transform active:scale-95 flex items-center space-x-1.5"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Match {nextNo} Immediately ➔</span>
                  </button>

                  <button
                    onClick={() => startSeriesBreak(ongoingSeries.id, nextNo, 15)}
                    className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold text-xs transition border border-amber-500/40 flex items-center space-x-1.5"
                  >
                    <Coffee className="w-4 h-4 text-amber-400" />
                    <span>Take 15 Min Break ☕</span>
                  </button>

                  <button
                    onClick={() => startSeriesBreak(ongoingSeries.id, nextNo, 30)}
                    className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold text-xs transition border border-amber-500/40 flex items-center space-x-1.5"
                  >
                    <Coffee className="w-4 h-4 text-amber-400" />
                    <span>Take 30 Min Break ☕</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null;
      }

      return (
        <div className="space-y-6">
          {breakBanner}
          {seriesPrompt}
          <div className="theme-bg-card border rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto my-8 shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
              <Swords className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-white flex items-center justify-center space-x-2">
              <span>No Matches Ongoing</span>
              <span className="text-xl">🏏</span>
            </h2>
            <p className="text-sm text-slate-400">
              {isScorer 
                ? 'There are currently no live matches in progress. Set up a new match with custom teams, toss selection, and overs limit to start live scorekeeping.'
                : 'There are currently no live matches ongoing. You can browse completed matches in Match History or view Series & Tournaments.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {isScorer && (
                <button
                  onClick={() => {
                    setSetupMatchParams(null);
                    setShowSetupModal(true);
                  }}
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition active:scale-95"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create New Match</span>
                </button>
              )}
              <button
                onClick={resetToDemoData}
                className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 transition active:scale-95"
              >
                <RotateCw className="w-4 h-4 text-emerald-400" />
                <span>Load Demo Match</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    const needsInnings2Setup =
      activeMatch.currentInnings === 1 &&
      activeMatch.innings1?.isCompleted &&
      !activeMatch.innings2;

    const linkedSeries = (activeMatch.seriesId 
      ? seriesList.find(s => s.id === activeMatch.seriesId)
      : seriesList.find(s => s.matchIds?.includes(activeMatch.id))) ||
      seriesList.find(s => (s.teamA === activeMatch.teamA.name && s.teamB === activeMatch.teamB.name) || (s.teamA === activeMatch.teamB.name && s.teamB === activeMatch.teamA.name)) ||
      seriesList.find(s => s.status === 'ongoing') ||
      seriesList[0];

    const seriesMatches = linkedSeries
      ? matches.filter(m => {
          if (m.matchCategory === 'individual') return false;
          if (m.seriesId) return m.seriesId === linkedSeries.id;
          if (linkedSeries.matchIds?.includes(m.id)) return true;
          return false;
        })
      : [];

    const totalSeriesMatches = linkedSeries?.totalMatches || 3;
    const completedCount = Math.min(totalSeriesMatches, seriesMatches.filter(m => m.status === 'completed').length);
    const nextMatchNo = Math.min(totalSeriesMatches, completedCount + 1);

    let teamAWins = 0;
    let teamBWins = 0;
    if (linkedSeries) {
      seriesMatches.filter(m => m.status === 'completed').forEach(m => {
        const winner = m.winnerTeam || (m.result?.includes(' won by ') ? m.result.split(' won by ')[0].trim() : undefined);
        if (winner === linkedSeries.teamA) teamAWins++;
        else if (winner === linkedSeries.teamB) teamBWins++;
      });
    }

    const { leaderboard } = linkedSeries ? calculateSeriesMVP(linkedSeries, seriesMatches) : { leaderboard: [] };
    const topMvpStats = leaderboard[0];
    const seriesMVPPlayer = topMvpStats ? players.find(p => p.id === topMvpStats.playerId) : undefined;

    return (
      <div className="space-y-6">
        {/* Live Inter-Match Break Banner (ALWAYS FIRST AT TOP OF HOME PAGE) */}
        {breakBanner}

        {/* Hero Scoreboard */}
        <LiveScoreboard />

        {/* Pitch Card & Live Scoring Controls */}
        {activeMatch.status === 'live' && activeInnings && !needsInnings2Setup && (
          <>
            <OverTimeline recentBalls={activeInnings.recentBalls} />
            <ScoringControlPanel />
            <LivePitchCard onChangeBowlerClick={() => setShowBowlerModal(true)} />
          </>
        )}

        {/* Live Commentary Feed & Winner Banner */}
        <LiveCommentaryFeed />

        {/* Next Series Match Prompt Action Banner */}
        {activeMatch.status === 'completed' && linkedSeries && completedCount < totalSeriesMatches && !seriesBreakTimer && isScorer && (
          <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 p-0.5 rounded-3xl shadow-2xl animate-pulse space-y-3">
            <div className="bg-slate-950/95 rounded-[22px] p-5 sm:p-6 flex flex-col space-y-4">
              
              {/* Header Info & Head-to-Head */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-widest border border-amber-400/30">
                        {linkedSeries.name} • Match {completedCount} of {totalSeriesMatches} Completed
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-2xl font-extrabold text-white mt-1">
                      Start Match {nextMatchNo} of {totalSeriesMatches} Series?
                    </h3>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">
                      Match {completedCount} is completed ({activeMatch.result || 'Finished'}). Choose to start Match {nextMatchNo} immediately or schedule a break:
                    </p>
                  </div>
                </div>

                {/* Head to Head Series Ratio Pill */}
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl text-center self-start sm:self-auto shrink-0">
                  <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">Series Head-to-Head</span>
                  <div className="flex items-center space-x-2 text-xs sm:text-sm font-black mt-0.5">
                    <span className="text-emerald-400">{linkedSeries.teamA} ({teamAWins})</span>
                    <span className="text-slate-500">-</span>
                    <span className="text-cyan-400">({teamBWins}) {linkedSeries.teamB}</span>
                  </div>
                </div>
              </div>

              {/* Series MVP Leader Banner */}
              {seriesMVPPlayer && topMvpStats && (
                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                      <Star className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider block">Series MVP Leader</span>
                      <span className="font-extrabold text-white">{seriesMVPPlayer.name}</span>
                    </div>
                  </div>
                  <div className="font-mono text-right">
                    <span className="text-emerald-400 font-black block">{topMvpStats.mvpPoints} MVP Pts</span>
                    <span className="text-[10px] text-slate-400">{topMvpStats.runs} Runs • {topMvpStats.wickets} Wkts</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 justify-end">
                <button
                  onClick={() => {
                    setSetupMatchParams({
                      seriesId: linkedSeries.id,
                      matchName: `${linkedSeries.name} - Match ${nextMatchNo}`,
                      teamA: linkedSeries.teamA,
                      teamB: linkedSeries.teamB,
                    });
                    setShowSetupModal(true);
                  }}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-xl transition transform active:scale-95 flex items-center space-x-1.5"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Match {nextMatchNo} Immediately ➔</span>
                </button>

                <button
                  onClick={() => startSeriesBreak(linkedSeries.id, nextMatchNo, 15)}
                  className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold text-xs transition border border-amber-500/40 flex items-center space-x-1.5"
                >
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <span>Take 15 Min Break ☕</span>
                </button>

                <button
                  onClick={() => startSeriesBreak(linkedSeries.id, nextMatchNo, 30)}
                  className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold text-xs transition border border-amber-500/40 flex items-center space-x-1.5"
                >
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <span>Take 30 Min Break ☕</span>
                </button>

                <button
                  onClick={() => startSeriesBreak(linkedSeries.id, nextMatchNo, 45)}
                  className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-extrabold text-xs transition border border-amber-500/40 flex items-center space-x-1.5"
                >
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <span>Take 45 Min Break ☕</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Completed Match Full Scorecard - Stays on Home Screen until next match starts */}
        {activeMatch.status === 'completed' && (
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-xl font-extrabold text-white flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              <span>Final Match Scorecard & Summary</span>
            </h3>
            <MatchScorecard />
          </div>
        )}

        {/* 2nd Innings Transition Modal - Strictly for Scorer Only */}
        {needsInnings2Setup && isScorer && <InningsTransitionModal />}

        {/* Change Bowler Modal */}
        {showBowlerModal && (
          <BowlerSelectModal
            onSelect={(bowlerId) => changeBowler(bowlerId)}
            onClose={() => setShowBowlerModal(false)}
          />
        )}

        {/* Match Setup Modal */}
        {showSetupModal && (
          <MatchSetupModal
            onClose={() => {
              setShowSetupModal(false);
              setSetupMatchParams(null);
            }}
            initialSeriesId={setupMatchParams?.seriesId}
            initialMatchName={setupMatchParams?.matchName}
            initialTeamA={setupMatchParams?.teamA}
            initialTeamB={setupMatchParams?.teamB}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen theme-bg-main flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      <Navbar />
      <LiveCelebrationOverlay />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 sm:pb-8">
        <TabErrorBoundary tabName={activeTab || 'scoring'}>
          {(activeTab === 'scoring' || (activeTab as any) === 'home' || !activeTab) && renderScoringTab()}
          {activeTab === 'series' && <SeriesDashboard />}
          {activeTab === 'players' && <PlayerDirectory />}
          {activeTab === 'scorecard' && <MatchScorecard />}
          {activeTab === 'analytics' && <MatchAnalytics />}
          {activeTab === 'history' && <MatchHistory />}
        </TabErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CricPulse Live Scorekeeper & Player Analytics Engine</span>
          <span className="text-slate-600">Built with React, TypeScript & Tailwind CSS</span>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <CricketProvider>
      <MainContent />
    </CricketProvider>
  );
}

export default App;

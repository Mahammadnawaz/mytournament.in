import React, { useState } from 'react';
import { CricketProvider, useCricket } from './context/CricketContext';
import Navbar from './components/layout/Navbar';
import LoginPage from './components/auth/LoginPage';
import PlayerDirectory from './components/players/PlayerDirectory';
import LiveScoreboard from './components/match/LiveScoreboard';
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
import { Plus, Swords } from 'lucide-react';

const MainContent: React.FC = () => {
  const { activeMatch, activeInnings, activeTab, changeBowler, isScorer, isLoggedIn } = useCricket();
  const [showBowlerModal, setShowBowlerModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  if (!isLoggedIn) {
    return <LoginPage />;
  }

  const renderScoringTab = () => {
    if (!activeMatch) {
      return (
        <div className="theme-bg-card border rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto my-8 shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <Swords className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">No Active Match in Progress</h2>
          <p className="text-sm text-slate-400">
            {isScorer 
              ? 'Set up a new cricket match with custom teams, toss selection, and overs limit to start live scorekeeping.'
              : 'Waiting for the official scorer to start a match... Live scores will stream here in real-time as soon as play begins.'}
          </p>
          {isScorer && (
            <button
              onClick={() => setShowSetupModal(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>Create New Match</span>
            </button>
          )}
        </div>
      );
    }

    const needsInnings2Setup =
      activeMatch.currentInnings === 1 &&
      activeMatch.innings1?.isCompleted &&
      !activeMatch.innings2;

    return (
      <div className="space-y-6">
        {/* Hero Scoreboard */}
        <LiveScoreboard />

        {/* Pitch Card & Controls */}
        {activeMatch.status === 'live' && activeInnings && !needsInnings2Setup && (
          <>
            <OverTimeline recentBalls={activeInnings.recentBalls} />
            <ScoringControlPanel />
            <LivePitchCard onChangeBowlerClick={() => setShowBowlerModal(true)} />
          </>
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
      </div>
    );
  };

  return (
    <div className="min-h-screen theme-bg-main flex flex-col selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      <Navbar />
      <LiveCelebrationOverlay />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 sm:pb-8">
        {activeTab === 'scoring' && renderScoringTab()}
        {activeTab === 'series' && <SeriesDashboard />}
        {activeTab === 'players' && <PlayerDirectory />}
        {activeTab === 'scorecard' && <MatchScorecard />}
        {activeTab === 'analytics' && <MatchAnalytics />}
        {activeTab === 'history' && <MatchHistory />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CricPulse Live Scorekeeper & Player Analytics Engine</span>
          <span className="text-slate-600">Built with React, TypeScript & Tailwind CSS</span>
        </div>
      </footer>

      {showSetupModal && (
        <MatchSetupModal onClose={() => setShowSetupModal(false)} />
      )}
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

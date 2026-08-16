import React, { useState } from 'react';
import { useCricket } from '../../context/CricketContext';
import { cloudSync } from '../../services/cloudSync';
import { Trophy, Activity, Lock, Shield, Eye, Flame, ChevronRight, X, AlertCircle, User, ShieldAlert } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { activeScorer, deviceId, loginAsScorer, loginAsSpectator } = useCricket();

  // Modal State
  const [modalRole, setModalRole] = useState<'scorer' | 'spectator' | null>(null);
  const [inputName, setInputName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockedBannerMessage, setLockedBannerMessage] = useState<string | null>(null);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState<boolean>(false);

  const isScorerLockedByOther = Boolean(activeScorer && activeScorer.deviceId && activeScorer.deviceId !== deviceId);
  const lockedScorerName = activeScorer?.userName || activeScorer?.deviceName || 'Official Scorer';

  const handleOpenScorerModal = async () => {
    setErrorMessage(null);
    setLockedBannerMessage(null);

    // 1. Check live lock from cloud in real-time
    try {
      const liveLock = await cloudSync.getActiveScorerLock();
      if (liveLock && liveLock.deviceId && liveLock.deviceId !== deviceId) {
        const lockedName = liveLock.userName || liveLock.deviceName || 'Official Scorer';
        setLockedBannerMessage(
          `🔒 Access Denied: Match scoring is already locked by official scorer: "${lockedName}".\n\nOnly 1 official scorer is allowed. Please login as Spectator to watch the live match.`
        );
        setShowAccessDeniedModal(true);
        return;
      }
    } catch {
      // Fallback to local activeScorer state
    }

    // 2. If another device/user is already scoring, deny and instruct to use Spectator
    if (isScorerLockedByOther) {
      setLockedBannerMessage(
        `🔒 Access Denied: Match scoring is already locked by official scorer: "${lockedScorerName}".\n\nOnly 1 official scorer is allowed. Please login as Spectator to watch the live match.`
      );
      setShowAccessDeniedModal(true);
      return;
    }

    setInputName('');
    setModalRole('scorer');
  };

  const handleOpenSpectatorModal = () => {
    setErrorMessage(null);
    setLockedBannerMessage(null);
    setShowAccessDeniedModal(false);
    setInputName('');
    setModalRole('spectator');
  };

  const handleSubmitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = inputName.trim();

    if (!cleanName) {
      setErrorMessage('⚠️ Please enter your name to continue.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    if (modalRole === 'scorer') {
      const res = await loginAsScorer(cleanName);
      setIsSubmitting(false);

      if (!res.success) {
        const errMsg = res.message || `🔒 Access Denied: Match scoring is already locked by another scorer.`;
        setErrorMessage(errMsg);
        setLockedBannerMessage(errMsg);
        setShowAccessDeniedModal(true);
        setModalRole(null);
      } else {
        setModalRole(null);
      }
    } else {
      loginAsSpectator(cleanName);
      setIsSubmitting(false);
      setModalRole(null);
    }
  };

  return (
    <div className="min-h-screen theme-bg-main flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-emerald-500 selection:text-white transition-colors duration-300 relative">
      
      {/* Background Ambience */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-3xl mx-auto space-y-8 relative z-10 animate-fade-in">
        
        {/* Clean Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-3 px-4 py-2 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-green-400 flex items-center justify-center shadow-md shadow-emerald-950/50">
              <Trophy className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div className="text-left">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-white bg-clip-text text-transparent">
                CricPulse
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-400 font-semibold">Pro Live Cricket Scorekeeper & Stats</p>
            </div>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight pt-1">
            Choose Your Access Role
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Select an option below to enter the live match.
          </p>
        </div>

        {/* Locked Alert Warning if Scorer was blocked */}
        {lockedBannerMessage && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-sm flex items-start space-x-3 shadow-xl backdrop-blur-md animate-fade-in max-w-xl mx-auto">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <span className="font-extrabold block text-amber-300">Scorer Controls Are Locked</span>
              <p className="text-xs sm:text-sm text-slate-300 whitespace-pre-line">{lockedBannerMessage}</p>
              <div className="pt-2">
                <button
                  onClick={handleOpenSpectatorModal}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition shadow-md active:scale-95"
                >
                  Continue as Spectator ➔
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2 Clean Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* 1. SCORER LOGIN CARD */}
          <div
            onClick={handleOpenScorerModal}
            className={`group cursor-pointer relative overflow-hidden rounded-3xl border p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
              isScorerLockedByOther
                ? 'bg-slate-900/60 border-amber-500/30 hover:border-amber-500/50'
                : 'bg-slate-900 border-slate-800 hover:border-emerald-500/60 hover:shadow-2xl hover:shadow-emerald-500/10 active:scale-[0.99]'
            }`}
          >
            {/* Top Badge */}
            <div className="flex items-center justify-between pb-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 border ${
                  isScorerLockedByOther
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                }`}
              >
                {isScorerLockedByOther ? (
                  <>
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>Locked (1 Scorer Only)</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span>Official Match Admin</span>
                  </>
                )}
              </span>

              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                <Flame className="w-5 h-5" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3 py-2">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">
                  Login as Scorer
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 pt-1">
                  Record runs, balls, boundaries, wickets, player substitutions, toss, and match settings.
                </p>
              </div>

              {isScorerLockedByOther && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Currently active: <strong className="text-white ml-1 font-mono">{lockedScorerName}</strong></span>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="pt-6">
              <button
                type="button"
                className={`w-full py-3.5 sm:py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 transition shadow-lg ${
                  isScorerLockedByOther
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                }`}
              >
                {isScorerLockedByOther ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Locked (Active by {lockedScorerName})</span>
                  </>
                ) : (
                  <>
                    <span>Login as Scorer</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2. SPECTATOR LOGIN CARD */}
          <div
            onClick={handleOpenSpectatorModal}
            className="group cursor-pointer relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 hover:border-sky-500/60 hover:shadow-2xl hover:shadow-sky-500/10 active:scale-[0.99] p-6 sm:p-8 flex flex-col justify-between transition-all duration-300"
          >
            {/* Top Badge */}
            <div className="flex items-center justify-between pb-4">
              <span className="px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-black uppercase tracking-wider flex items-center space-x-1.5">
                <Eye className="w-3 h-3 text-sky-400" />
                <span>Unlimited Multi-Device</span>
              </span>

              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20 group-hover:scale-110 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3 py-2">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-sky-400 transition-colors">
                  Login as Spectator
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 pt-1">
                  Live real-time match stream, animated score bursts (+4, +6, W), ball-by-ball commentary, and full scorecard.
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-6">
              <button
                type="button"
                className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-sky-500/20"
              >
                <span>Login as Spectator</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ── USERNAME INPUT MODAL (AFTER CLICKING SCORER OR SPECTATOR) ── */}
      {modalRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                    modalRole === 'scorer'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                  }`}
                >
                  {modalRole === 'scorer' ? <Flame className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {modalRole === 'scorer' ? 'Official Scorer Login' : 'Spectator Login'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {modalRole === 'scorer' ? 'Enter your name to start scoring' : 'Enter your name to watch live'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setModalRole(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitRole} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider">
                  Your Name <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    value={inputName}
                    onChange={(e) => {
                      setInputName(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={modalRole === 'scorer' ? 'e.g. Nawaz (Scorer)' : 'e.g. John (Viewer)'}
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition shadow-inner"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalRole(null)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center space-x-1.5 transition shadow-md active:scale-95 ${
                    modalRole === 'scorer'
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                      : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/20'
                  }`}
                >
                  {isSubmitting ? (
                    <span>Logging in...</span>
                  ) : (
                    <>
                      <span>Enter Match</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ACCESS DENIED MODAL (WHEN SCORER ROLE IS TAKEN) ── */}
      {showAccessDeniedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-slate-900 border border-red-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-950/50 space-y-6 text-center">
            
            {/* Warning Icon Badge */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-400 flex items-center justify-center shadow-lg shadow-red-500/10">
              <ShieldAlert className="w-8 h-8" />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-[10px] font-black tracking-widest uppercase border border-red-500/30">
                Single Official Scorer Policy
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-1">
                Access Denied
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Scoring controls are already active and locked by official scorer:
              </p>
              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-amber-300 font-mono font-bold text-sm sm:text-base flex items-center justify-center space-x-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>{lockedScorerName}</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                To prevent conflicting score entries, only one official scorer is permitted at a time. You can watch the full match and live ball-by-ball stream as a Spectator.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleOpenSpectatorModal}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-lg shadow-sky-500/20 active:scale-95"
              >
                <Eye className="w-4 h-4" />
                <span>Continue as Spectator</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowAccessDeniedModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default LoginPage;

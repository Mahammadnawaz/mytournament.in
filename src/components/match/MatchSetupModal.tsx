import React, { useState } from 'react';
import { useCricket } from '../../context/CricketContext';
import { X, Swords, Play, Check, ChevronRight, ChevronLeft, User, Shield, Flame, Coins, Sparkles, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MatchSetupModalProps {
  onClose: () => void;
  initialSeriesId?: string;
  initialMatchName?: string;
  initialTeamA?: string;
  initialTeamB?: string;
}

export const MatchSetupModal: React.FC<MatchSetupModalProps> = ({
  onClose,
  initialSeriesId,
  initialMatchName,
  initialTeamA,
  initialTeamB,
}) => {
  const { players, createMatch } = useCricket();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 State
  const [matchName, setMatchName] = useState(initialMatchName || 'Premier T20 Match');
  const [venue, setVenue] = useState('Lords Cricket Ground');
  const [totalOvers, setTotalOvers] = useState(5);

  const [teamAName, setTeamAName] = useState(initialTeamA || 'Royal Titans');
  const [teamBName, setTeamBName] = useState(initialTeamB || 'Super Strikers');

  // Toss State: No winner initially!
  const [_tossCall, setTossCall] = useState<'HEADS' | 'TAILS'>('HEADS');
  const [tossWinner, setTossWinner] = useState<string>('');
  const [tossChoice, setTossChoice] = useState<'bat' | 'bowl'>('bat');
  const [hasFlippedToss, setHasFlippedToss] = useState<boolean>(false);
  const [tossSummaryText, setTossSummaryText] = useState<string>('');

  // Interactive 3D Coin Toss Flip State
  // tossPhase: 'pick' = select heads/tails, 'result' = coin landed, 'winner' = select winning team + bat/bowl
  const [showCoinFlipModal, setShowCoinFlipModal] = useState(false);
  const [isFlippingCoin, setIsFlippingCoin] = useState(false);
  const [coinSide, setCoinSide] = useState<'HEADS' | 'TAILS' | null>(null);
  const [tossPhase, setTossPhase] = useState<'pick' | 'result' | 'winner'>('pick');

  // Step 2 State (Playing XI Selection - 11 Players default per team)
  const defaultTeamA = players.slice(0, 11).map(p => p.id);
  const defaultTeamB = players.slice(11, 22).length >= 11 ? players.slice(11, 22).map(p => p.id) : players.slice(5, 16).map(p => p.id);

  const [selectedTeamAPlayers, setSelectedTeamAPlayers] = useState<string[]>(defaultTeamA);
  const [selectedTeamBPlayers, setSelectedTeamBPlayers] = useState<string[]>(defaultTeamB);

  // Step 3 State (Opening Lineup Selection)
  const [strikerId, setStrikerId] = useState<string>('');
  const [nonStrikerId, setNonStrikerId] = useState<string>('');
  const [bowlerId, setBowlerId] = useState<string>('');

  // Compute Batting & Bowling Teams based on Toss
  const actualTossWinner = tossWinner || teamAName;
  const battingTeamName = tossChoice === 'bat' 
    ? actualTossWinner 
    : (actualTossWinner === teamAName ? teamBName : teamAName);
  const bowlingTeamName = battingTeamName === teamAName ? teamBName : teamAName;

  const battingPlayerIds = battingTeamName === teamAName ? selectedTeamAPlayers : selectedTeamBPlayers;
  const bowlingPlayerIds = bowlingTeamName === teamAName ? selectedTeamAPlayers : selectedTeamBPlayers;

  const battingPlayers = players.filter(p => battingPlayerIds.includes(p.id));
  const bowlingPlayers = players.filter(p => bowlingPlayerIds.includes(p.id));

  // Required XI count (11 or all available if roster < 11)
  const reqCountA = Math.min(11, players.length);
  const reqCountB = Math.min(11, players.length);

  const isTeamAValid = selectedTeamAPlayers.length >= reqCountA;
  const isTeamBValid = selectedTeamBPlayers.length >= reqCountB;
  const isPlayingXIValid = isTeamAValid && isTeamBValid;

  // Trigger Coin Toss Flip with direct HEADS or TAILS selection
  const handlePerformCoinSpin = (chosenSide: 'HEADS' | 'TAILS') => {
    setTossCall(chosenSide);
    setIsFlippingCoin(true);
    setCoinSide(null);
    setTossPhase('pick');

    setTimeout(() => {
      // Unpredictable 50/50 coin spin outcome — no team assigned yet!
      const isHeads = Math.random() < 0.5;
      const landedSide: 'HEADS' | 'TAILS' = isHeads ? 'HEADS' : 'TAILS';

      setCoinSide(landedSide);
      setIsFlippingCoin(false);
      setTossPhase('result'); // Show result first — then let user pick winning team

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 }
      });
    }, 1600);
  };

  // Flip again — reset back to pick phase
  const handleFlipAgain = () => {
    setCoinSide(null);
    setTossWinner('');
    setTossSummaryText('');
    setHasFlippedToss(false);
    setTossPhase('pick');
    setIsFlippingCoin(false);
  };

  // After user picks which team won, move to bat/bowl selection
  const handleSelectTossWinner = (winner: string) => {
    setTossWinner(winner);
    setTossSummaryText(`Coin landed on ${coinSide}. ${winner} won the toss!`);
    setHasFlippedToss(true);
    setTossPhase('winner');
  };

  // Initialize openers defaults when stepping to Step 3
  const handleProceedToStep3 = () => {
    if (!strikerId) setStrikerId(battingPlayers[0]?.id || '');
    if (!nonStrikerId) setNonStrikerId(battingPlayers[1]?.id || battingPlayers[0]?.id || '');
    if (!bowlerId) setBowlerId(bowlingPlayers[bowlingPlayers.length - 1]?.id || bowlingPlayers[0]?.id || '');
    setStep(3);
  };

  const toggleTeamAPlayer = (id: string) => {
    if (selectedTeamAPlayers.includes(id)) {
      setSelectedTeamAPlayers(prev => prev.filter(pId => pId !== id));
    } else {
      if (selectedTeamAPlayers.length < 11) {
        setSelectedTeamAPlayers(prev => [...prev, id]);
      }
    }
  };

  const toggleTeamBPlayer = (id: string) => {
    if (selectedTeamBPlayers.includes(id)) {
      setSelectedTeamBPlayers(prev => prev.filter(pId => pId !== id));
    } else {
      if (selectedTeamBPlayers.length < 11) {
        setSelectedTeamBPlayers(prev => [...prev, id]);
      }
    }
  };

  const handleStartMatch = () => {
    if (!teamAName.trim() || !teamBName.trim()) return;

    createMatch({
      name: matchName || 'Live Cricket Match',
      venue: venue || 'Stadium Arena',
      date: new Date().toISOString().split('T')[0],
      totalOvers: Math.max(1, Number(totalOvers)),
      teamA: {
        name: teamAName.trim(),
        playerIds: selectedTeamAPlayers,
      },
      teamB: {
        name: teamBName.trim(),
        playerIds: selectedTeamBPlayers,
      },
      tossWinner: actualTossWinner,
      tossChoice,
      seriesId: initialSeriesId,
      openingStrikerId: strikerId,
      openingNonStrikerId: nonStrikerId,
      openingBowlerId: bowlerId,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-800">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">Create & Launch Match</h2>
            <p className="text-xs text-slate-400">Step {step} of 3: Flip toss coin, select 11 playing XI & opening lineup</p>
          </div>
        </div>

        {/* Wizard Step Progress Bar */}
        <div className="grid grid-cols-3 gap-2 mb-6 text-center text-xs font-bold">
          <div className={`py-2 rounded-xl transition border ${step === 1 ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
            1. Match & Toss
          </div>
          <div className={`py-2 rounded-xl transition border ${step === 2 ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
            2. Playing XI (11 Players)
          </div>
          <div className={`py-2 rounded-xl transition border ${step === 3 ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
            3. Openers
          </div>
        </div>

        {/* STEP 1: MATCH & TOSS DETAILS */}
        {step === 1 && (
          <div className="space-y-5 text-sm">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Match Title *</label>
                <input
                  type="text"
                  required
                  value={matchName}
                  onChange={(e) => setMatchName(e.target.value)}
                  placeholder="e.g. Match 1"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Venue</label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. Lords Arena"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Total Overs Limit</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={totalOvers}
                  onChange={(e) => setTotalOvers(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono font-bold outline-none"
                />
              </div>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-emerald-400 mb-1 uppercase">Team A</label>
                <input
                  type="text"
                  required
                  value={teamAName}
                  onChange={(e) => setTeamAName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-400 mb-1 uppercase">Team B</label>
                <input
                  type="text"
                  required
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold outline-none"
                />
              </div>
            </div>

            {/* Interactive Coin Toss Box */}
            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span>Match Coin Toss</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {teamAName} vs {teamBName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCoinFlipModal(true)}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs transition active:scale-95 shadow-lg shadow-amber-500/25"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>🪙 {hasFlippedToss ? 'Re-flip Toss' : 'Flip Coin (Heads/Tails)'}</span>
                </button>
              </div>

              {/* TOSS STATE BANNER */}
              {!hasFlippedToss ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center text-xs text-slate-400 italic">
                  <span>🪙 Coin toss pending. Click "Flip Coin" to select Heads or Tails and spin coin!</span>
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 block">{tossSummaryText}</span>
                    <h4 className="text-base font-black text-white mt-0.5">
                      {tossWinner} won the toss & elected to {tossChoice.toUpperCase()}
                    </h4>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setTossChoice('bat')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                        tossChoice === 'bat'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      BAT FIRST
                    </button>
                    <button
                      type="button"
                      onClick={() => setTossChoice('bowl')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                        tossChoice === 'bowl'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      BOWL FIRST
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step 1 Actions */}
            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!hasFlippedToss) {
                    setShowCoinFlipModal(true);
                  } else {
                    setStep(2);
                  }
                }}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition"
              >
                <span>{hasFlippedToss ? 'Next: Select Playing XI' : 'Flip Coin First'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        )}

        {/* STEP 2: PLAYING XI SELECTION (ENFORCE 11 PLAYERS PER TEAM) */}
        {step === 2 && (
          <div className="space-y-5 text-sm">
            
            {!isPlayingXIValid && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center space-x-2 text-amber-400 text-xs font-bold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Select 11 players for {teamAName} and 11 players for {teamBName} to continue.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Team A Playing XI */}
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-400 text-xs uppercase">{teamAName} XI</span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                    isTeamAValid ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {selectedTeamAPlayers.length} / 11 Players
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {players.map(p => {
                    const isSelected = selectedTeamAPlayers.includes(p.id);
                    const isSelectedInOpposite = selectedTeamBPlayers.includes(p.id);

                    return (
                      <button
                        type="button"
                        key={`ta-${p.id}`}
                        disabled={isSelectedInOpposite}
                        onClick={() => toggleTeamAPlayer(p.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex justify-between items-center transition ${
                          isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                            : isSelectedInOpposite
                            ? 'bg-slate-950/40 text-slate-600 border border-slate-900 cursor-not-allowed opacity-50'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <span>
                          {p.name} ({p.role}) {isSelectedInOpposite && <span className="text-[10px] text-amber-500/80 font-normal">({teamBName})</span>}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Team B Playing XI */}
              <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-400 text-xs uppercase">{teamBName} XI</span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                    isTeamBValid ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {selectedTeamBPlayers.length} / 11 Players
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {players.map(p => {
                    const isSelected = selectedTeamBPlayers.includes(p.id);
                    const isSelectedInOpposite = selectedTeamAPlayers.includes(p.id);

                    return (
                      <button
                        type="button"
                        key={`tb-${p.id}`}
                        disabled={isSelectedInOpposite}
                        onClick={() => toggleTeamBPlayer(p.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex justify-between items-center transition ${
                          isSelected
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold'
                            : isSelectedInOpposite
                            ? 'bg-slate-950/40 text-slate-600 border border-slate-900 cursor-not-allowed opacity-50'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <span>
                          {p.name} ({p.role}) {isSelectedInOpposite && <span className="text-[10px] text-amber-500/80 font-normal">({teamAName})</span>}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="pt-3 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center space-x-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              
              <button
                type="button"
                disabled={!isPlayingXIValid}
                onClick={handleProceedToStep3}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold transition"
              >
                <span>Next: Select Openers</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: OPENING PLAYERS SELECTION */}
        {step === 3 && (
          <div className="space-y-5 text-sm">
            
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center">
              <span className="text-xs font-bold text-slate-400 block">Toss Decision</span>
              <p className="text-sm font-black text-emerald-400 mt-0.5">
                {tossWinner} won the toss & elected to {tossChoice.toUpperCase()}
              </p>
              <p className="text-xs text-slate-300 mt-1 font-semibold">
                1st Innings: <strong className="text-white">{battingTeamName}</strong> (Batting) vs <strong className="text-white">{bowlingTeamName}</strong> (Bowling)
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-emerald-400 mb-1 flex items-center space-x-1.5">
                  <Flame className="w-4 h-4" />
                  <span>Opening Striker (Batsman 1 - {battingTeamName}) *</span>
                </label>
                <select
                  value={strikerId}
                  onChange={(e) => setStrikerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold outline-none"
                >
                  {battingPlayers.map(p => (
                    <option key={`st-${p.id}`} value={p.id}>{p.name} ({p.role} • {p.battingStyle})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center space-x-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Opening Non-Striker (Batsman 2 - {battingTeamName}) *</span>
                </label>
                <select
                  value={nonStrikerId}
                  onChange={(e) => setNonStrikerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold outline-none"
                >
                  {battingPlayers.filter(p => p.id !== strikerId).map(p => (
                    <option key={`nst-${p.id}`} value={p.id}>{p.name} ({p.role} • {p.battingStyle})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-400 mb-1 flex items-center space-x-1.5">
                  <Shield className="w-4 h-4" />
                  <span>Opening Bowler ({bowlingTeamName}) *</span>
                </label>
                <select
                  value={bowlerId}
                  onChange={(e) => setBowlerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-bold outline-none"
                >
                  {bowlingPlayers.map(p => (
                    <option key={`bw-${p.id}`} value={p.id}>{p.name} ({p.role} • {p.bowlingStyle})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center space-x-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleStartMatch}
                className="flex items-center space-x-2 px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Live Scorekeeper →</span>
              </button>
            </div>

          </div>
        )}

      </div>

      {/* COIN TOSS MODAL — Phase 1: Pick, Phase 2: Result + Flip Again, Phase 3: Who Won + Bat/Bowl */}
      {showCoinFlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-fade-in">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl shadow-amber-900/40 relative">
            
            <h3 className="text-xl font-black text-white">🪙 COIN TOSS</h3>

            {/* PHASE 1: PICK HEADS OR TAILS */}
            {!isFlippingCoin && tossPhase === 'pick' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Select <strong className="text-amber-400">HEADS</strong> or <strong className="text-amber-400">TAILS</strong> to flip the coin:
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handlePerformCoinSpin('HEADS')}
                    className="py-5 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-base transition shadow-lg shadow-amber-500/20 active:scale-95 flex flex-col items-center justify-center space-y-1.5 border border-amber-300"
                  >
                    <span className="text-3xl">🪙</span>
                    <span className="text-sm">HEADS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePerformCoinSpin('TAILS')}
                    className="py-5 rounded-2xl bg-gradient-to-bl from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 text-white font-black text-base transition shadow-lg active:scale-95 flex flex-col items-center justify-center space-y-1.5 border border-slate-500"
                  >
                    <span className="text-3xl">🔃</span>
                    <span className="text-sm">TAILS</span>
                  </button>
                </div>
              </div>
            )}

            {/* SPINNING ANIMATION */}
            {isFlippingCoin && (
              <div className="space-y-6 my-4">
                <div className="flex justify-center">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 border-4 border-amber-300 shadow-2xl flex items-center justify-center text-slate-950 font-black text-3xl animate-spin">
                    <span>🪙</span>
                  </div>
                </div>
                <p className="text-amber-400 font-bold animate-pulse text-sm">Flipping coin in mid-air...</p>
              </div>
            )}

            {/* PHASE 2: SHOW COIN RESULT + FLIP AGAIN */}
            {!isFlippingCoin && tossPhase === 'result' && coinSide && (
              <div className="space-y-4 animate-fade-in">
                {/* Big coin result */}
                <div className="flex flex-col items-center space-y-3 py-2">
                  <div className={`w-24 h-24 rounded-full border-4 shadow-2xl flex items-center justify-center text-4xl ring-4 ${
                    coinSide === 'HEADS'
                      ? 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 border-amber-300 ring-amber-400/40'
                      : 'bg-gradient-to-tr from-slate-600 to-slate-700 border-slate-500 ring-slate-500/40'
                  }`}>
                    {coinSide === 'HEADS' ? '🪙' : '🔃'}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Coin Landed On</p>
                    <h4 className="text-3xl font-black text-amber-400">{coinSide}</h4>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleFlipAgain}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition border border-slate-700"
                  >
                    ↺ Flip Again
                  </button>
                  <button
                    type="button"
                    onClick={() => setTossPhase('winner')}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* PHASE 3: WHO WON + BAT OR BOWL */}
            {!isFlippingCoin && tossPhase === 'winner' && coinSide && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-400">
                  Coin landed on <strong className="text-amber-400">{coinSide}</strong>
                </div>

                <div className="space-y-2 text-left">
                  <label className="block text-xs font-bold text-slate-300">Which team won the toss?</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectTossWinner(teamAName)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                        tossWinner === teamAName
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {teamAName}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectTossWinner(teamBName)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                        tossWinner === teamBName
                          ? 'bg-blue-500 text-white border-blue-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {teamBName}
                    </button>
                  </div>
                </div>

                {tossWinner && (
                  <div className="space-y-2 text-left animate-fade-in">
                    <label className="block text-xs font-bold text-slate-300">{tossWinner} elects to:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTossChoice('bat');
                          setShowCoinFlipModal(false);
                        }}
                        className="py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition"
                      >
                        ELECT TO BAT
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTossChoice('bowl');
                          setShowCoinFlipModal(false);
                        }}
                        className="py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-black text-xs transition"
                      >
                        ELECT TO BOWL
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleFlipAgain}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs transition border border-slate-700"
                >
                  ↺ Flip Coin Again
                </button>
              </div>
            )}

            {!isFlippingCoin && (
              <button
                type="button"
                onClick={() => setShowCoinFlipModal(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
export default MatchSetupModal;

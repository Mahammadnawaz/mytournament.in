import type { InningsState, BallLog, WicketDetails, ExtraType, Player, Match, MatchPOTM, TournamentSeries, SeriesPlayerMVP, ShotZone } from '../types/cricket';

export function formatOvers(overs: number, balls: number): string {
  return `${overs}.${balls}`;
}

export function oversToFloat(overs: number, balls: number): number {
  return overs + balls / 6;
}

export interface ScoreBallParams {
  runsScored: number;
  extraType: ExtraType;
  extraRuns: number;
  isWicket: boolean;
  wicketInfo?: WicketDetails;
  nextBatsmanId?: string;
  shotZone?: ShotZone;
}

export interface EngineResult {
  nextInningsState: InningsState;
  overCompleted: boolean;
  inningsCompleted: boolean;
  needBowlerChange: boolean;
  needNextBatsman: boolean;
  matchResultBanner?: string;
  winnerTeam?: string;
}

export function processBall(
  innings: InningsState,
  params: ScoreBallParams,
  matchTotalOvers: number
): EngineResult {
  const state: InningsState = JSON.parse(JSON.stringify(innings));

  const { runsScored, extraType, extraRuns, isWicket, wicketInfo } = params;

  let extraPenalty = 0;
  let isLegalBall = true;

  if (extraType === 'wide' || extraType === 'no-ball') {
    isLegalBall = false;
    extraPenalty = 1 + extraRuns;
  } else if (extraType === 'bye' || extraType === 'leg-bye') {
    extraPenalty = extraRuns;
  }

  const totalBallRuns = runsScored + extraPenalty;
  state.totalRuns += totalBallRuns;

  if (extraType === 'wide') {
    state.extrasTotal.wides += extraPenalty;
    state.extrasTotal.total += extraPenalty;
  } else if (extraType === 'no-ball') {
    state.extrasTotal.noBalls += extraPenalty;
    state.extrasTotal.total += extraPenalty;
  } else if (extraType === 'bye') {
    state.extrasTotal.byes += extraPenalty;
    state.extrasTotal.total += extraPenalty;
  } else if (extraType === 'leg-bye') {
    state.extrasTotal.legByes += extraPenalty;
    state.extrasTotal.total += extraPenalty;
  }

  const currentStrikerId = state.strikerId;
  const currentNonStrikerId = state.nonStrikerId;
  const currentBowlerId = state.currentBowlerId;

  if (!state.batsmenStats[currentStrikerId]) {
    state.batsmenStats[currentStrikerId] = {
      playerId: currentStrikerId,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
    };
  }
  if (currentNonStrikerId && !state.batsmenStats[currentNonStrikerId]) {
    state.batsmenStats[currentNonStrikerId] = {
      playerId: currentNonStrikerId,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
    };
  }

  if (!state.bowlerStats[currentBowlerId]) {
    state.bowlerStats[currentBowlerId] = {
      playerId: currentBowlerId,
      overs: 0,
      balls: 0,
      maidens: 0,
      runsConceded: 0,
      wickets: 0,
      wides: 0,
      noBalls: 0,
      dots: 0,
    };
  }

  const strikerStats = state.batsmenStats[currentStrikerId];
  const bowlerStats = state.bowlerStats[currentBowlerId];

  if (extraType !== 'wide') {
    strikerStats.balls += 1;
    strikerStats.runs += runsScored;
    if (runsScored === 4) strikerStats.fours += 1;
    if (runsScored === 6) strikerStats.sixes += 1;
  }

  bowlerStats.runsConceded += totalBallRuns;
  if (extraType === 'wide') bowlerStats.wides += 1;
  if (extraType === 'no-ball') bowlerStats.noBalls += 1;
  if (totalBallRuns === 0) bowlerStats.dots += 1;

  let needNextBatsman = false;
  if (isWicket && wicketInfo) {
    state.wickets += 1;
    bowlerStats.wickets += 1;

    const dismissedId = wicketInfo.dismissedPlayerId || currentStrikerId;
    if (state.batsmenStats[dismissedId]) {
      state.batsmenStats[dismissedId].isOut = true;
      state.batsmenStats[dismissedId].dismissalType = wicketInfo.type;
      state.batsmenStats[dismissedId].bowlerId = currentBowlerId;
      state.batsmenStats[dismissedId].fielderId = wicketInfo.fielderId;
      // dismissalText intentionally left empty — scorecard builds it from bowlerId/fielderId using player names
      state.batsmenStats[dismissedId].dismissalText = '';
    }

    state.fow.push({
      wicketNo: state.wickets,
      runs: state.totalRuns,
      overs: formatOvers(state.overs, state.balls + (isLegalBall ? 1 : 0)),
      playerId: dismissedId
    });

    if (params.nextBatsmanId) {
      if (dismissedId === currentStrikerId) {
        state.strikerId = params.nextBatsmanId;
      } else {
        state.nonStrikerId = params.nextBatsmanId;
      }
    } else {
      needNextBatsman = true;
    }
  }

  const newBallLog: BallLog = {
    id: `ball-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    matchId: 'current',
    inningsNo: state.inningsNo,
    overNumber: state.overs,
    ballNumber: state.balls + (isLegalBall ? 1 : 0),
    strikerId: currentStrikerId,
    nonStrikerId: currentNonStrikerId,
    bowlerId: currentBowlerId,
    runsScored,
    extras: {
      type: extraType,
      runs: extraPenalty,
    },
    totalRuns: totalBallRuns,
    isWicket,
    wicketInfo,
    isLegalBall,
    shotZone: params.shotZone,
    timestamp: Date.now(),
  };

  state.ballLogs.push(newBallLog);
  state.recentBalls.push(newBallLog);

  let overCompleted = false;
  if (isLegalBall) {
    state.balls += 1;
    bowlerStats.balls += 1;

    if (state.balls === 6) {
      overCompleted = true;
      state.overs += 1;
      state.balls = 0;

      bowlerStats.overs += 1;
      bowlerStats.balls = 0;
      
      const overBalls = state.recentBalls;
      const overRunsConceded = overBalls.reduce((acc, b) => acc + b.totalRuns, 0);
      if (overRunsConceded === 0) {
        bowlerStats.maidens += 1;
      }

      state.recentBalls = [];
    }
  }

  const runsForRotation = extraType === 'wide' ? extraRuns : totalBallRuns;
  if (runsForRotation % 2 !== 0) {
    const temp = state.strikerId;
    state.strikerId = state.nonStrikerId;
    state.nonStrikerId = temp;
  }

  if (overCompleted) {
    const temp = state.strikerId;
    state.strikerId = state.nonStrikerId;
    state.nonStrikerId = temp;
  }

  let inningsCompleted = false;
  let matchResultBanner: string | undefined;
  let winnerTeam: string | undefined;

  if (state.inningsNo === 2 && state.target && state.totalRuns >= state.target) {
    inningsCompleted = true;
    state.isCompleted = true;
    const wicketsRemaining = 10 - state.wickets;
    matchResultBanner = `${state.battingTeam} won by ${wicketsRemaining} wicket${wicketsRemaining > 1 ? 's' : ''}!`;
    winnerTeam = state.battingTeam;
  } 
  else if (state.wickets >= 10) {
    inningsCompleted = true;
    state.isCompleted = true;
  }
  else if (state.overs >= matchTotalOvers) {
    inningsCompleted = true;
    state.isCompleted = true;
  }

  if (state.inningsNo === 2 && inningsCompleted && !matchResultBanner) {
    if (state.totalRuns < (state.target || 0) - 1) {
      const margin = (state.target || 0) - 1 - state.totalRuns;
      matchResultBanner = `${state.bowlingTeam} won by ${margin} run${margin > 1 ? 's' : ''}!`;
      winnerTeam = state.bowlingTeam;
    } else if (state.totalRuns === (state.target || 0) - 1) {
      matchResultBanner = 'Match Tied!';
    }
  }

  return {
    nextInningsState: state,
    overCompleted,
    inningsCompleted,
    needBowlerChange: overCompleted && !inningsCompleted,
    needNextBatsman,
    matchResultBanner,
    winnerTeam,
  };
}

/**
 * Calculates Match Player of the Match (MVP)
 */
export function calculateMatchPOTM(match: Match): MatchPOTM | undefined {
  const playerScores = new Map<string, { points: number; summaryParts: string[] }>();

  const processInnings = (innings?: InningsState) => {
    if (!innings) return;

    // Batting Points
    Object.values(innings.batsmenStats).forEach(b => {
      if (!b.playerId) return;
      let pts = b.runs * 1 + b.fours * 1 + b.sixes * 2;
      const parts: string[] = [];
      if (b.runs > 0) parts.push(`${b.runs} runs (${b.balls}b)`);
      if (b.runs >= 100) pts += 30;
      else if (b.runs >= 50) pts += 15;

      const curr = playerScores.get(b.playerId) || { points: 0, summaryParts: [] };
      curr.points += pts;
      curr.summaryParts.push(...parts);
      playerScores.set(b.playerId, curr);
    });

    // Bowling Points
    Object.values(innings.bowlerStats).forEach(bw => {
      if (!bw.playerId) return;
      let pts = bw.wickets * 25 + bw.maidens * 10;
      const parts: string[] = [];
      if (bw.wickets > 0) parts.push(`${bw.wickets}/${bw.runsConceded}`);
      if (bw.wickets >= 5) pts += 30;
      else if (bw.wickets >= 3) pts += 15;

      const curr = playerScores.get(bw.playerId) || { points: 0, summaryParts: [] };
      curr.points += pts;
      curr.summaryParts.push(...parts);
      playerScores.set(bw.playerId, curr);
    });
  };

  processInnings(match.innings1);
  processInnings(match.innings2);

  let bestPlayerId = '';
  let maxPoints = -1;
  let summary = '';

  playerScores.forEach((val, id) => {
    if (val.points > maxPoints) {
      maxPoints = val.points;
      bestPlayerId = id;
      summary = val.summaryParts.join(' • ');
    }
  });

  if (!bestPlayerId || maxPoints <= 0) return undefined;

  return {
    playerId: bestPlayerId,
    points: maxPoints,
    summary: summary || 'All-round performance',
  };
}

/**
 * Aggregates Series Player MVP Table and calculates Player of the Series (POTM)
 */
export function calculateSeriesMVP(
  series: TournamentSeries,
  allMatches: Match[]
): { leaderboard: SeriesPlayerMVP[]; potS?: { playerId: string; points: number; summary: string } } {
  const seriesMatches = allMatches.filter(
    m => (series.matchIds?.includes(m.id) || m.seriesId === series.id) && m.status === 'completed'
  );

  const mvpMap = new Map<string, SeriesPlayerMVP>();

  seriesMatches.forEach(m => {
    const processInnings = (innings?: InningsState) => {
      if (!innings) return;

      // Batting
      Object.values(innings.batsmenStats).forEach(b => {
        if (!b.playerId) return;
        const entry = mvpMap.get(b.playerId) || {
          playerId: b.playerId,
          matchesPlayed: 0,
          runs: 0,
          ballsFaced: 0,
          fours: 0,
          sixes: 0,
          wickets: 0,
          oversBowled: 0,
          runsConceded: 0,
          maidens: 0,
          fiftyPlus: 0,
          hundredPlus: 0,
          threeWicketHauls: 0,
          mvpPoints: 0,
        };

        if (b.balls > 0 || b.isOut) entry.matchesPlayed += 1;
        entry.runs += b.runs;
        entry.ballsFaced += b.balls;
        entry.fours += b.fours;
        entry.sixes += b.sixes;

        if (b.runs >= 100) entry.hundredPlus += 1;
        else if (b.runs >= 50) entry.fiftyPlus += 1;

        let pts = b.runs * 1 + b.fours * 1 + b.sixes * 2;
        if (b.runs >= 100) pts += 30;
        else if (b.runs >= 50) pts += 15;
        entry.mvpPoints += pts;

        mvpMap.set(b.playerId, entry);
      });

      // Bowling
      Object.values(innings.bowlerStats).forEach(bw => {
        if (!bw.playerId) return;
        const entry = mvpMap.get(bw.playerId) || {
          playerId: bw.playerId,
          matchesPlayed: 0,
          runs: 0,
          ballsFaced: 0,
          fours: 0,
          sixes: 0,
          wickets: 0,
          oversBowled: 0,
          runsConceded: 0,
          maidens: 0,
          fiftyPlus: 0,
          hundredPlus: 0,
          threeWicketHauls: 0,
          mvpPoints: 0,
        };

        if (bw.overs > 0 || bw.balls > 0) {
          entry.wickets += bw.wickets;
          entry.oversBowled += bw.overs + bw.balls / 6;
          entry.runsConceded += bw.runsConceded;
          entry.maidens += bw.maidens;
          if (bw.wickets >= 3) entry.threeWicketHauls += 1;

          let pts = bw.wickets * 25 + bw.maidens * 10;
          if (bw.wickets >= 5) pts += 30;
          else if (bw.wickets >= 3) pts += 15;
          entry.mvpPoints += pts;
        }

        mvpMap.set(bw.playerId, entry);
      });
    };

    processInnings(m.innings1);
    processInnings(m.innings2);
  });

  const leaderboard = Array.from(mvpMap.values()).sort((a, b) => b.mvpPoints - a.mvpPoints);

  const topPlayer = leaderboard[0];
  const potS = topPlayer ? {
    playerId: topPlayer.playerId,
    points: topPlayer.mvpPoints,
    summary: `${topPlayer.runs} Runs • ${topPlayer.wickets} Wickets (${topPlayer.mvpPoints} MVP Pts)`
  } : undefined;

  return { leaderboard, potS };
}

/**
 * Aggregates player career statistics upon match completion
 */
export function aggregateMatchStatsToPlayers(players: Player[], match: Match): Player[] {
  if (match.status !== 'completed') return players;

  const playerMap = new Map<string, Player>(players.map(p => [p.id, JSON.parse(JSON.stringify(p))]));

  const processInningsForStats = (innings?: InningsState) => {
    if (!innings) return;

    Object.values(innings.batsmenStats).forEach(bStats => {
      const player = playerMap.get(bStats.playerId);
      if (!player) return;

      player.stats.matches += 1;
      if (bStats.balls > 0 || bStats.isOut) {
        player.stats.inningsBatted += 1;
      }
      player.stats.totalRuns += bStats.runs;
      player.stats.ballsFaced += bStats.balls;
      player.stats.fours += bStats.fours;
      player.stats.sixes += bStats.sixes;

      if (!bStats.isOut && (bStats.balls > 0 || bStats.runs > 0)) {
        player.stats.notOuts += 1;
      }

      if (bStats.runs > player.stats.highestScore) {
        player.stats.highestScore = bStats.runs;
      }
    });

    Object.values(innings.bowlerStats).forEach(bwStats => {
      const player = playerMap.get(bwStats.playerId);
      if (!player) return;

      if (bwStats.overs > 0 || bwStats.balls > 0) {
        player.stats.inningsBowled += 1;
        player.stats.oversBowled += bwStats.overs;
        player.stats.ballsBowled += (bwStats.overs * 6 + bwStats.balls);
        player.stats.runsConceded += bwStats.runsConceded;
        player.stats.wicketsTaken += bwStats.wickets;
        player.stats.maidens += bwStats.maidens;

        if (
          bwStats.wickets > player.stats.bestBowlingWickets ||
          (bwStats.wickets === player.stats.bestBowlingWickets && bwStats.runsConceded < player.stats.bestBowlingRuns)
        ) {
          player.stats.bestBowlingWickets = bwStats.wickets;
          player.stats.bestBowlingRuns = bwStats.runsConceded;
        }
      }
    });
  };

  processInningsForStats(match.innings1);
  processInningsForStats(match.innings2);

  return Array.from(playerMap.values());
}

export type PlayerRole = 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper';
export type BattingStyle = 'Right-hand' | 'Left-hand';
export type BowlingStyle = 
  | 'Right-arm Fast' 
  | 'Right-arm Medium' 
  | 'Left-arm Fast' 
  | 'Left-arm Spin' 
  | 'Leg-spin' 
  | 'Off-spin' 
  | 'None';

export interface PlayerCareerStats {
  matches: number;
  inningsBatted: number;
  totalRuns: number;
  ballsFaced: number;
  highestScore: number;
  notOuts: number;
  fours: number;
  sixes: number;
  inningsBowled: number;
  oversBowled: number;
  ballsBowled: number;
  runsConceded: number;
  wicketsTaken: number;
  bestBowlingWickets: number;
  bestBowlingRuns: number;
  maidens: number;
}

export interface Player {
  id: string;
  name: string;
  role: PlayerRole;
  battingStyle: BattingStyle;
  bowlingStyle: BowlingStyle;
  avatarUrl?: string;
  country?: string;
  jerseyNumber?: number;
  age?: number;
  stats: PlayerCareerStats;
}

export type ExtraType = 'wide' | 'no-ball' | 'bye' | 'leg-bye' | 'none';

export type DismissalType = 
  | 'bowled' 
  | 'caught' 
  | 'run-out' 
  | 'lbw' 
  | 'stumped' 
  | 'hit-wicket' 
  | 'retired-hurt';

export interface WicketDetails {
  type: DismissalType;
  dismissedPlayerId: string;
  bowlerId: string;
  fielderId?: string;
  runsCompleted?: number;
  description?: string;
}

export type ShotZone = string;

export interface BallLog {
  id: string;
  matchId: string;
  inningsNo: 1 | 2;
  overNumber: number; // 0-indexed over count (e.g. over 0 = 0.1 to 0.6)
  ballNumber: number; // 1 to 6 legal ball
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runsScored: number;
  extras: {
    type: ExtraType;
    runs: number;
  };
  totalRuns: number;
  isWicket: boolean;
  wicketInfo?: WicketDetails;
  isLegalBall: boolean;
  shotZone?: ShotZone;
  timestamp: number;
}

export interface BatsmanInningsStats {
  playerId: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType?: DismissalType;
  dismissalText?: string;
  bowlerId?: string;
  fielderId?: string;
}

export interface BowlerInningsStats {
  playerId: string;
  overs: number;
  balls: number;
  maidens: number;
  runsConceded: number;
  wickets: number;
  wides: number;
  noBalls: number;
  dots: number;
}

export interface InningsState {
  inningsNo: 1 | 2;
  battingTeam: string;
  bowlingTeam: string;
  totalRuns: number;
  wickets: number;
  overs: number;
  balls: number;
  target?: number;
  strikerId: string;
  nonStrikerId: string;
  currentBowlerId: string;
  batsmenStats: Record<string, BatsmanInningsStats>;
  bowlerStats: Record<string, BowlerInningsStats>;
  ballLogs: BallLog[];
  recentBalls: BallLog[];
  extrasTotal: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    total: number;
  };
  isCompleted: boolean;
  fow: Array<{
    wicketNo: number;
    runs: number;
    overs: string;
    playerId: string;
  }>;
}

export interface TeamConfig {
  name: string;
  playerIds: string[];
}

export type MatchStatus = 'setup' | 'live' | 'completed';

export interface MatchPOTM {
  playerId: string;
  points: number;
  summary: string;
}

export interface DeliveryBurst {
  id: string;
  text: string;
  subText?: string;
  colorType: 'four' | 'six' | 'three' | 'two' | 'one' | 'dot' | 'wicket' | 'hattrick' | 'wide' | 'noball' | 'byes' | 'legbyes';
  timestamp: number;
}

export interface MatchAlert {
  type: 'hat-trick' | 'milestone-50' | 'milestone-100' | 'custom';
  title: string;
  subtitle: string;
  playerName?: string;
  timestamp: number;
}

export interface Match {
  id: string;
  name: string;
  venue: string;
  date: string;
  totalOvers: number;
  teamA: TeamConfig;
  teamB: TeamConfig;
  tossWinner: string;
  tossChoice: 'bat' | 'bowl';
  status: MatchStatus;
  currentInnings: 1 | 2;
  innings1?: InningsState;
  innings2?: InningsState;
  result?: string;
  winnerTeam?: string;
  seriesId?: string;
  potmInfo?: MatchPOTM;
  dlsApplied?: boolean;
  dlsRevisedOvers?: number;
  dlsRevisedTarget?: number;
  scorerDeviceId?: string;
  currentAlert?: MatchAlert | null;
  latestDeliveryBurst?: DeliveryBurst | null;
  timeline?: any[];
}

export interface TournamentSeries {
  id: string;
  name: string; // e.g. "Premier T20 Cup 2026"
  format: string; // e.g. "3-Match Series"
  totalMatches: number;
  teamA: string;
  teamB: string;
  matchIds: string[];
  status: 'ongoing' | 'completed';
  winnerTeam?: string;
  seriesResult?: string;
  playerOfSeriesId?: string;
  playerOfSeriesSummary?: string;
}

export interface SeriesPlayerMVP {
  playerId: string;
  matchesPlayed: number;
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  wickets: number;
  oversBowled: number;
  runsConceded: number;
  maidens: number;
  fiftyPlus: number;
  hundredPlus: number;
  threeWicketHauls: number;
  mvpPoints: number;
}

import type { Player, Match, TournamentSeries } from '../types/cricket';

export const INITIAL_PLAYERS: Player[] = [
  {
    id: 'p-1',
    name: 'Virat Kohli',
    role: 'Batsman',
    battingStyle: 'Right-hand',
    bowlingStyle: 'Right-arm Medium',
    country: 'India',
    jerseyNumber: 18,
    avatarUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 25, inningsBatted: 24, totalRuns: 1120, ballsFaced: 820, highestScore: 122, notOuts: 6, fours: 104, sixes: 34, inningsBowled: 4, oversBowled: 8, ballsBowled: 48, runsConceded: 58, wicketsTaken: 2, bestBowlingWickets: 1, bestBowlingRuns: 12, maidens: 0 }
  },
  {
    id: 'p-2',
    name: 'Rohit Sharma',
    role: 'Batsman',
    battingStyle: 'Right-hand',
    bowlingStyle: 'Off-spin',
    country: 'India',
    jerseyNumber: 45,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 26, inningsBatted: 25, totalRuns: 1210, ballsFaced: 840, highestScore: 130, notOuts: 4, fours: 112, sixes: 45, inningsBowled: 2, oversBowled: 4, ballsBowled: 24, runsConceded: 30, wicketsTaken: 1, bestBowlingWickets: 1, bestBowlingRuns: 15, maidens: 0 }
  },
  {
    id: 'p-3',
    name: 'Suryakumar Yadav',
    role: 'Batsman',
    battingStyle: 'Right-hand',
    bowlingStyle: 'Right-arm Medium',
    country: 'India',
    jerseyNumber: 63,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 20, inningsBatted: 19, totalRuns: 890, ballsFaced: 490, highestScore: 117, notOuts: 3, fours: 74, sixes: 48, inningsBowled: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, bestBowlingWickets: 0, bestBowlingRuns: 0, maidens: 0 }
  },
  {
    id: 'p-4',
    name: 'Hardik Pandya',
    role: 'All-Rounder',
    battingStyle: 'Right-hand',
    bowlingStyle: 'Right-arm Fast',
    country: 'India',
    jerseyNumber: 33,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 22, inningsBatted: 18, totalRuns: 620, ballsFaced: 410, highestScore: 87, notOuts: 5, fours: 48, sixes: 31, inningsBowled: 20, oversBowled: 64, ballsBowled: 384, runsConceded: 430, wicketsTaken: 22, bestBowlingWickets: 4, bestBowlingRuns: 24, maidens: 2 }
  },
  {
    id: 'p-5',
    name: 'Rishabh Pant',
    role: 'Wicket-Keeper',
    battingStyle: 'Left-hand',
    bowlingStyle: 'None',
    country: 'India',
    jerseyNumber: 17,
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 18, inningsBatted: 17, totalRuns: 540, ballsFaced: 360, highestScore: 89, notOuts: 2, fours: 52, sixes: 28, inningsBowled: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, bestBowlingWickets: 0, bestBowlingRuns: 0, maidens: 0 }
  },
  {
    id: 'p-6',
    name: 'Ravindra Jadeja',
    role: 'All-Rounder',
    battingStyle: 'Left-hand',
    bowlingStyle: 'Left-arm Spin',
    country: 'India',
    jerseyNumber: 8,
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 24, inningsBatted: 16, totalRuns: 430, ballsFaced: 320, highestScore: 62, notOuts: 6, fours: 36, sixes: 14, inningsBowled: 24, oversBowled: 88, ballsBowled: 528, runsConceded: 490, wicketsTaken: 28, bestBowlingWickets: 4, bestBowlingRuns: 16, maidens: 5 }
  },
  {
    id: 'p-7',
    name: 'Jasprit Bumrah',
    role: 'Bowler',
    battingStyle: 'Right-hand',
    bowlingStyle: 'Right-arm Fast',
    country: 'India',
    jerseyNumber: 93,
    avatarUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 22, inningsBatted: 8, totalRuns: 45, ballsFaced: 38, highestScore: 16, notOuts: 4, fours: 4, sixes: 1, inningsBowled: 22, oversBowled: 84, ballsBowled: 504, runsConceded: 420, wicketsTaken: 38, bestBowlingWickets: 5, bestBowlingRuns: 18, maidens: 12 }
  },
  {
    id: 'p-8',
    name: 'Mohammed Shami',
    role: 'Bowler',
    battingStyle: 'Right-hand',
    bowlingStyle: 'Right-arm Fast',
    country: 'India',
    jerseyNumber: 11,
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 21, inningsBatted: 7, totalRuns: 38, ballsFaced: 29, highestScore: 14, notOuts: 3, fours: 3, sixes: 1, inningsBowled: 21, oversBowled: 78, ballsBowled: 468, runsConceded: 410, wicketsTaken: 32, bestBowlingWickets: 5, bestBowlingRuns: 22, maidens: 6 }
  },
  {
    id: 'p-9',
    name: 'Kuldeep Yadav',
    role: 'Bowler',
    battingStyle: 'Left-hand',
    bowlingStyle: 'Left-arm Spin',
    country: 'India',
    jerseyNumber: 23,
    avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 19, inningsBatted: 5, totalRuns: 24, ballsFaced: 20, highestScore: 10, notOuts: 2, fours: 2, sixes: 0, inningsBowled: 19, oversBowled: 72, ballsBowled: 432, runsConceded: 380, wicketsTaken: 29, bestBowlingWickets: 4, bestBowlingRuns: 14, maidens: 4 }
  },
  {
    id: 'p-10',
    name: 'Arshdeep Singh',
    role: 'Bowler',
    battingStyle: 'Left-hand',
    bowlingStyle: 'Left-arm Fast',
    country: 'India',
    jerseyNumber: 2,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 18, inningsBatted: 4, totalRuns: 18, ballsFaced: 15, highestScore: 9, notOuts: 2, fours: 1, sixes: 1, inningsBowled: 18, oversBowled: 68, ballsBowled: 408, runsConceded: 395, wicketsTaken: 26, bestBowlingWickets: 4, bestBowlingRuns: 20, maidens: 2 }
  },
  {
    id: 'p-11',
    name: 'Axar Patel',
    role: 'All-Rounder',
    battingStyle: 'Left-hand',
    bowlingStyle: 'Left-arm Spin',
    country: 'India',
    jerseyNumber: 20,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 19, inningsBatted: 12, totalRuns: 280, ballsFaced: 190, highestScore: 54, notOuts: 4, fours: 22, sixes: 11, inningsBowled: 19, oversBowled: 62, ballsBowled: 372, runsConceded: 350, wicketsTaken: 21, bestBowlingWickets: 3, bestBowlingRuns: 18, maidens: 3 }
  },

  // Team B Squad (11 Players)
  {
    id: 'p-12',
    name: 'Jos Buttler',
    role: 'Wicket-Keeper',
    battingStyle: 'Right-hand',
    bowlingStyle: 'None',
    country: 'England',
    jerseyNumber: 63,
    avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 22, inningsBatted: 21, totalRuns: 840, ballsFaced: 520, highestScore: 116, notOuts: 4, fours: 78, sixes: 41, inningsBowled: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, bestBowlingWickets: 0, bestBowlingRuns: 0, maidens: 0 }
  },
  {
    id: 'p-13',
    name: 'Travis Head',
    role: 'Batsman',
    battingStyle: 'Left-hand',
    bowlingStyle: 'Off-spin',
    country: 'Australia',
    jerseyNumber: 62,
    avatarUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 21, inningsBatted: 20, totalRuns: 920, ballsFaced: 560, highestScore: 137, notOuts: 3, fours: 94, sixes: 38, inningsBowled: 3, oversBowled: 6, ballsBowled: 36, runsConceded: 42, wicketsTaken: 2, bestBowlingWickets: 2, bestBowlingRuns: 12, maidens: 0 }
  },
  {
    id: 'p-14',
    name: 'Babar Azam',
    role: 'Batsman',
    battingStyle: 'Right-hand',
    bowlingStyle: 'Off-spin',
    country: 'Pakistan',
    jerseyNumber: 56,
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 23, inningsBatted: 22, totalRuns: 980, ballsFaced: 740, highestScore: 110, notOuts: 4, fours: 92, sixes: 18, inningsBowled: 2, oversBowled: 4, ballsBowled: 24, runsConceded: 28, wicketsTaken: 0, bestBowlingWickets: 0, bestBowlingRuns: 0, maidens: 0 }
  },
  {
    id: 'p-15',
    name: 'Ben Stokes',
    role: 'All-Rounder',
    battingStyle: 'Left-hand',
    bowlingStyle: 'Right-arm Fast',
    country: 'England',
    jerseyNumber: 55,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 20, inningsBatted: 19, totalRuns: 680, ballsFaced: 510, highestScore: 102, notOuts: 3, fours: 68, sixes: 22, inningsBowled: 16, oversBowled: 52, ballsBowled: 312, runsConceded: 340, wicketsTaken: 19, bestBowlingWickets: 4, bestBowlingRuns: 32, maidens: 3 }
  },
  {
    id: 'p-16',
    name: 'Glenn Maxwell',
    role: 'All-Rounder',
    battingStyle: 'Right-hand',
    bowlingStyle: 'Off-spin',
    country: 'Australia',
    jerseyNumber: 32,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 22, inningsBatted: 20, totalRuns: 740, ballsFaced: 410, highestScore: 104, notOuts: 4, fours: 62, sixes: 44, inningsBowled: 18, oversBowled: 58, ballsBowled: 348, runsConceded: 380, wicketsTaken: 18, bestBowlingWickets: 3, bestBowlingRuns: 20, maidens: 1 }
  },
  {
    id: 'p-17',
    name: 'Rashid Khan',
    role: 'Bowler',
    battingStyle: 'Right-hand',
    bowlingStyle: 'Leg-spin',
    country: 'Afghanistan',
    jerseyNumber: 19,
    avatarUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 24, inningsBatted: 12, totalRuns: 195, ballsFaced: 110, highestScore: 42, notOuts: 3, fours: 18, sixes: 11, inningsBowled: 24, oversBowled: 92, ballsBowled: 552, runsConceded: 490, wicketsTaken: 41, bestBowlingWickets: 5, bestBowlingRuns: 15, maidens: 8 }
  },
  {
    id: 'p-18',
    name: 'Shaheen Afridi',
    role: 'Bowler',
    battingStyle: 'Left-hand',
    bowlingStyle: 'Left-arm Fast',
    country: 'Pakistan',
    jerseyNumber: 10,
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 19, inningsBatted: 7, totalRuns: 52, ballsFaced: 31, highestScore: 19, notOuts: 2, fours: 3, sixes: 3, inningsBowled: 19, oversBowled: 72, ballsBowled: 432, runsConceded: 390, wicketsTaken: 33, bestBowlingWickets: 4, bestBowlingRuns: 22, maidens: 6 }
  },
  {
    id: 'p-19',
    name: 'Mitchell Starc',
    role: 'Bowler',
    battingStyle: 'Left-hand',
    bowlingStyle: 'Left-arm Fast',
    country: 'Australia',
    jerseyNumber: 56,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 20, inningsBatted: 11, totalRuns: 110, ballsFaced: 85, highestScore: 28, notOuts: 4, fours: 8, sixes: 4, inningsBowled: 20, oversBowled: 76, ballsBowled: 456, runsConceded: 415, wicketsTaken: 31, bestBowlingWickets: 4, bestBowlingRuns: 20, maidens: 4 }
  },
  {
    id: 'p-20',
    name: 'Pat Cummins',
    role: 'Bowler',
    battingStyle: 'Right-hand',
    bowlingStyle: 'Right-arm Fast',
    country: 'Australia',
    jerseyNumber: 30,
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 21, inningsBatted: 12, totalRuns: 160, ballsFaced: 110, highestScore: 35, notOuts: 5, fours: 12, sixes: 6, inningsBowled: 21, oversBowled: 80, ballsBowled: 480, runsConceded: 440, wicketsTaken: 30, bestBowlingWickets: 4, bestBowlingRuns: 28, maidens: 5 }
  },
  {
    id: 'p-21',
    name: 'Adam Zampa',
    role: 'Bowler',
    battingStyle: 'Right-hand',
    bowlingStyle: 'Leg-spin',
    country: 'Australia',
    jerseyNumber: 88,
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 18, inningsBatted: 4, totalRuns: 22, ballsFaced: 18, highestScore: 8, notOuts: 2, fours: 1, sixes: 0, inningsBowled: 18, oversBowled: 66, ballsBowled: 396, runsConceded: 370, wicketsTaken: 27, bestBowlingWickets: 4, bestBowlingRuns: 16, maidens: 3 }
  },
  {
    id: 'p-22',
    name: 'David Warner',
    role: 'Batsman',
    battingStyle: 'Left-hand',
    bowlingStyle: 'Leg-spin',
    country: 'Australia',
    jerseyNumber: 31,
    avatarUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=150&auto=format&fit=crop&q=80',
    stats: { matches: 25, inningsBatted: 25, totalRuns: 1080, ballsFaced: 760, highestScore: 124, notOuts: 3, fours: 102, sixes: 39, inningsBowled: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, bestBowlingWickets: 0, bestBowlingRuns: 0, maidens: 0 }
  }
];

export const INITIAL_MATCHES: Match[] = [
  {
    id: 'm-sample-1',
    name: 'Grand Final - Premier League T20',
    venue: 'Lords Cricket Ground',
    date: new Date().toISOString().split('T')[0],
    totalOvers: 5,
    teamA: {
      name: 'Royal Titans',
      playerIds: ['p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-7', 'p-8', 'p-9', 'p-10', 'p-11']
    },
    teamB: {
      name: 'Super Strikers',
      playerIds: ['p-12', 'p-13', 'p-14', 'p-15', 'p-16', 'p-17', 'p-18', 'p-19', 'p-20', 'p-21', 'p-22']
    },
    tossWinner: 'Royal Titans',
    tossChoice: 'bat',
    status: 'completed',
    currentInnings: 2,
    result: 'Royal Titans won by 14 runs',
    winnerTeam: 'Royal Titans',
    seriesId: 'series-1',
    potmInfo: {
      playerId: 'p-1',
      points: 78,
      summary: '32 runs (18b) • 4x4, 1x6'
    },
    innings1: {
      inningsNo: 1,
      battingTeam: 'Royal Titans',
      bowlingTeam: 'Super Strikers',
      totalRuns: 54,
      wickets: 2,
      overs: 5,
      balls: 0,
      strikerId: 'p-1',
      nonStrikerId: 'p-2',
      currentBowlerId: 'p-18',
      extrasTotal: { wides: 2, noBalls: 1, byes: 0, legByes: 0, total: 3 },
      isCompleted: true,
      fow: [
        { wicketNo: 1, runs: 28, overs: '2.4', playerId: 'p-5' },
        { wicketNo: 2, runs: 45, overs: '4.2', playerId: 'p-3' }
      ],
      batsmenStats: {
        'p-1': { playerId: 'p-1', runs: 32, balls: 18, fours: 4, sixes: 1, isOut: false },
        'p-5': { playerId: 'p-5', runs: 12, balls: 8, fours: 2, sixes: 0, isOut: true, dismissalType: 'caught', dismissalText: 'c Buttler b Afridi', bowlerId: 'p-18', fielderId: 'p-12' },
        'p-3': { playerId: 'p-3', runs: 7, balls: 4, fours: 1, sixes: 0, isOut: true, dismissalType: 'bowled', dismissalText: 'b Starc', bowlerId: 'p-19' },
        'p-2': { playerId: 'p-2', runs: 3, balls: 2, fours: 0, sixes: 0, isOut: false }
      },
      bowlerStats: {
        'p-18': { playerId: 'p-18', overs: 2, balls: 0, maidens: 0, runsConceded: 22, wickets: 1, wides: 1, noBalls: 0, dots: 4 },
        'p-19': { playerId: 'p-19', overs: 2, balls: 0, maidens: 0, runsConceded: 18, wickets: 1, wides: 1, noBalls: 1, dots: 5 },
        'p-17': { playerId: 'p-17', overs: 1, balls: 0, maidens: 0, runsConceded: 14, wickets: 0, wides: 0, noBalls: 0, dots: 1 }
      },
      ballLogs: [],
      recentBalls: []
    },
    innings2: {
      inningsNo: 2,
      battingTeam: 'Super Strikers',
      bowlingTeam: 'Royal Titans',
      totalRuns: 40,
      wickets: 4,
      overs: 5,
      balls: 0,
      target: 55,
      strikerId: 'p-12',
      nonStrikerId: 'p-13',
      currentBowlerId: 'p-7',
      extrasTotal: { wides: 1, noBalls: 0, byes: 1, legByes: 0, total: 2 },
      isCompleted: true,
      fow: [
        { wicketNo: 1, runs: 12, overs: '1.2', playerId: 'p-12' },
        { wicketNo: 2, runs: 24, overs: '2.5', playerId: 'p-14' },
        { wicketNo: 3, runs: 33, overs: '3.6', playerId: 'p-17' },
        { wicketNo: 4, runs: 38, overs: '4.4', playerId: 'p-18' }
      ],
      batsmenStats: {
        'p-14': { playerId: 'p-14', runs: 15, balls: 11, fours: 2, sixes: 0, isOut: true, dismissalType: 'lbw', dismissalText: 'lbw b Bumrah', bowlerId: 'p-7' },
        'p-12': { playerId: 'p-12', runs: 8, balls: 6, fours: 1, sixes: 0, isOut: true, dismissalType: 'caught', dismissalText: 'c Pant b Pandya', bowlerId: 'p-4', fielderId: 'p-5' },
        'p-17': { playerId: 'p-17', runs: 10, balls: 8, fours: 1, sixes: 0, isOut: true, dismissalType: 'bowled', dismissalText: 'b Bumrah', bowlerId: 'p-7' },
        'p-18': { playerId: 'p-18', runs: 4, balls: 3, fours: 0, sixes: 0, isOut: true, dismissalType: 'run-out', dismissalText: 'run out (Kohli)', bowlerId: 'p-7', fielderId: 'p-1' },
        'p-13': { playerId: 'p-13', runs: 3, balls: 2, fours: 0, sixes: 0, isOut: false }
      },
      bowlerStats: {
        'p-7': { playerId: 'p-7', overs: 3, balls: 0, maidens: 0, runsConceded: 18, wickets: 2, wides: 1, noBalls: 0, dots: 9 },
        'p-4': { playerId: 'p-4', overs: 2, balls: 0, maidens: 0, runsConceded: 20, wickets: 1, wides: 0, noBalls: 0, dots: 4 }
      },
      ballLogs: [],
      recentBalls: []
    }
  }
];

export const INITIAL_SERIES: TournamentSeries[] = [
  {
    id: 'series-triseries-1',
    name: 'International T20 Tri-Series Cup 2026',
    seriesType: 'triseries',
    format: 'Tri-Series (3 Teams)',
    totalMatches: 7,
    teamA: 'India',
    teamB: 'Australia',
    teamC: 'England',
    matchIds: ['m-sample-1'],
    status: 'ongoing',
  },
  {
    id: 'series-1',
    name: 'Premier T20 Championship 2026',
    seriesType: 'bilateral',
    format: '3-Match Series',
    totalMatches: 3,
    teamA: 'Royal Titans',
    teamB: 'Super Strikers',
    matchIds: [],
    status: 'completed',
    winnerTeam: 'Royal Titans',
    seriesResult: 'Royal Titans won the series 2-1',
    playerOfSeriesId: 'p-1',
    playerOfSeriesSummary: '168 Runs • 2 Wickets (215 Series MVP Pts)'
  }
];

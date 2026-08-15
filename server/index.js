import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const IS_VERCEL = !!process.env.VERCEL;
const DATA_DIR = IS_VERCEL ? '/tmp' : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Database Seeds (22 Players)
const INITIAL_PLAYERS = [
  { id: 'p-1', name: 'Virat Kohli', role: 'Batsman', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm Medium', country: 'India', jerseyNumber: 18, avatarUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=150&auto=format&fit=crop&q=80', stats: { matches: 25, inningsBatted: 24, totalRuns: 1120, ballsFaced: 820, highestScore: 122, notOuts: 6, fours: 104, sixes: 34, inningsBowled: 4, oversBowled: 8, ballsBowled: 48, runsConceded: 58, wicketsTaken: 2, bestBowlingWickets: 1, bestBowlingRuns: 12, maidens: 0 } },
  { id: 'p-2', name: 'Rohit Sharma', role: 'Batsman', battingStyle: 'Right-hand', bowlingStyle: 'Off-spin', country: 'India', jerseyNumber: 45, avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', stats: { matches: 26, inningsBatted: 25, totalRuns: 1210, ballsFaced: 840, highestScore: 130, notOuts: 4, fours: 112, sixes: 45, inningsBowled: 2, oversBowled: 4, ballsBowled: 24, runsConceded: 30, wicketsTaken: 1, bestBowlingWickets: 1, bestBowlingRuns: 15, maidens: 0 } },
  { id: 'p-3', name: 'Suryakumar Yadav', role: 'Batsman', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm Medium', country: 'India', jerseyNumber: 63, avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', stats: { matches: 20, inningsBatted: 19, totalRuns: 890, ballsFaced: 490, highestScore: 117, notOuts: 3, fours: 74, sixes: 48, inningsBowled: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, bestBowlingWickets: 0, bestBowlingRuns: 0, maidens: 0 } },
  { id: 'p-4', name: 'Hardik Pandya', role: 'All-Rounder', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm Fast', country: 'India', jerseyNumber: 33, avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', stats: { matches: 22, inningsBatted: 18, totalRuns: 620, ballsFaced: 410, highestScore: 87, notOuts: 5, fours: 48, sixes: 31, inningsBowled: 20, oversBowled: 64, ballsBowled: 384, runsConceded: 430, wicketsTaken: 22, bestBowlingWickets: 4, bestBowlingRuns: 24, maidens: 2 } },
  { id: 'p-5', name: 'Rishabh Pant', role: 'Wicket-Keeper', battingStyle: 'Left-hand', bowlingStyle: 'None', country: 'India', jerseyNumber: 17, avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80', stats: { matches: 18, inningsBatted: 17, totalRuns: 540, ballsFaced: 360, highestScore: 89, notOuts: 2, fours: 52, sixes: 28, inningsBowled: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, bestBowlingWickets: 0, bestBowlingRuns: 0, maidens: 0 } },
  { id: 'p-6', name: 'Ravindra Jadeja', role: 'All-Rounder', battingStyle: 'Left-hand', bowlingStyle: 'Left-arm Spin', country: 'India', jerseyNumber: 8, avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', stats: { matches: 24, inningsBatted: 16, totalRuns: 430, ballsFaced: 320, highestScore: 62, notOuts: 6, fours: 36, sixes: 14, inningsBowled: 24, oversBowled: 88, ballsBowled: 528, runsConceded: 490, wicketsTaken: 28, bestBowlingWickets: 4, bestBowlingRuns: 16, maidens: 5 } },
  { id: 'p-7', name: 'Jasprit Bumrah', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm Fast', country: 'India', jerseyNumber: 93, avatarUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=150&auto=format&fit=crop&q=80', stats: { matches: 22, inningsBatted: 8, totalRuns: 45, ballsFaced: 38, highestScore: 16, notOuts: 4, fours: 4, sixes: 1, inningsBowled: 22, oversBowled: 84, ballsBowled: 504, runsConceded: 420, wicketsTaken: 38, bestBowlingWickets: 5, bestBowlingRuns: 18, maidens: 12 } },
  { id: 'p-8', name: 'Mohammed Shami', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm Fast', country: 'India', jerseyNumber: 11, avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', stats: { matches: 21, inningsBatted: 7, totalRuns: 38, ballsFaced: 29, highestScore: 14, notOuts: 3, fours: 3, sixes: 1, inningsBowled: 21, oversBowled: 78, ballsBowled: 468, runsConceded: 410, wicketsTaken: 32, bestBowlingWickets: 5, bestBowlingRuns: 22, maidens: 6 } },
  { id: 'p-9', name: 'Kuldeep Yadav', role: 'Bowler', battingStyle: 'Left-hand', bowlingStyle: 'Left-arm Spin', country: 'India', jerseyNumber: 23, avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80', stats: { matches: 19, inningsBatted: 5, totalRuns: 24, ballsFaced: 20, highestScore: 10, notOuts: 2, fours: 2, sixes: 0, inningsBowled: 19, oversBowled: 72, ballsBowled: 432, runsConceded: 380, wicketsTaken: 29, bestBowlingWickets: 4, bestBowlingRuns: 14, maidens: 4 } },
  { id: 'p-10', name: 'Arshdeep Singh', role: 'Bowler', battingStyle: 'Left-hand', bowlingStyle: 'Left-arm Fast', country: 'India', jerseyNumber: 2, avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', stats: { matches: 18, inningsBatted: 4, totalRuns: 18, ballsFaced: 15, highestScore: 9, notOuts: 2, fours: 1, sixes: 1, inningsBowled: 18, oversBowled: 68, ballsBowled: 408, runsConceded: 395, wicketsTaken: 26, bestBowlingWickets: 4, bestBowlingRuns: 20, maidens: 2 } },
  { id: 'p-11', name: 'Axar Patel', role: 'All-Rounder', battingStyle: 'Left-hand', bowlingStyle: 'Left-arm Spin', country: 'India', jerseyNumber: 20, avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', stats: { matches: 19, inningsBatted: 12, totalRuns: 280, ballsFaced: 190, highestScore: 54, notOuts: 4, fours: 22, sixes: 11, inningsBowled: 19, oversBowled: 62, ballsBowled: 372, runsConceded: 350, wicketsTaken: 21, bestBowlingWickets: 3, bestBowlingRuns: 18, maidens: 3 } },
  { id: 'p-12', name: 'Jos Buttler', role: 'Wicket-Keeper', battingStyle: 'Right-hand', bowlingStyle: 'None', country: 'England', jerseyNumber: 63, avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80', stats: { matches: 22, inningsBatted: 21, totalRuns: 840, ballsFaced: 520, highestScore: 116, notOuts: 4, fours: 78, sixes: 41, inningsBowled: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, bestBowlingWickets: 0, bestBowlingRuns: 0, maidens: 0 } },
  { id: 'p-13', name: 'Travis Head', role: 'Batsman', battingStyle: 'Left-hand', bowlingStyle: 'Off-spin', country: 'Australia', jerseyNumber: 62, avatarUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=150&auto=format&fit=crop&q=80', stats: { matches: 21, inningsBatted: 20, totalRuns: 920, ballsFaced: 560, highestScore: 137, notOuts: 3, fours: 94, sixes: 38, inningsBowled: 3, oversBowled: 6, ballsBowled: 36, runsConceded: 42, wicketsTaken: 2, bestBowlingWickets: 2, bestBowlingRuns: 12, maidens: 0 } },
  { id: 'p-14', name: 'Babar Azam', role: 'Batsman', battingStyle: 'Right-hand', bowlingStyle: 'Off-spin', country: 'Pakistan', jerseyNumber: 56, avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', stats: { matches: 23, inningsBatted: 22, totalRuns: 980, ballsFaced: 740, highestScore: 110, notOuts: 4, fours: 92, sixes: 18, inningsBowled: 2, oversBowled: 4, ballsBowled: 24, runsConceded: 28, wicketsTaken: 0, bestBowlingWickets: 0, bestBowlingRuns: 0, maidens: 0 } },
  { id: 'p-15', name: 'Ben Stokes', role: 'All-Rounder', battingStyle: 'Left-hand', bowlingStyle: 'Right-arm Fast', country: 'England', jerseyNumber: 55, avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', stats: { matches: 20, inningsBatted: 19, totalRuns: 680, ballsFaced: 510, highestScore: 102, notOuts: 3, fours: 68, sixes: 22, inningsBowled: 16, oversBowled: 52, ballsBowled: 312, runsConceded: 340, wicketsTaken: 19, bestBowlingWickets: 4, bestBowlingRuns: 32, maidens: 3 } },
  { id: 'p-16', name: 'Glenn Maxwell', role: 'All-Rounder', battingStyle: 'Right-hand', bowlingStyle: 'Off-spin', country: 'Australia', jerseyNumber: 32, avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', stats: { matches: 22, inningsBatted: 20, totalRuns: 740, ballsFaced: 410, highestScore: 104, notOuts: 4, fours: 62, sixes: 44, inningsBowled: 18, oversBowled: 58, ballsBowled: 348, runsConceded: 380, wicketsTaken: 18, bestBowlingWickets: 3, bestBowlingRuns: 20, maidens: 1 } },
  { id: 'p-17', name: 'Rashid Khan', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin', country: 'Afghanistan', jerseyNumber: 19, avatarUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=150&auto=format&fit=crop&q=80', stats: { matches: 24, inningsBatted: 12, totalRuns: 195, ballsFaced: 110, highestScore: 42, notOuts: 3, fours: 18, sixes: 11, inningsBowled: 24, oversBowled: 92, ballsBowled: 552, runsConceded: 490, wicketsTaken: 41, bestBowlingWickets: 5, bestBowlingRuns: 15, maidens: 8 } },
  { id: 'p-18', name: 'Shaheen Afridi', role: 'Bowler', battingStyle: 'Left-hand', bowlingStyle: 'Left-arm Fast', country: 'Pakistan', jerseyNumber: 10, avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80', stats: { matches: 19, inningsBatted: 7, totalRuns: 52, ballsFaced: 31, highestScore: 19, notOuts: 2, fours: 3, sixes: 3, inningsBowled: 19, oversBowled: 72, ballsBowled: 432, runsConceded: 390, wicketsTaken: 33, bestBowlingWickets: 4, bestBowlingRuns: 22, maidens: 6 } },
  { id: 'p-19', name: 'Mitchell Starc', role: 'Bowler', battingStyle: 'Left-hand', bowlingStyle: 'Left-arm Fast', country: 'Australia', jerseyNumber: 56, avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', stats: { matches: 20, inningsBatted: 11, totalRuns: 110, ballsFaced: 85, highestScore: 28, notOuts: 4, fours: 8, sixes: 4, inningsBowled: 20, oversBowled: 76, ballsBowled: 456, runsConceded: 415, wicketsTaken: 31, bestBowlingWickets: 4, bestBowlingRuns: 20, maidens: 4 } },
  { id: 'p-20', name: 'Pat Cummins', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Right-arm Fast', country: 'Australia', jerseyNumber: 30, avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80', stats: { matches: 21, inningsBatted: 12, totalRuns: 160, ballsFaced: 110, highestScore: 35, notOuts: 5, fours: 12, sixes: 6, inningsBowled: 21, oversBowled: 80, ballsBowled: 480, runsConceded: 440, wicketsTaken: 30, bestBowlingWickets: 4, bestBowlingRuns: 28, maidens: 5 } },
  { id: 'p-21', name: 'Adam Zampa', role: 'Bowler', battingStyle: 'Right-hand', bowlingStyle: 'Leg-spin', country: 'Australia', jerseyNumber: 88, avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80', stats: { matches: 18, inningsBatted: 4, totalRuns: 22, ballsFaced: 18, highestScore: 8, notOuts: 2, fours: 1, sixes: 0, inningsBowled: 18, oversBowled: 66, ballsBowled: 396, runsConceded: 370, wicketsTaken: 27, bestBowlingWickets: 4, bestBowlingRuns: 16, maidens: 3 } },
  { id: 'p-22', name: 'David Warner', role: 'Batsman', battingStyle: 'Left-hand', bowlingStyle: 'Leg-spin', country: 'Australia', jerseyNumber: 31, avatarUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=150&auto=format&fit=crop&q=80', stats: { matches: 25, inningsBatted: 25, totalRuns: 1080, ballsFaced: 760, highestScore: 124, notOuts: 3, fours: 102, sixes: 39, inningsBowled: 0, oversBowled: 0, ballsBowled: 0, runsConceded: 0, wicketsTaken: 0, bestBowlingWickets: 0, bestBowlingRuns: 0, maidens: 0 } }
];

const INITIAL_DB = {
  players: INITIAL_PLAYERS,
  matches: [
    {
      id: 'm-sample-1',
      name: 'Grand Final - Premier League T20',
      venue: 'Lords Cricket Ground',
      date: new Date().toISOString().split('T')[0],
      totalOvers: 5,
      teamA: { name: 'Royal Titans', playerIds: ['p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-7', 'p-8', 'p-9', 'p-10', 'p-11'] },
      teamB: { name: 'Super Strikers', playerIds: ['p-12', 'p-13', 'p-14', 'p-15', 'p-16', 'p-17', 'p-18', 'p-19', 'p-20', 'p-21', 'p-22'] },
      tossWinner: 'Royal Titans',
      tossChoice: 'bat',
      status: 'completed',
      currentInnings: 2,
      result: 'Royal Titans won by 14 runs',
      winnerTeam: 'Royal Titans',
      seriesId: 'series-1',
      potmInfo: { playerId: 'p-1', points: 78, summary: '32 runs (18b) • 4x4, 1x6' }
    }
  ],
  series: [
    {
      id: 'series-1',
      name: 'Premier T20 Championship 2026',
      format: '3-Match Series',
      totalMatches: 3,
      teamA: 'Royal Titans',
      teamB: 'Super Strikers',
      matchIds: ['m-sample-1'],
      status: 'completed',
      winnerTeam: 'Royal Titans',
      seriesResult: 'Royal Titans won the series 2-1',
      playerOfSeriesId: 'p-1',
      playerOfSeriesSummary: '168 Runs • 2 Wickets (215 Series MVP Pts)'
    }
  ]
};

// Helper: Read DB
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2));
      return INITIAL_DB;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (!data.players || data.players.length < 5) {
      data.players = INITIAL_PLAYERS;
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    }
    return data;
  } catch (err) {
    console.error('Error reading DB, using initial data:', err);
    return INITIAL_DB;
  }
}

// Helper: Write DB
function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'Node.js Express', database: 'JSON File DB (server/data/db.json)' });
});

// --- PLAYERS ENDPOINTS ---
app.get('/api/players', (req, res) => {
  const db = readDb();
  res.json(db.players || []);
});

app.post('/api/players', (req, res) => {
  const db = readDb();
  const newPlayer = { ...req.body, id: req.body.id || `p-${Date.now()}` };
  db.players = [newPlayer, ...(db.players || []).filter(p => p.id !== newPlayer.id)];
  writeDb(db);
  res.status(201).json(newPlayer);
});

app.put('/api/players/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const exists = (db.players || []).some(p => p.id === id);
  if (exists) {
    db.players = (db.players || []).map(p => p.id === id ? { ...p, ...req.body } : p);
  } else {
    const newPlayer = { ...req.body, id };
    db.players = [newPlayer, ...(db.players || [])];
  }
  writeDb(db);
  res.json({ success: true });
});

app.delete('/api/players/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  db.players = (db.players || []).filter(p => p.id !== id);
  writeDb(db);
  res.json({ success: true });
});

// --- MATCHES ENDPOINTS ---
app.get('/api/matches', (req, res) => {
  const db = readDb();
  res.json(db.matches || []);
});

app.post('/api/matches', (req, res) => {
  const db = readDb();
  const newMatch = { ...req.body, id: req.body.id || `match-${Date.now()}` };
  db.matches = [newMatch, ...(db.matches || []).filter(m => m.id !== newMatch.id)];
  db.activeMatchId = newMatch.id;
  writeDb(db);
  res.status(201).json(newMatch);
});

app.put('/api/matches/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const exists = (db.matches || []).some(m => m.id === id);
  if (exists) {
    db.matches = (db.matches || []).map(m => m.id === id ? { ...m, ...req.body } : m);
  } else {
    const newMatch = { ...req.body, id };
    db.matches = [newMatch, ...(db.matches || [])];
  }
  if (req.body.status === 'live' || !db.activeMatchId) {
    db.activeMatchId = id;
  }
  writeDb(db);
  res.json({ success: true, activeMatchId: db.activeMatchId });
});

// --- SERIES ENDPOINTS ---
app.get('/api/series', (req, res) => {
  const db = readDb();
  res.json(db.series || []);
});

app.post('/api/series', (req, res) => {
  const db = readDb();
  const newSeries = { ...req.body, id: req.body.id || `series-${Date.now()}` };
  db.series = [newSeries, ...(db.series || []).filter(s => s.id !== newSeries.id)];
  writeDb(db);
  res.status(201).json(newSeries);
});

app.put('/api/series/:id', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const exists = (db.series || []).some(s => s.id === id);
  if (exists) {
    db.series = (db.series || []).map(s => s.id === id ? { ...s, ...req.body } : s);
  } else {
    const newSeries = { ...req.body, id };
    db.series = [newSeries, ...(db.series || [])];
  }
  writeDb(db);
  res.json({ success: true });
});

// --- EXCLUSIVE SCORER LOCK SYSTEM ---
app.post('/api/scorer/acquire', (req, res) => {
  const db = readDb();
  const { deviceId, deviceName } = req.body;

  if (!deviceId) {
    return res.status(400).json({ success: false, message: 'deviceId is required' });
  }

  const now = Date.now();
  const currentScorer = db.activeScorer;

  // If another device holds the lock and it hasn't expired (10 mins inactivity timeout)
  if (currentScorer && currentScorer.deviceId !== deviceId && (now - (currentScorer.lastActive || currentScorer.acquiredAt)) < 10 * 60 * 1000) {
    return res.json({
      success: false,
      isLocked: true,
      activeScorer: currentScorer,
      message: `Scorer controls are currently locked by ${currentScorer.deviceName || 'another device'}. You cannot take over scoring until they release the role or switch to spectator.`,
    });
  }

  // Grant or refresh scorer lock
  db.activeScorer = {
    deviceId,
    deviceName: deviceName || 'Primary Scorer Device',
    acquiredAt: currentScorer?.deviceId === deviceId ? currentScorer.acquiredAt : now,
    lastActive: now,
  };

  writeDb(db);
  res.json({ success: true, activeScorer: db.activeScorer });
});

app.post('/api/scorer/release', (req, res) => {
  const db = readDb();
  const { deviceId, force } = req.body;

  if (force || (db.activeScorer && db.activeScorer.deviceId === deviceId)) {
    db.activeScorer = null;
    writeDb(db);
    return res.json({ success: true, message: 'Scorer lock released successfully' });
  }

  res.json({ success: false, message: 'Not authorized to release lock or lock not held' });
});

app.post('/api/scorer/heartbeat', (req, res) => {
  const db = readDb();
  const { deviceId } = req.body;

  if (db.activeScorer && db.activeScorer.deviceId === deviceId) {
    db.activeScorer.lastActive = Date.now();
    writeDb(db);
    return res.json({ success: true });
  }

  res.json({ success: false });
});

// --- REALTIME MULTI-DEVICE SYNC ENDPOINT ---
app.get('/api/sync', (req, res) => {
  const db = readDb();
  // If activeMatchId is not explicitly set, find any live ongoing match
  let activeId = db.activeMatchId;
  if (!activeId) {
    const liveMatch = (db.matches || []).find(m => m.status === 'live');
    if (liveMatch) activeId = liveMatch.id;
  }

  res.json({
    players: db.players || [],
    matches: db.matches || [],
    series: db.series || [],
    activeMatchId: activeId || null,
    activeScorer: db.activeScorer || null,
    timestamp: Date.now(),
  });
});

app.post('/api/active-match', (req, res) => {
  const db = readDb();
  db.activeMatchId = req.body.activeMatchId || null;
  writeDb(db);
  res.json({ success: true, activeMatchId: db.activeMatchId });
});

// --- RESET DEMO ENDPOINT ---
app.post('/api/reset-demo', (req, res) => {
  writeDb(INITIAL_DB);
  res.json({ success: true, message: 'Database reset to initial demo state' });
});

// Serve frontend static assets in production if dist/ exists
const DIST_DIR = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏏 CricPulse Express Backend Server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;

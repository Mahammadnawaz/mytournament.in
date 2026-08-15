import type { Player, Match, TournamentSeries } from '../types/cricket';

const API_BASE = '/api';

export const api = {
  // Check Backend Health
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  // Players API
  async getPlayers(): Promise<Player[] | null> {
    try {
      const res = await fetch(`${API_BASE}/players`);
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('Backend API unreachable, using local storage:', err);
    }
    return null;
  },

  async addPlayer(player: Player): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(player),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updatePlayer(player: Player): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/players/${player.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(player),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deletePlayer(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/players/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Matches API
  async getMatches(): Promise<Match[] | null> {
    try {
      const res = await fetch(`${API_BASE}/matches`);
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('Backend API unreachable, using local storage:', err);
    }
    return null;
  },

  async addMatch(match: Match): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(match),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateMatch(match: Match): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/matches/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(match),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Series API
  async getSeries(): Promise<TournamentSeries[] | null> {
    try {
      const res = await fetch(`${API_BASE}/series`);
      if (res.ok) return await res.json();
    } catch (err) {
      console.warn('Backend API unreachable, using local storage:', err);
    }
    return null;
  },

  async addSeries(series: TournamentSeries): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/series`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(series),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async updateSeries(series: TournamentSeries): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/series/${series.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(series),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Realtime Multi-Device Sync API
  async getSync(): Promise<{
    players: Player[];
    matches: Match[];
    series: TournamentSeries[];
    activeMatchId: string | null;
    activeScorer: { deviceId: string; deviceName: string; acquiredAt: number; lastActive: number } | null;
    timestamp: number;
  } | null> {
    try {
      const res = await fetch(`${API_BASE}/sync`);
      if (res.ok) return await res.json();
    } catch {
      // Backend offline or unreachable
    }
    return null;
  },

  async acquireScorerLock(deviceId: string, deviceName?: string): Promise<{
    success: boolean;
    isLocked?: boolean;
    activeScorer?: { deviceId: string; deviceName: string };
    message?: string;
  }> {
    try {
      const res = await fetch(`${API_BASE}/scorer/acquire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, deviceName }),
      });
      return await res.json();
    } catch {
      return { success: true }; // Fallback offline mode
    }
  },

  async releaseScorerLock(deviceId: string, force?: boolean): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/scorer/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, force }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async heartbeatScorerLock(deviceId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/scorer/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async setActiveMatchId(activeMatchId: string | null): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/active-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeMatchId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async resetDemo(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/reset-demo`, { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    }
  }
};

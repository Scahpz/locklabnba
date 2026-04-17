/**
 * balldontlie.io - Free NBA stats API (no key required)
 * Docs: https://www.balldontlie.io/api/v1/
 */

const BASE = 'https://www.balldontlie.io/api/v1';

// Cache player data in memory for the session
const playerIdCache = {};
const playerTeamCache = {};

export async function getBallDontLiePlayerId(playerName) {
  if (playerIdCache[playerName]) return playerIdCache[playerName];

  const parts = playerName.trim().split(' ');
  const search = parts[0]; // search by first name for broader results

  const res = await fetch(`${BASE}/players?search=${encodeURIComponent(search)}&per_page=25`);
  if (!res.ok) return null;
  const data = await res.json();

  // Find best match by full name
  const nameLower = playerName.toLowerCase();
  const match = data.data?.find(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase() === nameLower
  ) || data.data?.find(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(parts[parts.length - 1].toLowerCase())
  );

  if (match) {
    playerIdCache[playerName] = match.id;
    // Cache team abbreviation from balldontlie
    if (match.team?.abbreviation) {
      playerTeamCache[playerName] = match.team.abbreviation;
    }
    return match.id;
  }
  return null;
}

// balldontlie → standard abbreviation overrides where they differ
const BDL_ABV_MAP = {
  'GS': 'GSW', 'NY': 'NYK', 'SA': 'SAS', 'NO': 'NOP',
  'OKC': 'OKC', 'UTA': 'UTA',
};

function normAbv(abv) {
  return BDL_ABV_MAP[abv] || abv;
}

export function getCachedPlayerTeam(playerName) {
  return playerTeamCache[playerName] || null;
}

/**
 * Fetch and cache the current team for a list of player names.
 * Deduplicates requests and runs them in parallel.
 */
export async function prefetchPlayerTeams(playerNames) {
  const unique = [...new Set(playerNames)].filter(n => !playerTeamCache[n] && !playerIdCache[n]);
  if (unique.length === 0) return;

  await Promise.all(
    unique.map(async (playerName) => {
      try {
        const parts = playerName.trim().split(' ');
        const res = await fetch(`${BASE}/players?search=${encodeURIComponent(parts[0])}&per_page=25`);
        if (!res.ok) return;
        const data = await res.json();
        const nameLower = playerName.toLowerCase();
        const match = data.data?.find(p =>
          `${p.first_name} ${p.last_name}`.toLowerCase() === nameLower
        ) || data.data?.find(p =>
          `${p.first_name} ${p.last_name}`.toLowerCase().includes(parts[parts.length - 1].toLowerCase())
        );
        if (match) {
          playerIdCache[playerName] = match.id;
          if (match.team?.abbreviation) {
            playerTeamCache[playerName] = normAbv(match.team.abbreviation);
          }
        }
      } catch {}
    })
  );
}

const PROP_TO_STAT = {
  points: 'pts',
  rebounds: 'reb',
  assists: 'ast',
  '3PM': 'fg3m',
  steals: 'stl',
  blocks: 'blk',
  PRA: null, // computed
  turnovers: 'turnover',
};

// Normalize team abbreviations from balldontlie to standard
const BDL_TEAM_ABV = {
  'ATL': 'ATL', 'BOS': 'BOS', 'BKN': 'BKN', 'CHA': 'CHA', 'CHI': 'CHI',
  'CLE': 'CLE', 'DAL': 'DAL', 'DEN': 'DEN', 'DET': 'DET', 'GS': 'GSW',
  'HOU': 'HOU', 'IND': 'IND', 'LAC': 'LAC', 'LAL': 'LAL', 'MEM': 'MEM',
  'MIA': 'MIA', 'MIL': 'MIL', 'MIN': 'MIN', 'NO': 'NOP', 'NY': 'NYK',
  'OKC': 'OKC', 'ORL': 'ORL', 'PHI': 'PHI', 'PHX': 'PHX', 'POR': 'POR',
  'SAC': 'SAC', 'SA': 'SAS', 'TOR': 'TOR', 'UTA': 'UTA', 'WAS': 'WAS',
};

function normTeam(abv) {
  return BDL_TEAM_ABV[abv] || abv || '???';
}

/**
 * Fetch last N game logs for a player for a specific stat.
 * Returns array of { value, opp, isHome } objects (most recent last).
 */
export async function getPlayerGameLogs(playerId, propType, season = 2025, games = 10) {
  const res = await fetch(
    `${BASE}/stats?player_ids[]=${playerId}&seasons[]=${season}&per_page=${games}&sort_direction=desc`
  );
  if (!res.ok) return null;
  const data = await res.json();

  const logs = data.data || [];

  return logs.map(g => {
    let value;
    if (propType === 'PRA') value = (g.pts || 0) + (g.reb || 0) + (g.ast || 0);
    else {
      const key = PROP_TO_STAT[propType];
      value = key ? (g[key] || 0) : 0;
    }

    // Determine opponent and home/away from game data
    const game = g.game;
    let opp = '???';
    let isHome = true;
    if (game) {
      const homeTeam = normTeam(game.home_team_abbreviation);
      const visitorTeam = normTeam(game.visitor_team_abbreviation);
      const playerTeam = normTeam(g.team?.abbreviation);
      isHome = playerTeam === homeTeam;
      opp = isHome ? visitorTeam : homeTeam;
    }

    return { value, opp, isHome };
  }).filter(v => v != null).reverse(); // oldest first
}

/**
 * Fetch season averages for a player.
 */
export async function getPlayerSeasonAverages(playerId, season = 2025) {
  const res = await fetch(`${BASE}/season_averages?player_ids[]=${playerId}&season=${season}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.data?.[0] || null;
}

/**
 * Get real analytics for a player prop by hitting balldontlie.
 * Returns { avg_last_5, avg_last_10, hit_rate_last_10, last_5_games, last_10_games, projection, edge, streak_info }
 * Falls back gracefully if player not found.
 */
export async function getRealPlayerAnalytics(playerName, propType, line) {
  try {
    const playerId = await getBallDontLiePlayerId(playerName);
    if (!playerId) return null;

    const logs = await getPlayerGameLogs(playerId, propType, 2025, 15);
    if (!logs || logs.length < 3) return null;

    const last10 = logs.slice(-10);
    const last5 = logs.slice(-5);

    // Extract just values for calculations
    const vals10 = last10.map(g => g.value);
    const vals5 = last5.map(g => g.value);

    const avg10 = parseFloat((vals10.reduce((a, b) => a + b, 0) / vals10.length).toFixed(1));
    const avg5 = parseFloat((vals5.reduce((a, b) => a + b, 0) / vals5.length).toFixed(1));

    const hits = vals10.filter(v => v > line).length;
    const hit_rate = Math.round((hits / vals10.length) * 100);

    const proj = parseFloat(((avg5 * 0.6 + avg10 * 0.4)).toFixed(1));
    const edge = parseFloat((((proj - line) / line) * 100).toFixed(1));

    let streak_info = '';
    if (hits >= 7) streak_info = `Hit over in ${hits} of last 10`;
    else if (hits <= 3) streak_info = `Hit under in ${10 - hits} of last 10`;
    else streak_info = `Split ${hits}-${10 - hits} last 10`;

    return {
      avg_last_5: avg5,
      avg_last_10: avg10,
      hit_rate_last_10: hit_rate,
      last_5_games: vals5,
      last_10_games: vals10,
      // Rich game log with opponent info for charts
      game_logs_last_10: last10.map(g => ({ value: g.value, opp: g.opp, isHome: g.isHome })),
      projection: proj,
      edge,
      streak_info,
      confidence_score: Math.min(10, Math.max(3, hits >= 8 ? 9 : hits >= 6 ? 7 : hits >= 4 ? 5 : 3)),
      data_source: 'real',
    };
  } catch (e) {
    return null;
  }
}
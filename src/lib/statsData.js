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

export function getCachedPlayerTeam(playerName) {
  return playerTeamCache[playerName] || null;
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

/**
 * Fetch last N game logs for a player for a specific stat.
 * Returns array of stat values (most recent last).
 */
export async function getPlayerGameLogs(playerId, propType, season = 2024, games = 10) {
  const res = await fetch(
    `${BASE}/stats?player_ids[]=${playerId}&seasons[]=${season}&per_page=${games}&sort_direction=desc`
  );
  if (!res.ok) return null;
  const data = await res.json();

  const logs = data.data || [];

  return logs.map(g => {
    if (propType === 'PRA') return (g.pts || 0) + (g.reb || 0) + (g.ast || 0);
    const key = PROP_TO_STAT[propType];
    return key ? (g[key] || 0) : 0;
  }).filter(v => v != null).reverse(); // oldest first
}

/**
 * Fetch season averages for a player.
 */
export async function getPlayerSeasonAverages(playerId, season = 2024) {
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

    const logs = await getPlayerGameLogs(playerId, propType, 2024, 15);
    if (!logs || logs.length < 3) return null;

    const last10 = logs.slice(-10);
    const last5 = logs.slice(-5);

    const avg10 = parseFloat((last10.reduce((a, b) => a + b, 0) / last10.length).toFixed(1));
    const avg5 = parseFloat((last5.reduce((a, b) => a + b, 0) / last5.length).toFixed(1));

    const hits = last10.filter(v => v > line).length;
    const hit_rate = Math.round((hits / last10.length) * 100);

    // Projection: weighted average (last 5 weighted more)
    const proj = parseFloat(((avg5 * 0.6 + avg10 * 0.4)).toFixed(1));
    const edge = parseFloat((((proj - line) / line) * 100).toFixed(1));

    // Streak info
    let streak_info = '';
    if (hits >= 7) streak_info = `Hit over in ${hits} of last 10`;
    else if (hits <= 3) streak_info = `Hit under in ${10 - hits} of last 10`;
    else streak_info = `Split ${hits}-${10 - hits} last 10`;

    return {
      avg_last_5: avg5,
      avg_last_10: avg10,
      hit_rate_last_10: hit_rate,
      last_5_games: last5,
      last_10_games: last10,
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
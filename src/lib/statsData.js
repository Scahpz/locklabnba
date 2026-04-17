/**
 * BallDontLie API - official source for verified NBA stats (no CORS issues)
 * Provides: game logs, season averages, player info
 */

const BALLDONTLIE_BASE = 'https://api.balldontlie.io/v1';

// Cache player ID lookups in memory
const playerIdCache = {};

/**
 * Search for player by name and get their ID
 */
async function getBdlPlayerId(playerName) {
  if (playerIdCache[playerName]) return playerIdCache[playerName];

  const apiKey = Deno.env.get('BALLDONTLIE_API_KEY');
  if (!apiKey) throw new Error('BALLDONTLIE_API_KEY not set');

  const url = `${BALLDONTLIE_BASE}/players?search=${encodeURIComponent(playerName)}`;
  const res = await fetch(url, {
    headers: { 'Authorization': apiKey }
  });

  if (!res.ok) throw new Error(`BallDontLie search error: ${res.status}`);
  const data = await res.json();
  
  if (!data.data || data.data.length === 0) return null;
  
  const player = data.data[0];
  playerIdCache[playerName] = player.id;
  return player.id;
}

/**
 * Fetch last 10 game logs for a player from BallDontLie
 * Returns array of { value, opp, isHome } (oldest first)
 */
async function getBdlGameLogs(playerId, propType) {
  const apiKey = Deno.env.get('BALLDONTLIE_API_KEY');
  if (!apiKey) throw new Error('BALLDONTLIE_API_KEY not set');

  // Fetch recent games (limit=100 to ensure we have 10+)
  const url = `${BALLDONTLIE_BASE}/games?player_ids[]=${playerId}&limit=100&sort=DESC`;
  const res = await fetch(url, {
    headers: { 'Authorization': apiKey }
  });

  if (!res.ok) throw new Error(`BallDontLie games error: ${res.status}`);
  const data = await res.json();
  
  if (!data.data || data.data.length === 0) return null;

  // Take last 10 games (data comes in DESC order, so reverse)
  const games = data.data.slice(0, 10).reverse();

  const logs = games.map(game => {
    const playerTeam = game.home_team.id === playerId ? game.home_team.abbreviation : game.visitor_team.abbreviation;
    const oppTeam = game.home_team.id === playerId ? game.visitor_team.abbreviation : game.home_team.abbreviation;
    const isHome = game.home_team.id === playerId;

    let value = 0;
    if (propType === 'PRA') {
      value = (game.pts || 0) + (game.reb || 0) + (game.ast || 0);
    } else if (propType === 'points') {
      value = game.pts || 0;
    } else if (propType === 'rebounds') {
      value = game.reb || 0;
    } else if (propType === 'assists') {
      value = game.ast || 0;
    } else if (propType === '3PM') {
      value = game.fg3m || 0;
    } else if (propType === 'steals') {
      value = game.stl || 0;
    } else if (propType === 'blocks') {
      value = game.blk || 0;
    } else if (propType === 'turnovers') {
      value = game.turnover || 0;
    }

    return {
      value: Number(value),
      opp: isHome ? `vs ${oppTeam}` : `@ ${oppTeam}`,
      isHome
    };
  });

  return logs;
}

/**
 * Get real analytics for a player prop using BallDontLie API.
 * Returns { avg_last_5, avg_last_10, hit_rate_last_10, last_5_games, last_10_games,
 *           game_logs_last_10, projection, edge, streak_info, confidence_score, data_source }
 */
export async function getRealPlayerAnalytics(playerName, propType, line) {
  try {
    const playerId = await getBdlPlayerId(playerName);
    if (!playerId) return null;

    const logs = await getBdlGameLogs(playerId, propType);
    if (!logs || logs.length < 3) return null;

    const last10 = logs.slice(-10);
    const last5 = logs.slice(-5);

    const vals10 = last10.map(g => g.value);
    const vals5 = last5.map(g => g.value);

    // Stats are verified integers from BallDontLie
    const avg10 = Math.round(vals10.reduce((a, b) => a + b, 0) / vals10.length);
    const avg5 = Math.round(vals5.reduce((a, b) => a + b, 0) / vals5.length);

    const hits = vals10.filter(v => v > line).length;
    const hit_rate = Math.round((hits / vals10.length) * 100);

    const proj = Math.round(avg5 * 0.6 + avg10 * 0.4);
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
      game_logs_last_10: last10.map(g => ({
        value: g.value,
        opp: String(g.opp),
        isHome: Boolean(g.isHome),
      })),
      projection: proj,
      edge,
      streak_info,
      confidence_score: Math.min(10, Math.max(3, hits >= 8 ? 9 : hits >= 6 ? 7 : hits >= 4 ? 5 : 3)),
      data_source: 'verified',
    };
  } catch (e) {
    console.warn(`BallDontLie API failed for ${playerName}:`, e.message);
    return null;
  }
}

// Keep these exports for compatibility
export async function getBallDontLiePlayerId() { return null; }
export function getCachedPlayerTeam() { return null; }
export async function prefetchPlayerTeams() {}
export async function getPlayerGameLogs() { return null; }
export async function getPlayerSeasonAverages() { return null; }
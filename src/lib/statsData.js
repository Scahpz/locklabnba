/**
 * NBA Stats API (stats.nba.com) - same source as nba_api Python library
 * No API key required, but requires specific headers to avoid 403.
 * We use a CORS proxy since browsers can't hit stats.nba.com directly.
 */

const NBA_STATS_BASE = 'https://stats.nba.com/stats';

// CORS proxy options - allorigins is reliable
const PROXY = 'https://corsproxy.io/?';

function proxyUrl(url) {
  return `${PROXY}${encodeURIComponent(url)}`;
}

const NBA_HEADERS = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': 'https://www.nba.com',
  'Referer': 'https://www.nba.com/',
  'x-nba-stats-origin': 'stats',
  'x-nba-stats-token': 'true',
};

// Cache player ID lookups in memory
const playerIdCache = {};

/**
 * Get all active players and find ID by name
 */
async function getNbaPlayerId(playerName) {
  if (playerIdCache[playerName]) return playerIdCache[playerName];

  const url = `${NBA_STATS_BASE}/commonallplayers?LeagueID=00&Season=2024-25&IsOnlyCurrentSeason=1`;
  const res = await fetch(proxyUrl(url), { headers: NBA_HEADERS });
  if (!res.ok) throw new Error(`NBA players API error: ${res.status}`);

  const data = await res.json();
  const headers = data.resultSets[0].headers;
  const rows = data.resultSets[0].rowSet;

  const nameIdx = headers.indexOf('DISPLAY_FIRST_LAST');
  const idIdx = headers.indexOf('PERSON_ID');

  const nameLower = playerName.toLowerCase();
  const match = rows.find(r => r[nameIdx]?.toLowerCase() === nameLower)
    || rows.find(r => r[nameIdx]?.toLowerCase().includes(playerName.split(' ').pop().toLowerCase()));

  if (match) {
    const id = match[idIdx];
    playerIdCache[playerName] = id;
    return id;
  }
  return null;
}

const PROP_TO_STAT_KEY = {
  points: 'PTS',
  rebounds: 'REB',
  assists: 'AST',
  '3PM': 'FG3M',
  steals: 'STL',
  blocks: 'BLK',
  PRA: null, // computed
  turnovers: 'TOV',
};

/**
 * Fetch last 10 game logs for a player from NBA Stats API
 * Returns array of { value, opp, isHome } (oldest first)
 */
async function getNbaGameLogs(playerId, propType, season = '2024-25') {
  const url = `${NBA_STATS_BASE}/playergamelog?PlayerID=${playerId}&Season=${season}&SeasonType=Regular+Season&LastNGames=10`;
  const res = await fetch(proxyUrl(url), { headers: NBA_HEADERS });
  if (!res.ok) throw new Error(`NBA game logs error: ${res.status}`);

  const data = await res.json();
  const headers = data.resultSets[0].headers;
  const rows = data.resultSets[0].rowSet;

  if (!rows || rows.length === 0) return null;

  const statKey = PROP_TO_STAT_KEY[propType];
  const matchupIdx = headers.indexOf('MATCHUP'); // e.g. "LAL vs. BOS" or "LAL @ BOS"

  const logs = rows.map(row => {
    const matchup = row[matchupIdx] || '';
    const isHome = matchup.includes('vs.');
    // Extract opponent: last 3 chars of matchup
    const opp = matchup.split(' ').pop();

    let value;
    if (propType === 'PRA') {
      const pts = row[headers.indexOf('PTS')] || 0;
      const reb = row[headers.indexOf('REB')] || 0;
      const ast = row[headers.indexOf('AST')] || 0;
      value = pts + reb + ast;
    } else {
      const idx = headers.indexOf(statKey);
      value = idx >= 0 ? (row[idx] || 0) : 0;
    }

    return { value: Number(value), opp, isHome };
  });

  // NBA API returns newest first — reverse to oldest first
  return logs.reverse();
}

/**
 * Get real analytics for a player prop using NBA Stats API.
 * Returns { avg_last_5, avg_last_10, hit_rate_last_10, last_5_games, last_10_games,
 *           game_logs_last_10, projection, edge, streak_info, confidence_score, data_source }
 */
export async function getRealPlayerAnalytics(playerName, propType, line) {
  try {
    const playerId = await getNbaPlayerId(playerName);
    if (!playerId) return null;

    const logs = await getNbaGameLogs(playerId, propType);
    if (!logs || logs.length < 3) return null;

    const last10 = logs.slice(-10);
    const last5 = logs.slice(-5);

    const vals10 = last10.map(g => g.value);
    const vals5 = last5.map(g => g.value);

    // Stats are whole integers from NBA API — always round to whole numbers
    const avg10 = Math.round(vals10.reduce((a, b) => a + b, 0) / vals10.length);
    const avg5 = Math.round(vals5.reduce((a, b) => a + b, 0) / vals5.length);

    const hits = vals10.filter(v => v > line).length;
    const hit_rate = Math.round((hits / vals10.length) * 100);

    const proj = Math.round(avg5 * 0.6 + avg10 * 0.4); // whole number projection
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
      data_source: 'real',
    };
  } catch (e) {
    console.warn(`NBA Stats API failed for ${playerName}:`, e.message);
    return null;
  }
}

// Keep these exports for compatibility
export async function getBallDontLiePlayerId() { return null; }
export function getCachedPlayerTeam() { return null; }
export async function prefetchPlayerTeams() {}
export async function getPlayerGameLogs() { return null; }
export async function getPlayerSeasonAverages() { return null; }
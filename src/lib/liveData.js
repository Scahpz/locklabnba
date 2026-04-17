const CACHE_KEY = 'locklab_live_props_v28';
const CACHE_DATE_KEY = 'locklab_live_props_date_v28';

// Clear any old versioned cache keys on load
(function purgeOldCaches() {
  for (let i = 1; i <= 27; i++) {
    localStorage.removeItem(`locklab_live_props_v${i}`);
    localStorage.removeItem(`locklab_live_props_date_v${i}`);
  }
})();
const API_KEY_STORAGE = 'locklab_odds_api_key';

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';
const SPORT = 'basketball_nba';

const PROP_MARKETS = [
  'player_points',
  'player_rebounds',
  'player_assists',
  'player_threes',
  'player_points_rebounds_assists',
  'player_steals',
  'player_blocks',
].join(',');

const PROP_TYPE_MAP = {
  player_points: 'points',
  player_rebounds: 'rebounds',
  player_assists: 'assists',
  player_threes: '3PM',
  player_points_rebounds_assists: 'PRA',
  player_steals: 'steals',
  player_blocks: 'blocks',
};

const TEAM_NAME_TO_ABV = {
  'Atlanta Hawks': 'ATL', 'Boston Celtics': 'BOS', 'Brooklyn Nets': 'BKN',
  'Charlotte Hornets': 'CHA', 'Chicago Bulls': 'CHI', 'Cleveland Cavaliers': 'CLE',
  'Dallas Mavericks': 'DAL', 'Denver Nuggets': 'DEN', 'Detroit Pistons': 'DET',
  'Golden State Warriors': 'GSW', 'Houston Rockets': 'HOU', 'Indiana Pacers': 'IND',
  'Los Angeles Clippers': 'LAC', 'Los Angeles Lakers': 'LAL', 'Memphis Grizzlies': 'MEM',
  'Miami Heat': 'MIA', 'Milwaukee Bucks': 'MIL', 'Minnesota Timberwolves': 'MIN',
  'New Orleans Pelicans': 'NOP', 'New York Knicks': 'NYK', 'Oklahoma City Thunder': 'OKC',
  'Orlando Magic': 'ORL', 'Philadelphia 76ers': 'PHI', 'Phoenix Suns': 'PHX',
  'Portland Trail Blazers': 'POR', 'Sacramento Kings': 'SAC', 'San Antonio Spurs': 'SAS',
  'Toronto Raptors': 'TOR', 'Utah Jazz': 'UTA', 'Washington Wizards': 'WAS',
};

function toAbv(name) {
  return TEAM_NAME_TO_ABV[name] || name?.substring(0, 3).toUpperCase() || 'UNK';
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function isCacheValid() {
  return localStorage.getItem(CACHE_DATE_KEY) === todayStr() && !!localStorage.getItem(CACHE_KEY);
}

export function clearLiveCache() {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_DATE_KEY);
}

export function getStoredApiKey() {
  return null;
}

export function setStoredApiKey(key) {
  // no-op
}

/** Parse all bookmakers for a single player+prop from an event odds response */
function parseBookOdds(eventOddsData, playerName, marketKey) {
  const books = [];
  (eventOddsData?.bookmakers || []).forEach(bm => {
    const market = bm.markets?.find(m => m.key === marketKey);
    if (!market) return;
    const overO = market.outcomes?.find(o => o.name === 'Over' && (o.description === playerName || (!o.description && false)));
    const underO = market.outcomes?.find(o => o.name === 'Under' && (o.description === playerName || (!o.description && false)));
    // For player props, description holds the player name
    const over = market.outcomes?.find(o => o.name === 'Over' && o.description === playerName);
    const under = market.outcomes?.find(o => o.name === 'Under' && o.description === playerName);
    if (over || under) {
      books.push({
        key: bm.key,
        title: bm.title,
        line: over?.point ?? under?.point ?? null,
        over_odds: over?.price ?? null,
        under_odds: under?.price ?? null,
      });
    }
  });
  return books;
}

export async function fetchLiveProps() {
  if (isCacheValid()) {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch {}
  }

  // Fetch props from backend function (uses ODDS_API_KEY secret securely)
  const { base44 } = await import('@/api/base44Client');
  const today = todayStr();
  let oddsData;
  try {
    const res = await base44.functions.invoke('fetchLivePropsFromOdds', {});
    oddsData = res.data;
  } catch (e) {
    console.error('Backend odds fetch failed:', e.message);
    return { game_date: new Date().toLocaleDateString(), games_summary: [], props: [] };
  }

  if (!oddsData.rawProps || oddsData.rawProps.length === 0) {
    return { game_date: oddsData.game_date, games_summary: oddsData.games_summary || [], props: [] };
  }

  const allRawProps = oddsData.rawProps;

  // Enrich with REAL stats from balldontlie.io, but fall back to mock data if unavailable
  const { getRealPlayerAnalytics, getCachedPlayerTeam, prefetchPlayerTeams } = await import('@/lib/statsData');
  const { getPlayerTeam } = await import('@/lib/nbaRosters');

  const playerPropPairs = allRawProps.map(p => ({ player_name: p.player_name, prop_type: p.prop_type, line: p.line }));
  const uniquePlayerNames = [...new Set(allRawProps.map(p => p.player_name))];
  const [analyticsResults] = await Promise.all([
    Promise.all(
      playerPropPairs.map(({ player_name, prop_type, line }) =>
        getRealPlayerAnalytics(player_name, prop_type, line).catch(() => null)
      )
    ),
    prefetchPlayerTeams(uniquePlayerNames),
  ]);

  const enriched = allRawProps.map((prop, i) => {
    const analytics = analyticsResults[i];
    
    // Use analytics if available, otherwise generate basic fallback data
    const confidence_score = analytics?.confidence_score ?? 5;
    const edge = analytics?.edge ?? 0;
    const avg_last_10 = analytics?.avg_last_10 ?? prop.line;
    const hit_rate_last_10 = analytics?.hit_rate_last_10 ?? 50;
    const avg_last_5 = analytics?.avg_last_5 ?? prop.line;
    const projection = analytics?.projection ?? prop.line;
    const streak_info = analytics?.streak_info ?? null;
    const game_logs_last_10 = analytics?.game_logs_last_10 ?? null;

    return {
      ...prop,
      confidence_score,
      edge,
      avg_last_10,
      hit_rate_last_10,
      avg_last_5,
      projection,
      streak_info,
      game_logs_last_10,
      team: prop.player_team || prop.home,
      opponent: (prop.player_team && prop.player_team !== prop.home ? prop.home : prop.away),
      player_id: `live_${i}`,
      photo_url: null,
      position: 'G',
      is_starter: true,
      injury_status: 'healthy',
      is_top_pick: confidence_score >= 8,
      is_lock: confidence_score === 10,
      best_value: edge > 8,
      trap_warning: false,
      minutes_avg: 30,
      usage_rate: 25,
      minutes_last_5: [28, 29, 30, 31, 29],
      def_rank_vs_pos: 15,
      matchup_rating: 'neutral',
      pace_rating: 100,
      game_total: 220,
      confidence_tier: confidence_score >= 8 ? 'A' : confidence_score >= 6 ? 'B' : 'C',
    };
  });

  const payload = {
    game_date: oddsData.game_date || new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    games_summary: oddsData.games_summary || [],
    props: enriched,
  };

  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  localStorage.setItem(CACHE_DATE_KEY, today);
  return payload;
}
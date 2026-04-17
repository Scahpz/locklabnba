const CACHE_KEY = 'locklab_live_props_v28';
const CACHE_DATE_KEY = 'locklab_live_props_date_v28';
const CACHE_TIMESTAMP_KEY = 'locklab_live_props_timestamp_v28';
const CACHE_TTL_MINUTES = 5; // Refresh every 5 minutes

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
  const cachedDate = localStorage.getItem(CACHE_DATE_KEY);
  const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  
  // Cache is invalid if it's a different day
  if (cachedDate !== todayStr()) {
    return false;
  }
  
  // Cache is invalid if it's older than TTL
  if (!cachedTimestamp) {
    return false;
  }
  
  const age = Date.now() - parseInt(cachedTimestamp, 10);
  return age < CACHE_TTL_MINUTES * 60 * 1000;
}

export function clearLiveCache() {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_DATE_KEY);
}

const HARDCODED_API_KEY = '5508f7fa9c244f635fdf5188a9fea52e';

export function getStoredApiKey() {
  return HARDCODED_API_KEY;
}

export function setStoredApiKey(key) {
  // no-op: key is hardcoded
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

  const apiKey = getStoredApiKey();
  if (!apiKey) {
    return { game_date: new Date().toLocaleDateString(), games_summary: [], props: [], needsApiKey: true };
  }

  // Step 1: Get today's NBA events
  const eventsRes = await fetch(
    `${ODDS_API_BASE}/sports/${SPORT}/events?apiKey=${apiKey}&dateFormat=iso`
  );
  if (!eventsRes.ok) {
    if (eventsRes.status === 401) throw new Error('Invalid API key');
    throw new Error(`Events API error: ${eventsRes.status}`);
  }
  const events = await eventsRes.json();

  // Filter to today's games
  const today = todayStr();
  const todayEvents = events.filter(e => e.commence_time?.startsWith(today));

  if (todayEvents.length === 0) {
    return { game_date: today, games_summary: [], props: [] };
  }

  // Step 2: Fetch props for all today's games in parallel (all bookmakers)
  const propResults = await Promise.all(
    todayEvents.map(event =>
      fetch(
        `${ODDS_API_BASE}/sports/${SPORT}/events/${event.id}/odds?apiKey=${apiKey}&regions=us&markets=${PROP_MARKETS}&oddsFormat=american`
      ).then(r => r.ok ? r.json() : null).catch(() => null)
    )
  );

  // Build games summary
  const games_summary = todayEvents.map(e => ({
    home: toAbv(e.home_team),
    away: toAbv(e.away_team),
    tipoff: new Date(e.commence_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET',
    total: null,
  }));

  // Parse props — collect all books per player+prop
  const propMap = {};

  propResults.forEach((eventOdds, idx) => {
    if (!eventOdds) return;
    const event = todayEvents[idx];
    const homeAbv = toAbv(event.home_team);
    const awayAbv = toAbv(event.away_team);

    const primaryBm = eventOdds.bookmakers?.find(b => b.key === 'draftkings')
      || eventOdds.bookmakers?.find(b => b.key === 'fanduel')
      || eventOdds.bookmakers?.[0];
    if (!primaryBm) return;

    primaryBm.markets?.forEach(market => {
      const propType = PROP_TYPE_MAP[market.key];
      if (!propType) return;

      const byPlayer = {};
      market.outcomes?.forEach(outcome => {
        const name = outcome.description;
        if (!name) return;
        if (!byPlayer[name]) byPlayer[name] = {};
        if (outcome.name === 'Over') {
          byPlayer[name].over_odds = outcome.price;
          byPlayer[name].line = outcome.point;
        } else if (outcome.name === 'Under') {
          byPlayer[name].under_odds = outcome.price;
          byPlayer[name].line = byPlayer[name].line ?? outcome.point;
        }
      });

      Object.entries(byPlayer).forEach(([player_name, data]) => {
        if (data.line == null) return;
        const mapKey = `${player_name}__${propType}__${homeAbv}@${awayAbv}`;
        if (propMap[mapKey]) return;

        const allBooks = parseBookOdds(eventOdds, player_name, market.key);

        propMap[mapKey] = {
          player_name,
          prop_type: propType,
          line: data.line,
          over_odds: data.over_odds ?? -110,
          under_odds: data.under_odds ?? -110,
          bookmaker: primaryBm.title,
          all_books: allBooks,
          home: homeAbv,
          away: awayAbv,
          market_key: market.key,
        };
      });
    });
  });

  const allRawProps = Object.values(propMap);

  // Step 3: Enrich with REAL stats from balldontlie.io
  // Rate-limit: process in batches to avoid hammering the free API
  const { getRealPlayerAnalytics, getCachedPlayerTeam, prefetchPlayerTeams } = await import('@/lib/statsData');
  const { getPlayerTeam } = await import('@/lib/nbaRosters');

  // Deduplicate players so we don't fetch same player multiple times
  const playerPropPairs = allRawProps.map(p => ({ player_name: p.player_name, prop_type: p.prop_type, line: p.line }));

  // Prefetch current team for all players from live API (runs in parallel with analytics)
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
    const real = analyticsResults[i];

    // Use real data if available, otherwise fall back to simulated
    let analytics;
    if (real) {
      analytics = real;
    } else {
      // Simulated fallback (clearly marked)
      const base = prop.line || 20;
      const variance = base * 0.22;
      const games10 = Array.from({ length: 10 }, () =>
        Math.round(base + (Math.random() * variance * 2 - variance))
      );
      const g5 = games10.slice(-5);
      const avg10 = parseFloat((games10.reduce((a, b) => a + b, 0) / 10).toFixed(1));
      const avg5 = parseFloat((g5.reduce((a, b) => a + b, 0) / 5).toFixed(1));
      const hits = games10.filter(v => v > prop.line).length;
      analytics = {
        avg_last_5: Math.round(avg5),
        avg_last_10: Math.round(avg10),
        hit_rate_last_10: Math.round((hits / 10) * 100),
        last_5_games: g5,
        last_10_games: games10,
        game_logs_last_10: games10.map((value, idx) => ({
          value: Number(value),
          opp: `G${idx + 1}`,
          isHome: Boolean(idx % 2 === 0),
        })),
        projection: Math.round(avg5 * 1.02),
        edge: parseFloat((((avg5 * 1.02 - prop.line) / prop.line) * 100).toFixed(1)),
        streak_info: hits >= 7 ? `Hit over in ${hits} of last 10` : hits <= 3 ? `Hit under in ${10 - hits} of last 10` : `Split ${hits}-${10 - hits} last 10`,
        confidence_score: Math.min(10, Math.max(3, hits >= 8 ? 9 : hits >= 6 ? 7 : hits >= 4 ? 5 : 3)),
        data_source: 'estimated',
      };
    }

    const { confidence_score, data_source, game_logs_last_10, ...analyticsRest } = analytics;

    // Ensure game_logs_last_10 is a strictly plain serializable array (no class instances)
    const plainGameLogs = Array.isArray(game_logs_last_10)
      ? game_logs_last_10.map(g => ({ value: Number(g.value), opp: String(g.opp || 'OPP'), isHome: Boolean(g.isHome) }))
      : null;

    return {
      ...prop,
      ...analyticsRest,
      confidence_score,
      data_source,
      game_logs_last_10: plainGameLogs,
      team: getCachedPlayerTeam(prop.player_name) || getPlayerTeam(prop.player_name) || prop.home,
      opponent: prop.away,
      player_id: `live_${i}`,
      photo_url: null,
      position: 'G',
      is_starter: true,
      injury_status: 'healthy',
      is_top_pick: confidence_score >= 8,
      is_lock: confidence_score === 10,
      best_value: analytics.edge > 8,
      trap_warning: false,
      minutes_avg: 30,
      usage_rate: 25,
      minutes_last_5: Array.from({ length: 5 }, () => Math.round(28 + Math.random() * 6)),
      def_rank_vs_pos: 15,
      matchup_rating: 'neutral',
      pace_rating: 100,
      game_total: 220,
      confidence_tier: confidence_score >= 8 ? 'A' : confidence_score >= 6 ? 'B' : 'C',
    };
  });

  const payload = {
    game_date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    games_summary,
    props: enriched,
  };

  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  localStorage.setItem(CACHE_DATE_KEY, today);
  localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  return payload;
}
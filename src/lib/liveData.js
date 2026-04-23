const CACHE_KEY = 'locklab_live_props_v33';
const CACHE_DATE_KEY = 'locklab_live_props_date_v33';

(function purgeOldCaches() {
  for (let i = 1; i <= 32; i++) {
    localStorage.removeItem(`locklab_live_props_v${i}`);
    localStorage.removeItem(`locklab_live_props_date_v${i}`);
  }
})();

import { NBA_API } from './config';

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

export function getStoredApiKey() { return null; }
export function setStoredApiKey() {}

/**
 * Enrich a raw prop from the backend with display-ready fields.
 * No per-player API calls — analytics come from backend or are defaults.
 */
function enrichProp(prop, index) {
  const team = prop.player_team || prop.home || '';
  // Determine opponent: if player_team is known and differs from home, opponent is home; else away
  const opponent = (prop.player_team && prop.player_team !== prop.home) ? prop.home : prop.away;

  // Only use analytics values if they are real (not null) — never fake them with line value
  const hasRealAnalytics = prop.avg_last_10 != null && prop.hit_rate_last_10 != null;
  const avg_last_10 = prop.avg_last_10 ?? null;
  const avg_last_5  = prop.avg_last_5  ?? null;
  const hit_rate    = prop.hit_rate_last_10 ?? null;
  const projection  = prop.projection ?? null;
  const edge        = hasRealAnalytics ? (prop.edge ?? 0) : null;
  const confidence_score = hasRealAnalytics ? (prop.confidence_score ?? 5) : 5;

  const isHome = team === prop.home;

  return {
    ...prop,
    team,
    opponent,
    is_home: isHome,
    player_id: `live_${index}`,
    photo_url: null,
    position: prop.position || 'G',
    is_starter: true,
    injury_status: 'healthy',
    confidence_score,
    edge,
    avg_last_10,
    avg_last_5,
    hit_rate_last_10: hit_rate,
    projection,
    streak_info: prop.streak_info ?? null,
    last_10_games: prop.last_10_games ?? null,
    last_5_games:  prop.last_5_games  ?? null,
    game_logs_last_10: prop.game_logs_last_10 ?? null,
    minutes_avg: null,
    minutes_last_5: null,
    usage_rate: null,          // null = unknown, not hardcoded 25
    def_rank_vs_pos: null,
    matchup_rating: null,      // null = unknown, not hardcoded 'neutral'
    pace_rating: null,
    game_total: null,
    has_analytics: hasRealAnalytics,
    is_top_pick: hasRealAnalytics && confidence_score >= 8,
    is_lock: hasRealAnalytics && confidence_score === 10,
    best_value: hasRealAnalytics && (edge ?? 0) > 8,
    trap_warning: false,
    confidence_tier: hasRealAnalytics
      ? (confidence_score >= 8 ? 'A' : confidence_score >= 6 ? 'B' : 'C')
      : 'C',
  };
}

export async function fetchLiveProps() {
  if (isCacheValid()) {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch {}
  }

  const settings = await fetch(`${NBA_API}/api/settings`).then(r => r.json()).catch(() => ({}));
  const hasOddsKey = !!settings?.odds_api_key;
  const bookmakers = settings?.bookmakers || 'draftkings,fanduel,betmgm,caesars,pointsbetus';

  let oddsData;

  // Priority 1: Real sportsbook lines via The Odds API (requires key)
  if (hasOddsKey) {
    try {
      const res = await fetch(`${NBA_API}/api/odds/props?bookmakers=${encodeURIComponent(bookmakers)}`);
      if (res.ok) {
        oddsData = await res.json();
      }
    } catch {}
  }

  // Priority 2: Underdog Fantasy — free, no key, works from cloud servers
  if (!oddsData || !oddsData.rawProps?.length) {
    try {
      const res = await fetch(`${NBA_API}/api/underdog/props`);
      if (res.ok) {
        const ud = await res.json();
        if (ud.rawProps?.length) oddsData = ud;
      }
    } catch {}
  }

  // Priority 3: PrizePicks — free, no key (may be blocked from some servers)
  if (!oddsData || !oddsData.rawProps?.length) {
    try {
      const res = await fetch(`${NBA_API}/api/prizepicks/props`);
      if (res.ok) {
        const pp = await res.json();
        if (pp.rawProps?.length) oddsData = pp;
      }
    } catch {}
  }

  // Priority 4: Season-average projections from NBA.com (always available)
  if (!oddsData || !oddsData.rawProps?.length) {
    try {
      const res = await fetch(`${NBA_API}/api/live-props`);
      if (res.ok) oddsData = await res.json();
    } catch {}
  }

  if (!oddsData || !oddsData.rawProps?.length) {
    return { game_date: new Date().toLocaleDateString(), games_summary: [], props: [] };
  }

  const props = oddsData.rawProps.map((prop, i) => enrichProp(prop, i));

  const payload = {
    game_date: oddsData.game_date || new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    games_summary: oddsData.games_summary || [],
    props,
  };

  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  localStorage.setItem(CACHE_DATE_KEY, todayStr());
  return payload;
}

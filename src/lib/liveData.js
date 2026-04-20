const CACHE_KEY = 'locklab_live_props_v30';
const CACHE_DATE_KEY = 'locklab_live_props_date_v30';

(function purgeOldCaches() {
  for (let i = 1; i <= 29; i++) {
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
  const opponent = (prop.player_team && prop.player_team !== prop.home) ? prop.home : prop.away;
  const confidence_score = prop.confidence_score ?? 5;
  const edge = prop.edge ?? 0;

  return {
    ...prop,
    team,
    opponent,
    player_id: `live_${index}`,
    photo_url: null,
    position: 'G',
    is_starter: true,
    injury_status: 'healthy',
    confidence_score,
    edge,
    avg_last_10: prop.avg_last_10 ?? prop.line,
    avg_last_5:  prop.avg_last_5  ?? prop.line,
    hit_rate_last_10: prop.hit_rate_last_10 ?? 50,
    projection: prop.projection ?? prop.line,
    streak_info: prop.streak_info ?? null,
    last_10_games: prop.last_10_games ?? null,
    last_5_games:  prop.last_5_games  ?? null,
    game_logs_last_10: prop.game_logs_last_10 ?? null,
    minutes_avg: 30,
    minutes_last_5: null,
    usage_rate: 25,
    def_rank_vs_pos: 15,
    matchup_rating: 'neutral',
    pace_rating: 100,
    game_total: 220,
    is_top_pick: confidence_score >= 8,
    is_lock: confidence_score === 10,
    best_value: edge > 8,
    trap_warning: false,
    confidence_tier: confidence_score >= 8 ? 'A' : confidence_score >= 6 ? 'B' : 'C',
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

  // Priority 2: PrizePicks — free, no key, real live lines
  if (!oddsData || !oddsData.rawProps?.length) {
    try {
      const res = await fetch(`${NBA_API}/api/prizepicks/props`);
      if (res.ok) {
        const pp = await res.json();
        if (pp.rawProps?.length) oddsData = pp;
      }
    } catch {}
  }

  // Priority 3: Season-average projections from NBA.com (always available)
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

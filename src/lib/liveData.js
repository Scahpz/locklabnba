const CACHE_KEY = 'locklab_live_props_v34';
const CACHE_TS_KEY = 'locklab_live_props_ts_v34';
const FRESH_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours — stays valid across typical use gaps

(function purgeOldCaches() {
  for (let i = 1; i <= 33; i++) {
    localStorage.removeItem(`locklab_live_props_v${i}`);
    localStorage.removeItem(`locklab_live_props_date_v${i}`);
    localStorage.removeItem(`locklab_live_props_ts_v${i}`);
  }
})();

import { NBA_API } from './config';

export function isCacheValid() {
  const ts = Number(localStorage.getItem(CACHE_TS_KEY) || 0);
  return Date.now() - ts < FRESH_TTL_MS && !!localStorage.getItem(CACHE_KEY);
}

export function getCachedProps() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch { return null; }
}

export function clearLiveCache() {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TS_KEY);
}

export function getStoredApiKey() { return null; }
export function setStoredApiKey() {}

function fetchWithTimeout(url, opts, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

function enrichProp(prop, index) {
  const team = prop.player_team || prop.home || '';
  const opponent = (prop.player_team && prop.player_team !== prop.home) ? prop.home : prop.away;

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
    team, opponent, is_home: isHome,
    player_id: `live_${index}`,
    photo_url: null,
    position: prop.position || 'G',
    is_starter: true,
    injury_status: 'healthy',
    confidence_score, edge, avg_last_10, avg_last_5, hit_rate_last_10: hit_rate, projection,
    streak_info: prop.streak_info ?? null,
    last_10_games: prop.last_10_games ?? null,
    last_5_games:  prop.last_5_games  ?? null,
    game_logs_last_10: prop.game_logs_last_10 ?? null,
    minutes_avg: null, minutes_last_5: null, usage_rate: null,
    def_rank_vs_pos: null, matchup_rating: null, pace_rating: null, game_total: null,
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

// ── Line movement tracking ────────────────────────────────────────────────────
const LINE_PREV_KEY = 'locklab_prev_lines_v1';

export function getPrevLines() {
  try { return JSON.parse(sessionStorage.getItem(LINE_PREV_KEY) || '{}'); } catch { return {}; }
}

export function savePrevLines(props) {
  const map = {};
  props.forEach(p => {
    const k = `${p.player_name}__${p.prop_type}`;
    if (p.line != null) map[k] = p.line;
  });
  try { sessionStorage.setItem(LINE_PREV_KEY, JSON.stringify(map)); } catch {}
}

// ── In-flight promise deduplication ──────────────────────────────────────────
// Shared across all callers so a prefetch and Props.jsx share one network request.
let _fetchPromise = null;

async function _doFetch() {
  const defaultBookmakers = 'draftkings,fanduel,betmgm,caesars,pointsbetus';

  // Settings + underdog in parallel — underdog is the fastest reliable source
  const [settingsResult, underdogResult] = await Promise.allSettled([
    fetchWithTimeout(`${NBA_API}/api/settings`, {}, 5000).then(r => r.json()).catch(() => ({})),
    fetchWithTimeout(`${NBA_API}/api/underdog/props`, {}, 12000).then(r => r.ok ? r.json() : null).catch(() => null),
  ]);

  const settings = settingsResult.status === 'fulfilled' ? settingsResult.value : {};
  const hasOddsKey = !!settings?.odds_api_key;
  const bookmakers = settings?.bookmakers || defaultBookmakers;

  let oddsData = null;

  if (hasOddsKey) {
    oddsData = await fetchWithTimeout(
      `${NBA_API}/api/odds/props?bookmakers=${encodeURIComponent(bookmakers)}`, {}, 10000
    ).then(r => r.ok ? r.json() : null).catch(() => null);
  }

  if (!oddsData?.rawProps?.length) {
    const ud = underdogResult.status === 'fulfilled' ? underdogResult.value : null;
    if (ud?.rawProps?.length) oddsData = ud;
  }

  if (!oddsData?.rawProps?.length) {
    oddsData = await fetchWithTimeout(`${NBA_API}/api/prizepicks/props`, {}, 12000)
      .then(r => r.ok ? r.json() : null).catch(() => null);
  }

  if (!oddsData?.rawProps?.length) {
    oddsData = await fetchWithTimeout(`${NBA_API}/api/live-props`, {}, 12000)
      .then(r => r.ok ? r.json() : null).catch(() => null);
  }

  if (!oddsData?.rawProps?.length) {
    return { game_date: new Date().toLocaleDateString(), games_summary: [], props: [] };
  }

  const props = oddsData.rawProps.map((prop, i) => enrichProp(prop, i));
  const payload = {
    game_date: oddsData.game_date || new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    games_summary: oddsData.games_summary || [],
    props,
  };

  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
  return payload;
}

export async function fetchLiveProps() {
  if (isCacheValid()) return getCachedProps();
  // Reuse an already-running fetch — avoids duplicate network requests
  if (_fetchPromise) return _fetchPromise;
  _fetchPromise = _doFetch().finally(() => { _fetchPromise = null; });
  return _fetchPromise;
}

// ── Eager prefetch ────────────────────────────────────────────────────────────
// Kick off the network request the moment this module is imported —
// before any React component mounts — so Props.jsx "joins" an already-running fetch.
if (!isCacheValid()) {
  fetchLiveProps().catch(() => {});
}

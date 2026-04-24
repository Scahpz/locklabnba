import React, { useState, useMemo, useEffect, useRef } from 'react';
import { fetchLiveProps, clearLiveCache } from '@/lib/liveData';
import { getAIVerdicts } from '@/lib/aiVerdicts';
import LockCards from '@/components/props/LockCards';
import RankedPropCard from '@/components/props/RankedPropCard';
import DemonPickCard from '@/components/props/DemonPickCard';
import { RefreshCw, Wifi, WifiOff, Zap, SlidersHorizontal, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { rankScore } from '@/lib/grading';
import { NBA_API } from '@/lib/config';
import { TEAM_STATS } from '@/lib/teamStats';
import PropDetailModal from '@/components/props/PropDetailModal';

// ── Game-log localStorage cache ───────────────────────────────────────────────
const GL_CACHE_DATE_KEY = 'locklab_gl_date_v7';
const GL_CACHE_PREFIX   = 'locklab_gl_v7_';
const today = new Date().toISOString().split('T')[0];
// Wipe all older cache versions on load
for (let i = localStorage.length - 1; i >= 0; i--) {
  const k = localStorage.key(i);
  if (k && k.startsWith('locklab_gl_') && !k.startsWith('locklab_gl_v7_') && k !== 'locklab_gl_date_v7') {
    localStorage.removeItem(k);
  }
}
if (localStorage.getItem(GL_CACHE_DATE_KEY) !== today) {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k && k.startsWith(GL_CACHE_PREFIX)) localStorage.removeItem(k);
  }
  localStorage.setItem(GL_CACHE_DATE_KEY, today);
}
function glCacheGet(name) {
  try { return JSON.parse(localStorage.getItem(GL_CACHE_PREFIX + name)); } catch { return null; }
}
function glCacheSet(name, data) {
  try { localStorage.setItem(GL_CACHE_PREFIX + name, JSON.stringify(data)); } catch {}
}
async function fetchBulkGameLogs(names) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 90000); // 90s — bulk can be slow on first load
  try {
    const res = await fetch(`${NBA_API}/api/player-gamelogs-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerNames: names }),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
  finally { clearTimeout(timer); }
}

const propTypeLabels = {
  points: 'PTS', rebounds: 'REB', assists: 'AST', PRA: 'PRA',
  '3PM': '3PM', steals: 'STL', blocks: 'BLK', 'P+R': 'P+R', 'P+A': 'P+A', 'A+R': 'A+R',
};

const PROP_TYPES = ['all', 'points', 'rebounds', 'assists', 'P+R', 'P+A', 'A+R', 'PRA', '3PM', 'steals', 'blocks'];
const SORT_OPTIONS = [
  { value: 'ai_rank', label: 'AI Rank' },
  { value: 'confidence', label: 'Confidence' },
  { value: 'edge', label: 'Edge' },
  { value: 'hit_rate', label: 'Hit Rate' },
];

function fmtTipoff(scheduledAt) {
  if (!scheduledAt) return null;
  try {
    const d = new Date(scheduledAt);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  } catch { return null; }
}

function localDateStr(utcIso) {
  if (!utcIso) return null;
  return new Date(utcIso).toLocaleDateString('en-CA'); // YYYY-MM-DD in local tz
}

const todayLocalStr    = new Date().toLocaleDateString('en-CA');
const tomorrowLocalStr = new Date(Date.now() + 86400000).toLocaleDateString('en-CA');

export default function Props() {
  const [rawProps, setRawProps] = useState([]);
  const [gameDate, setGameDate] = useState(null);
  const [gamesSummary, setGamesSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [selectedGames, setSelectedGames] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('ai_rank');
  const [verdicts, setVerdicts] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [playerAnalytics, setPlayerAnalytics] = useState({});
  const [playerSearch, setPlayerSearch] = useState('');
  const [showPlayerDrop, setShowPlayerDrop] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [detailProp, setDetailProp] = useState(null);
  const [detailDemon, setDetailDemon] = useState(false);
  const searchRef = useRef(null);
  // Pre-seed with hardcoded stats so pace/defense show immediately
  const [teamContext, setTeamContext] = useState({ teams: TEAM_STATS, injuries: {}, back_to_back: [], game_spreads: {} });
  const fetchedPlayers = useRef(new Set());

  const loadData = async (forceRefresh = false) => {
    setLoading(true);
    if (forceRefresh) {
      setPlayerAnalytics({});
      setTeamContext({ teams: TEAM_STATS, injuries: {}, back_to_back: [], game_spreads: {} });
      fetchedPlayers.current = new Set();
    }
    try {
      const data = await fetchLiveProps();
      if (data?.props?.length > 0) {
        const realProps = data.props.filter(p => p.injury_status !== 'out');
        setRawProps(realProps);
        setGameDate(data.game_date);
        setGamesSummary(data.games_summary || []);
        setIsLive(true);

        setAiLoading(true);
        getAIVerdicts(realProps.slice(0, 50)).then(v => {
          setVerdicts(v);
          setAiLoading(false);
        }).catch(() => setAiLoading(false));
      } else {
        setRawProps([]);
      }
    } catch {
      setRawProps([]);
    }
    setLoading(false);
  };

  // Fetch live team context (injuries, back-to-back, spreads) — merges on top of hardcoded stats
  useEffect(() => {
    if (!rawProps.length) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    fetch(`${NBA_API}/api/team-context`, { signal: ctrl.signal })
      .then(r => r.ok ? r.json() : null)
      .then(ctx => {
        if (!ctx) return;
        setTeamContext(prev => ({
          teams:        { ...TEAM_STATS, ...ctx.teams },   // live data wins, fallback fills gaps
          injuries:     ctx.injuries    || {},
          back_to_back: ctx.back_to_back || [],
          game_spreads: ctx.game_spreads || {},
        }));
      })
      .catch(() => {})
      .finally(() => clearTimeout(timer));
    return () => ctrl.abort();
  }, [rawProps.length]);

  // Auto-fetch game logs for all players in one bulk request
  useEffect(() => {
    if (!rawProps.length) return;
    const names = [...new Set(rawProps.map(p => p.player_name))];
    const pending = names.filter(n => !fetchedPlayers.current.has(n));
    if (!pending.length) return;

    // Apply cached data immediately
    const withCache = pending.filter(n => glCacheGet(n));
    if (withCache.length) {
      const updates = {};
      withCache.forEach(n => { updates[n] = glCacheGet(n).analytics; fetchedPlayers.current.add(n); });
      setPlayerAnalytics(prev => ({ ...prev, ...updates }));
    }

    const needsFetch = pending.filter(n => !glCacheGet(n));
    if (!needsFetch.length) return;
    needsFetch.forEach(n => fetchedPlayers.current.add(n));

    // One bulk request for all uncached players
    fetchBulkGameLogs(needsFetch).then(data => {
      if (!data?.analytics) return;
      const updates = {};
      Object.entries(data.analytics).forEach(([name, analytics]) => {
        if (analytics && Object.keys(analytics).length > 0) {
          updates[name] = analytics;
          glCacheSet(name, { analytics });
        }
      });
      if (Object.keys(updates).length > 0) {
        setPlayerAnalytics(prev => ({ ...prev, ...updates }));
      }
    });
  }, [rawProps]);

  // Merge game logs + team context + injury data into each prop
  const enrichedProps = useMemo(() => {
    const ctx = teamContext || {};
    const teams     = ctx.teams      || {};
    const injuries  = ctx.injuries   || {};
    const b2b       = new Set(ctx.back_to_back || []);
    const spreads   = ctx.game_spreads || {};

    return rawProps.map(prop => {
      // 1. Game log analytics
      const analytics = playerAnalytics[prop.player_name]?.[prop.prop_type];
      const cs = analytics?.confidence_score || prop.confidence_score || 5;
      const base = analytics ? {
        ...prop,
        has_analytics: true,
        avg_last_5:        analytics.avg_last_5,
        avg_last_10:       analytics.avg_last_10,
        hit_rate_last_10:  analytics.hit_rate_last_10,
        projection:        analytics.projection,
        edge:              analytics.edge,
        confidence_score:  cs,
        season_avg:        analytics.season_avg,
        season_games:      analytics.season_games,
        season_hit_rate:   analytics.season_hit_rate,
        streak_info:       analytics.streak_info,
        last_10_games:     analytics.last_10_games,
        last_5_games:      analytics.last_5_games,
        game_logs_last_10: analytics.game_logs_last_10,
        confidence_tier:   cs >= 8 ? 'A' : cs >= 6 ? 'B' : 'C',
        is_lock:           cs === 10,
        best_value:        (analytics.edge || 0) > 8,
      } : prop;

      // 2. Team context
      const team    = prop.player_team || '';
      const opp     = prop.opponent    || '';
      const oppData = teams[opp]  || {};
      const tmData  = teams[team] || {};
      const isHome  = team === prop.home;
      const gameId  = `${prop.away || ''}@${prop.home || ''}`;
      const homeSpread = spreads[gameId];
      const playerSpread = homeSpread != null
        ? (isHome ? homeSpread : -homeSpread)
        : null;

      // Map player position to G/F/C category for position-specific def rating
      const rawPos = (prop.position || base.position || '').toUpperCase();
      const posCategory = rawPos === 'C' ? 'C'
        : (rawPos === 'PG' || rawPos === 'SG' || rawPos === 'G') ? 'G'
        : 'F'; // SF, PF, F, or unknown default to F
      const posDefRating = oppData.pos_def?.[posCategory] ?? oppData.def_rating ?? null;

      // 3. Injury context — find injured teammates (same team, not the player themselves)
      const injuredTeammates = Object.entries(injuries)
        .filter(([name, info]) => info.team === team && name !== prop.player_name)
        .map(([name]) => name);
      const injuryContext = injuredTeammates.length > 0
        ? injuredTeammates.slice(0, 2).join(', ') + (injuredTeammates.length > 2 ? ` +${injuredTeammates.length - 2} more` : '') + ' (Out)'
        : null;

      return {
        ...base,
        opponent_def_rating:  oppData.def_rating   ?? null,
        pos_def_rating:       posDefRating,
        pos_category:         posCategory,
        opponent_pace:        oppData.pace          ?? null,
        player_team_pace:     tmData.pace           ?? null,
        is_home:              isHome,
        is_back_to_back:      b2b.has(team),
        spread:               playerSpread,
        injury_context:       injuryContext,
      };
    });
  }, [rawProps, playerAnalytics, teamContext]);

  useEffect(() => { loadData(); }, []);

  const toggleGame = (g) => {
    const key = `${(g.away || '').toUpperCase()}@${(g.home || '').toUpperCase()}`;
    setSelectedGames(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const sortedGames = useMemo(() => {
    return [...gamesSummary].sort((a, b) => {
      const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity;
      const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity;
      return ta - tb;
    });
  }, [gamesSummary]);

  // Split sorted games into today / tomorrow for the filter UI.
  // Games 2+ days out are intentionally excluded from both buckets so they
  // never bleed into Locks / Demon Pick (which must be today-only).
  const { todayGames, tomorrowGames, hasBeyondTomorrow } = useMemo(() => {
    const today = [], tomorrow = [];
    let hasBeyond = false;
    sortedGames.forEach(g => {
      const d = localDateStr(g.scheduled_at);
      if (!d || d === todayLocalStr)   today.push(g);
      else if (d === tomorrowLocalStr) tomorrow.push(g);
      else hasBeyond = true; // 2+ days out — drop from both buckets
    });
    return { todayGames: today, tomorrowGames: tomorrow, hasBeyondTomorrow: hasBeyond };
  }, [sortedGames]);

  // Team abbreviations playing TODAY only.
  // Returns null when there are no non-today games loaded (no filtering needed).
  const todayTeams = useMemo(() => {
    const s = new Set();
    // Nothing non-today → all loaded props are today's, no need to filter
    if (tomorrowGames.length === 0 && !hasBeyondTomorrow) return null;
    todayGames.forEach(g => {
      if (g.away) s.add(g.away.toUpperCase());
      if (g.home) s.add(g.home.toUpperCase());
    });
    return s;
  }, [todayGames, tomorrowGames, hasBeyondTomorrow]);

  const isTodayProp = (p) => {
    if (!todayTeams) return true; // no tomorrow split → all are today
    const team = (p.team || p.player_team || '').toUpperCase();
    return todayTeams.has(team);
  };

  // Picks of the day: top 2 ranked picks with 100% grade confidence — TODAY only
  const locks = useMemo(() => {
    const gradeConfidence = (p) => {
      if (!p.has_analytics) return 0;
      return [
        p.avg_last_10 != null && p.avg_last_10 > p.line,
        p.avg_last_5  != null && p.avg_last_5  > p.line,
        p.hit_rate_last_10 != null && p.hit_rate_last_10 >= 60,
        p.projection  != null && p.projection  > p.line,
        p.edge        != null && p.edge > 0,
      ].filter(Boolean).length * 20;
    };

    return [...enrichedProps]
      .filter(p => gradeConfidence(p) === 100 && isTodayProp(p))
      .sort((a, b) => rankScore(b) - rankScore(a))
      .slice(0, 2);
  }, [enrichedProps, todayTeams]);

  // Demon Pick: player on a hot over-streak projected to explode well above their line tonight
  const demonPick = useMemo(() => {
    const candidates = enrichedProps
      .filter(p => p.has_analytics && isTodayProp(p) && p.avg_last_10 != null)
      .filter(p => {
        // Must be on an over-streak of 3+ games
        const overMatch = (p.streak_info || '').match(/^(\d+) game over streak/i);
        if (!overMatch) return false;
        if (parseInt(overMatch[1], 10) < 3) return false;
        // L10 avg must be at least 8% above the line — genuinely outperforming
        return p.avg_last_10 >= p.line * 1.08;
      })
      .map(p => {
        const streakLen = parseInt(p.streak_info.match(/^(\d+)/)[1], 10);
        // Boom line: use best of L5/L10, nudge up 10%, round to nearest 0.5
        const bestAvg = Math.max(p.avg_last_5 ?? p.avg_last_10, p.avg_last_10);
        const boomLine = Math.round(bestAvg * 1.1 * 2) / 2;
        const gap = +(p.avg_last_10 - p.line).toFixed(1);
        const boomScore = Math.min(99, Math.round(50 + streakLen * 7 + (gap / p.line) * 60));
        const label = (propTypeLabels[p.prop_type] || p.prop_type).toUpperCase();

        let reason = `${p.player_name} is averaging ${p.avg_last_10} ${label} over the last 10 games — ${gap} above the ${p.line} line.`;
        if (streakLen >= 6) {
          reason += ` On a ${streakLen}-game over streak — the hottest player at this line right now.`;
        } else {
          reason += ` Has cleared this line ${streakLen} straight with no signs of slowing down.`;
        }
        if (p.avg_last_5 != null && p.avg_last_5 > p.avg_last_10) {
          reason += ` L5 avg of ${p.avg_last_5} is trending even higher.`;
        }
        if (p.hit_rate_last_10 != null && p.hit_rate_last_10 >= 80) {
          reason += ` ${p.hit_rate_last_10}% hit rate over last 10 — elite consistency.`;
        }
        reason += ` Projecting a ${boomLine}+ ${label} explosion tonight vs ${p.opponent}.`;

        return { prop: p, streakGames: streakLen, seasonAvg: p.season_avg, boomLine, boomScore, reason };
      })
      .sort((a, b) => b.boomScore - a.boomScore);

    return candidates[0] || null;
  }, [enrichedProps, todayTeams]);

  // Unique player names for search suggestions
  const allPlayerNames = useMemo(() => {
    const seen = new Set();
    return enrichedProps
      .map(p => p.player_name)
      .filter(n => { if (seen.has(n)) return false; seen.add(n); return true; })
      .sort();
  }, [enrichedProps]);

  const playerSuggestions = useMemo(() => {
    if (!playerSearch.trim()) return [];
    const q = playerSearch.toLowerCase();
    return allPlayerNames.filter(n => n.toLowerCase().includes(q)).slice(0, 8);
  }, [playerSearch, allPlayerNames]);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowPlayerDrop(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const filteredAndRanked = useMemo(() => {
    let result = enrichedProps;

    if (selectedPlayer) {
      result = result.filter(p => p.player_name === selectedPlayer);
    }

    if (selectedGames.length > 0) {
      result = result.filter(p => {
        const pTeam = (p.team || '').toUpperCase();
        const pOpp = (p.opponent || '').toUpperCase();
        return selectedGames.some(key => {
          const [away, home] = key.split('@');
          return (pTeam === away || pTeam === home) && (pOpp === away || pOpp === home);
        });
      });
    }

    if (selectedType !== 'all') {
      result = result.filter(p => p.prop_type === selectedType);
    }

    result = [...result].sort((a, b) => {
      if (sortBy === 'ai_rank') return rankScore(b) - rankScore(a);
      if (sortBy === 'confidence') return (b.confidence_score || 0) - (a.confidence_score || 0);
      if (sortBy === 'edge') return (b.edge || 0) - (a.edge || 0);
      if (sortBy === 'hit_rate') return (b.hit_rate_last_10 || 0) - (a.hit_rate_last_10 || 0);
      return 0;
    });

    return result;
  }, [enrichedProps, selectedGames, selectedType, sortBy, selectedPlayer]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Fetching today's props…</span>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Zap className="w-7 h-7 text-primary" />
            Props
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            {isLive ? (
              <><Wifi className="w-3.5 h-3.5 text-primary" /><span className="text-primary font-medium">Live</span>{gameDate && <span className="text-muted-foreground">· {gameDate}</span>}</>
            ) : (
              <><WifiOff className="w-3.5 h-3.5" />No live data available</>
            )}
            {aiLoading && <span className="text-muted-foreground flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" />AI analyzing…</span>}
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-foreground bg-secondary hover:bg-secondary/80 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Player search */}
      <div className="relative" ref={searchRef}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search player…"
          value={selectedPlayer ? selectedPlayer : playerSearch}
          onChange={e => { setPlayerSearch(e.target.value); setSelectedPlayer(null); setShowPlayerDrop(true); }}
          onFocus={() => setShowPlayerDrop(true)}
          className="w-full sm:w-72 pl-9 pr-8 py-2 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {(selectedPlayer || playerSearch) && (
          <button
            onClick={() => { setSelectedPlayer(null); setPlayerSearch(''); setShowPlayerDrop(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {showPlayerDrop && playerSuggestions.length > 0 && (
          <div className="absolute top-full mt-1 w-full sm:w-72 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
            {playerSuggestions.map(name => {
              const p = enrichedProps.find(ep => ep.player_name === name);
              const propCount = enrichedProps.filter(ep => ep.player_name === name).length;
              return (
                <button
                  key={name}
                  onClick={() => { setSelectedPlayer(name); setPlayerSearch(''); setShowPlayerDrop(false); }}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-secondary transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{name}</p>
                    <p className="text-[10px] text-muted-foreground">{p?.team} · {p?.position}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{propCount} prop{propCount !== 1 ? 's' : ''}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Game filter — split by Today / Tomorrow */}
      {sortedGames.length > 0 && (
        <div className="space-y-2">
          {/* Today's games */}
          {todayGames.length > 0 && (
            <div>
              {tomorrowGames.length > 0 && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Today</p>
              )}
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap scrollbar-none">
                {todayGames.map((g, i) => {
                  const key = `${(g.away || '').toUpperCase()}@${(g.home || '').toUpperCase()}`;
                  const active = selectedGames.includes(key);
                  const tipoff = fmtTipoff(g.scheduled_at) || g.tipoff;
                  return (
                    <button key={i} onClick={() => toggleGame(g)}
                      className={cn(
                        "flex items-center gap-2 border rounded-lg px-3 py-2 text-xs transition-all flex-shrink-0 whitespace-nowrap",
                        active ? "bg-primary/15 border-primary/50 text-foreground" : "bg-secondary/60 border-border text-foreground hover:border-primary/30"
                      )}
                    >
                      <span className="font-bold">{g.away} @ {g.home}</span>
                      {tipoff && <span className="text-muted-foreground">{tipoff}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tomorrow's games */}
          {tomorrowGames.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Tomorrow</p>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap scrollbar-none">
                {tomorrowGames.map((g, i) => {
                  const key = `${(g.away || '').toUpperCase()}@${(g.home || '').toUpperCase()}`;
                  const active = selectedGames.includes(key);
                  const tipoff = fmtTipoff(g.scheduled_at) || g.tipoff;
                  return (
                    <button key={i} onClick={() => toggleGame(g)}
                      className={cn(
                        "flex items-center gap-2 border rounded-lg px-3 py-2 text-xs transition-all flex-shrink-0 whitespace-nowrap",
                        active ? "bg-primary/15 border-primary/50 text-foreground" : "bg-secondary/60 border-border text-foreground hover:border-primary/30"
                      )}
                    >
                      <span className="font-bold">{g.away} @ {g.home}</span>
                      {tipoff && <span className="text-muted-foreground">{tipoff}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedGames.length > 0 && (
            <button onClick={() => setSelectedGames([])} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {enrichedProps.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-lg font-medium">No props available today</p>
          <p className="text-sm mt-1">Check back closer to game time once props are posted.</p>
        </div>
      )}

      {enrichedProps.length > 0 && (
        <>
          {/* Locks of the Day */}
          <LockCards locks={locks} verdicts={verdicts} aiLoading={aiLoading} />

          {/* Demon Pick */}
          {demonPick && (
            <DemonPickCard
              pick={demonPick}
              onOpenDetail={() => setDetailDemon(true)}
            />
          )}

          {/* Filters */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-1.5 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap pb-1 scrollbar-none">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 self-center" />
              {PROP_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={cn(
                    "text-xs px-3 py-2 rounded-lg border transition-all flex-shrink-0 whitespace-nowrap",
                    selectedType === t
                      ? "bg-primary/20 border-primary/40 text-primary font-medium"
                      : "bg-secondary/60 border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t === 'all' ? 'All Props' : t.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="text-xs bg-secondary border border-border text-foreground rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Ranked props list */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs text-muted-foreground">{filteredAndRanked.length} props · ranked by {SORT_OPTIONS.find(o => o.value === sortBy)?.label}</p>
              {selectedPlayer && (
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="flex items-center gap-1 text-xs bg-primary/15 border border-primary/30 text-primary px-2 py-0.5 rounded-full hover:bg-primary/25 transition-colors"
                >
                  {selectedPlayer} <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndRanked.map((prop, i) => {
                const key = `${prop.player_name}__${prop.prop_type}__${prop.line}`;
                return (
                  <RankedPropCard
                    key={key}
                    prop={prop}
                    rank={i + 1}
                    aiVerdict={verdicts[key]}
                    aiLoading={aiLoading}
                    onOpenDetail={() => setDetailProp(prop)}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>

    {/* Prop detail modal */}
    {detailProp && (
      <PropDetailModal prop={detailProp} onClose={() => setDetailProp(null)} />
    )}
    {detailDemon && demonPick && (
      <PropDetailModal prop={demonPick.prop} onClose={() => setDetailDemon(false)} />
    )}
    </>
  );
}
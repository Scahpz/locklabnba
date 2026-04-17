import React, { useState, useMemo, useEffect } from 'react';
import { fetchLiveProps, clearLiveCache } from '@/lib/liveData';
import { getAIVerdicts } from '@/lib/aiVerdicts';
import LockCards from '@/components/props/LockCards';
import RankedPropCard from '@/components/props/RankedPropCard';
import { RefreshCw, Wifi, WifiOff, Zap, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const PROP_TYPES = ['all', 'points', 'rebounds', 'assists', 'PRA', '3PM', 'steals', 'blocks'];
const SORT_OPTIONS = [
  { value: 'ai_rank', label: 'AI Rank' },
  { value: 'confidence', label: 'Confidence' },
  { value: 'edge', label: 'Edge' },
  { value: 'hit_rate', label: 'Hit Rate' },
];

/**
 * Composite rank score: weights confidence, hit rate, edge, and AI confidence together.
 */
function compositeScore(prop, verdict) {
  const confScore = (prop.confidence_score || 0) * 8;
  const hitScore = (prop.hit_rate_last_10 || 0) * 0.4;
  const edgeScore = Math.min(Math.max(prop.edge || 0, -20), 20) * 1.5;
  const aiBoost = verdict && verdict.verdict !== 'UNSAFE' ? (verdict.ai_confidence || 0) * 0.3 : 0;
  return confScore + hitScore + edgeScore + aiBoost;
}

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

  const loadData = async (forceRefresh = false) => {
    setLoading(true);
    // Don't clear cache on refresh — keep rankings consistent throughout the day
    try {
      const data = await fetchLiveProps();
      if (data?.props?.length > 0) {
        const realProps = data.props.filter(p => p.injury_status !== 'out');
        setRawProps(realProps);
        setGameDate(data.game_date);
        setGamesSummary(data.games_summary || []);
        setIsLive(true);

        // Kick off AI verdicts in background
        setAiLoading(true);
        getAIVerdicts(realProps).then(v => {
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

  useEffect(() => { loadData(); }, []);

  const toggleGame = (g) => {
    const key = `${(g.away || '').toUpperCase()}@${(g.home || '').toUpperCase()}`;
    setSelectedGames(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  // Locks of the day: top 1-2 props with AI confidence >= 90% and real stats
  const locks = useMemo(() => {
    return rawProps
      .filter(p => {
        const aiConfidence = verdicts[`${p.player_name}__${p.prop_type}__${p.line}`]?.ai_confidence || 0;
        return aiConfidence >= 90;
      })
      .sort((a, b) => {
        const aAI = verdicts[`${a.player_name}__${a.prop_type}__${a.line}`]?.ai_confidence || 0;
        const bAI = verdicts[`${b.player_name}__${b.prop_type}__${b.line}`]?.ai_confidence || 0;
        return bAI - aAI;
      })
      .slice(0, 2);
  }, [rawProps, verdicts]);

  const filteredAndRanked = useMemo(() => {
    let result = rawProps;

    // Game filter
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

    // Prop type filter
    if (selectedType !== 'all') {
      result = result.filter(p => p.prop_type === selectedType);
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'ai_rank') {
        const ka = `${a.player_name}__${a.prop_type}__${a.line}`;
        const kb = `${b.player_name}__${b.prop_type}__${b.line}`;
        return compositeScore(b, verdicts[kb]) - compositeScore(a, verdicts[ka]);
      }
      if (sortBy === 'confidence') return b.confidence_score - a.confidence_score;
      if (sortBy === 'edge') return b.edge - a.edge;
      if (sortBy === 'hit_rate') return b.hit_rate_last_10 - a.hit_rate_last_10;
      return 0;
    });

    return result;
  }, [rawProps, selectedGames, selectedType, sortBy, verdicts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Fetching today's props…</span>
      </div>
    );
  }

  return (
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

      {/* Game filter */}
      {gamesSummary.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {gamesSummary.map((g, i) => {
            const key = `${(g.away || '').toUpperCase()}@${(g.home || '').toUpperCase()}`;
            const active = selectedGames.includes(key);
            return (
              <button
                key={i}
                onClick={() => toggleGame(g)}
                className={cn(
                  "flex items-center gap-2 border rounded-lg px-3 py-1.5 text-xs transition-all",
                  active ? "bg-primary/15 border-primary/50 text-foreground" : "bg-secondary/60 border-border text-foreground hover:border-primary/30"
                )}
              >
                <span className="font-bold">{g.away} @ {g.home}</span>
                {g.tipoff && <span className="text-muted-foreground">{g.tipoff}</span>}
              </button>
            );
          })}
          {selectedGames.length > 0 && (
            <button onClick={() => setSelectedGames([])} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 transition-colors">
              Clear
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {rawProps.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-lg font-medium">No props available today</p>
          <p className="text-sm mt-1">Check back closer to game time once props are posted.</p>
        </div>
      )}

      {rawProps.length > 0 && (
        <>
          {/* Locks of the Day */}
          <LockCards locks={locks} verdicts={verdicts} aiLoading={aiLoading} />

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-1.5 flex-wrap">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              {PROP_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-lg border transition-all capitalize",
                    selectedType === t
                      ? "bg-primary/20 border-primary/40 text-primary font-medium"
                      : "bg-secondary/60 border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t === 'all' ? 'All Props' : t.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
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
            <p className="text-xs text-muted-foreground mb-3">{filteredAndRanked.length} props · ranked by {SORT_OPTIONS.find(o => o.value === sortBy)?.label}</p>
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
                  />
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
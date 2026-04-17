import React, { useState, useEffect, useCallback } from 'react';
import { fetchGameOdds } from '@/lib/oddsData';
import { getStoredApiKey } from '@/lib/liveData';
import GameOddsCard from '@/components/odds/GameOddsCard';
import ApiKeyPrompt from '@/components/dashboard/ApiKeyPrompt';
import { RefreshCw, Activity, Clock, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export default function LiveOdds() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [needsApiKey, setNeedsApiKey] = useState(!getStoredApiKey());
  const [filter, setFilter] = useState('all'); // 'all' | 'today' | 'upcoming'
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS / 1000);

  const load = useCallback(async () => {
    if (!getStoredApiKey()) { setNeedsApiKey(true); return; }
    setLoading(true);
    setError(null);
    setCountdown(REFRESH_INTERVAL_MS / 1000);
    try {
      const result = await fetchGameOdds();
      if (result.needsApiKey) { setNeedsApiKey(true); return; }
      setGames(result.games || []);
      setLastUpdated(result.lastUpdated);
      setNeedsApiKey(false);
    } catch (e) {
      setError(e.message || 'Failed to fetch odds');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (needsApiKey) return;
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load, needsApiKey]);

  // Countdown ticker
  useEffect(() => {
    if (needsApiKey || loading) return;
    const tick = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(tick);
  }, [loading, needsApiKey]);

  const today = new Date().toLocaleDateString();
  const filtered = games.filter(g => {
    const gDate = new Date(g.commence_time).toLocaleDateString();
    if (filter === 'today') return gDate === today;
    if (filter === 'upcoming') return gDate !== today;
    return true;
  });

  const todayCount = games.filter(g => new Date(g.commence_time).toLocaleDateString() === today).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-7 h-7 text-primary" />
            Live NBA Odds
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Moneyline · Spread · Totals — updated every 5 min
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && !needsApiKey && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Next refresh in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</span>
            </div>
          )}
          <button
            onClick={load}
            disabled={loading || needsApiKey}
            className={cn(
              "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all border border-border",
              loading ? "text-muted-foreground bg-secondary/50" : "text-foreground bg-secondary hover:bg-secondary/80"
            )}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* API Key Prompt */}
      {needsApiKey && (
        <ApiKeyPrompt onKeySet={() => { setNeedsApiKey(false); load(); }} />
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Filter tabs */}
      {!needsApiKey && games.length > 0 && (
        <div className="flex items-center gap-1.5">
          {[
            { key: 'all', label: `All Games (${games.length})` },
            { key: 'today', label: `Today (${todayCount})` },
            { key: 'upcoming', label: `Upcoming (${games.length - todayCount})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                filter === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Games grid */}
      {!needsApiKey && !loading && filtered.length === 0 && !error && (
        <div className="text-center py-16 text-muted-foreground">
          <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No games found for this filter.</p>
        </div>
      )}

      {loading && games.length === 0 && (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card h-52 animate-pulse" />
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(game => (
            <GameOddsCard key={game.id} game={game} />
          ))}
        </div>
      )}

      {lastUpdated && !needsApiKey && (
        <p className="text-center text-[11px] text-muted-foreground">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
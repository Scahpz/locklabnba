import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLivePlayers } from '@/lib/useLivePlayers';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Target, Activity, Zap, Search, Flame, X, Wifi, WifiOff } from 'lucide-react';
import PlayerTrendChart from '@/components/trends/PlayerTrendChart';
import MinutesTrendChart from '@/components/trends/MinutesTrendChart';
import HotStreakCard from '@/components/trends/HotStreakCard';
import { cn } from '@/lib/utils';
import TeamLogo from '@/components/common/TeamLogo';

function getHotStreakPlayers(players) {
  const hot = [];
  players.forEach(player => {
    player.props.forEach(prop => {
      const hits = prop.last_10_games?.filter(v => v > prop.line).length || 0;
      if (hits >= 7) hot.push({ player, prop, hits });
    });
  });
  return hot.sort((a, b) => b.hits - a.hits).slice(0, 12);
}

const labelMap = { points: 'PPG', rebounds: 'RPG', assists: 'APG', '3PM': '3PM', steals: 'SPG', blocks: 'BPG', PRA: 'PRA' };
const iconMap = { points: TrendingUp, rebounds: Activity, assists: Target, '3PM': Zap, steals: Clock, blocks: Clock, PRA: TrendingUp };
const colorMap = { points: 'text-primary', rebounds: 'text-accent', assists: 'text-chart-3', '3PM': 'text-chart-4', steals: 'text-chart-3', blocks: 'text-destructive', PRA: 'text-primary' };

export default function Trends() {
  const urlParams = new URLSearchParams(window.location.search);
  const playerParam = urlParams.get('player');

  const { players, isLive, loading } = useLivePlayers();

  const [selectedPlayer, setSelectedPlayer] = useState(playerParam || null);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  // Once players load, set default selection
  const defaultPlayerName = players[0]?.player_name;
  const resolvedSelected = selectedPlayer || defaultPlayerName;

  const hotPlayers = useMemo(() => getHotStreakPlayers(players), [players]);

  const player = useMemo(() =>
    players.find(p => p.player_name === resolvedSelected) || players[0],
    [players, resolvedSelected]
  );

  // Build game log labels from real opponent data per-prop
  function buildGameLogs(prop) {
    if (prop?.game_logs_last_10?.length > 0) {
      return prop.game_logs_last_10.map(g => ({
        date: g.isHome ? 'vs' : '@',
        opp: g.opp,
      }));
    }
    // Fallback: no opponent data available
    return (prop?.last_10_games || []).map((_, i) => ({
      date: '',
      opp: `G${i + 1}`,
    }));
  }

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return players.filter(p =>
      p.player_name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [search, players]);

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function selectPlayer(name) {
    setSelectedPlayer(name);
    setSearch('');
    setShowDropdown(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!loading && players.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Flame className="w-7 h-7 text-orange-400" />
            Streaks & Trends
          </h1>
        </div>
        <div className="text-center py-20 text-muted-foreground">
          <Flame className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-lg font-medium">No player data available today</p>
          <p className="text-sm mt-1">Trends will appear here once live props are available. Check back closer to game time.</p>
        </div>
      </div>
    );
  }

  if (!player) return null;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Flame className="w-7 h-7 text-orange-400" />
            Streaks & Trends
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            {isLive
              ? <><Wifi className="w-3.5 h-3.5 text-primary" /><span className="text-primary font-medium">Live — today's players</span></>
              : <><WifiOff className="w-3.5 h-3.5" />Hot streaks, recent form & performance analysis</>
            }
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search any player or team…"
            value={search}
            onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button onClick={() => { setSearch(''); setShowDropdown(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden">
              {searchResults.map(p => (
                <button
                  key={p.id}
                  onClick={() => selectPlayer(p.player_name)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition-colors text-left"
                >
                  <TeamLogo team={p.team} className="w-7 h-7" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.player_name}</p>
                    <p className="text-[10px] text-muted-foreground">{p.team} · {p.position}</p>
                  </div>
                  {p.injury_status && p.injury_status !== 'healthy' && (
                    <Badge variant="outline" className="ml-auto text-[10px] border-destructive/30 text-destructive">
                      {p.injury_status?.toUpperCase()}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hot Streak Players */}
      {hotPlayers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">On Fire — Hot Streaks</h2>
            <span className="text-xs text-muted-foreground">(7+ hits in last 10)</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {hotPlayers.map(({ player: hp, prop }) => (
              <HotStreakCard
                key={`${hp.id}-${prop.prop_type}`}
                player={hp}
                prop={prop}
                isSelected={resolvedSelected === hp.player_name}
                onClick={() => selectPlayer(hp.player_name)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Player Header */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-4 mb-4">
          <TeamLogo team={player.team} className="w-16 h-16" bgClass="bg-secondary border-2 border-border" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground">{player.player_name}</h2>
            <p className="text-sm text-muted-foreground">
              {player.team} · {player.position} · {player.is_starter ? 'Starter' : 'Bench'}
            </p>
            {player.injury_status && player.injury_status !== 'healthy' && (
              <Badge variant="outline" className="mt-1 border-destructive/30 text-destructive text-xs">
                {player.injury_status.toUpperCase()} {player.injury_note && `— ${player.injury_note}`}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(() => {
            const statsToShow = [
              { key: 'minutes', label: 'MIN', value: player.props[0]?.minutes_avg || 0, icon: Clock, color: 'text-chart-3' },
              ...player.props.slice(0, 3).map(prop => {
                const Icon = iconMap[prop.prop_type] || TrendingUp;
                return { key: prop.prop_type, label: labelMap[prop.prop_type] || prop.prop_type.toUpperCase(), value: prop.avg_last_10 || prop.line || 0, icon: Icon, color: colorMap[prop.prop_type] || 'text-primary' };
              })
            ].slice(0, 4);
            return statsToShow.map(stat => (
              <div key={stat.key} className="bg-secondary/50 rounded-lg p-3 text-center">
                <stat.icon className={`w-4 h-4 mx-auto ${stat.color} mb-1`} />
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{stat.label}</p>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Prop Charts */}
      <div className="space-y-4">
        {player.props.map((prop, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-foreground uppercase">{prop.prop_type}</h3>
                <Badge variant="outline" className="border-border text-xs">Line: {prop.line}</Badge>
              </div>
              {prop.streak_info && (
                <span className="text-xs text-primary font-medium flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {prop.streak_info}
                </span>
              )}
            </div>

            <PlayerTrendChart
              games={prop.last_10_games || []}
              line={prop.line}
              propType={prop.prop_type}
              gameLogs={buildGameLogs(prop)}
            />

            <div className="grid grid-cols-4 gap-3 mt-4">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Avg L5</p>
                <p className={cn("text-sm font-bold", prop.avg_last_5 > prop.line ? 'text-primary' : 'text-destructive')}>{prop.avg_last_5}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Avg L10</p>
                <p className={cn("text-sm font-bold", prop.avg_last_10 > prop.line ? 'text-primary' : 'text-destructive')}>{prop.avg_last_10}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Hit Rate</p>
                <p className="text-sm font-bold text-foreground">{prop.hit_rate_last_10}%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Edge</p>
                <p className={cn("text-sm font-bold", prop.edge > 0 ? 'text-primary' : 'text-destructive')}>
                  {prop.edge > 0 ? '+' : ''}{prop.edge}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Minutes Trend */}
      {player.props[0]?.minutes_last_5 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-lg font-bold text-foreground mb-4">Minutes Trend (Last 5)</h3>
          <MinutesTrendChart minutes={player.props[0].minutes_last_5} />
        </div>
      )}
    </div>
  );
}
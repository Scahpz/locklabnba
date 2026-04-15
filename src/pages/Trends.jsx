import React, { useState, useMemo } from 'react';
import { mockPlayers, mockGameLogs } from '@/lib/mockData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Target, Activity, Zap } from 'lucide-react';
import PlayerTrendChart from '@/components/trends/PlayerTrendChart';
import MinutesTrendChart from '@/components/trends/MinutesTrendChart';
import { cn } from '@/lib/utils';
import TeamLogo from '@/components/common/TeamLogo';

export default function Trends() {
  const urlParams = new URLSearchParams(window.location.search);
  const playerParam = urlParams.get('player');
  
  const [selectedPlayer, setSelectedPlayer] = useState(
    playerParam || mockPlayers[0].player_name
  );

  const player = useMemo(() => 
    mockPlayers.find(p => p.player_name === selectedPlayer) || mockPlayers[0],
    [selectedPlayer]
  );

  const gameLogs = useMemo(() => {
    const found = mockPlayers.find(p => p.player_name === (player?.player_name));
    return found ? (mockGameLogs[found.id] || []) : [];
  }, [player]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Streaks & Trends</h1>
          <p className="text-sm text-muted-foreground mt-1">Player performance analysis</p>
        </div>
        <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
          <SelectTrigger className="w-60 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {mockPlayers.map(p => (
              <SelectItem key={p.id} value={p.player_name}>{p.player_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Player Header */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-4 mb-4">
          <TeamLogo team={player.team} className="w-16 h-16" bgClass="bg-secondary border-2 border-border" />
          <div>
            <h2 className="text-xl font-bold text-foreground">{player.player_name}</h2>
            <p className="text-sm text-muted-foreground">{player.team} · {player.position} · {player.is_starter ? 'Starter' : 'Bench'}</p>
            {player.injury_status && player.injury_status !== 'healthy' && (
              <Badge variant="outline" className="mt-1 border-destructive/30 text-destructive text-xs">
                {player.injury_status.toUpperCase()} {player.injury_note && `- ${player.injury_note}`}
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <Clock className="w-4 h-4 mx-auto text-chart-3 mb-1" />
            <p className="text-lg font-bold text-foreground">{player.props[0]?.minutes_avg || 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Avg Minutes</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <Activity className="w-4 h-4 mx-auto text-accent mb-1" />
            <p className="text-lg font-bold text-foreground">{player.props[0]?.usage_rate || 0}%</p>
            <p className="text-[10px] text-muted-foreground uppercase">Usage Rate</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <Target className="w-4 h-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold text-foreground">{player.props[0]?.pace_rating || 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Pace</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <TrendingUp className="w-4 h-4 mx-auto text-chart-4 mb-1" />
            <p className="text-lg font-bold text-foreground">{player.props[0]?.game_total || 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Game Total</p>
          </div>
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
              <div className="flex items-center gap-2">
                {prop.streak_info && (
                  <span className="text-xs text-primary font-medium flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {prop.streak_info}
                  </span>
                )}
              </div>
            </div>

            <PlayerTrendChart 
              games={prop.last_10_games || []} 
              line={prop.line} 
              propType={prop.prop_type}
              gameLogs={gameLogs}
            />

            <div className="grid grid-cols-4 gap-3 mt-4">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Avg L5</p>
                <p className={cn("text-sm font-bold", prop.avg_last_5 > prop.line ? 'text-primary' : 'text-destructive')}>
                  {prop.avg_last_5}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Avg L10</p>
                <p className={cn("text-sm font-bold", prop.avg_last_10 > prop.line ? 'text-primary' : 'text-destructive')}>
                  {prop.avg_last_10}
                </p>
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
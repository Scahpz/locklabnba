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
            {Object.entries(
              mockPlayers.reduce((acc, p) => {
                (acc[p.team] = acc[p.team] || []).push(p);
                return acc;
              }, {})
            ).sort(([a], [b]) => a.localeCompare(b)).map(([team, players]) => (
              <React.Fragment key={team}>
                <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{team}</div>
                {players.map(p => (
                  <SelectItem key={p.id} value={p.player_name} className="pl-4">{p.player_name}</SelectItem>
                ))}
              </React.Fragment>
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

        {/* Quick Stats — Season Averages */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(() => {
            const propTypes = ['points', 'rebounds', 'assists', '3PM', 'steals', 'blocks', 'PRA'];
            const labelMap = { points: 'PPG', rebounds: 'RPG', assists: 'APG', '3PM': '3PM', steals: 'SPG', blocks: 'BPG', PRA: 'PRA' };
            const iconMap = { points: TrendingUp, rebounds: Activity, assists: Target, '3PM': Zap, steals: Clock, blocks: Clock, PRA: TrendingUp };
            const colorMap = { points: 'text-primary', rebounds: 'text-accent', assists: 'text-chart-3', '3PM': 'text-chart-4', steals: 'text-chart-3', blocks: 'text-destructive', PRA: 'text-primary' };

            // Show up to 4 stats: always minutes + whatever prop types this player has
            const playerPropTypes = player.props.map(p => p.prop_type);
            const statsToShow = [
              { key: 'minutes', label: 'MIN', value: player.props[0]?.minutes_avg || 0, icon: Clock, color: 'text-chart-3' },
              ...playerPropTypes.slice(0, 3).map(type => {
                const prop = player.props.find(p => p.prop_type === type);
                const Icon = iconMap[type] || TrendingUp;
                return { key: type, label: labelMap[type] || type.toUpperCase(), value: prop?.avg_last_10 || prop?.line || 0, icon: Icon, color: colorMap[type] || 'text-primary' };
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
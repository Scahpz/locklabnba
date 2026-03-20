import React, { useState } from 'react';
import { mockPlayers } from '@/lib/mockData';
import { Shield, TrendingUp, TrendingDown, Gauge, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ratingColors = {
  elite: { text: 'text-primary', bg: 'bg-primary/10', label: 'ELITE' },
  favorable: { text: 'text-chart-3', bg: 'bg-chart-3/10', label: 'FAVORABLE' },
  neutral: { text: 'text-muted-foreground', bg: 'bg-muted', label: 'NEUTRAL' },
  tough: { text: 'text-chart-5', bg: 'bg-chart-5/10', label: 'TOUGH' },
  elite_defense: { text: 'text-destructive', bg: 'bg-destructive/10', label: 'ELITE D' },
};

function DefRankBar({ rank }) {
  const color = rank >= 25 ? 'hsl(142 71% 45%)' : rank >= 15 ? 'hsl(199 89% 48%)' : rank >= 8 ? 'hsl(43 74% 66%)' : 'hsl(0 84% 60%)';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(rank / 30) * 100}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono font-bold text-foreground w-8 text-right">#{rank}</span>
    </div>
  );
}

export default function Matchups() {
  const allMatchups = [];
  mockPlayers.forEach(player => {
    player.props.forEach(prop => {
      allMatchups.push({
        player_name: player.player_name,
        team: player.team,
        opponent: player.opponent,
        position: player.position,
        photo_url: player.photo_url,
        prop_type: prop.prop_type,
        line: prop.line,
        matchup_rating: prop.matchup_rating,
        matchup_note: prop.matchup_note,
        def_rank_vs_pos: prop.def_rank_vs_pos,
        pace_rating: prop.pace_rating,
        game_total: prop.game_total,
        edge: prop.edge,
      });
    });
  });

  const chartData = allMatchups
    .sort((a, b) => b.def_rank_vs_pos - a.def_rank_vs_pos)
    .slice(0, 8)
    .map(m => ({
      name: `${m.player_name.split(' ').pop()} ${m.prop_type.toUpperCase()}`,
      rank: m.def_rank_vs_pos,
      fill: m.def_rank_vs_pos >= 25 ? 'hsl(142 71% 45%)' : m.def_rank_vs_pos >= 15 ? 'hsl(199 89% 48%)' : 'hsl(43 74% 66%)',
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-7 h-7 text-chart-3" />
          Matchup Insights
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Defensive rankings vs position & game pace</p>
      </div>

      {/* Defensive Rank Chart */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">Worst Defenses vs Position (Best Matchups)</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 20%)" />
              <XAxis type="number" domain={[0, 30]} tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 10 }} width={100} />
              <Tooltip
                contentStyle={{ background: 'hsl(222 47% 9%)', border: '1px solid hsl(217 33% 20%)', borderRadius: '8px', color: 'hsl(210 40% 98%)', fontSize: 12 }}
                formatter={(value) => [`#${value}`, 'Def Rank']}
              />
              <Bar dataKey="rank" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Matchup Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allMatchups.map((m, i) => {
          const rating = ratingColors[m.matchup_rating] || ratingColors.neutral;
          return (
            <div key={i} className="rounded-xl border border-border bg-card p-4 hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden">
                    <img src={m.photo_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{m.player_name}</p>
                    <p className="text-xs text-muted-foreground">{m.team} vs {m.opponent} · {m.prop_type.toUpperCase()}</p>
                  </div>
                </div>
                <Badge variant="outline" className={cn("text-[10px]", rating.bg, rating.text, `border-current`)}>
                  {rating.label}
                </Badge>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Def Rank vs {m.position}</p>
                  <DefRankBar rank={m.def_rank_vs_pos} />
                </div>
                <p className="text-xs text-muted-foreground">{m.matchup_note}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center bg-secondary/30 rounded-lg p-2">
                  <Gauge className="w-3 h-3 mx-auto text-chart-3 mb-0.5" />
                  <p className="text-xs font-bold text-foreground">{m.pace_rating}</p>
                  <p className="text-[9px] text-muted-foreground">Pace</p>
                </div>
                <div className="text-center bg-secondary/30 rounded-lg p-2">
                  <Target className="w-3 h-3 mx-auto text-accent mb-0.5" />
                  <p className="text-xs font-bold text-foreground">{m.game_total}</p>
                  <p className="text-[9px] text-muted-foreground">O/U Total</p>
                </div>
                <div className="text-center bg-secondary/30 rounded-lg p-2">
                  {m.edge > 0 ? <TrendingUp className="w-3 h-3 mx-auto text-primary mb-0.5" /> : <TrendingDown className="w-3 h-3 mx-auto text-destructive mb-0.5" />}
                  <p className={cn("text-xs font-bold", m.edge > 0 ? 'text-primary' : 'text-destructive')}>
                    {m.edge > 0 ? '+' : ''}{m.edge}%
                  </p>
                  <p className="text-[9px] text-muted-foreground">Edge</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
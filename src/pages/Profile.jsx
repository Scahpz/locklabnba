import React, { useState } from 'react';
import { User, Star, TrendingUp, Target, Trophy, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { mockPlayers } from '@/lib/mockData';
import TeamLogo from '@/components/common/TeamLogo';

export default function Profile() {
  const [favorites, setFavorites] = useState(['Luka Doncic', 'Nikola Jokic']);

  const toggleFavorite = (name) => {
    setFavorites(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  // Mock performance stats
  const performance = {
    totalPicks: 47,
    wins: 32,
    losses: 15,
    winRate: 68.1,
    roi: 12.4,
    bestStreak: 8,
    currentStreak: 3,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          <User className="w-7 h-7 text-muted-foreground" />
          My Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Track your picks and favorite players</p>
      </div>

      {/* Performance Stats */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-chart-4" /> Pick Performance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{performance.totalPicks}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Total Picks</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-primary">{performance.winRate}%</p>
            <p className="text-[10px] text-muted-foreground uppercase">Win Rate</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-primary">+{performance.roi}%</p>
            <p className="text-[10px] text-muted-foreground uppercase">ROI</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-chart-4">{performance.bestStreak}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Best Streak</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between bg-primary/5 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">Wins</span>
            <span className="text-sm font-bold text-primary">{performance.wins}</span>
          </div>
          <div className="flex items-center justify-between bg-destructive/5 rounded-lg p-3">
            <span className="text-xs text-muted-foreground">Losses</span>
            <span className="text-sm font-bold text-destructive">{performance.losses}</span>
          </div>
        </div>
      </div>

      {/* Favorite Players */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <Star className="w-4 h-4 text-chart-4" /> Favorite Players
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {mockPlayers.map(player => {
            const isFav = favorites.includes(player.player_name);
            return (
              <div
                key={player.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-3 transition-all cursor-pointer",
                  isFav ? "border-chart-4/30 bg-chart-4/5" : "border-border hover:border-border/80"
                )}
                onClick={() => toggleFavorite(player.player_name)}
              >
                <div className="flex items-center gap-3">
                  <TeamLogo team={player.team} className="w-10 h-10" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{player.player_name}</p>
                    <p className="text-xs text-muted-foreground">{player.team} · {player.position}</p>
                  </div>
                </div>
                <Star className={cn(
                  "w-5 h-5 transition-colors",
                  isFav ? "text-chart-4 fill-chart-4" : "text-muted-foreground"
                )} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
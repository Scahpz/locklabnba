import React, { useState } from 'react';
import { mockAlerts } from '@/lib/mockData';
import { Bell, AlertTriangle, TrendingUp, Zap, Newspaper, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const typeConfig = {
  injury: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10' },
  line_movement: { icon: TrendingUp, color: 'text-chart-3', bg: 'bg-chart-3/10' },
  best_bet: { icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
  news: { icon: Newspaper, color: 'text-accent', bg: 'bg-accent/10' },
};

const impactColors = {
  positive: 'text-primary bg-primary/10 border-primary/20',
  negative: 'text-destructive bg-destructive/10 border-destructive/20',
  neutral: 'text-muted-foreground bg-muted border-border',
};

export default function Alerts() {
  const [alerts, setAlerts] = useState(mockAlerts);

  const markRead = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, is_read: true } : a));
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-7 h-7 text-chart-4" />
            Alerts & News
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{unreadCount} unread notifications</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => setAlerts(alerts.map(a => ({ ...a, is_read: true })))}
            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const config = typeConfig[alert.type] || typeConfig.news;
          const impact = impactColors[alert.impact] || impactColors.neutral;
          return (
            <div
              key={alert.id}
              className={cn(
                "rounded-xl border bg-card p-4 transition-all duration-300",
                alert.is_read ? "border-border opacity-60" : "border-border hover:border-primary/20"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("p-2 rounded-lg flex-shrink-0", config.bg)}>
                  <config.icon className={cn("w-4 h-4", config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{alert.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                    </div>
                    {!alert.is_read && (
                      <button
                        onClick={() => markRead(alert.id)}
                        className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {alert.player_name && (
                      <Badge variant="outline" className="text-[10px] border-border">{alert.player_name}</Badge>
                    )}
                    {alert.team && (
                      <Badge variant="outline" className="text-[10px] border-border">{alert.team}</Badge>
                    )}
                    <Badge variant="outline" className={cn("text-[10px]", impact)}>
                      {alert.impact?.toUpperCase()}
                    </Badge>
                    {!alert.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
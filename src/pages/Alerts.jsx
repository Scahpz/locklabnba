import React, { useState, useEffect } from 'react';
import { mockAlerts } from '@/lib/mockData';
import { fetchLiveProps } from '@/lib/liveData';
import { Bell, AlertTriangle, TrendingUp, Zap, Newspaper, Check, Wifi, WifiOff, RefreshCw } from 'lucide-react';
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

/** Build dynamic alerts from today's live props */
function buildLiveAlerts(props) {
  const alerts = [];
  let id = 1;

  props.forEach(prop => {
    // High confidence locks
    if (prop.is_lock || prop.confidence_score >= 9) {
      alerts.push({
        id: id++,
        title: `🔒 Lock Alert: ${prop.player_name} ${prop.prop_type.toUpperCase()} O${prop.line}`,
        description: `${prop.streak_info || `${prop.hit_rate_last_10}% hit rate L10`} — Confidence ${prop.confidence_score}/10. Edge: +${prop.edge}%`,
        type: 'best_bet',
        player_name: prop.player_name,
        team: prop.team,
        impact: 'positive',
        is_read: false,
      });
    }

    // Best value picks
    if (prop.best_value && prop.edge > 10) {
      alerts.push({
        id: id++,
        title: `💰 Best Value: ${prop.player_name} ${prop.prop_type.toUpperCase()}`,
        description: `Line at ${prop.line}, projection ${prop.projection}. Edge: +${prop.edge}% vs ${prop.bookmaker || 'DraftKings'}.`,
        type: 'line_movement',
        player_name: prop.player_name,
        team: prop.team,
        impact: 'positive',
        is_read: false,
      });
    }

    // Injury alerts
    if (prop.injury_status && prop.injury_status !== 'healthy') {
      alerts.push({
        id: id++,
        title: `🚨 Injury: ${prop.player_name} — ${prop.injury_status.toUpperCase()}`,
        description: prop.injury_note || `${prop.player_name} is listed as ${prop.injury_status}. Monitor status before betting.`,
        type: 'injury',
        player_name: prop.player_name,
        team: prop.team,
        impact: 'negative',
        is_read: false,
      });
    }

    // Hot streak alerts (7+ hits last 10)
    if (prop.hit_rate_last_10 >= 70 && !prop.is_lock) {
      alerts.push({
        id: id++,
        title: `🔥 Hot Streak: ${prop.player_name} ${prop.prop_type.toUpperCase()}`,
        description: prop.streak_info || `Hit rate ${prop.hit_rate_last_10}% in last 10 games. Avg L5: ${prop.avg_last_5}.`,
        type: 'best_bet',
        player_name: prop.player_name,
        team: prop.team,
        impact: 'positive',
        is_read: false,
      });
    }

    // Trap warnings
    if (prop.trap_warning) {
      alerts.push({
        id: id++,
        title: `⚠️ Trap Warning: ${prop.player_name} ${prop.prop_type.toUpperCase()} O${prop.line}`,
        description: `Line may be inflated. Historical avg is ${prop.avg_last_10} — line set at ${prop.line}. Fade with caution.`,
        type: 'news',
        player_name: prop.player_name,
        team: prop.team,
        impact: 'negative',
        is_read: false,
      });
    }
  });

  // Deduplicate by player+type combination, prioritize higher severity
  const seen = new Set();
  return alerts.filter(a => {
    const key = `${a.player_name}-${a.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 25);
}

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchLiveProps();
        if (data?.props?.length > 0) {
          setAlerts(buildLiveAlerts(data.props));
          setIsLive(true);
        } else {
          setAlerts(mockAlerts);
        }
      } catch {
        setAlerts(mockAlerts);
      }
      setLoading(false);
    }
    load();
  }, []);

  const markRead = (id) => setAlerts(alerts.map(a => a.id === id ? { ...a, is_read: true } : a));
  const unreadCount = alerts.filter(a => !a.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading today's alerts…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-7 h-7 text-chart-4" />
            Alerts & News
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            {isLive
              ? <><Wifi className="w-3.5 h-3.5 text-primary" /><span className="text-primary font-medium">Live — today's games · </span>{unreadCount} unread</>
              : <><WifiOff className="w-3.5 h-3.5" />{unreadCount} unread notifications</>
            }
          </p>
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
                    {alert.impact && (
                      <Badge variant="outline" className={cn("text-[10px]", impact)}>
                        {alert.impact?.toUpperCase()}
                      </Badge>
                    )}
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
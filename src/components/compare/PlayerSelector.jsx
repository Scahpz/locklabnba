import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import TeamLogo from '@/components/common/TeamLogo';

const injuryColors = {
  healthy: 'text-primary',
  questionable: 'text-chart-4',
  doubtful: 'text-destructive',
  out: 'text-destructive',
  GTD: 'text-chart-4',
};

export default function PlayerSelector({ slot, selectedId, allPlayers, disabledIds, onSelect, onRemove }) {
  const player = allPlayers.find(p => p.id === selectedId);

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Select value={selectedId} onValueChange={onSelect}>
          <SelectTrigger className="flex-1 bg-secondary border-border text-sm h-9">
            <SelectValue placeholder="Select player…" />
          </SelectTrigger>
          <SelectContent>
            {allPlayers.map(p => (
              <SelectItem key={p.id} value={p.id} disabled={disabledIds.includes(p.id)}>
                {p.player_name} — {p.team}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {onRemove && (
          <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {player && (
        <div className="flex items-center gap-3">
          <TeamLogo team={player.team} className="w-12 h-12" bgClass="bg-secondary border-2 border-border" />
          <div>
            <p className="font-bold text-foreground text-sm">{player.player_name}</p>
            <p className="text-xs text-muted-foreground">{player.team} vs {player.opponent} · {player.position}</p>
            {player.injury_status !== 'healthy' && (
              <p className={cn('text-[10px] flex items-center gap-1 mt-0.5 font-medium', injuryColors[player.injury_status])}>
                <AlertTriangle className="w-3 h-3" />
                {player.injury_status?.toUpperCase()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
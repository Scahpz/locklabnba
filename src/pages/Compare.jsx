import React, { useState, useEffect } from 'react';
import { useLivePlayers } from '@/lib/useLivePlayers';
import { GitCompare, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import PlayerSelector from '@/components/compare/PlayerSelector';
import CompareColumn from '@/components/compare/CompareColumn';
import ComparePropRow from '@/components/compare/ComparePropRow';

const MAX_PLAYERS = 3;

export default function Compare() {
  const { players, isLive, loading } = useLivePlayers();
  const [selectedIds, setSelectedIds] = useState([]);

  // Set defaults once players load
  useEffect(() => {
    if (players.length >= 2 && selectedIds.length === 0) {
      setSelectedIds([players[0].id, players[1].id]);
    }
  }, [players]);

  const selected = selectedIds.map(id => players.find(p => p.id === id)).filter(Boolean);

  const handleSelect = (slot, id) => {
    const next = [...selectedIds];
    if (id === null) {
      next.splice(slot, 1);
    } else {
      next[slot] = id;
    }
    setSelectedIds(next);
  };

  const handleAdd = () => {
    if (selectedIds.length < MAX_PLAYERS) {
      const unused = players.find(p => !selectedIds.includes(p.id));
      if (unused) setSelectedIds([...selectedIds, unused.id]);
    }
  };

  // Collect all unique prop types across selected players
  const allPropTypes = [...new Set(selected.flatMap(p => p.props.map(pr => pr.prop_type)))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading today's players…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          <GitCompare className="w-7 h-7 text-accent" />
          Player Comparison
        </h1>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
          {isLive
            ? <><Wifi className="w-3.5 h-3.5 text-primary" /><span className="text-primary font-medium">Live — today's players only</span></>
            : <><WifiOff className="w-3.5 h-3.5" />Compare up to 3 players side-by-side</>
          }
        </p>
      </div>

      {/* Player Selector Row */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedIds.length}, minmax(0, 1fr))` }}>
        {selectedIds.map((id, slot) => (
          <PlayerSelector
            key={slot}
            slot={slot}
            selectedId={id}
            allPlayers={players}
            disabledIds={selectedIds.filter((_, i) => i !== slot)}
            onSelect={(newId) => handleSelect(slot, newId)}
            onRemove={selectedIds.length > 1 ? () => handleSelect(slot, null) : null}
          />
        ))}
        {selectedIds.length < MAX_PLAYERS && (
          <button
            onClick={handleAdd}
            className="rounded-xl border-2 border-dashed border-border hover:border-accent/50 bg-card/50 hover:bg-accent/5 transition-all flex flex-col items-center justify-center gap-2 p-8 text-muted-foreground hover:text-accent min-h-[120px]"
          >
            <span className="text-3xl font-light">+</span>
            <span className="text-xs font-medium">Add Player</span>
          </button>
        )}
      </div>

      {/* Stats Overview Row */}
      {selected.length > 0 && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selected.length}, minmax(0, 1fr))` }}>
          {selected.map(player => (
            <CompareColumn key={player.id} player={player} />
          ))}
        </div>
      )}

      {/* Prop-by-prop Comparison */}
      {allPropTypes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Prop Breakdown</h2>
          {allPropTypes.map(propType => (
            <ComparePropRow
              key={propType}
              propType={propType}
              players={selected}
            />
          ))}
        </div>
      )}
    </div>
  );
}
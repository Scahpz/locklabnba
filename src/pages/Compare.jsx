import React, { useState } from 'react';
import { mockPlayers } from '@/lib/mockData';
import { GitCompare } from 'lucide-react';
import PlayerSelector from '@/components/compare/PlayerSelector';
import CompareColumn from '@/components/compare/CompareColumn';
import ComparePropRow from '@/components/compare/ComparePropRow';

const MAX_PLAYERS = 3;

export default function Compare() {
  const [selectedIds, setSelectedIds] = useState([mockPlayers[0].id, mockPlayers[5].id]);

  const selected = selectedIds.map(id => mockPlayers.find(p => p.id === id)).filter(Boolean);

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
      const unused = mockPlayers.find(p => !selectedIds.includes(p.id));
      if (unused) setSelectedIds([...selectedIds, unused.id]);
    }
  };

  // Collect all unique prop types across selected players
  const allPropTypes = [...new Set(selected.flatMap(p => p.props.map(pr => pr.prop_type)))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          <GitCompare className="w-7 h-7 text-accent" />
          Player Comparison
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Compare up to 3 players side-by-side</p>
      </div>

      {/* Player Selector Row */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedIds.length}, minmax(0, 1fr))` }}>
        {selectedIds.map((id, slot) => (
          <PlayerSelector
            key={slot}
            slot={slot}
            selectedId={id}
            allPlayers={mockPlayers}
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
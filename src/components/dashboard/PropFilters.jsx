import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const propTypes = ['all', 'points', 'rebounds', 'assists', 'PRA', '3PM', 'steals', 'blocks'];
const sortOptions = [
  { value: 'edge', label: 'Highest Edge' },
  { value: 'hit_rate', label: 'Best Hit Rate' },
  { value: 'confidence', label: 'Confidence' },
  { value: 'line', label: 'Line Value' },
];

export default function PropFilters({ selectedType, setSelectedType, sortBy, setSortBy }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      {/* Prop Type Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full sm:w-auto">
        {propTypes.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
              selectedType === type
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {type === 'all' ? 'All Props' : type.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Sort */}
      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className="w-40 h-8 text-xs bg-secondary border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
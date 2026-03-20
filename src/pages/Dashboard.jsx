import React, { useState, useMemo } from 'react';
import { getAllProps } from '@/lib/mockData';
import StatsOverview from '@/components/dashboard/StatsOverview';
import PropFilters from '@/components/dashboard/PropFilters';
import PropCard from '@/components/dashboard/PropCard';
import LockOfTheDay from '@/components/dashboard/LockOfTheDay';

export default function Dashboard() {
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('edge');
  const allProps = getAllProps();

  const filtered = useMemo(() => {
    let result = selectedType === 'all' ? allProps : allProps.filter(p => p.prop_type === selectedType);
    
    result.sort((a, b) => {
      if (sortBy === 'edge') return b.edge - a.edge;
      if (sortBy === 'hit_rate') return b.hit_rate_last_10 - a.hit_rate_last_10;
      if (sortBy === 'confidence') return b.confidence_score - a.confidence_score;
      if (sortBy === 'line') return b.line - a.line;
      return 0;
    });
    
    return result;
  }, [allProps, selectedType, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Player Props</h1>
        <p className="text-sm text-muted-foreground mt-1">Today's NBA props with AI-powered analysis</p>
      </div>

      <StatsOverview />
      <LockOfTheDay props={allProps} />

      <div>
        <PropFilters
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {filtered.map((prop, i) => (
            <PropCard key={`${prop.player_name}-${prop.prop_type}-${i}`} prop={prop} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No props found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
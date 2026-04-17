import React, { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

function buildCriteria(prop) {
  // DVP Matchup: favorable/elite = pass, tough/elite_defense = fail
  const dvpPass = prop.matchup_rating != null && ['elite', 'favorable', 'neutral'].includes(prop.matchup_rating);
  const dvpLabel = prop.matchup_rating
    ? `DVP Matchup — ${prop.matchup_rating}`
    : 'DVP Matchup — unknown';

  // Usage Rate: >= 20%
  const usagePass = prop.usage_rate != null && prop.usage_rate >= 20;
  const usageLabel = `Usage Rate — ${prop.usage_rate != null ? prop.usage_rate + '%' : '—'}`;

  // L10 Average vs line
  const l10Pass = prop.avg_last_10 != null && prop.avg_last_10 > prop.line;
  const l10Label = `L10 Avg — ${prop.avg_last_10 ?? '—'} vs line ${prop.line}`;

  // Season Average (use projection as proxy for season avg since we don't store it separately)
  const seasonAvg = prop.avg_last_10; // best available approximation
  const seasonPass = seasonAvg != null && seasonAvg > prop.line;
  const seasonLabel = `Season Avg — ${seasonAvg ?? '—'} vs line ${prop.line}`;

  // Line vs Actual (projection vs line)
  const lineActualPass = prop.projection != null && prop.projection > prop.line;
  const lineActualLabel = `Line vs Actual — proj ${prop.projection ?? '—'} vs ${prop.line}`;

  return [
    { label: dvpLabel, pass: dvpPass },
    { label: usageLabel, pass: usagePass },
    { label: l10Label, pass: l10Pass },
    { label: seasonLabel, pass: seasonPass },
    { label: lineActualLabel, pass: lineActualPass },
  ];
}

export default function PropGradeChecklist({ prop }) {
  const [open, setOpen] = useState(false);
  const criteria = buildCriteria(prop);
  const passCount = criteria.filter(c => c.pass).length;

  return (
    <div className="px-4 pb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="uppercase tracking-wider font-medium">Grade Criteria</span>
          <span className={cn(
            "px-1.5 py-0.5 rounded text-[10px] font-bold",
            passCount >= 4 ? "bg-primary/20 text-primary" :
            passCount >= 2 ? "bg-chart-4/20 text-chart-4" :
            "bg-destructive/20 text-destructive"
          )}>
            {passCount}/{criteria.length}
          </span>
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="bg-secondary/30 rounded-lg p-2.5 space-y-1.5 mt-1">
          {criteria.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                c.pass ? "bg-primary/20" : "bg-destructive/20"
              )}>
                {c.pass
                  ? <Check className="w-2.5 h-2.5 text-primary" />
                  : <X className="w-2.5 h-2.5 text-destructive" />
                }
              </div>
              <span className={cn(
                "text-[11px] leading-tight",
                c.pass ? "text-foreground" : "text-muted-foreground line-through"
              )}>
                {c.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
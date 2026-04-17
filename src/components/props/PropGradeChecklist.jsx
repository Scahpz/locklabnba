import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Builds the list of grading criteria based on prop data.
 * Each criterion has a label and a pass/fail boolean.
 */
function buildCriteria(prop) {
  return [
    {
      label: `Avg L5 > line (${prop.avg_last_5 ?? '—'} vs ${prop.line})`,
      pass: prop.avg_last_5 != null && prop.avg_last_5 > prop.line,
    },
    {
      label: `Hit rate ≥ 60% (${prop.hit_rate_last_10 ?? '—'}%)`,
      pass: prop.hit_rate_last_10 != null && prop.hit_rate_last_10 >= 60,
    },
    {
      label: `Positive edge (${prop.edge != null ? (prop.edge > 0 ? '+' : '') + prop.edge + '%' : '—'})`,
      pass: prop.edge != null && prop.edge > 0,
    },
    {
      label: `Confidence ≥ 7 (${prop.confidence_score ?? '—'}/10)`,
      pass: prop.confidence_score != null && prop.confidence_score >= 7,
    },
    {
      label: `Favorable/neutral matchup`,
      pass: prop.matchup_rating != null && ['elite', 'favorable', 'neutral'].includes(prop.matchup_rating),
    },
  ];
}

export default function PropGradeChecklist({ prop }) {
  const criteria = buildCriteria(prop);
  const passCount = criteria.filter(c => c.pass).length;

  return (
    <div className="px-4 pb-3 pt-1">
      <div className="bg-secondary/30 rounded-lg p-2.5 space-y-1.5">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
          Grade Criteria · {passCount}/{criteria.length} passed
        </p>
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
    </div>
  );
}
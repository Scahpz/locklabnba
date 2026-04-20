import React, { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

function buildCriteria(prop) {
  if (!prop.has_analytics) return null; // no real data yet

  const l10Pass  = prop.avg_last_10 != null && prop.avg_last_10 > prop.line;
  const l5Pass   = prop.avg_last_5  != null && prop.avg_last_5  > prop.line;
  const hitPass  = prop.hit_rate_last_10 != null && prop.hit_rate_last_10 >= 60;
  const projPass = prop.projection  != null && prop.projection  > prop.line;
  const edgePass = prop.edge != null && prop.edge > 0;

  return [
    { label: `L10 Avg — ${prop.avg_last_10 ?? '—'} vs line ${prop.line}`, pass: l10Pass },
    { label: `L5 Avg — ${prop.avg_last_5 ?? '—'} vs line ${prop.line}`, pass: l5Pass },
    { label: `Hit Rate (L10) — ${prop.hit_rate_last_10 != null ? prop.hit_rate_last_10 + '%' : '—'} (need ≥60%)`, pass: hitPass },
    { label: `Projection — ${prop.projection ?? '—'} vs line ${prop.line}`, pass: projPass },
    { label: `Edge — ${prop.edge != null ? (prop.edge > 0 ? '+' : '') + prop.edge : '—'}`, pass: edgePass },
  ];
}

export default function PropGradeChecklist({ prop }) {
  const [open, setOpen] = useState(false);
  const criteria = buildCriteria(prop);

  // No analytics loaded yet — show a prompt instead
  if (!criteria) {
    return (
      <div className="px-4 pb-3">
        <p className="text-[11px] text-muted-foreground italic">
          Open <Link to={`/trends?player=${encodeURIComponent(prop.player_name)}`} className="text-primary underline">Trends</Link> to load game history and see grade criteria.
        </p>
      </div>
    );
  }

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
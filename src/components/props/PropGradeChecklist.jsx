import React, { useState } from 'react';
import { Check, X, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { gradeProp } from '@/lib/grading';

export default function PropGradeChecklist({ prop }) {
  const [open, setOpen] = useState(false);
  const { criteria, passCount, totalCriteria, dataQuality } = gradeProp(prop);
  const availableCount = criteria.filter(c => c.available).length;

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
            {passCount}/{availableCount}
          </span>
          {dataQuality === 'market' && (
            <span className="text-[9px] text-muted-foreground italic">market only</span>
          )}
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="bg-secondary/30 rounded-lg p-2.5 space-y-2 mt-1">
          {criteria.map((c, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                c.pending  ? "bg-secondary border border-border" :
                c.pass     ? "bg-primary/20" : "bg-destructive/20"
              )}>
                {c.pending
                  ? <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                  : c.pass
                    ? <Check className="w-2.5 h-2.5 text-primary" />
                    : <X className="w-2.5 h-2.5 text-destructive" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-[11px] font-medium leading-tight",
                  c.pending  ? "text-muted-foreground" :
                  c.pass     ? "text-foreground" : "text-muted-foreground"
                )}>
                  {c.label}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{c.detail}</p>
              </div>
            </div>
          ))}

          {dataQuality === 'market' && (
            <p className="text-[9px] text-muted-foreground pt-1 border-t border-border/50 italic">
              Analytics loading in background…
            </p>
          )}
        </div>
      )}
    </div>
  );
}

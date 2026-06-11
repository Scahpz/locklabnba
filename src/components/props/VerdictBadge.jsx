import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TIER_CONFIG } from '@/lib/verdict';

/**
 * New stoplight + EV badge.
 *
 * Props:
 *   evVerdict  — result of calcEVVerdict(prop, grade)
 *   loading    — bool, show spinner while grading
 *   compact    — bool, hide edge % (for tight spaces)
 */
export default function VerdictBadge({ evVerdict, loading, compact = false }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 w-fit">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">Analyzing…</span>
      </div>
    );
  }

  if (!evVerdict) return null;

  const { tier, label, direction, edgePP, hasRealOdds } = evVerdict;
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.RED;
  const isTrap = label === 'TRAP';
  const Icon = isTrap
    ? AlertTriangle
    : direction === 'OVER'
    ? TrendingUp
    : TrendingDown;

  const edgeSign   = edgePP > 0 ? '+' : '';
  const edgeStr    = `${edgeSign}${edgePP}%`;
  const dirLabel   = isTrap ? 'AVOID' : direction;

  return (
    <div className={cn(
      'flex items-center gap-2 rounded-xl px-3 py-2 w-fit border',
      cfg.badge,
    )}>
      {/* Stoplight dot */}
      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />

      {/* Action label */}
      <span className="text-xs font-bold tracking-wide">{label}</span>

      {/* Direction */}
      <span className="flex items-center gap-0.5 text-xs font-semibold opacity-80">
        <Icon className="w-3 h-3" />
        {dirLabel}
      </span>

      {/* Edge */}
      {!compact && !isTrap && (
        <span className={cn(
          'text-[11px] font-bold ml-0.5',
          edgePP >= 8 ? 'opacity-100' : 'opacity-75'
        )}>
          {edgeStr}{!hasRealOdds && <span className="font-normal opacity-60"> est.</span>}
        </span>
      )}
    </div>
  );
}

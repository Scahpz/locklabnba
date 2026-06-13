import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Minus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TIER_CONFIG } from '@/lib/verdict';

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
  const cfg     = TIER_CONFIG[tier] || TIER_CONFIG.RED;
  const isTrap  = label === 'TRAP';
  const isSKIP  = label === 'SKIP';
  const Icon    = isTrap ? AlertTriangle
                : isSKIP ? Minus
                : direction === 'OVER' ? TrendingUp
                : TrendingDown;

  const edgeSign = edgePP > 0 ? '+' : '';
  const edgeStr  = `${edgeSign}${edgePP}%`;

  return (
    <div className={cn('flex items-center gap-1.5 rounded-xl px-3 py-2 w-fit border', cfg.badge)}>
      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      {/* label already contains direction for BET IT / LEAN ("BET IT OVER", "LEAN UNDER") */}
      <span className="text-xs font-bold tracking-wide">{label}</span>
      {!compact && !isTrap && !isSKIP && (
        <span className={cn('text-[11px] font-bold ml-0.5', edgePP >= 8 ? 'opacity-100' : 'opacity-70')}>
          {edgeStr}{!hasRealOdds && <span className="font-normal opacity-60"> est.</span>}
        </span>
      )}
    </div>
  );
}

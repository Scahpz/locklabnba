/**
 * Central grading engine.
 * Always returns a verdict (OVER or UNDER), confidence %, and criteria breakdown.
 * Works with OR without loaded game logs.
 */

function impliedProbability(americanOdds) {
  if (americanOdds == null) return 0.5;
  if (americanOdds < 0) return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
  return 100 / (americanOdds + 100);
}

export function gradeProp(prop) {
  if (prop.has_analytics) {
    return gradeWithAnalytics(prop);
  }
  return gradeFromMarket(prop);
}

function gradeWithAnalytics(prop) {
  const l10  = prop.avg_last_10;
  const l5   = prop.avg_last_5;
  const hit  = prop.hit_rate_last_10;
  const proj = prop.projection;
  const edge = prop.edge;
  const line = prop.line;

  const criteria = [
    {
      label: `L10 Avg: ${l10 ?? '—'} vs Line ${line}`,
      detail: l10 != null ? (l10 > line ? `Averaging ${l10} — beats the line` : `Averaging ${l10} — below the line`) : 'No data',
      pass: l10 != null && l10 > line,
      weight: 25,
      available: l10 != null,
    },
    {
      label: `L5 Avg: ${l5 ?? '—'} vs Line ${line}`,
      detail: l5 != null ? (l5 > line ? `Last 5 avg ${l5} — hot recently` : `Last 5 avg ${l5} — cold recently`) : 'No data',
      pass: l5 != null && l5 > line,
      weight: 25,
      available: l5 != null,
    },
    {
      label: `Hit Rate: ${hit != null ? hit + '%' : '—'} (need ≥ 60%)`,
      detail: hit != null ? (hit >= 60 ? `Hit over ${hit}% of last 10 games` : `Only ${hit}% hit rate — inconsistent`) : 'No data',
      pass: hit != null && hit >= 60,
      weight: 25,
      available: hit != null,
    },
    {
      label: `Projection: ${proj ?? '—'} vs Line ${line}`,
      detail: proj != null ? (proj > line ? `Model projects ${proj} — edge of +${(proj - line).toFixed(1)}` : `Model projects ${proj} — edge of ${(proj - line).toFixed(1)}`) : 'No data',
      pass: proj != null && proj > line,
      weight: 15,
      available: proj != null,
    },
    {
      label: `Edge: ${edge != null ? (edge > 0 ? '+' : '') + edge : '—'}`,
      detail: edge != null ? (edge > 0 ? `Positive edge of +${edge}` : `Negative edge of ${edge}`) : 'No data',
      pass: edge != null && edge > 0,
      weight: 10,
      available: edge != null,
    },
  ];

  const availableCriteria = criteria.filter(c => c.available);
  const passingWeight = availableCriteria.filter(c => c.pass).reduce((s, c) => s + c.weight, 0);
  const totalWeight   = availableCriteria.reduce((s, c) => s + c.weight, 0) || 100;
  const overScore = passingWeight / totalWeight; // 0.0 – 1.0

  const verdict    = overScore >= 0.5 ? 'OVER' : 'UNDER';
  // Map score to confidence: 0.5 → 52%, 1.0 → 98%, 0.0 → 98% (other direction)
  const rawConf    = Math.round(52 + Math.abs(overScore - 0.5) * 92);
  const confidence = Math.min(98, rawConf);
  const passCount  = availableCriteria.filter(c => c.pass).length;

  return { verdict, confidence, criteria, passCount, totalCriteria: availableCriteria.length, dataQuality: 'full' };
}

function gradeFromMarket(prop) {
  const overOdds  = prop.over_odds  ?? -110;
  const underOdds = prop.under_odds ?? -110;

  const rawOver  = impliedProbability(overOdds);
  const rawUnder = impliedProbability(underOdds);
  const total    = rawOver + rawUnder;
  const trueOver = rawOver / total; // de-vigged

  const criteria = [
    {
      label: `Market Implied OVER: ${(trueOver * 100).toFixed(0)}%`,
      detail: `Market prices this at ${(trueOver * 100).toFixed(0)}% to go over the line`,
      pass: trueOver > 0.505,
      weight: 100,
      available: true,
      market: true,
    },
    {
      label: 'L10 Game Log Average — not yet loaded',
      detail: 'Click player name → Trends to load game history',
      pass: false,
      weight: 0,
      available: false,
      pending: true,
    },
    {
      label: 'L5 Game Log Average — not yet loaded',
      detail: 'Click player name → Trends to load game history',
      pass: false,
      weight: 0,
      available: false,
      pending: true,
    },
    {
      label: 'Hit Rate (L10) — not yet loaded',
      detail: 'Click player name → Trends to load game history',
      pass: false,
      weight: 0,
      available: false,
      pending: true,
    },
    {
      label: 'Projection vs Line — not yet loaded',
      detail: 'Click player name → Trends to load game history',
      pass: false,
      weight: 0,
      available: false,
      pending: true,
    },
  ];

  const verdict    = trueOver >= 0.5 ? 'OVER' : 'UNDER';
  const confidence = Math.min(54, Math.round(50 + Math.abs(trueOver - 0.5) * 100));
  const passCount  = trueOver > 0.505 ? 1 : 0;

  return { verdict, confidence, criteria, passCount, totalCriteria: 5, dataQuality: 'market' };
}

/**
 * Composite ranking score — higher = better prop to bet.
 * Props with real game logs always rank above market-only props.
 */
export function rankScore(prop) {
  const grade = gradeProp(prop);
  const base  = grade.dataQuality === 'full' ? 1000 : 0;
  // Scale confidence so 98% → ~90pts, 52% → ~2pts
  const confPts = Math.pow((grade.confidence - 50) / 48, 1.5) * 90;
  return base + confPts;
}

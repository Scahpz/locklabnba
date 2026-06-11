/**
 * EV-based verdict engine.
 *
 * Combines:
 *   - Model probability (Poisson from backend, or grading confidence)
 *   - Market implied probability (de-vigged from real sportsbook odds)
 *
 * Returns a stoplight tier + edge %, giving users a single clear signal.
 *
 * Tiers:
 *   GREEN  "BET IT"  — model beats market by ≥ 8pp  (strong +EV)
 *   YELLOW "LEAN"    — model beats market by 3–8pp   (marginal edge)
 *   RED    "SKIP"    — edge < 3pp                    (no clear edge)
 *   RED    "TRAP"    — grade is UNSAFE / bad matchup (avoid regardless of odds)
 */

function impliedProb(odds) {
  if (odds == null) return 0.5;
  return odds < 0
    ? Math.abs(odds) / (Math.abs(odds) + 100)
    : 100 / (odds + 100);
}

/** De-vig: remove the book's margin to get true market probability of OVER. */
function devig(overOdds, underOdds) {
  const rawOver  = impliedProb(overOdds ?? -110);
  const rawUnder = impliedProb(underOdds ?? -110);
  const total    = rawOver + rawUnder;
  return total > 0 ? rawOver / total : 0.5;
}

/**
 * @param {object} prop   — prop object with over_odds, under_odds, poisson_hit_prob, etc.
 * @param {object} grade  — result of gradeProp(prop): { verdict, confidence, lean, dataQuality }
 * @returns {{ tier, label, direction, edgePP, modelProb, marketProb, hasRealOdds }}
 */
export function calcEVVerdict(prop, grade) {
  const overOdds  = prop.over_odds  ?? -110;
  const underOdds = prop.under_odds ?? -110;

  // Model probability of going OVER the line.
  // Prefer the Poisson probability from the backend (statistically grounded).
  // Fall back to grading confidence mapped to a directional probability.
  let modelOverProb;
  if (prop.poisson_hit_prob != null) {
    modelOverProb = prop.poisson_hit_prob;
  } else if (grade.dataQuality === 'full') {
    modelOverProb = grade.lean === 'OVER'
      ? grade.confidence / 100
      : 1 - grade.confidence / 100;
  } else {
    // Market-only data — no real model edge, use market as baseline
    modelOverProb = devig(overOdds, underOdds);
  }

  // Market true probability of OVER (de-vigged)
  const marketOverProb = devig(overOdds, underOdds);

  // Direction: whichever side the model favors
  const direction   = modelOverProb >= 0.5 ? 'OVER' : 'UNDER';
  const modelProb   = direction === 'OVER' ? modelOverProb  : 1 - modelOverProb;
  const marketProb  = direction === 'OVER' ? marketOverProb : 1 - marketOverProb;
  const edgePP      = Math.round((modelProb - marketProb) * 1000) / 10; // 1 decimal place

  // Real sportsbook odds or just -110 defaults?
  const hasRealOdds = overOdds !== -110 || underOdds !== -110;

  // TRAP: grading says UNSAFE — don't bet regardless of edge
  if (grade.verdict === 'UNSAFE' && grade.dataQuality === 'full') {
    return { tier: 'RED', label: 'TRAP', direction, edgePP, modelProb, marketProb, hasRealOdds };
  }

  let tier, label;
  if (edgePP >= 8) {
    tier  = 'GREEN';
    label = 'BET IT';
  } else if (edgePP >= 3) {
    tier  = 'YELLOW';
    label = 'LEAN';
  } else {
    tier  = 'RED';
    label = 'SKIP';
  }

  return { tier, label, direction, edgePP, modelProb, marketProb, hasRealOdds };
}

export const TIER_CONFIG = {
  GREEN: {
    dot:       'bg-emerald-400',
    badge:     'bg-emerald-500/15 border-emerald-500/35 text-emerald-400',
    label:     'BET IT',
  },
  YELLOW: {
    dot:       'bg-amber-400',
    badge:     'bg-amber-500/15 border-amber-500/35 text-amber-400',
    label:     'LEAN',
  },
  RED: {
    dot:       'bg-rose-500',
    badge:     'bg-rose-500/12 border-rose-500/30 text-rose-400',
    label:     'SKIP',
  },
};

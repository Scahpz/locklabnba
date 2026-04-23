/**
 * 4-Factor Grading Engine
 *
 * Weights (total 100):
 *   Matchup / Defense    30%  (pace 15 + defensive rating 15)
 *   Recent Form          25%  (L10 avg 12 + L5 avg 8 + hit rate 5)
 *   Injury / Usage       25%  (teammate injuries → usage boost, or edge proxy)
 *   Blowout Risk / Rest  20%  (spread risk 10 + home/back-to-back 10)
 */

const AVG_DEF_RATING = 113.5; // NBA league average
const AVG_PACE       = 98.5;  // NBA league average possessions/game

function impliedProbability(odds) {
  if (odds == null) return 0.5;
  return odds < 0
    ? Math.abs(odds) / (Math.abs(odds) + 100)
    : 100 / (odds + 100);
}

export function gradeProp(prop) {
  const hasContext = prop.opponent_def_rating != null
    || prop.opponent_pace != null
    || prop.is_back_to_back != null
    || prop.spread != null;

  if (prop.has_analytics || hasContext) {
    return gradeWithContext(prop);
  }
  return gradeFromMarket(prop);
}

function gradeWithContext(prop) {
  const line = prop.line;
  const l10  = prop.avg_last_10;
  const l5   = prop.avg_last_5;
  const hit  = prop.hit_rate_last_10;

  // Context fields
  const oppDef    = prop.opponent_def_rating;   // pts/100 — higher = weaker defense
  const oppPace   = prop.opponent_pace;
  const teamPace  = prop.player_team_pace;
  const spread    = prop.spread;                // from player team's perspective (+= favored)
  const isB2B     = prop.is_back_to_back ?? false;
  const injNote   = prop.injury_context;        // e.g. "LeBron James (Out)"
  const edge      = prop.edge;

  const criteria = [];

  // ── 1. MATCHUP / DEFENSE (30%) ───────────────────────────────────────────
  const avgPace   = oppPace && teamPace ? Math.round((oppPace + teamPace) / 2) : null;
  const pacePass  = avgPace != null ? avgPace >= AVG_PACE : null;

  criteria.push({
    label: avgPace != null
      ? `Pace: ${avgPace} poss/game (avg ${AVG_PACE}) — ${pacePass ? 'fast-paced ✓' : 'slow game ✗'}`
      : 'Game Pace — loading team data…',
    detail: avgPace != null
      ? pacePass
        ? `Both teams avg ${avgPace} possessions/game → high-scoring opportunity, favors OVER`
        : `Slow-paced game (${avgPace} poss) → fewer scoring chances, favors UNDER`
      : 'Fetching team pace data from NBA.com',
    pass:      pacePass === true,
    weight:    15,
    available: avgPace != null,
    pending:   avgPace == null,
    category:  'matchup',
  });

  const posCategory  = prop.pos_category || null;   // 'G', 'F', or 'C'
  const posDefRating = prop.pos_def_rating ?? oppDef; // position-specific, falls back to overall
  const hasPosData   = prop.pos_def_rating != null;
  const posLabel     = posCategory === 'G' ? 'Guards' : posCategory === 'F' ? 'Forwards' : posCategory === 'C' ? 'Centers' : 'Position';

  const weakDef  = posDefRating != null ? posDefRating > AVG_DEF_RATING : null;
  criteria.push({
    label: posDefRating != null
      ? `Def vs ${posLabel}: ${posDefRating.toFixed(1)} pts/100 — ${weakDef ? 'weak ✓' : 'elite ✗'}`
      : 'Opponent Defense — loading…',
    detail: posDefRating != null
      ? weakDef
        ? hasPosData
          ? `Opponent allows ${posDefRating.toFixed(1)} pts/100 to ${posLabel.toLowerCase()} (avg ${AVG_DEF_RATING}) — favorable positional matchup`
          : `Opponent allows ${posDefRating.toFixed(1)} pts/100 (league avg ${AVG_DEF_RATING}) — favorable matchup`
        : hasPosData
          ? `Opponent holds ${posLabel.toLowerCase()} to ${posDefRating.toFixed(1)} pts/100 — elite positional defense, tough matchup`
          : `Opponent holds teams to ${posDefRating.toFixed(1)} pts/100 — elite defense, tough matchup`
      : 'Fetching position-specific defensive efficiency from NBA.com',
    pass:      weakDef === true,
    weight:    15,
    available: posDefRating != null,
    pending:   posDefRating == null,
    category:  'matchup',
  });

  // ── 2. RECENT FORM (25%) ─────────────────────────────────────────────────
  criteria.push({
    label: l10 != null
      ? `L10 Avg: ${l10} vs Line ${line}`
      : 'L10 Average — loading game logs…',
    detail: l10 != null
      ? l10 > line
        ? `Averaging ${l10} over last 10 games — beats the line by +${(l10 - line).toFixed(1)}`
        : `Averaging ${l10} over last 10 — below line by ${(line - l10).toFixed(1)}`
      : 'Game log data loading in background',
    pass:      l10 != null && l10 > line,
    weight:    12,
    available: l10 != null,
    pending:   l10 == null,
    category:  'form',
  });

  criteria.push({
    label: l5 != null
      ? `L5 Avg: ${l5} vs Line ${line}`
      : 'L5 Average — loading…',
    detail: l5 != null
      ? l5 > line
        ? `Recent form is hot — L5 avg ${l5} beats the line`
        : `Recent cold streak — L5 avg ${l5} below line`
      : 'Game log data loading in background',
    pass:      l5 != null && l5 > line,
    weight:    8,
    available: l5 != null,
    pending:   l5 == null,
    category:  'form',
  });

  criteria.push({
    label: hit != null
      ? `Hit Rate: ${hit}% (need ≥ 60%)`
      : 'Hit Rate — loading…',
    detail: hit != null
      ? hit >= 60
        ? `Cleared this line ${hit}% of last 10 games — highly consistent`
        : `Only ${hit}% hit rate over last 10 — inconsistent`
      : 'Game log data loading in background',
    pass:      hit != null && hit >= 60,
    weight:    5,
    available: hit != null,
    pending:   hit == null,
    category:  'form',
  });

  // ── 3b. SEASON STATS (lighter factor) ────────────────────────────────────
  const seasonAvg     = prop.season_avg;
  const seasonGames   = prop.season_games;
  const seasonHitRate = prop.season_hit_rate;

  criteria.push({
    label: seasonAvg != null
      ? `Season Avg: ${seasonAvg} vs Line ${line} (${seasonGames}G)`
      : 'Season Stats — loading…',
    detail: seasonAvg != null
      ? seasonAvg > line
        ? `Season average ${seasonAvg} over ${seasonGames} games clears the line — ${seasonHitRate}% season hit rate`
        : `Season average ${seasonAvg} over ${seasonGames} games is below the line — ${seasonHitRate}% season hit rate`
      : 'Season average loading',
    pass:      seasonAvg != null && seasonAvg > line,
    weight:    8,
    available: seasonAvg != null,
    pending:   seasonAvg == null,
    category:  'season',
  });

  // ── 4. INJURY / USAGE CONTEXT (25%) ──────────────────────────────────────
  if (injNote) {
    criteria.push({
      label: `Usage Boost: ${injNote}`,
      detail: `Key teammate is out → expect more shot attempts, more touches, higher usage rate — strong OVER signal`,
      pass:      true,
      weight:    25,
      available: true,
      category:  'usage',
    });
  } else {
    criteria.push({
      label: edge != null
        ? `Usage/Edge: ${edge > 0 ? '+' : ''}${edge}% model edge`
        : 'Usage Context: Normal rotation',
      detail: edge != null && edge > 0
        ? `Model projects +${edge}% above the line based on usage rate and recent trends — OVER`
        : edge != null && edge < 0
          ? `Model projects ${edge}% below the line — UNDER signal`
          : 'No major lineup changes reported — normal usage expected',
      pass:      edge != null ? edge > 0 : false,
      weight:    25,
      available: true,
      category:  'usage',
    });
  }

  // ── 4. BLOWOUT RISK / REST (20%) ─────────────────────────────────────────
  const absSpread   = spread != null ? Math.abs(spread) : null;
  const blowoutRisk = absSpread != null && absSpread >= 12;

  criteria.push({
    label: absSpread != null
      ? blowoutRisk
        ? `⚠ Blowout Risk: ${absSpread.toFixed(1)}-pt spread`
        : `Spread: ${spread > 0 ? '+' : ''}${spread.toFixed(1)} — competitive game`
      : 'Spread — no odds data yet',
    detail: absSpread != null
      ? blowoutRisk
        ? `${absSpread.toFixed(1)}-pt spread → stars likely sit in 4th quarter with reduced minutes — UNDER risk`
        : 'Competitive game expected — full 35–38 minutes likely, maximizes prop upside'
      : 'No live spread available — blowout risk unknown',
    pass:      absSpread == null ? true : !blowoutRisk,
    weight:    10,
    available: true,
    category:  'rest',
  });

  criteria.push({
    label: isB2B ? '😴 Back-to-Back: Fatigue risk' : 'Rest: Normal schedule',
    detail: isB2B
      ? 'Second game in two nights — shooting %, energy, and minutes typically drop on back-to-backs'
      : 'Normal rest — no schedule fatigue concerns',
    pass:      !isB2B,
    weight:    10,
    available: true,
    category:  'rest',
  });

  // ── Score ─────────────────────────────────────────────────────────────────
  const available     = criteria.filter(c => c.available);
  const passingWeight = available.filter(c => c.pass).reduce((s, c) => s + c.weight, 0);
  const totalWeight   = available.reduce((s, c) => s + c.weight, 0) || 100;
  const overScore     = passingWeight / totalWeight;

  const verdict    = overScore >= 0.5 ? 'OVER' : 'UNDER';
  const rawConf    = Math.round(52 + Math.abs(overScore - 0.5) * 92);
  const confidence = Math.min(98, rawConf);
  const passCount  = available.filter(c => c.pass).length;

  const hasRealData = l10 != null || oppDef != null;
  return {
    verdict, confidence, criteria, passCount,
    totalCriteria: criteria.length,
    dataQuality:   hasRealData ? 'full' : 'context',
  };
}

function gradeFromMarket(prop) {
  const overOdds  = prop.over_odds  ?? -110;
  const underOdds = prop.under_odds ?? -110;
  const rawOver   = impliedProbability(overOdds);
  const rawUnder  = impliedProbability(underOdds);
  const trueOver  = rawOver / (rawOver + rawUnder);

  const criteria = [
    {
      label:    `Market Implied OVER: ${(trueOver * 100).toFixed(0)}%`,
      detail:   `Sportsbooks price this at ${(trueOver * 100).toFixed(0)}% to go over — de-vigged from odds`,
      pass:     trueOver > 0.505,
      weight:   100,
      available: true,
      market:   true,
      category: 'market',
    },
    { label: 'Game Pace — loading team data…',         detail: 'Fetching pace from NBA.com',           pass: false, weight: 0, available: false, pending: true, category: 'matchup' },
    { label: 'Opponent Defense — loading…',            detail: 'Fetching defensive ratings',           pass: false, weight: 0, available: false, pending: true, category: 'matchup' },
    { label: 'L10 / L5 Game Averages — loading…',     detail: 'Game log data loading in background',  pass: false, weight: 0, available: false, pending: true, category: 'form' },
    { label: 'Season Stats — loading…',                detail: 'Season average loading',               pass: false, weight: 0, available: false, pending: true, category: 'season' },
    { label: 'Injury / Usage Context — loading…',     detail: 'Checking today\'s injury report',      pass: false, weight: 0, available: false, pending: true, category: 'usage' },
    { label: 'Blowout Risk / Rest — loading…',        detail: 'Fetching spread and schedule data',    pass: false, weight: 0, available: false, pending: true, category: 'rest' },
  ];

  const verdict    = trueOver >= 0.5 ? 'OVER' : 'UNDER';
  const confidence = Math.min(54, Math.round(50 + Math.abs(trueOver - 0.5) * 100));
  return { verdict, confidence, criteria, passCount: trueOver > 0.505 ? 1 : 0, totalCriteria: 6, dataQuality: 'market' };
}

/**
 * Composite ranking score — higher = more confident bet.
 * Props with real analytics always rank above market-only.
 */
export function rankScore(prop) {
  const grade   = gradeProp(prop);
  const base    = grade.dataQuality === 'full' ? 1000 : grade.dataQuality === 'context' ? 500 : 0;
  const confPts = Math.pow((grade.confidence - 50) / 48, 1.5) * 90;
  return base + confPts;
}

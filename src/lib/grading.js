/**
 * 4-Factor Grading Engine
 *
 * Weights (approx, normalized by available criteria):
 *   Recent Form          53  (L10 avg 25 + L5 avg 15 + hit rate 13)  ← dominant
 *   Season Stats          8  (season avg vs line)
 *   Matchup / Defense    20  (stat-specific opp defense 13 + pace 7)
 *   Injury / Usage       18  (injury boost) / 8 (edge only — no injury)
 *   Blowout Risk / Rest  12  (spread 6 + B2B 6)
 *
 * Game-level factors (pace, defense, spread, B2B) use continuous scores so a
 * marginal advantage (e.g. pace 98.6 vs avg 98.5) registers as near-neutral
 * rather than a full pass — preventing the whole game from pushing OVER.
 */

const AVG_DEF_RATING = 113.5;
const AVG_PACE       = 98.5;

// Stat-specific opponent league averages (2024-25 season)
const AVG_OPP_AST  = 25.3;  // assists allowed per game
const AVG_OPP_REB  = 44.3;  // rebounds allowed per game
const AVG_OPP_3PM  = 13.9;  // 3-pointers allowed per game

// Continuous [0,1] score for form criteria (avg vs line).
// Returns 0.5 when avg==line, smoothly approaches 1 as avg>>line and 0 as avg<<line.
function formScore(avg, line) {
  if (avg == null) return null;
  const scale = Math.max(avg, line, 1);
  return Math.max(0, Math.min(1, 0.5 + (avg - line) / scale));
}

// Continuous [0,1] score for stat-specific opponent defense.
// Higher opponent stat allowed = weaker defense = OVER favorable (score → 1).
// Scale = 25% of avg so the spread between worst/best teams moves confidence meaningfully.
function statDefScore(value, leagueAvg) {
  if (value == null || leagueAvg == null) return null;
  return Math.max(0, Math.min(1, 0.5 + (value - leagueAvg) / (leagueAvg * 0.25)));
}

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
  const line       = prop.line;
  const l10        = prop.avg_last_10;
  const l5         = prop.avg_last_5;
  const hit        = prop.hit_rate_last_10;
  const noData     = prop.data_unavailable === true;
  const pendingLabel = (loading, unavail) => noData ? unavail : loading;
  const pendingDetail = (loading, unavail) => noData ? unavail : loading;

  // Context fields
  const oppDef    = prop.opponent_def_rating;   // pts/100 — higher = weaker defense
  const oppPace   = prop.opponent_pace;
  const teamPace  = prop.player_team_pace;
  const spread    = prop.spread;                // from player team's perspective (+= favored)
  const isB2B        = prop.is_back_to_back ?? false;
  const injNote      = prop.injury_context;      // e.g. "LeBron James (Out)"
  const injCount     = prop.injury_count ?? 0;  // number of injured teammates
  const oppInjNote   = prop.opp_injury_context; // e.g. "Anthony Edwards (Out)"
  const oppInjCount  = prop.opp_injury_count ?? 0;
  const ownInjStatus = (prop.injury_status || '').toLowerCase(); // player's own status from odds API
  const isReturning  = ownInjStatus && !['', 'active', 'out'].includes(ownInjStatus); // questionable/probable/gtd/dtd
  const edge         = prop.edge;

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
    pass:            pacePass === true,
    continuousScore: avgPace != null ? formScore(avgPace, AVG_PACE) : null,
    weight:          7,
    available:       avgPace != null,
    pending:         avgPace == null,
    category:        'matchup',
  });

  const posCategory  = prop.pos_category || null;   // 'G', 'F', or 'C'
  const posDefRating = prop.pos_def_rating ?? oppDef;
  const hasPosData   = prop.pos_def_rating != null;
  const posLabel     = posCategory === 'G' ? 'Guards' : posCategory === 'F' ? 'Forwards' : posCategory === 'C' ? 'Centers' : 'Position';
  const propType     = prop.prop_type;

  // Choose the most relevant defensive metric for this specific prop type.
  // Points-based: use positional defensive rating (pts/100).
  // Assists: how many assists does this opponent allow per game?
  // Rebounds: how many rebounds allowed?
  // 3PM: how many 3s allowed?
  // Composites: pick the dominant non-points stat.
  const statSpecific = (() => {
    const astProps = ['assists', 'P+A', 'A+R'];
    const rebProps = ['rebounds', 'P+R'];
    const tpmProps = ['3PM'];
    if (astProps.includes(propType) && prop.opp_ast_pg != null) {
      return {
        value:     prop.opp_ast_pg,
        avg:       AVG_OPP_AST,
        statLabel: 'AST allowed',
        unitLabel: 'ast/game',
        posLabel:  posCategory === 'G' ? 'Guard assists' : posCategory === 'F' ? 'Forward assists' : 'Assists',
      };
    }
    if (rebProps.includes(propType) && prop.opp_reb_pg != null) {
      return {
        value:     prop.opp_reb_pg,
        avg:       AVG_OPP_REB,
        statLabel: 'REB allowed',
        unitLabel: 'reb/game',
        posLabel:  posCategory === 'C' ? 'Center rebounds' : posCategory === 'F' ? 'Forward rebounds' : 'Rebounds',
      };
    }
    if (tpmProps.includes(propType) && prop.opp_3pm_pg != null) {
      return {
        value:     prop.opp_3pm_pg,
        avg:       AVG_OPP_3PM,
        statLabel: '3PM allowed',
        unitLabel: '3pm/game',
        posLabel:  'Guard 3-pointers',
      };
    }
    return null;
  })();

  if (statSpecific) {
    const { value, avg, statLabel, unitLabel, posLabel: sl } = statSpecific;
    const weak = value > avg;
    criteria.push({
      label: `${sl}: opp allows ${value.toFixed(1)} ${unitLabel} (avg ${avg}) — ${weak ? 'weak ✓' : 'elite ✗'}`,
      detail: weak
        ? `Opponent allows ${value.toFixed(1)} ${unitLabel} (league avg ${avg}) — this defense struggles to limit ${sl.toLowerCase()}, favors OVER`
        : `Opponent holds ${sl.toLowerCase()} to ${value.toFixed(1)} ${unitLabel} (league avg ${avg}) — disciplined defense, favors UNDER`,
      pass:            weak,
      continuousScore: statDefScore(value, avg),
      weight:          13,
      available:       true,
      category:        'matchup',
    });
  } else {
    const weakDef = posDefRating != null ? posDefRating > AVG_DEF_RATING : null;
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
      pass:            weakDef === true,
      continuousScore: posDefRating != null ? statDefScore(posDefRating, AVG_DEF_RATING) : null,
      weight:          13,
      available:       posDefRating != null,
      pending:         posDefRating == null,
      category:        'matchup',
    });
  }

  // ── 2. RECENT FORM (25%) ─────────────────────────────────────────────────
  criteria.push({
    label: l10 != null
      ? `L10 Avg: ${l10} vs Line ${line}`
      : pendingLabel('L10 Average — loading game logs…', 'L10 Average — not available'),
    detail: l10 != null
      ? l10 > line
        ? `Averaging ${l10} over last 10 games — beats the line by +${(l10 - line).toFixed(1)}`
        : `Averaging ${l10} over last 10 — below line by ${(line - l10).toFixed(1)}`
      : pendingDetail('Game log data loading in background', 'Player not found in NBA stats — using market odds only'),
    pass:            l10 != null && l10 > line,
    continuousScore: formScore(l10, line),
    weight:          25,
    available:       l10 != null,
    pending:         l10 == null && !noData,
    category:        'form',
  });

  const expandedRoleNote = injNote ? ` (expanded role — ${injNote.replace(' (Out)', '')} out)` : '';
  criteria.push({
    label: l5 != null
      ? `L5 Avg: ${l5} vs Line ${line}${expandedRoleNote}`
      : pendingLabel('L5 Average — loading…', 'L5 Average — not available'),
    detail: l5 != null
      ? l5 > line
        ? `Recent form is hot — L5 avg ${l5} beats the line${injNote ? `. Recent games may reflect expanded role with ${injNote}` : ''}`
        : `Recent cold streak — L5 avg ${l5} below line${injNote ? `. Consider that recent games may reflect expanded role with ${injNote}` : ''}`
      : pendingDetail('Game log data loading in background', 'Player not found in NBA stats — using market odds only'),
    pass:            l5 != null && l5 > line,
    continuousScore: formScore(l5, line),
    weight:          15,
    available:       l5 != null,
    pending:         l5 == null && !noData,
    category:        'form',
  });

  criteria.push({
    label: hit != null
      ? `Hit Rate: ${hit}% (need ≥ 60%)`
      : pendingLabel('Hit Rate — loading…', 'Hit Rate — not available'),
    detail: hit != null
      ? hit >= 60
        ? `Cleared this line ${hit}% of last 10 games — highly consistent`
        : `Only ${hit}% hit rate over last 10 — inconsistent`
      : pendingDetail('Game log data loading in background', 'Player not found in NBA stats — using market odds only'),
    pass:            hit != null && hit >= 60,
    continuousScore: hit != null ? hit / 100 : null,
    weight:          13,
    available:       hit != null,
    pending:         hit == null && !noData,
    category:        'form',
  });

  // ── 3b. SEASON STATS (lighter factor) ────────────────────────────────────
  const seasonAvg     = prop.season_avg;
  const seasonGames   = prop.season_games;
  const seasonHitRate = prop.season_hit_rate;

  criteria.push({
    label: seasonAvg != null
      ? `Season Avg: ${seasonAvg} vs Line ${line} (${seasonGames}G)`
      : pendingLabel('Season Stats — loading…', 'Season Stats — not available'),
    detail: seasonAvg != null
      ? seasonAvg > line
        ? `Season average ${seasonAvg} over ${seasonGames} games clears the line — ${seasonHitRate}% season hit rate`
        : `Season average ${seasonAvg} over ${seasonGames} games is below the line — ${seasonHitRate}% season hit rate`
      : pendingDetail('Season average loading', 'Player not found in NBA stats — using market odds only'),
    pass:            seasonAvg != null && seasonAvg > line,
    continuousScore: formScore(seasonAvg, line),
    weight:          8,
    available:       seasonAvg != null,
    pending:         seasonAvg == null && !noData,
    category:        'season',
  });

  // ── 4. INJURY / USAGE CONTEXT ────────────────────────────────────────────
  if (injNote) {
    // Scale weight by number of injured teammates: 1 out → 15, 2 out → 20, 3+ out → 25
    const injWeight = injCount >= 3 ? 25 : injCount === 2 ? 20 : 15;
    criteria.push({
      label: `Usage Boost: ${injNote}`,
      detail: `${injCount > 1 ? `${injCount} key teammates are` : 'Key teammate is'} out → expect more shot attempts, more touches, higher usage rate — strong OVER signal`,
      pass:            true,
      continuousScore: 1.0,
      weight:          injWeight,
      available:       true,
      category:        'usage',
    });
  } else {
    // Edge = (avg_last_10 - line) — correlated with L10 criterion.
    // Use weight 8 (vs 25 before) so it doesn't double-count the L10 signal.
    // When no data: default to 0.5 (neutral) instead of 0 (false UNDER signal).
    const edgeScale = Math.max(Math.abs(l10 ?? l5 ?? seasonAvg ?? line ?? 1), 1);
    const edgeContinuousScore = edge != null
      ? Math.max(0, Math.min(1, 0.5 + edge / edgeScale))
      : 0.5;
    criteria.push({
      label: edge != null
        ? `Usage/Edge: ${edge > 0 ? '+' : ''}${edge}% model edge`
        : 'Usage Context: Normal rotation',
      detail: edge != null && edge > 0
        ? `Model projects +${edge}% above the line based on usage rate and recent trends — OVER`
        : edge != null && edge < 0
          ? `Model projects ${edge}% below the line — UNDER signal`
          : 'No major lineup changes reported — normal usage expected',
      pass:            edge != null ? edge > 0 : false,
      continuousScore: edgeContinuousScore,
      weight:          8,
      available:       true,
      category:        'usage',
    });
  }

  // ── 4. BLOWOUT RISK / REST (20%) ─────────────────────────────────────────
  const absSpread   = spread != null ? Math.abs(spread) : null;
  const blowoutRisk = absSpread != null && absSpread >= 12;

  // Continuous spread score: small spreads are near-neutral; large spreads signal
  // blowout risk (UNDER). A 0-pt spread = 0.62 (slight positive — full minutes likely).
  // A 12-pt spread = 0.12 (significant blowout risk). Beyond ~17 → 0.
  const spreadContinuousScore = absSpread != null
    ? Math.max(0, Math.min(1, 0.62 - absSpread / 20))
    : 0.5;
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
    pass:            absSpread == null ? true : !blowoutRisk,
    continuousScore: spreadContinuousScore,
    weight:          6,
    available:       true,
    category:        'rest',
  });

  criteria.push({
    label: isB2B ? '😴 Back-to-Back: Fatigue risk' : 'Rest: Normal schedule',
    detail: isB2B
      ? 'Second game in two nights — shooting %, energy, and minutes typically drop on back-to-backs'
      : 'Normal rest — no schedule fatigue concerns',
    pass:      !isB2B,
    weight:    6,
    available: true,
    category:  'rest',
  });

  // ── 5. RETURN FROM INJURY ───────────────────────────────────────────────
  if (isReturning) {
    const statusLabel = ownInjStatus.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    criteria.push({
      label:           `Injury Status: ${statusLabel}`,
      detail:          `Player is listed as ${statusLabel} — may play on a minutes restriction or be a late scratch, expect reduced production risk`,
      pass:            false,
      continuousScore: 0.28, // strong negative — significant UNDER risk
      weight:          14,
      available:       true,
      category:        'rest',
    });
  }

  // ── 6. OPPONENT INJURIES ────────────────────────────────────────────────
  if (oppInjNote) {
    // Scale weight by number of opponent players out: more absences = weaker defense
    const oppInjWeight = oppInjCount >= 3 ? 14 : oppInjCount === 2 ? 10 : 7;
    criteria.push({
      label: `Weakened Opponent: ${oppInjNote}`,
      detail: `${oppInjCount > 1 ? `${oppInjCount} key players are` : 'Key player is'} out for the opponent (${oppInjNote}) — reduced defensive depth and rotations, favors OVER`,
      pass:            true,
      continuousScore: 0.85,
      weight:          oppInjWeight,
      available:       true,
      category:        'matchup',
    });
  }

  // ── Score ─────────────────────────────────────────────────────────────────
  // Form/season/edge criteria use a continuous [0,1] score so confidence shifts
  // smoothly as the line changes instead of jumping at avg-crossover points.
  // Context criteria (pace, defense, spread, rest) remain binary pass/fail.
  const available   = criteria.filter(c => c.available);
  const totalWeight = available.reduce((s, c) => s + c.weight, 0) || 100;
  const overScore   = available.reduce((sum, c) => {
    const score = c.continuousScore != null ? c.continuousScore : (c.pass ? 1 : 0);
    return sum + score * c.weight;
  }, 0) / totalWeight;

  const rawConf    = Math.round(52 + Math.abs(overScore - 0.5) * 92);
  const confidence = Math.min(98, rawConf);
  const verdict    = confidence < 60 ? 'UNSAFE' : (overScore >= 0.5 ? 'OVER' : 'UNDER');
  const passCount  = available.filter(c => c.pass).length;

  const hasRealData = l10 != null || oppDef != null;
  return {
    verdict, confidence, criteria, passCount,
    lean:          overScore >= 0.5 ? 'OVER' : 'UNDER',
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
  return { verdict, confidence, criteria, passCount: trueOver > 0.505 ? 1 : 0, lean: verdict, totalCriteria: 6, dataQuality: 'market' };
}

/**
 * Ranking score — higher = more confident bet.
 * Applies same game-log normalization as the prop cards so ranking order
 * matches the AI confidence numbers shown on each card.
 * Props with full analytics (real game logs) always rank above market-only.
 */
export function rankScore(prop) {
  const logs = prop.last_10_games || [];
  let p = prop;
  if (logs.length > 0) {
    const hitCount = logs.filter(v => v > prop.line).length;
    const dynamicHitRate = Math.round(hitCount / logs.length * 100);
    const base = prop.projection ?? prop.avg_last_10 ?? null;
    const dynamicEdge = base != null ? Math.round((base - prop.line) * 100) / 100 : prop.edge;
    p = { ...prop, hit_rate_last_10: dynamicHitRate, edge: dynamicEdge };
  }
  const grade = gradeProp(p);
  const base  = grade.dataQuality === 'full' ? 1000 : grade.dataQuality === 'context' ? 500 : 0;
  return base + grade.confidence;
}

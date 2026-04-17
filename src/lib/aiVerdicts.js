/**
 * AI verdict engine — uses InvokeLLM to analyze each prop and return
 * a verdict: "OVER" | "UNDER" | "UNSAFE", a confidence %, and a short reason.
 * Results are cached in sessionStorage per player+prop+line to avoid re-fetching.
 */
import { base44 } from '@/api/base44Client';

const SESSION_KEY = 'locklab_ai_verdicts_v3'; // Bumped version to clear old cache

function getCachedVerdicts() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}'); } catch { return {}; }
}
function setCachedVerdicts(v) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(v)); } catch {}
}

export async function getAIVerdicts(props) {
  const cache = getCachedVerdicts();
  const toFetch = props.filter(p => {
    const key = `${p.player_name}__${p.prop_type}__${p.line}`;
    return !cache[key];
  });

  if (toFetch.length === 0) return cache;

  // Batch all props into one LLM call for efficiency
  const propSummaries = toFetch.map(p => ({
    id: `${p.player_name}__${p.prop_type}__${p.line}`,
    player: p.player_name,
    team: p.team,
    opponent: p.opponent,
    prop_type: p.prop_type,
    line: p.line,
    avg_last_5: p.avg_last_5,
    avg_last_10: p.avg_last_10,
    hit_rate_last_10: p.hit_rate_last_10,
    streak_info: p.streak_info,
    edge: p.edge,
    projection: p.projection,
    matchup_rating: p.matchup_rating,
    matchup_note: p.matchup_note,
    confidence_score: p.confidence_score,
    last_5_games: p.last_5_games,
  }));

  try {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert NBA player prop analyst. Analyze each player prop below and return a verdict.

For each prop, consider:
- Recent averages (last 5 and last 10 games) vs the line
- Hit rate over last 10 games
- Projection vs line (edge %)
- Streak info and momentum
- Matchup rating and opponent defense
- Consistency of last 5 game values

Return a verdict for each prop:
- "OVER" if you are confident the player will exceed the line (65%+ certainty)
- "UNDER" if you are confident the player will fall short of the line (65%+ certainty)  
- "UNSAFE" if the data is too close to call, inconsistent, or risky

Also return:
- ai_confidence: 0-100 integer representing your confidence in the pick
- reason: one concise sentence (max 15 words) explaining WHY

Props to analyze:
${JSON.stringify(propSummaries, null, 2)}`,
      response_json_schema: {
        type: 'object',
        properties: {
          verdicts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                verdict: { type: 'string', enum: ['OVER', 'UNDER', 'UNSAFE'] },
                ai_confidence: { type: 'number' },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
    });

    const updated = { ...cache };
    const verdicts = (result?.verdicts || []);
    console.log('AI verdicts response:', result, 'parsed verdicts:', verdicts);
    
    verdicts.forEach(v => {
      if (v?.id) {
        updated[v.id] = {
          verdict: v.verdict || 'UNSAFE',
          ai_confidence: v.ai_confidence || 50,
          reason: v.reason || 'Inconclusive data',
        };
      }
    });
    setCachedVerdicts(updated);
    return updated;
  } catch (e) {
    console.warn('AI verdicts failed:', e.message);
    return cache;
  }
}
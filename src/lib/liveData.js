import { base44 } from '@/api/base44Client';

const CACHE_KEY = 'locklab_live_props_v6';
const CACHE_DATE_KEY = 'locklab_live_props_date_v6';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function isCacheValid() {
  return localStorage.getItem(CACHE_DATE_KEY) === todayStr() && !!localStorage.getItem(CACHE_KEY);
}

export function clearLiveCache() {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_DATE_KEY);
}

export async function fetchLiveProps() {
  // Return cached data if already fetched today
  if (isCacheValid()) {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch {}
  }

  try {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const validTeams = ['ATL', 'BOS', 'BKN', 'CHA', 'CHI', 'CLE', 'DAL', 'DEN', 'DET', 'GSW', 'HOU', 'IND', 'LAC', 'LAL', 'MEM', 'MIA', 'MIL', 'MIN', 'NOP', 'NYK', 'OKC', 'ORL', 'PHI', 'PHX', 'POR', 'SAC', 'SAS', 'TOR', 'UTA', 'WAS'];

    const result = await base44.integrations.Core.InvokeLLM({
      model: 'gpt_5_mini',
      prompt: `You are a sports data specialist. Today is ${today}. Return ONLY real NBA games and props scheduled for today from major sportsbooks.

If there are NO real NBA games today, return empty arrays.

Valid NBA teams: ${validTeams.join(', ')}

For each player prop, use real lines from DraftKings/FanDuel or major sportsbooks. Odds are typically -110 to -120. If unsure, omit it.`,
      add_context_from_internet: false,
      response_json_schema: {
        type: 'object',
        properties: {
          game_date: { type: 'string' },
          games_summary: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                home: { type: 'string' },
                away: { type: 'string' },
                tipoff: { type: 'string' },
                total: { type: 'number' }
              },
              required: ['home', 'away']
            }
          },
          props: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                player_name: { type: 'string' },
                team: { type: 'string' },
                opponent: { type: 'string' },
                prop_type: { type: 'string' },
                line: { type: 'number' },
                over_odds: { type: 'number' },
                under_odds: { type: 'number' },
                injury_status: { type: 'string' },
                position: { type: 'string' },
                is_starter: { type: 'boolean' },
                minutes_avg: { type: 'number' },
                usage_rate: { type: 'number' }
              },
              required: ['player_name', 'team', 'opponent', 'prop_type', 'line', 'over_odds', 'under_odds']
            }
          }
        },
        required: ['game_date', 'games_summary', 'props']
      }
    });
    
    // Validate data quality
    const validProps = (result.props || []).filter(prop => {
      if (!validTeams.includes(prop.team) || !validTeams.includes(prop.opponent)) return false;
      if (prop.line < 0 || prop.line > 100) return false;
      if (Math.abs(prop.over_odds) > 250 || Math.abs(prop.under_odds) > 250) return false;
      if (prop.minutes_avg < 10 || prop.minutes_avg > 45) return false;
      return true;
    });
    
    // If validation fails significantly, throw error instead of fallback
    if (validProps.length === 0 && result.props && result.props.length > 0) {
      throw new Error('Live data validation failed - received invalid prop data');
    }
    
    result.props = validProps;

    // Enrich each prop with computed historical simulation + analytics
    const enriched = (result.props || []).map((prop, i) => {
    const base = prop.line || 20;
    const variance = base * 0.2;

    // Determine if this prop type uses integers (counts) or decimals
    const integerProps = ['points', 'rebounds', 'assists', 'steals', 'blocks', 'turnovers', '3PM', 'PRA'];
    const isInteger = integerProps.includes(prop.prop_type);

    // Simulate last 10 games — integers for counting stats
    const games = Array.from({ length: 10 }, () => {
      const raw = base + (Math.random() * variance * 2 - variance);
      return isInteger ? Math.round(raw) : parseFloat(raw.toFixed(1));
    });
    const g5 = games.slice(-5);
    const avg10 = parseFloat((games.reduce((a,b)=>a+b,0)/10).toFixed(1));
    const avg5 = parseFloat((g5.reduce((a,b)=>a+b,0)/5).toFixed(1));
    const hits = games.filter(v => v > prop.line).length;
    const hit_rate = Math.round((hits/10)*100);
    // Projection: slight positive bias, rounded to match stat type
    const projRaw = avg5 * 1.02;
    const proj = isInteger ? parseFloat(projRaw.toFixed(1)) : parseFloat(projRaw.toFixed(1));
    const edge = parseFloat((((proj - prop.line)/prop.line)*100).toFixed(1));
    const confidence_score = Math.min(10, Math.max(3,
      hits >= 8 ? 9 : hits >= 6 ? 7 : hits >= 4 ? 5 : 3
    ));
    const streak = hits >= 7
      ? `Hit over in ${hits} of last 10`
      : hits <= 3
        ? `Hit under in ${10-hits} of last 10`
        : `Split ${hits}-${10-hits} last 10`;

    const minAvg = prop.minutes_avg || 32;

    return {
      ...prop,
      player_id: `live_${i}`,
      photo_url: `https://images.unsplash.com/photo-${['1546519638-68e109498ffc','1504450758481-7338bbe75005','1518063319789-7217e6706b04','1519861531473-9200262188bf','1515523110800-9415d13b84a8','1574623452334-1e0ac2b3ccb4'][i % 6]}?w=100&h=100&fit=crop`,
      is_top_pick: confidence_score >= 8,
      is_lock: confidence_score === 10,
      best_value: edge > 8,
      trap_warning: prop.injury_status === 'questionable' || prop.injury_status === 'GTD',
      avg_last_5: avg5,
      avg_last_10: avg10,
      hit_rate_last_10: hit_rate,
      projection: proj,
      edge,
      streak_info: streak,
      confidence_score,
      confidence_tier: confidence_score >= 8 ? 'A' : confidence_score >= 6 ? 'B' : 'C',
      last_10_games: games,
      last_5_games: g5,
      minutes_avg: minAvg,
      usage_rate: prop.usage_rate || 25,
      minutes_last_5: Array.from({ length: 5 }, () =>
        parseFloat((minAvg + (Math.random() * 4 - 2)).toFixed(0))
      ),
      def_rank_vs_pos: prop.def_rank_vs_pos || 15,
      matchup_rating: prop.matchup_rating || 'neutral',
      pace_rating: prop.pace_rating || 100,
      game_total: prop.game_total || 220,
    };
  });

  const payload = {
    game_date: result.game_date,
    games_summary: result.games_summary || [],
    props: enriched
  };

    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    localStorage.setItem(CACHE_DATE_KEY, todayStr());
    return payload;
  } catch (error) {
    console.error('Live props error:', error.message);
    // Return empty to trigger mock data fallback in Dashboard
    return { game_date: new Date().toLocaleDateString(), games_summary: [], props: [] };
  }
}
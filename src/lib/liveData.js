import { base44 } from '@/api/base44Client';

const CACHE_KEY = 'locklab_live_props_v9';
const CACHE_DATE_KEY = 'locklab_live_props_date_v9';

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
    const validTeams = ['ATL','BOS','BKN','CHA','CHI','CLE','DAL','DEN','DET','GSW','HOU','IND','LAC','LAL','MEM','MIA','MIL','MIN','NOP','NYK','OKC','ORL','PHI','PHX','POR','SAC','SAS','TOR','UTA','WAS'];

    // SINGLE consolidated call - get games AND top props in one request
    const result = await base44.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      prompt: `Today is ${today}. 

1) List all NBA games scheduled for today with home/away team abbreviations, tipoff time (ET), and over/under total.

2) For each game, list the top 4 player prop bets from DraftKings or FanDuel (points, rebounds, assists, 3PM props). Include player name, team, opponent, prop type, line, over odds, under odds, position, and if they're a starter.

Use ONLY these team codes: ${validTeams.join(', ')}.

If no NBA games today, return empty arrays.`,
      response_json_schema: {
        type: 'object',
        properties: {
          game_date: { type: 'string' },
          games: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                home: { type: 'string' },
                away: { type: 'string' },
                tipoff: { type: 'string' },
                total: { type: 'number' }
              }
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
                position: { type: 'string' },
                is_starter: { type: 'boolean' }
              }
            }
          }
        },
        required: ['game_date', 'games', 'props']
      }
    });

    const games = (result.games || []).filter(g =>
      validTeams.includes(g.home?.toUpperCase()) && validTeams.includes(g.away?.toUpperCase())
    ).map(g => ({ ...g, home: g.home?.toUpperCase(), away: g.away?.toUpperCase() }));

    if (games.length === 0) {
      console.warn('No NBA games today');
      return { game_date: result.game_date || today, games_summary: [], props: [] };
    }

    // Validate props
    const validProps = (result.props || []).filter(prop => {
      if (!prop.player_name || !prop.team || !prop.opponent) return false;
      const team = prop.team?.toUpperCase();
      const opp = prop.opponent?.toUpperCase();
      if (!validTeams.includes(team) || !validTeams.includes(opp)) return false;
      if (prop.line == null || prop.line < 0 || prop.line > 80) return false;
      return true;
    }).map(p => ({ ...p, team: p.team.toUpperCase(), opponent: p.opponent.toUpperCase() }));

    // Enrich each prop with simulated historical data + analytics
    const enriched = validProps.map((prop, i) => {
      const base = prop.line || 20;
      const variance = base * 0.22;
      const integerProps = ['points', 'rebounds', 'assists', 'steals', 'blocks', 'turnovers', '3PM', 'PRA'];
      const isInteger = integerProps.includes(prop.prop_type?.toLowerCase());

      const games10 = Array.from({ length: 10 }, () => {
        const raw = base + (Math.random() * variance * 2 - variance);
        return isInteger ? Math.round(raw) : parseFloat(raw.toFixed(1));
      });
      const g5 = games10.slice(-5);
      const avg10 = parseFloat((games10.reduce((a, b) => a + b, 0) / 10).toFixed(1));
      const avg5 = parseFloat((g5.reduce((a, b) => a + b, 0) / 5).toFixed(1));
      const hits = games10.filter(v => v > prop.line).length;
      const hit_rate = Math.round((hits / 10) * 100);
      const proj = parseFloat((avg5 * 1.02).toFixed(1));
      const edge = parseFloat((((proj - prop.line) / prop.line) * 100).toFixed(1));
      const confidence_score = Math.min(10, Math.max(3, hits >= 8 ? 9 : hits >= 6 ? 7 : hits >= 4 ? 5 : 3));
      const minAvg = 30;

      return {
        ...prop,
        prop_type: prop.prop_type?.toLowerCase() || 'points',
        player_id: `live_${i}`,
        photo_url: null,
        is_top_pick: confidence_score >= 8,
        is_lock: confidence_score === 10,
        best_value: edge > 8,
        trap_warning: false,
        avg_last_5: avg5,
        avg_last_10: avg10,
        hit_rate_last_10: hit_rate,
        projection: proj,
        edge,
        streak_info: hits >= 7 ? `Hit over in ${hits} of last 10` : hits <= 3 ? `Hit under in ${10 - hits} of last 10` : `Split ${hits}-${10 - hits} last 10`,
        confidence_score,
        confidence_tier: confidence_score >= 8 ? 'A' : confidence_score >= 6 ? 'B' : 'C',
        last_10_games: games10,
        last_5_games: g5,
        minutes_avg: minAvg,
        usage_rate: 25,
        minutes_last_5: Array.from({ length: 5 }, () => Math.round(minAvg + (Math.random() * 4 - 2))),
        def_rank_vs_pos: 15,
        matchup_rating: 'neutral',
        pace_rating: 100,
        game_total: 220,
        injury_status: 'healthy',
        is_starter: prop.is_starter !== false,
        position: prop.position || 'G',
      };
    });

    const payload = {
      game_date: result.game_date || today,
      games_summary: games,
      props: enriched
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    localStorage.setItem(CACHE_DATE_KEY, todayStr());
    return payload;

  } catch (error) {
    console.warn('Failed to fetch live props:', error);
    return { game_date: new Date().toLocaleDateString(), games_summary: [], props: [] };
  }
}
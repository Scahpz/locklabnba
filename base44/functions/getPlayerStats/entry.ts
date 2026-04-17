import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const BALLDONTLIE_BASE = 'https://api.balldontlie.io/v1';

async function getBdlPlayerId(playerName, apiKey) {
  const url = `${BALLDONTLIE_BASE}/players?search=${encodeURIComponent(playerName)}`;
  const res = await fetch(url, {
    headers: { 'Authorization': apiKey }
  });
  if (!res.ok) throw new Error(`BallDontLie search error: ${res.status}`);
  const data = await res.json();
  if (!data.data || data.data.length === 0) return null;
  return data.data[0].id;
}

async function getBdlGameLogs(playerId, propType, apiKey) {
  const url = `${BALLDONTLIE_BASE}/games?player_ids[]=${playerId}&limit=100&sort=DESC`;
  const res = await fetch(url, {
    headers: { 'Authorization': apiKey }
  });
  if (!res.ok) throw new Error(`BallDontLie games error: ${res.status}`);
  const data = await res.json();
  if (!data.data || data.data.length === 0) return null;

  const games = data.data.slice(0, 10).reverse();

  return games.map(game => {
    const isHome = game.home_team.abbreviation === (game.home_team.id ? 'HOME' : 'AWAY');
    let value = 0;
    
    if (propType === 'PRA') {
      value = (game.pts || 0) + (game.reb || 0) + (game.ast || 0);
    } else if (propType === 'points') {
      value = game.pts || 0;
    } else if (propType === 'rebounds') {
      value = game.reb || 0;
    } else if (propType === 'assists') {
      value = game.ast || 0;
    } else if (propType === '3PM') {
      value = game.fg3m || 0;
    } else if (propType === 'steals') {
      value = game.stl || 0;
    } else if (propType === 'blocks') {
      value = game.blk || 0;
    } else if (propType === 'turnovers') {
      value = game.turnover || 0;
    }

    const oppTeam = isHome ? game.visitor_team.abbreviation : game.home_team.abbreviation;
    return {
      value: Number(value),
      opp: isHome ? `vs ${oppTeam}` : `@ ${oppTeam}`,
      isHome
    };
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { playerName, propType, line } = await req.json();
    const apiKey = Deno.env.get('BALLDONTLIE_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const playerId = await getBdlPlayerId(playerName, apiKey);
    if (!playerId) {
      return Response.json({ analytics: null });
    }

    const logs = await getBdlGameLogs(playerId, propType, apiKey);
    if (!logs || logs.length < 3) {
      return Response.json({ analytics: null });
    }

    const last10 = logs.slice(-10);
    const last5 = logs.slice(-5);
    const vals10 = last10.map(g => g.value);
    const vals5 = last5.map(g => g.value);

    const avg10 = Math.round(vals10.reduce((a, b) => a + b, 0) / vals10.length);
    const avg5 = Math.round(vals5.reduce((a, b) => a + b, 0) / vals5.length);
    const hits = vals10.filter(v => v > line).length;
    const hit_rate = Math.round((hits / vals10.length) * 100);
    const proj = Math.round(avg5 * 0.6 + avg10 * 0.4);
    const edge = parseFloat((((proj - line) / line) * 100).toFixed(1));

    let streak_info = '';
    if (hits >= 7) streak_info = `Hit over in ${hits} of last 10`;
    else if (hits <= 3) streak_info = `Hit under in ${10 - hits} of last 10`;
    else streak_info = `Split ${hits}-${10 - hits} last 10`;

    const analytics = {
      avg_last_5: avg5,
      avg_last_10: avg10,
      hit_rate_last_10: hit_rate,
      last_5_games: vals5,
      last_10_games: vals10,
      game_logs_last_10: last10.map(g => ({
        value: g.value,
        opp: String(g.opp),
        isHome: Boolean(g.isHome),
      })),
      projection: proj,
      edge,
      streak_info,
      confidence_score: Math.min(10, Math.max(3, hits >= 8 ? 9 : hits >= 6 ? 7 : hits >= 4 ? 5 : 3)),
      data_source: 'verified',
    };

    return Response.json({ analytics });
  } catch (error) {
    return Response.json({ error: error.message, analytics: null }, { status: 500 });
  }
});
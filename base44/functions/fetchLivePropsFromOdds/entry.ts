import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';
const BALLDONTLIE_BASE = 'https://api.balldontlie.io/v1';
const SPORT = 'basketball_nba';

const PROP_MARKETS = [
  'player_points',
  'player_rebounds',
  'player_assists',
  'player_threes',
  'player_points_rebounds_assists',
  'player_steals',
  'player_blocks',
].join(',');

const PROP_TYPE_MAP = {
  player_points: 'points',
  player_rebounds: 'rebounds',
  player_assists: 'assists',
  player_threes: '3PM',
  player_points_rebounds_assists: 'PRA',
  player_steals: 'steals',
  player_blocks: 'blocks',
};

const TEAM_NAME_TO_ABV = {
  'Atlanta Hawks': 'ATL', 'Boston Celtics': 'BOS', 'Brooklyn Nets': 'BKN',
  'Charlotte Hornets': 'CHA', 'Chicago Bulls': 'CHI', 'Cleveland Cavaliers': 'CLE',
  'Dallas Mavericks': 'DAL', 'Denver Nuggets': 'DEN', 'Detroit Pistons': 'DET',
  'Golden State Warriors': 'GSW', 'Houston Rockets': 'HOU', 'Indiana Pacers': 'IND',
  'Los Angeles Clippers': 'LAC', 'Los Angeles Lakers': 'LAL', 'Memphis Grizzlies': 'MEM',
  'Miami Heat': 'MIA', 'Milwaukee Bucks': 'MIL', 'Minnesota Timberwolves': 'MIN',
  'New Orleans Pelicans': 'NOP', 'New York Knicks': 'NYK', 'Oklahoma City Thunder': 'OKC',
  'Orlando Magic': 'ORL', 'Philadelphia 76ers': 'PHI', 'Phoenix Suns': 'PHX',
  'Portland Trail Blazers': 'POR', 'Sacramento Kings': 'SAC', 'San Antonio Spurs': 'SAS',
  'Toronto Raptors': 'TOR', 'Utah Jazz': 'UTA', 'Washington Wizards': 'WAS',
};

function toAbv(name) {
  return TEAM_NAME_TO_ABV[name] || name?.substring(0, 3).toUpperCase() || 'UNK';
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function getDateRange() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
  return [yesterday, today, tomorrow];
}

// Quick manual roster for common players (can expand as needed)
const PLAYER_TEAM_CACHE = {
  'LaMelo Ball': 'CHA',
  'Jalen Suggs': 'ORL',
  'Paolo Banchero': 'ORL',
  'Cole Anthony': 'ORL',
  'Franz Wagner': 'ORL',
  'P.J. Washington': 'CHA',
  'Gordon Hayward': 'CHA',
  'LiAngelo Ball': 'CHA',
  'Timothe Luwawu-Cabarrot': 'CHA',
  'Tre Mann': 'ORL',
  'Gary Harris': 'ORL',
  'Caleb Martin': 'CHA',
  'Mark Williams': 'CHA',
  'Nick Richards': 'CHA',
  'Ish Smith': 'CHA',
};

async function getPlayerTeam(playerName, apiKey) {
  try {
    // Check manual cache first (instant lookup)
    if (PLAYER_TEAM_CACHE[playerName]) {
      return PLAYER_TEAM_CACHE[playerName];
    }
    
    // Try BallDontLie
    const bdlRes = await fetch(`${BALLDONTLIE_BASE}/players?search=${encodeURIComponent(playerName)}`, 
      { headers: { 'Authorization': apiKey } });
    if (bdlRes.ok) {
      const data = await bdlRes.json();
      const team = data.data?.[0]?.team?.abbreviation;
      if (team) return team;
    }
    
    return null;
  } catch {
    return null;
  }
}

function parseBookOdds(eventOddsData, playerName, marketKey) {
  const books = [];
  (eventOddsData?.bookmakers || []).forEach(bm => {
    const market = bm.markets?.find(m => m.key === marketKey);
    if (!market) return;
    const over = market.outcomes?.find(o => o.name === 'Over' && o.description === playerName);
    const under = market.outcomes?.find(o => o.name === 'Under' && o.description === playerName);
    if (over || under) {
      books.push({
        key: bm.key,
        title: bm.title,
        line: over?.point ?? under?.point ?? null,
        over_odds: over?.price ?? null,
        under_odds: under?.price ?? null,
      });
    }
  });
  return books;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const apiKey = Deno.env.get('ODDS_API_KEY');

    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Get today's NBA events
    const eventsRes = await fetch(
      `${ODDS_API_BASE}/sports/${SPORT}/events?apiKey=${apiKey}&dateFormat=iso`
    );
    if (!eventsRes.ok) {
      throw new Error(`Events API error: ${eventsRes.status}`);
    }
    const events = await eventsRes.json();

    // Filter to today's games (check 3-day window for timezone differences)
    const today = todayStr();
    const dateRange = getDateRange();
    const todayEvents = events.filter(e => e.commence_time && dateRange.some(d => e.commence_time.startsWith(d)));

    if (todayEvents.length === 0) {
      return Response.json({ game_date: today, games_summary: [], props: [] });
    }

    // Fetch props for all today's games in parallel
    const propResults = await Promise.all(
      todayEvents.map(event =>
        fetch(
          `${ODDS_API_BASE}/sports/${SPORT}/events/${event.id}/odds?apiKey=${apiKey}&regions=us&markets=${PROP_MARKETS}&oddsFormat=american`
        ).then(r => r.ok ? r.json() : null).catch(() => null)
      )
    );

    // Build games summary
    const games_summary = todayEvents.map(e => ({
      home: toAbv(e.home_team),
      away: toAbv(e.away_team),
      tipoff: new Date(e.commence_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET',
      total: null,
    }));

    // Parse props
    const propMap = {};

    propResults.forEach((eventOdds, idx) => {
      if (!eventOdds) return;
      const event = todayEvents[idx];
      const homeAbv = toAbv(event.home_team);
      const awayAbv = toAbv(event.away_team);

      const primaryBm = eventOdds.bookmakers?.find(b => b.key === 'draftkings')
        || eventOdds.bookmakers?.find(b => b.key === 'fanduel')
        || eventOdds.bookmakers?.[0];
      if (!primaryBm) return;

      primaryBm.markets?.forEach(market => {
        const propType = PROP_TYPE_MAP[market.key];
        if (!propType) return;

        const byPlayer = {};
        market.outcomes?.forEach(outcome => {
          const name = outcome.description;
          if (!name) return;
          if (!byPlayer[name]) byPlayer[name] = {};
          if (outcome.name === 'Over') {
            byPlayer[name].over_odds = outcome.price;
            byPlayer[name].line = outcome.point;
          } else if (outcome.name === 'Under') {
            byPlayer[name].under_odds = outcome.price;
            byPlayer[name].line = byPlayer[name].line ?? outcome.point;
          }
        });

        Object.entries(byPlayer).forEach(([player_name, data]) => {
          if (data.line == null) return;
          const mapKey = `${player_name}__${propType}__${homeAbv}@${awayAbv}`;
          if (propMap[mapKey]) return;

          const allBooks = parseBookOdds(eventOdds, player_name, market.key);

          propMap[mapKey] = {
            player_name,
            prop_type: propType,
            line: data.line,
            over_odds: data.over_odds ?? -110,
            under_odds: data.under_odds ?? -110,
            bookmaker: primaryBm.title,
            all_books: allBooks,
            home: homeAbv,
            away: awayAbv,
            market_key: market.key,
          };
        });
      });
    });

    const allRawProps = Object.values(propMap);
    const bdlApiKey = Deno.env.get('BALLDONTLIE_API_KEY');
    
    // Fetch player teams in parallel
    if (bdlApiKey) {
      const teamResults = await Promise.all(
        allRawProps.map(p => getPlayerTeam(p.player_name, bdlApiKey))
      );
      allRawProps.forEach((p, i) => {
        const playerTeam = teamResults[i];
        p.player_team = playerTeam || null;
      });
    }
    
    return Response.json({ game_date: today, games_summary, rawProps: allRawProps });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
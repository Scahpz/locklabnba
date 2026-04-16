import { getStoredApiKey } from '@/lib/liveData';

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';
const SPORT = 'basketball_nba';

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

export function toAbv(name) {
  return TEAM_NAME_TO_ABV[name] || name?.substring(0, 3).toUpperCase() || '???';
}

export function fmtOdds(n) {
  if (n == null) return '—';
  return n > 0 ? `+${n}` : `${n}`;
}

/**
 * Fetch upcoming NBA games with moneyline, spread, and totals from multiple bookmakers.
 * Uses the h2h, spreads, totals markets.
 */
export async function fetchGameOdds() {
  const apiKey = getStoredApiKey();

  const res = await fetch(
    `${ODDS_API_BASE}/sports/${SPORT}/odds?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&dateFormat=iso`
  );

  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid API key');
    throw new Error(`Odds API error: ${res.status}`);
  }

  const data = await res.json();

  const PREFERRED_BOOKS = ['draftkings', 'fanduel', 'betmgm', 'caesars', 'pointsbet'];

  const games = data.map(event => {
    const home = event.home_team;
    const away = event.away_team;
    const homeAbv = toAbv(home);
    const awayAbv = toAbv(away);

    // Best bookmaker — prefer known ones
    const bm = event.bookmakers?.find(b => PREFERRED_BOOKS.includes(b.key)) || event.bookmakers?.[0];

    let moneyline = null;
    let spread = null;
    let total = null;

    if (bm) {
      const h2h = bm.markets?.find(m => m.key === 'h2h');
      const spreadsM = bm.markets?.find(m => m.key === 'spreads');
      const totalsM = bm.markets?.find(m => m.key === 'totals');

      if (h2h) {
        const homeML = h2h.outcomes?.find(o => o.name === home);
        const awayML = h2h.outcomes?.find(o => o.name === away);
        moneyline = {
          home: homeML?.price ?? null,
          away: awayML?.price ?? null,
          bookmaker: bm.title,
        };
      }

      if (spreadsM) {
        const homeSpread = spreadsM.outcomes?.find(o => o.name === home);
        const awaySpread = spreadsM.outcomes?.find(o => o.name === away);
        spread = {
          home: homeSpread?.point ?? null,
          homeOdds: homeSpread?.price ?? null,
          away: awaySpread?.point ?? null,
          awayOdds: awaySpread?.price ?? null,
          bookmaker: bm.title,
        };
      }

      if (totalsM) {
        const over = totalsM.outcomes?.find(o => o.name === 'Over');
        const under = totalsM.outcomes?.find(o => o.name === 'Under');
        total = {
          line: over?.point ?? under?.point ?? null,
          overOdds: over?.price ?? null,
          underOdds: under?.price ?? null,
          bookmaker: bm.title,
        };
      }
    }

    // Collect all available bookmakers for line shopping
    const allBooks = (event.bookmakers || []).map(b => {
      const h2h = b.markets?.find(m => m.key === 'h2h');
      const sp = b.markets?.find(m => m.key === 'spreads');
      const tot = b.markets?.find(m => m.key === 'totals');
      return {
        key: b.key,
        title: b.title,
        ml_home: h2h?.outcomes?.find(o => o.name === home)?.price ?? null,
        ml_away: h2h?.outcomes?.find(o => o.name === away)?.price ?? null,
        spread_home: sp?.outcomes?.find(o => o.name === home)?.point ?? null,
        spread_home_odds: sp?.outcomes?.find(o => o.name === home)?.price ?? null,
        total_line: (tot?.outcomes?.[0]?.point) ?? null,
        total_over: tot?.outcomes?.find(o => o.name === 'Over')?.price ?? null,
        total_under: tot?.outcomes?.find(o => o.name === 'Under')?.price ?? null,
      };
    });

    return {
      id: event.id,
      home,
      away,
      homeAbv,
      awayAbv,
      commence_time: event.commence_time,
      moneyline,
      spread,
      total,
      allBooks,
    };
  });

  // Sort by commence time
  games.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));

  return { games, lastUpdated: new Date() };
}
import { getAllProps } from './mockData';
import { base44 } from '@/api/base44Client';

let cachedData = null;
let cacheDate = null;

export async function fetchLiveProps() {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  // Return cached data if it's still today
  if (cachedData && cacheDate === today) {
    return cachedData;
  }

  try {
    // Fetch today's NBA games and props with specific context
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Today is ${today}. Get the ACTUAL current NBA player props for TODAY's games. Search for real betting lines and odds.
Return a JSON object with:
{
  "games": [{"away": "TEAM", "home": "TEAM", "tipoff": "TIME ET", "total": NUMBER}],
  "props": [{"player_name": "NAME", "team": "TEAM", "opponent": "OPP", "prop_type": "points|rebounds|assists|PRA|3PM", "line": NUMBER, "over_odds": NUMBER, "under_odds": NUMBER, "projection": NUMBER, "edge": NUMBER, "confidence_score": NUMBER, "confidence_tier": "A|B|C", "hit_rate_last_10": NUMBER, "avg_last_5": NUMBER, "avg_last_10": NUMBER}]
}
Include 5-10 top props per game with CURRENT REAL LINES and REAL ODDS from today's games. Use actual sportsbooks data.`,
      response_json_schema: {
        type: "object",
        properties: {
          games: { type: "array" },
          props: { type: "array" }
        }
      },
      add_context_from_internet: true
    });

    if (result?.games?.length > 0 && result?.props?.length > 0) {
      cachedData = {
        game_date: today,
        games_summary: result.games,
        props: result.props
      };
      cacheDate = today;
      return cachedData;
    }
  } catch (error) {
    console.warn('Failed to fetch live data:', error);
  }

  // Fallback to mock data
  const allProps = getAllProps();
  return {
    game_date: today,
    games_summary: [
      { away: 'GSW', home: 'LAC', tipoff: '10:30 PM ET', total: 225.0 },
      { away: 'ORL', home: 'PHI', tipoff: '7:30 PM ET', total: 220.0 },
    ],
    props: allProps
  };
}
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
    // Fetch today's NBA games and props
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Today's date is ${today}. Get TODAY's NBA games and player props. Return ONLY a JSON object with:
{
  "games": [{"away": "GSW", "home": "LAC", "tipoff": "10:30 PM ET", "total": 225.5}],
  "props": [{"player_name": "Stephen Curry", "team": "GSW", "opponent": "LAC", "prop_type": "points", "line": 28.5, "over_odds": -110, "under_odds": -110, "projection": 29, "edge": 2}]
}
Include key NBA players from today's games with realistic lines and edges. Make sure prop lines are realistic for 2026.`,
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
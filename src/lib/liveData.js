import { getAllProps } from './mockData';

export async function fetchLiveProps() {
  // Return mock props immediately (fast)
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const allProps = getAllProps();
  
  return {
    game_date: today,
    games_summary: [
      { away: 'ATL', home: 'MIA', tipoff: '7:30 PM ET', total: 228.5 },
      { away: 'BOS', home: 'NYK', tipoff: '7:00 PM ET', total: 222.0 },
      { away: 'BKN', home: 'PHI', tipoff: '7:30 PM ET', total: 220.0 },
      { away: 'DEN', home: 'LAL', tipoff: '10:00 PM ET', total: 224.0 },
      { away: 'GSW', home: 'LAC', tipoff: '10:30 PM ET', total: 225.0 },
      { away: 'HOU', home: 'MEM', tipoff: '8:00 PM ET', total: 226.5 },
      { away: 'DAL', home: 'OKC', tipoff: '8:30 PM ET', total: 226.0 },
    ],
    props: allProps
  };
}
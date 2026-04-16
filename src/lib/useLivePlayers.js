import { useState, useEffect, useMemo } from 'react';
import { mockPlayers } from '@/lib/mockData';
import { fetchLiveProps } from '@/lib/liveData';

/**
 * Converts the flat live props array into a players-like structure
 * grouped by player_name, matching the shape used across the app.
 */
function buildPlayersFromLiveProps(liveProps) {
  const playerMap = {};
  liveProps.forEach(prop => {
    const key = prop.player_name;
    if (!playerMap[key]) {
      playerMap[key] = {
        id: `live_${key.replace(/\s+/g, '_').toLowerCase()}`,
        player_name: prop.player_name,
        team: prop.team,
        opponent: prop.opponent,
        position: prop.position || '',
        photo_url: prop.photo_url || '',
        is_starter: prop.is_starter ?? true,
        injury_status: prop.injury_status || 'healthy',
        injury_note: prop.injury_note || '',
        props: [],
      };
    }
    // Attach the prop (skip if player is out)
    if (prop.injury_status !== 'out') {
      playerMap[key].props.push(prop);
    }
  });

  return Object.values(playerMap).filter(p => p.props.length > 0);
}

/**
 * Hook that returns live players (from today's fetched props) or falls back to mock data.
 * Returns { players, isLive, loading }
 */
export function useLivePlayers() {
  const [liveProps, setLiveProps] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchLiveProps();
        if (data?.props?.length > 0) {
          setLiveProps(data.props);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const players = useMemo(() => {
    if (liveProps) return buildPlayersFromLiveProps(liveProps);
    return [];
  }, [liveProps]);

  const isLive = !!liveProps;

  return { players, isLive, loading };
}
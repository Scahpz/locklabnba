import { base44 } from '@/api/base44Client';



/**
 * Get real analytics for a player prop using BallDontLie backend function.
 * Returns { avg_last_5, avg_last_10, hit_rate_last_10, last_5_games, last_10_games,
 *           game_logs_last_10, projection, edge, streak_info, confidence_score, data_source }
 */
export async function getRealPlayerAnalytics(playerName, propType, line) {
  try {
    const response = await base44.functions.invoke('getPlayerStats', {
      playerName,
      propType,
      line,
    });

    return response.data?.analytics || null;
  } catch (e) {
    console.warn(`BallDontLie fetch failed for ${playerName}:`, e.message);
    return null;
  }
}

// Keep these exports for compatibility
export async function getBallDontLiePlayerId() { return null; }
export function getCachedPlayerTeam() { return null; }
export async function prefetchPlayerTeams() {}
export async function getPlayerGameLogs() { return null; }
export async function getPlayerSeasonAverages() { return null; }
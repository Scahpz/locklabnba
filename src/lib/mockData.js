// Per-game log data (last 10 games, most recent last)
export const mockGameLogs = {
  p1: [
    { date: '3/10', opp: 'MEM' }, { date: '3/12', opp: 'HOU' }, { date: '3/14', opp: 'SAS' },
    { date: '3/15', opp: 'NOP' }, { date: '3/17', opp: 'UTA' }, { date: '3/18', opp: 'OKC' },
    { date: '3/19', opp: 'DEN' }, { date: '3/20', opp: 'PHX' }, { date: '3/21', opp: 'GSW' }, { date: '3/22', opp: 'LAL' },
  ],
  p2: [
    { date: '3/10', opp: 'CLE' }, { date: '3/12', opp: 'NYK' }, { date: '3/14', opp: 'PHI' },
    { date: '3/15', opp: 'CHI' }, { date: '3/17', opp: 'IND' }, { date: '3/18', opp: 'TOR' },
    { date: '3/19', opp: 'BKN' }, { date: '3/20', opp: 'DET' }, { date: '3/21', opp: 'ORL' }, { date: '3/22', opp: 'MIL' },
  ],
  p3: [
    { date: '3/10', opp: 'OKC' }, { date: '3/12', opp: 'MIN' }, { date: '3/14', opp: 'UTA' },
    { date: '3/15', opp: 'LAC' }, { date: '3/17', opp: 'SAC' }, { date: '3/18', opp: 'POR' },
    { date: '3/19', opp: 'GSW' }, { date: '3/20', opp: 'LAL' }, { date: '3/21', opp: 'MEM' }, { date: '3/22', opp: 'PHX' },
  ],
  p4: [
    { date: '3/10', opp: 'POR' }, { date: '3/12', opp: 'SAC' }, { date: '3/14', opp: 'LAC' },
    { date: '3/15', opp: 'NOP' }, { date: '3/17', opp: 'MEM' }, { date: '3/18', opp: 'DEN' },
    { date: '3/19', opp: 'OKC' }, { date: '3/20', opp: 'PHX' }, { date: '3/21', opp: 'LAL' }, { date: '3/22', opp: 'GSW' },
  ],
  p5: [
    { date: '3/10', opp: 'ATL' }, { date: '3/12', opp: 'MIA' }, { date: '3/14', opp: 'ORL' },
    { date: '3/15', opp: 'WAS' }, { date: '3/17', opp: 'DET' }, { date: '3/18', opp: 'BKN' },
    { date: '3/19', opp: 'NYK' }, { date: '3/20', opp: 'PHI' }, { date: '3/21', opp: 'MIL' }, { date: '3/22', opp: 'CHA' },
  ],
  p6: [
    { date: '3/10', opp: 'UTA' }, { date: '3/12', opp: 'POR' }, { date: '3/14', opp: 'LAC' },
    { date: '3/15', opp: 'GSW' }, { date: '3/17', opp: 'HOU' }, { date: '3/18', opp: 'MEM' },
    { date: '3/19', opp: 'NOP' }, { date: '3/20', opp: 'DAL' }, { date: '3/21', opp: 'PHX' }, { date: '3/22', opp: 'SAC' },
  ],
};

// Mock NBA player props data for demonstration
export const mockPlayers = [
  {
    id: 'p1', player_name: 'Luka Doncic', team: 'DAL', opponent: 'LAL', position: 'PG',
    photo_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'healthy',
    props: [
      { prop_type: 'points', line: 32.5, over_odds: -115, under_odds: -105, projection: 35.2, edge: 8.3, hit_rate_last_10: 70, avg_last_5: 34.8, avg_last_10: 33.6, streak_info: 'Hit over in 7 of last 10', confidence_score: 9, confidence_tier: 'A', is_top_pick: true, is_lock: true, best_value: true, trap_warning: false, last_5_games: [38, 29, 42, 31, 34], last_10_games: [38, 29, 42, 31, 34, 36, 27, 33, 40, 26], matchup_rating: 'favorable', matchup_note: 'LAL allows 4th most points to PGs', def_rank_vs_pos: 27, minutes_avg: 36.2, usage_rate: 34.5, minutes_last_5: [37, 35, 38, 36, 34], pace_rating: 102.3, game_total: 228.5 },
      { prop_type: 'assists', line: 8.5, over_odds: -110, under_odds: -110, projection: 9.4, edge: 10.6, hit_rate_last_10: 80, avg_last_5: 9.6, avg_last_10: 9.2, streak_info: 'Hit over in 8 of last 10', confidence_score: 8, confidence_tier: 'A', is_top_pick: true, best_value: false, trap_warning: false, last_5_games: [11, 8, 12, 7, 10], last_10_games: [11, 8, 12, 7, 10, 9, 8, 11, 9, 7], matchup_rating: 'elite', matchup_note: 'LAL allows most assists to PGs', def_rank_vs_pos: 30, minutes_avg: 36.2, usage_rate: 34.5, minutes_last_5: [37, 35, 38, 36, 34], pace_rating: 102.3, game_total: 228.5 },
    ]
  },
  {
    id: 'p2', player_name: 'Jayson Tatum', team: 'BOS', opponent: 'MIL', position: 'SF',
    photo_url: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'healthy',
    props: [
      { prop_type: 'points', line: 28.5, over_odds: -110, under_odds: -110, projection: 30.1, edge: 5.6, hit_rate_last_10: 60, avg_last_5: 29.4, avg_last_10: 28.8, streak_info: 'Hit over in 6 of last 10', confidence_score: 7, confidence_tier: 'B', is_top_pick: false, best_value: false, trap_warning: false, last_5_games: [32, 25, 34, 28, 28], last_10_games: [32, 25, 34, 28, 28, 30, 24, 31, 29, 27], matchup_rating: 'neutral', matchup_note: 'MIL average vs SFs', def_rank_vs_pos: 15, minutes_avg: 35.8, usage_rate: 30.2, minutes_last_5: [36, 34, 37, 35, 37], pace_rating: 98.7, game_total: 222.0 },
      { prop_type: 'rebounds', line: 8.5, over_odds: -105, under_odds: -115, projection: 9.0, edge: 5.9, hit_rate_last_10: 70, avg_last_5: 9.2, avg_last_10: 8.9, streak_info: 'Hit over in 7 of last 10', confidence_score: 7, confidence_tier: 'B', is_top_pick: false, best_value: true, trap_warning: false, last_5_games: [10, 8, 11, 7, 10], last_10_games: [10, 8, 11, 7, 10, 9, 7, 10, 8, 9], matchup_rating: 'favorable', matchup_note: 'MIL poor on defensive boards', def_rank_vs_pos: 25, minutes_avg: 35.8, usage_rate: 30.2, minutes_last_5: [36, 34, 37, 35, 37], pace_rating: 98.7, game_total: 222.0 },
    ]
  },
  {
    id: 'p3', player_name: 'Nikola Jokic', team: 'DEN', opponent: 'PHX', position: 'C',
    photo_url: 'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'healthy',
    props: [
      { prop_type: 'PRA', line: 48.5, over_odds: -120, under_odds: +100, projection: 52.3, edge: 7.8, hit_rate_last_10: 80, avg_last_5: 51.8, avg_last_10: 50.4, streak_info: 'Hit over in 8 of last 10', confidence_score: 9, confidence_tier: 'A', is_top_pick: true, is_lock: true, best_value: true, trap_warning: false, last_5_games: [55, 48, 53, 50, 53], last_10_games: [55, 48, 53, 50, 53, 49, 46, 52, 51, 47], matchup_rating: 'elite', matchup_note: 'PHX worst vs Centers in PRA', def_rank_vs_pos: 29, minutes_avg: 34.5, usage_rate: 31.8, minutes_last_5: [35, 33, 36, 34, 34], pace_rating: 100.5, game_total: 230.0 },
      { prop_type: 'assists', line: 9.5, over_odds: -110, under_odds: -110, projection: 10.8, edge: 13.7, hit_rate_last_10: 90, avg_last_5: 11.2, avg_last_10: 10.6, streak_info: 'Hit over in 9 of last 10', confidence_score: 10, confidence_tier: 'A', is_top_pick: true, is_lock: true, best_value: true, trap_warning: false, last_5_games: [12, 10, 13, 9, 12], last_10_games: [12, 10, 13, 9, 12, 11, 10, 12, 8, 9], matchup_rating: 'elite', matchup_note: 'PHX allows most assists to Centers', def_rank_vs_pos: 30, minutes_avg: 34.5, usage_rate: 31.8, minutes_last_5: [35, 33, 36, 34, 34], pace_rating: 100.5, game_total: 230.0 },
    ]
  },
  {
    id: 'p4', player_name: 'Anthony Edwards', team: 'MIN', opponent: 'GSW', position: 'SG',
    photo_url: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'questionable', injury_note: 'Ankle - Probable',
    props: [
      { prop_type: 'points', line: 26.5, over_odds: -110, under_odds: -110, projection: 28.3, edge: 6.8, hit_rate_last_10: 60, avg_last_5: 27.6, avg_last_10: 27.1, streak_info: 'Hit over in 6 of last 10', confidence_score: 6, confidence_tier: 'B', is_top_pick: false, best_value: false, trap_warning: true, last_5_games: [30, 22, 32, 26, 28], last_10_games: [30, 22, 32, 26, 28, 25, 24, 31, 29, 24], matchup_rating: 'tough', matchup_note: 'GSW elite perimeter defense', def_rank_vs_pos: 5, minutes_avg: 35.0, usage_rate: 32.1, minutes_last_5: [36, 34, 37, 33, 35], pace_rating: 99.2, game_total: 218.5 },
      { prop_type: '3PM', line: 3.5, over_odds: +105, under_odds: -125, projection: 3.8, edge: 8.6, hit_rate_last_10: 50, avg_last_5: 3.6, avg_last_10: 3.4, streak_info: 'Hit over in 5 of last 10', confidence_score: 5, confidence_tier: 'C', is_top_pick: false, best_value: false, trap_warning: true, last_5_games: [4, 2, 5, 3, 4], last_10_games: [4, 2, 5, 3, 4, 3, 2, 4, 3, 4], matchup_rating: 'tough', matchup_note: 'GSW best at defending 3pt shooters', def_rank_vs_pos: 2, minutes_avg: 35.0, usage_rate: 32.1, minutes_last_5: [36, 34, 37, 33, 35], pace_rating: 99.2, game_total: 218.5 },
    ]
  },
  {
    id: 'p5', player_name: 'Tyrese Haliburton', team: 'IND', opponent: 'CHA', position: 'PG',
    photo_url: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'healthy',
    props: [
      { prop_type: 'assists', line: 10.5, over_odds: -105, under_odds: -115, projection: 11.8, edge: 12.4, hit_rate_last_10: 80, avg_last_5: 12.0, avg_last_10: 11.4, streak_info: 'Hit over in 8 of last 10', confidence_score: 9, confidence_tier: 'A', is_top_pick: true, best_value: true, trap_warning: false, last_5_games: [13, 11, 14, 10, 12], last_10_games: [13, 11, 14, 10, 12, 11, 10, 13, 9, 11], matchup_rating: 'elite', matchup_note: 'CHA worst defense vs PG assists', def_rank_vs_pos: 30, minutes_avg: 34.0, usage_rate: 28.5, minutes_last_5: [35, 33, 34, 34, 34], pace_rating: 104.8, game_total: 234.5 },
      { prop_type: 'points', line: 20.5, over_odds: -110, under_odds: -110, projection: 21.4, edge: 4.4, hit_rate_last_10: 60, avg_last_5: 21.2, avg_last_10: 20.8, streak_info: 'Hit over in 6 of last 10', confidence_score: 6, confidence_tier: 'B', is_top_pick: false, best_value: false, trap_warning: false, last_5_games: [22, 18, 24, 20, 22], last_10_games: [22, 18, 24, 20, 22, 19, 17, 23, 21, 22], matchup_rating: 'favorable', matchup_note: 'CHA allows high scoring', def_rank_vs_pos: 26, minutes_avg: 34.0, usage_rate: 28.5, minutes_last_5: [35, 33, 34, 34, 34], pace_rating: 104.8, game_total: 234.5 },
    ]
  },
  {
    id: 'p6', player_name: 'Shai Gilgeous-Alexander', team: 'OKC', opponent: 'SAC', position: 'SG',
    photo_url: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'healthy',
    props: [
      { prop_type: 'points', line: 31.5, over_odds: -110, under_odds: -110, projection: 33.4, edge: 6.0, hit_rate_last_10: 70, avg_last_5: 33.0, avg_last_10: 32.2, streak_info: 'Hit over in 7 of last 10', confidence_score: 8, confidence_tier: 'A', is_top_pick: true, best_value: false, trap_warning: false, last_5_games: [35, 30, 36, 32, 32], last_10_games: [35, 30, 36, 32, 32, 33, 28, 34, 31, 31], matchup_rating: 'favorable', matchup_note: 'SAC allow 6th most pts to SGs', def_rank_vs_pos: 25, minutes_avg: 34.8, usage_rate: 33.2, minutes_last_5: [35, 34, 36, 34, 35], pace_rating: 101.4, game_total: 226.0 },
    ]
  },
];

export const mockAlerts = [
  { id: 'a1', title: 'Anthony Edwards questionable', description: 'Ankle injury - listed as probable. Monitor minutes.', type: 'injury', player_name: 'Anthony Edwards', team: 'MIN', impact: 'negative', is_read: false },
  { id: 'a2', title: 'Line Movement: Jokic PRA', description: 'Line moved from 47.5 to 48.5. Sharp action on over.', type: 'line_movement', player_name: 'Nikola Jokic', team: 'DEN', impact: 'positive', is_read: false },
  { id: 'a3', title: 'Best Bets Posted', description: 'Today\'s top AI picks are live. 3 Tier A selections.', type: 'best_bet', impact: 'positive', is_read: true },
  { id: 'a4', title: 'Karl-Anthony Towns OUT', description: 'KAT ruled out. Jalen Brunson usage expected to spike.', type: 'injury', player_name: 'Karl-Anthony Towns', team: 'NYK', impact: 'positive', is_read: false },
];

export function getAllProps() {
  const allProps = [];
  mockPlayers.forEach(player => {
    player.props.forEach(prop => {
      allProps.push({
        ...prop,
        player_name: player.player_name,
        team: player.team,
        opponent: player.opponent,
        position: player.position,
        photo_url: player.photo_url,
        is_starter: player.is_starter,
        injury_status: player.injury_status,
        injury_note: player.injury_note,
        player_id: player.id,
      });
    });
  });
  return allProps;
}
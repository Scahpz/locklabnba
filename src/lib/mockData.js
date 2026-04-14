// Helper to generate game logs for a player
function makeLogs(id, opps) {
  return { id, logs: opps.map((opp, i) => ({ date: `3/${10 + i}`, opp })) };
}

// All 30 NBA teams' recent opponents (10 games)
const teamSchedules = {
  DAL: ['MEM','HOU','SAS','NOP','UTA','OKC','DEN','PHX','GSW','LAL'],
  LAL: ['SAC','POR','UTA','PHX','DAL','GSW','DEN','OKC','MEM','HOU'],
  GSW: ['SAC','LAC','POR','UTA','OKC','DAL','PHX','DEN','LAL','MEM'],
  BOS: ['CLE','NYK','PHI','CHI','IND','TOR','BKN','DET','ORL','MIL'],
  MIL: ['CLE','CHI','IND','NYK','PHI','BOS','ORL','TOR','DET','BKN'],
  PHI: ['NYK','TOR','CLE','CHI','BOS','MIL','BKN','IND','ORL','DET'],
  NYK: ['PHI','BOS','MIL','TOR','CLE','BKN','CHI','ORL','IND','DET'],
  BKN: ['CLE','ORL','DET','IND','NYK','CHI','PHI','MIL','BOS','TOR'],
  MIA: ['ATL','CHA','ORL','WAS','DET','BKN','IND','CLE','NYK','TOR'],
  CLE: ['BOS','MIL','DET','IND','TOR','NYK','PHI','ORL','CHA','CHI'],
  CHI: ['MIL','IND','DET','TOR','CLE','NYK','ORL','PHI','BKN','BOS'],
  TOR: ['PHI','BOS','MIL','BKN','NYK','CLE','IND','CHI','ORL','DET'],
  IND: ['MIL','CHI','TOR','CLE','BOS','ORL','BKN','DET','NYK','PHI'],
  ORL: ['ATL','MIA','WAS','CHA','BKN','NYK','PHI','DET','IND','BOS'],
  ATL: ['MIA','ORL','WAS','CHA','BKN','IND','TOR','PHI','NYK','CLE'],
  WAS: ['ATL','MIA','ORL','CHA','DET','CHI','IND','BOS','TOR','NYK'],
  CHA: ['ATL','MIA','ORL','WAS','DET','BKN','NYK','PHI','TOR','IND'],
  DET: ['CHI','IND','TOR','CLE','BOS','MIL','NYK','PHI','BKN','ORL'],
  DEN: ['OKC','MIN','UTA','LAC','SAC','POR','GSW','LAL','MEM','PHX'],
  PHX: ['UTA','POR','LAC','GSW','OKC','DAL','LAL','MEM','SAC','DEN'],
  OKC: ['DEN','MIN','UTA','LAC','SAC','POR','GSW','LAL','MEM','PHX'],
  MIN: ['POR','SAC','LAC','NOP','MEM','DEN','OKC','PHX','LAL','GSW'],
  UTA: ['OKC','MIN','DEN','LAC','SAC','POR','GSW','DAL','PHX','LAL'],
  SAC: ['UTA','POR','LAC','GSW','OKC','DAL','PHX','DEN','LAL','MEM'],
  POR: ['UTA','SAC','LAC','GSW','OKC','DAL','PHX','DEN','LAL','MEM'],
  LAC: ['SAC','POR','UTA','GSW','DAL','OKC','DEN','PHX','LAL','MEM'],
  MEM: ['DAL','OKC','NOP','SAS','HOU','UTA','MIN','DEN','SAC','PHX'],
  NOP: ['SAS','HOU','MEM','DAL','OKC','UTA','MIN','DEN','SAC','PHX'],
  SAS: ['NOP','HOU','MEM','DAL','OKC','UTA','MIN','DEN','SAC','PHX'],
  HOU: ['SAS','NOP','MEM','DAL','OKC','UTA','MIN','DEN','SAC','PHX'],
};

// Build game logs lookup
export const mockGameLogs = {};
const logEntries = Object.entries(teamSchedules);
logEntries.forEach(([team, opps], idx) => {
  const pid = `p${idx + 1}`;
  mockGameLogs[pid] = opps.map((opp, i) => ({ date: `3/${10 + i}`, opp }));
});

// Helper: make realistic game values
function mkGames(base, variance, count = 10) {
  return Array.from({ length: count }, () =>
    parseFloat((base + (Math.random() * variance * 2 - variance)).toFixed(1))
  );
}

// Generate a prop entry
function mkProp(type, line, opts = {}) {
  const games = mkGames(line + (opts.bias || 0.5), opts.var || line * 0.18);
  const g5 = games.slice(-5);
  const avg10 = parseFloat((games.reduce((a,b)=>a+b,0)/games.length).toFixed(1));
  const avg5 = parseFloat((g5.reduce((a,b)=>a+b,0)/g5.length).toFixed(1));
  const hits = games.filter(v => v > line).length;
  const hit_rate = Math.round((hits/games.length)*100);
  const proj = parseFloat((avg5 * 1.02).toFixed(1));
  const edge = parseFloat((((proj - line)/line)*100).toFixed(1));
  const over_odds = opts.over_odds || (Math.random() > 0.5 ? -110 : -115);
  const under_odds = opts.under_odds || (over_odds === -110 ? -110 : -105);
  const confidence_score = Math.min(10, Math.max(4, hits >= 8 ? 9 : hits >= 6 ? 7 : 5));
  const confidence_tier = confidence_score >= 8 ? 'A' : confidence_score >= 6 ? 'B' : 'C';
  const streak = hits >= 7 ? `Hit over in ${hits} of last 10` : hits <= 3 ? `Hit under in ${10-hits} of last 10` : `Split ${hits}-${10-hits} last 10`;
  return {
    prop_type: type,
    line,
    over_odds,
    under_odds,
    projection: proj,
    edge,
    hit_rate_last_10: hit_rate,
    avg_last_5: avg5,
    avg_last_10: avg10,
    streak_info: streak,
    confidence_score,
    confidence_tier,
    is_top_pick: confidence_score >= 8,
    is_lock: confidence_score === 10,
    best_value: edge > 8,
    trap_warning: opts.trap || false,
    last_5_games: g5,
    last_10_games: games,
    matchup_rating: opts.matchup_rating || 'neutral',
    matchup_note: opts.matchup_note || '',
    def_rank_vs_pos: opts.def_rank || 15,
    minutes_avg: opts.min || 32,
    usage_rate: opts.usage || 25,
    minutes_last_5: mkGames(opts.min || 32, 2, 5),
    pace_rating: opts.pace || 100.0,
    game_total: opts.total || 220.0,
  };
}

export const mockPlayers = [
  // ── DALLAS MAVERICKS ──
  { id: 'p1', player_name: 'Anthony Davis', team: 'DAL', opponent: 'LAL', position: 'C', photo_url: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 26.5, {bias:1, var:5, over_odds:-115, under_odds:-105, matchup_rating:'favorable', matchup_note:'LAL weak rim protection without AD', def_rank:24, min:34, usage:30, pace:102, total:229}),
            mkProp('rebounds', 12.5, {bias:0.5, var:3, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'LAL gives up boards to Centers', def_rank:24, min:34, usage:30, pace:102, total:229})]},
  { id: 'p2', player_name: 'Kyrie Irving', team: 'DAL', opponent: 'LAL', position: 'SG', photo_url: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 24.5, {bias:1.5, var:4, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'LAL weak vs SG scorers', def_rank:25, min:35, usage:28, pace:102, total:229}),
            mkProp('3PM', 3.5, {bias:0.3, var:1, over_odds:+105, under_odds:-125, matchup_rating:'favorable', matchup_note:'LAL poor at contesting 3s', def_rank:24, min:35, usage:28, pace:102, total:229})]},
  { id: 'p3', player_name: 'P.J. Washington', team: 'DAL', opponent: 'LAL', position: 'PF', photo_url: 'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 14.5, {bias:0.5, var:3, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'LAL average vs PFs', def_rank:15, min:30, usage:18, pace:102, total:229}),
            mkProp('rebounds', 6.5, {bias:0.5, var:2, over_odds:-115, under_odds:-105, matchup_rating:'neutral', matchup_note:'Rebounding matchup neutral', def_rank:14, min:30, usage:18, pace:102, total:229})]},

  // ── LOS ANGELES LAKERS ──
  { id: 'p4', player_name: 'Luka Doncic', team: 'LAL', opponent: 'DAL', position: 'PG', photo_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 33.5, {bias:2, var:5, over_odds:-115, under_odds:-105, matchup_rating:'favorable', matchup_note:'DAL weak on former player matchup', def_rank:22, min:36, usage:35, pace:102, total:229}),
            mkProp('assists', 8.5, {bias:1, var:2, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'DAL gives up assists to PGs', def_rank:22, min:36, usage:35, pace:102, total:229})]},
  { id: 'p5', player_name: 'LeBron James', team: 'LAL', opponent: 'DAL', position: 'SF', photo_url: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 24.5, {bias:1, var:4, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'DAL average vs SFs', def_rank:16, min:35, usage:28, pace:102, total:229}),
            mkProp('assists', 7.5, {bias:0.5, var:2, over_odds:-105, under_odds:-115, matchup_rating:'favorable', matchup_note:'DAL weak defensively vs playmakers', def_rank:22, min:35, usage:28, pace:102, total:229})]},
  { id: 'p6', player_name: 'Austin Reaves', team: 'LAL', opponent: 'DAL', position: 'SG', photo_url: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 16.5, {bias:0.5, var:3, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'DAL solid perimeter D', def_rank:12, min:33, usage:22, pace:102, total:229})]},

  // ── GOLDEN STATE WARRIORS ──
  { id: 'p7', player_name: 'Stephen Curry', team: 'GSW', opponent: 'MEM', position: 'PG', photo_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 27.5, {bias:1.5, var:5, over_odds:-115, under_odds:-105, matchup_rating:'favorable', matchup_note:'MEM weak vs guards', def_rank:25, min:34, usage:30, pace:101, total:222}),
            mkProp('3PM', 4.5, {bias:0.3, var:1.5, over_odds:-105, under_odds:-115, matchup_rating:'favorable', matchup_note:'MEM 28th defending the 3', def_rank:28, min:34, usage:30, pace:101, total:222})]},
  { id: 'p8', player_name: 'Draymond Green', team: 'GSW', opponent: 'MEM', position: 'PF', photo_url: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('assists', 6.5, {bias:0.5, var:2, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'MEM average at guarding playmaking bigs', def_rank:15, min:28, usage:16, pace:101, total:222}),
            mkProp('rebounds', 7.5, {bias:0.5, var:2, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'Even rebounding matchup', def_rank:14, min:28, usage:16, pace:101, total:222})]},
  { id: 'p9', player_name: 'Jimmy Butler', team: 'GSW', opponent: 'MEM', position: 'SF', photo_url: 'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 18.5, {bias:0.5, var:3, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'MEM solid wing defenders', def_rank:11, min:32, usage:22, pace:101, total:222})]},

  // ── BOSTON CELTICS ──
  { id: 'p10', player_name: 'Jayson Tatum', team: 'BOS', opponent: 'MIL', position: 'SF', photo_url: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 28.5, {bias:1, var:5, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'MIL average vs SFs', def_rank:15, min:36, usage:30, pace:99, total:222}),
            mkProp('rebounds', 8.5, {bias:0.5, var:2, over_odds:-105, under_odds:-115, matchup_rating:'favorable', matchup_note:'MIL poor on defensive boards', def_rank:25, min:36, usage:30, pace:99, total:222})]},
  { id: 'p11', player_name: 'Jaylen Brown', team: 'BOS', opponent: 'MIL', position: 'SG', photo_url: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 23.5, {bias:1, var:4, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'MIL porous perimeter D', def_rank:22, min:34, usage:26, pace:99, total:222}),
            mkProp('3PM', 2.5, {bias:0.2, var:1, over_odds:-105, under_odds:-115, matchup_rating:'neutral', matchup_note:'Average 3pt defense', def_rank:14, min:34, usage:26, pace:99, total:222})]},
  { id: 'p12', player_name: 'Anfernee Simons', team: 'BOS', opponent: 'MIL', position: 'PG', photo_url: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 18.5, {bias:0.5, var:3, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'MIL decent at guarding PGs', def_rank:12, min:30, usage:22, pace:99, total:222}),
            mkProp('3PM', 3.5, {bias:0.2, var:1.2, over_odds:-105, under_odds:-115, matchup_rating:'neutral', matchup_note:'MIL average 3pt defense', def_rank:14, min:30, usage:22, pace:99, total:222})]},

  // ── MILWAUKEE BUCKS ──
  { id: 'p13', player_name: 'Giannis Antetokounmpo', team: 'MIL', opponent: 'BOS', position: 'PF', photo_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 30.5, {bias:1.5, var:5, over_odds:-120, under_odds:+100, matchup_rating:'tough', matchup_note:'BOS elite rim defense', def_rank:4, min:35, usage:33, pace:99, total:222}),
            mkProp('rebounds', 11.5, {bias:0.5, var:2.5, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'BOS solid on boards', def_rank:12, min:35, usage:33, pace:99, total:222})]},
  { id: 'p14', player_name: 'Kyle Kuzma', team: 'MIL', opponent: 'BOS', position: 'SF', photo_url: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 17.5, {bias:0.5, var:3, over_odds:-110, under_odds:-110, matchup_rating:'tough', matchup_note:'BOS elite wing defenders', def_rank:5, min:32, usage:20, pace:99, total:222}),
            mkProp('3PM', 2.5, {bias:0.2, var:1, over_odds:+100, under_odds:-120, matchup_rating:'tough', matchup_note:'BOS ranks 3rd in 3pt defense', def_rank:3, min:32, usage:20, pace:99, total:222})]},

  // ── PHILADELPHIA 76ERS ──
  { id: 'p15', player_name: 'Joel Embiid', team: 'PHI', opponent: 'DET', position: 'C', photo_url: 'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=100&h=100&fit=crop', is_starter: true, injury_status: 'questionable', injury_note: 'Knee - Day-to-Day',
    props: [mkProp('points', 33.5, {bias:1, var:6, over_odds:-115, under_odds:-105, matchup_rating:'elite', matchup_note:'DET worst vs Centers in the league', def_rank:30, min:34, usage:35, pace:100, total:218, trap:true}),
            mkProp('rebounds', 10.5, {bias:0.5, var:2.5, over_odds:-110, under_odds:-110, matchup_rating:'elite', matchup_note:'DET gives up most boards to Cs', def_rank:29, min:34, usage:35, pace:100, total:218})]},
  { id: 'p16', player_name: 'Tyrese Maxey', team: 'PHI', opponent: 'DET', position: 'PG', photo_url: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 26.5, {bias:1, var:4, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'DET leaks points to PGs', def_rank:24, min:36, usage:28, pace:100, total:218}),
            mkProp('assists', 6.5, {bias:0.5, var:2, over_odds:-105, under_odds:-115, matchup_rating:'favorable', matchup_note:'DET poor vs playmaking guards', def_rank:25, min:36, usage:28, pace:100, total:218})]},

  // ── NEW YORK KNICKS ──
  { id: 'p17', player_name: 'Jalen Brunson', team: 'NYK', opponent: 'ORL', position: 'PG', photo_url: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 27.5, {bias:1.5, var:4, over_odds:-115, under_odds:-105, matchup_rating:'favorable', matchup_note:'ORL middle-of-pack vs PG scorers', def_rank:18, min:35, usage:30, pace:101, total:215}),
            mkProp('assists', 6.5, {bias:0.5, var:2, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'ORL average on assists given up', def_rank:15, min:35, usage:30, pace:101, total:215})]},
  { id: 'p18', player_name: 'Karl-Anthony Towns', team: 'NYK', opponent: 'ORL', position: 'C', photo_url: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 24.5, {bias:1, var:4, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'ORL soft on interior D', def_rank:22, min:33, usage:27, pace:101, total:215}),
            mkProp('3PM', 2.5, {bias:0.2, var:1, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'ORL decent 3pt D for a big', def_rank:13, min:33, usage:27, pace:101, total:215})]},

  // ── BROOKLYN NETS ──
  { id: 'p19', player_name: 'Cam Thomas', team: 'BKN', opponent: 'TOR', position: 'SG', photo_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 22.5, {bias:1, var:4, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'TOR solid guard defenders', def_rank:12, min:34, usage:26, pace:100, total:214})]},
  { id: 'p20', player_name: 'Michael Porter Jr.', team: 'BKN', opponent: 'TOR', position: 'SF', photo_url: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 16.5, {bias:0.5, var:4, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'TOR average vs SFs', def_rank:14, min:30, usage:20, pace:100, total:214}),
            mkProp('rebounds', 6.5, {bias:0.3, var:2, over_odds:-105, under_odds:-115, matchup_rating:'neutral', matchup_note:'TOR decent rebounding team', def_rank:13, min:30, usage:20, pace:100, total:214})]},

  // ── MIAMI HEAT ──
  { id: 'p21', player_name: 'Bam Adebayo', team: 'MIA', opponent: 'ATL', position: 'C', photo_url: 'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 18.5, {bias:0.5, var:3, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'ATL weak interior defense', def_rank:24, min:33, usage:22, pace:100, total:218}),
            mkProp('rebounds', 10.5, {bias:0.5, var:2, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'ATL poor rebounding team', def_rank:26, min:33, usage:22, pace:100, total:218})]},
  { id: 'p22', player_name: 'Tyler Herro', team: 'MIA', opponent: 'ATL', position: 'SG', photo_url: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 22.5, {bias:1, var:4, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'ATL leaks pts to shooting guards', def_rank:23, min:33, usage:25, pace:100, total:218}),
            mkProp('3PM', 2.5, {bias:0.2, var:1, over_odds:-105, under_odds:-115, matchup_rating:'neutral', matchup_note:'ATL average 3pt defense', def_rank:14, min:33, usage:25, pace:100, total:218})]},

  // ── CLEVELAND CAVALIERS ──
  { id: 'p23', player_name: 'Donovan Mitchell', team: 'CLE', opponent: 'CHI', position: 'SG', photo_url: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 27.5, {bias:1, var:4, over_odds:-115, under_odds:-105, matchup_rating:'favorable', matchup_note:'CHI weak vs off-guards', def_rank:24, min:35, usage:30, pace:98, total:216}),
            mkProp('3PM', 3.5, {bias:0.2, var:1.2, over_odds:+100, under_odds:-120, matchup_rating:'neutral', matchup_note:'CHI decent 3pt defense', def_rank:14, min:35, usage:30, pace:98, total:216})]},
  { id: 'p24', player_name: 'Darius Garland', team: 'CLE', opponent: 'CHI', position: 'PG', photo_url: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('assists', 7.5, {bias:0.5, var:2, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'CHI soft on assists given up', def_rank:24, min:33, usage:24, pace:98, total:216}),
            mkProp('points', 19.5, {bias:0.5, var:3, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'CHI solid on point guards scoring', def_rank:12, min:33, usage:24, pace:98, total:216})]},

  // ── CHICAGO BULLS ──
  { id: 'p25', player_name: 'Zach LaVine', team: 'CHI', opponent: 'CLE', position: 'SG', photo_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 22.5, {bias:1, var:4, over_odds:-110, under_odds:-110, matchup_rating:'tough', matchup_note:'CLE elite perimeter defense', def_rank:4, min:34, usage:27, pace:98, total:216}),
            mkProp('3PM', 2.5, {bias:0.1, var:1, over_odds:-105, under_odds:-115, matchup_rating:'tough', matchup_note:'CLE ranks 5th in 3pt D', def_rank:5, min:34, usage:27, pace:98, total:216})]},
  { id: 'p26', player_name: 'Nikola Vucevic', team: 'CHI', opponent: 'CLE', position: 'C', photo_url: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 16.5, {bias:0.5, var:3, over_odds:-110, under_odds:-110, matchup_rating:'tough', matchup_note:'CLE elite Center coverage', def_rank:3, min:30, usage:20, pace:98, total:216}),
            mkProp('rebounds', 11.5, {bias:0.5, var:2.5, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'CLE decent boards matchup', def_rank:14, min:30, usage:20, pace:98, total:216})]},

  // ── TORONTO RAPTORS ──
  { id: 'p27', player_name: 'Scottie Barnes', team: 'TOR', opponent: 'BKN', position: 'PF', photo_url: 'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 19.5, {bias:0.5, var:4, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'BKN soft on PF scoring', def_rank:24, min:35, usage:24, pace:100, total:214}),
            mkProp('rebounds', 8.5, {bias:0.5, var:2, over_odds:-105, under_odds:-115, matchup_rating:'favorable', matchup_note:'BKN weak on boards', def_rank:25, min:35, usage:24, pace:100, total:214})]},
  { id: 'p28', player_name: 'RJ Barrett', team: 'TOR', opponent: 'BKN', position: 'SG', photo_url: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 21.5, {bias:0.5, var:4, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'BKN average SG coverage', def_rank:15, min:34, usage:25, pace:100, total:214})]},

  // ── INDIANA PACERS ──
  { id: 'p29', player_name: 'Tyrese Haliburton', team: 'IND', opponent: 'CHA', position: 'PG', photo_url: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('assists', 10.5, {bias:1, var:2, over_odds:-105, under_odds:-115, matchup_rating:'elite', matchup_note:'CHA worst defense vs PG assists', def_rank:30, min:34, usage:29, pace:105, total:234}),
            mkProp('points', 20.5, {bias:0.5, var:3, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'CHA allows high scoring', def_rank:26, min:34, usage:29, pace:105, total:234})]},
  { id: 'p30', player_name: 'Pascal Siakam', team: 'IND', opponent: 'CHA', position: 'PF', photo_url: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 20.5, {bias:1, var:4, over_odds:-110, under_odds:-110, matchup_rating:'elite', matchup_note:'CHA worst PF defense in East', def_rank:29, min:34, usage:26, pace:105, total:234}),
            mkProp('rebounds', 6.5, {bias:0.3, var:2, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'CHA soft on boards', def_rank:25, min:34, usage:26, pace:105, total:234})]},

  // ── ORLANDO MAGIC ──
  { id: 'p31', player_name: 'Paolo Banchero', team: 'ORL', opponent: 'NYK', position: 'PF', photo_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 23.5, {bias:1, var:4, over_odds:-110, under_odds:-110, matchup_rating:'tough', matchup_note:'NYK elite interior defense', def_rank:4, min:35, usage:27, pace:101, total:215}),
            mkProp('rebounds', 6.5, {bias:0.3, var:2, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'NYK solid rebounding team', def_rank:12, min:35, usage:27, pace:101, total:215})]},
  { id: 'p32', player_name: 'Franz Wagner', team: 'ORL', opponent: 'NYK', position: 'SF', photo_url: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 20.5, {bias:0.5, var:4, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'NYK average SF coverage', def_rank:14, min:33, usage:23, pace:101, total:215})]},

  // ── ATLANTA HAWKS ──
  { id: 'p33', player_name: 'Trae Young', team: 'ATL', opponent: 'MIA', position: 'PG', photo_url: 'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 25.5, {bias:1, var:4, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'MIA average PG coverage', def_rank:14, min:34, usage:30, pace:100, total:218}),
            mkProp('assists', 10.5, {bias:0.5, var:2.5, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'MIA gives up assists to PGs', def_rank:22, min:34, usage:30, pace:100, total:218})]},
  { id: 'p34', player_name: 'Jalen Johnson', team: 'ATL', opponent: 'MIA', position: 'SF', photo_url: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 18.5, {bias:0.5, var:4, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'MIA solid wing defense', def_rank:12, min:34, usage:22, pace:100, total:218}),
            mkProp('rebounds', 7.5, {bias:0.3, var:2, over_odds:-105, under_odds:-115, matchup_rating:'favorable', matchup_note:'MIA weak on defensive boards', def_rank:22, min:34, usage:22, pace:100, total:218})]},

  // ── WASHINGTON WIZARDS ──
  { id: 'p35', player_name: 'CJ McCollum', team: 'WAS', opponent: 'CHA', position: 'SG', photo_url: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 18.5, {bias:0.5, var:3, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'CHA soft on SG scoring', def_rank:25, min:32, usage:23, pace:100, total:212}),
            mkProp('3PM', 2.5, {bias:0.2, var:1, over_odds:-105, under_odds:-115, matchup_rating:'favorable', matchup_note:'CHA gives up 3s to shooting guards', def_rank:24, min:32, usage:23, pace:100, total:212})]},
  { id: 'p36', player_name: 'Bilal Coulibaly', team: 'WAS', opponent: 'CHA', position: 'SF', photo_url: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 13.5, {bias:0.3, var:3, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'CHA weak wing coverage', def_rank:24, min:30, usage:18, pace:100, total:212})]},

  // ── CHARLOTTE HORNETS ──
  { id: 'p37', player_name: 'LaMelo Ball', team: 'CHA', opponent: 'IND', position: 'PG', photo_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop', is_starter: true, injury_status: 'questionable', injury_note: 'Ankle - GTD',
    props: [mkProp('points', 23.5, {bias:1, var:5, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'IND allows points to PGs', def_rank:22, min:35, usage:29, pace:105, total:234, trap:true}),
            mkProp('assists', 7.5, {bias:0.5, var:2, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'IND weak at containing playmakers', def_rank:20, min:35, usage:29, pace:105, total:234})]},
  { id: 'p37b', player_name: 'Collin Sexton', team: 'CHA', opponent: 'IND', position: 'SG', photo_url: 'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 17.5, {bias:0.5, var:3, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'IND allows points to off-guards', def_rank:22, min:30, usage:22, pace:105, total:234})]},

  // ── DETROIT PISTONS ──
  { id: 'p38', player_name: 'Cade Cunningham', team: 'DET', opponent: 'PHI', position: 'PG', photo_url: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 24.5, {bias:1, var:4, over_odds:-110, under_odds:-110, matchup_rating:'tough', matchup_note:'PHI solid PG coverage with Maxey', def_rank:8, min:35, usage:28, pace:100, total:218}),
            mkProp('assists', 7.5, {bias:0.5, var:2, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'PHI average assists given up', def_rank:14, min:35, usage:28, pace:100, total:218})]},

  // ── DENVER NUGGETS ──
  { id: 'p39', player_name: 'Nikola Jokic', team: 'DEN', opponent: 'PHX', position: 'C', photo_url: 'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('PRA', 48.5, {bias:3, var:5, over_odds:-120, under_odds:+100, matchup_rating:'elite', matchup_note:'PHX worst vs Centers in PRA', def_rank:29, min:35, usage:32, pace:101, total:230}),
            mkProp('assists', 9.5, {bias:1, var:2, over_odds:-110, under_odds:-110, matchup_rating:'elite', matchup_note:'PHX allows most assists to Centers', def_rank:30, min:35, usage:32, pace:101, total:230})]},
  { id: 'p40', player_name: 'Jamal Murray', team: 'DEN', opponent: 'PHX', position: 'PG', photo_url: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 21.5, {bias:1, var:4, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'PHX weak PG defense', def_rank:23, min:34, usage:25, pace:101, total:230}),
            mkProp('3PM', 2.5, {bias:0.2, var:1, over_odds:-105, under_odds:-115, matchup_rating:'favorable', matchup_note:'PHX gives up 3s', def_rank:24, min:34, usage:25, pace:101, total:230})]},
  { id: 'p41', player_name: 'Michael Porter Jr.', team: 'DEN', opponent: 'PHX', position: 'SF', photo_url: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 18.5, {bias:0.5, var:4, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'PHX soft on SF scorers', def_rank:22, min:32, usage:22, pace:101, total:230}),
            mkProp('rebounds', 7.5, {bias:0.3, var:2, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'PHX neutral on rebounds', def_rank:14, min:32, usage:22, pace:101, total:230})]},

  // ── PHOENIX SUNS ──
  { id: 'p42', player_name: 'Grayson Allen', team: 'PHX', opponent: 'DEN', position: 'SG', photo_url: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 14.5, {bias:0.3, var:3, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'DEN average on perimeter scoring', def_rank:14, min:30, usage:18, pace:101, total:230}),
            mkProp('3PM', 3.5, {bias:0.3, var:1.2, over_odds:-105, under_odds:-115, matchup_rating:'neutral', matchup_note:'DEN decent 3pt defense', def_rank:13, min:30, usage:18, pace:101, total:230})]},
  { id: 'p43', player_name: 'Devin Booker', team: 'PHX', opponent: 'DEN', position: 'SG', photo_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 28.5, {bias:1.5, var:5, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'DEN average vs SGs', def_rank:14, min:35, usage:31, pace:101, total:230}),
            mkProp('3PM', 3.5, {bias:0.3, var:1.2, over_odds:-105, under_odds:-115, matchup_rating:'neutral', matchup_note:'DEN decent 3pt defense', def_rank:13, min:35, usage:31, pace:101, total:230})]},

  // ── OKLAHOMA CITY THUNDER ──
  { id: 'p44', player_name: 'Shai Gilgeous-Alexander', team: 'OKC', opponent: 'SAC', position: 'SG', photo_url: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 31.5, {bias:1.5, var:4, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'SAC allows 6th most pts to SGs', def_rank:25, min:35, usage:33, pace:101, total:226}),
            mkProp('assists', 5.5, {bias:0.3, var:1.5, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'SAC average on assists allowed', def_rank:14, min:35, usage:33, pace:101, total:226})]},
  { id: 'p45', player_name: 'Jalen Williams', team: 'OKC', opponent: 'SAC', position: 'SF', photo_url: 'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 22.5, {bias:1, var:4, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'SAC soft on SF scoring', def_rank:23, min:33, usage:25, pace:101, total:226})]},
  { id: 'p46', player_name: 'Chet Holmgren', team: 'OKC', opponent: 'SAC', position: 'C', photo_url: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 16.5, {bias:0.5, var:3, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'SAC gives up points to stretch Cs', def_rank:22, min:30, usage:20, pace:101, total:226}),
            mkProp('blocks', 2.5, {bias:0.2, var:1, over_odds:-105, under_odds:-115, matchup_rating:'neutral', matchup_note:'SAC neutral blocks matchup', def_rank:14, min:30, usage:20, pace:101, total:226})]},

  // ── MINNESOTA TIMBERWOLVES ──
  { id: 'p47', player_name: 'Anthony Edwards', team: 'MIN', opponent: 'GSW', position: 'SG', photo_url: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=100&h=100&fit=crop', is_starter: true, injury_status: 'questionable', injury_note: 'Ankle - Probable',
    props: [mkProp('points', 26.5, {bias:1, var:5, over_odds:-110, under_odds:-110, matchup_rating:'tough', matchup_note:'GSW elite perimeter defense', def_rank:5, min:35, usage:32, pace:99, total:219, trap:true}),
            mkProp('3PM', 3.5, {bias:0.1, var:1.2, over_odds:+105, under_odds:-125, matchup_rating:'tough', matchup_note:'GSW best at defending 3pt shooters', def_rank:2, min:35, usage:32, pace:99, total:219})]},
  { id: 'p48', player_name: 'Julius Randle', team: 'MIN', opponent: 'GSW', position: 'PF', photo_url: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 20.5, {bias:0.5, var:4, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'GSW average PF coverage', def_rank:14, min:32, usage:24, pace:99, total:219}),
            mkProp('rebounds', 8.5, {bias:0.3, var:2.5, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'GSW neutral rebounding matchup', def_rank:13, min:32, usage:24, pace:99, total:219})]},
  { id: 'p49', player_name: 'Rudy Gobert', team: 'MIN', opponent: 'GSW', position: 'C', photo_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('rebounds', 12.5, {bias:0.5, var:2.5, over_odds:-115, under_odds:-105, matchup_rating:'neutral', matchup_note:'GSW average C coverage', def_rank:14, min:30, usage:14, pace:99, total:219}),
            mkProp('blocks', 1.5, {bias:0.1, var:0.8, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'GSW neutral blocks matchup', def_rank:14, min:30, usage:14, pace:99, total:219})]},

  // ── UTAH JAZZ ──
  { id: 'p50', player_name: 'Lauri Markkanen', team: 'UTA', opponent: 'OKC', position: 'PF', photo_url: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 22.5, {bias:0.5, var:4, over_odds:-110, under_odds:-110, matchup_rating:'tough', matchup_note:'OKC elite interior defense', def_rank:3, min:34, usage:26, pace:100, total:219}),
            mkProp('3PM', 2.5, {bias:0.2, var:1, over_odds:-105, under_odds:-115, matchup_rating:'neutral', matchup_note:'OKC decent 3pt defense', def_rank:13, min:34, usage:26, pace:100, total:219})]},
  { id: 'p51', player_name: 'Jaren Jackson Jr.', team: 'UTA', opponent: 'OKC', position: 'C', photo_url: 'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 19.5, {bias:0.5, var:4, over_odds:-110, under_odds:-110, matchup_rating:'tough', matchup_note:'OKC Holmgren excellent rim protection', def_rank:4, min:30, usage:22, pace:100, total:219}),
            mkProp('blocks', 2.5, {bias:0.2, var:1, over_odds:-105, under_odds:-115, matchup_rating:'neutral', matchup_note:'OKC neutral blocks matchup', def_rank:13, min:30, usage:22, pace:100, total:219})]},

  // ── SACRAMENTO KINGS ──
  { id: 'p52', player_name: 'DeMar DeRozan', team: 'SAC', opponent: 'OKC', position: 'SG', photo_url: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 24.5, {bias:1, var:4, over_odds:-110, under_odds:-110, matchup_rating:'tough', matchup_note:'OKC solid on guard scoring', def_rank:6, min:34, usage:27, pace:101, total:226}),
            mkProp('assists', 5.5, {bias:0.3, var:2, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'OKC decent at limiting playmaking', def_rank:12, min:34, usage:27, pace:101, total:226})]},
  { id: 'p53', player_name: 'Domantas Sabonis', team: 'SAC', opponent: 'OKC', position: 'C', photo_url: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('rebounds', 12.5, {bias:0.5, var:2.5, over_odds:-115, under_odds:-105, matchup_rating:'neutral', matchup_note:'OKC Holmgren good at limiting boards', def_rank:10, min:33, usage:22, pace:101, total:226}),
            mkProp('points', 18.5, {bias:0.5, var:3, over_odds:-110, under_odds:-110, matchup_rating:'tough', matchup_note:'OKC solid interior defense', def_rank:6, min:33, usage:22, pace:101, total:226})]},

  // ── PORTLAND TRAIL BLAZERS ──
  { id: 'p54', player_name: 'Damian Lillard', team: 'POR', opponent: 'UTA', position: 'PG', photo_url: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 26.5, {bias:1, var:4, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'UTA weak PG defense', def_rank:24, min:35, usage:30, pace:100, total:216}),
            mkProp('3PM', 3.5, {bias:0.3, var:1.2, over_odds:+100, under_odds:-120, matchup_rating:'favorable', matchup_note:'UTA gives up 3s to PGs', def_rank:25, min:35, usage:30, pace:100, total:216})]},
  { id: 'p55', player_name: 'Jrue Holiday', team: 'POR', opponent: 'UTA', position: 'SG', photo_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 14.5, {bias:0.3, var:3, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'UTA average SG coverage', def_rank:14, min:30, usage:18, pace:100, total:216}),
            mkProp('assists', 5.5, {bias:0.3, var:1.5, over_odds:-105, under_odds:-115, matchup_rating:'neutral', matchup_note:'UTA decent at limiting assists', def_rank:13, min:30, usage:18, pace:100, total:216})]},

  // ── LOS ANGELES CLIPPERS ──
  { id: 'p56', player_name: 'Kawhi Leonard', team: 'LAC', opponent: 'MEM', position: 'SF', photo_url: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=100&h=100&fit=crop', is_starter: true, injury_status: 'questionable', injury_note: 'Knee - Limited',
    props: [mkProp('points', 23.5, {bias:0.5, var:4, over_odds:-115, under_odds:-105, matchup_rating:'favorable', matchup_note:'MEM soft on SF scoring', def_rank:23, min:32, usage:27, pace:100, total:218, trap:true}),
            mkProp('rebounds', 6.5, {bias:0.3, var:2, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'MEM neutral rebounding matchup', def_rank:14, min:32, usage:27, pace:100, total:218})]},
  { id: 'p57', player_name: 'James Harden', team: 'LAC', opponent: 'MEM', position: 'PG', photo_url: 'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('assists', 8.5, {bias:0.5, var:2, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'MEM weak at containing playmakers', def_rank:24, min:33, usage:27, pace:100, total:218}),
            mkProp('points', 18.5, {bias:0.5, var:3, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'MEM average on PG scoring', def_rank:15, min:33, usage:27, pace:100, total:218})]},

  // ── MEMPHIS GRIZZLIES ──
  { id: 'p58', player_name: 'Ja Morant', team: 'MEM', opponent: 'GSW', position: 'PG', photo_url: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 24.5, {bias:1, var:5, over_odds:-110, under_odds:-110, matchup_rating:'tough', matchup_note:'GSW solid on PG containment', def_rank:7, min:34, usage:28, pace:101, total:222}),
            mkProp('assists', 7.5, {bias:0.5, var:2, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'GSW average assists allowed', def_rank:14, min:34, usage:28, pace:101, total:222})]},
  { id: 'p59', player_name: 'Zach Edey', team: 'MEM', opponent: 'GSW', position: 'C', photo_url: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 14.5, {bias:0.5, var:3, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'GSW average interior scoring allowed', def_rank:14, min:26, usage:18, pace:101, total:222}),
            mkProp('rebounds', 9.5, {bias:0.5, var:2.5, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'GSW allows boards to traditional bigs', def_rank:20, min:26, usage:18, pace:101, total:222})]},

  // ── NEW ORLEANS PELICANS ──
  { id: 'p60', player_name: 'Zion Williamson', team: 'NOP', opponent: 'SAS', position: 'PF', photo_url: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=100&h=100&fit=crop', is_starter: true, injury_status: 'questionable', injury_note: 'Hip - Day-to-Day',
    props: [mkProp('points', 26.5, {bias:1, var:5, over_odds:-115, under_odds:-105, matchup_rating:'favorable', matchup_note:'SAS soft on PF scorers', def_rank:23, min:32, usage:32, pace:101, total:220, trap:true}),
            mkProp('rebounds', 7.5, {bias:0.5, var:2, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'SAS average rebounding matchup', def_rank:14, min:32, usage:32, pace:101, total:220})]},
  { id: 'p61', player_name: 'Jordan Poole', team: 'NOP', opponent: 'SAS', position: 'SG', photo_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 17.5, {bias:0.5, var:3, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'SAS weak perimeter defense', def_rank:24, min:30, usage:22, pace:101, total:220}),
            mkProp('3PM', 2.5, {bias:0.2, var:1, over_odds:-105, under_odds:-115, matchup_rating:'favorable', matchup_note:'SAS gives up 3s to guards', def_rank:23, min:30, usage:22, pace:101, total:220})]},

  // ── SAN ANTONIO SPURS ──
  { id: 'p62', player_name: 'Victor Wembanyama', team: 'SAS', opponent: 'NOP', position: 'C', photo_url: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 22.5, {bias:1.5, var:5, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'NOP weak rim protection', def_rank:25, min:32, usage:28, pace:101, total:220}),
            mkProp('blocks', 3.5, {bias:0.5, var:1, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'NOP drives into contact frequently', def_rank:24, min:32, usage:28, pace:101, total:220})]},
  { id: 'p63', player_name: 'Devin Vassell', team: 'SAS', opponent: 'NOP', position: 'SG', photo_url: 'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 18.5, {bias:0.3, var:3, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'NOP average on guard scoring', def_rank:14, min:32, usage:22, pace:101, total:220})]},

  // ── HOUSTON ROCKETS ──
  { id: 'p64', player_name: 'Kevin Durant', team: 'HOU', opponent: 'NOP', position: 'SF', photo_url: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 24.5, {bias:1, var:4, over_odds:-115, under_odds:-105, matchup_rating:'favorable', matchup_note:'NOP soft on SF scorers', def_rank:23, min:34, usage:28, pace:101, total:220}),
            mkProp('rebounds', 6.5, {bias:0.3, var:2, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'NOP average rebounding matchup', def_rank:14, min:34, usage:28, pace:101, total:220})]},
  { id: 'p65', player_name: 'Alperen Sengun', team: 'HOU', opponent: 'NOP', position: 'C', photo_url: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=100&h=100&fit=crop', is_starter: true, injury_status: 'healthy',
    props: [mkProp('points', 19.5, {bias:1, var:3, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'NOP weak interior defense', def_rank:25, min:30, usage:22, pace:101, total:220}),
            mkProp('rebounds', 9.5, {bias:0.5, var:2, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'NOP poor on defensive boards', def_rank:24, min:30, usage:22, pace:101, total:220})]},
];

// Build game logs: assign team schedule logs to each player's team
mockPlayers.forEach(player => {
  const teamOpps = teamSchedules[player.team] || [];
  const existingId = Object.keys(mockGameLogs).find(k => mockGameLogs[k] && mockGameLogs[k].length > 0 && player.id === k);
  if (!existingId) {
    mockGameLogs[player.id] = teamOpps.map((opp, i) => ({ date: `3/${10 + i}`, opp }));
  }
});

export const mockAlerts = [
  { id: 'a1', title: 'Anthony Edwards questionable', description: 'Ankle injury - listed as probable. Monitor minutes.', type: 'injury', player_name: 'Anthony Edwards', team: 'MIN', impact: 'negative', is_read: false },
  { id: 'a2', title: 'Line Movement: Jokic PRA', description: 'Line moved from 47.5 to 48.5. Sharp action on over.', type: 'line_movement', player_name: 'Nikola Jokic', team: 'DEN', impact: 'positive', is_read: false },
  { id: 'a3', title: 'Best Bets Posted', description: 'Today\'s top AI picks are live. 3 Tier A selections.', type: 'best_bet', impact: 'positive', is_read: true },
  { id: 'a4', title: 'Joel Embiid questionable', description: 'Knee issue - day-to-day. Possible DNP vs DET.', type: 'injury', player_name: 'Joel Embiid', team: 'PHI', impact: 'negative', is_read: false },
  { id: 'a5', title: 'Zion Williamson GTD', description: 'Hip injury - monitor warmup. Backup Alvarado may start.', type: 'injury', player_name: 'Zion Williamson', team: 'NOP', impact: 'negative', is_read: false },
  { id: 'a6', title: 'LaMelo Ball Ankle', description: 'LaMelo listed questionable vs IND. Massive usage bump if out.', type: 'injury', player_name: 'LaMelo Ball', team: 'CHA', impact: 'negative', is_read: false },
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
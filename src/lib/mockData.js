// Helper to generate game logs for a player
function makeLogs(id, opps) {
  return { id, logs: opps.map((opp, i) => ({ date: `4/${i + 1}`, opp })) };
}

// Recent opponents for today's Play-In teams
const teamSchedules = {
  MIA: ['TOR','CLE','CHI','IND','ORL','ATL','BKN','DET','WAS','CHA'],
  CHA: ['ATL','MIA','ORL','WAS','DET','BKN','NYK','PHI','TOR','IND'],
  POR: ['UTA','SAC','LAC','GSW','OKC','DAL','PHX','DEN','LAL','MEM'],
  PHX: ['UTA','POR','LAC','GSW','OKC','DAL','LAL','MEM','SAC','DEN'],
};

export const mockGameLogs = {};

function mkGames(base, variance, count = 10) {
  return Array.from({ length: count }, () =>
    parseFloat((base + (Math.random() * variance * 2 - variance)).toFixed(1))
  );
}

function mkProp(type, line, opts = {}) {
  const games = mkGames(line + (opts.bias || 0.5), opts.var || line * 0.18);
  const g5 = games.slice(-5);
  const avg10 = parseFloat((games.reduce((a,b)=>a+b,0)/games.length).toFixed(1));
  const avg5 = parseFloat((g5.reduce((a,b)=>a+b,0)/g5.length).toFixed(1));
  const hits = games.filter(v => v > line).length;
  const hit_rate = Math.round((hits/games.length)*100);
  const proj = parseFloat((avg5 * 1.02).toFixed(1));
  const edge = parseFloat((((proj - line)/line)*100).toFixed(1));
  const over_odds = opts.over_odds || -110;
  const under_odds = opts.under_odds || -110;
  const confidence_score = Math.min(10, Math.max(4, hits >= 8 ? 9 : hits >= 6 ? 7 : 5));
  const confidence_tier = confidence_score >= 8 ? 'A' : confidence_score >= 6 ? 'B' : 'C';
  const streak = hits >= 7 ? `Hit over in ${hits} of last 10` : hits <= 3 ? `Hit under in ${10-hits} of last 10` : `Split ${hits}-${10-hits} last 10`;
  return {
    prop_type: type, line, over_odds, under_odds, projection: proj, edge,
    hit_rate_last_10: hit_rate, avg_last_5: avg5, avg_last_10: avg10,
    streak_info: streak, confidence_score, confidence_tier,
    is_top_pick: confidence_score >= 8, is_lock: confidence_score === 10,
    best_value: edge > 8, trap_warning: opts.trap || false,
    last_5_games: g5, last_10_games: games,
    matchup_rating: opts.matchup_rating || 'neutral',
    matchup_note: opts.matchup_note || '',
    def_rank_vs_pos: opts.def_rank || 15,
    minutes_avg: opts.min || 32, usage_rate: opts.usage || 25,
    minutes_last_5: mkGames(opts.min || 32, 2, 5),
    pace_rating: opts.pace || 101.0,
    game_total: opts.total || 230.5,
  };
}

// ─────────────────────────────────────────────────────────────
// TODAY'S GAMES: April 14, 2026 — NBA Play-In Tournament
// Game 1: MIA Heat @ CHA Hornets  7:30 PM ET  O/U 230.5
// Game 2: POR Trail Blazers @ PHX Suns  10:00 PM ET
// ─────────────────────────────────────────────────────────────
export const mockPlayers = [

  // ══════════════════════════════════════════════
  // GAME 1: MIA Heat @ CHA Hornets — O/U 230.5
  // ══════════════════════════════════════════════

  // ── MIAMI HEAT ──
  { id: 'p1', player_name: 'Bam Adebayo', team: 'MIA', opponent: 'CHA', position: 'C',
    photo_url: 'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'healthy', injury_note: '',
    props: [
      mkProp('points', 21.5, {bias:0.5, var:4, over_odds:-115, under_odds:-105, matchup_rating:'favorable', matchup_note:'CHA ranks 25th vs Centers in scoring allowed', def_rank:25, min:33, usage:22, pace:101, total:230.5}),
      mkProp('rebounds', 10.5, {bias:0.5, var:2.5, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'CHA poor on defensive boards — 26th in league', def_rank:26, min:33, usage:22, pace:101, total:230.5}),
    ]},

  { id: 'p2', player_name: 'Tyler Herro', team: 'MIA', opponent: 'CHA', position: 'SG',
    photo_url: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'healthy', injury_note: '',
    props: [
      mkProp('points', 23.5, {bias:1, var:4, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'CHA allows 6th most pts to SGs this season', def_rank:24, min:34, usage:25, pace:101, total:230.5}),
      mkProp('3PM', 2.5, {bias:0.2, var:1.2, over_odds:-105, under_odds:-115, matchup_rating:'neutral', matchup_note:'CHA average on 3pt defense', def_rank:15, min:34, usage:25, pace:101, total:230.5}),
    ]},

  { id: 'p3', player_name: 'Nikola Jovic', team: 'MIA', opponent: 'CHA', position: 'SF',
    photo_url: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'healthy', injury_note: '',
    props: [
      mkProp('points', 13.5, {bias:0.3, var:3, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'CHA average vs SFs', def_rank:14, min:28, usage:16, pace:101, total:230.5}),
      mkProp('rebounds', 5.5, {bias:0.2, var:2, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'CHA neutral rebounding vs SFs', def_rank:14, min:28, usage:16, pace:101, total:230.5}),
    ]},

  { id: 'p4', player_name: 'Jimmy Butler', team: 'MIA', opponent: 'CHA', position: 'SF',
    photo_url: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'healthy', injury_note: '',
    props: [
      mkProp('points', 20.5, {bias:0.5, var:4, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'CHA weak on wing scoring in playoff situations', def_rank:22, min:34, usage:24, pace:101, total:230.5}),
    ]},

  { id: 'p5', player_name: 'Moussa Diabate', team: 'MIA', opponent: 'CHA', position: 'PF',
    photo_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop',
    is_starter: false, injury_status: 'healthy', injury_note: '',
    props: [
      mkProp('blocks', 1.5, {bias:0.1, var:0.8, over_odds:+170, under_odds:-210, matchup_rating:'neutral', matchup_note:'CHA neutral blocks matchup', def_rank:14, min:18, usage:12, pace:101, total:230.5}),
    ]},

  // ── CHARLOTTE HORNETS ──
  { id: 'p6', player_name: 'LaMelo Ball', team: 'CHA', opponent: 'MIA', position: 'PG',
    photo_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'healthy', injury_note: '',
    props: [
      mkProp('points', 23.5, {bias:1, var:5, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'MIA 20th vs PG scorers — allows points in transition', def_rank:20, min:36, usage:30, pace:101, total:230.5}),
      mkProp('rebounds', 5.5, {bias:0.2, var:2, over_odds:+118, under_odds:-140, matchup_rating:'neutral', matchup_note:'MIA average rebounding matchup', def_rank:15, min:36, usage:30, pace:101, total:230.5}),
      mkProp('assists', 8.5, {bias:0.5, var:2, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'MIA 22nd at limiting PG playmaking', def_rank:22, min:36, usage:30, pace:101, total:230.5}),
    ]},

  { id: 'p7', player_name: 'Brandon Miller', team: 'CHA', opponent: 'MIA', position: 'SF',
    photo_url: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'healthy', injury_note: '',
    props: [
      mkProp('points', 19.5, {bias:0.5, var:4, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'MIA solid wing defense — Butler & Avdija key', def_rank:12, min:34, usage:23, pace:101, total:230.5}),
      mkProp('rebounds', 5.5, {bias:0.2, var:2, over_odds:+119, under_odds:-142, matchup_rating:'neutral', matchup_note:'Neutral rebounding matchup for SFs', def_rank:14, min:34, usage:23, pace:101, total:230.5}),
      mkProp('3PM', 3.5, {bias:0.2, var:1.2, over_odds:+128, under_odds:-155, matchup_rating:'neutral', matchup_note:'MIA decent 3pt defense at home', def_rank:13, min:34, usage:23, pace:101, total:230.5}),
    ]},

  { id: 'p8', player_name: 'Kon Knueppel', team: 'CHA', opponent: 'MIA', position: 'SG',
    photo_url: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'healthy', injury_note: '',
    props: [
      mkProp('points', 16.5, {bias:0.3, var:3, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'MIA average vs SG scorers', def_rank:14, min:30, usage:20, pace:101, total:230.5}),
      mkProp('3PM', 3.5, {bias:0.3, var:1.2, over_odds:-105, under_odds:-115, matchup_rating:'neutral', matchup_note:'MIA decent perimeter D but Knueppel is hot from 3', def_rank:13, min:30, usage:20, pace:101, total:230.5}),
    ]},

  { id: 'p9', player_name: 'Mark Williams', team: 'CHA', opponent: 'MIA', position: 'C',
    photo_url: 'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'healthy', injury_note: '',
    props: [
      mkProp('points', 14.5, {bias:0.3, var:3, over_odds:-110, under_odds:-110, matchup_rating:'tough', matchup_note:'MIA elite interior defense — Adebayo anchors paint', def_rank:5, min:28, usage:16, pace:101, total:230.5}),
      mkProp('blocks', 1.5, {bias:0.1, var:0.8, over_odds:+155, under_odds:-190, matchup_rating:'favorable', matchup_note:'MIA drives into contact frequently', def_rank:22, min:28, usage:16, pace:101, total:230.5}),
    ]},

  { id: 'p10', player_name: 'Collin Sexton', team: 'CHA', opponent: 'MIA', position: 'SG',
    photo_url: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&h=100&fit=crop',
    is_starter: false, injury_status: 'healthy', injury_note: '',
    props: [
      mkProp('points', 15.5, {bias:0.3, var:3, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'MIA average 6th man scoring allowed', def_rank:14, min:24, usage:20, pace:101, total:230.5}),
    ]},

  // ══════════════════════════════════════════════
  // GAME 2: POR Trail Blazers @ PHX Suns — O/U ~222
  // ══════════════════════════════════════════════

  // ── PORTLAND TRAIL BLAZERS ──
  { id: 'p11', player_name: 'Deni Avdija', team: 'POR', opponent: 'PHX', position: 'SF',
    photo_url: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'healthy', injury_note: '',
    props: [
      mkProp('assists', 6.5, {bias:0.5, var:2, over_odds:+118, under_odds:-140, matchup_rating:'favorable', matchup_note:'PHX 23rd at limiting SF playmaking — Avdija leads POR in assists', def_rank:23, min:35, usage:24, pace:100, total:222}),
      mkProp('points', 18.5, {bias:0.5, var:3, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'PHX average vs SF scoring', def_rank:14, min:35, usage:24, pace:100, total:222}),
    ]},

  { id: 'p12', player_name: 'Damian Lillard', team: 'POR', opponent: 'PHX', position: 'PG',
    photo_url: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=100&h=100&fit=crop',
    is_starter: false, injury_status: 'out', injury_note: 'Left Achilles tendon injury management — OUT',
    props: [
      mkProp('points', 24.5, {bias:0, var:5, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'OUT — not playing tonight', def_rank:15, min:0, usage:0, pace:100, total:222, trap:true}),
    ]},

  { id: 'p13', player_name: 'Jerami Grant', team: 'POR', opponent: 'PHX', position: 'SF',
    photo_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'questionable', injury_note: 'Right calf strain — Questionable',
    props: [
      mkProp('points', 19.5, {bias:0.3, var:4, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'PHX average SF scoring allowed — monitor status', def_rank:14, min:30, usage:22, pace:100, total:222, trap:true}),
    ]},

  { id: 'p14', player_name: 'Anfernee Simons', team: 'POR', opponent: 'PHX', position: 'SG',
    photo_url: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'healthy', injury_note: '',
    props: [
      mkProp('points', 22.5, {bias:1, var:4, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'PHX weak vs SG scorers — 24th in league', def_rank:24, min:35, usage:26, pace:100, total:222}),
      mkProp('3PM', 3.5, {bias:0.2, var:1.2, over_odds:-105, under_odds:-115, matchup_rating:'favorable', matchup_note:'PHX gives up 3s to guards — bottom 10 this season', def_rank:24, min:35, usage:26, pace:100, total:222}),
    ]},

  { id: 'p15', player_name: 'Toumani Camara', team: 'POR', opponent: 'PHX', position: 'SF',
    photo_url: 'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'healthy', injury_note: '',
    props: [
      mkProp('points', 12.5, {bias:0.3, var:3, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'PHX neutral vs role SF scorers', def_rank:14, min:28, usage:16, pace:100, total:222}),
      mkProp('rebounds', 5.5, {bias:0.2, var:2, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'Even rebounding matchup', def_rank:14, min:28, usage:16, pace:100, total:222}),
    ]},

  // ── PHOENIX SUNS ──
  { id: 'p16', player_name: 'Devin Booker', team: 'PHX', opponent: 'POR', position: 'SG',
    photo_url: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'healthy', injury_note: '',
    props: [
      mkProp('points', 28.5, {bias:1.5, var:5, over_odds:-115, under_odds:-105, matchup_rating:'favorable', matchup_note:'POR 23rd vs SG scoring — gives up big numbers at home', def_rank:23, min:36, usage:32, pace:100, total:222}),
      mkProp('3PM', 3.5, {bias:0.3, var:1.2, over_odds:-105, under_odds:-115, matchup_rating:'favorable', matchup_note:'POR 22nd in 3pt defense this season', def_rank:22, min:36, usage:32, pace:100, total:222}),
    ]},

  { id: 'p17', player_name: 'Bradley Beal', team: 'PHX', opponent: 'POR', position: 'SG',
    photo_url: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'healthy', injury_note: '',
    props: [
      mkProp('points', 18.5, {bias:0.5, var:4, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'POR soft on SG scorers — 23rd vs position', def_rank:23, min:30, usage:22, pace:100, total:222}),
      mkProp('assists', 5.5, {bias:0.3, var:1.5, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'Neutral playmaking matchup', def_rank:14, min:30, usage:22, pace:100, total:222}),
    ]},

  { id: 'p18', player_name: 'Grayson Allen', team: 'PHX', opponent: 'POR', position: 'SG',
    photo_url: 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'questionable', injury_note: 'Hamstring — Questionable',
    props: [
      mkProp('3PM', 2.5, {bias:0.1, var:1, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'Monitor status — hamstring issue. POR average 3pt D', def_rank:14, min:28, usage:17, pace:100, total:222, trap:true}),
      mkProp('points', 13.5, {bias:0.2, var:3, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'Questionable — if active POR soft on SGs', def_rank:22, min:28, usage:17, pace:100, total:222, trap:true}),
    ]},

  { id: 'p19', player_name: 'Mark Williams', team: 'PHX', opponent: 'POR', position: 'C',
    photo_url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100&h=100&fit=crop',
    is_starter: true, injury_status: 'healthy', injury_note: '',
    props: [
      mkProp('points', 14.5, {bias:0.3, var:3, over_odds:-110, under_odds:-110, matchup_rating:'neutral', matchup_note:'POR average interior defense', def_rank:14, min:28, usage:16, pace:100, total:222}),
      mkProp('blocks', 1.5, {bias:0.1, var:0.8, over_odds:+155, under_odds:-190, matchup_rating:'favorable', matchup_note:'POR drives to rim frequently — good blocks spot', def_rank:22, min:28, usage:16, pace:100, total:222}),
    ]},

  { id: 'p20', player_name: 'Jalen Green', team: 'PHX', opponent: 'POR', position: 'SG',
    photo_url: 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=100&h=100&fit=crop',
    is_starter: false, injury_status: 'healthy', injury_note: '',
    props: [
      mkProp('points', 16.5, {bias:0.3, var:3, over_odds:-110, under_odds:-110, matchup_rating:'favorable', matchup_note:'POR weak on bench SG scoring', def_rank:24, min:26, usage:20, pace:100, total:222}),
      mkProp('3PM', 2.5, {bias:0.2, var:1, over_odds:-105, under_odds:-115, matchup_rating:'favorable', matchup_note:'POR 22nd in 3pt defense', def_rank:22, min:26, usage:20, pace:100, total:222}),
    ]},
];

// Build game logs: assign team schedule logs to each player's team
mockPlayers.forEach(player => {
  const teamOpps = teamSchedules[player.team] || [];
  mockGameLogs[player.id] = teamOpps.map((opp, i) => ({ date: `4/${i + 1}`, opp }));
});

export const mockAlerts = [
  { id: 'a1', title: 'Damian Lillard OUT Tonight', description: 'Left Achilles tendon injury management — Lillard will not play vs PHX in Play-In.', type: 'injury', player_name: 'Damian Lillard', team: 'POR', impact: 'negative', is_read: false },
  { id: 'a2', title: 'Jerami Grant Questionable', description: 'Right calf strain — Jerami Grant listed questionable for POR vs PHX. Monitor warmups.', type: 'injury', player_name: 'Jerami Grant', team: 'POR', impact: 'negative', is_read: false },
  { id: 'a3', title: 'Grayson Allen Questionable', description: 'Hamstring issue — Grayson Allen questionable for PHX vs POR. Trap pick if he plays limited minutes.', type: 'injury', player_name: 'Grayson Allen', team: 'PHX', impact: 'negative', is_read: false },
  { id: 'a4', title: 'Play-In: CHA -5.5 vs MIA', description: 'Charlotte favored by 5.5 at home vs Miami. O/U 230.5 — high-scoring environment favors props.', type: 'line_movement', impact: 'positive', is_read: false },
  { id: 'a5', title: 'Best Bet: Deni Avdija Assists', description: 'Avdija over 6.5 assists (+118) — PHX 23rd at limiting SF playmaking. Dimers model: 57.1% hit rate.', type: 'best_bet', player_name: 'Deni Avdija', team: 'POR', impact: 'positive', is_read: false },
  { id: 'a6', title: 'Best Bet: Brandon Miller 3PM', description: 'Miller over 3.5 3-pointers made (+128) — He\'s been red hot from 3 in last 5 games.', type: 'best_bet', player_name: 'Brandon Miller', team: 'CHA', impact: 'positive', is_read: true },
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
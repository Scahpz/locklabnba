export const mockGameLogs = {};

function mkGames(base, variance, count = 10, integer = true) {
  return Array.from({ length: count }, () => {
    const raw = base + (Math.random() * variance * 2 - variance);
    return integer ? Math.round(raw) : parseFloat(raw.toFixed(1));
  });
}

const integerPropTypes = ['points', 'rebounds', 'assists', 'steals', 'blocks', 'turnovers', '3PM', 'PRA'];

function mkProp(type, line, opts = {}) {
  const isInt = integerPropTypes.includes(type);
  const games = mkGames(line + (opts.bias || 0.5), opts.var || line * 0.18, 10, isInt);
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
  const minAvg = opts.min || 32;
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
    minutes_avg: minAvg, usage_rate: opts.usage || 25,
    minutes_last_5: mkGames(minAvg, 2, 5),
    pace_rating: opts.pace || 101.0,
    game_total: opts.total || 224.5,
  };
}

function mkPlayer(id, name, team, opp, pos, starter, injStatus, injNote, props) {
  return { id, player_name: name, team, opponent: opp, position: pos, photo_url: '', is_starter: starter, injury_status: injStatus, injury_note: injNote, props };
}

// ─────────────────────────────────────────────────────────────
// ALL 30 NBA TEAMS — 2025-26 ROSTERS (key players)
// ─────────────────────────────────────────────────────────────
export const mockPlayers = [

  // ══ ATLANTA HAWKS ══
  mkPlayer('atl1','Trae Young','ATL','MIA','PG',true,'healthy','',[
    mkProp('points',25.5,{min:34,usage:31,pace:102,total:228}),
    mkProp('assists',10.5,{min:34,usage:31,pace:102,total:228}),
    mkProp('3PM',3.5,{min:34,usage:31,pace:102,total:228}),
  ]),
  mkPlayer('atl2','Dyson Daniels','ATL','MIA','SG',true,'healthy','',[
    mkProp('points',16.5,{min:32,usage:18,pace:102,total:228}),
    mkProp('steals',2.5,{min:32,usage:18,pace:102,total:228}),
  ]),
  mkPlayer('atl3','Onyeka Okongwu','ATL','MIA','C',true,'healthy','',[
    mkProp('points',14.5,{min:28,usage:16,pace:102,total:228}),
    mkProp('rebounds',9.5,{min:28,usage:16,pace:102,total:228}),
  ]),
  mkPlayer('atl4','Zaccharie Risacher','ATL','MIA','SF',true,'healthy','',[
    mkProp('points',13.5,{min:28,usage:15,pace:102,total:228}),
  ]),
  mkPlayer('atl5','De\'Andre Hunter','ATL','MIA','SF',false,'healthy','',[
    mkProp('points',14.5,{min:28,usage:17,pace:102,total:228}),
  ]),

  // ══ BOSTON CELTICS ══
  mkPlayer('bos1','Jayson Tatum','BOS','NYK','SF',true,'healthy','',[
    mkProp('points',27.5,{min:36,usage:31,pace:100,total:222}),
    mkProp('rebounds',8.5,{min:36,usage:31,pace:100,total:222}),
    mkProp('assists',4.5,{min:36,usage:31,pace:100,total:222}),
  ]),
  mkPlayer('bos2','Jaylen Brown','BOS','NYK','SG',true,'healthy','',[
    mkProp('points',22.5,{min:34,usage:25,pace:100,total:222}),
    mkProp('3PM',2.5,{min:34,usage:25,pace:100,total:222}),
  ]),
  mkPlayer('bos3','Kristaps Porzingis','BOS','NYK','C',true,'healthy','',[
    mkProp('points',18.5,{min:28,usage:20,pace:100,total:222}),
    mkProp('blocks',1.5,{min:28,usage:20,pace:100,total:222}),
  ]),
  mkPlayer('bos4','Jrue Holiday','BOS','NYK','PG',true,'healthy','',[
    mkProp('points',12.5,{min:32,usage:16,pace:100,total:222}),
    mkProp('assists',5.5,{min:32,usage:16,pace:100,total:222}),
  ]),
  mkPlayer('bos5','Al Horford','BOS','NYK','PF',true,'healthy','',[
    mkProp('points',9.5,{min:26,usage:13,pace:100,total:222}),
    mkProp('3PM',1.5,{min:26,usage:13,pace:100,total:222}),
  ]),

  // ══ BROOKLYN NETS ══
  mkPlayer('bkn1','Cam Thomas','BKN','PHI','SG',true,'healthy','',[
    mkProp('points',23.5,{min:33,usage:28,pace:99,total:220}),
    mkProp('assists',4.5,{min:33,usage:28,pace:99,total:220}),
  ]),
  mkPlayer('bkn2','Ziaire Williams','BKN','PHI','SF',true,'healthy','',[
    mkProp('points',14.5,{min:29,usage:17,pace:99,total:220}),
    mkProp('3PM',2.5,{min:29,usage:17,pace:99,total:220}),
  ]),
  mkPlayer('bkn3','Nic Claxton','BKN','PHI','C',true,'healthy','',[
    mkProp('points',11.5,{min:27,usage:14,pace:99,total:220}),
    mkProp('rebounds',8.5,{min:27,usage:14,pace:99,total:220}),
    mkProp('blocks',2.5,{min:27,usage:14,pace:99,total:220}),
  ]),
  mkPlayer('bkn4','Ben Simmons','BKN','PHI','PG',false,'questionable','Knee management',[]
    .concat([mkProp('assists',6.5,{min:28,usage:16,pace:99,total:220,trap:true})])),
  mkPlayer('bkn5','Trendon Watford','BKN','PHI','PF',false,'healthy','',[
    mkProp('points',10.5,{min:22,usage:13,pace:99,total:220}),
  ]),

  // ══ CHARLOTTE HORNETS ══
  mkPlayer('cha1','LaMelo Ball','CHA','MIA','PG',true,'healthy','',[
    mkProp('points',23.5,{min:36,usage:30,pace:101,total:230}),
    mkProp('rebounds',5.5,{min:36,usage:30,pace:101,total:230}),
    mkProp('assists',8.5,{min:36,usage:30,pace:101,total:230}),
  ]),
  mkPlayer('cha2','Brandon Miller','CHA','MIA','SF',true,'healthy','',[
    mkProp('points',19.5,{min:34,usage:23,pace:101,total:230}),
    mkProp('3PM',3.5,{min:34,usage:23,pace:101,total:230}),
  ]),
  mkPlayer('cha3','Kon Knueppel','CHA','MIA','SG',true,'healthy','',[
    mkProp('points',16.5,{min:30,usage:20,pace:101,total:230}),
    mkProp('3PM',3.5,{min:30,usage:20,pace:101,total:230}),
  ]),
  mkPlayer('cha4','Mark Williams','CHA','MIA','C',true,'healthy','',[
    mkProp('points',14.5,{min:28,usage:16,pace:101,total:230}),
    mkProp('rebounds',9.5,{min:28,usage:16,pace:101,total:230}),
  ]),
  mkPlayer('cha5','Collin Sexton','CHA','MIA','SG',false,'healthy','',[
    mkProp('points',15.5,{min:24,usage:20,pace:101,total:230}),
  ]),

  // ══ CHICAGO BULLS ══
  mkPlayer('chi1','Zach LaVine','CHI','IND','SG',true,'healthy','',[
    mkProp('points',24.5,{min:34,usage:27,pace:101,total:225}),
    mkProp('3PM',3.5,{min:34,usage:27,pace:101,total:225}),
  ]),
  mkPlayer('chi2','Nikola Vucevic','CHI','IND','C',true,'healthy','',[
    mkProp('points',18.5,{min:30,usage:20,pace:101,total:225}),
    mkProp('rebounds',10.5,{min:30,usage:20,pace:101,total:225}),
  ]),
  mkPlayer('chi3','Coby White','CHI','IND','PG',true,'healthy','',[
    mkProp('points',19.5,{min:33,usage:22,pace:101,total:225}),
    mkProp('assists',5.5,{min:33,usage:22,pace:101,total:225}),
  ]),
  mkPlayer('chi4','Patrick Williams','CHI','IND','SF',true,'healthy','',[
    mkProp('points',13.5,{min:28,usage:15,pace:101,total:225}),
  ]),
  mkPlayer('chi5','Josh Giddey','CHI','IND','PG',true,'healthy','',[
    mkProp('points',14.5,{min:30,usage:18,pace:101,total:225}),
    mkProp('assists',6.5,{min:30,usage:18,pace:101,total:225}),
    mkProp('rebounds',6.5,{min:30,usage:18,pace:101,total:225}),
  ]),

  // ══ CLEVELAND CAVALIERS ══
  mkPlayer('cle1','Donovan Mitchell','CLE','BOS','SG',true,'healthy','',[
    mkProp('points',26.5,{min:34,usage:30,pace:99,total:221}),
    mkProp('assists',6.5,{min:34,usage:30,pace:99,total:221}),
  ]),
  mkPlayer('cle2','Darius Garland','CLE','BOS','PG',true,'healthy','',[
    mkProp('points',20.5,{min:32,usage:24,pace:99,total:221}),
    mkProp('assists',7.5,{min:32,usage:24,pace:99,total:221}),
  ]),
  mkPlayer('cle3','Evan Mobley','CLE','BOS','C',true,'healthy','',[
    mkProp('points',16.5,{min:32,usage:18,pace:99,total:221}),
    mkProp('rebounds',9.5,{min:32,usage:18,pace:99,total:221}),
    mkProp('blocks',2.5,{min:32,usage:18,pace:99,total:221}),
  ]),
  mkPlayer('cle4','Jarrett Allen','CLE','BOS','C',true,'healthy','',[
    mkProp('rebounds',10.5,{min:28,usage:14,pace:99,total:221}),
    mkProp('points',12.5,{min:28,usage:14,pace:99,total:221}),
  ]),
  mkPlayer('cle5','Max Strus','CLE','BOS','SF',false,'healthy','',[
    mkProp('3PM',2.5,{min:25,usage:15,pace:99,total:221}),
    mkProp('points',11.5,{min:25,usage:15,pace:99,total:221}),
  ]),

  // ══ DALLAS MAVERICKS ══
  mkPlayer('dal1','Luka Doncic','DAL','OKC','PG',true,'healthy','',[
    mkProp('points',29.5,{min:36,usage:36,pace:101,total:226}),
    mkProp('rebounds',8.5,{min:36,usage:36,pace:101,total:226}),
    mkProp('assists',8.5,{min:36,usage:36,pace:101,total:226}),
  ]),
  mkPlayer('dal2','Kyrie Irving','DAL','OKC','SG',true,'healthy','',[
    mkProp('points',24.5,{min:34,usage:28,pace:101,total:226}),
    mkProp('assists',5.5,{min:34,usage:28,pace:101,total:226}),
  ]),
  mkPlayer('dal3','P.J. Washington','DAL','OKC','PF',true,'healthy','',[
    mkProp('points',14.5,{min:29,usage:16,pace:101,total:226}),
    mkProp('3PM',2.5,{min:29,usage:16,pace:101,total:226}),
  ]),
  mkPlayer('dal4','Dereck Lively II','DAL','OKC','C',true,'healthy','',[
    mkProp('points',9.5,{min:24,usage:12,pace:101,total:226}),
    mkProp('rebounds',7.5,{min:24,usage:12,pace:101,total:226}),
    mkProp('blocks',1.5,{min:24,usage:12,pace:101,total:226}),
  ]),
  mkPlayer('dal5','Klay Thompson','DAL','OKC','SG',true,'healthy','',[
    mkProp('points',14.5,{min:28,usage:16,pace:101,total:226}),
    mkProp('3PM',2.5,{min:28,usage:16,pace:101,total:226}),
  ]),

  // ══ DENVER NUGGETS ══
  mkPlayer('den1','Nikola Jokic','DEN','LAL','C',true,'healthy','',[
    mkProp('points',27.5,{min:34,usage:30,pace:100,total:224}),
    mkProp('rebounds',12.5,{min:34,usage:30,pace:100,total:224}),
    mkProp('assists',9.5,{min:34,usage:30,pace:100,total:224}),
  ]),
  mkPlayer('den2','Jamal Murray','DEN','LAL','PG',true,'healthy','',[
    mkProp('points',21.5,{min:33,usage:24,pace:100,total:224}),
    mkProp('assists',6.5,{min:33,usage:24,pace:100,total:224}),
  ]),
  mkPlayer('den3','Michael Porter Jr.','DEN','LAL','SF',true,'healthy','',[
    mkProp('points',19.5,{min:31,usage:20,pace:100,total:224}),
    mkProp('rebounds',7.5,{min:31,usage:20,pace:100,total:224}),
    mkProp('3PM',3.5,{min:31,usage:20,pace:100,total:224}),
  ]),
  mkPlayer('den4','Aaron Gordon','DEN','LAL','PF',true,'healthy','',[
    mkProp('points',13.5,{min:30,usage:16,pace:100,total:224}),
    mkProp('rebounds',6.5,{min:30,usage:16,pace:100,total:224}),
  ]),
  mkPlayer('den5','Kentavious Caldwell-Pope','DEN','LAL','SG',true,'healthy','',[
    mkProp('points',12.5,{min:28,usage:14,pace:100,total:224}),
    mkProp('3PM',2.5,{min:28,usage:14,pace:100,total:224}),
  ]),

  // ══ DETROIT PISTONS ══
  mkPlayer('det1','Cade Cunningham','DET','TOR','PG',true,'healthy','',[
    mkProp('points',24.5,{min:35,usage:30,pace:100,total:222}),
    mkProp('assists',9.5,{min:35,usage:30,pace:100,total:222}),
    mkProp('rebounds',4.5,{min:35,usage:30,pace:100,total:222}),
  ]),
  mkPlayer('det2','Jaden Ivey','DET','TOR','SG',true,'healthy','',[
    mkProp('points',17.5,{min:30,usage:20,pace:100,total:222}),
    mkProp('assists',5.5,{min:30,usage:20,pace:100,total:222}),
  ]),
  mkPlayer('det3','Tobias Harris','DET','TOR','PF',true,'healthy','',[
    mkProp('points',15.5,{min:28,usage:18,pace:100,total:222}),
    mkProp('rebounds',6.5,{min:28,usage:18,pace:100,total:222}),
  ]),
  mkPlayer('det4','Jalen Duren','DET','TOR','C',true,'healthy','',[
    mkProp('points',11.5,{min:26,usage:13,pace:100,total:222}),
    mkProp('rebounds',11.5,{min:26,usage:13,pace:100,total:222}),
  ]),
  mkPlayer('det5','Malik Beasley','DET','TOR','SG',false,'healthy','',[
    mkProp('points',12.5,{min:22,usage:16,pace:100,total:222}),
    mkProp('3PM',2.5,{min:22,usage:16,pace:100,total:222}),
  ]),

  // ══ GOLDEN STATE WARRIORS ══
  mkPlayer('gsw1','Stephen Curry','GSW','LAC','PG',true,'healthy','',[
    mkProp('points',26.5,{min:34,usage:30,pace:101,total:225}),
    mkProp('3PM',4.5,{min:34,usage:30,pace:101,total:225}),
    mkProp('assists',6.5,{min:34,usage:30,pace:101,total:225}),
  ]),
  mkPlayer('gsw2','Andrew Wiggins','GSW','LAC','SF',true,'healthy','',[
    mkProp('points',17.5,{min:32,usage:19,pace:101,total:225}),
    mkProp('rebounds',5.5,{min:32,usage:19,pace:101,total:225}),
  ]),
  mkPlayer('gsw3','Draymond Green','GSW','LAC','PF',true,'healthy','',[
    mkProp('assists',6.5,{min:30,usage:16,pace:101,total:225}),
    mkProp('rebounds',7.5,{min:30,usage:16,pace:101,total:225}),
  ]),
  mkPlayer('gsw4','Buddy Hield','GSW','LAC','SG',false,'healthy','',[
    mkProp('points',13.5,{min:24,usage:17,pace:101,total:225}),
    mkProp('3PM',3.5,{min:24,usage:17,pace:101,total:225}),
  ]),
  mkPlayer('gsw5','Moses Moody','GSW','LAC','SG',true,'healthy','',[
    mkProp('points',13.5,{min:26,usage:15,pace:101,total:225}),
    mkProp('3PM',2.5,{min:26,usage:15,pace:101,total:225}),
  ]),

  // ══ HOUSTON ROCKETS ══
  mkPlayer('hou1','Alperen Sengun','HOU','MEM','C',true,'healthy','',[
    mkProp('points',21.5,{min:30,usage:24,pace:102,total:226}),
    mkProp('rebounds',9.5,{min:30,usage:24,pace:102,total:226}),
    mkProp('assists',5.5,{min:30,usage:24,pace:102,total:226}),
  ]),
  mkPlayer('hou2','Jalen Green','HOU','MEM','SG',true,'healthy','',[
    mkProp('points',23.5,{min:33,usage:26,pace:102,total:226}),
    mkProp('3PM',3.5,{min:33,usage:26,pace:102,total:226}),
  ]),
  mkPlayer('hou3','Amen Thompson','HOU','MEM','SF',true,'healthy','',[
    mkProp('points',14.5,{min:30,usage:16,pace:102,total:226}),
    mkProp('rebounds',7.5,{min:30,usage:16,pace:102,total:226}),
    mkProp('steals',1.5,{min:30,usage:16,pace:102,total:226}),
  ]),
  mkPlayer('hou4','Dillon Brooks','HOU','MEM','SF',true,'healthy','',[
    mkProp('points',13.5,{min:28,usage:16,pace:102,total:226}),
    mkProp('3PM',2.5,{min:28,usage:16,pace:102,total:226}),
  ]),
  mkPlayer('hou5','Fred VanVleet','HOU','MEM','PG',true,'healthy','',[
    mkProp('points',14.5,{min:30,usage:18,pace:102,total:226}),
    mkProp('assists',6.5,{min:30,usage:18,pace:102,total:226}),
    mkProp('3PM',2.5,{min:30,usage:18,pace:102,total:226}),
  ]),

  // ══ INDIANA PACERS ══
  mkPlayer('ind1','Tyrese Haliburton','IND','CHI','PG',true,'healthy','',[
    mkProp('points',20.5,{min:33,usage:26,pace:103,total:230}),
    mkProp('assists',10.5,{min:33,usage:26,pace:103,total:230}),
    mkProp('3PM',3.5,{min:33,usage:26,pace:103,total:230}),
  ]),
  mkPlayer('ind2','Pascal Siakam','IND','CHI','PF',true,'healthy','',[
    mkProp('points',22.5,{min:34,usage:26,pace:103,total:230}),
    mkProp('rebounds',7.5,{min:34,usage:26,pace:103,total:230}),
    mkProp('assists',4.5,{min:34,usage:26,pace:103,total:230}),
  ]),
  mkPlayer('ind3','Bennedict Mathurin','IND','CHI','SG',true,'healthy','',[
    mkProp('points',17.5,{min:28,usage:20,pace:103,total:230}),
    mkProp('3PM',2.5,{min:28,usage:20,pace:103,total:230}),
  ]),
  mkPlayer('ind4','Myles Turner','IND','CHI','C',true,'healthy','',[
    mkProp('points',13.5,{min:27,usage:14,pace:103,total:230}),
    mkProp('blocks',2.5,{min:27,usage:14,pace:103,total:230}),
    mkProp('3PM',1.5,{min:27,usage:14,pace:103,total:230}),
  ]),
  mkPlayer('ind5','Andrew Nembhard','IND','CHI','PG',false,'healthy','',[
    mkProp('points',11.5,{min:25,usage:14,pace:103,total:230}),
    mkProp('assists',5.5,{min:25,usage:14,pace:103,total:230}),
  ]),

  // ══ LOS ANGELES CLIPPERS ══
  mkPlayer('lac1','Kawhi Leonard','LAC','GSW','SF',true,'questionable','Load management',[]
    .concat([mkProp('points',22.5,{min:28,usage:27,pace:99,total:218,trap:true})])),
  mkPlayer('lac2','James Harden','LAC','GSW','PG',true,'healthy','',[
    mkProp('points',18.5,{min:32,usage:24,pace:99,total:218}),
    mkProp('assists',8.5,{min:32,usage:24,pace:99,total:218}),
    mkProp('3PM',2.5,{min:32,usage:24,pace:99,total:218}),
  ]),
  mkPlayer('lac3','Norman Powell','LAC','GSW','SG',true,'healthy','',[
    mkProp('points',24.5,{min:33,usage:26,pace:99,total:218}),
    mkProp('3PM',3.5,{min:33,usage:26,pace:99,total:218}),
  ]),
  mkPlayer('lac4','Ivica Zubac','LAC','GSW','C',true,'healthy','',[
    mkProp('rebounds',11.5,{min:28,usage:13,pace:99,total:218}),
    mkProp('points',11.5,{min:28,usage:13,pace:99,total:218}),
  ]),
  mkPlayer('lac5','Terance Mann','LAC','GSW','SF',false,'healthy','',[
    mkProp('points',9.5,{min:22,usage:13,pace:99,total:218}),
    mkProp('3PM',1.5,{min:22,usage:13,pace:99,total:218}),
  ]),

  // ══ LOS ANGELES LAKERS ══
  mkPlayer('lal1','LeBron James','LAL','DEN','SF',true,'healthy','',[
    mkProp('points',23.5,{min:34,usage:29,pace:100,total:224}),
    mkProp('assists',8.5,{min:34,usage:29,pace:100,total:224}),
    mkProp('rebounds',7.5,{min:34,usage:29,pace:100,total:224}),
  ]),
  mkPlayer('lal2','Anthony Davis','LAL','DEN','C',true,'healthy','',[
    mkProp('points',25.5,{min:34,usage:28,pace:100,total:224}),
    mkProp('rebounds',12.5,{min:34,usage:28,pace:100,total:224}),
    mkProp('blocks',2.5,{min:34,usage:28,pace:100,total:224}),
  ]),
  mkPlayer('lal3','Austin Reaves','LAL','DEN','SG',true,'healthy','',[
    mkProp('points',18.5,{min:32,usage:20,pace:100,total:224}),
    mkProp('3PM',2.5,{min:32,usage:20,pace:100,total:224}),
    mkProp('assists',5.5,{min:32,usage:20,pace:100,total:224}),
  ]),
  mkPlayer('lal4','Rui Hachimura','LAL','DEN','PF',true,'healthy','',[
    mkProp('points',13.5,{min:26,usage:15,pace:100,total:224}),
    mkProp('rebounds',4.5,{min:26,usage:15,pace:100,total:224}),
  ]),
  mkPlayer('lal5','D\'Angelo Russell','LAL','DEN','PG',false,'healthy','',[
    mkProp('points',14.5,{min:25,usage:18,pace:100,total:224}),
    mkProp('3PM',2.5,{min:25,usage:18,pace:100,total:224}),
  ]),

  // ══ MEMPHIS GRIZZLIES ══
  mkPlayer('mem1','Ja Morant','MEM','HOU','PG',true,'healthy','',[
    mkProp('points',25.5,{min:33,usage:29,pace:103,total:226}),
    mkProp('assists',8.5,{min:33,usage:29,pace:103,total:226}),
  ]),
  mkPlayer('mem2','Jaren Jackson Jr.','MEM','HOU','C',true,'healthy','',[
    mkProp('points',22.5,{min:30,usage:25,pace:103,total:226}),
    mkProp('blocks',3.5,{min:30,usage:25,pace:103,total:226}),
    mkProp('3PM',2.5,{min:30,usage:25,pace:103,total:226}),
  ]),
  mkPlayer('mem3','Desmond Bane','MEM','HOU','SG',true,'healthy','',[
    mkProp('points',20.5,{min:32,usage:22,pace:103,total:226}),
    mkProp('3PM',3.5,{min:32,usage:22,pace:103,total:226}),
  ]),
  mkPlayer('mem4','Zach Edey','MEM','HOU','C',true,'healthy','',[
    mkProp('rebounds',10.5,{min:24,usage:14,pace:103,total:226}),
    mkProp('points',10.5,{min:24,usage:14,pace:103,total:226}),
  ]),
  mkPlayer('mem5','Scotty Pippen Jr.','MEM','HOU','PG',false,'healthy','',[
    mkProp('points',13.5,{min:22,usage:17,pace:103,total:226}),
  ]),

  // ══ MIAMI HEAT ══
  mkPlayer('mia1','Bam Adebayo','MIA','CHA','C',true,'healthy','',[
    mkProp('points',21.5,{min:33,usage:22,pace:101,total:230}),
    mkProp('rebounds',10.5,{min:33,usage:22,pace:101,total:230}),
    mkProp('assists',4.5,{min:33,usage:22,pace:101,total:230}),
  ]),
  mkPlayer('mia2','Tyler Herro','MIA','CHA','SG',true,'healthy','',[
    mkProp('points',23.5,{min:34,usage:25,pace:101,total:230}),
    mkProp('3PM',2.5,{min:34,usage:25,pace:101,total:230}),
    mkProp('assists',5.5,{min:34,usage:25,pace:101,total:230}),
  ]),
  mkPlayer('mia3','Jimmy Butler','MIA','CHA','SF',true,'healthy','',[
    mkProp('points',20.5,{min:34,usage:24,pace:101,total:230}),
    mkProp('assists',5.5,{min:34,usage:24,pace:101,total:230}),
  ]),
  mkPlayer('mia4','Nikola Jovic','MIA','CHA','SF',true,'healthy','',[
    mkProp('points',13.5,{min:28,usage:16,pace:101,total:230}),
    mkProp('rebounds',5.5,{min:28,usage:16,pace:101,total:230}),
  ]),
  mkPlayer('mia5','Haywood Highsmith','MIA','CHA','PF',false,'healthy','',[
    mkProp('points',9.5,{min:20,usage:12,pace:101,total:230}),
    mkProp('3PM',1.5,{min:20,usage:12,pace:101,total:230}),
  ]),

  // ══ MILWAUKEE BUCKS ══
  mkPlayer('mil1','Giannis Antetokounmpo','MIL','IND','PF',true,'healthy','',[
    mkProp('points',30.5,{min:34,usage:34,pace:101,total:228}),
    mkProp('rebounds',11.5,{min:34,usage:34,pace:101,total:228}),
    mkProp('assists',6.5,{min:34,usage:34,pace:101,total:228}),
  ]),
  mkPlayer('mil2','Damian Lillard','MIL','IND','PG',true,'healthy','',[
    mkProp('points',25.5,{min:34,usage:28,pace:101,total:228}),
    mkProp('3PM',4.5,{min:34,usage:28,pace:101,total:228}),
    mkProp('assists',7.5,{min:34,usage:28,pace:101,total:228}),
  ]),
  mkPlayer('mil3','Brook Lopez','MIL','IND','C',true,'healthy','',[
    mkProp('points',13.5,{min:28,usage:15,pace:101,total:228}),
    mkProp('blocks',2.5,{min:28,usage:15,pace:101,total:228}),
    mkProp('3PM',2.5,{min:28,usage:15,pace:101,total:228}),
  ]),
  mkPlayer('mil4','Khris Middleton','MIL','IND','SF',true,'healthy','',[
    mkProp('points',16.5,{min:28,usage:18,pace:101,total:228}),
    mkProp('assists',4.5,{min:28,usage:18,pace:101,total:228}),
  ]),
  mkPlayer('mil5','Bobby Portis','MIL','IND','PF',false,'healthy','',[
    mkProp('points',12.5,{min:22,usage:15,pace:101,total:228}),
    mkProp('rebounds',7.5,{min:22,usage:15,pace:101,total:228}),
  ]),

  // ══ MINNESOTA TIMBERWOLVES ══
  mkPlayer('min1','Anthony Edwards','MIN','DEN','SG',true,'healthy','',[
    mkProp('points',26.5,{min:35,usage:30,pace:100,total:222}),
    mkProp('3PM',3.5,{min:35,usage:30,pace:100,total:222}),
    mkProp('assists',5.5,{min:35,usage:30,pace:100,total:222}),
  ]),
  mkPlayer('min2','Karl-Anthony Towns','MIN','DEN','C',true,'healthy','',[
    mkProp('points',23.5,{min:33,usage:26,pace:100,total:222}),
    mkProp('rebounds',8.5,{min:33,usage:26,pace:100,total:222}),
    mkProp('3PM',2.5,{min:33,usage:26,pace:100,total:222}),
  ]),
  mkPlayer('min3','Rudy Gobert','MIN','DEN','C',true,'healthy','',[
    mkProp('rebounds',12.5,{min:30,usage:13,pace:100,total:222}),
    mkProp('points',10.5,{min:30,usage:13,pace:100,total:222}),
    mkProp('blocks',2.5,{min:30,usage:13,pace:100,total:222}),
  ]),
  mkPlayer('min4','Jaden McDaniels','MIN','DEN','SF',true,'healthy','',[
    mkProp('points',14.5,{min:30,usage:15,pace:100,total:222}),
    mkProp('3PM',2.5,{min:30,usage:15,pace:100,total:222}),
  ]),
  mkPlayer('min5','Mike Conley','MIN','DEN','PG',false,'healthy','',[
    mkProp('assists',6.5,{min:26,usage:15,pace:100,total:222}),
    mkProp('3PM',2.5,{min:26,usage:15,pace:100,total:222}),
  ]),

  // ══ NEW ORLEANS PELICANS ══
  mkPlayer('nop1','Zion Williamson','NOP','SAC','PF',true,'healthy','',[
    mkProp('points',24.5,{min:30,usage:30,pace:100,total:222}),
    mkProp('rebounds',5.5,{min:30,usage:30,pace:100,total:222}),
    mkProp('assists',4.5,{min:30,usage:30,pace:100,total:222}),
  ]),
  mkPlayer('nop2','CJ McCollum','NOP','SAC','SG',true,'healthy','',[
    mkProp('points',19.5,{min:32,usage:22,pace:100,total:222}),
    mkProp('3PM',3.5,{min:32,usage:22,pace:100,total:222}),
  ]),
  mkPlayer('nop3','Brandon Ingram','NOP','SAC','SF',true,'healthy','',[
    mkProp('points',22.5,{min:33,usage:24,pace:100,total:222}),
    mkProp('assists',5.5,{min:33,usage:24,pace:100,total:222}),
  ]),
  mkPlayer('nop4','Jonas Valanciunas','NOP','SAC','C',true,'healthy','',[
    mkProp('rebounds',11.5,{min:26,usage:14,pace:100,total:222}),
    mkProp('points',12.5,{min:26,usage:14,pace:100,total:222}),
  ]),
  mkPlayer('nop5','Herb Jones','NOP','SAC','SF',false,'healthy','',[
    mkProp('steals',1.5,{min:28,usage:12,pace:100,total:222}),
    mkProp('points',8.5,{min:28,usage:12,pace:100,total:222}),
  ]),

  // ══ NEW YORK KNICKS ══
  mkPlayer('nyk1','Jalen Brunson','NYK','BOS','PG',true,'healthy','',[
    mkProp('points',28.5,{min:35,usage:32,pace:99,total:218}),
    mkProp('assists',6.5,{min:35,usage:32,pace:99,total:218}),
  ]),
  mkPlayer('nyk2','Karl-Anthony Towns','NYK','BOS','C',true,'healthy','',[
    mkProp('points',24.5,{min:33,usage:26,pace:99,total:218}),
    mkProp('rebounds',8.5,{min:33,usage:26,pace:99,total:218}),
    mkProp('3PM',2.5,{min:33,usage:26,pace:99,total:218}),
  ]),
  mkPlayer('nyk3','OG Anunoby','NYK','BOS','SF',true,'healthy','',[
    mkProp('points',15.5,{min:32,usage:18,pace:99,total:218}),
    mkProp('steals',1.5,{min:32,usage:18,pace:99,total:218}),
    mkProp('3PM',2.5,{min:32,usage:18,pace:99,total:218}),
  ]),
  mkPlayer('nyk4','Mikal Bridges','NYK','BOS','SF',true,'healthy','',[
    mkProp('points',20.5,{min:34,usage:22,pace:99,total:218}),
    mkProp('3PM',3.5,{min:34,usage:22,pace:99,total:218}),
  ]),
  mkPlayer('nyk5','Josh Hart','NYK','BOS','SG',false,'healthy','',[
    mkProp('rebounds',8.5,{min:30,usage:14,pace:99,total:218}),
    mkProp('points',9.5,{min:30,usage:14,pace:99,total:218}),
  ]),

  // ══ OKLAHOMA CITY THUNDER ══
  mkPlayer('okc1','Shai Gilgeous-Alexander','OKC','DAL','PG',true,'healthy','',[
    mkProp('points',30.5,{min:34,usage:33,pace:99,total:220}),
    mkProp('assists',6.5,{min:34,usage:33,pace:99,total:220}),
    mkProp('steals',2.5,{min:34,usage:33,pace:99,total:220}),
  ]),
  mkPlayer('okc2','Jalen Williams','OKC','DAL','SG',true,'healthy','',[
    mkProp('points',22.5,{min:33,usage:25,pace:99,total:220}),
    mkProp('assists',5.5,{min:33,usage:25,pace:99,total:220}),
  ]),
  mkPlayer('okc3','Chet Holmgren','OKC','DAL','C',true,'healthy','',[
    mkProp('points',17.5,{min:30,usage:19,pace:99,total:220}),
    mkProp('rebounds',7.5,{min:30,usage:19,pace:99,total:220}),
    mkProp('blocks',2.5,{min:30,usage:19,pace:99,total:220}),
  ]),
  mkPlayer('okc4','Luguentz Dort','OKC','DAL','SG',true,'healthy','',[
    mkProp('points',14.5,{min:30,usage:16,pace:99,total:220}),
    mkProp('3PM',2.5,{min:30,usage:16,pace:99,total:220}),
  ]),
  mkPlayer('okc5','Isaiah Hartenstein','OKC','DAL','C',false,'healthy','',[
    mkProp('rebounds',10.5,{min:25,usage:12,pace:99,total:220}),
    mkProp('points',8.5,{min:25,usage:12,pace:99,total:220}),
  ]),

  // ══ ORLANDO MAGIC ══
  mkPlayer('orl1','Paolo Banchero','ORL','ATL','PF',true,'healthy','',[
    mkProp('points',22.5,{min:33,usage:26,pace:99,total:218}),
    mkProp('rebounds',6.5,{min:33,usage:26,pace:99,total:218}),
    mkProp('assists',5.5,{min:33,usage:26,pace:99,total:218}),
  ]),
  mkPlayer('orl2','Franz Wagner','ORL','ATL','SF',true,'healthy','',[
    mkProp('points',19.5,{min:32,usage:22,pace:99,total:218}),
    mkProp('assists',4.5,{min:32,usage:22,pace:99,total:218}),
  ]),
  mkPlayer('orl3','Wendell Carter Jr.','ORL','ATL','C',true,'healthy','',[
    mkProp('rebounds',9.5,{min:26,usage:14,pace:99,total:218}),
    mkProp('points',11.5,{min:26,usage:14,pace:99,total:218}),
  ]),
  mkPlayer('orl4','Jalen Suggs','ORL','ATL','PG',true,'healthy','',[
    mkProp('points',13.5,{min:30,usage:16,pace:99,total:218}),
    mkProp('assists',5.5,{min:30,usage:16,pace:99,total:218}),
    mkProp('steals',1.5,{min:30,usage:16,pace:99,total:218}),
  ]),
  mkPlayer('orl5','Moritz Wagner','ORL','ATL','PF',false,'healthy','',[
    mkProp('points',11.5,{min:20,usage:14,pace:99,total:218}),
    mkProp('rebounds',5.5,{min:20,usage:14,pace:99,total:218}),
  ]),

  // ══ PHILADELPHIA 76ERS ══
  mkPlayer('phi1','Joel Embiid','PHI','BKN','C',true,'questionable','Knee load management',[]
    .concat([mkProp('points',32.5,{min:30,usage:37,pace:98,total:218,trap:true}),
    mkProp('rebounds',11.5,{min:30,usage:37,pace:98,total:218,trap:true})])),
  mkPlayer('phi2','Tyrese Maxey','PHI','BKN','PG',true,'healthy','',[
    mkProp('points',25.5,{min:35,usage:28,pace:98,total:218}),
    mkProp('assists',6.5,{min:35,usage:28,pace:98,total:218}),
    mkProp('3PM',3.5,{min:35,usage:28,pace:98,total:218}),
  ]),
  mkPlayer('phi3','Paul George','PHI','BKN','SF',true,'healthy','',[
    mkProp('points',16.5,{min:30,usage:19,pace:98,total:218}),
    mkProp('3PM',2.5,{min:30,usage:19,pace:98,total:218}),
  ]),
  mkPlayer('phi4','Caleb Martin','PHI','BKN','PF',true,'healthy','',[
    mkProp('points',10.5,{min:25,usage:13,pace:98,total:218}),
    mkProp('rebounds',5.5,{min:25,usage:13,pace:98,total:218}),
  ]),
  mkPlayer('phi5','Kelly Oubre Jr.','PHI','BKN','SF',false,'healthy','',[
    mkProp('points',13.5,{min:23,usage:16,pace:98,total:218}),
    mkProp('3PM',2.5,{min:23,usage:16,pace:98,total:218}),
  ]),

  // ══ PHOENIX SUNS ══
  mkPlayer('phx1','Devin Booker','PHX','POR','SG',true,'healthy','',[
    mkProp('points',28.5,{min:36,usage:32,pace:100,total:222}),
    mkProp('3PM',3.5,{min:36,usage:32,pace:100,total:222}),
    mkProp('assists',5.5,{min:36,usage:32,pace:100,total:222}),
  ]),
  mkPlayer('phx2','Bradley Beal','PHX','POR','SG',true,'healthy','',[
    mkProp('points',18.5,{min:30,usage:22,pace:100,total:222}),
    mkProp('assists',5.5,{min:30,usage:22,pace:100,total:222}),
  ]),
  mkPlayer('phx3','Kevin Durant','PHX','POR','PF',true,'healthy','',[
    mkProp('points',26.5,{min:34,usage:29,pace:100,total:222}),
    mkProp('rebounds',6.5,{min:34,usage:29,pace:100,total:222}),
    mkProp('assists',4.5,{min:34,usage:29,pace:100,total:222}),
  ]),
  mkPlayer('phx4','Grayson Allen','PHX','POR','SG',true,'questionable','Hamstring',[]
    .concat([mkProp('3PM',2.5,{min:28,usage:17,pace:100,total:222,trap:true})])),
  mkPlayer('phx5','Royce O\'Neale','PHX','POR','SF',false,'healthy','',[
    mkProp('3PM',2.5,{min:24,usage:14,pace:100,total:222}),
    mkProp('points',9.5,{min:24,usage:14,pace:100,total:222}),
  ]),

  // ══ PORTLAND TRAIL BLAZERS ══
  mkPlayer('por1','Anfernee Simons','POR','PHX','SG',true,'healthy','',[
    mkProp('points',22.5,{min:35,usage:26,pace:100,total:222}),
    mkProp('3PM',3.5,{min:35,usage:26,pace:100,total:222}),
    mkProp('assists',5.5,{min:35,usage:26,pace:100,total:222}),
  ]),
  mkPlayer('por2','Deni Avdija','POR','PHX','SF',true,'healthy','',[
    mkProp('points',18.5,{min:35,usage:24,pace:100,total:222}),
    mkProp('assists',6.5,{min:35,usage:24,pace:100,total:222}),
    mkProp('rebounds',6.5,{min:35,usage:24,pace:100,total:222}),
  ]),
  mkPlayer('por3','Jerami Grant','POR','PHX','SF',true,'questionable','Right calf strain',[]
    .concat([mkProp('points',19.5,{min:30,usage:22,pace:100,total:222,trap:true})])),
  mkPlayer('por4','Toumani Camara','POR','PHX','SF',true,'healthy','',[
    mkProp('points',12.5,{min:28,usage:16,pace:100,total:222}),
    mkProp('rebounds',5.5,{min:28,usage:16,pace:100,total:222}),
  ]),
  mkPlayer('por5','Donovan Clingan','POR','PHX','C',true,'healthy','',[
    mkProp('rebounds',9.5,{min:24,usage:13,pace:100,total:222}),
    mkProp('blocks',2.5,{min:24,usage:13,pace:100,total:222}),
    mkProp('points',10.5,{min:24,usage:13,pace:100,total:222}),
  ]),

  // ══ SACRAMENTO KINGS ══
  mkPlayer('sac1','De\'Aaron Fox','SAC','NOP','PG',true,'healthy','',[
    mkProp('points',26.5,{min:34,usage:29,pace:103,total:228}),
    mkProp('assists',7.5,{min:34,usage:29,pace:103,total:228}),
    mkProp('steals',1.5,{min:34,usage:29,pace:103,total:228}),
  ]),
  mkPlayer('sac2','Domantas Sabonis','SAC','NOP','C',true,'healthy','',[
    mkProp('rebounds',13.5,{min:33,usage:22,pace:103,total:228}),
    mkProp('assists',7.5,{min:33,usage:22,pace:103,total:228}),
    mkProp('points',18.5,{min:33,usage:22,pace:103,total:228}),
  ]),
  mkPlayer('sac3','Zach LaVine','SAC','NOP','SG',true,'healthy','',[
    mkProp('points',22.5,{min:32,usage:24,pace:103,total:228}),
    mkProp('3PM',3.5,{min:32,usage:24,pace:103,total:228}),
  ]),
  mkPlayer('sac4','Keegan Murray','SAC','NOP','SF',true,'healthy','',[
    mkProp('points',15.5,{min:28,usage:17,pace:103,total:228}),
    mkProp('3PM',2.5,{min:28,usage:17,pace:103,total:228}),
  ]),
  mkPlayer('sac5','Kevin Huerter','SAC','NOP','SG',false,'healthy','',[
    mkProp('3PM',2.5,{min:22,usage:15,pace:103,total:228}),
    mkProp('points',11.5,{min:22,usage:15,pace:103,total:228}),
  ]),

  // ══ SAN ANTONIO SPURS ══
  mkPlayer('sas1','Victor Wembanyama','SAS','HOU','C',true,'healthy','',[
    mkProp('points',22.5,{min:30,usage:26,pace:99,total:220}),
    mkProp('rebounds',10.5,{min:30,usage:26,pace:99,total:220}),
    mkProp('blocks',3.5,{min:30,usage:26,pace:99,total:220}),
    mkProp('3PM',2.5,{min:30,usage:26,pace:99,total:220}),
  ]),
  mkPlayer('sas2','Stephon Castle','SAS','HOU','PG',true,'healthy','',[
    mkProp('points',15.5,{min:30,usage:18,pace:99,total:220}),
    mkProp('assists',5.5,{min:30,usage:18,pace:99,total:220}),
  ]),
  mkPlayer('sas3','Harrison Barnes','SAS','HOU','SF',true,'healthy','',[
    mkProp('points',13.5,{min:28,usage:16,pace:99,total:220}),
    mkProp('3PM',2.5,{min:28,usage:16,pace:99,total:220}),
  ]),
  mkPlayer('sas4','Keldon Johnson','SAS','HOU','SF',false,'healthy','',[
    mkProp('points',12.5,{min:24,usage:15,pace:99,total:220}),
  ]),
  mkPlayer('sas5','Julian Champagnie','SAS','HOU','SF',false,'healthy','',[
    mkProp('3PM',2.5,{min:20,usage:14,pace:99,total:220}),
    mkProp('points',10.5,{min:20,usage:14,pace:99,total:220}),
  ]),

  // ══ TORONTO RAPTORS ══
  mkPlayer('tor1','Scottie Barnes','TOR','DET','PF',true,'healthy','',[
    mkProp('points',20.5,{min:34,usage:24,pace:100,total:220}),
    mkProp('rebounds',8.5,{min:34,usage:24,pace:100,total:220}),
    mkProp('assists',6.5,{min:34,usage:24,pace:100,total:220}),
  ]),
  mkPlayer('tor2','RJ Barrett','TOR','DET','SG',true,'healthy','',[
    mkProp('points',20.5,{min:33,usage:23,pace:100,total:220}),
    mkProp('assists',4.5,{min:33,usage:23,pace:100,total:220}),
  ]),
  mkPlayer('tor3','Immanuel Quickley','TOR','DET','PG',true,'healthy','',[
    mkProp('points',16.5,{min:30,usage:20,pace:100,total:220}),
    mkProp('assists',6.5,{min:30,usage:20,pace:100,total:220}),
    mkProp('3PM',2.5,{min:30,usage:20,pace:100,total:220}),
  ]),
  mkPlayer('tor4','Jakob Poeltl','TOR','DET','C',true,'healthy','',[
    mkProp('rebounds',9.5,{min:27,usage:13,pace:100,total:220}),
    mkProp('points',10.5,{min:27,usage:13,pace:100,total:220}),
  ]),
  mkPlayer('tor5','Gary Trent Jr.','TOR','DET','SG',false,'healthy','',[
    mkProp('points',14.5,{min:25,usage:18,pace:100,total:220}),
    mkProp('3PM',2.5,{min:25,usage:18,pace:100,total:220}),
  ]),

  // ══ UTAH JAZZ ══
  mkPlayer('uta1','Lauri Markkanen','UTA','SAC','PF',true,'healthy','',[
    mkProp('points',23.5,{min:33,usage:26,pace:100,total:222}),
    mkProp('rebounds',8.5,{min:33,usage:26,pace:100,total:222}),
    mkProp('3PM',2.5,{min:33,usage:26,pace:100,total:222}),
  ]),
  mkPlayer('uta2','Collin Sexton','UTA','SAC','PG',true,'healthy','',[
    mkProp('points',18.5,{min:30,usage:22,pace:100,total:222}),
    mkProp('assists',4.5,{min:30,usage:22,pace:100,total:222}),
  ]),
  mkPlayer('uta3','Jordan Clarkson','UTA','SAC','SG',false,'healthy','',[
    mkProp('points',16.5,{min:24,usage:20,pace:100,total:222}),
    mkProp('3PM',2.5,{min:24,usage:20,pace:100,total:222}),
  ]),
  mkPlayer('uta4','Walker Kessler','UTA','SAC','C',true,'healthy','',[
    mkProp('rebounds',11.5,{min:28,usage:12,pace:100,total:222}),
    mkProp('blocks',2.5,{min:28,usage:12,pace:100,total:222}),
    mkProp('points',9.5,{min:28,usage:12,pace:100,total:222}),
  ]),
  mkPlayer('uta5','Keyonte George','UTA','SAC','PG',true,'healthy','',[
    mkProp('points',15.5,{min:29,usage:19,pace:100,total:222}),
    mkProp('assists',5.5,{min:29,usage:19,pace:100,total:222}),
  ]),

  // ══ WASHINGTON WIZARDS ══
  mkPlayer('was1','Kyle Kuzma','WAS','ORL','PF',true,'healthy','',[
    mkProp('points',21.5,{min:33,usage:24,pace:100,total:218}),
    mkProp('rebounds',7.5,{min:33,usage:24,pace:100,total:218}),
    mkProp('3PM',2.5,{min:33,usage:24,pace:100,total:218}),
  ]),
  mkPlayer('was2','Bilal Coulibaly','WAS','ORL','SF',true,'healthy','',[
    mkProp('points',13.5,{min:30,usage:16,pace:100,total:218}),
    mkProp('steals',1.5,{min:30,usage:16,pace:100,total:218}),
  ]),
  mkPlayer('was3','Alexandre Sarr','WAS','ORL','C',true,'healthy','',[
    mkProp('points',12.5,{min:26,usage:15,pace:100,total:218}),
    mkProp('rebounds',7.5,{min:26,usage:15,pace:100,total:218}),
    mkProp('blocks',2.5,{min:26,usage:15,pace:100,total:218}),
  ]),
  mkPlayer('was4','Jordan Poole','WAS','ORL','SG',true,'healthy','',[
    mkProp('points',19.5,{min:31,usage:23,pace:100,total:218}),
    mkProp('3PM',3.5,{min:31,usage:23,pace:100,total:218}),
    mkProp('assists',4.5,{min:31,usage:23,pace:100,total:218}),
  ]),
  mkPlayer('was5','Tyus Jones','WAS','ORL','PG',false,'healthy','',[
    mkProp('assists',7.5,{min:25,usage:15,pace:100,total:218}),
    mkProp('points',9.5,{min:25,usage:15,pace:100,total:218}),
  ]),
];

// Build game logs using opponent data from props
mockPlayers.forEach(player => {
  const opp = player.opponent || 'OPP';
  mockGameLogs[player.id] = Array.from({ length: 10 }, (_, i) => ({
    date: `4/${i + 1}`,
    opp: i % 2 === 0 ? opp : player.team,
  }));
});

export const mockAlerts = [
  { id: 'a1', title: 'Damian Lillard OUT Tonight', description: 'Left Achilles tendon injury management — Lillard will not play vs PHX in Play-In.', type: 'injury', player_name: 'Damian Lillard', team: 'MIL', impact: 'negative', is_read: false },
  { id: 'a2', title: 'Joel Embiid Questionable', description: 'Knee load management — Embiid listed questionable. Monitor warmups before locking in props.', type: 'injury', player_name: 'Joel Embiid', team: 'PHI', impact: 'negative', is_read: false },
  { id: 'a3', title: 'Kawhi Leonard Questionable', description: 'Load management — Kawhi questionable for LAC vs GSW. Trap pick if he plays limited minutes.', type: 'injury', player_name: 'Kawhi Leonard', team: 'LAC', impact: 'negative', is_read: false },
  { id: 'a4', title: 'Best Bet: SGA Points', description: 'SGA over 30.5 points — OKC vs DAL, DAL ranks 28th vs PG scoring this season.', type: 'best_bet', player_name: 'Shai Gilgeous-Alexander', team: 'OKC', impact: 'positive', is_read: false },
  { id: 'a5', title: 'Best Bet: Nikola Jokic PRA', description: 'Jokic triple-double watch — PRA over 45.5 vs LAL. Averaging 47.4 PRA in last 10.', type: 'best_bet', player_name: 'Nikola Jokic', team: 'DEN', impact: 'positive', is_read: false },
  { id: 'a6', title: 'Luka Doncic Points Line', description: 'Line moved from 28.5 to 29.5 — sharp money on the over. DAL vs OKC playoff rematch.', type: 'line_movement', player_name: 'Luka Doncic', team: 'DAL', impact: 'positive', is_read: true },
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
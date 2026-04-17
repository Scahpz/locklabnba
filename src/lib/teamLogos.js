// NBA team logos using ESPN CDN
const ESPN_IDS = {
  ATL: 'atl', BOS: 'bos', BKN: 'bkn', CHA: 'cha',
  CHI: 'chi', CLE: 'cle', DAL: 'dal', DEN: 'den',
  DET: 'det', GSW: 'gs',  HOU: 'hou', IND: 'ind',
  LAC: 'lac', LAL: 'lal', MEM: 'mem', MIA: 'mia',
  MIL: 'mil', MIN: 'min', NOP: 'no',  NYK: 'ny',
  OKC: 'okc', ORL: 'orl', PHI: 'phi', PHX: 'phx',
  POR: 'por', SAC: 'sac', SAS: 'sa',  TOR: 'tor',
  UTA: 'utah', WAS: 'wsh',
};

export function getTeamLogoUrl(teamAbbr) {
  const slug = ESPN_IDS[teamAbbr?.toUpperCase()];
  if (!slug) return null;
  return `https://a.espncdn.com/i/teamlogos/nba/500/${slug}.png`;
}
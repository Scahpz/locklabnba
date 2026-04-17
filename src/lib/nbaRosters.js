/**
 * NBA 2024-25 season player → team abbreviation mapping.
 * Used as a reliable fallback for team logo assignment.
 */
const NBA_PLAYER_TEAM = {
  // Atlanta Hawks
  'Trae Young': 'ATL', 'Dejounte Murray': 'ATL', 'Jalen Johnson': 'ATL', 'Clint Capela': 'ATL',
  'De\'Andre Hunter': 'ATL', 'Bogdan Bogdanovic': 'ATL', 'Saddiq Bey': 'ATL', 'Onyeka Okongwu': 'ATL',
  'Larry Nance Jr.': 'ATL', 'Garrison Mathews': 'ATL', 'Vit Krejci': 'ATL', 'Seth Lundy': 'ATL',
  'Mouhamed Gueye': 'ATL', 'Dyson Daniels': 'ATL',

  // Boston Celtics
  'Jayson Tatum': 'BOS', 'Jaylen Brown': 'BOS', 'Kristaps Porzingis': 'BOS', 'Jrue Holiday': 'BOS',
  'Al Horford': 'BOS', 'Derrick White': 'BOS', 'Payton Pritchard': 'BOS', 'Sam Hauser': 'BOS',
  'Luke Kornet': 'BOS', 'Xavier Tillman': 'BOS', 'Neemias Queta': 'BOS', 'Jordan Walsh': 'BOS',
  'Lonnie Walker IV': 'BOS', 'JD Davison': 'BOS',

  // Brooklyn Nets
  'Ben Simmons': 'BKN', 'Mikal Bridges': 'BKN', 'Cam Thomas': 'BKN', 'Nic Claxton': 'BKN',
  'Spencer Dinwiddie': 'BKN', 'Lonnie Walker IV': 'BKN', 'Royce O\'Neale': 'BKN', 'Dennis Schroder': 'BKN',
  'Noah Clowney': 'BKN', 'Day\'Ron Sharpe': 'BKN', 'Trendon Watford': 'BKN', 'Jalen Wilson': 'BKN',

  // Charlotte Hornets
  'LaMelo Ball': 'CHA', 'Miles Bridges': 'CHA', 'Brandon Miller': 'CHA', 'Mark Williams': 'CHA',
  'Coby White': 'CHA', 'Desmond Bane': 'CHA',
  'Terry Rozier': 'CHA', 'Davis Bertans': 'CHA', 'Grant Williams': 'CHA', 'Nick Richards': 'CHA',
  'Cody Martin': 'CHA', 'JT Thor': 'CHA', 'Moussa Diabate': 'CHA', 'Tre Mann': 'CHA',

  // Chicago Bulls
  'DeMar DeRozan': 'CHI', 'Zach LaVine': 'CHI', 'Nikola Vucevic': 'CHI', 'Patrick Williams': 'CHI',
  'Alex Caruso': 'CHI', 'Ayo Dosunmu': 'CHI', 'Andre Drummond': 'CHI',
  'Torrey Craig': 'CHI', 'Onuralp Bitim': 'CHI', 'Dalen Terry': 'CHI', 'Julian Phillips': 'CHI',

  // Cleveland Cavaliers
  'Darius Garland': 'CLE', 'Donovan Mitchell': 'CLE', 'Evan Mobley': 'CLE', 'Jarrett Allen': 'CLE',
  'Max Strus': 'CLE', 'Caris LeVert': 'CLE', 'Georges Niang': 'CLE', 'Dean Wade': 'CLE',
  'Craig Porter Jr.': 'CLE', 'Isaac Okoro': 'CLE', 'Sam Merrill': 'CLE', 'Pete Nance': 'CLE',
  'Ty Jerome': 'CLE', 'De\'Andre Hunter': 'CLE',

  // Dallas Mavericks
  'Luka Doncic': 'DAL', 'Kyrie Irving': 'DAL', 'P.J. Washington': 'DAL', 'Daniel Gafford': 'DAL',
  'Tim Hardaway Jr.': 'DAL', 'Josh Green': 'DAL', 'Maxi Kleber': 'DAL', 'Derrick Jones Jr.': 'DAL',
  'Dante Exum': 'DAL', 'Dwight Powell': 'DAL', 'Markieff Morris': 'DAL', 'Olivier-Maxence Prosper': 'DAL',

  // Denver Nuggets
  'Nikola Jokic': 'DEN', 'Jamal Murray': 'DEN', 'Michael Porter Jr.': 'DEN', 'Aaron Gordon': 'DEN',
  'Kentavious Caldwell-Pope': 'DEN', 'Reggie Jackson': 'DEN', 'Christian Braun': 'DEN', 'Zeke Nnaji': 'DEN',
  'Julian Strawther': 'DEN', 'DeAndre Jordan': 'DEN', 'Peyton Watson': 'DEN', 'Hunter Tyson': 'DEN',
  'Vlatko Cancar': 'DEN', 'Russell Westbrook': 'DEN',

  // Detroit Pistons
  'Cade Cunningham': 'DET', 'Jalen Duren': 'DET', 'Bojan Bogdanovic': 'DET', 'Monte Morris': 'DET',
  'Alec Burks': 'DET', 'Killian Hayes': 'DET', 'James Wiseman': 'DET', 'Ausar Thompson': 'DET',
  'Jaden Ivey': 'DET', 'Isaiah Stewart': 'DET', 'Marcus Sasser': 'DET', 'Simone Fontecchio': 'DET',
  'Ron Holland II': 'DET',

  // Golden State Warriors
  'Stephen Curry': 'GSW', 'Klay Thompson': 'GSW', 'Draymond Green': 'GSW', 'Andrew Wiggins': 'GSW',
  'Chris Paul': 'GSW', 'Jonathan Kuminga': 'GSW', 'Moses Moody': 'GSW', 'Kevon Looney': 'GSW',
  'Gary Payton II': 'GSW', 'Brandin Podziemski': 'GSW', 'Trayce Jackson-Davis': 'GSW', 'Pat Spencer': 'GSW',
  'Dario Saric': 'GSW', 'Buddy Hield': 'GSW',

  // Houston Rockets
  'Alperen Sengun': 'HOU', 'Jalen Green': 'HOU', 'Fred VanVleet': 'HOU', 'Dillon Brooks': 'HOU',
  'Jabari Smith Jr.': 'HOU', 'Amen Thompson': 'HOU', 'Steven Adams': 'HOU', 'Tari Eason': 'HOU',
  'Jeff Green': 'HOU', 'Aaron Holiday': 'HOU', 'Cam Whitmore': 'HOU', 'Jae\'Sean Tate': 'HOU',
  'Nate Hinton': 'HOU',

  // Indiana Pacers
  'Tyrese Haliburton': 'IND', 'Bennedict Mathurin': 'IND', 'Myles Turner': 'IND', 'Pascal Siakam': 'IND',
  'Aaron Nesmith': 'IND', 'Andrew Nembhard': 'IND', 'Obi Toppin': 'IND', 'T.J. McConnell': 'IND',
  'Isaiah Jackson': 'IND', 'James Johnson': 'IND', 'Ben Sheppard': 'IND', 'Oscar Tshiebwe': 'IND',
  'Kendall Brown': 'IND',

  // Los Angeles Clippers
  'Kawhi Leonard': 'LAC', 'Paul George': 'LAC', 'James Harden': 'LAC', 'Russell Westbrook': 'LAC',
  'Ivica Zubac': 'LAC', 'Norman Powell': 'LAC', 'Terance Mann': 'LAC', 'Mason Plumlee': 'LAC',
  'P.J. Tucker': 'LAC', 'Bones Hyland': 'LAC', 'Amir Coffey': 'LAC', 'Brandon Boston Jr.': 'LAC',

  // Los Angeles Lakers
  'LeBron James': 'LAL', 'Anthony Davis': 'LAL', 'D\'Angelo Russell': 'LAL', 'Austin Reaves': 'LAL',
  'Cam Ham': 'LAL', 'Rui Hachimura': 'LAL', 'Taurean Prince': 'LAL', 'Spencer Dinwiddie': 'LAL',
  'Christian Wood': 'LAL', 'Mo Bamba': 'LAL', 'Jaxson Hayes': 'LAL', 'Max Christie': 'LAL',
  'Jarred Vanderbilt': 'LAL', 'Gabe Vincent': 'LAL',

  // Memphis Grizzlies
  'Ja Morant': 'MEM', 'Jaren Jackson Jr.': 'MEM', 'Marcus Smart': 'MEM',
  'Santi Aldama': 'MEM', 'GG Jackson II': 'MEM', 'Luke Kennard': 'MEM', 'Vince Williams Jr.': 'MEM',
  'Brandon Clarke': 'MEM', 'John Konchar': 'MEM', 'Bismack Biyombo': 'MEM', 'David Roddy': 'MEM',
  'Ziaire Williams': 'MEM',

  // Miami Heat
  'Jimmy Butler': 'MIA', 'Bam Adebayo': 'MIA', 'Tyler Herro': 'MIA', 'Kyle Lowry': 'MIA',
  'Duncan Robinson': 'MIA', 'Caleb Martin': 'MIA', 'Haywood Highsmith': 'MIA', 'Thomas Bryant': 'MIA',
  'Josh Richardson': 'MIA', 'Nikola Jovic': 'MIA', 'Orlando Robinson': 'MIA', 'Kevin Love': 'MIA',
  'Terry Rozier': 'MIA',

  // Milwaukee Bucks
  'Giannis Antetokounmpo': 'MIL', 'Damian Lillard': 'MIL', 'Khris Middleton': 'MIL', 'Brook Lopez': 'MIL',
  'Bobby Portis': 'MIL', 'Patrick Beverley': 'MIL', 'MarJon Beauchamp': 'MIL', 'Malik Beasley': 'MIL',
  'Robin Lopez': 'MIL', 'Thanasis Antetokounmpo': 'MIL', 'Andre Jackson Jr.': 'MIL', 'Chris Livingston': 'MIL',
  'A.J. Green': 'MIL',

  // Minnesota Timberwolves
  'Karl-Anthony Towns': 'MIN', 'Anthony Edwards': 'MIN', 'Rudy Gobert': 'MIN', 'Mike Conley': 'MIN',
  'Jaden McDaniels': 'MIN', 'Kyle Anderson': 'MIN', 'Nickeil Alexander-Walker': 'MIN', 'Naz Reid': 'MIN',
  'Jordan McLaughlin': 'MIN', 'Troy Brown Jr.': 'MIN', 'Shake Milton': 'MIN', 'Leonard Miller': 'MIN',

  // New Orleans Pelicans
  'Zion Williamson': 'NOP', 'Brandon Ingram': 'NOP', 'CJ McCollum': 'NOP', 'Jonas Valanciunas': 'NOP',
  'Herbert Jones': 'NOP', 'Jose Alvarado': 'NOP', 'Trey Murphy III': 'NOP', 'Larry Nance Jr.': 'NOP',
  'Naji Marshall': 'NOP', 'Jordan Hawkins': 'NOP', 'Dyson Daniels': 'NOP', 'Dereon Seabron': 'NOP',

  // New York Knicks
  'Jalen Brunson': 'NYK', 'Julius Randle': 'NYK', 'RJ Barrett': 'NYK', 'Evan Fournier': 'NYK',
  'Mitchell Robinson': 'NYK', 'Josh Hart': 'NYK', 'OG Anunoby': 'NYK', 'Immanuel Quickley': 'NYK',
  'Isaiah Hartenstein': 'NYK', 'Quentin Grimes': 'NYK', 'Precious Achiuwa': 'NYK', 'Donta Hall': 'NYK',
  'Karl-Anthony Towns': 'NYK', 'Mikal Bridges': 'NYK',

  // Oklahoma City Thunder
  'Shai Gilgeous-Alexander': 'OKC', 'Jalen Williams': 'OKC', 'Luguentz Dort': 'OKC', 'Josh Giddey': 'OKC',
  'Chet Holmgren': 'OKC', 'Isaiah Joe': 'OKC', 'Tre Mann': 'OKC', 'Aaron Wiggins': 'OKC',
  'Mike Muscala': 'OKC', 'Lindy Waters III': 'OKC', 'Aleksej Pokusevski': 'OKC', 'Jaylin Williams': 'OKC',
  'Isaiah Hartenstein': 'OKC',

  // Orlando Magic
  'Paolo Banchero': 'ORL', 'Franz Wagner': 'ORL', 'Wendell Carter Jr.': 'ORL', 'Cole Anthony': 'ORL',
  'Desmond Bane': 'ORL',
  'Markelle Fultz': 'ORL', 'Jalen Suggs': 'ORL', 'Jonathan Isaac': 'ORL', 'Gary Harris': 'ORL',
  'Joe Ingles': 'ORL', 'Goga Bitadze': 'ORL', 'Moritz Wagner': 'ORL', 'Caleb Houstan': 'ORL',
  'Anthony Black': 'ORL', 'Kentavious Caldwell-Pope': 'ORL',

  // Philadelphia 76ers
  'Joel Embiid': 'PHI', 'Tyrese Maxey': 'PHI', 'Tobias Harris': 'PHI', 'Kelly Oubre Jr.': 'PHI',
  'De\'Anthony Melton': 'PHI', 'Robert Covington': 'PHI', 'Mo Bamba': 'PHI', 'Marcus Morris Sr.': 'PHI',
  'Paul Reed': 'PHI', 'Cam Payne': 'PHI', 'KJ Martin': 'PHI', 'Patrick Beverley': 'PHI',
  'Kyle Lowry': 'PHI', 'Buddy Hield': 'PHI',

  // Phoenix Suns
  'Kevin Durant': 'PHX', 'Devin Booker': 'PHX', 'Bradley Beal': 'PHX', 'Jusuf Nurkic': 'PHX',
  'Eric Gordon': 'PHX', 'Grayson Allen': 'PHX', 'Drew Eubanks': 'PHX', 'Royce O\'Neale': 'PHX',
  'Josh Okogie': 'PHX', 'Nassir Little': 'PHX', 'Yuta Watanabe': 'PHX', 'Bol Bol': 'PHX',
  'Monte Morris': 'PHX',

  // Portland Trail Blazers
  'Damian Lillard': 'POR', 'Anfernee Simons': 'POR', 'Jerami Grant': 'POR', 'Jusuf Nurkic': 'POR',
  'Malcolm Brogdon': 'POR', 'Matisse Thybulle': 'POR', 'Kris Murray': 'POR', 'Trendon Watford': 'POR',
  'Rayan Rupert': 'POR', 'Jabari Walker': 'POR', 'Moses Brown': 'POR', 'Shaedon Sharpe': 'POR',
  'Scoot Henderson': 'POR',

  // Sacramento Kings
  'De\'Aaron Fox': 'SAC', 'Domantas Sabonis': 'SAC', 'Kevin Huerter': 'SAC', 'Malik Monk': 'SAC',
  'Harrison Barnes': 'SAC', 'Trey Lyles': 'SAC', 'Terence Davis': 'SAC', 'Alex Len': 'SAC',
  'Chimezie Metu': 'SAC', 'Kessler Edwards': 'SAC', 'Colby Jones': 'SAC', 'Keegan Murray': 'SAC',
  'Chris Duarte': 'SAC',

  // San Antonio Spurs
  'Victor Wembanyama': 'SAS', 'Devin Vassell': 'SAS', 'Keldon Johnson': 'SAS', 'Tre Jones': 'SAS',
  'Zach Collins': 'SAS', 'Doug McDermott': 'SAS', 'Charles Bassey': 'SAS', 'Jeremy Sochan': 'SAS',
  'Malaki Branham': 'SAS', 'Blake Wesley': 'SAS', 'Cedi Osman': 'SAS', 'Julian Champagnie': 'SAS',
  'Sidy Cissoko': 'SAS',

  // Toronto Raptors
  'Pascal Siakam': 'TOR', 'Scottie Barnes': 'TOR', 'OG Anunoby': 'TOR', 'Fred VanVleet': 'TOR',
  'Immanuel Quickley': 'TOR', 'Jakob Poeltl': 'TOR', 'Gary Trent Jr.': 'TOR', 'Precious Achiuwa': 'TOR',
  'Malachi Flynn': 'TOR', 'Thaddeus Young': 'TOR', 'RJ Barrett': 'TOR', 'Bruce Brown': 'TOR',
  'Chris Boucher': 'TOR', 'Gradey Dick': 'TOR',

  // Utah Jazz
  'Lauri Markkanen': 'UTA', 'Jordan Clarkson': 'UTA', 'John Collins': 'UTA', 'Collin Sexton': 'UTA',
  'Talen Horton-Tucker': 'UTA', 'Kelly Olynyk': 'UTA', 'Simone Fontecchio': 'UTA', 'Walker Kessler': 'UTA',
  'Ochai Agbaji': 'UTA', 'Taylor Hendricks': 'UTA', 'Keyonte George': 'UTA', 'Johnny Juzang': 'UTA',
  'Cody Williams': 'UTA',

  // Washington Wizards
  'Bradley Beal': 'WAS', 'Kristaps Porzingis': 'WAS', 'Kyle Kuzma': 'WAS', 'Monte Morris': 'WAS',
  'Deni Avdija': 'WAS', 'Corey Kispert': 'WAS', 'Delon Wright': 'WAS', 'Daniel Gafford': 'WAS',
  'Patrick Baldwin Jr.': 'WAS', 'Anthony Gill': 'WAS', 'Jordan Goodwin': 'WAS', 'Bilal Coulibaly': 'WAS',
  'Alexandre Sarr': 'WAS', 'Tyus Jones': 'WAS',
};

/**
 * Look up a player's team abbreviation.
 * Returns null if unknown.
 */
export function getPlayerTeam(playerName) {
  return NBA_PLAYER_TEAM[playerName] || null;
}
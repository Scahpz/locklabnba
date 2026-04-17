/**
 * NBA 2025-26 season player → team abbreviation mapping.
 * Based on official opening night rosters + known mid-season moves (April 2026).
 */
const NBA_PLAYER_TEAM = {
  // Atlanta Hawks
  'Trae Young': 'ATL', 'Jalen Johnson': 'ATL', 'Dyson Daniels': 'ATL',
  'Onyeka Okongwu': 'ATL', 'Zaccharie Risacher': 'ATL', 'Kristaps Porzingis': 'ATL',
  'Vit Krejci': 'ATL', 'Mouhamed Gueye': 'ATL', 'Asa Newell': 'ATL',
  'Nickeil Alexander-Walker': 'ATL', 'Luke Kennard': 'ATL', 'Keaton Wallace': 'ATL',

  // Boston Celtics
  'Jayson Tatum': 'BOS', 'Jaylen Brown': 'BOS', 'Derrick White': 'BOS',
  'Payton Pritchard': 'BOS', 'Sam Hauser': 'BOS', 'Neemias Queta': 'BOS',
  'Xavier Tillman Sr.': 'BOS', 'Jordan Walsh': 'BOS', 'Josh Minott': 'BOS',
  'Baylor Scheierman': 'BOS', 'Hugo Gonzalez': 'BOS', 'Luka Garza': 'BOS',
  'Chris Boucher': 'BOS', 'Anfernee Simons': 'BOS', 'Al Horford': 'BOS',

  // Brooklyn Nets
  'Cam Thomas': 'BKN', 'Day\'Ron Sharpe': 'BKN', 'Nic Claxton': 'BKN',
  'Noah Clowney': 'BKN', 'Ziaire Williams': 'BKN', 'Jalen Wilson': 'BKN',
  'Terance Mann': 'BKN', 'Michael Porter Jr.': 'BKN', 'Nolan Traore': 'BKN',
  'Egor Demin': 'BKN', 'Drake Powell': 'BKN', 'Ben Saraf': 'BKN',
  'Danny Wolf': 'BKN', 'Tyrese Martin': 'BKN',

  // Charlotte Hornets
  'LaMelo Ball': 'CHA', 'Miles Bridges': 'CHA', 'Brandon Miller': 'CHA',
  'Coby White': 'CHA', 'Desmond Bane': 'CHA', 'Mason Plumlee': 'CHA',
  'Grant Williams': 'CHA', 'Collin Sexton': 'CHA', 'Tidjane Salaun': 'CHA',
  'Tre Mann': 'CHA', 'Liam McNeeley': 'CHA', 'Josh Green': 'CHA',
  'Kon Knueppel': 'CHA', 'Moussa Diabate': 'CHA', 'Sion James': 'CHA',
  'Ryan Kalkbrenner': 'CHA', 'Pat Connaughton': 'CHA',

  // Chicago Bulls
  'Nikola Vucevic': 'CHI', 'Zach LaVine': 'CHI', 'Patrick Williams': 'CHI',
  'Ayo Dosunmu': 'CHI', 'Dalen Terry': 'CHI', 'Julian Phillips': 'CHI',
  'Matas Buzelis': 'CHI', 'Zach Collins': 'CHI', 'Jalen Smith': 'CHI',
  'Jevon Carter': 'CHI', 'Tre Jones': 'CHI', 'Kevin Huerter': 'CHI',
  'Noa Essengue': 'CHI', 'Isaac Okoro': 'CHI', 'Josh Giddey': 'CHI',

  // Cleveland Cavaliers
  'Donovan Mitchell': 'CLE', 'Evan Mobley': 'CLE', 'Jarrett Allen': 'CLE',
  'De\'Andre Hunter': 'CLE', 'Sam Merrill': 'CLE', 'Larry Nance Jr.': 'CLE',
  'Dean Wade': 'CLE', 'Craig Porter Jr.': 'CLE', 'Thomas Bryant': 'CLE',
  'Jaylon Tyson': 'CLE', 'Tyrese Proctor': 'CLE', 'Lonzo Ball': 'CLE',

  // Dallas Mavericks
  'Luka Doncic': 'DAL', 'Anthony Davis': 'DAL', 'Klay Thompson': 'DAL',
  'D\'Angelo Russell': 'DAL', 'P.J. Washington': 'DAL', 'Caleb Martin': 'DAL',
  'Daniel Gafford': 'DAL', 'Dereck Lively II': 'DAL', 'Jaden Hardy': 'DAL',
  'Naji Marshall': 'DAL', 'Dwight Powell': 'DAL', 'Cooper Flagg': 'DAL',
  'Tim Hardaway Jr.': 'DAL', 'Max Christie': 'DAL', 'Brandon Williams': 'DAL',

  // Denver Nuggets
  'Nikola Jokic': 'DEN', 'Jamal Murray': 'DEN', 'Aaron Gordon': 'DEN',
  'Cam Johnson': 'DEN', 'Christian Braun': 'DEN', 'Jonas Valanciunas': 'DEN',
  'Peyton Watson': 'DEN', 'DaRon Holmes II': 'DEN', 'Julian Strawther': 'DEN',
  'Zeke Nnaji': 'DEN', 'Bruce Brown': 'DEN', 'Hunter Tyson': 'DEN',
  'Jalen Pickett': 'DEN',

  // Detroit Pistons
  'Cade Cunningham': 'DET', 'Jalen Duren': 'DET', 'Isaiah Stewart': 'DET',
  'Ausar Thompson': 'DET', 'Tobias Harris': 'DET', 'Duncan Robinson': 'DET',
  'Ron Holland II': 'DET', 'Caris LeVert': 'DET', 'Paul Reed Jr.': 'DET',
  'Marcus Sasser': 'DET', 'Bobi Klintman': 'DET', 'Chaz Lanier': 'DET',
  'Javonte Green': 'DET',

  // Golden State Warriors
  'Stephen Curry': 'GSW', 'Draymond Green': 'GSW', 'Buddy Hield': 'GSW',
  'Jonathan Kuminga': 'GSW', 'Moses Moody': 'GSW', 'Brandin Podziemski': 'GSW',
  'Gary Payton II': 'GSW', 'Trayce Jackson-Davis': 'GSW', 'Jimmy Butler III': 'GSW',
  'Jimmy Butler': 'GSW', 'De\'Anthony Melton': 'GSW', 'Gui Santos': 'GSW',
  'Will Richard': 'GSW', 'Quinten Post': 'GSW', 'Andrew Wiggins': 'GSW',

  // Houston Rockets
  'Alperen Sengun': 'HOU', 'Jalen Green': 'HOU', 'Amen Thompson': 'HOU',
  'Jabari Smith Jr.': 'HOU', 'Kevin Durant': 'HOU', 'Tari Eason': 'HOU',
  'Dorian Finney-Smith': 'HOU', 'Reed Sheppard': 'HOU', 'Clint Capela': 'HOU',
  'Jeff Green': 'HOU', 'Aaron Holiday': 'HOU', 'Josh Okogie': 'HOU',
  'Jae\'Sean Tate': 'HOU', 'Steven Adams': 'HOU',

  // Indiana Pacers
  'Tyrese Haliburton': 'IND', 'Pascal Siakam': 'IND', 'Bennedict Mathurin': 'IND',
  'Myles Turner': 'IND', 'Aaron Nesmith': 'IND', 'Andrew Nembhard': 'IND',
  'Ben Sheppard': 'IND', 'Obi Toppin': 'IND', 'T.J. McConnell': 'IND',
  'Isaiah Jackson': 'IND', 'James Wiseman': 'IND', 'Jarace Walker': 'IND',
  'Johnny Furphy': 'IND', 'Jay Huff': 'IND', 'Tony Bradley': 'IND',

  // Los Angeles Clippers
  'James Harden': 'LAC', 'Kawhi Leonard': 'LAC', 'Ivica Zubac': 'LAC',
  'Brook Lopez': 'LAC', 'John Collins': 'LAC', 'Kris Dunn': 'LAC',
  'Bradley Beal': 'LAC', 'Chris Paul': 'LAC', 'Derrick Jones Jr.': 'LAC',
  'Nicolas Batum': 'LAC', 'Bogdan Bogdanovic': 'LAC', 'Cam Christie': 'LAC',
  'Kobe Brown': 'LAC', 'Yanic Konan Niederhauser': 'LAC',

  // Los Angeles Lakers
  'LeBron James': 'LAL', 'Austin Reaves': 'LAL', 'Rui Hachimura': 'LAL',
  'Deandre Ayton': 'LAL', 'Dalton Knecht': 'LAL', 'Maxi Kleber': 'LAL',
  'Jaxson Hayes': 'LAL', 'Jake LaRavia': 'LAL', 'Adou Thiero': 'LAL',
  'Gabe Vincent': 'LAL', 'Jarred Vanderbilt': 'LAL', 'Marcus Smart': 'LAL',
  'Bronny James': 'LAL',

  // Memphis Grizzlies
  'Ja Morant': 'MEM', 'Jaren Jackson Jr.': 'MEM', 'Santi Aldama': 'MEM',
  'GG Jackson II': 'MEM', 'Zach Edey': 'MEM', 'Ty Jerome': 'MEM',
  'Kentavious Caldwell-Pope': 'MEM', 'Brandon Clarke': 'MEM', 'Scotty Pippen Jr.': 'MEM',
  'John Konchar': 'MEM', 'Jock Landale': 'MEM', 'Cam Spencer': 'MEM',
  'Jaylen Wells': 'MEM', 'Cedric Coward': 'MEM',

  // Miami Heat
  'Bam Adebayo': 'MIA', 'Tyler Herro': 'MIA', 'Terry Rozier': 'MIA',
  'Norman Powell': 'MIA', 'Nikola Jovic': 'MIA', 'Jaime Jaquez Jr.': 'MIA',
  'Kel\'el Ware': 'MIA', 'Simone Fontecchio': 'MIA', 'Davion Mitchell': 'MIA',
  'Pelle Larsson': 'MIA', 'Keshad Johnson': 'MIA', 'Kasparas Jakucionis': 'MIA',
  'Dru Smith': 'MIA',

  // Milwaukee Bucks
  'Giannis Antetokounmpo': 'MIL', 'Damian Lillard': 'MIL', 'Kyle Kuzma': 'MIL',
  'Bobby Portis': 'MIL', 'Taurean Prince': 'MIL', 'Gary Harris': 'MIL',
  'Gary Trent Jr.': 'MIL', 'Cole Anthony': 'MIL', 'AJ Green': 'MIL',
  'Andre Jackson Jr.': 'MIL', 'Kevin Porter Jr.': 'MIL', 'Ryan Rollins': 'MIL',
  'Amir Coffey': 'MIL', 'Jericho Sims': 'MIL',

  // Minnesota Timberwolves
  'Anthony Edwards': 'MIN', 'Rudy Gobert': 'MIN', 'Julius Randle': 'MIN',
  'Jaden McDaniels': 'MIN', 'Mike Conley': 'MIN', 'Naz Reid': 'MIN',
  'Donte DiVincenzo': 'MIN', 'Bones Hyland': 'MIN', 'Leonard Miller': 'MIN',
  'Joe Ingles': 'MIN', 'Rob Dillingham': 'MIN', 'Terrence Shannon Jr.': 'MIN',
  'Jaylen Clark': 'MIN',

  // New Orleans Pelicans
  'Zion Williamson': 'NOP', 'Brandon Ingram': 'NOP', 'Trey Murphy III': 'NOP',
  'Jordan Poole': 'NOP', 'Herbert Jones': 'NOP', 'Jose Alvarado': 'NOP',
  'Yves Missi': 'NOP', 'Jordan Hawkins': 'NOP', 'Saddiq Bey': 'NOP',
  'Jeremiah Fears': 'NOP', 'Derik Queen': 'NOP', 'Jaden Springer': 'NOP',
  'Micah Peavy': 'NOP', 'Karlo Matkovic': 'NOP',

  // New York Knicks
  'Jalen Brunson': 'NYK', 'Karl-Anthony Towns': 'NYK', 'OG Anunoby': 'NYK',
  'Mikal Bridges': 'NYK', 'Josh Hart': 'NYK', 'Mitchell Robinson': 'NYK',
  'Guerschon Yabusele': 'NYK', 'Miles McBride': 'NYK', 'Tyler Kolek': 'NYK',
  'Jordan Clarkson': 'NYK', 'Pacome Dadiet': 'NYK', 'Landry Shamet': 'NYK',
  'Ariel Hukporti': 'NYK', 'Mohamed Diawara': 'NYK',

  // Oklahoma City Thunder
  'Shai Gilgeous-Alexander': 'OKC', 'Jalen Williams': 'OKC', 'Chet Holmgren': 'OKC',
  'Isaiah Hartenstein': 'OKC', 'Luguentz Dort': 'OKC', 'Alex Caruso': 'OKC',
  'Aaron Wiggins': 'OKC', 'Isaiah Joe': 'OKC', 'Cason Wallace': 'OKC',
  'Ajay Mitchell': 'OKC', 'Ousmane Dieng': 'OKC', 'Jaylin Williams': 'OKC',

  // Orlando Magic
  'Paolo Banchero': 'ORL', 'Franz Wagner': 'ORL', 'Wendell Carter Jr.': 'ORL',
  'Desmond Bane': 'ORL', 'Jonathan Isaac': 'ORL', 'Jalen Suggs': 'ORL',
  'Anthony Black': 'ORL', 'Goga Bitadze': 'ORL', 'Moritz Wagner': 'ORL',
  'Tristan da Silva': 'ORL', 'Noah Penda': 'ORL', 'Jett Howard': 'ORL',
  'Tyus Jones': 'ORL', 'Jase Richardson': 'ORL',

  // Philadelphia 76ers
  'Joel Embiid': 'PHI', 'Tyrese Maxey': 'PHI', 'Paul George': 'PHI',
  'Kelly Oubre Jr.': 'PHI', 'Kyle Lowry': 'PHI', 'Eric Gordon': 'PHI',
  'Andre Drummond': 'PHI', 'Quentin Grimes': 'PHI', 'Jared McCain': 'PHI',
  'Justin Edwards': 'PHI', 'VJ Edgecombe': 'PHI', 'Johni Broome': 'PHI',
  'Trendon Watford': 'PHI', 'Adem Bona': 'PHI',

  // Phoenix Suns
  'Devin Booker': 'PHX', 'Grayson Allen': 'PHX', 'Dillon Brooks': 'PHX',
  'Royce O\'Neale': 'PHX', 'Nick Richards': 'PHX', 'Mark Williams': 'PHX',
  'Collin Gillespie': 'PHX', 'Ryan Dunn': 'PHX', 'Oso Ighodaro': 'PHX',
  'Jalen Green': 'PHX', 'Khaman Maluach': 'PHX', 'Nigel Hayes-Davis': 'PHX',
  'Jordan Goodwin': 'PHX', 'Rasheer Fleming': 'PHX',

  // Portland Trail Blazers
  'Damian Lillard': 'POR', 'Scoot Henderson': 'POR', 'Deni Avdija': 'POR',
  'Jerami Grant': 'POR', 'Jrue Holiday': 'POR', 'Shaedon Sharpe': 'POR',
  'Donovan Clingan': 'POR', 'Toumani Camara': 'POR', 'Kris Murray': 'POR',
  'Matisse Thybulle': 'POR', 'Rayan Rupert': 'POR', 'Duop Reath': 'POR',
  'Blake Wesley': 'POR', 'Robert Williams III': 'POR',

  // Sacramento Kings
  'DeMar DeRozan': 'SAC', 'Zach LaVine': 'SAC', 'Domantas Sabonis': 'SAC',
  'Malik Monk': 'SAC', 'Dennis Schroder': 'SAC', 'Keegan Murray': 'SAC',
  'Russell Westbrook': 'SAC', 'Dario Saric': 'SAC', 'Drew Eubanks': 'SAC',
  'Doug McDermott': 'SAC', 'Devin Carter': 'SAC', 'Nique Clifford': 'SAC',
  'Maxime Raynaud': 'SAC', 'Keon Ellis': 'SAC',

  // San Antonio Spurs
  'Victor Wembanyama': 'SAS', 'Devin Vassell': 'SAS', 'Stephon Castle': 'SAS',
  'Dylan Harper': 'SAS', 'Harrison Barnes': 'SAS', 'Keldon Johnson': 'SAS',
  'Jeremy Sochan': 'SAS', 'Julian Champagnie': 'SAS', 'Jordan McLaughlin': 'SAS',
  'Luke Kornet': 'SAS', 'Kelly Olynyk': 'SAS', 'Carter Bryant': 'SAS',
  'Bismack Biyombo': 'SAS', 'Lindy Waters III': 'SAS',

  // Toronto Raptors
  'Scottie Barnes': 'TOR', 'RJ Barrett': 'TOR', 'Immanuel Quickley': 'TOR',
  'Jakob Poeltl': 'TOR', 'Gradey Dick': 'TOR', 'Ochai Agbaji': 'TOR',
  'Brandon Ingram': 'TOR', 'Jonathan Mogbo': 'TOR', 'Jamal Shead': 'TOR',
  'Collin Murray-Boyles': 'TOR', 'Sandro Mamukelashvili': 'TOR',
  'Ja\'Kobe Walter': 'TOR', 'Garrett Temple': 'TOR',

  // Utah Jazz
  'Lauri Markkanen': 'UTA', 'Keyonte George': 'UTA', 'Walker Kessler': 'UTA',
  'Isaiah Collier': 'UTA', 'Cody Williams': 'UTA', 'Taylor Hendricks': 'UTA',
  'Kyle Filipowski': 'UTA', 'Ace Bailey': 'UTA', 'Kevin Love': 'UTA',
  'Kyle Anderson': 'UTA', 'Brice Sensabaugh': 'UTA', 'Walter Clayton Jr.': 'UTA',
  'Jusuf Nurkic': 'UTA', 'Svi Mykhailiuk': 'UTA',

  // Washington Wizards
  'Alex Sarr': 'WAS', 'Bilal Coulibaly': 'WAS', 'Khris Middleton': 'WAS',
  'CJ McCollum': 'WAS', 'Corey Kispert': 'WAS', 'Cam Whitmore': 'WAS',
  'Kyshawn George': 'WAS', 'AJ Johnson': 'WAS', 'Tre Johnson': 'WAS',
  'Will Riley': 'WAS', 'Bub Carrington': 'WAS', 'Marvin Bagley III': 'WAS',
  'Malaki Branham': 'WAS', 'Anthony Gill': 'WAS', 'Justin Champagnie': 'WAS',
};

/**
 * Look up a player's team abbreviation.
 * Returns null if unknown.
 */
export function getPlayerTeam(playerName) {
  return NBA_PLAYER_TEAM[playerName] || null;
}
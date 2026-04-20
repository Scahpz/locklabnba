import json
import os
import time
import uuid
import requests
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="LockLab NBA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

PARLAYS_FILE = Path(__file__).parent / "parlays.json"
SETTINGS_FILE = Path(__file__).parent / "settings.json"

NBA_STATS_HEADERS = {
    "Host": "stats.nba.com",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Referer": "https://www.nba.com/",
    "Pragma": "no-cache",
    "Cache-Control": "no-cache",
}

NBA_LIVE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Accept": "application/json",
    "Referer": "https://www.nba.com/",
}

TEAM_NAME_TO_ABV = {
    "Atlanta Hawks": "ATL", "Boston Celtics": "BOS", "Brooklyn Nets": "BKN",
    "Charlotte Hornets": "CHA", "Chicago Bulls": "CHI", "Cleveland Cavaliers": "CLE",
    "Dallas Mavericks": "DAL", "Denver Nuggets": "DEN", "Detroit Pistons": "DET",
    "Golden State Warriors": "GSW", "Houston Rockets": "HOU", "Indiana Pacers": "IND",
    "Los Angeles Clippers": "LAC", "Los Angeles Lakers": "LAL", "Memphis Grizzlies": "MEM",
    "Miami Heat": "MIA", "Milwaukee Bucks": "MIL", "Minnesota Timberwolves": "MIN",
    "New Orleans Pelicans": "NOP", "New York Knicks": "NYK", "Oklahoma City Thunder": "OKC",
    "Orlando Magic": "ORL", "Philadelphia 76ers": "PHI", "Phoenix Suns": "PHX",
    "Portland Trail Blazers": "POR", "Sacramento Kings": "SAC", "San Antonio Spurs": "SAS",
    "Toronto Raptors": "TOR", "Utah Jazz": "UTA", "Washington Wizards": "WAS",
}

ODDS_MARKET_TO_PROP = {
    "player_points": "points",
    "player_rebounds": "rebounds",
    "player_assists": "assists",
    "player_threes": "3PM",
    "player_points_rebounds_assists": "PRA",
    "player_steals": "steals",
    "player_blocks": "blocks",
}

# ── TTL cache ─────────────────────────────────────────────────────────────────
_cache: dict = {}

def cache_get(key: str, ttl: int = 3600):
    if key in _cache:
        data, ts = _cache[key]
        if datetime.now() - ts < timedelta(seconds=ttl):
            return data
    return None

def cache_set(key: str, data):
    _cache[key] = (data, datetime.now())


# ── settings ──────────────────────────────────────────────────────────────────
def load_settings() -> dict:
    s = {}
    if SETTINGS_FILE.exists():
        try:
            s = json.loads(SETTINGS_FILE.read_text())
        except Exception:
            pass
    # Environment variables override file — used in production (Railway)
    if os.environ.get("ODDS_API_KEY"):
        s["odds_api_key"] = os.environ["ODDS_API_KEY"]
    if os.environ.get("BOOKMAKERS"):
        s["bookmakers"] = os.environ["BOOKMAKERS"]
    return s

def save_settings(s: dict):
    SETTINGS_FILE.write_text(json.dumps(s, indent=2))

@app.get("/api/settings")
async def get_settings():
    return load_settings()

@app.post("/api/settings")
async def update_settings(data: dict):
    s = load_settings()
    s.update(data)
    save_settings(s)
    return s


# ── NBA.com helpers ───────────────────────────────────────────────────────────
def nba_stats_get(endpoint: str, params: dict) -> dict:
    url = f"https://stats.nba.com/stats/{endpoint}"
    time.sleep(0.6)
    r = requests.get(url, headers=NBA_STATS_HEADERS, params=params, timeout=30)
    r.raise_for_status()
    return r.json()

def parse_result_set(data: dict, set_name: str) -> list:
    for rs in data.get("resultSets", []):
        if rs["name"] == set_name:
            return [dict(zip(rs["headers"], row)) for row in rs["rowSet"]]
    return []

def current_season() -> str:
    now = datetime.now()
    year = now.year if now.month >= 10 else now.year - 1
    return f"{year}-{str(year + 1)[-2:]}"


# ── prop helpers ──────────────────────────────────────────────────────────────
PROP_COLUMN_MAP = {
    "points": "PTS", "rebounds": "REB", "assists": "AST",
    "3PM": "FG3M", "steals": "STL", "blocks": "BLK", "PRA": None,
}

PROP_MIN_AVG = {
    "points": 8.0, "rebounds": 2.5, "assists": 1.5,
    "3PM": 0.5, "steals": 0.3, "blocks": 0.3, "PRA": 15.0,
}

def stat_value(game: dict, prop_type: str) -> float:
    if prop_type == "PRA":
        return float(game.get("PTS") or 0) + float(game.get("REB") or 0) + float(game.get("AST") or 0)
    col = PROP_COLUMN_MAP.get(prop_type, "PTS")
    return float(game.get(col) or 0)

def to_line(avg: float) -> float:
    return max(0.5, round(avg * 2) / 2)

def parse_matchup(matchup: str):
    if " vs. " in matchup:
        return True, matchup.split(" vs. ")[1].strip()
    if " @ " in matchup:
        return False, matchup.split(" @ ")[1].strip()
    return False, matchup

def calculate_analytics(logs: list, prop_type: str, line: float) -> dict:
    values = [stat_value(g, prop_type) for g in logs]
    last_10, last_5 = values[:10], values[:5]

    avg_last_10 = round(sum(last_10) / len(last_10), 1) if last_10 else line
    avg_last_5  = round(sum(last_5)  / len(last_5),  1) if last_5  else line
    hit_rate    = round(sum(1 for v in last_10 if v > line) / len(last_10) * 100, 1) if last_10 else 50.0
    projection  = round(avg_last_5 * 0.6 + avg_last_10 * 0.4, 1)
    edge        = round(projection - line, 2)

    raw_conf = (hit_rate / 100) * 5 + min(abs(edge) / line * 10, 5) if line > 0 else 5
    confidence_score = min(10, max(1, round(raw_conf)))

    streak_count, direction = 0, ("over" if values and values[0] > line else "under")
    for v in values:
        if (direction == "over" and v > line) or (direction == "under" and v <= line):
            streak_count += 1
        else:
            break

    return {
        "avg_last_5": avg_last_5,
        "avg_last_10": avg_last_10,
        "hit_rate_last_10": hit_rate,
        "projection": projection,
        "edge": edge,
        "confidence_score": confidence_score,
        "streak_info": (f"{streak_count} game {direction} streak" if streak_count >= 2 else None),
        "last_10_games": values[:10],
        "last_5_games":  values[:5],
        "minutes_last_5": [float(g.get("MIN") or 0) for g in logs[:5]],
        "game_logs_last_10": [
            {
                "date": g.get("GAME_DATE"),
                "matchup": g.get("MATCHUP"),
                "value": stat_value(g, prop_type),
                "minutes": g.get("MIN"),
                "isHome": parse_matchup(g.get("MATCHUP", ""))[0],
                "opp":    parse_matchup(g.get("MATCHUP", ""))[1],
            }
            for g in logs[:10]
        ],
        "data_source": "nba_api",
    }


# ── /api/player-stats ─────────────────────────────────────────────────────────
class StatsRequest(BaseModel):
    playerName: str
    propType: str
    line: float

def find_player(name: str):
    from nba_api.stats.static import players as ps
    matches = ps.find_players_by_full_name(name)
    active = [p for p in matches if p.get("is_active")]
    return active[0] if active else (matches[0] if matches else None)

def fetch_game_logs(player_id: int) -> list:
    data = nba_stats_get("playergamelog", {
        "PlayerID": player_id, "Season": current_season(),
        "SeasonType": "Regular Season", "LeagueID": "00",
    })
    return parse_result_set(data, "PlayerGameLog")

@app.post("/api/player-stats")
async def get_player_stats(req: StatsRequest):
    try:
        player = find_player(req.playerName)
        if not player:
            raise HTTPException(404, f"Player '{req.playerName}' not found")
        logs = fetch_game_logs(player["id"])
        if not logs:
            raise HTTPException(404, f"No game logs for '{req.playerName}'")
        return {"analytics": calculate_analytics(logs, req.propType, req.line)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


# ── /api/player-gamelogs  (all prop types, one player, one call) ──────────────
class PlayerNameRequest(BaseModel):
    playerName: str

@app.post("/api/player-gamelogs")
async def get_player_gamelogs(req: PlayerNameRequest):
    try:
        player = find_player(req.playerName)
        if not player:
            raise HTTPException(404, f"Player '{req.playerName}' not found")

        logs = fetch_game_logs(player["id"])
        if not logs:
            raise HTTPException(404, "No game logs found")

        result = {}
        for prop_type in ["points", "rebounds", "assists", "3PM", "steals", "blocks", "PRA"]:
            values = [stat_value(g, prop_type) for g in logs[:20]]
            if not values:
                continue
            avg = sum(values) / len(values)
            if avg < PROP_MIN_AVG.get(prop_type, 0):
                continue
            line = to_line(avg)
            result[prop_type] = calculate_analytics(logs, prop_type, line)

        return {"player_name": req.playerName, "analytics": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))


# ── season stats (cached) ─────────────────────────────────────────────────────
def fetch_all_player_stats():
    cached = cache_get("player_stats", ttl=86400)
    if cached:
        return cached
    data = nba_stats_get("leaguedashplayerstats", {
        "PerMode": "PerGame", "Season": current_season(),
        "SeasonType": "Regular Season", "LeagueID": "00",
        "MeasureType": "Base", "PaceAdjust": "N", "PlusMinus": "N", "Rank": "N",
        "Outcome": "", "Location": "", "Month": "0", "SeasonSegment": "",
        "DateFrom": "", "DateTo": "", "OpponentTeamID": "0",
        "VsConference": "", "VsDivision": "", "GameSegment": "",
        "Period": "0", "LastNGames": "0",
    })
    rows = parse_result_set(data, "LeagueDashPlayerStats")
    cache_set("player_stats", rows)
    return rows


# ── /api/live-props (season-avg lines, fast) ──────────────────────────────────
def fetch_today_games():
    r = requests.get(
        "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json",
        headers=NBA_LIVE_HEADERS, timeout=15,
    )
    r.raise_for_status()
    games = r.json().get("scoreboard", {}).get("games", [])
    today_teams, games_summary = {}, []
    for game in games:
        home = game["homeTeam"]["teamTricode"]
        away = game["awayTeam"]["teamTricode"]
        today_teams[home] = {"opponent": away, "home": home, "away": away}
        today_teams[away] = {"opponent": home, "home": home, "away": away}
        games_summary.append({"home": home, "away": away})
    return today_teams, games_summary

@app.get("/api/live-props")
async def get_live_props():
    cached = cache_get("live_props", ttl=900)
    if cached:
        return cached

    try:
        today_teams, games_summary = fetch_today_games()
    except Exception:
        return {"game_date": datetime.now().strftime("%A, %B %d"), "games_summary": [], "rawProps": []}

    if not today_teams:
        result = {"game_date": datetime.now().strftime("%A, %B %d"), "games_summary": [], "rawProps": []}
        cache_set("live_props", result)
        return result

    try:
        all_stats = fetch_all_player_stats()
    except Exception:
        result = {"game_date": datetime.now().strftime("%A, %B %d"), "games_summary": games_summary, "rawProps": []}
        cache_set("live_props", result)
        return result

    today_players = [p for p in all_stats if p.get("TEAM_ABBREVIATION") in today_teams]
    today_players.sort(key=lambda x: float(x.get("NBA_FANTASY_PTS") or 0), reverse=True)

    raw_props, seen = [], set()
    prop_configs = [("points","PTS"),("rebounds","REB"),("assists","AST"),("3PM","FG3M"),("steals","STL"),("blocks","BLK")]

    for player in today_players[:150]:
        team = player.get("TEAM_ABBREVIATION", "")
        gi   = today_teams.get(team, {})
        for prop_type, col in prop_configs:
            avg = float(player.get(col) or 0)
            if avg < PROP_MIN_AVG[prop_type]: continue
            key = (player["PLAYER_NAME"], prop_type)
            if key in seen: continue
            seen.add(key)
            raw_props.append({
                "player_name": player["PLAYER_NAME"],
                "prop_type": prop_type,
                "line": to_line(avg),
                "home": gi.get("home", team), "away": gi.get("away", ""),
                "player_team": team,
                "over_odds": -110, "under_odds": -110, "bookmakers": [],
                # Basic season-avg analytics (no game-log required)
                "avg_last_10": round(avg, 1), "avg_last_5": round(avg, 1),
                "hit_rate_last_10": 50.0, "projection": round(avg, 1),
                "edge": 0.0, "confidence_score": 5,
                "streak_info": None, "last_10_games": None, "game_logs_last_10": None,
            })

    for player in today_players[:60]:
        team = player.get("TEAM_ABBREVIATION", "")
        gi   = today_teams.get(team, {})
        pra  = float(player.get("PTS") or 0) + float(player.get("REB") or 0) + float(player.get("AST") or 0)
        if pra >= PROP_MIN_AVG["PRA"]:
            key = (player["PLAYER_NAME"], "PRA")
            if key not in seen:
                seen.add(key)
                raw_props.append({
                    "player_name": player["PLAYER_NAME"],
                    "prop_type": "PRA",
                    "line": to_line(pra),
                    "home": gi.get("home", team), "away": gi.get("away", ""),
                    "player_team": team,
                    "over_odds": -110, "under_odds": -110, "bookmakers": [],
                    "avg_last_10": round(pra, 1), "avg_last_5": round(pra, 1),
                    "hit_rate_last_10": 50.0, "projection": round(pra, 1),
                    "edge": 0.0, "confidence_score": 5,
                    "streak_info": None, "last_10_games": None, "game_logs_last_10": None,
                })

    result = {"game_date": datetime.now().strftime("%A, %B %d"), "games_summary": games_summary, "rawProps": raw_props}
    cache_set("live_props", result)
    return result


# ── /api/odds/props  (real sportsbook lines via The Odds API) ─────────────────
PROP_MARKETS = ",".join(ODDS_MARKET_TO_PROP.keys())

@app.get("/api/odds/props")
async def get_odds_props(bookmakers: str = "draftkings,fanduel,betmgm,caesars,pointsbetus"):
    settings = load_settings()
    api_key = settings.get("odds_api_key", "")
    if not api_key:
        raise HTTPException(400, "odds_api_key not set — add it in Settings")

    # Get today's NBA events
    try:
        r = requests.get(
            "https://api.the-odds-api.com/v4/sports/basketball_nba/events",
            params={"apiKey": api_key, "dateFormat": "iso"},
            timeout=15,
        )
        if r.status_code == 401:
            raise HTTPException(401, "Invalid Odds API key")
        r.raise_for_status()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(502, f"Odds API error: {e}")

    events = r.json()
    today = datetime.now().date().isoformat()
    today_events = [e for e in events if e.get("commence_time", "")[:10] == today]

    if not today_events:
        return {"game_date": datetime.now().strftime("%A, %B %d"), "games_summary": [], "rawProps": []}

    games_summary = []
    for e in today_events:
        home_abv = TEAM_NAME_TO_ABV.get(e.get("home_team", ""), e.get("home_team", "")[:3].upper())
        away_abv = TEAM_NAME_TO_ABV.get(e.get("away_team", ""), e.get("away_team", "")[:3].upper())
        games_summary.append({"home": home_abv, "away": away_abv})

    # Fetch props for each event
    raw_props = []
    selected_books = [b.strip() for b in bookmakers.split(",") if b.strip()]

    for event in today_events:
        event_id = event["id"]
        home_abv = TEAM_NAME_TO_ABV.get(event.get("home_team", ""), event.get("home_team", "")[:3].upper())
        away_abv = TEAM_NAME_TO_ABV.get(event.get("away_team", ""), event.get("away_team", "")[:3].upper())

        try:
            time.sleep(0.25)
            r = requests.get(
                f"https://api.the-odds-api.com/v4/sports/basketball_nba/events/{event_id}/odds",
                params={
                    "apiKey": api_key, "regions": "us",
                    "markets": PROP_MARKETS,
                    "bookmakers": bookmakers,
                    "oddsFormat": "american",
                },
                timeout=15,
            )
            if not r.ok:
                continue
            event_odds = r.json()
        except Exception:
            continue

        # Build a lookup: player → prop_type → {book: {line, over, under}}
        player_props: dict = {}
        for bm in event_odds.get("bookmakers", []):
            if bm["key"] not in selected_books:
                continue
            for market in bm.get("markets", []):
                prop_type = ODDS_MARKET_TO_PROP.get(market["key"])
                if not prop_type:
                    continue
                for outcome in market.get("outcomes", []):
                    player_name = outcome.get("description", "")
                    if not player_name:
                        continue
                    if player_name not in player_props:
                        player_props[player_name] = {}
                    if prop_type not in player_props[player_name]:
                        player_props[player_name][prop_type] = {"bookmakers": {}}

                    book_key = bm["key"]
                    if book_key not in player_props[player_name][prop_type]["bookmakers"]:
                        player_props[player_name][prop_type]["bookmakers"][book_key] = {
                            "title": bm["title"], "key": book_key,
                            "line": outcome.get("point"), "over_odds": None, "under_odds": None,
                        }
                    entry = player_props[player_name][prop_type]["bookmakers"][book_key]
                    entry["line"] = outcome.get("point", entry.get("line"))
                    if outcome["name"] == "Over":
                        entry["over_odds"] = outcome.get("price")
                    elif outcome["name"] == "Under":
                        entry["under_odds"] = outcome.get("price")

        # Convert to flat props list
        for player_name, props in player_props.items():
            # Determine player team from home/away team names
            player_team = ""  # will be enriched below if possible

            for prop_type, prop_data in props.items():
                books = list(prop_data["bookmakers"].values())
                if not books:
                    continue
                # Best line: consensus (median) across books
                lines = [b["line"] for b in books if b.get("line") is not None]
                if not lines:
                    continue
                line = sorted(lines)[len(lines) // 2]  # median line

                # Best over odds across books
                best_over = max((b["over_odds"] for b in books if b.get("over_odds") is not None), default=-110)
                best_under = max((b["under_odds"] for b in books if b.get("under_odds") is not None), default=-110)

                raw_props.append({
                    "player_name": player_name,
                    "prop_type": prop_type,
                    "line": line,
                    "home": home_abv,
                    "away": away_abv,
                    "player_team": player_team,
                    "over_odds": best_over,
                    "under_odds": best_under,
                    "bookmakers": books,
                    # Analytics will be null — fetched on demand per player in Trends
                    "avg_last_10": None, "avg_last_5": None,
                    "hit_rate_last_10": None, "projection": None,
                    "edge": None, "confidence_score": 5,
                    "streak_info": None, "last_10_games": None, "game_logs_last_10": None,
                })

    return {
        "game_date": datetime.now().strftime("%A, %B %d"),
        "games_summary": games_summary,
        "rawProps": raw_props,
    }


# ── /api/prizepicks/props  (free, no key required) ───────────────────────────
PRIZEPICKS_STAT_MAP = {
    "Points": "points",
    "Rebounds": "rebounds",
    "Assists": "assists",
    "3-PT Made": "3PM",
    "Pts+Rebs+Asts": "PRA",
    "Blocked Shots": "blocks",
    "Steals": "steals",
    "Pts+Asts": "points",   # approximate — map to closest
    "Pts+Rebs": "points",
}

PRIZEPICKS_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Origin": "https://app.prizepicks.com",
    "Referer": "https://app.prizepicks.com/",
}

@app.get("/api/prizepicks/props")
async def get_prizepicks_props():
    cached = cache_get("prizepicks_props", ttl=900)
    if cached:
        return cached

    try:
        r = requests.get(
            "https://api.prizepicks.com/projections",
            params={"league_id": "7", "per_page": "250", "single_stat": "true"},
            headers=PRIZEPICKS_HEADERS,
            timeout=15,
        )
        r.raise_for_status()
        body = r.json()
    except Exception as e:
        raise HTTPException(502, f"PrizePicks API error: {e}")

    # Build player lookup from included[]
    players_by_id: dict = {}
    for item in body.get("included", []):
        if item.get("type") == "new_player":
            attrs = item.get("attributes", {})
            players_by_id[item["id"]] = {
                "name": attrs.get("name", ""),
                "team": attrs.get("team", ""),
                "position": attrs.get("position", "G"),
            }

    # Parse projections
    raw_props = []
    seen: set = set()
    games_teams: set = set()

    for proj in body.get("data", []):
        if proj.get("type") != "projection":
            continue
        attrs = proj.get("attributes", {})
        stat_type = attrs.get("stat_type", "")
        prop_type = PRIZEPICKS_STAT_MAP.get(stat_type)
        if not prop_type:
            continue

        line = attrs.get("line_score")
        if line is None:
            continue
        line = float(line)

        status = attrs.get("status", "")
        if status in ("cancelled", "suspended"):
            continue

        # Get player info from relationships
        player_rel = proj.get("relationships", {}).get("new_player", {}).get("data", {})
        player_id = player_rel.get("id", "")
        player_info = players_by_id.get(player_id, {})
        player_name = player_info.get("name", attrs.get("description", ""))
        team = player_info.get("team", "")
        position = player_info.get("position", "G")

        if not player_name:
            continue

        key = (player_name, prop_type)
        if key in seen:
            continue
        seen.add(key)
        games_teams.add(team)

        raw_props.append({
            "player_name": player_name,
            "prop_type": prop_type,
            "line": line,
            "home": team,
            "away": "",
            "player_team": team,
            "position": position,
            "over_odds": -110,
            "under_odds": -110,
            "bookmakers": [{"title": "PrizePicks", "key": "prizepicks", "line": line, "over_odds": -110, "under_odds": -110}],
            "avg_last_10": None, "avg_last_5": None,
            "hit_rate_last_10": None, "projection": None,
            "edge": None, "confidence_score": 5,
            "streak_info": None, "last_10_games": None, "game_logs_last_10": None,
        })

    # Build games_summary from today's NBA scoreboard if possible
    games_summary = []
    try:
        today_teams, games_summary = fetch_today_games()
        # Patch home/away into props using scoreboard
        team_game: dict = {}
        for gs in games_summary:
            team_game[gs["home"]] = gs
            team_game[gs["away"]] = gs
        for prop in raw_props:
            gs = team_game.get(prop["player_team"])
            if gs:
                prop["home"] = gs["home"]
                prop["away"] = gs["away"]
    except Exception:
        pass

    result = {
        "game_date": datetime.now().strftime("%A, %B %d"),
        "games_summary": games_summary,
        "rawProps": raw_props,
        "source": "prizepicks",
    }
    cache_set("prizepicks_props", result)
    return result


# ── /api/underdog/props  (free, no key required) ─────────────────────────────
UNDERDOG_STAT_MAP = {
    "points": "points",
    "rebounds": "rebounds",
    "assists": "assists",
    "three_points_made": "3PM",
    "pts_rebs_asts": "PRA",
    "blocked_shots": "blocks",
    "blocks": "blocks",
    "steals": "steals",
    "pts_rebs": "points",   # skip combo — not a standard prop
    "pts_asts": "points",
}

UNDERDOG_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json",
    "Origin": "https://underdogfantasy.com",
    "Referer": "https://underdogfantasy.com/",
}

@app.get("/api/underdog/props")
async def get_underdog_props():
    cached = cache_get("underdog_props", ttl=900)
    if cached:
        return cached

    try:
        r = requests.get(
            "https://api.underdogfantasy.com/beta/v5/over_under_lines",
            headers=UNDERDOG_HEADERS,
            timeout=15,
        )
        r.raise_for_status()
        body = r.json()
    except Exception as e:
        raise HTTPException(502, f"Underdog API error: {e}")

    # Build lookups
    players_by_id = {p["id"]: p for p in body.get("players", [])}
    appearances_by_id = {a["id"]: a for a in body.get("appearances", [])}

    # Parse game titles for home/away (e.g. "POR @ SAS")
    games_by_id = {}
    for g in body.get("games", []):
        if g.get("sport_id") != "NBA":
            continue
        title = g.get("abbreviated_title", "")  # "POR @ SAS"
        parts = title.split(" @ ")
        if len(parts) == 2:
            games_by_id[g["id"]] = {"away": parts[0].strip(), "home": parts[1].strip()}

    raw_props = []
    seen: set = set()
    games_summary_set: list = []
    seen_games: set = set()

    for line in body.get("over_under_lines", []):
        if line.get("status") not in ("active", None, ""):
            continue

        ou = line.get("over_under", {})
        app_stat = ou.get("appearance_stat", {})
        stat_raw = app_stat.get("stat", "")
        prop_type = UNDERDOG_STAT_MAP.get(stat_raw)
        if not prop_type:
            continue
        # Only keep clean single-stat props matching our standard set
        if stat_raw not in ("points", "rebounds", "assists", "three_points_made", "pts_rebs_asts", "blocked_shots", "blocks", "steals"):
            continue

        stat_value_raw = line.get("stat_value")
        if stat_value_raw is None:
            continue
        line_val = float(stat_value_raw)

        appearance_id = app_stat.get("appearance_id", "")
        appearance = appearances_by_id.get(appearance_id, {})
        player_id = appearance.get("player_id", "")
        match_id = appearance.get("match_id")

        player_info = players_by_id.get(player_id, {})
        if player_info.get("sport_id") != "NBA":
            continue

        player_name = f"{player_info.get('first_name', '')} {player_info.get('last_name', '')}".strip()
        position = player_info.get("position_name", "G")

        if not player_name:
            continue

        key = (player_name, prop_type)
        if key in seen:
            continue
        seen.add(key)

        game = games_by_id.get(match_id, {})
        home = game.get("home", "")
        away = game.get("away", "")

        if match_id and match_id not in seen_games:
            seen_games.add(match_id)
            if home and away:
                games_summary_set.append({"home": home, "away": away})

        # Get odds from options
        over_odds, under_odds = -110, -110
        for opt in line.get("options", []):
            try:
                price = int(opt.get("american_price") or -110)
            except (ValueError, TypeError):
                price = -110
            if opt.get("choice") == "higher":
                over_odds = price
            elif opt.get("choice") == "lower":
                under_odds = price

        raw_props.append({
            "player_name": player_name,
            "prop_type": prop_type,
            "line": line_val,
            "home": home,
            "away": away,
            "player_team": home,   # will be enriched below
            "position": position,
            "over_odds": over_odds,
            "under_odds": under_odds,
            "bookmakers": [{"title": "Underdog Fantasy", "key": "underdog", "line": line_val, "over_odds": over_odds, "under_odds": under_odds}],
            "avg_last_10": None, "avg_last_5": None,
            "hit_rate_last_10": None, "projection": None,
            "edge": None, "confidence_score": 5,
            "streak_info": None, "last_10_games": None, "game_logs_last_10": None,
        })

    result = {
        "game_date": datetime.now().strftime("%A, %B %d"),
        "games_summary": games_summary_set,
        "rawProps": raw_props,
        "source": "underdog",
    }
    cache_set("underdog_props", result)
    return result


# ── /api/free-props  (PrizePicks + Underdog merged, deduped, best line) ────────
@app.get("/api/free-props")
async def get_free_props():
    cached = cache_get("free_props", ttl=900)
    if cached:
        return cached

    pp_data, ud_data = {}, {}

    try:
        pp_res = await get_prizepicks_props()
        pp_data = pp_res if isinstance(pp_res, dict) else {}
    except Exception:
        pass

    try:
        ud_res = await get_underdog_props()
        ud_data = ud_res if isinstance(ud_res, dict) else {}
    except Exception:
        pass

    # Merge props: key = (player_name, prop_type)
    merged: dict = {}

    def add_props(source_data):
        for prop in source_data.get("rawProps", []):
            key = (prop["player_name"], prop["prop_type"])
            if key not in merged:
                merged[key] = {**prop, "bookmakers": list(prop.get("bookmakers", []))}
            else:
                # Add bookmaker entry and average the lines
                existing = merged[key]
                existing["bookmakers"].extend(prop.get("bookmakers", []))
                # Use average line across sources
                lines = [b["line"] for b in existing["bookmakers"] if b.get("line") is not None]
                if lines:
                    existing["line"] = round(sum(lines) / len(lines) * 2) / 2  # round to nearest 0.5

    add_props(pp_data)
    add_props(ud_data)

    # Combine games_summary (dedupe by home+away pair)
    games_seen: set = set()
    games_summary = []
    for gs in (pp_data.get("games_summary") or []) + (ud_data.get("games_summary") or []):
        pair = (gs.get("home"), gs.get("away"))
        if pair not in games_seen:
            games_seen.add(pair)
            games_summary.append(gs)

    result = {
        "game_date": datetime.now().strftime("%A, %B %d"),
        "games_summary": games_summary,
        "rawProps": list(merged.values()),
        "source": "free_combined",
        "sources_used": ([("prizepicks" if pp_data.get("rawProps") else None), ("underdog" if ud_data.get("rawProps") else None)]),
    }
    cache_set("free_props", result)
    return result


# ── /api/parlays CRUD ─────────────────────────────────────────────────────────
def load_parlays() -> list:
    if PARLAYS_FILE.exists():
        try:
            return json.loads(PARLAYS_FILE.read_text())
        except Exception:
            return []
    return []

def save_parlays(parlays: list):
    PARLAYS_FILE.write_text(json.dumps(parlays, indent=2))

@app.get("/api/parlays")
async def list_parlays():
    p = load_parlays()
    p.sort(key=lambda x: x.get("created_date", ""), reverse=True)
    return p

@app.post("/api/parlays")
async def create_parlay(parlay: dict):
    parlays = load_parlays()
    parlay["id"] = str(uuid.uuid4())
    parlay["created_date"] = datetime.now().isoformat()
    parlays.append(parlay)
    save_parlays(parlays)
    return parlay

@app.put("/api/parlays/{parlay_id}")
async def update_parlay(parlay_id: str, data: dict):
    parlays = load_parlays()
    for i, p in enumerate(parlays):
        if p["id"] == parlay_id:
            parlays[i] = {**p, **data}
            save_parlays(parlays)
            return parlays[i]
    raise HTTPException(404, "Parlay not found")

@app.delete("/api/parlays/{parlay_id}")
async def delete_parlay(parlay_id: str):
    save_parlays([p for p in load_parlays() if p["id"] != parlay_id])
    return {"ok": True}


# ── /api/scoreboard ───────────────────────────────────────────────────────────
@app.get("/api/scoreboard")
async def get_scoreboard():
    try:
        r = requests.get(
            "https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json",
            headers=NBA_LIVE_HEADERS, timeout=15,
        )
        r.raise_for_status()
        return r.json()
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/health")
async def health():
    return {"status": "ok"}

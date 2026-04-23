import base64
import hashlib
import hmac
import json
import logging
import os
import secrets
import time
import traceback
import uuid
import requests
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

logging.basicConfig(level=logging.INFO)

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="LockLab NBA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use DATA_DIR env var for persistent storage (Railway volume at /data, or any writable path)
_data_dir = Path(os.environ.get("DATA_DIR", str(Path(__file__).parent)))
_data_dir.mkdir(parents=True, exist_ok=True)

PARLAYS_FILE = _data_dir / "parlays.json"
SETTINGS_FILE = _data_dir / "settings.json"
USERS_FILE    = _data_dir / "users.json"

JWT_SECRET = os.environ.get("JWT_SECRET", "locklab-dev-secret-key-2025-nba")


# ── JWT helpers ────────────────────────────────────────────────────────────────
def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    s += "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s)


def create_token(user_id: str) -> str:
    header = _b64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = _b64url_encode(json.dumps({"sub": user_id, "iat": int(time.time())}).encode())
    msg = f"{header}.{payload}"
    sig = _b64url_encode(hmac.new(JWT_SECRET.encode(), msg.encode(), hashlib.sha256).digest())
    return f"{msg}.{sig}"


def decode_token(token: str) -> Optional[dict]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header, payload, sig = parts
        msg = f"{header}.{payload}"
        expected = _b64url_encode(hmac.new(JWT_SECRET.encode(), msg.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, expected):
            return None
        return json.loads(_b64url_decode(payload))
    except Exception:
        return None


def get_token_user_id(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else ""
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload["sub"]


# ── Password helpers ───────────────────────────────────────────────────────────
_PBKDF2_ITERS = 10000  # low enough for Railway's shared CPU (~50ms vs 10s at 260k)

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), _PBKDF2_ITERS)
    return f"{salt}${_PBKDF2_ITERS}${h.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        parts = stored.split("$")
        if len(parts) == 3:
            salt, iters, hashed = parts
            iters = int(iters)
        else:
            # Legacy format stored without iteration count (260k)
            salt, hashed = parts
            iters = 260000
        h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), iters)
        return hmac.compare_digest(h.hex(), hashed)
    except Exception:
        return False


# ── User storage ───────────────────────────────────────────────────────────────
def load_users() -> dict:
    if not USERS_FILE.exists():
        return {}
    try:
        return json.loads(USERS_FILE.read_text())
    except Exception:
        return {}


def save_users(users: dict):
    USERS_FILE.write_text(json.dumps(users, indent=2))

NBA_STATS_HEADERS = {
    "Host": "stats.nba.com",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Origin": "https://www.nba.com",
    "Referer": "https://www.nba.com/",
    "x-nba-stats-origin": "statsconsumer",
    "x-nba-stats-token": "true",
    "Pragma": "no-cache",
    "Cache-Control": "no-cache",
    "Sec-Fetch-Site": "same-site",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
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
    "player_points_rebounds": "P+R",
    "player_points_assists": "P+A",
    "player_assists_rebounds": "A+R",
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
def nba_stats_get(endpoint: str, params: dict, retries: int = 2) -> dict:
    url = f"https://stats.nba.com/stats/{endpoint}"
    for attempt in range(retries + 1):
        time.sleep(0.8 + attempt * 1.0)
        try:
            r = requests.get(url, headers=NBA_STATS_HEADERS, params=params, timeout=15)
            r.raise_for_status()
            return r.json()
        except requests.exceptions.HTTPError as e:
            logging.error(f"NBA stats HTTP error {e.response.status_code} on {endpoint}: {e.response.text[:200]}")
            if attempt < retries and e.response.status_code in (429, 503):
                continue
            raise
        except requests.exceptions.RequestException as e:
            logging.error(f"NBA stats request error on {endpoint}: {e}")
            if attempt < retries:
                continue
            raise

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
    "P+R": 12.0, "P+A": 11.0, "A+R": 4.5,
}

def stat_value(game: dict, prop_type: str) -> float:
    pts = float(game.get("PTS") or 0)
    reb = float(game.get("REB") or 0)
    ast = float(game.get("AST") or 0)
    if prop_type == "PRA": return pts + reb + ast
    if prop_type == "P+R": return pts + reb
    if prop_type == "P+A": return pts + ast
    if prop_type == "A+R": return ast + reb
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
    # logs comes from NBA API in reverse-chronological order (most recent first)
    values = [stat_value(g, prop_type) for g in logs]
    last_10, last_5 = values[:10], values[:5]

    avg_last_10 = round(sum(last_10) / len(last_10), 1) if last_10 else line
    avg_last_5  = round(sum(last_5)  / len(last_5),  1) if last_5  else line
    hit_rate    = round(sum(1 for v in last_10 if v > line) / len(last_10) * 100, 1) if last_10 else 50.0
    projection  = round(avg_last_5 * 0.6 + avg_last_10 * 0.4, 1)
    edge        = round(projection - line, 2)

    # Season-wide stats (all games fetched, not just last 10)
    season_games    = len(values)
    season_avg      = round(sum(values) / season_games, 1) if values else None
    season_hit_rate = round(sum(1 for v in values if v > line) / season_games * 100, 1) if values else None

    raw_conf = (hit_rate / 100) * 5 + min(abs(edge) / line * 10, 5) if line > 0 else 5
    confidence_score = min(10, max(1, round(raw_conf)))

    streak_count, direction = 0, ("over" if values and values[0] > line else "under")
    for v in values:
        if (direction == "over" and v > line) or (direction == "under" and v <= line):
            streak_count += 1
        else:
            break

    # Display arrays are reversed to chronological order (oldest first = left side of chart)
    display_logs_10 = list(reversed(logs[:10]))
    display_logs_5  = list(reversed(logs[:5]))

    return {
        "avg_last_5": avg_last_5,
        "avg_last_10": avg_last_10,
        "hit_rate_last_10": hit_rate,
        "projection": projection,
        "edge": edge,
        "confidence_score": confidence_score,
        "season_avg": season_avg,
        "season_games": season_games,
        "season_hit_rate": season_hit_rate,
        "streak_info": (f"{streak_count} game {direction} streak" if streak_count >= 2 else None),
        "last_10_games": list(reversed(values[:10])),
        "last_5_games":  list(reversed(values[:5])),
        "minutes_last_5": [float(g.get("MIN") or 0) for g in display_logs_5],
        "game_logs_last_10": [
            {
                "date": g.get("GAME_DATE"),
                "matchup": g.get("MATCHUP"),
                "value": stat_value(g, prop_type),
                "minutes": g.get("MIN"),
                "isHome": parse_matchup(g.get("MATCHUP", ""))[0],
                "opp":    parse_matchup(g.get("MATCHUP", ""))[1],
            }
            for g in display_logs_10
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
    # Exact match first
    matches = ps.find_players_by_full_name(name)
    active = [p for p in matches if p.get("is_active")]
    if active:
        return active[0]
    if matches:
        return matches[0]
    # Fuzzy fallback: normalize (remove periods, Jr/Sr/III, extra spaces)
    import re
    def normalize(n):
        n = re.sub(r'\b(jr|sr|ii|iii|iv)\b\.?', '', n.lower())
        n = re.sub(r'[^a-z\s]', '', n)
        return ' '.join(n.split())
    target = normalize(name)
    all_players = ps.get_players()
    for p in all_players:
        if normalize(p["full_name"]) == target and p.get("is_active"):
            return p
    for p in all_players:
        if normalize(p["full_name"]) == target:
            return p
    # Partial match on last name
    parts = target.split()
    if parts:
        last = parts[-1]
        candidates = [p for p in all_players if last in normalize(p["full_name"]).split()]
        active_c = [p for p in candidates if p.get("is_active")]
        if active_c:
            return active_c[0]
    return None

def _parse_game_date(s: str):
    for fmt in ("%b %d, %Y", "%Y-%m-%d", "%B %d, %Y"):
        try:
            return datetime.strptime(s, fmt)
        except Exception:
            continue
    return datetime.min


def _fetch_logs_via_nba_api(player_id: int, season: str, season_type: str) -> list:
    """Use nba_api package directly — handles headers/connection differently than raw requests."""
    from nba_api.stats.endpoints.playergamelog import PlayerGameLog
    gl = PlayerGameLog(
        player_id=str(player_id),
        season=season,
        season_type_all_star=season_type,
        timeout=60,
    )
    df = gl.get_data_frames()[0]
    if df.empty:
        return []
    return df.to_dict("records")


def fetch_game_logs(player_id: int) -> list:
    season = current_season()
    key = f"gamelogs_{player_id}_{season}_v2"
    cached = cache_get(key, ttl=3600)
    if cached is not None:
        return cached

    reg_logs, po_logs = [], []

    try:
        reg_logs = _fetch_logs_via_nba_api(player_id, season, "Regular Season")
        time.sleep(0.8)
    except Exception as e:
        logging.error(f"Regular season logs failed for {player_id}: {e}")

    try:
        po_logs = _fetch_logs_via_nba_api(player_id, season, "Playoffs")
    except Exception as e:
        logging.warning(f"Playoff logs not available for {player_id}: {e}")

    # Combine and sort most-recent-first
    combined = po_logs + reg_logs
    combined.sort(key=lambda g: _parse_game_date(g.get("GAME_DATE", "")), reverse=True)

    if combined:
        cache_set(key, combined)
    return combined

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
            return {"player_name": req.playerName, "analytics": {}, "error": "player_not_found"}

        logs = fetch_game_logs(player["id"])
        if not logs:
            return {"player_name": req.playerName, "analytics": {}, "error": "no_logs"}

        result = {}
        for prop_type in ["points", "rebounds", "assists", "3PM", "steals", "blocks", "PRA", "P+R", "P+A", "A+R"]:
            values = [stat_value(g, prop_type) for g in logs[:20]]
            if not values:
                continue
            avg = sum(values) / len(values)
            if avg < PROP_MIN_AVG.get(prop_type, 0):
                continue
            line = to_line(avg)
            result[prop_type] = calculate_analytics(logs, prop_type, line)

        return {"player_name": req.playerName, "analytics": result}
    except Exception as e:
        logging.error(f"player-gamelogs error for {req.playerName}: {traceback.format_exc()}")
        return {"player_name": req.playerName, "analytics": {}, "error": str(e)}


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
def fetch_games_for_date(date_str: str):
    """Fetch NBA games for a specific date (YYYYMMDD). Returns (teams_dict, summary_list)."""
    try:
        r = requests.get(
            f"https://cdn.nba.com/static/json/liveData/scoreboard/scoreboard_{date_str}_00.json",
            headers=NBA_LIVE_HEADERS, timeout=10,
        )
        if not r.ok:
            return {}, []
        games = r.json().get("scoreboard", {}).get("games", [])
        teams, summary = {}, []
        for game in games:
            home = game["homeTeam"]["teamTricode"]
            away = game["awayTeam"]["teamTricode"]
            game_time = game.get("gameTimeUTC")
            teams[home] = {"opponent": away, "home": home, "away": away, "scheduled_at": game_time}
            teams[away] = {"opponent": home, "home": home, "away": away, "scheduled_at": game_time}
            summary.append({"home": home, "away": away, "scheduled_at": game_time})
        return teams, summary
    except Exception:
        return {}, []


def fetch_today_games():
    today_str = datetime.now().strftime("%Y%m%d")
    return fetch_games_for_date(today_str)


def fetch_upcoming_games():
    """Returns (today_teams, all_teams, combined_summary) for today + tomorrow."""
    today = datetime.now()
    tomorrow = today + timedelta(days=1)
    today_teams, today_summary = fetch_games_for_date(today.strftime("%Y%m%d"))
    tmr_teams,   tmr_summary   = fetch_games_for_date(tomorrow.strftime("%Y%m%d"))
    all_teams = {**tmr_teams, **today_teams}   # today takes priority for team lookups
    combined  = today_summary + tmr_summary
    return today_teams, all_teams, combined

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
    today     = datetime.now().date().isoformat()
    tomorrow  = (datetime.now().date() + timedelta(days=1)).isoformat()
    upcoming_events = [e for e in events if e.get("commence_time", "")[:10] in (today, tomorrow)]

    if not upcoming_events:
        return {"game_date": datetime.now().strftime("%A, %B %d"), "games_summary": [], "rawProps": []}

    games_summary = []
    for e in upcoming_events:
        home_abv = TEAM_NAME_TO_ABV.get(e.get("home_team", ""), e.get("home_team", "")[:3].upper())
        away_abv = TEAM_NAME_TO_ABV.get(e.get("away_team", ""), e.get("away_team", "")[:3].upper())
        games_summary.append({"home": home_abv, "away": away_abv, "scheduled_at": e.get("commence_time")})

    # Fetch props for each event
    raw_props = []
    selected_books = [b.strip() for b in bookmakers.split(",") if b.strip()]

    for event in upcoming_events:
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
    "Pts+Rebs": "P+R",
    "Pts+Asts": "P+A",
    "Ast+Rebs": "A+R",
    "Rebs+Asts": "A+R",
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

    # Build games_summary from today + tomorrow NBA scoreboard
    games_summary = []
    try:
        _, _, games_summary = fetch_upcoming_games()
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
    "pts_rebs": "P+R",
    "pts_asts": "P+A",
    "ast_rebs": "A+R",
    "rebs_asts": "A+R",
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

    # Parse game titles for home/away AND build team_id → abbreviation map
    games_by_id = {}
    team_id_to_abbr: dict = {}
    for g in body.get("games", []):
        if g.get("sport_id") != "NBA":
            continue
        title = g.get("abbreviated_title", "")  # "POR @ SAS"
        parts = title.split(" @ ")
        if len(parts) == 2:
            away_abv = parts[0].strip()
            home_abv = parts[1].strip()
            games_by_id[g["id"]] = {"away": away_abv, "home": home_abv, "scheduled_at": g.get("scheduled_at"),
                                    "home_team_id": g.get("home_team_id"), "away_team_id": g.get("away_team_id")}
            if g.get("home_team_id"):
                team_id_to_abbr[g["home_team_id"]] = home_abv
            if g.get("away_team_id"):
                team_id_to_abbr[g["away_team_id"]] = away_abv

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

        # Determine which team the player is actually on using team_id lookup
        player_team_id = appearance.get("team_id", "")
        player_team = team_id_to_abbr.get(player_team_id, home)  # fallback to home if unknown

        if match_id and match_id not in seen_games:
            seen_games.add(match_id)
            if home and away:
                games_summary_set.append({"home": home, "away": away, "scheduled_at": game.get("scheduled_at")})

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
            "player_team": player_team,
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
async def list_parlays(request: Request):
    user_id = get_token_user_id(request)
    p = [x for x in load_parlays() if x.get("user_id") == user_id]
    p.sort(key=lambda x: x.get("created_date", ""), reverse=True)
    return p

@app.post("/api/parlays")
async def create_parlay(request: Request, parlay: dict):
    user_id = get_token_user_id(request)
    parlays = load_parlays()
    parlay["id"] = str(uuid.uuid4())
    parlay["user_id"] = user_id
    parlay["created_date"] = datetime.now().isoformat()
    parlays.append(parlay)
    save_parlays(parlays)
    return parlay

@app.put("/api/parlays/{parlay_id}")
async def update_parlay(request: Request, parlay_id: str, data: dict):
    owner_id = get_token_user_id(request)
    parlays = load_parlays()
    for i, p in enumerate(parlays):
        if p["id"] == parlay_id and p.get("user_id") == owner_id:
            parlays[i] = {**p, **data}
            save_parlays(parlays)
            return parlays[i]
    raise HTTPException(404, "Parlay not found")

@app.delete("/api/parlays/{parlay_id}")
async def delete_parlay(request: Request, parlay_id: str):
    user_id = get_token_user_id(request)
    save_parlays([p for p in load_parlays() if not (p["id"] == parlay_id and p.get("user_id") == user_id)])
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

@app.get("/api/odds/games")
async def get_game_odds(bookmakers: str = "draftkings,fanduel,betmgm,caesars,pointsbetus"):
    """Game moneyline, spread, and totals. Uses Odds API if key set, else returns game list only."""
    settings = load_settings()
    api_key = settings.get("odds_api_key", "")

    # Build base game list from Underdog so we always have games even without a key
    games_map = {}
    try:
        ud_res = requests.get(
            "https://api.underdogfantasy.com/beta/v5/over_under_lines",
            headers={"Accept": "application/json", "User-Agent": "Mozilla/5.0"},
            timeout=15,
        )
        if ud_res.ok:
            ud = ud_res.json()
            for game in (ud.get("games") or []):
                home_id = game.get("home_team_id") or game.get("home_team", {}).get("id")
                away_id = game.get("away_team_id") or game.get("away_team", {}).get("id")
                appearances = ud.get("appearances") or []
                team_id_to_abbr = {}
                for app in appearances:
                    tid = app.get("team_id")
                    abbr = app.get("team", {}).get("abbr") or app.get("team", {}).get("abbreviation")
                    if tid and abbr:
                        team_id_to_abbr[tid] = abbr.upper()
                home_abbr = team_id_to_abbr.get(home_id, "")
                away_abbr = team_id_to_abbr.get(away_id, "")
                sched = game.get("scheduled_at") or game.get("start_time") or ""
                if home_abbr and away_abbr:
                    gid = f"{away_abbr}@{home_abbr}"
                    games_map[gid] = {
                        "id": gid, "awayAbv": away_abbr, "homeAbv": home_abbr,
                        "commence_time": sched, "allBooks": [],
                    }
    except Exception:
        pass

    if not api_key:
        return list(games_map.values())

    # Fetch real h2h/spreads/totals from The Odds API
    try:
        r = requests.get(
            "https://api.the-odds-api.com/v4/sports/basketball_nba/odds",
            params={
                "apiKey": api_key,
                "regions": "us",
                "markets": "h2h,spreads,totals",
                "oddsFormat": "american",
                "bookmakers": bookmakers,
            },
            timeout=20,
        )
        if r.status_code == 401:
            raise HTTPException(401, "Invalid Odds API key")
        r.raise_for_status()
        events = r.json()
    except HTTPException:
        raise
    except Exception as e:
        return list(games_map.values())  # fallback to no-odds list

    result = []
    for event in events:
        home_abv = TEAM_NAME_TO_ABV.get(event.get("home_team", ""), event.get("home_team", "")[:3].upper())
        away_abv = TEAM_NAME_TO_ABV.get(event.get("away_team", ""), event.get("away_team", "")[:3].upper())
        gid = f"{away_abv}@{home_abv}"

        all_books = []
        for bm in event.get("bookmakers", []):
            book_entry = {
                "key": bm["key"], "title": bm["title"],
                "ml_away": None, "ml_home": None,
                "spread_away": None, "spread_away_odds": None,
                "spread_home": None, "spread_home_odds": None,
                "total_line": None, "total_over_odds": None, "total_under_odds": None,
            }
            for market in bm.get("markets", []):
                mk = market["key"]
                for outcome in market.get("outcomes", []):
                    name = outcome.get("name", "")
                    price = outcome.get("price")
                    point = outcome.get("point")
                    if mk == "h2h":
                        if name == event.get("away_team"):
                            book_entry["ml_away"] = price
                        elif name == event.get("home_team"):
                            book_entry["ml_home"] = price
                    elif mk == "spreads":
                        if name == event.get("away_team"):
                            book_entry["spread_away"] = point
                            book_entry["spread_away_odds"] = price
                        elif name == event.get("home_team"):
                            book_entry["spread_home"] = point
                            book_entry["spread_home_odds"] = price
                    elif mk == "totals":
                        if name == "Over":
                            book_entry["total_line"] = point
                            book_entry["total_over_odds"] = price
                        elif name == "Under":
                            book_entry["total_under_odds"] = price
            all_books.append(book_entry)

        # Primary odds = first book
        primary = all_books[0] if all_books else {}
        result.append({
            "id": gid,
            "awayAbv": away_abv, "homeAbv": home_abv,
            "commence_time": event.get("commence_time", ""),
            "moneyline": {"away": primary.get("ml_away"), "home": primary.get("ml_home"), "bookmaker": primary.get("title")},
            "spread": {
                "away": primary.get("spread_away"), "awayOdds": primary.get("spread_away_odds"),
                "home": primary.get("spread_home"), "homeOdds": primary.get("spread_home_odds"),
            },
            "total": {"line": primary.get("total_line"), "overOdds": primary.get("total_over_odds"), "underOdds": primary.get("total_under_odds")},
            "allBooks": all_books,
        })

    # Fill in any games from Underdog not in Odds API
    result_ids = {g["id"] for g in result}
    for gid, g in games_map.items():
        if gid not in result_ids:
            result.append(g)

    result.sort(key=lambda g: g.get("commence_time") or "")
    return result


@app.get("/api/team-context")
async def get_team_context():
    """
    Returns team pace, defensive rating, today's injuries, back-to-back teams,
    and (if Odds API key is set) game spreads — everything the grading engine needs.
    """
    cached = cache_get("team_context", ttl=1800)
    if cached:
        return cached

    result = {"teams": {}, "injuries": {}, "back_to_back": [], "game_spreads": {}}

    # ── 2024-25 season fallback stats (used when NBA.com blocks cloud IPs) ───────
    # pos_def: defensive rating allowed vs each position category (G=guards, F=forwards, C=centers)
    TEAM_STATS_2025 = {
        "ATL": {"pace": 99.8,  "def_rating": 114.2, "off_rating": 114.8, "pos_def": {"G": 113.5, "F": 114.8, "C": 114.3}},
        "BOS": {"pace": 100.2, "def_rating": 109.1, "off_rating": 122.2, "pos_def": {"G": 108.9, "F": 109.4, "C": 109.2}},
        "BKN": {"pace": 97.8,  "def_rating": 116.8, "off_rating": 108.4, "pos_def": {"G": 117.2, "F": 116.5, "C": 116.9}},
        "CHA": {"pace": 97.5,  "def_rating": 117.4, "off_rating": 108.1, "pos_def": {"G": 117.8, "F": 117.1, "C": 117.2}},
        "CHI": {"pace": 98.9,  "def_rating": 113.7, "off_rating": 112.3, "pos_def": {"G": 113.2, "F": 114.1, "C": 113.5}},
        "CLE": {"pace": 98.6,  "def_rating": 109.3, "off_rating": 116.4, "pos_def": {"G": 109.8, "F": 109.2, "C": 108.8}},
        "DAL": {"pace": 98.2,  "def_rating": 112.1, "off_rating": 116.8, "pos_def": {"G": 112.4, "F": 111.8, "C": 112.2}},
        "DEN": {"pace": 98.7,  "def_rating": 112.8, "off_rating": 117.9, "pos_def": {"G": 112.5, "F": 113.1, "C": 112.8}},
        "DET": {"pace": 99.1,  "def_rating": 115.2, "off_rating": 111.7, "pos_def": {"G": 115.5, "F": 115.0, "C": 115.1}},
        "GSW": {"pace": 99.3,  "def_rating": 113.6, "off_rating": 113.1, "pos_def": {"G": 113.2, "F": 113.8, "C": 114.1}},
        "HOU": {"pace": 99.5,  "def_rating": 110.8, "off_rating": 114.2, "pos_def": {"G": 110.5, "F": 111.2, "C": 110.9}},
        "IND": {"pace": 101.3, "def_rating": 113.9, "off_rating": 120.1, "pos_def": {"G": 114.2, "F": 113.6, "C": 113.8}},
        "LAC": {"pace": 98.1,  "def_rating": 111.5, "off_rating": 112.7, "pos_def": {"G": 111.2, "F": 111.8, "C": 111.5}},
        "LAL": {"pace": 98.8,  "def_rating": 111.9, "off_rating": 115.6, "pos_def": {"G": 111.6, "F": 112.2, "C": 111.8}},
        "MEM": {"pace": 99.6,  "def_rating": 113.5, "off_rating": 112.8, "pos_def": {"G": 113.2, "F": 113.8, "C": 113.4}},
        "MIA": {"pace": 97.9,  "def_rating": 112.7, "off_rating": 110.4, "pos_def": {"G": 108.5, "F": 113.2, "C": 113.9}},
        "MIL": {"pace": 100.1, "def_rating": 112.4, "off_rating": 116.3, "pos_def": {"G": 112.1, "F": 112.7, "C": 112.3}},
        "MIN": {"pace": 97.3,  "def_rating": 110.2, "off_rating": 112.9, "pos_def": {"G": 109.1, "F": 110.0, "C": 110.5}},
        "NOP": {"pace": 98.0,  "def_rating": 116.1, "off_rating": 109.3, "pos_def": {"G": 115.9, "F": 116.3, "C": 116.0}},
        "NYK": {"pace": 96.8,  "def_rating": 111.2, "off_rating": 117.1, "pos_def": {"G": 111.5, "F": 110.5, "C": 110.9}},
        "OKC": {"pace": 101.4, "def_rating": 106.8, "off_rating": 119.7, "pos_def": {"G": 106.2, "F": 107.1, "C": 107.3}},
        "ORL": {"pace": 98.2,  "def_rating": 108.4, "off_rating": 110.6, "pos_def": {"G": 108.8, "F": 107.8, "C": 107.2}},
        "PHI": {"pace": 98.5,  "def_rating": 114.7, "off_rating": 112.8, "pos_def": {"G": 114.5, "F": 115.0, "C": 114.8}},
        "PHX": {"pace": 99.4,  "def_rating": 115.5, "off_rating": 113.2, "pos_def": {"G": 115.1, "F": 115.8, "C": 115.9}},
        "POR": {"pace": 99.2,  "def_rating": 116.4, "off_rating": 110.9, "pos_def": {"G": 116.8, "F": 116.5, "C": 115.6}},
        "SAC": {"pace": 100.8, "def_rating": 114.9, "off_rating": 116.1, "pos_def": {"G": 115.2, "F": 114.6, "C": 114.8}},
        "SAS": {"pace": 98.4,  "def_rating": 115.1, "off_rating": 110.3, "pos_def": {"G": 115.4, "F": 115.0, "C": 115.2}},
        "TOR": {"pace": 98.3,  "def_rating": 116.2, "off_rating": 109.8, "pos_def": {"G": 116.5, "F": 116.0, "C": 116.1}},
        "UTA": {"pace": 99.0,  "def_rating": 116.8, "off_rating": 109.1, "pos_def": {"G": 116.4, "F": 117.2, "C": 116.9}},
        "WAS": {"pace": 99.7,  "def_rating": 118.2, "off_rating": 107.6, "pos_def": {"G": 118.5, "F": 118.0, "C": 117.8}},
    }

    # ── Team advanced stats (pace + defensive rating) ──────────────────────────
    try:
        data = nba_stats_get("leaguedashteamstats", {
            "PerMode": "PerGame", "Season": current_season(),
            "SeasonType": "Regular Season", "LeagueID": "00",
            "MeasureType": "Advanced",
            "PaceAdjust": "N", "PlusMinus": "N", "Rank": "N",
            "Outcome": "", "Location": "", "Month": "0", "SeasonSegment": "",
            "DateFrom": "", "DateTo": "", "OpponentTeamID": "0",
            "VsConference": "", "VsDivision": "", "GameSegment": "",
            "Period": "0", "LastNGames": "0",
        })
        for t in parse_result_set(data, "LeagueDashTeamStats"):
            abbr = t.get("TEAM_ABBREVIATION", "")
            if abbr:
                result["teams"][abbr] = {
                    "pace":       round(float(t.get("PACE")       or 0), 1),
                    "def_rating": round(float(t.get("DEF_RATING") or 0), 1),
                    "off_rating": round(float(t.get("OFF_RATING") or 0), 1),
                }
    except Exception:
        pass

    # Fall back to hardcoded 2024-25 values for any team not returned by the API
    for abbr, stats in TEAM_STATS_2025.items():
        if abbr not in result["teams"]:
            result["teams"][abbr] = stats

    # ── NBA CDN injury report ──────────────────────────────────────────────────
    for url in [
        "https://cdn.nba.com/static/json/staticData/injuries.json",
        "https://cdn.nba.com/static/json/liveData/injuries/injuries.json",
    ]:
        try:
            r = requests.get(url, headers=NBA_LIVE_HEADERS, timeout=10)
            if not r.ok:
                continue
            data = r.json()
            # Two possible shapes: list under "data" or dict under "injuryData"
            entries = data.get("data") or data.get("injuryData") or []
            for item in entries:
                # Shape A: { teamAbbreviation, players: [{playerName, status, comment}] }
                team_abbr = item.get("teamAbbreviation", "")
                for p in item.get("players") or []:
                    name   = p.get("playerName") or p.get("name") or ""
                    status = (p.get("status") or p.get("injuryStatus") or "").lower()
                    if name and ("out" in status or "doubtful" in status):
                        result["injuries"][name] = {
                            "status": status,
                            "team": team_abbr,
                            "reason": p.get("comment") or p.get("description") or "",
                        }
            if result["injuries"] or entries:
                break
        except Exception:
            continue

    # ── Back-to-back detection (teams playing yesterday) ──────────────────────
    try:
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y%m%d")
        r = requests.get(
            f"https://cdn.nba.com/static/json/liveData/scoreboard/scoreboard_{yesterday}_00.json",
            headers=NBA_LIVE_HEADERS, timeout=10,
        )
        if r.ok:
            for g in r.json().get("scoreboard", {}).get("games", []):
                result["back_to_back"].append(g.get("homeTeam", {}).get("teamTricode", ""))
                result["back_to_back"].append(g.get("awayTeam", {}).get("teamTricode", ""))
            result["back_to_back"] = [t for t in result["back_to_back"] if t]
    except Exception:
        pass

    # ── Game spreads from Odds API (if key is set) ─────────────────────────────
    try:
        settings = load_settings()
        api_key  = settings.get("odds_api_key", "")
        if api_key:
            r = requests.get(
                "https://api.the-odds-api.com/v4/sports/basketball_nba/odds",
                params={"apiKey": api_key, "regions": "us", "markets": "spreads",
                        "oddsFormat": "american"},
                timeout=15,
            )
            if r.ok:
                for event in r.json():
                    home_abv = TEAM_NAME_TO_ABV.get(event.get("home_team", ""),
                               event.get("home_team", "")[:3].upper())
                    away_abv = TEAM_NAME_TO_ABV.get(event.get("away_team", ""),
                               event.get("away_team", "")[:3].upper())
                    gid = f"{away_abv}@{home_abv}"
                    for bm in event.get("bookmakers", [])[:1]:
                        for market in bm.get("markets", []):
                            if market["key"] != "spreads":
                                continue
                            for outcome in market.get("outcomes", []):
                                if outcome.get("name") == event.get("home_team"):
                                    result["game_spreads"][gid] = outcome.get("point", 0)
    except Exception:
        pass

    cache_set("team_context", result)
    return result


# ── Auth models ───────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class UpdateProfileRequest(BaseModel):
    preferred_name: Optional[str] = None
    full_name: Optional[str] = None
    favorite_players: Optional[list] = None


def _user_public(u: dict) -> dict:
    return {k: u[k] for k in ("id", "email", "full_name", "preferred_name", "favorite_players") if k in u}


@app.post("/api/auth/register")
async def auth_register(body: RegisterRequest):
    email = body.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(400, "Invalid email address")
    if len(body.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    users = load_users()
    if any(u["email"] == email for u in users.values()):
        raise HTTPException(409, "An account with this email already exists")
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(body.password),
        "full_name": body.full_name.strip() or email.split("@")[0],
        "preferred_name": "",
        "favorite_players": [],
        "created_at": datetime.utcnow().isoformat(),
    }
    users[user_id] = user
    save_users(users)
    return {"token": create_token(user_id), "user": _user_public(user)}


@app.post("/api/auth/login")
async def auth_login(body: LoginRequest):
    email = body.email.strip().lower()
    users = load_users()
    user = next((u for u in users.values() if u["email"] == email), None)
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    return {"token": create_token(user["id"]), "user": _user_public(user)}


@app.get("/api/auth/me")
async def auth_me(request: Request):
    user_id = get_token_user_id(request)
    users = load_users()
    user = users.get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return _user_public(user)


@app.put("/api/auth/me")
async def auth_update_me(request: Request, body: UpdateProfileRequest):
    user_id = get_token_user_id(request)
    users = load_users()
    user = users.get(user_id)
    if not user:
        raise HTTPException(404, "User not found")
    if body.preferred_name is not None:
        user["preferred_name"] = body.preferred_name
    if body.full_name is not None:
        user["full_name"] = body.full_name
    if body.favorite_players is not None:
        user["favorite_players"] = body.favorite_players
    users[user_id] = user
    save_users(users)
    return _user_public(user)


@app.get("/health")
async def health():
    return {"status": "ok"}

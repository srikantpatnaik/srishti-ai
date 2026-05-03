"""
Srishti MCP Server
Weather, news, stock, train, cricket tools for Claude Code.
Zero API keys. Fast cold start. In-memory caching.
"""

import time
import asyncio
import json
import logging
import httpx
import feedparser
from mcp.server.fastmcp import FastMCP

# ---------------------------------------------------------------------------
# Debug logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("srishti-tools")

# ---------------------------------------------------------------------------
# MCP Server instance (defined early so decorators work)
# ---------------------------------------------------------------------------
mcp = FastMCP(
    "srishti-tools",
    instructions=(
        "Srishti MCP server providing weather, news, stock, train, and cricket tools. "
        "All tools return formatted text. No API keys required."
    ),
)

# ---------------------------------------------------------------------------
# Shared HTTP client (lazy singleton)
# ---------------------------------------------------------------------------
_HTTP_CLIENT: httpx.AsyncClient | None = None
_HTTP_TIMEOUT = httpx.Timeout(10.0, connect=5.0)


async def _get_client() -> httpx.AsyncClient:
    global _HTTP_CLIENT
    if _HTTP_CLIENT is None:
        _HTTP_CLIENT = httpx.AsyncClient(
            timeout=_HTTP_TIMEOUT,
            limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
            follow_redirects=True,
            headers={"User-Agent": "SrishtiMCP/1.0"},
        )
    return _HTTP_CLIENT


async def _close_client():
    global _HTTP_CLIENT
    if _HTTP_CLIENT:
        await _HTTP_CLIENT.aclose()
        _HTTP_CLIENT = None


# ---------------------------------------------------------------------------
# TTL Cache
# ---------------------------------------------------------------------------
class _Cache:
    """Simple in-memory TTL cache."""
    __slots__ = ("_ttl", "_store")

    def __init__(self, ttl_seconds: int):
        self._ttl = ttl_seconds
        self._store: dict[str, tuple[float, str]] = {}

    def get(self, key: str) -> str | None:
        if key in self._store:
            ts, val = self._store[key]
            if time.monotonic() - ts < self._ttl:
                return val
            del self._store[key]
        return None

    def set(self, key: str, value: str):
        self._store[key] = (time.monotonic(), value)


weather_cache = _Cache(900)    # 15 min
news_cache = _Cache(300)       # 5 min
stock_cache = _Cache(30)       # 30 sec
train_cache = _Cache(1800)     # 30 min
cricket_cache = _Cache(10)     # 10 sec

# ---------------------------------------------------------------------------
# Rate limiter for scraping
# ---------------------------------------------------------------------------
class _RateLimiter:
    """Token-bucket rate limiter."""
    __slots__ = ("_rate", "_tokens", "_last")

    def __init__(self, max_per_second: float):
        self._rate = max_per_second
        self._tokens = 1.0
        self._last = time.monotonic()

    async def acquire(self):
        now = time.monotonic()
        self._tokens = min(1.0, self._tokens + (now - self._last) * self._rate)
        self._last = now
        if self._tokens < 1.0:
            await asyncio.sleep((1.0 - self._tokens) / self._rate)
            self._tokens = 0.0


train_limiter = _RateLimiter(0.5)  # one request every 2s

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
WMO_CODES: dict[int, str] = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Rime fog",
    51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
    56: "Freezing drizzle", 57: "Dense freezing drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    66: "Freezing rain", 67: "Heavy freezing rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    77: "Snow grains",
    80: "Slight showers", 81: "Moderate showers", 82: "Violent showers",
    85: "Slight snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm w/ hail", 99: "Severe thunderstorm",
}

RSS_FEEDS: dict[str, list[tuple[str, str]]] = {
    "top": [
        ("NDTV", "https://feeds.feedburner.com/ndtvnews-top-stories"),
        ("Times of India", "https://timesofindia.indiatimes.com/rssfeedstopstories.cms"),
        ("Indian Express", "https://indianexpress.com/feed/"),
    ],
    "business": [
        ("Moneycontrol", "https://www.moneycontrol.com/rss/business.xml"),
        ("ET Bureau", "https://economictimes.indiatimes.com/rssdefault.cms"),
    ],
    "sports": [
        ("Times of India Sports", "https://timesofindia.indiatimes.com/sports/rssfeedstopstories.cms"),
    ],
    "tech": [
        ("TechCrunch", "https://techcrunch.com/feed/"),
        ("NDTV Tech", "https://tech.ndtv.com/rss/"),
    ],
}

# ---------------------------------------------------------------------------
# Weather Tool
# ---------------------------------------------------------------------------
@mcp.tool(
    description="Get current weather and 7-day forecast for a city. "
                "Returns temperature, humidity, wind, and weather conditions.",
)
async def weather(city: str) -> str:
    """Get weather for any city worldwide using Open-Meteo (free, no API key)."""
    t0 = time.monotonic()
    logger.info("TOOL_CALL: weather(city=%r)", city)
    try:
        key = f"weather:{city.strip().lower()}"
        cached = weather_cache.get(key)
        if cached:
            return cached

        client = await _get_client()
        geo = await client.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": city.strip(), "count": 1},
        )
        geo.raise_for_status()
        data = geo.json()

        if not data.get("results"):
            return f"[weather] City not found: {city}. Try a different name."

        loc = data["results"][0]
        lat, lon, tz = loc["latitude"], loc["longitude"], loc["timezone"]
        name = loc["name"]
        admin = loc.get("admin1", "")
        country = loc.get("country", "")
        loc_str = f"{name}, {admin}, {country}" if admin and country else name

        w = await client.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m",
                "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
                "temperature_unit": "celsius",
                "timezone": tz,
                "forecast_days": 7,
            },
        )
        w.raise_for_status()
        fdata = w.json()

        cur = fdata["current"]
        daily = fdata["daily"]

        lines = [
            f"Weather for {loc_str}",
            f"Current ({cur['time']}): {cur['temperature_2m']}C, "
            f"Humidity: {cur['relative_humidity_2m']}%, "
            f"Wind: {cur['wind_speed_10m']} km/h, "
            f"{WMO_CODES.get(cur['weather_code'], '?')}",
            "",
            "7-Day Forecast:",
            f"{'Date':<12}|{'Max':>6}|{'Min':>6}|{'Weather':<22}|{'Precip%':>8}",
            "-" * 56,
        ]

        precip = daily.get("precipitation_probability_max", [0] * 7)
        for i, date in enumerate(daily["time"]):
            lines.append(
                f"{date:<12}|{daily['temperature_2m_max'][i]:>5}C|{daily['temperature_2m_min'][i]:>5}C|"
                f"{WMO_CODES.get(daily['weather_code'][i], '?'):<22}|{precip[i]:>7}%"
            )

        elapsed = time.monotonic() - t0
        cached_hit = key in weather_cache._store
        logger.info("TOOL_RESULT: weather elapsed=%.3fs cache=%s", elapsed, cached_hit)
        result = "\n".join(lines)
        weather_cache.set(key, result)
        return result

    except Exception as e:
        elapsed = time.monotonic() - t0
        logger.error("TOOL_ERROR: weather elapsed=%.3fs error=%s", elapsed, e)
        return f"[weather] Error: {type(e).__name__}: {e}"


# ---------------------------------------------------------------------------
# News Tool
# ---------------------------------------------------------------------------
@mcp.tool(
    description="Fetch top news headlines from Indian news RSS feeds. "
                "Categories: top, business, sports, tech.",
)
async def news(category: str = "top", limit: int = 10) -> str:
    """Get news headlines from Indian news RSS feeds."""
    t0 = time.monotonic()
    logger.info("TOOL_CALL: news(category=%r, limit=%d)", category, limit)
    try:
        limit = max(1, min(30, int(limit)))
        key = f"news:{category}:{limit}"
        cached = news_cache.get(key)
        if cached:
            return cached

        client = await _get_client()
        feeds = RSS_FEEDS.get(category.lower(), RSS_FEEDS["top"])

        entries: list[dict] = []
        for source, url in feeds:
            try:
                resp = await client.get(url, timeout=10.0)
                if resp.status_code == 200:
                    feed = feedparser.parse(resp.content)
                    for e in feed.entries[:limit]:
                        entries.append({
                            "title": e.get("title", "No title"),
                            "source": source,
                            "published": e.get("published", e.get("updated", "")),
                            "link": e.get("link", ""),
                        })
            except Exception:
                pass

        entries.sort(key=lambda x: x["published"], reverse=True)
        entries = entries[:limit]

        lines = [
            f"{category.capitalize()} News (from {', '.join(f[0] for f in feeds)})",
            f"Updated: {time.strftime('%Y-%m-%d %H:%M IST', time.localtime())}",
            "",
        ]

        for i, e in enumerate(entries, 1):
            lines.append(f"{i}. [{e['source']}] {e['title']}")
            if e["published"]:
                lines.append(f"   Published: {e['published']}")
            if e["link"]:
                lines.append(f"   URL: {e['link']}")
            lines.append("")

        elapsed = time.monotonic() - t0
        logger.info("TOOL_RESULT: news elapsed=%.3fs entries=%d", elapsed, len(entries))
        result = "\n".join(lines)
        news_cache.set(key, result)
        return result

    except Exception as e:
        elapsed = time.monotonic() - t0
        logger.error("TOOL_ERROR: news elapsed=%.3fs error=%s", elapsed, e)
        return f"[news] Error: {type(e).__name__}: {e}"


# ---------------------------------------------------------------------------
# Stock Tool
# ---------------------------------------------------------------------------
@mcp.tool(
    description="Get current stock price and 5-day trend for Indian stocks. "
                "Use NSE tickers like RELIANCE.NS, TCS.BO, INFY.NS.",
)
async def stock(symbol: str) -> str:
    """Get current stock price and recent trend for Indian stocks."""
    t0 = time.monotonic()
    logger.info("TOOL_CALL: stock(symbol=%r)", symbol)
    try:
        import yfinance as yf

        key = f"stock:{symbol.strip().upper()}"
        cached = stock_cache.get(key)
        if cached:
            return cached

        ticker = yf.Ticker(symbol.strip())
        info = ticker.info or {}
        hist = ticker.history(period="5d")

        current = info.get("currentPrice")
        prev_close = info.get("previousClose")
        name = info.get("shortName", symbol)
        exchange = info.get("exchange", "")
        quote_type = info.get("quoteType", "Unknown")

        lines = [
            f"Stock: {symbol.upper()} ({name})",
            f"Market: {exchange} ({quote_type})",
            "",
        ]

        if current is not None and prev_close is not None:
            change = current - prev_close
            pct = (change / prev_close) * 100
            sign = "+" if change >= 0 else ""
            lines.append(f"Current Price: Rs. {current:,.2f}")
            lines.append(f"Previous Close: Rs. {prev_close:,.2f}")
            lines.append(f"Change: {sign}Rs. {change:,.2f} ({sign}{pct:.2f}%)")
        else:
            lines.append("Price not available (market may be closed or ticker invalid).")

        lines.append("")
        lines.append("5-Day Trend:")
        lines.append(f"{'Date':<12}|{'Open':>10}|{'Close':>10}|{'High':>10}|{'Low':>10}")
        lines.append("-" * 56)

        for date, row in hist.iterrows():
            d_str = date.strftime("%Y-%m-%d")
            lines.append(
                f"{d_str:<12}|{row['Open']:>10.2f}|{row['Close']:>10.2f}"
                f"|{row['High']:>10.2f}|{row['Low']:>10.2f}"
            )

        elapsed = time.monotonic() - t0
        logger.info("TOOL_RESULT: stock elapsed=%.3fs price=%s", elapsed, info.get("currentPrice", "?"))
        result = "\n".join(lines)
        stock_cache.set(key, result)
        return result

    except Exception as e:
        elapsed = time.monotonic() - t0
        logger.error("TOOL_ERROR: stock elapsed=%.3fs error=%s", elapsed, e)
        return f"[stock] Error: {type(e).__name__}: {e}"


# ---------------------------------------------------------------------------
# Train Number Tool
# ---------------------------------------------------------------------------
@mcp.tool(
    description="Get Indian Railways train schedule by train number. "
                "e.g., train_number('12301') for Rajdhani Express.",
)
async def train_number(train_number: str) -> str:
    """Get Indian Railways train schedule and current status.

    Tries multiple data sources in order:
    1. railwayapi.com (free tier, needs API key — returns error if unavailable)
    2. IRCTC enquiry page scraping
    3. Fallback: formatted error with troubleshooting tips
    """
    t0 = time.monotonic()
    logger.info("TOOL_CALL: train_number(train=%r)", train_number)
    try:
        await train_limiter.acquire()
        key = f"train:{train_number.strip()}"
        cached = train_cache.get(key)
        if cached:
            return cached

        client = await _get_client()
        tno = train_number.strip()

        # Try railwayapi.com first (free, no auth needed for basic queries)
        for api_url in [
            f"https://api.railwayapi.com/api/v4/trains/{tno}/apikey/demo/",
            f"https://cdn.jsdelivr.net/gh/srinithi0712/indian-railways-api@latest/trains/{tno}.json",
        ]:
            try:
                resp = await client.get(api_url, timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    result = _format_train_data(data, tno)
                    train_cache.set(key, result)
                    return result
            except Exception:
                continue

        # Fallback: attempt IRCTC gogogo endpoint
        try:
            resp = await client.get(
                "https://cdn1.irctc.co.in/irctcApi/api/v1/algo/train-wise",
                params={"trainNo": tno},
                timeout=10,
            )
            if resp.status_code == 200:
                data = resp.json()
                result = _format_train_data(data, tno)
                train_cache.set(key, result)
                return result
        except Exception:
            pass

        elapsed = time.monotonic() - t0
        logger.warning("TOOL_RESULT: train_number=%s elapsed=%.3fs no_data", tno, elapsed)
        return (f"[train] Train data unavailable for {tno}. "
                "Railway APIs may be temporarily down. "
                "Try again later or check: indianrail.gov.in")

    except Exception as e:
        elapsed = time.monotonic() - t0
        logger.error("TOOL_ERROR: train_number elapsed=%.3fs error=%s", elapsed, e)
        return f"[train] Error: {type(e).__name__}: {e}"


def _format_train_data(data: dict, train_no: str) -> str:
    """Format train data from IRCTC API into readable text."""
    try:
        trains = data.get("data", {}).get("trains", [])
        if not trains:
            return f"[train] No data found for train {train_no}."

        t = trains[0]
        name = t.get("trainName", "Unknown")
        type_ = t.get("trainType", "")
        direction = t.get("direction", "")

        lines = [
            f"Train: {train_no} - {name}",
            f"Type: {type_} | Direction: {direction}",
            "",
            f"{'Station':<20}|{'Arr':>8}|{'Dep':>8}|{'Dist':>6}|{'Day':>4}",
            "-" * 52,
        ]

        stations = t.get("stations", [])
        for s in stations:
            arr = s.get("arrivalTime", "--") or "--"
            dep = s.get("departureTime", "--") or "--"
            dist = s.get("distance", 0) or 0
            day = s.get("day", 1)
            station_name = s.get("stationCode", s.get("stationName", "?"))
            lines.append(f"{station_name:<20}|{arr:>8}|{dep:>8}|{dist:>6} |{day:>4}")

        return "\n".join(lines)
    except Exception:
        return f"[train] Could not parse data for train {train_no}."


# ---------------------------------------------------------------------------
# Train Route Tool
# ---------------------------------------------------------------------------
@mcp.tool(
    description="Find trains between two Indian Railway stations. "
                "Use station codes like 'NDLS' (New Delhi), 'CSTM' (Mumbai CST).",
)
async def train_route(from_station: str, to_station: str) -> str:
    """Find trains between two stations.

    Tries multiple data sources in order. Falls back gracefully if all unavailable.
    """
    t0 = time.monotonic()
    logger.info("TOOL_CALL: train_route(from=%r, to=%r)", from_station, to_station)
    try:
        await train_limiter.acquire()
        key = f"train_route:{from_station.strip().upper()}:{to_station.strip().upper()}"
        cached = train_cache.get(key)
        if cached:
            return cached

        client = await _get_client()
        fr = from_station.strip().upper()
        to = to_station.strip().upper()

        # Try railwayapi.com
        for api_url in [
            f"https://api.railwayapi.com/api/v4/trains-between-stations/?fromstationcode={fr}&tostationcode={to}&apikey/demo/",
        ]:
            try:
                resp = await client.get(api_url, timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    result = _format_route_data(data, fr, to)
                    train_cache.set(key, result)
                    return result
            except Exception:
                continue

        # Fallback: IRCTC endpoint
        try:
            resp = await client.get(
                "https://cdn1.irctc.co.in/irctcApi/api/v1/algo/trains-between-stations",
                params={"fromStationCode": fr, "toStationCode": to},
                timeout=10,
            )
            if resp.status_code == 200:
                data = resp.json()
                result = _format_route_data(data, fr, to)
                train_cache.set(key, result)
                return result
        except Exception:
            pass

        elapsed = time.monotonic() - t0
        logger.warning("TOOL_RESULT: train_route=%s->%s elapsed=%.3fs no_data", fr, to, elapsed)
        return (f"[train_route] No trains found from {fr} to {to}. "
                "Railway APIs may be temporarily down. "
                "Try again later or check: indianrail.gov.in")

    except Exception as e:
        elapsed = time.monotonic() - t0
        logger.error("TOOL_ERROR: train_route elapsed=%.3fs error=%s", elapsed, e)
        return f"[train_route] Error: {type(e).__name__}: {e}"


def _format_route_data(data: dict, fr: str, to: str) -> str:
    """Format route data from IRCTC API."""
    try:
        trains = data.get("data", {}).get("trains", [])
        if not trains:
            return f"No trains found from {fr} to {to}."

        lines = [
            f"Trains: {fr} -> {to}",
            f"{'Train':<15}|{'Name':<25}|{'Dep':>6}|{'Arr':>6}|{'Duration':>10}",
            "-" * 85,
        ]

        for t in (trains[:10]):
            no = t.get("trainNumber", "?")
            name = t.get("trainName", "?")
            dep = t.get("departureTime", "--")
            arr = t.get("arrivalTime", "--")
            dur = t.get("duration", "?")
            lines.append(f"{no:<15}|{name:<25}|{dep:>6}|{arr:>6}|{str(dur):>10}")

        return "\n".join(lines)
    except Exception:
        return f"[train_route] Could not parse route data for {fr} -> {to}."


# ---------------------------------------------------------------------------
# Cricket Live Tool
# ---------------------------------------------------------------------------
@mcp.tool(
    description="Get live cricket scores. Use match_id='live' for all live matches, "
                "or a specific match ID integer.",
)
async def cricket(match_id: str = "live") -> str:
    """Get live cricket scores.

    Tries multiple sources in order:
    1. cricsheet.org (free, open data)
    2. ESPNcricinfo scraping (may be blocked by Cloudflare)
    3. Cricbuzz scraping
    4. Fallback: formatted error with troubleshooting tips
    """
    t0 = time.monotonic()
    logger.info("TOOL_CALL: cricket(match_id=%r)", match_id)
    try:
        key = f"cricket:{match_id}"
        cached = cricket_cache.get(key)
        if cached:
            return cached

        client = await _get_client()

        if match_id.lower() == "live":
            # Try cricsheet live matches endpoint
            try:
                resp = await client.get("https://cricsheet.org/api/v1/matches/", timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    if data:
                        lines = ["Recent Matches (from cricsheet.org):", ""]
                        for m in data[:10]:
                            team1 = m.get("team1", "?")
                            team2 = m.get("team2", "?")
                            venue = m.get("venue", "?")
                            date = m.get("date", "?")
                            lines.append(f"{date} | {team1} vs {team2} | {venue}")
                        result = "\n".join(lines)
                        cricket_cache.set(key, result)
                        return result
            except Exception:
                pass

            # Try Cricbuzz main page scraping
            try:
                resp = await client.get(
                    "https://www.cricbuzz.com/",
                    headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"},
                    timeout=10,
                )
                if resp.status_code == 200:
                    import re
                    # Look for match data in page source
                    text = resp.text
                    # Look for team names and scores patterns
                    teams = re.findall(r'"teamName":"([^"]*)"', text)
                    if teams:
                        lines = ["Live/Recent Matches (from Cricbuzz):", ""]
                        seen = set()
                        for t in teams[:20]:
                            if t not in seen:
                                seen.add(t)
                                lines.append(f"  {t}")
                        result = "\n".join(lines)
                        cricket_cache.set(key, result)
                        return result
            except Exception:
                pass

            # Try ESPNcricinfo
            try:
                resp = await client.get(
                    "https://www.espncricinfo.com/",
                    headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"},
                    timeout=10,
                )
                if resp.status_code == 200 and len(resp.text) > 1000:
                    import re
                    teams = re.findall(r'"teamName":"([^"]*)"', resp.text)
                    if teams:
                        lines = ["Live/Recent Matches (from ESPNcricinfo):", ""]
                        seen = set()
                        for t in teams[:20]:
                            if t not in seen:
                                seen.add(t)
                                lines.append(f"  {t}")
                        result = "\n".join(lines)
                        cricket_cache.set(key, result)
                        return result
            except Exception:
                pass

           elapsed = time.monotonic() - t0
            logger.warning("TOOL_RESULT: cricket=%s elapsed=%.3fs no_data", match_id, elapsed)
            return ("[cricket] Live scores unavailable. "
                    "Cricket sites (Cricbuzz, ESPNcricinfo) block automated access. "
                    "Try visiting cricbuzz.com or espncricinfo.com directly.")

        else:
            # Specific match - try cricsheet
            try:
                resp = await client.get(
                    "https://cricsheet.org/api/v1/matches/",
                    timeout=10,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    # Filter by match ID if it's numeric
                    try:
                        mid = int(match_id)
                        matches = [m for m in data if m.get("id") == mid]
                        if matches:
                            elapsed = time.monotonic() - t0
                            logger.info("TOOL_RESULT: cricket match=%s elapsed=%.3fs", match_id, elapsed)
                            return _format_scorecard({"match": matches[0]})
                    except ValueError:
                        pass
            except Exception:
                pass

            elapsed = time.monotonic() - t0
            logger.warning("TOOL_RESULT: cricket match_id=%s elapsed=%.3fs no_data", match_id, elapsed)
            return f"[cricket] Could not fetch score for match {match_id}."

    except Exception as e:
        elapsed = time.monotonic() - t0
        logger.error("TOOL_ERROR: cricket elapsed=%.3fs error=%s", elapsed, e)
        return f"[cricket] Error: {type(e).__name__}: {e}"


def _format_scorecard(data: dict) -> str:
    """Format a single match scorecard."""
    try:
        match_info = data.get("matchInfo", {})
        series = match_info.get("series", {}).get("name", "?")
        team1 = match_info.get("team1", {}).get("name", "?")
        team2 = match_info.get("team2", {}).get("name", "?")
        status = match_info.get("status", "?")

        lines = [
            f"{team1} vs {team2} ({series})",
            f"Status: {status}",
            "",
        ]

        innings = data.get("innings", {})
        for inn_key, inn_val in innings.items():
            if isinstance(inn_val, dict):
                team = inn_val.get("team", {})
                scores = inn_val.get("scores", {})
                runs = scores.get("runs", "?")
                wickets = scores.get("wickets", "?")
                overs = scores.get("overs", "?")
                lines.append(
                    f"{team.get('name', '?')}: {runs}/{wickets} ({overs} ov)"
                )

        return "\n".join(lines)
    except Exception:
        return "[cricket] Could not parse scorecard."


# ---------------------------------------------------------------------------
# Cricket Schedule Tool
# ---------------------------------------------------------------------------
@mcp.tool(
    description="Get upcoming cricket match schedule for a series. "
                "e.g., series_name='IPL 2026' or 'India vs Australia'.",
)
async def cricket_schedule(series_name: str) -> str:
    """Get cricket match schedule for a series.

    Uses cricsheet.org for match data. For live schedules,
    cricket sites may block automated access.
    """
    t0 = time.monotonic()
    logger.info("TOOL_CALL: cricket_schedule(series=%r)", series_name)
    try:
        key = f"cricket_schedule:{series_name.strip().lower()}"
        cached = cricket_cache.get(key)
        if cached:
            return cached

        client = await _get_client()

        # Try cricsheet for series data
        try:
            resp = await client.get("https://cricsheet.org/api/v1/series/", timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                # Filter by series name
                matches = []
                for s in data:
                    if series_name.strip().lower() in s.get("name", "").lower():
                        matches.extend(s.get("matches", []))
                        break

                if matches:
                    lines = [f"Cricket Schedule: {series_name.strip()}", ""]
                    for m in matches[:20]:
                        team1 = m.get("team1", "?")
                        team2 = m.get("team2", "?")
                        venue = m.get("venue", "?")
                        date = m.get("date", "?")
                        lines.append(f"{date} | {team1} vs {team2} | {venue}")
                    if not lines[-1]:
                        lines.append("No matches found for this series.")
                    result = "\n".join(lines)
                    cricket_cache.set(key, result)
                    elapsed = time.monotonic() - t0
                    logger.info("TOOL_RESULT: cricket_schedule series=%r elapsed=%.3fs matches=%d",
                                series_name, elapsed, len(matches))
                    return result
        except Exception:
            pass

        elapsed = time.monotonic() - t0
        logger.warning("TOOL_RESULT: cricket_schedule series=%r elapsed=%.3fs no_data", series_name, elapsed)
        return f"[cricket_schedule] Schedule unavailable for '{series_name.strip()}'. " \
               "Cricket schedule APIs may be temporarily down."

    except Exception as e:
        elapsed = time.monotonic() - t0
        logger.error("TOOL_ERROR: cricket_schedule elapsed=%.3fs error=%s", elapsed, e)
        return f"[cricket_schedule] Error: {type(e).__name__}: {e}"


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    mcp.run()

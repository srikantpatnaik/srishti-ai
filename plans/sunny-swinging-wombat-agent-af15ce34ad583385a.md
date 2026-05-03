# MCP Stdio Servers Research -- Findings

## 1. .mcp.json / MCP Configuration Format

### For Claude Code (settings-based, not .mcp.json)

Claude Code does NOT use a `.mcp.json` file format. It uses MCP servers configured via the **settings.json** / **settings.local.json** files in Claude Code's harness. The configuration follows the MCP stdio convention:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "python3",
      "args": ["-m", "module.path", "arg1", "arg2"],
      "env": {
        "API_KEY": "xxx"
      },
      "disabled": false,
      "timeout": 60
    }
  }
}
```

**Key fields:**
- `command`: executable path (python3, node, uv run, etc.)
- `args`: array of CLI arguments
- `env`: optional environment variables
- `disabled`: set to true to temporarily disable without deleting
- `timeout`: optional server startup timeout in seconds

### For Claude Desktop (claude_desktop_config.json)

Same format but in `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or equivalent on other platforms:

```json
{
  "mcpServers": {
    "weather": {
      "command": "uv",
      "args": ["--directory", "/ABSOLUTE/PATH/weather", "run", "weather.py"]
    }
  }
}
```

### MCP Protocol: JSON-RPC Over Stdio

The protocol itself uses JSON-RPC 2.0. Messages are newline-delimited JSON over stdin/stdout:

**Important:** Messages are newline-delimited. **MUST NOT contain embedded newlines.** Server must never write to stdout (only to stderr for logging).

### Initialization Handshake (3 steps)

**Step 1 -- Client sends `initialize` request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "capabilities": {
      "roots": { "listChanged": true },
      "sampling": {},
      "tasks": { "requests": { "elicitation": { "create": {} }, "sampling": { "createMessage": {} } } }
    },
    "clientInfo": { "name": "ClaudeCode", "version": "1.0.0" }
  }
}
```

**Step 2 -- Server responds with `initialize` result:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-11-25",
    "capabilities": {
      "tools": { "listChanged": true },
      "logging": {}
    },
    "serverInfo": { "name": "my-server", "version": "1.0.0" }
  }
}
```

**Step 3 -- Client sends `initialized` notification:**
```json
{
  "jsonrpc": "2.0",
  "method": "notifications/initialized"
}
```

### Tool Listing (after handshake)

**Request:**
```json
{ "jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {} }
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "inputSchema": {
          "type": "object",
          "properties": {
            "location": { "type": "string", "description": "City name" }
          },
          "required": ["location"]
        }
      }
    ]
  }
}
```

### Tool Call

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "get_weather",
    "arguments": { "location": "Mumbai" }
  }
}
```

**Success Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Current weather in Mumbai: 32°C, Partly cloudy"
      }
    ],
    "isError": false
  }
}
```

**Error Response (tool execution error):**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      { "type": "text", "text": "Could not find location:xyz" }
    ],
    "isError": true
  }
}
```

## 2. How Skills Define Tools (graphify reference)

From `/home/sri/.claude/skills/graphify/SKILL.md` (lines 730-748):

The graphify skill uses a Python module approach. The MCP server is invoked via:
```bash
python3 -m graphify.serve graphify-out/graph.json
```

Configuration in `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "graphify": {
      "command": "python3",
      "args": ["-m", "graphify.serve", "/absolute/path/to/graphify-out/graph.json"]
    }
  }
}
```

Tools exposed: `query_graph`, `get_node`, `get_neighbors`, `get_community`, `god_nodes`, `graph_stats`, `shortest_path`.

Skills in Claude Code are defined in SKILL.md files under `~/.claude/skills/<name>/SKILL.md`. They define:
- `name`, `description`, `trigger` in YAML frontmatter
- Step-by-step instructions for the agent

The MCP server pattern (graphify's `--mcp` flag) provides persistent, on-demand tool access without requiring the agent to run long pipelines.

## 3. Best Practices for Lightweight Fast MCP Servers

### Python (using `mcp` SDK with `FastMCP`)

**Minimal dependency set:**
```bash
uv add "mcp[cli]" httpx
```

**Minimal server structure:**
```python
from mcp.server.fastmcp import FastMCP
import httpx
import sys
import logging

# Init server
mcp = FastMCP("my-server", version="1.0.0")

@mcp.tool()
async def my_tool(city: str) -> str:
    """Get weather for a city."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(f"https://api.example.com/weather?city={city}")
        return resp.text

if __name__ == "__main__":
    mcp.run(transport="stdio")
```

### Critical Best Practices

1. **NEVER print to stdout** in stdio mode. Use `print(..., file=sys.stderr)` or a logging library. stdout is for JSON-RPC messages only.

2. **Use FastMCP** (not raw Server) for decorators + automatic JSON Schema generation from type hints.

3. **Keep the process alive** -- stdio servers must not exit. They run for the entire session.

4. **Fast startup**: Avoid lazy imports at module level. Pre-import everything. The server process must start and complete the handshake in under ~5 seconds.

5. **Handle API errors gracefully**: Return `isError: true` with user-friendly text, not uncaught exceptions.

6. **Timeout external requests**: Set `httpx.AsyncClient(timeout=10)` or similar. A hung API call blocks the entire server.

7. **Minimize dependencies**: stdio servers should have minimal imports. Every extra import adds startup time and potential failure points.

8. **Server should have a `__main__` entry point** for `python3 -m my_server` invocation.

### TypeScript (using `@modelcontextprotocol/sdk`)

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "my-server", version: "1.0.0" });

server.registerTool("my_tool", {
  description: "Get weather",
  inputSchema: { city: z.string().describe("City name") },
}, async ({ city }) => {
  const resp = await fetch(`https://api.example.com/weather?city=${city}`);
  return { content: [{ type: "text", text: await resp.text() }] };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Server running on stdio");
}
main().catch(e => { console.error(e); process.exit(1); });
```

## 4. API Choices for Each Domain (Free/Cheap)

### Weather

| API | Free Tier | Rate Limit | Paid | Key |
|-----|-----------|------------|------|-----|
| **Open-Meteo** | 1,000 req/day | 1 req/sec | $19/mo+ | No |
| OpenWeatherMap | 1,000 req/day | 10/min (One Call v3) | $40/mo+ | Yes |
| NWS (US only) | Unlimited | ~60/min | Free | No |

**Recommendation: Open-Meteo** -- completely free, no API key required, covers global weather + forecasts. Best for India locations. 1,000 req/day is generous for personal use.

### News

| API | Free Tier | Rate Limit | Paid | Key |
|-----|-----------|------------|------|-----|
| **NewsAPI** | 100 req/day | 1/min | $449/mo+ | Yes (delayed 24h on free) |
| GNews | 100 req/day | 2/sec | $15/mo+ | Yes |
| **RSS/Scraping** | Unlimited | Self-limited | Free | No |
| API News | 50 req/month | N/A | $19/mo+ | Yes |

**Recommendation: GNews** -- $15/mo "Basic" plan gives 100 req/day with no 24h delay, supports India. Alternatively, scrape RSS feeds (Google News India, NDTV, etc.) for $0.

### Stock Market (India: NSE/BSE)

| API | Free Tier | Rate Limit | Paid | Key |
|-----|-----------|------------|------|-----|
| **Alpha Vantage** | 25 req/day | 5/min | $49.99/mo | Yes |
| **Finnhub** | 60 min/hr | 1/min avg | $75/mo | Yes (US only) |
| **Yahoo Finance (yfinance)** | Unlimited | ~50-100/min | Free | No (unofficial) |
| **NSE Python (nsetools)** | Unlimited | Self-limited | Free | No (scrapes NSE India) |

**Recommendation: yfinance** (unofficial but widely used) or **nsetools** for Indian markets specifically. Both free, no API key. For production: Alpha Vantage free tier (25 req/day) is sufficient for personal dashboards.

### Indian Railways

| API | Free Tier | Rate Limit | Paid | Key |
|-----|-----------|------------|------|-----|
| **indianrail.gov.in scraping** | Unlimited | Self-limited | Free | No |
| RailYatri API (unofficial) | Unlimited | Self-limited | Free | No |
| IRCTC | N/A | Rate limited | N/A | Yes (requires login) |

**Recommendation: Scrape IRCTC/Indian Rail website** (`https://indianrail.gov.in/`) or use the **indian-railways** npm package. No official API exists. The IRCTC enquiry page (`https://enquiry.irctc.co.in/enquiryEnqEngine.action`) is the standard source. For a Python MCP server, use `requests` + `BeautifulSoup` or `httpx` + `lxml`.

### Cricket

| API | Free Tier | Rate Limit | Paid | Key |
|-----|-----------|------------|------|-----|
| **CricAPI** | 500 req/mo | N/A | $15/mo | Yes |
| **cricbuzz-scraper** | Unlimited | Self-limited | Free | No |
| **ESPNCricinfo scraping** | Unlimited | Self-limited | Free | No |
| **cricbuzz-api (npm)** | Unlimited | Self-limited | Free | No |

**Recommendation: Cricbuzz scraping** or the `cricbuzz-api` npm package / `cricinfo` Python packages. Both ESPNcricinfo and Cricbuzz have internal APIs (JSON endpoints) that can be called directly without full HTML scraping. The Cricbuzz API is well-documented by the community.

## 5. Existing Open-Source MCP Server Templates

### Official Templates

1. **modelcontextprotocol/python-sdk** (GitHub) -- The official Python SDK. Includes a weather server example in the docs.
   - URL: `https://github.com/modelcontextprotocol/python-sdk`
   - Uses `FastMCP` class, `@mcp.tool()` decorator

2. **modelcontextprotocol/servers** (GitHub) -- Official reference implementations for various data sources (filesystem, github, slack, etc.)
   - URL: `https://github.com/modelcontextprotocol/servers`
   - Python + TypeScript implementations

3. **modelcontextprotocol/quickstart-resources** (GitHub) -- Tutorial weather server code
   - URL: `https://github.com/modelcontextprotocol/quickstart-resources`

### Community Templates

4. **open-mcp** (GitHub: `open-mcp/open-mcp`) -- CLI tool to scaffold MCP servers
   - URL: `https://github.com/open-mcp/open-mcp`
   - Creates project structure, dependencies, examples

5. **MCP-server-templates** -- Various community templates on GitHub

### Graphify's MCP Implementation

The graphify tool already has an MCP stdio server (`python3 -m graphify.serve`), exposing: `query_graph`, `get_node`, `get_neighbors`, `get_community`, `god_nodes`, `graph_stats`, `shortest_path`. This is a good reference for a graph-based MCP server.

## 6. Concrete Minimal MCP Server Template (Python)

```python
"""my_server -- A minimal MCP stdio server."""
from __future__ import annotations

import sys
import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("my-server", version="1.0.0")


@_mcp.tool()
async def get_weather(city: str, country: str = "IN") -> str:
    """Get current weather for a city using Open-Meteo (free, no key)."""
    # 1. Geocode city to lat/lon
    geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=en"
    async with httpx.AsyncClient(timeout=10) as client:
        geo = await client.get(geo_url)
        geo.raise_for_status()
        data = geo.json()
        if not data.get("results"):
            return f"City not found: {city}, {country}"
        lat = data["results"][0]["latitude"]
        lon = data["results"][0]["longitude"]

        # 2. Fetch weather
        weather_url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code"
            f"&timezone=auto"
        )
        weather = await client.get(weather_url)
        weather.raise_for_status()
        w = weather.json()["current"]
        return (
            f"Weather in {city}: {w['temperature_2m']}°C, "
            f"{w['weather_code']}, humidity {w['relative_humidity_2m']}%, "
            f"wind {w['wind_speed_10m']} km/h"
        )


if __name__ == "__main__":
    mcp.run(transport="stdio")
```

Config in settings.json:
```json
{
  "mcpServers": {
    "my-server": {
      "command": "uv",
      "args": ["--directory", "/home/sri/my-server", "run", "server.py"]
    }
  }
}
```

# Installation Guide

## Prerequisites

- **Node.js** 20+ (for `--env-file` flag support)
- **npm** 9+
- **OpenClaw** (optional — dashboard works in demo mode without it)

## Step 1: Clone and Install

```bash
git clone https://github.com/your-username/openclaw-dashboard.git
cd openclaw-dashboard
npm install
```

## Step 2: Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings:

```env
# Your primary OpenClaw gateway (usually localhost)
VITE_GATEWAY_1_HOST=localhost
VITE_GATEWAY_1_PORT=18789
VITE_GATEWAY_1_TOKEN=your-gateway-token

# Optional: secondary gateway on another machine
VITE_GATEWAY_2_HOST=your-remote-host
VITE_GATEWAY_2_PORT=18789
VITE_GATEWAY_2_TOKEN=your-gateway-token

# Optional: Anthropic Admin API key for real usage data
# Get from: console.anthropic.com → Settings → Admin API Keys
ANTHROPIC_ADMIN_KEY=your-admin-key

# Proxy server port (default 3001)
PROXY_PORT=3001
VITE_PROXY_URL=http://localhost:3001
```

**No keys? No problem.** Leave everything empty and the dashboard runs in demo mode with realistic mock data.

## Step 3: Run

### Development (with hot reload)

```bash
npm run dev
```

This starts:
- **Vite dev server** on `http://localhost:3000` (frontend with hot reload)
- **Proxy server** on `http://localhost:3001` (API proxy)

### Production

```bash
npm run build
npm start
```

This builds the frontend and serves it via Vite preview alongside the proxy.

## Connecting to OpenClaw

The dashboard communicates with OpenClaw gateways through the proxy server. The proxy uses the `openclaw` CLI under the hood, so make sure it's installed and in your PATH.

### Verify OpenClaw is running

```bash
openclaw health --json
```

If this returns valid JSON, your gateway is reachable and the dashboard will connect automatically.

### Multi-machine setup

If you run agents on multiple machines (e.g., a laptop and a server), configure both gateways in `.env.local`. The machines should be reachable from wherever the dashboard runs — [Tailscale](https://tailscale.com) works great for this.

## Features That Need API Keys

| Feature | Key Required | Where to Get It |
|---------|-------------|-----------------|
| Real token usage data | `ANTHROPIC_ADMIN_KEY` | [Anthropic Console](https://console.anthropic.com) → Settings → Admin API Keys |
| Gateway monitoring | Gateway token | Your OpenClaw gateway config |
| Chat with agent | OpenClaw running | `openclaw` CLI must be installed and gateway active |
| Memory search | Agent workspace | SQLite memory DB in your agent workspace |

Everything else (CRM, tasks, projects, links, settings) works entirely client-side with localStorage.

## Customization

### Changing the theme

The dashboard uses Tailwind CSS 4 with custom CSS variables defined in `src/index.css`. The color scheme uses a surface/accent system that's easy to modify.

### Adding pages

1. Create a new page component in `src/pages/`
2. Add a route in `src/App.jsx`
3. Add a nav item in `src/components/Sidebar.jsx`

### Modifying mock data

Demo data lives in `src/data/`. Edit these files to customize the demo experience:
- `mockData.js` — Agents, contacts, tasks, briefings, usage data
- `agentDetailMock.js` — Agent configuration and usage history
- `usageMock.js` — Detailed token usage breakdowns
- `callLogMock.js` — API call logs

### Agent workspace path

The proxy server looks for agent workspace files (memory DB, briefings, search scripts) at the path specified by the `AGENT_WORKSPACE` environment variable, defaulting to `~/agent-workspace`. Set this to match your OpenClaw agent's workspace directory.

## Troubleshooting

### Dashboard shows "Demo Mode" for everything

- Check that your `.env.local` has the correct gateway host/port
- Verify the gateway is running: `openclaw health --json`
- Check the proxy server logs in your terminal for connection errors

### Proxy server won't start

- Make sure port 3001 (or your configured `PROXY_PORT`) isn't already in use
- Node.js 20+ is required for the `--env-file` flag

### Gateway shows "unavailable"

- The proxy calls `openclaw` CLI commands — make sure `openclaw` is installed and in your PATH
- For remote gateways, verify network connectivity (ping the host, check Tailscale status)

### Memory search returns errors

- The search endpoint expects a SQLite database at `$AGENT_WORKSPACE/data/memory/agent_memory.db`
- Make sure the path exists and the database has been populated by your agent

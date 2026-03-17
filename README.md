# OpenClaw Dashboard

A modern, dark-themed dashboard for managing [OpenClaw](https://github.com/openclaw) AI agents. Track token usage, manage budgets, monitor system health, chat with your agent, and more — all from a single interface.

Built with React, Vite, and Tailwind CSS.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

## Features

- **Agent Monitoring** — Real-time status of your OpenClaw agents across multiple machines
- **Cost Tracking** — Token usage and spend by provider (Anthropic, OpenAI, Google, xAI, OpenRouter), with daily/weekly/monthly breakdowns
- **Daily Briefings** — AI-generated briefings with council-style multi-agent review and recommendations
- **Memory Search** — Full-text search across your agent's conversation history and knowledge base
- **CRM** — Contact management with interaction history, scoring, and relationship tracking
- **Task Management** — Task extraction from transcripts, priority management, and status tracking
- **Project Tracking** — Manage projects your agent is working on
- **Chat** — Talk to your agent directly from the dashboard
- **Settings** — Configure gateways, model providers, budgets, integrations, and display preferences
- **Links** — Quick-access bookmark manager with categories and favicons
- **Cmd+K Search** — Global search across contacts, tasks, research, and knowledge base

## Screenshots

The dashboard ships with demo data so you can explore all features immediately.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, React Router 7, Tailwind CSS 4 |
| Charts | Recharts |
| Icons | Lucide React |
| Build | Vite 6 |
| Proxy | Node.js (vanilla `http` module) |
| Data | localStorage + OpenClaw gateway RPC |

## Quick Start

```bash
git clone https://github.com/your-username/openclaw-dashboard.git
cd openclaw-dashboard
npm install
cp .env.example .env.local
npm run dev
```

The dashboard opens at `http://localhost:3000`. The proxy server runs on port 3001.

**No OpenClaw gateway required** — the dashboard runs in demo mode with mock data when no gateway is connected.

See [INSTALL.md](INSTALL.md) for detailed setup instructions.

## Architecture

```
┌─────────────────────────┐
│   Browser (:3000)       │
│   React + Vite          │
└────────┬────────────────┘
         │ /api/*
┌────────▼────────────────┐
│   Proxy Server (:3001)  │
│   Node.js               │
│   - Gateway RPC (WS)    │
│   - Anthropic Admin API │
│   - Memory search       │
│   - Chat relay          │
│   - Git sync status     │
└────────┬────────────────┘
         │
┌────────▼────────────────┐
│   OpenClaw Gateway(s)   │
│   WebSocket RPC         │
└─────────────────────────┘
```

The proxy server handles all backend communication:
- **Gateway RPC** — Calls OpenClaw gateways via the `openclaw` CLI (handles the complex WebSocket handshake)
- **Anthropic Admin API** — Proxies usage and cost data (keeps admin keys server-side)
- **Memory** — Searches the agent's SQLite memory database
- **Chat** — Relays messages to the agent through OpenClaw
- **System** — Reports git sync status for the agent workspace

## Configuration

All configuration is done through `.env.local` and the in-app Settings page.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_GATEWAY_1_HOST` | Primary gateway hostname | `localhost` |
| `VITE_GATEWAY_1_PORT` | Primary gateway port | `18789` |
| `VITE_GATEWAY_1_TOKEN` | Primary gateway auth token | (empty) |
| `VITE_GATEWAY_2_HOST` | Secondary gateway hostname | (empty) |
| `VITE_GATEWAY_2_PORT` | Secondary gateway port | `18789` |
| `VITE_GATEWAY_2_TOKEN` | Secondary gateway auth token | (empty) |
| `ANTHROPIC_ADMIN_KEY` | Anthropic Admin API key | (empty) |
| `PROXY_PORT` | Proxy server port | `3001` |
| `VITE_PROXY_URL` | Proxy URL for frontend | `http://localhost:3001` |
| `AGENT_WORKSPACE` | Path to agent workspace | `~/agent-workspace` |

### In-App Settings

The Settings page lets you configure:
- Gateway connections (host, port, token)
- Model providers and API keys
- Monthly budget and alert thresholds
- Briefing schedule and council reviewers
- Task integration (Todoist, Asana, Linear)
- YouTube, Research, and Image Gen API keys
- Display preferences (theme, currency, time periods)

Settings are stored in `localStorage` under `clawd-settings`.

## Demo Mode

When no gateway is connected or API keys aren't configured, the dashboard automatically falls back to demo mode with realistic mock data. A badge in the top bar indicates which data sources are live vs. simulated.

This makes it easy to explore the UI, customize the layout, or develop new features without needing a running OpenClaw instance.

## Development

```bash
npm run dev        # Frontend + proxy (recommended)
npm run dev:ui     # Frontend only (Vite dev server)
npm run dev:server # Proxy only
npm run build      # Production build
npm run preview    # Preview production build
```

## Project Structure

```
src/
├── App.jsx              # Route definitions
├── main.jsx             # React root
├── index.css            # Global styles + Tailwind
├── components/
│   ├── Layout.jsx       # Shell (sidebar + topbar + content)
│   ├── Sidebar.jsx      # Navigation
│   ├── TopBar.jsx       # Status bar
│   ├── KnowledgeSearch.jsx  # Cmd+K search overlay
│   ├── dashboard/       # Home page cards and charts
│   ├── agent/           # Agent detail tabs
│   ├── settings/        # Settings sections
│   ├── usage/           # Cost tracking views
│   └── ui/              # Shared UI components
├── pages/               # Route pages
├── hooks/               # Data hooks (settings, gateway, usage, etc.)
├── context/             # React contexts (DataProvider, SearchContext)
├── data/                # Mock data for demo mode
├── server/
│   └── proxy.js         # Backend proxy server
└── utils/               # Formatters, constants, helpers
```

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

## License

MIT

/**
 * Per-agent detail mock data.
 * Keyed by agent ID. Will be replaced with real gateway API calls.
 */

// ─── 30-Day Usage History ──────────────────────────────────────
// Generate realistic-looking daily data for the past 30 days.

function generateDailyUsage(baseInput, baseOutput, baseCost, { variance = 0.3, weekendDip = 0.4 } = {}) {
  const days = []
  const now = new Date('2026-02-14')
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const dayLabel = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

    // Add some random-ish variance (deterministic based on day index)
    const seed = (i * 7 + 3) % 11 / 11 // 0–1 pseudo-random
    const mult = 1 + (seed - 0.5) * 2 * variance
    const wkd = (d.getDay() === 0 || d.getDay() === 6) ? weekendDip : 1

    const inputTokens = Math.round(baseInput * mult * wkd)
    const outputTokens = Math.round(baseOutput * mult * wkd)
    const cost = +(baseCost * mult * wkd).toFixed(2)

    days.push({ date: dateStr, label: dayLabel, inputTokens, outputTokens, cost })
  }
  return days
}

export const agentUsageHistory = {
  // Jinx aggregate: combined across both machines
  jinx: generateDailyUsage(270_000, 470_000, 10.70, { variance: 0.25, weekendDip: 0.45 }),
}

// Per-machine breakdown for Jinx
export const machineUsageHistory = {
  macbook: generateDailyUsage(160_000, 290_000, 6.50, { variance: 0.3, weekendDip: 0.35 }),
  mini: generateDailyUsage(110_000, 180_000, 4.20, { variance: 0.2, weekendDip: 0.7 }),
}

// ─── Agent Configurations ──────────────────────────────────────

export const agentConfigs = {
  jinx: {
    allowedTools: ['exec', 'read', 'write', 'web_search'],
    deniedTools: ['browser', 'nodes'],
    sandboxMode: 'enabled',
    discord: { server: 'Agent HQ', status: 'connected' },
    maxTokensPerTurn: 200_000,
    systemPromptFile: 'SOUL.md',
    memoryDir: 'memory/',
    heartbeatInterval: '30m',
    cronJobs: 5,
    gitAutoCommit: true,
    gateways: [
      { machine: 'MacBook', host: 'localhost', port: 18789, path: '~/.openclaw/ (MacBook)' },
      { machine: 'Mac Mini', host: 'remote-host.example', port: 18789, path: '~/.openclaw/ (Mac Mini)' },
    ],
  },
}

// ─── Agent Memory Files ────────────────────────────────────────

// Shared memory files — Jinx uses the same workspace across both machines
export const agentMemoryFiles = {
  jinx: [
    { name: 'SOUL.md', size: '2.8 KB', modified: '2026-02-14 10:15' },
    { name: 'AGENTS.md', size: '5.4 KB', modified: '2026-02-14 09:32' },
    { name: 'USER.md', size: '1.6 KB', modified: '2026-02-11 14:20' },
    { name: 'MEMORY.md', size: '4.2 KB', modified: '2026-02-13 22:10' },
    { name: 'memory/2026-02-14.md', size: '2.4 KB', modified: '2026-02-14 11:20' },
    { name: 'memory/2026-02-13.md', size: '3.8 KB', modified: '2026-02-13 23:55' },
    { name: 'TOOLS.md', size: '1.4 KB', modified: '2026-02-12 10:00' },
    { name: 'HEARTBEAT.md', size: '0.7 KB', modified: '2026-02-14 08:00' },
    { name: 'memory/heartbeat-state.json', size: '0.4 KB', modified: '2026-02-14 11:15' },
    { name: 'cron/daily-backup.yaml', size: '0.3 KB', modified: '2026-02-08 12:00' },
    { name: 'cron/health-check.yaml', size: '0.2 KB', modified: '2026-02-08 12:00' },
  ],
}

// ─── Monthly Summary Stats ─────────────────────────────────────

export const agentMonthlyStats = {
  jinx: {
    totalTokens: 20_760_000,
    estimatedCost: 300.30,
    avgTokensPerDay: 1_483_000,
    mostUsedModel: 'Claude Sonnet 4.5',
    activeDays: 14,
  },
}

// ─── Discord Channel Links ─────────────────────────────────────

export const agentDiscordChannels = {
  jinx: { name: '#jinx', url: 'https://discord.com/channels/your-server/your-channel' },
}

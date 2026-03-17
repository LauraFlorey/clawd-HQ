/**
 * Comprehensive usage mock data for the Token Usage page.
 * Generates 90 days of daily data by provider and by agent.
 */

const PROVIDERS = ['anthropic', 'openai', 'google', 'xai', 'openrouter']
const PROVIDER_LABELS = { anthropic: 'Anthropic', openai: 'OpenAI', google: 'Google', xai: 'xAI', openrouter: 'OpenRouter' }
const PROVIDER_COLORS = { anthropic: '#d97706', openai: '#10b981', google: '#3b82f6', xai: '#8b5cf6', openrouter: '#ec4899' }

// Machine IDs — both attributed to Jinx
const MACHINE_IDS = ['macbook', 'mini']
const MACHINE_COLORS = { macbook: '#6366f1', mini: '#22c55e' }
const MACHINE_LABELS = { macbook: 'MacBook', mini: 'Mac Mini' }
const MACHINE_MODELS = { macbook: 'Claude Sonnet 4.5', mini: 'Claude Sonnet 4.5' }

// Deterministic pseudo-random from seed
function seededRand(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

// ─── Generate 90 days of daily provider data ───────────────────

function generateProviderDaily() {
  const data = []
  const endDate = new Date('2026-02-14')

  // Base daily spend per provider
  const bases = { anthropic: 13.5, openai: 8.4, google: 3.6, xai: 1.9, openrouter: 1.0 }
  // Token-per-dollar ratio (rough)
  const tpd = { anthropic: 55_000, openai: 62_000, google: 130_000, xai: 53_000, openrouter: 42_000 }

  for (let i = 89; i >= 0; i--) {
    const d = new Date(endDate)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const dow = d.getDay()
    const isWeekend = dow === 0 || dow === 6
    const dayShort = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    const row = { date: dateStr, label: dayShort }
    let totalSpend = 0
    let totalTokens = 0

    for (const p of PROVIDERS) {
      const r = seededRand(i * 31 + PROVIDERS.indexOf(p) * 7)
      const weekendMult = isWeekend ? 0.35 + r * 0.2 : 1
      const variance = 0.6 + r * 0.8 // 0.6–1.4
      const spend = +(bases[p] * variance * weekendMult).toFixed(2)
      const tokens = Math.round(spend * tpd[p])

      row[p] = spend
      row[`${p}_tokens`] = tokens
      totalSpend += spend
      totalTokens += tokens
    }

    row.total = +totalSpend.toFixed(2)
    row.totalTokens = totalTokens
    data.push(row)
  }

  return data
}

// ─── Generate 90 days of daily machine data ─────────────────────

function generateMachineDaily() {
  const data = []
  const endDate = new Date('2026-02-14')

  const bases = { macbook: 6.5, mini: 4.2 }
  const tpd = { macbook: 70_000, mini: 65_000 }

  for (let i = 89; i >= 0; i--) {
    const d = new Date(endDate)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const dow = d.getDay()
    const isWeekend = dow === 0 || dow === 6
    const dayShort = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    const row = { date: dateStr, label: dayShort }
    let totalSpend = 0
    let totalTokens = 0

    for (const m of MACHINE_IDS) {
      const r = seededRand(i * 17 + MACHINE_IDS.indexOf(m) * 13)
      const weekendMult = isWeekend ? (m === 'mini' ? 0.6 : 0.3 + r * 0.2) : 1
      const variance = 0.5 + r * 1.0
      const spend = +(bases[m] * variance * weekendMult).toFixed(2)
      const tokens = Math.round(spend * tpd[m])

      row[m] = spend
      row[`${m}_tokens`] = tokens
      totalSpend += spend
      totalTokens += tokens
    }

    row.total = +totalSpend.toFixed(2)
    row.totalTokens = totalTokens
    data.push(row)
  }

  return data
}

export const providerDailyData = generateProviderDaily()
export const machineDailyData = generateMachineDaily()

// ─── Aggregate helpers ─────────────────────────────────────────

function sliceDays(data, n) {
  return data.slice(-n)
}

function sumField(data, field) {
  return data.reduce((s, row) => s + (row[field] || 0), 0)
}

export function getProviderData(days) {
  return sliceDays(providerDailyData, days)
}

export function getMachineData(days) {
  return sliceDays(machineDailyData, days)
}

// ─── Provider breakdown table data ─────────────────────────────

export function getProviderBreakdown(days) {
  const data = sliceDays(providerDailyData, days)
  const grandTotal = sumField(data, 'total')

  return PROVIDERS.map((p) => {
    const totalCost = +sumField(data, p).toFixed(2)
    const totalTokens = sumField(data, `${p}_tokens`)
    return {
      id: p,
      name: PROVIDER_LABELS[p],
      color: PROVIDER_COLORS[p],
      totalCost,
      totalTokens,
      pctOfTotal: grandTotal > 0 ? +((totalCost / grandTotal) * 100).toFixed(1) : 0,
      avgPerDay: +(totalCost / days).toFixed(2),
      // Per-model breakdown (simplified mock)
      models: getProviderModels(p, totalCost, totalTokens),
    }
  }).sort((a, b) => b.totalCost - a.totalCost)
}

function getProviderModels(provider, totalCost, totalTokens) {
  const modelMap = {
    anthropic: [
      { name: 'Claude Sonnet 4.5', pct: 0.65 },
      { name: 'Claude Opus 4.5', pct: 0.25 },
      { name: 'Claude Haiku 4.5', pct: 0.10 },
    ],
    openai: [
      { name: 'GPT-4o', pct: 0.72 },
      { name: 'GPT-4o Mini', pct: 0.18 },
      { name: 'o3', pct: 0.10 },
    ],
    google: [
      { name: 'Gemini 2.5 Flash', pct: 0.80 },
      { name: 'Gemini 2.5 Pro', pct: 0.20 },
    ],
    xai: [
      { name: 'Grok 3', pct: 0.60 },
      { name: 'Grok 3 Mini', pct: 0.40 },
    ],
    openrouter: [
      { name: 'OpenRouter Auto', pct: 0.85 },
      { name: 'meta-llama/llama-3-70b', pct: 0.15 },
    ],
  }
  return (modelMap[provider] || []).map((m) => ({
    name: m.name,
    cost: +(totalCost * m.pct).toFixed(2),
    tokens: Math.round(totalTokens * m.pct),
  }))
}

// ─── Machine breakdown table data ───────────────────────────────

export function getMachineBreakdown(days) {
  const data = sliceDays(machineDailyData, days)
  const grandTotal = sumField(data, 'total')

  return MACHINE_IDS.map((m) => {
    const totalCost = +sumField(data, m).toFixed(2)
    const totalTokens = sumField(data, `${m}_tokens`)
    return {
      id: m,
      name: MACHINE_LABELS[m],
      machine: MACHINE_LABELS[m],
      model: MACHINE_MODELS[m],
      color: MACHINE_COLORS[m],
      totalCost,
      totalTokens,
      pctOfTotal: grandTotal > 0 ? +((totalCost / grandTotal) * 100).toFixed(1) : 0,
      daily: data.map((row) => ({
        date: row.date,
        label: row.label,
        cost: row[m] || 0,
        tokens: row[`${m}_tokens`] || 0,
      })),
    }
  }).sort((a, b) => b.totalCost - a.totalCost)
}

// ─── Summary stats ─────────────────────────────────────────────

export function getUsageSummary() {
  const thisMonth = sliceDays(providerDailyData, 14) // 14 days into Feb
  const lastMonthEquiv = providerDailyData.slice(-45, -14) // roughly Jan equivalent

  const thisMonthSpend = +sumField(thisMonth, 'total').toFixed(2)
  const lastMonthSpend = +sumField(lastMonthEquiv, 'total').toFixed(2)
  const dailyAvg = thisMonthSpend / 14
  const projected = +(dailyAvg * 28).toFixed(2) // project to 28 days (Feb)

  const pctChange = lastMonthSpend > 0
    ? +(((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 100).toFixed(1)
    : 0

  // Most expensive machine
  const machineMonth = sliceDays(machineDailyData, 14)
  const machineTotals = MACHINE_IDS.map((m) => ({
    name: MACHINE_LABELS[m],
    cost: +sumField(machineMonth, m).toFixed(2),
  })).sort((a, b) => b.cost - a.cost)

  // Most used model (by tokens this month)
  const providerMonth = sliceDays(providerDailyData, 14)
  const providerTotals = PROVIDERS.map((p) => ({
    name: PROVIDER_LABELS[p],
    tokens: sumField(providerMonth, `${p}_tokens`),
  })).sort((a, b) => b.tokens - a.tokens)

  // The top provider's top model
  const topProviderModels = {
    Anthropic: { name: 'Claude Sonnet 4.5', pct: 0.65 },
    OpenAI: { name: 'GPT-4o', pct: 0.72 },
    Google: { name: 'Gemini 2.5 Flash', pct: 0.80 },
    xAI: { name: 'Grok 3', pct: 0.60 },
    OpenRouter: { name: 'OpenRouter Auto', pct: 0.85 },
  }
  const topProvider = providerTotals[0]
  const topModel = topProviderModels[topProvider.name] || { name: topProvider.name, pct: 1 }

  return {
    thisMonthSpend,
    lastMonthSpend,
    pctChange,
    projected,
    topAgent: { name: 'Jinx', cost: machineTotals.reduce((s, m) => s + m.cost, 0) },
    topMachine: machineTotals[0],
    topModel: {
      name: topModel.name,
      tokens: Math.round(topProvider.tokens * topModel.pct),
    },
  }
}

// ─── Cursor IDE Usage ──────────────────────────────────────────

export const cursorUsage = {
  plan: 'Pro',
  billingCycle: { start: '2026-02-01', end: '2026-02-28' },
  lastUpdated: '2026-02-14 11:30 AM',

  // Premium requests (500/month on Pro)
  premiumRequests: { used: 347, limit: 500 },

  // Usage breakdown by model
  modelBreakdown: [
    { model: 'Claude Sonnet 4.5', requests: 182, pct: 52.4 },
    { model: 'GPT-4o', requests: 98, pct: 28.2 },
    { model: 'Claude Opus 4.5', requests: 42, pct: 12.1 },
    { model: 'Gemini 2.5 Pro', requests: 25, pct: 7.2 },
  ],

  // Daily request counts (past 14 days)
  dailyRequests: [
    { date: '2026-02-01', requests: 28 },
    { date: '2026-02-02', requests: 12 },
    { date: '2026-02-03', requests: 31 },
    { date: '2026-02-04', requests: 26 },
    { date: '2026-02-05', requests: 34 },
    { date: '2026-02-06', requests: 22 },
    { date: '2026-02-07', requests: 18 },
    { date: '2026-02-08', requests: 8 },
    { date: '2026-02-09', requests: 15 },
    { date: '2026-02-10', requests: 29 },
    { date: '2026-02-11', requests: 33 },
    { date: '2026-02-12', requests: 27 },
    { date: '2026-02-13', requests: 24 },
    { date: '2026-02-14', requests: 20 },
  ],

  // Estimated spend (Cursor Pro is $20/mo, overages priced per request)
  monthlyFee: 20.00,
  overageRate: 0.04, // $ per premium request over limit
  estimatedOverage: 0, // not over limit yet
}

// ─── CSV Export helpers ────────────────────────────────────────

export { PROVIDERS, PROVIDER_LABELS, PROVIDER_COLORS, MACHINE_IDS, MACHINE_COLORS, MACHINE_LABELS, MACHINE_MODELS }

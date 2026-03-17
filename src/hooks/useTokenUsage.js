import { useState, useEffect, useMemo, useCallback } from 'react'

/**
 * Custom hook that aggregates token usage data.
 *
 * Strategy:
 *   1. Fetch real data from /api/anthropic/usage and /api/anthropic/cost (via proxy)
 *   2. If the proxy returns { demo: true }, fall back to mock data
 *   3. Polls every 5 minutes for fresh data
 *
 * @param {Array} gatewayAgents - Flattened array of all agents from all gateways
 * @returns {{ loading, demoMode, ...computed, daily, getProviderData, getAgentData, ... }}
 */
export function useTokenUsage(gatewayAgents) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [demoMode, setDemoMode] = useState(false)

  const fetchUsage = useCallback(async () => {
    try {
      // Fetch from all available sources in parallel:
      // 1. Anthropic Admin API (via proxy)
      // 2. Gateway usage-cost (local session logs via proxy)
      const [usageRes, costRes, gwUsageRes] = await Promise.all([
        fetch('/api/anthropic/usage').catch(() => null),
        fetch('/api/anthropic/cost').catch(() => null),
        fetch('/api/gateway/macbook/usage?days=90').catch(() => null),
      ])

      const usageJson = usageRes ? await usageRes.json().catch(() => null) : null
      const costJson = costRes ? await costRes.json().catch(() => null) : null
      const gwUsageJson = gwUsageRes ? await gwUsageRes.json().catch(() => null) : null

      // Try Anthropic Admin API first (most comprehensive)
      if (usageJson && !usageJson.demo && costJson && !costJson.demo) {
        const parsed = parseAnthropicData(usageJson.data, costJson.data)
        setData(parsed)
        setDemoMode(false)
        setLoading(false)
        return
      }

      // Try gateway usage-cost data (from local session logs)
      if (gwUsageJson?.ok && !gwUsageJson.demo && gwUsageJson.data?.daily) {
        const parsed = parseGatewayUsageData(gwUsageJson.data)
        setData(parsed)
        setDemoMode(false)
        setLoading(false)
        return
      }

      // All real sources failed — fall back to mock
      setData(generateMockUsageData())
      setDemoMode(true)
      setLoading(false)
    } catch (err) {
      // Network error — fall back to mock
      console.warn('[useTokenUsage] API fetch failed, using mock data:', err.message)
      setData(generateMockUsageData())
      setDemoMode(true)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsage()

    // Poll every 5 minutes
    const interval = setInterval(fetchUsage, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchUsage])

  // ── Derived computations ───────────────────────────────────

  const computed = useMemo(() => {
    if (!data) return null

    const today = data.daily[data.daily.length - 1]
    const dayOfMonth = new Date().getDate()
    const thisMonth = data.daily.slice(-dayOfMonth)
    const lastMonth = data.daily.slice(-(dayOfMonth + 30), -dayOfMonth)

    const totalToday = today?.total || 0
    const totalThisMonth = thisMonth.reduce((s, d) => s + d.total, 0)
    const totalLastMonth = lastMonth.reduce((s, d) => s + d.total, 0)
    const dailyAvg = dayOfMonth > 0 ? totalThisMonth / dayOfMonth : 0
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    const projected = +(dailyAvg * daysInMonth).toFixed(2)
    const pctChange =
      totalLastMonth > 0
        ? +(((totalThisMonth - totalLastMonth) / totalLastMonth) * 100).toFixed(1)
        : 0

    // Top machine
    const machineTotals = data.machineIds.map((m) => ({
      name: data.machineLabels[m],
      cost: +thisMonth.reduce((s, d) => s + (d[m] || 0), 0).toFixed(2),
    })).sort((a, b) => b.cost - a.cost)

    // Top model (by the provider with most tokens)
    const providerTotals = data.providerIds.map((p) => ({
      name: data.providerLabels[p],
      tokens: thisMonth.reduce((s, d) => s + (d[`${p}_tokens`] || 0), 0),
    })).sort((a, b) => b.tokens - a.tokens)

    const topModelMap = {
      Anthropic: 'Claude Sonnet 4.5',
      OpenAI: 'GPT-4o',
      Google: 'Gemini 2.5 Flash',
      xAI: 'Grok 3',
      OpenRouter: 'OpenRouter Auto',
    }

    return {
      totalToday: +totalToday.toFixed(2),
      totalThisMonth: +totalThisMonth.toFixed(2),
      totalLastMonth: +totalLastMonth.toFixed(2),
      projected,
      pctChange,
      dailyAvg: +dailyAvg.toFixed(2),
      topAgent: { name: 'Jinx', cost: machineTotals.reduce((s, m) => s + m.cost, 0) },
      topMachine: machineTotals[0] || { name: '—', cost: 0 },
      topModel: {
        name: topModelMap[providerTotals[0]?.name] || '—',
        tokens: Math.round((providerTotals[0]?.tokens || 0) * 0.65),
      },
    }
  }, [data])

  return {
    loading,
    demoMode,
    ...computed,
    // Pass through raw data for charts
    daily: data?.daily || [],
    providerIds: data?.providerIds || [],
    providerLabels: data?.providerLabels || {},
    providerColors: data?.providerColors || {},
    machineIds: data?.machineIds || [],
    machineColors: data?.machineColors || {},
    machineLabels: data?.machineLabels || {},
    machineModels: data?.machineModels || {},
    // Legacy aliases for backward compat in components
    agentIds: data?.machineIds || [],
    agentColors: data?.machineColors || {},
    agentMachines: data?.machineLabels || {},
    agentModels: data?.machineModels || {},
    // Slice helpers
    getProviderData: (days) => (data?.daily || []).slice(-days),
    getMachineData: (days) => (data?.machineDaily || []).slice(-days),
    getAgentData: (days) => (data?.machineDaily || []).slice(-days),
    getProviderBreakdown: (days) => buildProviderBreakdown(data, days),
    getMachineBreakdown: (days) => buildMachineBreakdown(data, days),
    getAgentBreakdown: (days) => buildMachineBreakdown(data, days),
    summary: computed,
  }
}

// ─── Parse real Anthropic API responses ─────────────────────────

function parseAnthropicData(usageData, costData) {
  // The Anthropic usage API returns:
  //   { data: [ { bucket_start_time, input_tokens, output_tokens, model, ... }, ... ] }
  // The cost API returns:
  //   { data: [ { bucket_start_time, cost_usd, model, ... }, ... ] }

  // Group by date
  const dailyMap = new Map()

  if (usageData?.data) {
    for (const bucket of usageData.data) {
      const date = bucket.bucket_start_time?.slice(0, 10)
      if (!date) continue
      if (!dailyMap.has(date)) dailyMap.set(date, { date, label: formatDateLabel(date) })
      const row = dailyMap.get(date)

      // Anthropic-specific: all goes under 'anthropic' provider
      row.anthropic = (row.anthropic || 0)
      row.anthropic_tokens = (row.anthropic_tokens || 0) + (bucket.input_tokens || 0) + (bucket.output_tokens || 0)
    }
  }

  // Apply cost data
  if (costData?.data) {
    for (const bucket of costData.data) {
      const date = bucket.bucket_start_time?.slice(0, 10)
      if (!date) continue
      if (!dailyMap.has(date)) dailyMap.set(date, { date, label: formatDateLabel(date) })
      const row = dailyMap.get(date)

      // Cost is in USD (string), convert to number
      const cost = parseFloat(bucket.cost_usd || '0')
      row.anthropic = (row.anthropic || 0) + cost
    }
  }

  // Build daily array
  const daily = [...dailyMap.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({
      ...row,
      total: +(row.anthropic || 0).toFixed(2),
      totalTokens: row.anthropic_tokens || 0,
      // Zero out other providers since we only have Anthropic data
      openai: 0, openai_tokens: 0,
      google: 0, google_tokens: 0,
      xai: 0, xai_tokens: 0,
      openrouter: 0, openrouter_tokens: 0,
    }))

  // For machine daily, we can't split by machine from the Anthropic API alone
  // Use a 60/40 split approximation (MacBook/Mac Mini)
  const machineDaily = daily.map((row) => ({
    date: row.date,
    label: row.label,
    macbook: +(row.total * 0.6).toFixed(2),
    macbook_tokens: Math.round((row.totalTokens || 0) * 0.6),
    mini: +(row.total * 0.4).toFixed(2),
    mini_tokens: Math.round((row.totalTokens || 0) * 0.4),
    total: row.total,
    totalTokens: row.totalTokens,
  }))

  return {
    daily,
    machineDaily,
    providerIds: PROVIDERS,
    providerLabels: PROVIDER_LABELS,
    providerColors: PROVIDER_COLORS,
    machineIds: MACHINE_IDS,
    machineColors: MACHINE_COLORS,
    machineLabels: MACHINE_LABELS,
    machineModels: MACHINE_MODELS,
  }
}

// ─── Parse gateway usage-cost data (from session logs) ──────────

function parseGatewayUsageData(gwData) {
  // gwData shape from `openclaw gateway usage-cost --json`:
  // { daily: [{ date, input, output, totalTokens, totalCost, ... }], totals: { ... } }

  const daily = (gwData.daily || []).map((day) => ({
    date: day.date,
    label: formatDateLabel(day.date),
    // All usage goes under 'anthropic' since that's the primary provider
    anthropic: +(day.totalCost || 0).toFixed(4),
    anthropic_tokens: day.totalTokens || 0,
    // Zero other providers (gateway only tracks its own calls)
    openai: 0, openai_tokens: 0,
    google: 0, google_tokens: 0,
    xai: 0, xai_tokens: 0,
    openrouter: 0, openrouter_tokens: 0,
    total: +(day.totalCost || 0).toFixed(4),
    totalTokens: day.totalTokens || 0,
  }))

  // Fill in missing days (gateway only returns days with activity)
  const filledDaily = fillMissingDays(daily, 90)

  // For machine daily, approximate 60/40 split (MacBook/Mac Mini)
  // In the future, gateway may expose per-machine breakdown
  const machineDaily = filledDaily.map((row) => ({
    date: row.date,
    label: row.label,
    macbook: +(row.total * 0.6).toFixed(4),
    macbook_tokens: Math.round((row.totalTokens || 0) * 0.6),
    mini: +(row.total * 0.4).toFixed(4),
    mini_tokens: Math.round((row.totalTokens || 0) * 0.4),
    total: row.total,
    totalTokens: row.totalTokens,
  }))

  return {
    daily: filledDaily,
    machineDaily,
    providerIds: PROVIDERS,
    providerLabels: PROVIDER_LABELS,
    providerColors: PROVIDER_COLORS,
    machineIds: MACHINE_IDS,
    machineColors: MACHINE_COLORS,
    machineLabels: MACHINE_LABELS,
    machineModels: MACHINE_MODELS,
  }
}

function fillMissingDays(daily, totalDays) {
  if (daily.length === 0) return daily
  const end = new Date()
  const dateSet = new Set(daily.map((d) => d.date))
  const filled = []

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)

    const existing = daily.find((row) => row.date === dateStr)
    if (existing) {
      filled.push(existing)
    } else {
      filled.push({
        date: dateStr,
        label: formatDateLabel(dateStr),
        anthropic: 0, anthropic_tokens: 0,
        openai: 0, openai_tokens: 0,
        google: 0, google_tokens: 0,
        xai: 0, xai_tokens: 0,
        openrouter: 0, openrouter_tokens: 0,
        total: 0, totalTokens: 0,
      })
    }
  }

  return filled
}

function formatDateLabel(dateStr) {
  const today = new Date().toISOString().slice(0, 10)
  if (dateStr === today) return 'Today'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Constants ──────────────────────────────────────────────────

const PROVIDERS = ['anthropic', 'openai', 'google', 'xai', 'openrouter']
const PROVIDER_LABELS = { anthropic: 'Anthropic', openai: 'OpenAI', google: 'Google', xai: 'xAI', openrouter: 'OpenRouter' }
const PROVIDER_COLORS = { anthropic: '#d97706', openai: '#10b981', google: '#3b82f6', xai: '#8b5cf6', openrouter: '#ec4899' }
// Machine-based breakdown (Jinx runs on both)
const MACHINE_IDS = ['macbook', 'mini']
const MACHINE_COLORS = { macbook: '#6366f1', mini: '#22c55e' }
const MACHINE_LABELS = { macbook: 'MacBook', mini: 'Mac Mini' }
const MACHINE_MODELS = { macbook: 'Claude Sonnet 4.5', mini: 'Claude Sonnet 4.5' }

// ─── Mock data generator (fallback) ─────────────────────────────

function seededRand(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function generateMockUsageData() {
  const endDate = new Date()
  const bases = { anthropic: 13.5, openai: 8.4, google: 3.6, xai: 1.9, openrouter: 1.0 }
  const tpd = { anthropic: 55_000, openai: 62_000, google: 130_000, xai: 53_000, openrouter: 42_000 }
  const machineBases = { macbook: 6.5, mini: 4.2 }
  const machineTpd = { macbook: 70_000, mini: 65_000 }

  const daily = []
  const machineDaily = []

  for (let i = 89; i >= 0; i--) {
    const d = new Date(endDate)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const dow = d.getDay()
    const isWeekend = dow === 0 || dow === 6
    const label = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    const pRow = { date: dateStr, label }
    let pTotal = 0
    let pTotalTokens = 0
    for (const p of PROVIDERS) {
      const r = seededRand(i * 31 + PROVIDERS.indexOf(p) * 7)
      const wm = isWeekend ? 0.35 + r * 0.2 : 1
      const v = 0.6 + r * 0.8
      const spend = +(bases[p] * v * wm).toFixed(2)
      const tokens = Math.round(spend * tpd[p])
      pRow[p] = spend
      pRow[`${p}_tokens`] = tokens
      pTotal += spend
      pTotalTokens += tokens
    }
    pRow.total = +pTotal.toFixed(2)
    pRow.totalTokens = pTotalTokens
    daily.push(pRow)

    const mRow = { date: dateStr, label }
    let mTotal = 0
    let mTotalTokens = 0
    for (const m of MACHINE_IDS) {
      const r = seededRand(i * 17 + MACHINE_IDS.indexOf(m) * 13)
      const wm = isWeekend ? (m === 'mini' ? 0.6 : 0.3 + r * 0.2) : 1
      const v = 0.5 + r * 1.0
      const spend = +(machineBases[m] * v * wm).toFixed(2)
      const tokens = Math.round(spend * machineTpd[m])
      mRow[m] = spend
      mRow[`${m}_tokens`] = tokens
      mTotal += spend
      mTotalTokens += tokens
    }
    mRow.total = +mTotal.toFixed(2)
    mRow.totalTokens = mTotalTokens
    machineDaily.push(mRow)
  }

  return {
    daily, machineDaily,
    providerIds: PROVIDERS, providerLabels: PROVIDER_LABELS, providerColors: PROVIDER_COLORS,
    machineIds: MACHINE_IDS, machineColors: MACHINE_COLORS, machineLabels: MACHINE_LABELS, machineModels: MACHINE_MODELS,
  }
}

// ─── Breakdown builders ────────────────────────────────────────

function buildProviderBreakdown(data, days) {
  if (!data) return []
  const slice = data.daily.slice(-days)
  const grandTotal = slice.reduce((s, r) => s + r.total, 0)

  const modelMap = {
    anthropic: [{ name: 'Claude Sonnet 4.5', pct: 0.65 }, { name: 'Claude Opus 4.5', pct: 0.25 }, { name: 'Claude Haiku 4.5', pct: 0.10 }],
    openai: [{ name: 'GPT-4o', pct: 0.72 }, { name: 'GPT-4o Mini', pct: 0.18 }, { name: 'o3', pct: 0.10 }],
    google: [{ name: 'Gemini 2.5 Flash', pct: 0.80 }, { name: 'Gemini 2.5 Pro', pct: 0.20 }],
    xai: [{ name: 'Grok 3', pct: 0.60 }, { name: 'Grok 3 Mini', pct: 0.40 }],
    openrouter: [{ name: 'OpenRouter Auto', pct: 0.85 }, { name: 'meta-llama/llama-3-70b', pct: 0.15 }],
  }

  return PROVIDERS.map((p) => {
    const totalCost = +slice.reduce((s, r) => s + (r[p] || 0), 0).toFixed(2)
    const totalTokens = slice.reduce((s, r) => s + (r[`${p}_tokens`] || 0), 0)
    return {
      id: p, name: PROVIDER_LABELS[p], color: PROVIDER_COLORS[p],
      totalCost, totalTokens,
      pctOfTotal: grandTotal > 0 ? +((totalCost / grandTotal) * 100).toFixed(1) : 0,
      avgPerDay: +(totalCost / days).toFixed(2),
      models: (modelMap[p] || []).map((m) => ({
        name: m.name, cost: +(totalCost * m.pct).toFixed(2), tokens: Math.round(totalTokens * m.pct),
      })),
    }
  }).sort((a, b) => b.totalCost - a.totalCost)
}

function buildMachineBreakdown(data, days) {
  if (!data) return []
  const slice = data.machineDaily.slice(-days)
  const grandTotal = slice.reduce((s, r) => s + r.total, 0)

  return MACHINE_IDS.map((m) => {
    const totalCost = +slice.reduce((s, r) => s + (r[m] || 0), 0).toFixed(2)
    const totalTokens = slice.reduce((s, r) => s + (r[`${m}_tokens`] || 0), 0)
    return {
      id: m, name: MACHINE_LABELS[m], machine: MACHINE_LABELS[m], model: MACHINE_MODELS[m], color: MACHINE_COLORS[m],
      totalCost, totalTokens,
      pctOfTotal: grandTotal > 0 ? +((totalCost / grandTotal) * 100).toFixed(1) : 0,
      daily: slice.map((r) => ({ date: r.date, label: r.label, cost: r[m] || 0, tokens: r[`${m}_tokens`] || 0 })),
    }
  }).sort((a, b) => b.totalCost - a.totalCost)
}

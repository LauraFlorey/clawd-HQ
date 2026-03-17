/**
 * Cost Intelligence Engine
 *
 * Analyzes token usage data and produces actionable optimization recommendations.
 * Fed by the call log (from gateway API in production, mock data for now).
 *
 * Four analysis passes:
 *   1. Expensive Model on Simple Tasks
 *   2. High-Spend Task Types
 *   3. Spend Velocity Warning
 *   4. Per-Project Cost Tracking
 */

import { calculateCost, MODEL_PRICING, getModelPricing } from './pricing'
import { formatSpend } from './formatters'
import { exportCsv } from './exportCsv'

// ─── Thresholds (configurable) ─────────────────────────────────

const SIMPLE_INPUT_THRESHOLD = 500    // tokens
const SIMPLE_OUTPUT_THRESHOLD = 200   // tokens
const SIMPLE_CALL_PCT_THRESHOLD = 0.40 // 40% of calls
const TASK_TYPE_SPEND_THRESHOLD = 0.25 // 25% of total
const BUDGET_WARN_PCT = 0.80          // yellow at 80%
const BUDGET_DANGER_PCT = 1.00        // red at 100%

const SIMPLE_TASK_TYPES = new Set([
  'status-check', 'file-read', 'simple-format', 'formatting', 'conversation',
])

const EXPENSIVE_MODELS = new Set([
  'claude-opus-4.5', 'gpt-4o', 'gemini-2.5-pro', 'grok-3', 'o3',
])

// Downgrade recommendations: expensive → suggested cheaper alternative
const DOWNGRADE_MAP = {
  'claude-opus-4.5': 'claude-sonnet-4.5',
  'gpt-4o': 'gpt-4o-mini',
  'gemini-2.5-pro': 'gemini-2.5-flash',
  'grok-3': 'grok-3-mini',
  'o3': 'gpt-4o-mini',
}

// Model display names
const MODEL_NAMES = {
  'claude-opus-4.5': 'Claude Opus 4.5',
  'claude-sonnet-4.5': 'Claude Sonnet 4.5',
  'claude-haiku-4.5': 'Claude Haiku 4.5',
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'o3': 'o3',
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'grok-3': 'Grok 3',
  'grok-3-mini': 'Grok 3 Mini',
  'openrouter-auto': 'OpenRouter Auto',
}

function modelName(id) {
  return MODEL_NAMES[id] || id
}

// ─── ANALYSIS 1: Expensive Model on Simple Tasks ──────────────

function isSimpleCall(call) {
  return (
    (call.inputTokens < SIMPLE_INPUT_THRESHOLD) ||
    (call.outputTokens < SIMPLE_OUTPUT_THRESHOLD) ||
    SIMPLE_TASK_TYPES.has(call.taskType)
  )
}

export function analyzeExpensiveSimpleCalls(callLog) {
  // Group by agent
  const byAgent = {}
  for (const call of callLog) {
    if (!byAgent[call.agentId]) byAgent[call.agentId] = []
    byAgent[call.agentId].push(call)
  }

  const recommendations = []

  for (const [agentId, calls] of Object.entries(byAgent)) {
    const simpleCalls = calls.filter(isSimpleCall)
    const expensiveSimpleCalls = simpleCalls.filter(
      (c) => EXPENSIVE_MODELS.has(c.model)
    )

    if (calls.length === 0) continue
    const simplePct = simpleCalls.length / calls.length
    const expensiveSimplePct = expensiveSimpleCalls.length / calls.length

    if (expensiveSimplePct <= SIMPLE_CALL_PCT_THRESHOLD) continue

    // Find the most common expensive model in simple calls
    const modelCounts = {}
    for (const c of expensiveSimpleCalls) {
      modelCounts[c.model] = (modelCounts[c.model] || 0) + 1
    }
    const topModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]
    if (!topModel) continue

    const [expModel, count] = topModel
    const altModel = DOWNGRADE_MAP[expModel]
    if (!altModel) continue

    // Calculate potential savings
    const relevantCalls = expensiveSimpleCalls.filter((c) => c.model === expModel)
    const currentCost = relevantCalls.reduce(
      (sum, c) => sum + calculateCost({ input: c.inputTokens, output: c.outputTokens }, expModel),
      0
    )
    const altCost = relevantCalls.reduce(
      (sum, c) => sum + calculateCost({ input: c.inputTokens, output: c.outputTokens }, altModel),
      0
    )
    const totalSavings = +(currentCost - altCost).toFixed(2)
    const days = new Set(callLog.map((c) => c.date)).size || 1
    const dailySavings = +(totalSavings / days).toFixed(2)

    recommendations.push({
      id: `simple-${agentId}`,
      type: 'suggestion',
      severity: 'info',
      agent: agentId,
      title: `Jinx (${agentId.replace('jinx-', '')}): Simple calls on expensive model`,
      description: `${Math.round(expensiveSimplePct * 100)}% of calls used <${SIMPLE_INPUT_THRESHOLD} input tokens on ${modelName(expModel)}. Estimated savings of ${formatSpend(dailySavings)}/day by routing simple tasks to ${modelName(altModel)}.`,
      impact: totalSavings,
      dailyImpact: dailySavings,
      details: {
        totalCalls: calls.length,
        simpleCalls: simpleCalls.length,
        expensiveSimpleCalls: expensiveSimpleCalls.length,
        simplePct: Math.round(simplePct * 100),
        expensiveSimplePct: Math.round(expensiveSimplePct * 100),
        currentModel: expModel,
        suggestedModel: altModel,
        currentCost: +currentCost.toFixed(2),
        alternativeCost: +altCost.toFixed(2),
      },
    })
  }

  return recommendations.sort((a, b) => b.impact - a.impact)
}

// ─── ANALYSIS 2: High-Spend Task Types ─────────────────────────

export function analyzeTaskTypeSpend(callLog) {
  const totalCost = callLog.reduce(
    (sum, c) => sum + calculateCost({ input: c.inputTokens, output: c.outputTokens }, c.model),
    0
  )

  // Group by task type
  const byTaskType = {}
  for (const call of callLog) {
    if (!byTaskType[call.taskType]) {
      byTaskType[call.taskType] = {
        id: call.taskType,
        label: call.taskTypeLabel,
        calls: 0,
        cost: 0,
        tokens: 0,
      }
    }
    const entry = byTaskType[call.taskType]
    entry.calls++
    entry.cost += calculateCost(
      { input: call.inputTokens, output: call.outputTokens },
      call.model
    )
    entry.tokens += call.inputTokens + call.outputTokens
  }

  const ranked = Object.values(byTaskType)
    .map((t) => ({
      ...t,
      cost: +t.cost.toFixed(2),
      pctOfTotal: totalCost > 0 ? +((t.cost / totalCost) * 100).toFixed(1) : 0,
    }))
    .sort((a, b) => b.cost - a.cost)

  const recommendations = []

  // Suggestion tips per task type
  const TASK_TIPS = {
    'code-generation': 'Consider: prompt caching, shorter context windows, or model downgrade for boilerplate.',
    'research': 'Consider: caching frequent queries, using smaller models for initial passes.',
    'analysis': 'Consider: pre-filtering data before sending to LLM, batching similar analyses.',
    'formatting': 'Consider: using a cheaper model — formatting rarely needs frontier intelligence.',
    'conversation': 'Consider: routing casual chat to Haiku/Flash tier models.',
  }

  for (const task of ranked) {
    if (task.pctOfTotal >= TASK_TYPE_SPEND_THRESHOLD * 100) {
      recommendations.push({
        id: `task-${task.id}`,
        type: 'suggestion',
        severity: task.pctOfTotal > 35 ? 'warning' : 'info',
        title: `"${task.label}" dominates spend`,
        description: `${task.label} accounts for ${task.pctOfTotal}% of spend (${formatSpend(task.cost)} this month). ${TASK_TIPS[task.id] || 'Review usage patterns for optimization opportunities.'}`,
        impact: +(task.cost * 0.15).toFixed(2), // Estimate 15% could be saved
        details: { taskType: task.id, calls: task.calls, cost: task.cost, pctOfTotal: task.pctOfTotal },
      })
    }
  }

  return { ranked, recommendations }
}

// ─── ANALYSIS 3: Spend Velocity Warning ────────────────────────

export function analyzeSpendVelocity(callLog, monthlyBudget = 100) {
  // Get daily totals for past 7 days
  const today = new Date('2026-02-14')
  const dailySpend = {}

  for (const call of callLog) {
    const cost = calculateCost(
      { input: call.inputTokens, output: call.outputTokens },
      call.model
    )
    dailySpend[call.date] = (dailySpend[call.date] || 0) + cost
  }

  // Last 7 days
  const recentDays = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    recentDays.push({
      date: key,
      label: i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      spend: +(dailySpend[key] || 0).toFixed(2),
    })
  }

  const avgDailySpend = recentDays.reduce((s, d) => s + d.spend, 0) / 7
  const daysInMonth = 28 // Feb 2026
  const dayOfMonth = 14
  const spentSoFar = Object.values(dailySpend).reduce((s, v) => s + v, 0)
  const projected = +(avgDailySpend * daysInMonth).toFixed(2)
  const remaining = +(monthlyBudget - spentSoFar).toFixed(2)
  const daysLeft = daysInMonth - dayOfMonth
  const requiredDailyReduction = remaining < 0 ? 0 : 0
  const dailyBudgetRemaining = daysLeft > 0 ? +(remaining / daysLeft).toFixed(2) : 0

  const budgetPct = monthlyBudget > 0 ? spentSoFar / monthlyBudget : 0
  const projectedPct = monthlyBudget > 0 ? projected / monthlyBudget : 0

  let severity = 'ok'
  let recommendation = null

  if (projectedPct >= BUDGET_DANGER_PCT) {
    severity = 'danger'
    const overage = +(projected - monthlyBudget).toFixed(2)
    const dailyReduction = daysLeft > 0 ? +(overage / daysLeft).toFixed(2) : overage
    recommendation = {
      id: 'velocity-danger',
      type: 'alert',
      severity: 'danger',
      title: 'Projected spend exceeds budget',
      description: `At current pace, projected monthly spend is ${formatSpend(projected)} (budget: ${formatSpend(monthlyBudget)}). Reduce by ~${formatSpend(dailyReduction)}/day to stay on target.`,
      impact: overage,
    }
  } else if (projectedPct >= BUDGET_WARN_PCT) {
    severity = 'warning'
    recommendation = {
      id: 'velocity-warn',
      type: 'alert',
      severity: 'warning',
      title: 'Approaching monthly budget',
      description: `Projected spend is ${formatSpend(projected)} (${Math.round(projectedPct * 100)}% of ${formatSpend(monthlyBudget)} budget). ${daysLeft} days remaining with ${formatSpend(remaining)} left.`,
      impact: +(projected - monthlyBudget * BUDGET_WARN_PCT).toFixed(2),
    }
  }

  return {
    recentDays,
    avgDailySpend: +avgDailySpend.toFixed(2),
    spentSoFar: +spentSoFar.toFixed(2),
    projected,
    monthlyBudget,
    budgetPct: +budgetPct.toFixed(3),
    projectedPct: +projectedPct.toFixed(3),
    remaining,
    daysLeft,
    dailyBudgetRemaining,
    severity,
    recommendation,
  }
}

// ─── ANALYSIS 4: Per-Project Cost Tracking ─────────────────────

export function analyzeProjectCosts(callLog) {
  const byProject = {}

  for (const call of callLog) {
    const pid = call.project || 'untagged'
    if (!byProject[pid]) {
      byProject[pid] = {
        id: pid,
        label: call.projectLabel || 'Untagged',
        calls: 0,
        cost: 0,
        tokens: 0,
        agents: new Set(),
        models: new Set(),
      }
    }
    const entry = byProject[pid]
    entry.calls++
    entry.cost += calculateCost(
      { input: call.inputTokens, output: call.outputTokens },
      call.model
    )
    entry.tokens += call.inputTokens + call.outputTokens
    entry.agents.add(call.agentId)
    entry.models.add(call.model)
  }

  const totalCost = Object.values(byProject).reduce((s, p) => s + p.cost, 0)

  const projects = Object.values(byProject)
    .map((p) => ({
      id: p.id,
      label: p.label,
      calls: p.calls,
      cost: +p.cost.toFixed(2),
      tokens: p.tokens,
      pctOfTotal: totalCost > 0 ? +((p.cost / totalCost) * 100).toFixed(1) : 0,
      agents: [...p.agents],
      models: [...p.models].map((m) => modelName(m)),
    }))
    .sort((a, b) => b.cost - a.cost)

  return { projects, totalCost: +totalCost.toFixed(2) }
}

/**
 * Generate a CSV-ready export for a specific project's costs.
 */
export function generateProjectCostReport(callLog, projectId, dateRange) {
  const projectCalls = callLog.filter((c) => {
    if (c.project !== projectId) return false
    if (dateRange) {
      if (dateRange.start && c.date < dateRange.start) return false
      if (dateRange.end && c.date > dateRange.end) return false
    }
    return true
  })

  const headers = ['Date', 'Agent', 'Model', 'Task Type', 'Input Tokens', 'Output Tokens', 'Cost']
  const rows = projectCalls.map((c) => [
    c.date,
    c.agentId,
    modelName(c.model),
    c.taskTypeLabel,
    c.inputTokens,
    c.outputTokens,
    calculateCost({ input: c.inputTokens, output: c.outputTokens }, c.model).toFixed(4),
  ])

  const projectLabel = projectCalls[0]?.projectLabel || projectId
  const filename = `openclaw-project-${projectId}-costs.csv`

  return { headers, rows, filename, projectLabel, totalCalls: rows.length }
}

export function exportProjectCostCsv(callLog, projectId, dateRange) {
  const report = generateProjectCostReport(callLog, projectId, dateRange)
  exportCsv(report.filename, report.headers, report.rows)
}

// ─── Master Analysis Runner ────────────────────────────────────

/**
 * Run all analyses and return a unified result object.
 *
 * @param {Array} callLog - Array of call log entries
 * @param {number} monthlyBudget - Monthly budget in dollars
 * @returns {object} Complete analysis results
 */
export function runCostIntelligence(callLog, monthlyBudget = 100) {
  const expensiveSimple = analyzeExpensiveSimpleCalls(callLog)
  const taskTypes = analyzeTaskTypeSpend(callLog)
  const velocity = analyzeSpendVelocity(callLog, monthlyBudget)
  const projectCosts = analyzeProjectCosts(callLog)

  // Collect all recommendations
  const allRecommendations = [
    ...(velocity.recommendation ? [velocity.recommendation] : []),
    ...expensiveSimple,
    ...taskTypes.recommendations,
  ]

  // Sort: alerts first, then by impact descending
  allRecommendations.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'alert' ? -1 : 1
    return (b.impact || 0) - (a.impact || 0)
  })

  return {
    recommendations: allRecommendations,
    taskTypes: taskTypes.ranked,
    velocity,
    projectCosts,
    meta: {
      totalCalls: callLog.length,
      analyzedDays: new Set(callLog.map((c) => c.date)).size,
      generatedAt: new Date().toISOString(),
    },
  }
}

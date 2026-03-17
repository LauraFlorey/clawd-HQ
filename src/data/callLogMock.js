/**
 * Mock per-call API log data for cost intelligence analysis.
 *
 * In production, this comes from the gateway's call log:
 *   GET http://{host}:{port}/api/calls?period=30d
 *
 * Each entry represents one API call to an LLM provider.
 */

import { MODEL_PRICING, DEFAULT_PRICING } from '../utils/pricing'

function quickCost(inputTokens, outputTokens, modelId) {
  const p = MODEL_PRICING[modelId] || DEFAULT_PRICING
  return +((inputTokens / 1e6) * p.input + (outputTokens / 1e6) * p.output).toFixed(4)
}

const TASK_DESCRIPTIONS = {
  'code-generation': ['Generating React component', 'Writing utility function', 'Creating API endpoint', 'Implementing feature module', 'Refactoring class structure'],
  'research': ['Searching documentation', 'Analyzing API options', 'Reviewing library alternatives', 'Investigating error patterns', 'Comparing architectures'],
  'analysis': ['Analyzing codebase structure', 'Reviewing PR changes', 'Evaluating performance metrics', 'Assessing dependency graph', 'Auditing security patterns'],
  'formatting': ['Formatting JSON output', 'Prettifying markdown', 'Structuring CSV data', 'Reformatting config file'],
  'status-check': ['Checking system health', 'Verifying service status', 'Polling endpoint'],
  'file-read': ['Reading config file', 'Parsing log output', 'Loading template'],
  'simple-format': ['Quick text format', 'Normalizing whitespace', 'Trimming output'],
  'conversation': ['Answering question', 'Explaining concept', 'Discussing approach', 'Clarifying requirements'],
}

// ─── Seeded random for determinism ─────────────────────────────

function seeded(seed) {
  const x = Math.sin(seed * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function pick(arr, seed) {
  return arr[Math.floor(seeded(seed) * arr.length)]
}

// ─── Constants ─────────────────────────────────────────────────

const TASK_TYPES = [
  { id: 'code-generation', label: 'Code Generation', weight: 0.30 },
  { id: 'research', label: 'Research', weight: 0.22 },
  { id: 'analysis', label: 'Analysis', weight: 0.18 },
  { id: 'formatting', label: 'Formatting', weight: 0.08 },
  { id: 'status-check', label: 'Status Check', weight: 0.07 },
  { id: 'file-read', label: 'File Read', weight: 0.06 },
  { id: 'simple-format', label: 'Simple Format', weight: 0.05 },
  { id: 'conversation', label: 'Conversation', weight: 0.04 },
]

const PROJECTS = [
  { id: 'core-project', label: 'Core Project', weight: 0.35 },
  { id: 'dashboard', label: 'Dashboard', weight: 0.25 },
  { id: 'discord-bot', label: 'Discord Bot', weight: 0.20 },
  { id: 'personal', label: 'Personal', weight: 0.12 },
  { id: 'experiments', label: 'Experiments', weight: 0.08 },
]

const SIMPLE_TASK_TYPES = new Set([
  'status-check', 'file-read', 'simple-format', 'formatting', 'conversation',
])

const EXPENSIVE_MODELS = new Set([
  'claude-opus-4.5', 'gpt-4o', 'gemini-2.5-pro', 'grok-3', 'o3',
])

// ─── Machine call profiles ──────────────────────────────────────

const AGENT_PROFILES = {
  'jinx-macbook': {
    // Primary machine — some Opus on simple calls triggers recommendation
    models: [
      { id: 'claude-sonnet-4.5', pct: 0.55 },
      { id: 'claude-opus-4.5', pct: 0.25 },
      { id: 'claude-haiku-4.5', pct: 0.20 },
    ],
    callsPerDay: 110,
    simpleCallPct: 0.50,
    taskTypeSkew: 'code-generation',
    projectSkew: 'core-project',
  },
  'jinx-mini': {
    // Remote server — mostly Sonnet and Haiku
    models: [
      { id: 'claude-sonnet-4.5', pct: 0.70 },
      { id: 'claude-haiku-4.5', pct: 0.30 },
    ],
    callsPerDay: 65,
    simpleCallPct: 0.35,
    taskTypeSkew: 'research',
    projectSkew: 'core-project',
  },
}

// ─── Generator ─────────────────────────────────────────────────

function pickWeighted(items, seed) {
  const r = seeded(seed)
  let cumulative = 0
  for (const item of items) {
    cumulative += item.pct || item.weight
    if (r < cumulative) return item
  }
  return items[items.length - 1]
}

function generateCallsForAgent(agentId, daysBack = 30) {
  const profile = AGENT_PROFILES[agentId]
  if (!profile) return []

  const calls = []
  const endDate = new Date('2026-02-14T23:59:59Z')
  let callIdx = 0

  for (let d = daysBack - 1; d >= 0; d--) {
    const date = new Date(endDate)
    date.setDate(date.getDate() - d)
    const dow = date.getDay()
    const isWeekend = dow === 0 || dow === 6
    const dailyCalls = Math.round(
      profile.callsPerDay * (isWeekend ? 0.3 + seeded(d * 7 + 1) * 0.3 : 0.8 + seeded(d * 7 + 2) * 0.4)
    )

    for (let c = 0; c < dailyCalls; c++) {
      const seed = agentId.length * 1000 + d * 200 + c
      const model = pickWeighted(profile.models, seed)
      const isSimple = seeded(seed + 1) < profile.simpleCallPct
      const taskType = isSimple
        ? pickWeighted(TASK_TYPES.filter((t) => SIMPLE_TASK_TYPES.has(t.id)), seed + 2)
        : pickWeighted(TASK_TYPES.filter((t) => !SIMPLE_TASK_TYPES.has(t.id)), seed + 3)
      const project = pickWeighted(PROJECTS, seed + 4)

      // Token sizes: simple calls are small, complex ones vary
      let inputTokens, outputTokens
      if (isSimple) {
        inputTokens = Math.round(80 + seeded(seed + 5) * 400) // 80–480
        outputTokens = Math.round(30 + seeded(seed + 6) * 170) // 30–200
      } else {
        inputTokens = Math.round(800 + seeded(seed + 7) * 12000) // 800–12800
        outputTokens = Math.round(300 + seeded(seed + 8) * 4700) // 300–5000
      }

      // Hour of day — clustered in working hours
      const hour = Math.round(9 + seeded(seed + 9) * 10) % 24
      const minute = Math.round(seeded(seed + 10) * 59)
      const ts = new Date(date)
      ts.setHours(hour, minute, 0, 0)

      const machine = agentId.replace('jinx-', '')
      const descs = TASK_DESCRIPTIONS[taskType.id] || ['Processing request']
      const description = descs[Math.floor(seeded(seed + 11) * descs.length)]
      const costEstimate = quickCost(inputTokens, outputTokens, model.id)

      calls.push({
        id: `${agentId}-${callIdx++}`,
        agentId,
        timestamp: ts.toISOString(),
        date: date.toISOString().slice(0, 10),
        model: model.id,
        taskType: taskType.id,
        taskTypeLabel: taskType.label,
        project: project.id,
        projectLabel: project.label,
        inputTokens,
        outputTokens,
        tokens: { input: inputTokens, output: outputTokens, total: inputTokens + outputTokens },
        isSimple,
        isExpensiveModel: EXPENSIVE_MODELS.has(model.id),
        machine,
        source: 'gateway',
        description,
        costEstimate,
      })
    }
  }

  return calls
}

// ─── Public API ────────────────────────────────────────────────

let _callLogCache = null

export function getCallLog() {
  if (_callLogCache) return _callLogCache
  const all = []
  for (const agentId of Object.keys(AGENT_PROFILES)) {
    all.push(...generateCallsForAgent(agentId, 30))
  }
  all.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  _callLogCache = all
  return all
}

export function getCallLogForAgent(agentId) {
  return getCallLog().filter((c) => c.agentId === agentId)
}

export { TASK_TYPES, PROJECTS, SIMPLE_TASK_TYPES, EXPENSIVE_MODELS, AGENT_PROFILES }

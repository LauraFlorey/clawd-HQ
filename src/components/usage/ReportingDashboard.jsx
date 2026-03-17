import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, PieChart, Pie,
} from 'recharts'
import { BarChart3, Calendar } from 'lucide-react'
import clsx from 'clsx'
import { getCallLog, TASK_TYPES } from '../../data/callLogMock'
import { calculateCost, MODEL_PRICING } from '../../utils/pricing'
import { formatSpend, formatNumber, formatTokenCount } from '../../utils/formatters'
import MultiSelect from '../ui/MultiSelect'

const PRESETS = [
  { label: 'Today', days: 1 },
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

const MODEL_COLORS = [
  '#d97706', '#6366f1', '#22c55e', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f59e0b', '#ec4899', '#14b8a6', '#f97316',
]

const MACHINE_COLORS = { macbook: '#6366f1', mini: '#22c55e' }

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-surface-600 bg-surface-800 px-3.5 py-2.5 text-xs shadow-lg shadow-black/30">
      <p className="mb-1.5 font-medium text-gray-200">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-gray-400">{p.name || p.dataKey}</span>
          </span>
          <span className="font-medium text-gray-200">{formatSpend(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-lg border border-surface-600 bg-surface-800 px-3.5 py-2.5 text-xs shadow-lg shadow-black/30">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.payload.fill }} />
        <span className="font-medium text-gray-200">{d.name}</span>
        <span className="ml-auto text-gray-400">{formatSpend(d.value)}</span>
      </div>
    </div>
  )
}

function SummaryReport({ data }) {
  const totalCalls = data.length
  const totalInput = data.reduce((s, c) => s + c.inputTokens, 0)
  const totalOutput = data.reduce((s, c) => s + c.outputTokens, 0)
  const totalTokens = totalInput + totalOutput
  const totalCost = data.reduce((s, c) => s + calculateCost({ input: c.inputTokens, output: c.outputTokens }, c.model), 0)

  const stats = [
    { label: 'API Calls', value: formatNumber(totalCalls) },
    { label: 'Input Tokens', value: formatTokenCount(totalInput) },
    { label: 'Output Tokens', value: formatTokenCount(totalOutput) },
    { label: 'Total Tokens', value: formatTokenCount(totalTokens) },
    { label: 'Est. Cost', value: formatSpend(totalCost), accent: true },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-surface-700 bg-surface-900 px-4 py-3">
          <p className="text-[11px] text-gray-500">{s.label}</p>
          <p className={clsx('mt-1 text-lg font-semibold', s.accent ? 'text-accent' : 'text-gray-100')}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  )
}

function ByModelChart({ data }) {
  const byModel = {}
  for (const c of data) {
    if (!byModel[c.model]) byModel[c.model] = { model: c.model, cost: 0, calls: 0, tokens: 0 }
    const entry = byModel[c.model]
    entry.cost += calculateCost({ input: c.inputTokens, output: c.outputTokens }, c.model)
    entry.calls++
    entry.tokens += c.inputTokens + c.outputTokens
  }
  const sorted = Object.values(byModel).sort((a, b) => b.cost - a.cost)
  const chartData = sorted.map((m, i) => ({
    ...m,
    name: MODEL_PRICING[m.model]?.name || m.model,
    fill: MODEL_COLORS[i % MODEL_COLORS.length],
    cost: +m.cost.toFixed(2),
  }))

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <h3 className="mb-4 text-[13px] font-semibold text-gray-200">Cost by Model</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 80 }}>
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4b5563' }} tickFormatter={(v) => `$${v}`} />
            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} width={80} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="cost" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {chartData.map((d) => <Cell key={d.model} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-surface-700 text-[11px] text-gray-500">
              <th className="py-2 pr-3 font-medium">Model</th>
              <th className="py-2 pr-3 font-medium text-right">Calls</th>
              <th className="py-2 pr-3 font-medium text-right">Tokens</th>
              <th className="py-2 font-medium text-right">Cost</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((m) => (
              <tr key={m.model} className="border-t border-surface-700/50">
                <td className="py-1.5 pr-3 text-gray-300">{m.name}</td>
                <td className="py-1.5 pr-3 text-right text-gray-400">{formatNumber(m.calls)}</td>
                <td className="py-1.5 pr-3 text-right text-gray-400">{formatTokenCount(m.tokens)}</td>
                <td className="py-1.5 text-right font-medium text-gray-200">{formatSpend(m.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ByTaskChart({ data }) {
  const byTask = {}
  for (const c of data) {
    if (!byTask[c.taskType]) byTask[c.taskType] = { id: c.taskType, label: c.taskTypeLabel, cost: 0, calls: 0, tokens: 0 }
    const entry = byTask[c.taskType]
    entry.cost += calculateCost({ input: c.inputTokens, output: c.outputTokens }, c.model)
    entry.calls++
    entry.tokens += c.inputTokens + c.outputTokens
  }
  const sorted = Object.values(byTask).sort((a, b) => b.cost - a.cost)
  const chartData = sorted.map((t, i) => ({
    ...t,
    name: t.label,
    fill: MODEL_COLORS[i % MODEL_COLORS.length],
    cost: +t.cost.toFixed(2),
  }))

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <h3 className="mb-4 text-[13px] font-semibold text-gray-200">Cost by Task Type</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 100 }}>
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4b5563' }} tickFormatter={(v) => `$${v}`} />
            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} width={100} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="cost" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {chartData.map((d) => <Cell key={d.id} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-surface-700 text-[11px] text-gray-500">
              <th className="py-2 pr-3 font-medium">Task Type</th>
              <th className="py-2 pr-3 font-medium text-right">Calls</th>
              <th className="py-2 pr-3 font-medium text-right">Tokens</th>
              <th className="py-2 font-medium text-right">Cost</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((t) => (
              <tr key={t.id} className="border-t border-surface-700/50">
                <td className="py-1.5 pr-3 text-gray-300">{t.name}</td>
                <td className="py-1.5 pr-3 text-right text-gray-400">{formatNumber(t.calls)}</td>
                <td className="py-1.5 pr-3 text-right text-gray-400">{formatTokenCount(t.tokens)}</td>
                <td className="py-1.5 text-right font-medium text-gray-200">{formatSpend(t.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DailyTrendChart({ data }) {
  const byDate = {}
  for (const c of data) {
    if (!byDate[c.date]) byDate[c.date] = 0
    byDate[c.date] += calculateCost({ input: c.inputTokens, output: c.outputTokens }, c.model)
  }

  const sorted = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b))
  const daily = sorted.map(([date, cost]) => ({ date, cost: +cost.toFixed(2) }))

  // 7-day moving average
  const withMa = daily.map((d, i) => {
    const window = daily.slice(Math.max(0, i - 6), i + 1)
    const avg = window.reduce((s, w) => s + w.cost, 0) / window.length
    return { ...d, ma7: +avg.toFixed(2), label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
  })

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-gray-200">Daily Cost Trend</h3>
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Daily
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded bg-status-warning" />
            7d avg
          </span>
        </div>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={withMa} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} interval={Math.max(0, Math.floor(withMa.length / 8))} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4b5563' }} tickFormatter={(v) => `$${v}`} width={40} />
            <Tooltip content={<ChartTooltip />} />
            <Line type="monotone" dataKey="cost" name="Daily" stroke="#6366f1" strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: '#6366f1', stroke: '#0f1218', strokeWidth: 2 }} />
            <Line type="monotone" dataKey="ma7" name="7d Avg" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 2" dot={false} activeDot={{ r: 3, fill: '#f59e0b', stroke: '#0f1218', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ByMachineChart({ data }) {
  const byMachine = {}
  for (const c of data) {
    const m = c.machine || c.agentId.replace('jinx-', '')
    if (!byMachine[m]) byMachine[m] = 0
    byMachine[m] += calculateCost({ input: c.inputTokens, output: c.outputTokens }, c.model)
  }

  const pieData = [
    { name: 'MacBook', value: +(byMachine.macbook || 0).toFixed(2), fill: MACHINE_COLORS.macbook },
    { name: 'Mac Mini', value: +(byMachine.mini || 0).toFixed(2), fill: MACHINE_COLORS.mini },
  ].filter((d) => d.value > 0)

  const total = pieData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <h3 className="mb-4 text-[13px] font-semibold text-gray-200">Cost by Machine</h3>
      <div className="flex items-center gap-6">
        <div className="h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((d) => <Cell key={d.name} fill={d.fill} />)}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {pieData.map((d) => (
            <div key={d.name} className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.fill }} />
              <div>
                <p className="text-xs font-medium text-gray-200">{d.name}</p>
                <p className="text-[11px] text-gray-500">
                  {formatSpend(d.value)} ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
                </p>
              </div>
            </div>
          ))}
          <div className="border-t border-surface-700 pt-2">
            <p className="text-[11px] text-gray-500">Total: <span className="font-medium text-gray-300">{formatSpend(total)}</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ReportingDashboard() {
  const [days, setDays] = useState(30)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [selectedModels, setSelectedModels] = useState([])
  const [selectedTasks, setSelectedTasks] = useState([])

  const callLog = useMemo(() => getCallLog(), [])

  const filtered = useMemo(() => {
    let result = callLog

    if (customStart || customEnd) {
      result = result.filter((c) => {
        if (customStart && c.date < customStart) return false
        if (customEnd && c.date > customEnd) return false
        return true
      })
    } else {
      const cutoff = new Date('2026-02-14')
      cutoff.setDate(cutoff.getDate() - days + 1)
      const cutoffStr = cutoff.toISOString().slice(0, 10)
      result = result.filter((c) => c.date >= cutoffStr)
    }

    if (selectedModels.length > 0) {
      result = result.filter((c) => selectedModels.includes(c.model))
    }
    if (selectedTasks.length > 0) {
      result = result.filter((c) => selectedTasks.includes(c.taskType))
    }

    return result
  }, [callLog, days, customStart, customEnd, selectedModels, selectedTasks])

  const modelOptions = useMemo(() => {
    const models = new Set(callLog.map((c) => c.model))
    return [...models].map((m) => ({ value: m, label: MODEL_PRICING[m]?.name || m }))
  }, [callLog])

  const taskOptions = useMemo(() => {
    const tasks = new Set(callLog.map((c) => c.taskType))
    return [...tasks].map((t) => {
      const tt = TASK_TYPES.find((x) => x.id === t)
      return { value: t, label: tt?.label || t }
    })
  }, [callLog])

  function handlePreset(d) {
    setDays(d)
    setCustomStart('')
    setCustomEnd('')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="h-4 w-4 text-gray-500" />
        <h2 className="text-[14px] font-semibold text-gray-200">Reporting</h2>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-surface-700 bg-surface-900 px-4 py-3">
        {/* Date presets */}
        <div className="flex items-center gap-1 rounded-lg bg-surface-800 p-0.5">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              onClick={() => handlePreset(p.days)}
              className={clsx(
                'rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors',
                days === p.days && !customStart && !customEnd
                  ? 'bg-surface-600 text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-gray-500" />
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="rounded border border-surface-600 bg-surface-800 px-2 py-1 text-[11px] text-gray-400 outline-none focus:border-accent [color-scheme:dark]"
          />
          <span className="text-[11px] text-gray-600">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="rounded border border-surface-600 bg-surface-800 px-2 py-1 text-[11px] text-gray-400 outline-none focus:border-accent [color-scheme:dark]"
          />
        </div>

        <div className="h-5 w-px bg-surface-700" />

        <MultiSelect
          options={modelOptions}
          selected={selectedModels}
          onChange={setSelectedModels}
          placeholder="All Models"
        />
        <MultiSelect
          options={taskOptions}
          selected={selectedTasks}
          onChange={setSelectedTasks}
          placeholder="All Tasks"
        />

        <span className="ml-auto text-[11px] text-gray-600">
          {formatNumber(filtered.length)} calls
        </span>
      </div>

      {/* Summary */}
      <SummaryReport data={filtered} />

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ByModelChart data={filtered} />
        <ByTaskChart data={filtered} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <DailyTrendChart data={filtered} />
        <ByMachineChart data={filtered} />
      </div>
    </div>
  )
}

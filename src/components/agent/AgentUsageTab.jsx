import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { useState } from 'react'
import { formatTokenCount, formatSpend } from '../../utils/formatters'
import { agentUsageHistory, machineUsageHistory } from '../../data/agentDetailMock'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const data = payload[0]?.payload
  if (!data) return null

  return (
    <div className="rounded-lg border border-surface-600 bg-surface-800 px-3.5 py-2.5 text-xs shadow-xl shadow-black/40">
      <p className="mb-1.5 font-medium text-gray-200">{data.label || label}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Input
          </span>
          <span className="font-medium text-gray-300">{formatTokenCount(data.inputTokens)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-machine-macbook" />
            Output
          </span>
          <span className="font-medium text-gray-300">{formatTokenCount(data.outputTokens)}</span>
        </div>
        <div className="mt-1 border-t border-surface-700 pt-1 flex items-center justify-between gap-4">
          <span className="text-gray-500">Cost</span>
          <span className="font-medium text-gray-200">{formatSpend(data.cost)}</span>
        </div>
      </div>
    </div>
  )
}

function CustomLegend() {
  return (
    <div className="flex items-center justify-end gap-4 text-[11px] text-gray-500">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-accent" />
        Input tokens
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-machine-macbook" />
        Output tokens
      </span>
    </div>
  )
}

export default function AgentUsageTab({ agentId }) {
  const [machineFilter, setMachineFilter] = useState('all')

  const allData = agentUsageHistory[agentId] || []
  const macbookData = machineUsageHistory?.macbook || []
  const miniData = machineUsageHistory?.mini || []

  const data = machineFilter === 'macbook' ? macbookData
    : machineFilter === 'mini' ? miniData
    : allData

  const tickFormatter = (value, index) => {
    if (index % 5 === 0 || index === data.length - 1) return value
    return ''
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h4 className="text-[13px] font-semibold text-gray-200">Daily Token Usage (30 days)</h4>
          <div className="flex items-center gap-1 rounded-lg bg-surface-800 p-0.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'macbook', label: 'MacBook' },
              { id: 'mini', label: 'Mac Mini' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setMachineFilter(opt.id)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${machineFilter === opt.id ? 'bg-surface-600 text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <CustomLegend />
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="inputGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="outputGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4b5563' }} tickFormatter={tickFormatter} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4b5563' }} tickFormatter={(v) => formatTokenCount(v)} width={48} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="outputTokens" stroke="#3b82f6" strokeWidth={1.5} fill="url(#outputGrad)" dot={false} activeDot={{ r: 3, fill: '#3b82f6', stroke: '#0f1218', strokeWidth: 2 }} />
            <Area type="monotone" dataKey="inputTokens" stroke="#6366f1" strokeWidth={1.5} fill="url(#inputGrad)" dot={false} activeDot={{ r: 3, fill: '#6366f1', stroke: '#0f1218', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-6 rounded-lg bg-surface-800/50 px-4 py-3 text-xs">
        <div>
          <span className="text-gray-500">30-day total: </span>
          <span className="font-medium text-gray-200">{formatSpend(data.reduce((s, d) => s + d.cost, 0))}</span>
        </div>
        <div>
          <span className="text-gray-500">Avg/day: </span>
          <span className="font-medium text-gray-200">{formatSpend(data.reduce((s, d) => s + d.cost, 0) / (data.length || 1))}</span>
        </div>
        <div>
          <span className="text-gray-500">Total tokens: </span>
          <span className="font-medium text-gray-200">{formatTokenCount(data.reduce((s, d) => s + d.inputTokens + d.outputTokens, 0))}</span>
        </div>
      </div>
    </div>
  )
}

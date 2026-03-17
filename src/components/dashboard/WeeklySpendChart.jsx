import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useData } from '../../context/DataProvider'
import { formatSpend } from '../../utils/formatters'
import { LoadingCard } from '../LoadingState'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  return (
    <div className="rounded-lg border border-surface-600 bg-surface-800 px-3.5 py-2.5 text-xs shadow-lg shadow-black/30">
      <p className="font-medium text-gray-200 mb-1.5">{label}</p>
      <div className="space-y-0.5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-400">Total</span>
          <span className="font-medium text-gray-200">{formatSpend(row.total)}</span>
        </div>
        {row.macbook != null && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-machine-macbook" />
              <span className="text-gray-400">MacBook</span>
            </span>
            <span className="text-gray-300">{formatSpend(row.macbook)}</span>
          </div>
        )}
        {row.mini != null && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-machine-mini" />
              <span className="text-gray-400">Mac Mini</span>
            </span>
            <span className="text-gray-300">{formatSpend(row.mini)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function WeeklySpendChart() {
  const { tokenUsage, usageLoading } = useData()

  if (usageLoading) return <LoadingCard height="h-64" />

  // Use the agent daily data for per-agent stacking
  const agentData = tokenUsage.getAgentData?.(7) || []
  const providerData = tokenUsage.daily.slice(-7)

  // Merge: per-machine spend from machineData, total from providerData
  const data = providerData.map((pRow, i) => {
    const mRow = agentData[i] || {}
    return {
      ...pRow,
      macbook: mRow.macbook || 0,
      mini: mRow.mini || 0,
    }
  })

  const weekTotal = data.reduce((s, d) => s + d.total, 0)

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-gray-200">This Week</h3>
        <span className="text-sm font-semibold text-gray-100">{formatSpend(weekTotal)}</span>
      </div>
      <div className="mb-2 flex items-center justify-end gap-4 text-[10px] text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-machine-macbook" />
          MacBook
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-machine-mini" />
          Mac Mini
        </span>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="macbookGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4b5563' }} tickFormatter={(v) => `$${v}`} width={40} domain={['dataMin - 2', 'dataMax + 2']} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="mini" stackId="machines" stroke="#22c55e" strokeWidth={1.5} fill="url(#miniGrad)" dot={false} activeDot={{ r: 3, fill: '#22c55e', stroke: '#0f1218', strokeWidth: 2 }} />
            <Area type="monotone" dataKey="macbook" stackId="machines" stroke="#6366f1" strokeWidth={1.5} fill="url(#macbookGrad)" dot={false} activeDot={{ r: 3, fill: '#6366f1', stroke: '#0f1218', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

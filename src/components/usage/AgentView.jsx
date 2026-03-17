import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import { useData } from '../../context/DataProvider'
import { formatSpend, formatTokenCount } from '../../utils/formatters'

const MACHINE_NAME_MAP = { macbook: 'MacBook', mini: 'Mac Mini' }

function ChartTooltip({ active, payload, label, agentIds, agentColors }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  return (
    <div className="rounded-lg border border-surface-600 bg-surface-800 px-3.5 py-2.5 text-xs shadow-xl shadow-black/40">
      <p className="mb-1.5 font-medium text-gray-200">{row.label || label}</p>
      <div className="space-y-0.5">
        {agentIds.filter((a) => (row[a] || 0) > 0).map((a) => (
          <div key={a} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: agentColors[a] }} />
              <span className="text-gray-400">{MACHINE_NAME_MAP[a] || a}</span>
            </span>
            <span className="font-medium text-gray-200">{formatSpend(row[a])}</span>
          </div>
        ))}
        <div className="mt-1 border-t border-surface-700 pt-1 flex justify-between gap-4">
          <span className="text-gray-500">Total</span>
          <span className="font-semibold text-gray-100">{formatSpend(row.total)}</span>
        </div>
      </div>
    </div>
  )
}

export default function AgentView({ days }) {
  const { tokenUsage } = useData()
  const { agentIds, agentColors, getAgentData, getAgentBreakdown } = tokenUsage

  const data = useMemo(() => getAgentData(days), [getAgentData, days])
  const breakdown = useMemo(() => getAgentBreakdown(days), [getAgentBreakdown, days])
  const [expanded, setExpanded] = useState(null)

  const tickInterval = days <= 7 ? 0 : days <= 30 ? 4 : 13

  return (
    <div className="space-y-4">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4b5563' }} interval={tickInterval} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4b5563' }} tickFormatter={(v) => `$${v}`} width={44} />
            <Tooltip content={<ChartTooltip agentIds={agentIds} agentColors={agentColors} />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            {agentIds.map((a, i) => (
              <Bar key={a} dataKey={a} stackId="spend" fill={agentColors[a]} radius={i === agentIds.length - 1 ? [3, 3, 0, 0] : undefined} maxBarSize={days <= 7 ? 40 : days <= 30 ? 16 : 8} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-surface-700 bg-surface-900 overflow-x-auto">
        <table className="w-full min-w-[520px]">
          <thead>
            <tr className="border-b border-surface-700 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-600">
              <th className="px-4 py-2.5">Machine</th>
              <th className="px-4 py-2.5 hidden sm:table-cell">Machine</th>
              <th className="px-4 py-2.5 hidden md:table-cell">Model</th>
              <th className="px-4 py-2.5 text-right">Tokens</th>
              <th className="px-4 py-2.5 text-right">Cost</th>
              <th className="px-4 py-2.5 text-right">% Total</th>
              <th className="w-10 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {breakdown.map((row) => (
              <AgentRow key={row.id} row={row} isExpanded={expanded === row.id} onToggle={() => setExpanded(expanded === row.id ? null : row.id)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AgentRow({ row, isExpanded, onToggle }) {
  const recentDaily = row.daily.slice(-7)
  return (
    <>
      <tr className="border-b border-surface-800/50 transition-colors hover:bg-surface-800/30 cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: row.color }} />
            <span className="text-[13px] font-medium text-gray-200">{row.name}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">{row.machine}</td>
        <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">{row.model}</td>
        <td className="px-4 py-3 text-right text-xs text-gray-400">{formatTokenCount(row.totalTokens)}</td>
        <td className="px-4 py-3 text-right text-xs font-medium text-gray-200">{formatSpend(row.totalCost)}</td>
        <td className="px-4 py-3 text-right text-xs text-gray-400">{row.pctOfTotal}%</td>
        <td className="px-2 py-3 text-center">
          <ChevronDown className={clsx('h-3.5 w-3.5 text-gray-600 transition-transform', isExpanded && 'rotate-180')} />
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} className="bg-surface-800/20 px-4 py-2">
            <div className="space-y-1.5 pl-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-1">Recent daily breakdown</p>
              {recentDaily.map((d) => (
                <div key={d.date} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 w-24">{d.label}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500">{formatTokenCount(d.tokens)}</span>
                    <span className="w-16 text-right font-medium text-gray-300">{formatSpend(d.cost)}</span>
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { ChevronDown, ArrowUpDown } from 'lucide-react'
import clsx from 'clsx'
import { useData } from '../../context/DataProvider'
import { formatSpend, formatTokenCount } from '../../utils/formatters'

function ChartTooltip({ active, payload, label, providerIds, providerLabels, providerColors }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  return (
    <div className="rounded-lg border border-surface-600 bg-surface-800 px-3.5 py-2.5 text-xs shadow-xl shadow-black/40">
      <p className="mb-1.5 font-medium text-gray-200">{row.label || label}</p>
      <div className="space-y-0.5">
        {providerIds.filter((p) => (row[p] || 0) > 0).map((p) => (
          <div key={p} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: providerColors[p] }} />
              <span className="text-gray-400">{providerLabels[p]}</span>
            </span>
            <span className="font-medium text-gray-200">{formatSpend(row[p])}</span>
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

export default function ProviderView({ days }) {
  const { tokenUsage } = useData()
  const { providerIds, providerLabels, providerColors, getProviderData, getProviderBreakdown } = tokenUsage

  const data = useMemo(() => getProviderData(days), [getProviderData, days])
  const breakdown = useMemo(() => getProviderBreakdown(days), [getProviderBreakdown, days])
  const [sortField, setSortField] = useState('totalCost')
  const [expanded, setExpanded] = useState(null)

  const sorted = useMemo(() => {
    return [...breakdown].sort((a, b) => b[sortField] - a[sortField])
  }, [breakdown, sortField])

  const tickInterval = days <= 7 ? 0 : days <= 30 ? 4 : 13

  return (
    <div className="space-y-4">
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4b5563' }} interval={tickInterval} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4b5563' }} tickFormatter={(v) => `$${v}`} width={44} />
            <Tooltip content={<ChartTooltip providerIds={providerIds} providerLabels={providerLabels} providerColors={providerColors} />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            {providerIds.map((p, i) => (
              <Bar
                key={p}
                dataKey={p}
                stackId="spend"
                fill={providerColors[p]}
                radius={i === providerIds.length - 1 ? [3, 3, 0, 0] : undefined}
                maxBarSize={days <= 7 ? 40 : days <= 30 ? 16 : 8}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border border-surface-700 bg-surface-900 overflow-x-auto">
        <table className="w-full min-w-[520px]">
          <thead>
            <tr className="border-b border-surface-700 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-600">
              <th className="px-4 py-2.5">Provider</th>
              <SortHeader field="totalTokens" current={sortField} onSort={setSortField} align="right">Tokens</SortHeader>
              <SortHeader field="totalCost" current={sortField} onSort={setSortField} align="right">Cost</SortHeader>
              <SortHeader field="pctOfTotal" current={sortField} onSort={setSortField} align="right">% Total</SortHeader>
              <SortHeader field="avgPerDay" current={sortField} onSort={setSortField} align="right">Avg/Day</SortHeader>
              <th className="w-10 px-2 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <ProviderRow key={row.id} row={row} isExpanded={expanded === row.id} onToggle={() => setExpanded(expanded === row.id ? null : row.id)} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SortHeader({ field, current, onSort, align, children }) {
  const isActive = field === current
  return (
    <th className={clsx('cursor-pointer select-none px-4 py-2.5', align === 'right' && 'text-right')} onClick={() => onSort(field)}>
      <span className={clsx('inline-flex items-center gap-1', isActive && 'text-gray-400')}>{children}<ArrowUpDown className="h-2.5 w-2.5" /></span>
    </th>
  )
}

function ProviderRow({ row, isExpanded, onToggle }) {
  return (
    <>
      <tr className="border-b border-surface-800/50 transition-colors hover:bg-surface-800/30 cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: row.color }} />
            <span className="text-[13px] font-medium text-gray-200">{row.name}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-right text-xs text-gray-400">{formatTokenCount(row.totalTokens)}</td>
        <td className="px-4 py-3 text-right text-xs font-medium text-gray-200">{formatSpend(row.totalCost)}</td>
        <td className="px-4 py-3 text-right text-xs text-gray-400">{row.pctOfTotal}%</td>
        <td className="px-4 py-3 text-right text-xs text-gray-500">{formatSpend(row.avgPerDay)}</td>
        <td className="px-2 py-3 text-center">
          <ChevronDown className={clsx('h-3.5 w-3.5 text-gray-600 transition-transform', isExpanded && 'rotate-180')} />
        </td>
      </tr>
      {isExpanded && row.models.length > 0 && (
        <tr>
          <td colSpan={6} className="bg-surface-800/20 px-4 py-2">
            <div className="space-y-1.5 pl-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mb-1">Model breakdown</p>
              {row.models.map((m) => (
                <div key={m.name} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">{m.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500">{formatTokenCount(m.tokens)}</span>
                    <span className="w-16 text-right font-medium text-gray-300">{formatSpend(m.cost)}</span>
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

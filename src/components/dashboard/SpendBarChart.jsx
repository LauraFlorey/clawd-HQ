import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useData } from '../../context/DataProvider'
import { formatSpend } from '../../utils/formatters'
import { LoadingCard } from '../LoadingState'

// Per-machine share of each provider's spend (mock approximation)
const MACHINE_PROVIDER_SHARE = {
  macbook: { anthropic: 0.58, openai: 0.55, google: 0.50, xai: 0.60, openrouter: 0.65 },
  mini:    { anthropic: 0.42, openai: 0.45, google: 0.50, xai: 0.40, openrouter: 0.35 },
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { provider, providerId, spend, fill } = payload[0].payload
  const macbookShare = MACHINE_PROVIDER_SHARE.macbook[providerId] || 0.6
  const miniShare = MACHINE_PROVIDER_SHARE.mini[providerId] || 0.4
  return (
    <div className="rounded-lg border border-surface-600 bg-surface-800 px-3.5 py-2.5 text-xs shadow-lg shadow-black/30">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: fill }} />
        <span className="font-medium text-gray-200">{provider}</span>
        <span className="text-gray-500 ml-auto">{formatSpend(spend)}</span>
      </div>
      <div className="space-y-0.5 border-t border-surface-700 pt-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-machine-macbook" />
            <span className="text-gray-400">MacBook</span>
          </span>
          <span className="font-medium text-gray-300">{formatSpend(spend * macbookShare)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-machine-mini" />
            <span className="text-gray-400">Mac Mini</span>
          </span>
          <span className="font-medium text-gray-300">{formatSpend(spend * miniShare)}</span>
        </div>
      </div>
    </div>
  )
}

export default function SpendBarChart() {
  const { tokenUsage, usageLoading } = useData()

  if (usageLoading) return <LoadingCard height="h-64" />

  // Build today's provider spend from the last day of data
  const lastDay = tokenUsage.daily[tokenUsage.daily.length - 1] || {}
  const providerIds = tokenUsage.providerIds || []
  const data = providerIds
    .map((p) => ({
      providerId: p,
      provider: tokenUsage.providerLabels[p] || p,
      spend: lastDay[p] || 0,
      fill: tokenUsage.providerColors[p] || '#6b7280',
    }))
    .filter((d) => d.spend > 0)

  const total = data.reduce((s, d) => s + d.spend, 0)

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-gray-200">Today's Spend</h3>
        <span className="text-sm font-semibold text-gray-100">{formatSpend(total)}</span>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: -12 }} barCategoryGap="20%">
            <XAxis dataKey="provider" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} interval={0} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4b5563' }} tickFormatter={(v) => `$${v}`} width={40} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="spend" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {data.map((entry) => <Cell key={entry.provider} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

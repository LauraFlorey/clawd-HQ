import { ExternalLink, Info, FlaskConical, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import { useData } from '../../context/DataProvider'
import { formatSpend } from '../../utils/formatters'
import { LoadingCard } from '../LoadingState'

export default function CursorUsageCard() {
  const { cursorUsage, cursorLoading, cursorStale, demoSources } = useData()
  const isCursorDemo = demoSources?.cursor

  if (cursorLoading || !cursorUsage) return <LoadingCard height="h-48" />

  const { premiumRequests, modelBreakdown, billingCycle, plan, monthlyFee, lastUpdated } = cursorUsage
  const pct = (premiumRequests.used / premiumRequests.limit) * 100
  const remaining = premiumRequests.limit - premiumRequests.used

  const barColor =
    pct > 90 ? 'bg-status-offline' :
    pct > 70 ? 'bg-status-warning' :
    'bg-provider-cursor'

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900">
      <div className="flex items-center justify-between border-b border-surface-700 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-provider-cursor" />
          <h3 className="text-[13px] font-semibold text-gray-200">Cursor IDE Usage</h3>
          <span className="rounded-full bg-surface-700 px-2 py-0.5 text-[10px] font-medium text-gray-400">{plan}</span>
        </div>
        <a href="https://cursor.com/dashboard" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-gray-500 transition-colors hover:text-gray-300">
          <ExternalLink className="h-3 w-3" />cursor.com
        </a>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-gray-400">Premium Requests</span>
                <span className="text-xs font-medium text-gray-200">{premiumRequests.used}<span className="text-gray-500"> / {premiumRequests.limit}</span></span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-surface-700">
                <div className={clsx('h-full rounded-full transition-all', barColor)} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                <span className="text-gray-600">{pct.toFixed(0)}% used</span>
                <span className="text-gray-600">{remaining} remaining</span>
              </div>
            </div>
            <div className="space-y-2 rounded-lg bg-surface-800/50 p-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Monthly fee</span>
                <span className="font-medium text-gray-300">{formatSpend(monthlyFee)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Billing cycle</span>
                <span className="text-gray-400">{billingCycle.start} → {billingCycle.end}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Avg requests/day</span>
                <span className="text-gray-300">{Math.round(premiumRequests.used / 14)}/day</span>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">Requests by model</p>
            <div className="space-y-2">
              {modelBreakdown.map((m) => (
                <div key={m.model} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300">{m.model}</span>
                    <span className="text-gray-500">{m.requests} ({m.pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface-700">
                    <div className="h-full rounded-full bg-provider-cursor/60" style={{ width: `${m.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-4 space-y-1.5">
          {isCursorDemo && (
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
              <FlaskConical className="h-3 w-3 shrink-0" />
              Demo data — update in Settings → Cursor Integration
            </div>
          )}
          {cursorStale && !isCursorDemo && (
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              Data is stale (&gt;24h) — refresh in Settings → Cursor Integration
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
            <Info className="h-3 w-3 shrink-0" />
            Data from cursor.com/dashboard · Last updated {lastUpdated}
          </div>
        </div>
      </div>
    </div>
  )
}

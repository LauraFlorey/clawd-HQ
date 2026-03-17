import { useState } from 'react'
import { Download, Lightbulb } from 'lucide-react'
import clsx from 'clsx'
import { useData } from '../context/DataProvider'
import { useSettings } from '../hooks/useSettings'
import { exportProviderCsv, exportAgentCsv } from '../utils/exportCsv'
import SummaryCards from '../components/usage/SummaryCards'
import ProviderView from '../components/usage/ProviderView'
import AgentView from '../components/usage/AgentView'
import CursorUsageCard from '../components/usage/CursorUsageCard'
import InsightsView from '../components/usage/InsightsView'
import PricingConfig from '../components/usage/PricingConfig'
import ReportingDashboard from '../components/usage/ReportingDashboard'
import CostOptimization from '../components/usage/CostOptimization'
import SpendBarChart from '../components/dashboard/SpendBarChart'
import WeeklySpendChart from '../components/dashboard/WeeklySpendChart'
import SystemStatusCard from '../components/dashboard/SystemStatusCard'
import { LoadingCard } from '../components/LoadingState'

const TIME_PERIODS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
]

const VIEWS = [
  { id: 'provider', label: 'By Provider' },
  { id: 'agent', label: 'By Machine' },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
]

export default function TokenUsagePage() {
  const [activeView, setActiveView] = useState('provider')
  const [days, setDays] = useState(30)
  const { tokenUsage, usageLoading } = useData()
  const { settings } = useSettings()
  const monthlyBudget = settings.budget?.monthlyBudget ?? 100

  function handleExport() {
    if (activeView === 'provider') {
      exportProviderCsv(tokenUsage.getProviderBreakdown(days), days)
    } else if (activeView === 'agent') {
      exportAgentCsv(tokenUsage.getAgentBreakdown(days), days)
    }
  }

  if (usageLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <LoadingCard height="h-28" /><LoadingCard height="h-28" /><LoadingCard height="h-28" /><LoadingCard height="h-28" />
        </div>
        <LoadingCard height="h-96" />
      </div>
    )
  }

  const summary = tokenUsage.summary
  const isInsights = activeView === 'insights'

  return (
    <div className="space-y-6">
      {/* Summary cards: this month, projected, top agent, top model */}
      {summary && <SummaryCards summary={summary} />}

      {/* Pricing config (collapsible) */}
      <PricingConfig />

      {/* Today's spend + weekly trend + system status */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <SpendBarChart />
        <WeeklySpendChart />
        <SystemStatusCard />
      </div>

      {/* Reporting dashboard with filters and charts */}
      <ReportingDashboard />

      {/* Detailed breakdown panel */}
      <div className="rounded-xl border border-surface-700 bg-surface-900">
        {/* Controls bar */}
        <div className="flex flex-col gap-3 border-b border-surface-700 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5">
          {/* View tabs */}
          <div className="flex items-center gap-1 rounded-lg bg-surface-800 p-0.5">
            {VIEWS.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                aria-pressed={activeView === view.id}
                className={clsx(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
                  activeView === view.id
                    ? 'bg-surface-600 text-gray-100 shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {view.icon && <view.icon className="h-3.5 w-3.5" />}
                {view.label}
              </button>
            ))}
          </div>

          {/* Time period + export (hidden on Insights tab) */}
          {!isInsights && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1 rounded-lg bg-surface-800 p-0.5">
                {TIME_PERIODS.map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setDays(period.value)}
                    aria-pressed={days === period.value}
                    className={clsx(
                      'rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
                      days === period.value
                        ? 'bg-surface-600 text-gray-100 shadow-sm'
                        : 'text-gray-500 hover:text-gray-300'
                    )}
                  >
                    {period.label}
                  </button>
                ))}
              </div>

              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 rounded-lg border border-surface-600 bg-surface-800 px-3 py-1.5 text-[12px] font-medium text-gray-400 transition-colors hover:border-surface-500 hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          )}
        </div>

        {/* Content with view transition */}
        <div className="p-4 sm:p-5 view-transition" key={activeView}>
          {activeView === 'provider' && <ProviderView days={days} />}
          {activeView === 'agent' && <AgentView days={days} />}
          {activeView === 'insights' && <InsightsView monthlyBudget={monthlyBudget} />}
        </div>
      </div>

      {/* Cost optimization suggestions */}
      <CostOptimization />

      {/* Cursor usage card */}
      {!isInsights && <CursorUsageCard />}
    </div>
  )
}

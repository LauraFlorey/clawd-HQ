import { useMemo } from 'react'
import { Lightbulb, TrendingDown, AlertTriangle, Database, DollarSign } from 'lucide-react'
import clsx from 'clsx'
import { getCallLog } from '../../data/callLogMock'
import { analyzeExpensiveSimpleCalls, analyzeTaskTypeSpend } from '../../utils/costIntelligence'
import { calculateCost } from '../../utils/pricing'
import { formatSpend } from '../../utils/formatters'

function analyzeCachingOpportunities(callLog) {
  const byTaskByDay = {}
  for (const call of callLog) {
    const key = `${call.taskType}:${call.date}`
    if (!byTaskByDay[key]) byTaskByDay[key] = { taskType: call.taskType, label: call.taskTypeLabel, date: call.date, count: 0, cost: 0 }
    byTaskByDay[key].count++
    byTaskByDay[key].cost += calculateCost({ input: call.inputTokens, output: call.outputTokens }, call.model)
  }

  const candidates = {}
  for (const entry of Object.values(byTaskByDay)) {
    if (entry.count > 10) {
      if (!candidates[entry.taskType]) {
        candidates[entry.taskType] = { taskType: entry.taskType, label: entry.label, daysTriggered: 0, totalCost: 0, totalCalls: 0 }
      }
      candidates[entry.taskType].daysTriggered++
      candidates[entry.taskType].totalCost += entry.cost
      candidates[entry.taskType].totalCalls += entry.count
    }
  }

  return Object.values(candidates)
    .filter((c) => c.daysTriggered >= 3)
    .map((c) => ({
      id: `cache-${c.taskType}`,
      type: 'caching',
      label: c.label,
      daysTriggered: c.daysTriggered,
      totalCost: +c.totalCost.toFixed(2),
      estimatedSavings: +(c.totalCost * 0.3).toFixed(2),
      monthlySavings: +(c.totalCost * 0.3).toFixed(2),
    }))
    .sort((a, b) => b.estimatedSavings - a.estimatedSavings)
}

function SuggestionCard({ icon: Icon, iconColor, bgColor, borderColor, title, description, savings }) {
  return (
    <div className={clsx('rounded-xl border p-4', borderColor, bgColor)}>
      <div className="flex items-start gap-3">
        <div className={clsx('mt-0.5 shrink-0 rounded-lg p-2', bgColor)}>
          <Icon className={clsx('h-4 w-4', iconColor)} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-[13px] font-semibold text-gray-200">{title}</h4>
          <p className="mt-1 text-xs leading-relaxed text-gray-400">{description}</p>
          {savings > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface-700/50 px-2.5 py-1 text-[11px] font-medium">
              <DollarSign className="h-3 w-3 text-status-online" />
              <span className="text-gray-300">Est. monthly savings: {formatSpend(savings)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CostOptimization() {
  const callLog = useMemo(() => getCallLog(), [])

  const downgrades = useMemo(() => analyzeExpensiveSimpleCalls(callLog), [callLog])
  const { recommendations: spendAlerts } = useMemo(() => analyzeTaskTypeSpend(callLog), [callLog])
  const cachingOps = useMemo(() => analyzeCachingOpportunities(callLog), [callLog])

  const hasAnything = downgrades.length > 0 || spendAlerts.length > 0 || cachingOps.length > 0

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-4 w-4 text-accent" />
        <h2 className="text-[14px] font-semibold text-gray-200">Cost Optimization</h2>
      </div>

      {!hasAnything && (
        <div className="py-6 text-center">
          <p className="text-sm text-gray-500">No optimization opportunities detected right now.</p>
          <p className="mt-1 text-[11px] text-gray-600">Your usage patterns look efficient.</p>
        </div>
      )}

      <div className="space-y-3">
        {downgrades.map((rec) => (
          <SuggestionCard
            key={rec.id}
            icon={TrendingDown}
            iconColor="text-status-online"
            bgColor="bg-status-online/5"
            borderColor="border-status-online/20"
            title="Model Downgrade Opportunity"
            description={rec.description}
            savings={rec.impact}
          />
        ))}

        {spendAlerts.map((rec) => (
          <SuggestionCard
            key={rec.id}
            icon={AlertTriangle}
            iconColor="text-status-warning"
            bgColor="bg-status-warning/5"
            borderColor="border-status-warning/20"
            title={rec.title}
            description={rec.description}
            savings={rec.impact}
          />
        ))}

        {cachingOps.map((op) => (
          <SuggestionCard
            key={op.id}
            icon={Database}
            iconColor="text-accent"
            bgColor="bg-accent/5"
            borderColor="border-accent/20"
            title="Caching Opportunity"
            description={`"${op.label}" had >10 calls/day on ${op.daysTriggered} days with similar inputs. Caching responses could save ~30% of this task type's cost.`}
            savings={op.monthlySavings}
          />
        ))}
      </div>
    </div>
  )
}

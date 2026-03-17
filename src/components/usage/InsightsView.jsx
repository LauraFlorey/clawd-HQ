import { useState, useMemo } from 'react'
import {
  Lightbulb,
  AlertTriangle,
  X,
  TrendingUp,
  DollarSign,
  FolderOpen,
  BarChart3,
  Download,
  ChevronDown,
} from 'lucide-react'
import clsx from 'clsx'
import { getCallLog } from '../../data/callLogMock'
import { runCostIntelligence, exportProjectCostCsv } from '../../utils/costIntelligence'
import { formatSpend, formatTokenCount, formatNumber } from '../../utils/formatters'

// ─── Budget Progress Bar ───────────────────────────────────────

function BudgetBar({ velocity, budget }) {
  const { spentSoFar, projected, daysLeft, dailyBudgetRemaining, severity } = velocity
  const pctSpent = Math.min((spentSoFar / budget) * 100, 100)
  const pctProjected = Math.min((projected / budget) * 100, 150) // cap at 150% visual

  const barColor =
    severity === 'danger' ? 'bg-status-offline' :
    severity === 'warning' ? 'bg-status-warning' :
    'bg-status-online'

  const projectedBarColor =
    severity === 'danger' ? 'bg-status-offline/20' :
    severity === 'warning' ? 'bg-status-warning/20' :
    'bg-status-online/20'

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-gray-500" />
          <h3 className="text-[13px] font-semibold text-gray-200">Monthly Budget</h3>
        </div>
        <span className="text-sm font-semibold text-gray-100">
          {formatSpend(spentSoFar)}
          <span className="text-gray-500 font-normal"> / {formatSpend(budget)}</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 w-full rounded-full bg-surface-700 overflow-hidden">
        {/* Projected (ghost bar) */}
        <div
          className={clsx('absolute inset-y-0 left-0 rounded-full transition-all', projectedBarColor)}
          style={{ width: `${Math.min(pctProjected, 100)}%` }}
        />
        {/* Actual */}
        <div
          className={clsx('absolute inset-y-0 left-0 rounded-full transition-all', barColor)}
          style={{ width: `${pctSpent}%` }}
        />
        {/* 100% mark */}
        {pctProjected > 80 && (
          <div className="absolute inset-y-0 right-0 w-px bg-gray-500/50" style={{ left: '100%' }} />
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-3">
          <span className="text-gray-600">{Math.round(pctSpent)}% used</span>
          <span className="flex items-center gap-1 text-gray-500">
            <TrendingUp className="h-3 w-3" />
            Projected: {formatSpend(projected)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-600">{daysLeft} days left</span>
          <span className="text-gray-500">{formatSpend(dailyBudgetRemaining)}/day budget</span>
        </div>
      </div>
    </div>
  )
}

// ─── Recommendation Card ───────────────────────────────────────

function RecommendationCard({ rec, onDismiss }) {
  const isAlert = rec.type === 'alert'
  const Icon = isAlert ? AlertTriangle : Lightbulb

  const borderColor =
    rec.severity === 'danger' ? 'border-status-offline/30' :
    rec.severity === 'warning' ? 'border-status-warning/30' :
    'border-accent/20'

  const iconColor =
    rec.severity === 'danger' ? 'text-status-offline' :
    rec.severity === 'warning' ? 'text-status-warning' :
    'text-accent'

  const bgColor =
    rec.severity === 'danger' ? 'bg-status-offline/5' :
    rec.severity === 'warning' ? 'bg-status-warning/5' :
    'bg-accent/5'

  return (
    <div className={clsx('rounded-xl border p-4', borderColor, bgColor)}>
      <div className="flex items-start gap-3">
        <div className={clsx('mt-0.5 shrink-0 rounded-lg p-2', bgColor)}>
          <Icon className={clsx('h-4 w-4', iconColor)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-[13px] font-semibold text-gray-200">{rec.title}</h4>
            <button
              onClick={() => onDismiss(rec.id)}
              className="shrink-0 rounded-md p-1 text-gray-600 transition-colors hover:bg-surface-700 hover:text-gray-400"
              title="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-gray-400">{rec.description}</p>
          {rec.impact > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface-700/50 px-2.5 py-1 text-[11px] font-medium">
              <DollarSign className="h-3 w-3 text-status-online" />
              <span className="text-gray-300">
                {isAlert ? 'Overage' : 'Est. savings'}: {formatSpend(rec.impact)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Task Type Breakdown ───────────────────────────────────────

function TaskTypeBreakdown({ taskTypes }) {
  const maxCost = taskTypes[0]?.cost || 1

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-gray-500" />
        <h3 className="text-[13px] font-semibold text-gray-200">Spend by Task Type</h3>
      </div>
      <div className="space-y-2.5">
        {taskTypes.map((t) => {
          const barWidth = (t.cost / maxCost) * 100
          return (
            <div key={t.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-300">{t.label}</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-500">{t.pctOfTotal}%</span>
                  <span className="w-16 text-right font-medium text-gray-200">{formatSpend(t.cost)}</span>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-700">
                <div
                  className="h-full rounded-full bg-accent/60 transition-all"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Project Cost Tracker ──────────────────────────────────────

function ProjectCostTracker({ projectCosts, callLog }) {
  const [expanded, setExpanded] = useState(null)

  function handleExport(projectId) {
    exportProjectCostCsv(callLog, projectId)
  }

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-gray-500" />
          <h3 className="text-[13px] font-semibold text-gray-200">Cost by Project</h3>
        </div>
        <span className="text-xs text-gray-500">Total: {formatSpend(projectCosts.totalCost)}</span>
      </div>

      <div className="space-y-1">
        {projectCosts.projects.map((p) => (
          <div key={p.id}>
            <button
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-800/40"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-gray-200">{p.label}</span>
                  <span className="rounded-full bg-surface-700 px-2 py-0.5 text-[10px] text-gray-500">
                    {p.pctOfTotal}%
                  </span>
                </div>
              </div>
              <span className="text-xs text-gray-500">{formatNumber(p.calls)} calls</span>
              <span className="w-20 text-right text-xs font-medium text-gray-200">{formatSpend(p.cost)}</span>
              <ChevronDown className={clsx('h-3.5 w-3.5 text-gray-600 transition-transform', expanded === p.id && 'rotate-180')} />
            </button>

            {expanded === p.id && (
              <div className="ml-6 mt-1 mb-2 rounded-lg bg-surface-800/30 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Agents</span>
                  <span className="text-gray-300">{p.agents.join(', ')}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Models</span>
                  <span className="text-gray-300 truncate ml-4">{p.models.slice(0, 3).join(', ')}{p.models.length > 3 ? ` +${p.models.length - 3}` : ''}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Tokens</span>
                  <span className="text-gray-300">{formatTokenCount(p.tokens)}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleExport(p.id) }}
                  className="mt-2 flex items-center gap-1.5 rounded-md border border-surface-600 bg-surface-800 px-2.5 py-1.5 text-[11px] font-medium text-gray-400 transition-colors hover:border-surface-500 hover:text-gray-200"
                >
                  <Download className="h-3 w-3" />
                  Export CSV
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main InsightsView ─────────────────────────────────────────

export default function InsightsView({ monthlyBudget = 100 }) {
  const [dismissed, setDismissed] = useState(new Set())

  const callLog = useMemo(() => getCallLog(), [])
  const analysis = useMemo(
    () => runCostIntelligence(callLog, monthlyBudget),
    [callLog, monthlyBudget]
  )

  function handleDismiss(id) {
    setDismissed((prev) => new Set([...prev, id]))
  }

  const visibleRecs = analysis.recommendations.filter((r) => !dismissed.has(r.id))
  const totalPotentialSavings = visibleRecs
    .filter((r) => r.type === 'suggestion')
    .reduce((s, r) => s + (r.impact || 0), 0)

  return (
    <div className="space-y-5">
      {/* Budget Bar */}
      <BudgetBar velocity={analysis.velocity} budget={monthlyBudget} />

      {/* Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-accent" />
            <h3 className="text-[13px] font-semibold text-gray-200">
              Recommendations
              {visibleRecs.length > 0 && (
                <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                  {visibleRecs.length}
                </span>
              )}
            </h3>
          </div>
          {totalPotentialSavings > 0 && (
            <span className="text-[11px] text-gray-500">
              Potential savings: <span className="font-medium text-status-online">{formatSpend(totalPotentialSavings)}</span>/month
            </span>
          )}
        </div>

        {visibleRecs.length === 0 ? (
          <div className="rounded-xl border border-surface-700 bg-surface-900 px-5 py-8 text-center">
            <p className="text-sm text-gray-500">All clear — no recommendations right now.</p>
            <p className="mt-1 text-[11px] text-gray-600">Your usage patterns look efficient.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleRecs.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} onDismiss={handleDismiss} />
            ))}
          </div>
        )}

        {dismissed.size > 0 && (
          <button
            onClick={() => setDismissed(new Set())}
            className="mt-2 text-[11px] text-gray-600 transition-colors hover:text-gray-400"
          >
            Show {dismissed.size} dismissed recommendation{dismissed.size > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Two-column grid: Task Types + Project Costs */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TaskTypeBreakdown taskTypes={analysis.taskTypes} />
        <ProjectCostTracker projectCosts={analysis.projectCosts} callLog={callLog} />
      </div>

      {/* Analysis meta */}
      <p className="text-[10px] text-gray-600 text-center">
        Analysis based on {formatNumber(analysis.meta.totalCalls)} API calls over {analysis.meta.analyzedDays} days
      </p>
    </div>
  )
}

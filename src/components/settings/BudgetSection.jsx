import { DollarSign, AlertTriangle, Bell } from 'lucide-react'
import clsx from 'clsx'
import CollapsibleSection from './CollapsibleSection'

const BUDGET_PRESETS = [50, 75, 100, 150, 200, 300, 500]

export default function BudgetSection({ budget, onUpdate }) {
  return (
    <CollapsibleSection
      icon={DollarSign}
      title="Budget & Alerts"
      subtitle="Set monthly spending targets and alert thresholds"
    >
      <div className="space-y-6">
        {/* Monthly Budget */}
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-400">
            Monthly Budget Target
          </label>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="10"
                value={budget.monthlyBudget}
                onChange={(e) => onUpdate({ monthlyBudget: Math.max(0, Number(e.target.value)) })}
                className="settings-input w-32 pl-7"
              />
            </div>
            <span className="text-xs text-gray-600">/ month</span>
          </div>

          {/* Quick presets */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {BUDGET_PRESETS.map((val) => (
              <button
                key={val}
                onClick={() => onUpdate({ monthlyBudget: val })}
                className={clsx(
                  'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
                  budget.monthlyBudget === val
                    ? 'bg-accent/15 text-accent'
                    : 'bg-surface-700 text-gray-400 hover:bg-surface-600 hover:text-gray-300'
                )}
              >
                ${val}
              </button>
            ))}
          </div>
        </div>

        {/* Alert Thresholds */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-400">
              <AlertTriangle className="h-3 w-3 text-status-warning" />
              Warning Threshold
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="50"
                max="100"
                step="5"
                value={budget.alertAt}
                onChange={(e) =>
                  onUpdate({ alertAt: Math.min(100, Math.max(50, Number(e.target.value))) })
                }
                className="settings-input w-20"
              />
              <span className="text-xs text-gray-600">% of budget</span>
            </div>
            <p className="mt-1 text-[10px] text-gray-600">
              Yellow alert when projected spend reaches {budget.alertAt}% (${Math.round(budget.monthlyBudget * budget.alertAt / 100)})
            </p>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-400">
              <AlertTriangle className="h-3 w-3 text-status-offline" />
              Critical Threshold
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="80"
                max="200"
                step="5"
                value={budget.criticalAt}
                onChange={(e) =>
                  onUpdate({ criticalAt: Math.min(200, Math.max(80, Number(e.target.value))) })
                }
                className="settings-input w-20"
              />
              <span className="text-xs text-gray-600">% of budget</span>
            </div>
            <p className="mt-1 text-[10px] text-gray-600">
              Red alert when projected spend reaches {budget.criticalAt}% (${Math.round(budget.monthlyBudget * budget.criticalAt / 100)})
            </p>
          </div>
        </div>

        {/* Future: Notification channels */}
        <div>
          <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-400">
            <Bell className="h-3 w-3" />
            Alert Notifications
            <span className="rounded-full bg-surface-700 px-1.5 py-0.5 text-[9px] text-gray-500">Coming soon</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-not-allowed opacity-50">
              <input type="checkbox" disabled checked={budget.emailAlerts} className="h-3.5 w-3.5 rounded border-surface-600 bg-surface-800" />
              <span className="text-xs text-gray-400">Email alerts when budget exceeded</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-not-allowed opacity-50">
              <input type="checkbox" disabled checked={budget.slackAlerts} className="h-3.5 w-3.5 rounded border-surface-600 bg-surface-800" />
              <span className="text-xs text-gray-400">Discord/Slack webhook notification</span>
            </label>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-lg bg-surface-800/50 p-3 text-xs">
          <p className="font-medium text-gray-300 mb-1">Budget Summary</p>
          <div className="space-y-1 text-gray-500">
            <p>Target: <span className="text-gray-300">${budget.monthlyBudget}/month</span> (~${(budget.monthlyBudget / 30).toFixed(2)}/day)</p>
            <p>Warning at: <span className="text-status-warning">${Math.round(budget.monthlyBudget * budget.alertAt / 100)}</span> ({budget.alertAt}%)</p>
            <p>Critical at: <span className="text-status-offline">${Math.round(budget.monthlyBudget * budget.criticalAt / 100)}</span> ({budget.criticalAt}%)</p>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}

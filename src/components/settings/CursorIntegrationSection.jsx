import { useState } from 'react'
import {
  MonitorSmartphone,
  RefreshCw,
  Loader2,
  CheckCircle2,
  ExternalLink,
  PenLine,
} from 'lucide-react'
import clsx from 'clsx'
import CollapsibleSection from './CollapsibleSection'
import { validateUrl } from '../../hooks/useSettings'
import { useData } from '../../context/DataProvider'

export default function CursorIntegrationSection({ cursor, onUpdate }) {
  const { cursorUsage, updateCursorManually, cursorStale } = useData()
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null) // null | 'success' | 'error'
  const [urlError, setUrlError] = useState(null)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualForm, setManualForm] = useState({
    requestsUsed: cursorUsage?.premiumRequests?.used || '',
    requestsLimit: cursorUsage?.premiumRequests?.limit || 500,
    monthlyFee: cursorUsage?.monthlyFee || 20,
  })
  const [saveResult, setSaveResult] = useState(null)

  function handleUrlChange(url) {
    onUpdate({ dashboardUrl: url })
    setUrlError(null)
  }

  function handleUrlBlur() {
    if (cursor.dashboardUrl.trim()) {
      const err = validateUrl(cursor.dashboardUrl)
      setUrlError(err)
    }
  }

  function handleSync() {
    // Validate URL first
    const err = validateUrl(cursor.dashboardUrl)
    if (err) {
      setUrlError(err)
      return
    }

    setSyncing(true)
    setSyncResult(null)
    setTimeout(() => {
      setSyncing(false)
      setSyncResult('success')
      onUpdate({
        lastSync: new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      })
      setTimeout(() => setSyncResult(null), 3000)
    }, 1500)
  }

  return (
    <CollapsibleSection
      icon={MonitorSmartphone}
      title="Cursor Integration"
      subtitle="Sync usage data from your Cursor IDE subscription"
      defaultOpen={false}
    >
      <div className="space-y-4">
        {/* Dashboard URL */}
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-500">
            Cursor Dashboard URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={cursor.dashboardUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              onBlur={handleUrlBlur}
              className={clsx(
                'settings-input flex-1',
                urlError && 'border-status-offline/50'
              )}
              placeholder="https://cursor.com/dashboard"
            />
            <a
              href={cursor.dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-surface-600 p-2 text-gray-500 transition-colors hover:border-surface-500 hover:text-gray-300"
              title="Open in browser"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          {urlError && (
            <p className="mt-0.5 text-[10px] text-status-offline">{urlError}</p>
          )}
        </div>

        {/* Sync Method */}
        <div>
          <label className="mb-2 block text-[11px] font-medium text-gray-500">
            Sync Method
          </label>
          <div className="flex items-center gap-2">
            {['manual', 'auto'].map((method) => (
              <button
                key={method}
                onClick={() => onUpdate({ syncMethod: method })}
                className={clsx(
                  'rounded-md px-3.5 py-1.5 text-[12px] font-medium transition-colors',
                  cursor.syncMethod === method
                    ? 'bg-surface-600 text-gray-100'
                    : 'bg-surface-800 text-gray-500 hover:text-gray-300'
                )}
              >
                {method === 'manual' ? 'Manual' : 'Auto'}
              </button>
            ))}

            {cursor.syncMethod === 'auto' && (
              <div className="ml-2 flex items-center gap-2">
                <span className="text-[11px] text-gray-500">every</span>
                <select
                  value={cursor.syncInterval}
                  onChange={(e) =>
                    onUpdate({ syncInterval: Number(e.target.value) })
                  }
                  className="settings-select w-20"
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={60}>1 hour</option>
                  <option value={360}>6 hours</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Last sync + Sync Now */}
        <div className="flex items-center justify-between rounded-lg bg-surface-800/50 px-4 py-3">
          <div className="text-xs">
            <span className="text-gray-500">Last synced: </span>
            <span className={clsx('text-gray-300', cursorStale && 'text-amber-400')}>
              {cursor.lastSync || 'Never'}
              {cursorStale && ' (stale)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManualEntry(!showManualEntry)}
              className="flex items-center gap-1.5 rounded-lg border border-surface-600 bg-surface-700 px-3 py-1.5 text-[11px] font-medium text-gray-300 transition-colors hover:border-surface-500 hover:text-gray-100"
            >
              <PenLine className="h-3.5 w-3.5" />
              Manual Entry
            </button>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1.5 rounded-lg border border-surface-600 bg-surface-700 px-3 py-1.5 text-[11px] font-medium text-gray-300 transition-colors hover:border-surface-500 hover:text-gray-100 disabled:opacity-50"
            >
              {syncing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : syncResult === 'success' ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-status-online" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {syncing ? 'Syncing...' : syncResult === 'success' ? 'Synced!' : 'Sync Now'}
            </button>
          </div>
        </div>

        {/* Manual Cursor Data Entry */}
        {showManualEntry && (
          <div className="rounded-lg border border-surface-600 bg-surface-800/50 p-4 space-y-3">
            <p className="text-[11px] text-gray-400 mb-2">
              Enter your Cursor usage stats from{' '}
              <a href="https://cursor.com/dashboard" target="_blank" rel="noopener noreferrer"
                className="text-accent hover:underline">cursor.com/dashboard</a>
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-medium text-gray-500">Requests Used</label>
                <input
                  type="number"
                  value={manualForm.requestsUsed}
                  onChange={(e) => setManualForm((f) => ({ ...f, requestsUsed: e.target.value }))}
                  className="settings-input w-full"
                  placeholder="347"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-medium text-gray-500">Request Limit</label>
                <input
                  type="number"
                  value={manualForm.requestsLimit}
                  onChange={(e) => setManualForm((f) => ({ ...f, requestsLimit: e.target.value }))}
                  className="settings-input w-full"
                  placeholder="500"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-medium text-gray-500">Monthly Fee ($)</label>
                <input
                  type="number"
                  value={manualForm.monthlyFee}
                  onChange={(e) => setManualForm((f) => ({ ...f, monthlyFee: e.target.value }))}
                  className="settings-input w-full"
                  placeholder="20"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              {saveResult === 'success' && (
                <span className="text-[10px] text-status-online flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Saved
                </span>
              )}
              <button
                onClick={async () => {
                  const used = parseInt(manualForm.requestsUsed, 10) || 0
                  const limit = parseInt(manualForm.requestsLimit, 10) || 500
                  await updateCursorManually({
                    plan: 'Pro',
                    billingCycle: { start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10), end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10) },
                    premiumRequests: { used, limit },
                    modelBreakdown: cursorUsage?.modelBreakdown || [],
                    monthlyFee: parseFloat(manualForm.monthlyFee) || 20,
                    overageRate: 0.04,
                    estimatedOverage: used > limit ? (used - limit) * 0.04 : 0,
                  })
                  onUpdate({ lastSync: new Date().toLocaleString() })
                  setSaveResult('success')
                  setTimeout(() => setSaveResult(null), 3000)
                }}
                className="rounded-lg bg-accent/20 px-3 py-1.5 text-[11px] font-medium text-accent transition-colors hover:bg-accent/30"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  )
}

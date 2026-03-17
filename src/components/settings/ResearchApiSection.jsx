import { useState } from 'react'
import { Search, Check, Loader2, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import CollapsibleSection from './CollapsibleSection'

// TODO: All three tiers connect via Jinx backend

export default function ResearchApiSection({ research, onUpdate }) {
  const [testingTier2, setTestingTier2] = useState(false)
  const [testingTier3, setTestingTier3] = useState(false)
  const [tier2Result, setTier2Result] = useState(null)
  const [tier3Result, setTier3Result] = useState(null)

  function handleTestTier2() {
    setTestingTier2(true)
    setTier2Result(null)
    setTimeout(() => {
      setTestingTier2(false)
      setTier2Result(research.tier2ApiKey ? 'success' : 'error')
    }, 1200)
  }

  function handleTestTier3() {
    setTestingTier3(true)
    setTier3Result(null)
    setTimeout(() => {
      setTestingTier3(false)
      setTier3Result(research.tier3ApiKey ? 'success' : 'error')
    }, 1200)
  }

  return (
    <CollapsibleSection
      icon={Search}
      title="Research API"
      subtitle="Configure X/Twitter data sources for discourse analysis"
      defaultOpen={false}
    >
      <div className="space-y-6">
        {/* Tier 1 — FxTwitter (free) */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-xs font-semibold text-gray-300">Tier 1 — FxTwitter</h4>
            <span className="rounded-full bg-status-online/15 px-2 py-0.5 text-[9px] font-bold text-status-online">Enabled</span>
            <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[9px] text-green-400">Free</span>
          </div>
          <p className="text-[10px] text-gray-600">Public tweet fetching via FxTwitter proxy. Always available, no API key needed. Limited to public posts only.</p>
        </div>

        {/* Tier 2 — TwitterAPI.io / SocialData */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-xs font-semibold text-gray-300">Tier 2 — TwitterAPI.io / SocialData</h4>
            <span className={clsx('rounded-full px-2 py-0.5 text-[9px] font-bold',
              research.tier2ApiKey ? 'bg-status-online/15 text-status-online' : 'bg-surface-700 text-gray-500'
            )}>
              {research.tier2ApiKey ? 'Configured' : 'Not Configured'}
            </span>
          </div>
          <p className="text-[10px] text-gray-600">Third-party API for search, user lookup, and engagement data. Moderate cost, good coverage.</p>

          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-gray-400">API Key</label>
            <input
              type="password"
              value={research.tier2ApiKey || ''}
              onChange={(e) => { onUpdate({ tier2ApiKey: e.target.value }); setTier2Result(null) }}
              placeholder="Enter API key"
              className="settings-input w-full max-w-md"
              autoComplete="off"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestTier2}
              disabled={testingTier2 || !research.tier2ApiKey}
              className="flex items-center gap-1.5 rounded-lg border border-surface-600 bg-surface-800 px-3 py-1.5 text-[12px] font-medium text-gray-400 transition-colors hover:border-surface-500 hover:text-gray-200 disabled:opacity-40"
            >
              {testingTier2 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              Test Connection
            </button>
            {tier2Result === 'success' && (
              <span className="flex items-center gap-1 text-[11px] text-status-online"><Check className="h-3 w-3" /> Connected</span>
            )}
            {tier2Result === 'error' && (
              <span className="text-[11px] text-status-offline">Connection failed — check API key</span>
            )}
          </div>
        </div>

        {/* Tier 3 — Official X API */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-xs font-semibold text-gray-300">Tier 3 — Official X API</h4>
            <span className={clsx('rounded-full px-2 py-0.5 text-[9px] font-bold',
              research.tier3ApiKey ? 'bg-status-online/15 text-status-online' : 'bg-surface-700 text-gray-500'
            )}>
              {research.tier3ApiKey ? 'Configured' : 'Not Configured'}
            </span>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-status-warning/5 border border-status-warning/20 px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-status-warning mt-0.5 shrink-0" />
            <p className="text-[10px] text-status-warning/80">Expensive — used as last resort only. Official X API pricing applies per-request. Only used when Tier 1 and Tier 2 cannot fulfill the query.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-gray-400">API Key</label>
            <input
              type="password"
              value={research.tier3ApiKey || ''}
              onChange={(e) => { onUpdate({ tier3ApiKey: e.target.value }); setTier3Result(null) }}
              placeholder="Enter API key (Bearer token)"
              className="settings-input w-full max-w-md"
              autoComplete="off"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestTier3}
              disabled={testingTier3 || !research.tier3ApiKey}
              className="flex items-center gap-1.5 rounded-lg border border-surface-600 bg-surface-800 px-3 py-1.5 text-[12px] font-medium text-gray-400 transition-colors hover:border-surface-500 hover:text-gray-200 disabled:opacity-40"
            >
              {testingTier3 ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              Test Connection
            </button>
            {tier3Result === 'success' && (
              <span className="flex items-center gap-1 text-[11px] text-status-online"><Check className="h-3 w-3" /> Connected</span>
            )}
            {tier3Result === 'error' && (
              <span className="text-[11px] text-status-offline">Connection failed — check API key</span>
            )}
          </div>
        </div>

        {/* Query Settings */}
        <div className="border-t border-surface-800 pt-4 space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Query Settings</p>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-gray-400">Cache TTL (minutes)</label>
              <input
                type="number"
                value={research.cacheTtl ?? 60}
                onChange={(e) => onUpdate({ cacheTtl: Math.max(1, Number(e.target.value) || 60) })}
                min={1}
                className="settings-input w-full"
              />
              <p className="mt-0.5 text-[9px] text-gray-600">Cache results to reduce API calls</p>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-gray-400">Max results per query</label>
              <input
                type="number"
                value={research.maxResults ?? 50}
                onChange={(e) => onUpdate({ maxResults: Math.max(10, Math.min(200, Number(e.target.value) || 50)) })}
                min={10}
                max={200}
                className="settings-input w-full"
              />
              <p className="mt-0.5 text-[9px] text-gray-600">Higher count = better analysis, higher cost</p>
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}

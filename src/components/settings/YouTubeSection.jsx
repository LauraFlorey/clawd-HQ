import { useState } from 'react'
import { Play, Check, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import CollapsibleSection from './CollapsibleSection'

// TODO: YouTube Data API + Analytics API integration via Jinx backend

export default function YouTubeSection({ youtube, onUpdate }) {
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)

  function handleSyncNow() {
    setSyncing(true)
    setSyncResult(null)
    setTimeout(() => {
      setSyncing(false)
      setSyncResult(youtube.apiKey ? 'success' : 'error')
      if (youtube.apiKey) onUpdate({ lastSync: new Date().toISOString() })
    }, 1500)
  }

  return (
    <CollapsibleSection
      icon={Play}
      title="YouTube"
      subtitle="Connect YouTube Analytics to track channel performance and competitors"
      defaultOpen={false}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-gray-400">YouTube API Key</label>
          <input
            type="password"
            value={youtube.apiKey || ''}
            onChange={(e) => { onUpdate({ apiKey: e.target.value }); setSyncResult(null) }}
            placeholder="Enter YouTube Data API v3 key"
            className="settings-input w-full max-w-md"
            autoComplete="off"
          />
          <p className="mt-0.5 text-[9px] text-gray-600">
            Required for fetching channel statistics, video data, and competitor tracking.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-gray-400">Channel ID</label>
          <input
            type="text"
            value={youtube.channelId || ''}
            onChange={(e) => onUpdate({ channelId: e.target.value })}
            placeholder="e.g. UCxxxxxxxxxxxxxxxxxxxxxxxx"
            className="settings-input w-full max-w-md"
          />
          <p className="mt-0.5 text-[9px] text-gray-600">Your YouTube channel ID. Find it in YouTube Studio under Settings → Channel → Advanced settings.</p>
        </div>

        <div className="flex items-center justify-between max-w-md">
          <div>
            <p className="text-xs font-medium text-gray-300">Auto-sync</p>
            <p className="mt-0.5 text-[10px] text-gray-600">Automatically fetch latest analytics daily</p>
          </div>
          <button
            onClick={() => onUpdate({ autoSync: !youtube.autoSync })}
            className={clsx('relative h-6 w-11 rounded-full transition-colors', youtube.autoSync ? 'bg-accent' : 'bg-surface-600')}
          >
            <span
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
              style={{ left: 2, transform: youtube.autoSync ? 'translateX(21px)' : 'translateX(0)' }}
            />
          </button>
        </div>

        {youtube.autoSync && (
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-gray-400">Sync Schedule</label>
            <select
              value={youtube.syncSchedule || 'daily'}
              onChange={(e) => onUpdate({ syncSchedule: e.target.value })}
              className="settings-select w-40"
            >
              <option value="daily">Daily</option>
              <option value="every12h">Every 12 hours</option>
              <option value="every6h">Every 6 hours</option>
            </select>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2 border-t border-surface-800">
          <button
            onClick={handleSyncNow}
            disabled={syncing || !youtube.apiKey}
            className="flex items-center gap-1.5 rounded-lg border border-surface-600 bg-surface-800 px-3 py-1.5 text-[12px] font-medium text-gray-400 transition-colors hover:border-surface-500 hover:text-gray-200 disabled:opacity-40"
          >
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Sync Now
          </button>
          {syncResult === 'success' && (
            <span className="flex items-center gap-1 text-[11px] text-status-online"><Check className="h-3 w-3" /> Synced successfully</span>
          )}
          {syncResult === 'error' && (
            <span className="text-[11px] text-status-offline">Sync failed — check API key</span>
          )}
          {youtube.lastSync && !syncResult && (
            <span className="text-[10px] text-gray-600">Last synced: {new Date(youtube.lastSync).toLocaleString()}</span>
          )}
        </div>
      </div>
    </CollapsibleSection>
  )
}

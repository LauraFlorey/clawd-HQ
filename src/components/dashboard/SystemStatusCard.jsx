import { Server, MessageCircle, GitBranch, Network, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import { useData } from '../../context/DataProvider'
import { LoadingCard } from '../LoadingState'

const STATUS_LABELS = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  offline: 'Offline',
  connected: 'Connected',
  synced: 'Synced',
  syncing: 'Syncing',
  active: 'Active',
  disconnected: 'Disconnected',
}

function StatusRow({ icon: Icon, label, value, statusColor, statusText, sublabel }) {
  return (
    <div className="flex items-center gap-3 py-2.5" role="status" aria-label={`${label}: ${statusText || value}`}>
      <Icon className="h-3.5 w-3.5 shrink-0 text-gray-600" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-gray-300">{label}</span>
          {sublabel && <span className="text-[10px] text-gray-600">{sublabel}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">{value}</span>
        <span className={clsx('h-2 w-2 shrink-0 rounded-full', statusColor)} aria-hidden="true" />
      </div>
    </div>
  )
}

function gatewayStatusColor(status) {
  if (status === 'healthy') return 'bg-status-online'
  if (status === 'degraded') return 'bg-status-degraded'
  return 'bg-status-offline'
}

function connectionStatusColor(status) {
  if (status === 'connected' || status === 'synced' || status === 'active') return 'bg-status-online'
  if (status === 'syncing') return 'bg-status-degraded'
  return 'bg-status-offline'
}

export default function SystemStatusCard() {
  const { gateways, systemStatus, loading, gatewayErrors } = useData()

  if (loading) return <LoadingCard height="h-64" />

  const { discord, memorySync, tailscale } = systemStatus

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <h3 className="mb-1 text-[13px] font-semibold text-gray-200">System Status</h3>

      {/* Gateway connection errors — inline warning, non-blocking */}
      {gatewayErrors.length > 0 && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-status-warning/5 border border-status-warning/15 p-2.5" role="alert">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-status-warning mt-0.5" />
          <div className="space-y-0.5">
            {gatewayErrors.map((err, i) => (
              <p key={i} className="text-[11px] text-status-warning">{err}</p>
            ))}
          </div>
        </div>
      )}

      <div className="divide-y divide-surface-800">
        {gateways.map((gw) => (
          <StatusRow
            key={gw.id}
            icon={Server}
            label={gw.id === 'macbook' ? 'MacBook (Jinx)' : 'Mac Mini (Jinx)'}
            sublabel={`${gw.host}:${gw.port}`}
            value={`${gw.latency}ms`}
            statusColor={gatewayStatusColor(gw.status)}
            statusText={STATUS_LABELS[gw.status] || gw.status}
          />
        ))}
        <StatusRow
          icon={MessageCircle}
          label="Discord"
          sublabel={discord.server}
          value={discord.status}
          statusColor={connectionStatusColor(discord.status)}
          statusText={STATUS_LABELS[discord.status]}
        />
        <StatusRow
          icon={GitBranch}
          label="Memory Sync"
          sublabel={`${memorySync.repo}/${memorySync.branch}`}
          value={memorySync.lastSync}
          statusColor={connectionStatusColor(memorySync.status)}
          statusText={STATUS_LABELS[memorySync.status]}
        />
        <StatusRow
          icon={Network}
          label="Tailscale"
          sublabel={`${tailscale.peers} peers`}
          value={tailscale.status}
          statusColor={connectionStatusColor(tailscale.status)}
          statusText={STATUS_LABELS[tailscale.status]}
        />
      </div>
    </div>
  )
}

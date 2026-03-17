import { useState } from 'react'
import {
  Server,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  Wifi,
} from 'lucide-react'
import clsx from 'clsx'
import CollapsibleSection from './CollapsibleSection'
import { validateHost, validatePort } from '../../hooks/useSettings'

function StatusBadge({ status }) {
  const map = {
    connected: { label: 'Connected', color: 'bg-status-online', text: 'text-status-online' },
    disconnected: { label: 'Disconnected', color: 'bg-status-offline', text: 'text-status-offline' },
    testing: { label: 'Testing...', color: 'bg-status-degraded', text: 'text-status-degraded' },
    error: { label: 'Error', color: 'bg-status-offline', text: 'text-status-offline' },
    success: { label: 'Success', color: 'bg-status-online', text: 'text-status-online' },
  }
  const s = map[status] || map.disconnected
  return (
    <div className="flex items-center gap-1.5">
      <span className={clsx('h-2 w-2 rounded-full', s.color)} />
      <span className={clsx('text-[11px] font-medium', s.text)}>{s.label}</span>
    </div>
  )
}

function GatewayCard({ gateway, onChange, onRemove, onTest }) {
  const [showToken, setShowToken] = useState(false)
  const [testStatus, setTestStatus] = useState(null) // null | 'testing' | 'success' | 'error'
  const [errors, setErrors] = useState({})

  function handleChange(field, value) {
    onChange({ ...gateway, [field]: value })
    // Clear error for this field
    if (errors[field]) {
      setErrors((e) => ({ ...e, [field]: null }))
    }
  }

  function handleTest() {
    // Validate first
    const hostErr = validateHost(gateway.host)
    const portErr = validatePort(gateway.port)
    if (hostErr || portErr) {
      setErrors({ host: hostErr, port: portErr })
      return
    }
    setErrors({})
    setTestStatus('testing')
    // Simulate connection test
    setTimeout(() => {
      setTestStatus(Math.random() > 0.2 ? 'success' : 'error')
      setTimeout(() => setTestStatus(null), 3000)
    }, 1200)
  }

  return (
    <form
      className="rounded-lg border border-surface-700 bg-surface-800/50 p-4"
      onSubmit={(e) => { e.preventDefault(); handleTest() }}
      autoComplete="off"
    >
      <div className="mb-3 flex items-center justify-between">
        <StatusBadge status={testStatus || gateway.status} />
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-gray-600 transition-colors hover:bg-surface-700 hover:text-status-offline"
            title="Remove gateway"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Name */}
        <FieldRow label="Name">
          <input
            type="text"
            value={gateway.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="settings-input"
            placeholder="Gateway name"
          />
        </FieldRow>

        {/* Host */}
        <FieldRow label="Host / IP" error={errors.host}>
          <input
            type="text"
            value={gateway.host}
            onChange={(e) => handleChange('host', e.target.value)}
            className={clsx('settings-input', errors.host && 'border-status-offline/50')}
            placeholder="e.g. localhost or remote-host"
          />
        </FieldRow>

        {/* Port */}
        <FieldRow label="Port" error={errors.port}>
          <input
            type="number"
            value={gateway.port}
            onChange={(e) => handleChange('port', e.target.value)}
            className={clsx('settings-input w-28', errors.port && 'border-status-offline/50')}
            placeholder="18789"
          />
        </FieldRow>

        {/* Auth Token */}
        <FieldRow label="Auth Token">
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={gateway.token}
              onChange={(e) => handleChange('token', e.target.value)}
              className="settings-input pr-9"
              placeholder="Optional"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
            >
              {showToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </FieldRow>

        {/* Test button */}
        <button
          type="submit"
          disabled={testStatus === 'testing'}
          className="flex items-center gap-2 rounded-lg border border-surface-600 bg-surface-700 px-3.5 py-2 text-xs font-medium text-gray-300 transition-colors hover:border-surface-500 hover:text-gray-100 disabled:opacity-50"
        >
          {testStatus === 'testing' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : testStatus === 'success' ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-status-online" />
          ) : testStatus === 'error' ? (
            <XCircle className="h-3.5 w-3.5 text-status-offline" />
          ) : (
            <Wifi className="h-3.5 w-3.5" />
          )}
          {testStatus === 'testing'
            ? 'Testing...'
            : testStatus === 'success'
            ? 'Connected!'
            : testStatus === 'error'
            ? 'Failed'
            : 'Test Connection'}
        </button>
      </div>
    </form>
  )
}

function FieldRow({ label, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-gray-500">{label}</label>
      {children}
      {error && <p className="mt-0.5 text-[10px] text-status-offline">{error}</p>}
    </div>
  )
}

export default function GatewaySection({ gateways, onUpdate }) {
  function handleGatewayChange(index, updated) {
    const next = [...gateways]
    next[index] = updated
    onUpdate(next)
  }

  function handleRemove(index) {
    if (gateways.length <= 1) return // Keep at least one
    onUpdate(gateways.filter((_, i) => i !== index))
  }

  function handleAdd() {
    onUpdate([
      ...gateways,
      {
        id: `gw-${Date.now()}`,
        name: `Gateway ${gateways.length + 1}`,
        host: '',
        port: 18789,
        token: '',
        status: 'disconnected',
      },
    ])
  }

  return (
    <CollapsibleSection
      icon={Server}
      title="Gateway Connections"
      subtitle={`${gateways.length} gateway${gateways.length !== 1 ? 's' : ''} configured`}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {gateways.map((gw, i) => (
            <GatewayCard
              key={gw.id}
              gateway={gw}
              onChange={(updated) => handleGatewayChange(i, updated)}
              onRemove={gateways.length > 1 ? () => handleRemove(i) : undefined}
            />
          ))}
        </div>

        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-lg border border-dashed border-surface-600 px-4 py-2.5 text-xs font-medium text-gray-500 transition-colors hover:border-surface-500 hover:text-gray-300"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Gateway
        </button>
      </div>
    </CollapsibleSection>
  )
}

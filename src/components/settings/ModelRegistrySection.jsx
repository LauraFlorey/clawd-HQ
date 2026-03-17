import { useState } from 'react'
import {
  Cpu,
  Eye,
  EyeOff,
  Check,
  X,
  Shield,
} from 'lucide-react'
import clsx from 'clsx'
import CollapsibleSection from './CollapsibleSection'

function ProviderRow({ provider, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [keyValue, setKeyValue] = useState('')
  const [endpointValue, setEndpointValue] = useState(provider.endpoint || '')

  const isOllama = provider.id === 'ollama'

  function handleSave() {
    if (isOllama) {
      onUpdate(provider.id, {
        endpoint: endpointValue,
        keyConfigured: !!endpointValue.trim(),
      })
    } else {
      onUpdate(provider.id, {
        keyConfigured: !!keyValue.trim(),
      })
    }
    setEditing(false)
    setKeyValue('')
  }

  function handleCancel() {
    setEditing(false)
    setKeyValue('')
    setEndpointValue(provider.endpoint || '')
  }

  return (
    <div className="rounded-lg border border-surface-700 bg-surface-800/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: provider.color }}
          />
          <div>
            <p className="text-[13px] font-medium text-gray-200">{provider.name}</p>
            <p className="text-[11px] text-gray-600">
              {isOllama
                ? provider.endpoint || 'No endpoint configured'
                : provider.keyConfigured
                ? `API key configured · Default: ${provider.defaultModel}`
                : 'No API key configured'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status */}
          <div className="flex items-center gap-1.5">
            <span
              className={clsx(
                'h-2 w-2 rounded-full',
                provider.keyConfigured ? 'bg-status-online' : 'bg-status-unknown'
              )}
            />
            <span className="text-[11px] text-gray-500">
              {provider.keyConfigured ? 'Active' : 'Not set'}
            </span>
          </div>

          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="rounded-md border border-surface-600 bg-surface-700 px-2.5 py-1 text-[11px] font-medium text-gray-400 transition-colors hover:border-surface-500 hover:text-gray-200"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="mt-3 space-y-3 border-t border-surface-700 pt-3">
          {isOllama ? (
            <>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500">
                  Endpoint URL
                </label>
                <input
                  type="text"
                  value={endpointValue}
                  onChange={(e) => setEndpointValue(e.target.value)}
                  className="settings-input"
                  placeholder="http://localhost:11434"
                />
              </div>
              {provider.availableModels?.length > 0 && (
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-500">
                    Available Models
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {provider.availableModels.map((m) => (
                      <span
                        key={m}
                        className="rounded-md bg-surface-700 px-2 py-0.5 text-[11px] text-gray-400"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-500">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyValue}
                  onChange={(e) => setKeyValue(e.target.value)}
                  className="settings-input pr-9"
                  placeholder={provider.keyConfigured ? '••••••••••••••••' : 'Enter API key'}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
                >
                  {showKey ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Save / Cancel */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <Check className="h-3 w-3" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 rounded-md border border-surface-600 px-3 py-1.5 text-[11px] font-medium text-gray-400 transition-colors hover:text-gray-200"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ModelRegistrySection({ providers, onUpdate }) {
  const configured = providers.filter((p) => p.keyConfigured).length

  return (
    <CollapsibleSection
      icon={Cpu}
      title="Model Registry"
      subtitle={`${configured} of ${providers.length} providers configured`}
    >
      <div className="space-y-3">
        {providers.map((provider) => (
          <ProviderRow
            key={provider.id}
            provider={provider}
            onUpdate={onUpdate}
          />
        ))}

        {/* Security note */}
        <div className="flex items-start gap-2 rounded-lg bg-surface-800/30 px-3.5 py-2.5">
          <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-online" />
          <p className="text-[11px] leading-relaxed text-gray-500">
            API keys are stored locally in your browser and never transmitted to the
            dashboard backend. Keys are sent directly to provider APIs from the
            gateway process.
          </p>
        </div>
      </div>
    </CollapsibleSection>
  )
}

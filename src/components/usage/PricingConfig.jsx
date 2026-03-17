import { useState, useRef, useEffect } from 'react'
import { Settings, ChevronDown, Plus, RotateCcw, Trash2, Check, X } from 'lucide-react'
import clsx from 'clsx'
import { usePricing } from '../../hooks/usePricing'
import { MODEL_PRICING } from '../../utils/pricing'

const PROVIDER_ORDER = ['anthropic', 'openai', 'google', 'xai', 'openrouter', 'custom', 'unknown']
const PROVIDER_LABELS = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  xai: 'xAI',
  openrouter: 'OpenRouter',
  custom: 'Custom',
  unknown: 'Other',
}

function EditableCell({ value, onSave, prefix = '$', className }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function commit() {
    const num = parseFloat(draft)
    if (!isNaN(num) && num >= 0) onSave(num)
    else setDraft(String(value))
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(String(value)); setEditing(false) } }}
        className={clsx('w-20 rounded border border-accent/40 bg-surface-800 px-2 py-0.5 text-xs text-gray-200 outline-none focus:border-accent', className)}
        autoFocus
      />
    )
  }

  return (
    <button
      onClick={() => { setDraft(String(value)); setEditing(true) }}
      className={clsx('rounded px-2 py-0.5 text-xs text-gray-300 transition-colors hover:bg-surface-700 hover:text-gray-100', className)}
    >
      {prefix}{Number(value).toFixed(2)}
    </button>
  )
}

function AddModelRow({ onAdd, onCancel }) {
  const [provider, setProvider] = useState('custom')
  const [id, setId] = useState('')
  const [name, setName] = useState('')
  const [input, setInput] = useState('1.00')
  const [output, setOutput] = useState('3.00')

  function handleSubmit(e) {
    e.preventDefault()
    const modelId = id.trim().toLowerCase().replace(/\s+/g, '-') || name.trim().toLowerCase().replace(/\s+/g, '-')
    if (!modelId || !name.trim()) return
    onAdd({ id: modelId, provider, name: name.trim(), input: parseFloat(input) || 1, output: parseFloat(output) || 3 })
  }

  return (
    <tr className="border-t border-surface-700 bg-surface-800/40">
      <td className="px-3 py-2">
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          className="w-full rounded border border-surface-600 bg-surface-800 px-2 py-1 text-xs text-gray-300 outline-none focus:border-accent"
        >
          {Object.entries(PROVIDER_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); if (!id) setId(e.target.value.toLowerCase().replace(/\s+/g, '-')) }}
          placeholder="Model name"
          className="w-full rounded border border-surface-600 bg-surface-800 px-2 py-1 text-xs text-gray-300 outline-none focus:border-accent"
          autoFocus
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-20 rounded border border-surface-600 bg-surface-800 px-2 py-1 text-xs text-gray-300 outline-none focus:border-accent"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={output}
          onChange={(e) => setOutput(e.target.value)}
          className="w-20 rounded border border-surface-600 bg-surface-800 px-2 py-1 text-xs text-gray-300 outline-none focus:border-accent"
        />
      </td>
      <td className="px-3 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <button onClick={handleSubmit} className="rounded p-1 text-status-online transition-colors hover:bg-surface-700" title="Save">
            <Check className="h-3.5 w-3.5" />
          </button>
          <button onClick={onCancel} className="rounded p-1 text-gray-500 transition-colors hover:bg-surface-700 hover:text-gray-300" title="Cancel">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function PricingConfig() {
  const { pricing, updateModel, addModel, removeModel, resetToDefaults } = usePricing()
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)

  const grouped = {}
  for (const [id, entry] of Object.entries(pricing)) {
    const prov = entry.provider || 'unknown'
    if (!grouped[prov]) grouped[prov] = []
    grouped[prov].push({ id, ...entry })
  }

  const sortedProviders = PROVIDER_ORDER.filter((p) => grouped[p]?.length)

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3.5 transition-colors hover:bg-surface-800/30"
      >
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-gray-500" />
          <span className="text-[13px] font-semibold text-gray-200">Pricing Config</span>
          <span className="rounded-full bg-surface-700 px-2 py-0.5 text-[10px] text-gray-500">per 1M tokens</span>
        </div>
        <ChevronDown className={clsx('h-4 w-4 text-gray-500 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="border-t border-surface-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-surface-700 text-[11px] font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-3 py-2.5 w-32">Provider</th>
                  <th className="px-3 py-2.5">Model</th>
                  <th className="px-3 py-2.5 w-28">Input</th>
                  <th className="px-3 py-2.5 w-28">Output</th>
                  <th className="px-3 py-2.5 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {sortedProviders.map((prov) =>
                  grouped[prov].map((model, idx) => (
                    <tr key={model.id} className={clsx('border-t border-surface-700/50 transition-colors hover:bg-surface-800/20', idx === 0 && 'border-t-surface-700')}>
                      <td className="px-3 py-1.5 text-xs text-gray-500">
                        {idx === 0 ? (PROVIDER_LABELS[prov] || prov) : ''}
                      </td>
                      <td className="px-3 py-1.5 text-xs font-medium text-gray-300">
                        {model.name || model.id}
                      </td>
                      <td className="px-3 py-1.5">
                        <EditableCell
                          value={model.input}
                          onSave={(v) => updateModel(model.id, { input: v })}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <EditableCell
                          value={model.output}
                          onSave={(v) => updateModel(model.id, { output: v })}
                        />
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        {!(model.id in MODEL_PRICING) && (
                          <button
                            onClick={() => removeModel(model.id)}
                            className="rounded p-1 text-gray-600 transition-colors hover:bg-surface-700 hover:text-status-offline"
                            title="Remove"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
                {adding && (
                  <AddModelRow
                    onAdd={(m) => { addModel(m); setAdding(false) }}
                    onCancel={() => setAdding(false)}
                  />
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-surface-700 px-4 py-3">
            <button
              onClick={() => setAdding(true)}
              disabled={adding}
              className="flex items-center gap-1.5 rounded-lg border border-surface-600 bg-surface-800 px-3 py-1.5 text-[12px] font-medium text-gray-400 transition-colors hover:border-surface-500 hover:text-gray-200 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Model
            </button>
            <button
              onClick={resetToDefaults}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-gray-500 transition-colors hover:text-gray-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check, Terminal } from 'lucide-react'
import clsx from 'clsx'
import { MODEL_GROUPS } from '../../utils/constants'

export default function ModelSelector({ currentModelId, onModelChange }) {
  const [open, setOpen] = useState(false)
  const [customInputs, setCustomInputs] = useState({})
  const containerRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Find current model display name
  let currentLabel = currentModelId
  for (const group of MODEL_GROUPS) {
    const found = group.models.find((m) => m.id === currentModelId)
    if (found) {
      currentLabel = found.name
      break
    }
  }

  function handleSelect(modelId) {
    onModelChange(modelId)
    setOpen(false)
  }

  function handleCustomSubmit(provider, value) {
    if (!value.trim()) return
    onModelChange(value.trim())
    setOpen(false)
    setCustomInputs((prev) => ({ ...prev, [provider]: '' }))
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          'flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors',
          open
            ? 'border-accent/50 bg-surface-700 text-gray-100'
            : 'border-surface-600 bg-surface-800 text-gray-200 hover:border-surface-500 hover:bg-surface-700'
        )}
      >
        <span className="truncate">{currentLabel}</span>
        <ChevronDown
          className={clsx(
            'h-4 w-4 shrink-0 text-gray-500 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-72 rounded-xl border border-surface-600 bg-surface-800 py-1.5 shadow-2xl shadow-black/50">
          <div className="max-h-80 overflow-y-auto">
            {MODEL_GROUPS.map((group) => (
              <div key={group.provider}>
                {/* Provider header */}
                <div className="flex items-center gap-2 px-3.5 pb-1 pt-3 first:pt-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                    {group.label}
                  </span>
                </div>

                {/* Model options */}
                {group.models.map((model) => {
                  const isActive = model.id === currentModelId
                  return (
                    <button
                      key={model.id}
                      onClick={() => handleSelect(model.id)}
                      className={clsx(
                        'flex w-full items-center gap-2.5 px-3.5 py-1.5 text-left text-[13px] transition-colors',
                        isActive
                          ? 'bg-accent/10 text-gray-100'
                          : 'text-gray-300 hover:bg-surface-700/60 hover:text-gray-100'
                      )}
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                        {isActive && <Check className="h-3.5 w-3.5 text-accent" />}
                      </span>
                      <span className="truncate">{model.name}</span>
                    </button>
                  )
                })}

                {/* Custom model input */}
                {group.allowCustom && (
                  <div className="px-3.5 pb-2 pt-1">
                    <div className="flex items-center gap-1.5 rounded-md border border-surface-600 bg-surface-900 px-2.5 py-1.5">
                      <Terminal className="h-3 w-3 shrink-0 text-gray-600" />
                      <input
                        type="text"
                        value={customInputs[group.provider] || ''}
                        onChange={(e) =>
                          setCustomInputs((prev) => ({
                            ...prev,
                            [group.provider]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCustomSubmit(
                              group.provider,
                              customInputs[group.provider] || ''
                            )
                          }
                        }}
                        placeholder={group.customPlaceholder}
                        className="w-full bg-transparent text-xs text-gray-300 placeholder:text-gray-600 outline-none"
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-gray-600">
                      Press Enter to apply
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import clsx from 'clsx'

export default function MultiSelect({ options, selected, onChange, placeholder = 'All', className }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const allSelected = selected.length === 0 || selected.length === options.length
  const label = allSelected
    ? placeholder
    : selected.length === 1
      ? options.find((o) => o.value === selected[0])?.label || selected[0]
      : `${selected.length} selected`

  function toggle(value) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  function toggleAll() {
    onChange(allSelected ? [] : [])
  }

  return (
    <div ref={ref} className={clsx('relative', className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-surface-600 bg-surface-800 px-3 py-1.5 text-[12px] font-medium text-gray-400 transition-colors hover:border-surface-500 hover:text-gray-200"
      >
        <span className="max-w-[120px] truncate">{label}</span>
        <ChevronDown className={clsx('h-3 w-3 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-surface-600 bg-surface-800 py-1 shadow-xl shadow-black/40">
          <button
            onClick={toggleAll}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-surface-700"
          >
            <span className={clsx('flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border', allSelected ? 'border-accent bg-accent' : 'border-surface-500')}>
              {allSelected && <Check className="h-2.5 w-2.5 text-white" />}
            </span>
            <span className="text-gray-300">All</span>
          </button>

          <div className="my-1 h-px bg-surface-700" />

          <div className="max-h-48 overflow-y-auto">
            {options.map((opt) => {
              const checked = allSelected || selected.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-surface-700"
                >
                  <span className={clsx('flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border', checked ? 'border-accent bg-accent' : 'border-surface-500')}>
                    {checked && <Check className="h-2.5 w-2.5 text-white" />}
                  </span>
                  <span className="truncate text-gray-300">{opt.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

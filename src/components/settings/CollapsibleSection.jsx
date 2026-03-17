import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'

export default function CollapsibleSection({
  icon: Icon,
  title,
  subtitle,
  defaultOpen = true,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 overflow-hidden">
      {/* Header — always visible, clickable */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-800/30"
      >
        {Icon && <Icon className="h-4 w-4 shrink-0 text-gray-500" />}
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-semibold text-gray-200">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-[11px] text-gray-600">{subtitle}</p>
          )}
        </div>
        <ChevronDown
          className={clsx(
            'h-4 w-4 shrink-0 text-gray-600 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Content */}
      {open && (
        <div className="border-t border-surface-700 px-5 pb-5 pt-4">
          {children}
        </div>
      )}
    </div>
  )
}

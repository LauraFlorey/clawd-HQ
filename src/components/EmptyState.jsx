import { Inbox, AlertCircle, WifiOff, FileSearch } from 'lucide-react'

const ICONS = {
  empty: Inbox,
  error: AlertCircle,
  offline: WifiOff,
  search: FileSearch,
}

/**
 * Generic empty state component.
 * @param {{ variant, title, message, action }} props
 */
export default function EmptyState({
  variant = 'empty',
  title = 'No data yet',
  message = 'Data will appear here once available.',
  action,
}) {
  const Icon = ICONS[variant] ?? ICONS.empty

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-800">
        <Icon className="h-5 w-5 text-gray-600" />
      </div>
      <h4 className="text-sm font-medium text-gray-400">{title}</h4>
      <p className="mt-1 max-w-xs text-xs text-gray-600">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

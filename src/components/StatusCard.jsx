import clsx from 'clsx'

export default function StatusCard({ label, value, icon: Icon, trend }) {
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <Icon className="h-4 w-4 text-gray-600" />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-gray-100">{value}</span>
        <span
          className={clsx(
            'text-xs font-medium',
            trend === 'online' && 'text-status-online',
            trend === 'up' && 'text-status-warning',
            trend === 'down' && 'text-status-error',
            trend === 'stable' && 'text-gray-500'
          )}
        >
          {trend === 'online' ? '● live' : trend}
        </span>
      </div>
    </div>
  )
}

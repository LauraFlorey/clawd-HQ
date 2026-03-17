import clsx from 'clsx'

/**
 * Reusable loading skeleton / spinner used while data hooks resolve.
 */

export function LoadingSkeleton({ className, lines = 3 }) {
  return (
    <div className={clsx('animate-pulse space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 rounded bg-surface-700"
          style={{ width: `${70 + (i % 3) * 10}%` }}
        />
      ))}
    </div>
  )
}

export function LoadingCard({ className, height = 'h-48' }) {
  return (
    <div
      className={clsx(
        'flex items-center justify-center rounded-xl border border-surface-700 bg-surface-900',
        height,
        className
      )}
    >
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <Spinner />
        Loading...
      </div>
    </div>
  )
}

export function Spinner({ className }) {
  return (
    <svg
      className={clsx('h-4 w-4 animate-spin text-gray-500', className)}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

export function LoadingRow() {
  return (
    <div className="animate-pulse flex items-center gap-3 px-5 py-3">
      <div className="h-2.5 w-2.5 rounded-full bg-surface-700" />
      <div className="h-3 w-24 rounded bg-surface-700" />
      <div className="ml-auto h-3 w-16 rounded bg-surface-700" />
    </div>
  )
}

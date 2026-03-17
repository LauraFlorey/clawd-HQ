import clsx from 'clsx'

export default function PlaceholderPage({ title, description, icon: Icon, accentColor = 'text-accent' }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      {Icon && (
        <div className={clsx('mb-6 rounded-2xl bg-surface-800/60 p-6 ring-1 ring-surface-700', accentColor)}>
          <Icon className="h-12 w-12 opacity-40" />
        </div>
      )}
      <h1 className="text-xl font-bold tracking-tight text-gray-100 sm:text-2xl">{title}</h1>
      <p className="mt-2 text-sm font-medium text-gray-500">Coming Soon</p>
      {description && (
        <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-gray-600">{description}</p>
      )}
    </div>
  )
}

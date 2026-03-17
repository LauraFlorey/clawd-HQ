import { Palette, Sun, Moon } from 'lucide-react'
import clsx from 'clsx'
import CollapsibleSection from './CollapsibleSection'

export default function DisplayPreferencesSection({ display, onUpdate }) {
  return (
    <CollapsibleSection
      icon={Palette}
      title="Display Preferences"
      subtitle="Customize how data is shown in the dashboard"
      defaultOpen={false}
    >
      <div className="space-y-5">
        {/* Currency */}
        <SettingRow
          label="Currency"
          description="Display currency for cost values"
        >
          <select
            value={display.currency}
            onChange={(e) => onUpdate({ currency: e.target.value })}
            className="settings-select w-28"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="CAD">CAD (C$)</option>
            <option value="AUD">AUD (A$)</option>
          </select>
        </SettingRow>

        {/* Default Time Period */}
        <SettingRow
          label="Default Time Period"
          description="Default range for charts and tables"
        >
          <div className="flex items-center gap-1 rounded-lg bg-surface-800 p-0.5">
            {[
              { value: 7, label: '7 days' },
              { value: 30, label: '30 days' },
              { value: 90, label: '90 days' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => onUpdate({ defaultTimePeriod: opt.value })}
                className={clsx(
                  'rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors',
                  display.defaultTimePeriod === opt.value
                    ? 'bg-surface-600 text-gray-100 shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </SettingRow>

        {/* Token Display Format */}
        <SettingRow
          label="Token Display"
          description="How token counts are displayed"
        >
          <div className="flex items-center gap-1 rounded-lg bg-surface-800 p-0.5">
            {[
              { value: 'abbreviated', label: '1.2M' },
              { value: 'raw', label: '1,234,567' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => onUpdate({ tokenFormat: opt.value })}
                className={clsx(
                  'rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors',
                  display.tokenFormat === opt.value
                    ? 'bg-surface-600 text-gray-100 shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </SettingRow>

        {/* Theme */}
        <SettingRow
          label="Theme"
          description="Dashboard color scheme"
        >
          <div className="flex items-center gap-2">
            {[
              { value: 'dark', label: 'Dark', icon: Moon },
              { value: 'light', label: 'Light', icon: Sun },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => onUpdate({ theme: opt.value })}
                className={clsx(
                  'flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[12px] font-medium transition-colors',
                  display.theme === opt.value
                    ? 'border-accent/40 bg-accent/10 text-gray-100'
                    : 'border-surface-600 bg-surface-800 text-gray-500 hover:border-surface-500 hover:text-gray-300'
                )}
              >
                <opt.icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            ))}
            {display.theme === 'light' && (
              <span className="text-[10px] text-gray-600 ml-1">
                (Coming soon)
              </span>
            )}
          </div>
        </SettingRow>
      </div>
    </CollapsibleSection>
  )
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-gray-300">{label}</p>
        {description && (
          <p className="text-[11px] text-gray-600">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

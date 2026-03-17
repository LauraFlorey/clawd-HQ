import { useState } from 'react'
import { CheckSquare, Check, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import CollapsibleSection from './CollapsibleSection'

// TODO: Wire up Todoist/Asana/Linear API calls when integration is configured

const PROVIDERS = [
  { id: 'none', label: 'None (local only)' },
  { id: 'todoist', label: 'Todoist' },
  { id: 'asana', label: 'Asana' },
  { id: 'linear', label: 'Linear' },
]

export default function TaskIntegrationSection({ taskIntegration, onUpdate }) {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  function handleTest() {
    if (taskIntegration.provider === 'none') return
    setTesting(true)
    setTestResult(null)
    setTimeout(() => {
      setTesting(false)
      setTestResult(taskIntegration.apiKey ? 'success' : 'error')
    }, 1200)
  }

  const isConfigured = taskIntegration.provider !== 'none'

  return (
    <CollapsibleSection
      icon={CheckSquare}
      title="Task Integration"
      subtitle="Connect a task manager to auto-create approved tasks"
      defaultOpen={false}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-400">Task Manager</label>
          <select
            value={taskIntegration.provider}
            onChange={(e) => { onUpdate({ provider: e.target.value }); setTestResult(null) }}
            className="settings-input w-full max-w-xs"
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>

        {isConfigured && (
          <>
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-400">API Key</label>
              <input
                type="password"
                value={taskIntegration.apiKey}
                onChange={(e) => { onUpdate({ apiKey: e.target.value }); setTestResult(null) }}
                placeholder="Paste your API key"
                className="settings-input w-full max-w-md"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-gray-400">
                Default Project / List
              </label>
              <input
                type="text"
                value={taskIntegration.defaultProject}
                onChange={(e) => onUpdate({ defaultProject: e.target.value })}
                placeholder={taskIntegration.provider === 'todoist' ? 'Inbox' : taskIntegration.provider === 'asana' ? 'My Tasks' : 'Backlog'}
                className="settings-input w-full max-w-md"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleTest}
                disabled={testing || !taskIntegration.apiKey}
                className="flex items-center gap-1.5 rounded-lg border border-surface-600 bg-surface-800 px-3 py-1.5 text-[12px] font-medium text-gray-400 transition-colors hover:border-surface-500 hover:text-gray-200 disabled:opacity-40"
              >
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckSquare className="h-3.5 w-3.5" />}
                Test Connection
              </button>
              {testResult === 'success' && (
                <span className="flex items-center gap-1 text-[11px] text-status-online">
                  <Check className="h-3 w-3" /> Connected
                </span>
              )}
              {testResult === 'error' && (
                <span className="text-[11px] text-status-offline">Connection failed — check API key</span>
              )}
            </div>
          </>
        )}

        <p className="text-[10px] text-gray-600">
          When configured, approved tasks from the transcript processor will be created in your task manager automatically.
        </p>
      </div>
    </CollapsibleSection>
  )
}

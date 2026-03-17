import { useState } from 'react'
import {
  Users, Mail, CalendarDays, Shield, Bot, History,
  X, Loader2, ChevronRight, RefreshCw,
} from 'lucide-react'
import clsx from 'clsx'
import CollapsibleSection from './CollapsibleSection'
import { formatDate, formatRelativeTime } from '../../utils/formatters'

// ─── Shared Tag Input ───────────────────────────────────────────

function SettingsTagInput({ tags, onChange, placeholder = 'Add...', lowercase }) {
  const [input, setInput] = useState('')

  function addTag(raw) {
    const t = lowercase ? raw.trim().toLowerCase() : raw.trim()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (input.trim()) addTag(input)
    }
    if (e.key === 'Backspace' && !input && tags.length) onChange(tags.slice(0, -1))
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 focus-within:border-accent/50 max-w-lg">
      {tags.map((t) => (
        <span key={t} className="flex items-center gap-1 rounded-full bg-surface-700 px-2 py-0.5 text-[11px] font-medium text-gray-400">
          {t}
          <button onClick={() => onChange(tags.filter((x) => x !== t))} className="ml-0.5 text-gray-600 hover:text-gray-300">
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="min-w-[80px] flex-1 bg-transparent text-xs text-gray-300 outline-none placeholder:text-gray-600"
      />
    </div>
  )
}

// ─── Toggle ─────────────────────────────────────────────────────

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? 'bg-accent' : 'bg-surface-600'
        )}
      >
        <span className={clsx('absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', checked && 'translate-x-4')} />
      </button>
      <div>
        <span className="text-xs font-medium text-gray-300">{label}</span>
        {description && <p className="mt-0.5 text-[10px] text-gray-600">{description}</p>}
      </div>
    </label>
  )
}

// ─── Connection Card ────────────────────────────────────────────

function ConnectionCard({ icon: Icon, title, connected, email, lastSync, children, onConnect, onSync, syncing }) {
  const [showOAuth, setShowOAuth] = useState(false)

  return (
    <div className="rounded-lg border border-surface-700 bg-surface-800/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-500" />
          <h4 className="text-[13px] font-semibold text-gray-200">{title}</h4>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-status-online">
              <span className="h-2 w-2 rounded-full bg-status-online animate-pulse" />
              Connected
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
              <span className="h-2 w-2 rounded-full bg-gray-600" />
              Not Connected
            </span>
          )}
        </div>
      </div>

      {connected && email && (
        <p className="text-[11px] text-gray-500">Account: <span className="text-gray-400">{email}</span></p>
      )}
      {connected && lastSync && (
        <p className="text-[11px] text-gray-500">Last sync: <span className="text-gray-400">{formatRelativeTime(lastSync)}</span></p>
      )}

      {!connected && (
        <>
          <button
            onClick={() => setShowOAuth(true)}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-accent/90"
          >
            {/* TODO: Gmail/Calendar OAuth flow via Jinx backend */}
            Connect {title}
          </button>
          {showOAuth && (
            <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
              <p className="text-[11px] text-gray-400 leading-relaxed">
                <strong className="text-gray-300">OAuth Setup Required</strong><br />
                {title} connection requires OAuth credentials configured in the Jinx backend.
                Set up a Google Cloud project with the {title === 'Gmail' ? 'Gmail API' : 'Google Calendar API'} enabled,
                then add the credentials to your Jinx configuration.
              </p>
              <button onClick={() => setShowOAuth(false)} className="mt-2 text-[10px] text-gray-600 hover:text-gray-400">Dismiss</button>
            </div>
          )}
        </>
      )}

      {connected && (
        <div className="flex items-center gap-2">
          <button
            onClick={onSync}
            disabled={syncing}
            className="flex items-center gap-1.5 rounded-lg border border-surface-600 bg-surface-800 px-3 py-1.5 text-[12px] font-medium text-gray-400 transition-colors hover:border-surface-500 hover:text-gray-200 disabled:opacity-40"
          >
            {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Sync Now
          </button>
        </div>
      )}

      {children}
    </div>
  )
}

// ─── Gmail Section ──────────────────────────────────────────────

function GmailSettings({ gmail, onUpdate }) {
  const [syncing, setSyncing] = useState(false)

  function handleSync() {
    // TODO: Trigger Gmail sync via Jinx API — POST /api/crm/sync/gmail
    setSyncing(true)
    setTimeout(() => {
      onUpdate({ gmail: { ...gmail, lastSync: new Date().toISOString() } })
      setSyncing(false)
    }, 1500)
  }

  return (
    <ConnectionCard
      icon={Mail}
      title="Gmail"
      connected={gmail.connected}
      email={gmail.email}
      lastSync={gmail.lastSync}
      onConnect={() => {}}
      onSync={handleSync}
      syncing={syncing}
    >
      <div className="space-y-3 pt-1">
        <div>
          <label className="mb-1.5 block text-[11px] font-medium text-gray-500">Scan Range</label>
          <select
            value={gmail.scanDays}
            onChange={(e) => onUpdate({ gmail: { ...gmail, scanDays: Number(e.target.value) } })}
            className="settings-input w-36"
          >
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        <Toggle
          checked={gmail.autoSync}
          onChange={(v) => onUpdate({ gmail: { ...gmail, autoSync: v } })}
          label="Auto-sync"
          description="Jinx periodically scans for new contacts from Gmail"
        />

        {gmail.autoSync && (
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-gray-500">Sync Interval</label>
            <select
              value={gmail.autoSyncInterval}
              onChange={(e) => onUpdate({ gmail: { ...gmail, autoSyncInterval: e.target.value } })}
              className="settings-input w-36"
            >
              <option value="daily">Daily</option>
              <option value="12h">Every 12 hours</option>
              <option value="6h">Every 6 hours</option>
            </select>
          </div>
        )}
      </div>
    </ConnectionCard>
  )
}

// ─── Calendar Section ───────────────────────────────────────────

function CalendarSettings({ calendar, onUpdate }) {
  const [syncing, setSyncing] = useState(false)

  function handleSync() {
    // TODO: Trigger Calendar sync via Jinx API — POST /api/crm/sync/calendar
    setSyncing(true)
    setTimeout(() => {
      onUpdate({ calendar: { ...calendar, lastSync: new Date().toISOString() } })
      setSyncing(false)
    }, 1500)
  }

  return (
    <ConnectionCard
      icon={CalendarDays}
      title="Google Calendar"
      connected={calendar.connected}
      lastSync={calendar.lastSync}
      onConnect={() => {}}
      onSync={handleSync}
      syncing={syncing}
    >
      <div className="space-y-3 pt-1">
        <div className="grid grid-cols-2 gap-3 max-w-xs">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-gray-500">Max Attendees</label>
            <input
              type="number"
              value={calendar.maxAttendees}
              onChange={(e) => onUpdate({ calendar: { ...calendar, maxAttendees: Math.max(1, Number(e.target.value) || 1) } })}
              min={1}
              max={100}
              className="settings-input w-full"
            />
            <p className="mt-0.5 text-[9px] text-gray-600">Skip large meetings</p>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-gray-500">Min Duration (min)</label>
            <input
              type="number"
              value={calendar.minDuration}
              onChange={(e) => onUpdate({ calendar: { ...calendar, minDuration: Math.max(0, Number(e.target.value) || 0) } })}
              min={0}
              max={120}
              className="settings-input w-full"
            />
            <p className="mt-0.5 text-[9px] text-gray-600">Skip very short meetings</p>
          </div>
        </div>
      </div>
    </ConnectionCard>
  )
}

// ─── Filtering Rules ────────────────────────────────────────────

function FilteringSettings({ filtering, onUpdate }) {
  function update(field, value) {
    onUpdate({ filtering: { ...filtering, [field]: value } })
  }

  return (
    <div className="rounded-lg border border-surface-700 bg-surface-800/30 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-gray-500" />
        <h4 className="text-[13px] font-semibold text-gray-200">Contact Filtering Rules</h4>
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-medium text-gray-500">My Email Addresses (excluded from contacts)</label>
        <SettingsTagInput
          tags={filtering.myEmails}
          onChange={(v) => update('myEmails', v)}
          placeholder="Add your email..."
          lowercase
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-medium text-gray-500">Excluded Domains (no-reply, marketing, etc.)</label>
        <SettingsTagInput
          tags={filtering.skipDomains}
          onChange={(v) => update('skipDomains', v)}
          placeholder="Add domain..."
          lowercase
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-medium text-gray-500">Excluded Contacts (specific emails to never import)</label>
        <SettingsTagInput
          tags={filtering.excludedContacts}
          onChange={(v) => update('excludedContacts', v)}
          placeholder="Add email..."
          lowercase
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[11px] font-medium text-gray-500">Preferred Titles (boost contact score)</label>
        <SettingsTagInput
          tags={filtering.preferTitles}
          onChange={(v) => update('preferTitles', v)}
          placeholder="Add title..."
        />
        <p className="mt-1 text-[9px] text-gray-600">Contacts with these titles get +15 to their relationship score.</p>
      </div>
    </div>
  )
}

// ─── AI Classification ──────────────────────────────────────────

const AI_MODELS = [
  { id: 'haiku-4.5', label: 'Claude Haiku 4.5 (fastest, cheapest)' },
  { id: 'gemini-flash', label: 'Gemini 2.5 Flash (fast, cheap)' },
]

function AiClassificationSettings({ aiClassification, onUpdate }) {
  function update(field, value) {
    onUpdate({ aiClassification: { ...aiClassification, [field]: value } })
  }

  return (
    <div className="rounded-lg border border-surface-700 bg-surface-800/30 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-gray-500" />
        <h4 className="text-[13px] font-semibold text-gray-200">AI Classification</h4>
      </div>

      <Toggle
        checked={aiClassification.enabled}
        onChange={(v) => update('enabled', v)}
        label="Use AI to filter noise contacts"
        description="Jinx uses a cheap model to classify whether extracted contacts are real professional relationships"
      />

      {aiClassification.enabled && (
        <>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-gray-500">Classification Model</label>
            <select
              value={aiClassification.model}
              onChange={(e) => update('model', e.target.value)}
              className="settings-input w-full max-w-sm"
            >
              {AI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            <p className="mt-1 text-[9px] text-gray-600">Only cheap, fast models — classification runs per-contact during sync.</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-medium text-gray-500">Confidence Threshold</label>
              <span className="text-[11px] font-semibold text-gray-300">{aiClassification.confidenceThreshold}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={aiClassification.confidenceThreshold}
              onChange={(e) => update('confidenceThreshold', Number(e.target.value))}
              className="w-full max-w-sm accent-accent"
            />
            <div className="flex justify-between max-w-sm text-[9px] text-gray-600 mt-0.5">
              <span>0% (approve all)</span>
              <span>100% (very strict)</span>
            </div>
            <p className="mt-1 text-[9px] text-gray-600">
              Only approve contacts the AI is &ge;{aiClassification.confidenceThreshold}% confident are real professional contacts.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Sync History ───────────────────────────────────────────────

const MOCK_SYNC_HISTORY = [
  {
    id: 'sync-001',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    duration: '12s',
    source: 'gmail',
    contactsFound: 8,
    approved: 5,
    rejected: 2,
    merged: 1,
    errors: 0,
    details: [
      { email: 'jchen@infirmaryhealth.org', action: 'merged', reason: 'Already exists — updated interaction count' },
      { email: 'newvendor@example.com', action: 'approved', reason: 'Professional domain, clear business context' },
      { email: 'newsletter@marketing.io', action: 'rejected', reason: 'Marketing domain in skip list' },
    ],
  },
  {
    id: 'sync-002',
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    duration: '8s',
    source: 'calendar',
    contactsFound: 4,
    approved: 3,
    rejected: 0,
    merged: 1,
    errors: 0,
    details: [
      { email: 'abrooks@usahealth.edu', action: 'merged', reason: 'Already exists — added meeting interaction' },
      { email: 'recruiter@staffing.com', action: 'approved', reason: 'New contact from 1:1 meeting' },
    ],
  },
  {
    id: 'sync-003',
    date: new Date(Date.now() - 9 * 86400000).toISOString(),
    duration: '15s',
    source: 'gmail',
    contactsFound: 12,
    approved: 7,
    rejected: 4,
    merged: 1,
    errors: 0,
    details: [],
  },
]

function SyncHistorySection({ syncHistory }) {
  const history = syncHistory.length > 0 ? syncHistory : MOCK_SYNC_HISTORY
  const [expandedId, setExpandedId] = useState(null)

  return (
    <div className="rounded-lg border border-surface-700 bg-surface-800/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-gray-500" />
        <h4 className="text-[13px] font-semibold text-gray-200">Sync History</h4>
        <span className="rounded-full bg-surface-700 px-2 py-0.5 text-[10px] text-gray-500">{history.length} runs</span>
      </div>

      {history.length === 0 ? (
        <p className="text-xs text-gray-600 italic">No sync runs yet. Connect Gmail or Calendar to get started.</p>
      ) : (
        <div className="space-y-1">
          {history.slice(0, 10).map((run) => (
            <div key={run.id} className="rounded-lg border border-surface-700/50">
              <button
                onClick={() => setExpandedId(expandedId === run.id ? null : run.id)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-surface-800/40"
              >
                <span className={clsx('h-2 w-2 rounded-full shrink-0',
                  run.errors > 0 ? 'bg-status-offline' : 'bg-status-online'
                )} />
                <span className="text-[11px] text-gray-400 w-20 shrink-0">{formatDate(run.date)}</span>
                <span className="text-[10px] text-gray-600 w-8 shrink-0">{run.duration}</span>
                <span className={clsx('rounded-full px-1.5 py-0.5 text-[9px] font-medium shrink-0',
                  run.source === 'gmail' ? 'bg-blue-400/10 text-blue-400' : 'bg-emerald-400/10 text-emerald-400'
                )}>
                  {run.source === 'gmail' ? 'Gmail' : 'Calendar'}
                </span>
                <div className="flex-1 flex items-center gap-2 text-[10px] text-gray-600">
                  <span>{run.contactsFound} found</span>
                  <span className="text-status-online">{run.approved} approved</span>
                  {run.rejected > 0 && <span className="text-status-offline">{run.rejected} rejected</span>}
                  {run.merged > 0 && <span className="text-accent">{run.merged} merged</span>}
                  {run.errors > 0 && <span className="text-status-offline">{run.errors} errors</span>}
                </div>
                <ChevronRight className={clsx('h-3 w-3 text-gray-600 transition-transform shrink-0', expandedId === run.id && 'rotate-90')} />
              </button>

              {expandedId === run.id && run.details.length > 0 && (
                <div className="border-t border-surface-700/30 px-3 py-2 space-y-1.5">
                  {run.details.map((d, i) => (
                    <div key={i} className="flex items-start gap-2 text-[10px]">
                      <span className={clsx('mt-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium shrink-0',
                        d.action === 'approved' ? 'bg-status-online/10 text-status-online' :
                        d.action === 'rejected' ? 'bg-status-offline/10 text-status-offline' :
                        'bg-accent/10 text-accent'
                      )}>
                        {d.action}
                      </span>
                      <span className="text-gray-400 font-mono shrink-0">{d.email}</span>
                      <span className="text-gray-600">{d.reason}</span>
                    </div>
                  ))}
                </div>
              )}

              {expandedId === run.id && run.details.length === 0 && (
                <div className="border-t border-surface-700/30 px-3 py-2">
                  <p className="text-[10px] text-gray-600 italic">Detailed per-contact log not available for this run.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Section ───────────────────────────────────────────────

export default function CrmIntegrationSection({ crm, onUpdate }) {
  return (
    <CollapsibleSection
      icon={Users}
      title="CRM Integration"
      subtitle="Configure contact sync from Gmail and Google Calendar"
      defaultOpen={false}
    >
      <div className="space-y-4">
        <p className="text-[10px] text-gray-600 leading-relaxed">
          Jinx scans your email and calendar to discover professional contacts, score them based on interaction frequency,
          and keep your CRM up to date automatically. Configure the data sources and filtering rules below.
        </p>

        {/* Stale contact threshold */}
        <div className="flex items-center gap-3">
          <label className="text-[11px] font-medium text-gray-500 shrink-0">Stale contact alert after</label>
          <select
            value={crm.staleDays}
            onChange={(e) => onUpdate({ staleDays: Number(e.target.value) })}
            className="settings-input w-28"
          >
            <option value={14}>14 days</option>
            <option value={21}>21 days</option>
            <option value={30}>30 days</option>
            <option value={45}>45 days</option>
            <option value={60}>60 days</option>
          </select>
          <span className="text-[10px] text-gray-600">Contacts not reached within this period trigger a follow-up alert.</span>
        </div>

        {/* 1. Gmail */}
        <GmailSettings gmail={crm.gmail} onUpdate={onUpdate} />

        {/* 2. Calendar */}
        <CalendarSettings calendar={crm.calendar} onUpdate={onUpdate} />

        {/* 3. Filtering */}
        <FilteringSettings filtering={crm.filtering} onUpdate={onUpdate} />

        {/* 4. AI Classification */}
        <AiClassificationSettings aiClassification={crm.aiClassification} onUpdate={onUpdate} />

        {/* 5. Sync History */}
        <SyncHistorySection syncHistory={crm.syncHistory} />
      </div>
    </CollapsibleSection>
  )
}

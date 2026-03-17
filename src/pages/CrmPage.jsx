import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  Plus, Search, X, ChevronRight, ChevronDown,
  Mail, CalendarDays, User, Trash2, Archive,
  Send, Bot, Sparkles, Phone, Building2, Tag,
  AlertTriangle, Clock,
} from 'lucide-react'
import clsx from 'clsx'
import { useSearchParams } from 'react-router-dom'
import { useContacts, handleNLQuery, calculateScore } from '../hooks/useContacts'
import { useSettings } from '../hooks/useSettings'
import { formatRelativeTime, formatDate } from '../utils/formatters'
import MultiSelect from '../components/ui/MultiSelect'

// ─── Score Ring ──────────────────────────────────────────────────

function ScoreRing({ score, size = 36 }) {
  const r = (size - 6) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" className="text-surface-700" strokeWidth={3} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={3} fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="text-[10px] font-bold" style={{ color }}>{score}</span>
    </div>
  )
}

// ─── Source Icon ─────────────────────────────────────────────────

function SourceIcon({ source }) {
  if (source === 'both') {
    return (
      <div className="flex items-center gap-0.5">
        <Mail className="h-3 w-3 text-blue-400" />
        <CalendarDays className="h-3 w-3 text-emerald-400" />
      </div>
    )
  }
  if (source === 'calendar') return <CalendarDays className="h-3.5 w-3.5 text-emerald-400" />
  if (source === 'email') return <Mail className="h-3.5 w-3.5 text-blue-400" />
  return <User className="h-3.5 w-3.5 text-gray-500" />
}

// ─── Tag Input ──────────────────────────────────────────────────

function TagInput({ tags, onChange, suggestions }) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const ref = useRef(null)

  const filtered = useMemo(
    () => suggestions.filter((t) => t.includes(input.toLowerCase()) && !tags.includes(t)).slice(0, 8),
    [suggestions, input, tags]
  )

  function addTag(tag) {
    const t = tag.trim().toLowerCase()
    if (t && !tags.includes(t)) onChange([...tags, t])
    setInput('')
    setShowSuggestions(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (input.trim()) addTag(input)
    }
    if (e.key === 'Backspace' && !input && tags.length) onChange(tags.slice(0, -1))
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 focus-within:border-accent/50">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
            {t}
            <button onClick={() => onChange(tags.filter((x) => x !== t))} className="ml-0.5 text-accent/60 hover:text-accent">
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <input
          ref={ref}
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true) }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? 'Add tags...' : ''}
          className="min-w-[80px] flex-1 bg-transparent text-xs text-gray-300 outline-none placeholder:text-gray-600"
        />
      </div>
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-surface-600 bg-surface-800 py-1 shadow-xl">
          {filtered.map((t) => (
            <button key={t} onMouseDown={() => addTag(t)} className="block w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-surface-700">
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Add Contact Modal ──────────────────────────────────────────

function AddContactModal({ onSave, onClose, allTags, allCompanies }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [phone, setPhone] = useState('')
  const [tags, setTags] = useState([])
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState({})
  const [companyOpen, setCompanyOpen] = useState(false)
  const companyRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (companyRef.current && !companyRef.current.contains(e.target)) setCompanyOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const companyMatches = useMemo(
    () => company ? allCompanies.filter((c) => c.toLowerCase().includes(company.toLowerCase())).slice(0, 5) : [],
    [company, allCompanies]
  )

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!name.trim()) errs.name = 'Name is required'
    if (!email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Invalid email'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onSave({ name: name.trim(), email: email.trim(), company: company.trim() || null, role: role.trim() || null, phone: phone.trim() || null, tags, notes: notes.trim() || null })
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-surface-700 bg-surface-900 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-surface-700 px-5 py-3.5">
          <h3 className="text-[13px] font-semibold text-gray-200">Add Contact</h3>
          <button onClick={onClose} className="rounded-md p-1 text-gray-600 transition-colors hover:bg-surface-700 hover:text-gray-300"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">Name *</label>
            <input type="text" value={name} onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: null })) }} className={clsx('settings-input', errors.name && 'border-status-offline/50')} placeholder="Full name" autoFocus />
            {errors.name && <p className="mt-0.5 text-[10px] text-status-offline">{errors.name}</p>}
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">Email *</label>
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: null })) }} className={clsx('settings-input', errors.email && 'border-status-offline/50')} placeholder="email@example.com" />
            {errors.email && <p className="mt-0.5 text-[10px] text-status-offline">{errors.email}</p>}
          </div>
          <div ref={companyRef} className="relative">
            <label className="mb-1 block text-[11px] font-medium text-gray-500">Company</label>
            <input type="text" value={company} onChange={(e) => { setCompany(e.target.value); setCompanyOpen(true) }} onFocus={() => setCompanyOpen(true)} className="settings-input" placeholder="Company name" />
            {companyOpen && companyMatches.length > 0 && (
              <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-surface-600 bg-surface-800 py-1 shadow-xl">
                {companyMatches.map((c) => (
                  <button key={c} type="button" onMouseDown={() => { setCompany(c); setCompanyOpen(false) }} className="block w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-surface-700">{c}</button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-500">Role/Title</label>
              <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className="settings-input" placeholder="e.g. Director of IT" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-500">Phone</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="settings-input" placeholder="Optional" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">Tags</label>
            <TagInput tags={tags} onChange={setTags} suggestions={allTags} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Personal notes about this contact..." rows={2} className="settings-input resize-none" />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg border border-surface-600 bg-surface-800 px-3.5 py-2 text-[12px] font-medium text-gray-400 transition-colors hover:border-surface-500 hover:text-gray-200">Cancel</button>
            <button type="submit" className="rounded-lg bg-accent px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-accent/90">Add Contact</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Interaction Timeline ───────────────────────────────────────

function InteractionTimeline({ interactions }) {
  if (!interactions?.length) {
    return <p className="text-xs text-gray-600 italic">No recorded interactions yet.</p>
  }
  return (
    <div className="relative pl-5">
      <div className="absolute left-[7px] top-1 bottom-1 w-px bg-surface-700" />
      {interactions.map((ix, i) => (
        <div key={i} className="relative mb-3 last:mb-0">
          <div className={clsx('absolute -left-5 top-1 h-3 w-3 rounded-full border-2 border-surface-900',
            ix.type === 'meeting' ? 'bg-emerald-400' : 'bg-blue-400'
          )} />
          <div className="ml-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] text-gray-600">{formatDate(ix.date)}</span>
              <span className={clsx('rounded-full px-1.5 py-0.5 text-[9px] font-medium',
                ix.type === 'meeting' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-blue-400/10 text-blue-400'
              )}>
                {ix.type === 'meeting' ? 'Meeting' : 'Email'}
              </span>
            </div>
            <p className="text-[12px] font-medium text-gray-300">{ix.subject}</p>
            {ix.snippet && <p className="mt-0.5 text-[11px] text-gray-500">{ix.snippet}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Contact Detail Panel ───────────────────────────────────────

function ContactDetail({ contact, allTags, onUpdateTags, onUpdateNotes, onArchive, onDelete, canModify }) {
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState(contact.notes || '')

  function saveNotes() {
    onUpdateNotes(notesDraft.trim() || null)
    setEditingNotes(false)
  }

  return (
    <div className="border-t border-surface-700/30 bg-surface-800/10 px-4 py-4 sm:px-6 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr]">
        {/* Left: info card */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-gray-500" />
            <h4 className="text-[13px] font-semibold text-gray-200">Contact Info</h4>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3 text-gray-600" />
              <a href={`mailto:${contact.email}`} className="text-accent hover:underline">{contact.email}</a>
            </div>
            {contact.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-gray-600" />
                <span className="text-gray-400">{contact.phone}</span>
              </div>
            )}
            {contact.company && (
              <div className="flex items-center gap-2">
                <Building2 className="h-3 w-3 text-gray-600" />
                <span className="text-gray-400">{contact.company}</span>
              </div>
            )}
            {contact.role && (
              <div className="flex items-center gap-2">
                <Tag className="h-3 w-3 text-gray-600" />
                <span className="text-gray-400">{contact.role}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="pt-2">
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-gray-600">Tags</label>
            {canModify ? (
              <TagInput tags={contact.tags || []} onChange={onUpdateTags} suggestions={allTags} />
            ) : (
              <div className="flex flex-wrap gap-1">
                {(contact.tags || []).map((t) => (
                  <span key={t} className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-medium uppercase tracking-wider text-gray-600">Notes</label>
              {canModify && !editingNotes && (
                <button onClick={() => { setNotesDraft(contact.notes || ''); setEditingNotes(true) }} className="text-[10px] text-gray-600 hover:text-gray-400">Edit</button>
              )}
            </div>
            {editingNotes ? (
              <div>
                <textarea value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} rows={3} className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-xs text-gray-300 outline-none focus:border-accent/50 resize-none" autoFocus />
                <div className="flex gap-2 mt-1.5">
                  <button onClick={saveNotes} className="rounded-md bg-accent px-2.5 py-1 text-[11px] font-medium text-white hover:bg-accent/90">Save</button>
                  <button onClick={() => setEditingNotes(false)} className="text-[11px] text-gray-500 hover:text-gray-300">Cancel</button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">{contact.notes || 'No notes.'}</p>
            )}
          </div>

          {/* Actions */}
          {canModify && (
            <div className="flex items-center gap-2 pt-2">
              <button onClick={onArchive} className="flex items-center gap-1 rounded-md border border-surface-600 px-2 py-1 text-[11px] text-gray-500 transition-colors hover:text-gray-300">
                <Archive className="h-3 w-3" /> Archive
              </button>
              <button onClick={onDelete} className="flex items-center gap-1 rounded-md border border-surface-600 px-2 py-1 text-[11px] text-status-offline transition-colors hover:bg-status-offline/10">
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </div>
          )}
        </div>

        {/* Right: timeline */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="h-4 w-4 text-gray-500" />
            <h4 className="text-[13px] font-semibold text-gray-200">Interaction Timeline</h4>
            <span className="rounded-full bg-surface-700 px-2 py-0.5 text-[10px] text-gray-500">{contact.interactions?.length || 0}</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto pr-2">
            <InteractionTimeline interactions={contact.interactions} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Contact Row ────────────────────────────────────────────────

function ContactRow({ contact, expanded, onToggle, allTags, onUpdateTags, onUpdateNotes, onArchive, onDelete }) {
  const canModify = !contact.isMock

  return (
    <div className="border-t border-surface-700/50 first:border-t-0">
      <div
        className={clsx('flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-800/30 cursor-pointer', expanded && 'bg-surface-800/20')}
        onClick={onToggle}
      >
        <ScoreRing score={contact.score} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-gray-200">{contact.name}</p>
          {contact.company && <p className="truncate text-[11px] text-gray-500">{contact.company}</p>}
        </div>

        <span className="hidden text-[11px] text-gray-500 md:block truncate max-w-[140px]">{contact.role || '—'}</span>

        <div className="hidden items-center gap-1.5 lg:flex">
          {(contact.tags || []).slice(0, 2).map((t) => (
            <span key={t} className="rounded-full bg-surface-700 px-2 py-0.5 text-[10px] text-gray-500">{t}</span>
          ))}
          {(contact.tags || []).length > 2 && <span className="text-[10px] text-gray-600">+{contact.tags.length - 2}</span>}
        </div>

        <span className="hidden text-[11px] text-gray-600 sm:block shrink-0 w-20 text-right">
          {contact.lastContact ? formatRelativeTime(contact.lastContact) : 'Never'}
        </span>

        <SourceIcon source={contact.source} />

        <ChevronRight className={clsx('h-3.5 w-3.5 text-gray-600 transition-transform shrink-0', expanded && 'rotate-90')} />
      </div>

      {expanded && (
        <ContactDetail
          contact={contact}
          allTags={allTags}
          onUpdateTags={(tags) => onUpdateTags(contact.id, tags)}
          onUpdateNotes={(notes) => onUpdateNotes(contact.id, notes)}
          onArchive={() => onArchive(contact.id)}
          onDelete={() => onDelete(contact.id)}
          canModify={canModify}
        />
      )}
    </div>
  )
}

// ─── Score Filter ───────────────────────────────────────────────

const SCORE_PRESETS = [
  { label: 'All', min: 0 },
  { label: 'Hot 80+', min: 80 },
  { label: 'Warm 60+', min: 60 },
  { label: 'Cool <60', min: 0, max: 59 },
]

// ─── Last Contact Filter ────────────────────────────────────────

const LAST_CONTACT_PRESETS = [
  { label: 'Any time', value: 'any' },
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: '30+ days ago', value: '30+' },
]

const SOURCE_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Email', value: 'email' },
  { label: 'Calendar', value: 'calendar' },
  { label: 'Both', value: 'both' },
  { label: 'Manual', value: 'manual' },
]

// ─── NL Query Bar ───────────────────────────────────────────────

const PLACEHOLDER_EXAMPLES = [
  'Who did I meet from USA Health last month?',
  'When did I last talk to Dr. Martinez?',
  'Show contacts I haven\'t spoken to in 30+ days',
  'Who are my highest-scored contacts at Infirmary Health?',
]

function NLQueryBar({ contacts, onScrollToContact }) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [placeholderIdx, setPlaceholderIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDER_EXAMPLES.length), 4000)
    return () => clearInterval(interval)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setTimeout(() => {
      const res = handleNLQuery(query, contacts)
      setResult(res)
      setLoading(false)
    }, 400)
  }

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      {/* Result card */}
      {result && (
        <div className="mb-4 rounded-xl border border-surface-700 bg-surface-800/30 p-4">
          <p className="text-[13px] text-gray-300 leading-relaxed whitespace-pre-wrap">
            {result.answer.split(/\*\*(.+?)\*\*/g).map((part, i) =>
              i % 2 === 1 ? <strong key={i} className="text-gray-100">{part}</strong> : part
            )}
          </p>
          {result.contacts.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {result.contacts.slice(0, 6).map((c) => (
                <button key={c.id} onClick={() => onScrollToContact(c.id)} className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-700/50 group">
                  <ScoreRing score={c.score} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium text-gray-200 group-hover:text-accent">{c.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{c.company || c.role || c.email}</p>
                  </div>
                  <span className="text-[10px] text-gray-600">{c.lastContact ? formatRelativeTime(c.lastContact) : 'No contact'}</span>
                </button>
              ))}
              {result.contacts.length > 6 && (
                <p className="text-[11px] text-gray-600 pl-3">...and {result.contacts.length - 6} more</p>
              )}
            </div>
          )}
          <p className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-600">
            <Bot className="h-3 w-3" />
            Powered by Jinx
          </p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={PLACEHOLDER_EXAMPLES[placeholderIdx]}
            className="w-full rounded-lg border border-surface-600 bg-surface-800 py-2.5 pl-10 pr-4 text-sm text-gray-200 outline-none placeholder:text-gray-600 focus:border-accent/50"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-40 shrink-0"
        >
          <Send className="h-3.5 w-3.5" />
          Ask
        </button>
      </form>
    </div>
  )
}

// ─── Stale Contact Banner ───────────────────────────────────────

const SNOOZE_KEY = 'clawd-crm-snoozed'

function loadSnoozed() {
  try {
    const raw = localStorage.getItem(SNOOZE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    const now = Date.now()
    const cleaned = {}
    for (const [id, until] of Object.entries(parsed)) {
      if (until > now) cleaned[id] = until
    }
    return cleaned
  } catch { return {} }
}

function StaleContactBanner({ contacts, staleDays, onArchive, onScrollToContact }) {
  const [snoozed, setSnoozed] = useState(loadSnoozed)
  const [expanded, setExpanded] = useState(false)

  const staleContacts = useMemo(() => {
    const threshold = staleDays * 86400000
    return contacts.filter((c) => {
      if (snoozed[c.id]) return false
      if (!c.lastContact) return true
      return (Date.now() - new Date(c.lastContact).getTime()) > threshold
    })
  }, [contacts, staleDays, snoozed])

  function handleSnooze(id) {
    const next = { ...snoozed, [id]: Date.now() + 7 * 86400000 }
    setSnoozed(next)
    localStorage.setItem(SNOOZE_KEY, JSON.stringify(next))
  }

  if (staleContacts.length === 0) return null

  return (
    <div className="rounded-xl border border-status-warning/30 bg-status-warning/5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <AlertTriangle className="h-4 w-4 shrink-0 text-status-warning" />
        <span className="flex-1 text-[13px] font-medium text-status-warning">
          {staleContacts.length} contact{staleContacts.length !== 1 ? 's' : ''} haven't been reached in {staleDays}+ days
        </span>
        <ChevronDown className={clsx('h-4 w-4 text-status-warning/60 transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div className="border-t border-status-warning/20 px-4 py-2 space-y-1">
          {staleContacts.map((c) => {
            const daysSince = c.lastContact
              ? Math.floor((Date.now() - new Date(c.lastContact).getTime()) / 86400000)
              : null
            return (
              <div key={c.id} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-800/20">
                <div className="min-w-0 flex-1">
                  <button onClick={() => onScrollToContact(c.id)} className="text-[12px] font-medium text-gray-200 hover:text-accent">
                    {c.name}
                  </button>
                  <p className="text-[10px] text-gray-500">
                    {c.company && `${c.company} · `}
                    {daysSince !== null ? `Last contact ${daysSince}d ago` : 'No recorded contact'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleSnooze(c.id)}
                    className="rounded-md border border-surface-600 px-2 py-1 text-[10px] text-gray-500 transition-colors hover:text-gray-300"
                    title="Snooze for 7 days"
                  >
                    <Clock className="h-3 w-3 inline mr-0.5" />
                    Dismiss
                  </button>
                  {!c.isMock && (
                    <button
                      onClick={() => onArchive(c.id)}
                      className="rounded-md border border-surface-600 px-2 py-1 text-[10px] text-gray-500 transition-colors hover:text-gray-300"
                    >
                      Archive
                    </button>
                  )}
                  <a
                    href={`mailto:${c.email}?subject=Following up`}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-md border border-accent/30 bg-accent/10 px-2 py-1 text-[10px] text-accent transition-colors hover:bg-accent/20"
                  >
                    <Mail className="h-3 w-3 inline mr-0.5" />
                    Reach Out
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Sort helpers ───────────────────────────────────────────────

const SORT_OPTIONS = [
  { label: 'Score', value: 'score' },
  { label: 'Name', value: 'name' },
  { label: 'Last Contact', value: 'lastContact' },
  { label: 'Company', value: 'company' },
]

function sortContacts(contacts, sortBy) {
  const arr = [...contacts]
  switch (sortBy) {
    case 'name': return arr.sort((a, b) => a.name.localeCompare(b.name))
    case 'lastContact': return arr.sort((a, b) => {
      const aD = a.lastContact ? new Date(a.lastContact) : new Date(0)
      const bD = b.lastContact ? new Date(b.lastContact) : new Date(0)
      return bD - aD
    })
    case 'company': return arr.sort((a, b) => (a.company || 'zzz').localeCompare(b.company || 'zzz'))
    default: return arr.sort((a, b) => b.score - a.score)
  }
}

// ─── Main Page ──────────────────────────────────────────────────

export default function CrmPage() {
  const { contacts, allTags, allCompanies, addContact, updateContact, archiveContact, deleteContact } = useContacts()
  const { settings } = useSettings()
  const staleDays = settings.crm?.staleDays ?? 30
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [scoreFilter, setScoreFilter] = useState(0)
  const [scoreMax, setScoreMax] = useState(null)
  const [lastContactFilter, setLastContactFilter] = useState('any')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  const [expandedId, setExpandedId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const expand = searchParams.get('expand')
    if (expand) {
      setExpandedId(expand)
      setSearchParams({}, { replace: true })
      setTimeout(() => {
        document.getElementById(`contact-${expand}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [searchParams, setSearchParams])

  const tagOptions = useMemo(() => allTags.map((t) => ({ value: t, label: t })), [allTags])

  const filtered = useMemo(() => {
    let result = contacts

    if (search) {
      const q = search.toLowerCase()
      result = result.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.role || '').toLowerCase().includes(q)
      )
    }

    if (selectedTags.length > 0) {
      result = result.filter((c) => selectedTags.some((t) => (c.tags || []).includes(t)))
    }

    if (scoreFilter > 0 || scoreMax) {
      result = result.filter((c) => {
        if (scoreMax) return c.score >= scoreFilter && c.score <= scoreMax
        return c.score >= scoreFilter
      })
    }

    if (lastContactFilter !== 'any') {
      result = result.filter((c) => {
        if (!c.lastContact) return lastContactFilter === '30+'
        const days = (Date.now() - new Date(c.lastContact).getTime()) / 86400000
        if (lastContactFilter === '7') return days <= 7
        if (lastContactFilter === '30') return days <= 30
        if (lastContactFilter === '30+') return days > 30
        return true
      })
    }

    if (sourceFilter !== 'all') {
      result = result.filter((c) => c.source === sourceFilter)
    }

    return sortContacts(result, sortBy)
  }, [contacts, search, selectedTags, scoreFilter, scoreMax, lastContactFilter, sourceFilter, sortBy])

  function handleScorePreset(preset) {
    setScoreFilter(preset.min)
    setScoreMax(preset.max ?? null)
  }

  const handleScrollToContact = useCallback((id) => {
    setExpandedId(id)
    setTimeout(() => {
      document.getElementById(`contact-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 50)
  }, [])

  function handleAddContact(data) {
    addContact(data)
    setModalOpen(false)
  }

  function handleUpdateTags(id, tags) {
    updateContact(id, { tags })
  }

  function handleUpdateNotes(id, notes) {
    updateContact(id, { notes })
  }

  return (
    <div className="space-y-5">
      {/* ── SECTION 1: Top Bar ───────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight text-gray-100">Contacts</h1>
          <span className="rounded-full bg-surface-700 px-2.5 py-0.5 text-[11px] font-medium text-gray-400">{contacts.length}</span>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-accent/90 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Contact
        </button>
      </div>

      {/* Search + Filters */}
      <div className="rounded-xl border border-surface-700 bg-surface-900 p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts by name, company, or email..."
            className="w-full rounded-lg border border-surface-600 bg-surface-800 py-2.5 pl-10 pr-4 text-sm text-gray-200 outline-none placeholder:text-gray-600 focus:border-accent/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tag filter */}
          <MultiSelect
            options={tagOptions}
            selected={selectedTags}
            onChange={setSelectedTags}
            placeholder="All Tags"
          />

          {/* Score presets */}
          <div className="flex items-center gap-0.5 rounded-lg bg-surface-800 p-0.5">
            {SCORE_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => handleScorePreset(p)}
                className={clsx(
                  'rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors',
                  scoreFilter === p.min && (scoreMax ?? null) === (p.max ?? null)
                    ? 'bg-surface-600 text-gray-100 shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Last contact */}
          <select
            value={lastContactFilter}
            onChange={(e) => setLastContactFilter(e.target.value)}
            className="rounded-lg border border-surface-600 bg-surface-800 px-2.5 py-1.5 text-xs text-gray-400 outline-none focus:border-accent/50"
          >
            {LAST_CONTACT_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>

          {/* Source */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-lg border border-surface-600 bg-surface-800 px-2.5 py-1.5 text-xs text-gray-400 outline-none focus:border-accent/50"
          >
            {SOURCE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <div className="h-5 w-px bg-surface-700" />

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-surface-600 bg-surface-800 px-2.5 py-1.5 text-xs text-gray-400 outline-none focus:border-accent/50"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>Sort: {s.label}</option>
            ))}
          </select>

          <span className="ml-auto text-[11px] text-gray-600">{filtered.length} contact{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* ── Stale Contact Alert ────────────────────── */}
      <StaleContactBanner
        contacts={contacts}
        staleDays={staleDays}
        onArchive={archiveContact}
        onScrollToContact={handleScrollToContact}
      />

      {/* ── SECTION 2: Contact List ──────────────────── */}
      <div className="rounded-xl border border-surface-700 bg-surface-900">
        {/* Column headers — clickable for sorting */}
        <div className="hidden sm:flex items-center gap-3 border-b border-surface-700 px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider text-gray-600">
          <button onClick={() => setSortBy('score')} className={clsx('w-9 shrink-0 text-center transition-colors hover:text-gray-400', sortBy === 'score' && 'text-accent')}>
            Score
          </button>
          <button onClick={() => setSortBy('name')} className={clsx('flex-1 text-left transition-colors hover:text-gray-400', sortBy === 'name' && 'text-accent')}>
            Name / Company
          </button>
          <button onClick={() => setSortBy('company')} className={clsx('hidden md:block w-[140px] text-left transition-colors hover:text-gray-400', sortBy === 'company' && 'text-accent')}>
            Role
          </button>
          <span className="hidden lg:block w-[100px]">Tags</span>
          <button onClick={() => setSortBy('lastContact')} className={clsx('w-20 text-right transition-colors hover:text-gray-400', sortBy === 'lastContact' && 'text-accent')}>
            Last Contact
          </button>
          <span className="w-8 text-center">Src</span>
          <span className="w-4" />
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <User className="mx-auto mb-2 h-8 w-8 text-gray-700" />
              <p className="text-sm text-gray-500">No contacts match your filters.</p>
              <p className="mt-1 text-[11px] text-gray-600">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <>
              {/* Desktop table rows */}
              <div className="hidden sm:block">
                {filtered.map((contact) => (
                  <div key={contact.id} id={`contact-${contact.id}`}>
                    <ContactRow
                      contact={contact}
                      expanded={expandedId === contact.id}
                      onToggle={() => setExpandedId(expandedId === contact.id ? null : contact.id)}
                      allTags={allTags}
                      onUpdateTags={handleUpdateTags}
                      onUpdateNotes={handleUpdateNotes}
                      onArchive={archiveContact}
                      onDelete={deleteContact}
                    />
                  </div>
                ))}
              </div>
              {/* Mobile card view */}
              <div className="sm:hidden divide-y divide-surface-700/50">
                {filtered.map((contact) => (
                  <div key={contact.id} id={`contact-${contact.id}-m`}>
                    <button
                      onClick={() => setExpandedId(expandedId === contact.id ? null : contact.id)}
                      className="w-full px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <ScoreRing score={contact.score} size={32} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-gray-200">{contact.name}</p>
                          <p className="truncate text-[11px] text-gray-500">{contact.company || contact.role || contact.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <SourceIcon source={contact.source} />
                          <span className="text-[10px] text-gray-600">{contact.lastContact ? formatRelativeTime(contact.lastContact) : '—'}</span>
                        </div>
                      </div>
                      {(contact.tags || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 ml-11">
                          {contact.tags.slice(0, 3).map((t) => (
                            <span key={t} className="rounded-full bg-surface-700 px-2 py-0.5 text-[9px] text-gray-500">{t}</span>
                          ))}
                        </div>
                      )}
                    </button>
                    {expandedId === contact.id && (
                      <ContactDetail
                        contact={contact}
                        allTags={allTags}
                        onUpdateTags={(tags) => handleUpdateTags(contact.id, tags)}
                        onUpdateNotes={(notes) => handleUpdateNotes(contact.id, notes)}
                        onArchive={() => archiveContact(contact.id)}
                        onDelete={() => deleteContact(contact.id)}
                        canModify={!contact.isMock}
                      />
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── SECTION 3: NL Query Bar ──────────────────── */}
      <NLQueryBar contacts={contacts} onScrollToContact={handleScrollToContact} />

      {/* Add Contact Modal */}
      {modalOpen && (
        <AddContactModal
          onSave={handleAddContact}
          onClose={() => setModalOpen(false)}
          allTags={allTags}
          allCompanies={allCompanies}
        />
      )}
    </div>
  )
}

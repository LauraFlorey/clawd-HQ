import { useState, useMemo, useCallback } from 'react'
import {
  Lightbulb, Wand2, Plus, Search, X, ChevronRight, ChevronDown,
  FileText, Copy, Check, RefreshCw, AlertTriangle,
  ExternalLink, Loader2, Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { useContentIdeas } from '../hooks/useContentIdeas'
import { useTasks } from '../hooks/useTasks'
import { formatRelativeTime, formatDate } from '../utils/formatters'

// ═══════════════════════════════════════════════════════════════
//  Shared Components
// ═══════════════════════════════════════════════════════════════

const STATUS_CONFIG = {
  pitched:   { label: 'Pitched',   color: 'bg-blue-500/15 text-blue-400' },
  accepted:  { label: 'Accepted',  color: 'bg-green-500/15 text-green-400' },
  rejected:  { label: 'Rejected',  color: 'bg-red-500/15 text-red-400' },
  produced:  { label: 'Produced',  color: 'bg-purple-500/15 text-purple-400' },
  duplicate: { label: 'Duplicate', color: 'bg-gray-500/15 text-gray-400' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pitched
  return <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-semibold', cfg.color)}>{cfg.label}</span>
}

function TypeBadge({ type }) {
  return (
    <span className={clsx(
      'rounded-full px-2 py-0.5 text-[10px] font-medium',
      type === 'short-form' ? 'bg-accent/10 text-accent' : 'bg-surface-700 text-gray-400'
    )}>
      {type === 'short-form' ? 'Short' : 'Long'}
    </span>
  )
}

function TagInput({ tags, onChange, suggestions }) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filtered = useMemo(
    () => (suggestions || []).filter((t) => t.toLowerCase().includes(input.toLowerCase()) && !tags.includes(t)).slice(0, 6),
    [suggestions, input, tags]
  )

  function addTag(tag) {
    const t = tag.trim()
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
            <button key={t} onMouseDown={() => addTag(t)} className="block w-full px-3 py-1.5 text-left text-xs text-gray-300 hover:bg-surface-700">{t}</button>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  TAB 1 — Idea Pipeline
// ═══════════════════════════════════════════════════════════════

function IdeaInput({ allTags, onSubmit }) {
  const [text, setText] = useState('')
  const [type, setType] = useState('long-form')
  const [tags, setTags] = useState([])

  function handleSubmit() {
    if (!text.trim()) return
    onSubmit({ text: text.trim(), type, tags })
    setText('')
    setTags([])
  }

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Lightbulb className="h-4 w-4 text-accent" />
        <h3 className="text-[13px] font-semibold text-gray-200">New Idea</h3>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Describe a content idea — topic, angle, format..."
        rows={3}
        className="w-full rounded-lg border border-surface-600 bg-surface-800 px-4 py-3 text-sm text-gray-200 outline-none placeholder:text-gray-600 focus:border-accent/50 resize-none"
      />

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-gray-600">Format</label>
          <div className="flex items-center gap-0.5 rounded-lg bg-surface-800 p-0.5">
            {['short-form', 'long-form'].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={clsx(
                  'rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors',
                  type === t ? 'bg-surface-600 text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {t === 'short-form' ? 'Short-form' : 'Long-form'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-gray-600">Tags</label>
          <TagInput tags={tags} onChange={setTags} suggestions={allTags} />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-40 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Submit Idea
        </button>
      </div>
    </div>
  )
}

function DuplicateWarning({ match, score, onProceed, onCancel }) {
  return (
    <div className="rounded-xl border border-status-warning/30 bg-status-warning/5 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-status-warning" />
        <h4 className="text-[13px] font-semibold text-status-warning">Similar idea detected</h4>
        <span className="rounded-full bg-status-warning/20 px-2 py-0.5 text-[10px] font-bold text-status-warning">{score}% match</span>
      </div>
      <div className="rounded-lg border border-surface-700 bg-surface-900 px-4 py-3">
        <p className="text-[13px] font-medium text-gray-200">{match.title}</p>
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-500">
          <StatusBadge status={match.status} />
          <TypeBadge type={match.type} />
          <span>{formatDate(match.createdAt)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onProceed} className="rounded-lg bg-accent/10 px-3.5 py-2 text-[12px] font-medium text-accent transition-colors hover:bg-accent/20">Submit Anyway</button>
        <button onClick={onCancel} className="rounded-lg border border-surface-600 px-3.5 py-2 text-[12px] font-medium text-gray-400 transition-colors hover:text-gray-200">Cancel</button>
      </div>
    </div>
  )
}

// TODO: Research step (X/Twitter search + KB search) via Jinx API
function BriefCard({ idea, onSave, onCreateTask, onDiscard }) {
  const [title, setTitle] = useState(idea.text)
  const [saving, setSaving] = useState(false)

  function handleSave() {
    setSaving(true)
    setTimeout(() => {
      onSave({ ...idea, title })
      setSaving(false)
    }, 300)
  }

  const angle = useMemo(() => {
    const angles = [
      `Explore ${title} through the lens of real-world implementation. Focus on practical lessons learned and actionable takeaways for practitioners.`,
      `A deep dive into ${title} — what's working, what's not, and where the opportunities lie. Combine personal experience with data-driven insights.`,
      `Break down ${title} into digestible insights for a technical audience. Lead with a compelling hook and include concrete examples.`,
    ]
    return angles[Math.abs(title.length) % angles.length]
  }, [title])

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent" />
        <h4 className="text-[13px] font-semibold text-gray-200">Brief Assembly</h4>
      </div>

      <div>
        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gray-600">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-sm text-gray-200 outline-none focus:border-accent/50"
        />
      </div>

      <div>
        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gray-600">Angle</label>
        <p className="text-[12px] text-gray-400 leading-relaxed">{angle}</p>
      </div>

      <div>
        <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gray-600">Related Sources</label>
        <Link to="/knowledge" className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent/80">
          <Search className="h-3 w-3" />
          Search your knowledge base for related content
          <ExternalLink className="h-2.5 w-2.5" />
        </Link>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Save Idea
        </button>
        <button
          onClick={() => onCreateTask({ title, summary: angle, tags: idea.tags })}
          className="flex items-center gap-2 rounded-lg bg-surface-700 px-4 py-2 text-[12px] font-medium text-gray-300 transition-colors hover:bg-surface-600"
        >
          <FileText className="h-3.5 w-3.5" />
          Create Task
        </button>
        <button
          onClick={onDiscard}
          className="text-[11px] text-gray-600 transition-colors hover:text-gray-400 ml-2"
        >
          Discard
        </button>
      </div>
    </div>
  )
}

const IDEA_STATUS_FILTERS = ['all', 'pitched', 'accepted', 'rejected', 'produced', 'duplicate']
const IDEA_TYPE_FILTERS = ['all', 'short-form', 'long-form']

function IdeaDatabase({ ideas, allTags, onUpdateStatus, onDelete }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState([])
  const [expandedId, setExpandedId] = useState(null)

  const filtered = useMemo(() => {
    let result = ideas
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((i) => i.title.toLowerCase().includes(q) || i.summary?.toLowerCase().includes(q))
    }
    if (statusFilter !== 'all') result = result.filter((i) => i.status === statusFilter)
    if (typeFilter !== 'all') result = result.filter((i) => i.type === typeFilter)
    if (tagFilter.length > 0) result = result.filter((i) => tagFilter.some((t) => (i.tags || []).includes(t)))
    return result
  }, [ideas, search, statusFilter, typeFilter, tagFilter])

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900">
      <div className="border-b border-surface-700 px-5 py-3.5 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-gray-200">Idea Database</h3>
        <span className="text-[11px] text-gray-600">{filtered.length} idea{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filter bar */}
      <div className="border-b border-surface-700 px-5 py-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideas..."
            className="w-full rounded-lg border border-surface-600 bg-surface-800 py-2 pl-9 pr-3 text-xs text-gray-200 outline-none placeholder:text-gray-600 focus:border-accent/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg bg-surface-800 p-0.5">
            {IDEA_STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={clsx(
                  'rounded-md px-2 py-1 text-[10px] font-medium transition-colors capitalize',
                  statusFilter === s ? 'bg-surface-600 text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0.5 rounded-lg bg-surface-800 p-0.5">
            {IDEA_TYPE_FILTERS.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={clsx(
                  'rounded-md px-2 py-1 text-[10px] font-medium transition-colors',
                  typeFilter === t ? 'bg-surface-600 text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                {t === 'all' ? 'All Types' : t === 'short-form' ? 'Short' : 'Long'}
              </button>
            ))}
          </div>
          {allTags.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value && !tagFilter.includes(e.target.value)) setTagFilter([...tagFilter, e.target.value])
              }}
              className="rounded-lg border border-surface-600 bg-surface-800 px-2 py-1 text-[10px] text-gray-400 outline-none"
            >
              <option value="">Filter by tag</option>
              {allTags.filter((t) => !tagFilter.includes(t)).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          )}
          {tagFilter.map((t) => (
            <span key={t} className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
              {t}
              <button onClick={() => setTagFilter(tagFilter.filter((x) => x !== t))}><X className="h-2 w-2" /></button>
            </span>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="max-h-[500px] overflow-y-auto divide-y divide-surface-700/50">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Lightbulb className="mx-auto mb-2 h-8 w-8 text-gray-700" />
            <p className="text-sm text-gray-500">No ideas match your filters.</p>
          </div>
        ) : (
          filtered.map((idea) => (
            <div key={idea.id}>
              <button
                onClick={() => setExpandedId(expandedId === idea.id ? null : idea.id)}
                className={clsx('flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-800/30', expandedId === idea.id && 'bg-surface-800/20')}
              >
                <span className="text-[10px] font-mono text-gray-600 shrink-0 w-28">{idea.id}</span>
                <span className="flex-1 text-[13px] font-medium text-gray-200 truncate">{idea.title}</span>
                <TypeBadge type={idea.type} />
                <StatusBadge status={idea.status} />
                <div className="hidden sm:flex items-center gap-1.5">
                  {(idea.tags || []).slice(0, 2).map((t) => (
                    <span key={t} className="rounded-full bg-surface-700 px-2 py-0.5 text-[9px] text-gray-500">{t}</span>
                  ))}
                </div>
                <span className="text-[10px] text-gray-600 shrink-0 w-20 text-right hidden md:block">{formatRelativeTime(idea.createdAt)}</span>
                <ChevronRight className={clsx('h-3.5 w-3.5 text-gray-600 transition-transform shrink-0', expandedId === idea.id && 'rotate-90')} />
              </button>

              {expandedId === idea.id && (
                <div className="border-t border-surface-700/30 bg-surface-800/10 px-5 py-4 space-y-3">
                  <p className="text-xs text-gray-400 leading-relaxed">{idea.summary || 'No summary.'}</p>
                  {idea.response && (
                    <div className="rounded-lg bg-red-500/5 border border-red-500/20 px-3 py-2">
                      <p className="text-[10px] font-medium text-red-400 mb-0.5">Feedback</p>
                      <p className="text-xs text-gray-400">{idea.response}</p>
                    </div>
                  )}
                  {idea.similarTo && (
                    <p className="text-[11px] text-gray-500">
                      Similar to: <span className="text-gray-400">{idea.similarTo}</span>
                      {idea.similarityScore && <span className="text-gray-600"> ({idea.similarityScore}% match)</span>}
                    </p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {(idea.tags || []).map((t) => (
                        <span key={t} className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent">{t}</span>
                      ))}
                    </div>
                    <span className="text-[10px] text-gray-600">{formatDate(idea.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {!idea.isMock && (
                      <select
                        value={idea.status}
                        onChange={(e) => onUpdateStatus(idea.id, e.target.value)}
                        className="rounded-lg border border-surface-600 bg-surface-800 px-2 py-1.5 text-[11px] text-gray-300 outline-none focus:border-accent/50"
                      >
                        {Object.keys(STATUS_CONFIG).map((s) => (
                          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                        ))}
                      </select>
                    )}
                    {!idea.isMock && (
                      <button onClick={() => onDelete(idea.id)} className="text-[10px] text-gray-600 transition-colors hover:text-status-offline">Delete</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function IdeaPipeline() {
  const { ideas, allTags, addIdea, updateIdea, deleteIdea, checkDuplicate } = useContentIdeas()
  const { addTask } = useTasks()

  const [stage, setStage] = useState('idle') // idle | checking | duplicate | brief | saved
  const [currentInput, setCurrentInput] = useState(null)
  const [duplicateInfo, setDuplicateInfo] = useState(null)

  const handleSubmit = useCallback(({ text, type, tags }) => {
    setCurrentInput({ text, type, tags })
    setStage('checking')

    setTimeout(() => {
      const dup = checkDuplicate(text, tags)
      if (dup) {
        setDuplicateInfo(dup)
        setStage('duplicate')
      } else {
        setStage('brief')
      }
    }, 600)
  }, [checkDuplicate])

  function handleProceedAnyway() {
    setStage('brief')
    setDuplicateInfo(null)
  }

  function handleCancel() {
    setStage('idle')
    setCurrentInput(null)
    setDuplicateInfo(null)
  }

  function handleSaveIdea(input) {
    addIdea({
      title: input.title,
      type: currentInput.type,
      summary: input.text !== input.title ? input.text : '',
      tags: currentInput.tags,
      status: duplicateInfo ? 'duplicate' : 'pitched',
      similarTo: duplicateInfo?.match?.id || null,
      similarityScore: duplicateInfo?.score || null,
    })
    setStage('saved')
    setTimeout(() => {
      setStage('idle')
      setCurrentInput(null)
      setDuplicateInfo(null)
    }, 1500)
  }

  function handleCreateTask({ title, summary, tags }) {
    addTask({
      title: `Content: ${title}`,
      description: summary,
      isOwner: true,
      priority: 'medium',
      source: 'direct',
    })
    setStage('saved')
    setTimeout(() => {
      setStage('idle')
      setCurrentInput(null)
    }, 1500)
  }

  return (
    <div className="space-y-5">
      <IdeaInput allTags={allTags} onSubmit={handleSubmit} />

      {stage === 'checking' && (
        <div className="flex items-center gap-3 rounded-xl border border-surface-700 bg-surface-900 px-5 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span className="text-sm text-gray-400">Checking for duplicates...</span>
        </div>
      )}

      {stage === 'duplicate' && duplicateInfo && (
        <DuplicateWarning
          match={duplicateInfo.match}
          score={duplicateInfo.score}
          onProceed={handleProceedAnyway}
          onCancel={handleCancel}
        />
      )}

      {stage === 'brief' && currentInput && (
        <BriefCard
          idea={currentInput}
          onSave={handleSaveIdea}
          onCreateTask={handleCreateTask}
          onDiscard={handleCancel}
        />
      )}

      {stage === 'saved' && (
        <div className="flex items-center gap-2 rounded-xl border border-status-online/30 bg-status-online/5 px-5 py-3.5">
          <Check className="h-4 w-4 text-status-online" />
          <span className="text-sm font-medium text-status-online">Idea saved to pipeline!</span>
        </div>
      )}

      <IdeaDatabase
        ideas={ideas}
        allTags={allTags}
        onUpdateStatus={(id, status) => updateIdea(id, { status })}
        onDelete={deleteIdea}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  TAB 2 — Humanizer
// ═══════════════════════════════════════════════════════════════

const AI_TELLS = [
  { pattern: /\bdelve\b/gi, label: 'Overused: "delve"', severity: 'high' },
  { pattern: /\blandscape\b/gi, label: 'Overused: "landscape"', severity: 'medium' },
  { pattern: /\bleverage\b/gi, label: 'Overused: "leverage"', severity: 'medium' },
  { pattern: /\bit['']s important to note\b/gi, label: 'Formulaic opener', severity: 'high' },
  { pattern: /\bin conclusion\b/gi, label: 'Generic closer', severity: 'medium' },
  { pattern: /\bgame[- ]changing\b/gi, label: 'Tone inflation', severity: 'high' },
  { pattern: /\brevolutionary\b/gi, label: 'Tone inflation', severity: 'high' },
  { pattern: /\btransformative\b/gi, label: 'Tone inflation', severity: 'medium' },
  { pattern: /\bit['']s worth noting\b/gi, label: 'Formulaic phrase', severity: 'medium' },
  { pattern: /\bin today['']s world\b/gi, label: 'Generic phrasing', severity: 'medium' },
  { pattern: /\bat the end of the day\b/gi, label: 'Cliché', severity: 'low' },
  { pattern: /\ba testament to\b/gi, label: 'Overused: "a testament to"', severity: 'medium' },
  { pattern: /\bfurthermore\b/gi, label: 'Excessive formality', severity: 'low' },
  { pattern: /\bmoreover\b/gi, label: 'Excessive formality', severity: 'low' },
  { pattern: /\bseamlessly\b/gi, label: 'Overused: "seamlessly"', severity: 'medium' },
  { pattern: /\bholistic\b/gi, label: 'Overused: "holistic"', severity: 'medium' },
  { pattern: /\brobust\b/gi, label: 'Overused: "robust"', severity: 'low' },
]

const CHANNELS = [
  { id: 'none', label: 'None (general)' },
  { id: 'twitter', label: 'Twitter/X', note: 'Punchy, <280 chars' },
  { id: 'linkedin', label: 'LinkedIn', note: 'Professional conversational' },
  { id: 'blog', label: 'Blog', note: 'Longer form, personal voice' },
  { id: 'email', label: 'Email', note: 'Brief, action-oriented' },
  { id: 'newsletter', label: 'Newsletter', note: 'Accessible, community voice' },
]

const SEVERITY_COLORS = {
  high: 'bg-red-500/15 text-red-400 border-red-500/20',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  low: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
}

function detectAiTells(text) {
  const findings = []
  for (const tell of AI_TELLS) {
    const matches = [...text.matchAll(tell.pattern)]
    for (const m of matches) {
      findings.push({
        label: tell.label,
        severity: tell.severity,
        index: m.index,
        length: m[0].length,
        word: m[0],
      })
    }
  }
  return findings.sort((a, b) => a.index - b.index)
}

function buildHighlightedText(text, findings) {
  if (findings.length === 0) return [{ text, highlighted: false }]
  const parts = []
  let cursor = 0
  for (const f of findings) {
    if (f.index > cursor) parts.push({ text: text.slice(cursor, f.index), highlighted: false })
    parts.push({ text: text.slice(f.index, f.index + f.length), highlighted: true, severity: f.severity })
    cursor = f.index + f.length
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), highlighted: false })
  return parts
}

function Humanizer() {
  const [input, setInput] = useState('')
  const [channel, setChannel] = useState('none')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState('side-by-side')
  const [copied, setCopied] = useState(false)
  const [changesOpen, setChangesOpen] = useState(false)

  const wordCount = useMemo(() => input.trim() ? input.trim().split(/\s+/).length : 0, [input])
  const charCount = input.length

  function handleHumanize() {
    if (!input.trim()) return
    setLoading(true)
    setResult(null)

    // TODO: Replace mock with actual LLM rewrite via Jinx API
    setTimeout(() => {
      const findings = detectAiTells(input)
      const highlighted = buildHighlightedText(input, findings)
      const severityCounts = { high: 0, medium: 0, low: 0 }
      findings.forEach((f) => severityCounts[f.severity]++)
      const overallSeverity = severityCounts.high > 0 ? 'high' : severityCounts.medium > 0 ? 'medium' : findings.length > 0 ? 'low' : 'clean'

      setResult({ findings, highlighted, severityCounts, overallSeverity, originalWordCount: wordCount })
      setLoading(false)
    }, 500)
  }

  function handleCopy() {
    navigator.clipboard.writeText(input).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  function handleReset() {
    setResult(null)
    setInput('')
    setChannel('none')
  }

  return (
    <div className="space-y-5">
      {/* Input section */}
      <div className="rounded-xl border border-surface-700 bg-surface-900 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Wand2 className="h-4 w-4 text-accent" />
          <h3 className="text-[13px] font-semibold text-gray-200">Text Humanizer</h3>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste your AI-generated text here..."
          rows={6}
          className="w-full rounded-lg border border-surface-600 bg-surface-800 px-4 py-3 text-sm text-gray-200 outline-none placeholder:text-gray-600 focus:border-accent/50 resize-none leading-relaxed"
        />

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-600">{wordCount} words · {charCount} characters</span>
        </div>

        {/* Channel selector */}
        <div>
          <label className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-gray-600">Optimize for Channel</label>
          <div className="flex flex-wrap gap-1.5">
            {CHANNELS.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setChannel(ch.id)}
                className={clsx(
                  'rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors border',
                  channel === ch.id
                    ? 'border-accent/30 bg-accent/10 text-accent'
                    : 'border-surface-600 bg-surface-800 text-gray-400 hover:text-gray-200 hover:border-surface-500'
                )}
                title={ch.note}
              >
                {ch.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleHumanize}
          disabled={!input.trim() || loading}
          className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
          Humanize
        </button>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* AI Tells Detected */}
          <div className="rounded-xl border border-surface-700 bg-surface-900 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className={clsx('h-4 w-4',
                  result.overallSeverity === 'high' ? 'text-red-400' : result.overallSeverity === 'medium' ? 'text-yellow-400' : result.overallSeverity === 'clean' ? 'text-green-400' : 'text-gray-400'
                )} />
                <h4 className="text-[13px] font-semibold text-gray-200">AI Tells Detected</h4>
                <span className={clsx(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold',
                  result.overallSeverity === 'high' ? 'bg-red-500/15 text-red-400'
                    : result.overallSeverity === 'medium' ? 'bg-yellow-500/15 text-yellow-400'
                    : result.overallSeverity === 'clean' ? 'bg-green-500/15 text-green-400'
                    : 'bg-gray-500/15 text-gray-400'
                )}>
                  {result.findings.length === 0 ? 'Clean!' : `${result.findings.length} pattern${result.findings.length !== 1 ? 's' : ''}`}
                </span>
              </div>
              {result.findings.length > 0 && (
                <div className="flex items-center gap-2 text-[10px]">
                  {result.severityCounts.high > 0 && <span className="text-red-400">{result.severityCounts.high} heavy</span>}
                  {result.severityCounts.medium > 0 && <span className="text-yellow-400">{result.severityCounts.medium} moderate</span>}
                  {result.severityCounts.low > 0 && <span className="text-gray-400">{result.severityCounts.low} minor</span>}
                </div>
              )}
            </div>

            {result.findings.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {[...new Map(result.findings.map((f) => [f.label, f])).values()].map((f, i) => (
                  <span key={i} className={clsx('rounded-lg border px-2.5 py-1 text-[10px] font-medium', SEVERITY_COLORS[f.severity])}>
                    {f.label}
                  </span>
                ))}
              </div>
            )}

            {result.findings.length === 0 && (
              <p className="text-xs text-gray-400">No common AI patterns detected. Your text looks good!</p>
            )}
          </div>

          {/* Rewrite output */}
          {result.findings.length > 0 && (
            <div className="rounded-xl border border-surface-700 bg-surface-900 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[13px] font-semibold text-gray-200">Analysis</h4>
                <div className="flex items-center gap-0.5 rounded-lg bg-surface-800 p-0.5">
                  {['side-by-side', 'changes-only'].map((m) => (
                    <button
                      key={m}
                      onClick={() => setViewMode(m)}
                      className={clsx(
                        'rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors',
                        viewMode === m ? 'bg-surface-600 text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-300'
                      )}
                    >
                      {m === 'side-by-side' ? 'Side by Side' : 'Changes Only'}
                    </button>
                  ))}
                </div>
              </div>

              {viewMode === 'side-by-side' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original */}
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">Original</p>
                    <div className="rounded-lg border border-surface-700 bg-surface-800 p-4 text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">
                      {result.highlighted.map((part, i) =>
                        part.highlighted ? (
                          <mark key={i} className={clsx('rounded-sm px-0.5',
                            part.severity === 'high' ? 'bg-red-500/20 text-red-300' : part.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-gray-500/20 text-gray-300'
                          )}>{part.text}</mark>
                        ) : (
                          <span key={i}>{part.text}</span>
                        )
                      )}
                    </div>
                  </div>
                  {/* Rewrite placeholder */}
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">Rewrite</p>
                    <div className="rounded-lg border border-surface-700 bg-surface-800 p-4 text-xs text-gray-400 leading-relaxed">
                      <div className="flex items-center gap-2 text-gray-500 mb-3">
                        <Sparkles className="h-3.5 w-3.5 text-accent" />
                        <span className="text-[11px] font-medium">AI-powered rewriting coming soon</span>
                      </div>
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        Full AI-powered rewriting requires Jinx backend. Detection works now — rewriting coming soon.
                        The highlighted patterns in your original text are the areas that would be rewritten.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Changes only view */
                <div className="space-y-2">
                  {[...new Map(result.findings.map((f) => [f.label, f])).values()].map((f, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-surface-700 bg-surface-800/50 px-4 py-2.5">
                      <span className={clsx('mt-0.5 h-2 w-2 rounded-full shrink-0',
                        f.severity === 'high' ? 'bg-red-400' : f.severity === 'medium' ? 'bg-yellow-400' : 'bg-gray-400'
                      )} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-300">{f.label}</p>
                        <p className="text-[11px] text-gray-500">Found: &ldquo;{f.word}&rdquo;</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* What changed section */}
              <button
                onClick={() => setChangesOpen(!changesOpen)}
                className="flex items-center gap-2 text-xs text-gray-500 transition-colors hover:text-gray-300"
              >
                <ChevronRight className={clsx('h-3 w-3 transition-transform duration-200', changesOpen && 'rotate-90')} />
                What was detected ({result.findings.length} patterns)
              </button>
              {changesOpen && (
                <div className="space-y-1.5 pl-5">
                  {result.findings.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <span className={clsx('h-1.5 w-1.5 rounded-full shrink-0',
                        f.severity === 'high' ? 'bg-red-400' : f.severity === 'medium' ? 'bg-yellow-400' : 'bg-gray-400'
                      )} />
                      <span className="text-gray-500">&ldquo;{f.word}&rdquo;</span>
                      <span className="text-gray-600">—</span>
                      <span className="text-gray-400">{f.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center gap-3 pt-2 border-t border-surface-800">
                <span className="text-[10px] text-gray-600">
                  {result.originalWordCount} words · {result.findings.length} AI patterns detected
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-lg border border-surface-600 px-3 py-1.5 text-[11px] text-gray-400 transition-colors hover:text-gray-200"
                  >
                    {copied ? <Check className="h-3 w-3 text-status-online" /> : <Copy className="h-3 w-3" />}
                    {copied ? 'Copied' : 'Copy Text'}
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 rounded-lg border border-surface-600 px-3 py-1.5 text-[11px] text-gray-400 transition-colors hover:text-gray-200"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Main Content Page
// ═══════════════════════════════════════════════════════════════

const TABS = [
  { id: 'pipeline', label: 'Idea Pipeline', icon: Lightbulb },
  { id: 'humanizer', label: 'Humanizer', icon: Wand2 },
]

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState('pipeline')

  return (
    <div className="space-y-5">
      {/* Page header with tab toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-gray-100">Content</h1>
          <p className="mt-0.5 text-[12px] text-gray-500">Ideate, draft, and polish content across platforms</p>
        </div>

        <div className="flex items-center gap-0.5 rounded-xl bg-surface-800 p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-surface-600 text-gray-100 shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === 'pipeline' ? <IdeaPipeline /> : <Humanizer />}
    </div>
  )
}

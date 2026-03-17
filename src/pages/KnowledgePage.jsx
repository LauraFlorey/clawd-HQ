import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Globe, Play, FileText, MessageSquare, StickyNote, Plus, Search,
  ChevronRight, ExternalLink, Trash2, Tags, X, Command,
  Clock, Bot, Check,
} from 'lucide-react'
import clsx from 'clsx'
import { useKnowledgeSources } from '../hooks/useKnowledgeSources'
import { useKnowledgeSearch } from '../hooks/useKnowledgeSearch'
import { formatRelativeTime } from '../utils/formatters'

// ─── Constants ──────────────────────────────────────────────────

const SOURCE_TYPES = {
  article:  { icon: Globe, label: 'Article', color: 'text-blue-400' },
  video:    { icon: Play, label: 'Video', color: 'text-red-400' },
  pdf:      { icon: FileText, label: 'PDF', color: 'text-amber-400' },
  tweet:    { icon: MessageSquare, label: 'Tweet/X Post', color: 'text-sky-400' },
  note:     { icon: StickyNote, label: 'Note', color: 'text-emerald-400' },
}

const STATUS_STYLES = {
  pending:   'bg-status-warning/10 text-status-warning border-status-warning/20',
  processed: 'bg-status-online/10 text-status-online border-status-online/20',
  failed:    'bg-status-offline/10 text-status-offline border-status-offline/20',
}

function detectSourceType(input) {
  if (!input) return 'note'
  const trimmed = input.trim()
  if (!/^https?:\/\//i.test(trimmed)) return 'note'
  try {
    const url = new URL(trimmed)
    const host = url.hostname.replace('www.', '')
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'video'
    if (host.includes('twitter.com') || host.includes('x.com')) return 'tweet'
    if (url.pathname.endsWith('.pdf')) return 'pdf'
    return 'article'
  } catch { return 'note' }
}

function SourceIcon({ type, className }) {
  const cfg = SOURCE_TYPES[type] || SOURCE_TYPES.article
  const Icon = cfg.icon
  return <Icon className={clsx('h-4 w-4', cfg.color, className)} />
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
    if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1))
    }
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

// ─── Ingestion Input ────────────────────────────────────────────

function IngestionInput({ onSubmit, allTags }) {
  const [input, setInput] = useState('')
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState([])
  const [notes, setNotes] = useState('')
  const [expanded, setExpanded] = useState(false)

  const detectedType = detectSourceType(input)
  const isUrl = /^https?:\/\//i.test(input.trim())
  const typeCfg = SOURCE_TYPES[detectedType]

  useEffect(() => {
    if (isUrl && !title) {
      try {
        const url = new URL(input.trim())
        setTitle(url.hostname.replace('www.', ''))
      } catch { /* ignore */ }
    }
  }, [input, isUrl, title])

  function handleInputChange(e) {
    setInput(e.target.value)
    if (e.target.value.trim().length > 0 && !expanded) setExpanded(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    onSubmit({
      url: isUrl ? trimmed : null,
      title: title.trim() || trimmed.slice(0, 80),
      tags,
      notes,
      sourceType: detectedType,
    })
    setInput('')
    setTitle('')
    setTags([])
    setNotes('')
    setExpanded(false)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Plus className="h-4 w-4 text-accent" />
        <h2 className="text-[14px] font-semibold text-gray-200">Add to Knowledge Base</h2>
      </div>

      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Paste a URL, drop a file, or type a note..."
          className="w-full rounded-lg border border-surface-600 bg-surface-800 px-4 py-3 pr-28 text-sm text-gray-200 outline-none placeholder:text-gray-600 focus:border-accent/50"
        />
        {input.trim() && (
          <span className={clsx('absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium',
            detectedType === 'video' ? 'border-red-400/20 bg-red-400/10 text-red-400' :
            detectedType === 'tweet' ? 'border-sky-400/20 bg-sky-400/10 text-sky-400' :
            detectedType === 'pdf' ? 'border-amber-400/20 bg-amber-400/10 text-amber-400' :
            detectedType === 'note' ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-400' :
            'border-blue-400/20 bg-blue-400/10 text-blue-400'
          )}>
            <SourceIcon type={detectedType} className="h-3 w-3" />
            {typeCfg?.label}
          </span>
        )}
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Source title"
              className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-xs text-gray-300 outline-none focus:border-accent/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">Tags</label>
            <TagInput tags={tags} onChange={setTags} suggestions={allTags} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional annotation..."
              rows={2}
              className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-xs text-gray-300 outline-none focus:border-accent/50 resize-none"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => { setInput(''); setTitle(''); setTags([]); setNotes(''); setExpanded(false) }}
              className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-gray-500 transition-colors hover:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              Save to Knowledge Base
            </button>
          </div>
        </div>
      )}
    </form>
  )
}

// ─── Source Row ──────────────────────────────────────────────────

function SourceRow({ source, expanded, onToggle, selected, onSelect, canDelete }) {
  const typeCfg = SOURCE_TYPES[source.sourceType] || SOURCE_TYPES.article

  return (
    <div className="border-t border-surface-700/50 first:border-t-0">
      <div
        className={clsx('flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-800/30 cursor-pointer', expanded && 'bg-surface-800/20')}
        onClick={onToggle}
      >
        {canDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onSelect() }}
            className={clsx('flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
              selected ? 'border-accent bg-accent' : 'border-surface-500 hover:border-surface-400'
            )}
          >
            {selected && <Check className="h-2.5 w-2.5 text-white" />}
          </button>
        )}

        <SourceIcon type={source.sourceType} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-gray-200">{source.title}</p>
        </div>

        <div className="hidden items-center gap-1.5 sm:flex">
          {(source.tags || []).slice(0, 3).map((t) => (
            <span key={t} className="rounded-full bg-surface-700 px-2 py-0.5 text-[10px] text-gray-500">{t}</span>
          ))}
          {(source.tags || []).length > 3 && (
            <span className="text-[10px] text-gray-600">+{source.tags.length - 3}</span>
          )}
        </div>

        <span className="hidden text-[11px] text-gray-600 md:block">{formatRelativeTime(source.createdAt)}</span>

        <span className={clsx('rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize', STATUS_STYLES[source.status] || STATUS_STYLES.pending)}>
          {source.status}
        </span>

        <ChevronRight className={clsx('h-3.5 w-3.5 text-gray-600 transition-transform', expanded && 'rotate-90')} />
      </div>

      {expanded && (
        <div className="border-t border-surface-700/30 bg-surface-800/10 px-4 py-3 pl-12 space-y-2">
          {source.url && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">URL:</span>
              <a href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent hover:underline truncate">
                {source.url}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          )}
          {source.summary && (
            <div className="text-xs">
              <span className="text-gray-500">Summary: </span>
              <span className="text-gray-400">{source.summary}</span>
            </div>
          )}
          {source.rawPreview && (
            <div className="text-xs">
              <span className="text-gray-500">Preview: </span>
              <span className="text-gray-500 italic">{source.rawPreview.slice(0, 500)}{source.rawPreview.length > 500 ? '...' : ''}</span>
            </div>
          )}
          <div className="flex items-center gap-4 text-[11px] text-gray-600">
            <span>Chunks: {source.chunkCount}</span>
            <span>Added: {new Date(source.createdAt).toLocaleDateString()}</span>
            <span>Type: {typeCfg.label}</span>
          </div>
          {(source.tags || []).length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {source.tags.map((t) => (
                <span key={t} className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent">{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sources List ───────────────────────────────────────────────

function SourcesList({ sources, allTags, onDelete, onDeleteBulk, onRetagBulk }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [expandedId, setExpandedId] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [showBulkTag, setShowBulkTag] = useState(false)
  const [bulkTags, setBulkTags] = useState([])

  const filtered = useMemo(() => {
    let result = sources

    if (search) {
      const q = search.toLowerCase()
      result = result.filter((s) =>
        s.title.toLowerCase().includes(q) ||
        (s.summary || '').toLowerCase().includes(q) ||
        (s.tags || []).some((t) => t.includes(q))
      )
    }
    if (typeFilter !== 'all') {
      result = result.filter((s) => s.sourceType === typeFilter)
    }
    if (tagFilter) {
      result = result.filter((s) => (s.tags || []).includes(tagFilter))
    }

    if (sortBy === 'title') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title))
    }

    return result
  }, [sources, search, typeFilter, tagFilter, sortBy])

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleBulkDelete() {
    const deletable = [...selected].filter((id) => {
      const s = sources.find((x) => x.id === id)
      return s && !s.isMock
    })
    if (deletable.length === 0) return
    onDeleteBulk(deletable)
    setSelected(new Set())
  }

  function handleBulkRetag() {
    const retaggable = [...selected].filter((id) => {
      const s = sources.find((x) => x.id === id)
      return s && !s.isMock
    })
    if (retaggable.length === 0) return
    onRetagBulk(retaggable, bulkTags)
    setShowBulkTag(false)
    setBulkTags([])
    setSelected(new Set())
  }

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900">
      <div className="flex items-center gap-2 px-5 py-3.5">
        <FileText className="h-4 w-4 text-gray-500" />
        <h2 className="text-[14px] font-semibold text-gray-200">Sources</h2>
        <span className="rounded-full bg-surface-700 px-2 py-0.5 text-[10px] text-gray-500">{sources.length}</span>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-t border-b border-surface-700 px-4 py-2.5">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sources..."
            className="w-full rounded-lg border border-surface-600 bg-surface-800 py-1.5 pl-8 pr-3 text-xs text-gray-300 outline-none focus:border-accent/50"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-surface-600 bg-surface-800 px-2.5 py-1.5 text-xs text-gray-400 outline-none focus:border-accent/50"
        >
          <option value="all">All Types</option>
          {Object.entries(SOURCE_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="rounded-lg border border-surface-600 bg-surface-800 px-2.5 py-1.5 text-xs text-gray-400 outline-none focus:border-accent/50"
        >
          <option value="">All Tags</option>
          {allTags.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border border-surface-600 bg-surface-800 px-2.5 py-1.5 text-xs text-gray-400 outline-none focus:border-accent/50"
        >
          <option value="date">Newest First</option>
          <option value="title">By Title</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 border-b border-surface-700 bg-surface-800/30 px-4 py-2">
          <span className="text-[11px] text-gray-400">{selected.size} selected</span>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1 rounded-md border border-surface-600 px-2 py-1 text-[11px] text-status-offline transition-colors hover:bg-status-offline/10"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
          <button
            onClick={() => setShowBulkTag(!showBulkTag)}
            className="flex items-center gap-1 rounded-md border border-surface-600 px-2 py-1 text-[11px] text-accent transition-colors hover:bg-accent/10"
          >
            <Tags className="h-3 w-3" /> Re-tag
          </button>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-[11px] text-gray-500 hover:text-gray-300">
            Clear
          </button>
          {showBulkTag && (
            <div className="flex items-center gap-2">
              <TagInput tags={bulkTags} onChange={setBulkTags} suggestions={allTags} />
              <button onClick={handleBulkRetag} className="rounded-md bg-accent px-2 py-1 text-[11px] font-medium text-white hover:bg-accent/90">
                Apply
              </button>
            </div>
          )}
        </div>
      )}

      {/* Source rows */}
      <div className="max-h-[500px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Search className="mx-auto mb-2 h-6 w-6 text-gray-700" />
            <p className="text-sm text-gray-500">No sources match your filters.</p>
          </div>
        ) : (
          filtered.map((s) => (
            <SourceRow
              key={s.id}
              source={s}
              expanded={expandedId === s.id}
              onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
              selected={selected.has(s.id)}
              onSelect={() => toggleSelect(s.id)}
              canDelete={!s.isMock}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Knowledge Search (full-page) ───────────────────────────────

function HighlightedText({ text, terms }) {
  if (!terms.length || !text) return <>{text}</>
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = text.split(re)
  return (
    <>
      {parts.map((part, i) =>
        re.test(part)
          ? <mark key={i} className="rounded-sm bg-accent/20 px-0.5 text-accent">{part}</mark>
          : <span key={i}>{part}</span>
      )}
    </>
  )
}

function KnowledgeSearchSection() {
  const [query, setQuery] = useState('')
  const { results, searching, error, search, clear } = useKnowledgeSearch()
  const terms = query.trim().toLowerCase().split(/\s+/).filter((t) => t.length >= 2)

  function handleChange(e) {
    const q = e.target.value
    setQuery(q)
    if (q.trim().length >= 3) search(q)
    else clear()
  }

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Search className="h-4 w-4 text-gray-500" />
        <h2 className="text-[14px] font-semibold text-gray-200">Knowledge Search</h2>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-gray-600">
          <Command className="h-3 w-3" />
          <kbd className="rounded border border-surface-600 bg-surface-800 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">⌘K</kbd>
          for global search
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Ask your knowledge base anything..."
          className="w-full rounded-lg border border-surface-600 bg-surface-800 py-3 pl-10 pr-4 text-sm text-gray-200 outline-none placeholder:text-gray-600 focus:border-accent/50"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-status-offline/20 bg-status-offline/5 px-4 py-2.5 text-xs text-status-offline">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4 space-y-3">
          {results.map((r) => (
            <div key={r.id} className="rounded-xl border border-surface-700 bg-surface-800/30 p-4 transition-colors hover:bg-surface-800/50">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[13px] font-medium text-gray-200 truncate">{r.file}</h3>
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                      {Math.round(r.score * 100)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{r.path}{r.file}</p>
                  <div className="rounded-lg bg-surface-800/50 px-3 py-2 text-xs leading-relaxed text-gray-400">
                    <HighlightedText text={r.snippet} terms={terms} />
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(r.lastModified)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bot className="h-3 w-3" />
                      {r.lastUpdatedBy}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {query.trim().length >= 3 && !searching && results.length === 0 && !error && (
        <div className="mt-6 text-center">
          <Search className="mx-auto mb-2 h-6 w-6 text-gray-700" />
          <p className="text-sm text-gray-500">No results found for "{query}"</p>
          <p className="mt-1 text-[11px] text-gray-600">Try different keywords or check the sources list.</p>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────

export default function KnowledgePage() {
  const { sources, allTags, addSource, deleteSource, deleteBulk, retagBulk } = useKnowledgeSources()
  const [activeTab, setActiveTab] = useState('sources')

  return (
    <div className="space-y-6">
      {/* Ingestion input */}
      <IngestionInput onSubmit={addSource} allTags={allTags} />

      {/* Tab toggle */}
      <div className="flex items-center gap-1 rounded-lg bg-surface-800 p-0.5 w-fit">
        <button
          onClick={() => setActiveTab('sources')}
          className={clsx(
            'rounded-md px-4 py-1.5 text-[12px] font-medium transition-colors',
            activeTab === 'sources' ? 'bg-surface-600 text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-300'
          )}
        >
          Sources
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={clsx(
            'rounded-md px-4 py-1.5 text-[12px] font-medium transition-colors',
            activeTab === 'search' ? 'bg-surface-600 text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-300'
          )}
        >
          Search
        </button>
      </div>

      {/* Content */}
      {activeTab === 'sources' && (
        <SourcesList
          sources={sources}
          allTags={allTags}
          onDelete={deleteSource}
          onDeleteBulk={deleteBulk}
          onRetagBulk={retagBulk}
        />
      )}
      {activeTab === 'search' && <KnowledgeSearchSection />}
    </div>
  )
}

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { Search, X, FileText, Clock, Bot, Users, Building2, PenTool, CheckSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { useKnowledgeSearch } from '../hooks/useKnowledgeSearch'
import { formatRelativeTime } from '../utils/formatters'
import { Spinner } from './LoadingState'

// ─── Highlighted text ──────────────────────────────────────────

function HighlightedText({ text, terms }) {
  if (!terms.length) return <>{text}</>

  // Build a regex that matches any of the search terms
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = text.split(re)

  return (
    <>
      {parts.map((part, i) =>
        re.test(part) ? (
          <mark key={i} className="rounded-sm bg-accent/20 px-0.5 text-accent">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

// ─── Score indicator ───────────────────────────────────────────

function ScoreBar({ score }) {
  const pct = Math.round(score * 100)
  const color =
    score > 0.7 ? 'bg-status-online' :
    score > 0.4 ? 'bg-status-warning' :
    'bg-gray-500'

  return (
    <div className="flex items-center gap-1.5" title={`Relevance: ${pct}%`}>
      <div className="h-1 w-12 rounded-full bg-surface-700">
        <div className={clsx('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-gray-600">{pct}%</span>
    </div>
  )
}

// ─── Single result item ────────────────────────────────────────

function ResultItem({ result, terms, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex w-full gap-3 rounded-lg px-3.5 py-3 text-left transition-colors',
        isActive ? 'bg-surface-700/70' : 'hover:bg-surface-800/50'
      )}
    >
      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-600" />
      <div className="min-w-0 flex-1">
        {/* File name + score */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="min-w-0">
            <span className="text-[13px] font-medium text-gray-200">
              <HighlightedText text={result.file} terms={terms} />
            </span>
            <span className="ml-2 text-[10px] text-gray-600">{result.path}</span>
          </div>
          <ScoreBar score={result.score} />
        </div>

        {/* Snippet */}
        <div className="mb-1.5 text-xs leading-relaxed text-gray-400 line-clamp-3">
          <HighlightedText text={result.snippet} terms={terms} />
        </div>

        {/* Metadata row */}
        <div className="flex items-center gap-3 text-[10px] text-gray-600">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(result.lastModified)}
          </span>
          {result.lastUpdatedBy && (
            <span className="flex items-center gap-1">
              <Bot className="h-3 w-3" />
              {result.lastUpdatedBy}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── Contact score badge ────────────────────────────────────────

function ScoreBadge({ score }) {
  const color = score >= 80 ? 'bg-green-500/20 text-green-400' : score >= 60 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
  return <span className={clsx('rounded-full px-1.5 py-0.5 text-[9px] font-bold', color)}>{score}</span>
}

function ContactResultItem({ contact, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left transition-colors',
        isActive ? 'bg-surface-700/70' : 'hover:bg-surface-800/50'
      )}
    >
      <Users className="h-4 w-4 shrink-0 text-emerald-400" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-gray-200">{contact.name}</span>
          <ScoreBadge score={contact.score} />
        </div>
        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          {contact.company && (
            <span className="flex items-center gap-1">
              <Building2 className="h-2.5 w-2.5" />
              {contact.company}
            </span>
          )}
          {contact.role && <span>· {contact.role}</span>}
        </div>
      </div>
    </button>
  )
}

// ─── Generic search result ──────────────────────────────────────

function GenericResultItem({ icon: Icon, iconColor, title, sub, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left transition-colors',
        isActive ? 'bg-surface-700/70' : 'hover:bg-surface-800/50'
      )}
    >
      <Icon className={clsx('h-4 w-4 shrink-0', iconColor)} />
      <div className="min-w-0 flex-1">
        <span className="text-[13px] font-medium text-gray-200 block truncate">{title}</span>
        {sub && <span className="text-[11px] text-gray-500 block truncate">{sub}</span>}
      </div>
    </button>
  )
}

// ─── Main Component ────────────────────────────────────────────

const KnowledgeSearch = forwardRef(function KnowledgeSearch({ className, onClose }, ref) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const debounceRef = useRef(null)
  const navigate = useNavigate()
  const { results, contactResults, contentResults, taskResults, researchResults, searching, error, search, clear } = useKnowledgeSearch()

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus()
      setOpen(true)
    },
  }))

  const handleInputChange = useCallback(
    (e) => {
      const val = e.target.value
      setQuery(val)
      setActiveIndex(-1)

      if (debounceRef.current) clearTimeout(debounceRef.current)

      if (val.trim().length < 3) {
        clear()
        return
      }

      debounceRef.current = setTimeout(() => {
        search(val)
      }, 300)
    },
    [search, clear]
  )

  const handleClear = useCallback(() => {
    setQuery('')
    setActiveIndex(-1)
    clear()
    inputRef.current?.focus()
  }, [clear])

  const totalCount = contactResults.length + contentResults.length + taskResults.length + researchResults.length + results.length

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (!open || totalCount === 0) {
        if (e.key === 'Escape') {
          setOpen(false)
          inputRef.current?.blur()
          onClose?.()
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setActiveIndex((prev) => (prev < totalCount - 1 ? prev + 1 : 0))
          break
        case 'ArrowUp':
          e.preventDefault()
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalCount - 1))
          break
        case 'Enter':
          e.preventDefault()
          {
            let idx = activeIndex
            if (idx < 0) break
            if (idx < contactResults.length) { handleContactClick(contactResults[idx]); break }
            idx -= contactResults.length
            if (idx < contentResults.length) { navigate('/content'); setOpen(false); onClose?.(); break }
            idx -= contentResults.length
            if (idx < taskResults.length) { navigate('/tasks'); setOpen(false); onClose?.(); break }
            idx -= taskResults.length
            if (idx < researchResults.length) { navigate('/research'); setOpen(false); onClose?.(); break }
            idx -= researchResults.length
            if (idx < results.length) { handleResultClick() }
          }
          break
        case 'Escape':
          e.preventDefault()
          setOpen(false)
          inputRef.current?.blur()
          onClose?.()
          break
      }
    },
    [open, totalCount, activeIndex, contactResults, contentResults, taskResults, researchResults, results, navigate, onClose]
  )

  function handleContactClick(contact) {
    setOpen(false)
    onClose?.()
    navigate(`/crm?expand=${contact.id}`)
  }

  function handleResultClick() {
    setOpen(false)
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length >= 2)

  const showResults = open && query.trim().length >= 3
  const hasResults = results.length > 0 || contactResults.length > 0 || contentResults.length > 0 || taskResults.length > 0 || researchResults.length > 0

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      {/* Search input */}
      <div
        className={clsx(
          'flex items-center gap-2.5 rounded-xl border bg-surface-900 px-4 py-2.5 transition-colors',
          open ? 'border-accent/30 ring-1 ring-accent/10' : 'border-surface-700 hover:border-surface-600'
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search shared knowledge... (research notes, project docs, references)"
          className="min-w-0 flex-1 bg-transparent text-sm text-gray-200 placeholder:text-gray-600 outline-none"
        />
        <div className="flex items-center gap-2 shrink-0">
          {searching && <Spinner className="h-3.5 w-3.5" />}
          {query && (
            <button
              onClick={handleClear}
              aria-label="Clear search"
              className="rounded-md p-0.5 text-gray-600 transition-colors hover:bg-surface-700 hover:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {!open && (
            <kbd className="hidden rounded-md border border-surface-600 bg-surface-800 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 sm:inline-block">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Results dropdown */}
      {showResults && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[480px] overflow-y-auto rounded-xl border border-surface-700 bg-surface-900 shadow-2xl shadow-black/40">
          {searching && !hasResults ? (
            <div className="flex items-center justify-center gap-2 px-4 py-8 text-xs text-gray-500">
              <Spinner />
              Searching knowledge base...
            </div>
          ) : error ? (
            <div className="px-4 py-8 text-center text-xs text-status-offline">{error}</div>
          ) : hasResults ? (
            <div className="py-1.5">
              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-2 pt-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                  {totalCount} result{totalCount !== 1 ? 's' : ''}
                </span>
                <span className="text-[10px] text-gray-700">
                  ↑↓ navigate · ↵ select · esc close
                </span>
              </div>

              <div className="px-1.5 pb-1.5">
                {/* Contact results */}
                {contactResults.length > 0 && (
                  <>
                    <div className="px-2 pb-1 pt-1.5">
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-emerald-400/60">Contacts</span>
                    </div>
                    {contactResults.map((contact, i) => (
                      <ContactResultItem
                        key={contact.id}
                        contact={contact}
                        isActive={i === activeIndex}
                        onClick={() => handleContactClick(contact)}
                      />
                    ))}
                  </>
                )}

                {/* Content ideas */}
                {contentResults.length > 0 && (
                  <>
                    <div className="px-2 pb-1 pt-3">
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-pink-400/60">Content Ideas</span>
                    </div>
                    {contentResults.map((idea, i) => (
                      <GenericResultItem
                        key={idea.id}
                        icon={PenTool}
                        iconColor="text-pink-400"
                        title={idea.title}
                        sub={(idea.tags || []).join(', ')}
                        isActive={(i + contactResults.length) === activeIndex}
                        onClick={() => { navigate('/content'); setOpen(false); onClose?.() }}
                      />
                    ))}
                  </>
                )}

                {/* Tasks */}
                {taskResults.length > 0 && (
                  <>
                    <div className="px-2 pb-1 pt-3">
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-blue-400/60">Tasks</span>
                    </div>
                    {taskResults.map((task, i) => (
                      <GenericResultItem
                        key={task.id}
                        icon={CheckSquare}
                        iconColor="text-blue-400"
                        title={task.title}
                        sub={task.status === 'done' ? 'Done' : task.priority}
                        isActive={(i + contactResults.length + contentResults.length) === activeIndex}
                        onClick={() => { navigate('/tasks'); setOpen(false); onClose?.() }}
                      />
                    ))}
                  </>
                )}

                {/* Research queries */}
                {researchResults.length > 0 && (
                  <>
                    <div className="px-2 pb-1 pt-3">
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-cyan-400/60">Research</span>
                    </div>
                    {researchResults.map((entry, i) => (
                      <GenericResultItem
                        key={entry.id}
                        icon={Search}
                        iconColor="text-cyan-400"
                        title={entry.query}
                        sub={`${entry.timeframe} · ${entry.results?.posts?.length || 0} posts`}
                        isActive={(i + contactResults.length + contentResults.length + taskResults.length) === activeIndex}
                        onClick={() => { navigate('/research'); setOpen(false); onClose?.() }}
                      />
                    ))}
                  </>
                )}

                {/* Knowledge results */}
                {results.length > 0 && (
                  <>
                    <div className="px-2 pb-1 pt-3">
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-accent/60">Knowledge</span>
                    </div>
                    {results.map((result, i) => (
                      <ResultItem
                        key={result.id}
                        result={result}
                        terms={terms}
                        isActive={(i + contactResults.length + contentResults.length + taskResults.length + researchResults.length) === activeIndex}
                        onClick={() => handleResultClick()}
                      />
                    ))}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">No results found</p>
              <p className="mt-1 text-[11px] text-gray-600">
                Try broader terms or check that memory sync is current
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

export default KnowledgeSearch

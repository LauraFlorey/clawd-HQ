import { useState, useMemo } from 'react'
import {
  CheckSquare, ClipboardList, Zap, Plus, ChevronRight,
  Check, Circle, Trash2, ArrowUp, ArrowRight, ArrowDown, Calendar, Loader2,
} from 'lucide-react'
import clsx from 'clsx'
import { useTasks, extractTasksFromTranscript, parseQuickAdd } from '../hooks/useTasks'
import { formatRelativeTime } from '../utils/formatters'

// ─── Shared ─────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  high:   { label: 'High', letter: 'H', color: 'text-status-offline', bg: 'bg-status-offline/10', dot: 'bg-status-offline', icon: ArrowUp },
  medium: { label: 'Medium', letter: 'M', color: 'text-status-warning', bg: 'bg-status-warning/10', dot: 'bg-status-warning', icon: ArrowRight },
  low:    { label: 'Low', letter: 'L', color: 'text-gray-500', bg: 'bg-surface-700', dot: 'bg-gray-600', icon: ArrowDown },
}

function PriorityDot({ priority, className }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium
  return <span className={clsx('inline-block h-2 w-2 rounded-full', cfg.dot, className)} title={cfg.label} />
}

function PrioritySelect({ value, onChange, compact }) {
  if (compact) {
    return (
      <div className="flex items-center gap-0.5 rounded-lg bg-surface-800 p-0.5">
        {Object.entries(PRIORITY_CONFIG).map(([k, cfg]) => (
          <button
            key={k}
            type="button"
            onClick={() => onChange(k)}
            className={clsx(
              'rounded-md px-2 py-1 text-[11px] font-semibold transition-colors',
              value === k ? `${cfg.bg} ${cfg.color}` : 'text-gray-600 hover:text-gray-400'
            )}
          >
            {cfg.letter}
          </button>
        ))}
      </div>
    )
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-surface-600 bg-surface-800 px-2 py-1 text-[11px] text-gray-400 outline-none focus:border-accent/50"
    >
      {Object.entries(PRIORITY_CONFIG).map(([k, cfg]) => (
        <option key={k} value={k}>{cfg.label}</option>
      ))}
    </select>
  )
}

function StatusBadge({ status, onClick }) {
  const isDone = status === 'done'
  return (
    <button
      onClick={onClick}
      className={clsx(
        'rounded-full border px-2.5 py-0.5 text-[10px] font-medium capitalize transition-colors',
        isDone
          ? 'border-status-online/20 bg-status-online/10 text-status-online hover:bg-status-online/20'
          : 'border-status-warning/20 bg-status-warning/10 text-status-warning hover:bg-status-warning/20'
      )}
    >
      {status}
    </button>
  )
}

// ─── Transcript Processor (Left) ────────────────────────────────

function TranscriptProcessor({ onCreateTasks }) {
  const [transcript, setTranscript] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [edits, setEdits] = useState({})
  const [created, setCreated] = useState(false)

  function handleExtract() {
    setExtracting(true)
    setExtracted(null)
    setTimeout(() => {
      const tasks = extractTasksFromTranscript(transcript)
      setExtracted(tasks)
      setSelected(new Set(tasks.filter((t) => t.isOwner).map((t) => t.id)))
      setEdits({})
      setCreated(false)
      setExtracting(false)
    }, 500)
  }

  function getTask(t) {
    return { ...t, ...(edits[t.id] || {}) }
  }

  function updateEdit(id, field, value) {
    setEdits((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }))
  }

  function handleCreate() {
    if (selected.size === 0 || !extracted) return
    const toCreate = extracted.filter((t) => selected.has(t.id)).map(getTask)
    onCreateTasks(toCreate)
    setCreated(true)
  }

  function handleReset() {
    setTranscript('')
    setExtracted(null)
    setSelected(new Set())
    setEdits({})
    setCreated(false)
  }

  if (created) {
    return (
      <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="h-4 w-4 text-gray-500" />
          <h2 className="text-[14px] font-semibold text-gray-200">Transcript Processor</h2>
        </div>
        <div className="py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-status-online/10">
            <Check className="h-6 w-6 text-status-online" />
          </div>
          <p className="text-sm font-medium text-gray-200">{selected.size} task{selected.size !== 1 ? 's' : ''} created</p>
          <p className="mt-1 text-[11px] text-gray-500">Check the Recent Tasks list to see them.</p>
          <button onClick={handleReset} className="mt-4 rounded-lg border border-surface-600 px-4 py-1.5 text-[12px] font-medium text-gray-400 transition-colors hover:border-surface-500 hover:text-gray-200">
            Clear & Start New
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="h-4 w-4 text-gray-500" />
        <h2 className="text-[14px] font-semibold text-gray-200">Transcript Processor</h2>
      </div>

      {/* Input */}
      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Paste a meeting transcript, notes, or action items..."
        rows={6}
        className="w-full min-h-[160px] rounded-lg border border-surface-600 bg-surface-800 px-4 py-3 text-sm text-gray-300 outline-none placeholder:text-gray-600 focus:border-accent/50 resize-y"
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[10px] text-gray-600">Paste from Fathom, Otter.ai, Fireflies, or any transcript</p>
        <button
          onClick={handleExtract}
          disabled={!transcript.trim() || extracting}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-40"
        >
          {extracting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
          {extracting ? 'Extracting...' : 'Extract Tasks'}
        </button>
      </div>

      {/* Extracted tasks */}
      {extracted && (
        <div className="mt-5 border-t border-surface-700 pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[13px] font-semibold text-gray-200">Extracted Action Items</h3>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">{extracted.length}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <button onClick={() => setSelected(new Set(extracted.filter((t) => t.isOwner).map((t) => t.id)))} className="text-gray-500 hover:text-gray-300">Select All Mine</button>
              <span className="text-surface-700">|</span>
              <button onClick={() => setSelected(new Set(extracted.map((t) => t.id)))} className="text-gray-500 hover:text-gray-300">Select All</button>
              <span className="text-surface-700">|</span>
              <button onClick={() => setSelected(new Set())} className="text-gray-500 hover:text-gray-300">Clear</button>
            </div>
          </div>

          <div className="space-y-2">
            {extracted.map((t) => {
              const task = getTask(t)
              const isSelected = selected.has(t.id)
              return (
                <ExtractedTaskCard
                  key={t.id}
                  task={task}
                  selected={isSelected}
                  onToggle={() => {
                    const next = new Set(selected)
                    if (isSelected) next.delete(t.id); else next.add(t.id)
                    setSelected(next)
                  }}
                  onEdit={(field, value) => updateEdit(t.id, field, value)}
                />
              )
            })}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCreate}
              disabled={selected.size === 0}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-40"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              Create {selected.size} Selected Task{selected.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ExtractedTaskCard({ task, selected, onToggle, onEdit }) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [showDesc, setShowDesc] = useState(false)

  return (
    <div className={clsx('rounded-lg border p-3 transition-colors', selected ? 'border-accent/30 bg-accent/5' : 'border-surface-700 bg-surface-800/20')}>
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={clsx('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
            selected ? 'border-accent bg-accent' : 'border-surface-500 hover:border-surface-400'
          )}
        >
          {selected && <Check className="h-2.5 w-2.5 text-white" />}
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          {editingTitle ? (
            <input
              type="text"
              value={task.title}
              onChange={(e) => onEdit('title', e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => { if (e.key === 'Enter') setEditingTitle(false) }}
              className="w-full rounded border border-accent/40 bg-surface-800 px-2 py-0.5 text-[13px] text-gray-200 outline-none"
              autoFocus
            />
          ) : (
            <p className="text-[13px] font-medium text-gray-200 cursor-pointer hover:text-accent" onClick={() => setEditingTitle(true)}>
              {task.title}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-medium',
              task.isOwner ? 'bg-blue-500/10 text-blue-400' : 'bg-surface-700 text-gray-500'
            )}>
              {task.isOwner ? 'Mine' : task.assignee || 'Others'}
            </span>

            <PrioritySelect value={task.priority} onChange={(v) => onEdit('priority', v)} />

            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-600" />
              <input
                type="date"
                value={task.dueDate || ''}
                onChange={(e) => onEdit('dueDate', e.target.value || null)}
                className="rounded border border-surface-600 bg-surface-800 px-1.5 py-0.5 text-[11px] text-gray-400 outline-none focus:border-accent/50 [color-scheme:dark]"
              />
            </div>

            {task.description && (
              <button onClick={() => setShowDesc(!showDesc)} className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400">
                <ChevronRight className={clsx('h-3 w-3 transition-transform', showDesc && 'rotate-90')} />
                Details
              </button>
            )}
          </div>

          {showDesc && task.description && (
            <p className="rounded-lg bg-surface-800/40 px-3 py-2 text-[11px] text-gray-500">{task.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Quick Add + Recent Tasks (Right) ───────────────────────────

function QuickAdd({ onAdd }) {
  const [input, setInput] = useState('')
  const [priority, setPriority] = useState('medium')

  function handleSubmit(e) {
    e.preventDefault()
    if (!input.trim()) return
    const { title, dueDate } = parseQuickAdd(input)
    onAdd({ title, dueDate, priority, isOwner: true, source: 'quick-add' })
    setInput('')
    setPriority('medium')
  }

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-accent" />
        <h2 className="text-[14px] font-semibold text-gray-200">Quick Add</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Follow up with Sarah by Friday...'
          className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3 py-2.5 text-sm text-gray-300 outline-none placeholder:text-gray-600 focus:border-accent/50"
        />
        <div className="flex items-center justify-between">
          <PrioritySelect value={priority} onChange={setPriority} compact />
          <button
            type="submit"
            disabled={!input.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Task
          </button>
        </div>
      </form>
    </div>
  )
}

function RecentTasks({ tasks, onToggle, onDelete }) {
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  const filtered = useMemo(() => {
    if (filter === 'pending') return tasks.filter((t) => t.status === 'pending')
    if (filter === 'done') return tasks.filter((t) => t.status === 'done')
    return tasks
  }, [tasks, filter])

  const counts = useMemo(() => ({
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    done: tasks.filter((t) => t.status === 'done').length,
  }), [tasks])

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900">
      <div className="flex items-center gap-2 px-5 py-3.5">
        <CheckSquare className="h-4 w-4 text-gray-500" />
        <h2 className="text-[14px] font-semibold text-gray-200">Recent Tasks</h2>
        <span className="rounded-full bg-surface-700 px-2 py-0.5 text-[10px] text-gray-500">{tasks.length}</span>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-t border-surface-700 px-4 py-2">
        {[
          { id: 'all', label: 'All' },
          { id: 'pending', label: 'Pending' },
          { id: 'done', label: 'Done' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={clsx(
              'rounded-md px-3 py-1 text-[11px] font-medium transition-colors',
              filter === tab.id ? 'bg-surface-700 text-gray-200' : 'text-gray-500 hover:text-gray-300'
            )}
          >
            {tab.label}
            <span className="ml-1 text-gray-600">{counts[tab.id]}</span>
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="max-h-[400px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-8 text-center">
            <Circle className="mx-auto mb-2 h-6 w-6 text-gray-700" />
            <p className="text-sm text-gray-500">No tasks {filter !== 'all' ? `with status "${filter}"` : 'yet'}</p>
          </div>
        ) : (
          filtered.map((task) => (
            <div key={task.id} className="border-t border-surface-700/50">
              <div
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-800/30 cursor-pointer"
                onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
              >
                <StatusBadge status={task.status} onClick={(e) => { e.stopPropagation(); if (!task.isMock) onToggle(task.id) }} />
                <p className={clsx('flex-1 truncate text-[13px]', task.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-200')}>
                  {task.title}
                </p>
                {task.dueDate && (
                  <span className="hidden text-[11px] text-gray-600 sm:block">{task.dueDate}</span>
                )}
                <PriorityDot priority={task.priority} />
                <ChevronRight className={clsx('h-3 w-3 text-gray-600 transition-transform', expandedId === task.id && 'rotate-90')} />
              </div>

              {expandedId === task.id && (
                <div className="border-t border-surface-700/30 bg-surface-800/10 px-4 py-3 pl-10 space-y-1.5">
                  {task.description && <p className="text-xs text-gray-400">{task.description}</p>}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-600">
                    <span>Priority: <span className={PRIORITY_CONFIG[task.priority]?.color}>{PRIORITY_CONFIG[task.priority]?.label}</span></span>
                    {task.assignee && <span>Assignee: <span className="text-gray-400">{task.assignee}</span></span>}
                    <span>Source: {task.source}</span>
                    <span>Created: {formatRelativeTime(task.createdAt)}</span>
                    {task.completedAt && <span>Completed: {formatRelativeTime(task.completedAt)}</span>}
                  </div>
                  {!task.isMock && (
                    <button
                      onClick={() => onDelete(task.id)}
                      className="mt-1 flex items-center gap-1 rounded-md text-[11px] text-gray-600 transition-colors hover:text-status-offline"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────

export default function TasksPage() {
  const { tasks, addTask, addTasksBulk, toggleStatus, deleteTask } = useTasks()

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
      {/* Left — Transcript Processor (60%) */}
      <div className="xl:col-span-3">
        <TranscriptProcessor onCreateTasks={addTasksBulk} />
      </div>

      {/* Right — Quick Add + Recent Tasks (40%) */}
      <div className="space-y-6 xl:col-span-2">
        <QuickAdd onAdd={addTask} />
        <RecentTasks tasks={tasks} onToggle={toggleStatus} onDelete={deleteTask} />
      </div>
    </div>
  )
}

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  ExternalLink,
  Globe,
  Code,
  Shield,
  Database,
  Monitor,
  FileText,
  Zap,
  Heart,
  Link as LinkIcon,
  ChevronDown,
} from 'lucide-react'
import clsx from 'clsx'

// ─── Constants ───────────────────────────────────────────────────

const STORAGE_KEY = 'clawd-dashboard-links'

const ICON_OPTIONS = [
  { id: 'globe', label: 'Globe', icon: Globe },
  { id: 'code', label: 'Code', icon: Code },
  { id: 'shield', label: 'Shield', icon: Shield },
  { id: 'database', label: 'Database', icon: Database },
  { id: 'monitor', label: 'Monitor', icon: Monitor },
  { id: 'file', label: 'File', icon: FileText },
  { id: 'zap', label: 'Zap', icon: Zap },
  { id: 'heart', label: 'Heart', icon: Heart },
]

const ICON_MAP = Object.fromEntries(ICON_OPTIONS.map((o) => [o.id, o.icon]))

const DEFAULT_LINKS = [
  {
    id: crypto.randomUUID(),
    title: 'OpenClaw Admin',
    url: 'http://127.0.0.1:18789',
    description: 'Gateway dashboard, debug, logs',
    category: 'Admin',
    icon: null,
    order: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: 'Anthropic Console',
    url: 'https://console.anthropic.com',
    description: null,
    category: 'AI Tools',
    icon: null,
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: 'Claude',
    url: 'https://claude.ai',
    description: null,
    category: 'AI Tools',
    icon: null,
    order: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: 'Cursor',
    url: 'https://cursor.sh',
    description: null,
    category: 'Dev Tools',
    icon: null,
    order: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: 'GitHub (workspace)',
    url: 'https://github.com/your-username/your-repo',
    description: 'Workspace repo',
    category: 'Dev Tools',
    icon: null,
    order: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: 'Tailscale',
    url: 'https://login.tailscale.com/admin',
    description: 'Network admin',
    category: 'Admin',
    icon: null,
    order: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    title: 'Example Org',
    url: 'https://www.example-org.com',
    description: null,
    category: 'Work',
    icon: null,
    order: 6,
    createdAt: new Date().toISOString(),
  },
]

// ─── Helpers ─────────────────────────────────────────────────────

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function getFaviconUrl(url) {
  const domain = getDomain(url)
  if (!domain || domain === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(domain)) return null
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`
}

function isValidUrl(str) {
  try {
    const u = new URL(str)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

// ─── useLinks hook ───────────────────────────────────────────────

function useLinks() {
  const [links, setLinks] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch { /* fall through */ }
    return DEFAULT_LINKS
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
  }, [links])

  const categories = useMemo(() => {
    const cats = new Set(links.map((l) => l.category))
    return Array.from(cats).sort()
  }, [links])

  const addLink = useCallback((data) => {
    setLinks((prev) => [
      ...prev,
      {
        ...data,
        id: crypto.randomUUID(),
        order: prev.length,
        createdAt: new Date().toISOString(),
      },
    ])
  }, [])

  const updateLink = useCallback((id, data) => {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)))
  }, [])

  const deleteLink = useCallback((id) => {
    setLinks((prev) => prev.filter((l) => l.id !== id))
  }, [])

  return { links, categories, addLink, updateLink, deleteLink }
}

// ─── Favicon with fallback ───────────────────────────────────────

function FaviconImg({ url, className }) {
  const [failed, setFailed] = useState(false)
  const src = getFaviconUrl(url)

  // Reset failed state when URL changes
  const prevSrc = useRef(src)
  if (prevSrc.current !== src) {
    prevSrc.current = src
    if (failed) setFailed(false)
  }

  if (!src || failed) {
    return <Globe className={clsx('text-gray-500', className)} />
  }

  return (
    <img
      src={src}
      alt=""
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  )
}

// ─── Link icon display ──────────────────────────────────────────

function LinkIconDisplay({ link, size = 'h-5 w-5' }) {
  if (link.icon && ICON_MAP[link.icon]) {
    const Icon = ICON_MAP[link.icon]
    return <Icon className={clsx(size, 'text-gray-400')} />
  }
  return <FaviconImg url={link.url} className={size} />
}

// ─── Link Card ──────────────────────────────────────────────────

function LinkCard({ link, onEdit, onDelete }) {
  const domain = getDomain(link.url)

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex items-start gap-3.5 rounded-xl border border-surface-700 bg-surface-900 p-4 transition-all hover:border-surface-600 hover:bg-surface-800/70 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
    >
      {/* Icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-800 ring-1 ring-surface-700 group-hover:ring-surface-600">
        <LinkIconDisplay link={link} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-[13px] font-semibold text-gray-200 group-hover:text-gray-100">
            {link.title}
          </h3>
          <ExternalLink className="h-3 w-3 shrink-0 text-gray-700 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        {link.description && (
          <p className="mt-0.5 truncate text-[11px] text-gray-500">{link.description}</p>
        )}
        <p className="mt-1 truncate text-[10px] font-mono text-gray-600">{domain}</p>
      </div>

      {/* Edit / Delete — shown on hover */}
      <div className="absolute right-2.5 top-2.5 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(link) }}
          className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-surface-700 hover:text-gray-300"
          title="Edit link"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(link) }}
          className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-surface-700 hover:text-status-offline"
          title="Delete link"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </a>
  )
}

// ─── Confirm Delete Dialog ───────────────────────────────────────

function ConfirmDialog({ link, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-xl border border-surface-700 bg-surface-900 p-6 shadow-2xl shadow-black/40">
        <h3 className="text-sm font-semibold text-gray-100">Delete link?</h3>
        <p className="mt-2 text-[13px] text-gray-400">
          Are you sure you want to delete <span className="font-medium text-gray-300">{link.title}</span>? This can't be undone.
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-surface-600 bg-surface-800 px-3.5 py-2 text-[12px] font-medium text-gray-400 transition-colors hover:border-surface-500 hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-status-offline/15 border border-status-offline/30 px-3.5 py-2 text-[12px] font-medium text-status-offline transition-colors hover:bg-status-offline/25"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Icon Picker ─────────────────────────────────────────────────

function IconPicker({ value, onChange, url }) {
  // Only attempt favicon preview for valid, complete URLs
  const showFavicon = url && isValidUrl(url) && getDomain(url).includes('.')

  return (
    <div className="flex flex-wrap gap-1.5">
      {/* Favicon option */}
      <button
        type="button"
        onClick={() => onChange(null)}
        className={clsx(
          'flex h-8 w-8 items-center justify-center rounded-lg border transition-colors',
          value === null
            ? 'border-accent/50 bg-accent/10'
            : 'border-surface-600 bg-surface-800 hover:border-surface-500'
        )}
        title="Auto favicon"
      >
        {showFavicon
          ? <FaviconImg url={url} className="h-4 w-4" />
          : <Globe className="h-4 w-4 text-gray-500" />
        }
      </button>
      {/* Lucide icon options */}
      {ICON_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={clsx(
            'flex h-8 w-8 items-center justify-center rounded-lg border transition-colors',
            value === opt.id
              ? 'border-accent/50 bg-accent/10 text-accent'
              : 'border-surface-600 bg-surface-800 text-gray-500 hover:border-surface-500 hover:text-gray-300'
          )}
          title={opt.label}
        >
          <opt.icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  )
}

// ─── Category Dropdown ───────────────────────────────────────────

function CategorySelect({ value, onChange, categories }) {
  const [open, setOpen] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [adding, setAdding] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [open])

  function handleAddNew() {
    if (newCat.trim()) {
      onChange(newCat.trim())
      setNewCat('')
      setAdding(false)
      setOpen(false)
    }
  }

  const allCats = useMemo(() => {
    const base = ['Uncategorized', ...categories.filter((c) => c !== 'Uncategorized')]
    return [...new Set(base)]
  }, [categories])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="settings-input flex items-center justify-between gap-2 text-left text-sm"
      >
        <span className={value ? 'text-gray-200' : 'text-gray-600'}>{value || 'Select category'}</span>
        <ChevronDown className={clsx('h-3.5 w-3.5 text-gray-600 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-surface-600 bg-surface-800 py-1 shadow-xl shadow-black/30">
          {allCats.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => { onChange(cat); setOpen(false) }}
              className={clsx(
                'flex w-full px-3 py-1.5 text-left text-[12px] transition-colors',
                cat === value ? 'bg-surface-700 text-gray-100' : 'text-gray-400 hover:bg-surface-700/50 hover:text-gray-200'
              )}
            >
              {cat}
            </button>
          ))}
          <div className="border-t border-surface-700 mt-1 pt-1">
            {adding ? (
              <div className="flex items-center gap-1.5 px-2 pb-1">
                <input
                  type="text"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddNew(); if (e.key === 'Escape') setAdding(false) }}
                  placeholder="Category name"
                  className="flex-1 rounded-md border border-surface-600 bg-surface-900 px-2 py-1 text-[12px] text-gray-200 placeholder:text-gray-600 outline-none focus:border-accent"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddNew}
                  className="rounded-md bg-accent/15 px-2 py-1 text-[11px] font-medium text-accent hover:bg-accent/25"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-gray-500 hover:bg-surface-700/50 hover:text-gray-300"
              >
                <Plus className="h-3 w-3" />
                Add new...
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Add / Edit Modal ────────────────────────────────────────────

function LinkModal({ link, categories, onSave, onClose }) {
  const [title, setTitle] = useState(link?.title ?? '')
  const [url, setUrl] = useState(link?.url ?? '')
  const [description, setDescription] = useState(link?.description ?? '')
  const [category, setCategory] = useState(link?.category ?? 'Uncategorized')
  const [icon, setIcon] = useState(link?.icon ?? null)
  const [errors, setErrors] = useState({})

  const isEdit = !!link?.id

  function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!title.trim()) errs.title = 'Title is required'
    if (!url.trim()) errs.url = 'URL is required'
    else if (!isValidUrl(url.trim())) errs.url = 'Enter a valid URL (http:// or https://)'
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSave({
      title: title.trim(),
      url: url.trim(),
      description: description.trim() || null,
      category: category || 'Uncategorized',
      icon,
    })
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-surface-700 bg-surface-900 shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-700 px-5 py-3.5">
          <h3 className="text-[13px] font-semibold text-gray-200">
            {isEdit ? 'Edit Link' : 'Add Link'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-600 transition-colors hover:bg-surface-700 hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {/* Title */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: null })) }}
              className={clsx('settings-input', errors.title && 'border-status-offline/50')}
              placeholder="e.g. GitHub"
              autoFocus
            />
            {errors.title && <p className="mt-0.5 text-[10px] text-status-offline">{errors.title}</p>}
          </div>

          {/* URL */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">URL *</label>
            <input
              type="text"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setErrors((p) => ({ ...p, url: null })) }}
              className={clsx('settings-input', errors.url && 'border-status-offline/50')}
              placeholder="https://example.com"
            />
            {errors.url && <p className="mt-0.5 text-[10px] text-status-offline">{errors.url}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="settings-input"
              placeholder="Optional short description"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">Category</label>
            <CategorySelect value={category} onChange={setCategory} categories={categories} />
          </div>

          {/* Icon */}
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-gray-500">Icon</label>
            <IconPicker value={icon} onChange={setIcon} url={url} />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-surface-600 bg-surface-800 px-3.5 py-2 text-[12px] font-medium text-gray-400 transition-colors hover:border-surface-500 hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              {isEdit ? 'Save Changes' : 'Add Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────

function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-700 py-16 px-4 text-center">
      <div className="mb-4 rounded-2xl bg-surface-800/60 p-5 ring-1 ring-surface-700">
        <Plus className="h-10 w-10 text-gray-600" />
      </div>
      <p className="text-sm font-medium text-gray-400">No links yet.</p>
      <p className="mt-1 text-[12px] text-gray-600">Click "Add Link" to get started.</p>
      <button
        onClick={onAdd}
        className="mt-4 flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-accent-hover"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Link
      </button>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────

export default function LinksPage() {
  const { links, categories, addLink, updateLink, deleteLink } = useLinks()
  const [activeCategory, setActiveCategory] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLink, setEditingLink] = useState(null)
  const [deletingLink, setDeletingLink] = useState(null)

  const filteredLinks = useMemo(() => {
    const sorted = [...links].sort((a, b) => a.order - b.order)
    if (activeCategory === 'all') return sorted
    return sorted.filter((l) => l.category === activeCategory)
  }, [links, activeCategory])

  function handleOpenAdd() {
    setEditingLink(null)
    setModalOpen(true)
  }

  function handleEdit(link) {
    setEditingLink(link)
    setModalOpen(true)
  }

  function handleSave(data) {
    if (editingLink) {
      updateLink(editingLink.id, data)
    } else {
      addLink(data)
    }
    setModalOpen(false)
    setEditingLink(null)
  }

  function handleConfirmDelete() {
    if (deletingLink) {
      deleteLink(deletingLink.id)
      setDeletingLink(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-gray-100">Links</h1>
          <p className="mt-0.5 text-[12px] text-gray-500">Quick access to your tools and resources</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Link
        </button>
      </div>

      {/* Category tabs */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveCategory('all')}
            className={clsx(
              'rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors',
              activeCategory === 'all'
                ? 'bg-accent/15 text-accent'
                : 'bg-surface-800 text-gray-500 hover:bg-surface-700 hover:text-gray-300'
            )}
          >
            All
            <span className="ml-1.5 text-[10px] opacity-60">{links.length}</span>
          </button>
          {categories.map((cat) => {
            const count = links.filter((l) => l.category === cat).length
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={clsx(
                  'rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors',
                  activeCategory === cat
                    ? 'bg-accent/15 text-accent'
                    : 'bg-surface-800 text-gray-500 hover:bg-surface-700 hover:text-gray-300'
                )}
              >
                {cat}
                <span className="ml-1.5 text-[10px] opacity-60">{count}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Link grid or empty state */}
      {filteredLinks.length === 0 && links.length === 0 ? (
        <EmptyState onAdd={handleOpenAdd} />
      ) : filteredLinks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-700 py-12 text-center">
          <LinkIcon className="mx-auto h-8 w-8 text-gray-700" />
          <p className="mt-3 text-[13px] text-gray-500">No links in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLinks.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              onEdit={handleEdit}
              onDelete={setDeletingLink}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <LinkModal
          link={editingLink}
          categories={categories}
          onSave={handleSave}
          onClose={() => { setModalOpen(false); setEditingLink(null) }}
        />
      )}

      {/* Delete confirmation */}
      {deletingLink && (
        <ConfirmDialog
          link={deletingLink}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingLink(null)}
        />
      )}
    </div>
  )
}

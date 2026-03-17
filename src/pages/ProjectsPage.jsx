import { useState, useMemo } from 'react'
import { Folder, Plus, Search, Archive, Trash2, ExternalLink, Calendar, Tag, ChevronRight, FileText } from 'lucide-react'
import clsx from 'clsx'
import { formatRelativeTime } from '../utils/formatters'

// Simple localStorage hook for projects
function useProjects() {
  const [projects, setProjects] = useState(() => {
    try {
      const stored = localStorage.getItem('clawd-projects')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const saveProjects = (newProjects) => {
    setProjects(newProjects)
    localStorage.setItem('clawd-projects', JSON.stringify(newProjects))
  }

  const addProject = (project) => {
    const newProject = {
      id: `proj-${Date.now()}`,
      ...project,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
    }
    saveProjects([newProject, ...projects])
    return newProject
  }

  const updateProject = (id, updates) => {
    saveProjects(
      projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      )
    )
  }

  const deleteProject = (id) => {
    saveProjects(projects.filter((p) => p.id !== id))
  }

  const archiveProject = (id) => {
    updateProject(id, { status: 'archived' })
  }

  return { projects, addProject, updateProject, deleteProject, archiveProject }
}

export default function ProjectsPage() {
  const { projects, addProject, updateProject, deleteProject, archiveProject } = useProjects()
  const [searchQuery, setSearchQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    tags: [],
    notes: '',
    links: [],
  })

  const filteredProjects = useMemo(() => {
    let filtered = projects.filter((p) =>
      showArchived ? p.status === 'archived' : p.status === 'active'
    )

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      )
    }

    return filtered
  }, [projects, searchQuery, showArchived])

  const handleCreateProject = () => {
    if (!newProject.name.trim()) return

    const created = addProject(newProject)
    setSelectedProject(created)
    setIsCreating(false)
    setNewProject({ name: '', description: '', tags: [], notes: '', links: [] })
  }

  const handleAddLink = () => {
    if (!selectedProject) return
    const url = prompt('Enter URL:')
    if (!url) return
    const title = prompt('Link title (optional):') || url
    
    const newLink = { url, title, addedAt: new Date().toISOString() }
    const updatedLinks = [...(selectedProject.links || []), newLink]
    
    // Update selectedProject immediately for UI responsiveness
    const updatedProject = {
      ...selectedProject,
      links: updatedLinks,
      updatedAt: new Date().toISOString()
    }
    setSelectedProject(updatedProject)
    
    // Update storage
    updateProject(selectedProject.id, {
      links: updatedLinks,
      updatedAt: updatedProject.updatedAt
    })
  }

  const handleSaveNotes = (notes) => {
    if (!selectedProject) return
    
    // Update selectedProject immediately for UI responsiveness
    const updatedProject = {
      ...selectedProject,
      notes,
      updatedAt: new Date().toISOString()
    }
    setSelectedProject(updatedProject)
    
    // Update storage
    updateProject(selectedProject.id, { 
      notes,
      updatedAt: updatedProject.updatedAt
    })
    setEditingNotes(false)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-gray-100">Projects</h1>
          <p className="text-sm text-gray-400">
            Collaborative workspaces for stories, code, research, and more
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Search & Filter */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full rounded-lg border border-surface-600 bg-surface-800 py-2 pl-10 pr-4 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none"
          />
        </div>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={clsx(
            'flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
            showArchived
              ? 'border-accent/50 bg-accent/10 text-accent'
              : 'border-surface-600 bg-surface-800 text-gray-400 hover:text-gray-300'
          )}
        >
          <Archive className="h-4 w-4" />
          {showArchived ? 'Hide Archived' : 'Show Archived'}
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Project List */}
        <div className={clsx(
          'flex flex-col overflow-hidden rounded-xl border border-surface-600 bg-surface-700',
          selectedProject ? 'w-80' : 'flex-1'
        )}>
          <div className="border-b border-surface-600 px-4 py-3">
            <h2 className="text-sm font-medium text-gray-300">
              {showArchived ? 'Archived Projects' : 'Active Projects'} ({filteredProjects.length})
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-gray-500">
                <Folder className="mr-2 h-4 w-4" />
                {searchQuery ? 'No matching projects' : showArchived ? 'No archived projects' : 'No projects yet'}
              </div>
            ) : (
              filteredProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={clsx(
                    'w-full border-b border-surface-600 px-4 py-3 text-left transition-colors hover:bg-surface-600/50',
                    selectedProject?.id === project.id && 'bg-accent/10'
                  )}
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium text-gray-200 line-clamp-1">{project.name}</h3>
                  </div>
                  {project.description && (
                    <p className="mb-1.5 text-xs text-gray-400 line-clamp-2">{project.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatRelativeTime(project.updatedAt)}
                    </span>
                    {project.tags && project.tags.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {project.tags.length}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Project Detail */}
        {selectedProject && (
          <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-surface-600 bg-surface-700">
            {/* Detail Header */}
            <div className="border-b border-surface-600 px-4 py-3">
              <div className="mb-2 flex items-start justify-between">
                <h2 className="text-lg font-medium text-gray-200">{selectedProject.name}</h2>
                <div className="flex items-center gap-2">
                  {selectedProject.status === 'active' && (
                    <button
                      onClick={() => archiveProject(selectedProject.id)}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-surface-600 hover:text-gray-300"
                      title="Archive project"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm('Delete this project?')) {
                        deleteProject(selectedProject.id)
                        setSelectedProject(null)
                      }
                    }}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-surface-600 hover:text-red-400"
                    title="Delete project"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {selectedProject.description && (
                <p className="text-sm text-gray-400">{selectedProject.description}</p>
              )}
              {selectedProject.tags && selectedProject.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selectedProject.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Content Sections */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Links Section */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-300">Links & Resources</h3>
                  <button
                    onClick={handleAddLink}
                    className="text-xs text-accent hover:text-accent/80"
                  >
                    + Add Link
                  </button>
                </div>
                {selectedProject.links && selectedProject.links.length > 0 ? (
                  <div className="space-y-2">
                    {selectedProject.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-surface-600 bg-surface-800 p-2 text-sm transition-colors hover:border-accent/30"
                      >
                        <ExternalLink className="h-4 w-4 text-gray-500" />
                        <span className="flex-1 text-gray-300">{link.title}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No links yet</p>
                )}
              </div>

              {/* Notes Section */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-300">Notes</h3>
                  {!editingNotes && (
                    <button
                      onClick={() => setEditingNotes(true)}
                      className="text-xs text-accent hover:text-accent/80"
                    >
                      Edit
                    </button>
                  )}
                </div>
                {editingNotes ? (
                  <div>
                    <textarea
                      defaultValue={selectedProject.notes || ''}
                      className="mb-2 w-full rounded-lg border border-surface-600 bg-surface-800 p-3 text-sm text-gray-300 focus:border-accent/50 focus:outline-none"
                      rows={12}
                      placeholder="Add notes, research, ideas..."
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setEditingNotes(false)
                      }}
                      ref={(el) => el?.focus()}
                      onChange={(e) => {
                        // Auto-save on change (debounced would be better in production)
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          const textarea = e.target.closest('div').previousElementSibling
                          handleSaveNotes(textarea.value)
                        }}
                        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-black hover:bg-accent/90"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNotes(false)}
                        className="rounded-lg border border-surface-600 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-surface-600 bg-surface-800 p-3">
                    {selectedProject.notes ? (
                      <pre className="whitespace-pre-wrap text-sm text-gray-300">{selectedProject.notes}</pre>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No notes yet</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-lg rounded-xl border border-surface-600 bg-surface-700 p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-100">New Project</h2>
            
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Project name"
                  className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-sm text-gray-200 focus:border-accent/50 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-300">Description (optional)</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="What's this project about?"
                  className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-sm text-gray-200 focus:border-accent/50 focus:outline-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsCreating(false)
                  setNewProject({ name: '', description: '', tags: [], notes: '', links: [] })
                }}
                className="rounded-lg border border-surface-600 px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProject.name.trim()}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-black hover:bg-accent/90 disabled:opacity-50"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useCallback, useMemo } from 'react'
// Mock data disabled - using real data only
// import { mockTasks } from '../data/mockData'

const LS_KEY = 'clawd-tasks'

function loadUserTasks() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveUserTasks(tasks) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(tasks)) } catch {}
}

export function useTasks() {
  const [userTasks, setUserTasks] = useState(loadUserTasks)

  const allTasks = useMemo(
    () => [...userTasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [userTasks]
  )

  const addTask = useCallback(({ title, description, assignee, isOwner, priority, dueDate, source }) => {
    const task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      description: description || null,
      assignee: assignee || null,
      isOwner: isOwner ?? true,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      status: 'pending',
      source: source || 'direct',
      createdAt: new Date().toISOString(),
      completedAt: null,
      isMock: false,
    }
    setUserTasks((prev) => {
      const next = [task, ...prev]
      saveUserTasks(next)
      return next
    })
    return task
  }, [])

  const addTasksBulk = useCallback((tasks) => {
    const created = tasks.map((t) => ({
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: t.title,
      description: t.description || null,
      assignee: t.assignee || null,
      isOwner: t.isOwner ?? true,
      priority: t.priority || 'medium',
      dueDate: t.dueDate || null,
      status: 'pending',
      source: t.source || 'extraction',
      createdAt: new Date().toISOString(),
      completedAt: null,
      isMock: false,
    }))
    setUserTasks((prev) => {
      const next = [...created, ...prev]
      saveUserTasks(next)
      return next
    })
    return created
  }, [])

  const toggleStatus = useCallback((id) => {
    setUserTasks((prev) => {
      const next = prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === 'done' ? 'pending' : 'done', completedAt: t.status === 'done' ? null : new Date().toISOString() }
          : t
      )
      saveUserTasks(next)
      return next
    })
  }, [])

  const deleteTask = useCallback((id) => {
    setUserTasks((prev) => {
      const next = prev.filter((t) => t.id !== id)
      saveUserTasks(next)
      return next
    })
  }, [])

  return { tasks: allTasks, addTask, addTasksBulk, toggleStatus, deleteTask }
}

// ─── Mock Transcript Extraction ─────────────────────────────────

// TODO: Replace with actual LLM extraction via Jinx API
// In production, this would POST the transcript to the gateway:
//   POST http://{host}:{port}/api/extract-tasks
//   Body: { transcript: string }
//   Response: { tasks: [...] }

const MOCK_TEMPLATES = [
  { title: 'Send updated timeline to the team', isOwner: true, priority: 'high', assignee: null },
  { title: 'Research pricing models for the new tier', isOwner: true, priority: 'medium', assignee: null },
  { title: 'Schedule follow-up meeting for next Tuesday', isOwner: true, priority: 'medium', assignee: null },
  { title: 'Draft the executive summary by end of week', isOwner: true, priority: 'high', assignee: null },
  { title: 'Review and approve the design mockups', isOwner: false, priority: 'medium', assignee: 'Sarah' },
  { title: 'Set up staging environment for demo', isOwner: false, priority: 'low', assignee: 'DevOps' },
  { title: 'Compile patient satisfaction survey results', isOwner: true, priority: 'medium', assignee: null },
  { title: 'Prepare onboarding materials for new hires', isOwner: false, priority: 'low', assignee: 'HR' },
  { title: 'Update the compliance documentation', isOwner: true, priority: 'high', assignee: null },
  { title: 'Coordinate with vendor on integration timeline', isOwner: true, priority: 'medium', assignee: null },
]

function seeded(s) {
  const x = Math.sin(s * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

export function extractTasksFromTranscript(transcript) {
  const text = transcript.trim()
  if (!text) return []

  const seed = text.length * 7 + text.charCodeAt(0)
  const count = 4 + Math.floor(seeded(seed) * 3)
  const shuffled = [...MOCK_TEMPLATES].sort((a, b) => seeded(seed + a.title.length) - seeded(seed + b.title.length))

  return shuffled.slice(0, count).map((t, i) => ({
    ...t,
    id: `extract-${i}`,
    description: `Extracted from meeting transcript (line ~${Math.floor(seeded(seed + i) * Math.max(1, text.split('\n').length))}).`,
    dueDate: seeded(seed + i * 3) > 0.5 ? new Date(Date.now() + (2 + Math.floor(seeded(seed + i * 5) * 10)) * 86400000).toISOString().slice(0, 10) : null,
  }))
}

// ─── Smart Date Parsing ─────────────────────────────────────────

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const MONTH_NAMES = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
const MONTH_SHORT = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

export function parseQuickAdd(text) {
  let title = text.trim()
  let dueDate = null

  const dateMatch = title.match(/\bby\s+((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i)
  if (dateMatch) {
    const monthStr = dateMatch[1].toLowerCase().slice(0, 3)
    const day = parseInt(dateMatch[2], 10)
    const monthIdx = MONTH_SHORT.indexOf(monthStr)
    if (monthIdx >= 0 && day >= 1 && day <= 31) {
      const now = new Date()
      let year = now.getFullYear()
      const candidate = new Date(year, monthIdx, day)
      if (candidate < now) candidate.setFullYear(year + 1)
      dueDate = candidate.toISOString().slice(0, 10)
      title = title.replace(dateMatch[0], '').trim()
    }
  }

  if (!dueDate) {
    const byMatch = title.match(/\bby\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|eod|end of (?:day|week))\b/i)
    if (byMatch) {
      const when = byMatch[1].toLowerCase()
      const now = new Date()

      if (when === 'today' || when === 'eod' || when === 'end of day') {
        dueDate = now.toISOString().slice(0, 10)
      } else if (when === 'tomorrow') {
        now.setDate(now.getDate() + 1)
        dueDate = now.toISOString().slice(0, 10)
      } else if (when === 'end of week') {
        const daysTilFri = (5 - now.getDay() + 7) % 7 || 7
        now.setDate(now.getDate() + daysTilFri)
        dueDate = now.toISOString().slice(0, 10)
      } else {
        const target = DAY_NAMES.indexOf(when)
        if (target >= 0) {
          const diff = (target - now.getDay() + 7) % 7 || 7
          now.setDate(now.getDate() + diff)
          dueDate = now.toISOString().slice(0, 10)
        }
      }

      title = title.replace(/\s*by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|eod|end of (?:day|week))\s*/i, ' ').trim()
    }
  }

  return { title, dueDate }
}

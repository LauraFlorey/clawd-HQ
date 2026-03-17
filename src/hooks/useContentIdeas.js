import { useState, useCallback, useMemo } from 'react'
import { mockContentIdeas } from '../data/mockData'

const LS_KEY = 'clawd-content-ideas'

function loadUserIdeas() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveUserIdeas(ideas) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(ideas)) } catch {}
}

function generateId() {
  const now = new Date()
  const date = now.toISOString().slice(0, 10)
  const seq = String(Math.floor(Math.random() * 900) + 100)
  return `${date}-${seq}`
}

/**
 * Simple keyword-based similarity score between two ideas.
 * Returns 0-100.
 */
// TODO: Replace with actual embedding-based semantic similarity via Jinx API
function computeSimilarity(a, b) {
  const wordsA = new Set(
    `${a.title} ${a.tags?.join(' ') || ''}`.toLowerCase().split(/\W+/).filter((w) => w.length > 2)
  )
  const wordsB = new Set(
    `${b.title} ${b.tags?.join(' ') || ''}`.toLowerCase().split(/\W+/).filter((w) => w.length > 2)
  )
  if (wordsA.size === 0 || wordsB.size === 0) return 0
  let overlap = 0
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++
  }
  const union = new Set([...wordsA, ...wordsB]).size
  return Math.round((overlap / union) * 100)
}

export function useContentIdeas() {
  const [userIdeas, setUserIdeas] = useState(loadUserIdeas)

  const allIdeas = useMemo(
    () => [
      ...mockContentIdeas.map((i) => ({ ...i, isMock: true })),
      ...userIdeas.map((i) => ({ ...i, isMock: false })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [userIdeas]
  )

  const allTags = useMemo(() => {
    const set = new Set()
    allIdeas.forEach((i) => (i.tags || []).forEach((t) => set.add(t)))
    return [...set].sort()
  }, [allIdeas])

  const addIdea = useCallback(({ title, type, summary, tags, status, similarTo, similarityScore }) => {
    const idea = {
      id: generateId(),
      title,
      type: type || 'long-form',
      summary: summary || '',
      tags: tags || [],
      status: status || 'pitched',
      response: null,
      similarTo: similarTo || null,
      similarityScore: similarityScore || null,
      createdAt: new Date().toISOString(),
    }
    setUserIdeas((prev) => {
      const next = [idea, ...prev]
      saveUserIdeas(next)
      return next
    })
    return idea
  }, [])

  const updateIdea = useCallback((id, updates) => {
    setUserIdeas((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
      saveUserIdeas(next)
      return next
    })
  }, [])

  const deleteIdea = useCallback((id) => {
    setUserIdeas((prev) => {
      const next = prev.filter((i) => i.id !== id)
      saveUserIdeas(next)
      return next
    })
  }, [])

  const checkDuplicate = useCallback((title, tags) => {
    const candidate = { title, tags }
    let bestMatch = null
    let bestScore = 0
    for (const idea of allIdeas) {
      const score = computeSimilarity(candidate, idea)
      if (score > bestScore) {
        bestScore = score
        bestMatch = idea
      }
    }
    if (bestScore > 40 && bestMatch) {
      return { match: bestMatch, score: bestScore }
    }
    return null
  }, [allIdeas])

  return { ideas: allIdeas, allTags, addIdea, updateIdea, deleteIdea, checkDuplicate }
}

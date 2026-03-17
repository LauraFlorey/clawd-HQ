import { useState, useCallback, useMemo } from 'react'
import { knowledgeSources as mockSources } from '../data/mockData'

const LS_KEY = 'clawd-knowledge-sources'

function loadUserSources() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveUserSources(sources) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(sources)) } catch {}
}

export function useKnowledgeSources() {
  const [userSources, setUserSources] = useState(loadUserSources)

  const allSources = useMemo(
    () => [...mockSources, ...userSources].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [userSources]
  )

  const allTags = useMemo(() => {
    const set = new Set()
    for (const s of allSources) {
      for (const t of s.tags || []) set.add(t)
    }
    return [...set].sort()
  }, [allSources])

  // TODO: In production, submitting a source will POST to the Jinx API endpoint
  // which handles extraction, chunking, embedding, and updates status to "Processed"
  const addSource = useCallback(({ url, title, tags, notes, sourceType }) => {
    const source = {
      id: `ks-user-${Date.now()}`,
      url: url || null,
      title,
      sourceType,
      summary: notes || null,
      tags: tags || [],
      status: 'pending',
      chunkCount: 0,
      rawPreview: notes || (url ? `Source URL: ${url}` : ''),
      createdAt: new Date().toISOString(),
      isMock: false,
    }
    setUserSources((prev) => {
      const next = [source, ...prev]
      saveUserSources(next)
      return next
    })
    return source
  }, [])

  const deleteSource = useCallback((id) => {
    setUserSources((prev) => {
      const next = prev.filter((s) => s.id !== id)
      saveUserSources(next)
      return next
    })
  }, [])

  const deleteBulk = useCallback((ids) => {
    const idSet = new Set(ids)
    setUserSources((prev) => {
      const next = prev.filter((s) => !idSet.has(s.id))
      saveUserSources(next)
      return next
    })
  }, [])

  const retagBulk = useCallback((ids, newTags) => {
    const idSet = new Set(ids)
    setUserSources((prev) => {
      const next = prev.map((s) => idSet.has(s.id) ? { ...s, tags: newTags } : s)
      saveUserSources(next)
      return next
    })
  }, [])

  return { sources: allSources, allTags, addSource, deleteSource, deleteBulk, retagBulk }
}

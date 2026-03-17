import { useState, useCallback, useMemo, useEffect } from 'react'
import { mockBriefingHistory } from '../data/mockData'

const FEEDBACK_KEY = 'clawd-briefing-feedback'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

function loadFeedback() {
  try { return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '{}') } catch { return {} }
}

function saveFeedback(fb) {
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(fb))
}

function computePriorityScore(rec) {
  return Math.round(rec.impact * 0.4 + rec.confidence * 0.35 + (100 - rec.effort) * 0.25)
}

export function useBriefing() {
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [latestBriefing, setLatestBriefing] = useState(null)
  const [feedback, setFeedback] = useState(loadFeedback)
  
  // Fetch latest briefing on mount
  useEffect(() => {
    async function fetchBriefing() {
      try {
        const res = await fetch(`${API_BASE}/briefings/latest`)
        const data = await res.json()
        
        if (data.ok && data.briefing) {
          // Transform API response to match expected briefing format
          setLatestBriefing({
            generatedAt: data.briefing.generatedAt,
            generatedBy: data.briefing.generatedBy,
            sections: {
              summary: {
                title: 'Executive Summary',
                content: data.briefing.executiveSummary,
              },
              actions: {
                title: 'Action Items',
                items: data.briefing.actionItems.map((item, i) => ({
                  id: `action-${i}`,
                  text: item,
                })),
              },
              findings: {
                title: 'Key Findings',
                items: data.briefing.findings.map(item => item.replace(/^✅\s*/, '').replace(/^⚠️\s*/, '')),
              },
            },
            rawMarkdown: data.briefing.rawMarkdown,
            recommendations: data.briefing.actionItems.map((item, i) => ({
              id: `rec-${i}`,
              title: item.replace(/^\*\*[A-Z]+:\*\*\s*/, ''),
              impact: 75,
              confidence: 85,
              effort: 30,
            })),
          })
        }
      } catch (err) {
        console.error('Failed to fetch briefing:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchBriefing()
  }, [])

  const generateNow = useCallback(() => {
    setGenerating(true)
    // TODO: POST http://{host}:{port}/briefings/generate
    setTimeout(() => {
      setLatestBriefing({
        ...mockBriefing,
        generatedAt: new Date().toISOString(),
      })
      setGenerating(false)
    }, 1500)
  }, [])

  const setRecFeedback = useCallback((recId, action) => {
    const next = {
      ...loadFeedback(),
      [recId]: { action, timestamp: new Date().toISOString() },
    }
    saveFeedback(next)
    setFeedback(next)
  }, [])

  const enrichedBriefing = useMemo(() => {
    if (!latestBriefing) return null
    return {
      ...latestBriefing,
      sections: latestBriefing.sections,
      recommendations: (latestBriefing.recommendations || []).map((r) => ({
        ...r,
        priorityScore: computePriorityScore(r),
        feedback: feedback[r.id] || null,
      })),
    }
  }, [latestBriefing, feedback])

  const history = useMemo(() => mockBriefingHistory, [])

  return {
    latestBriefing: enrichedBriefing,
    history,
    loading,
    generating,
    generateNow,
    setRecFeedback,
    feedback,
  }
}

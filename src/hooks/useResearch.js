import { useState, useCallback, useMemo } from 'react'
import { mockResearchHistory } from '../data/mockData'

const LS_KEY = 'clawd-research-history'

function loadHistory() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveHistory(entries) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(entries)) } catch {}
}

// TODO: All three tiers connect via Jinx backend
function generateMockResults(query) {
  const q = query.toLowerCase()

  const sentimentPool = [
    { positive: 45, mixed: 30, neutral: 15, negative: 10 },
    { positive: 35, mixed: 25, neutral: 25, negative: 15 },
    { positive: 55, mixed: 20, neutral: 15, negative: 10 },
    { positive: 20, mixed: 35, neutral: 20, negative: 25 },
  ]
  const sentiment = sentimentPool[Math.abs(query.length) % sentimentPool.length]

  const handles = ['@techanalyst', '@industrywatch', '@dailydigest', '@thinkpiece', '@datadriven']
  const authors = ['Tech Analyst', 'Industry Watch', 'Daily Digest', 'ThinkPiece', 'DataDriven']

  return {
    narratives: [
      { title: `Growing interest in ${query}`, summary: `There's been a significant uptick in discussion around ${query} over the past week, with practitioners and analysts sharing implementation experiences.`, sentiment: 'positive' },
      { title: 'Skeptics raising valid concerns', summary: `A vocal minority is questioning the hype around ${query}, citing lack of long-term data and potential hidden costs.`, sentiment: 'negative' },
      { title: 'Practical guides gaining traction', summary: `How-to threads and case studies about ${query} are getting high engagement, suggesting the audience has moved past "what" to "how."`, sentiment: 'neutral' },
      { title: 'Industry leaders weighing in', summary: `Several prominent voices have published takes on ${query}, signaling the topic has reached mainstream awareness in the industry.`, sentiment: 'mixed' },
    ],
    posts: Array.from({ length: 5 }, (_, i) => ({
      id: `gen-${Date.now()}-${i}`,
      author: authors[i],
      handle: handles[i],
      text: [
        `Fascinating thread on ${query}. The key insight: early adopters are seeing 30-50% efficiency gains, but the implementation curve is steeper than vendors suggest.`,
        `Hot take: ${query} is overhyped in the short term, underhyped in the long term. We'll look back in 3 years and wonder how we operated without it.`,
        `Just published our analysis of ${query}. TL;DR — the technology works, the organizational change management is what makes or breaks it.`,
        `Counterpoint to the ${query} hype: most organizations don't have the data infrastructure to take advantage of this yet. Fix your foundations first.`,
        `Best practices for ${query} are finally emerging. After reviewing 50+ implementations, here are the patterns that separate success from failure 🧵`,
      ][i],
      likes: [1200, 850, 1600, 920, 2100][i],
      retweets: [340, 210, 480, 280, 650][i],
      replies: [89, 45, 120, 67, 178][i],
      timestamp: new Date(Date.now() - (i + 1) * 86400000 * (0.5 + Math.random())).toISOString(),
    })),
    sentiment,
    contrarian: [
      { text: `The entire ${query} conversation is missing the point. The real constraint isn't technology — it's organizational willingness to change established workflows.`, author: 'Contrarian View', handle: '@contrarianview', why: 'Reframes the dominant technology-focused narrative as an organizational challenge.' },
      { text: `Unpopular opinion: most ${q.includes('ai') ? 'AI' : query} implementations fail not because of the tech, but because leadership treats it as a cost-cutting exercise instead of a capability investment.`, author: 'Strategy Skeptic', handle: '@stratskeptic', why: 'Challenges the efficiency-driven framing with a strategic perspective.' },
    ],
  }
}

export function useResearch() {
  const [userHistory, setUserHistory] = useState(loadHistory)
  const [loading, setLoading] = useState(false)
  const [activeResult, setActiveResult] = useState(null)

  const history = useMemo(
    () => [
      ...mockResearchHistory.map((e) => ({ ...e, isMock: true })),
      ...userHistory.map((e) => ({ ...e, isMock: false })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [userHistory]
  )

  const runResearch = useCallback((query, timeframe) => {
    setLoading(true)
    setActiveResult(null)

    setTimeout(() => {
      const existing = history.find((h) => h.query.toLowerCase() === query.toLowerCase() && h.timeframe === timeframe)
      if (existing) {
        setActiveResult(existing)
        setLoading(false)
        return
      }

      const results = generateMockResults(query)
      const cost = +(Math.random() * 0.15 + 0.03).toFixed(2)
      const entry = {
        id: `research-${Date.now()}`,
        query,
        timeframe,
        results,
        estimatedCost: cost,
        createdAt: new Date().toISOString(),
      }

      setUserHistory((prev) => {
        const next = [entry, ...prev]
        saveHistory(next)
        return next
      })
      setActiveResult(entry)
      setLoading(false)
    }, 1200)
  }, [history])

  const viewHistoryEntry = useCallback((entry) => {
    setActiveResult(entry)
  }, [])

  const deleteEntry = useCallback((id) => {
    setUserHistory((prev) => {
      const next = prev.filter((e) => e.id !== id)
      saveHistory(next)
      return next
    })
    if (activeResult?.id === id) setActiveResult(null)
  }, [activeResult])

  const todayCost = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return history
      .filter((e) => e.createdAt.startsWith(today))
      .reduce((sum, e) => sum + (e.estimatedCost || 0), 0)
  }, [history])

  return { history, loading, activeResult, todayCost, runResearch, viewHistoryEntry, deleteEntry }
}

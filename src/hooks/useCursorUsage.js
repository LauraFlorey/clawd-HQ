import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'clawd-cursor-usage'
const STALE_THRESHOLD = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Custom hook for Cursor IDE usage data.
 *
 * Data sources (in order of preference):
 *   1. /api/cursor/data — persisted by the proxy server (from manual sync)
 *   2. localStorage — client-side manual entry fallback
 *   3. Mock data — if nothing else is available
 *
 * @returns {{ loading, data, demoMode, stale, updateManually, lastUpdated }}
 */
export function useCursorUsage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [demoMode, setDemoMode] = useState(false)

  const fetchData = useCallback(async () => {
    // Try the proxy server first
    try {
      const res = await fetch('/api/cursor/data')
      const json = await res.json()

      if (json.data && !json.demo) {
        setData(json.data)
        setDemoMode(false)
        setLoading(false)
        return
      }
    } catch { /* proxy not available */ }

    // Try localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setData(parsed)
        setDemoMode(false)
        setLoading(false)
        return
      }
    } catch { /* corrupt data */ }

    // Fall back to mock
    setData(MOCK_CURSOR_DATA)
    setDemoMode(true)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  /**
   * Manually update Cursor usage data (from Settings page form or paste).
   * Persists to both localStorage and the proxy server.
   */
  const updateManually = useCallback(async (newData) => {
    const enriched = {
      ...newData,
      lastUpdated: new Date().toISOString(),
    }

    setData(enriched)
    setDemoMode(false)

    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enriched))

    // Also try to persist to proxy server
    try {
      await fetch('/api/cursor/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enriched),
      })
    } catch { /* proxy not available, localStorage is fine */ }
  }, [])

  // Check if data is stale
  const lastUpdated = data?.lastUpdated || null
  const stale = lastUpdated
    ? (Date.now() - new Date(lastUpdated).getTime()) > STALE_THRESHOLD
    : true

  return { loading, data, demoMode, stale, updateManually, lastUpdated }
}

// ─── Mock Data ──────────────────────────────────────────────────

const MOCK_CURSOR_DATA = {
  plan: 'Pro',
  billingCycle: { start: '2026-02-01', end: '2026-02-28' },
  lastUpdated: new Date().toISOString(),

  premiumRequests: { used: 347, limit: 500 },

  modelBreakdown: [
    { model: 'Claude Sonnet 4.5', requests: 182, pct: 52.4 },
    { model: 'GPT-4o', requests: 98, pct: 28.2 },
    { model: 'Claude Opus 4.5', requests: 42, pct: 12.1 },
    { model: 'Gemini 2.5 Pro', requests: 25, pct: 7.2 },
  ],

  monthlyFee: 20.00,
  overageRate: 0.04,
  estimatedOverage: 0,
}

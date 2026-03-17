import { useState, useCallback, useMemo } from 'react'
import { mockYouTubeDaily, mockYouTubeVideos, mockYouTubeCompetitors } from '../data/mockData'

const CHANNEL_KEY = 'clawd-youtube-channel'
const COMPETITORS_KEY = 'clawd-youtube-competitors'

function load(key) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null } catch { return null }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

export function useYouTube() {
  const [userCompetitors, setUserCompetitors] = useState(() => load(COMPETITORS_KEY) || [])

  const daily = useMemo(() => mockYouTubeDaily, [])
  const videos = useMemo(() => mockYouTubeVideos, [])

  const competitors = useMemo(
    () => [...mockYouTubeCompetitors, ...userCompetitors.map((c) => ({ ...c, isMock: false }))],
    [userCompetitors]
  )

  const stats = useMemo(() => {
    const totalViews = daily.reduce((s, d) => s + d.views, 0)
    const totalWatchTime = daily.reduce((s, d) => s + d.watchTime, 0)
    const totalSubs = daily.reduce((s, d) => s + d.subsGained, 0)
    const avgCtr = daily.reduce((s, d) => s + d.ctr, 0) / daily.length

    const half = Math.floor(daily.length / 2)
    const first = daily.slice(0, half)
    const second = daily.slice(half)
    const prevViews = first.reduce((s, d) => s + d.views, 0)
    const currViews = second.reduce((s, d) => s + d.views, 0)
    const prevWatchTime = first.reduce((s, d) => s + d.watchTime, 0)
    const currWatchTime = second.reduce((s, d) => s + d.watchTime, 0)
    const prevSubs = first.reduce((s, d) => s + d.subsGained, 0)
    const currSubs = second.reduce((s, d) => s + d.subsGained, 0)
    const prevCtr = first.reduce((s, d) => s + d.ctr, 0) / first.length
    const currCtr = second.reduce((s, d) => s + d.ctr, 0) / second.length

    return {
      totalViews, totalWatchTime, totalSubs, avgCtr,
      viewsTrend: prevViews > 0 ? ((currViews - prevViews) / prevViews * 100) : 0,
      watchTimeTrend: prevWatchTime > 0 ? ((currWatchTime - prevWatchTime) / prevWatchTime * 100) : 0,
      subsTrend: prevSubs > 0 ? ((currSubs - prevSubs) / prevSubs * 100) : 0,
      ctrTrend: currCtr - prevCtr,
    }
  }, [daily])

  const dailyWithMa = useMemo(() => {
    return daily.map((d, i) => {
      const window = daily.slice(Math.max(0, i - 6), i + 1)
      const ma = Math.round(window.reduce((s, w) => s + w.views, 0) / window.length)
      return { ...d, ma7d: ma }
    })
  }, [daily])

  const addCompetitor = useCallback((comp) => {
    const entry = {
      id: `comp-${Date.now()}`,
      name: comp.name,
      subscribers: Math.round(1000 + Math.random() * 10000),
      prevSubscribers: 0,
      videosPerWeek: +(1 + Math.random() * 3).toFixed(1),
      prevVideosPerWeek: 0,
      latestVideo: { title: 'Latest Upload', publishedAt: new Date().toISOString(), views: Math.round(500 + Math.random() * 5000) },
      dailySubs: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
        subs: Math.round(1000 + i * (5 + Math.random() * 15)),
      })),
    }
    entry.prevSubscribers = entry.subscribers - Math.round(Math.random() * 200)
    entry.prevVideosPerWeek = Math.max(0.5, entry.videosPerWeek - Math.random())
    setUserCompetitors((prev) => {
      const next = [...prev, entry]
      save(COMPETITORS_KEY, next)
      return next
    })
  }, [])

  const removeCompetitor = useCallback((id) => {
    setUserCompetitors((prev) => {
      const next = prev.filter((c) => c.id !== id)
      save(COMPETITORS_KEY, next)
      return next
    })
  }, [])

  const myChannelDailySubs = useMemo(() => {
    let base = 1200
    return daily.map((d) => {
      base += d.subsGained
      return { date: d.date, subs: base }
    })
  }, [daily])

  return { daily: dailyWithMa, videos, stats, competitors, myChannelDailySubs, addCompetitor, removeCompetitor }
}

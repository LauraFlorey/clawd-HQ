import { useState, useCallback, useMemo } from 'react'
import { mockImageAssets } from '../data/mockData'

const SESSIONS_KEY = 'clawd-image-sessions'
const ASSETS_KEY = 'clawd-image-assets'

function load(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback } catch { return fallback }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

const STYLE_GRADIENTS = {
  Photorealistic: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #e94560 100%)',
  Illustration: 'linear-gradient(135deg, #0f172a 0%, #4338ca 50%, #c084fc 100%)',
  Minimal: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #94a3b8 100%)',
  Watercolor: 'linear-gradient(135deg, #fce4ec 0%, #e1bee7 40%, #b2dfdb 100%)',
  '3D Render': 'linear-gradient(135deg, #1e293b 0%, #6366f1 50%, #22d3ee 100%)',
  'Pixel Art': 'linear-gradient(135deg, #1a1a2e 0%, #e94560 40%, #f59e0b 100%)',
  Logo: 'linear-gradient(135deg, #0c0a09 0%, #78350f 50%, #fbbf24 100%)',
  Poster: 'linear-gradient(135deg, #1e1b4b 0%, #be185d 50%, #f97316 100%)',
}

function pickGradient(style, prompt) {
  if (STYLE_GRADIENTS[style]) return STYLE_GRADIENTS[style]
  const hue = Math.abs([...prompt].reduce((s, c) => s + c.charCodeAt(0), 0)) % 360
  return `linear-gradient(135deg, hsl(${hue}, 60%, 15%) 0%, hsl(${(hue + 60) % 360}, 70%, 45%) 50%, hsl(${(hue + 120) % 360}, 80%, 70%) 100%)`
}

export function useImageGen() {
  const [sessions, setSessions] = useState(() => load(SESSIONS_KEY, []))
  const [assets, setAssets] = useState(() => load(ASSETS_KEY, []))
  const [generating, setGenerating] = useState(false)
  const [currentResults, setCurrentResults] = useState([])
  const [sessionPrompts, setSessionPrompts] = useState([])

  const allAssets = useMemo(
    () => [
      ...mockImageAssets.map((a) => ({ ...a, isMock: true })),
      ...assets.map((a) => ({ ...a, isMock: false })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [assets]
  )

  // TODO: Replace with DALL-E 3 / Flux / Stable Diffusion API calls via Jinx
  const generate = useCallback(({ prompt, style, aspectRatio, variants, negativePrompt }) => {
    setGenerating(true)
    setCurrentResults([])

    const count = variants || 2
    setTimeout(() => {
      const results = Array.from({ length: count }, (_, i) => ({
        id: `gen-${Date.now()}-${i}`,
        prompt,
        style: style || 'Photorealistic',
        aspectRatio: aspectRatio || '1:1',
        negativePrompt: negativePrompt || null,
        gradient: pickGradient(style, prompt + i),
        createdAt: new Date().toISOString(),
        label: prompt.length > 40 ? prompt.slice(0, 40) + '...' : prompt,
      }))

      setCurrentResults(results)
      setSessionPrompts((prev) => [...prev, prompt])
      setGenerating(false)

      setSessions((prev) => {
        const next = [{ prompt, style, aspectRatio, timestamp: new Date().toISOString() }, ...prev].slice(0, 50)
        save(SESSIONS_KEY, next)
        return next
      })
    }, 3000)
  }, [])

  const acceptImage = useCallback((image) => {
    setAssets((prev) => {
      const next = [image, ...prev]
      save(ASSETS_KEY, next)
      return next
    })
  }, [])

  const deleteAsset = useCallback((id) => {
    setAssets((prev) => {
      const next = prev.filter((a) => a.id !== id)
      save(ASSETS_KEY, next)
      return next
    })
  }, [])

  const clearSession = useCallback(() => {
    setCurrentResults([])
    setSessionPrompts([])
  }, [])

  return {
    allAssets,
    sessions,
    generating,
    currentResults,
    sessionPrompts,
    generate,
    acceptImage,
    deleteAsset,
    clearSession,
  }
}

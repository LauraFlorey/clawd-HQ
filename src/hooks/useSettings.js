import { useState, useCallback, useRef } from 'react'

const STORAGE_KEY = 'clawd-settings'

/**
 * Default settings. These are the initial values before any user customization.
 */
const DEFAULTS = {
  gateways: [
    {
      id: 'macbook',
      name: 'Local Machine',
      host: 'localhost',
      port: 18789,
      token: '',
      status: 'connected',  // connected | disconnected | testing | error
    },
    {
      id: 'mini',
      name: 'Remote Server',
      host: 'remote-host.example',
      port: 18789,
      token: '',
      status: 'connected',
    },
  ],

  providers: [
    { id: 'anthropic', name: 'Anthropic', keyConfigured: true, defaultModel: 'claude-sonnet-4.5', color: '#d97706' },
    { id: 'openai', name: 'OpenAI', keyConfigured: true, defaultModel: 'gpt-4o', color: '#10b981' },
    { id: 'google', name: 'Google', keyConfigured: true, defaultModel: 'gemini-2.5-flash', color: '#3b82f6' },
    { id: 'xai', name: 'xAI', keyConfigured: true, defaultModel: 'grok-3', color: '#8b5cf6' },
    { id: 'openrouter', name: 'OpenRouter', keyConfigured: false, defaultModel: 'openrouter-auto', color: '#ec4899' },
    { id: 'ollama', name: 'Ollama', keyConfigured: false, endpoint: 'http://localhost:11434', availableModels: ['llama3:8b', 'mixtral:latest'], color: '#94a3b8' },
  ],

  cursor: {
    dashboardUrl: 'https://cursor.com/dashboard',
    syncMethod: 'manual',  // manual | auto
    syncInterval: 60,      // minutes (when auto)
    lastSync: '2026-02-14 11:30 AM',
  },

  display: {
    currency: 'USD',
    defaultTimePeriod: 30,       // 7 | 30 | 90
    tokenFormat: 'abbreviated',  // raw | abbreviated
    theme: 'dark',               // dark | light
  },

  budget: {
    monthlyBudget: 100,          // dollars — monthly spending target
    alertAt: 80,                 // percentage — yellow warning threshold
    criticalAt: 100,             // percentage — red alert threshold
    emailAlerts: false,          // future: email when budget exceeded
    slackAlerts: false,          // future: slack webhook notification
  },

  taskIntegration: {
    provider: 'none',        // none | todoist | asana | linear
    apiKey: '',
    defaultProject: '',
  },

  crm: {
    staleDays: 30,
    gmail: { connected: false, email: null, lastSync: null, scanDays: 60, autoSync: false, autoSyncInterval: 'daily' },
    calendar: { connected: false, lastSync: null, maxAttendees: 10, minDuration: 15 },
    filtering: {
      myEmails: ['user@example.com'],
      skipDomains: ['noreply.com', 'mailchimp.com', 'constantcontact.com'],
      excludedContacts: [],
      preferTitles: ['CEO', 'Founder', 'VP', 'Director', 'Head of', 'Engineer', 'Partner', 'CTO', 'CFO', 'COO', 'CMO', 'President'],
    },
    aiClassification: { enabled: true, model: 'haiku-4.5', confidenceThreshold: 70 },
    syncHistory: [],
  },

  youtube: {
    apiKey: '',
    channelId: '',
    autoSync: false,
    syncSchedule: 'daily',
    lastSync: null,
  },

  research: {
    tier2ApiKey: '',
    tier3ApiKey: '',
    cacheTtl: 60,
    maxResults: 50,
  },

  imageGen: {
    provider: 'dall-e-3',
    apiKey: '',
    defaultStyle: 'Photorealistic',
    defaultVariants: 2,
    outputFolder: '~/agent-workspace/assets/images/',
  },

  briefing: {
    enabled: true,
    scheduleTime: '6:00',
    channel: '#ops-log',
    signals: {
      tokenSpend: true,
      crmHealth: true,
      taskCompletion: true,
      knowledgeGrowth: true,
      systemHealth: true,
      competitiveIntel: true,
      youtubeMetrics: false,
      socialMedia: false,
    },
    council: {
      model: 'claude-opus-4.5',
      reviewers: {
        GrowthStrategist: true,
        RevenueGuardian: true,
        SkepticalOperator: true,
        TeamDynamicsArchitect: true,
      },
      weights: { impact: 0.40, confidence: 0.35, effort: 0.25 },
    },
  },
}

/**
 * Load settings from localStorage, merging with defaults.
 */
function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return deepMerge(DEFAULTS, parsed)
    }
  } catch {
    // Corrupted data — fall back to defaults
  }
  return DEFAULTS
}

/**
 * Deep merge two objects. Source values override target.
 */
function deepMerge(target, source) {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result
}

/**
 * Hook to manage dashboard settings with localStorage persistence.
 */
export function useSettings() {
  const [settings, setSettingsState] = useState(loadSettings)
  const [saveFlash, setSaveFlash] = useState(false)
  const flashTimer = useRef(null)

  const setSettings = useCallback((updater) => {
    setSettingsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // Storage full or unavailable — settings still work in-memory
      }
      return next
    })
    setSaveFlash(true)
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setSaveFlash(false), 1500)
  }, [])

  // Convenience updaters for specific sections
  const updateGateways = useCallback(
    (gateways) => setSettings((s) => ({ ...s, gateways })),
    [setSettings]
  )

  const updateProvider = useCallback(
    (id, updates) =>
      setSettings((s) => ({
        ...s,
        providers: s.providers.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      })),
    [setSettings]
  )

  const updateCursor = useCallback(
    (updates) => setSettings((s) => ({ ...s, cursor: { ...s.cursor, ...updates } })),
    [setSettings]
  )

  const updateDisplay = useCallback(
    (updates) => setSettings((s) => ({ ...s, display: { ...s.display, ...updates } })),
    [setSettings]
  )

  const updateBudget = useCallback(
    (updates) => setSettings((s) => ({ ...s, budget: { ...s.budget, ...updates } })),
    [setSettings]
  )

  const updateBriefing = useCallback(
    (updates) => setSettings((s) => ({ ...s, briefing: deepMerge(s.briefing, updates) })),
    [setSettings]
  )

  const updateTaskIntegration = useCallback(
    (updates) => setSettings((s) => ({ ...s, taskIntegration: { ...s.taskIntegration, ...updates } })),
    [setSettings]
  )

  const updateYouTube = useCallback(
    (updates) => setSettings((s) => ({ ...s, youtube: { ...s.youtube, ...updates } })),
    [setSettings]
  )

  const updateResearch = useCallback(
    (updates) => setSettings((s) => ({ ...s, research: { ...s.research, ...updates } })),
    [setSettings]
  )

  const updateImageGen = useCallback(
    (updates) => setSettings((s) => ({ ...s, imageGen: { ...s.imageGen, ...updates } })),
    [setSettings]
  )

  const updateCrm = useCallback(
    (updates) => setSettings((s) => ({ ...s, crm: deepMerge(s.crm, updates) })),
    [setSettings]
  )

  return {
    settings,
    setSettings,
    saveFlash,
    updateGateways,
    updateProvider,
    updateCursor,
    updateDisplay,
    updateBudget,
    updateBriefing,
    updateTaskIntegration,
    updateYouTube,
    updateResearch,
    updateImageGen,
    updateCrm,
  }
}

// ─── Validation helpers ────────────────────────────────────────

export function validateHost(host) {
  if (!host.trim()) return 'Host is required'
  // Allow hostnames, IPs, tailscale names
  if (!/^[\w.\-]+$/.test(host.trim())) return 'Invalid hostname or IP'
  return null
}

export function validatePort(port) {
  const n = Number(port)
  if (!port || isNaN(n)) return 'Port is required'
  if (n < 1 || n > 65535) return 'Port must be 1–65535'
  return null
}

export function validateUrl(url) {
  if (!url.trim()) return 'URL is required'
  try {
    new URL(url)
    return null
  } catch {
    return 'Invalid URL'
  }
}

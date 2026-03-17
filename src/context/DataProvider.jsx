import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react'
import { useGateway } from '../hooks/useGateway'
import { useTokenUsage } from '../hooks/useTokenUsage'
import { useCursorUsage } from '../hooks/useCursorUsage'

/**
 * Central data context that provides all live data to the dashboard.
 * Components consume this via useData() instead of importing mock data directly.
 *
 * demoMode sources are tracked per-subsystem so the UI can show
 * exactly which data is real vs. simulated.
 */
const DataContext = createContext(null)

// Gateway configurations — pull from env vars with sensible defaults
// Both gateways run Jinx (one agent, two machines)
const GATEWAY_CONFIGS = [
  {
    id: 'macbook',
    name: 'Local Machine',
    host: import.meta.env.VITE_GATEWAY_1_HOST || 'localhost',
    port: parseInt(import.meta.env.VITE_GATEWAY_1_PORT || '18789', 10),
    authToken: import.meta.env.VITE_GATEWAY_1_TOKEN || '',
  },
  {
    id: 'mini',
    name: 'Remote Server',
    host: import.meta.env.VITE_GATEWAY_2_HOST || 'remote-host.example',
    port: parseInt(import.meta.env.VITE_GATEWAY_2_PORT || '18789', 10),
    authToken: import.meta.env.VITE_GATEWAY_2_TOKEN || '',
  },
]

export function DataProvider({ children }) {
  // Connect to each gateway
  const gw1 = useGateway(GATEWAY_CONFIGS[0])
  // const gw2 = useGateway(GATEWAY_CONFIGS[1]) // Mac Mini disabled for now
  const gw2 = { connected: false, loading: false, agents: [], gateway: null, sendCommand: () => false, lastError: null, demoMode: true }

  // Flatten all agents from all gateways
  const allAgents = useMemo(
    () => [...gw1.agents, ...gw2.agents],
    [gw1.agents, gw2.agents]
  )

  // Flatten all gateway health info
  const allGateways = useMemo(
    () => [gw1.gateway, gw2.gateway].filter(Boolean),
    [gw1.gateway, gw2.gateway]
  )

  // ─── System status (real checks via proxy) ──────────────────

  const [systemStatus, setSystemStatus] = useState({
    discord: { status: 'unknown', server: 'Agent HQ', lastMessage: null },
    memorySync: { status: 'unknown', lastSync: null, repo: 'agent-workspace', branch: 'main', pendingChanges: 0 },
    tailscale: { status: gw2.connected ? 'connected' : 'unknown', peers: 2 },
  })

  const fetchSystemStatus = useCallback(async () => {
    // Memory sync — real git data from proxy
    try {
      const res = await fetch('/api/system/sync')
      const sync = await res.json()
      setSystemStatus((prev) => ({
        ...prev,
        memorySync: {
          status: sync.status || 'unknown',
          lastSync: sync.lastSync ? formatRelativeTime(sync.lastSync) : 'unknown',
          repo: sync.repo || 'agent-workspace',
          branch: sync.branch || 'main',
          pendingChanges: sync.pendingChanges || 0,
        },
      }))
    } catch {
      // Proxy not available — use defaults
    }

    // Tailscale — inferred from gateway 2 connectivity
    setSystemStatus((prev) => ({
      ...prev,
      tailscale: {
        status: gw2.connected && !gw2.demoMode ? 'connected' : (gw2.connected ? 'unknown' : 'disconnected'),
        peers: 2,
      },
      // Discord — will come from gateway status messages in production
      discord: {
        status: gw1.connected || gw2.connected ? 'connected' : 'disconnected',
        server: 'Agent HQ',
        lastMessage: null,
      },
    }))
  }, [gw1.connected, gw2.connected, gw2.demoMode])

  useEffect(() => {
    fetchSystemStatus()
    const interval = setInterval(fetchSystemStatus, 60_000) // every minute
    return () => clearInterval(interval)
  }, [fetchSystemStatus])

  // Aggregate token usage across all gateways
  const tokenUsage = useTokenUsage(allAgents)

  // Cursor IDE usage
  const cursorUsage = useCursorUsage()

  // Combined loading state
  const loading = gw1.loading || gw2.loading

  // ─── Demo mode tracking ─────────────────────────────────────

  const demoSources = useMemo(() => ({
    gateway1: gw1.demoMode,
    gateway2: gw2.demoMode,
    usage: tokenUsage.demoMode,
    cursor: cursorUsage.demoMode,
  }), [gw1.demoMode, gw2.demoMode, tokenUsage.demoMode, cursorUsage.demoMode])

  const anyDemoMode = Object.values(demoSources).some(Boolean)

  // sendCommand dispatches to the correct gateway based on agent's machine
  function sendCommand(agentId, action, payload) {
    const agent = allAgents.find((a) => a.id === agentId)
    if (!agent) return false
    const gw = agent.machine === 'macbook' ? gw1 : gw2
    return gw.sendCommand(action, agentId, payload)
  }

  const value = useMemo(
    () => ({
      // Loading states
      loading,
      gatewaysLoading: gw1.loading || gw2.loading,
      usageLoading: tokenUsage.loading,
      cursorLoading: cursorUsage.loading,

      // Agents & gateways
      agents: allAgents,
      gateways: allGateways,
      systemStatus,
      sendCommand,

      // Token usage
      tokenUsage,

      // Cursor
      cursorUsage: cursorUsage.data,
      cursorStale: cursorUsage.stale,
      updateCursorManually: cursorUsage.updateManually,

      // Connection health
      gatewayErrors: [gw1.lastError, gw2.lastError].filter(Boolean),

      // Demo mode
      demoMode: anyDemoMode,
      demoSources,
    }),
    [loading, gw1, gw2, allAgents, allGateways, systemStatus, tokenUsage, cursorUsage, anyDemoMode, demoSources]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

/**
 * Hook to consume the data context.
 * Must be used within a <DataProvider>.
 */
export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData() must be used within a <DataProvider>')
  return ctx
}

// ─── Helpers ────────────────────────────────────────────────────

function formatRelativeTime(isoString) {
  if (!isoString) return 'unknown'
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return isoString

  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Custom hook that manages connection to an OpenClaw gateway via the proxy server.
 *
 * The OpenClaw gateway only exposes a WebSocket RPC interface (no HTTP REST),
 * so the browser can't connect directly. Instead, we poll the proxy server
 * which makes WS RPC calls to the gateway on our behalf.
 *
 * Endpoints:
 *   GET /api/gateway/{id}/health  → gateway health, agents, Discord status
 *   GET /api/gateway/{id}/status  → session details, token counts, models
 *   GET /api/gateway/{id}/usage   → usage-cost summary from session logs
 *
 * Falls back to mock data with demoMode=true if the proxy/gateway is unreachable.
 *
 * @param {object} config - { host, port, authToken, id, name }
 * @returns {{ connected, agents, gateway, sendCommand, lastError, loading, demoMode }}
 */
export function useGateway(config) {
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [agents, setAgents] = useState([])
  const [gateway, setGateway] = useState(null)
  const [lastError, setLastError] = useState(null)
  const [demoMode, setDemoMode] = useState(false)

  const pollTimer = useRef(null)
  const POLL_INTERVAL = 30_000 // 30 seconds

  // ─── Mock data (fallback) ───────────────────────────────────

  // Both gateways run Jinx — one agent, two machines
  const mockAgentsByGateway = {
    macbook: [
      {
        id: 'jinx',
        name: 'Jinx',
        machine: 'macbook',
        machineLabel: 'MacBook',
        status: 'online',
        model: 'claude-sonnet-4.5',
        modelLabel: 'Claude Sonnet 4.5',
        provider: 'anthropic',
        gateway: `${config.host}:${config.port}`,
        uptime: '4h 23m',
        lastActive: '2 min ago',
        tokensToday: 452_300,
        spendToday: 6.82,
        lastMessage: 'Finished scaffolding the dashboard layout and wiring up the data provider context...',
      },
    ],
    mini: [
      {
        id: 'jinx-mini',
        name: 'Jinx',
        machine: 'mini',
        machineLabel: 'Mac Mini',
        status: 'online',
        model: 'claude-sonnet-4.5',
        modelLabel: 'Claude Sonnet 4.5',
        provider: 'anthropic',
        gateway: `${config.host}:${config.port}`,
        uptime: '12h 05m',
        lastActive: '8 min ago',
        tokensToday: 281_600,
        spendToday: 4.23,
        lastMessage: 'Updated competitive analysis notes for Q1 market positioning review...',
      },
    ],
  }

  function activateMockFallback(error) {
    const gwAgents = mockAgentsByGateway[config.id] || []
    setAgents(gwAgents)
    setGateway({
      id: config.id,
      name: config.name,
      host: config.host,
      port: config.port,
      status: 'healthy',
      latency: config.id === 'macbook' ? 12 : 28,
      agentCount: gwAgents.length,
      uptime: config.id === 'macbook' ? '4d 7h' : '12d 3h',
    })
    setConnected(true)
    setLoading(false)
    setDemoMode(true)
    if (error) setLastError(error)
  }

  // ─── Fetch real data via proxy ──────────────────────────────

  const fetchGatewayData = useCallback(async () => {
    try {
      // Fetch health and status in parallel from proxy
      const [healthRes, statusRes] = await Promise.all([
        fetch(`/api/gateway/${config.id}/health`, { signal: AbortSignal.timeout(10000) }),
        fetch(`/api/gateway/${config.id}/status`, { signal: AbortSignal.timeout(10000) }),
      ])

      const healthJson = await healthRes.json()
      const statusJson = await statusRes.json()

      // If the proxy itself returned demo mode, fall back to mock
      if (!healthJson.ok || healthJson.demo) {
        activateMockFallback(healthJson.error || `Gateway ${config.name} unreachable via proxy.`)
        return
      }

      // ── Parse real health data ──
      const healthData = healthJson.data
      const machine = config.id === 'macbook' ? 'macbook' : 'mini'
      const machineLabel = config.id === 'macbook' ? 'MacBook' : 'Mac Mini'

      // Build agent list from health data
      const realAgents = (healthData.agents || []).map((a) => {
        // Find matching session data from status response
        const sessions = statusJson.ok ? statusJson.data?.sessions?.recent || [] : []
        const agentSession = sessions.find((s) => s.agentId === a.agentId)

        // Both gateways run Jinx — use gateway-suffixed ID to avoid duplicate keys
        const agentName = config.id === 'macbook' ? 'jinx' : 'jinx-mini'

        return {
          id: agentName,
          name: 'Jinx',
          machine,
          machineLabel,
          status: 'online',
          model: agentSession?.model || 'unknown',
          modelLabel: formatModelLabel(agentSession?.model),
          provider: guessProvider(agentSession?.model),
          gateway: `${config.host}:${config.port}`,
          uptime: null,
          lastActive: agentSession?.updatedAt ? formatRelative(agentSession.updatedAt) : 'unknown',
          tokensToday: agentSession?.totalTokens || 0,
          spendToday: 0, // Will be filled from usage-cost endpoint
          lastMessage: null,
          // Extra data from real gateway
          inputTokens: agentSession?.inputTokens || 0,
          outputTokens: agentSession?.outputTokens || 0,
          contextTokens: agentSession?.contextTokens || 0,
          percentUsed: agentSession?.percentUsed || 0,
          sessionCount: healthData.sessions?.count || 0,
        }
      })

      // Discord status from health data
      const discordChannel = healthData.channels?.discord
      const discordStatus = discordChannel?.probe?.ok ? 'connected' : 'disconnected'
      const discordBot = discordChannel?.probe?.bot?.username || null

      // Build gateway health
      setGateway({
        id: config.id,
        name: config.name,
        host: config.host,
        port: config.port,
        status: healthData.ok ? 'healthy' : 'degraded',
        latency: healthData.durationMs || null,
        agentCount: realAgents.length,
        uptime: null,
        discord: { status: discordStatus, botName: discordBot },
      })

      setAgents(realAgents)
      setConnected(true)
      setLoading(false)
      setDemoMode(false)
      setLastError(null)
    } catch (err) {
      // Proxy unreachable or network error
      activateMockFallback(`Gateway ${config.name} unreachable (${err.message}). Using demo data.`)
    }
  }, [config.id, config.host, config.port, config.name])

  // ─── Polling ────────────────────────────────────────────────

  useEffect(() => {
    fetchGatewayData()

    pollTimer.current = setInterval(fetchGatewayData, POLL_INTERVAL)

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current)
    }
  }, [fetchGatewayData])

  // ─── Send command ───────────────────────────────────────────

  const sendCommand = useCallback(
    (action, agentId, payload) => {
      if (!connected) {
        setLastError('Not connected to gateway')
        return false
      }

      // Optimistic local state update for model switch
      if (action === 'switch_model' && payload?.model) {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === agentId
              ? { ...a, model: payload.model, modelLabel: payload.modelLabel || payload.model }
              : a
          )
        )
      }

      // TODO: Send command to gateway via proxy endpoint
      // POST /api/gateway/{id}/command { action, agentId, payload }

      return true
    },
    [connected]
  )

  return { connected, loading, agents, gateway, sendCommand, lastError, demoMode }
}

// ─── Helpers ────────────────────────────────────────────────────

function formatRelative(timestampMs) {
  if (!timestampMs) return 'unknown'

  const date = typeof timestampMs === 'number' ? new Date(timestampMs) : new Date(timestampMs)
  if (isNaN(date.getTime())) return String(timestampMs)

  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function formatModelLabel(model) {
  if (!model) return 'Unknown'
  const map = {
    'claude-sonnet-4.5': 'Claude Sonnet 4.5',
    'claude-opus-4.5': 'Claude Opus 4.5',
    'claude-haiku-4.5': 'Claude Haiku 4.5',
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'qwen/qwen-2.5-7b-instruct': 'Qwen 2.5 7B',
  }
  return map[model] || model
}

function guessProvider(model) {
  if (!model) return 'unknown'
  if (model.startsWith('claude')) return 'anthropic'
  if (model.startsWith('gpt') || model.startsWith('o3')) return 'openai'
  if (model.startsWith('gemini')) return 'google'
  if (model.startsWith('grok')) return 'xai'
  if (model.includes('/')) return 'openrouter' // e.g., "qwen/qwen-2.5-7b-instruct"
  return 'unknown'
}

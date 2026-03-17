import { useState, useEffect } from 'react'
import { AGENTS, MACHINES } from '../utils/constants'

/**
 * Hook to poll agent/gateway status.
 * Currently returns mock data — will be wired to real gateway endpoints later.
 */
export function useAgentStatus() {
  const [agents, setAgents] = useState(
    AGENTS.map((agent) => ({
      ...agent,
      online: false,
      model: agent.defaultModel,
      uptime: null,
    }))
  )

  const [gateways, setGateways] = useState(
    Object.entries(MACHINES).map(([key, machine]) => ({
      id: key,
      ...machine,
      healthy: false,
    }))
  )

  useEffect(() => {
    // Mock: simulate agents coming online
    const timer = setTimeout(() => {
      setAgents((prev) =>
        prev.map((agent) => ({
          ...agent,
          online: true, // both agents default to online
          uptime: '4h 23m',
        }))
      )
      setGateways((prev) =>
        prev.map((gw) => ({ ...gw, healthy: true }))
      )
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return { agents, gateways }
}

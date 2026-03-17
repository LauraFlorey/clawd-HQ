import { useState, useCallback } from 'react'
import {
  MODEL_PRICING,
  DEFAULT_PRICING,
  getEffectivePricing,
  saveUserPricing,
  clearUserPricing,
} from '../utils/pricing'

export function usePricing() {
  const [pricing, setPricing] = useState(() => getEffectivePricing())
  const [version, setVersion] = useState(0)

  const persist = useCallback((next) => {
    setPricing(next)
    const overrides = {}
    for (const [id, entry] of Object.entries(next)) {
      const def = MODEL_PRICING[id]
      if (
        !def ||
        def.input !== entry.input ||
        def.output !== entry.output ||
        def.provider !== entry.provider ||
        def.name !== entry.name
      ) {
        overrides[id] = entry
      }
    }
    if (Object.keys(overrides).length > 0) {
      saveUserPricing(overrides)
    } else {
      clearUserPricing()
    }
    setVersion((v) => v + 1)
  }, [])

  const updateModel = useCallback((modelId, updates) => {
    setPricing((prev) => {
      const next = { ...prev, [modelId]: { ...prev[modelId], ...updates } }
      persist(next)
      return next
    })
  }, [persist])

  const addModel = useCallback(({ id, provider, name, input, output }) => {
    setPricing((prev) => {
      const next = {
        ...prev,
        [id]: { input: Number(input), output: Number(output), provider, name },
      }
      persist(next)
      return next
    })
  }, [persist])

  const removeModel = useCallback((modelId) => {
    setPricing((prev) => {
      const next = { ...prev }
      delete next[modelId]
      persist(next)
      return next
    })
  }, [persist])

  const resetToDefaults = useCallback(() => {
    clearUserPricing()
    const fresh = { ...MODEL_PRICING }
    setPricing(fresh)
    setVersion((v) => v + 1)
  }, [])

  return { pricing, updateModel, addModel, removeModel, resetToDefaults, version }
}

export { DEFAULT_PRICING }

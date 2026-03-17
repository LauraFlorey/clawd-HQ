/**
 * Token-to-cost conversion for each model by provider.
 *
 * Prices are per 1M tokens. Users can override via the Pricing Config UI,
 * which persists to localStorage. MODEL_PRICING serves as the default.
 */

// ─── Default Pricing Table ──────────────────────────────────────
// { input: $/1M tokens, output: $/1M tokens, provider, name }

export const MODEL_PRICING = {
  'claude-opus-4.5':   { input: 15.00, output: 75.00, provider: 'anthropic', name: 'Claude Opus 4.5' },
  'claude-sonnet-4.5': { input:  3.00, output: 15.00, provider: 'anthropic', name: 'Claude Sonnet 4.5' },
  'claude-haiku-4.5':  { input:  0.80, output:  4.00, provider: 'anthropic', name: 'Claude Haiku 4.5' },

  'gpt-4o':            { input:  2.50, output: 10.00, provider: 'openai', name: 'GPT-4o' },
  'gpt-4o-mini':       { input:  0.15, output:  0.60, provider: 'openai', name: 'GPT-4o Mini' },
  'o3':                { input:  2.50, output: 10.00, provider: 'openai', name: 'o3' },

  'gemini-2.5-pro':    { input:  1.25, output: 10.00, provider: 'google', name: 'Gemini 2.5 Pro' },
  'gemini-2.5-flash':  { input:  0.15, output:  0.60, provider: 'google', name: 'Gemini 2.5 Flash' },

  'grok-3':            { input:  3.00, output: 15.00, provider: 'xai', name: 'Grok 3' },
  'grok-3-mini':       { input:  0.30, output:  1.50, provider: 'xai', name: 'Grok 3 Mini' },

  'openrouter-auto':   { input:  2.00, output:  8.00, provider: 'openrouter', name: 'OpenRouter Auto' },
}

export const DEFAULT_PRICING = { input: 2.00, output: 8.00, provider: 'unknown', name: 'Unknown' }

const LS_KEY = 'clawd-model-pricing'

// ─── localStorage-backed pricing ────────────────────────────────

let _userPricingCache = null

export function getUserPricing() {
  if (_userPricingCache) return _userPricingCache
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      _userPricingCache = JSON.parse(raw)
      return _userPricingCache
    }
  } catch { /* ignore corrupt data */ }
  return null
}

export function saveUserPricing(pricingMap) {
  _userPricingCache = pricingMap
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(pricingMap))
  } catch { /* quota exceeded */ }
}

export function clearUserPricing() {
  _userPricingCache = null
  try { localStorage.removeItem(LS_KEY) } catch {}
}

function resolve(modelId) {
  const user = getUserPricing()
  if (user?.[modelId]) return user[modelId]
  return MODEL_PRICING[modelId] || DEFAULT_PRICING
}

// ─── Public API ────────────────────────────────────────────────

export function calculateCost(tokens, modelId) {
  const pricing = resolve(modelId)
  const inputCost = (tokens.input / 1_000_000) * pricing.input
  const outputCost = (tokens.output / 1_000_000) * pricing.output
  return +(inputCost + outputCost).toFixed(4)
}

export function estimateCost(totalTokens, modelId) {
  return calculateCost(
    { input: totalTokens * 0.4, output: totalTokens * 0.6 },
    modelId
  )
}

export function getModelPricing(modelId) {
  return resolve(modelId)
}

export function getProviderForModel(modelId) {
  return resolve(modelId).provider || 'unknown'
}

/**
 * Merged view: user overrides on top of defaults.
 * Returns the full map used for the pricing config UI.
 */
export function getEffectivePricing() {
  const user = getUserPricing()
  if (!user) return { ...MODEL_PRICING }
  return { ...MODEL_PRICING, ...user }
}

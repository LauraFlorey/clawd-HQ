/**
 * Agent definitions for the OpenClaw deployment.
 * Machine assignments and default configurations.
 */

export const MACHINES = {
  macbook: {
    name: 'Local',
    gateway: 'localhost:18789',
    colorClass: 'machine-macbook',
  },
  mini: {
    name: 'Remote',
    gateway: 'remote-host.example:18789',
    colorClass: 'machine-mini',
  },
}

// One agent, two machines
export const AGENTS = [
  { id: 'jinx', machines: ['macbook', 'mini'], defaultModel: 'claude-sonnet-4.5' },
]

export const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic', color: '#d97706' },
  { id: 'openai', name: 'OpenAI', color: '#10b981' },
  { id: 'google', name: 'Google', color: '#3b82f6' },
  { id: 'xai', name: 'xAI', color: '#8b5cf6' },
  { id: 'openrouter', name: 'OpenRouter', color: '#ec4899' },
  { id: 'local', name: 'Local (Ollama)', color: '#94a3b8' },
]

/**
 * Model catalog grouped by provider.
 * Models with `allowCustom: true` show a text input for arbitrary model strings.
 */
export const MODEL_GROUPS = [
  {
    provider: 'anthropic',
    label: 'Anthropic',
    color: '#d97706',
    models: [
      { id: 'claude-opus-4.5', name: 'Claude Opus 4.5' },
      { id: 'claude-sonnet-4.5', name: 'Claude Sonnet 4.5' },
      { id: 'claude-haiku-4.5', name: 'Claude Haiku 4.5' },
    ],
  },
  {
    provider: 'openai',
    label: 'OpenAI',
    color: '#10b981',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'o3', name: 'o3' },
    ],
  },
  {
    provider: 'google',
    label: 'Google',
    color: '#3b82f6',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    ],
  },
  {
    provider: 'xai',
    label: 'xAI',
    color: '#8b5cf6',
    models: [
      { id: 'grok-3', name: 'Grok 3' },
      { id: 'grok-3-mini', name: 'Grok 3 Mini' },
    ],
  },
  {
    provider: 'openrouter',
    label: 'OpenRouter',
    color: '#ec4899',
    models: [
      { id: 'openrouter-auto', name: 'OpenRouter Auto' },
    ],
    allowCustom: true,
    customPlaceholder: 'e.g. meta-llama/llama-3-70b',
  },
  {
    provider: 'local',
    label: 'Local (Ollama)',
    color: '#94a3b8',
    models: [],
    allowCustom: true,
    customPlaceholder: 'e.g. llama3:70b, mixtral:latest',
  },
]

/**
 * Flat lookup: find a model name by ID across all groups.
 * Falls back to the raw ID if not found (for custom models).
 */
export function getModelName(modelId) {
  for (const group of MODEL_GROUPS) {
    const found = group.models.find((m) => m.id === modelId)
    if (found) return found.name
  }
  return modelId
}

/**
 * Find which provider a model belongs to.
 */
export function getModelProvider(modelId) {
  for (const group of MODEL_GROUPS) {
    if (group.models.some((m) => m.id === modelId)) return group.provider
  }
  // Custom models: guess from prefix or default
  if (modelId.startsWith('openrouter-') || modelId.includes('/')) return 'openrouter'
  return 'local'
}

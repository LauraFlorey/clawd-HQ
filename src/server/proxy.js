/**
 * Lightweight proxy server for the OpenClaw dashboard.
 *
 * Handles:
 *   1. /api/anthropic/usage  — proxies to Anthropic Admin Usage API
 *   2. /api/anthropic/cost   — proxies to Anthropic Admin Cost API
 *   3. /api/system/sync      — returns last git sync timestamp for memory repo
 *   4. /api/cursor/data      — returns locally-stored Cursor usage data
 *   5. /api/cursor/data PUT  — stores Cursor usage data from manual entry
 *   6. /api/gateway/:id/health  — RPC call to OpenClaw gateway (health)
 *   7. /api/gateway/:id/status  — RPC call to OpenClaw gateway (status)
 *   8. /api/gateway/:id/usage   — RPC call to OpenClaw gateway (usage-cost)
 *
 * The OpenClaw gateway only exposes a WebSocket RPC interface (no HTTP REST),
 * so this proxy makes WS connections server-side and caches the results.
 *
 * Secrets (ANTHROPIC_ADMIN_KEY, gateway tokens) live in process.env
 * and are never exposed to the browser.
 */

import { createServer } from 'http'
import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
// Note: ws package no longer used directly — gateway communication goes through
// the `openclaw` CLI which handles the complex WS handshake protocol internally.

const __dirname = dirname(fileURLToPath(import.meta.url))

const PORT = process.env.PROXY_PORT || 3001
const ANTHROPIC_ADMIN_KEY = process.env.ANTHROPIC_ADMIN_KEY || ''
const ANTHROPIC_BASE = 'https://api.anthropic.com/v1/organizations'

const CHAT_TIMEOUT_MS = 120000

// Gateway configs from env
const GATEWAYS = {
  macbook: {
    host: process.env.VITE_GATEWAY_1_HOST || 'localhost',
    port: process.env.VITE_GATEWAY_1_PORT || '18789',
    token: process.env.VITE_GATEWAY_1_TOKEN || '',
    name: 'Local Machine',
  },
  mini: {
    host: process.env.VITE_GATEWAY_2_HOST || 'remote-host.example',
    port: process.env.VITE_GATEWAY_2_PORT || '18789',
    token: process.env.VITE_GATEWAY_2_TOKEN || '',
    name: 'Remote Server',
  },
}

// ─── In-memory cache ────────────────────────────────────────────
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const GATEWAY_CACHE_TTL = 15 * 1000 // 15 seconds for gateway data (more real-time)

function getCached(key, ttl = CACHE_TTL) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > ttl) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() })
}

// ─── Cursor data file (persisted to disk alongside server) ──────
const CURSOR_DATA_PATH = join(__dirname, '..', '..', '.cursor-usage.json')

function readCursorData() {
  try {
    if (existsSync(CURSOR_DATA_PATH)) {
      return JSON.parse(readFileSync(CURSOR_DATA_PATH, 'utf-8'))
    }
  } catch { /* ignore */ }
  return null
}

function writeCursorData(data) {
  writeFileSync(CURSOR_DATA_PATH, JSON.stringify(data, null, 2))
}

// ─── Helpers ────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:4173',
  'http://localhost:4174',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:4174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
]

function cors(req, res) {
  const origin = req?.headers?.origin
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function jsonResp(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

const MAX_BODY_BYTES = 1024 * 100 // 100 KB

function parseBody(req) {
  return new Promise((resolve) => {
    let body = ''
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        req.destroy()
        resolve(null)
        return
      }
      body += chunk
    })
    req.on('end', () => {
      try { resolve(JSON.parse(body)) } catch { resolve(null) }
    })
  })
}

function parseQuery(url) {
  const idx = url.indexOf('?')
  if (idx === -1) return {}
  const params = new URLSearchParams(url.slice(idx))
  const out = {}
  for (const [k, v] of params) out[k] = v
  return out
}

// ─── Gateway CLI RPC ────────────────────────────────────────────
//
// The OpenClaw gateway uses a complex WebSocket handshake protocol
// (challenge-response auth with nonce signing). Rather than reimplementing
// this, we use the `openclaw` CLI which handles it correctly.
//
// For remote gateways, we use the CLI's --url flag to specify the target.

function gatewayCliCall(method, gwConfig, extraArgs = [], timeoutMs = 15000) {
  const isLocal = gwConfig.host === 'localhost' || gwConfig.host === '127.0.0.1'

  const cliMethodMap = {
    health: ['openclaw', 'health', '--json'],
    status: ['openclaw', 'gateway', 'call', 'status', '--json'],
    'usage-cost': ['openclaw', 'gateway', 'usage-cost', '--json'],
  }

  const cmdParts = cliMethodMap[method]
  if (!cmdParts) throw new Error(`Unknown CLI method: ${method}`)

  const args = [...cmdParts]

  if (!isLocal) {
    if (!/^[\w.\-]+$/.test(gwConfig.host)) throw new Error('Invalid gateway host')
    if (!/^\d+$/.test(String(gwConfig.port))) throw new Error('Invalid gateway port')
    args.push('--url', `ws://${gwConfig.host}:${gwConfig.port}`)
    if (gwConfig.token) args.push('--token', gwConfig.token)
  }

  args.push(...extraArgs)

  try {
    const cleanEnv = { ...process.env, NO_COLOR: '1' }
    delete cleanEnv.FORCE_COLOR

    const output = execSync(args.join(' '), {
      encoding: 'utf-8',
      timeout: timeoutMs,
      env: cleanEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return JSON.parse(output)
  } catch (err) {
    const msg = (err.stderr || err.message || 'Unknown error')
      .replace(/\(node:\d+\) Warning:.*\n?/g, '')
      .replace(/\(Use `node --trace-warnings.*\n?/g, '')
      .trim()
      .slice(0, 150)
    throw new Error(`Gateway CLI unavailable: ${msg || 'openclaw command not found or gateway not running'}`)
  }
}

/**
 * Call a gateway RPC method via the OpenClaw CLI.
 */
async function callGateway(gwId, method, params = {}) {
  const gwConfig = GATEWAYS[gwId]
  if (!gwConfig) throw new Error(`Unknown gateway: ${gwId}`)

  const extraArgs = []
  if (method === 'usage-cost' && params.days) {
    const days = Number(params.days)
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      throw new Error('days must be an integer between 1 and 365')
    }
    extraArgs.push('--days', String(days))
  }
  return gatewayCliCall(method, gwConfig, extraArgs)
}

// ─── Anthropic proxy ────────────────────────────────────────────

async function proxyAnthropic(endpoint, query, res) {
  if (!ANTHROPIC_ADMIN_KEY) {
    return jsonResp(res, 200, {
      demo: true,
      error: 'ANTHROPIC_ADMIN_KEY not configured. Showing demo data.',
      data: null,
    })
  }

  const cacheKey = `anthropic:${endpoint}:${JSON.stringify(query)}`
  const cached = getCached(cacheKey)
  if (cached) return jsonResp(res, 200, { demo: false, data: cached })

  const qs = new URLSearchParams()
  if (query.starting_at) qs.set('starting_at', query.starting_at)
  if (query.ending_at) qs.set('ending_at', query.ending_at)
  if (query.bucket_width) qs.set('bucket_width', query.bucket_width)
  if (query.group_by) {
    const groups = Array.isArray(query.group_by) ? query.group_by : [query.group_by]
    groups.forEach((g) => qs.append('group_by[]', g))
  }

  const url = `${ANTHROPIC_BASE}/${endpoint}?${qs}`

  try {
    const resp = await fetch(url, {
      headers: {
        'anthropic-version': '2023-06-01',
        'x-api-key': ANTHROPIC_ADMIN_KEY,
      },
    })

    if (!resp.ok) {
      return jsonResp(res, 200, {
        demo: true,
        error: `Anthropic API error (${resp.status})`,
        data: null,
      })
    }

    const data = await resp.json()
    setCache(cacheKey, data)
    return jsonResp(res, 200, { demo: false, data })
  } catch (err) {
    return jsonResp(res, 200, {
      demo: true,
      error: 'Anthropic API request failed',
      data: null,
    })
  }
}

// ─── Chat API (via OpenClaw Agent) ───────────────────────────────

async function handleChat(body, res) {
  const { message, sessionId } = body || {}

  if (!message || typeof message !== 'string') {
    return jsonResp(res, 400, { ok: false, error: 'message string required' })
  }

  if (!sessionId || typeof sessionId !== 'string') {
    return jsonResp(res, 400, { ok: false, error: 'sessionId string required' })
  }

  if (!/^[\w-]+$/.test(sessionId)) {
    return jsonResp(res, 400, { ok: false, error: 'Invalid sessionId format' })
  }

  try {
    const cleanEnv = { ...process.env, NO_COLOR: '1' }
    delete cleanEnv.FORCE_COLOR

    const output = execSync(
      `openclaw agent --message ${JSON.stringify(message)} --session-id ${sessionId} --json --timeout 120`,
      {
        encoding: 'utf-8',
        timeout: CHAT_TIMEOUT_MS,
        env: cleanEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
        maxBuffer: 10 * 1024 * 1024,
      }
    )

    const data = JSON.parse(output)

    if (data.status !== 'ok') {
      return jsonResp(res, 200, {
        ok: false,
        error: data.summary || 'Agent returned an error',
      })
    }

    const text = data.result?.payloads?.[0]?.text || ''
    const meta = data.result?.meta?.agentMeta || {}

    return jsonResp(res, 200, {
      ok: true,
      content: text,
      model: meta.model,
      usage: meta.usage,
      sessionId,
      runId: data.runId,
      durationMs: data.result?.meta?.durationMs,
    })
  } catch (err) {
    const msg = (err.stderr || err.message || 'Unknown error')
      .replace(/\(node:\d+\) Warning:.*\n?/g, '')
      .replace(/\(Use `node --trace-warnings.*\n?/g, '')
      .trim()
      .slice(0, 200)

    return jsonResp(res, 200, {
      ok: false,
      error: msg || 'Failed to communicate with agent',
    })
  }
}

// ─── System status ──────────────────────────────────────────────

function getGitSyncStatus() {
  const repoPath = process.env.AGENT_WORKSPACE || join(process.env.HOME || '~', 'agent-workspace')

  try {
    const lastCommit = execSync(
      `git -C "${repoPath}" log -1 --format="%aI"`,
      { encoding: 'utf-8', timeout: 5000 }
    ).trim()

    const status = execSync(
      `git -C "${repoPath}" status --porcelain`,
      { encoding: 'utf-8', timeout: 5000 }
    ).trim()

    const branch = execSync(
      `git -C "${repoPath}" rev-parse --abbrev-ref HEAD`,
      { encoding: 'utf-8', timeout: 5000 }
    ).trim()

    return {
      lastSync: lastCommit,
      branch,
      pendingChanges: status ? status.split('\n').length : 0,
      status: status ? 'pending' : 'synced',
      repo: 'agent-workspace',
    }
  } catch {
    return {
      lastSync: null,
      branch: 'unknown',
      pendingChanges: 0,
      status: 'error',
      error: 'Unable to read git status',
      repo: 'agent-workspace',
    }
  }
}

// ─── Request handler ────────────────────────────────────────────

async function handleRequest(req, res) {
  const url = req.url
  const method = req.method

  cors(req, res)

  if (method === 'OPTIONS') {
    res.writeHead(204)
    return res.end()
  }

  // Health check
  if (url === '/api/health') {
    return jsonResp(res, 200, {
      status: 'ok',
      uptime: process.uptime(),
      anthropicConfigured: !!ANTHROPIC_ADMIN_KEY,
      gateways: Object.fromEntries(
        Object.entries(GATEWAYS).map(([id, gw]) => [id, { name: gw.name, host: gw.host, port: gw.port }])
      ),
    })
  }

  // ─── Gateway RPC endpoints ────────────────────────────────

  // /api/gateway/:id/health
  const gwHealthMatch = url.match(/^\/api\/gateway\/(\w+)\/health/)
  if (gwHealthMatch) {
    const gwId = gwHealthMatch[1]
    const cacheKey = `gw:${gwId}:health`
    const cached = getCached(cacheKey, GATEWAY_CACHE_TTL)
    if (cached) return jsonResp(res, 200, { ok: true, demo: false, data: cached })

    try {
      const data = await callGateway(gwId, 'health')
      setCache(cacheKey, data)
      return jsonResp(res, 200, { ok: true, demo: false, data })
    } catch (err) {
      return jsonResp(res, 200, { ok: false, demo: true, error: 'Gateway unavailable', data: null })
    }
  }

  // /api/gateway/:id/status
  const gwStatusMatch = url.match(/^\/api\/gateway\/(\w+)\/status/)
  if (gwStatusMatch) {
    const gwId = gwStatusMatch[1]
    const cacheKey = `gw:${gwId}:status`
    const cached = getCached(cacheKey, GATEWAY_CACHE_TTL)
    if (cached) return jsonResp(res, 200, { ok: true, demo: false, data: cached })

    try {
      const data = await callGateway(gwId, 'status')
      setCache(cacheKey, data)
      return jsonResp(res, 200, { ok: true, demo: false, data })
    } catch (err) {
      return jsonResp(res, 200, { ok: false, demo: true, error: 'Gateway unavailable', data: null })
    }
  }

  // /api/gateway/:id/usage?days=30
  const gwUsageMatch = url.match(/^\/api\/gateway\/(\w+)\/usage/)
  if (gwUsageMatch) {
    const gwId = gwUsageMatch[1]
    const query = parseQuery(url)
    const days = Math.max(1, Math.min(365, parseInt(query.days, 10) || 30))
    const cacheKey = `gw:${gwId}:usage:${days}`
    const cached = getCached(cacheKey, GATEWAY_CACHE_TTL)
    if (cached) return jsonResp(res, 200, { ok: true, demo: false, data: cached })

    try {
      const data = await callGateway(gwId, 'usage-cost', { days })
      setCache(cacheKey, data)
      return jsonResp(res, 200, { ok: true, demo: false, data })
    } catch (err) {
      return jsonResp(res, 200, { ok: false, demo: true, error: 'Gateway unavailable', data: null })
    }
  }

  // ─── Anthropic endpoints ──────────────────────────────────

  if (url.startsWith('/api/anthropic/usage')) {
    const query = parseQuery(url)
    if (!query.starting_at) {
      const start = new Date()
      start.setDate(start.getDate() - 30)
      query.starting_at = start.toISOString()
    }
    if (!query.ending_at) query.ending_at = new Date().toISOString()
    if (!query.bucket_width) query.bucket_width = '1d'
    if (!query.group_by) query.group_by = 'model'
    return proxyAnthropic('usage_report/messages', query, res)
  }

  if (url.startsWith('/api/anthropic/cost')) {
    const query = parseQuery(url)
    if (!query.starting_at) {
      const start = new Date()
      start.setDate(start.getDate() - 30)
      query.starting_at = start.toISOString()
    }
    if (!query.ending_at) query.ending_at = new Date().toISOString()
    if (!query.bucket_width) query.bucket_width = '1d'
    return proxyAnthropic('cost_report', query, res)
  }

  // ─── System endpoints ─────────────────────────────────────

  if (url === '/api/system/sync') {
    return jsonResp(res, 200, getGitSyncStatus())
  }

  // Cursor data — read
  if (url === '/api/cursor/data' && method === 'GET') {
    const data = readCursorData()
    return jsonResp(res, 200, {
      data,
      demo: !data,
      lastUpdated: data?.lastUpdated || null,
    })
  }

  // Cursor data — write
  if (url === '/api/cursor/data' && method === 'PUT') {
    const body = await parseBody(req)
    if (!body) return jsonResp(res, 400, { error: 'Invalid JSON body' })
    body.lastUpdated = new Date().toISOString()
    writeCursorData(body)
    return jsonResp(res, 200, { ok: true, data: body })
  }

  // ─── Memory endpoints ──────────────────────────────────────

  // GET /api/memory/search?q=query&limit=20&attachments=true
  if (url.startsWith('/api/memory/search')) {
    const query = parseQuery(url)
    const searchQuery = query.q || ''
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20))
    const includeAttachments = query.attachments === 'true'

    if (!searchQuery) {
      return jsonResp(res, 400, { error: 'q parameter required' })
    }

    try {
      const searchPath = join(process.env.AGENT_WORKSPACE || join(process.env.HOME || '~', 'agent-workspace'), 'search_memory.py')
      const args = ['python3', searchPath, JSON.stringify(searchQuery), '--limit', String(limit)]
      if (includeAttachments) args.push('--attachments')

      const output = execSync(args.join(' '), {
        encoding: 'utf-8',
        timeout: 10000,
        maxBuffer: 10 * 1024 * 1024,
      })

      const results = JSON.parse(output)
      return jsonResp(res, 200, { ok: true, results, query: searchQuery })
    } catch (err) {
      const msg = (err.stderr || err.message || 'Search failed').slice(0, 200)
      return jsonResp(res, 500, { ok: false, error: msg })
    }
  }

  // GET /api/memory/conversations?limit=50&offset=0
  if (url.startsWith('/api/memory/conversations')) {
    const query = parseQuery(url)
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 50))
    const offset = Math.max(0, parseInt(query.offset, 10) || 0)

    try {
      const dbPath = join(process.env.AGENT_WORKSPACE || join(process.env.HOME || '~', 'agent-workspace'), 'data', 'memory', 'agent_memory.db')
      const sqlQuery = `
        SELECT 
          c.id, 
          c.title, 
          c.create_time,
          (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
        FROM conversations c
        ORDER BY c.create_time DESC 
        LIMIT ${limit} OFFSET ${offset}
      `
      
      const output = execSync(
        `sqlite3 "${dbPath}" -json "${sqlQuery}"`,
        { encoding: 'utf-8', timeout: 5000 }
      )

      const conversations = JSON.parse(output || '[]').map(conv => ({
        ...conv,
        created_at: new Date(conv.create_time * 1000).toISOString(),
      }))
      return jsonResp(res, 200, { ok: true, conversations })
    } catch (err) {
      const msg = (err.stderr || err.message || 'Query failed').slice(0, 200)
      return jsonResp(res, 500, { ok: false, error: msg })
    }
  }

  // GET /api/memory/conversation/:id
  if (url.match(/^\/api\/memory\/conversation\/\d+$/)) {
    const id = url.split('/').pop()
    
    try {
      const dbPath = join(process.env.AGENT_WORKSPACE || join(process.env.HOME || '~', 'agent-workspace'), 'data', 'memory', 'agent_memory.db')
      
      // Get conversation details
      const convQuery = `SELECT id, title, create_time, update_time FROM conversations WHERE id = ${id}`
      const convOutput = execSync(
        `sqlite3 "${dbPath}" -json "${convQuery}"`,
        { encoding: 'utf-8', timeout: 5000 }
      )
      const conversations = JSON.parse(convOutput || '[]')
      if (!conversations || conversations.length === 0) {
        return jsonResp(res, 404, { ok: false, error: 'Conversation not found' })
      }
      
      // Convert timestamps to ISO strings
      const conv = conversations[0]
      conv.created_at = new Date(conv.create_time * 1000).toISOString()
      conv.updated_at = new Date(conv.update_time * 1000).toISOString()
      
      // Get messages
      const msgQuery = `SELECT id, conversation_id, role, content, created_at as timestamp FROM messages WHERE conversation_id = ${id} ORDER BY id`
      const msgOutput = execSync(
        `sqlite3 "${dbPath}" -json "${msgQuery}"`,
        { encoding: 'utf-8', timeout: 5000, maxBuffer: 10 * 1024 * 1024 }
      )
      const messages = JSON.parse(msgOutput || '[]')
      
      // Get attachments
      const attQuery = `SELECT * FROM attachments WHERE conversation_id = ${id}`
      const attOutput = execSync(
        `sqlite3 "${dbPath}" -json "${attQuery}"`,
        { encoding: 'utf-8', timeout: 5000 }
      ).trim()
      const attachments = JSON.parse(attOutput || '[]')
      
      return jsonResp(res, 200, {
        ok: true,
        conversation: conversations[0],
        messages,
        attachments,
      })
    } catch (err) {
      const msg = (err.stderr || err.message || 'Query failed').slice(0, 200)
      return jsonResp(res, 500, { ok: false, error: msg })
    }
  }

  // POST /api/memory/save
  if (url === '/api/memory/save' && method === 'POST') {
    const body = await parseBody(req)
    if (!body || !body.title || !body.messages) {
      return jsonResp(res, 400, { error: 'title and messages required' })
    }

    try {
      const scriptPath = join(process.env.AGENT_WORKSPACE || join(process.env.HOME || '~', 'agent-workspace'), 'add_to_memory.py')
      const tempFile = join('/tmp', `memory-${Date.now()}.json`)
      
      // Write conversation data to temp file
      writeFileSync(tempFile, JSON.stringify(body))
      
      // Call add_to_memory.py
      const output = execSync(
        `python3 "${scriptPath}" add --file "${tempFile}"`,
        { encoding: 'utf-8', timeout: 30000 }
      )
      
      // Clean up temp file
      execSync(`rm "${tempFile}"`)
      
      // Parse conversation ID from output
      const match = output.match(/Conversation ID: ([\w-]+)/)
      const conversationId = match ? match[1] : null
      
      return jsonResp(res, 200, {
        ok: true,
        conversationId,
        message: 'Conversation saved successfully',
      })
    } catch (err) {
      const msg = (err.stderr || err.message || 'Save failed').slice(0, 200)
      return jsonResp(res, 500, { ok: false, error: msg })
    }
  }

  // ─── Briefing endpoints ────────────────────────────────────
  
  // GET /api/briefings/latest
  if (url === '/api/briefings/latest' && method === 'GET') {
    try {
      const today = new Date().toISOString().split('T')[0]
      const briefPath = join(process.env.AGENT_WORKSPACE || join(process.env.HOME || '~', 'agent-workspace'), 'memory', `daily-brief-${today}.md`)
      
      if (!existsSync(briefPath)) {
        return jsonResp(res, 404, { ok: false, error: 'No briefing available yet' })
      }
      
      const briefContent = readFileSync(briefPath, 'utf-8')
      
      // Simple markdown parsing to extract sections
      const lines = briefContent.split('\n')
      let executiveSummary = ''
      let actionItems = []
      let findings = []
      
      let currentSection = null
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        if (line.startsWith('**Executive Summary:**')) {
          currentSection = 'summary'
          continue
        } else if (line.startsWith('**Action Items:**')) {
          currentSection = 'actions'
          continue
        } else if (line.startsWith('**Key Findings:**') || line.startsWith('**🔒 Security') || line.startsWith('**📊 Data') || line.startsWith('**🧹 Workspace')) {
          currentSection = 'findings'
          continue
        } else if (line.startsWith('**') || line.startsWith('##') || line.startsWith('---')) {
          currentSection = null
          continue
        }
        
        if (currentSection === 'summary' && line) {
          executiveSummary += line + ' '
        } else if (currentSection === 'actions' && line.match(/^\d+\./)) {
          actionItems.push(line.replace(/^\d+\.\s*/, '').replace(/^\*\*[A-Z]+:\*\*\s*/, ''))
        } else if (currentSection === 'findings' && line.startsWith('-')) {
          findings.push(line.replace(/^-\s*/, ''))
        }
      }
      
      return jsonResp(res, 200, {
        ok: true,
        briefing: {
          generatedAt: new Date().toISOString(),
          generatedBy: 'Council Synthesis',
          executiveSummary: executiveSummary.trim(),
          actionItems,
          findings,
          rawMarkdown: briefContent,
        }
      })
    } catch (err) {
      const msg = (err.message || 'Failed to load briefing').slice(0, 200)
      return jsonResp(res, 500, { ok: false, error: msg })
    }
  }

  // ─── Chat endpoint ─────────────────────────────────────────
  if (url === '/api/chat' && method === 'POST') {
    const body = await parseBody(req)
    if (!body) return jsonResp(res, 400, { error: 'Invalid JSON body' })
    return handleChat(body, res)
  }

  // 404
  jsonResp(res, 404, { error: 'Not found' })
}

// ─── Start ──────────────────────────────────────────────────────

const server = createServer(handleRequest)

server.listen(PORT, () => {
  console.log(`[proxy] OpenClaw dashboard proxy running on http://localhost:${PORT}`)
  console.log(`[proxy] Anthropic Admin API: ${ANTHROPIC_ADMIN_KEY ? 'configured' : 'NOT configured (demo mode)'}`)
  console.log(`[proxy] Chat: routed through OpenClaw agent`)
  console.log(`[proxy] Gateways:`)
  for (const [id, gw] of Object.entries(GATEWAYS)) {
    console.log(`[proxy]   ${id}: ws://${gw.host}:${gw.port} (${gw.name})`)
  }
})

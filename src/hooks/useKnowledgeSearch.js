import { useState, useCallback, useRef } from 'react'
import { mockContacts, mockContentIdeas, mockResearchHistory, mockTasks } from '../data/mockData'

/**
 * Hook for semantic search across the shared memory / knowledge base.
 *
 * In production, this calls the OpenClaw gateway's memory search endpoint:
 *
 *   POST http://<host>:<port>/memory/search
 *   Body:  { query: string, limit: 10, hybrid: true }
 *   Response: {
 *     results: [
 *       {
 *         file: "shared-memory/project-notes/competitive-analysis.md",
 *         chunk: "## Competitive Landscape\n...",
 *         score: 0.92,
 *         content: "Full chunk text with surrounding context...",
 *         metadata: {
 *           lastModified: "2026-02-13T14:22:00Z",
 *                      lastUpdatedBy: "agent",
    *           project: "my-project",
 *           tokens: 342
 *         }
 *       }
 *     ]
 *   }
 *
 * For now, simulates search with keyword matching against a mock knowledge base.
 *
 * @returns {{ results, searching, error, search, clear }}
 */
function getAllContacts() {
  const all = [...mockContacts]
  try {
    const user = JSON.parse(localStorage.getItem('clawd-crm-contacts') || '[]')
    all.push(...user.filter((c) => c.status === 'active'))
  } catch {}
  return all
}

function searchContacts(query) {
  const q = query.toLowerCase()
  return getAllContacts()
    .filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.role || '').toLowerCase().includes(q)
    )
    .slice(0, 5)
}

function searchContentIdeas(query) {
  const q = query.toLowerCase()
  const all = [...mockContentIdeas]
  try { const u = JSON.parse(localStorage.getItem('clawd-content-ideas') || '[]'); all.push(...u) } catch {}
  return all
    .filter((i) =>
      i.title.toLowerCase().includes(q) ||
      (i.tags || []).some((t) => t.toLowerCase().includes(q))
    )
    .slice(0, 5)
    .map((i) => ({ ...i, _type: 'content' }))
}

function searchTasks(query) {
  const q = query.toLowerCase()
  const all = [...mockTasks]
  try { const u = JSON.parse(localStorage.getItem('clawd-tasks') || '[]'); all.push(...u) } catch {}
  return all
    .filter((t) => t.title.toLowerCase().includes(q))
    .slice(0, 5)
    .map((t) => ({ ...t, _type: 'task' }))
}

function searchResearchQueries(query) {
  const q = query.toLowerCase()
  const all = [...mockResearchHistory]
  try { const u = JSON.parse(localStorage.getItem('clawd-research-history') || '[]'); all.push(...u) } catch {}
  return all
    .filter((r) => r.query.toLowerCase().includes(q))
    .slice(0, 3)
    .map((r) => ({ ...r, _type: 'research' }))
}

export function useKnowledgeSearch() {
  const [results, setResults] = useState([])
  const [contactResults, setContactResults] = useState([])
  const [contentResults, setContentResults] = useState([])
  const [taskResults, setTaskResults] = useState([])
  const [researchResults, setResearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(0)

  const search = useCallback((query) => {
    const trimmed = query.trim().toLowerCase()

    if (trimmed.length < 3) {
      setResults([])
      setContactResults([])
      setContentResults([])
      setTaskResults([])
      setResearchResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    setError(null)
    setContactResults(searchContacts(trimmed))
    setContentResults(searchContentIdeas(trimmed))
    setTaskResults(searchTasks(trimmed))
    setResearchResults(searchResearchQueries(trimmed))

    const id = ++abortRef.current

    setTimeout(() => {
      if (abortRef.current !== id) return

      try {
        const matched = searchMockKnowledgeBase(trimmed)
        setResults(matched)
      } catch {
        setError('Search failed. Check gateway connection.')
      }
      setSearching(false)
    }, 300 + Math.random() * 200)
  }, [])

  const clear = useCallback(() => {
    abortRef.current++
    setResults([])
    setContactResults([])
    setContentResults([])
    setTaskResults([])
    setResearchResults([])
    setSearching(false)
    setError(null)
  }, [])

  return { results, contactResults, contentResults, taskResults, researchResults, searching, error, search, clear }
}

// ─── Mock Knowledge Base ───────────────────────────────────────

const KNOWLEDGE_BASE = [
  {
    id: 'competitive-analysis',
    file: 'competitive-analysis.md',
    path: 'shared-memory/project-notes/',
    lastModified: '2026-02-13T14:22:00Z',
    lastUpdatedBy: 'agent',
    content: `# Competitive Analysis

## Market Overview
The social media content space is increasingly crowded with AI-powered tools. Key competitors include Buffer AI, Hootsuite Labs, and Sprout Social's new AI tier. Market size estimated at $4.2B by 2027.

## Competitor Breakdown
**Buffer AI** — Launched Jan 2026. Strengths: simple UX, good scheduling. Weaknesses: limited analytics, no multi-platform content adaptation. Pricing: $29/mo pro tier.

**Hootsuite Labs** — Beta since Nov 2025. Strengths: enterprise features, team collaboration. Weaknesses: expensive ($199/mo), complex onboarding. Uses GPT-4o for generation.

**Sprout Social AI** — Most mature offering. Strengths: sentiment analysis, trend detection. Weaknesses: limited generation quality, focused on Twitter/X. Uses proprietary fine-tuned models.

## Our Differentiator
Multi-agent architecture allows specialized content generation per platform. Cost advantage through model routing — expensive models for creative, cheap models for formatting.`,
    tags: ['competitive', 'market', 'buffer', 'hootsuite', 'sprout', 'social', 'analysis', 'pricing'],
  },
  {
    id: 'contract-connection-arch',
    file: 'contract-connection-architecture.md',
    path: 'shared-memory/project-notes/',
    lastModified: '2026-02-12T09:15:00Z',
    lastUpdatedBy: 'agent',
    content: `# Contract Connection Architecture

## System Design
Three-tier architecture: React frontend → FastAPI backend → PostgreSQL + Redis.

The contract parser uses Claude Sonnet 4.5 for extraction with a structured output schema. Key extraction fields: parties, dates, obligations, payment terms, renewal clauses, termination conditions.

## Key Decisions
- **Parser model**: Claude Sonnet 4.5 chosen over GPT-4o for superior structured extraction. 40% fewer hallucinations on contract-specific benchmarks.
- **Storage**: PostgreSQL with pgvector for semantic search over contract clauses. Redis for session cache and rate limiting.
- **Auth**: Clerk for authentication, row-level security in Postgres for multi-tenant isolation.

## API Endpoints
POST /api/contracts/upload — Accepts PDF, returns parsed JSON
GET /api/contracts/:id — Full contract with extracted metadata
POST /api/contracts/search — Semantic search across all contracts
GET /api/contracts/:id/obligations — Extracted obligations timeline`,
    tags: ['contract', 'connection', 'architecture', 'fastapi', 'postgresql', 'redis', 'claude', 'parser', 'api', 'design'],
  },
  {
    id: 'cms-guidelines',
    file: 'cms-content-guidelines.md',
    path: 'shared-memory/references/',
    lastModified: '2026-02-10T16:45:00Z',
    lastUpdatedBy: 'Jinx',
    content: `# CMS Content Guidelines Summary

## Voice & Tone
Professional but approachable. Avoid jargon unless writing for a technical audience. Use active voice. Keep paragraphs under 3 sentences for web content.

## SEO Requirements
- Title tags: 50-60 characters, include primary keyword
- Meta descriptions: 150-160 characters, include CTA
- H1: one per page, matches search intent
- Internal linking: minimum 3 links per article to related content
- Image alt text: descriptive, include keyword where natural

## Content Types
1. **Blog posts**: 1200-2000 words, 2-3 images, published weekly
2. **Landing pages**: 500-800 words, strong CTA above fold, testimonial section
3. **Documentation**: Task-oriented, step-by-step, code examples where applicable
4. **Social posts**: Platform-specific length, emoji usage moderate, hashtag strategy per platform`,
    tags: ['cms', 'content', 'guidelines', 'seo', 'voice', 'tone', 'blog', 'landing', 'documentation', 'social'],
  },
  {
    id: 'openclaw-config-notes',
    file: 'openclaw-configuration.md',
    path: 'shared-memory/technical/',
    lastModified: '2026-02-14T08:30:00Z',
    lastUpdatedBy: 'Jinx',
    content: `# OpenClaw Configuration Notes

## Gateway Setup
Both machines run OpenClaw Gateway v0.9.2 on port 18789. Connected via Tailscale mesh VPN (subnet 100.64.x.x).

Agents run on both machines: local gateway and remote gateway.

## Agent Configuration
Each agent has a SOUL.md defining personality and a memory/ directory for persistent context. Heartbeat interval set to 30 minutes for both agents.

## Model Routing
Default routing: complex tasks → Sonnet 4.5, simple tasks → Haiku 4.5. Uses Claude Sonnet 4.5 as the primary model on both machines.

## Memory Sync
Git-based sync every 5 minutes via cron. Push to workspace repo main branch. Conflict resolution: last-write-wins with manual review flag.

## Known Issues
- Gateway WebSocket occasionally drops after 4+ hours idle. Workaround: heartbeat keepalive.
- Memory sync can lag during large file commits. Consider git-lfs for binary assets.
- Tailscale DNS resolution flaky on Mac Mini wake-from-sleep. Workaround: use IP fallback.`,
    tags: ['openclaw', 'configuration', 'gateway', 'tailscale', 'agent', 'setup', 'memory', 'sync', 'routing', 'model'],
  },
  {
    id: 'meeting-notes-feb12',
    file: '2026-02-12-planning.md',
    path: 'memory/',
    lastModified: '2026-02-12T17:00:00Z',
    lastUpdatedBy: 'jinx',
    content: `# Planning Session — Feb 12, 2026

## Dashboard MVP
Agreed on tech stack: React + Vite + Tailwind. Priority features for v1:
1. Agent status overview
2. Model selector per agent
3. Token usage tracking with charts
4. Settings page for gateway configuration

Target: functional dashboard by Feb 15.

## Budget Discussion
Current monthly LLM spend: ~$85-120 depending on workload. Budget target: $100/month. Need cost intelligence features to identify savings — particularly routing simple tasks away from Opus.

## Next Steps
- Agent (Primary): Build dashboard scaffold and components, gather competitive data
- Agent (Remote): Set up monitoring, alerting, and background research`,
    tags: ['meeting', 'planning', 'dashboard', 'budget', 'mvp', 'february', 'sprint', 'tasks', 'priority'],
  },
  {
    id: 'tailscale-setup',
    file: 'tailscale-network-setup.md',
    path: 'shared-memory/technical/',
    lastModified: '2026-02-08T11:20:00Z',
    lastUpdatedBy: 'Jinx',
    content: `# Tailscale Network Setup

## Nodes
- Primary Machine (localhost) — 100.64.1.10 — Primary development machine
- Remote Server (remote-host.tail) — 100.64.1.20 — Background processing / research
- iPhone (for monitoring via Tailscale app)

## ACLs
Both machines have full mesh access. No external sharing enabled. MagicDNS enabled for .tail domain resolution.

## Ports
- 18789: OpenClaw Gateway (both machines)
- 3000: Dashboard dev server (primary machine only)
- 5432: PostgreSQL (remote server)
- 6379: Redis (remote server)

## Troubleshooting
If DNS resolution fails, use direct IPs. Restart Tailscale daemon if mesh connectivity drops. Check \`tailscale status\` for peer health.`,
    tags: ['tailscale', 'network', 'setup', 'vpn', 'dns', 'ports', 'local', 'remote', 'acl', 'troubleshooting'],
  },
  {
    id: 'prompt-engineering-notes',
    file: 'prompt-engineering-patterns.md',
    path: 'shared-memory/references/',
    lastModified: '2026-02-11T13:45:00Z',
    lastUpdatedBy: 'jinx',
    content: `# Prompt Engineering Patterns

## Structured Output
For contract parsing, use XML tags to define expected output structure. Claude handles XML schemas more reliably than JSON schemas for complex nested objects.

## Chain of Thought
Enable for analysis tasks (research, competitive analysis). Disable for formatting and simple extraction — wastes tokens without improving quality.

## Few-Shot Examples
Include 2-3 examples for new task types. Diminishing returns after 5 examples. Use diverse examples covering edge cases.

## System Prompt Best Practices
- Keep under 500 tokens for cost efficiency
- Define role, constraints, and output format upfront
- Use SOUL.md pattern for agent personality consistency
- Reference memory files for context without embedding full content

## Model Selection Guide
- Creative writing / nuanced analysis → Opus 4.5
- Code generation / structured extraction → Sonnet 4.5
- Formatting / classification / simple Q&A → Haiku 4.5 or Flash
- Cost-sensitive batch processing → GPT-4o Mini or Gemini Flash`,
    tags: ['prompt', 'engineering', 'patterns', 'structured', 'output', 'chain', 'thought', 'examples', 'system', 'model', 'selection'],
  },
  {
    id: 'pitch-deck',
    file: 'pitch-outline.md',
    path: 'shared-memory/project-notes/',
    lastModified: '2026-02-13T10:00:00Z',
    lastUpdatedBy: 'agent',
    content: `# Pitch Deck Outline

## Slide 1: Problem
Small businesses waste 10+ hours/week creating social media content. Existing tools are either too basic or too expensive.

## Slide 2: Solution
AI-powered social media content engine that generates, adapts, and schedules content across platforms. Multi-agent architecture ensures platform-specific optimization.

## Slide 3: Market
$4.2B market by 2027. 28M small businesses in US alone. Average SMB spends $300/month on social media management.

## Slide 4: Product
Live demo showing: content generation, multi-platform adaptation (LinkedIn professional → Twitter concise → Instagram visual), scheduling, and analytics.

## Slide 5: Business Model
Freemium: 10 posts/month free. Pro: $29/mo (100 posts). Business: $79/mo (unlimited + team). Enterprise: custom pricing.

## Slide 6: Traction
Beta waitlist: 2,400 signups. Pilot with 12 local businesses. 4.2/5 satisfaction score.`,
    tags: ['pitch', 'deck', 'slides', 'business', 'model', 'market', 'product', 'traction', 'freemium'],
  },
]

// ─── Mock search engine ────────────────────────────────────────

function searchMockKnowledgeBase(query) {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length >= 2)
  if (terms.length === 0) return []

  const scored = KNOWLEDGE_BASE.map((entry) => {
    const contentLower = entry.content.toLowerCase()
    const tagsStr = entry.tags.join(' ')

    let score = 0

    // Tag matches (highest weight)
    for (const term of terms) {
      if (entry.tags.some((t) => t.includes(term))) score += 0.25
    }

    // Title/filename match
    const fileLower = entry.file.toLowerCase()
    for (const term of terms) {
      if (fileLower.includes(term)) score += 0.15
    }

    // Content keyword matches
    for (const term of terms) {
      const re = new RegExp(term, 'gi')
      const matches = contentLower.match(re)
      if (matches) {
        score += Math.min(matches.length * 0.05, 0.3) // cap per-term
      }
    }

    // Full phrase match bonus
    if (contentLower.includes(query.toLowerCase())) {
      score += 0.3
    }

    // Normalize to 0–1 range (cap at 0.98)
    score = Math.min(score, 0.98)

    // Extract best matching snippet
    const snippet = extractSnippet(entry.content, terms)

    return {
      id: entry.id,
      file: entry.file,
      path: entry.path,
      score: +score.toFixed(2),
      snippet,
      lastModified: entry.lastModified,
      lastUpdatedBy: entry.lastUpdatedBy,
    }
  })

  return scored
    .filter((r) => r.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}

function extractSnippet(content, terms) {
  const lines = content.split('\n').filter((l) => l.trim() && !l.startsWith('#'))

  // Find the line with the most term matches
  let bestIdx = 0
  let bestCount = 0
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase()
    let count = 0
    for (const t of terms) {
      if (lower.includes(t)) count++
    }
    if (count > bestCount) {
      bestCount = count
      bestIdx = i
    }
  }

  // Take the best line and 1-2 surrounding lines
  const start = Math.max(0, bestIdx)
  const end = Math.min(lines.length, start + 3)
  return lines.slice(start, end).join('\n')
}

/**
 * Mock data for the OpenClaw dashboard.
 * Replace with real API calls to gateway endpoints later.
 */

// ─── Agent Status ──────────────────────────────────────────────
// TWO agents: Jinx (Mac Mini, online), Binx (MacBook, placeholder)

export const agents = [
  {
    id: 'jinx',
    name: 'Jinx',
    machine: 'mini',
    machineLabel: 'Mac Mini',
    status: 'online',        // online | degraded | offline | unknown
    model: 'claude-sonnet-4.5',
    modelLabel: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    gateway: 'remote-host.example:18789',
    uptime: '12h 05m',
    lastActive: '8 min ago',
    tokensToday: 281_600,
    spendToday: 4.23,
  },
  {
    id: 'binx',
    name: 'Binx',
    machine: 'macbook',
    machineLabel: 'MacBook',
    status: 'offline',       // placeholder, not yet configured
    model: 'claude-haiku-3.0',
    modelLabel: 'Claude Haiku 3.0',
    provider: 'anthropic',
    gateway: 'localhost:18789',
    uptime: '0h',
    lastActive: 'never',
    tokensToday: 0,
    spendToday: 0.00,
  },
]

// ─── Sub-Agents (Departments under Jinx) ────────────────────────

export const subAgents = [
  {
    id: 'security',
    name: 'Security',
    parentAgentId: 'jinx',
    purpose: 'Nightly security scans, vulnerability detection, threat monitoring',
    status: 'healthy',       // healthy | warning | error | disabled
    lastRun: '2026-03-16T03:00:00Z',
    nextRun: '2026-03-17T03:00:00Z',
    flags: [],
    accent: 'red',
  },
  {
    id: 'organizer',
    name: 'Organizer',
    parentAgentId: 'jinx',
    purpose: 'Task management, calendar integration, daily briefing generation',
    status: 'healthy',
    lastRun: '2026-03-16T06:00:00Z',
    nextRun: '2026-03-17T06:00:00Z',
    flags: [],
    accent: 'blue',
  },
  {
    id: 'data-crawler',
    name: 'Data Crawler',
    parentAgentId: 'jinx',
    purpose: 'Research, archive exploration, knowledge base updates',
    status: 'healthy',
    lastRun: '2026-03-16T12:00:00Z',
    nextRun: '2026-03-17T12:00:00Z',
    flags: [],
    accent: 'green',
  },
  {
    id: 'council-moderator',
    name: 'Council Moderator',
    parentAgentId: 'jinx',
    purpose: 'Nightly council synthesis, consensus building, recommendation ranking',
    status: 'healthy',
    lastRun: '2026-03-16T03:00:00Z',
    nextRun: '2026-03-17T03:00:00Z',
    flags: [],
    accent: 'purple',
  },
]

// ─── Machine Status (sub-items under agents) ────────────────────

export const machines = [
  {
    id: 'mini',
    label: 'Mac Mini',
    agentId: 'jinx',
    status: 'online',
    gateway: 'remote-host.example:18789',
    uptime: '12h 05m',
    lastActive: '8 min ago',
    tokensToday: 281_600,
    spendToday: 4.23,
    accent: 'green',         // green dot
  },
  {
    id: 'macbook',
    label: 'MacBook',
    agentId: 'binx',
    status: 'offline',       // placeholder for Binx
    gateway: 'localhost:18789',
    uptime: '0h',
    lastActive: 'never',
    tokensToday: 0,
    spendToday: 0.00,
    accent: 'gray',          // gray dot
  },
]

// ─── Gateway Health ────────────────────────────────────────────

export const gateways = [
  {
    id: 'mini',
    name: 'Remote Server',
    host: 'remote-host.example',
    port: 18789,
    status: 'healthy',       // healthy | degraded | down
    latency: 28,             // ms
    agentCount: 1,
    uptime: '12d 3h',
  },
  {
    id: 'macbook',
    name: 'Local Machine (Binx)',
    host: 'localhost',
    port: 18789,
    status: 'offline',       // placeholder, not configured
    latency: 0,
    agentCount: 0,
    uptime: '0d',
  },
]

// ─── Usage Summary ─────────────────────────────────────────────

export const usageSummary = {
  today: {
    totalSpend: 26.75,
    totalTokens: 1_752_400,
    byProvider: {
      anthropic: { spend: 12.47, tokens: 685_200 },
      openai: { spend: 8.31, tokens: 518_200 },
      google: { spend: 3.20, tokens: 412_600 },
      xai: { spend: 1.85, tokens: 98_400 },
      openrouter: { spend: 0.92, tokens: 38_000 },
    },
    byMachine: {
      mini: { spend: 4.23, tokens: 281_600 },
      macbook: { spend: 0.00, tokens: 0 },
    },
  },
  week: {
    totalSpend: 167.36,
    totalTokens: 11_842_000,
  },
  month: {
    totalSpend: 656.65,
    totalTokens: 46_218_000,
  },
}

// ─── Usage History (7 days) ────────────────────────────────────

export const usageHistory = [
  { date: '2026-02-08', day: 'Sat', spend: 31.20, tokens: 2_180_000 },
  { date: '2026-02-09', day: 'Sun', spend: 28.45, tokens: 1_960_000 },
  { date: '2026-02-10', day: 'Mon', spend: 22.10, tokens: 1_520_000 },
  { date: '2026-02-11', day: 'Tue', spend: 35.60, tokens: 2_440_000 },
  { date: '2026-02-12', day: 'Wed', spend: 24.80, tokens: 1_710_000 },
  { date: '2026-02-13', day: 'Thu', spend: 29.15, tokens: 2_020_000 },
  { date: '2026-02-14', day: 'Today', spend: 26.75, tokens: 1_752_400 },
]

// ─── Provider Spend History (7 days) ───────────────────────────

export const providerHistory = [
  { date: '2026-02-08', anthropic: 14.20, openai: 9.80, google: 4.10, xai: 2.10, openrouter: 1.00 },
  { date: '2026-02-09', anthropic: 12.60, openai: 8.90, google: 3.80, xai: 1.95, openrouter: 1.20 },
  { date: '2026-02-10', anthropic: 9.80, openai: 6.50, google: 3.20, xai: 1.60, openrouter: 1.00 },
  { date: '2026-02-11', anthropic: 16.10, openai: 10.40, google: 5.10, xai: 2.50, openrouter: 1.50 },
  { date: '2026-02-12', anthropic: 11.40, openai: 7.20, google: 3.40, xai: 1.80, openrouter: 1.00 },
  { date: '2026-02-13', anthropic: 13.50, openai: 8.60, google: 3.90, xai: 2.05, openrouter: 1.10 },
  { date: '2026-02-14', anthropic: 12.47, openai: 8.31, google: 3.20, xai: 1.85, openrouter: 0.92 },
]

// ─── System Status ─────────────────────────────────────────────

export const systemStatus = {
  discord: {
    status: 'connected',     // connected | disconnected | error
    server: 'My Server',
    channels: 2,
    lastMessage: '1 min ago',
  },
  memorySync: {
    status: 'synced',        // synced | syncing | conflict | error
    lastSync: '3 min ago',
    repo: 'agent-workspace',
    branch: 'main',
    pendingChanges: 0,
  },
  tailscale: {
    status: 'connected',     // connected | disconnected
    peers: 2,
    ip: '100.64.x.x',
  },
  cursor: {
    status: 'active',
    requestsToday: 847,
    fastRequests: 412,
    slowRequests: 435,
    resetDate: '2026-03-01',
  },
}

// ─── Provider Spend (for bar chart) ────────────────────────────

export const providerSpendToday = [
  { provider: 'Anthropic', spend: 12.47, fill: '#d97706' },
  { provider: 'OpenAI', spend: 8.31, fill: '#10b981' },
  { provider: 'Google', spend: 3.20, fill: '#3b82f6' },
  { provider: 'xAI', spend: 1.85, fill: '#8b5cf6' },
  { provider: 'OpenRouter', spend: 0.92, fill: '#ec4899' },
  { provider: 'Cursor', spend: 0.00, fill: '#06b6d4' },
]

// ─── Activity Feed ─────────────────────────────────────────────

export const activityFeed = [
  { id: 1, agent: 'Jinx', machine: 'Mac Mini', action: 'Completed memory sync', time: 'just now', type: 'sync' },
  { id: 2, agent: 'Jinx', machine: 'Mac Mini', action: 'Updated dashboard mock data', time: '2 min ago', type: 'config' },
  { id: 3, agent: 'Jinx', machine: 'Remote', action: 'Processed document batch for knowledge base', time: '15 min ago', type: 'task' },
  { id: 4, agent: 'Jinx', machine: 'Mac Mini', action: 'Gateway health check passed', time: '20 min ago', type: 'health' },
  { id: 5, agent: 'Jinx', machine: 'Mac Mini', action: 'Ran nightly council session', time: '3h ago', type: 'council' },
  { id: 6, agent: 'Jinx', machine: 'Mac Mini', action: 'Archived old session files', time: '6h ago', type: 'task' },
]

// ─── Knowledge Sources ──────────────────────────────────────────

export const knowledgeSources = [
  {
    id: 'ks-001',
    url: 'https://www.anthropic.com/research/building-effective-agents',
    title: 'Building Effective Agents — Anthropic Research',
    sourceType: 'article',
    summary: 'Anthropic\'s guide to building effective AI agents covering tool use, chain-of-thought reasoning, and multi-step task decomposition. Covers patterns for reliable agent systems that minimize hallucination.',
    tags: ['ai', 'agents', 'anthropic', 'architecture'],
    status: 'processed',
    chunkCount: 14,
    rawPreview: 'Building effective AI agents requires careful consideration of several key architectural decisions. First, the agent\'s tool use capabilities must be well-defined and constrained. Second, chain-of-thought reasoning should be enabled for complex tasks but disabled for simple formatting...',
    createdAt: '2026-02-10T09:15:00Z',
    isMock: true,
  },
  {
    id: 'ks-002',
    url: 'https://www.healthcareitnews.com/news/cms-finalizes-2026-interoperability-rules',
    title: 'CMS Finalizes 2026 Interoperability Rules for Health Systems',
    sourceType: 'article',
    summary: 'CMS released final rules expanding FHIR API requirements for payers and providers. New mandates for prior authorization automation and patient access APIs take effect Q3 2026.',
    tags: ['healthcare', 'cms', 'interoperability', 'fhir'],
    status: 'processed',
    chunkCount: 8,
    rawPreview: 'The Centers for Medicare and Medicaid Services today released the final rule on interoperability and prior authorization, expanding FHIR-based API requirements to additional payer classes. The rule mandates...',
    createdAt: '2026-02-08T14:30:00Z',
    isMock: true,
  },
  {
    id: 'ks-003',
    url: 'https://simonwillison.net/2026/Feb/5/prompt-injection-defenses/',
    title: 'Practical Prompt Injection Defenses in 2026',
    sourceType: 'article',
    summary: 'Simon Willison\'s overview of current prompt injection defense strategies including input sanitization, output monitoring, and privilege separation patterns for production LLM applications.',
    tags: ['security', 'prompt-injection', 'llm', 'defense'],
    status: 'processed',
    chunkCount: 11,
    rawPreview: 'Prompt injection remains the most significant security challenge for LLM-powered applications in 2026. While no single defense is foolproof, layered approaches combining input validation, output monitoring...',
    createdAt: '2026-02-06T11:00:00Z',
    isMock: true,
  },
  {
    id: 'ks-004',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Building RAG Systems That Actually Work — AI Engineer Summit',
    sourceType: 'video',
    summary: 'Conference talk covering practical RAG pipeline design: chunking strategies, embedding model selection, hybrid search with BM25 + vector, and reranking with cross-encoders. Includes benchmarks.',
    tags: ['rag', 'embeddings', 'search', 'ai', 'tutorial'],
    status: 'processed',
    chunkCount: 22,
    rawPreview: '[Transcript] Today I want to talk about RAG systems that actually work in production. Most tutorials gloss over the hard parts — chunking strategy, embedding drift, retrieval quality measurement...',
    createdAt: '2026-02-12T16:00:00Z',
    isMock: true,
  },
  {
    id: 'ks-005',
    url: 'https://www.youtube.com/watch?v=abc123xyz',
    title: 'Healthcare AI in Practice: EHR Integration Patterns',
    sourceType: 'video',
    summary: 'Deep dive into integrating AI assistants with Electronic Health Record systems. Covers SMART on FHIR, CDS Hooks, and ambient documentation workflows used at major health systems.',
    tags: ['healthcare', 'ai', 'ehr', 'fhir'],
    status: 'processed',
    chunkCount: 18,
    rawPreview: '[Transcript] The biggest barrier to AI adoption in healthcare isn\'t the AI itself — it\'s integration with existing EHR workflows. In this talk, I\'ll show three patterns that have worked...',
    createdAt: '2026-02-11T10:30:00Z',
    isMock: true,
  },
  {
    id: 'ks-006',
    url: 'https://x.com/karpathy/status/1892847362',
    title: 'Karpathy Thread: LLM Inference Cost Trends 2026',
    sourceType: 'tweet',
    summary: 'Andrej Karpathy\'s thread analyzing the trajectory of LLM inference costs, predicting 10x cost reduction by end of 2026 driven by hardware improvements and quantization advances.',
    tags: ['llm', 'costs', 'inference', 'trends', 'karpathy'],
    status: 'processed',
    chunkCount: 3,
    rawPreview: '1/ Here\'s what I think about inference costs for the rest of 2026. TL;DR: we\'re going to see another 10x reduction. Here\'s why... 2/ First, Blackwell GPUs are shipping at scale now...',
    createdAt: '2026-02-13T08:45:00Z',
    isMock: true,
  },
  {
    id: 'ks-007',
    url: null,
    title: 'CMS Quality Reporting Requirements — 2026 Update',
    sourceType: 'pdf',
    summary: 'Updated CMS quality measure specifications for the Merit-based Incentive Payment System (MIPS). Includes new digital quality measure requirements and AI-assisted documentation guidelines.',
    tags: ['cms', 'quality', 'mips', 'healthcare', 'compliance'],
    status: 'processed',
    chunkCount: 32,
    rawPreview: 'DEPARTMENT OF HEALTH AND HUMAN SERVICES. Centers for Medicare & Medicaid Services. 42 CFR Parts 401, 403, 405, 410, 411, 414, 425...',
    createdAt: '2026-02-05T09:00:00Z',
    isMock: true,
  },
  {
    id: 'ks-008',
    url: null,
    title: 'Dashboard Architecture Decision Record',
    sourceType: 'note',
    summary: 'Internal notes on why we chose React + Vite + Tailwind for the dashboard. Considered Next.js but opted against SSR complexity for what\'s essentially a local tool.',
    tags: ['dashboard', 'architecture', 'decisions', 'react', 'vite'],
    status: 'processed',
    chunkCount: 4,
    rawPreview: 'ADR-001: Dashboard Tech Stack. Status: Accepted. Context: Need a dashboard UI for OpenClaw gateway monitoring. Requirements: fast dev cycle, dark theme, real-time data, runs locally...',
    createdAt: '2026-02-04T15:20:00Z',
    isMock: true,
  },
  {
    id: 'ks-009',
    url: null,
    title: 'Jinx Model Routing Strategy Notes',
    sourceType: 'note',
    summary: 'Working notes on optimal model routing for Jinx. Key insight: routing simple tasks to Haiku saves ~40% on token costs with negligible quality loss for formatting and status checks.',
    tags: ['jinx', 'routing', 'models', 'optimization', 'costs'],
    status: 'processed',
    chunkCount: 3,
    rawPreview: 'Model routing strategy for Jinx (both machines). Goal: minimize cost without sacrificing quality on complex tasks. Current routing: everything goes to Sonnet 4.5. Proposed: add task classifier...',
    createdAt: '2026-02-09T12:00:00Z',
    isMock: true,
  },
]

// ─── Tasks ──────────────────────────────────────────────────────

export const mockTasks = [
  {
    id: 'task-mock-001',
    title: 'Follow up with Dr. Martinez about rehab program expansion',
    description: 'Discuss new rehab wing capacity and staffing needs for Q3.',
    assignee: null,
    isOwner: true,
    priority: 'medium',
    dueDate: null,
    status: 'pending',
    source: 'direct',
    createdAt: '2026-02-15T10:00:00Z',
    completedAt: null,
    isMock: true,
  },
  {
    id: 'task-mock-002',
    title: 'Send newsletter draft to communications team',
    description: 'Final draft of the February patient engagement newsletter.',
    assignee: null,
    isOwner: true,
    priority: 'high',
    dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    status: 'pending',
    source: 'direct',
    createdAt: '2026-02-16T09:30:00Z',
    completedAt: null,
    isMock: true,
  },
  {
    id: 'task-mock-003',
    title: 'Review competitor analysis for board presentation',
    description: 'Cross-reference market data from competitive analysis doc with latest financials.',
    assignee: null,
    isOwner: true,
    priority: 'high',
    dueDate: '2026-02-14',
    status: 'done',
    source: 'direct',
    createdAt: '2026-02-12T14:00:00Z',
    completedAt: '2026-02-14T16:30:00Z',
    isMock: true,
  },
  {
    id: 'task-mock-004',
    title: 'Schedule demo of new EHR integration',
    description: 'Coordinate with Dr. Patel\'s office for a 30-minute walkthrough of SMART on FHIR features.',
    assignee: null,
    isOwner: true,
    priority: 'low',
    dueDate: null,
    status: 'pending',
    source: 'direct',
    createdAt: '2026-02-14T11:00:00Z',
    completedAt: null,
    isMock: true,
  },
  {
    id: 'task-mock-005',
    title: 'Update compliance training materials',
    description: 'Incorporate 2026 CMS quality reporting changes into training slides.',
    assignee: 'Sarah',
    isOwner: false,
    priority: 'medium',
    dueDate: null,
    status: 'pending',
    source: 'extraction',
    createdAt: '2026-02-13T08:00:00Z',
    completedAt: null,
    isMock: true,
  },
]

// ─── CRM Contacts ──────────────────────────────────────────────

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString()
}

export const mockContacts = [
  {
    id: 'crm-001',
    name: 'Dr. Maria Martinez',
    email: 'maria.martinez@usahealth.edu',
    company: 'USA Health',
    role: 'VP of Rehabilitation',
    phone: '251-555-0142',
    score: 88,
    tags: ['healthcare', 'rehab'],
    source: 'both',
    notes: 'Key champion for the rehab expansion project. Very responsive via email. Prefers morning meetings.',
    interactions: [
      { date: daysAgo(3), type: 'email', subject: 'RE: Rehab Program Q3 Expansion Timeline', snippet: 'Looks great — I\'ll get the staffing numbers to you by Thursday.' },
      { date: daysAgo(7), type: 'meeting', subject: 'Rehab Wing Capacity Planning', snippet: 'Reviewed floor plans and patient flow projections for new wing.' },
      { date: daysAgo(14), type: 'email', subject: 'Budget Approval for Phase 2', snippet: 'Board approved the budget. We\'re clear to proceed with vendor selection.' },
      { date: daysAgo(21), type: 'meeting', subject: 'Monthly Check-in: Rehab Services', snippet: 'Discussed patient outcomes and satisfaction scores. Up 12% QoQ.' },
      { date: daysAgo(35), type: 'email', subject: 'Intro: New PT Director', snippet: 'Want to introduce you to our new Physical Therapy director, Dr. Owens.' },
      { date: daysAgo(50), type: 'email', subject: 'FW: CMS Rehab Quality Measures Update', snippet: 'FYI — new quality reporting requirements affecting rehab programs.' },
    ],
    lastContact: daysAgo(3),
    createdAt: '2025-08-15T10:00:00Z',
    updatedAt: daysAgo(3),
    status: 'active',
    isMock: true,
  },
  {
    id: 'crm-002',
    name: 'James Chen',
    email: 'jchen@infirmaryhealth.org',
    company: 'Infirmary Health',
    role: 'Director of IT',
    phone: '251-555-0198',
    score: 75,
    tags: ['healthcare', 'IT'],
    source: 'both',
    notes: 'Interested in AI-assisted documentation pilots. Has budget authority for IT projects under $200K.',
    interactions: [
      { date: daysAgo(12), type: 'email', subject: 'RE: EHR Integration Proposal', snippet: 'Reviewed the FHIR spec doc — a few questions on the auth flow.' },
      { date: daysAgo(18), type: 'meeting', subject: 'IT Leadership Roundtable', snippet: 'Presented at their monthly IT leadership meeting. Good reception.' },
      { date: daysAgo(30), type: 'email', subject: 'Vendor Evaluation Criteria', snippet: 'Here are the criteria we use for new tech vendors — sharing for reference.' },
      { date: daysAgo(45), type: 'email', subject: 'Intro Call Follow-up', snippet: 'Great talking today. Let\'s schedule a deeper dive on the SMART on FHIR work.' },
    ],
    lastContact: daysAgo(12),
    createdAt: '2025-09-20T14:30:00Z',
    updatedAt: daysAgo(12),
    status: 'active',
    isMock: true,
  },
  {
    id: 'crm-003',
    name: 'Sarah Thompson',
    email: 'sarah@anthropic.com',
    company: 'Anthropic',
    role: 'Developer Relations',
    phone: null,
    score: 82,
    tags: ['AI', 'tech'],
    source: 'email',
    notes: 'Super helpful with Claude API questions. Connected me to the enterprise team.',
    interactions: [
      { date: daysAgo(5), type: 'email', subject: 'RE: Claude 4 Migration Guide', snippet: 'The migration guide is live now. Let me know if you hit any edge cases.' },
      { date: daysAgo(10), type: 'email', subject: 'Enterprise API Limits Discussion', snippet: 'I\'ve looped in our enterprise team for the rate limit increase request.' },
      { date: daysAgo(22), type: 'meeting', subject: 'Claude API Best Practices Session', snippet: 'One-on-one walkthrough of prompt caching and tool use patterns.' },
      { date: daysAgo(38), type: 'email', subject: 'FW: New Model Announcement', snippet: 'Heads up — new model dropping next week. Embargo until Monday.' },
      { date: daysAgo(55), type: 'email', subject: 'Welcome to Anthropic Developer Program', snippet: 'Welcome aboard! Here are your API credits and getting started resources.' },
    ],
    lastContact: daysAgo(5),
    createdAt: '2025-10-05T09:00:00Z',
    updatedAt: daysAgo(5),
    status: 'active',
    isMock: true,
  },
  {
    id: 'crm-004',
    name: 'Robert Williams',
    email: 'robert.williams@cms.hhs.gov',
    company: 'CMS Regional Office',
    role: 'Program Analyst',
    phone: '202-555-0167',
    score: 65,
    tags: ['compliance', 'government'],
    source: 'email',
    notes: 'Good resource for interpreting CMS rule changes. Responds slowly but always helpful.',
    interactions: [
      { date: daysAgo(25), type: 'email', subject: 'RE: 2026 MIPS Reporting Questions', snippet: 'The new digital quality measures are optional for this reporting year.' },
      { date: daysAgo(60), type: 'email', subject: 'Clarification on Prior Auth Rule', snippet: 'Section 4.2 applies to MA plans only. Fee-for-service has a different timeline.' },
    ],
    lastContact: daysAgo(25),
    createdAt: '2025-11-01T11:00:00Z',
    updatedAt: daysAgo(25),
    status: 'active',
    isMock: true,
  },
  {
    id: 'crm-005',
    name: 'Alex Chen',
    email: 'alex@devstudio.io',
    company: 'DevStudio',
    role: 'Senior Developer',
    phone: '555-555-0101',
    score: 95,
    tags: ['team', 'dev'],
    source: 'both',
    notes: 'Great pair programmer and code reviewer. Always willing to rubber duck. Best debugging partner.',
    interactions: [
      { date: daysAgo(1), type: 'email', subject: 'RE: Dashboard code review', snippet: 'LGTM! Ship it. The chart animations are slick.' },
      { date: daysAgo(2), type: 'meeting', subject: 'Pair Programming: CRM Feature', snippet: 'Worked through the contact scoring algorithm together.' },
      { date: daysAgo(5), type: 'email', subject: 'React 19 migration notes', snippet: 'Here are my notes from migrating my project. Heads up on the useEffect changes.' },
      { date: daysAgo(8), type: 'meeting', subject: 'Weekly Catch-up', snippet: 'Talked about the dashboard roadmap and upcoming features.' },
      { date: daysAgo(12), type: 'email', subject: 'FW: Interesting Tailwind plugin', snippet: 'Check this out — auto dark mode generation from design tokens.' },
      { date: daysAgo(15), type: 'meeting', subject: 'Code Review: Knowledge Page', snippet: 'Reviewed the knowledge search implementation and tag input component.' },
      { date: daysAgo(20), type: 'email', subject: 'Vite vs Turbopack benchmarks', snippet: 'Ran some benchmarks. Vite still wins for our project size.' },
      { date: daysAgo(28), type: 'email', subject: 'Bug report: sidebar collapse', snippet: 'Found an edge case when resizing from mobile to desktop width.' },
      { date: daysAgo(35), type: 'meeting', subject: 'Project Kickoff', snippet: 'Initial planning session for the dashboard project.' },
      { date: daysAgo(42), type: 'email', subject: 'Tech stack discussion', snippet: 'Let\'s go with React + Vite + Tailwind. Simple and fast.' },
    ],
    lastContact: daysAgo(1),
    createdAt: '2025-06-01T08:00:00Z',
    updatedAt: daysAgo(1),
    status: 'active',
    isMock: true,
  },
  {
    id: 'crm-006',
    name: 'Mike Patterson',
    email: 'mpatterson@springhealthit.com',
    company: 'SpringHealth IT',
    role: 'Systems Admin',
    phone: '251-555-0223',
    score: 70,
    tags: ['IT', 'vendor'],
    source: 'email',
    notes: 'Manages the server infrastructure for our EHR system. Key contact for any deployment issues.',
    interactions: [
      { date: daysAgo(18), type: 'email', subject: 'RE: Server Maintenance Window', snippet: 'Confirmed — maintenance window is Saturday 2-6 AM. Minimal impact expected.' },
      { date: daysAgo(32), type: 'email', subject: 'SSL Certificate Renewal', snippet: 'Certs renewed for all production endpoints. Expires again in 12 months.' },
      { date: daysAgo(50), type: 'meeting', subject: 'Infrastructure Review', snippet: 'Quarterly review of server capacity, uptime metrics, and scaling plans.' },
    ],
    lastContact: daysAgo(18),
    createdAt: '2025-07-10T13:00:00Z',
    updatedAt: daysAgo(18),
    status: 'active',
    isMock: true,
  },
  {
    id: 'crm-007',
    name: 'Dr. Angela Brooks',
    email: 'abrooks@usahealth.edu',
    company: 'USA Health',
    role: 'Chief of Cardiology',
    phone: '251-555-0189',
    score: 72,
    tags: ['healthcare', 'cardiac'],
    source: 'calendar',
    notes: 'Met at the health system leadership retreat. Interested in AI-assisted ECG analysis.',
    interactions: [
      { date: daysAgo(20), type: 'meeting', subject: 'AI in Cardiology: Exploratory Chat', snippet: 'Discussed potential for AI-assisted ECG interpretation in the cath lab.' },
      { date: daysAgo(40), type: 'meeting', subject: 'Health System Leadership Retreat', snippet: 'Initial introduction at the annual leadership retreat. Shared interest in tech.' },
      { date: daysAgo(55), type: 'email', subject: 'Follow-up: Retreat Conversation', snippet: 'Great meeting you. Would love to continue our AI discussion.' },
    ],
    lastContact: daysAgo(20),
    createdAt: '2025-09-01T09:00:00Z',
    updatedAt: daysAgo(20),
    status: 'active',
    isMock: true,
  },
  {
    id: 'crm-008',
    name: 'David Kim',
    email: 'david@cursor.com',
    company: 'Cursor',
    role: 'Support Engineer',
    phone: null,
    score: 55,
    tags: ['tech', 'tools'],
    source: 'email',
    notes: 'Helpful with Cursor IDE issues. Escalated my agent mode bug report.',
    interactions: [
      { date: daysAgo(35), type: 'email', subject: 'RE: Agent Mode Bug Report', snippet: 'Thanks for the detailed repro. I\'ve escalated this to the agent team.' },
      { date: daysAgo(52), type: 'email', subject: 'Welcome to Cursor Pro', snippet: 'Your Pro subscription is active. Here are some tips to get the most out of it.' },
    ],
    lastContact: daysAgo(35),
    createdAt: '2025-11-15T10:00:00Z',
    updatedAt: daysAgo(35),
    status: 'active',
    isMock: true,
  },
  {
    id: 'crm-009',
    name: 'Lisa Rodriguez',
    email: 'lisa@mobilechamber.com',
    company: 'Mobile Chamber of Commerce',
    role: 'Events Director',
    phone: '251-555-0312',
    score: 60,
    tags: ['community', 'networking'],
    source: 'calendar',
    notes: 'Organizes the annual tech meetup series. Good for local networking.',
    interactions: [
      { date: daysAgo(40), type: 'meeting', subject: 'Mobile Tech Meetup Planning', snippet: 'Discussed speaker lineup for the spring tech meetup series.' },
      { date: daysAgo(70), type: 'email', subject: 'Speaker Invitation: AI in Healthcare', snippet: 'Would you be interested in speaking at our next healthcare + tech event?' },
    ],
    lastContact: daysAgo(40),
    createdAt: '2025-08-20T14:00:00Z',
    updatedAt: daysAgo(40),
    status: 'active',
    isMock: true,
  },
  {
    id: 'crm-010',
    name: 'Tom Bradley',
    email: 'tbradley@infirmaryhealth.org',
    company: 'Infirmary Health',
    role: 'CEO',
    phone: '251-555-0400',
    score: 78,
    tags: ['healthcare', 'executive'],
    source: 'both',
    notes: 'Decision maker for system-wide tech initiatives. Met through James Chen.',
    interactions: [
      { date: daysAgo(8), type: 'meeting', subject: 'Executive Briefing: AI Strategy', snippet: 'Presented the AI roadmap to the C-suite. Bradley asked about ROI timelines.' },
      { date: daysAgo(22), type: 'email', subject: 'RE: AI Strategy One-Pager', snippet: 'Good summary. Can you add a section on risk mitigation for the board?' },
      { date: daysAgo(45), type: 'meeting', subject: 'Introduction via James Chen', snippet: 'Initial meeting to discuss technology modernization priorities.' },
    ],
    lastContact: daysAgo(8),
    createdAt: '2025-10-01T11:00:00Z',
    updatedAt: daysAgo(8),
    status: 'active',
    isMock: true,
  },
  {
    id: 'crm-011',
    name: 'Amanda Foster',
    email: 'amanda.foster@bcbsal.org',
    company: 'Blue Cross Blue Shield AL',
    role: 'Provider Relations',
    phone: '205-555-0278',
    score: 68,
    tags: ['insurance', 'payer'],
    source: 'email',
    notes: 'Handles provider network contracts for BCBS Alabama. Useful for payer-side perspective.',
    interactions: [
      { date: daysAgo(22), type: 'email', subject: 'RE: Prior Auth API Timeline', snippet: 'We\'re targeting Q4 for the FHIR prior auth endpoint. Will share specs soon.' },
      { date: daysAgo(48), type: 'email', subject: 'Provider Directory Data Exchange', snippet: 'Here\'s the updated provider directory schema we\'re implementing.' },
    ],
    lastContact: daysAgo(22),
    createdAt: '2025-10-15T09:30:00Z',
    updatedAt: daysAgo(22),
    status: 'active',
    isMock: true,
  },
  {
    id: 'crm-012',
    name: 'Kevin Nguyen',
    email: 'kevin.dev@protonmail.com',
    company: null,
    role: 'Freelance Developer',
    phone: null,
    score: 58,
    tags: ['dev', 'contractor'],
    source: 'email',
    notes: 'Good React/Node freelancer. Available for overflow work. Timezone: CST.',
    interactions: [
      { date: daysAgo(45), type: 'email', subject: 'RE: Availability for Contract Work', snippet: 'I have bandwidth starting March. Happy to discuss scope and rates.' },
      { date: daysAgo(65), type: 'email', subject: 'Portfolio & References', snippet: 'Here\'s my updated portfolio. Recent work includes a healthcare scheduling app.' },
    ],
    lastContact: daysAgo(45),
    createdAt: '2025-12-01T08:00:00Z',
    updatedAt: daysAgo(45),
    status: 'active',
    isMock: true,
  },
]

// ─── Briefing Data ──────────────────────────────────────────────
// TODO: Briefings are generated nightly by Jinx cron job. Dashboard fetches latest via API.

export const mockBriefing = {
  id: 'briefing-2026-02-17',
  generatedAt: '2026-02-17T06:30:00Z',
  generatedBy: 'Jinx',
  previousOutlook: { weekly: 69, monthly: 65 },

  outlook: { weekly: 72, monthly: 68, blended: 70 },

  signalCount: 18,
  sourceCount: 6,

  sections: {
    systems: {
      title: 'Systems',
      status: 'healthy',
      items: [
        { status: 'ok', label: 'Both gateways responding (MacBook 34ms, Mac Mini 12ms)', detail: 'All healthy' },
        { status: 'ok', label: 'Discord connected, agents online on both machines', detail: 'Agent HQ server' },
        { status: 'ok', label: 'Memory synced 8 min ago', detail: 'workspace/main — no conflicts' },
      ],
    },
  },

  recommendations: [
    {
      id: 'rec-001',
      rank: 1,
      title: 'Expand Hyperbaric Medicine Marketing',
      impact: 85,
      confidence: 78,
      effort: 40,
      description: 'Our hyperbaric medicine program outperforms regional competitors by 30% on volume but has zero active digital marketing. A targeted campaign could capture significant unmet demand from patients currently seeking treatment out-of-market.',
      evidence: [
        { text: 'Our hyperbaric program has 30% higher volume than regional competitors', source: 'Competitive Intel' },
        { text: 'No active digital marketing for this service line', source: 'Marketing Audit' },
        { text: 'Google Trends shows rising search volume for hyperbaric therapy in the Mobile metro', source: 'SEO Analysis' },
      ],
      council: {
        votes: [
          { reviewer: 'GrowthStrategist', vote: 'support', comment: 'Low-hanging fruit — high volume advantage with zero marketing is a clear growth lever.' },
          { reviewer: 'RevenueGuardian', vote: 'support', comment: 'High margin service line. Marketing ROI should be strong given existing operational capacity.' },
          { reviewer: 'SkepticalOperator', vote: 'revise', comment: 'Verify volume data is current — last competitive report is 4 months old.' },
          { reviewer: 'TeamDynamicsArchitect', vote: 'support', comment: 'Marketing team has bandwidth. Could launch within 30 days.' },
        ],
        consensus: 'Strong consensus to proceed. Skeptical Operator\'s data freshness concern is valid — recommend refreshing competitive data before campaign launch.',
      },
    },
    {
      id: 'rec-002',
      rank: 2,
      title: 'Pursue Magnet Recognition Preparation',
      impact: 75,
      confidence: 65,
      effort: 80,
      description: 'Both regional competitors hold Magnet designation, creating a competitive gap in nurse recruitment and patient perception. Beginning the preparation journey signals commitment to nursing excellence.',
      evidence: [
        { text: 'Both regional competitors hold Magnet designation', source: 'Competitive Intel' },
        { text: 'Nursing satisfaction scores trending upward — 78th percentile', source: 'HR Analytics' },
        { text: 'Magnet-certified organizations report 7% lower staff turnover on average', source: 'Industry Research' },
      ],
      council: {
        votes: [
          { reviewer: 'GrowthStrategist', vote: 'support', comment: 'Strong brand differentiator for recruitment. Worth the multi-year investment.' },
          { reviewer: 'RevenueGuardian', vote: 'reject', comment: 'High cost, 3-4 year timeline to designation. ROI is too uncertain for current budget cycle.' },
          { reviewer: 'SkepticalOperator', vote: 'revise', comment: 'Start with Pathway to Excellence first — faster, cheaper, validates readiness for Magnet.' },
          { reviewer: 'TeamDynamicsArchitect', vote: 'support', comment: 'Nursing leadership is eager. Could boost internal morale significantly.' },
        ],
        consensus: 'Split decision. Recommend the Skeptical Operator\'s approach: pursue Pathway to Excellence as a stepping stone before full Magnet commitment.',
      },
    },
    {
      id: 'rec-003',
      rank: 3,
      title: 'Address CMS Star Rating Gaps',
      impact: 80,
      confidence: 72,
      effort: 55,
      description: 'The organization is not participating in key industry surveys and has gaps in 2 public rating categories. These data gaps directly hurt trust and referral patterns from informed consumers.',
      evidence: [
        { text: 'Not participating in Leapfrog or CMS Compare for 2 categories', source: 'Regulatory Audit' },
        { text: 'Public safety data gaps correlate with lower patient trust scores', source: 'Industry Research' },
        { text: '34% of customers check ratings before selecting a provider', source: 'Consumer Survey' },
      ],
      council: {
        votes: [
          { reviewer: 'GrowthStrategist', vote: 'support', comment: 'Transparency builds trust. Participating is table stakes.' },
          { reviewer: 'RevenueGuardian', vote: 'support', comment: 'Low cost to participate. Risk of non-participation is higher than participating with average scores.' },
          { reviewer: 'SkepticalOperator', vote: 'support', comment: 'Data shows clear correlation between rating availability and patient preference.' },
          { reviewer: 'TeamDynamicsArchitect', vote: 'support', comment: 'Quality team can handle this with existing resources.' },
        ],
        consensus: 'Unanimous support. This is a risk mitigation play — the cost of inaction exceeds the effort required.',
      },
    },
    {
      id: 'rec-004',
      rank: 4,
      title: 'Strengthen Cardiac Service Line Referral Network',
      impact: 70,
      confidence: 68,
      effort: 50,
      description: 'Cardiac surgery volumes are flat despite a growing market. Key referring physicians are approaching retirement, creating referral leakage risk. A proactive outreach program to next-generation cardiologists is needed.',
      evidence: [
        { text: 'Cardiac surgery volumes flat while regional market growing 4% annually', source: 'Volume Analytics' },
        { text: 'Three key referring physicians retiring within 18 months', source: 'CRM Data' },
        { text: 'No structured referral development program currently exists', source: 'Operations Review' },
      ],
      council: {
        votes: [
          { reviewer: 'GrowthStrategist', vote: 'support', comment: 'Referral network is the lifeblood of surgical volumes. Must act before retirements hit.' },
          { reviewer: 'RevenueGuardian', vote: 'support', comment: 'Each cardiac surgery case generates $45K+ in revenue. Protecting this pipeline is critical.' },
          { reviewer: 'SkepticalOperator', vote: 'revise', comment: 'Quantify referral leakage first — need to know where cases are going before investing in retention.' },
          { reviewer: 'TeamDynamicsArchitect', vote: 'support', comment: 'Physician liaison team is underutilized. Good fit for this initiative.' },
        ],
        consensus: 'Strong support with a pre-condition: conduct referral leakage analysis within 30 days before launching the full outreach program.',
      },
    },
    {
      id: 'rec-005',
      rank: 5,
      title: 'Launch Internal Newsletter Modernization',
      impact: 45,
      confidence: 80,
      effort: 30,
      description: 'The internal employee newsletter has declining open rates and an outdated template. Modernizing to a mobile-first, interactive format could improve internal communication and employee engagement.',
      evidence: [
        { text: 'Newsletter open rates declined from 62% to 41% over 12 months', source: 'Email Analytics' },
        { text: 'Template hasn\'t been updated in 18 months', source: 'Communications Audit' },
        { text: 'Employee survey shows 68% prefer mobile-friendly communications', source: 'HR Survey' },
      ],
      council: {
        votes: [
          { reviewer: 'GrowthStrategist', vote: 'support', comment: 'Quick win. Better internal comms improves alignment on strategic initiatives.' },
          { reviewer: 'RevenueGuardian', vote: 'reject', comment: 'Low revenue impact. Deprioritize against higher-value items.' },
          { reviewer: 'SkepticalOperator', vote: 'support', comment: 'Low effort, measurable outcome. Good candidate for a rapid experiment.' },
          { reviewer: 'TeamDynamicsArchitect', vote: 'support', comment: 'Communications team has been requesting this. High morale impact.' },
        ],
        consensus: 'Moderate support. Low effort makes this worth doing despite limited revenue impact. Schedule as a Q2 quick win.',
      },
    },
    {
      id: 'rec-006',
      rank: 6,
      title: 'Evaluate Inpatient Rehab Expansion Feasibility',
      impact: 75,
      confidence: 55,
      effort: 70,
      description: 'Inpatient rehab is our top competitive advantage. The growing waitlist suggests unmet demand, but expansion requires significant capital and workforce investment. A feasibility study should precede commitment.',
      evidence: [
        { text: 'Inpatient rehab is top-rated competitive advantage in patient surveys', source: 'Patient Surveys' },
        { text: 'Waitlist has grown 22% year-over-year', source: 'Operations Data' },
        { text: 'Nearest competitor rehab facility is 45 minutes away', source: 'Market Analysis' },
      ],
      council: {
        votes: [
          { reviewer: 'GrowthStrategist', vote: 'support', comment: 'Growing demand + geographic advantage = strong expansion case.' },
          { reviewer: 'RevenueGuardian', vote: 'support', comment: 'Rehab generates strong margins. Expansion could add $2-3M annually.' },
          { reviewer: 'SkepticalOperator', vote: 'revise', comment: 'Need capital cost analysis before proceeding. Could be $5-10M depending on scope.' },
          { reviewer: 'TeamDynamicsArchitect', vote: 'revise', comment: 'Staffing constraints are the biggest risk — rehab therapists are hard to recruit in this market.' },
        ],
        consensus: 'Support for feasibility study, not yet for full commitment. Capital and staffing analyses must be completed first.',
      },
    },
  ],

  signals: [
    { id: 'sig-01', source: 'YouTube', name: 'Video views (7d avg)', value: '2,340', direction: 'up', confidence: 85, category: 'content' },
    { id: 'sig-02', source: 'YouTube', name: 'Subscriber growth rate', value: '+12/week', direction: 'up', confidence: 80, category: 'content' },
    { id: 'sig-03', source: 'CRM', name: 'Active contacts', value: '12', direction: 'flat', confidence: 95, category: 'relationships' },
    { id: 'sig-04', source: 'CRM', name: 'Stale contacts (30+ days)', value: '4', direction: 'up', confidence: 95, category: 'relationships' },
    { id: 'sig-05', source: 'CRM', name: 'Avg contact score', value: '72', direction: 'flat', confidence: 90, category: 'relationships' },
    { id: 'sig-06', source: 'Project Backlog', name: 'Open tasks', value: '8', direction: 'down', confidence: 90, category: 'operations' },
    { id: 'sig-07', source: 'Project Backlog', name: 'Tasks completed (7d)', value: '5', direction: 'up', confidence: 90, category: 'operations' },
    { id: 'sig-08', source: 'Newsletter', name: 'Open rate', value: '41%', direction: 'down', confidence: 85, category: 'content' },
    { id: 'sig-09', source: 'Newsletter', name: 'Click-through rate', value: '8.2%', direction: 'flat', confidence: 80, category: 'content' },
    { id: 'sig-10', source: 'Competitive Intel', name: 'USA Health web traffic', value: '+18%', direction: 'up', confidence: 60, category: 'market' },
    { id: 'sig-11', source: 'Competitive Intel', name: 'Infirmary Health job postings', value: '34', direction: 'up', confidence: 70, category: 'market' },
    { id: 'sig-12', source: 'Competitive Intel', name: 'Regional healthcare M&A activity', value: '2 deals', direction: 'flat', confidence: 55, category: 'market' },
    { id: 'sig-13', source: 'Cron Health', name: 'Scheduled jobs success rate', value: '98.5%', direction: 'flat', confidence: 95, category: 'operations' },
    { id: 'sig-14', source: 'Cron Health', name: 'Average job duration', value: '4.2s', direction: 'down', confidence: 90, category: 'operations' },
    { id: 'sig-15', source: 'Gateway', name: 'API uptime (7d)', value: '99.8%', direction: 'flat', confidence: 98, category: 'operations' },
    { id: 'sig-16', source: 'Gateway', name: 'Avg response latency', value: '23ms', direction: 'down', confidence: 95, category: 'operations' },
    { id: 'sig-17', source: 'Cost Intelligence', name: 'Weekly LLM spend', value: '$42.80', direction: 'down', confidence: 90, category: 'costs' },
    { id: 'sig-18', source: 'Cost Intelligence', name: 'Model routing efficiency', value: '74%', direction: 'up', confidence: 75, category: 'costs' },
  ],

  councilTrace: {
    phases: [
      {
        phase: 1,
        name: 'Draft Analysis',
        actor: 'LeadAnalyst',
        model: 'Claude Opus 4.5',
        tokens: 12_400,
        cost: 0.31,
        summary: 'Generated initial recommendations from 18 signals across 6 sources. Identified 8 potential recommendations, ranked by preliminary scoring.',
      },
      {
        phase: 2,
        name: 'Council Review',
        actors: [
          { name: 'GrowthStrategist', model: 'Claude Opus 4.5', tokens: 3_200, finding: 'Strongest growth signals in hyperbaric and rehab service lines.' },
          { name: 'RevenueGuardian', model: 'Claude Opus 4.5', tokens: 2_800, finding: 'Flagged 2 recommendations as negative ROI. Cardiac referral protection is undervalued.' },
          { name: 'SkepticalOperator', model: 'Claude Opus 4.5', tokens: 3_100, finding: 'Identified data freshness issues in 3 recommendations. Requested verification steps.' },
          { name: 'TeamDynamicsArchitect', model: 'Claude Opus 4.5', tokens: 2_600, finding: 'Staffing constraints limit concurrent initiatives to 3-4 max.' },
        ],
      },
      {
        phase: 3,
        name: 'Consensus',
        actor: 'CouncilModerator',
        model: 'Claude Opus 4.5',
        tokens: 4_200,
        cost: 0.11,
        summary: 'Resolved 3 disagreements. Trimmed from 8 to 6 recommendations. Adjusted rankings based on council feedback.',
        disagreements: [
          'Magnet Recognition: Revenue vs Growth — compromised on Pathway first approach',
          'Newsletter Modernization: Revenue flagged as low-value — kept due to low effort',
          'Rehab Expansion: Confidence score reduced from 70 to 55 due to capital unknowns',
        ],
      },
    ],
    totalTokens: 28_300,
    totalCost: 0.85,
  },
}

export const mockBriefingHistory = [
  { id: 'briefing-2026-02-17', date: '2026-02-17', outlook: { weekly: 72, monthly: 68 }, topRec: 'Expand Hyperbaric Medicine Marketing' },
  { id: 'briefing-2026-02-16', date: '2026-02-16', outlook: { weekly: 69, monthly: 65 }, topRec: 'Address CMS Star Rating Gaps' },
  { id: 'briefing-2026-02-15', date: '2026-02-15', outlook: { weekly: 71, monthly: 66 }, topRec: 'Strengthen Cardiac Referral Network' },
  { id: 'briefing-2026-02-14', date: '2026-02-14', outlook: { weekly: 68, monthly: 64 }, topRec: 'Launch Internal Newsletter Modernization' },
  { id: 'briefing-2026-02-13', date: '2026-02-13', outlook: { weekly: 65, monthly: 62 }, topRec: 'Evaluate Rehab Expansion Feasibility' },
]

// ─── Content Ideas ──────────────────────────────────────────────

export const mockContentIdeas = [
  {
    id: '2026-02-10-001',
    title: 'AI Agents in Healthcare Administration',
    type: 'long-form',
    summary: 'How AI agents are transforming back-office workflows in organizations — from scheduling to compliance tracking. Angle: personal experience building an agent for your organization.',
    tags: ['AI', 'healthcare'],
    status: 'pitched',
    response: null,
    similarTo: null,
    similarityScore: null,
    createdAt: '2026-02-10T14:20:00Z',
  },
  {
    id: '2026-02-08-001',
    title: 'Building a Personal CRM with OpenClaw',
    type: 'long-form',
    summary: 'Step-by-step tutorial: from concept to working CRM using OpenClaw\'s agent framework and a simple React dashboard. Cover contact scoring, Gmail scanning, and NL queries.',
    tags: ['AI', 'productivity'],
    status: 'accepted',
    response: null,
    similarTo: null,
    similarityScore: null,
    createdAt: '2026-02-08T09:15:00Z',
  },
  {
    id: '2026-02-05-001',
    title: 'Hackathon Tips: How We Won with Contract Connection',
    type: 'short-form',
    summary: 'Quick thread/post about our hackathon strategy, tech stack decisions, and the Contract Connection concept that won.',
    tags: ['dev', 'hackathon'],
    status: 'produced',
    response: null,
    similarTo: null,
    similarityScore: null,
    createdAt: '2026-02-05T11:30:00Z',
  },
  {
    id: '2026-02-03-001',
    title: 'Competitive Analysis Using AI Tools',
    type: 'long-form',
    summary: 'Using publicly available data and AI to build a competitive landscape for your organization\'s market.',
    tags: ['healthcare', 'AI'],
    status: 'rejected',
    response: 'Too niche — focus on broader AI content first',
    similarTo: null,
    similarityScore: null,
    createdAt: '2026-02-03T16:45:00Z',
  },
  {
    id: '2026-01-28-001',
    title: 'Running LLMs on Consumer Hardware',
    type: 'long-form',
    summary: 'Mac Mini M4 Pro as an LLM workhorse — benchmarks, setup guide, and real-world usage running Ollama models alongside gateway processes.',
    tags: ['AI', 'hardware'],
    status: 'pitched',
    response: null,
    similarTo: null,
    similarityScore: null,
    createdAt: '2026-01-28T10:00:00Z',
  },
  {
    id: '2026-01-25-001',
    title: 'Discord as a Developer Productivity Hub',
    type: 'short-form',
    summary: 'How our Discord setup with bot integrations, slash commands, and AI agents creates a unified dev workspace.',
    tags: ['dev', 'productivity'],
    status: 'pitched',
    response: null,
    similarTo: null,
    similarityScore: null,
    createdAt: '2026-01-25T15:20:00Z',
  },
  {
    id: '2026-01-20-001',
    title: 'Cursor vs Traditional IDEs for AI-Assisted Coding',
    type: 'short-form',
    summary: 'Honest comparison after 3 months daily usage — what Cursor does better, what\'s still missing, and who should switch.',
    tags: ['dev', 'AI', 'tools'],
    status: 'accepted',
    response: null,
    similarTo: null,
    similarityScore: null,
    createdAt: '2026-01-20T13:10:00Z',
  },
  {
    id: '2026-01-15-001',
    title: 'Why Organizations Need Better Digital Strategy',
    type: 'long-form',
    summary: 'The gap between large enterprises and smaller organizations in digital presence, SEO, and customer engagement — and how to close it affordably.',
    tags: ['healthcare', 'strategy'],
    status: 'pitched',
    response: null,
    similarTo: null,
    similarityScore: null,
    createdAt: '2026-01-15T08:30:00Z',
  },
]

// ─── Research Results ───────────────────────────────────────────

export const mockResearchHistory = [
  {
    id: 'research-001',
    query: 'AI agents in healthcare',
    timeframe: '7d',
    results: {
      narratives: [
        { title: 'Automation excitement is high', summary: 'Healthcare admins are actively exploring AI agents for scheduling, claims processing, and patient follow-ups. Early adopters report 40-60% time savings on routine tasks.', sentiment: 'positive' },
        { title: 'Patient data concerns dominate pushback', summary: 'HIPAA compliance and data sovereignty remain the top barriers. Several high-profile threads debating whether AI agents should have access to PHI.', sentiment: 'negative' },
        { title: 'Nurse and admin adoption stories gaining traction', summary: 'Real-world case studies from community hospitals are going viral — especially stories of nurses using AI to reduce charting time by 2+ hours per shift.', sentiment: 'positive' },
        { title: 'Regulatory uncertainty creating hesitation', summary: 'CMS and ONC haven\'t issued clear guidance on AI agents in clinical workflows. Many systems waiting for regulatory clarity before investing.', sentiment: 'mixed' },
        { title: 'Cost savings reports emerging', summary: 'Multiple health systems sharing data showing $200K-500K annual savings from AI-assisted back-office operations. Skeptics questioning if these numbers account for implementation costs.', sentiment: 'positive' },
      ],
      posts: [
        { id: 'p1', author: 'Dr. Sarah Chen', handle: '@sarahchenmd', text: 'Just deployed an AI agent to handle our prior auth workflow. 3 weeks in: 47% reduction in processing time, staff morale UP because they\'re not fighting with insurance portals anymore. This is the real healthcare AI revolution — not flashy diagnostics, but fixing the broken plumbing.', likes: 2400, retweets: 890, replies: 156, timestamp: '2026-02-15T14:30:00Z' },
        { id: 'p2', author: 'HealthTech Watch', handle: '@healthtechwatch', text: 'NEW: Community hospitals adopting AI agents 3x faster than academic medical centers. Why? Less bureaucracy, more pain from staffing shortages, and leadership that\'s closer to the problems. Thread 🧵', likes: 1800, retweets: 620, replies: 89, timestamp: '2026-02-14T09:15:00Z' },
        { id: 'p3', author: 'Mike Rodriguez', handle: '@mikerodriguezIT', text: 'Hot take: AI agents in healthcare are going to create MORE IT tickets, not fewer. Every integration, every workflow change, every edge case. Your IT team needs to grow before your AI footprint does.', likes: 950, retweets: 340, replies: 201, timestamp: '2026-02-16T11:45:00Z' },
        { id: 'p4', author: 'NurseLife Today', handle: '@nurselifetoday', text: 'I spend 4 hours per shift charting. FOUR HOURS. If an AI agent can cut that in half, I don\'t care about the philosophical debates. Give it to me yesterday.', likes: 4200, retweets: 1100, replies: 312, timestamp: '2026-02-13T16:20:00Z' },
        { id: 'p5', author: 'Compliance Corner', handle: '@compliancecrnr', text: 'Reminder: If your AI agent touches PHI, you need a BAA with every vendor in the chain. That includes the model provider, the hosting provider, AND the agent framework. Most orgs are getting this wrong.', likes: 780, retweets: 410, replies: 45, timestamp: '2026-02-15T08:00:00Z' },
        { id: 'p6', author: 'AI in Practice', handle: '@aiinpractice', text: 'Interesting pattern: hospitals using AI agents for patient scheduling see 15-20% reduction in no-shows. Turns out persistent, personalized follow-up reminders work better than generic texts.', likes: 1200, retweets: 380, replies: 67, timestamp: '2026-02-14T13:50:00Z' },
      ],
      sentiment: { positive: 55, mixed: 25, neutral: 15, negative: 5 },
      contrarian: [
        { text: 'AI agents are creating more work for IT departments, not less. Every "automation" requires 3 new integration points, custom error handling, and a human fallback. Net productivity gain after 6 months: negative.', author: 'Mike Rodriguez', handle: '@mikerodriguezIT', why: 'Challenges the dominant "AI saves time" narrative with operational reality — gaining traction among IT professionals.' },
        { text: 'The real winner in healthcare AI isn\'t the agent — it\'s the hospital that finally documents its own processes. Half these orgs don\'t even know their current workflows.', author: 'Process Nerd', handle: '@processnerd', why: 'Reframes the value proposition: the benefit is process documentation, not automation itself.' },
      ],
    },
    estimatedCost: 0.12,
    createdAt: '2026-02-16T10:30:00Z',
  },
  {
    id: 'research-002',
    query: 'community hospital competition 2026',
    timeframe: '7d',
    results: {
      narratives: [
        { title: 'Rural hospital closures accelerating', summary: 'Over 30 rural hospitals have closed or converted since 2024. The discourse is increasingly urgent about preserving access in underserved areas.', sentiment: 'negative' },
        { title: 'Independent hospitals partnering with health systems', summary: 'Rather than full mergers, community hospitals are pursuing management agreements and clinical affiliations to stay independent while accessing resources.', sentiment: 'mixed' },
        { title: 'Telehealth as the great equalizer', summary: 'Small hospitals leveraging telehealth to offer specialist access are outperforming on patient satisfaction. Virtual consults bridging the urban-rural gap.', sentiment: 'positive' },
        { title: 'Staffing wars intensifying', summary: 'Travel nurse costs, physician recruitment packages, and retention bonuses are consuming 15-20% more of community hospital budgets YoY.', sentiment: 'negative' },
        { title: 'CMS reimbursement changes shaking up strategy', summary: 'New 2026 OPPS rules favoring outpatient and observation services. Community hospitals with strong outpatient programs positioned to benefit.', sentiment: 'mixed' },
      ],
      posts: [
        { id: 'p7', author: 'Rural Health Report', handle: '@ruralhealthrpt', text: 'BREAKING: 3 more rural hospitals in the Southeast converting to freestanding emergency departments. The full-service community hospital model is becoming unsustainable in markets under 25K population.', likes: 890, retweets: 420, replies: 78, timestamp: '2026-02-15T07:30:00Z' },
        { id: 'p8', author: 'Hospital CFO Network', handle: '@hospitalcfo', text: 'Community hospital margins in 2025: median -1.2%. The hospitals surviving are the ones that picked 2-3 service lines and went ALL IN. Jack-of-all-trades is a death sentence.', likes: 1500, retweets: 560, replies: 134, timestamp: '2026-02-14T15:20:00Z' },
        { id: 'p9', author: 'Dr. James Wright', handle: '@drjameswright', text: 'Unpopular opinion: small hospitals are actually better positioned for value-based care. Smaller panels, closer relationships, lower overhead. The problem isn\'t the model — it\'s the transition financing.', likes: 2100, retweets: 780, replies: 189, timestamp: '2026-02-13T12:10:00Z' },
        { id: 'p10', author: 'Healthcare Dive', handle: '@healthcaredive', text: 'New report: Community hospitals that invested in outpatient surgery centers between 2023-2025 saw 18% revenue growth vs. 3% for those that didn\'t. The outpatient shift is real.', likes: 1100, retweets: 390, replies: 56, timestamp: '2026-02-16T09:45:00Z' },
        { id: 'p11', author: 'Nurse Manager Beth', handle: '@nursemgrbeth', text: 'Lost 4 experienced nurses to travel contracts this month. We can\'t compete with $4K/week. When does this end? Our community patients deserve stable care teams.', likes: 3200, retweets: 890, replies: 267, timestamp: '2026-02-15T18:30:00Z' },
      ],
      sentiment: { positive: 10, mixed: 30, neutral: 20, negative: 40 },
      contrarian: [
        { text: 'Small hospitals are actually better positioned for value-based care. Smaller panels, closer relationships, lower overhead. The problem isn\'t the model — it\'s the transition financing.', author: 'Dr. James Wright', handle: '@drjameswright', why: 'Against the dominant "community hospitals are failing" narrative — argues the model is sound, just underfunded during transition.' },
        { text: 'Everyone\'s mourning rural hospital closures but nobody\'s talking about the freestanding ERs and urgent cares that replaced them. Access didn\'t disappear — it transformed.', author: 'Access Realist', handle: '@accessrealist', why: 'Challenges the closure narrative by pointing to alternative care delivery models.' },
      ],
    },
    estimatedCost: 0.08,
    createdAt: '2026-02-14T14:00:00Z',
  },
]

// ─── YouTube Data ───────────────────────────────────────────────

function generateYouTubeDailyData() {
  const days = []
  const now = new Date()
  let cumSubs = 0
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const trend = 1 + (29 - i) * 0.008
    const base = (isWeekend ? 180 : 280) * trend
    const views = Math.round(base + (Math.random() - 0.4) * 120)
    const watchTime = +(views * (0.003 + Math.random() * 0.004)).toFixed(2)
    const subs = Math.round(3 + Math.random() * 10)
    cumSubs += subs
    days.push({
      date: date.toISOString().slice(0, 10),
      views,
      watchTime,
      subsGained: subs,
      cumSubs,
      ctr: +(4.5 + Math.random() * 3).toFixed(1),
    })
  }
  return days
}

export const mockYouTubeDaily = generateYouTubeDailyData()

export const mockYouTubeVideos = [
  { id: 'v1', title: 'Building an AI Agent from Scratch with OpenClaw', publishedAt: '2026-02-12T10:00:00Z', views: 14800, watchTime: 82.5, avgDuration: '18:24', ctr: 7.2, type: 'long', thumbnail: null },
  { id: 'v2', title: 'Hospital Marketing in 2026: What Actually Works', publishedAt: '2026-02-05T14:00:00Z', views: 8900, watchTime: 48.3, avgDuration: '22:10', ctr: 5.8, type: 'long', thumbnail: null },
  { id: 'v3', title: 'Cursor IDE Tips You Need to Know #shorts', publishedAt: '2026-02-10T08:00:00Z', views: 12500, watchTime: 6.2, avgDuration: '0:42', ctr: 8.1, type: 'short', thumbnail: null },
  { id: 'v4', title: 'How We Won the Hackathon with Contract Connection', publishedAt: '2026-01-28T12:00:00Z', views: 6200, watchTime: 35.8, avgDuration: '15:45', ctr: 6.4, type: 'long', thumbnail: null },
  { id: 'v5', title: 'Running LLMs on Mac Mini M4 Pro — Full Benchmark', publishedAt: '2026-01-20T09:00:00Z', views: 11300, watchTime: 62.1, avgDuration: '24:30', ctr: 6.9, type: 'long', thumbnail: null },
  { id: 'v6', title: '3 AI Tools Every Healthcare Admin Needs #shorts', publishedAt: '2026-02-08T16:00:00Z', views: 9800, watchTime: 4.8, avgDuration: '0:55', ctr: 7.5, type: 'short', thumbnail: null },
  { id: 'v7', title: 'Discord Bot Setup for Dev Teams — Complete Guide', publishedAt: '2026-01-15T11:00:00Z', views: 4100, watchTime: 28.4, avgDuration: '20:12', ctr: 5.2, type: 'long', thumbnail: null },
  { id: 'v8', title: 'CMS Star Ratings Explained for Hospital Leaders', publishedAt: '2026-01-10T15:00:00Z', views: 3400, watchTime: 22.1, avgDuration: '16:50', ctr: 4.8, type: 'long', thumbnail: null },
  { id: 'v9', title: 'Claude vs ChatGPT for Coding — Honest Review', publishedAt: '2026-02-01T10:00:00Z', views: 15200, watchTime: 88.4, avgDuration: '21:15', ctr: 7.8, type: 'long', thumbnail: null },
  { id: 'v10', title: 'One prompt to rule them all #shorts', publishedAt: '2026-02-14T17:00:00Z', views: 5600, watchTime: 2.8, avgDuration: '0:38', ctr: 6.1, type: 'short', thumbnail: null },
]

export const mockYouTubeCompetitors = [
  {
    id: 'comp-1',
    name: 'HealthTech Today',
    subscribers: 12400,
    prevSubscribers: 11800,
    videosPerWeek: 2,
    prevVideosPerWeek: 1.5,
    latestVideo: { title: 'Telehealth Regulations 2026 Update', publishedAt: '2026-02-15T09:00:00Z', views: 3200 },
    dailySubs: Array.from({ length: 30 }, (_, i) => ({ date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10), subs: 11800 + Math.round(i * 20 + Math.random() * 15) })),
    isMock: true,
  },
  {
    id: 'comp-2',
    name: 'AI Builder',
    subscribers: 45200,
    prevSubscribers: 44500,
    videosPerWeek: 3,
    prevVideosPerWeek: 3,
    latestVideo: { title: 'Fine-tuning Models for Production — What Nobody Tells You', publishedAt: '2026-02-16T12:00:00Z', views: 18500 },
    dailySubs: Array.from({ length: 30 }, (_, i) => ({ date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10), subs: 44500 + Math.round(i * 23 + Math.random() * 20) })),
    isMock: true,
  },
  {
    id: 'comp-3',
    name: 'Hospital Admin Pro',
    subscribers: 3100,
    prevSubscribers: 2950,
    videosPerWeek: 1,
    prevVideosPerWeek: 1,
    latestVideo: { title: 'Staff Scheduling Spreadsheet Template — Free Download', publishedAt: '2026-02-11T14:00:00Z', views: 890 },
    dailySubs: Array.from({ length: 30 }, (_, i) => ({ date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10), subs: 2950 + Math.round(i * 5 + Math.random() * 8) })),
    isMock: true,
  },
]

// ─── Image Assets ───────────────────────────────────────────────

export const mockImageAssets = [
  {
    id: 'img-001',
    prompt: 'Clean, modern newsletter header for a medical center with subtle blue gradients and medical iconography',
    style: 'Minimal',
    aspectRatio: '16:9',
    gradient: 'linear-gradient(135deg, #1e40af 0%, #60a5fa 50%, #f0f9ff 100%)',
    createdAt: '2026-02-12T10:30:00Z',
    label: 'Newsletter Header',
  },
  {
    id: 'img-002',
    prompt: 'Logo concept for Contract Connection — a legal-tech hackathon project connecting attorneys with clients, purple and gold color scheme',
    style: 'Logo',
    aspectRatio: '1:1',
    gradient: 'linear-gradient(135deg, #7c3aed 0%, #c084fc 40%, #fbbf24 100%)',
    createdAt: '2026-02-08T15:20:00Z',
    label: 'Contract Connection Logo Concept',
  },
  {
    id: 'img-003',
    prompt: 'Technical illustration showing AI agent architecture — gateway server, model router, tool executor, memory layer, with clean lines and a dark teal palette',
    style: 'Illustration',
    aspectRatio: '16:9',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #134e4a 50%, #2dd4bf 100%)',
    createdAt: '2026-02-05T09:45:00Z',
    label: 'AI Agent Architecture Diagram',
  },
  {
    id: 'img-004',
    prompt: 'Enhanced team photo from hackathon event — warm lighting, professional look, slight background blur, vibrant but natural colors',
    style: 'Photorealistic',
    aspectRatio: '4:3',
    gradient: 'linear-gradient(135deg, #92400e 0%, #f59e0b 40%, #fef3c7 100%)',
    createdAt: '2026-01-30T14:00:00Z',
    label: 'Hackathon Team Photo Enhancement',
  },
]

// ─── Helpers ───────────────────────────────────────────────────

/**
 * Format a token count into a human-readable string.
 * e.g., 1_752_400 → "1.8M", 342_800 → "343K"
 */
export function formatTokenCount(count) {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`
  }
  if (count >= 1_000) {
    return `${Math.round(count / 1_000)}K`
  }
  return count.toString()
}

/**
 * Format a dollar amount with $ prefix.
 */
export function formatSpend(amount) {
  return `$${amount.toFixed(2)}`
}

/**
 * Get the status dot color class for an agent status.
 */
export function getStatusColor(status) {
  switch (status) {
    case 'online':   return 'bg-status-online'
    case 'degraded': return 'bg-status-warning'
    case 'offline':  return 'bg-status-error'
    default:         return 'bg-status-offline'   // unknown
  }
}

/**
 * Get the machine color class (for the dot next to agent names in sidebar).
 */
export function getMachineColor(machine, status) {
  if (status !== 'online' && status !== 'degraded') {
    return getStatusColor(status)
  }
  return machine === 'macbook' ? 'bg-machine-macbook' : 'bg-machine-mini'
}

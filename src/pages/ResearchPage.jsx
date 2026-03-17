import { useState, useMemo, useEffect } from 'react'
import {
  Search, Loader2, ChevronRight, ExternalLink,
  Heart, Repeat2, MessageCircle,
  DollarSign, Clock, RefreshCw, Trash2, AlertTriangle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { useResearch } from '../hooks/useResearch'
import { formatRelativeTime } from '../utils/formatters'

// ─── Sentiment helpers ──────────────────────────────────────────

const SENTIMENT_CONFIG = {
  positive: { label: 'Positive', color: 'bg-green-500/15 text-green-400', dot: 'bg-green-400', ring: '#22c55e', emoji: '😊' },
  negative: { label: 'Negative', color: 'bg-red-500/15 text-red-400', dot: 'bg-red-400', ring: '#ef4444', emoji: '😟' },
  neutral:  { label: 'Neutral',  color: 'bg-gray-500/15 text-gray-400', dot: 'bg-gray-400', ring: '#9ca3af', emoji: '😐' },
  mixed:    { label: 'Mixed',    color: 'bg-yellow-500/15 text-yellow-400', dot: 'bg-yellow-400', ring: '#f59e0b', emoji: '🤔' },
}

function SentimentBadge({ sentiment }) {
  const cfg = SENTIMENT_CONFIG[sentiment] || SENTIMENT_CONFIG.neutral
  return <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-semibold', cfg.color)}>{cfg.label}</span>
}

// ─── Placeholder cycling ────────────────────────────────────────

const PLACEHOLDERS = [
  'hospital marketing trends',
  'AI agents in healthcare',
  'community hospital competition',
  'Claude vs ChatGPT',
  'telehealth adoption 2026',
  'nurse staffing crisis',
]

function useCyclingPlaceholder(interval = 3500) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setIdx((i) => (i + 1) % PLACEHOLDERS.length), interval)
    return () => clearInterval(timer)
  }, [interval])
  return PLACEHOLDERS[idx]
}

// ─── Query Input ────────────────────────────────────────────────

function QueryInput({ onSubmit, loading }) {
  const [query, setQuery] = useState('')
  const [timeframe, setTimeframe] = useState('7d')
  const placeholder = useCyclingPlaceholder()

  function handleSubmit(e) {
    e.preventDefault()
    if (!query.trim() || loading) return
    onSubmit(query.trim(), timeframe)
  }

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Search className="h-4 w-4 text-accent" />
        <h3 className="text-[13px] font-semibold text-gray-200">Research Query</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`What are people saying about ${placeholder}?`}
            className="w-full rounded-lg border border-surface-600 bg-surface-800 px-4 py-3 text-sm text-gray-200 outline-none placeholder:text-gray-600 focus:border-accent/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-gray-600">Timeframe</label>
            <div className="flex items-center gap-0.5 rounded-lg bg-surface-800 p-0.5">
              {[
                { id: '24h', label: 'Last 24h' },
                { id: '7d', label: 'Last 7 days' },
                { id: '30d', label: 'Last 30 days' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeframe(t.id)}
                  className={clsx(
                    'rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors',
                    timeframe === t.id ? 'bg-surface-600 text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-300'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="mt-auto flex items-center gap-2 rounded-lg bg-accent px-5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            Research
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Key Narratives ─────────────────────────────────────────────

function NarrativesCard({ narratives }) {
  if (!narratives?.length) return null
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <h4 className="text-[13px] font-semibold text-gray-200 mb-4">Key Narratives</h4>
      <div className="space-y-3">
        {narratives.map((n, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className={clsx('mt-1.5 h-2 w-2 rounded-full shrink-0', SENTIMENT_CONFIG[n.sentiment]?.dot || 'bg-gray-400')} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[12px] font-semibold text-gray-200">{n.title}</span>
                <SentimentBadge sentiment={n.sentiment} />
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">{n.summary}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Notable Posts ──────────────────────────────────────────────

function PostCard({ post }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = post.text.length > 200
  const display = expanded || !isLong ? post.text : post.text.slice(0, 200) + '...'
  const engagement = post.likes + post.retweets + post.replies

  return (
    <div className="rounded-lg border border-surface-700 bg-surface-800/30 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-7 w-7 rounded-full bg-surface-600 flex items-center justify-center text-[11px] font-bold text-gray-400">
          {post.author[0]}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[12px] font-semibold text-gray-200">{post.author}</span>
          <span className="ml-1.5 text-[11px] text-gray-600">{post.handle}</span>
        </div>
        <span className="text-[10px] text-gray-600">{formatRelativeTime(post.timestamp)}</span>
      </div>

      <p className="text-[12px] text-gray-300 leading-relaxed mb-3">
        {display}
        {isLong && !expanded && (
          <button onClick={() => setExpanded(true)} className="ml-1 text-accent text-[11px] hover:text-accent/80">Show more</button>
        )}
      </p>

      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1 text-[10px] text-gray-500" title="Likes">
          <Heart className="h-3 w-3" />
          {post.likes >= 1000 ? `${(post.likes / 1000).toFixed(1)}K` : post.likes}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-gray-500" title="Retweets">
          <Repeat2 className="h-3 w-3" />
          {post.retweets >= 1000 ? `${(post.retweets / 1000).toFixed(1)}K` : post.retweets}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-gray-500" title="Replies">
          <MessageCircle className="h-3 w-3" />
          {post.replies}
        </span>
        <span className="ml-auto text-[9px] text-gray-600">Engagement: {engagement >= 1000 ? `${(engagement / 1000).toFixed(1)}K` : engagement}</span>
      </div>
    </div>
  )
}

function NotablePostsCard({ posts }) {
  if (!posts?.length) return null
  const sorted = [...posts].sort((a, b) => (b.likes + b.retweets + b.replies) - (a.likes + a.retweets + a.replies))
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <h4 className="text-[13px] font-semibold text-gray-200 mb-4">
        Notable Posts
        <span className="ml-2 text-[11px] font-normal text-gray-600">({posts.length})</span>
      </h4>
      <div className="space-y-3">
        {sorted.map((post) => <PostCard key={post.id} post={post} />)}
      </div>
    </div>
  )
}

// ─── Sentiment Summary ──────────────────────────────────────────

function SentimentDonut({ sentiment, size = 100 }) {
  const data = [
    { key: 'positive', value: sentiment.positive, color: '#22c55e' },
    { key: 'mixed', value: sentiment.mixed, color: '#f59e0b' },
    { key: 'neutral', value: sentiment.neutral, color: '#9ca3af' },
    { key: 'negative', value: sentiment.negative, color: '#ef4444' },
  ].filter((d) => d.value > 0)

  const cx = size / 2
  const cy = size / 2
  const r = (size - 10) / 2
  const circumference = 2 * Math.PI * r
  let cumulative = 0

  return (
    <svg width={size} height={size} className="-rotate-90">
      {data.map((d) => {
        const dashLength = (d.value / 100) * circumference
        const dashOffset = -cumulative * circumference / 100
        cumulative += d.value
        return (
          <circle
            key={d.key}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={8}
            strokeDasharray={`${dashLength} ${circumference - dashLength}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="butt"
          />
        )
      })}
    </svg>
  )
}

function SentimentCard({ sentiment }) {
  if (!sentiment) return null
  const entries = [
    { key: 'positive', pct: sentiment.positive },
    { key: 'mixed', pct: sentiment.mixed },
    { key: 'neutral', pct: sentiment.neutral },
    { key: 'negative', pct: sentiment.negative },
  ]
  const dominant = entries.reduce((a, b) => (b.pct > a.pct ? b : a))
  const cfg = SENTIMENT_CONFIG[dominant.key]

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <h4 className="text-[13px] font-semibold text-gray-200 mb-4">Sentiment Summary</h4>

      <div className="flex items-start gap-6">
        <div className="relative shrink-0">
          <SentimentDonut sentiment={sentiment} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">{cfg.emoji}</span>
          </div>
        </div>

        <div className="space-y-2 flex-1">
          {entries.map((e) => {
            const c = SENTIMENT_CONFIG[e.key]
            return (
              <div key={e.key} className="flex items-center gap-2">
                <span className={clsx('h-2 w-2 rounded-full shrink-0', c.dot)} />
                <span className="text-[11px] text-gray-400 w-16">{c.label}</span>
                <div className="flex-1 h-1.5 rounded-full bg-surface-700">
                  <div className="h-full rounded-full transition-all" style={{ width: `${e.pct}%`, backgroundColor: c.ring }} />
                </div>
                <span className="text-[11px] font-medium text-gray-300 w-8 text-right">{e.pct}%</span>
              </div>
            )
          })}
        </div>
      </div>

      <p className="mt-4 text-[11px] text-gray-400 leading-relaxed">
        The conversation is mostly <span className="font-medium text-gray-200">{cfg.label.toLowerCase()}</span>, with{' '}
        <span className="font-medium text-gray-200">{dominant.pct}%</span> of posts reflecting {dominant.key === 'positive' ? 'optimism and excitement' : dominant.key === 'negative' ? 'concern and criticism' : dominant.key === 'mixed' ? 'nuanced, both-sides perspectives' : 'factual or informational takes'}.
      </p>
    </div>
  )
}

// ─── Contrarian Takes ───────────────────────────────────────────

function ContrarianCard({ contrarian }) {
  if (!contrarian?.length) return null
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-4 w-4 text-yellow-400" />
        <h4 className="text-[13px] font-semibold text-gray-200">Contrarian Takes</h4>
      </div>
      <div className="space-y-3">
        {contrarian.map((c, i) => (
          <div key={i} className="rounded-lg border border-yellow-500/10 bg-yellow-500/5 p-4">
            <p className="text-[12px] text-gray-300 leading-relaxed mb-2">&ldquo;{c.text}&rdquo;</p>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-medium text-gray-400">{c.author}</span>
              <span className="text-[11px] text-gray-600">{c.handle}</span>
            </div>
            <p className="text-[10px] text-yellow-400/80 italic">Why it matters: {c.why}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── API Cost Tracker ───────────────────────────────────────────

function CostTracker({ entry, todayCost }) {
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="h-3.5 w-3.5 text-gray-500" />
        <h4 className="text-[12px] font-semibold text-gray-200">API Cost</h4>
      </div>
      <div className="space-y-2 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">This query</span>
          <span className="font-medium text-gray-300">${entry.estimatedCost.toFixed(2)}</span>
        </div>
        <div className="space-y-1 text-[10px]">
          <div className="flex items-center justify-between text-gray-600">
            <span>Tier 1 (free): FxTwitter</span>
            <span className="text-status-online">3 calls</span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>Tier 2: TwitterAPI.io</span>
            <span className="text-gray-400">{Math.floor(entry.estimatedCost * 40 + 3)} calls (~${(entry.estimatedCost * 0.85).toFixed(2)})</span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>Tier 3: Official X API</span>
            <span className="text-gray-500">0 calls</span>
          </div>
        </div>
        <div className="border-t border-surface-700 pt-2 flex items-center justify-between">
          <span className="text-gray-500">Today's total</span>
          <span className="font-medium text-gray-300">${todayCost.toFixed(2)}</span>
        </div>
        <Link to="/costs" className="inline-flex items-center gap-1 text-[10px] text-accent hover:text-accent/80 mt-1">
          View full cost tracking <ExternalLink className="h-2.5 w-2.5" />
        </Link>
      </div>
    </div>
  )
}

// ─── Research Results ───────────────────────────────────────────

function ResearchResults({ entry, todayCost }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <h3 className="text-[14px] font-semibold text-gray-200">
          Results for &ldquo;{entry.query}&rdquo;
        </h3>
        <span className="text-[11px] text-gray-600">
          {entry.timeframe === '24h' ? 'Last 24 hours' : entry.timeframe === '7d' ? 'Last 7 days' : 'Last 30 days'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <NarrativesCard narratives={entry.results.narratives} />
          <NotablePostsCard posts={entry.results.posts} />
          <ContrarianCard contrarian={entry.results.contrarian} />
        </div>
        <div className="space-y-5">
          <SentimentCard sentiment={entry.results.sentiment} />
          <CostTracker entry={entry} todayCost={todayCost} />
        </div>
      </div>
    </div>
  )
}

// ─── Research History ───────────────────────────────────────────

function HistorySection({ history, onView, onRerun, onDelete, activeId }) {
  const [open, setOpen] = useState(true)
  const [historySearch, setHistorySearch] = useState('')
  if (history.length === 0) return null

  const filteredHistory = historySearch.trim()
    ? history.filter((h) => h.query.toLowerCase().includes(historySearch.toLowerCase()))
    : history

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-5 py-3.5 text-left"
      >
        <ChevronRight className={clsx('h-4 w-4 text-gray-600 transition-transform duration-200', open && 'rotate-90')} />
        <Clock className="h-4 w-4 text-gray-500" />
        <span className="text-[13px] font-semibold text-gray-200 flex-1">Research History</span>
        <span className="text-[11px] text-gray-600">{history.length} quer{history.length !== 1 ? 'ies' : 'y'}</span>
      </button>

      {open && (
        <div className="border-t border-surface-700">
          <div className="px-5 py-2 border-b border-surface-700/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-600" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Filter history..."
                className="w-full rounded-lg border border-surface-600 bg-surface-800 py-1.5 pl-8 pr-3 text-[11px] text-gray-200 outline-none placeholder:text-gray-600 focus:border-accent/50"
              />
            </div>
          </div>
          <div className="divide-y divide-surface-700/50">
          {filteredHistory.map((entry) => {
            const dominant = Object.entries(entry.results.sentiment).reduce((a, b) => (b[1] > a[1] ? b : a))
            const cfg = SENTIMENT_CONFIG[dominant[0]]
            return (
              <div key={entry.id} className={clsx('flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-800/30', activeId === entry.id && 'bg-surface-800/20')}>
                <span className={clsx('h-2 w-2 rounded-full shrink-0', cfg.dot)} title={cfg.label} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-gray-200 truncate">{entry.query}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-600">{formatRelativeTime(entry.createdAt)}</span>
                    <span className="text-[10px] text-gray-600">·</span>
                    <span className="text-[10px] text-gray-600">{(entry.results.posts?.length || 0)} posts</span>
                    <span className="text-[10px] text-gray-600">·</span>
                    <span className="text-[10px] text-gray-500">{cfg.emoji} {dominant[0]} ({dominant[1]}%)</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onView(entry)}
                    className={clsx('rounded-md px-2 py-1 text-[10px] font-medium transition-colors',
                      activeId === entry.id ? 'bg-accent/10 text-accent' : 'text-gray-500 hover:text-gray-300 hover:bg-surface-700'
                    )}
                  >
                    View
                  </button>
                  <button
                    onClick={() => onRerun(entry.query, entry.timeframe)}
                    className="rounded-md p-1 text-gray-600 transition-colors hover:text-gray-400 hover:bg-surface-700"
                    title="Re-run query"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                  {!entry.isMock && (
                    <button
                      onClick={() => onDelete(entry.id)}
                      className="rounded-md p-1 text-gray-600 transition-colors hover:text-status-offline hover:bg-surface-700"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────

export default function ResearchPage() {
  const { history, loading, activeResult, todayCost, runResearch, viewHistoryEntry, deleteEntry } = useResearch()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold tracking-tight text-gray-100">Research</h1>
        <p className="mt-0.5 text-[12px] text-gray-500">X/Twitter discourse analysis — discover what people are saying about any topic</p>
      </div>

      <QueryInput onSubmit={runResearch} loading={loading} />

      {loading && (
        <div className="flex items-center gap-3 rounded-xl border border-surface-700 bg-surface-900 px-5 py-6">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <div>
            <p className="text-sm text-gray-300">Researching...</p>
            <p className="text-[11px] text-gray-600">Querying X/Twitter via tiered API, analyzing sentiment, extracting narratives</p>
          </div>
        </div>
      )}

      {!loading && activeResult && (
        <ResearchResults entry={activeResult} todayCost={todayCost} />
      )}

      <HistorySection
        history={history}
        onView={viewHistoryEntry}
        onRerun={runResearch}
        onDelete={deleteEntry}
        activeId={activeResult?.id}
      />
    </div>
  )
}

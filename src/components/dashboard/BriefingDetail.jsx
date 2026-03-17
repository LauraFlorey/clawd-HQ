import { useState, useMemo } from 'react'
import {
  X, ChevronRight,
  TrendingUp, TrendingDown, Minus,
  Check, Pencil, XCircle,
  Play, Users, Briefcase, BarChart3, Radio, Cpu,
  Sparkles, Bot, Calendar,
} from 'lucide-react'
import clsx from 'clsx'
import { useBriefing } from '../../hooks/useBriefing'
import { formatCurrency } from '../../utils/formatters'

// ─── Outlook Ring ───────────────────────────────────────────────

function OutlookRing({ label, score, prev, size = 56 }) {
  const r = (size - 6) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference
  const color = score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  const diff = prev != null ? score - prev : null

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="absolute -rotate-90" width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" className="text-surface-700" strokeWidth={3} fill="none" />
          <circle
            cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={3} fill="none"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>
        <span className="text-sm font-bold" style={{ color }}>{score}</span>
      </div>
      <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
      {diff != null && (
        <div className="flex items-center gap-0.5">
          {diff > 0 ? <TrendingUp className="h-3 w-3 text-green-400" />
            : diff < 0 ? <TrendingDown className="h-3 w-3 text-red-400" />
            : <Minus className="h-3 w-3 text-gray-500" />}
          <span className={clsx('text-[10px] font-medium',
            diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-500'
          )}>
            {diff > 0 ? '+' : ''}{diff} vs yesterday
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Mini Meter ─────────────────────────────────────────────────

function MiniMeter({ label, value }) {
  const color = value >= 70 ? 'bg-green-400' : value >= 40 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] text-gray-600 uppercase">{label}</span>
        <span className="text-[10px] font-medium text-gray-400">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-700">
        <div className={clsx('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

// ─── Vote Badge ─────────────────────────────────────────────────

function VoteBadge({ vote }) {
  if (vote === 'support') return <span className="flex items-center gap-0.5 text-[10px] text-green-400"><Check className="h-3 w-3" />Support</span>
  if (vote === 'revise') return <span className="flex items-center gap-0.5 text-[10px] text-yellow-400"><Pencil className="h-3 w-3" />Revise</span>
  return <span className="flex items-center gap-0.5 text-[10px] text-red-400"><XCircle className="h-3 w-3" />Reject</span>
}

// ─── Collapsible Section ────────────────────────────────────────

function Collapsible({ title, defaultOpen = false, children, badge }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-5 py-3.5 text-left">
        <ChevronRight className={clsx('h-4 w-4 text-gray-600 transition-transform duration-200', open && 'rotate-90')} />
        <span className="text-[13px] font-semibold text-gray-200 flex-1">{title}</span>
        {badge}
      </button>
      {open && <div className="border-t border-surface-700 px-5 py-4">{children}</div>}
    </div>
  )
}

// ─── Recommendation Card ────────────────────────────────────────

function RecommendationCard({ rec, onFeedback }) {
  const [councilOpen, setCouncilOpen] = useState(false)

  const scoreColor = rec.priorityScore >= 70 ? 'bg-green-500/20 text-green-400 border-green-500/30'
    : rec.priorityScore >= 50 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    : 'bg-red-500/20 text-red-400 border-red-500/30'

  const fbAction = rec.feedback?.action

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-800/30 p-4 space-y-3">
      {/* Title row */}
      <div className="flex items-start gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[11px] font-bold text-accent">
          {rec.rank}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-[13px] font-semibold text-gray-200">{rec.title}</h4>
            <span className={clsx('rounded-full border px-2 py-0.5 text-[10px] font-bold', scoreColor)}>
              {rec.priorityScore}
            </span>
            {fbAction && (
              <span className={clsx('rounded-full px-2 py-0.5 text-[9px] font-medium',
                fbAction === 'accept' ? 'bg-green-500/10 text-green-400' :
                fbAction === 'dismiss' ? 'bg-red-500/10 text-red-400' :
                'bg-yellow-500/10 text-yellow-400'
              )}>
                {fbAction === 'accept' ? 'Accepted' : fbAction === 'dismiss' ? 'Dismissed' : 'Snoozed'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Meters */}
      <div className="flex items-center gap-4">
        <MiniMeter label="Impact" value={rec.impact} />
        <MiniMeter label="Confidence" value={rec.confidence} />
        <MiniMeter label="Effort" value={rec.effort} />
      </div>

      {/* Description */}
      <p className="text-xs text-gray-400 leading-relaxed">{rec.description}</p>

      {/* Evidence */}
      {rec.evidence?.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600">Evidence</p>
          <ul className="space-y-1">
            {rec.evidence.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px]">
                <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-accent/40" />
                <span className="text-gray-400">{e.text}</span>
                <span className="shrink-0 rounded-full bg-surface-700 px-1.5 py-0.5 text-[9px] text-gray-500">{e.source}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Council Notes */}
      {rec.council && (
        <div>
          <button onClick={() => setCouncilOpen(!councilOpen)} className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 hover:text-gray-300 transition-colors">
            <ChevronRight className={clsx('h-3 w-3 transition-transform duration-200', councilOpen && 'rotate-90')} />
            <Bot className="h-3 w-3" />
            Council Notes
          </button>
          {councilOpen && (
            <div className="mt-2 ml-4 space-y-2 rounded-lg border border-surface-700 bg-surface-900 p-3">
              {rec.council.votes.map((v, i) => (
                <div key={i} className="flex items-start gap-2">
                  <VoteBadge vote={v.vote} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-medium text-gray-300">{v.reviewer}</span>
                    <p className="text-[10px] text-gray-500">{v.comment}</p>
                  </div>
                </div>
              ))}
              <div className="border-t border-surface-700 pt-2 mt-2">
                <p className="text-[10px] text-gray-400"><span className="font-medium text-gray-300">Consensus:</span> {rec.council.consensus}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => onFeedback(rec.id, 'accept')}
          className={clsx('rounded-md border px-2.5 py-1 text-[10px] font-medium transition-colors',
            fbAction === 'accept' ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-surface-600 text-gray-500 hover:text-green-400 hover:border-green-500/30'
          )}
        >
          Accept
        </button>
        <button
          onClick={() => onFeedback(rec.id, 'dismiss')}
          className={clsx('rounded-md border px-2.5 py-1 text-[10px] font-medium transition-colors',
            fbAction === 'dismiss' ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-surface-600 text-gray-500 hover:text-red-400 hover:border-red-500/30'
          )}
        >
          Dismiss
        </button>
        <button
          onClick={() => onFeedback(rec.id, 'snooze')}
          className={clsx('rounded-md border px-2.5 py-1 text-[10px] font-medium transition-colors',
            fbAction === 'snooze' ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400' : 'border-surface-600 text-gray-500 hover:text-yellow-400 hover:border-yellow-500/30'
          )}
        >
          Snooze
        </button>
      </div>
    </div>
  )
}

// ─── Signal Source Icons ────────────────────────────────────────

const SOURCE_ICONS = {
  'YouTube': Play,
  'CRM': Users,
  'Project Backlog': Briefcase,
  'Newsletter': BarChart3,
  'Competitive Intel': Radio,
  'Cron Health': Cpu,
  'Gateway': Cpu,
  'Cost Intelligence': BarChart3,
}

function DirectionIcon({ direction }) {
  if (direction === 'up') return <TrendingUp className="h-3 w-3 text-green-400" />
  if (direction === 'down') return <TrendingDown className="h-3 w-3 text-red-400" />
  return <Minus className="h-3 w-3 text-gray-500" />
}

// ─── Council Trace ──────────────────────────────────────────────

function CouncilTraceSection({ trace }) {
  if (!trace) return null

  return (
    <Collapsible
      title="How This Briefing Was Generated"
      badge={<span className="text-[10px] text-gray-600">{formatCurrency(trace.totalCost)} · {(trace.totalTokens / 1000).toFixed(1)}K tokens</span>}
    >
      <div className="space-y-4">
        {/* Phase 1 */}
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">1</div>
          <div className="flex-1">
            <p className="text-[12px] font-medium text-gray-200">Draft by {trace.phases[0].actor}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{trace.phases[0].summary}</p>
            <p className="text-[10px] text-gray-600 mt-1">{trace.phases[0].model} · {(trace.phases[0].tokens / 1000).toFixed(1)}K tokens · {formatCurrency(trace.phases[0].cost)}</p>
          </div>
        </div>

        {/* Phase 2 */}
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">2</div>
          <div className="flex-1">
            <p className="text-[12px] font-medium text-gray-200">Reviews by 4 Personas</p>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {trace.phases[1].actors.map((actor) => (
                <div key={actor.name} className="rounded-lg border border-surface-700 bg-surface-800/30 p-2.5">
                  <p className="text-[11px] font-medium text-gray-300">{actor.name}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{actor.finding}</p>
                  <p className="text-[9px] text-gray-600 mt-1">{actor.model} · {(actor.tokens / 1000).toFixed(1)}K tokens</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phase 3 */}
        <div className="flex gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">3</div>
          <div className="flex-1">
            <p className="text-[12px] font-medium text-gray-200">Consensus by {trace.phases[2].actor}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{trace.phases[2].summary}</p>
            {trace.phases[2].disagreements?.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-medium text-gray-500">Disagreements resolved:</p>
                <ul className="mt-1 space-y-0.5">
                  {trace.phases[2].disagreements.map((d, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[10px] text-gray-500">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-yellow-400/40" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-[10px] text-gray-600 mt-1">{trace.phases[2].model} · {(trace.phases[2].tokens / 1000).toFixed(1)}K tokens · {formatCurrency(trace.phases[2].cost)}</p>
          </div>
        </div>
      </div>
    </Collapsible>
  )
}

// ─── Signals Section ────────────────────────────────────────────

function SignalsSection({ signals }) {
  if (!signals?.length) return null

  const grouped = useMemo(() => {
    const groups = {}
    for (const s of signals) {
      if (!groups[s.source]) groups[s.source] = []
      groups[s.source].push(s)
    }
    return groups
  }, [signals])

  return (
    <Collapsible
      title="Signal Sources"
      badge={<span className="text-[10px] text-gray-600">{signals.length} signals</span>}
    >
      <div className="space-y-4">
        {Object.entries(grouped).map(([source, items]) => {
          const Icon = SOURCE_ICONS[source] || Radio
          return (
            <div key={source}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-[11px] font-medium text-gray-300">{source}</span>
                <span className="text-[10px] text-gray-600">({items.length})</span>
              </div>
              <div className="ml-5 space-y-1.5">
                {items.map((sig) => (
                  <div key={sig.id} className="flex items-center gap-3">
                    <span className="flex-1 text-[11px] text-gray-400">{sig.name}</span>
                    <span className="text-[11px] font-medium text-gray-300">{sig.value}</span>
                    <DirectionIcon direction={sig.direction} />
                    <div className="w-10">
                      <div className="h-1 rounded-full bg-surface-700">
                        <div
                          className={clsx('h-full rounded-full', sig.confidence >= 80 ? 'bg-green-400' : sig.confidence >= 60 ? 'bg-yellow-400' : 'bg-red-400')}
                          style={{ width: `${sig.confidence}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[9px] text-gray-600 w-6 text-right">{sig.confidence}%</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Collapsible>
  )
}

// ─── Briefing History ───────────────────────────────────────────

function HistorySection({ history, currentId }) {
  if (!history?.length) return null

  return (
    <Collapsible title="Briefing History" badge={<span className="text-[10px] text-gray-600">{history.length} briefings</span>}>
      <div className="space-y-1.5">
        {history.map((h) => {
          const isCurrent = h.id === currentId
          const weeklyColor = h.outlook.weekly >= 70 ? 'text-green-400' : h.outlook.weekly >= 50 ? 'text-yellow-400' : 'text-red-400'
          const monthlyColor = h.outlook.monthly >= 70 ? 'text-green-400' : h.outlook.monthly >= 50 ? 'text-yellow-400' : 'text-red-400'
          return (
            <div key={h.id} className={clsx('flex items-center gap-3 rounded-lg px-3 py-2.5', isCurrent && 'bg-accent/5 border border-accent/20')}>
              <Calendar className="h-3.5 w-3.5 text-gray-600 shrink-0" />
              <span className="text-[11px] text-gray-400 w-20 shrink-0">{h.date}</span>
              <div className="flex items-center gap-2 shrink-0">
                <span className={clsx('text-[10px] font-bold', weeklyColor)}>{h.outlook.weekly}</span>
                <span className="text-[9px] text-gray-700">/</span>
                <span className={clsx('text-[10px] font-bold', monthlyColor)}>{h.outlook.monthly}</span>
              </div>
              <span className="flex-1 text-[11px] text-gray-500 truncate">{h.topRec}</span>
              {isCurrent && <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] text-accent shrink-0">Current</span>}
            </div>
          )
        })}
      </div>
    </Collapsible>
  )
}

// ─── Main Modal ─────────────────────────────────────────────────

export default function BriefingDetail({ onClose }) {
  const { latestBriefing, history, setRecFeedback } = useBriefing()

  if (!latestBriefing) return null

  const { outlook, previousOutlook, recommendations, signals, councilTrace, generatedAt, signalCount, sourceCount } = latestBriefing
  const briefingDate = new Date(generatedAt)
  const dateStr = briefingDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const timeStr = briefingDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const blended = outlook?.blended ?? Math.round((outlook?.weekly + outlook?.monthly) / 2)

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl mx-4 my-8 space-y-4">

        {/* ── HEADER ──────────────────────────────────── */}
        <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-accent" />
                <h2 className="text-lg font-bold text-gray-100">Daily Briefing</h2>
              </div>
              <p className="text-[12px] text-gray-500">{dateStr} at {timeStr}</p>
              <p className="text-[11px] text-gray-600 mt-0.5">Based on {signalCount || signals?.length || 0} signals from {sourceCount || '—'} sources</p>
            </div>
            <button onClick={onClose} className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-surface-700 hover:text-gray-300">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Outlook scores */}
          {outlook && (
            <div className="flex items-start gap-8">
              <OutlookRing label="Weekly" score={outlook.weekly} prev={previousOutlook?.weekly} />
              <OutlookRing label="Monthly" score={outlook.monthly} prev={previousOutlook?.monthly} />
              <OutlookRing label="Blended" score={blended} prev={previousOutlook ? Math.round((previousOutlook.weekly + previousOutlook.monthly) / 2) : null} />
            </div>
          )}
        </div>

        {/* ── RECOMMENDATIONS ────────────────────────── */}
        <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
          <h3 className="text-[14px] font-semibold text-gray-200 mb-4">
            Recommendations
            <span className="ml-2 text-[11px] font-normal text-gray-600">({recommendations?.length || 0})</span>
          </h3>
          <div className="space-y-3">
            {(recommendations || []).map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} onFeedback={setRecFeedback} />
            ))}
          </div>
        </div>

        {/* ── COUNCIL TRACE ──────────────────────────── */}
        <CouncilTraceSection trace={councilTrace} />

        {/* ── SIGNALS ────────────────────────────────── */}
        <SignalsSection signals={signals} />

        {/* ── HISTORY ────────────────────────────────── */}
        <HistorySection history={history} currentId={latestBriefing.id} />
      </div>
    </div>
  )
}

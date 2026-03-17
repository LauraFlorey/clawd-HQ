import {
  Clock, RefreshCw, Settings,
  TrendingUp, TrendingDown,
  Play, Users, Briefcase, BarChart3, Radio, Cpu,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { useBriefing } from '../../hooks/useBriefing'
import { formatRelativeTime } from '../../utils/formatters'
import { Spinner } from '../LoadingState'

// ─── Outlook Ring (small version for card) ──────────────────────

function OutlookRing({ label, score, prev, size = 44 }) {
  const r = (size - 6) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference
  const color = score >= 70 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444'
  const diff = prev != null ? score - prev : null

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="absolute -rotate-90" width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" className="text-surface-700" strokeWidth={3} fill="none" />
          <circle
            cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={3} fill="none"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
          />
        </svg>
        <span className="text-[11px] font-bold" style={{ color }}>{score}</span>
      </div>
      <div className="text-center">
        <span className="text-[9px] text-gray-600 uppercase tracking-wider">{label}</span>
        {diff != null && diff !== 0 && (
          <div className="flex items-center justify-center gap-0.5">
            {diff > 0
              ? <TrendingUp className="h-2.5 w-2.5 text-green-400" />
              : <TrendingDown className="h-2.5 w-2.5 text-red-400" />}
            <span className={clsx('text-[9px] font-medium', diff > 0 ? 'text-green-400' : 'text-red-400')}>
              {diff > 0 ? '+' : ''}{diff}
            </span>
          </div>
        )}
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

function SignalBadges({ signals }) {
  const sources = [...new Set((signals || []).map((s) => s.source))]
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {sources.map((src) => {
        const Icon = SOURCE_ICONS[src] || Radio
        return (
          <span key={src} className="flex items-center gap-1 rounded-full bg-surface-700/60 px-2 py-0.5" title={src}>
            <Icon className="h-2.5 w-2.5 text-gray-500" />
            <span className="text-[9px] text-gray-500">{src}</span>
          </span>
        )
      })}
    </div>
  )
}

// ─── Main Card ─────────────────────────────────────────────────

export default function BriefingCard({ onViewFull }) {
  const { latestBriefing, loading, generating, generateNow } = useBriefing()

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-surface-700 bg-surface-900">
        <Spinner />
      </div>
    )
  }

  if (!latestBriefing) {
    return (
      <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-gray-500" />
          <h3 className="text-[13px] font-semibold text-gray-200">Daily Briefing</h3>
        </div>
        <div className="py-6 text-center">
          <p className="text-sm text-gray-500">No briefing yet.</p>
          <Link
            to="/settings"
            className="mt-1 inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover"
          >
            <Settings className="h-3 w-3" />
            Configure schedule in Settings
          </Link>
        </div>
      </div>
    )
  }

  const { outlook, previousOutlook, recommendations, signals, generatedAt, generatedBy, sections } = latestBriefing
  const briefingDate = new Date(generatedAt)
  const dateStr = briefingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr = briefingDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  const topRecs = (recommendations || []).slice(0, 3)
  const hasOutlook = outlook && typeof outlook.weekly === 'number'

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-700 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent" />
          <h3 className="text-[13px] font-semibold text-gray-200">Daily Briefing</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-600">{dateStr} · {timeStr}</span>
          <button
            onClick={generateNow}
            disabled={generating}
            className={clsx(
              'rounded-md p-1.5 transition-colors',
              generating ? 'text-gray-700 cursor-not-allowed' : 'text-gray-500 hover:bg-surface-700 hover:text-gray-300'
            )}
            title="Refresh briefing"
          >
            {generating ? <Spinner className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Business Outlook */}
        {hasOutlook && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">Business Outlook</p>
            <div className="flex items-start gap-5">
              <OutlookRing label="Weekly" score={outlook.weekly} prev={previousOutlook?.weekly} />
              <OutlookRing label="Monthly" score={outlook.monthly} prev={previousOutlook?.monthly} />
            </div>
          </div>
        )}

        {/* Legacy sections (systems, usage) — compact view */}
        {sections?.systems && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-600">{sections.systems.title}</p>
            <div className="space-y-1">
              {sections.systems.items.slice(0, 2).map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={clsx('h-1.5 w-1.5 rounded-full', item.status === 'ok' ? 'bg-status-online' : item.status === 'warning' ? 'bg-status-warning' : 'bg-status-offline')} />
                  <span className="text-[11px] text-gray-400 truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Recommendations */}
        {topRecs.length > 0 && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-600">Top Recommendations</p>
            <ol className="space-y-1.5">
              {topRecs.map((rec, i) => {
                const scoreColor = rec.priorityScore >= 70 ? 'text-green-400' : rec.priorityScore >= 50 ? 'text-yellow-400' : 'text-red-400'
                return (
                  <li key={rec.id} className="flex items-start gap-2">
                    <span className="text-[11px] font-bold text-gray-600 shrink-0 w-4 text-right">{i + 1}.</span>
                    <span className="text-[12px] text-gray-300 truncate flex-1">{rec.title}</span>
                    <span className={clsx('text-[10px] font-bold shrink-0', scoreColor)}>{rec.priorityScore}</span>
                  </li>
                )
              })}
            </ol>
          </div>
        )}

        {/* Signal Sources */}
        {signals?.length > 0 && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
              Signals ({signals.length})
            </p>
            <SignalBadges signals={signals} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-surface-700 px-5 py-2.5 flex items-center justify-between">
        <span className="text-[10px] text-gray-700">
          {generatedBy} · {formatRelativeTime(generatedAt)}
        </span>
        <div className="flex items-center gap-3">
          <Link to="/settings" className="text-[10px] text-gray-600 transition-colors hover:text-gray-400">
            Configure
          </Link>
          <button
            onClick={onViewFull}
            className="flex items-center gap-1 text-[10px] font-medium text-accent transition-colors hover:text-accent/80"
          >
            View Full Briefing <ArrowRight className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState, useMemo } from 'react'
import {
  Play, MonitorPlay, Users, TrendingUp, TrendingDown, Eye, Clock,
  BarChart3, Plus, X, ChevronRight, Trash2,
} from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  ScatterChart, Scatter, ZAxis,
} from 'recharts'
import clsx from 'clsx'
import { useYouTube } from '../hooks/useYouTube'
import { formatRelativeTime } from '../utils/formatters'

// ═══════════════════════════════════════════════════════════════
//  Shared
// ═══════════════════════════════════════════════════════════════

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-xs shadow-lg shadow-black/30">
      <p className="text-gray-500 mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || p.stroke }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="font-medium text-gray-200">{formatter ? formatter(p.value) : p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, trend, suffix }) {
  const isUp = trend > 0
  const TrendIcon = isUp ? TrendingUp : TrendingDown
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-3.5 w-3.5 text-gray-500" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-600">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-xl font-bold text-gray-100">{value}</span>
        {suffix && <span className="text-xs text-gray-500 mb-0.5">{suffix}</span>}
      </div>
      {trend !== undefined && trend !== 0 && (
        <div className={clsx('mt-1.5 flex items-center gap-1 text-[11px] font-medium', isUp ? 'text-green-400' : 'text-red-400')}>
          <TrendIcon className="h-3 w-3" />
          {isUp ? '+' : ''}{typeof trend === 'number' ? trend.toFixed(1) : trend}% vs previous period
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  TAB 1 — My Channel
// ═══════════════════════════════════════════════════════════════

function DailyViewsChart({ data }) {
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">
      <h4 className="text-[12px] font-semibold text-gray-200 mb-3">Daily Views</h4>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(d) => d.slice(5)} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} width={40} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="views" stroke="#6366f1" fill="url(#viewsGrad)" strokeWidth={2} name="Views" />
          <Line type="monotone" dataKey="ma7d" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" dot={false} name="7-day MA" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function TopVideosChart({ videos }) {
  const data = useMemo(() =>
    [...videos].sort((a, b) => b.views - a.views).slice(0, 10).map((v) => ({
      title: v.title.length > 30 ? v.title.slice(0, 30) + '...' : v.title,
      views: v.views,
      fill: v.type === 'short' ? '#14b8a6' : '#6366f1',
    })).reverse(),
    [videos]
  )
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">
      <h4 className="text-[12px] font-semibold text-gray-200 mb-1">Top Videos</h4>
      <div className="flex items-center gap-3 mb-3 text-[10px] text-gray-600">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#6366f1]" />Long-form</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#14b8a6]" />Shorts</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 9, fill: '#6b7280' }} />
          <YAxis dataKey="title" type="category" tick={{ fontSize: 9, fill: '#9ca3af' }} width={130} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="views" name="Views" radius={[0, 4, 4, 0]}>
            {data.map((d, i) => (
              <rect key={i} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function WatchTimeChart({ data }) {
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">
      <h4 className="text-[12px] font-semibold text-gray-200 mb-3">Watch Time Trend</h4>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(d) => d.slice(5)} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} width={35} unit="h" />
          <Tooltip content={<ChartTooltip formatter={(v) => `${v.toFixed(1)}h`} />} />
          <Line type="monotone" dataKey="watchTime" stroke="#22c55e" strokeWidth={2} dot={false} name="Watch Time" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function SubGrowthChart({ data }) {
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">
      <h4 className="text-[12px] font-semibold text-gray-200 mb-3">Subscriber Growth</h4>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="subsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(d) => d.slice(5)} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} width={40} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="cumSubs" stroke="#f59e0b" fill="url(#subsGrad)" strokeWidth={2} name="Net Gained" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function VideoTable({ videos }) {
  const [sort, setSort] = useState('views')
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  const sorted = useMemo(() => {
    let list = filter === 'all' ? videos : videos.filter((v) => filter === 'short' ? v.type === 'short' : v.type === 'long')
    return [...list].sort((a, b) => {
      if (sort === 'views') return b.views - a.views
      if (sort === 'watchTime') return b.watchTime - a.watchTime
      if (sort === 'ctr') return b.ctr - a.ctr
      return new Date(b.publishedAt) - new Date(a.publishedAt)
    })
  }, [videos, sort, filter])

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900">
      <div className="flex items-center justify-between border-b border-surface-700 px-5 py-3.5">
        <h4 className="text-[13px] font-semibold text-gray-200">All Videos</h4>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg bg-surface-800 p-0.5">
            {['all', 'long', 'short'].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={clsx('rounded-md px-2 py-1 text-[10px] font-medium transition-colors capitalize', filter === f ? 'bg-surface-600 text-gray-100' : 'text-gray-500 hover:text-gray-300')}>
                {f === 'all' ? 'All' : f === 'long' ? 'Long-form' : 'Shorts'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="hidden md:grid grid-cols-[1fr_90px_70px_60px_50px_55px_28px] gap-2 items-center border-b border-surface-700 px-5 py-2 text-[10px] font-medium uppercase tracking-wider text-gray-600">
        <span>Title</span>
        {[
          { key: 'date', label: 'Published' },
          { key: 'views', label: 'Views' },
          { key: 'watchTime', label: 'Watch' },
          { key: 'ctr', label: 'CTR' },
          { key: 'views', label: 'Type' },
        ].map((col) => (
          <button key={col.label} onClick={() => setSort(col.key)} className={clsx('text-left transition-colors hover:text-gray-400', sort === col.key && 'text-accent')}>
            {col.label}
          </button>
        ))}
        <span />
      </div>

      <div className="max-h-[420px] overflow-y-auto divide-y divide-surface-700/50">
        {sorted.map((v) => (
          <div key={v.id}>
            <button
              onClick={() => setExpandedId(expandedId === v.id ? null : v.id)}
              className={clsx('w-full text-left px-5 py-3 transition-colors hover:bg-surface-800/30 md:grid md:grid-cols-[1fr_90px_70px_60px_50px_55px_28px] md:gap-2 md:items-center', expandedId === v.id && 'bg-surface-800/20')}
            >
              <span className="text-[12px] font-medium text-gray-200 truncate block">{v.title}</span>
              <span className="text-[11px] text-gray-500 hidden md:block">{formatRelativeTime(v.publishedAt)}</span>
              <span className="text-[11px] text-gray-300 hidden md:block">{v.views.toLocaleString()}</span>
              <span className="text-[11px] text-gray-400 hidden md:block">{v.watchTime.toFixed(1)}h</span>
              <span className="text-[11px] text-gray-400 hidden md:block">{v.ctr}%</span>
              <span className={clsx('hidden md:block rounded-full px-2 py-0.5 text-[9px] font-semibold text-center', v.type === 'short' ? 'bg-teal-500/15 text-teal-400' : 'bg-indigo-500/15 text-indigo-400')}>
                {v.type === 'short' ? 'Short' : 'Long'}
              </span>
              <ChevronRight className={clsx('h-3 w-3 text-gray-600 transition-transform hidden md:block', expandedId === v.id && 'rotate-90')} />
              {/* Mobile inline stats */}
              <div className="flex items-center gap-3 mt-1 md:hidden text-[10px] text-gray-500">
                <span>{v.views.toLocaleString()} views</span>
                <span>{v.ctr}% CTR</span>
                <span className={clsx('rounded-full px-1.5 py-0.5 text-[9px] font-semibold', v.type === 'short' ? 'bg-teal-500/15 text-teal-400' : 'bg-indigo-500/15 text-indigo-400')}>{v.type === 'short' ? 'Short' : 'Long'}</span>
              </div>
            </button>
            {expandedId === v.id && (
              <div className="border-t border-surface-700/30 bg-surface-800/10 px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div><span className="text-gray-600 block">Views</span><span className="text-gray-200 font-medium">{v.views.toLocaleString()}</span></div>
                <div><span className="text-gray-600 block">Watch Time</span><span className="text-gray-200 font-medium">{v.watchTime.toFixed(1)} hours</span></div>
                <div><span className="text-gray-600 block">Avg Duration</span><span className="text-gray-200 font-medium">{v.avgDuration}</span></div>
                <div><span className="text-gray-600 block">CTR</span><span className="text-gray-200 font-medium">{v.ctr}%</span></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function MyChannelTab() {
  const { daily, videos, stats } = useYouTube()

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Eye} label="Total Views" value={stats.totalViews.toLocaleString()} trend={stats.viewsTrend} />
        <StatCard icon={Clock} label="Watch Time" value={stats.totalWatchTime.toFixed(1)} suffix="hours" trend={stats.watchTimeTrend} />
        <StatCard icon={Users} label="Subs Gained" value={`+${stats.totalSubs}`} trend={stats.subsTrend} />
        <StatCard icon={BarChart3} label="Avg CTR" value={`${stats.avgCtr.toFixed(1)}%`} trend={stats.ctrTrend} />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DailyViewsChart data={daily} />
        <TopVideosChart videos={videos} />
        <WatchTimeChart data={daily} />
        <SubGrowthChart data={daily} />
      </div>

      {/* Video list */}
      <VideoTable videos={videos} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  TAB 2 — Competitors
// ═══════════════════════════════════════════════════════════════

function CompetitorCard({ comp, onRemove }) {
  const subsDiff = comp.subscribers - (comp.prevSubscribers || 0)
  const subsUp = subsDiff > 0
  const cadenceDiff = comp.videosPerWeek - (comp.prevVideosPerWeek || 0)
  const momentum = Math.round(comp.videosPerWeek * ((comp.latestVideo?.views || 0) / 1000))

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-surface-700 flex items-center justify-center text-[13px] font-bold text-gray-400">
          {comp.name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-gray-200 truncate">{comp.name}</p>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="text-gray-500">{comp.subscribers.toLocaleString()} subs</span>
            {subsDiff !== 0 && (
              <span className={clsx('flex items-center gap-0.5', subsUp ? 'text-green-400' : 'text-red-400')}>
                {subsUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {subsUp ? '+' : ''}{subsDiff}
              </span>
            )}
          </div>
        </div>
        {!comp.isMock && (
          <button onClick={() => onRemove(comp.id)} className="rounded-md p-1 text-gray-600 hover:text-status-offline hover:bg-surface-700"><Trash2 className="h-3.5 w-3.5" /></button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <div>
          <span className="text-gray-600 block">Upload Cadence</span>
          <span className="text-gray-300 font-medium">{comp.videosPerWeek}/week</span>
          {cadenceDiff !== 0 && (
            <span className={clsx('text-[9px] ml-1', cadenceDiff > 0 ? 'text-green-400' : 'text-red-400')}>
              ({cadenceDiff > 0 ? '+' : ''}{cadenceDiff.toFixed(1)})
            </span>
          )}
        </div>
        <div>
          <span className="text-gray-600 block">Momentum</span>
          <span className={clsx('font-bold', momentum >= 20 ? 'text-green-400' : momentum >= 10 ? 'text-yellow-400' : 'text-gray-400')}>{momentum}</span>
        </div>
        <div>
          <span className="text-gray-600 block">Latest</span>
          <span className="text-gray-400">{comp.latestVideo ? formatRelativeTime(comp.latestVideo.publishedAt) : '—'}</span>
        </div>
      </div>

      {comp.latestVideo && (
        <div className="rounded-lg bg-surface-800/50 px-3 py-2">
          <p className="text-[11px] text-gray-300 truncate">{comp.latestVideo.title}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{comp.latestVideo.views.toLocaleString()} views</p>
        </div>
      )}
    </div>
  )
}

function AddCompetitorModal({ onAdd, onClose }) {
  const [name, setName] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ name: name.trim() })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl border border-surface-700 bg-surface-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-surface-700 px-5 py-3.5">
          <h3 className="text-[13px] font-semibold text-gray-200">Add Competitor</h3>
          <button onClick={onClose} className="rounded-md p-1 text-gray-600 hover:bg-surface-700 hover:text-gray-300"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium text-gray-400">Channel Name or URL</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. AI Builder" className="settings-input w-full" autoFocus />
          </div>
          <p className="text-[10px] text-gray-600">Jinx will fetch channel data automatically once the YouTube API is connected.</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-surface-600 bg-surface-800 px-3.5 py-2 text-[12px] font-medium text-gray-400 hover:text-gray-200">Cancel</button>
            <button type="submit" disabled={!name.trim()} className="rounded-lg bg-accent px-4 py-2 text-[12px] font-semibold text-white hover:bg-accent/90 disabled:opacity-40">Add</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SubscriberComparison({ myDailySubs, competitors }) {
  const data = useMemo(() => {
    return myDailySubs.map((d, i) => {
      const point = { date: d.date, 'My Channel': d.subs }
      competitors.forEach((c) => {
        if (c.dailySubs?.[i]) point[c.name] = c.dailySubs[i].subs
      })
      return point
    })
  }, [myDailySubs, competitors])

  const colors = ['#6366f1', '#f59e0b', '#22c55e', '#ef4444', '#ec4899']

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">
      <h4 className="text-[12px] font-semibold text-gray-200 mb-3">Subscriber Comparison</h4>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6b7280' }} tickFormatter={(d) => d.slice(5)} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} width={40} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, color: '#9ca3af' }} />
          <Line type="monotone" dataKey="My Channel" stroke={colors[0]} strokeWidth={2} dot={false} />
          {competitors.map((c, i) => (
            <Line key={c.id} type="monotone" dataKey={c.name} stroke={colors[(i + 1) % colors.length]} strokeWidth={1.5} dot={false} strokeDasharray={i > 0 ? '4 3' : undefined} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function UploadCadenceChart({ competitors }) {
  const data = useMemo(() => [
    { name: 'My Channel', cadence: 1.5, fill: '#6366f1' },
    ...competitors.map((c, i) => ({
      name: c.name,
      cadence: c.videosPerWeek,
      fill: ['#f59e0b', '#22c55e', '#ef4444', '#ec4899'][i % 4],
    })),
  ], [competitors])

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">
      <h4 className="text-[12px] font-semibold text-gray-200 mb-3">Upload Cadence (videos/week)</h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} />
          <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} width={25} />
          <Tooltip content={<ChartTooltip formatter={(v) => `${v}/week`} />} />
          <Bar dataKey="cadence" name="Videos/Week" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <rect key={i} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function RecentPerformanceScatter({ competitors, myVideos }) {
  const data = useMemo(() => {
    const points = []
    const now = Date.now()
    myVideos.slice(0, 5).forEach((v) => {
      const daysSince = Math.round((now - new Date(v.publishedAt).getTime()) / 86400000)
      points.push({ daysSince, views: v.views, channel: 'My Channel', engagement: v.views * v.ctr / 100 })
    })
    competitors.forEach((c) => {
      if (c.latestVideo) {
        const daysSince = Math.round((now - new Date(c.latestVideo.publishedAt).getTime()) / 86400000)
        points.push({ daysSince, views: c.latestVideo.views, channel: c.name, engagement: c.latestVideo.views * 0.06 })
      }
    })
    return points
  }, [competitors, myVideos])

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">
      <h4 className="text-[12px] font-semibold text-gray-200 mb-3">Recent Video Performance</h4>
      <ResponsiveContainer width="100%" height={200}>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis type="number" dataKey="daysSince" name="Days ago" tick={{ fontSize: 9, fill: '#6b7280' }} label={{ value: 'Days since publish', position: 'insideBottom', offset: -5, fontSize: 9, fill: '#6b7280' }} />
          <YAxis type="number" dataKey="views" name="Views" tick={{ fontSize: 9, fill: '#6b7280' }} width={45} />
          <ZAxis type="number" dataKey="engagement" range={[40, 400]} />
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            return (
              <div className="rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-xs shadow-lg">
                <p className="text-gray-200 font-medium">{d.channel}</p>
                <p className="text-gray-500">{d.views.toLocaleString()} views · {d.daysSince}d ago</p>
              </div>
            )
          }} />
          <Scatter data={data} fill="#6366f1" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

function CompetitorsTab() {
  const { competitors, myChannelDailySubs, videos, addCompetitor, removeCompetitor } = useYouTube()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="space-y-5">
      {/* Competitor cards */}
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-gray-200">Tracked Competitors</h3>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-accent/90">
          <Plus className="h-3 w-3" /> Add Competitor
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {competitors.map((c) => (
          <CompetitorCard key={c.id} comp={c} onRemove={removeCompetitor} />
        ))}
      </div>

      {/* Comparison charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SubscriberComparison myDailySubs={myChannelDailySubs} competitors={competitors} />
        <UploadCadenceChart competitors={competitors} />
      </div>

      <RecentPerformanceScatter competitors={competitors} myVideos={videos} />

      {modalOpen && <AddCompetitorModal onAdd={addCompetitor} onClose={() => setModalOpen(false)} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
//  Main Page
// ═══════════════════════════════════════════════════════════════

const TABS = [
  { id: 'channel', label: 'My Channel', icon: MonitorPlay },
  { id: 'competitors', label: 'Competitors', icon: Users },
]

export default function YouTubePage() {
  const [activeTab, setActiveTab] = useState('channel')

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-gray-100">YouTube</h1>
          <p className="mt-0.5 text-[12px] text-gray-500">Channel analytics, video performance, and competitor tracking</p>
        </div>

        <div className="flex items-center gap-0.5 rounded-xl bg-surface-800 p-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-medium transition-colors',
                  activeTab === tab.id ? 'bg-surface-600 text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-300'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === 'channel' ? <MyChannelTab /> : <CompetitorsTab />}
    </div>
  )
}

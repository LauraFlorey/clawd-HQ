import { useMemo, useState } from 'react'
import {
  Zap, DollarSign, MonitorSmartphone, Timer,
  Activity, AlertTriangle, Brain, CheckSquare, TrendingDown,
  ArrowRight, Users, UserPlus, PenTool, Search, Play, ImageIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { useData } from '../context/DataProvider'
import { useSettings } from '../hooks/useSettings'
import { formatTokenCount, formatSpend, formatRelativeTime } from '../utils/formatters'
import AgentActivityTable from '../components/dashboard/AgentActivityTable'
import BriefingCard from '../components/dashboard/BriefingCard'
import BriefingDetail from '../components/dashboard/BriefingDetail'
import { LoadingCard } from '../components/LoadingState'
import { getCallLog } from '../data/callLogMock'
import { analyzeExpensiveSimpleCalls, analyzeTaskTypeSpend } from '../utils/costIntelligence'
import { knowledgeSources, mockTasks, mockContacts, mockContentIdeas, mockResearchHistory, mockImageAssets } from '../data/mockData'

const CRON_STATUS = { enabled: true, nextWake: '4:00 AM' }

function QuickStat({ icon: Icon, label, value, accent, sub }) {
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className={clsx('h-3.5 w-3.5', accent)} aria-hidden="true" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-100">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-gray-600">{sub}</p>}
    </div>
  )
}

function CronStat() {
  const enabled = CRON_STATUS.enabled
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Timer className={clsx('h-3.5 w-3.5', enabled ? 'text-status-online' : 'text-gray-600')} aria-hidden="true" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Cron</span>
      </div>
      <p className={clsx('text-sm font-semibold', enabled ? 'text-gray-100' : 'text-gray-500')}>
        {enabled ? 'Enabled' : 'Disabled'}
      </p>
      {enabled && CRON_STATUS.nextWake && (
        <p className="mt-0.5 text-[11px] text-gray-600">Next wake: {CRON_STATUS.nextWake}</p>
      )}
    </div>
  )
}

function getAllContacts() {
  const all = [...mockContacts]
  try {
    const user = JSON.parse(localStorage.getItem('clawd-crm-contacts') || '[]')
    all.push(...user.filter((c) => c.status === 'active'))
  } catch {}
  return all
}

function useRecentActivity(staleDays) {
  return useMemo(() => {
    const items = []

    const callLog = getCallLog()
    const downgrades = analyzeExpensiveSimpleCalls(callLog)
    const { recommendations: spendAlerts } = analyzeTaskTypeSpend(callLog)
    const costAlerts = [...downgrades, ...spendAlerts]
    if (costAlerts.length > 0) {
      const alert = costAlerts[0]
      items.push({
        id: 'cost-alert',
        icon: alert.id?.startsWith('downgrade') ? TrendingDown : AlertTriangle,
        iconColor: alert.id?.startsWith('downgrade') ? 'text-status-online' : 'text-status-warning',
        label: alert.title || 'Model Downgrade Opportunity',
        description: (alert.description || '').slice(0, 100) + ((alert.description?.length || 0) > 100 ? '...' : ''),
        timestamp: new Date().toISOString(),
        route: '/costs',
      })
    }

    const allKnowledge = [...knowledgeSources]
    try {
      const userSources = JSON.parse(localStorage.getItem('clawd-knowledge-sources') || '[]')
      allKnowledge.push(...userSources)
    } catch {}
    allKnowledge.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (allKnowledge.length > 0) {
      const src = allKnowledge[0]
      items.push({
        id: 'knowledge-latest',
        icon: Brain,
        iconColor: 'text-accent',
        label: 'Knowledge source added',
        description: src.title,
        timestamp: src.createdAt,
        route: '/knowledge',
      })
    }

    const allTasks = [...mockTasks]
    try {
      const userTasks = JSON.parse(localStorage.getItem('clawd-tasks') || '[]')
      allTasks.push(...userTasks)
    } catch {}
    allTasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (allTasks.length > 0) {
      const task = allTasks[0]
      items.push({
        id: 'task-latest',
        icon: CheckSquare,
        iconColor: 'text-blue-400',
        label: 'Task created',
        description: task.title,
        timestamp: task.createdAt,
        route: '/tasks',
      })
    }

    const allContacts = getAllContacts()

    const recentContact = [...allContacts]
      .filter((c) => c.lastContact)
      .sort((a, b) => b.lastContact.localeCompare(a.lastContact))[0]
    if (recentContact) {
      items.push({
        id: 'crm-latest',
        icon: Users,
        iconColor: 'text-emerald-400',
        label: `Contact: ${recentContact.name}`,
        description: recentContact.interactions?.[0]?.subject || recentContact.company || recentContact.email,
        timestamp: recentContact.lastContact,
        route: '/crm',
      })
    }

    const userContacts = (() => {
      try { return JSON.parse(localStorage.getItem('clawd-crm-contacts') || '[]') } catch { return [] }
    })()
    const newestAdded = userContacts
      .filter((c) => c.status === 'active' && c.createdAt)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    if (newestAdded) {
      items.push({
        id: 'crm-added',
        icon: UserPlus,
        iconColor: 'text-emerald-400',
        label: `New contact added: ${newestAdded.name}`,
        description: newestAdded.company ? `from ${newestAdded.company}` : newestAdded.email,
        timestamp: newestAdded.createdAt,
        route: '/crm',
      })
    }

    const threshold = (staleDays || 30) * 86400000
    const staleContact = allContacts
      .filter((c) => {
        if (!c.lastContact) return false
        return (Date.now() - new Date(c.lastContact).getTime()) > threshold
      })
      .sort((a, b) => new Date(a.lastContact) - new Date(b.lastContact))[0]
    if (staleContact) {
      const daysSince = Math.floor((Date.now() - new Date(staleContact.lastContact).getTime()) / 86400000)
      items.push({
        id: 'crm-stale',
        icon: AlertTriangle,
        iconColor: 'text-status-warning',
        label: `Contact going stale: ${staleContact.name}`,
        description: `Last contact ${daysSince} days ago`,
        timestamp: staleContact.lastContact,
        route: '/crm',
      })
    }

    // Content ideas
    const allIdeas = [...mockContentIdeas]
    try { const u = JSON.parse(localStorage.getItem('clawd-content-ideas') || '[]'); allIdeas.push(...u) } catch {}
    allIdeas.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (allIdeas.length > 0) {
      const idea = allIdeas[0]
      items.push({
        id: 'content-latest',
        icon: PenTool,
        iconColor: 'text-pink-400',
        label: 'Idea pitched',
        description: idea.title,
        timestamp: idea.createdAt,
        route: '/content',
      })
    }

    // Research queries
    const allResearch = [...mockResearchHistory]
    try { const u = JSON.parse(localStorage.getItem('clawd-research-history') || '[]'); allResearch.push(...u) } catch {}
    allResearch.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (allResearch.length > 0) {
      const entry = allResearch[0]
      items.push({
        id: 'research-latest',
        icon: Search,
        iconColor: 'text-cyan-400',
        label: 'Research query',
        description: entry.query,
        timestamp: entry.createdAt,
        route: '/research',
      })
    }

    // YouTube - latest notable change (use daily mock data)
    try {
      const ytChannel = JSON.parse(localStorage.getItem('clawd-youtube-channel') || 'null')
      if (ytChannel?.lastSync) {
        items.push({
          id: 'youtube-sync',
          icon: Play,
          iconColor: 'text-red-400',
          label: 'YouTube metrics synced',
          description: 'Channel analytics updated',
          timestamp: ytChannel.lastSync,
          route: '/youtube',
        })
      }
    } catch {}

    // Image assets
    const allImages = [...mockImageAssets]
    try { const u = JSON.parse(localStorage.getItem('clawd-image-assets') || '[]'); allImages.push(...u) } catch {}
    allImages.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    if (allImages.length > 0) {
      const img = allImages[0]
      items.push({
        id: 'image-latest',
        icon: ImageIcon,
        iconColor: 'text-violet-400',
        label: 'Asset saved',
        description: img.label || img.prompt?.slice(0, 60),
        timestamp: img.createdAt,
        route: '/images',
      })
    }

    return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 8)
  }, [staleDays])
}

function CrmWidget({ staleDays }) {
  const data = useMemo(() => {
    const all = getAllContacts()
    const active = all.filter((c) => c.status !== 'archived')
    const threshold = (staleDays || 30) * 86400000
    const stale = active.filter((c) => {
      if (!c.lastContact) return true
      return (Date.now() - new Date(c.lastContact).getTime()) > threshold
    })
    const needsFollowUp = stale.length
    const topStale = [...active]
      .filter((c) => c.lastContact && (Date.now() - new Date(c.lastContact).getTime()) > threshold)
      .sort((a, b) => b.score - a.score)[0]
    return { total: active.length, needsFollowUp, topStale }
  }, [staleDays])

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Users className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Contacts</span>
      </div>
      <div className="flex items-baseline gap-3">
        <p className="text-lg font-bold text-gray-100">{data.total}</p>
        {data.needsFollowUp > 0 && (
          <span className="text-[11px] text-status-warning">{data.needsFollowUp} need follow-up</span>
        )}
      </div>
      {data.topStale && (
        <p className="mt-0.5 text-[11px] text-gray-600 truncate">
          Top stale: {data.topStale.name} ({data.topStale.score})
        </p>
      )}
      <Link to="/crm" className="mt-1.5 flex items-center gap-1 text-[10px] text-accent hover:underline">
        View All <ArrowRight className="h-2.5 w-2.5" />
      </Link>
    </div>
  )
}

function RecentActivity({ staleDays }) {
  const items = useRecentActivity(staleDays)

  if (items.length === 0) return null

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-gray-500" />
        <h2 className="text-[14px] font-semibold text-gray-200">Recent Activity</h2>
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.id}
              to={item.route}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-800/40 group"
            >
              <Icon className={clsx('h-4 w-4 shrink-0', item.iconColor)} />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-gray-300 group-hover:text-gray-100">{item.label}</p>
                <p className="truncate text-[11px] text-gray-500">{item.description}</p>
              </div>
              <span className="shrink-0 text-[10px] text-gray-600">{formatRelativeTime(item.timestamp)}</span>
              <ArrowRight className="h-3 w-3 shrink-0 text-gray-700 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { agents, tokenUsage, loading, usageLoading } = useData()
  const { settings } = useSettings()
  const staleDays = settings.crm?.staleDays ?? 30
  const [briefingOpen, setBriefingOpen] = useState(false)

  const onlineCount = agents.filter((a) => a.status === 'online').length
  const todayTokens = tokenUsage.daily?.length
    ? tokenUsage.daily[tokenUsage.daily.length - 1]?.totalTokens ?? 0
    : 0
  const todaySpend = tokenUsage.totalToday ?? 0

  const pendingTaskCount = useMemo(() => {
    const all = [...mockTasks]
    try { const u = JSON.parse(localStorage.getItem('clawd-tasks') || '[]'); all.push(...u) } catch {}
    return all.filter((t) => t.status === 'pending').length
  }, [])

  return (
    <div className="space-y-5">
      {/* ── Quick Stats Row ───────────────────────── */}
      {loading || usageLoading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <LoadingCard height="h-24" />
          <LoadingCard height="h-24" />
          <LoadingCard height="h-24" />
          <LoadingCard height="h-24" />
          <LoadingCard height="h-24" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <QuickStat
            icon={MonitorSmartphone}
            label="Jinx Status"
            value={onlineCount > 0 ? 'Online' : 'Offline'}
            accent={onlineCount > 0 ? 'text-status-online' : 'text-status-offline'}
            sub={`${onlineCount} machine${onlineCount !== 1 ? 's' : ''} active`}
          />
          <QuickStat
            icon={DollarSign}
            label="AI Cost Today"
            value={formatSpend(todaySpend)}
            accent="text-status-warning"
            sub={`${formatTokenCount(todayTokens)} tokens`}
          />
          <CrmWidget staleDays={staleDays} />
          <QuickStat
            icon={CheckSquare}
            label="Pending Tasks"
            value={pendingTaskCount}
            accent="text-blue-400"
          />
          <CronStat />
        </div>
      )}

      {/* ── Main Content ──────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
        <div className="min-w-0 space-y-5">
          <AgentActivityTable />
          <RecentActivity staleDays={staleDays} />
        </div>

        <div className="min-w-0">
          <BriefingCard onViewFull={() => setBriefingOpen(true)} />
        </div>
      </div>

      {briefingOpen && <BriefingDetail onClose={() => setBriefingOpen(false)} />}
    </div>
  )
}

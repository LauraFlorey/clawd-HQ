import { useLocation } from 'react-router-dom'
import { DollarSign, Zap, Bot, Menu, FlaskConical } from 'lucide-react'
import clsx from 'clsx'
import { useData } from '../context/DataProvider'
import { formatTokenCount, formatSpend } from '../utils/formatters'

const PAGE_TITLE_MAP = {
  '/': 'Home',
  '/memory': 'Memory',
  '/projects': 'Projects',
  '/tasks': 'Tasks',
  '/clients': 'Clients',
  '/crm': 'CRM',
  '/costs': 'Costs',
  '/knowledge': 'Knowledge',
  '/content': 'Content',
  '/research': 'Research',
  '/youtube': 'YouTube',
  '/images': 'Images',
  '/links': 'Links',
  '/chat': 'Chat',
  '/settings': 'Settings',
  '/agent': 'Jinx',
  '/agents': 'Jinx',
  '/usage': 'Costs',
}

function usePageTitle() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/agents/')) return 'Jinx'
  return PAGE_TITLE_MAP[pathname] || 'Home'
}

function DemoModeBadge({ demoSources }) {
  if (!demoSources) return null
  const active = Object.entries(demoSources).filter(([, v]) => v)
  if (active.length === 0) return null

  const labels = {
    gateway1: 'GW1',
    gateway2: 'GW2',
    usage: 'Usage',
    cursor: 'Cursor',
  }
  const parts = active.map(([k]) => labels[k] || k)

  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-400"
      title={`Demo data active for: ${parts.join(', ')}. Configure real connections in Settings or .env.local`}
    >
      <FlaskConical className="h-3 w-3" />
      <span className="hidden sm:inline">Demo</span>
    </div>
  )
}

function SummaryPill({ icon: Icon, label, value, accent, ariaLabel }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-surface-700 bg-surface-800/60 px-3 py-1.5 sm:gap-2 sm:px-3.5"
      role="status"
      aria-label={ariaLabel}
    >
      <Icon className={clsx('h-3.5 w-3.5 shrink-0', accent ?? 'text-gray-500')} aria-hidden="true" />
      <span className="hidden text-[11px] text-gray-500 lg:inline">{label}</span>
      <span className="text-[12px] font-semibold text-gray-200 sm:text-[13px]">{value}</span>
    </div>
  )
}

export default function TopBar({ onMenuClick }) {
  const pageTitle = usePageTitle()
  const { agents, tokenUsage, loading, demoMode, demoSources } = useData()
  const onlineCount = agents.filter((a) => a.status === 'online').length
  const todaySpend = tokenUsage.totalToday ?? 0
  const todayTokens = tokenUsage.daily?.length
    ? tokenUsage.daily[tokenUsage.daily.length - 1]?.totalTokens ?? 0
    : 0

  return (
    <header className="flex h-14 items-center justify-between border-b border-surface-700 bg-surface-900/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Toggle navigation menu"
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-surface-800 hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-sm font-semibold text-gray-100">{pageTitle}</h2>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {demoMode && <DemoModeBadge demoSources={demoSources} />}
        {loading ? (
          <div className="h-7 w-32 animate-pulse rounded-full bg-surface-800 sm:w-48" />
        ) : (
          <>
            <SummaryPill
              icon={DollarSign}
              label="Spend"
              value={formatSpend(todaySpend)}
              accent="text-status-warning"
              ariaLabel={`Today's spend: ${formatSpend(todaySpend)}`}
            />
            {/* Hide tokens pill on very small screens */}
            <div className="hidden sm:block">
              <SummaryPill
                icon={Zap}
                label="Tokens"
                value={formatTokenCount(todayTokens)}
                accent="text-accent"
                ariaLabel={`Today's tokens: ${formatTokenCount(todayTokens)}`}
              />
            </div>
            <SummaryPill
              icon={Bot}
              label="Machines"
              value={`${onlineCount}/${agents.length}`}
              accent="text-status-online"
              ariaLabel={`${onlineCount} of ${agents.length} machines online`}
            />
          </>
        )}
      </div>
    </header>
  )
}

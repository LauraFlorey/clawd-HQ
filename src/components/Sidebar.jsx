import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  DollarSign,
  Folder,
  Database,
  CheckSquare,
  User,
  MessageSquare,
  Settings,
  Bot,
  ChevronLeft,
  ChevronRight,
  Terminal,
} from 'lucide-react'
import clsx from 'clsx'
import { useData } from '../context/DataProvider'
import { getMachineColor } from '../utils/formatters'

// ─── Navigation definition ───────────────────────────────────────

const mainNav = [
  { name: 'Home',     to: '/',          icon: LayoutDashboard },
  { name: 'Memory',   to: '/memory',    icon: Database },
  { name: 'Projects', to: '/projects',  icon: Folder },
  { name: 'Tasks',    to: '/tasks',     icon: CheckSquare },
  { name: 'Clients',  to: '/clients',   icon: User },
  { name: 'Costs',    to: '/costs',     icon: DollarSign },
  { name: 'Chat',     to: '/chat',      icon: MessageSquare },
  { name: 'Settings', to: '/settings',  icon: Settings },
]

// ─── Status dot (reused for Jinx) ────────────────────────────────

function JinxStatusDot({ status }) {
  const color =
    status === 'online'   ? 'bg-status-online' :
    status === 'degraded' ? 'bg-status-warning' :
                            'bg-status-offline'
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {status === 'online' && (
        <span className={clsx('absolute inline-flex h-full w-full rounded-full opacity-40 animate-pulse-soft', color)} />
      )}
      <span className={clsx('relative inline-flex h-2 w-2 rounded-full', color)} />
    </span>
  )
}

// ─── Tooltip wrapper ─────────────────────────────────────────────

function Tooltip({ label, side = 'right', children }) {
  return (
    <div className="group/tip relative">
      {children}
      <div className={clsx(
        'pointer-events-none absolute top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-surface-700 px-2.5 py-1.5 text-[11px] font-medium text-gray-200 opacity-0 shadow-lg shadow-black/30 transition-opacity group-hover/tip:opacity-100',
        side === 'right' ? 'left-full ml-2.5' : 'right-full mr-2.5'
      )}>
        {label}
      </div>
    </div>
  )
}

// ─── Nav Item ────────────────────────────────────────────────────

function NavItem({ item, collapsed }) {
  const link = (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      aria-label={item.name}
      className={({ isActive }) =>
        clsx(
          'group flex items-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
          collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
          isActive
            ? 'bg-surface-700/70 text-accent'
            : 'text-gray-500 hover:bg-surface-800/60 hover:text-gray-300'
        )
      }
    >
      <item.icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span className="text-[13px] font-medium">{item.name}</span>}
    </NavLink>
  )

  if (collapsed) return <Tooltip label={item.name}>{link}</Tooltip>
  return link
}

// ─── Machine sub-dot (for expanded Jinx section) ─────────────────

function MachineDot({ agent }) {
  const colorClass = getMachineColor(agent.machine, agent.status)
  return (
    <div className="flex items-center gap-2 pl-7 pr-3 py-1 text-[11px] text-gray-500">
      <span className={clsx('h-1.5 w-1.5 shrink-0 rounded-full', colorClass)} />
      <span className="truncate">{agent.machineLabel}</span>
    </div>
  )
}

// ─── Main Sidebar ────────────────────────────────────────────────

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { agents, loading } = useData()

  const anyOnline = agents?.some((a) => a.status === 'online') || false
  const jinxStatus = anyOnline ? 'online' : (agents?.[0]?.status || 'unknown')
  const isAgentActive = location.pathname === '/agent' || location.pathname.startsWith('/agents/')

  return (
    <>
      {/* Mobile overlay backdrop */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* ── Desktop / Tablet Sidebar ──────────────────────── */}
      <aside
        role="navigation"
        aria-label="Main navigation"
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-surface-700 bg-sidebar-bg transition-all duration-200',
          'hidden md:flex md:relative md:z-auto',
          collapsed ? 'md:w-[60px]' : 'md:w-[200px]'
        )}
      >
        {/* Toggle / Brand */}
        <div className={clsx(
          'flex h-12 items-center border-b border-surface-700',
          collapsed ? 'justify-center px-2' : 'justify-between px-3'
        )}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 text-accent">
                <Terminal className="h-3.5 w-3.5" />
              </div>
              <span className="text-[13px] font-semibold tracking-tight text-gray-200">Agent HQ</span>
            </div>
          )}
          <button
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="rounded-md p-1 text-gray-600 transition-colors hover:bg-surface-800 hover:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Main navigation */}
        <nav className="flex-1 overflow-y-auto px-1.5 py-2">
          <div className="space-y-0.5">
            {mainNav.map((item) => (
              <NavItem key={item.to} item={item} collapsed={collapsed} />
            ))}
          </div>
        </nav>

        {/* ── Jinx section (pinned to bottom) ─────────────── */}
        <div className="border-t border-surface-700 px-1.5 py-2">
          {collapsed ? (
            /* Collapsed: just icon + status dot */
            <Tooltip label={`Jinx — ${jinxStatus}`}>
              <button
                onClick={() => navigate('/agent')}
                aria-label={`Jinx, ${jinxStatus}`}
                className={clsx(
                  'flex w-full items-center justify-center rounded-lg p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
                  isAgentActive
                    ? 'bg-surface-700/70 text-accent'
                    : 'text-gray-500 hover:bg-surface-800/60 hover:text-gray-300'
                )}
              >
                <div className="relative">
                  <Bot className="h-[18px] w-[18px]" />
                  <span className="absolute -right-0.5 -top-0.5">
                    <JinxStatusDot status={jinxStatus} />
                  </span>
                </div>
              </button>
            </Tooltip>
          ) : (
            /* Expanded: name + status + machine sub-items */
            <div className="space-y-0.5">
              <button
                onClick={() => navigate('/agent')}
                aria-label={`Jinx, ${jinxStatus}`}
                className={clsx(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
                  isAgentActive
                    ? 'bg-surface-700/70 text-accent'
                    : 'text-gray-500 hover:bg-surface-800/60 hover:text-gray-300'
                )}
              >
                <div className="relative shrink-0">
                  <Bot className="h-[18px] w-[18px]" />
                  <span className="absolute -right-0.5 -top-0.5">
                    <JinxStatusDot status={jinxStatus} />
                  </span>
                </div>
                <span className="text-[13px] font-medium">Jinx</span>
              </button>
              {!loading && agents && agents.map((agent) => (
                <MachineDot key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Slide-out ──────────────────────────────── */}
      {!collapsed && (
        <aside
          className="fixed inset-y-0 left-0 z-40 flex w-[200px] flex-col border-r border-surface-700 bg-sidebar-bg md:hidden"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <div className="flex h-12 items-center justify-between border-b border-surface-700 px-3">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 text-accent">
                <Terminal className="h-3.5 w-3.5" />
              </div>
              <span className="text-[13px] font-semibold tracking-tight text-gray-200">Agent HQ</span>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto px-1.5 py-2">
            <div className="space-y-0.5">
              {mainNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onToggle}
                  aria-label={item.name}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                      isActive
                        ? 'bg-surface-700/70 text-accent'
                        : 'text-gray-500 hover:bg-surface-800/60 hover:text-gray-300'
                    )
                  }
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
          </nav>
          {/* Mobile Jinx */}
          <div className="border-t border-surface-700 px-1.5 py-2">
            <button
              onClick={() => { navigate('/agent'); onToggle() }}
              className={clsx(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors',
                isAgentActive ? 'bg-surface-700/70 text-accent' : 'text-gray-500 hover:bg-surface-800/60 hover:text-gray-300'
              )}
            >
              <div className="relative shrink-0">
                <Bot className="h-[18px] w-[18px]" />
                <span className="absolute -right-0.5 -top-0.5">
                  <JinxStatusDot status={jinxStatus} />
                </span>
              </div>
              <span>Jinx</span>
            </button>
          </div>
        </aside>
      )}

      {/* ── Mobile Bottom Tab Bar ─────────────────────────── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-surface-700 bg-surface-900/95 backdrop-blur-sm safe-bottom md:hidden"
        role="navigation"
        aria-label="Mobile tab bar"
      >
        {/* Show a subset of the most important tabs on mobile */}
        {[mainNav[0], mainNav[1], mainNav[6], mainNav[7]].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            aria-label={item.name}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors',
                isActive ? 'text-accent' : 'text-gray-500'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
        {/* Jinx tab in mobile bottom bar */}
        <NavLink
          to="/agent"
          aria-label="Jinx"
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] font-medium transition-colors',
              isActive ? 'text-accent' : 'text-gray-500'
            )
          }
        >
          <div className="relative">
            <Bot className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5">
              <JinxStatusDot status={jinxStatus} />
            </span>
          </div>
          <span>Jinx</span>
        </NavLink>
      </nav>
    </>
  )
}

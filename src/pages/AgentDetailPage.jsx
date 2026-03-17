import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  ExternalLink,
  BarChart3,
  Settings2,
  Brain,
  Zap,
  DollarSign,
  Activity,
  Star,
} from 'lucide-react'
import clsx from 'clsx'
import { useData } from '../context/DataProvider'
import { getMachineColor, formatTokenCount, formatSpend } from '../utils/formatters'
import { agentMonthlyStats, agentDiscordChannels } from '../data/agentDetailMock'
import ModelSelector from '../components/agent/ModelSelector'
import AgentUsageTab from '../components/agent/AgentUsageTab'
import AgentConfigTab from '../components/agent/AgentConfigTab'
import AgentMemoryTab from '../components/agent/AgentMemoryTab'
import { LoadingCard } from '../components/LoadingState'
import EmptyState from '../components/EmptyState'

const TABS = [
  { id: 'usage', label: 'Usage', icon: BarChart3 },
  { id: 'config', label: 'Config', icon: Settings2 },
  { id: 'memory', label: 'Memory', icon: Brain },
]

const statusLabel = {
  online: 'Online',
  degraded: 'Degraded',
  offline: 'Offline',
  unknown: 'Unknown',
}

const statusBadgeClass = {
  online: 'bg-status-online/10 text-status-online border-status-online/20',
  degraded: 'bg-status-degraded/10 text-status-degraded border-status-degraded/20',
  offline: 'bg-status-offline/10 text-status-offline border-status-offline/20',
  unknown: 'bg-surface-700 text-gray-500 border-surface-600',
}

export default function AgentDetailPage() {
  const { agentId: paramId } = useParams()
  const { agents, sendCommand, loading } = useData()
  // All agents are Jinx on different machines — find any match or use first
  const agent = agents.find((a) => a.id === paramId) || agents.find((a) => a.id === 'jinx') || agents[0]
  const [activeTab, setActiveTab] = useState('usage')

  // Resolved agent ID — use param if provided, otherwise fall back to found agent's id
  const agentId = agent?.id ?? paramId ?? 'jinx'

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingCard height="h-36" />
        <LoadingCard height="h-96" />
      </div>
    )
  }

  if (!agent) {
    return (
      <EmptyState
        variant="error"
        title="Agent not found"
        message="No agent is currently connected. Check your gateway settings."
      />
    )
  }

  function handleModelChange(modelId) {
    sendCommand(agentId, 'switch_model', { model: modelId })
  }

  const dotColor = getMachineColor(agent.machine, agent.status)
  const machineColorVar = agent.machine === 'macbook' ? 'machine-macbook' : 'machine-mini'
  const monthly = agentMonthlyStats[agentId] || agentMonthlyStats.jinx
  const discord = agentDiscordChannels[agentId] || agentDiscordChannels.jinx

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-surface-700 bg-surface-900 p-4 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="relative mt-1.5">
              <span className="relative flex h-3.5 w-3.5" role="img" aria-label={`Status: ${agent.status}`}>
                {agent.status === 'online' && (
                  <span className={clsx('absolute inline-flex h-full w-full rounded-full opacity-30 animate-pulse-soft', dotColor)} />
                )}
                <span className={clsx('relative inline-flex h-3.5 w-3.5 rounded-full', dotColor)} />
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-bold tracking-tight text-gray-100 sm:text-xl">{agent.name}</h2>
                <span className={clsx('rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', statusBadgeClass[agent.status])}>
                  {statusLabel[agent.status]}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                <span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-medium', `bg-${machineColorVar}-dim text-${machineColorVar}`)}>
                  {agent.machineLabel}
                </span>
                <span className="font-mono text-gray-600">{agent.gateway}</span>
                {agent.uptime && <span>Uptime: {agent.uptime}</span>}
                <span>Last active: {agent.lastActive}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
            <ModelSelector currentModelId={agent.model} onModelChange={handleModelChange} />
            {discord && (
              <a href={discord.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-xs font-medium text-gray-400 transition-colors hover:border-surface-500 hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50">
                <ExternalLink className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Jump to</span>
                {discord.name}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-surface-700 bg-surface-900">
        <div className="flex border-b border-surface-700 overflow-x-auto" role="tablist">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                className={clsx(
                  'flex items-center gap-2 border-b-2 px-4 py-3 text-[13px] font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 sm:px-5',
                  isActive ? 'border-accent text-gray-100' : 'border-transparent text-gray-500 hover:border-surface-600 hover:text-gray-300'
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
        <div className="p-4 sm:p-6 view-transition" key={activeTab} id={`tabpanel-${activeTab}`} role="tabpanel">
          {activeTab === 'usage' && <AgentUsageTab agentId={agentId} />}
          {activeTab === 'config' && <AgentConfigTab agentId={agentId} />}
          {activeTab === 'memory' && <AgentMemoryTab agentId={agentId} />}
        </div>
      </div>

      {/* Monthly Quick Stats */}
      {monthly && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <QuickStat icon={Zap} label="Tokens This Month" value={formatTokenCount(monthly.totalTokens)} accent="text-accent" />
          <QuickStat icon={DollarSign} label="Est. Monthly Cost" value={formatSpend(monthly.estimatedCost)} accent="text-status-warning" />
          <QuickStat icon={Activity} label="Avg Tokens / Day" value={formatTokenCount(monthly.avgTokensPerDay)} accent="text-machine-macbook" />
          <QuickStat icon={Star} label="Most Used Model" value={monthly.mostUsedModel} accent="text-provider-anthropic" small />
        </div>
      )}
    </div>
  )
}

function QuickStat({ icon: Icon, label, value, accent, small }) {
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={clsx('h-3.5 w-3.5', accent)} aria-hidden="true" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">{label}</span>
      </div>
      <p className={clsx('font-semibold text-gray-100', small ? 'text-sm' : 'text-lg')}>{value}</p>
    </div>
  )
}

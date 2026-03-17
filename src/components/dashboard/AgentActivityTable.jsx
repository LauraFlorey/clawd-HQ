import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ArrowRightLeft, MessageSquare } from 'lucide-react'
import clsx from 'clsx'
import { useData } from '../../context/DataProvider'
import { getMachineColor, formatTokenCount, formatSpend } from '../../utils/formatters'
import { MODEL_GROUPS } from '../../utils/constants'
import { LoadingRow } from '../LoadingState'

function StatusDot({ status, machine }) {
  const colorClass = getMachineColor(machine, status)
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0" role="img" aria-label={status}>
      {status === 'online' && (
        <span className={clsx('absolute inline-flex h-full w-full rounded-full opacity-40 animate-pulse-soft', colorClass)} />
      )}
      <span className={clsx(
        'relative inline-flex h-2.5 w-2.5 rounded-full',
        colorClass,
        status === 'offline' && 'ring-1 ring-gray-500/40'
      )} />
    </span>
  )
}

function ModelSelector({ agent, onClose }) {
  const { sendCommand } = useData()
  const [selected, setSelected] = useState(agent.model)

  return (
    <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-surface-600 bg-surface-800 py-1 shadow-xl shadow-black/40 max-h-72 overflow-y-auto">
      {MODEL_GROUPS.map((group) => (
        <div key={group.provider}>
          <div className="flex items-center gap-2 px-3 pb-0.5 pt-2.5 first:pt-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: group.color }} aria-hidden="true" />
            <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-600">{group.label}</span>
          </div>
          {group.models.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                setSelected(model.id)
                sendCommand(agent.id, 'switch_model', { model: model.id, modelLabel: model.name })
                onClose()
              }}
              className={clsx(
                'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
                model.id === selected ? 'bg-surface-700 text-gray-100' : 'text-gray-400 hover:bg-surface-700/50 hover:text-gray-200'
              )}
            >
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                {model.id === selected && <Check className="h-3 w-3 text-accent" />}
              </span>
              <span className="truncate">{model.name}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function AgentActivityTable() {
  const [openSelector, setOpenSelector] = useState(null)
  const navigate = useNavigate()
  const { agents, loading, gatewayErrors } = useData()

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-900">
      <div className="flex items-center justify-between border-b border-surface-700 px-4 py-3.5 sm:px-5">
        <h3 className="text-[13px] font-semibold text-gray-200">Jinx Activity</h3>
        <span className="text-[11px] text-gray-600">
          {agents.filter((a) => a.status === 'online').length} of {agents.length} machine{agents.length !== 1 ? 's' : ''} online
        </span>
      </div>

      {/* Gateway error inline warning */}
      {gatewayErrors.length > 0 && (
        <div className="border-b border-status-warning/20 bg-status-warning/5 px-4 py-2 sm:px-5">
          <p className="text-[11px] text-status-warning">
            ⚠ Gateway connection issue: {gatewayErrors[0]}
          </p>
        </div>
      )}

      {/* Rows */}
      {loading ? (
        <div className="py-1">
          <LoadingRow /><LoadingRow />
        </div>
      ) : agents.length === 0 ? (
        <div className="px-5 py-8 text-center text-xs text-gray-600">
          No agents connected. Check gateway settings.
        </div>
      ) : (
        <div className="divide-y divide-surface-800/50">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="group px-4 py-4 transition-colors hover:bg-surface-800/30 sm:px-5"
            >
              {/* Top row: agent info + model + stats + switch button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/agent')}
                  className="flex items-center gap-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-md min-w-0 flex-1"
                  aria-label={`View ${agent.name} details`}
                >
                  <StatusDot status={agent.status} machine={agent.machine} />
                  <div className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-gray-200 group-hover:text-gray-100">{agent.name}</span>
                    <span className="text-[10px] text-gray-600">{agent.machineLabel}</span>
                  </div>
                </button>

                <span className="hidden sm:block truncate text-xs text-gray-400 shrink-0">{agent.modelLabel}</span>

                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <span className="text-gray-500">{agent.lastActive}</span>
                  <span className="font-medium text-gray-300">
                    {agent.tokensToday > 0 ? formatTokenCount(agent.tokensToday) : '—'}
                  </span>
                  {agent.spendToday > 0 && (
                    <span className="text-gray-500">{formatSpend(agent.spendToday)}</span>
                  )}
                </div>

                <div className="relative shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setOpenSelector(openSelector === agent.id ? null : agent.id) }}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-surface-700 hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                    aria-label={`Switch model for ${agent.name}`}
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                  </button>
                  {openSelector === agent.id && (
                    <ModelSelector agent={agent} onClose={() => setOpenSelector(null)} />
                  )}
                </div>
              </div>

              {/* Bottom row: last message preview */}
              {agent.lastMessage && (
                <div className="mt-2.5 flex items-start gap-2 pl-5 sm:pl-[1.875rem]">
                  <MessageSquare className="h-3 w-3 shrink-0 text-gray-700 mt-0.5" aria-hidden="true" />
                  <p className="text-[11px] leading-relaxed text-gray-500 truncate">
                    &ldquo;{agent.lastMessage}&rdquo;
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

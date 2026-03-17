import { Shield, Folder, Terminal, MessageCircle, Clock, Server, ShieldOff } from 'lucide-react'
import clsx from 'clsx'
import { agentConfigs } from '../../data/agentDetailMock'

function ConfigSection({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3 py-3.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-600" />
      <div className="min-w-0 flex-1">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
          {label}
        </p>
        {children}
      </div>
    </div>
  )
}

function ConfigValue({ label, value, mono }) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <span className="text-xs text-gray-500">{label}</span>
      <span
        className={clsx(
          'text-xs text-gray-300',
          mono && 'font-mono'
        )}
      >
        {value}
      </span>
    </div>
  )
}

function Badge({ children, variant = 'default' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium',
        variant === 'default' && 'bg-surface-700 text-gray-300',
        variant === 'green' && 'bg-status-online/10 text-status-online',
        variant === 'yellow' && 'bg-status-warning/10 text-status-warning',
        variant === 'red' && 'bg-status-error/10 text-status-error'
      )}
    >
      {children}
    </span>
  )
}

export default function AgentConfigTab({ agentId }) {
  const config = agentConfigs[agentId]
  if (!config) {
    return <p className="py-8 text-center text-sm text-gray-600">No configuration found.</p>
  }

  return (
    <div className="divide-y divide-surface-800">
      <ConfigSection icon={Folder} label="Workspace">
        <ConfigValue label="Path" value={config.workspacePath} mono />
        <ConfigValue label="System Prompt" value={config.systemPromptFile} mono />
        <ConfigValue label="Memory Directory" value={config.memoryDir} mono />
      </ConfigSection>

      <ConfigSection icon={Terminal} label="Allowed Tools">
        <div className="flex flex-wrap gap-1.5 mt-0.5">
          {config.allowedTools.map((tool) => (
            <Badge key={tool}>{tool}</Badge>
          ))}
        </div>
      </ConfigSection>

      {config.deniedTools?.length > 0 && (
        <ConfigSection icon={ShieldOff} label="Denied Tools">
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {config.deniedTools.map((tool) => (
              <Badge key={tool} variant="red">{tool}</Badge>
            ))}
          </div>
        </ConfigSection>
      )}

      <ConfigSection icon={Shield} label="Sandbox">
        <ConfigValue
          label="Status"
          value={
            <Badge variant={config.sandboxMode === 'enabled' ? 'green' : 'yellow'}>
              {config.sandboxMode}
            </Badge>
          }
        />
      </ConfigSection>

      <ConfigSection icon={MessageCircle} label="Discord">
        {config.discord ? (
          <>
            <ConfigValue label="Server" value={config.discord.server} />
            <ConfigValue
              label="Status"
              value={
                <Badge variant={config.discord.status === 'connected' ? 'green' : 'yellow'}>
                  {config.discord.status}
                </Badge>
              }
            />
          </>
        ) : (
          <p className="text-xs text-gray-500">Not configured</p>
        )}
      </ConfigSection>

      <ConfigSection icon={Server} label="Gateways">
        {config.gateways ? config.gateways.map((gw, i) => (
          <div key={i} className={clsx(i > 0 && 'mt-2 pt-2 border-t border-surface-800/50')}>
            <ConfigValue label="Machine" value={gw.machine} />
            <ConfigValue label="Address" value={`${gw.host}:${gw.port}`} mono />
            <ConfigValue label="Workspace" value={gw.path} mono />
          </div>
        )) : (
          <ConfigValue label="Address" value="—" mono />
        )}
      </ConfigSection>

      <ConfigSection icon={Shield} label="Limits">
        <ConfigValue
          label="Max Tokens / Turn"
          value={config.maxTokensPerTurn.toLocaleString()}
        />
        <ConfigValue label="Cron Jobs" value={config.cronJobs} />
        <ConfigValue
          label="Git Auto-Commit"
          value={config.gitAutoCommit ? 'Enabled' : 'Disabled'}
        />
      </ConfigSection>

      <ConfigSection icon={Clock} label="Heartbeat">
        <ConfigValue label="Interval" value={config.heartbeatInterval} />
      </ConfigSection>
    </div>
  )
}

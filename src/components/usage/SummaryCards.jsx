import { TrendingUp, TrendingDown, DollarSign, Target, Bot, Cpu } from 'lucide-react'
import clsx from 'clsx'
import { formatSpend, formatTokenCount } from '../../utils/formatters'

export default function SummaryCards({ summary }) {
  const changeIsUp = summary.pctChange > 0
  const changeColor = changeIsUp ? 'text-status-offline' : 'text-status-online'
  const ChangeIcon = changeIsUp ? TrendingUp : TrendingDown

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card>
        <CardIcon icon={DollarSign} color="text-provider-anthropic" />
        <CardLabel>This Month</CardLabel>
        <CardValue>{formatSpend(summary.thisMonthSpend)}</CardValue>
        <div className="mt-1 flex items-center gap-1">
          <ChangeIcon className={clsx('h-3 w-3', changeColor)} />
          <span className={clsx('text-[11px] font-medium', changeColor)}>{Math.abs(summary.pctChange)}%</span>
          <span className="text-[11px] text-gray-600">vs last month</span>
        </div>
      </Card>
      <Card>
        <CardIcon icon={Target} color="text-accent" />
        <CardLabel>Projected (month)</CardLabel>
        <CardValue>{formatSpend(summary.projected)}</CardValue>
        <p className="mt-1 text-[11px] text-gray-600">Based on {formatSpend(summary.dailyAvg)}/day avg</p>
      </Card>
      <Card>
        <CardIcon icon={Bot} color="text-status-warning" />
        <CardLabel>Top Agent (cost)</CardLabel>
        <CardValue>{formatSpend(summary.topAgent.cost)}</CardValue>
        <p className="mt-1 text-[11px] text-gray-600">{summary.topAgent.name}</p>
      </Card>
      <Card>
        <CardIcon icon={Cpu} color="text-machine-macbook" />
        <CardLabel>Top Model (tokens)</CardLabel>
        <CardValue>{formatTokenCount(summary.topModel.tokens)}</CardValue>
        <p className="mt-1 text-[11px] text-gray-600">{summary.topModel.name}</p>
      </Card>
    </div>
  )
}

function Card({ children }) {
  return <div className="rounded-xl border border-surface-700 bg-surface-900 p-4">{children}</div>
}
function CardIcon({ icon: Icon, color }) {
  return <Icon className={clsx('mb-2 h-4 w-4', color)} />
}
function CardLabel({ children }) {
  return <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">{children}</p>
}
function CardValue({ children }) {
  return <p className="mt-0.5 text-xl font-bold text-gray-100">{children}</p>
}

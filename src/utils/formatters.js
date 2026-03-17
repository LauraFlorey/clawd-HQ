/**
 * Shared formatting utilities used across the entire dashboard.
 * These replace the inline helpers previously in mockData.js.
 */

// ─── Numbers ───────────────────────────────────────────────────

/**
 * Format a large number into a human-readable abbreviated string.
 * 1_752_400 → "1.8M", 342_800 → "343K", 850 → "850"
 */
export function formatNumber(n) {
  if (n == null || isNaN(n)) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toString()
}

/**
 * Alias for formatNumber — used in token-specific contexts.
 */
export const formatTokenCount = formatNumber

/**
 * Format a number with locale-aware comma separators.
 * 1234567 → "1,234,567"
 */
export function formatNumberRaw(n) {
  if (n == null || isNaN(n)) return '—'
  return n.toLocaleString('en-US')
}

// ─── Currency ──────────────────────────────────────────────────

/**
 * Format a dollar amount with $ prefix.
 * 15.5 → "$15.50", 0.924 → "$0.92"
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '$0.00'
  return `$${Number(amount).toFixed(2)}`
}

/**
 * Alias for formatCurrency — used in spend-specific contexts.
 */
export const formatSpend = formatCurrency

// ─── Time ──────────────────────────────────────────────────────

/**
 * Format a Date (or ISO string) into a relative time string.
 * "2 min ago", "3 hours ago", "5 days ago"
 */
export function formatRelativeTime(date) {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now - d
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 10) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin} min ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 30) return `${diffDay}d ago`
  return formatDate(d)
}

/**
 * Format a Date (or ISO string) into a readable date string.
 * "Feb 14, 2026"
 */
export function formatDate(date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format a Date into a short date for chart labels.
 * "Feb 14"
 */
export function formatShortDate(date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Status helpers ────────────────────────────────────────────

/**
 * Get the Tailwind background class for an agent's status dot color,
 * using the machine color when online/degraded, status color otherwise.
 */
export function getMachineColor(machine, status) {
  if (status !== 'online' && status !== 'degraded') {
    return getStatusColor(status)
  }
  return machine === 'macbook' ? 'bg-machine-macbook' : 'bg-machine-mini'
}

/**
 * Get the Tailwind background class for a raw status.
 */
export function getStatusColor(status) {
  switch (status) {
    case 'online':   return 'bg-status-online'
    case 'degraded': return 'bg-status-warning'
    case 'offline':  return 'bg-status-offline'
    default:         return 'bg-status-unknown'
  }
}

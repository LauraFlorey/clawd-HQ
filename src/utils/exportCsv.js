/**
 * Export data as a CSV file download.
 */
export function exportCsv(filename, headers, rows) {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        const str = String(cell)
        // Escape commas and quotes
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Export provider breakdown as CSV.
 */
export function exportProviderCsv(breakdown, days) {
  const headers = ['Provider', 'Total Tokens', 'Total Cost', '% of Total', 'Avg Cost/Day']
  const rows = breakdown.map((r) => [
    r.name,
    r.totalTokens,
    r.totalCost.toFixed(2),
    `${r.pctOfTotal}%`,
    r.avgPerDay.toFixed(2),
  ])
  exportCsv(`openclaw-provider-usage-${days}d.csv`, headers, rows)
}

/**
 * Export machine breakdown as CSV.
 */
export function exportAgentCsv(breakdown, days) {
  const headers = ['Machine', 'Agent', 'Model', 'Total Tokens', 'Total Cost', '% of Total']
  const rows = breakdown.map((r) => [
    r.machine,
    'Jinx',
    r.model,
    r.totalTokens,
    r.totalCost.toFixed(2),
    `${r.pctOfTotal}%`,
  ])
  exportCsv(`openclaw-machine-usage-${days}d.csv`, headers, rows)
}

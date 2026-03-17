import { FileText, FolderOpen } from 'lucide-react'
import clsx from 'clsx'
import { agentMemoryFiles } from '../../data/agentDetailMock'

function fileIcon(name) {
  if (name.endsWith('.json')) return '{ }'
  if (name.endsWith('.md')) return 'md'
  if (name.endsWith('.yaml') || name.endsWith('.yml')) return 'yml'
  return '—'
}

function fileTypeColor(name) {
  if (name.endsWith('.json')) return 'text-provider-openai'
  if (name.endsWith('.md')) return 'text-accent'
  if (name.endsWith('.yaml') || name.endsWith('.yml')) return 'text-provider-anthropic'
  return 'text-gray-600'
}

export default function AgentMemoryTab({ agentId }) {
  const files = agentMemoryFiles[agentId] || []

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-600">
        <FolderOpen className="mb-2 h-8 w-8" />
        <p className="text-sm">No memory files found.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] text-gray-500">
          {files.length} file{files.length !== 1 && 's'} in workspace
        </p>
      </div>

      {/* File header */}
      <div className="grid grid-cols-[auto_1fr_80px_140px] items-center gap-3 border-b border-surface-800 px-1 pb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
        <span className="w-8" />
        <span>File</span>
        <span className="text-right">Size</span>
        <span className="text-right">Modified</span>
      </div>

      {/* File rows */}
      <div className="divide-y divide-surface-800/50">
        {files.map((file) => (
          <div
            key={file.name}
            className="group grid grid-cols-[auto_1fr_80px_140px] items-center gap-3 px-1 py-2.5 transition-colors hover:bg-surface-800/30"
          >
            {/* Type icon */}
            <span
              className={clsx(
                'flex h-7 w-8 items-center justify-center rounded text-[9px] font-bold',
                fileTypeColor(file.name)
              )}
            >
              {fileIcon(file.name)}
            </span>

            {/* Name */}
            <div className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-gray-300 group-hover:text-gray-100">
                {file.name}
              </span>
            </div>

            {/* Size */}
            <span className="text-right text-xs text-gray-500">{file.size}</span>

            {/* Modified */}
            <span className="text-right text-xs text-gray-500">{file.modified}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

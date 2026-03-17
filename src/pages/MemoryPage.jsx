import { useState, useEffect, useMemo } from 'react'
import { Database, Search, MessageSquare, Calendar, ExternalLink, ChevronRight, Loader2, AlertCircle } from 'lucide-react'
import clsx from 'clsx'
import { useMemory } from '../hooks/useMemory'
import { formatRelativeTime } from '../utils/formatters'

export default function MemoryPage() {
  const { search, listConversations, getConversation, loading, error } = useMemory()
  
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'detail'

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  async function loadConversations() {
    const results = await listConversations({ limit: 100 })
    setConversations(results)
  }

  async function handleSearch(e) {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    const results = await search(searchQuery, { limit: 50, includeAttachments: true })
    setSearchResults(results)
    setIsSearching(false)
  }

  async function handleSelectConversation(id) {
    const data = await getConversation(id)
    setSelectedConversation(data)
    setViewMode('detail')
  }

  const displayedConversations = searchQuery.trim() && searchResults.length > 0
    ? searchResults.map(r => ({
        id: r.conversation_id,
        title: r.conversation_title,
        created_at: r.timestamp,
        message_count: 0,
        snippet: r.content?.slice(0, 200),
      }))
    : conversations

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-gray-100">Memory</h1>
          <p className="text-sm text-gray-400">
            Browse conversation history and search across {conversations.length.toLocaleString()} conversations
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations and attachments..."
            className="w-full rounded-lg border border-surface-600 bg-surface-800 py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-500" />
          )}
        </div>
        {searchQuery && (
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setSearchResults([]) }}
            className="mt-2 text-xs text-gray-500 hover:text-gray-400"
          >
            Clear search
          </button>
        )}
      </form>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-status-offline/20 bg-status-offline/10 p-3 text-sm text-status-offline">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Conversation List */}
        <div className={clsx(
          'flex flex-col overflow-hidden rounded-xl border border-surface-600 bg-surface-700',
          viewMode === 'detail' ? 'w-80' : 'flex-1'
        )}>
          <div className="border-b border-surface-600 px-4 py-3">
            <h2 className="text-sm font-medium text-gray-300">
              {searchQuery ? `Search Results (${displayedConversations.length})` : 'All Conversations'}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && conversations.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-gray-500">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading conversations...
              </div>
            ) : displayedConversations.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-gray-500">
                <Database className="mr-2 h-4 w-4" />
                No conversations found
              </div>
            ) : (
              displayedConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={clsx(
                    'w-full border-b border-surface-600 px-4 py-3 text-left transition-colors hover:bg-surface-600/50',
                    selectedConversation?.conversation?.id === conv.id && 'bg-accent/10'
                  )}
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium text-gray-200 line-clamp-1">
                      {conv.title || 'Untitled Conversation'}
                    </h3>
                    {conv.message_count > 0 && (
                      <span className="text-xs text-gray-500">{conv.message_count} msgs</span>
                    )}
                  </div>
                  {conv.snippet && (
                    <p className="mb-1.5 text-xs text-gray-400 line-clamp-2">{conv.snippet}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {conv.message_count > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {conv.message_count} messages
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatRelativeTime(conv.created_at)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Conversation Detail */}
        {viewMode === 'detail' && selectedConversation && (
          <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-surface-600 bg-surface-700">
            {/* Detail Header */}
            <div className="border-b border-surface-600 px-4 py-3">
              <h2 className="mb-1 text-sm font-medium text-gray-200">
                {selectedConversation.conversation.title}
              </h2>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{formatRelativeTime(selectedConversation.conversation.created_at)}</span>
                <span>•</span>
                <span>{selectedConversation.messages.length} messages</span>
                {selectedConversation.attachments.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{selectedConversation.attachments.length} attachments</span>
                  </>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedConversation.attachments.length > 0 && (
                <div className="mb-4 rounded-lg border border-surface-600 bg-surface-800 p-3">
                  <h3 className="mb-2 text-xs font-medium text-gray-400">Attachments</h3>
                  <div className="space-y-1.5">
                    {selectedConversation.attachments.map((att) => (
                      <div key={att.id} className="flex items-center gap-2 text-xs">
                        <ExternalLink className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-300">{att.filename || att.url}</span>
                        {att.description && (
                          <span className="text-gray-500">— {att.description}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {selectedConversation.messages.map((msg, idx) => (
                  <div key={idx} className={clsx(
                    'rounded-lg p-3',
                    msg.role === 'user' 
                      ? 'bg-accent/10 border border-accent/20' 
                      : 'bg-surface-800 border border-surface-600'
                  )}>
                    <div className="mb-1 flex items-center gap-2 text-xs">
                      <span className={clsx(
                        'font-medium',
                        msg.role === 'user' ? 'text-accent' : 'text-gray-400'
                      )}>
                        {msg.role === 'user' ? 'You' : 'Assistant'}
                      </span>
                      {msg.timestamp && (
                        <span className="text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-300 whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

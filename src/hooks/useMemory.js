import { useState, useCallback } from 'react'

const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001'

export function useMemory() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Search conversations and attachments
   * @param {string} query - Search query
   * @param {object} options - { limit: 20, includeAttachments: false }
   * @returns {Promise<Array>} - Search results
   */
  const search = useCallback(async (query, options = {}) => {
    const { limit = 20, includeAttachments = false } = options
    
    if (!query || !query.trim()) {
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        limit: String(limit),
      })
      
      if (includeAttachments) {
        params.set('attachments', 'true')
      }

      const resp = await fetch(`${PROXY_URL}/api/memory/search?${params}`)
      const data = await resp.json()

      if (!data.ok) {
        throw new Error(data.error || 'Search failed')
      }

      return data.results || []
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * List conversations with pagination
   * @param {object} options - { limit: 50, offset: 0 }
   * @returns {Promise<Array>} - Conversation list
   */
  const listConversations = useCallback(async (options = {}) => {
    const { limit = 50, offset = 0 } = options

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      })

      const resp = await fetch(`${PROXY_URL}/api/memory/conversations?${params}`)
      const data = await resp.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to load conversations')
      }

      return data.conversations || []
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Get a single conversation with messages and attachments
   * @param {string} id - Conversation ID
   * @returns {Promise<object>} - { conversation, messages, attachments }
   */
  const getConversation = useCallback(async (id) => {
    if (!id) {
      throw new Error('Conversation ID required')
    }

    setLoading(true)
    setError(null)

    try {
      const resp = await fetch(`${PROXY_URL}/api/memory/conversation/${id}`)
      const data = await resp.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to load conversation')
      }

      return {
        conversation: data.conversation,
        messages: data.messages || [],
        attachments: data.attachments || [],
      }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Save a conversation to memory
   * @param {object} conversation - { title, source, messages: [...] }
   * @returns {Promise<string>} - Conversation ID
   */
  const saveConversation = useCallback(async (conversation) => {
    if (!conversation.title || !conversation.messages) {
      throw new Error('title and messages required')
    }

    setLoading(true)
    setError(null)

    try {
      const resp = await fetch(`${PROXY_URL}/api/memory/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversation),
      })

      const data = await resp.json()

      if (!data.ok) {
        throw new Error(data.error || 'Failed to save conversation')
      }

      return data.conversationId
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    search,
    listConversations,
    getConversation,
    saveConversation,
    loading,
    error,
  }
}

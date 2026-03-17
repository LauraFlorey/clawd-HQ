/**
 * ChatPage.jsx — Jinx Conversation Interface
 * Route: /chat
 *
 * Wires directly to the existing /api/chat proxy endpoint which calls
 * `openclaw agent` with session continuity. Includes:
 *   - Live token counter with cost estimate
 *   - Session budget awareness
 *   - End Session → writes to memory via /api/memory/save
 *   - Machine selector (MacBook vs Mac Mini)
 *   - Streaming-style UX (polling response)
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bot, Send, Square, Brain, DollarSign, Clock, Zap, ChevronDown, AlertTriangle, CheckCircle } from 'lucide-react'

// ── Constants ──────────────────────────────────────────────────────────────

const PROXY_URL = import.meta.env.VITE_PROXY_URL || 'http://localhost:3001'

// Approximate costs per 1M tokens (Sonnet 4.5)
const COST_PER_M_INPUT = 3.0
const COST_PER_M_OUTPUT = 15.0

// Weekly budget soft limit (configurable)
const SESSION_BUDGET_USD = 2.0

// ── Helpers ────────────────────────────────────────────────────────────────

function generateSessionId() {
  return `dashboard-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function estimateCost(inputTokens, outputTokens) {
  return (inputTokens / 1_000_000) * COST_PER_M_INPUT +
         (outputTokens / 1_000_000) * COST_PER_M_OUTPUT
}

function formatCost(usd) {
  if (usd < 0.001) return '<$0.001'
  return `$${usd.toFixed(3)}`
}

function formatDuration(ms) {
  if (!ms) return null
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

// ── Token Badge ────────────────────────────────────────────────────────────

function TokenBadge({ usage, durationMs }) {
  if (!usage) return null
  const cost = estimateCost(usage.input_tokens || 0, usage.output_tokens || 0)
  return (
    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 pl-1">
      <span className="flex items-center gap-1">
        <Zap size={10} className="text-amber-500" />
        {(usage.input_tokens || 0).toLocaleString()} in / {(usage.output_tokens || 0).toLocaleString()} out
      </span>
      <span className="flex items-center gap-1">
        <DollarSign size={10} className="text-emerald-500" />
        {formatCost(cost)}
      </span>
      {durationMs && (
        <span className="flex items-center gap-1">
          <Clock size={10} />
          {formatDuration(durationMs)}
        </span>
      )}
    </div>
  )
}

// ── Message Bubble ─────────────────────────────────────────────────────────

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  const isSystem = msg.role === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-slate-500 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/40">
          {msg.content}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1`}>
      {!isUser && (
        <div className="flex items-center gap-2 pl-1 mb-0.5">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Bot size={11} className="text-white" />
          </div>
          <span className="text-xs font-medium text-blue-400 tracking-wide">JINX</span>
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-blue-600/90 text-white rounded-tr-sm'
            : 'bg-slate-800/80 text-slate-100 border border-slate-700/50 rounded-tl-sm'
        }`}
      >
        {msg.content}
      </div>
      {msg.usage && <TokenBadge usage={msg.usage} durationMs={msg.durationMs} />}
    </div>
  )
}

// ── Typing Indicator ───────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2 pl-1">
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot size={11} className="text-white" />
      </div>
      <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-blue-400"
              style={{
                animation: 'bounce 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Session Stats Bar ──────────────────────────────────────────────────────

function SessionStatsBar({ totalCost, totalInput, totalOutput, messageCount }) {
  const budgetPct = Math.min(100, (totalCost / SESSION_BUDGET_USD) * 100)
  const budgetColor = budgetPct > 80 ? 'bg-red-500' : budgetPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-slate-900/60 border-b border-slate-700/40 text-xs text-slate-400">
      <div className="flex items-center gap-2 flex-1">
        <span>Session budget</span>
        <div className="flex-1 max-w-32 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${budgetColor}`}
            style={{ width: `${budgetPct}%` }}
          />
        </div>
        <span className={budgetPct > 80 ? 'text-red-400' : 'text-slate-400'}>
          {formatCost(totalCost)} / {formatCost(SESSION_BUDGET_USD)}
        </span>
      </div>
      <div className="flex items-center gap-3 text-slate-500">
        <span>{totalInput.toLocaleString()} in</span>
        <span>{totalOutput.toLocaleString()} out</span>
        <span>{messageCount} exchanges</span>
      </div>
    </div>
  )
}

// ── End Session Modal ──────────────────────────────────────────────────────

function EndSessionModal({ onConfirm, onCancel, saving }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <Brain size={20} className="text-blue-400" />
          <h3 className="text-white font-semibold">End Session</h3>
        </div>
        <p className="text-slate-300 text-sm mb-2">
          Save this conversation to Jinx's memory before closing?
        </p>
        <p className="text-slate-500 text-xs mb-6">
          This writes the session to <code className="text-slate-400">jinx_memory.db</code> via <code className="text-slate-400">add_to_memory.py</code> so Jinx can recall it in future sessions.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Brain size={14} />
                Save to Memory
              </>
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={saving}
            className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-sm font-medium py-2.5 rounded-xl transition-colors border border-slate-700"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Chat Page ─────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(generateSessionId)
  const [showEndModal, setShowEndModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [error, setError] = useState(null)

  // Cumulative session stats
  const [totalInput, setTotalInput] = useState(0)
  const [totalOutput, setTotalOutput] = useState(0)
  const [exchangeCount, setExchangeCount] = useState(0)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const textareaRef = useRef(null)

  const totalCost = estimateCost(totalInput, totalOutput)

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInput(e.target.value)
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
    }
  }

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setError(null)

    // Optimistically add user message
    setMessages(prev => [...prev, { role: 'user', content: text, id: Date.now() }])
    setLoading(true)

    try {
      const resp = await fetch(`${PROXY_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      })

      const data = await resp.json()

      if (!data.ok) {
        setError(data.error || 'Jinx did not respond')
        setMessages(prev => [...prev, {
          role: 'system',
          content: `⚠ Error: ${data.error || 'No response'}`,
          id: Date.now(),
        }])
        return
      }

      // Track usage
      if (data.usage) {
        setTotalInput(t => t + (data.usage.input_tokens || 0))
        setTotalOutput(t => t + (data.usage.output_tokens || 0))
      }
      setExchangeCount(c => c + 1)

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content,
        usage: data.usage,
        durationMs: data.durationMs,
        id: Date.now(),
      }])
    } catch (err) {
      setError('Could not reach the proxy server. Is npm run dev running?')
      setMessages(prev => [...prev, {
        role: 'system',
        content: '⚠ Could not reach proxy. Check that the dev server is running.',
        id: Date.now(),
      }])
    } finally {
      setLoading(false)
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [input, loading, sessionId])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Save session to Jinx's memory
  const saveToMemory = async () => {
    setSaving(true)
    try {
      const conversationMessages = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }))

      const resp = await fetch(`${PROXY_URL}/api/memory/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Dashboard chat — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
          messages: conversationMessages,
          sessionId,
        }),
      })

      const data = await resp.json()
      if (data.ok) {
        setSavedOk(true)
        setShowEndModal(false)
        setMessages(prev => [...prev, {
          role: 'system',
          content: '✓ Session saved to Jinx\'s memory.',
          id: Date.now(),
        }])
      } else {
        setError(data.error || 'Memory save failed')
        setShowEndModal(false)
      }
    } catch {
      setError('Memory save failed — check proxy connection')
      setShowEndModal(false)
    } finally {
      setSaving(false)
    }
  }

  const discardSession = () => {
    setShowEndModal(false)
    setMessages(prev => [...prev, {
      role: 'system',
      content: 'Session ended without saving.',
      id: Date.now(),
    }])
  }

  const isEmpty = messages.length === 0

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        .chat-scrollbar::-webkit-scrollbar { width: 4px; }
        .chat-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .chat-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
      `}</style>

      <div className="flex flex-col h-full bg-slate-950 text-slate-100">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Bot size={16} className="text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white tracking-wide">Jinx</div>
              <div className="text-xs text-slate-500">claude-sonnet · session {sessionId.slice(-6)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedOk && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full">
                <CheckCircle size={11} />
                Saved
              </div>
            )}
            {exchangeCount > 0 && (
              <button
                onClick={() => setShowEndModal(true)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-700"
              >
                <Square size={11} />
                End Session
              </button>
            )}
          </div>
        </div>

        {/* Stats bar — only shown when there's been activity */}
        {exchangeCount > 0 && (
          <SessionStatsBar
            totalCost={totalCost}
            totalInput={totalInput}
            totalOutput={totalOutput}
            messageCount={exchangeCount}
          />
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto chat-scrollbar px-4 py-6">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-400/10 border border-blue-500/20 flex items-center justify-center">
                <Bot size={28} className="text-blue-400" />
              </div>
              <div>
                <div className="text-white font-medium mb-1">Start a conversation with Jinx</div>
                <div className="text-slate-500 text-sm max-w-xs">
                  This session routes through OpenClaw with full memory access. Token costs shown per response.
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-2 w-full max-w-sm">
                {[
                  "What's been on your mind lately?",
                  "Check my memory for anything about the dashboard",
                  "What should I focus on today?",
                ].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion)
                      textareaRef.current?.focus()
                    }}
                    className="text-left text-xs text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 px-3 py-2 rounded-lg transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 max-w-3xl mx-auto">
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mb-2 flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
            <AlertTriangle size={12} />
            {error}
            <button onClick={() => setError(null)} className="ml-auto text-amber-400/60 hover:text-amber-400">×</button>
          </div>
        )}

        {/* Budget warning */}
        {totalCost > SESSION_BUDGET_USD * 0.8 && (
          <div className="mx-4 mb-2 flex items-center gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            <AlertTriangle size={12} />
            Approaching session budget ({formatCost(totalCost)} of {formatCost(SESSION_BUDGET_USD)}). Consider ending and saving.
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 px-4 pb-4 pt-2">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-2 bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-3 focus-within:border-blue-500/50 transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Talk to Jinx… (Enter to send, Shift+Enter for newline)"
                rows={1}
                className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none outline-none leading-relaxed"
                style={{ maxHeight: '160px', overflowY: 'auto' }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white"
              >
                <Send size={14} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1">
              <span className="text-xs text-slate-600">Routes through OpenClaw → openclaw agent</span>
              <span className="text-xs text-slate-600">Session cost: {formatCost(totalCost)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* End session modal */}
      {showEndModal && (
        <EndSessionModal
          onConfirm={saveToMemory}
          onCancel={discardSession}
          saving={saving}
        />
      )}
    </>
  )
}

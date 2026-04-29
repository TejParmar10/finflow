'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { Budget, Expense } from '@/types'

const SUGGESTIONS = [
  'How am I doing this month?',
  'Where am I overspending?',
  'How should I invest my savings?',
  'Will I exceed my budget this month?',
]

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AIChatProps {
  idToken: string
  budget: Budget | null
  expenses: Expense[]
  month: string
}

export function AIChat({ idToken, budget, expenses, month }: AIChatProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
    const context = {
      salary: budget?.salary ?? 0,
      budget,
      expenses: expenses.slice(0, 50),
      month,
      totalSpent,
    }

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ message: text, context }),
      })

      if (!res.ok) throw new Error('Failed')
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No stream')

      let aiContent = ''
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = new TextDecoder().decode(value)
        aiContent += chunk
        setMessages((prev) => {
          const copy = [...prev]
          copy[copy.length - 1] = { role: 'assistant', content: aiContent }
          return copy
        })
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I had trouble connecting. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 md:bottom-6 right-6 w-12 h-12 bg-accent-teal rounded-full flex items-center justify-center shadow-lg hover:bg-[#3bb5ad] transition-all z-50 active:scale-95"
      >
        {open ? <X size={20} className="text-white" /> : <MessageCircle size={20} className="text-white" />}
      </button>

      {open && (
        <div className="fixed bottom-36 md:bottom-20 right-6 w-80 h-[450px] bg-secondary border border-[rgba(255,255,255,0.1)] rounded-[16px] shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(255,255,255,0.07)]">
            <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
            <span className="text-sm font-medium text-text-primary">FinFlow AI</span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs text-text-muted mb-3">Ask me anything about your finances:</p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="w-full text-left text-xs px-3 py-2 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-lg text-text-muted hover:text-text-primary hover:border-accent-teal transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-accent-teal text-white'
                      : 'bg-[rgba(255,255,255,0.06)] text-text-primary'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-[rgba(255,255,255,0.06)] px-3 py-2 rounded-xl">
                  <div className="flex gap-1">
                    {[0, 0.2, 0.4].map((d) => (
                      <div key={d} className="w-1.5 h-1.5 bg-accent-teal rounded-full animate-bounce" style={{ animationDelay: `${d}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2 px-3 py-3 border-t border-[rgba(255,255,255,0.07)]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
              placeholder="Ask about your finances..."
              className="flex-1 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-teal"
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="w-8 h-8 bg-accent-teal rounded-lg flex items-center justify-center disabled:opacity-40 hover:bg-[#3bb5ad] transition-all flex-shrink-0"
            >
              <Send size={14} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

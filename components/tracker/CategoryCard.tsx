'use client'

import { Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { Expense } from '@/types'
import { Timestamp } from 'firebase/firestore'

const CATEGORY_META: Record<string, { emoji: string; label: string; suggestedPct: number; tip: string }> = {
  food:          { emoji: '🍜', label: 'Food & Groceries',  suggestedPct: 35, tip: 'Cook at home more often to save up to 40% on food costs' },
  transport:     { emoji: '🚇', label: 'Transport',          suggestedPct: 15, tip: 'Carpooling or public transit can cut transport costs significantly' },
  entertainment: { emoji: '🎬', label: 'Entertainment',      suggestedPct: 15, tip: 'Consider sharing streaming subscriptions with family' },
  health:        { emoji: '💊', label: 'Health',             suggestedPct: 15, tip: 'Prevention is cheaper than cure — invest in regular checkups' },
  shopping:      { emoji: '🛍️', label: 'Shopping',           suggestedPct: 10, tip: 'Wait 24h before non-essential purchases to avoid impulse buying' },
  utilities:     { emoji: '⚡', label: 'Utilities',          suggestedPct: 10, tip: 'Review your utility plans annually for better deals' },
  subscription:  { emoji: '🔄', label: 'Subscriptions',      suggestedPct: 5,  tip: 'Audit your subscriptions quarterly — cancel unused ones' },
  other:         { emoji: '📦', label: 'Other',              suggestedPct: 10, tip: 'Track miscellaneous spending to find hidden savings' },
}

interface CategoryCardProps {
  category: string
  expenses: Expense[]
  personalBudget: number
  onDelete: (id: string) => void
}

export function CategoryCard({ category, expenses, personalBudget, onDelete }: CategoryCardProps) {
  const meta = CATEGORY_META[category] ?? { emoji: '📦', label: category, suggestedPct: 10, tip: '' }
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const suggested = Math.round((personalBudget * meta.suggestedPct) / 100)
  const pct = suggested > 0 ? Math.min((total / suggested) * 100, 100) : 0
  const overBudget = total > suggested
  const barColor = pct > 100 ? '#FF6B6B' : pct > 80 ? '#FFE66D' : '#4ECDC4'

  const toDate = (ts: Timestamp | unknown): Date => {
    if (ts instanceof Timestamp) return ts.toDate()
    return new Date(ts as string)
  }

  return (
    <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[16px] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.emoji}</span>
          <div>
            <p className="text-sm font-medium text-text-primary">{meta.label}</p>
            <p className="text-xs text-text-muted">Suggested ₹{suggested.toLocaleString('en-IN')}</p>
          </div>
        </div>
        <p className={`text-base font-serif ${overBudget ? 'text-accent-coral' : 'text-text-primary'}`}>
          ₹{total.toLocaleString('en-IN')}
        </p>
      </div>

      <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>

      <p className="text-xs text-text-muted italic">{meta.tip}</p>

      {expenses.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-[rgba(255,255,255,0.04)] last:border-0 gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs text-text-primary truncate">{e.description}</span>
                {e.importedFrom === 'hdfc_statement' && (
                  <span className="text-[11px] text-[rgba(78,205,196,0.6)] border border-[rgba(78,205,196,0.2)] rounded-full px-1.5 py-0.5 leading-none flex-shrink-0">
                    Imported
                  </span>
                )}
                {e.isPersonalShare && (
                  <span className="text-[11px] text-[rgba(168,85,247,0.8)] border border-[rgba(168,85,247,0.25)] rounded-full px-1.5 py-0.5 leading-none flex-shrink-0">
                    Split
                  </span>
                )}
              </div>
              <span className="text-xs text-text-muted flex-shrink-0">{format(toDate(e.date), 'dd MMM')}</span>
              <span className="text-xs font-medium text-text-primary flex-shrink-0">₹{e.amount.toLocaleString('en-IN')}</span>
              <button onClick={() => onDelete(e.id)} className="text-text-muted hover:text-accent-coral transition-colors flex-shrink-0">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

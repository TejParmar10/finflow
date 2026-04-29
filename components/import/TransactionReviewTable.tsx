'use client'

import { useState } from 'react'
import { format, parse } from 'date-fns'
import { ParsedTransaction, ExpenseCategory } from '@/types'
import { Button } from '@/components/ui/Button'

const CATEGORIES: ExpenseCategory[] = ['food', 'transport', 'entertainment', 'health', 'shopping', 'utilities', 'subscription', 'other']

type FilterTab = 'all' | 'selected' | 'duplicates'

interface TransactionReviewTableProps {
  transactions: ParsedTransaction[]
  creditCount: number
  onTransactionsChange: (txs: ParsedTransaction[]) => void
  onImport: () => void
  onCancel: () => void
}

export function TransactionReviewTable({
  transactions,
  creditCount,
  onTransactionsChange,
  onImport,
  onCancel,
}: TransactionReviewTableProps) {
  const [filter, setFilter] = useState<FilterTab>('all')

  const selectAll = () => onTransactionsChange(transactions.map((t) => ({ ...t, selected: true })))
  const deselectAll = () => onTransactionsChange(transactions.map((t) => ({ ...t, selected: false })))
  const toggle = (idx: number) =>
    onTransactionsChange(transactions.map((t, i) => (i === idx ? { ...t, selected: !t.selected } : t)))
  const changeCategory = (idx: number, cat: ExpenseCategory) =>
    onTransactionsChange(transactions.map((t, i) => (i === idx ? { ...t, category: cat } : t)))
  const changeDescription = (idx: number, desc: string) =>
    onTransactionsChange(transactions.map((t, i) => (i === idx ? { ...t, description: desc } : t)))

  const filtered = transactions.filter((t) => {
    if (filter === 'selected') return t.selected
    if (filter === 'duplicates') return t.isDuplicate
    return true
  })

  const selectedCount = transactions.filter((t) => t.selected).length
  const selectedTotal = transactions.filter((t) => t.selected).reduce((s, t) => s + t.amount, 0)
  const dupCount = transactions.filter((t) => t.isDuplicate).length

  const fmtDate = (d: string) => {
    try {
      return format(parse(d, 'dd/MM/yyyy', new Date()), 'dd MMM yyyy')
    } catch { return d }
  }

  return (
    <div className="space-y-4">
      <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-primary">
          <span className="font-medium">{transactions.length}</span> transactions found ·{' '}
          <span className="text-accent-teal">₹{transactions.reduce((s, t) => s + t.amount, 0).toLocaleString('en-IN')}</span> total ·{' '}
          <span className="text-accent-yellow">{dupCount} duplicates</span>
        </p>
        <div className="flex gap-2">
          <button onClick={selectAll} className="text-xs text-accent-teal hover:underline">Select All</button>
          <span className="text-text-muted">·</span>
          <button onClick={deselectAll} className="text-xs text-text-muted hover:underline">Deselect All</button>
        </div>
      </div>

      <div className="flex gap-2">
        {(['all', 'selected', 'duplicates'] as FilterTab[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs transition-all ${filter === f ? 'bg-accent-teal text-white' : 'bg-[rgba(255,255,255,0.06)] text-text-muted'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <p className="text-xs text-text-muted">
        Showing {transactions.length} debit transactions. {creditCount} credit transactions (salary/transfers) are excluded.
      </p>

      <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.07)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)]">
              <th className="w-10 px-3 py-3" />
              <th className="px-3 py-3 text-left text-xs text-text-muted font-medium">Date</th>
              <th className="px-3 py-3 text-left text-xs text-text-muted font-medium">Description</th>
              <th className="px-3 py-3 text-left text-xs text-text-muted font-medium">Category</th>
              <th className="px-3 py-3 text-right text-xs text-text-muted font-medium">Amount</th>
              <th className="px-3 py-3 text-center text-xs text-text-muted font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx, idx) => {
              const realIdx = transactions.indexOf(tx)
              return (
                <tr key={realIdx} className={`border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)] ${tx.isDuplicate ? 'opacity-60' : ''}`}>
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={tx.selected}
                      onChange={() => toggle(realIdx)}
                      className="accent-accent-teal w-4 h-4"
                    />
                  </td>
                  <td className="px-3 py-3 text-text-muted whitespace-nowrap">{fmtDate(tx.date)}</td>
                  <td className="px-3 py-3">
                    <input
                      type="text"
                      value={tx.description}
                      onChange={(e) => changeDescription(realIdx, e.target.value)}
                      className="bg-transparent text-text-primary w-full focus:outline-none focus:bg-[rgba(255,255,255,0.04)] rounded px-1"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={tx.category}
                      onChange={(e) => changeCategory(realIdx, e.target.value as ExpenseCategory)}
                      className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded text-xs text-text-primary px-2 py-1"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-3 text-right font-medium text-text-primary">₹{tx.amount.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-3 text-center">
                    {tx.isDuplicate && (
                      <span className="text-xs bg-[rgba(255,230,109,0.1)] text-accent-yellow border border-[rgba(255,230,109,0.2)] rounded-full px-2 py-0.5">
                        Duplicate ⚠️
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          {selectedCount} selected · ₹{selectedTotal.toLocaleString('en-IN')} total
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button onClick={onImport} disabled={selectedCount === 0}>
            Import {selectedCount} Transactions
          </Button>
        </div>
      </div>
    </div>
  )
}

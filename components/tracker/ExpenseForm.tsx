'use client'

import { useState, FormEvent } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ExpenseCategory } from '@/types'
import toast from 'react-hot-toast'

const CATEGORIES: { value: ExpenseCategory; label: string; emoji: string }[] = [
  { value: 'food', label: 'Food', emoji: '🍜' },
  { value: 'transport', label: 'Transport', emoji: '🚇' },
  { value: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { value: 'health', label: 'Health', emoji: '💊' },
  { value: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { value: 'utilities', label: 'Utilities', emoji: '⚡' },
  { value: 'subscription', label: 'Subscription', emoji: '🔄' },
  { value: 'other', label: 'Other', emoji: '📦' },
]

interface ExpenseFormProps {
  onAdd: (data: {
    category: ExpenseCategory
    amount: number
    description: string
    date: string
  }) => Promise<void>
}

export function ExpenseForm({ onAdd }: ExpenseFormProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('food')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return }
    if (!description.trim()) { toast.error('Enter a description'); return }
    setLoading(true)
    try {
      await onAdd({ category, amount: Number(amount), description: description.trim(), date })
      setAmount('')
      setDescription('')
      toast.success('Expense added!')
    } catch {
      toast.error('Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Amount (₹)"
          type="number"
          min="1"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <Input
        label="Description"
        type="text"
        placeholder="What did you spend on?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div>
        <p className="text-xs text-[rgba(255,255,255,0.5)] font-medium uppercase tracking-wide mb-2">Category</p>
        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map(({ value, label, emoji }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-xs transition-all ${
                category === value
                  ? 'bg-[rgba(78,205,196,0.15)] border border-accent-teal text-accent-teal'
                  : 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] text-text-muted hover:border-[rgba(255,255,255,0.2)]'
              }`}
            >
              <span className="text-base">{emoji}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Adding...' : 'Add Expense'}
      </Button>
    </form>
  )
}

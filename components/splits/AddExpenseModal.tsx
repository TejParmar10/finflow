'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { format } from 'date-fns'
import { serverTimestamp, Timestamp } from 'firebase/firestore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SplitGroup, SplitExpense, SplitShare, ExpenseCategory } from '@/types'
import { addExpense } from '@/lib/firestore'
import toast from 'react-hot-toast'

type SplitType = 'equal' | 'percent' | 'exact'

interface AddExpenseModalProps {
  group: SplitGroup
  currentUid: string
  month: string
  onAdd: (groupId: string, data: Omit<SplitExpense, 'id'>) => Promise<string>
  onClose: () => void
}

export function AddExpenseModal({ group, currentUid, month, onAdd, onClose }: AddExpenseModalProps) {
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [paidBy, setPaidBy] = useState(currentUid)
  const [category, setCategory] = useState<ExpenseCategory>('food')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [splitType, setSplitType] = useState<SplitType>('equal')
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    group.members.map((m) => m.uid ?? m.displayName)
  )
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const total = parseFloat(amount) || 0
  const activeMemberCount = selectedMembers.length || 1

  const getMemberShare = (uid: string): number => {
    if (splitType === 'equal') return total / activeMemberCount
    if (splitType === 'percent') return (total * (parseFloat(customAmounts[uid] ?? '0'))) / 100
    return parseFloat(customAmounts[uid] ?? '0')
  }

  const toggleMember = (uid: string) => {
    setSelectedMembers((prev) =>
      prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid]
    )
  }

  const handleAdd = async () => {
    if (!desc.trim() || total <= 0) { toast.error('Enter description and amount'); return }
    if (selectedMembers.length === 0) { toast.error('Select at least one member'); return }

    const splits: SplitShare[] = selectedMembers.map((uid) => ({
      uid, amount: getMemberShare(uid),
      percent: total > 0 ? (getMemberShare(uid) / total) * 100 : 0,
      settled: uid === paidBy,
    }))

    setLoading(true)
    try {
      const expDate = new Date(date)
      await onAdd(group.id, {
        groupId: group.id, description: desc.trim(), amount: total,
        paidBy, category, splits,
        date: Timestamp.fromDate(expDate),
        createdAt: serverTimestamp() as unknown as Timestamp,
      })

      // Auto-track the current user's share in personal Tracker
      const myShare = splits.find((s) => s.uid === currentUid)
      if (myShare && myShare.amount > 0) {
        await addExpense(currentUid, {
          category, amount: myShare.amount,
          description: `[Split: ${group.name}] ${desc.trim()}`,
          date: Timestamp.fromDate(expDate),
          month, week: Math.ceil(expDate.getDate() / 7),
          aiCategorised: false,
          isPersonalShare: true, splitId: group.id,
          createdAt: serverTimestamp() as unknown as Timestamp,
        })
      }

      toast.success('Expense added!')
      onClose()
    } catch {
      toast.error('Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

  const CATEGORIES: ExpenseCategory[] = ['food', 'transport', 'entertainment', 'health', 'shopping', 'utilities', 'subscription', 'other']
  const CATEGORY_EMOJI: Record<string, string> = { food:'🍜', transport:'🚇', entertainment:'🎬', health:'💊', shopping:'🛍️', utilities:'⚡', subscription:'🔄', other:'📦' }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-secondary border border-[rgba(255,255,255,0.1)] rounded-[20px] w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-text-primary">Add Expense</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
        </div>

        <Input label="Description" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What was this for?" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Amount (₹)" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div>
          <p className="text-xs text-[rgba(255,255,255,0.5)] font-medium uppercase tracking-wide mb-2">Paid By</p>
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}
            className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-text-primary">
            {group.members.map((m) => (
              <option key={m.uid ?? m.displayName} value={m.uid ?? m.displayName}>{m.displayName}{m.uid === currentUid ? ' (you)' : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-xs text-[rgba(255,255,255,0.5)] font-medium uppercase tracking-wide mb-2">Category</p>
          <div className="grid grid-cols-4 gap-1.5">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)}
                className={`py-1.5 rounded-lg text-xs flex flex-col items-center gap-0.5 transition-all ${category === c ? 'bg-[rgba(78,205,196,0.15)] border border-accent-teal text-accent-teal' : 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] text-text-muted'}`}>
                <span>{CATEGORY_EMOJI[c]}</span>{c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-[rgba(255,255,255,0.5)] font-medium uppercase tracking-wide mb-2">Split</p>
          <div className="flex gap-2 mb-3">
            {(['equal', 'percent', 'exact'] as SplitType[]).map((t) => (
              <button key={t} onClick={() => setSplitType(t)}
                className={`flex-1 py-1.5 rounded-lg text-xs capitalize transition-all ${splitType === t ? 'bg-accent-teal text-white' : 'bg-[rgba(255,255,255,0.06)] text-text-muted'}`}>
                {t === 'equal' ? 'Equal' : t === 'percent' ? 'By %' : 'By ₹'}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {group.members.map((m) => {
              const uid = m.uid ?? m.displayName
              const checked = selectedMembers.includes(uid)
              return (
                <div key={uid} className="flex items-center gap-2">
                  <input type="checkbox" checked={checked} onChange={() => toggleMember(uid)} className="accent-accent-teal" />
                  <span className="flex-1 text-sm text-text-primary">{m.displayName}{m.uid === currentUid ? ' (you)' : ''}</span>
                  {splitType === 'equal'
                    ? <span className="text-xs text-text-muted">₹{checked ? (total / activeMemberCount).toLocaleString('en-IN') : '0'}</span>
                    : <input type="number" placeholder={splitType === 'percent' ? '%' : '₹'}
                        value={customAmounts[uid] ?? ''} onChange={(e) => setCustomAmounts({ ...customAmounts, [uid]: e.target.value })}
                        className="w-20 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded px-2 py-1 text-xs text-text-primary text-right" />
                  }
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleAdd} disabled={loading} className="flex-1">
            {loading ? 'Adding...' : 'Add Expense'}
          </Button>
        </div>
      </div>
    </div>
  )
}

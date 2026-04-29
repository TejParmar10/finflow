'use client'

import { useState } from 'react'
import { differenceInWeeks } from 'date-fns'
import { Goal } from '@/types'
import { Timestamp } from 'firebase/firestore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

const CATEGORY_ICONS: Record<string, string> = {
  house: '🏠', vehicle: '🚗', travel: '✈️',
  education: '🎓', emergency: '🛡️', other: '🎯',
}

interface GoalCardProps {
  goal: Goal
  onAddProgress: (amount: number) => Promise<void>
}

export function GoalCard({ goal, onAddProgress }: GoalCardProps) {
  const [adding, setAdding] = useState(false)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const pct = goal.targetAmount > 0 ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100) : 0
  const completed = pct >= 100
  const deadline = goal.deadline instanceof Timestamp ? goal.deadline.toDate() : new Date(goal.deadline as unknown as string)
  const weeksLeft = Math.max(0, differenceInWeeks(deadline, new Date()))

  const handleProgress = async () => {
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return }
    setLoading(true)
    try {
      await onAddProgress(Number(amount))
      setAmount('')
      setAdding(false)
      toast.success('Progress saved!')
    } catch {
      toast.error('Failed to update progress')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`bg-[rgba(255,255,255,0.04)] border rounded-[16px] p-5 space-y-4 transition-all ${completed ? 'border-accent-green' : 'border-[rgba(255,255,255,0.07)]'}`}>
      {completed && (
        <div className="text-center py-1">
          <span className="text-2xl">🎉</span>
          <p className="text-xs text-accent-green font-medium mt-1">Goal Complete!</p>
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{CATEGORY_ICONS[goal.category] ?? '🎯'}</span>
          <div>
            <p className="text-sm font-medium text-text-primary">{goal.title}</p>
            <p className="text-xs text-text-muted">{weeksLeft} weeks left</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-serif text-text-primary">₹{goal.savedAmount.toLocaleString('en-IN')}</p>
          <p className="text-xs text-text-muted">of ₹{goal.targetAmount.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs text-text-muted mb-1">
          <span>{Math.round(pct)}% saved</span>
          <span>₹{(goal.targetAmount - goal.savedAmount).toLocaleString('en-IN')} to go</span>
        </div>
        <div className="h-2 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: completed ? '#00C896' : '#4ECDC4' }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">Weekly target: <span className="text-accent-teal">₹{goal.weeklyTarget.toLocaleString('en-IN')}</span></p>
        {!completed && (
          <Button variant="secondary" size="sm" onClick={() => setAdding(!adding)}>
            Add Progress
          </Button>
        )}
      </div>

      {adding && (
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1"
          />
          <Button size="sm" onClick={handleProgress} disabled={loading}>
            {loading ? '...' : 'Save'}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
        </div>
      )}
    </div>
  )
}

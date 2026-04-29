'use client'

import { useState, FormEvent } from 'react'
import { format, addDays } from 'date-fns'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

const GOAL_CATEGORIES = [
  { value: 'house', label: '🏠 House' },
  { value: 'vehicle', label: '🚗 Vehicle' },
  { value: 'travel', label: '✈️ Travel' },
  { value: 'education', label: '🎓 Education' },
  { value: 'emergency', label: '🛡️ Emergency' },
  { value: 'other', label: '🎯 Other' },
]

interface GoalFormProps {
  onSave: (data: { title: string; targetAmount: number; deadline: string; category: string; weeklyTarget: number }) => Promise<void>
}

export function GoalForm({ onSave }: GoalFormProps) {
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('')
  const [deadline, setDeadline] = useState(format(addDays(new Date(), 90), 'yyyy-MM-dd'))
  const [category, setCategory] = useState('other')
  const [loading, setLoading] = useState(false)

  const weeksUntil = Math.max(1, Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7)))
  const weeklyTarget = target ? Math.ceil(Number(target) / weeksUntil) : 0

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) { toast.error('Enter a goal name'); return }
    if (!target || Number(target) <= 0) { toast.error('Enter a valid target amount'); return }
    setLoading(true)
    try {
      await onSave({ title: title.trim(), targetAmount: Number(target), deadline, category, weeklyTarget })
      setTitle(''); setTarget('')
      toast.success('Goal created!')
    } catch {
      toast.error('Failed to create goal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Goal Name" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Emergency Fund" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Target Amount (₹)" type="number" min="1" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0" />
        <Input label="Deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      </div>
      <div>
        <p className="text-xs text-[rgba(255,255,255,0.5)] font-medium uppercase tracking-wide mb-2">Category</p>
        <div className="grid grid-cols-3 gap-2">
          {GOAL_CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={`py-2 px-3 rounded-lg text-xs text-left transition-all ${
                category === value
                  ? 'bg-[rgba(78,205,196,0.15)] border border-accent-teal text-accent-teal'
                  : 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] text-text-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {weeklyTarget > 0 && (
        <p className="text-xs text-accent-teal bg-[rgba(78,205,196,0.08)] border border-[rgba(78,205,196,0.15)] rounded-lg px-3 py-2">
          Weekly target: ₹{weeklyTarget.toLocaleString('en-IN')} for {weeksUntil} weeks
        </p>
      )}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating...' : 'Create Goal'}
      </Button>
    </form>
  )
}

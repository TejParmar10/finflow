'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ContactPicker } from './ContactPicker'
import { SplitGroup, SplitMember } from '@/types'
import { serverTimestamp, Timestamp } from 'firebase/firestore'
import toast from 'react-hot-toast'

type Category = SplitGroup['category']
const CATS: { value: Category; label: string; emoji: string }[] = [
  { value: 'trip', label: 'Trip', emoji: '✈️' },
  { value: 'home', label: 'Home', emoji: '🏠' },
  { value: 'food', label: 'Food', emoji: '🍜' },
  { value: 'other', label: 'Other', emoji: '📦' },
]

interface CreateGroupModalProps {
  currentUid: string
  currentDisplayName: string
  currentPhotoURL?: string
  onClose: () => void
  onCreate: (data: Omit<SplitGroup, 'id'>) => Promise<string>
}

export function CreateGroupModal({ currentUid, currentDisplayName, currentPhotoURL, onClose, onCreate }: CreateGroupModalProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('trip')
  const [members, setMembers] = useState<SplitMember[]>([])
  const [loading, setLoading] = useState(false)

  const me: SplitMember = { uid: currentUid, displayName: currentDisplayName, photoURL: currentPhotoURL, isFinFlowUser: true }

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Enter a group name'); return }
    setLoading(true)
    try {
      const allMembers = [me, ...members.filter((m) => m.uid !== currentUid)]
      await onCreate({
        name: name.trim(), category,
        createdBy: currentUid, members: allMembers,
        totalExpenses: 0, isActive: true,
        createdAt: serverTimestamp() as unknown as Timestamp,
        updatedAt: serverTimestamp() as unknown as Timestamp,
      })
      toast.success('Group created!')
      onClose()
    } catch (e) {
      console.error('[CreateGroup] error:', e)
      toast.error('Failed to create group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-secondary border border-[rgba(255,255,255,0.1)] rounded-[20px] w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-text-primary">New Group</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
        </div>

        <Input label="Group Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Goa Trip 2026" />

        <div>
          <p className="text-xs text-[rgba(255,255,255,0.5)] font-medium uppercase tracking-wide mb-2">Category</p>
          <div className="grid grid-cols-4 gap-2">
            {CATS.map(({ value, label, emoji }) => (
              <button key={value} type="button" onClick={() => setCategory(value)}
                className={`py-2 rounded-lg text-xs transition-all flex flex-col items-center gap-1 ${category === value ? 'bg-[rgba(78,205,196,0.15)] border border-accent-teal text-accent-teal' : 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] text-text-muted'}`}>
                <span className="text-base">{emoji}</span>{label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-[rgba(255,255,255,0.5)] font-medium uppercase tracking-wide mb-2">Add Members</p>
          <ContactPicker members={members} currentUid={currentUid} onChange={setMembers} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleCreate} disabled={loading} className="flex-1">
            {loading ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </div>
    </div>
  )
}

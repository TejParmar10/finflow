'use client'

import { useState } from 'react'
import { findUserByEmail } from '@/lib/firestore'
import { SplitMember } from '@/types'
import { Search, UserCheck, UserPlus, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface ContactPickerProps {
  members: SplitMember[]
  currentUid: string
  onChange: (members: SplitMember[]) => void
}

export function ContactPicker({ members, currentUid, onChange }: ContactPickerProps) {
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [manualName, setManualName] = useState('')

  const handleSearch = async () => {
    if (!search.trim()) return
    setSearching(true)
    try {
      const found = await findUserByEmail(search.trim())
      if (found) {
        if (members.some((m) => m.uid === found.uid)) { toast.error('Already added'); return }
        onChange([...members, {
          uid: found.uid, displayName: found.displayName,
          email: search.trim(), photoURL: found.photoURL,
          upiId: found.upiId, isFinFlowUser: true,
        }])
        setSearch('')
      } else {
        toast.error('No FinFlow user with that email. Add manually below.')
      }
    } catch {
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }

  const addManual = () => {
    if (!manualName.trim()) { toast.error('Enter a name'); return }
    onChange([...members, {
      uid: null, displayName: manualName.trim(),
      isFinFlowUser: false,
    }])
    setManualName('')
  }

  const remove = (idx: number) => {
    onChange(members.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button size="sm" onClick={handleSearch} disabled={searching}>
          <Search size={14} />
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add by name (no account)"
          value={manualName}
          onChange={(e) => setManualName(e.target.value)}
          className="flex-1"
        />
        <Button size="sm" variant="secondary" onClick={addManual}>
          <UserPlus size={14} />
        </Button>
      </div>

      {members.length > 0 && (
        <div className="space-y-2 mt-2">
          {members.map((m, i) => (
            <div key={i} className="flex items-center justify-between bg-[rgba(255,255,255,0.04)] rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                {m.isFinFlowUser
                  ? <UserCheck size={14} className="text-accent-green" />
                  : <UserPlus size={14} className="text-text-muted" />}
                <span className="text-sm text-text-primary">{m.displayName}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${m.isFinFlowUser ? 'bg-[rgba(0,200,150,0.15)] text-accent-green' : 'bg-[rgba(255,255,255,0.06)] text-text-muted'}`}>
                  {m.isFinFlowUser ? 'On FinFlow' : 'Not on FinFlow'}
                </span>
              </div>
              <button onClick={() => remove(i)} className="text-text-muted hover:text-accent-coral transition-colors">
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { SplitGroup } from '@/types'
import { GroupCard } from './GroupCard'
import { CreateGroupModal } from './CreateGroupModal'
import { Button } from '@/components/ui/Button'

interface SplitsHomeProps {
  groups: SplitGroup[]
  loading: boolean
  currentUid: string
  currentDisplayName: string
  currentPhotoURL?: string
  onCreateGroup: (data: Omit<SplitGroup, 'id'>) => Promise<string>
}

export function SplitsHome({ groups, loading, currentUid, currentDisplayName, currentPhotoURL, onCreateGroup }: SplitsHomeProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [firstVisit] = useState(() => typeof window !== 'undefined' && !localStorage.getItem('splits_visited'))

  if (typeof window !== 'undefined') localStorage.setItem('splits_visited', '1')

  // Compute totals across all groups
  const totalSpent = groups.reduce((s, g) => s + (g.totalExpenses ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Groups', value: groups.length.toString(), color: 'text-text-primary' },
          { label: 'Total Spent', value: `₹${totalSpent.toLocaleString('en-IN')}`, color: 'text-accent-teal' },
          { label: 'Active', value: groups.filter((g) => g.isActive).length.toString(), color: 'text-accent-green' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-xl p-4 text-center">
            <p className="text-xs text-text-muted mb-1">{label}</p>
            <p className={`text-xl font-serif ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Groups grid */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">Your Groups</h2>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2">
          <Plus size={14} /> New Group
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="h-36 bg-[rgba(255,255,255,0.04)] rounded-[16px] animate-pulse" />)}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">👥</p>
          <p className="text-text-primary font-medium">No groups yet</p>
          <p className="text-sm text-text-muted">Create a group to start splitting expenses with friends</p>
          <Button onClick={() => setShowCreate(true)} className="gap-2 mt-2">
            <Plus size={14} /> Create First Group
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((g) => <GroupCard key={g.id} group={g} currentUid={currentUid} />)}
        </div>
      )}

      {showCreate && (
        <CreateGroupModal
          currentUid={currentUid}
          currentDisplayName={currentDisplayName}
          currentPhotoURL={currentPhotoURL}
          onClose={() => setShowCreate(false)}
          onCreate={async (data) => {
            const id = await onCreateGroup(data)
            setShowCreate(false)
            return id
          }}
        />
      )}
    </div>
  )
}

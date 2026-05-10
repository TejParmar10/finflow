'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { Timestamp } from 'firebase/firestore'
import { SplitGroup } from '@/types'
import { Users, Plane, Home, Utensils, MoreHorizontal } from 'lucide-react'

const CATEGORY_ICON: Record<string, React.ElementType> = {
  trip: Plane, home: Home, food: Utensils, other: MoreHorizontal,
}
const CATEGORY_COLOR: Record<string, string> = {
  trip: 'text-accent-teal bg-[rgba(78,205,196,0.12)]',
  home: 'text-accent-yellow bg-[rgba(255,230,109,0.12)]',
  food: 'text-accent-coral bg-[rgba(255,107,107,0.12)]',
  other: 'text-text-muted bg-[rgba(255,255,255,0.06)]',
}

interface GroupCardProps {
  group: SplitGroup
  currentUid: string
}

export function GroupCard({ group, currentUid }: GroupCardProps) {
  const Icon = CATEGORY_ICON[group.category] ?? MoreHorizontal
  const colorClass = CATEGORY_COLOR[group.category] ?? CATEGORY_COLOR.other
  const createdAt = group.createdAt instanceof Timestamp ? group.createdAt.toDate() : new Date(group.createdAt as any)
  const visibleMembers = group.members?.slice(0, 4) ?? []
  const overflow = (group.members?.length ?? 0) - 4

  return (
    <Link href={`/splits/${group.id}`}>
      <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[16px] p-5 hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{group.name}</p>
              <p className="text-xs text-text-muted capitalize">{group.category} · {format(createdAt, 'dd MMM yyyy')}</p>
            </div>
          </div>
          {!group.isActive && (
            <span className="text-[10px] bg-[rgba(255,255,255,0.06)] text-text-muted px-2 py-0.5 rounded-full">Settled</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {visibleMembers.map((m, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-accent-teal border-2 border-primary flex items-center justify-center text-[10px] text-white font-medium">
                {m.photoURL
                  ? <img src={m.photoURL} alt={m.displayName} className="w-full h-full rounded-full object-cover" />
                  : m.displayName[0]?.toUpperCase()}
              </div>
            ))}
            {overflow > 0 && (
              <div className="w-7 h-7 rounded-full bg-[rgba(255,255,255,0.1)] border-2 border-primary flex items-center justify-center text-[10px] text-text-muted">
                +{overflow}
              </div>
            )}
          </div>
          <div className="text-right">
            <p className="text-base font-serif text-text-primary">₹{(group.totalExpenses ?? 0).toLocaleString('en-IN')}</p>
            <p className="text-xs text-text-muted">total spent</p>
          </div>
        </div>
      </div>
    </Link>
  )
}

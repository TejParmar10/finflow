'use client'

import { Bell } from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/useAuth'

interface TopBarProps {
  alertCount?: number
}

export function TopBar({ alertCount = 0 }: TopBarProps) {
  const { user } = useAuth()
  const now = new Date()

  return (
    <header className="fixed top-0 left-0 md:left-60 right-0 h-14 bg-secondary border-b border-[rgba(255,255,255,0.05)] z-30 flex items-center justify-between px-6">
      <p className="text-sm text-text-muted font-medium">{format(now, 'MMMM yyyy')}</p>
      <div className="flex items-center gap-4">
        <button className="relative text-text-muted hover:text-text-primary transition-colors">
          <Bell size={18} />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-coral rounded-full text-[10px] text-white flex items-center justify-center font-medium">
              {alertCount}
            </span>
          )}
        </button>
        {user?.photoURL ? (
          <Image src={user.photoURL} alt="avatar" width={28} height={28} className="rounded-full" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-accent-teal flex items-center justify-center text-white text-xs font-medium">
            {user?.displayName?.[0] ?? 'U'}
          </div>
        )}
      </div>
    </header>
  )
}

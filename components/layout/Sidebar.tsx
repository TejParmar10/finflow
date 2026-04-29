'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutGrid,
  Target,
  Upload,
  BarChart2,
  Flag,
  FileText,
  LogOut,
} from 'lucide-react'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'

const NAV = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { href: '/tracker', icon: Target, label: 'Tracker' },
  { href: '/import', icon: Upload, label: 'Import Statement' },
  { href: '/insights', icon: BarChart2, label: 'Insights' },
  { href: '/goals', icon: Flag, label: 'Goals' },
  { href: '/report', icon: FileText, label: 'Report' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-60 bg-secondary border-r border-[rgba(255,255,255,0.05)] z-40">
        <div className="px-6 py-6 border-b border-[rgba(255,255,255,0.05)]">
          <span className="font-serif text-2xl text-text-primary">FinFlow</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                  active
                    ? 'border-l-2 border-accent-teal text-accent-teal bg-[rgba(78,205,196,0.08)] pl-[10px]'
                    : 'text-[rgba(255,255,255,0.5)] hover:text-text-primary hover:bg-[rgba(255,255,255,0.04)]'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="px-4 py-4 border-t border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-3 mb-3">
            {user?.photoURL ? (
              <Image src={user.photoURL} alt="avatar" width={32} height={32} className="rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-accent-teal flex items-center justify-center text-white text-sm font-medium">
                {user?.displayName?.[0] ?? 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate">{user?.displayName}</p>
              <p className="text-xs text-text-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-xs text-text-muted hover:text-accent-coral transition-colors w-full px-1 py-1"
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-secondary border-t border-[rgba(255,255,255,0.07)] z-40 flex">
        {NAV.slice(0, 5).map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors ${
                active ? 'text-accent-teal' : 'text-[rgba(255,255,255,0.4)]'
              }`}
            >
              <Icon size={20} />
              {label.split(' ')[0]}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

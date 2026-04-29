'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User as FirebaseUser } from 'firebase/auth'
import { onAuthChange } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { usePathname } from 'next/navigation'

interface AuthContextValue {
  user: FirebaseUser | null
  loading: boolean
}

export const AuthContext = createContext<AuthContextValue>({ user: null, loading: true })
export const useAuthContext = () => useContext(AuthContext)

const PUBLIC_PATHS = ['/', '/login']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith('/login'))
  const showLayout = !isPublic && user

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-accent-teal border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {showLayout ? (
        <div className="flex min-h-screen bg-primary">
          <Sidebar />
          <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
            <TopBar />
            <main className="flex-1 pt-14 pb-20 md:pb-6 px-4 md:px-6">
              {children}
            </main>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}

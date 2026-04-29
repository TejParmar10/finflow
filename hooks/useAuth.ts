'use client'

import { useState, useEffect } from 'react'
import { User as FirebaseUser } from 'firebase/auth'
import { onAuthChange, signInWithGoogle, signOut as firebaseSignOut } from '@/lib/auth'

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthChange((u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  return {
    user,
    loading,
    signInWithGoogle,
    signOut: firebaseSignOut,
  }
}

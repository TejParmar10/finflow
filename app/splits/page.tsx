'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useAuthContext } from '@/components/AuthProvider'
import { useSplits } from '@/hooks/useSplits'
import { SplitsHome } from '@/components/splits/SplitsHome'
import { AIChat } from '@/components/chat/AIChat'
import { useBudget } from '@/hooks/useBudget'
import { useExpenses } from '@/hooks/useExpenses'
import { useState } from 'react'

export default function SplitsPage() {
  const { user } = useAuthContext()
  const router = useRouter()
  const month = format(new Date(), 'yyyy-MM')
  const { groups, loading, createGroup } = useSplits(user?.uid ?? null)
  const { budget } = useBudget(user?.uid ?? null)
  const { expenses } = useExpenses(user?.uid ?? null, month)
  const [idToken, setIdToken] = useState('')

  useEffect(() => { if (!user) router.replace('/') }, [user, router])
  useEffect(() => { user?.getIdToken().then(setIdToken) }, [user])

  if (!user) return null

  return (
    <>
      <div className="max-w-4xl mx-auto py-6 space-y-6">
        <div>
          <h1 className="font-serif text-3xl text-text-primary">Splits</h1>
          <p className="text-sm text-text-muted mt-1">Split expenses with friends and family</p>
        </div>
        <SplitsHome
          groups={groups}
          loading={loading}
          currentUid={user.uid}
          currentDisplayName={user.displayName ?? ''}
          currentPhotoURL={user.photoURL ?? undefined}
          onCreateGroup={createGroup}
        />
      </div>
      {idToken && <AIChat idToken={idToken} budget={budget} expenses={expenses} month={month} />}
    </>
  )
}

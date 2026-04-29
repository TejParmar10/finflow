'use client'

import { useState, useEffect } from 'react'
import { Budget } from '@/types'
import { getBudget, saveBudget } from '@/lib/firestore'
import { format } from 'date-fns'

export function useBudget(uid: string | null) {
  const [budget, setBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(true)
  const month = format(new Date(), 'yyyy-MM')

  useEffect(() => {
    if (!uid) { setLoading(false); return }
    getBudget(uid, month).then((b) => {
      setBudget(b)
      setLoading(false)
    })
  }, [uid, month])

  const save = async (data: Partial<Budget>) => {
    if (!uid) return
    await saveBudget(uid, month, data)
    const updated = await getBudget(uid, month)
    setBudget(updated)
  }

  return { budget, loading, save, month }
}

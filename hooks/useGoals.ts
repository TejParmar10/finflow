'use client'

import { useState, useEffect } from 'react'
import { Goal } from '@/types'
import { getGoals, saveGoal, updateGoalProgress } from '@/lib/firestore'

export function useGoals(uid: string | null) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) { setLoading(false); return }
    const unsub = getGoals(uid, (data) => {
      setGoals(data)
      setLoading(false)
    })
    return unsub
  }, [uid])

  const create = async (data: Omit<Goal, 'id'>) => {
    if (!uid) return
    await saveGoal(uid, data)
  }

  const addProgress = async (goalId: string, amount: number) => {
    if (!uid) return
    await updateGoalProgress(uid, goalId, amount)
  }

  return { goals, loading, create, addProgress }
}

'use client'

import { useState, useEffect } from 'react'
import { SplitGroup, SplitExpense } from '@/types'
import {
  getUserGroups,
  addSplitExpense,
  createSplitGroup,
  getGroupBalances,
  markShareSettled,
} from '@/lib/firestore'

export function useSplits(uid: string | null) {
  const [groups, setGroups] = useState<SplitGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) { setLoading(false); return }
    const unsub = getUserGroups(uid, (data) => {
      setGroups(data)
      setLoading(false)
    })
    return unsub
  }, [uid])

  const createGroup = async (data: Omit<SplitGroup, 'id'>) => {
    return createSplitGroup(data)
  }

  const addExpense = async (groupId: string, data: Omit<SplitExpense, 'id'>) => {
    return addSplitExpense(groupId, data)
  }

  const getBalances = async (groupId: string) => {
    return getGroupBalances(groupId)
  }

  const settleShare = async (groupId: string, expenseId: string, uid: string) => {
    return markShareSettled(groupId, expenseId, uid)
  }

  return { groups, loading, createGroup, addExpense, getBalances, settleShare }
}

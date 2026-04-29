'use client'

import { useState, useEffect } from 'react'
import { Expense } from '@/types'
import { getExpenses, addExpense, deleteExpense } from '@/lib/firestore'
import { format } from 'date-fns'

export function useExpenses(uid: string | null, month?: string) {
  const currentMonth = month ?? format(new Date(), 'yyyy-MM')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) { setLoading(false); return }
    setLoading(true)
    const unsub = getExpenses(uid, currentMonth, (data) => {
      setExpenses(data)
      setLoading(false)
    })
    return unsub
  }, [uid, currentMonth])

  const add = async (data: Omit<Expense, 'id'>) => {
    if (!uid) return
    await addExpense(uid, data)
  }

  const remove = async (id: string) => {
    if (!uid) return
    await deleteExpense(uid, id)
  }

  return { expenses, loading, add, remove }
}

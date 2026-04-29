'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useAuthContext } from '@/components/AuthProvider'
import { useBudget } from '@/hooks/useBudget'
import { useExpenses } from '@/hooks/useExpenses'
import { getMonthHistory } from '@/lib/firestore'
import { ForecastResult } from '@/types'
import { ForecastCard } from '@/components/insights/ForecastCard'
import { SpendingChart } from '@/components/insights/SpendingChart'
import { SubscriptionTracker } from '@/components/insights/SubscriptionTracker'
import { MonthHistory } from '@/components/insights/MonthHistory'
import { Card } from '@/components/ui/Card'
import { AIChat } from '@/components/chat/AIChat'

export default function InsightsPage() {
  const { user } = useAuthContext()
  const router = useRouter()
  const month = format(new Date(), 'yyyy-MM')
  const { budget } = useBudget(user?.uid ?? null)
  const { expenses } = useExpenses(user?.uid ?? null, month)
  const [forecast, setForecast] = useState<ForecastResult | null>(null)
  const [forecastLoading, setForecastLoading] = useState(false)
  const [subscriptions, setSubscriptions] = useState<{ name: string; estimatedAmount: number; frequency: string; aiConfidence: number }[]>([])
  const [history, setHistory] = useState<{ month: string; budget: any; totalSpent: number }[]>([])
  const [idToken, setIdToken] = useState('')
  const [hasFetched, setHasFetched] = useState(false)

  useEffect(() => { if (!user) router.replace('/') }, [user, router])
  useEffect(() => { user?.getIdToken().then(setIdToken) }, [user])

  useEffect(() => {
    if (user?.uid) getMonthHistory(user.uid, 12).then(setHistory)
  }, [user])

  const fetchForecast = useCallback(async () => {
    if (!idToken || !expenses.length) return
    setForecastLoading(true)
    try {
      const res = await fetch('/api/ai/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ expenses, budget, currentWeek: Math.ceil(new Date().getDate() / 7), month }),
      })
      if (!res.ok) throw new Error('Forecast failed')
      const data = await res.json()
      setForecast(data)
    } catch {
      // silently fail — user can refresh manually
    } finally {
      setForecastLoading(false)
    }
  }, [idToken, expenses, budget, month])

  useEffect(() => {
    if (idToken && expenses.length && !hasFetched) {
      setHasFetched(true)
      fetchForecast()
    }
  }, [idToken, expenses, hasFetched, fetchForecast])

  const categoryTotals: Record<string, number> = {}
  expenses.forEach((e) => { categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount })
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)

  if (!user) return null

  return (
    <>
      <div className="max-w-4xl mx-auto py-6 space-y-6">
        <div>
          <h1 className="font-serif text-3xl text-text-primary">Insights</h1>
          <p className="text-sm text-text-muted mt-1">{format(new Date(), 'MMMM yyyy')}</p>
        </div>

        <ForecastCard forecast={forecast} loading={forecastLoading} onRefresh={fetchForecast} />

        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">Spending Chart</h3>
          {expenses.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8">
              No expenses logged this month yet. Add your first expense in the Tracker.
            </p>
          ) : (
            <SpendingChart expenses={expenses} />
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">Category Breakdown</h3>
          {Object.keys(categoryTotals).length === 0 ? (
            <p className="text-sm text-text-muted">No spending data yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(categoryTotals)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amount]) => {
                  const pct = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-sm text-text-primary capitalize w-24">{cat}</span>
                      <div className="flex-1 h-2 bg-[rgba(255,255,255,0.06)] rounded-full">
                        <div className="h-full bg-accent-teal rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-text-muted w-8 text-right">{pct}%</span>
                      <span className="text-sm font-medium text-text-primary w-28 text-right">
                        ₹{amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )
                })}
            </div>
          )}
        </Card>

        <SubscriptionTracker subscriptions={subscriptions} />

        <MonthHistory history={history} />
      </div>

      {idToken && (
        <AIChat idToken={idToken} budget={budget} expenses={expenses} month={month} />
      )}
    </>
  )
}

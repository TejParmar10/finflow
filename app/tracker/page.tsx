'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { serverTimestamp, Timestamp } from 'firebase/firestore'
import { parse } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuthContext } from '@/components/AuthProvider'
import { useBudget } from '@/hooks/useBudget'
import { useExpenses } from '@/hooks/useExpenses'
import { AlertAgent } from '@/lib/alertAgent'
import { calculateCreditScore } from '@/lib/creditScore'
import { BudgetProgressBar } from '@/components/tracker/BudgetProgressBar'
import { AlertBanner } from '@/components/tracker/AlertBanner'
import { ExpenseForm } from '@/components/tracker/ExpenseForm'
import { CategoryCard } from '@/components/tracker/CategoryCard'
import { ReceiptScanner } from '@/components/tracker/ReceiptScanner'
import { CreditScoreArc } from '@/components/dashboard/CreditScoreArc'
import { Card } from '@/components/ui/Card'
import { AIChat } from '@/components/chat/AIChat'
import { ExpenseCategory, AlertType } from '@/types'

const WEEKS = [1, 2, 3, 4]
const ALL_CATEGORIES: ExpenseCategory[] = ['food', 'transport', 'entertainment', 'health', 'shopping', 'utilities', 'subscription', 'other']

export default function TrackerPage() {
  const { user } = useAuthContext()
  const router = useRouter()
  const month = format(new Date(), 'yyyy-MM')
  const { budget } = useBudget(user?.uid ?? null)
  const { expenses, add, remove } = useExpenses(user?.uid ?? null, month)
  const [activeWeek, setActiveWeek] = useState(Math.ceil(new Date().getDate() / 7))
  const [alerts, setAlerts] = useState<AlertType[]>([])
  const [idToken, setIdToken] = useState('')

  useEffect(() => { if (!user) router.replace('/') }, [user, router])
  useEffect(() => { user?.getIdToken().then(setIdToken) }, [user])

  useEffect(() => {
    if (!budget) return
    const a = AlertAgent({ expenses, weeklyBudget: budget.weeklyBudget, personalBudget: budget.personalBudget, currentWeek: activeWeek })
    setAlerts(a)
  }, [expenses, budget, activeWeek])

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
  const weeklyExpenses = expenses.filter((e) => e.week === activeWeek)
  const weeklySpent = weeklyExpenses.reduce((s, e) => s + e.amount, 0)
  const creditData = calculateCreditScore(expenses, budget, activeWeek, true)

  const handleAdd = async (data: { category: ExpenseCategory; amount: number; description: string; date: string }) => {
    const d = parse(data.date, 'yyyy-MM-dd', new Date())
    const week = Math.ceil(d.getDate() / 7)
    await add({
      category: data.category,
      amount: data.amount,
      description: data.description,
      date: Timestamp.fromDate(d),
      month,
      week,
      aiCategorised: false,
      createdAt: serverTimestamp() as any,
    })
  }

  const handleReceiptItems = async (items: { description: string; amount: number; category: ExpenseCategory }[]) => {
    const now = new Date()
    for (const item of items) {
      await add({
        category: item.category,
        amount: item.amount,
        description: item.description,
        date: Timestamp.fromDate(now),
        month,
        week: Math.ceil(now.getDate() / 7),
        aiCategorised: true,
        createdAt: serverTimestamp() as any,
      })
    }
  }

  if (!user) return null

  return (
    <>
      <div className="max-w-4xl mx-auto py-6 space-y-6">
        <div>
          <h1 className="font-serif text-3xl text-text-primary">Expense Tracker</h1>
          <p className="text-sm text-text-muted mt-1">{format(new Date(), 'MMMM yyyy')}</p>
        </div>

        <Card>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-4">
                <BudgetProgressBar label="Monthly Budget" spent={totalSpent} budget={budget?.personalBudget ?? 0} />
                <BudgetProgressBar label={`Week ${activeWeek} Budget`} spent={weeklySpent} budget={budget?.weeklyBudget ?? 0} />
              </div>
              <div className="ml-6 hidden md:block">
                <CreditScoreArc data={creditData} size={100} />
              </div>
            </div>
            {alerts.length > 0 && <AlertBanner alerts={alerts} />}
          </div>
        </Card>

        <div className="flex gap-2">
          {WEEKS.map((w) => (
            <button
              key={w}
              onClick={() => setActiveWeek(w)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                activeWeek === w
                  ? 'bg-accent-teal text-white'
                  : 'bg-[rgba(255,255,255,0.04)] text-text-muted hover:text-text-primary border border-[rgba(255,255,255,0.07)]'
              }`}
            >
              Week {w}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Scan Receipt</h3>
            {idToken ? (
              <ReceiptScanner idToken={idToken} onAddItems={handleReceiptItems} />
            ) : (
              <p className="text-sm text-text-muted">Loading...</p>
            )}
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-text-primary mb-4">Add Expense</h3>
            <ExpenseForm onAdd={handleAdd} />
          </Card>
        </div>

        <div>
          <h2 className="text-base font-semibold text-text-primary mb-4">
            {activeWeek === Math.ceil(new Date().getDate() / 7) ? 'This Week' : `Week ${activeWeek}`} by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ALL_CATEGORIES.map((cat) => {
              const catExpenses = weeklyExpenses.filter((e) => e.category === cat)
              if (catExpenses.length === 0) return null
              return (
                <CategoryCard
                  key={cat}
                  category={cat}
                  expenses={catExpenses}
                  personalBudget={budget?.personalBudget ?? 0}
                  onDelete={remove}
                />
              )
            })}
            {weeklyExpenses.length === 0 && (
              <div className="col-span-2 text-center py-12 text-text-muted text-sm">
                No expenses logged this week yet. Add your first expense above.
              </div>
            )}
          </div>
        </div>
      </div>

      {idToken && (
        <AIChat idToken={idToken} budget={budget} expenses={expenses} month={month} />
      )}
    </>
  )
}

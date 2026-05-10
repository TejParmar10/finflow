'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { serverTimestamp } from 'firebase/firestore'
import { format, subMonths } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuthContext } from '@/components/AuthProvider'
import { useBudget } from '@/hooks/useBudget'
import { useExpenses } from '@/hooks/useExpenses'
import { useGoals } from '@/hooks/useGoals'
import { saveBudget, getBudget } from '@/lib/firestore'
import { calculateCreditScore } from '@/lib/creditScore'
import { AlertAgent } from '@/lib/alertAgent'
import { SalaryInput } from '@/components/dashboard/SalaryInput'
import { AllocationBar } from '@/components/dashboard/AllocationBar'
import { RecommendationCards } from '@/components/dashboard/RecommendationCards'
import { CreditScoreArc } from '@/components/dashboard/CreditScoreArc'
import { AlertBanner } from '@/components/tracker/AlertBanner'
import { OnboardingModal } from '@/components/OnboardingModal'
import { AIChat } from '@/components/chat/AIChat'
import { AlertType } from '@/types'
import { useSplits } from '@/hooks/useSplits'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useAuthContext()
  const router = useRouter()
  const month = format(new Date(), 'yyyy-MM')
  const { budget, loading: budgetLoading, save: saveBudgetLocal } = useBudget(user?.uid ?? null)
  const { expenses } = useExpenses(user?.uid ?? null, month)
  const { goals } = useGoals(user?.uid ?? null)
  const { groups } = useSplits(user?.uid ?? null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [alerts, setAlerts] = useState<AlertType[]>([])
  const [rollover, setRollover] = useState(0)
  const [idToken, setIdToken] = useState('')

  useEffect(() => { if (!user) router.replace('/') }, [user, router])

  useEffect(() => {
    user?.getIdToken().then(setIdToken)
  }, [user])

  useEffect(() => {
    if (!budgetLoading && !budget && user) setShowOnboarding(true)
  }, [budgetLoading, budget, user])

  useEffect(() => {
    if (!budget) return
    const week = Math.ceil(new Date().getDate() / 7)
    const a = AlertAgent({ expenses, weeklyBudget: budget.weeklyBudget, personalBudget: budget.personalBudget, currentWeek: week })
    setAlerts(a)
  }, [expenses, budget])

  useEffect(() => {
    if (!user?.uid || !budget) return
    if ((budget.rolloverAmount ?? 0) > 0) setRollover(budget.rolloverAmount)
  }, [user, budget])

  const handleOnboarding = async (salary: number, investPercent: number) => {
    if (!user?.uid) return
    const personalPercent = 100 - investPercent
    const investBudget = Math.round((salary * investPercent) / 100)
    const personalBudget = Math.round((salary * personalPercent) / 100)
    await saveBudget(user.uid, month, {
      salary,
      investPercent,
      personalPercent,
      investBudget,
      personalBudget,
      weeklyBudget: Math.round(personalBudget / 4),
      rolloverAmount: 0,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    })
    setShowOnboarding(false)
    toast.success('Budget set up!')
    window.location.reload()
  }

  const handleSaveSalary = async (salary: number) => {
    if (!budget) return
    const investBudget = Math.round((salary * budget.investPercent) / 100)
    const personalBudget = Math.round((salary * budget.personalPercent) / 100)
    await saveBudgetLocal({ salary, investBudget, personalBudget, weeklyBudget: Math.round(personalBudget / 4) })
    toast.success('Salary updated!')
  }

  const handleSaveAllocation = async (investPct: number, personalPct: number) => {
    if (!budget) return
    const investBudget = Math.round((budget.salary * investPct) / 100)
    const personalBudget = Math.round((budget.salary * personalPct) / 100)
    await saveBudgetLocal({
      investPercent: investPct,
      personalPercent: personalPct,
      investBudget,
      personalBudget,
      weeklyBudget: Math.round(personalBudget / 4),
    })
    toast.success('Allocation saved!')
  }

  if (!user) return null

  const week = Math.ceil(new Date().getDate() / 7)
  const goalsOnTrack = goals.every((g) => g.savedAmount >= g.weeklyTarget * week)
  const creditData = calculateCreditScore(expenses, budget, week, goalsOnTrack)
  const prevMonthLabel = format(subMonths(new Date(), 1), 'MMMM')

  return (
    <>
      {showOnboarding && <OnboardingModal onComplete={handleOnboarding} />}

      <div className="max-w-4xl mx-auto py-6 space-y-6">
        <div>
          <h1 className="font-serif text-3xl text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">
            {format(new Date(), 'MMMM yyyy')} · Week {week}
          </p>
        </div>

        {rollover > 0 && (
          <div className="bg-[rgba(0,200,150,0.1)] border border-[rgba(0,200,150,0.2)] rounded-xl px-4 py-3 text-sm text-accent-green">
            🎉 You rolled over ₹{rollover.toLocaleString('en-IN')} from {prevMonthLabel}!
          </div>
        )}

        {alerts.length > 0 && <AlertBanner alerts={alerts} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SalaryInput defaultValue={budget?.salary ?? 50000} onSave={handleSaveSalary} />
          <AllocationBar
            salary={budget?.salary ?? 50000}
            defaultInvest={budget?.investPercent ?? 30}
            onSave={handleSaveAllocation}
          />
        </div>

        {budget && (
          <RecommendationCards
            investBudget={budget.investBudget}
            personalBudget={budget.personalBudget}
          />
        )}

        <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[16px] p-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Financial Health Score</h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <CreditScoreArc data={creditData} size={180} />
            <div className="space-y-2 flex-1">
              <p className="text-text-muted text-sm">
                Your score is based on spending habits, budget adherence, and goal progress.
              </p>
              <ul className="space-y-1 text-xs text-text-muted">
                <li className={expenses.reduce((s, e) => s + e.amount, 0) < (budget?.personalBudget ?? Infinity) * 0.5 ? 'text-accent-green' : ''}>
                  • Spending under 50% of budget
                </li>
                <li className={goalsOnTrack ? 'text-accent-green' : ''}>
                  • Goals on track
                </li>
                <li className={alerts.length === 0 ? 'text-accent-green' : 'text-accent-yellow'}>
                  • {alerts.length === 0 ? 'No active alerts' : `${alerts.length} active alert${alerts.length > 1 ? 's' : ''}`}
                </li>
              </ul>
            </div>
          </div>
        </div>
        {/* Splits balance widget */}
        {groups.length > 0 && (() => {
          const uid = user.uid
          let totalOwed = 0   // others owe me
          let totalOwe = 0    // I owe others
          groups.forEach((g) => {
            g.members?.forEach((m) => {
              // Approximate from group-level — detail in /splits
            })
          })
          return (
            <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-[16px] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary">Split Expenses</h3>
                <Link href="/splits" className="text-xs text-accent-teal hover:underline">View all →</Link>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-[rgba(0,200,150,0.08)] rounded-lg p-3">
                  <p className="text-xs text-text-muted mb-1">Groups</p>
                  <p className="text-lg font-serif text-accent-green">{groups.length}</p>
                </div>
                <div className="bg-[rgba(78,205,196,0.08)] rounded-lg p-3">
                  <p className="text-xs text-text-muted mb-1">Total Spent</p>
                  <p className="text-lg font-serif text-accent-teal">
                    ₹{groups.reduce((s, g) => s + (g.totalExpenses ?? 0), 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-[rgba(255,255,255,0.04)] rounded-lg p-3">
                  <p className="text-xs text-text-muted mb-1">Active</p>
                  <p className="text-lg font-serif text-text-primary">{groups.filter((g) => g.isActive).length}</p>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {idToken && (
        <AIChat idToken={idToken} budget={budget} expenses={expenses} month={month} />
      )}
    </>
  )
}

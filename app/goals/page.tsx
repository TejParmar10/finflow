'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { serverTimestamp, Timestamp } from 'firebase/firestore'
import { useAuthContext } from '@/components/AuthProvider'
import { useBudget } from '@/hooks/useBudget'
import { useGoals } from '@/hooks/useGoals'
import { useExpenses } from '@/hooks/useExpenses'
import { GoalForm } from '@/components/goals/GoalForm'
import { GoalCard } from '@/components/goals/GoalCard'
import { Card } from '@/components/ui/Card'
import { AIChat } from '@/components/chat/AIChat'

export default function GoalsPage() {
  const { user } = useAuthContext()
  const router = useRouter()
  const month = format(new Date(), 'yyyy-MM')
  const { budget } = useBudget(user?.uid ?? null)
  const { goals, loading, create, addProgress } = useGoals(user?.uid ?? null)
  const { expenses } = useExpenses(user?.uid ?? null, month)
  const [idToken, setIdToken] = useState('')

  useEffect(() => { if (!user) router.replace('/') }, [user, router])
  useEffect(() => { user?.getIdToken().then(setIdToken) }, [user])

  const handleCreate = async (data: {
    title: string
    targetAmount: number
    deadline: string
    category: string
    weeklyTarget: number
  }) => {
    await create({
      title: data.title,
      targetAmount: data.targetAmount,
      savedAmount: 0,
      deadline: Timestamp.fromDate(new Date(data.deadline)),
      weeklyTarget: data.weeklyTarget,
      category: data.category,
      createdAt: serverTimestamp() as any,
    })
  }

  if (!user) return null

  const active = goals.filter((g) => !g.completedAt)
  const completed = goals.filter((g) => !!g.completedAt)

  return (
    <>
      <div className="max-w-4xl mx-auto py-6 space-y-6">
        <div>
          <h1 className="font-serif text-3xl text-text-primary">Savings Goals</h1>
          <p className="text-sm text-text-muted mt-1">Track and achieve your financial milestones</p>
        </div>

        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">Create New Goal</h3>
          <GoalForm onSave={handleCreate} />
        </Card>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 bg-[rgba(255,255,255,0.04)] rounded-[16px] animate-pulse" />
            ))}
          </div>
        ) : active.length === 0 && completed.length === 0 ? (
          <div className="text-center py-12 text-text-muted text-sm">
            No goals yet. Create your first savings goal above!
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-text-primary mb-4">
                  Active Goals ({active.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {active.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onAddProgress={(amount) => addProgress(goal.id, amount)}
                    />
                  ))}
                </div>
              </div>
            )}
            {completed.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-text-primary mb-4">Completed Goals 🎉</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completed.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onAddProgress={(amount) => addProgress(goal.id, amount)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {idToken && (
        <AIChat idToken={idToken} budget={budget} expenses={expenses} month={month} />
      )}
    </>
  )
}

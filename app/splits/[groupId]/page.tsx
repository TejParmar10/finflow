'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { format } from 'date-fns'
import { Timestamp } from 'firebase/firestore'
import { useAuthContext } from '@/components/AuthProvider'
import { getSplitGroup, getSplitExpenses } from '@/lib/firestore'
import { useSplits } from '@/hooks/useSplits'
import { useBudget } from '@/hooks/useBudget'
import { useExpenses } from '@/hooks/useExpenses'
import { SplitGroup, SplitExpense } from '@/types'
import { BalanceSummary } from '@/components/splits/BalanceSummary'
import { AddExpenseModal } from '@/components/splits/AddExpenseModal'
import { InviteBanner } from '@/components/splits/InviteBanner'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { AIChat } from '@/components/chat/AIChat'
import { ArrowLeft, Plus, Users } from 'lucide-react'
import Link from 'next/link'

export default function GroupPage() {
  const { user } = useAuthContext()
  const router = useRouter()
  const { groupId } = useParams<{ groupId: string }>()
  const month = format(new Date(), 'yyyy-MM')

  const [group, setGroup] = useState<SplitGroup | null>(null)
  const [expenses, setGroupExpenses] = useState<SplitExpense[]>([])
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [loadingGroup, setLoadingGroup] = useState(true)
  const [idToken, setIdToken] = useState('')

  const { addExpense } = useSplits(user?.uid ?? null)
  const { budget } = useBudget(user?.uid ?? null)
  const { expenses: personalExpenses } = useExpenses(user?.uid ?? null, month)

  useEffect(() => { if (!user) router.replace('/') }, [user, router])
  useEffect(() => { user?.getIdToken().then(setIdToken) }, [user])

  useEffect(() => {
    if (!groupId) return
    getSplitGroup(groupId).then((g) => { setGroup(g); setLoadingGroup(false) })
    const unsub = getSplitExpenses(groupId, setGroupExpenses)
    return unsub
  }, [groupId])

  if (!user) return null
  if (loadingGroup) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <div className="h-8 bg-[rgba(255,255,255,0.04)] rounded animate-pulse w-48 mb-6" />
        <div className="space-y-4">
          {[1,2,3].map((i) => <div key={i} className="h-24 bg-[rgba(255,255,255,0.04)] rounded-[16px] animate-pulse" />)}
        </div>
      </div>
    )
  }
  if (!group) return <div className="max-w-4xl mx-auto py-6 text-text-muted">Group not found.</div>

  const myShare = expenses.reduce((s, exp) => {
    const split = exp.splits?.find((sp) => sp.uid === user.uid)
    return s + (split?.amount ?? 0)
  }, 0)

  const toDate = (ts: Timestamp | unknown) => ts instanceof Timestamp ? ts.toDate() : new Date(ts as string)

  return (
    <>
      <div className="max-w-4xl mx-auto py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/splits" className="text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="font-serif text-2xl text-text-primary">{group.name}</h1>
            <p className="text-sm text-text-muted capitalize">{group.category} · {group.members.length} members</p>
          </div>
          <Button size="sm" onClick={() => setShowAddExpense(true)} className="gap-2">
            <Plus size={14} /> Add Expense
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-xl p-4 text-center">
            <p className="text-xs text-text-muted mb-1">Total Spent</p>
            <p className="text-lg font-serif text-text-primary">₹{(group.totalExpenses ?? 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-xl p-4 text-center">
            <p className="text-xs text-text-muted mb-1">Your Share</p>
            <p className="text-lg font-serif text-accent-teal">₹{myShare.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-xl p-4 text-center">
            <p className="text-xs text-text-muted mb-1">Expenses</p>
            <p className="text-lg font-serif text-text-primary">{expenses.length}</p>
          </div>
        </div>

        {/* Non-FinFlow member banners */}
        {group.members.filter((m) => !m.isFinFlowUser).map((m) => (
          <InviteBanner key={m.displayName} name={m.displayName} referralUid={user.uid} />
        ))}

        {/* Balance summary */}
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">Balances</h3>
          <BalanceSummary group={group} expenses={expenses} currentUid={user.uid} />
        </Card>

        {/* Expense list */}
        <Card padding={false}>
          <div className="p-5 border-b border-[rgba(255,255,255,0.05)]">
            <h3 className="text-sm font-semibold text-text-primary">Expenses</h3>
          </div>
          {expenses.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-muted">
              No expenses yet. Add the first one!
            </div>
          ) : (
            <div className="divide-y divide-[rgba(255,255,255,0.04)]">
              {expenses.map((exp) => {
                const myShare = exp.splits?.find((s) => s.uid === user.uid)
                const paidByMe = exp.paidBy === user.uid
                const payer = group.members.find((m) => m.uid === exp.paidBy)
                return (
                  <div key={exp.id} className="flex items-center justify-between px-5 py-3 hover:bg-[rgba(255,255,255,0.02)]">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{exp.description}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {format(toDate(exp.date), 'dd MMM')} · paid by {paidByMe ? 'you' : payer?.displayName ?? exp.paidBy}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-medium text-text-primary">₹{exp.amount.toLocaleString('en-IN')}</p>
                      {myShare && (
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          <p className="text-xs text-text-muted">your share: ₹{myShare.amount.toLocaleString('en-IN')}</p>
                          {myShare.settled
                            ? <Badge variant="green" className="text-[10px] py-0">settled</Badge>
                            : <Badge variant="yellow" className="text-[10px] py-0">pending</Badge>}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {showAddExpense && (
        <AddExpenseModal
          group={group}
          currentUid={user.uid}
          month={month}
          onAdd={addExpense}
          onClose={() => setShowAddExpense(false)}
        />
      )}

      {idToken && <AIChat idToken={idToken} budget={budget} expenses={personalExpenses} month={month} />}
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { format } from 'date-fns'
import { Timestamp } from 'firebase/firestore'
import { useAuthContext } from '@/components/AuthProvider'
import { getSplitGroup, getSplitExpenses, deleteSplitGroup, addMembersToGroup, updateUserUpiId } from '@/lib/firestore'
import { useSplits } from '@/hooks/useSplits'
import { useBudget } from '@/hooks/useBudget'
import { useExpenses } from '@/hooks/useExpenses'
import { SplitGroup, SplitExpense, SplitMember } from '@/types'
import { BalanceSummary } from '@/components/splits/BalanceSummary'
import { AddExpenseModal } from '@/components/splits/AddExpenseModal'
import { InviteBanner } from '@/components/splits/InviteBanner'
import { ContactPicker } from '@/components/splits/ContactPicker'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { AIChat } from '@/components/chat/AIChat'
import { ArrowLeft, Plus, UserPlus, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function GroupPage() {
  const { user } = useAuthContext()
  const router = useRouter()
  const { groupId } = useParams<{ groupId: string }>()
  const month = format(new Date(), 'yyyy-MM')

  const [group, setGroup] = useState<SplitGroup | null>(null)
  const [expenses, setGroupExpenses] = useState<SplitExpense[]>([])
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddMembers, setShowAddMembers] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showUpiPrompt, setShowUpiPrompt] = useState(false)
  const [newMembers, setNewMembers] = useState<SplitMember[]>([])
  const [upiInput, setUpiInput] = useState('')
  const [loadingGroup, setLoadingGroup] = useState(true)
  const [savingMembers, setSavingMembers] = useState(false)
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

  const handleDelete = async () => {
    if (!groupId) return
    try {
      await deleteSplitGroup(groupId)
      toast.success('Group deleted')
      router.replace('/splits')
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete group')
    }
  }

  const handleAddMembers = async () => {
    if (!groupId || newMembers.length === 0) return
    setSavingMembers(true)
    try {
      await addMembersToGroup(groupId, newMembers)
      const updated = await getSplitGroup(groupId)
      setGroup(updated)
      setNewMembers([])
      setShowAddMembers(false)
      toast.success(`${newMembers.length} member${newMembers.length > 1 ? 's' : ''} added!`)
    } catch (e) {
      console.error(e)
      toast.error('Failed to add members')
    } finally {
      setSavingMembers(false)
    }
  }

  const handleSaveUpi = async () => {
    if (!user?.uid || !upiInput.trim()) { toast.error('Enter your UPI ID'); return }
    await updateUserUpiId(user.uid, upiInput)
    toast.success('UPI ID saved!')
    setShowUpiPrompt(false)
  }

  if (!user) return null
  if (loadingGroup) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <div className="h-8 bg-[rgba(255,255,255,0.04)] rounded animate-pulse w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-[rgba(255,255,255,0.04)] rounded-[16px] animate-pulse" />)}
        </div>
      </div>
    )
  }
  if (!group) return <div className="max-w-4xl mx-auto py-6 text-text-muted">Group not found.</div>

  const myShare = expenses.reduce((s, exp) => {
    const split = exp.splits?.find((sp) => sp.uid === user.uid)
    return s + (split?.amount ?? 0)
  }, 0)

  const toDate = (ts: unknown) => ts instanceof Timestamp ? ts.toDate() : new Date(ts as string)
  const isOwner = group.createdBy === user.uid

  return (
    <>
      <div className="max-w-4xl mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/splits" className="text-text-muted hover:text-text-primary transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1">
            <h1 className="font-serif text-2xl text-text-primary">{group.name}</h1>
            <p className="text-sm text-text-muted capitalize">{group.category} · {group.members.length} members</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowAddMembers(true)} className="gap-1.5">
              <UserPlus size={13} /> Add
            </Button>
            <Button size="sm" onClick={() => setShowAddExpense(true)} className="gap-1.5">
              <Plus size={13} /> Expense
            </Button>
            {isOwner && (
              <button onClick={() => setShowDeleteConfirm(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgba(255,107,107,0.3)] text-accent-coral hover:bg-[rgba(255,107,107,0.1)] transition-all">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* UPI ID missing banner */}
        {!showUpiPrompt ? (
          <div className="flex items-center justify-between bg-[rgba(255,230,109,0.08)] border border-[rgba(255,230,109,0.15)] rounded-xl px-4 py-3">
            <p className="text-sm text-accent-yellow">⚡ Add your UPI ID so others can pay you easily</p>
            <button onClick={() => setShowUpiPrompt(true)} className="text-xs text-accent-teal hover:underline ml-3 flex-shrink-0">
              Add UPI ID
            </button>
          </div>
        ) : (
          <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-xl px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-primary">Your UPI ID</p>
              <button onClick={() => setShowUpiPrompt(false)}><X size={14} className="text-text-muted" /></button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={upiInput}
                onChange={(e) => setUpiInput(e.target.value)}
                placeholder="9876543210@ybl"
                className="flex-1 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-teal"
              />
              <Button size="sm" onClick={handleSaveUpi}>Save</Button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Spent', value: `₹${(group.totalExpenses ?? 0).toLocaleString('en-IN')}`, color: 'text-text-primary' },
            { label: 'Your Share', value: `₹${myShare.toLocaleString('en-IN')}`, color: 'text-accent-teal' },
            { label: 'Expenses', value: expenses.length.toString(), color: 'text-text-primary' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.07)] rounded-xl p-4 text-center">
              <p className="text-xs text-text-muted mb-1">{label}</p>
              <p className={`text-lg font-serif ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Non-FinFlow member invite banners */}
        {group.members.filter((m) => !m.isFinFlowUser).map((m) => (
          <InviteBanner key={m.displayName} name={m.displayName} referralUid={user.uid} />
        ))}

        {/* Balances */}
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
            <div className="py-10 text-center text-sm text-text-muted">No expenses yet. Add the first one!</div>
          ) : (
            <div className="divide-y divide-[rgba(255,255,255,0.04)]">
              {expenses.map((exp) => {
                const myShareItem = exp.splits?.find((s) => s.uid === user.uid)
                const paidByMe = exp.paidBy === user.uid
                const payer = group.members.find((m) => m.uid === exp.paidBy)
                return (
                  <div key={exp.id} className="flex items-center justify-between px-5 py-3 hover:bg-[rgba(255,255,255,0.02)]">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{exp.description}</p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {format(toDate(exp.date), 'dd MMM')} · paid by {paidByMe ? 'you' : (payer?.displayName ?? exp.paidBy)}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-medium text-text-primary">₹{exp.amount.toLocaleString('en-IN')}</p>
                      {myShareItem && (
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          <p className="text-xs text-text-muted">your share: ₹{myShareItem.amount.toLocaleString('en-IN')}</p>
                          {myShareItem.settled
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

      {/* Add Members Modal */}
      {showAddMembers && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-secondary border border-[rgba(255,255,255,0.1)] rounded-[20px] w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-text-primary">Add Members</h2>
              <button onClick={() => { setShowAddMembers(false); setNewMembers([]) }}><X size={18} className="text-text-muted" /></button>
            </div>
            <ContactPicker members={newMembers} currentUid={user.uid} onChange={setNewMembers} />
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" onClick={() => { setShowAddMembers(false); setNewMembers([]) }} className="flex-1">Cancel</Button>
              <Button onClick={handleAddMembers} disabled={savingMembers || newMembers.length === 0} className="flex-1">
                {savingMembers ? 'Adding...' : `Add ${newMembers.length > 0 ? newMembers.length : ''} Member${newMembers.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-secondary border border-[rgba(255,107,107,0.2)] rounded-[20px] w-full max-w-sm p-6 space-y-4 text-center">
            <p className="text-4xl">🗑️</p>
            <h2 className="font-serif text-xl text-text-primary">Delete "{group.name}"?</h2>
            <p className="text-sm text-text-muted">This will permanently delete the group and all its expense records. This cannot be undone.</p>
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} className="flex-1">Cancel</Button>
              <Button variant="danger" onClick={handleDelete} className="flex-1">Yes, Delete</Button>
            </div>
          </div>
        </div>
      )}

      {showAddExpense && (
        <AddExpenseModal group={group} currentUid={user.uid} month={month} onAdd={addExpense} onClose={() => setShowAddExpense(false)} />
      )}

      {idToken && <AIChat idToken={idToken} budget={budget} expenses={personalExpenses} month={month} />}
    </>
  )
}

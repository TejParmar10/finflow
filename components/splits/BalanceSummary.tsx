'use client'

import { useState } from 'react'
import { SplitGroup, SplitExpense, Balance, SimplifiedDebt } from '@/types'
import { simplifyDebts } from '@/lib/debtSimplifier'
import { Button } from '@/components/ui/Button'
import { SettleUpModal } from './SettleUpModal'

interface BalanceSummaryProps {
  group: SplitGroup
  expenses: SplitExpense[]
  currentUid: string
}

export function BalanceSummary({ group, expenses, currentUid }: BalanceSummaryProps) {
  const [simplified, setSimplified] = useState<SimplifiedDebt[] | null>(null)
  const [settleTarget, setSettleTarget] = useState<SimplifiedDebt | null>(null)

  // Compute raw balances from expenses
  const raw: Balance[] = []
  expenses.forEach((exp) => {
    exp.splits?.forEach((share) => {
      if (share.uid !== exp.paidBy && !share.settled) {
        raw.push({ fromUid: share.uid, toUid: exp.paidBy, amount: share.amount, groupId: group.id })
      }
    })
  })

  // Net balance per member for display
  const net: Record<string, number> = {}
  raw.forEach((b) => {
    net[b.fromUid] = (net[b.fromUid] ?? 0) - b.amount
    net[b.toUid]   = (net[b.toUid]   ?? 0) + b.amount
  })

  const memberMap: Record<string, { name: string; upiId?: string }> = {}
  group.members.forEach((m) => {
    if (m.uid) memberMap[m.uid] = { name: m.displayName, upiId: m.upiId }
  })

  const myBalance = net[currentUid] ?? 0

  const handleSimplify = () => {
    const debts = simplifyDebts(raw, memberMap)
    setSimplified(debts)
  }

  return (
    <div className="space-y-4">
      {/* My balance summary */}
      <div className={`rounded-xl px-4 py-3 text-sm font-medium ${myBalance > 0 ? 'bg-[rgba(0,200,150,0.1)] text-accent-green' : myBalance < 0 ? 'bg-[rgba(255,107,107,0.1)] text-accent-coral' : 'bg-[rgba(255,255,255,0.04)] text-text-muted'}`}>
        {myBalance > 0
          ? `You are owed ₹${myBalance.toLocaleString('en-IN')}`
          : myBalance < 0
          ? `You owe ₹${Math.abs(myBalance).toLocaleString('en-IN')}`
          : 'You\'re all settled up 🎉'}
      </div>

      {/* Per-member balances */}
      <div className="space-y-2">
        {group.members.filter((m) => m.uid && m.uid !== currentUid).map((m) => {
          const balance = (net[m.uid!] ?? 0) - (net[currentUid] ?? 0)
          // Relative to me: positive = they owe me, negative = I owe them
          const rel = (net[currentUid] ?? 0) > 0
            ? raw.filter((b) => b.toUid === currentUid && b.fromUid === m.uid).reduce((s, b) => s + b.amount, 0)
              - raw.filter((b) => b.toUid === m.uid && b.fromUid === currentUid).reduce((s, b) => s + b.amount, 0)
            : 0
          const owesMe = raw.filter((b) => b.toUid === currentUid && b.fromUid === m.uid!).reduce((s, b) => s + b.amount, 0)
          const iOwe  = raw.filter((b) => b.fromUid === currentUid && b.toUid === m.uid!).reduce((s, b) => s + b.amount, 0)
          const diff  = owesMe - iOwe

          if (Math.abs(diff) < 0.01) return null
          return (
            <div key={m.uid} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)]">
              <span className="text-sm text-text-primary">{m.displayName}</span>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${diff > 0 ? 'text-accent-green' : 'text-accent-coral'}`}>
                  {diff > 0 ? `owes you ₹${diff.toLocaleString('en-IN')}` : `you owe ₹${Math.abs(diff).toLocaleString('en-IN')}`}
                </span>
                {diff < 0 && (
                  <Button size="sm" onClick={() => setSettleTarget({ fromUid: currentUid, fromName: 'You', toUid: m.uid!, toName: m.displayName, toUpiId: m.upiId, amount: Math.abs(diff) })}>
                    Settle
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {raw.length > 0 && (
        <Button variant="secondary" onClick={handleSimplify} className="w-full">
          Simplify Debts
        </Button>
      )}

      {simplified && (
        <div className="space-y-2 bg-[rgba(78,205,196,0.05)] border border-[rgba(78,205,196,0.15)] rounded-xl p-4">
          <p className="text-xs font-medium text-accent-teal mb-2">Simplified ({simplified.length} transactions)</p>
          {simplified.map((d, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-text-primary">
                <span className="font-medium">{d.fromUid === currentUid ? 'You' : d.fromName}</span>
                {' → '}
                <span className="font-medium">{d.toUid === currentUid ? 'You' : d.toName}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-text-primary">₹{d.amount.toLocaleString('en-IN')}</span>
                {d.fromUid === currentUid && (
                  <Button size="sm" onClick={() => setSettleTarget(d)}>Pay</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {settleTarget && (
        <SettleUpModal
          debt={settleTarget}
          groupId={group.id}
          onClose={() => setSettleTarget(null)}
        />
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { X, Copy, CheckCircle } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { SimplifiedDebt } from '@/types'
import { buildUpiLink, buildGPayLink, buildPhonePeLink, buildPaytmLink, isMobile } from '@/lib/upiLink'
import { settleAllSharesBetween } from '@/lib/firestore'
import { SplitExpense } from '@/types'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

function maskUpi(upiId: string): string {
  const at = upiId.indexOf('@')
  if (at === -1) return upiId.slice(0, 4) + '*'.repeat(Math.max(0, upiId.length - 4))
  const handle = upiId.slice(0, at)
  const bank = upiId.slice(at)
  const visible = Math.min(4, handle.length)
  return handle.slice(0, visible) + '*'.repeat(Math.max(0, handle.length - visible)) + bank
}

interface SettleUpModalProps {
  debt: SimplifiedDebt
  groupId: string
  payerUid: string
  expenses: SplitExpense[]   // all group expenses — used to find which to mark settled
  onClose: () => void
  onSettled?: () => void
}

export function SettleUpModal({ debt, groupId, payerUid, expenses, onClose, onSettled }: SettleUpModalProps) {
  const [appOpened, setAppOpened] = useState(false)
  const [settling, setSettling] = useState(false)
  const [done, setDone] = useState(false)
  const mobile = isMobile()

  const upiParams = {
    upiId: debt.toUpiId ?? '',
    name: debt.toName,
    amount: debt.amount,
    note: 'FinFlow split payment',
  }
  const upiLink = buildUpiLink(upiParams)

  const openPayApp = (url: string) => {
    window.location.href = url
    setAppOpened(true)
  }

  const copyUpi = () => {
    navigator.clipboard.writeText(debt.toUpiId ?? '')
    toast.success('UPI ID copied!')
  }

  const handleMarkPaid = async () => {
    setSettling(true)
    try {
      // Mark all unsettled shares from payerUid in expenses paid by debt.toUid
      const expenseIds = expenses.map((e) => e.id)
      await settleAllSharesBetween(groupId, payerUid, debt.toUid, expenseIds)
      setDone(true)
      onSettled?.()
      setTimeout(() => onClose(), 2200)
    } catch (e) {
      console.error(e)
      toast.error('Failed to record payment')
    } finally {
      setSettling(false)
    }
  }

  const hasUpi = !!debt.toUpiId

  // ── Success screen ───────────────────────────────────────────────
  if (done) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-secondary border border-[rgba(0,200,150,0.3)] rounded-[20px] w-full max-w-sm p-8 flex flex-col items-center gap-4 text-center"
          style={{ animation: 'scaleIn 0.3s ease' }}>
          {/* Animated checkmark ring */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-[rgba(0,200,150,0.15)] animate-ping" />
            <div className="absolute inset-0 rounded-full bg-[rgba(0,200,150,0.2)] flex items-center justify-center">
              <CheckCircle size={40} className="text-accent-green" style={{ animation: 'popIn 0.4s 0.1s ease both' }} />
            </div>
          </div>
          <div>
            <h3 className="font-serif text-2xl text-text-primary">Payment Recorded!</h3>
            <p className="text-sm text-text-muted mt-1">
              ₹{debt.amount.toLocaleString('en-IN')} paid to <span className="text-text-primary font-medium">{debt.toName}</span>
            </p>
          </div>
          <p className="text-xs text-text-muted">Removed from your pending debts ✓</p>
        </div>
        <style>{`
          @keyframes scaleIn { from { transform: scale(0.85); opacity: 0 } to { transform: scale(1); opacity: 1 } }
          @keyframes popIn   { from { transform: scale(0); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        `}</style>
      </div>
    )
  }

  // ── Main modal ───────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-secondary border border-[rgba(255,255,255,0.1)] rounded-[20px] w-full max-w-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-text-primary">Settle Up</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary"><X size={18} /></button>
        </div>

        <div className="text-center">
          <p className="text-text-muted text-sm">Pay <span className="text-text-primary font-medium">{debt.toName}</span></p>
          <p className="font-serif text-3xl text-text-primary mt-1">₹{debt.amount.toLocaleString('en-IN')}</p>
        </div>

        {hasUpi ? (
          mobile ? (
            <div className="space-y-2">
              {!appOpened ? (
                <>
                  <Button onClick={() => openPayApp(buildGPayLink(upiParams))} className="w-full bg-[#1a73e8] hover:opacity-90">
                    Pay via Google Pay
                  </Button>
                  <Button onClick={() => openPayApp(buildPhonePeLink(upiParams))} className="w-full bg-[#5f259f] hover:opacity-90">
                    Pay via PhonePe
                  </Button>
                  <Button onClick={() => openPayApp(buildPaytmLink(upiParams))} className="w-full bg-[#002970] hover:opacity-90">
                    Pay via Paytm
                  </Button>
                </>
              ) : (
                <div className="bg-[rgba(0,200,150,0.08)] border border-[rgba(0,200,150,0.2)] rounded-xl p-3 text-center">
                  <p className="text-sm text-accent-green font-medium">Payment app opened ✓</p>
                  <p className="text-xs text-text-muted mt-1">Come back here after paying</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG value={upiLink} size={160} />
              </div>
              <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 w-full">
                <span className="text-sm text-text-primary flex-1 truncate font-mono">{maskUpi(debt.toUpiId!)}</span>
                <button onClick={copyUpi} title="Copy full UPI ID" className="text-text-muted hover:text-accent-teal transition-colors">
                  <Copy size={14} />
                </button>
              </div>
              <p className="text-xs text-text-muted text-center">Scan QR or copy UPI ID, then tap "I've Paid" below</p>
            </div>
          )
        ) : (
          <div className="bg-[rgba(255,230,109,0.08)] border border-[rgba(255,230,109,0.2)] rounded-xl p-3 text-sm text-accent-yellow text-center">
            {debt.toName} hasn't added their UPI ID yet. Ask them to update their profile.
          </div>
        )}

        {/* Show "I've Paid" once payment app was opened, or always on desktop, or if no UPI */}
        {(appOpened || !mobile || !hasUpi) && (
          <Button
            onClick={handleMarkPaid}
            disabled={settling}
            className="w-full gap-2 bg-gradient-to-r from-accent-green to-[#00a87a] hover:opacity-90"
          >
            <CheckCircle size={15} />
            {settling ? 'Recording...' : "I've Paid ✓"}
          </Button>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { X, Copy, CheckCircle } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { SimplifiedDebt } from '@/types'
import { buildUpiLink, buildGPayLink, buildPhonePeLink, buildPaytmLink, isMobile } from '@/lib/upiLink'

// Shows 9876*****@ybl in UI — full value still used for payments
function maskUpi(upiId: string): string {
  const at = upiId.indexOf('@')
  if (at === -1) return upiId.slice(0, 4) + '*'.repeat(Math.max(0, upiId.length - 4))
  const handle = upiId.slice(0, at)
  const bank = upiId.slice(at)
  const visible = Math.min(4, handle.length)
  return handle.slice(0, visible) + '*'.repeat(Math.max(0, handle.length - visible)) + bank
}
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface SettleUpModalProps {
  debt: SimplifiedDebt
  groupId: string
  onClose: () => void
  onSettled?: () => void
}

export function SettleUpModal({ debt, groupId, onClose, onSettled }: SettleUpModalProps) {
  const [paid, setPaid] = useState(false)
  const mobile = isMobile()

  const upiParams = {
    upiId: debt.toUpiId ?? '',
    name: debt.toName,
    amount: debt.amount,
    note: `FinFlow split payment`,
  }
  const upiLink = buildUpiLink(upiParams)

  const openLink = (url: string) => {
    window.location.href = url
    setPaid(true)
  }

  const copyUpi = () => {
    navigator.clipboard.writeText(debt.toUpiId ?? '')
    toast.success('UPI ID copied!')
  }

  const markPaid = () => {
    toast.success('Payment recorded ✓')
    onSettled?.()
    onClose()
  }

  const hasUpi = !!debt.toUpiId

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
            /* Mobile: UPI deep links */
            <div className="space-y-2">
              <Button onClick={() => openLink(buildGPayLink(upiParams))} className="w-full bg-[#1a73e8] hover:opacity-90">
                Pay via Google Pay
              </Button>
              <Button onClick={() => openLink(buildPhonePeLink(upiParams))} className="w-full bg-[#5f259f] hover:opacity-90">
                Pay via PhonePe
              </Button>
              <Button onClick={() => openLink(buildPaytmLink(upiParams))} className="w-full bg-[#002970] hover:opacity-90">
                Pay via Paytm
              </Button>
            </div>
          ) : (
            /* Desktop: QR + copyable UPI ID */
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG value={upiLink} size={160} />
              </div>
              <div className="flex items-center gap-2 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 w-full">
                <span className="text-sm text-text-primary flex-1 truncate font-mono">
                  {maskUpi(debt.toUpiId!)}
                </span>
                <button onClick={copyUpi} title="Copy full UPI ID" className="text-text-muted hover:text-accent-teal transition-colors">
                  <Copy size={14} />
                </button>
              </div>
              <p className="text-xs text-text-muted text-center">Scan the QR or copy the UPI ID to pay from any UPI app</p>
            </div>
          )
        ) : (
          <div className="bg-[rgba(255,230,109,0.08)] border border-[rgba(255,230,109,0.2)] rounded-xl p-3 text-sm text-accent-yellow text-center">
            {debt.toName} hasn't added their UPI ID yet. Ask them to update their profile.
          </div>
        )}

        {(paid || !mobile || !hasUpi) && (
          <Button onClick={markPaid} className="w-full gap-2">
            <CheckCircle size={15} />
            Mark as Paid
          </Button>
        )}
      </div>
    </div>
  )
}

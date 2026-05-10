'use client'

import { Copy } from 'lucide-react'
import toast from 'react-hot-toast'

interface InviteBannerProps {
  name: string
  referralUid: string
}

export function InviteBanner({ name, referralUid }: InviteBannerProps) {
  const link = `https://finflow-six-gamma.vercel.app/join?ref=${referralUid}`

  const copy = () => {
    navigator.clipboard.writeText(link)
    toast.success('Invite link copied!')
  }

  return (
    <div className="flex items-center justify-between bg-[rgba(255,230,109,0.08)] border border-[rgba(255,230,109,0.15)] rounded-xl px-4 py-3">
      <p className="text-sm text-accent-yellow">{name} isn't on FinFlow yet</p>
      <button onClick={copy} className="flex items-center gap-1.5 text-xs text-accent-teal hover:underline">
        <Copy size={12} />
        Copy Invite Link
      </button>
    </div>
  )
}

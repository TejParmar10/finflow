'use client'

import { Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface Sub {
  name: string
  estimatedAmount: number
  frequency: string
  aiConfidence: number
}

interface SubscriptionTrackerProps {
  subscriptions: Sub[]
}

export function SubscriptionTracker({ subscriptions }: SubscriptionTrackerProps) {
  if (subscriptions.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Detected Subscriptions</h3>
        <p className="text-sm text-text-muted">No recurring payments detected yet. Keep tracking your expenses.</p>
      </Card>
    )
  }

  const annualCost = (sub: Sub) => {
    if (sub.frequency === 'monthly') return sub.estimatedAmount * 12
    if (sub.frequency === 'yearly') return sub.estimatedAmount
    return sub.estimatedAmount * 52
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-4">Detected Subscriptions</h3>
      <div className="space-y-3">
        {subscriptions.map((sub, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)] last:border-0">
            <div className="flex-1">
              <p className="text-sm text-text-primary font-medium">{sub.name}</p>
              <p className="text-xs text-text-muted">
                {sub.frequency} · {Math.round(sub.aiConfidence * 100)}% confidence
              </p>
              <p className="text-xs text-accent-yellow mt-0.5">
                Costs you ₹{annualCost(sub).toLocaleString('en-IN')}/year
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-text-primary">₹{sub.estimatedAmount.toLocaleString('en-IN')}</p>
              <p className="text-xs text-text-muted">/{sub.frequency === 'monthly' ? 'mo' : sub.frequency === 'yearly' ? 'yr' : 'wk'}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

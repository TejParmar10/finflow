'use client'

import { Card } from '@/components/ui/Card'
import {
  TrendingUp, Building2, ShieldCheck, Gem,
  UtensilsCrossed, Car, Music, Heart, ShoppingBag, MoreHorizontal
} from 'lucide-react'

interface RecommendationCardsProps {
  investBudget: number
  personalBudget: number
}

export function RecommendationCards({ investBudget, personalBudget }: RecommendationCardsProps) {
  const investments = [
    { icon: TrendingUp, label: 'Index Funds / ETFs', pct: 40, color: 'text-accent-teal' },
    { icon: Building2, label: 'Fixed Deposits / Bonds', pct: 25, color: 'text-accent-green' },
    { icon: ShieldCheck, label: 'Emergency Fund', pct: 20, color: 'text-accent-yellow' },
    { icon: Gem, label: 'Gold / Alt Assets', pct: 15, color: 'text-accent-coral' },
  ]

  const personal = [
    { icon: UtensilsCrossed, label: 'Food & Groceries', pct: 35, color: 'text-accent-teal' },
    { icon: Car, label: 'Transport', pct: 15, color: 'text-accent-green' },
    { icon: Music, label: 'Entertainment', pct: 15, color: 'text-accent-yellow' },
    { icon: Heart, label: 'Health', pct: 15, color: 'text-accent-coral' },
    { icon: ShoppingBag, label: 'Shopping', pct: 10, color: 'text-[rgba(255,255,255,0.5)]' },
    { icon: MoreHorizontal, label: 'Misc / Savings', pct: 10, color: 'text-[rgba(255,255,255,0.5)]' },
  ]

  const Row = ({ icon: Icon, label, pct, amount, color }: { icon: React.ElementType; label: string; pct: number; amount: number; color: string }) => (
    <div className="flex items-center gap-3 py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0">
      <Icon size={15} className={color} />
      <span className="flex-1 text-sm text-text-primary">{label}</span>
      <span className="text-xs text-text-muted w-8 text-right">{pct}%</span>
      <span className="text-sm font-medium text-text-primary w-24 text-right">
        ₹{Math.round(amount).toLocaleString('en-IN')}
      </span>
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Investment Plan</h3>
        {investments.map((item) => (
          <Row key={item.label} {...item} amount={(investBudget * item.pct) / 100} />
        ))}
      </Card>
      <Card>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Personal Spending Plan</h3>
        {personal.map((item) => (
          <Row key={item.label} {...item} amount={(personalBudget * item.pct) / 100} />
        ))}
      </Card>
    </div>
  )
}

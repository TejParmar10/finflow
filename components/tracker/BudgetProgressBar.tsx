'use client'

interface BudgetProgressBarProps {
  label: string
  spent: number
  budget: number
}

export function BudgetProgressBar({ label, spent, budget }: BudgetProgressBarProps) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
  const remaining = budget - spent
  const overBudget = spent > budget
  const barColor = pct > 100 ? '#FF6B6B' : pct > 85 ? '#FFE66D' : '#4ECDC4'

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-text-muted">{label}</span>
        <span className={`font-medium ${overBudget ? 'text-accent-coral' : 'text-text-primary'}`}>
          ₹{spent.toLocaleString('en-IN')} / ₹{budget.toLocaleString('en-IN')}
        </span>
      </div>
      <div className="h-2 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <p className="text-xs text-text-muted">
        {overBudget
          ? `₹${Math.abs(remaining).toLocaleString('en-IN')} over budget`
          : `₹${remaining.toLocaleString('en-IN')} remaining · ${Math.round(pct)}% used`}
      </p>
    </div>
  )
}

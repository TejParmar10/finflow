import { Expense, AlertType } from '@/types'

export function AlertAgent(input: {
  expenses: Expense[]
  weeklyBudget: number
  personalBudget: number
  currentWeek: number
}): AlertType[] {
  const alerts: AlertType[] = []
  const totalSpent = input.expenses.reduce((s, e) => s + e.amount, 0)
  const weeklyExpenses = input.expenses.filter((e) => e.week === input.currentWeek)
  const weeklySpent = weeklyExpenses.reduce((s, e) => s + e.amount, 0)

  const weeklyPct = input.weeklyBudget > 0 ? weeklySpent / input.weeklyBudget : 0
  if (weeklyPct > 0.5) {
    alerts.push({
      type: 'danger',
      message: `You've spent ${Math.round(weeklyPct * 100)}% of your weekly budget (₹${weeklySpent.toLocaleString('en-IN')} / ₹${input.weeklyBudget.toLocaleString('en-IN')})`,
    })
  } else if (weeklyPct > 0.35) {
    alerts.push({
      type: 'warning',
      message: `Weekly spending at ${Math.round(weeklyPct * 100)}% of budget — pace yourself`,
    })
  }

  const monthlyPct = input.personalBudget > 0 ? totalSpent / input.personalBudget : 0
  if (monthlyPct >= 1.0) {
    alerts.push({
      type: 'danger',
      message: `Monthly budget exceeded! Spent ₹${totalSpent.toLocaleString('en-IN')} of ₹${input.personalBudget.toLocaleString('en-IN')}`,
    })
  } else if (monthlyPct >= 0.85) {
    alerts.push({
      type: 'warning',
      message: `Approaching monthly limit — ${Math.round(monthlyPct * 100)}% spent`,
    })
  }

  const categoryTotals: Record<string, number> = {}
  for (const e of input.expenses) {
    categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount
  }
  const suggestedAlloc: Record<string, number> = {
    food: 0.35, transport: 0.15, entertainment: 0.15,
    health: 0.15, shopping: 0.1, other: 0.1,
  }
  for (const [cat, pct] of Object.entries(suggestedAlloc)) {
    const suggested = input.personalBudget * pct
    const spent = categoryTotals[cat] ?? 0
    if (suggested > 0 && spent > suggested * 1.5) {
      alerts.push({
        type: 'danger',
        message: `${cat.charAt(0).toUpperCase() + cat.slice(1)} spending (₹${spent.toLocaleString('en-IN')}) is over 150% of suggested allocation`,
        category: cat,
      })
    }
  }

  return alerts
}

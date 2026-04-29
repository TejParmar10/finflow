import { Expense, Budget, CreditScoreData } from '@/types'

export function calculateCreditScore(
  expenses: Expense[],
  budget: Budget | null,
  currentWeek: number,
  goalsOnTrack: boolean
): CreditScoreData {
  if (!budget) return { score: 750, label: 'Good', color: '#FFE66D' }

  let score = 800
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
  const { personalBudget, weeklyBudget } = budget

  const monthlyPct = personalBudget > 0 ? totalSpent / personalBudget : 0
  if (monthlyPct > 1.0) score -= 120
  else if (monthlyPct > 0.9) score -= 70
  else if (monthlyPct > 0.75) score -= 30

  const week1 = expenses.filter((e) => e.week === 1).reduce((s, e) => s + e.amount, 0)
  const w1pct = weeklyBudget > 0 ? week1 / weeklyBudget : 0
  if (w1pct > 0.5) score -= 60
  else if (w1pct > 0.35) score -= 25

  const categoryTotals: Record<string, number> = {}
  for (const e of expenses) {
    categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount
  }
  const suggestedAlloc: Record<string, number> = {
    food: 0.35,
    transport: 0.15,
    entertainment: 0.15,
    health: 0.15,
    shopping: 0.1,
    other: 0.1,
  }
  for (const [cat, pct] of Object.entries(suggestedAlloc)) {
    const suggested = personalBudget * pct
    if (suggested > 0 && (categoryTotals[cat] ?? 0) > suggested * 1.5) {
      score -= 15
    }
  }

  if (monthlyPct < 0.5) score += 20
  if (goalsOnTrack) score += 10

  const alerts = totalSpent / (personalBudget || 1)
  if (alerts < 0.35) score += 15

  score = Math.max(300, Math.min(900, score))
  return scoreToData(score)
}

function scoreToData(score: number): CreditScoreData {
  if (score >= 800) return { score, label: 'Excellent', color: '#00C896' }
  if (score >= 740) return { score, label: 'Very Good', color: '#4ECDC4' }
  if (score >= 670) return { score, label: 'Good', color: '#FFE66D' }
  if (score >= 580) return { score, label: 'Fair', color: '#FF8B94' }
  return { score, label: 'Poor', color: '#FF6B6B' }
}

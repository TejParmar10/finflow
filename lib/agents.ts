import { callGroq } from './groq'
import { Budget, Expense, ForecastResult } from '@/types'

type Intent = 'BUDGET_ADVICE' | 'SPENDING_INSIGHT' | 'ALERT_CHECK' | 'GENERAL_CHAT'

interface FinancialContext {
  salary?: number
  budget?: Budget | null
  expenses?: Expense[]
  month?: string
}

const BUDGET_SYSTEM = `You are a friendly Indian personal finance advisor called FinFlow AI.
Always use INR (₹). Keep advice concise, practical, and actionable.
Use Indian financial context: FDs, PPF, index funds, SIP, etc.
When recommending investment allocation:
- 40% Index Funds/ETFs
- 25% Fixed Deposits/Bonds
- 20% Emergency Fund
- 15% Gold/Alt Assets
Personal spending allocation:
- 35% Food & Groceries
- 15% Transport
- 15% Entertainment
- 15% Health
- 10% Shopping
- 10% Misc/Savings`

export async function BudgetAgent(input: {
  salary: number
  investPercent: number
  personalPercent: number
  currentSpending: number
  month: string
  question: string
}): Promise<string> {
  const investBudget = (input.salary * input.investPercent) / 100
  const personalBudget = (input.salary * input.personalPercent) / 100
  const user = `
Monthly Salary: ₹${input.salary.toLocaleString('en-IN')}
Investment Budget: ₹${investBudget.toLocaleString('en-IN')} (${input.investPercent}%)
Personal Budget: ₹${personalBudget.toLocaleString('en-IN')} (${input.personalPercent}%)
Current Spending this month: ₹${input.currentSpending.toLocaleString('en-IN')}
Month: ${input.month}

User question: ${input.question}`
  return callGroq(BUDGET_SYSTEM, user, { temperature: 0.3 })
}

export async function InsightsAgent(input: {
  expenses: Expense[]
  budget: Budget | null
  month: string
  history?: { month: string; totalSpent: number }[]
}): Promise<{
  forecast: ForecastResult
  topCategories: { category: string; amount: number }[]
  anomalies: string[]
  comparison: { category: string; thisMonth: number; lastMonth: number }[]
  subscriptions: { name: string; estimatedAmount: number; frequency: string; aiConfidence: number }[]
}> {
  const categoryTotals: Record<string, number> = {}
  for (const e of input.expenses) {
    categoryTotals[e.category] = (categoryTotals[e.category] ?? 0) + e.amount
  }
  const totalSpent = input.expenses.reduce((s, e) => s + e.amount, 0)
  const now = new Date()
  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const weeklyBurnRate = totalSpent / Math.max(Math.ceil(dayOfMonth / 7), 1)
  const predictedMonthEnd = (totalSpent / dayOfMonth) * daysInMonth
  const safeToSpend = (input.budget?.personalBudget ?? 0) - totalSpent
  const riskLevel: ForecastResult['riskLevel'] =
    predictedMonthEnd > (input.budget?.personalBudget ?? Infinity) * 1.0
      ? 'high'
      : predictedMonthEnd > (input.budget?.personalBudget ?? Infinity) * 0.85
      ? 'medium'
      : 'low'

  const systemPrompt = `You are a financial analysis AI. Respond ONLY with valid JSON matching the schema exactly. No markdown, no explanation.`
  const userMsg = `
Analyse these expenses and return JSON:
{
  "advice": "string — 2-3 sentence spending advice in INR context",
  "anomalies": ["string array of unusual spending patterns"],
  "subscriptions": [{"name": "string", "estimatedAmount": number, "frequency": "monthly|weekly|yearly", "aiConfidence": number}]
}

Month: ${input.month}
Total spent: ₹${totalSpent.toLocaleString('en-IN')}
Personal budget: ₹${(input.budget?.personalBudget ?? 0).toLocaleString('en-IN')}
Category breakdown: ${JSON.stringify(categoryTotals)}
History: ${JSON.stringify(input.history?.slice(0, 3))}
Expenses (sample): ${JSON.stringify(input.expenses.slice(0, 30).map((e) => ({ desc: e.description, amount: e.amount, cat: e.category })))}
`
  let advice = 'Keep tracking your expenses to get personalised insights.'
  let anomalies: string[] = []
  let detectedSubs: { name: string; estimatedAmount: number; frequency: string; aiConfidence: number }[] = []

  try {
    const raw = await callGroq(systemPrompt, userMsg, { temperature: 0.3 })
    const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())
    advice = parsed.advice ?? advice
    anomalies = parsed.anomalies ?? []
    detectedSubs = parsed.subscriptions ?? []
  } catch {
    // fallback to computed values
  }

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }))

  const forecast: ForecastResult = {
    predictedMonthEnd: Math.round(predictedMonthEnd),
    safeToSpend: Math.round(safeToSpend),
    weeklyBurnRate: Math.round(weeklyBurnRate),
    riskLevel,
    advice,
  }

  const comparison = Object.keys(categoryTotals).map((cat) => ({
    category: cat,
    thisMonth: categoryTotals[cat],
    lastMonth: 0,
  }))

  return { forecast, topCategories, anomalies, comparison, subscriptions: detectedSubs }
}

export async function OrchestratorAgent(
  message: string,
  context: FinancialContext
): Promise<string> {
  const intentPrompt = `Classify this user message into exactly one intent: BUDGET_ADVICE | SPENDING_INSIGHT | ALERT_CHECK | GENERAL_CHAT
Reply with only the intent word.`
  const intent = (await callGroq(intentPrompt, message, { temperature: 0.1 })).trim() as Intent

  const salary = context.budget?.salary ?? context.salary ?? 0
  const totalSpent = (context.expenses ?? []).reduce((s, e) => s + e.amount, 0)

  if (intent === 'BUDGET_ADVICE') {
    return BudgetAgent({
      salary,
      investPercent: context.budget?.investPercent ?? 30,
      personalPercent: context.budget?.personalPercent ?? 70,
      currentSpending: totalSpent,
      month: context.month ?? '',
      question: message,
    })
  }

  if (intent === 'SPENDING_INSIGHT' || intent === 'ALERT_CHECK') {
    const result = await InsightsAgent({
      expenses: context.expenses ?? [],
      budget: context.budget ?? null,
      month: context.month ?? '',
    })
    return result.forecast.advice
  }

  return callGroq(BUDGET_SYSTEM, message, { temperature: 0.7 })
}

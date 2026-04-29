import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { uid, month } = await req.json()

    // Dynamic imports to avoid Firebase init at build time
    const [
      { InsightsAgent },
      { getBudget, getAllExpensesForMonths },
      { calculateCreditScore },
      { callGroq },
    ] = await Promise.all([
      import('@/lib/agents'),
      import('@/lib/firestore'),
      import('@/lib/creditScore'),
      import('@/lib/groq'),
    ])

    const budget = await getBudget(uid, month)
    const expenses = await getAllExpensesForMonths(uid, [month])
    const totalSpent = expenses.reduce((s: number, e: { amount: number }) => s + e.amount, 0)

    const insights = await InsightsAgent({ expenses, budget, month })
    const creditData = calculateCreditScore(expenses, budget, 1, true)

    const categoryBreakdown = insights.topCategories.map((c) => ({
      category: c.category,
      amount: c.amount,
      percent: totalSpent > 0 ? Math.round((c.amount / totalSpent) * 100) : 0,
    }))

    const summaryPrompt = `You are a financial report writer. Write a concise monthly financial summary in 3-4 sentences.
Use INR (₹). Be honest but encouraging.
Month: ${month}
Total spent: ₹${totalSpent.toLocaleString('en-IN')}
Budget: ₹${budget?.personalBudget.toLocaleString('en-IN') ?? 'N/A'}
Credit score: ${creditData.score} (${creditData.label})
Top categories: ${JSON.stringify(categoryBreakdown.slice(0, 3))}`

    const summary = await callGroq(summaryPrompt, 'Generate the monthly summary', { temperature: 0.3 })

    const highlightsPrompt = `List 2-3 things the user did WELL financially this month. Return as JSON array of strings. No markdown.
Month data: total ₹${totalSpent}, budget ₹${budget?.personalBudget ?? 0}, score ${creditData.score}`
    const lowlightsPrompt = `List 2-3 areas for financial improvement this month. Return as JSON array of strings. No markdown.
Month data: total ₹${totalSpent}, budget ₹${budget?.personalBudget ?? 0}, categories: ${JSON.stringify(categoryBreakdown)}`
    const recsPrompt = `Give 3 actionable financial recommendations for next month. Return as JSON array of strings. No markdown.
Budget: ₹${budget?.personalBudget ?? 0}, spent: ₹${totalSpent}, categories: ${JSON.stringify(categoryBreakdown)}`

    const [highlightsRaw, lowlightsRaw, recsRaw] = await Promise.all([
      callGroq('Return only valid JSON array of strings. No markdown.', highlightsPrompt, { temperature: 0.3 }),
      callGroq('Return only valid JSON array of strings. No markdown.', lowlightsPrompt, { temperature: 0.3 }),
      callGroq('Return only valid JSON array of strings. No markdown.', recsPrompt, { temperature: 0.3 }),
    ])

    const parse = (raw: string) => {
      try { return JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim()) } catch { return [] }
    }

    return NextResponse.json({
      month,
      summary,
      highlights: parse(highlightsRaw),
      lowlights: parse(lowlightsRaw),
      creditScore: creditData.score,
      recommendations: parse(recsRaw),
      categoryBreakdown,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 })
  }
}

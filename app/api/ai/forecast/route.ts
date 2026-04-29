import { NextRequest, NextResponse } from 'next/server'
import { InsightsAgent } from '@/lib/agents'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { expenses, budget, currentWeek, month } = await req.json()
    const result = await InsightsAgent({ expenses, budget, month: month ?? '' })
    return NextResponse.json(result.forecast)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Forecast failed' }, { status: 500 })
  }
}

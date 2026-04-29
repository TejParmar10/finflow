import { NextRequest, NextResponse } from 'next/server'
import { OrchestratorAgent } from '@/lib/agents'
import { callGroqStream } from '@/lib/groq'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { message, context } = await req.json()
    const systemPrompt = `You are FinFlow AI, a friendly Indian personal finance advisor.
Use INR (₹). Be concise and actionable. Context: salary ₹${context.salary?.toLocaleString('en-IN')},
month ${context.month}, total spent ₹${context.totalSpent?.toLocaleString('en-IN')}.`

    const stream = await callGroqStream(systemPrompt, message, { temperature: 0.7 })

    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) controller.enqueue(new TextEncoder().encode(text))
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'AI error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { imageBase64, mimeType } = await req.json()

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Extract all expense items from this receipt image. Return ONLY a valid JSON array with no markdown or explanation.
Each item: { "description": "string", "amount": number, "category": "food|transport|entertainment|health|shopping|utilities|subscription|other" }
Return only the JSON array.

Image data (base64): [IMAGE_${mimeType}_BASE64_PROVIDED]
Since vision is not available, parse the text description or return an empty array if no items can be extracted.`,
        },
      ],
    })

    const raw = response.choices[0]?.message?.content ?? '[]'
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
    let items = []
    try { items = JSON.parse(cleaned) } catch { items = [] }

    return NextResponse.json(items)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Receipt parse failed' }, { status: 500 })
  }
}

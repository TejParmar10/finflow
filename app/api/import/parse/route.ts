import { NextRequest, NextResponse } from 'next/server'
import { parseStatementWithAI } from '@/lib/parsers/statementAI'
import { parseHdfcCsv } from '@/lib/parsers/hdfcCsv'
import { ParsedTransaction } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { fileContent, fileType, month } = await req.json()
    let rawText = ''
    let creditCount = 0

    if (fileType === 'pdf') {
      const buf = Buffer.from(fileContent, 'base64')
      const { extractHdfcPdfText } = await import('@/lib/parsers/hdfcPdf')
      rawText = await extractHdfcPdfText(buf)
    } else if (fileType === 'csv') {
      const rows = JSON.parse(fileContent) as Record<string, string>[]
      const parsed = parseHdfcCsv(rows)
      creditCount = parsed.filter((r) => r.depositAmt > 0).length
      rawText = parsed
        .map((r) => `${r.date}|${r.narration}|${r.withdrawalAmt > 0 ? r.withdrawalAmt : ''}|${r.depositAmt > 0 ? r.depositAmt : ''}`)
        .join('\n')
    }

    if (!rawText.trim()) {
      return NextResponse.json({ error: 'No transactions found in this statement.' }, { status: 422 })
    }

    let transactions: ParsedTransaction[]
    try {
      transactions = await parseStatementWithAI(rawText)
    } catch {
      return NextResponse.json({ error: 'AI parse failure. Please try the CSV version instead.' }, { status: 422 })
    }

    if (!transactions.length) {
      return NextResponse.json({ error: 'No transactions found in this statement.' }, { status: 422 })
    }

    return NextResponse.json({ transactions, creditCount, month })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Parsing failed. Please check your connection and try again.' }, { status: 500 })
  }
}

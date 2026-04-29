import { NextRequest, NextResponse } from 'next/server'
import { parseStatementWithAI } from '@/lib/parsers/statementAI'
import { parseHdfcCsv } from '@/lib/parsers/hdfcCsv'
import { parseGpayCsvText } from '@/lib/parsers/gpayCsv'
import { ParsedTransaction } from '@/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

function isGpayContent(text: string): boolean {
  return (
    text.includes('Google Pay') ||
    text.includes('Transaction statement') ||
    text.includes('UPI Transaction ID') ||
    text.includes('Paid to') ||
    text.includes('Paid by HDFC Bank')
  )
}

function isGpayCsv(rawText: string): boolean {
  const firstLines = rawText.slice(0, 500).toLowerCase()
  return (
    firstLines.includes('transaction statement') ||
    firstLines.includes('date & time') ||
    firstLines.includes('paid to') ||
    firstLines.includes('upi transaction id')
  )
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { fileContent, fileType, month } = await req.json()
    let transactions: ParsedTransaction[] = []
    let creditCount = 0

    if (fileType === 'pdf') {
      const buf = Buffer.from(fileContent, 'base64')
      const { extractHdfcPdfText } = await import('@/lib/parsers/hdfcPdf')
      const rawText = await extractHdfcPdfText(buf)

      if (!rawText.trim()) {
        return NextResponse.json({ error: 'No transactions found in this statement.' }, { status: 422 })
      }

      try {
        // Use AI to parse — works for both HDFC and Google Pay PDFs
        const isGpay = isGpayContent(rawText)
        transactions = await parseStatementWithAI(rawText, isGpay ? 'gpay' : 'hdfc')
      } catch {
        return NextResponse.json(
          { error: 'AI parse failure. Please try the CSV version instead.' },
          { status: 422 }
        )
      }
    } else if (fileType === 'csv') {
      // fileContent is raw CSV text (sent as-is from client)
      const rawCsvText = fileContent as string

      if (isGpayCsv(rawCsvText)) {
        // Google Pay CSV — parse directly, no AI needed
        const result = parseGpayCsvText(rawCsvText)
        transactions = result.transactions
        creditCount = result.creditCount
      } else {
        // HDFC CSV — parse with existing logic
        let rows: Record<string, string>[]
        try {
          rows = JSON.parse(rawCsvText)
        } catch {
          rows = []
        }
        const parsed = parseHdfcCsv(rows)
        creditCount = parsed.filter((r) => r.depositAmt > 0).length
        const rowText = parsed
          .map((r) => `${r.date}|${r.narration}|${r.withdrawalAmt > 0 ? r.withdrawalAmt : ''}|${r.depositAmt > 0 ? r.depositAmt : ''}`)
          .join('\n')
        if (!rowText.trim()) {
          return NextResponse.json({ error: 'No transactions found in this statement.' }, { status: 422 })
        }
        transactions = await parseStatementWithAI(rowText, 'hdfc')
      }
    }

    if (!transactions.length) {
      return NextResponse.json({ error: 'No transactions found in this statement.' }, { status: 422 })
    }

    return NextResponse.json({ transactions, creditCount, month })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: 'Parsing failed. Please check your connection and try again.' },
      { status: 500 }
    )
  }
}

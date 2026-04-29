import { ParsedTransaction } from '@/types'

const CATEGORY_RULES: [RegExp, string][] = [
  [/zomato|swiggy|blinkit|grofers|zepto|dunzo|box8|meal|food|cafe|restaurant|pizza|burger|biryani|nesco|naturals/i, 'food'],
  [/mmrda|metro|uber|ola|rapido|auto|taxi|bus|petrol|fuel|irctc|flight|travel|gbcb/i, 'transport'],
  [/netflix|spotify|prime|bookmyshow|hotstar|zee5|apple media|youtube|jio cinema/i, 'entertainment'],
  [/pharmacy|hospital|clinic|apollo|medplus|doctor|lab|diagnostic|health/i, 'health'],
  [/amazon|flipkart|myntra|ajio|nykaa|meesho|snapdeal|shop/i, 'shopping'],
  [/electricity|broadband|mobile|jio|airtel|bsnl|vodafone|water|gas bill|recharge|wifi/i, 'utilities'],
]

function autoCategory(description: string): string {
  for (const [regex, cat] of CATEGORY_RULES) {
    if (regex.test(description)) return cat
  }
  return 'other'
}

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/[₹,\s]/g, '')) || 0
}

function parseGpayDate(raw: string): string {
  // Input: "02 Mar, 2026" → Output: "02/03/2026"
  const months: Record<string, string> = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
  }
  const m = raw.match(/(\d{1,2})\s+(\w{3}),?\s+(\d{4})/)
  if (!m) return raw
  const [, day, mon, year] = m
  return `${day.padStart(2, '0')}/${months[mon] ?? '01'}/${year}`
}

export function parseGpayCsvText(csvText: string): { transactions: ParsedTransaction[]; creditCount: number } {
  const lines = csvText.split('\n').map((l) => l.trim())
  const transactions: ParsedTransaction[] = []
  let creditCount = 0

  // Find the row that starts with "Date & time"
  let dataStart = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('Date & time') || lines[i].startsWith('"Date & time"')) {
      dataStart = i + 1
      break
    }
  }
  if (dataStart === -1) return { transactions: [], creditCount: 0 }

  // Parse groups of rows. Each transaction's first row has: date, description, amount
  let i = dataStart
  let currentDate = ''

  while (i < lines.length) {
    const cols = parseCSVLine(lines[i])
    if (!cols || cols.length < 2) { i++; continue }

    const col0 = cols[0]?.trim() ?? ''
    const col1 = cols[1]?.trim() ?? ''
    const col2 = cols[2]?.trim() ?? ''

    // Skip footer/note lines
    if (col1.toLowerCase().startsWith('any payments') || col1.toLowerCase().startsWith('note:') || col1.toLowerCase().startsWith('self transfer')) {
      i++; continue
    }

    // Detect if this is a transaction start row (col0 has date OR col1 starts with Paid/Received)
    const isTransactionStart = /^\d{1,2}\s+\w{3},?\s+\d{4}/.test(col0) ||
      (col1.startsWith('Paid to') || col1.startsWith('Received from'))

    if (isTransactionStart) {
      if (/^\d{1,2}\s+\w{3},?\s+\d{4}/.test(col0)) {
        currentDate = parseGpayDate(col0)
      }

      const description = col1
      const amountRaw = col2

      if (!description || !amountRaw) { i++; continue }

      const isPaid = description.startsWith('Paid to')
      const isReceived = description.startsWith('Received from')

      if (!isPaid && !isReceived) { i++; continue }

      const amount = parseAmount(amountRaw)
      if (amount <= 0) { i++; continue }

      // Extract merchant name: "Paid to Zomato" → "Zomato"
      const merchant = isPaid
        ? description.replace(/^Paid to\s+/i, '').trim()
        : description.replace(/^Received from\s+/i, '').trim()

      if (isPaid) {
        transactions.push({
          date: currentDate,
          description: merchant,
          rawDescription: description,
          amount,
          type: 'debit',
          category: autoCategory(merchant),
          confidence: 0.9,
          isDuplicate: false,
          selected: true,
        })
      } else {
        creditCount++
      }
    }
    i++
  }

  return { transactions, creditCount }
}

// Minimal CSV line parser (handles quoted fields)
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

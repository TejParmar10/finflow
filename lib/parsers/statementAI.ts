import { callGroq } from '../groq'
import { ParsedTransaction } from '@/types'

const HDFC_SYSTEM = `You are a financial data extraction assistant. Extract all transactions from this HDFC Bank statement and return ONLY a valid JSON array. No explanation, no markdown, no backticks.

Each object must have exactly these fields:
{
  "date": "string (DD/MM/YYYY)",
  "description": "string (clean merchant name, remove ref numbers)",
  "rawDescription": "string (original narration as-is)",
  "amount": number (always positive),
  "type": "debit" | "credit",
  "confidence": number (0 to 1)
}

Rules:
- Withdrawal Amt = debit, Deposit Amt = credit
- Clean description: extract merchant name ('UPI-ZOMATO-food@upi' → 'Zomato')
- Remove UPI reference numbers, bank codes, transaction IDs
- Return only the JSON array, nothing else`

const GPAY_SYSTEM = `You are a financial data extraction assistant. Extract all transactions from this Google Pay statement and return ONLY a valid JSON array. No explanation, no markdown, no backticks.

Each object must have exactly these fields:
{
  "date": "string (DD/MM/YYYY)",
  "description": "string (clean merchant name only)",
  "rawDescription": "string (original transaction details as-is)",
  "amount": number (always positive, remove ₹ and commas),
  "type": "debit" | "credit",
  "confidence": number (0 to 1)
}

Rules:
- "Paid to X" = debit, "Received from X" = credit
- Clean description: just the merchant/person name (e.g. 'Paid to Zomato' → 'Zomato')
- Remove UPI Transaction IDs, "Paid by HDFC Bank" lines
- Date format in input may be "02 Mar, 2026" — convert to DD/MM/YYYY
- Return only the JSON array, nothing else`

const CATEGORY_RULES: [RegExp, string][] = [
  [/zomato|swiggy|blinkit|grofers|zepto|dunzo|box8|meal|food|cafe|restaurant|pizza|burger|biryani|nesco|naturals/i, 'food'],
  [/mmrda|metro|uber|ola|rapido|auto|taxi|bus|petrol|fuel|irctc|flight|travel|gbcb/i, 'transport'],
  [/netflix|spotify|prime|bookmyshow|hotstar|zee5|apple media|youtube|jio cinema/i, 'entertainment'],
  [/pharmacy|hospital|clinic|apollo|medplus|doctor|lab|diagnostic|health/i, 'health'],
  [/amazon|flipkart|myntra|ajio|nykaa|meesho|snapdeal|shop/i, 'shopping'],
  [/electricity|broadband|mobile|jio|airtel|bsnl|vodafone|water|gas|recharge|wifi/i, 'utilities'],
]

function autoCategory(description: string): string {
  for (const [regex, cat] of CATEGORY_RULES) {
    if (regex.test(description)) return cat
  }
  return 'other'
}

export async function parseStatementWithAI(
  rawText: string,
  source: 'hdfc' | 'gpay' = 'hdfc'
): Promise<ParsedTransaction[]> {
  const system = source === 'gpay' ? GPAY_SYSTEM : HDFC_SYSTEM
  const content = rawText.slice(0, 12000)
  const raw = await callGroq(system, content, { temperature: 0.1, maxTokens: 4096 })
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()

  let items: Omit<ParsedTransaction, 'isDuplicate' | 'selected'>[] = []
  try {
    items = JSON.parse(cleaned)
  } catch {
    throw new Error('AI could not parse statement')
  }

  return items
    .filter((t) => t.type === 'debit')
    .map((t) => ({
      ...t,
      category: autoCategory(t.description),
      isDuplicate: false,
      selected: true,
    }))
}

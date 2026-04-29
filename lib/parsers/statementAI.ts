import { callGroq } from '../groq'
import { ParsedTransaction } from '@/types'

const SYSTEM = `You are a financial data extraction assistant. Extract all transactions from this HDFC Bank statement and return ONLY a valid JSON array. No explanation, no markdown, no backticks.

Each object must have exactly these fields:
{
  "date": "string (DD/MM/YYYY)",
  "description": "string (clean merchant name, remove ref numbers)",
  "rawDescription": "string (original narration as-is)",
  "amount": number,
  "type": "debit" | "credit",
  "confidence": number
}

Rules:
- Withdrawal Amt = debit, Deposit Amt = credit
- Clean description: extract merchant name ('UPI-ZOMATO-food@upi' → 'Zomato')
- Remove UPI reference numbers, bank codes, transaction IDs
- Keep all transactions including salary, EMI, bank charges
- Return only the JSON array, nothing else`

const CATEGORY_RULES: [RegExp, string][] = [
  [/zomato|swiggy|restaurant|food|cafe|bake|pizza|burger|biryani|diner/i, 'food'],
  [/uber|ola|metro|petrol|fuel|nmmtc|rapido|auto|taxi|irctc|flight|travel/i, 'transport'],
  [/netflix|spotify|prime|bookmyshow|hotstar|zee5|apple music|youtube premium/i, 'entertainment'],
  [/pharmacy|hospital|clinic|apollo|medplus|healthkart|doctor|lab|diagnostic/i, 'health'],
  [/amazon|flipkart|myntra|ajio|nykaa|meesho|snapdeal/i, 'shopping'],
  [/electricity|broadband|mobile recharge|jio|airtel|bsnl|vodafone|water bill|gas bill/i, 'utilities'],
]

function autoCategory(description: string): string {
  for (const [regex, cat] of CATEGORY_RULES) {
    if (regex.test(description)) return cat
  }
  return 'other'
}

export async function parseStatementWithAI(rawText: string): Promise<ParsedTransaction[]> {
  const content = rawText.slice(0, 12000) // token limit guard
  const raw = await callGroq(SYSTEM, content, { temperature: 0.1, maxTokens: 4096 })
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
  let transactions: Omit<ParsedTransaction, 'isDuplicate' | 'selected'>[] = []
  try {
    transactions = JSON.parse(cleaned)
  } catch {
    throw new Error('AI could not parse statement')
  }

  return transactions
    .filter((t) => t.type === 'debit')
    .map((t) => ({
      ...t,
      category: autoCategory(t.description),
      isDuplicate: false,
      selected: true,
    }))
}

import { ParsedTransaction, Expense } from '@/types'
import { Timestamp } from 'firebase/firestore'
import { parse, format } from 'date-fns'

function similarity(a: string, b: string): number {
  const s1 = a.toLowerCase()
  const s2 = b.toLowerCase()
  if (s1 === s2) return 1
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  if (longer.length === 0) return 1
  let matches = 0
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) matches++
  }
  return matches / longer.length
}

export async function detectDuplicates(
  parsedTransactions: ParsedTransaction[],
  existingExpenses: Expense[]
): Promise<ParsedTransaction[]> {
  return parsedTransactions.map((tx) => {
    let txDate: Date | null = null
    try {
      txDate = parse(tx.date, 'dd/MM/yyyy', new Date())
    } catch {
      return { ...tx, isDuplicate: false }
    }
    const txDateStr = format(txDate, 'yyyy-MM-dd')

    const isDup = existingExpenses.some((e) => {
      if (!e.date) return false
      const eDate = e.date instanceof Timestamp ? e.date.toDate() : new Date(e.date as unknown as string)
      const eDateStr = format(eDate, 'yyyy-MM-dd')
      if (eDateStr !== txDateStr) return false
      if (Math.abs(e.amount - tx.amount) > 0.01) return false
      const sim = similarity(e.description, tx.description)
      return sim > 0.8
    })

    return { ...tx, isDuplicate: isDup }
  })
}

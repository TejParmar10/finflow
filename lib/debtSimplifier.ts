import { Balance, SimplifiedDebt } from '@/types'

/**
 * Greedy debt simplification.
 * 1. Compute net balance per person (positive = owed money, negative = owes money)
 * 2. Split into creditors (+) and debtors (-)
 * 3. Repeatedly match largest debtor with largest creditor until all settled
 */
export function simplifyDebts(
  balances: Balance[],
  memberMap: Record<string, { name: string; upiId?: string }>
): SimplifiedDebt[] {
  // net[uid] = positive → others owe them; negative → they owe others
  const net: Record<string, number> = {}
  for (const b of balances) {
    net[b.fromUid] = (net[b.fromUid] ?? 0) - b.amount
    net[b.toUid]   = (net[b.toUid]   ?? 0) + b.amount
  }

  // Round to avoid floating-point drift
  const rounded = Object.fromEntries(
    Object.entries(net).map(([uid, amt]) => [uid, Math.round(amt * 100) / 100])
  )

  const creditors = Object.entries(rounded)
    .filter(([, v]) => v > 0)
    .map(([uid, v]) => ({ uid, amount: v }))
    .sort((a, b) => b.amount - a.amount)

  const debtors = Object.entries(rounded)
    .filter(([, v]) => v < 0)
    .map(([uid, v]) => ({ uid, amount: -v }))
    .sort((a, b) => b.amount - a.amount)

  const result: SimplifiedDebt[] = []

  let ci = 0
  let di = 0
  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci]
    const debtor   = debtors[di]
    const settle   = Math.min(creditor.amount, debtor.amount)

    if (settle > 0.01) {
      result.push({
        fromUid:  debtor.uid,
        fromName: memberMap[debtor.uid]?.name ?? debtor.uid,
        toUid:    creditor.uid,
        toName:   memberMap[creditor.uid]?.name ?? creditor.uid,
        toUpiId:  memberMap[creditor.uid]?.upiId,
        amount:   Math.round(settle * 100) / 100,
      })
    }

    creditor.amount -= settle
    debtor.amount   -= settle

    if (creditor.amount < 0.01) ci++
    if (debtor.amount   < 0.01) di++
  }

  return result
}

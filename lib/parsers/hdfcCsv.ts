export interface HdfcRow {
  date: string
  narration: string
  chqRefNo: string
  valueDt: string
  withdrawalAmt: number
  depositAmt: number
  closingBalance: number
}

export function parseHdfcCsv(rows: Record<string, string>[]): HdfcRow[] {
  const result: HdfcRow[] = []
  for (const row of rows) {
    const keys = Object.keys(row)
    // Find the date key
    const dateKey = keys.find((k) => k.toLowerCase().includes('date') && !k.toLowerCase().includes('value'))
    const narKey = keys.find((k) => k.toLowerCase().includes('narration') || k.toLowerCase().includes('description'))
    const withdrawKey = keys.find((k) => k.toLowerCase().includes('withdrawal'))
    const depositKey = keys.find((k) => k.toLowerCase().includes('deposit'))
    const balKey = keys.find((k) => k.toLowerCase().includes('balance') || k.toLowerCase().includes('closing'))
    const refKey = keys.find((k) => k.toLowerCase().includes('chq') || k.toLowerCase().includes('ref'))
    const valDtKey = keys.find((k) => k.toLowerCase().includes('value'))

    if (!dateKey || !narKey) continue
    const dateVal = row[dateKey]?.trim()
    if (!dateVal || dateVal === 'Date') continue

    const withdrawal = parseFloat(String(row[withdrawKey ?? ''] ?? '').replace(/,/g, '')) || 0
    const deposit = parseFloat(String(row[depositKey ?? ''] ?? '').replace(/,/g, '')) || 0
    const balance = parseFloat(String(row[balKey ?? ''] ?? '').replace(/,/g, '')) || 0

    result.push({
      date: dateVal,
      narration: row[narKey]?.trim() ?? '',
      chqRefNo: row[refKey ?? '']?.trim() ?? '',
      valueDt: row[valDtKey ?? '']?.trim() ?? '',
      withdrawalAmt: withdrawal,
      depositAmt: deposit,
      closingBalance: balance,
    })
  }
  return result
}

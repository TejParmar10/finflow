'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, subMonths } from 'date-fns'
import { serverTimestamp, Timestamp } from 'firebase/firestore'
import { parse as dateParse } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuthContext } from '@/components/AuthProvider'
import { useBudget } from '@/hooks/useBudget'
import { useExpenses } from '@/hooks/useExpenses'
import { detectDuplicates } from '@/lib/duplicateDetector'
import { addExpense } from '@/lib/firestore'
import { FileUploader } from '@/components/import/FileUploader'
import { TransactionReviewTable } from '@/components/import/TransactionReviewTable'
import { ImportSummaryCard } from '@/components/import/ImportSummaryCard'
import { Card } from '@/components/ui/Card'
import { ParsedTransaction, ExpenseCategory } from '@/types'
import { Info } from 'lucide-react'

type Stage = 'upload' | 'review' | 'done'

function getMonthOptions() {
  return Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i)
    return { value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy') }
  })
}

export default function ImportPage() {
  const { user } = useAuthContext()
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('upload')
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([])
  const [creditCount, setCreditCount] = useState(0)
  const [idToken, setIdToken] = useState('')
  const [importSummary, setImportSummary] = useState<{
    count: number; total: number; skipped: number
    breakdown: { category: string; amount: number }[]
  } | null>(null)

  const { expenses } = useExpenses(user?.uid ?? null, selectedMonth)

  useEffect(() => { if (!user) router.replace('/') }, [user, router])
  useEffect(() => { user?.getIdToken().then(setIdToken) }, [user])

  const handleParsed = async (raw: unknown[]) => {
    const parsed = raw as ParsedTransaction[]
    const withDupes = await detectDuplicates(parsed, expenses)
    setTransactions(withDupes.map((t) => ({ ...t, selected: !t.isDuplicate })))
    setCreditCount(0)
    setStage('review')
  }

  const handleImport = async () => {
    if (!user?.uid) return
    const selected = transactions.filter((t) => t.selected)
    if (selected.length === 0) { toast.error('Select at least one transaction'); return }

    const loadingToast = toast.loading(`Importing ${selected.length} transactions...`)
    try {
      let total = 0
      const catMap: Record<string, number> = {}
      for (const tx of selected) {
        let txDate: Date
        try { txDate = dateParse(tx.date, 'dd/MM/yyyy', new Date()) } catch { txDate = new Date() }
        const week = Math.ceil(txDate.getDate() / 7)
        await addExpense(user.uid, {
          category: tx.category as ExpenseCategory,
          amount: tx.amount,
          description: tx.description,
          date: Timestamp.fromDate(txDate),
          month: selectedMonth,
          week,
          aiCategorised: true,
          importedFrom: 'hdfc_statement',
          importedAt: serverTimestamp() as any,
          createdAt: serverTimestamp() as any,
        })
        total += tx.amount
        catMap[tx.category] = (catMap[tx.category] ?? 0) + tx.amount
      }
      const skipped = transactions.filter((t) => t.isDuplicate && !t.selected).length
      setImportSummary({
        count: selected.length,
        total,
        skipped,
        breakdown: Object.entries(catMap)
          .map(([category, amount]) => ({ category, amount }))
          .sort((a, b) => b.amount - a.amount),
      })
      toast.dismiss(loadingToast)
      toast.success(`${selected.length} transactions imported!`)
      setStage('done')
    } catch {
      toast.dismiss(loadingToast)
      toast.error('Import failed. Please try again.')
    }
  }

  if (!user) return null
  const monthOptions = getMonthOptions()

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-text-primary">Import Bank Statement</h1>
        <p className="text-sm text-text-muted mt-1">HDFC Bank · PDF or CSV</p>
      </div>

      <div className="flex items-start gap-3 bg-[rgba(78,205,196,0.08)] border border-[rgba(78,205,196,0.15)] rounded-xl px-4 py-3">
        <Info size={16} className="text-accent-teal mt-0.5 flex-shrink-0" />
        <p className="text-xs text-text-muted">
          Your statement is processed securely and never stored on our servers. Only the parsed transactions are saved to your account.
        </p>
      </div>

      {stage !== 'done' && (
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Statement Month</h3>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-[rgba(255,255,255,0.3)]"
          >
            {monthOptions.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Card>
      )}

      {stage === 'upload' && idToken && (
        <Card>
          <h3 className="text-sm font-semibold text-text-primary mb-4">Upload Statement</h3>
          <FileUploader
            month={selectedMonth}
            idToken={idToken}
            onParsed={handleParsed}
            existingExpenses={expenses}
          />
        </Card>
      )}

      {stage === 'review' && (
        <Card padding={false}>
          <div className="p-5 border-b border-[rgba(255,255,255,0.05)]">
            <h3 className="text-sm font-semibold text-text-primary">Review Transactions</h3>
          </div>
          <div className="p-5">
            <TransactionReviewTable
              transactions={transactions}
              creditCount={creditCount}
              onTransactionsChange={setTransactions}
              onImport={handleImport}
              onCancel={() => { setStage('upload'); setTransactions([]) }}
            />
          </div>
        </Card>
      )}

      {stage === 'done' && importSummary && (
        <ImportSummaryCard
          importedCount={importSummary.count}
          totalAmount={importSummary.total}
          skippedDuplicates={importSummary.skipped}
          categoryBreakdown={importSummary.breakdown}
          onImportAnother={() => { setStage('upload'); setTransactions([]); setImportSummary(null) }}
        />
      )}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ImportSummaryCardProps {
  importedCount: number
  totalAmount: number
  skippedDuplicates: number
  categoryBreakdown: { category: string; amount: number }[]
  onImportAnother: () => void
}

export function ImportSummaryCard({ importedCount, totalAmount, skippedDuplicates, categoryBreakdown, onImportAnother }: ImportSummaryCardProps) {
  return (
    <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(0,200,150,0.2)] rounded-[16px] p-6 space-y-5 text-center">
      <div className="flex justify-center">
        <CheckCircle size={48} className="text-accent-green" />
      </div>
      <div>
        <h3 className="text-xl font-serif text-text-primary mb-1">Import Complete!</h3>
        <p className="text-sm text-text-muted">
          {importedCount} transactions imported · ₹{totalAmount.toLocaleString('en-IN')} total
        </p>
        {skippedDuplicates > 0 && (
          <p className="text-xs text-accent-yellow mt-1">{skippedDuplicates} duplicates were skipped</p>
        )}
      </div>

      {categoryBreakdown.length > 0 && (
        <div className="text-left space-y-2">
          <p className="text-xs text-text-muted font-medium uppercase tracking-wide">By Category</p>
          {categoryBreakdown.map(({ category, amount }) => {
            const pct = totalAmount > 0 ? (amount / totalAmount) * 100 : 0
            return (
              <div key={category} className="space-y-0.5">
                <div className="flex justify-between text-xs">
                  <span className="text-text-primary capitalize">{category}</span>
                  <span className="text-text-muted">₹{amount.toLocaleString('en-IN')} ({Math.round(pct)}%)</span>
                </div>
                <div className="h-1 bg-[rgba(255,255,255,0.06)] rounded-full">
                  <div className="h-full bg-accent-teal rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/tracker" className="flex-1">
          <Button variant="secondary" className="w-full">View in Tracker</Button>
        </Link>
        <Button onClick={onImportAnother} className="flex-1">Import Another</Button>
      </div>
    </div>
  )
}

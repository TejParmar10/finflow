'use client'

import { format, parseISO } from 'date-fns'
import { Card } from '@/components/ui/Card'
import { Budget } from '@/types'

interface MonthEntry {
  month: string
  budget: Budget | null
  totalSpent: number
}

interface MonthHistoryProps {
  history: MonthEntry[]
}

export function MonthHistory({ history }: MonthHistoryProps) {
  return (
    <Card padding={false}>
      <div className="p-5 border-b border-[rgba(255,255,255,0.05)]">
        <h3 className="text-sm font-semibold text-text-primary">Month History</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.05)]">
              {['Month', 'Salary', 'Invested', 'Spent', 'Budget', 'Score', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs text-text-muted font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((row) => {
              if (!row.budget) return null
              const over = row.totalSpent > row.budget.personalBudget
              return (
                <tr key={row.month} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="px-4 py-3 text-text-primary">{format(parseISO(row.month + '-01'), 'MMM yyyy')}</td>
                  <td className="px-4 py-3 text-text-muted">₹{row.budget.salary.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-accent-teal">₹{row.budget.investBudget.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-text-primary">₹{row.totalSpent.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-text-muted">₹{row.budget.personalBudget.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-text-primary">—</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${over ? 'bg-[rgba(255,107,107,0.15)] text-accent-coral' : 'bg-[rgba(0,200,150,0.15)] text-accent-green'}`}>
                      {over ? 'Over Budget' : 'Under Budget'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {history.every((r) => !r.budget) && (
          <p className="text-center py-6 text-sm text-text-muted">No history yet. Save a budget to start tracking.</p>
        )}
      </div>
    </Card>
  )
}

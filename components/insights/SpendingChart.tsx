'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { format } from 'date-fns'
import { Expense } from '@/types'

interface SpendingChartProps {
  expenses: Expense[]
}

type View = 'daily' | 'category' | 'comparison'

export function SpendingChart({ expenses }: SpendingChartProps) {
  const [view, setView] = useState<View>('daily')

  const dailyData = (() => {
    const map: Record<string, number> = {}
    expenses.forEach((e) => {
      if (!e.date) return
      const d = e.date && typeof (e.date as any).toDate === 'function' ? (e.date as any).toDate() : new Date(e.date as any)
      const key = format(d, 'dd MMM')
      map[key] = (map[key] ?? 0) + e.amount
    })
    return Object.entries(map).map(([date, amount]) => ({ date, amount }))
  })()

  const categoryData = (() => {
    const map: Record<string, number> = {}
    expenses.forEach((e) => { map[e.category] = (map[e.category] ?? 0) + e.amount })
    return Object.entries(map).map(([category, amount]) => ({ category, amount }))
  })()

  const data = view === 'category' ? categoryData : dailyData
  const key = view === 'category' ? 'category' : 'date'

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['daily', 'category', 'comparison'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1 rounded-full text-xs transition-all ${view === v ? 'bg-accent-teal text-white' : 'bg-[rgba(255,255,255,0.06)] text-text-muted hover:text-text-primary'}`}
          >
            {v === 'daily' ? 'Daily' : v === 'category' ? 'By Category' : 'vs Last Month'}
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-text-muted text-sm">No data to display</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey={key} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: '#141622', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#E8EAF6' }}
              formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Amount']}
            />
            <Bar dataKey="amount" fill="#4ECDC4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

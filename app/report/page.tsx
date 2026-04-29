'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, subMonths } from 'date-fns'
import { useAuthContext } from '@/components/AuthProvider'
import { useBudget } from '@/hooks/useBudget'
import { useExpenses } from '@/hooks/useExpenses'
import { MonthlyReport } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CreditScoreArc } from '@/components/dashboard/CreditScoreArc'
import { AIChat } from '@/components/chat/AIChat'
import { FileText, Download, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { CreditScoreData } from '@/types'

function getMonthOptions() {
  return Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i)
    return { value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy') }
  })
}

function scoreToData(score: number): CreditScoreData {
  if (score >= 800) return { score, label: 'Excellent', color: '#00C896' }
  if (score >= 740) return { score, label: 'Very Good', color: '#4ECDC4' }
  if (score >= 670) return { score, label: 'Good', color: '#FFE66D' }
  if (score >= 580) return { score, label: 'Fair', color: '#FF8B94' }
  return { score, label: 'Poor', color: '#FF6B6B' }
}

export default function ReportPage() {
  const { user } = useAuthContext()
  const router = useRouter()
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [generating, setGenerating] = useState(false)
  const [idToken, setIdToken] = useState('')
  const currentMonth = format(new Date(), 'yyyy-MM')
  const { budget } = useBudget(user?.uid ?? null)
  const { expenses } = useExpenses(user?.uid ?? null, currentMonth)

  useEffect(() => { if (!user) router.replace('/') }, [user, router])
  useEffect(() => { user?.getIdToken().then(setIdToken) }, [user])

  const generate = async () => {
    if (!user?.uid || !idToken) return
    setGenerating(true)
    try {
      const res = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ uid: user.uid, month: selectedMonth }),
      })
      if (!res.ok) throw new Error('Report generation failed')
      setReport(await res.json())
    } catch {
      toast.error('Report generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const downloadPDF = async () => {
    if (!report || !user) return
    try {
      const [{ pdf }, { ReportDocument }, React] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/report/ReportDocument'),
        import('react'),
      ])
      const element = React.createElement(ReportDocument, { report, userName: user.displayName ?? '' })
      const blob = await pdf(element as any).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `FinFlow-Report-${format(new Date(report.month + '-01'), 'MMMM-yyyy')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error('PDF generation failed.')
      console.error(e)
    }
  }

  if (!user) return null
  const monthOptions = getMonthOptions()

  return (
    <>
      <div className="max-w-4xl mx-auto py-6 space-y-6">
        <div>
          <h1 className="font-serif text-3xl text-text-primary">Monthly Report</h1>
          <p className="text-sm text-text-muted mt-1">AI-generated financial summary</p>
        </div>

        <Card>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[rgba(255,255,255,0.5)] font-medium uppercase tracking-wide block mb-2">
                Select Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => { setSelectedMonth(e.target.value); setReport(null) }}
                className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none"
              >
                {monthOptions.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <Button onClick={generate} disabled={generating} className="w-full gap-2">
              <FileText size={16} />
              {generating ? 'AI is analysing your finances...' : 'Generate AI Report'}
            </Button>
          </div>
        </Card>

        {generating && (
          <div className="flex items-center gap-3 justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-accent-teal border-t-transparent rounded-full" />
            <p className="text-sm text-text-muted">AI is analysing your finances...</p>
          </div>
        )}

        {report && (
          <div className="space-y-5">
            <Card>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-xl text-text-primary">
                    FinFlow Monthly Report — {format(new Date(report.month + '-01'), 'MMMM yyyy')}
                  </h2>
                  <p className="text-xs text-text-muted mt-1">
                    {user.displayName} · Generated {format(new Date(), 'dd MMM yyyy')}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={downloadPDF} className="gap-2 flex-shrink-0">
                  <Download size={14} />
                  Download PDF
                </Button>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="flex flex-col items-center text-center">
                <CreditScoreArc data={scoreToData(report.creditScore)} size={140} />
                <p className="text-xs text-text-muted mt-2">Financial Health Score</p>
              </Card>
              <Card className="md:col-span-2">
                <h3 className="text-sm font-semibold text-text-primary mb-2">Summary</h3>
                <p className="text-sm text-text-muted leading-relaxed">{report.summary}</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <h3 className="text-sm font-semibold text-accent-green mb-3 flex items-center gap-2">
                  <CheckCircle size={14} /> What You Did Well
                </h3>
                <ul className="space-y-2">
                  {(report.highlights ?? []).map((h, i) => (
                    <li key={i} className="text-sm text-text-muted flex items-start gap-2">
                      <span className="text-accent-green mt-0.5 flex-shrink-0">•</span>{h}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card>
                <h3 className="text-sm font-semibold text-accent-coral mb-3 flex items-center gap-2">
                  <AlertCircle size={14} /> Areas to Improve
                </h3>
                <ul className="space-y-2">
                  {(report.lowlights ?? []).map((l, i) => (
                    <li key={i} className="text-sm text-text-muted flex items-start gap-2">
                      <span className="text-accent-coral mt-0.5 flex-shrink-0">•</span>{l}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            <Card>
              <h3 className="text-sm font-semibold text-text-primary mb-3">Spending Breakdown</h3>
              <div className="space-y-3">
                {(report.categoryBreakdown ?? []).map(({ category, amount, percent }) => (
                  <div key={category} className="flex items-center gap-3">
                    <span className="text-sm text-text-primary capitalize w-28">{category}</span>
                    <div className="flex-1 h-2 bg-[rgba(255,255,255,0.06)] rounded-full">
                      <div className="h-full bg-accent-teal rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="text-xs text-text-muted w-8 text-right">{percent}%</span>
                    <span className="text-sm font-medium text-text-primary w-28 text-right">
                      ₹{amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-text-primary mb-3">AI Recommendations</h3>
              <ol className="space-y-3">
                {(report.recommendations ?? []).map((rec, i) => (
                  <li key={i} className="text-sm text-text-muted flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[rgba(78,205,196,0.15)] text-accent-teal text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">
                      {i + 1}
                    </span>
                    {rec}
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        )}
      </div>

      {idToken && (
        <AIChat idToken={idToken} budget={budget} expenses={expenses} month={currentMonth} />
      )}
    </>
  )
}

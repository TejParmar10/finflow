'use client'

import { RefreshCw } from 'lucide-react'
import { ForecastResult } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

interface ForecastCardProps {
  forecast: ForecastResult | null
  loading: boolean
  onRefresh: () => void
}

export function ForecastCard({ forecast, loading, onRefresh }: ForecastCardProps) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-4 bg-[rgba(255,255,255,0.08)] rounded w-1/3 mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[rgba(255,255,255,0.04)] rounded-lg" />
          ))}
        </div>
      </Card>
    )
  }

  if (!forecast) return null

  const riskColors = { low: 'green', medium: 'yellow', high: 'coral' } as const

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">Month-End Forecast</h3>
        <button onClick={onRefresh} className="text-text-muted hover:text-accent-teal transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-[rgba(255,255,255,0.03)] rounded-lg p-3">
          <p className="text-xs text-text-muted mb-1">Predicted Month-End</p>
          <p className="text-lg font-serif text-text-primary">₹{forecast.predictedMonthEnd.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-[rgba(255,255,255,0.03)] rounded-lg p-3">
          <p className="text-xs text-text-muted mb-1">Safe to Spend</p>
          <p className={`text-lg font-serif ${forecast.safeToSpend < 0 ? 'text-accent-coral' : 'text-accent-green'}`}>
            ₹{Math.abs(forecast.safeToSpend).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-[rgba(255,255,255,0.03)] rounded-lg p-3">
          <p className="text-xs text-text-muted mb-1">Weekly Burn Rate</p>
          <p className="text-lg font-serif text-text-primary">₹{forecast.weeklyBurnRate.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Badge variant={riskColors[forecast.riskLevel]}>
          {forecast.riskLevel.toUpperCase()} RISK
        </Badge>
      </div>

      <p className="text-sm text-text-muted">{forecast.advice}</p>
    </Card>
  )
}

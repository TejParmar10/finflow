'use client'

import { AlertTriangle, AlertCircle } from 'lucide-react'
import { AlertType } from '@/types'

interface AlertBannerProps {
  alerts: AlertType[]
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  if (alerts.length === 0) return null

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg text-sm ${
            alert.type === 'danger'
              ? 'bg-[rgba(255,107,107,0.12)] border border-[rgba(255,107,107,0.25)] text-accent-coral'
              : 'bg-[rgba(255,230,109,0.1)] border border-[rgba(255,230,109,0.2)] text-accent-yellow'
          }`}
        >
          {alert.type === 'danger' ? (
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          ) : (
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          )}
          <span>{alert.message}</span>
        </div>
      ))}
    </div>
  )
}

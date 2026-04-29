'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface AllocationBarProps {
  salary: number
  defaultInvest: number
  onSave: (investPercent: number, personalPercent: number) => void
}

export function AllocationBar({ salary, defaultInvest, onSave }: AllocationBarProps) {
  const [investPct, setInvestPct] = useState(defaultInvest)
  const personalPct = 100 - investPct
  const investAmt = Math.round((salary * investPct) / 100)
  const personalAmt = Math.round((salary * personalPct) / 100)

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-4">Allocation Split</h3>
      <div className="space-y-4">
        <div className="flex rounded-full overflow-hidden h-4">
          <div
            className="bg-accent-teal transition-all duration-300"
            style={{ width: `${investPct}%` }}
          />
          <div
            className="bg-accent-coral transition-all duration-300"
            style={{ width: `${personalPct}%` }}
          />
        </div>
        <input
          type="range"
          min={10}
          max={90}
          step={5}
          value={investPct}
          onChange={(e) => setInvestPct(Number(e.target.value))}
          className="w-full accent-accent-teal"
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-accent-teal" />
              <span className="text-xs text-text-muted">Invest</span>
            </div>
            <p className="text-lg font-serif text-text-primary">₹{investAmt.toLocaleString('en-IN')}</p>
            <p className="text-xs text-text-muted">{investPct}%</p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-accent-coral" />
              <span className="text-xs text-text-muted">Personal</span>
            </div>
            <p className="text-lg font-serif text-text-primary">₹{personalAmt.toLocaleString('en-IN')}</p>
            <p className="text-xs text-text-muted">{personalPct}%</p>
          </div>
        </div>
        <Button onClick={() => onSave(investPct, personalPct)} className="w-full">
          Save Allocation
        </Button>
      </div>
    </Card>
  )
}

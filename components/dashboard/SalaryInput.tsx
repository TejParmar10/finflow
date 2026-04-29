'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface SalaryInputProps {
  defaultValue: number
  onSave: (salary: number) => void
}

export function SalaryInput({ defaultValue, onSave }: SalaryInputProps) {
  const [salary, setSalary] = useState(defaultValue)

  return (
    <Card>
      <h3 className="text-sm font-semibold text-text-primary mb-4">Monthly Income</h3>
      <div className="space-y-4">
        <div>
          <p className="text-3xl font-serif text-text-primary">
            ₹{salary.toLocaleString('en-IN')}
          </p>
        </div>
        <input
          type="range"
          min={10000}
          max={500000}
          step={1000}
          value={salary}
          onChange={(e) => setSalary(Number(e.target.value))}
          className="w-full accent-accent-teal"
        />
        <div className="flex justify-between text-xs text-text-muted">
          <span>₹10,000</span>
          <span>₹5,00,000</span>
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            value={salary}
            onChange={(e) => setSalary(Number(e.target.value))}
            className="flex-1 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)]"
            placeholder="Enter amount"
          />
          <Button onClick={() => onSave(salary)}>Save</Button>
        </div>
      </div>
    </Card>
  )
}

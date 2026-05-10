'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface OnboardingModalProps {
  onComplete: (salary: number, investPercent: number, upiId: string) => Promise<void>
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [salary, setSalary] = useState(50000)
  const [investPct, setInvestPct] = useState(30)
  const [upiId, setUpiId] = useState('')
  const [loading, setLoading] = useState(false)

  const personalPct = 100 - investPct

  const handleSubmit = async () => {
    if (salary < 10000) { toast.error('Minimum salary is ₹10,000'); return }
    setLoading(true)
    try {
      await onComplete(salary, investPct, upiId)
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-secondary border border-[rgba(255,255,255,0.1)] rounded-[20px] p-8 max-w-md w-full space-y-6">
        <div>
          <h2 className="font-serif text-2xl text-text-primary mb-1">Welcome to FinFlow</h2>
          <p className="text-sm text-text-muted">Let's set up your monthly budget in 30 seconds.</p>
        </div>

        <div className="space-y-3">
          <label className="text-xs text-[rgba(255,255,255,0.5)] font-medium uppercase tracking-wide">
            Monthly Take-Home Salary
          </label>
          <p className="text-3xl font-serif text-text-primary">₹{salary.toLocaleString('en-IN')}</p>
          <input
            type="range"
            min={10000}
            max={500000}
            step={1000}
            value={salary}
            onChange={(e) => setSalary(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-text-muted">
            <span>₹10,000</span><span>₹5,00,000</span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs text-[rgba(255,255,255,0.5)] font-medium uppercase tracking-wide">
            Invest vs Personal Split
          </label>
          <div className="flex rounded-full overflow-hidden h-3">
            <div className="bg-accent-teal transition-all duration-300" style={{ width: `${investPct}%` }} />
            <div className="bg-accent-coral" style={{ width: `${personalPct}%` }} />
          </div>
          <input
            type="range"
            min={10}
            max={70}
            step={5}
            value={investPct}
            onChange={(e) => setInvestPct(Number(e.target.value))}
            className="w-full"
          />
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-accent-teal">Invest {investPct}%</span>
              <p className="text-text-muted text-xs">₹{Math.round((salary * investPct) / 100).toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right">
              <span className="text-accent-coral">Personal {personalPct}%</span>
              <p className="text-text-muted text-xs">₹{Math.round((salary * personalPct) / 100).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-[rgba(255,255,255,0.5)] font-medium uppercase tracking-wide block">
            UPI ID <span className="normal-case text-text-muted font-normal">(optional — needed for Split payments)</span>
          </label>
          <input
            type="text"
            placeholder="yourname@upi or phone@bank"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-[rgba(255,255,255,0.25)] focus:outline-none focus:border-accent-teal"
          />
          <p className="text-xs text-text-muted">e.g. 9876543210@ybl · You can add or change this later</p>
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full" size="lg">
          {loading ? 'Saving...' : 'Get Started →'}
        </Button>
      </div>
    </div>
  )
}

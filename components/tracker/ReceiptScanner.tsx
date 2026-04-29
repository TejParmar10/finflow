'use client'

import { useState, useRef } from 'react'
import { ScanLine, Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ExpenseCategory } from '@/types'
import toast from 'react-hot-toast'

interface ReceiptItem {
  description: string
  amount: number
  category: string
  selected: boolean
}

interface ReceiptScannerProps {
  idToken: string
  onAddItems: (items: { description: string; amount: number; category: ExpenseCategory }[]) => Promise<void>
}

export function ReceiptScanner({ idToken, onAddItems }: ReceiptScannerProps) {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<ReceiptItem[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return }
    setLoading(true)
    setItems([])
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1]
        const res = await fetch('/api/ai/receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
        })
        if (!res.ok) { toast.error('Could not read receipt. Please add expenses manually.'); setLoading(false); return }
        const data = await res.json()
        setItems((data as ReceiptItem[]).map((i) => ({ ...i, selected: true })))
        setLoading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      toast.error('Could not read receipt. Please add expenses manually.')
      setLoading(false)
    }
  }

  const addAll = async () => {
    const selected = items.filter((i) => i.selected)
    if (selected.length === 0) { toast.error('Select at least one item'); return }
    await onAddItems(selected.map((i) => ({ description: i.description, amount: i.amount, category: i.category as ExpenseCategory })))
    setItems([])
    toast.success(`${selected.length} items added!`)
  }

  return (
    <div className="space-y-4">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <Button variant="secondary" onClick={() => fileRef.current?.click()} className="w-full gap-2">
        <ScanLine size={16} />
        Scan Receipt
      </Button>

      {loading && (
        <div className="text-center py-6">
          <div className="animate-spin w-6 h-6 border-2 border-accent-teal border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-text-muted">AI is reading your receipt...</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-text-muted">{items.filter((i) => i.selected).length} of {items.length} items selected</p>
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 py-2 border-b border-[rgba(255,255,255,0.05)]">
              <button
                onClick={() => setItems((prev) => prev.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it))}
                className={`w-5 h-5 rounded flex items-center justify-center border flex-shrink-0 transition-all ${item.selected ? 'bg-accent-teal border-accent-teal' : 'border-[rgba(255,255,255,0.2)]'}`}
              >
                {item.selected && <Check size={12} className="text-white" />}
              </button>
              <span className="flex-1 text-sm text-text-primary">{item.description}</span>
              <input
                type="number"
                value={item.amount}
                onChange={(e) => setItems((prev) => prev.map((it, i) => i === idx ? { ...it, amount: Number(e.target.value) } : it))}
                className="w-20 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded px-2 py-1 text-xs text-text-primary text-right"
              />
            </div>
          ))}
          <Button onClick={addAll} className="w-full gap-2">
            <Plus size={15} />
            Add All to Tracker
          </Button>
        </div>
      )}
    </div>
  )
}

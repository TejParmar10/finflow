'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { Upload, FileText, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface FileUploaderProps {
  month: string
  idToken: string
  onParsed: (transactions: unknown[]) => void
  existingExpenses: unknown[]
}

const MAX_SIZE = 10 * 1024 * 1024

export function FileUploader({ month, idToken, onParsed, existingExpenses }: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const validate = (f: File): string => {
    if (f.size > MAX_SIZE) return 'File is too large. Please upload a statement under 10MB.'
    if (!['application/pdf', 'text/csv', 'application/vnd.ms-excel'].includes(f.type) && !f.name.endsWith('.csv') && !f.name.endsWith('.pdf')) {
      return 'Only PDF and CSV files are supported.'
    }
    return ''
  }

  const handleFile = (f: File) => {
    const err = validate(f)
    if (err) { setError(err); toast.error(err); return }
    setError('')
    setFile(f)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setProgress('Reading your statement...')

    try {
      let body: Record<string, unknown>
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const buf = await file.arrayBuffer()
        const bytes = new Uint8Array(buf)
        const base64 = btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''))
        body = { fileContent: base64, fileType: 'pdf', month }
      } else {
        // Send raw CSV text — server auto-detects HDFC vs Google Pay format
        const text = await file.text()
        body = { fileContent: text, fileType: 'csv', month }
      }

      setProgress('Analysing transactions with AI...')
      const res = await fetch('/api/import/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Parsing failed')
      }

      const data = await res.json()
      if (!data.transactions?.length) {
        toast.error('No transactions found in this statement.')
        setLoading(false)
        setProgress('')
        return
      }

      onParsed(data.transactions)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Parsing failed. Please check your connection and try again.'
      toast.error(msg)
      setError(msg)
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  return (
    <div className="space-y-4">
      <input ref={fileRef} type="file" accept=".pdf,.csv" className="hidden" onChange={handleChange} />

      <div
        onClick={() => !file && fileRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-[16px] p-8 text-center cursor-pointer transition-all duration-200 ${
          error ? 'border-accent-coral bg-[rgba(255,107,107,0.04)]'
          : dragOver ? 'border-accent-teal bg-[rgba(78,205,196,0.06)]'
          : file ? 'border-accent-green bg-[rgba(0,200,150,0.04)]'
          : 'border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.2)]'
        }`}
      >
        {!file ? (
          <>
            <Upload size={32} className="mx-auto text-text-muted mb-3" />
            <p className="text-sm text-text-primary">Drag your HDFC statement here or click to browse</p>
            <p className="text-xs text-text-muted mt-1">PDF or CSV · Max 10MB</p>
          </>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <FileText size={20} className="text-accent-teal" />
            <div className="text-left">
              <p className="text-sm text-text-primary">{file.name}</p>
              <p className="text-xs text-text-muted">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <CheckCircle size={18} className="text-accent-green" />
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); setError('') }}
              className="text-text-muted hover:text-accent-coral transition-colors ml-2"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-accent-coral">{error}</p>}

      {loading ? (
        <div className="flex items-center gap-3 justify-center py-3">
          <div className="animate-spin w-5 h-5 border-2 border-accent-teal border-t-transparent rounded-full" />
          <p className="text-sm text-text-muted">{progress}</p>
        </div>
      ) : (
        <Button onClick={handleUpload} disabled={!file} className="w-full">
          Upload &amp; Parse
        </Button>
      )}
    </div>
  )
}

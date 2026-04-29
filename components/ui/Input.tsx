'use client'

import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs text-[rgba(255,255,255,0.5)] font-medium uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-[rgba(255,255,255,0.25)] focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-all duration-200 ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-accent-coral">{error}</p>}
    </div>
  )
}

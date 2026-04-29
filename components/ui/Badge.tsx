'use client'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'teal' | 'coral' | 'yellow' | 'green' | 'muted'
  className?: string
}

export function Badge({ children, variant = 'teal', className = '' }: BadgeProps) {
  const variants = {
    teal: 'bg-[rgba(78,205,196,0.15)] text-accent-teal border border-[rgba(78,205,196,0.2)]',
    coral: 'bg-[rgba(255,107,107,0.15)] text-accent-coral border border-[rgba(255,107,107,0.2)]',
    yellow: 'bg-[rgba(255,230,109,0.15)] text-accent-yellow border border-[rgba(255,230,109,0.2)]',
    green: 'bg-[rgba(0,200,150,0.15)] text-accent-green border border-[rgba(0,200,150,0.2)]',
    muted: 'bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.4)] border border-[rgba(255,255,255,0.07)]',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

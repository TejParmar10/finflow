'use client'

import { CreditScoreData } from '@/types'

interface CreditScoreArcProps {
  data: CreditScoreData
  size?: number
}

export function CreditScoreArc({ data, size = 160 }: CreditScoreArcProps) {
  const { score, label, color } = data
  const radius = size * 0.38
  const cx = size / 2
  const cy = size / 2 + size * 0.05
  const startAngle = -210
  const endAngle = 30
  const totalAngle = endAngle - startAngle
  const progress = (score - 300) / (900 - 300)
  const fillAngle = startAngle + totalAngle * progress

  function polarToXY(angle: number, r: number) {
    const rad = (angle * Math.PI) / 180
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    }
  }

  function describeArc(start: number, end: number, r: number) {
    const s = polarToXY(start, r)
    const e = polarToXY(end, r)
    const largeArc = end - start > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size * 0.75}`}>
        <path
          d={describeArc(startAngle, endAngle, radius)}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={size * 0.075}
          strokeLinecap="round"
        />
        <path
          d={describeArc(startAngle, fillAngle, radius)}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.075}
          strokeLinecap="round"
          style={{ transition: 'all 0.8s ease' }}
        />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="font-serif"
          fontSize={size * 0.2}
          fill="#E8EAF6"
          fontFamily="DM Serif Display, serif"
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy + size * 0.14}
          textAnchor="middle"
          fontSize={size * 0.085}
          fill={color}
        >
          {label}
        </text>
      </svg>
    </div>
  )
}

import React, { useMemo } from 'react'

const SVG_WIDTH = 140
const SVG_HEIGHT = 40

export default function SRSSparkline({ buckets = [] }) {
  const points = useMemo(() => {
    if (!buckets.length) return null
    const max = Math.max(...buckets.map((bucket) => bucket.count), 1)
    const step = buckets.length > 1 ? SVG_WIDTH / (buckets.length - 1) : SVG_WIDTH
    return buckets.map((bucket, index) => {
      const x = Math.round(index * step * 100) / 100
      const ratio = bucket.count / max
      const y = Math.round((SVG_HEIGHT - 8) - ratio * (SVG_HEIGHT - 12)) + 6
      return { x, y }
    })
  }, [buckets])

  if (!points || !points.length) {
    return (
      <div className="srs-sparkline srs-sparkline--empty">
        <span>No hay repasos programados aún.</span>
      </div>
    )
  }

  const polylinePoints = points.map(({ x, y }) => `${x},${y}`).join(' ')

  return (
    <div className="srs-sparkline" aria-hidden="true">
      <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} preserveAspectRatio="none">
        <polyline className="srs-sparkline__line" points={polylinePoints} />
        {points.map((point, index) => (
          <circle
            key={buckets[index]?.label || index}
            className="srs-sparkline__point"
            cx={point.x}
            cy={point.y}
            r="2.5"
          />
        ))}
      </svg>
      <div className="srs-sparkline__labels">
        {buckets.map((bucket) => (
          <span key={bucket.label}>{bucket.label}</span>
        ))}
      </div>
    </div>
  )
}

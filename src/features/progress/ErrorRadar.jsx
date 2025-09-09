// Componente para mostrar el radar de errores

import { useEffect, useRef, memo, useMemo } from 'react'
import { getAttemptsByUser } from '../../lib/progress/database.js'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import { useSettings } from '../../state/settings.js'

/**
 * @param {{ axes: Array<{key:string,label:string,value:number,tag:string,count:number,combos?:Array<{mood:string,tense:string}>}> } } props
 */
export function ErrorRadar({ axes = [] }) {
  const canvasRef = useRef(null)
  const settings = useSettings()

  const safeAxes = useMemo(() => (Array.isArray(axes) ? axes.slice(0, 6) : []), [axes])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) * 0.4

    // Limpiar
    ctx.clearRect(0, 0, width, height)

    drawPolarGrid(ctx, centerX, centerY, radius, safeAxes.length)
    drawAxes(ctx, centerX, centerY, radius, safeAxes)
    drawData(ctx, centerX, centerY, radius, safeAxes)
    drawLegend(ctx, width, height, safeAxes)
  }, [safeAxes])

  function drawPolarGrid(ctx, cx, cy, r, n) {
    const styles = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null
    const gridColor = styles?.getPropertyValue('--border-2')?.trim() || 'rgba(245,245,245,0.12)'
    ctx.strokeStyle = gridColor
    ctx.lineWidth = 1
    for (let i = 1; i <= 4; i++) {
      const rr = (r * i) / 4
      ctx.beginPath()
      ctx.arc(cx, cy, rr, 0, 2 * Math.PI)
      ctx.stroke()
    }
    for (let i = 0; i < n; i++) {
      const ang = (2 * Math.PI * i) / Math.max(1, n) - Math.PI / 2
      const x = cx + r * Math.cos(ang)
      const y = cy + r * Math.sin(ang)
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  function drawAxes(ctx, cx, cy, r, axes) {
    const styles = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null
    const textColor = styles?.getPropertyValue('--muted')?.trim() || '#cccccc'
    ctx.fillStyle = textColor
    ctx.font = '12px Inter, Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    axes.forEach((axis, idx) => {
      const ang = (2 * Math.PI * idx) / axes.length - Math.PI / 2
      const x = cx + (r + 30) * Math.cos(ang)
      const y = cy + (r + 30) * Math.sin(ang)
      ctx.fillText(axis.label, x, y)
    })
  }

  function drawData(ctx, cx, cy, r, axes) {
    const styles = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null
    const accent = styles?.getPropertyValue('--accent-red')?.trim() || '#dc3545'
    const hexToRgba = (hex, a = 0.2) => {
      const m = hex.replace('#', '')
      const bigint = parseInt(m.length === 3 ? m.split('').map(c => c + c).join('') : m, 16)
      const rr = (bigint >> 16) & 255
      const gg = (bigint >> 8) & 255
      const bb = bigint & 255
      return `rgba(${rr}, ${gg}, ${bb}, ${a})`
    }
    ctx.strokeStyle = accent
    ctx.fillStyle = hexToRgba(accent, 0.18)
    ctx.lineWidth = 2
    ctx.beginPath()
    axes.forEach((axis, idx) => {
      const value = Math.max(0, Math.min(100, axis.value || 0)) / 100
      const ang = (2 * Math.PI * idx) / axes.length - Math.PI / 2
      const rr = r * value
      const x = cx + rr * Math.cos(ang)
      const y = cy + rr * Math.sin(ang)
      if (idx === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  async function practiceForTag(tag) {
    try {
      const uid = getCurrentUserId()
      const attempts = await getAttemptsByUser(uid)
      const recent = attempts.slice(-300).filter(a => Array.isArray(a.errorTags) && a.errorTags.includes(tag))
      if (recent.length === 0) return
      const freq = new Map()
      for (const a of recent) {
        const key = `${a.mood}|${a.tense}`
        freq.set(key, (freq.get(key) || 0) + 1)
      }
      const topCombos = Array.from(freq.entries())
        .sort((a,b)=>b[1]-a[1])
        .slice(0,3)
        .map(([k]) => { const [mood, tense]=k.split('|'); return { mood, tense } })
      if (topCombos.length === 0) return
      settings.set({ practiceMode: 'mixed', currentBlock: { combos: topCombos, itemsRemaining: 6 } })
      window.dispatchEvent(new CustomEvent('progress:navigate', { detail: { micro: { errorTag: tag, size: 6 } } }))
    } catch (e) {
      console.warn('No se pudo iniciar micro-práctica para', tag, e)
    }
  }

  return (
    <div className="error-radar">
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        className="radar-canvas"
        title="Clic en un tema de la lista para practicar"
      />
      <div className="radar-summary" style={{ marginTop: 16 }}>
        <h3>Temas más problemáticos</h3>
        <div className="competency-stats">
          {safeAxes.map(axis => (
            <div key={axis.key} className="stat-item" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span className="stat-label">{axis.label}:</span>
              <span className="stat-value">{Math.round(axis.value)}%</span>
              <button className="btn btn-small" onClick={() => practiceForTag(axis.tag)}>Practicar</button>
            </div>
          ))}
        </div>
        <div className="hint" style={{ marginTop: 8, opacity: 0.8 }}>
          Consejo: practicá primero los temas con mayor porcentaje de error.
        </div>
      </div>
    </div>
  )
}

export default memo(ErrorRadar)


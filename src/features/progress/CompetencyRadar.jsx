// Componente para mostrar el radar de competencias

import { useEffect, useRef, memo } from 'react'
import { getHeatMapData } from '../../lib/progress/analytics.js'
import { getCurrentUserId } from '../../lib/progress/userManager/index.js'
import { useSettings } from '../../state/settings.js'
import { formatPercentage } from '../../lib/progress/uiUtils.js'
import { createLogger } from '../../lib/utils/logger.js'

const logger = createLogger('features:CompetencyRadar')


/**
 * Componente para mostrar el radar de competencias
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.data - Datos para el radar
 */
export function CompetencyRadar({ data }) {
  const canvasRef = useRef(null)
  const settings = useSettings()

  // Definir ejes del radar específicos para conjugaciones
  const axes = [
    { key: 'moodMastery', label: 'Dominio de Modos', max: 100 },
    { key: 'tenseControl', label: 'Manejo de Tiempos', max: 100 },
    { key: 'irregularPrecision', label: 'Precisión en Irregulares', max: 100 },
    { key: 'personAccuracy', label: 'Dominio de Personas', max: 100 },
    { key: 'responseSpeed', label: 'Velocidad de Respuesta', max: 100 }
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data) return

    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) * 0.4

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height)

    // Dibujar rejilla polar
    drawPolarGrid(ctx, centerX, centerY, radius, axes.length)

    // Dibujar ejes
    drawAxes(ctx, centerX, centerY, radius, axes)

    // Dibujar datos del usuario
    drawUserData(ctx, centerX, centerY, radius, axes, data)

    // Dibujar leyenda
    drawLegend(ctx, width, height, axes)
  }, [data])

  /**
   * Dibuja la rejilla polar
   */
  function drawPolarGrid(ctx, centerX, centerY, radius, numAxes) {
    const styles = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null
    const gridColor = styles?.getPropertyValue('--border-2')?.trim() || 'rgba(245,245,245,0.12)'
    ctx.strokeStyle = gridColor
    ctx.lineWidth = 1

    // Dibujar círculos concéntricos
    for (let i = 1; i <= 4; i++) {
      const r = (radius * i) / 4
      ctx.beginPath()
      ctx.arc(centerX, centerY, r, 0, 2 * Math.PI)
      ctx.stroke()
    }

    // Dibujar líneas radiales
    for (let i = 0; i < numAxes; i++) {
      const angle = (2 * Math.PI * i) / numAxes - Math.PI / 2
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  /**
   * Dibuja los ejes con etiquetas
   */
  function drawAxes(ctx, centerX, centerY, radius, axes) {
    const styles = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null
    const textColor = styles?.getPropertyValue('--muted')?.trim() || '#cccccc'
    ctx.fillStyle = textColor
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    axes.forEach((axis, index) => {
      const angle = (2 * Math.PI * index) / axes.length - Math.PI / 2
      const x = centerX + (radius + 30) * Math.cos(angle)
      const y = centerY + (radius + 30) * Math.sin(angle)
      
      ctx.fillText(axis.label, x, y)
    })
  }

  /**
   * Dibuja los datos del usuario
   */
  function drawUserData(ctx, centerX, centerY, radius, axes, userData) {
    if (!userData) return
    const styles = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null
    const accentBlue = styles?.getPropertyValue('--accent-blue')?.trim() || '#8eb4e3'
    // Helper: hex to rgba with alpha
    const hexToRgba = (hex, a = 0.2) => {
      const m = hex.replace('#','')
      const bigint = parseInt(m.length===3 ? m.split('').map(c=>c+c).join('') : m, 16)
      const r = (bigint >> 16) & 255
      const g = (bigint >> 8) & 255
      const b = bigint & 255
      return `rgba(${r}, ${g}, ${b}, ${a})`
    }
    ctx.strokeStyle = accentBlue
    ctx.fillStyle = hexToRgba(accentBlue, 0.20)
    ctx.lineWidth = 2

    ctx.beginPath()

    axes.forEach((axis, index) => {
      const value = userData[axis.key] || 0
      const normalizedValue = Math.min(100, Math.max(0, value)) / 100
      const angle = (2 * Math.PI * index) / axes.length - Math.PI / 2
      const r = radius * normalizedValue
      const x = centerX + r * Math.cos(angle)
      const y = centerY + r * Math.sin(angle)

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  /**
   * Dibuja la leyenda
   */
  function drawLegend(ctx, width, height, axes) {
    const styles = typeof window !== 'undefined' ? getComputedStyle(document.documentElement) : null
    const textColor = styles?.getPropertyValue('--muted')?.trim() || '#cccccc'
    ctx.fillStyle = textColor
    ctx.font = '14px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'

    // Título
    ctx.fillText('Nivel de Competencia', 20, 30)

    // Valores de cada eje
    let yOffset = 60
    axes.forEach(axis => {
      const value = data?.[axis.key] || 0
      ctx.fillText(
        `${axis.label}: ${formatPercentage(value)}`,
        20,
        yOffset
      )
      yOffset += 25
    })
  }

  if (!data) {
    return (
      <div className="competency-radar loading">
        <p>Cargando radar de competencias...</p>
      </div>
    )
  }

  return (
    <div className="competency-radar">
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        className="radar-canvas"
        title="Haz clic para practicar tu área más débil"
        onClick={async () => {
          try {
            const userId = getCurrentUserId()
            const heatmap = await getHeatMapData(userId)
            if (heatmap && heatmap.length > 0) {
              // Elegir la celda con menor score; si hay sin datos, tomar una de nivel intermedio por defecto
              const withScore = heatmap.filter(c => typeof c.score === 'number')
              const target = (withScore.length > 0 ? withScore : heatmap)
                .slice()
                .sort((a,b)=> (a.score ?? 50) - (b.score ?? 50))[0]
              if (target && target.mood && target.tense) {
                settings.set({ practiceMode: 'specific', specificMood: target.mood, specificTense: target.tense })
                // Wait for settings to propagate before dispatching navigation event
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('progress:navigate', { detail: { mood: target.mood, tense: target.tense } }))
                }, 50)
              }
            }
          } catch (error) {
            logger.error('Error handling radar chart click:', error)
          }
        }}
      />
      
      <div className="radar-summary">
        <h3>Resumen de Competencias</h3>
        <div className="competency-stats">
          {axes.map(axis => (
            <div key={axis.key} className="stat-item">
              <span className="stat-label">{axis.label}:</span>
              <span className="stat-value">{formatPercentage(data[axis.key] || 0)}</span>
            </div>
          ))}
        </div>
        
        <div className="overall-assessment">
          <h4>Evaluación General</h4>
          <p>{getOverallAssessment(data)}</p>
        </div>

        <div className="hint" style={{ marginTop: 8, opacity: 0.8 }}>
          Consejo: haz clic en el radar para practicar tu área más débil.
        </div>
      </div>
    </div>
  )
}

/**
 * Obtiene una evaluación general basada en los datos
 */
function getOverallAssessment(data) {
  if (!data) return 'Datos insuficientes para evaluación.'

  const avgScore = (
    (data.moodMastery || 0) +
    (data.tenseControl || 0) +
    (data.irregularPrecision || 0) +
    (data.personAccuracy || 0) +
    (data.responseSpeed || 0)
  ) / 5

  if (avgScore >= 80) {
    return '¡Excelente dominio de conjugaciones! Manejas con soltura modos, tiempos y formas irregulares.'
  } else if (avgScore >= 60) {
    return 'Buen progreso en conjugaciones. Identifica áreas específicas para mejorar (modos, tiempos, irregulares).'
  } else {
    return 'Nivel básico en conjugaciones. Enfócate en dominar primero los modos y tiempos fundamentales.'
  }
}

export default memo(CompetencyRadar)

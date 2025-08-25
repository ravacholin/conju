// Componente para mostrar el radar de competencias

import { useEffect, useRef, memo } from 'react'
import { getHeatMapData } from '../../lib/progress/analytics.js'
import { getCurrentUserId } from '../../lib/progress/userManager.js'
import { useSettings } from '../../state/settings.js'
import { formatPercentage } from '../../lib/progress/uiUtils.js'

/**
 * Componente para mostrar el radar de competencias
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.data - Datos para el radar
 */
export function CompetencyRadar({ data }) {
  const canvasRef = useRef(null)
  const settings = useSettings()

  // Definir ejes del radar
  const axes = [
    { key: 'accuracy', label: 'Precisión', max: 100 },
    { key: 'speed', label: 'Velocidad', max: 100 },
    { key: 'consistency', label: 'Constancia', max: 100 },
    { key: 'lexicalBreadth', label: 'Amplitud Léxica', max: 100 },
    { key: 'transfer', label: 'Transferencia', max: 100 }
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
    ctx.strokeStyle = '#e0e0e0'
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
    ctx.fillStyle = '#333'
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

    ctx.strokeStyle = '#007bff'
    ctx.fillStyle = 'rgba(0, 123, 255, 0.2)'
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
    ctx.fillStyle = '#333'
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
                window.dispatchEvent(new CustomEvent('progress:navigate', { detail: { mood: target.mood, tense: target.tense } }))
              }
            }
          } catch {}
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
    (data.accuracy || 0) +
    (data.speed || 0) +
    (data.consistency || 0) +
    (data.lexicalBreadth || 0) +
    (data.transfer || 0)
  ) / 5

  if (avgScore >= 80) {
    return '¡Excelente nivel de competencia! Dominas todas las áreas evaluadas.'
  } else if (avgScore >= 60) {
    return 'Buen nivel de competencia con áreas para mejorar.'
  } else {
    return 'Nivel de competencia básico. Se recomienda práctica adicional.'
  }
}

export default memo(CompetencyRadar)

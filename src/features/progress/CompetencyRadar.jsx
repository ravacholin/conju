// Componente para el radar de competencias

import { useEffect, useState } from 'react'
import { getMasteryByUser, getAttemptsByItem } from '../../lib/progress/database.js'
import { getCurrentUserId } from '../../lib/progress/index.js'
import { average, msToSeconds } from '../../lib/progress/utils.js'

export default function CompetencyRadar() {
  const [competencies, setCompetencies] = useState({
    accuracy: 0,
    speed: 0,
    consistency: 0,
    lexicalBreadth: 0,
    transfer: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCompetencyData = async () => {
      try {
        setLoading(true)
        const userId = getCurrentUserId()
        if (!userId) return

        // Obtener todos los mastery scores del usuario
        const masteryRecords = await getMasteryByUser(userId)
        
        // Calcular precisión (accuracy)
        const accuracy = masteryRecords.length > 0 
          ? average(masteryRecords.map(r => r.score)) 
          : 0

        // Calcular velocidad promedio
        let totalLatency = 0
        let totalAttempts = 0
        
        // Obtener latencias de todos los intentos
        for (const mastery of masteryRecords) {
          const attempts = await getAttemptsByItem(mastery.id)
          totalLatency += attempts.reduce((sum, attempt) => sum + attempt.latencyMs, 0)
          totalAttempts += attempts.length
        }
        
        const avgLatencyMs = totalAttempts > 0 ? totalLatency / totalAttempts : 0
        const speed = avgLatencyMs > 0 ? Math.max(0, 100 - (msToSeconds(avgLatencyMs) / 10 * 100)) : 0

        // Calcular consistencia (desviación estándar de los scores)
        const scores = masteryRecords.map(r => r.score)
        const mean = accuracy
        const variance = scores.length > 0 
          ? scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length 
          : 0
        const stdDev = Math.sqrt(variance)
        const consistency = Math.max(0, 100 - (stdDev / 100 * 100))

        // Calcular amplitud léxica (número de verbos diferentes)
        const uniqueVerbs = new Set(masteryRecords.map(r => r.verbId)).size
        const lexicalBreadth = Math.min(100, uniqueVerbs * 2) // Ajustar escala

        // Calcular transferencia sin pistas
        let totalWithoutHints = 0
        let correctWithoutHints = 0
        
        for (const mastery of masteryRecords) {
          const attempts = await getAttemptsByItem(mastery.id)
          const withoutHints = attempts.filter(a => a.hintsUsed === 0)
          totalWithoutHints += withoutHints.length
          correctWithoutHints += withoutHints.filter(a => a.correct).length
        }
        
        const transfer = totalWithoutHints > 0 
          ? (correctWithoutHints / totalWithoutHints) * 100 
          : 0

        setCompetencies({
          accuracy: Math.round(accuracy),
          speed: Math.round(speed),
          consistency: Math.round(consistency),
          lexicalBreadth: Math.round(lexicalBreadth),
          transfer: Math.round(transfer)
        })
      } catch (err) {
        console.error('Error al cargar datos de competencia:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCompetencyData()
  }, [])

  if (loading) {
    return <div className="competency-radar">Cargando radar de competencias...</div>
  }

  // Datos para el gráfico de radar
  const data = [
    { label: 'Precisión', value: competencies.accuracy },
    { label: 'Velocidad', value: competencies.speed },
    { label: 'Consistencia', value: competencies.consistency },
    { label: 'Amplitud Léxica', value: competencies.lexicalBreadth },
    { label: 'Transferencia', value: competencies.transfer }
  ]

  return (
    <div className="competency-radar">
      <h3>Radar de Competencias</h3>
      <div className="radar-chart">
        <div className="radar-grid">
          {/* Líneas radiales */}
          {[0, 25, 50, 75, 100].map(level => (
            <div key={level} className="radar-circle" style={{width: `${level}%`, height: `${level}%`}}>
              <span className="radar-label">{level}%</span>
            </div>
          ))}
          
          {/* Ejes y datos */}
          <div className="radar-axes">
            {data.map((item, index) => {
              const angle = (index * 72) * (Math.PI / 180) // 72 = 360/5
              const value = item.value
              const x = 50 + value * 0.4 * Math.sin(angle) // 0.4 para escalar dentro del círculo
              const y = 50 - value * 0.4 * Math.cos(angle)
              
              return (
                <div key={item.label} className="radar-axis">
                  <div 
                    className="radar-point" 
                    style={{left: `${x}%`, top: `${y}%`}}
                  ></div>
                  <div 
                    className="radar-label" 
                    style={{left: `${50 + 45 * Math.sin(angle)}%`, top: `${50 - 45 * Math.cos(angle)}%`}}
                  >
                    {item.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      <div className="competency-details">
        {data.map(item => (
          <div key={item.label} className="competency-item">
            <span className="competency-label">{item.label}:</span>
            <span className="competency-value">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
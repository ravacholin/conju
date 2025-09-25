// Componente para mostrar el indicador de mastery en tiempo real

import { useState, useEffect } from 'react'
import { getMasteryScore } from '../../lib/progress/mastery.js'
import { getCurrentUserId } from '../../lib/progress/userManager.js'

/**
 * Componente que muestra el puntaje de mastery actual para la combinación mood/tense
 */
export default function MasteryIndicator({ currentItem }) {
  const [masteryScore, setMasteryScore] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMasteryScore = async () => {
      if (!currentItem) {
        setMasteryScore(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const userId = getCurrentUserId()
        
        // Obtener el puntaje de mastery para esta combinación
        const score = await getMasteryScore(userId, {
          mood: currentItem.mood,
          tense: currentItem.tense,
          verbId: currentItem.verb?.id || currentItem.id
        })
        
        setMasteryScore(score)
        setLoading(false)
      } catch (error) {
        console.warn('Error al cargar mastery score:', error)
        setMasteryScore(null)
        setLoading(false)
      }
    }

    loadMasteryScore()
  }, [currentItem?.mood, currentItem?.tense, currentItem?.verb?.id, currentItem?.id])

  if (loading) {
    return (
      <div className="mastery-indicator loading">
        <div className="mastery-label">Dominio</div>
        <div className="mastery-score">...</div>
      </div>
    )
  }

  if (masteryScore === null) {
    return (
      <div className="mastery-indicator new">
        <div className="mastery-label">Dominio</div>
        <div className="mastery-score">Nuevo</div>
      </div>
    )
  }

  const getMasteryClass = (score) => {
    if (score >= 80) return 'high'
    if (score >= 60) return 'medium'
    return 'low'
  }

  const getMasteryEmoji = (score) => {
    if (score >= 80) return ''
    if (score >= 60) return ''
    return ''
  }

  return (
    <div className={`mastery-indicator ${getMasteryClass(masteryScore)}`}>
      <div className="mastery-label">
        {getMasteryEmoji(masteryScore)} Dominio
      </div>
      <div className="mastery-score">
        {Math.round(masteryScore)}%
      </div>
    </div>
  )
}
// Efectos de sonido sintetizados con la Web Audio API (osciladores, sin archivos
// de audio): la app se mantiene 100% offline y sin assets que descargar. Todo va
// envuelto en guards para no romper en entornos sin la API (SSR, jsdom).
// Portado de los repos hermanos Gener-os e Impacto-in-directo.

import { useSettings } from '../../state/settings.js'
import { createLogger } from '../utils/logger.js'

const logger = createLogger('soundEffects')

const hasApi = () =>
  typeof window !== 'undefined' &&
  (typeof window.AudioContext !== 'undefined' ||
    typeof window.webkitAudioContext !== 'undefined')

// Un único AudioContext reutilizado entre llamadas (crear uno por sonido agota el
// límite de contextos concurrentes de algunos navegadores).
let cachedContext = null

function getContext() {
  if (!hasApi()) return null
  if (cachedContext) return cachedContext
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext
    cachedContext = new Ctor()
  } catch {
    return null
  }
  return cachedContext
}

/**
 * Reproduce un efecto de sonido de feedback. No hace nada si el sonido está
 * desactivado en los ajustes o si la Web Audio API no está disponible.
 *
 * @param {'correct'|'incorrect'} kind - Tipo de feedback.
 */
export function playFeedbackSound(kind) {
  // Respeta la preferencia global persistida.
  try {
    if (!useSettings.getState().soundEnabled) return
  } catch {
    // Si el store todavía no está listo, seguimos con el default (sonar).
  }

  const ctx = getContext()
  if (!ctx) return

  try {
    // Algunos navegadores arrancan el contexto suspendido hasta el primer gesto.
    if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      ctx.resume().catch(() => {})
    }

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    const now = ctx.currentTime

    if (kind === 'correct') {
      // Tono ascendente D5 -> A5 (sine).
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, now)
      osc.frequency.setValueAtTime(880, now + 0.08)
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
      osc.start(now)
      osc.stop(now + 0.25)
    } else {
      // Zumbido descendente 120 -> 90 Hz (sawtooth).
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(120, now)
      osc.frequency.setValueAtTime(90, now + 0.1)
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
      osc.start(now)
      osc.stop(now + 0.35)
    }
  } catch (error) {
    logger.debug('No se pudo reproducir el efecto de sonido', error)
  }
}

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
 * Motor común de todos los efectos: un oscilador con envolvente exponencial de
 * gain. Respeta la preferencia global `soundEnabled` (un mismo toggle silencia
 * TODOS los sonidos) y es no-op cuando la Web Audio API no está disponible.
 *
 * @param {Object} spec
 * @param {OscillatorType} spec.type - Forma de onda ('sine', 'sawtooth', ...).
 * @param {Array<[number, number]>} spec.points - Pares [offsetSegundos, frecuenciaHz]
 *   que se programan sobre el oscilador (permite barridos y arpegios simples).
 * @param {number} spec.peakGain - Ganancia inicial (pico) del sonido.
 * @param {number} spec.duration - Duración total en segundos.
 */
function playTone({ type, points, peakGain, duration }) {
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

    osc.type = type
    for (const [offset, freq] of points) {
      osc.frequency.setValueAtTime(freq, now + offset)
    }

    gain.gain.setValueAtTime(peakGain, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    osc.start(now)
    osc.stop(now + duration)
  } catch (error) {
    logger.debug('No se pudo reproducir el efecto de sonido', error)
  }
}

/**
 * Reproduce un efecto de sonido de feedback de acierto/error.
 *
 * @param {'correct'|'incorrect'} kind - Tipo de feedback.
 */
export function playFeedbackSound(kind) {
  if (kind === 'correct') {
    // Tono ascendente D5 -> A5 (sine).
    playTone({
      type: 'sine',
      points: [[0, 587.33], [0.08, 880]],
      peakGain: 0.12,
      duration: 0.25
    })
  } else {
    // Zumbido descendente 120 -> 90 Hz (sawtooth).
    playTone({
      type: 'sawtooth',
      points: [[0, 120], [0.1, 90]],
      peakGain: 0.12,
      duration: 0.35
    })
  }
}

/**
 * Reproduce un efecto de sonido de interfaz (navegación de menús/onboarding).
 * Son deliberadamente cortos y de bajo volumen porque se disparan seguido.
 *
 * @param {'select'|'back'} kind - 'select' al elegir/avanzar, 'back' al retroceder.
 */
export function playUiSound(kind) {
  if (kind === 'back') {
    // Blip corto descendente (triangle).
    playTone({
      type: 'triangle',
      points: [[0, 440], [0.04, 330]],
      peakGain: 0.045,
      duration: 0.09
    })
  } else {
    // 'select': blip corto ascendente (triangle).
    playTone({
      type: 'triangle',
      points: [[0, 520], [0.03, 660]],
      peakGain: 0.05,
      duration: 0.07
    })
  }
}

/**
 * Reproduce un efecto de sonido de los mini-juegos del drill (modo Supervivencia).
 *
 * @param {'tick'|'bonus'|'gameOver'} kind - Momento del juego.
 */
export function playGameSound(kind) {
  if (kind === 'tick') {
    // Pip corto y agudo de cuenta regresiva.
    playTone({
      type: 'square',
      points: [[0, 880]],
      peakGain: 0.06,
      duration: 0.04
    })
  } else if (kind === 'bonus') {
    // Arpegio ascendente tipo power-up (A5 -> C#6 -> E6), distinto del acierto.
    playTone({
      type: 'sine',
      points: [[0, 880], [0.06, 1108.73], [0.12, 1318.51]],
      peakGain: 0.1,
      duration: 0.22
    })
  } else {
    // 'gameOver': zumbido descendente en dos escalones, más grave/largo que el error.
    playTone({
      type: 'sawtooth',
      points: [[0, 160], [0.18, 90], [0.36, 55]],
      peakGain: 0.14,
      duration: 0.6
    })
  }
}

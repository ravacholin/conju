import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// El módulo cachea un único AudioContext a nivel de módulo, así que reseteamos
// los módulos antes de cada test para garantizar aislamiento.

const originalAudioContext = window.AudioContext
const originalWebkit = window.webkitAudioContext

// Mock mínimo de la Web Audio API para verificar el grafo de nodos.
function createMockAudioContext() {
  const oscillator = {
    type: '',
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  }
  const gain = {
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    },
    connect: vi.fn()
  }
  const ctx = {
    state: 'running',
    currentTime: 0,
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    createOscillator: vi.fn(() => oscillator),
    createGain: vi.fn(() => gain)
  }
  return { ctx, oscillator, gain }
}

// Carga fresca del módulo (caché de AudioContext reiniciado) + ajuste de sonido.
async function loadModule(soundEnabled = true) {
  vi.resetModules()
  const { useSettings } = await import('../../state/settings.js')
  useSettings.setState({ soundEnabled })
  const { playFeedbackSound } = await import('./soundEffects.js')
  return { playFeedbackSound }
}

describe('playFeedbackSound', () => {
  beforeEach(() => {
    window.AudioContext = undefined
    window.webkitAudioContext = undefined
  })

  afterEach(() => {
    window.AudioContext = originalAudioContext
    window.webkitAudioContext = originalWebkit
    vi.restoreAllMocks()
  })

  it('crea un oscilador y un gain al reproducir un acierto', async () => {
    const { ctx, oscillator } = createMockAudioContext()
    window.AudioContext = vi.fn(() => ctx)
    const { playFeedbackSound } = await loadModule(true)

    playFeedbackSound('correct')

    expect(ctx.createOscillator).toHaveBeenCalled()
    expect(ctx.createGain).toHaveBeenCalled()
    expect(oscillator.type).toBe('sine')
    expect(oscillator.start).toHaveBeenCalled()
    expect(oscillator.stop).toHaveBeenCalled()
  })

  it('usa una onda sawtooth para el error', async () => {
    const { ctx, oscillator } = createMockAudioContext()
    window.AudioContext = vi.fn(() => ctx)
    const { playFeedbackSound } = await loadModule(true)

    playFeedbackSound('incorrect')

    expect(oscillator.type).toBe('sawtooth')
  })

  it('es no-op cuando el sonido está desactivado', async () => {
    const { ctx } = createMockAudioContext()
    window.AudioContext = vi.fn(() => ctx)
    const { playFeedbackSound } = await loadModule(false)

    playFeedbackSound('correct')

    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })

  it('no lanza cuando la Web Audio API no está disponible', async () => {
    const { playFeedbackSound } = await loadModule(true)

    expect(() => playFeedbackSound('correct')).not.toThrow()
  })
})

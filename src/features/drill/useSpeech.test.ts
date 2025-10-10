import { describe, it, expect, beforeEach, afterEach, beforeAll, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

const optimizedCacheMocks = vi.hoisted(() => ({
  warmupCaches: vi.fn(),
  getCacheStats: vi.fn(() => ({})),
  clearAllCaches: vi.fn()
}))

vi.mock('../../lib/core/optimizedCache.js', () => ({
  __esModule: true,
  warmupCaches: optimizedCacheMocks.warmupCaches,
  getCacheStats: optimizedCacheMocks.getCacheStats,
  clearAllCaches: optimizedCacheMocks.clearAllCaches
}))

let useSpeech: any
let useSettings: any
let getSpeechLanguagePreferences: any
let resolveDialect: any
let defaultRegion: any

beforeAll(async () => {
  ;({ useSpeech } = await import('./useSpeech'))
  ;({ useSettings } = await import('../../state/settings.js'))
  const languageModule = await import('../../lib/pronunciation/languagePreferences.js')
  getSpeechLanguagePreferences = languageModule.getSpeechLanguagePreferences
  resolveDialect = languageModule.resolveDialect
  defaultRegion = useSettings.getState().region
})

describe('language preferences mapping', () => {
  it('returns rioplatense locale for rioplatense region', () => {
    const prefs = getSpeechLanguagePreferences('rioplatense')
    expect(prefs.dialect).toBe('rioplatense')
    expect(prefs.locale).toBe('es-AR')
    expect(prefs.voiceOrder[0]).toBe('es-ar')
  })

  it('returns general locale when region is null', () => {
    const prefs = getSpeechLanguagePreferences(null)
    expect(prefs.dialect).toBe('general')
    expect(prefs.locale).toBe('es-419')
  })

  it('normalizes peninsular region to peninsular dialect', () => {
    expect(resolveDialect('peninsular')).toBe('peninsular')
    const prefs = getSpeechLanguagePreferences('peninsular')
    expect(prefs.locale).toBe('es-ES')
    expect(prefs.voiceOrder[0]).toBe('es-es')
  })
})

describe('useSpeech', () => {
  let utterances: any[]
  let voices: Array<{ lang: string; name: string }>
  let originalSpeechSynthesis: any
  let originalUtterance: any

  beforeEach(() => {
    utterances = []
    voices = [
      { lang: 'es-AR', name: 'Google español de Argentina' },
      { lang: 'es-ES', name: 'Microsoft Helena' },
      { lang: 'es-419', name: 'Google español (Latinoamérica)' },
      { lang: 'en-US', name: 'Test Voice' }
    ]

    function MockSpeechSynthesisUtterance(this: any, text: string) {
      this.text = text
      this.lang = ''
      this.voice = undefined
      this.rate = 1
      utterances.push(this)
    }

    const synth = {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn(() => voices),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    } as any

    originalSpeechSynthesis = globalThis.speechSynthesis
    originalUtterance = globalThis.SpeechSynthesisUtterance

    // @ts-expect-error override for tests
    globalThis.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance
    // @ts-expect-error override for tests
    globalThis.speechSynthesis = synth

    act(() => {
      useSettings.setState({ region: defaultRegion })
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    // @ts-expect-error restore test overrides
    globalThis.speechSynthesis = originalSpeechSynthesis
    // @ts-expect-error restore test overrides
    globalThis.SpeechSynthesisUtterance = originalUtterance
    act(() => {
      useSettings.setState({ region: defaultRegion })
    })
  })

  it('speaks with rioplatense locale when region is rioplatense', () => {
    act(() => {
      useSettings.setState({ region: 'rioplatense' })
    })

    const { result } = renderHook(() => useSpeech())

    act(() => {
      result.current.speak('hola')
    })

    expect(utterances).toHaveLength(1)
    expect(utterances[0].lang).toBe('es-AR')
    const synth = window.speechSynthesis as unknown as { speak: ReturnType<typeof vi.fn> }
    expect(synth.speak).toHaveBeenCalled()
  })

  it('speaks with general locale when region is la_general', () => {
    act(() => {
      useSettings.setState({ region: 'la_general' })
    })

    const { result } = renderHook(() => useSpeech())

    act(() => {
      result.current.speak('hola')
    })

    expect(utterances).toHaveLength(1)
    expect(utterances[0].lang).toBe('es-419')
  })

  it('prioritizes peninsular voices when region is peninsular', () => {
    act(() => {
      useSettings.setState({ region: 'peninsular' })
    })

    const { result } = renderHook(() => useSpeech())

    act(() => {
      result.current.speak('hola')
    })

    expect(utterances).toHaveLength(1)
    expect(utterances[0].lang).toBe('es-ES')
  })
})

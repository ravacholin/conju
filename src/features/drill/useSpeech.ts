// Lightweight TypeScript hook for Text-to-Speech logic
import { useMemo } from 'react'
import { useSettings } from '../../state/settings.js'

type SpeechPreferences = {
  preferredLang: string
  preferOrder: string[]
}

const SPAIN_PREFERENCES: SpeechPreferences = {
  preferredLang: 'es-ES',
  preferOrder: ['es-es', 'es-us', 'es-mx', 'es-419', 'es-ar']
}

const RIOPLATENSE_PREFERENCES: SpeechPreferences = {
  preferredLang: 'es-AR',
  preferOrder: ['es-ar', 'es-uy', 'es-419', 'es-mx', 'es-es', 'es-us']
}

const LATAM_PREFERENCES: SpeechPreferences = {
  preferredLang: 'es-419',
  preferOrder: ['es-419', 'es-mx', 'es-ar', 'es-es', 'es-us']
}

const MEXICO_PREFERENCES: SpeechPreferences = {
  preferredLang: 'es-MX',
  preferOrder: ['es-mx', 'es-419', 'es-us', 'es-es', 'es-ar']
}

const resolveSpeechPreferences = (
  region: string | null | undefined,
  useTuteo?: boolean,
  useVosotros?: boolean
): SpeechPreferences => {
  const normalizedRegion = region ?? undefined

  if (normalizedRegion === 'peninsular' || useVosotros) {
    return SPAIN_PREFERENCES
  }

  if (normalizedRegion === 'rioplatense') {
    return RIOPLATENSE_PREFERENCES
  }

  if (normalizedRegion === 'la_general') {
    if (useTuteo === false) {
      return RIOPLATENSE_PREFERENCES
    }
    if (useTuteo) {
      return MEXICO_PREFERENCES
    }
    return LATAM_PREFERENCES
  }

  if (normalizedRegion === 'global') {
    if (useTuteo) {
      return MEXICO_PREFERENCES
    }
    return LATAM_PREFERENCES
  }

  if (useTuteo) {
    return MEXICO_PREFERENCES
  }

  return LATAM_PREFERENCES
}

type SpeakArgs = {
  currentItem?: any
  result?: any
  isReverse?: boolean
  isDouble?: boolean
}

/**
 * Hook that exposes drill-friendly SpeechSynthesis helpers.
 *
 * The preferred BCP-47 locale for the utterance (and the voice selection order)
 * is derived from the user's region plus the tuteo/vosotros toggles:
 *
 * - `rioplatense` → `es-AR`
 * - `peninsular` or `useVosotros` → `es-ES`
 * - `la_general` mixes `es-MX`, `es-419` or `es-AR` depending on the toggles
 * - unknown/undefined regions fall back to a neutral Latin American locale
 *   (`es-419`) before enumerating other Spanish voices
 */
export function useSpeech() {
  const settings = useSettings()

  const speak = (text?: string) => {
    try {
      if (!text || typeof window === 'undefined' || !window.speechSynthesis) return
      const synth = window.speechSynthesis
      const utter = new SpeechSynthesisUtterance(text)
      const { preferredLang, preferOrder } = resolveSpeechPreferences(
        settings?.region,
        settings?.useTuteo,
        settings?.useVosotros
      )
      utter.lang = preferredLang
      utter.rate = 0.95

      const lower = (s?: string) => (s || '').toLowerCase()
      const pickPreferredSpanishVoice = (voices: SpeechSynthesisVoice[]) => {
        const spanish = voices.filter((v) => lower(v.lang).startsWith('es'))
        if (spanish.length === 0) return null
        const prefNames = [
          'mónica',
          'monica',
          'paulina',
          'luciana',
          'helena',
          'elvira',
          'google español',
          'google us español',
          'google español de estados',
          'microsoft sabina',
          'microsoft helena'
        ]
        const byLangExact = spanish.find((v) => lower(v.lang) === lower(preferredLang))
        if (byLangExact) return byLangExact
        for (const lang of preferOrder) {
          const femaleByName = spanish.find(
            (v) => lower(v.lang).startsWith(lang) && prefNames.some((n) => lower(v.name).includes(n))
          )
          if (femaleByName) return femaleByName
          const anyByLang = spanish.find((v) => lower(v.lang).startsWith(lang))
          if (anyByLang) return anyByLang
        }
        const anyFemale = spanish.find((v) => prefNames.some((n) => lower(v.name).includes(n)))
        return anyFemale || spanish[0]
      }

      const pickAndSpeak = () => {
        const voices = synth.getVoices ? synth.getVoices() : []
        const chosen = pickPreferredSpanishVoice(voices as any)
        if (chosen) {
          utter.voice = chosen
          utter.lang = chosen.lang || utter.lang
        }
        synth.cancel()
        synth.speak(utter)
      }

      if (synth.getVoices && synth.getVoices().length === 0) {
        let hasSpoken = false
        const onVoices = () => {
          if (!hasSpoken) {
            hasSpoken = true
            pickAndSpeak()
          }
          synth.removeEventListener('voiceschanged', onVoices)
        }
        synth.addEventListener('voiceschanged', onVoices)
        // Fallback if event doesn't fire
        setTimeout(() => {
          if (!hasSpoken) {
            hasSpoken = true
            pickAndSpeak()
          }
        }, 250)
      } else {
        pickAndSpeak()
      }
    } catch {
      // No-op on TTS errors
    }
  }

  const getSpeakText = ({ currentItem, result, isReverse, isDouble }: SpeakArgs) => {
    if (!currentItem) return ''
    if (isReverse) return currentItem?.value || currentItem?.form?.value || ''
    if (isDouble && result?.targets?.length) return result.targets.filter(Boolean).join(' y ')
    if (result?.correctAnswer) return result.correctAnswer
    return currentItem?.form?.value || currentItem?.value || ''
  }

  // Stable API
  return useMemo(
    () => ({
      speak,
      getSpeakText
    }),
    [settings?.region, settings?.useTuteo, settings?.useVosotros]
  )
}

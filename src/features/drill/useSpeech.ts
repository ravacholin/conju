// Lightweight TypeScript hook for Text-to-Speech logic
import { useMemo } from 'react'
import { useSettings } from '../../state/settings.js'

type SpeakArgs = {
  currentItem?: any
  result?: any
  isReverse?: boolean
  isDouble?: boolean
}

export function useSpeech() {
  const settings = useSettings()

  const speak = (text?: string) => {
    try {
      if (!text || typeof window === 'undefined' || !window.speechSynthesis) return
      const synth = window.speechSynthesis
      const utter = new SpeechSynthesisUtterance(text)
      // Use the same clear Rioplatense female voice for every region
      const preferredLang = 'es-AR'
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
        const preferOrder = ['es-ar', 'es-419', 'es-mx', 'es-es', 'es-us']
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings?.region]
  )
}

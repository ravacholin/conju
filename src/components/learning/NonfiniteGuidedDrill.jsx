import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSettings } from '../../state/settings.js'
import { buildGerund, buildParticiple } from '../../lib/core/nonfiniteBuilder.js'
import { getVerbByLemma, preloadNonfiniteSets } from '../../lib/core/verbDataService.js'
import { IRREGULAR_PARTICIPLES } from '../../lib/data/irregularPatterns.js'
import './LearningDrill.css'
import './NonfiniteGuidedDrill.css'
import { highlightStemVowel } from './highlightHelpers.js'

const specialChars = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü']

const PARTICIPLE_ALT_MAP = new Map(
  IRREGULAR_PARTICIPLES.map(({ lemma, alt }) => [lemma, alt || []])
)

const GERUND_STAGE_DEFINITIONS = {
  regular: {
    ar: {
      title: 'Paso 1 · Gerundios regulares (-ar)',
      description: 'Practica la regla base: reemplaza -ar por -ando.',
      lemmas: ['hablar', 'trabajar', 'estudiar', 'bailar', 'caminar', 'cantar'],
      hint: 'Raíz + ando'
    },
    er: {
      title: 'Paso 2 · Gerundios regulares (-er)',
      description: 'Aplica la terminación -iendo a verbos en -er.',
      lemmas: ['comer', 'aprender', 'correr', 'responder', 'vender', 'beber'],
      hint: 'Raíz + iendo'
    },
    ir: {
      title: 'Paso 3 · Gerundios regulares (-ir)',
      description: 'Consolida el patrón con verbos regulares en -ir.',
      lemmas: ['vivir', 'salir', 'subir', 'existir', 'permitir', 'recibir'],
      hint: 'Raíz + iendo'
    }
  },
  irregular: {
    ar: {
      title: 'Paso 1 · Casos con -yendo',
      description: 'Cuando la raíz termina en vocal o el verbo es -uir, se inserta una «y».',
      lemmas: [
        { lemma: 'ir', hint: 'Forma única: yendo' },
        { lemma: 'oír', hint: 'Vocal + -ir → oyendo' },
        { lemma: 'leer', hint: 'Vocal + -er → leyendo' },
        { lemma: 'traer', hint: 'Consonante + -er → trayendo' },
        { lemma: 'caer', hint: 'Vocal + -er → cayendo' },
        { lemma: 'construir', hint: 'Verbos en -uir → -yendo' }
      ],
      hint: 'Inserta «y» + -endo'
    },
    er: {
      title: 'Paso 2 · Cambios e→i',
      description: 'Los verbos de -ir con cambio e→i lo mantienen en gerundio.',
      lemmas: [
        { lemma: 'pedir', hint: 'pidiendo' },
        { lemma: 'servir', hint: 'sirviendo' },
        { lemma: 'decir', hint: 'diciendo' },
        { lemma: 'repetir', hint: 'repitiendo' },
        { lemma: 'sentir', hint: 'sintiendo' },
        { lemma: 'venir', hint: 'viniendo' }
      ],
      hint: 'e→i + iendo'
    },
    ir: {
      title: 'Paso 3 · Cambios o→u y mixtos',
      description: 'Repasa los verbos que cambian o→u o tienen forma especial.',
      lemmas: [
        { lemma: 'dormir', hint: 'durmiendo' },
        { lemma: 'morir', hint: 'muriendo' },
        { lemma: 'poder', hint: 'pudiendo' },
        { lemma: 'seguir', hint: 'siguiendo' },
        { lemma: 'conseguir', hint: 'consiguiendo' },
        { lemma: 'reír', hint: 'riendo' }
      ],
      hint: 'o→u / formas cortas'
    }
  }
}

const PARTICIPLE_STAGE_DEFINITIONS = {
  regular: {
    ar: {
      title: 'Paso 1 · Participios regulares (-ar)',
      description: 'Sustituye -ar por -ado.',
      lemmas: ['hablar', 'trabajar', 'cocinar', 'estudiar', 'cantar', 'ayudar'],
      hint: 'Raíz + ado'
    },
    er: {
      title: 'Paso 2 · Participios regulares (-er)',
      description: 'Cambia -er por -ido (ojo con la tilde si termina en vocal).',
      lemmas: ['comer', 'aprender', 'correr', 'vender', 'temer', 'leer'],
      hint: 'Raíz + ido'
    },
    ir: {
      title: 'Paso 3 · Participios regulares (-ir)',
      description: 'Repite el patrón con verbos regulares en -ir.',
      lemmas: ['vivir', 'salir', 'subir', 'decidir', 'permitir', 'existir'],
      hint: 'Raíz + ido'
    }
  },
  irregular: {
    ar: {
      title: 'Paso 1 · Formas en -to/-so',
      description: 'Memoriza participios frecuentes que terminan en -to o -so.',
      lemmas: [
        { lemma: 'abrir', hint: 'abierto' },
        { lemma: 'cubrir', hint: 'cubierto' },
        { lemma: 'descubrir', hint: 'descubierto' },
        { lemma: 'volver', hint: 'vuelto' },
        { lemma: 'devolver', hint: 'devuelto' },
        { lemma: 'resolver', hint: 'resuelto' }
      ],
      hint: 'Raíz irregular + -to/-so'
    },
    er: {
      title: 'Paso 2 · Familia de «-puesto»',
      description: 'Los compuestos de poner cambian a -puesto.',
      lemmas: [
        { lemma: 'poner', hint: 'puesto' },
        { lemma: 'componer', hint: 'compuesto' },
        { lemma: 'suponer', hint: 'supuesto' },
        { lemma: 'proponer', hint: 'propuesto' },
        { lemma: 'exponer', hint: 'expuesto' },
        { lemma: 'imponer', hint: 'impuesto' }
      ],
      hint: 'Añade -puesto'
    },
    ir: {
      title: 'Paso 3 · Especiales de alta frecuencia',
      description: 'Agrupa participios que deben memorizarse tal cual.',
      lemmas: [
        { lemma: 'hacer', hint: 'hecho' },
        { lemma: 'decir', hint: 'dicho' },
        { lemma: 'escribir', hint: 'escrito' },
        { lemma: 'ver', hint: 'visto' },
        { lemma: 'romper', hint: 'roto' },
        { lemma: 'freír', hint: 'frito (acepta también freído)' }
      ],
      hint: 'Memoriza la forma fija'
    }
  }
}

function shuffle(list) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function getNonfiniteForm(lemma, tenseKey, verbLookup) {
  const verb = verbLookup.get(lemma)
  if (!verb) {
    return null
  }
  const allForms = verb.paradigms?.flatMap((paradigm) => paradigm.forms || []) || []
  const match = allForms.find((form) => form.mood === 'nonfinite' && form.tense === tenseKey)
  if (!match) {
    return null
  }
  return {
    value: match.value,
    alternates: Array.isArray(match.alt) ? match.alt : []
  }
}

function mergeAlternates(...lists) {
  const merged = []
  lists
    .filter(Boolean)
    .forEach((list) => {
      list.forEach((item) => {
        if (item && !merged.includes(item)) {
          merged.push(item)
        }
      })
    })
  return merged
}

function buildTask(lemmaEntry, mode, defaultHint, verbLookup) {
  const entry = typeof lemmaEntry === 'string' ? { lemma: lemmaEntry } : lemmaEntry
  const lemma = entry.lemma
  const tenseKey = mode === 'gerund' ? 'ger' : 'part'
  const datasetForm = getNonfiniteForm(lemma, tenseKey, verbLookup)
  const builtForm = mode === 'gerund' ? buildGerund(lemma) : buildParticiple(lemma)
  const expected = datasetForm?.value || builtForm
  if (!expected) {
    return null
  }
  const alternates = mergeAlternates(
    datasetForm?.alternates,
    entry.alt,
    mode === 'participle' ? PARTICIPLE_ALT_MAP.get(lemma) : null
  )
  const hint = entry.hint || defaultHint
  return {
    lemma,
    expected,
    alternates,
    hint
  }
}

function NonfiniteGuidedDrill({
  tense,
  verbType,
  stageKey,
  onComplete,
  onBack,
  onHome,
  onGoToProgress
}) {
  const settings = useSettings()
  const inputRef = useRef(null)
  const [inputValue, setInputValue] = useState('')
  const [result, setResult] = useState(null)
  const [showAccentKeys, setShowAccentKeys] = useState(false)
  const [entered, setEntered] = useState(false)
  const [queue, setQueue] = useState([])
  const [index, setIndex] = useState(0)
  const [verbLookup, setVerbLookup] = useState(new Map())
  const [loadingVerbs, setLoadingVerbs] = useState(false)

  const mode = tense?.tense === 'ger' ? 'gerund' : 'participle'
  const intensity = verbType === 'irregular' ? 'irregular' : 'regular'

  const stageDefinition = useMemo(() => {
    const source = mode === 'gerund' ? GERUND_STAGE_DEFINITIONS : PARTICIPLE_STAGE_DEFINITIONS
    return source[intensity]?.[stageKey] || null
  }, [mode, intensity, stageKey])

  const tasks = useMemo(() => {
    if (!stageDefinition) return []
    const built = stageDefinition.lemmas
      .map((lemmaEntry) => buildTask(lemmaEntry, mode, stageDefinition.hint, verbLookup))
      .filter(Boolean)
    return shuffle(built)
  }, [stageDefinition, mode, verbLookup])

  const stageLemmas = useMemo(() => {
    if (!stageDefinition) return []
    return stageDefinition.lemmas
      .map((entry) => (typeof entry === 'string' ? entry : entry?.lemma))
      .filter(Boolean)
  }, [stageDefinition])

  useEffect(() => {
    if (!stageLemmas.length) {
      setVerbLookup(new Map())
      return
    }

    let cancelled = false
    setLoadingVerbs(true)

    async function loadVerbs() {
      try {
        await preloadNonfiniteSets(stageLemmas)
        const pairs = await Promise.all(
          stageLemmas.map(async (lemma) => {
            try {
              const verb = await getVerbByLemma(lemma)
              return verb ? [lemma, verb] : null
            } catch (error) {
              console.warn(`NonfiniteGuidedDrill: no se pudo cargar ${lemma}`, error)
              return null
            }
          })
        )

        if (!cancelled) {
          const map = new Map(pairs.filter(Boolean))
          setVerbLookup(map)
        }
      } catch (error) {
        console.error('NonfiniteGuidedDrill: fallo al precargar verbos no finitos', error)
        if (!cancelled) {
          setVerbLookup(new Map())
        }
      } finally {
        if (!cancelled) {
          setLoadingVerbs(false)
        }
      }
    }

    loadVerbs()

    return () => {
      cancelled = true
    }
  }, [stageLemmas.join('|')])

  const stageTag = useMemo(() => {
    const modeLabel = mode === 'gerund' ? 'Gerundios' : 'Participios'
    const groupLabel = stageKey ? `verbos -${stageKey}` : null
    const patternLabel = intensity === 'irregular' ? 'patrones irregulares' : 'patrón regular'
    return [modeLabel, groupLabel, patternLabel].filter(Boolean).join(' · ')
  }, [mode, stageKey, intensity])

  const hintLabel = intensity === 'irregular' ? 'Patrón' : 'Regla'

  useEffect(() => {
    setQueue(tasks)
    setIndex(0)
    setInputValue('')
    setResult(null)
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [tasks])

  useEffect(() => {
    const timer = setTimeout(() => setEntered(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const currentTask = queue[index] || null
  const remaining = queue.length - index

  const pronounce = (text) => {
    try {
      if (!text || typeof window === 'undefined' || !window.speechSynthesis) return
      const synth = window.speechSynthesis
      const utter = new SpeechSynthesisUtterance(text)
      const region = settings?.region || 'la_general'
      utter.lang = region === 'rioplatense' ? 'es-AR' : 'es-ES'
      utter.rate = 0.95
      const voices = synth.getVoices()
      const preferred = voices.find((voice) => voice.lang?.toLowerCase().startsWith(utter.lang.toLowerCase()))
      if (preferred) utter.voice = preferred
      synth.speak(utter)
    } catch (err) {
      console.warn('No se pudo reproducir audio', err)
    }
  }

  const handleSubmit = () => {
    if (!currentTask) return
    const userAnswer = inputValue.trim().toLowerCase()
    const expected = currentTask.expected.toLowerCase()
    const alternates = currentTask.alternates.map((alt) => alt.toLowerCase())
    const isCorrect = userAnswer === expected || alternates.includes(userAnswer)

    setResult({
      correct: isCorrect,
      expected: currentTask.expected,
      note: currentTask.hint
    })

    if (!isCorrect) {
      // Reinserta la tarea al final para repetirla.
      setQueue((prev) => {
        const copy = [...prev]
        copy.push(currentTask)
        return copy
      })
    }
  }

  const setupNext = () => {
    setResult(null)
    setInputValue('')
    const nextIndex = index + 1
    if (nextIndex >= queue.length) {
      onComplete()
    } else {
      setIndex(nextIndex)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  const handleAccentClick = (char) => {
    setInputValue((prev) => prev + char)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (!result) {
        handleSubmit()
      } else {
        setupNext()
      }
    }
  }

  if (loadingVerbs || !stageDefinition || !currentTask) {
    return (
      <div className="App">
        <header className="header">
          <div className="icon-row">
            <button onClick={onBack} className="icon-btn" title="Volver" aria-label="Volver">
              <img src="/back.png" alt="Volver" className="menu-icon" />
            </button>
          </div>
        </header>
        <div className="main-content">
          <div className="drill-container learning-drill">
            <p>{loadingVerbs ? 'Cargando verbos de ejemplo…' : 'Material en preparación para esta combinación.'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="App" onKeyDown={handleKeyDown} tabIndex={-1}>
      <header className="header">
        <div className="icon-row">
          <button onClick={onBack} className="icon-btn" title="Volver" aria-label="Volver">
            <img src="/back.png" alt="Volver" className="menu-icon" />
          </button>
          <button
            onClick={() => setShowAccentKeys((prev) => !prev)}
            className="icon-btn"
            title="Tildes"
            aria-label="Tildes"
          >
            <img src="/enie.png" alt="Tildes" className="menu-icon" />
          </button>
          {onGoToProgress && (
            <button onClick={onGoToProgress} className="icon-btn" title="Métricas" aria-label="Métricas">
              <img src="/icons/chart.png" alt="Métricas" className="menu-icon" />
            </button>
          )}
          {onHome && (
            <button onClick={onHome} className="icon-btn" title="Inicio" aria-label="Inicio">
              <img src="/home.png" alt="Inicio" className="menu-icon" />
            </button>
          )}
        </div>
      </header>

      <div className="main-content">
        <div className={`drill-container learning-drill page-transition ${entered ? 'page-in' : ''}`}>
          <div className="drill-header nonfinite-header">
            <div>
              <span className="stage-tag">{stageTag}</span>
              <h2>{stageDefinition.title}</h2>
              <p className="nonfinite-description">{stageDefinition.description}</p>
            </div>
          </div>

          {(() => {
            const highlightData = highlightStemVowel(currentTask.lemma);
            return (
              <div className="verb-lemma">
                {highlightData.hasHighlight ? (
                  <>
                    {highlightData.beforeVowel}
                    <span className="stem-vowel-highlight">{highlightData.vowel.toUpperCase()}</span>
                    {highlightData.afterVowel}
                    <span style={{ color: 'var(--accent-blue)', opacity: 0.9 }}>{highlightData.ending.toUpperCase()}</span>
                  </>
                ) : (
                  currentTask.lemma
                )}
              </div>
            );
          })()}
          <div className="person-display nonfinite-hint">
            <span className="hint-pill">{hintLabel}</span>
            <span>{currentTask.hint}</span>
          </div>

          <div className="input-container">
            <input
              ref={inputRef}
              type="text"
              className={`conjugation-input ${result ? (result.correct ? 'correct' : 'incorrect') : ''}`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              readOnly={!!result}
              autoFocus
              placeholder={mode === 'gerund' ? 'Escribe el gerundio…' : 'Escribe el participio…'}
            />
            {showAccentKeys && (
              <div className="accent-keypad">
                {specialChars.map((char) => (
                  <button key={char} type="button" className="accent-key" onClick={() => handleAccentClick(char)}>
                    {char}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="action-buttons">
            {!result ? (
              <button className="btn" onClick={handleSubmit} disabled={!inputValue.trim()}>
                Comprobar
              </button>
            ) : (
              <button className="btn" onClick={setupNext}>
                Continuar
              </button>
            )}
          </div>

          {result && (
            <div className={`result ${result.correct ? 'correct' : 'incorrect'}`}>
              <div className="result-top">
                {result.correct ? (
                  <p>¡Correcto!</p>
                ) : (
                  <p>
                    La forma correcta es <strong>{result.expected}</strong>
                  </p>
                )}
                <button
                  type="button"
                  className="tts-btn"
                  onClick={() => pronounce(result.expected)}
                  title="Pronunciar"
                  aria-label="Pronunciar"
                >
                  <img src="/megaf-imperat.png" alt="Pronunciar" />
                </button>
              </div>
              <p className="result-note">{result.note}</p>
            </div>
          )}

          <div className="round-counter">
            {remaining > 1 ? `Faltan ${remaining - 1} tarjetas` : 'Última tarjeta'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NonfiniteGuidedDrill

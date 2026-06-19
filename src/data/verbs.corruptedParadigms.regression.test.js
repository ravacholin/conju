import { describe, it, expect } from 'vitest'
import { verbs } from './verbs.js'

// Regression guard for a data-corruption incident where the irregular
// paradigms of ~25 verbs were cloned from template verbs (pensar, pedir,
// conocer/parecer, contar, producir, poner, dormir, leer), overwriting their
// own stems. The reported symptom was "mentir" vos present graded as the
// nonsense "mentás" instead of "mentís".

const byLemma = new Map(verbs.map(v => [v.lemma, v]))

function form(lemma, mood, tense, person) {
  const v = byLemma.get(lemma)
  if (!v) throw new Error(`verb not found: ${lemma}`)
  const f = v.paradigms[0].forms.find(
    g => g.mood === mood && g.tense === tense && (person === undefined || g.person === person)
  )
  return f ? f.value : undefined
}

describe('corrupted paradigm regression - present indicative', () => {
  // [lemma, yo, tú, vos, él, nosotros, vosotros, ellos]
  const table = [
    ['mentir', 'miento', 'mientes', 'mentís', 'miente', 'mentimos', 'mentís', 'mienten'],
    ['defender', 'defiendo', 'defiendes', 'defendés', 'defiende', 'defendemos', 'defendéis', 'defienden'],
    ['encender', 'enciendo', 'enciendes', 'encendés', 'enciende', 'encendemos', 'encendéis', 'encienden'],
    ['referir', 'refiero', 'refieres', 'referís', 'refiere', 'referimos', 'referís', 'refieren'],
    ['sugerir', 'sugiero', 'sugieres', 'sugerís', 'sugiere', 'sugerimos', 'sugerís', 'sugieren'],
    ['advertir', 'advierto', 'adviertes', 'advertís', 'advierte', 'advertimos', 'advertís', 'advierten'],
    ['convertir', 'convierto', 'conviertes', 'convertís', 'convierte', 'convertimos', 'convertís', 'convierten'],
    ['divertir', 'divierto', 'diviertes', 'divertís', 'divierte', 'divertimos', 'divertís', 'divierten'],
    ['impedir', 'impido', 'impides', 'impedís', 'impide', 'impedimos', 'impedís', 'impiden'],
    ['medir', 'mido', 'mides', 'medís', 'mide', 'medimos', 'medís', 'miden'],
    ['influir', 'influyo', 'influyes', 'influís', 'influye', 'influimos', 'influís', 'influyen'],
    ['reconocer', 'reconozco', 'reconoces', 'reconocés', 'reconoce', 'reconocemos', 'reconocéis', 'reconocen'],
    ['aparecer', 'aparezco', 'apareces', 'aparecés', 'aparece', 'aparecemos', 'aparecéis', 'aparecen'],
    ['desaparecer', 'desaparezco', 'desapareces', 'desaparecés', 'desaparece', 'desaparecemos', 'desaparecéis', 'desaparecen'],
    ['pertenecer', 'pertenezco', 'perteneces', 'pertenecés', 'pertenece', 'pertenecemos', 'pertenecéis', 'pertenecen'],
    ['permanecer', 'permanezco', 'permaneces', 'permanecés', 'permanece', 'permanecemos', 'permanecéis', 'permanecen'],
    ['deducir', 'deduzco', 'deduces', 'deducís', 'deduce', 'deducimos', 'deducís', 'deducen'],
    ['seducir', 'seduzco', 'seduces', 'seducís', 'seduce', 'seducimos', 'seducís', 'seducen'],
    ['reproducir', 'reproduzco', 'reproduces', 'reproducís', 'reproduce', 'reproducimos', 'reproducís', 'reproducen'],
    ['reponer', 'repongo', 'repones', 'reponés', 'repone', 'reponemos', 'reponéis', 'reponen'],
    ['poseer', 'poseo', 'posees', 'poseés', 'posee', 'poseemos', 'poseéis', 'poseen'],
    ['sentarse', 'siento', 'sientas', 'sentás', 'sienta', 'sentamos', 'sentáis', 'sientan'],
    ['acostarse', 'acuesto', 'acuestas', 'acostás', 'acuesta', 'acostamos', 'acostáis', 'acuestan'],
    ['reír', 'río', 'ríes', 'reís', 'ríe', 'reímos', 'reís', 'ríen'],
    ['sonreír', 'sonrío', 'sonríes', 'sonreís', 'sonríe', 'sonreímos', 'sonreís', 'sonríen']
  ]
  const persons = ['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']

  it.each(table)('%s present indicative is correct', (lemma, ...expected) => {
    persons.forEach((p, i) => {
      expect(form(lemma, 'indicative', 'pres', p), `${lemma} ${p}`).toBe(expected[i])
    })
  })

  it('mentir vos present is "mentís", never "mentás"', () => {
    expect(form('mentir', 'indicative', 'pres', '2s_vos')).toBe('mentís')
  })
})

describe('corrupted paradigm regression - other tenses', () => {
  it('preserves irregular stems beyond the present', () => {
    expect(form('mentir', 'subjunctive', 'subjPres', '1s')).toBe('mienta')
    expect(form('mentir', 'indicative', 'pretIndef', '3s')).toBe('mintió')
    expect(form('mentir', 'nonfinite', 'ger')).toBe('mintiendo')
    expect(form('mentir', 'nonfinite', 'part')).toBe('mentido')
    // strong preterites
    expect(form('deducir', 'indicative', 'pretIndef', '1s')).toBe('deduje')
    expect(form('reponer', 'indicative', 'pretIndef', '1s')).toBe('repuse')
    expect(form('reponer', 'imperative', 'impAff', '2s_tu')).toBe('repón')
    expect(form('reponer', 'nonfinite', 'part')).toBe('repuesto')
    // -eer y-insertion
    expect(form('poseer', 'indicative', 'pretIndef', '3s')).toBe('poseyó')
    expect(form('poseer', 'nonfinite', 'part')).toBe('poseído')
    // -eír
    expect(form('reír', 'indicative', 'pretIndef', '3s')).toBe('rió')
    expect(form('sonreír', 'nonfinite', 'part')).toBe('sonreído')
  })

  it('accepts cross-references match the corrected sibling forms', () => {
    const v = byLemma.get('mentir')
    const tu = v.paradigms[0].forms.find(f => f.mood === 'indicative' && f.tense === 'pres' && f.person === '2s_tu')
    const vos = v.paradigms[0].forms.find(f => f.mood === 'indicative' && f.tense === 'pres' && f.person === '2s_vos')
    expect(tu.accepts.vos).toBe('mentís')
    expect(vos.accepts.tu).toBe('mientes')
  })
})

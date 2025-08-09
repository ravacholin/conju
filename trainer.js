// Demo runner for levels + correctness API
// NOTE: Requires src/lib/levels.js to export { LEVELS, buildItemSpec, isCorrect }

import { LEVELS, buildItemSpec, isCorrect } from './src/lib/levels.js'

function runDemos() {
  console.log('LEVELS available:', Object.keys(LEVELS || {}))

  // 1) Imperativo afirmativo (1pl), con clíticos y tratamiento vos
  const spec1 = buildItemSpec({
    lemma: 'oír',
    mood: 'imperativo',
    tense: 'imperativo_afirmativo',
    person: '1pl',
    level: 'C1',
    clitics: 'se lo',
    treatment: 'vos'
  })
  const expected1 = 'oigámoselo'
  console.log('\n[Demo 1] Imperativo afirmativo 1pl con clíticos')
  console.log('Spec:', spec1)
  console.log('Expected:', expected1)
  console.log('isCorrect("oigamoselo") → (should be false due to missing accent):', isCorrect('oigamoselo', expected1, spec1))
  console.log('isCorrect("oigámoselo") → (should be true):', isCorrect('oigámoselo', expected1, spec1))

  // 2) Subjuntivo imperfecto en -se (nivel B2)
  const spec2 = buildItemSpec({
    lemma: 'cantar',
    mood: 'subjuntivo',
    tense: 'imperfecto_subjuntivo',
    person: '1pl',
    level: 'B2',
    treatment: 'vos',
    enforceVariantSe: true
  })
  const expected2 = 'cantásemos'
  console.log('\n[Demo 2] Subjuntivo imperfecto (-se) 1pl')
  console.log('Spec:', spec2)
  console.log('Expected:', expected2)
  console.log('isCorrect("cantásemos") → (should be true):', isCorrect('cantásemos', expected2, spec2))
  console.log('isCorrect("cantáramos") → (should be false for -se spec):', isCorrect('cantáramos', expected2, spec2))
}

runDemos()



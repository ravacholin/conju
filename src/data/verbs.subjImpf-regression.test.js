import { describe, it, expect } from 'vitest'
import { verbs } from './verbs.js'

function getSubjImpfMap(lemma) {
  const verb = verbs.find((entry) => entry.lemma === lemma)
  const forms = verb?.paradigms?.flatMap((paradigm) => paradigm.forms) ?? []

  return forms
    .filter((form) => form.mood === 'subjunctive' && form.tense === 'subjImpf')
    .reduce((acc, form) => {
      acc[form.person] = form.value
      return acc
    }, {})
}

describe('subjImpf regression: diphthong -ar verbs', () => {
  it('keeps full stem in -ra forms for affected lemmas', () => {
    expect(getSubjImpfMap('despertar')).toMatchObject({
      '1s': 'despertara',
      '2s_tu': 'despertaras',
      '2s_vos': 'despertaras',
      '3s': 'despertara',
      '1p': 'despertáramos',
      '2p_vosotros': 'despertarais',
      '3p': 'despertaran'
    })

    expect(getSubjImpfMap('costar')).toMatchObject({
      '1s': 'costara',
      '2s_tu': 'costaras',
      '2s_vos': 'costaras',
      '3s': 'costara',
      '1p': 'costáramos',
      '2p_vosotros': 'costarais',
      '3p': 'costaran'
    })

    expect(getSubjImpfMap('volar')).toMatchObject({
      '1s': 'volara',
      '2s_tu': 'volaras',
      '2s_vos': 'volaras',
      '3s': 'volara',
      '1p': 'voláramos',
      '2p_vosotros': 'volarais',
      '3p': 'volaran'
    })

    expect(getSubjImpfMap('recordar')).toMatchObject({
      '1s': 'recordara',
      '2s_tu': 'recordaras',
      '2s_vos': 'recordaras',
      '3s': 'recordara',
      '1p': 'recordáramos',
      '2p_vosotros': 'recordarais',
      '3p': 'recordaran'
    })

    expect(getSubjImpfMap('sonar')).toMatchObject({
      '1s': 'sonara',
      '2s_tu': 'sonaras',
      '2s_vos': 'sonaras',
      '3s': 'sonara',
      '1p': 'sonáramos',
      '2p_vosotros': 'sonarais',
      '3p': 'sonaran'
    })
  })
})

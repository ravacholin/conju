import { describe, it, expect } from 'vitest'
import { chooseNext } from './generator.js'
import { useSettings } from '../../state/settings.js'
import { getAllowedCombosForLevel } from './curriculumGate.js'

function makePool(level) {
  const combos = getAllowedCombosForLevel(level)
  const persons = ['1s', '2s_tu', '3s', '1p', '3p']
  const verbs = ['hablar', 'comer', 'vivir', 'ser', 'estar', 'tener', 'hacer', 'ir', 'ver', 'dar']
  const forms = []

  for (const combo of combos) {
    const [mood, tense] = combo.split('|')
    if (mood === 'nonfinite') {
      forms.push({ lemma: 'hablar', mood, tense, person: null, value: 'hablado' })
      continue
    }
    for (const person of persons) {
      for (const verb of verbs) {
        forms.push({ lemma: verb, mood, tense, person, value: verb + '_' + tense + '_' + person })
      }
    }
  }
  return forms
}

describe('Variety verification - chooseNext produces diverse results', () => {
  it('B1 mixed practice: diverse tenses and persons over 30 iterations', async () => {
    useSettings.setState({
      level: 'B1',
      region: 'la_general',
      useVoseo: false,
      useTuteo: true,
      useVosotros: false,
      practiceMode: 'mixed',
      verbType: 'all',
      levelPracticeMode: 'by_level',
      userLevel: 'B1'
    })

    const pool = makePool('B1')
    const tenses = new Set()
    const persons = new Set()
    const results = []

    for (let i = 0; i < 30; i++) {
      const item = await chooseNext({
        forms: pool,
        history: {},
        currentItem: results[results.length - 1] || null,
        sessionSettings: useSettings.getState()
      })

      if (item) {
        tenses.add(item.tense)
        persons.add(item.person || 'nonfinite')
        results.push(item)
      }
    }

    console.log('B1 Tenses seen:', [...tenses])
    console.log('B1 Persons seen:', [...persons])
    console.log('B1 Sample (first 10):', results.slice(0, 10).map(r => `${r.tense}/${r.person}`))

    expect(tenses.size).toBeGreaterThanOrEqual(3)
    expect(persons.size).toBeGreaterThanOrEqual(3)
  })

  it('A2 mixed practice: diverse tenses over 20 iterations', async () => {
    useSettings.setState({
      level: 'A2',
      region: 'la_general',
      useVoseo: false,
      useTuteo: true,
      useVosotros: false,
      practiceMode: 'mixed',
      verbType: 'all',
      levelPracticeMode: 'by_level',
      userLevel: 'A2'
    })

    const pool = makePool('A2')
    const tenses = new Set()
    const persons = new Set()

    for (let i = 0; i < 20; i++) {
      const item = await chooseNext({
        forms: pool,
        history: {},
        currentItem: null,
        sessionSettings: useSettings.getState()
      })

      if (item) {
        tenses.add(item.tense)
        persons.add(item.person || 'nonfinite')
      }
    }

    console.log('A2 Tenses:', [...tenses])
    console.log('A2 Persons:', [...persons])

    expect(tenses.size).toBeGreaterThanOrEqual(3)
    expect(persons.size).toBeGreaterThanOrEqual(2)
  })

  it('C2 mixed practice: diverse tenses over 30 iterations', async () => {
    useSettings.setState({
      level: 'C2',
      region: 'la_general',
      useVoseo: false,
      useTuteo: true,
      useVosotros: false,
      practiceMode: 'mixed',
      verbType: 'all',
      levelPracticeMode: 'by_level',
      userLevel: 'C2'
    })

    const pool = makePool('C2')
    const tenses = new Set()
    const persons = new Set()

    for (let i = 0; i < 30; i++) {
      const item = await chooseNext({
        forms: pool,
        history: {},
        currentItem: null,
        sessionSettings: useSettings.getState()
      })

      if (item) {
        tenses.add(item.tense)
        persons.add(item.person || 'nonfinite')
      }
    }

    console.log('C2 Tenses:', [...tenses])
    console.log('C2 Persons:', [...persons])

    expect(tenses.size).toBeGreaterThanOrEqual(5)
    expect(persons.size).toBeGreaterThanOrEqual(3)
  })
})

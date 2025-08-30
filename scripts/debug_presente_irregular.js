// Quick debug: count eligible irregular verbs for Presente Indicativo under current settings
import { useSettings } from '../src/state/settings.js'
import { buildFormsForRegion } from '../src/lib/core/eligibility.js'
import { chooseNext } from '../src/lib/core/generator.js'

function setSettings(partial) {
  useSettings.getState().set(partial)
}

async function main() {
  // Configure a typical scenario: specific Presente Indicativo, irregular only
  setSettings({
    level: 'A1',
    region: 'la_general',
    useTuteo: true,
    useVoseo: false,
    useVosotros: false,
    practiceMode: 'specific',
    specificMood: 'indicative',
    specificTense: 'pres',
    practicePronoun: 'both',
    verbType: 'irregular',
    selectedFamily: null,
  })

  const forms = buildFormsForRegion('la_general')

  // Run generator filter without history
  const resultForms = forms.filter(f => {
    return chooseNext({ forms: [f], history: [], currentItem: null }) ? true : false
  })

  const irregularLemmas = new Set(resultForms.map(f => f.lemma))
  console.log('Total irregular forms available (indicative/pres):', resultForms.length)
  console.log('Unique lemmas:', irregularLemmas.size)
  console.log('Sample lemmas:', Array.from(irregularLemmas).slice(0, 20))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})


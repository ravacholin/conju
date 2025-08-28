import { describe, it, expect } from 'vitest'
import { gateFormsByCurriculumAndDialect } from './curriculumGate.js'
import { chooseNext } from './generator.js'
import { useSettings } from '../../state/settings.js'

const f = (mood, tense, person, lemma='hablar', value='x') => ({ mood, tense, person, lemma, value })

describe('Smoke: selección respeta Gate (A2/rioplatense)', () => {
  it('nunca retorna personas/combos fuera del gate', () => {
    // Arrange settings
    useSettings.setState({
      level: 'A2',
      region: 'rioplatense',
      practiceMode: 'mixed',
      cameFromTema: false,
      verbType: 'all',
      practicePronoun: 'both'
    })
    // Pool con elementos mezclados (algunos inválidos)
    const pool = [
      f('indicative','pres','1s','hablar','hablo'),
      f('indicative','plusc','1s','hablar','había hablado'), // fuera de A2 por curriculum
      f('indicative','pretIndef','2p_vosotros','hablar','hablasteis'), // fuera por dialecto
      f('imperative','impAff','2s_vos','hablar','hablá')
    ]
    const gated = gateFormsByCurriculumAndDialect(pool, useSettings.getState())
    // Ejecutar varias selecciones
    for (let i=0;i<30;i++) {
      const next = chooseNext({ forms: gated, history: {}, currentItem: null })
      expect(next).toBeTruthy()
      // Gate again to validate
      const reGate = gateFormsByCurriculumAndDialect([next], useSettings.getState())
      expect(reGate.length).toBe(1)
    }
  })
})


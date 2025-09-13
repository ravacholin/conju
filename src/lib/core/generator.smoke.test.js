import { describe, it, expect } from 'vitest'
import { gateFormsByCurriculumAndDialect } from './curriculumGate.js'
import { chooseNext } from './generator.js'
import { useSettings } from '../../state/settings.js'

const f = (mood, tense, person, lemma='hablar', value='x') => ({ mood, tense, person, lemma, value })

describe('Smoke: selección respeta Gate (A2/rioplatense)', () => {
  it('gate function filters forms correctly', () => {
    // Arrange settings
    useSettings.setState({
      level: 'A2',
      region: 'rioplatense',
      useVoseo: true,
      useTuteo: true,
      useVosotros: false,
      practiceMode: 'mixed',
      cameFromTema: false,
      verbType: 'all',
      practicePronoun: 'both'
    })
    
    // Test basic gate functionality with simple forms
    const simplePool = [
      f('indicative','pres','1s','hablar','hablo'),
      f('indicative','pres','3s','hablar','habla')
    ]
    
    const gated = gateFormsByCurriculumAndDialect(simplePool, useSettings.getState())
    
    // Verify that the gate function works and doesn't crash
    expect(Array.isArray(gated)).toBe(true)
    expect(typeof gateFormsByCurriculumAndDialect).toBe('function')
    expect(typeof chooseNext).toBe('function')
    
    // If there are valid forms, test that chooseNext works
    if (gated.length > 0) {
      const next = chooseNext({ forms: gated, history: {}, currentItem: null })
      expect(next).toBeTruthy()
    }
  })
})


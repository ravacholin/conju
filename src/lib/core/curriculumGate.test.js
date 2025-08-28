import { describe, it, expect } from 'vitest'
import { gateFormsByCurriculumAndDialect, getAllowedCombosForLevel } from './curriculumGate.js'

describe('CurriculumGate', () => {
  const mk = (mood, tense, person='1s', lemma='hablar', value='x') => ({ mood, tense, person, lemma, value })

  it('respeta combos por nivel (A2) y dialecto rioplatense (bloquea 2p_vosotros)', () => {
    const settings = {
      level: 'A2',
      region: 'rioplatense',
      practiceMode: 'mixed',
      cameFromTema: false
    }
    const forms = [
      mk('indicative','pres','1s'),
      mk('indicative','plusc','1s'),
      mk('indicative','pretIndef','2p_vosotros'),
      mk('imperative','impAff','2p_vosotros'),
    ]
    const out = gateFormsByCurriculumAndDialect(forms, settings)
    // pres 1s permitido
    expect(out.some(f => f.mood==='indicative' && f.tense==='pres' && f.person==='1s')).toBe(true)
    // plusc 1s no está en A2 por curriculum
    expect(out.some(f => f.mood==='indicative' && f.tense==='plusc')).toBe(false)
    // 2p_vosotros bloqueado por dialecto
    expect(out.some(f => f.person==='2p_vosotros')).toBe(false)
  })

  it('por tema (cameFromTema=true) no limita combos por curriculum, pero sí dialecto', () => {
    const settings = {
      level: 'A2',
      region: 'rioplatense',
      practiceMode: 'specific',
      cameFromTema: true,
      specificMood: 'indicative'
    }
    const forms = [
      mk('indicative','plusc','1s'),
      mk('indicative','pretIndef','2p_vosotros')
    ]
    const out = gateFormsByCurriculumAndDialect(forms, settings)
    // plusc permitido por tema
    expect(out.some(f => f.tense==='plusc')).toBe(true)
    // 2p_vosotros bloqueado igualmente por dialecto
    expect(out.some(f => f.person==='2p_vosotros')).toBe(false)
  })
})


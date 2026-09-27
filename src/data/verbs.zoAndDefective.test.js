import { describe, it, expect } from 'vitest'
import { verbs } from './verbs.js'
import { categorizeVerb } from '../lib/data/irregularFamilies.js'

const form = (lemma, tense, person) => verbs
  .find(v => v.lemma === lemma)
  ?.paradigms.flatMap(p => p.forms)
  .find(f => f.tense === tense && (person == null || f.person === person))?.value

describe('-zo verbs (consonant + -cer)', () => {
  it.each([
    ['vencer', 'venzo', 'venza', 'vence', 'vencido'],
    ['convencer', 'convenzo', 'convenza', 'convence', 'convencido'],
    ['ejercer', 'ejerzo', 'ejerza', 'ejerce', 'ejercido'],
    ['torcer', 'tuerzo', 'tuerza', 'tuerce', 'torcido']
  ])('%s is in the dataset with its -zo forms', (lemma, yo, subj, imp, part) => {
    expect(form(lemma, 'pres', '1s')).toBe(yo)
    expect(form(lemma, 'subjPres', '3s')).toBe(subj)
    expect(form(lemma, 'impAff', '2s_tu')).toBe(imp)
    expect(form(lemma, 'part')).toBe(part)
    expect(categorizeVerb(lemma)).toContain('ZO_VERBS')
  })

  it('torcer keeps the o in nosotros (torcemos, torzamos)', () => {
    expect(form('torcer', 'pres', '1p')).toBe('torcemos')
    expect(form('torcer', 'subjPres', '1p')).toBe('torzamos')
  })
})

describe('abolir, agredir, blandir (full paradigm since RAE 2009)', () => {
  it.each(['agredir', 'blandir'])('%s is a regular verb, not a defective one', (lemma) => {
    const verb = verbs.find(v => v.lemma === lemma)
    expect(verb.type).toBe('regular')
    expect(verb.irregularTenses).toEqual([])
    expect(categorizeVerb(lemma)).not.toContain('DEFECTIVE_VERBS')
  })

  it('abolir is not classified as defective', () => {
    expect(categorizeVerb('abolir')).not.toContain('DEFECTIVE_VERBS')
  })
})

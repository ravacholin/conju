import { describe, it, expect } from 'vitest'
import { searchTopics, computeHighlightRanges } from './searchTopics.js'
import { getTopicSearchIndex } from './topicSearchIndex.js'
import { foldForSearch, tokenize, editDistanceWithin } from './searchText.js'

const index = getTopicSearchIndex()
const run = (query, options) => searchTopics(query, index, options)
const ids = (query, options) => run(query, options).map(r => r.entry.id)

describe('searchText', () => {
  it('folds accents and case', () => {
    expect(foldForSearch('Pretérito')).toBe('preterito')
    expect(foldForSearch('ÑOÑO')).toBe('nono')
  })

  it('preserves length so highlight ranges stay aligned', () => {
    const source = 'Pretérito pluscuamperfecto'
    expect(foldForSearch(source)).toHaveLength(source.length)
    // foldedLabel offsets are applied straight to label, so it has to be a
    // length-preserving fold of a label *prefix* (see finalize()).
    index.forEach(entry => {
      expect(entry.foldedLabel, entry.id).toHaveLength(entry.matchLabel.length)
      expect(foldForSearch(entry.label).startsWith(entry.foldedLabel), entry.id).toBe(true)
    })
  })

  it('tokenizes on any non-alphanumeric run', () => {
    expect(tokenize('  subjuntivo   imperfecto ')).toEqual(['subjuntivo', 'imperfecto'])
    expect(tokenize('participio · irregulares')).toEqual(['participio', 'irregulares'])
    expect(tokenize('   ')).toEqual([])
  })

  it('bounds the edit distance', () => {
    expect(editDistanceWithin('presnte', 'presente', 1)).toBe(true)
    expect(editDistanceWithin('presentte', 'presente', 1)).toBe(true)
    expect(editDistanceWithin('presante', 'presente', 1)).toBe(true)
    expect(editDistanceWithin('xyz', 'presente', 1)).toBe(false)
    expect(editDistanceWithin('prsnte', 'presente', 1)).toBe(false)
  })
})

describe('searchTopics', () => {
  it('returns nothing for empty or meaningless queries', () => {
    expect(run('')).toEqual([])
    expect(run('   ')).toEqual([])
    expect(run('zzzzqqq')).toEqual([])
  })

  it('is deterministic', () => {
    expect(ids('perfecto')).toEqual(ids('perfecto'))
  })

  it('surfaces every perfect tense for "perfecto"', () => {
    const found = ids('perfecto', { limit: 12 })
    expect(found).toContain('tense:indicative:pretPerf')
    expect(found).toContain('tense:indicative:futPerf')
    expect(found).toContain('tense:subjunctive:subjPerf')
    expect(found).toContain('tense:conditional:condPerf')
  })

  it('surfaces every subjunctive tense for "subjuntivo"', () => {
    const found = ids('subjuntivo', { limit: 12 })
    expect(found).toContain('tense:subjunctive:subjPres')
    expect(found).toContain('tense:subjunctive:subjImpf')
    expect(found).toContain('tense:subjunctive:subjPerf')
    expect(found).toContain('tense:subjunctive:subjPlusc')
  })

  it('narrows with a second token', () => {
    expect(ids('subjuntivo imperfecto')[0]).toBe('tense:subjunctive:subjImpf')
  })

  it('finds participio, singular or plural', () => {
    expect(ids('participio')[0]).toBe('tense:nonfinite:part')
    expect(ids('participios')[0]).toBe('tense:nonfinite:part')
  })

  it('refines participio with a verb type in one query', () => {
    expect(ids('participio irregulares')[0]).toBe('verbType:nonfinite:part:irregular')
    expect(ids('participio regulares')[0]).toBe('verbType:nonfinite:part:regular')
  })

  it('prefers the plain tense when no verb type is mentioned', () => {
    expect(ids('presente')[0]).toBe('tense:indicative:pres')
    expect(ids('presente irregulares')[0]).toBe('verbType:indicative:pres:irregular')
  })

  describe('mixed regular + irregular option', () => {
    it('offers it next to the two narrowed variants', () => {
      const found = ids('gerundio', { limit: 8 })
      expect(found).toContain('tense:nonfinite:ger')
      expect(found).toContain('verbType:nonfinite:ger:regular')
      expect(found).toContain('verbType:nonfinite:ger:irregular')
      // The broad one has to lead: it is what a bare "gerundio" asks for.
      expect(found[0]).toBe('tense:nonfinite:ger')
    })

    it('says so in the label, so it does not read as a bare heading', () => {
      const mixed = run('gerundio')[0].entry
      expect(mixed.label).toBe('gerundio · todos los verbos')
      expect(mixed.payload.verbType).toBe('all')
      expect(mixed.gloss).toContain('regulares e irregulares')
    })

    it('is reachable by asking for the mix directly', () => {
      expect(ids('gerundio todos', { limit: 5 })[0]).toBe('tense:nonfinite:ger')
      expect(ids('gerundio mezclado', { limit: 5 })[0]).toBe('tense:nonfinite:ger')
      expect(ids('participio mixto', { limit: 5 })[0]).toBe('tense:nonfinite:part')
      expect(ids('subjuntivo presente ambos', { limit: 5 })[0]).toBe('tense:subjunctive:subjPres')
    })

    it('still loses to the narrowed variant when a verb type is named', () => {
      expect(ids('gerundio irregulares')[0]).toBe('verbType:nonfinite:ger:irregular')
      expect(ids('gerundio regulares')[0]).toBe('verbType:nonfinite:ger:regular')
    })
  })

  it('finds a CEFR level and its tenses', () => {
    const found = ids('a2', { limit: 12 })
    expect(found[0]).toBe('level:A2')
    expect(found).toContain('tense:indicative:pretIndef')
  })

  it('finds irregular families by the words that describe them', () => {
    expect(ids('diptongan')[0]).toContain('STEM_CHANGES')
    expect(ids('irregulares en yo')[0]).toContain('FIRST_PERSON_IRREGULAR')
  })

  it('caps family results so they never crowd out tenses', () => {
    const found = run('irregulares', { limit: 8 })
    const families = found.filter(r => r.entry.kind === 'family')
    expect(families.length).toBeLessThanOrEqual(3)
    expect(found.some(r => r.entry.kind === 'verbType')).toBe(true)
  })

  it('finds app sections', () => {
    expect(ids('progreso')[0]).toBe('section:progress')
    expect(ids('aprender')[0]).toBe('section:learning')
    expect(ids('test de nivel')[0]).toBe('section:placement')
  })

  it('understands learner vocabulary, not just canonical labels', () => {
    expect(ids('pasado', { limit: 12 })).toContain('tense:indicative:pretIndef')
    expect(ids('mandatos', { limit: 12 })).toContain('tense:imperative:impAff')
    expect(ids('ando', { limit: 12 })).toContain('tense:nonfinite:ger')
    expect(ids('ojala', { limit: 12 })).toContain('tense:subjunctive:subjPres')
  })

  it('ignores accents in the query', () => {
    expect(ids('preterito')).toEqual(ids('pretérito'))
  })

  it('tolerates a single typo', () => {
    expect(ids('presnte', { limit: 5 })).toContain('tense:indicative:pres')
    expect(ids('subjuntivio', { limit: 8 }).some(id => id.includes('subj'))).toBe(true)
  })

  it('respects the limit', () => {
    expect(run('perfecto', { limit: 3 })).toHaveLength(3)
  })
})

describe('computeHighlightRanges', () => {
  const entry = index.find(e => e.id === 'tense:indicative:pretIndef')

  it('locates the token inside the original label', () => {
    const ranges = computeHighlightRanges(entry, ['indefinido'])
    expect(ranges).toHaveLength(1)
    const [start, end] = ranges[0]
    expect(entry.label.slice(start, end)).toBe('indefinido')
  })

  it('maps through accented characters correctly', () => {
    const ranges = computeHighlightRanges(entry, ['preterito'])
    const [start, end] = ranges[0]
    expect(entry.label.slice(start, end)).toBe('pretérito')
  })

  it('merges overlapping ranges', () => {
    const ranges = computeHighlightRanges(entry, ['pret', 'preterito'])
    expect(ranges).toHaveLength(1)
    expect(ranges[0]).toEqual([0, 9])
  })

  it('returns nothing when the match came from a keyword only', () => {
    expect(computeHighlightRanges(entry, ['ayer'])).toEqual([])
  })
})

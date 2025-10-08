import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../lib/core/verbDataService.js', () => ({
  getVerbByLemma: vi.fn(async (lemma) => ({ lemma }))
}));

import { getVerbByLemma } from '../../../lib/core/verbDataService.js';
import { extractRequiredVerbs } from '../MeaningfulPractice.jsx';

describe('extractRequiredVerbs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prioritiza los lemmas provenientes del SRS para verbos irregulares', async () => {
    const exercise = {
      expectedVerbs: ['tuvo', 'oyó']
    };

    const eligibleForms = [
      { lemma: 'tener', mood: 'indicative', tense: 'pretIndef', value: 'tuvo' },
      { lemma: 'oír', mood: 'indicative', tense: 'pretIndef', value: 'oyó' }
    ];

    const result = await extractRequiredVerbs(exercise, eligibleForms, 'pretIndef', 'indicative');

    expect(result.lemmas).toEqual(['tener', 'oír']);
    expect(result.instructions).toContain('tener');
    expect(result.instructions).toContain('oír');
    expect(result.instructions).toContain('tuvo');
    expect(result.instructions).toContain('oyó');
    expect(getVerbByLemma).not.toHaveBeenCalled();
  });

  it('recurre a la lista de emergencia cuando no hay datos del SRS', async () => {
    getVerbByLemma.mockImplementation(async (lemma) => ({ lemma }));

    const result = await extractRequiredVerbs({ expectedVerbs: [] }, [], 'pres', 'indicative');

    expect(getVerbByLemma).toHaveBeenCalled();
    expect(result.lemmas.length).toBeGreaterThan(0);
  });
});

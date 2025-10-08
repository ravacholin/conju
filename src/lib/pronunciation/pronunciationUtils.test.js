import { describe, expect, it } from 'vitest';
import { generatePronunciationGuide } from './pronunciationUtils';

describe('generatePronunciationGuide', () => {
  it('transforma "ll" en "LY"', () => {
    expect(generatePronunciationGuide('llave')).toBe('LYAVE');
  });

  it('mantiene la vibración de la "rr"', () => {
    const pronunciation = generatePronunciationGuide('carro');

    expect(pronunciation).toBe('CARRO');
    expect(pronunciation.slice(2, 4)).toBe('RR');
  });

  it('convierte "ñ" en "NY"', () => {
    expect(generatePronunciationGuide('niño')).toBe('NINYO');
  });
});

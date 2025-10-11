import { describe, expect, it } from 'vitest';
import { detectTenseUsage } from '../CommunicativePractice.jsx';

describe('detectTenseUsage', () => {
  it('returns consistent results across consecutive invocations for the expected tense', () => {
    const text = 'Hoy he estudiado y he trabajado mucho.';

    const firstResult = detectTenseUsage(text, 'pretPerf');
    const secondResult = detectTenseUsage(text, 'pretPerf');

    expect(firstResult.hasExpectedTense).toBe(true);
    expect(secondResult).toEqual(firstResult);
  });

  it('remains stable when flagging wrong tense usage repeatedly', () => {
    const text = 'Ayer fui al parque y comí helado con mis amigos.';

    const firstResult = detectTenseUsage(text, 'fut');
    const secondResult = detectTenseUsage(text, 'fut');

    expect(firstResult.hasExpectedTense).toBe(false);
    expect(firstResult.wrongTenseUsed).toBe(true);
    expect(firstResult.wrongTenses).toContain('pretIndef');
    expect(secondResult).toEqual(firstResult);
  });
});

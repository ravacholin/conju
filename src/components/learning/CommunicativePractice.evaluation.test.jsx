import { describe, it, expect } from 'vitest';
import { evaluateCommunicativeTurn, detectTenseUsage } from './CommunicativePractice.jsx';
import { ERROR_TAGS } from '../../lib/progress/dataModels.js';

describe('evaluateCommunicativeTurn', () => {
  it('returns full matches for multiple eligible forms', () => {
    const step = {
      resolvedTargetForms: [
        {
          resolvedValue: 'trabajo',
          form: { lemma: 'trabajar', value: 'trabajo', mood: 'indicativo', tense: 'pres', person: '1s' },
          optional: false,
          acceptedPhrases: [],
          synonyms: [],
        },
        {
          resolvedValue: 'como',
          form: { lemma: 'comer', value: 'como', mood: 'indicativo', tense: 'pres', person: '1s' },
          optional: false,
          acceptedPhrases: [],
          synonyms: [],
        },
      ],
    };

    const evaluation = evaluateCommunicativeTurn({
      userText: 'Trabajo y como en casa cada día.',
      step,
      eligibleForms: step.resolvedTargetForms.map(target => target.form),
    });

    expect(evaluation.fullMatches).toHaveLength(2);
    expect(evaluation.partialMatches).toHaveLength(0);
    expect(evaluation.missingTargets).toHaveLength(0);
    expect(evaluation.score).toBe(1);
  });

  it('detects partial matches when the learner switches tense', () => {
    const form = { lemma: 'trabajar', value: 'trabajo', mood: 'indicativo', tense: 'pres', person: '1s' };
    const step = {
      resolvedTargetForms: [
        {
          resolvedValue: 'trabajo',
          form,
          optional: false,
          acceptedPhrases: [],
          synonyms: [],
        },
      ],
    };

    const evaluation = evaluateCommunicativeTurn({
      userText: 'Cuando era joven trabajaba mucho.',
      step,
      eligibleForms: [form],
    });

    expect(evaluation.fullMatches).toHaveLength(0);
    expect(evaluation.partialMatches.length).toBeGreaterThan(0);
    expect(evaluation.aggregateErrorTags).toEqual(
      expect.arrayContaining([ERROR_TAGS.WRONG_PERSON])
    );
    expect(evaluation.score).toBeLessThan(1);
  });

  it('flags accent differences as partial matches', () => {
    const form = { lemma: 'estar', value: 'está', mood: 'indicativo', tense: 'pres', person: '3s' };
    const step = {
      resolvedTargetForms: [
        {
          resolvedValue: 'está',
          form,
          optional: false,
          acceptedPhrases: [],
          synonyms: [],
        },
      ],
    };

    const evaluation = evaluateCommunicativeTurn({
      userText: 'Mi amigo esta contento.',
      step,
      eligibleForms: [form],
    });

    expect(evaluation.fullMatches).toHaveLength(1);
    expect(evaluation.score).toBe(1);
  });
});

describe('detectTenseUsage', () => {
  it('recognises future perfect constructions', () => {
    const analysis = detectTenseUsage('Para entonces habré terminado el proyecto.', 'futPerf');
    expect(analysis.hasExpectedTense).toBe(true);
  });

  it('identifies subjunctive pluscuamperfecto forms', () => {
    const analysis = detectTenseUsage('Ojalá que hubieran llegado a tiempo.', 'subjPlusc');
    expect(analysis.hasExpectedTense).toBe(true);
  });

  it('reports wrong tense usage when user switches tense', () => {
    const analysis = detectTenseUsage('Ayer trabajé demasiado.', 'pres');
    expect(analysis.wrongTenses.length).toBeGreaterThan(0);
  });
});

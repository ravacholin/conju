
import { QUESTION_POOL } from '../src/lib/levels/levelAssessment.js';

describe('Placement Test Question Pool Integrity', () => {
  Object.entries(QUESTION_POOL).forEach(([level, questions]) => {
    describe(`Level ${level}`, () => {
      questions.forEach((q) => {
        test(`Question ${q.id} should have valid structure`, () => {
          expect(q).toHaveProperty('id');
          expect(q).toHaveProperty('prompt');
          expect(q).toHaveProperty('options');
          expect(q).toHaveProperty('correct');
          expect(Array.isArray(q.options)).toBe(true);
          expect(q.options.length).toBe(4);
          expect(q.options).toContain(q.correct);
          
          // Check for duplicates in options
          const uniqueOptions = new Set(q.options);
          expect(uniqueOptions.size).toBe(4);
        });
      });
    });
  });
});


import { describe, it, expect, vi, beforeEach } from 'vitest';
import SimpleLevelTest from './levelAssessment.js';

// Mock dependencies
vi.mock('./userLevelProfile.js', () => ({
    getCurrentUserProfile: vi.fn(),
    setGlobalPlacementTestBaseline: vi.fn()
}));

vi.mock('../progress/tracking.js', () => ({
    trackAttemptStarted: vi.fn(() => 'mock-attempt-id'),
    trackAttemptSubmitted: vi.fn()
}));

describe('SimpleLevelTest', () => {
    let test;

    beforeEach(() => {
        test = new SimpleLevelTest();
        test.trackingEnabled = false; // Disable tracking for unit tests unless specifically testing it
    });

    it('should initialize correctly', () => {
        const result = test.startTest();
        expect(result.active).toBe(true);
        expect(result.currentQuestion).toBeDefined();
        expect(result.currentQuestion.targetLevel).toBe('A1');
        expect(test.currentLevel).toBe('A1');
    });

    it('should progress to next question on correct answer', () => {
        const startResult = test.startTest();
        const q1 = startResult.currentQuestion;

        const result = test.submitAnswer(q1.id, q1.expectedAnswer);

        expect(result.completed).toBe(false);
        expect(result.nextQuestion).toBeDefined();
        // expect(result.isCorrect).toBe(true); // Removed incorrect assertion
        // Looking at code: returns { completed: false, nextQuestion, ... } or { completed: true, ... }
        // But it doesn't return isCorrect in the main object, it returns feedback object inside?
        // Actually submitAnswer returns:
        // { completed: false, nextQuestion, ..., feedback: { isCorrect, ... } }

        expect(result.feedback.isCorrect).toBe(true);
    });

    it('should fast-track to next level after 3 consecutive correct answers', () => {
        test.startTest();
        let currentQ = test.startTest().currentQuestion;

        // Answer 3 questions correctly
        for (let i = 0; i < 3; i++) {
            const result = test.submitAnswer(currentQ.id, currentQ.expectedAnswer);
            if (result.completed) break;
            currentQ = result.nextQuestion;
        }

        // Should be in A2 now
        expect(test.currentLevel).toBe('A2');
    });

    it('should end test after consecutive failures', () => {
        test.startTest();
        let currentQ = test.startTest().currentQuestion;
        let finalResult;

        // Fail 3 times
        for (let i = 0; i < 3; i++) {
            const result = test.submitAnswer(currentQ.id, 'WRONG_ANSWER');
            if (result.completed) {
                finalResult = result;
                break;
            }
            currentQ = result.nextQuestion;
        }

        expect(finalResult).toBeDefined();
        expect(finalResult.completed).toBe(true);
        expect(finalResult.determinedLevel).toBe('A1'); // Failed A1, so stays A1
    });

    it('should provide competency info in questions', () => {
        const result = test.startTest();
        const q = result.currentQuestion;

        expect(q.competencyInfo).toBeDefined();
        expect(q.competencyInfo.mood).toBeDefined();
        expect(q.competencyInfo.tense).toBeDefined();
    });

    it('should calculate final level correctly', () => {
        // Manually inject results to test calculation logic
        test.results = [
            { level: 'A1', isCorrect: true },
            { level: 'A1', isCorrect: true },
            { level: 'A1', isCorrect: true }, // Fast tracked A1
            { level: 'A2', isCorrect: true },
            { level: 'A2', isCorrect: true },
            { level: 'A2', isCorrect: true }, // Fast tracked A2
            { level: 'B1', isCorrect: false },
            { level: 'B1', isCorrect: false },
            { level: 'B1', isCorrect: false } // Failed B1
        ];

        const level = test.calculateFinalLevel();
        expect(level).toBe('A2');
    });
});

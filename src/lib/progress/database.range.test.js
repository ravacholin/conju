import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getByIndexRange, getAttemptsByUser, saveAttempt } from './database.js';

// Mock dependencies
const mockOpenDB = vi.fn();
vi.mock('idb', () => ({
    openDB: (...args) => mockOpenDB(...args)
}));

vi.mock('./runtimeValidation.js', () => ({
    validateAttempt: vi.fn((attempt) => {
        if (!attempt.userId) throw new Error('Invalid attempt');
        return true;
    })
}));

// Mock global IDBKeyRange
global.IDBKeyRange = {
    bound: vi.fn((lower, upper) => ({ lower, upper }))
};

describe('Database Improvements', () => {
    let mockStore;
    let mockTx;
    let mockDb;

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.resetModules(); // Reset modules to clear dbInstance in database.js

        mockStore = {
            indexNames: {
                contains: vi.fn()
            },
            index: vi.fn(() => ({
                getAll: vi.fn().mockResolvedValue([])
            })),
            getAll: vi.fn().mockResolvedValue([]),
            put: vi.fn().mockResolvedValue('id')
        };

        mockTx = {
            objectStore: vi.fn(() => mockStore),
            done: Promise.resolve()
        };

        mockDb = {
            transaction: vi.fn(() => mockTx),
            objectStoreNames: {
                contains: vi.fn().mockReturnValue(true)
            },
            createObjectStore: vi.fn()
        };

        mockOpenDB.mockResolvedValue(mockDb);
    });

    describe('getByIndexRange', () => {
        it('should use IDBKeyRange when index exists', async () => {
            mockStore.indexNames.contains.mockReturnValue(true);
            const mockIndex = { getAll: vi.fn().mockResolvedValue([]) };
            mockStore.index.mockReturnValue(mockIndex);

            const start = new Date('2023-01-01');
            const end = new Date('2023-01-31');

            await getByIndexRange('attempts', 'userId-createdAt', 'user1', start, end);

            expect(mockStore.index).toHaveBeenCalledWith('userId-createdAt');
            expect(global.IDBKeyRange.bound).toHaveBeenCalled();
            expect(mockIndex.getAll).toHaveBeenCalled();
        });

        it('should fallback to memory filtering when index missing', async () => {
            mockStore.indexNames.contains.mockReturnValue(false);

            // Mock getByIndex behavior (which calls index.getAll)
            const mockIndex = {
                getAll: vi.fn().mockResolvedValue([
                    { createdAt: '2023-01-15T10:00:00Z', userId: 'user1' }, // Inside
                    { createdAt: '2023-02-01T10:00:00Z', userId: 'user1' }  // Outside
                ])
            };
            mockStore.index.mockReturnValue(mockIndex);

            const start = new Date('2023-01-01');
            const end = new Date('2023-01-31');

            const result = await getByIndexRange('attempts', 'userId-createdAt', 'user1', start, end);

            expect(mockStore.indexNames.contains).toHaveBeenCalledWith('userId-createdAt');
            // Should filter results
            expect(result).toHaveLength(1);
            expect(result[0].createdAt).toBe('2023-01-15T10:00:00Z');
        });
    });

    describe('saveAttempt Validation', () => {
        it('should throw error for invalid attempt', async () => {
            const invalidAttempt = { itemId: 'item1' }; // Missing userId

            await expect(saveAttempt(invalidAttempt)).rejects.toThrow();
            expect(mockStore.put).not.toHaveBeenCalled();
        });

        it('should save valid attempt', async () => {
            const validAttempt = { userId: 'user1', itemId: 'item1', correct: true };

            await saveAttempt(validAttempt);
            expect(mockStore.put).toHaveBeenCalledWith(validAttempt);
        });
    });
});

// Test de integración para verificar que el generador funciona con el sistema de progreso
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { chooseNext } from './generator.js'

// Mock forms for testing
const mockForms = [
  { lemma: 'hablar', mood: 'indicative', tense: 'pres', person: '1s', value: 'hablo' },
  { lemma: 'comer', mood: 'indicative', tense: 'pres', person: '1s', value: 'como' },
  { lemma: 'vivir', mood: 'indicative', tense: 'pres', person: '1s', value: 'vivo' }
]

describe('Generator Progress Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should work without progress system (degraded mode)', async () => {
    // Mock que el progreso falle
    vi.doMock('../../lib/progress/all.js', async () => {
      throw new Error('Progress system not available')
    })

    const result = await chooseNext({
      forms: mockForms,
      history: {},
      currentItem: null,
      sessionSettings: { level: 'A1', enableProgressIntegration: true }
    })

    expect(result).toBeDefined()
    expect(mockForms).toContainEqual(expect.objectContaining({
      lemma: result.lemma,
      mood: result.mood,
      tense: result.tense,
      person: result.person,
      value: result.value
    }))
  })

  it('should work with progress integration disabled', async () => {
    const result = await chooseNext({
      forms: mockForms,
      history: {},
      currentItem: null,
      sessionSettings: { level: 'A1', enableProgressIntegration: false }
    })

    expect(result).toBeDefined()
    expect(mockForms).toContainEqual(expect.objectContaining({
      lemma: result.lemma,
      mood: result.mood,
      tense: result.tense,
      person: result.person,
      value: result.value
    }))
  })

  it('should work with mock progress data', async () => {
    // Mock progress system con datos simulados
    vi.doMock('../../lib/progress/all.js', async () => ({
      getCurrentUserId: () => 'test-user-123',
      getMasteryByUser: async (_userId) => [
        { mood: 'indicative', tense: 'pres', score: 85 },
        { mood: 'indicative', tense: 'pretIndef', score: 60 }
      ]
    }))

    const result = await chooseNext({
      forms: mockForms,
      history: {},
      currentItem: null,
      sessionSettings: { level: 'B1', enableProgressIntegration: true }
    })

    expect(result).toBeDefined()
    expect(mockForms).toContainEqual(expect.objectContaining({
      lemma: result.lemma,
      mood: result.mood,
      tense: result.tense,
      person: result.person,
      value: result.value
    }))
  })

  it('should handle no current user gracefully', async () => {
    // Mock con usuario null
    vi.doMock('../../lib/progress/all.js', async () => ({
      getCurrentUserId: () => null,
      getMasteryByUser: async () => []
    }))

    const result = await chooseNext({
      forms: mockForms,
      history: {},
      currentItem: null,
      sessionSettings: { level: 'A1', enableProgressIntegration: true }
    })

    expect(result).toBeDefined()
    expect(mockForms).toContainEqual(expect.objectContaining({
      lemma: result.lemma,
      mood: result.mood,
      tense: result.tense,
      person: result.person,
      value: result.value
    }))
  })
})

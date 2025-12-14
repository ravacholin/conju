import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { AdaptivePracticeEngine, getNextRecommendedItem } from './AdaptivePracticeEngine.js'
import { useSettings } from '../../state/settings.js'
import { levelPrioritizer } from '../core/prioritizer/index.js'

const engine = new AdaptivePracticeEngine('test-user')
const originalSettings = useSettings.getState()

// Mock del levelPrioritizer para testing
vi.mock('../core/prioritizer/index.js', () => ({
  levelPrioritizer: {
    getPrioritizedTenses: vi.fn()
  }
}))

afterAll(() => {
  useSettings.setState(originalSettings)
  vi.restoreAllMocks()
})

beforeEach(() => {
  useSettings.setState({
    level: 'A1',
    region: null,
    useVoseo: false,
    useTuteo: false,
    useVosotros: false
  })

  // Reset mock antes de cada test
  vi.clearAllMocks()
})

describe('AdaptivePracticeEngine.validateRecommendations', () => {
  it('returns valid recommendations when no region is selected', async () => {
    const recommendations = [
      {
        type: 'test',
        priority: 100,
        title: 'Indicative Present Practice',
        description: 'Ensures default region forms are used',
        targetCombination: { mood: 'indicative', tense: 'pres' },
        estimatedDuration: '5-10 min',
        reason: 'test_case'
      }
    ]

    const result = await engine.validateRecommendations(recommendations)

    expect(result.length).toBeGreaterThan(0)
    expect(result[0].targetCombination).toEqual(recommendations[0].targetCombination)
  })
})

describe('AdaptivePracticeEngine.getPracticeRecommendations - Level-specific balanced mode', () => {
  beforeEach(() => {
    // Mock database functions to return empty data for isolated testing
    vi.doMock('./database.js', () => ({
      getMasteryByUser: vi.fn().mockResolvedValue([]),
      getDueSchedules: vi.fn().mockResolvedValue([])
    }))

    vi.doMock('./realTimeAnalytics.js', () => ({
      getRealUserStats: vi.fn().mockResolvedValue({
        accuracy: 75,
        averageTime: 8000
      })
    }))
  })

  it('calls levelPrioritizer.getPrioritizedTenses with correct A1 level in balanced mode', async () => {
    // Configurar mock para nivel A1
    levelPrioritizer.getPrioritizedTenses.mockReturnValue({
      core: [
        { mood: 'indicative', tense: 'pres', priority: 90, category: 'core' }
      ],
      review: [],
      exploration: [],
      weights: { core: 0.8, review: 0.1, exploration: 0.1 }
    })

    await engine.getPracticeRecommendations({
      focusMode: 'balanced',
      userLevel: 'A1',
      maxRecommendations: 3
    })

    // Verificar que levelPrioritizer fue llamado con el nivel correcto
    expect(levelPrioritizer.getPrioritizedTenses).toHaveBeenCalledWith('A1', [])
  })

  it('calls levelPrioritizer.getPrioritizedTenses with correct C1 level in balanced mode', async () => {
    // Configurar mock para nivel C1 (más enfocado en review)
    levelPrioritizer.getPrioritizedTenses.mockReturnValue({
      core: [],
      review: [
        { mood: 'subjunctive', tense: 'subjImpf', priority: 85, category: 'review' }
      ],
      exploration: [
        { mood: 'subjunctive', tense: 'subjPlusc', priority: 70, category: 'exploration' }
      ],
      weights: { core: 0.2, review: 0.5, exploration: 0.3 }
    })

    await engine.getPracticeRecommendations({
      focusMode: 'balanced',
      userLevel: 'C1',
      maxRecommendations: 3
    })

    // Verificar que levelPrioritizer fue llamado con el nivel correcto
    expect(levelPrioritizer.getPrioritizedTenses).toHaveBeenCalledWith('C1', [])
  })

  it('generates different recommendation distributions for A1 vs C1 levels', async () => {
    // Test para A1: más contenido nuevo y core
    levelPrioritizer.getPrioritizedTenses.mockReturnValueOnce({
      core: [
        { mood: 'indicative', tense: 'pres', priority: 90 }
      ],
      review: [],
      exploration: [],
      weights: { core: 0.8, review: 0.1, exploration: 0.1 }
    })

    const a1Recommendations = await engine.getPracticeRecommendations({
      focusMode: 'balanced',
      userLevel: 'A1',
      maxRecommendations: 5
    })

    // Test para C1: más review y weak areas
    levelPrioritizer.getPrioritizedTenses.mockReturnValueOnce({
      core: [],
      review: [
        { mood: 'subjunctive', tense: 'subjImpf', priority: 85 }
      ],
      exploration: [
        { mood: 'subjunctive', tense: 'subjPlusc', priority: 70 }
      ],
      weights: { core: 0.2, review: 0.5, exploration: 0.3 }
    })

    const c1Recommendations = await engine.getPracticeRecommendations({
      focusMode: 'balanced',
      userLevel: 'C1',
      maxRecommendations: 5
    })

    // Las recomendaciones deben ser diferentes para niveles diferentes
    expect(a1Recommendations).not.toEqual(c1Recommendations)

    // Verificar que ambas llamadas se hicieron con los niveles correctos
    expect(levelPrioritizer.getPrioritizedTenses).toHaveBeenCalledWith('A1', [])
    expect(levelPrioritizer.getPrioritizedTenses).toHaveBeenCalledWith('C1', [])
  })

  it('uses B1 fallback when level is not provided in balanced mode', async () => {
    levelPrioritizer.getPrioritizedTenses.mockReturnValue({
      core: [
        { mood: 'subjunctive', tense: 'subjPres', priority: 90 }
      ],
      review: [
        { mood: 'indicative', tense: 'pretPerf', priority: 80 }
      ],
      exploration: [],
      weights: { core: 0.6, review: 0.3, exploration: 0.1 }
    })

    await engine.getPracticeRecommendations({
      focusMode: 'balanced',
      // No userLevel provided - should default to B1
      maxRecommendations: 3
    })

    // Verificar que se usó B1 como fallback
    expect(levelPrioritizer.getPrioritizedTenses).toHaveBeenCalledWith('B1', [])
  })
})

describe('getNextRecommendedItem - Level validation', () => {
  beforeEach(() => {
    // Mock para simular recomendaciones válidas
    vi.spyOn(AdaptivePracticeEngine.prototype, 'getPracticeRecommendations')
      .mockResolvedValue([
        {
          type: 'test_recommendation',
          priority: 80,
          title: 'Test Practice',
          targetCombination: { mood: 'indicative', tense: 'pres' },
          reason: 'test'
        }
      ])
  })

  it('passes correct CEFR level to AdaptivePracticeEngine.getPracticeRecommendations', async () => {
    const result = await getNextRecommendedItem('A1')

    expect(result).toBeDefined()
    expect(AdaptivePracticeEngine.prototype.getPracticeRecommendations)
      .toHaveBeenCalledWith({
        maxRecommendations: 1,
        userLevel: 'A1'
      })
  })

  it('normalizes legacy level names to CEFR format', async () => {
    await getNextRecommendedItem('beginner')

    expect(AdaptivePracticeEngine.prototype.getPracticeRecommendations)
      .toHaveBeenCalledWith({
        maxRecommendations: 1,
        userLevel: 'A2'
      })

    await getNextRecommendedItem('intermediate')

    expect(AdaptivePracticeEngine.prototype.getPracticeRecommendations)
      .toHaveBeenCalledWith({
        maxRecommendations: 1,
        userLevel: 'B1'
      })
  })

  it('falls back to B1 when invalid level is provided', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await getNextRecommendedItem('invalid_level')

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('getNextRecommendedItem: No se proporcionó un nivel válido, usando B1 como fallback')
    )

    expect(AdaptivePracticeEngine.prototype.getPracticeRecommendations)
      .toHaveBeenCalledWith({
        maxRecommendations: 1,
        userLevel: 'B1'
      })

    consoleSpy.mockRestore()
  })

  it('falls back to B1 when null or undefined level is provided', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await getNextRecommendedItem(null)

    expect(consoleSpy).toHaveBeenCalled()
    expect(AdaptivePracticeEngine.prototype.getPracticeRecommendations)
      .toHaveBeenCalledWith({
        maxRecommendations: 1,
        userLevel: 'B1'
      })

    consoleSpy.mockRestore()
  })
})

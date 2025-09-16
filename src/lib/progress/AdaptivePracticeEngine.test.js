import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { AdaptivePracticeEngine } from './AdaptivePracticeEngine.js'
import { useSettings } from '../../state/settings.js'

const engine = new AdaptivePracticeEngine('test-user')
const originalSettings = useSettings.getState()

afterAll(() => {
  useSettings.setState(originalSettings)
})

beforeEach(() => {
  useSettings.setState({
    level: 'A1',
    region: null,
    useVoseo: false,
    useTuteo: false,
    useVosotros: false
  })
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

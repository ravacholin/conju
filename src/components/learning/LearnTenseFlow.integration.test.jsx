import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import React from 'react'

const buildFormsForRegion = vi.fn()
const getEligibleFormsForSettings = vi.fn()
const useSettingsMock = vi.fn()

vi.mock('./LearnTenseFlow.css', () => ({}))
vi.mock('../../data/curriculum.json', () => ({
  default: [
    { mood: 'indicativo', tense: 'pres' }
  ]
}))
vi.mock('../../data/narrativeStories.js', () => ({
  storyData: {
    pres: {}
  }
}))
vi.mock('../../lib/data/learningIrregularFamilies.js', () => ({
  getLearningFamiliesForTense: vi.fn(() => []),
  LEARNING_IRREGULAR_FAMILIES: {}
}))
vi.mock('../../lib/learning/adaptiveEngine.js', () => ({
  calculateAdaptiveDifficulty: vi.fn(() => ({ level: 'intermediate' })),
  personalizeSessionDuration: vi.fn((_adaptive, duration) => ({ totalDuration: duration })),
  canSkipPhase: vi.fn(() => false)
}))
vi.mock('../../lib/learning/learningConfig.js', () => ({
  getSessionDurationOptions: vi.fn(() => [5, 10]),
  getNextFlowStep: vi.fn(step => step),
  AB_TESTING_CONFIG: {
    LEARNING_FLOW_V1: {
      testId: 'learning-flow-test',
      name: 'Learning Flow Test',
      description: 'Test config',
      variants: ['control'],
      trafficSplit: [1],
      duration: 7,
      metrics: []
    }
  }
}))
vi.mock('../../lib/learning/analytics.js', () => ({
  abTesting: {
    createTest: vi.fn(),
    assignUserToVariant: vi.fn(() => 'control'),
    recordTestMetrics: vi.fn()
  }
}))
vi.mock('../../state/settings.js', () => ({
  useSettings: () => useSettingsMock()
}))
vi.mock('../../lib/progress/userManager/index.js', () => ({
  getCurrentUserId: vi.fn(() => 'test-user')
}))
vi.mock('../../lib/core/eligibility.js', () => ({
  buildFormsForRegion: (...args) => buildFormsForRegion(...args),
  getEligibleFormsForSettings: (...args) => getEligibleFormsForSettings(...args)
}))
vi.mock('../../lib/core/verbDataService.js', () => ({
  getExampleVerbs: vi.fn(() => []),
  getVerbByLemma: vi.fn(() => Promise.resolve(null))
}))
vi.mock('./NarrativeIntroduction.jsx', () => ({
  default: () => <div>Narrative Introduction</div>
}))
vi.mock('./LearningDrill.jsx', () => ({
  default: () => <div>Learning Drill</div>
}))
vi.mock('./MeaningfulPractice.jsx', () => ({
  default: () => <div>Meaningful Practice</div>
}))
vi.mock('./CommunicativePractice.jsx', () => ({
  default: () => <div>Communicative Practice</div>
}))
vi.mock('./PronunciationPractice.jsx', () => ({
  default: () => <div>Pronunciation Practice</div>
}))
vi.mock('./IrregularRootDrill.jsx', () => ({
  default: () => <div>Irregular Root Drill</div>
}))
vi.mock('./EndingsDrill.jsx', () => ({
  default: () => <div>Endings Drill</div>
}))
vi.mock('./NonfiniteGuidedDrill.jsx', () => ({
  default: () => <div>Nonfinite Guided Drill</div>
}))
vi.mock('../ErrorBoundary.jsx', () => ({
  default: ({ children }) => <>{children}</>
}))
vi.mock('./TenseSelectionStep.jsx', () => ({
  default: ({ onSelect }) => (
    <button onClick={() => onSelect('indicativo', 'pres')}>
      Seleccionar Presente
    </button>
  )
}))
vi.mock('./TypeSelectionStep.jsx', () => ({
  default: () => <div>Type Selection</div>
}))
vi.mock('./DurationSelectionStep.jsx', () => ({
  default: () => <div>Duration Selection</div>
}))

import LearnTenseFlowContainer from './LearnTenseFlow.jsx'

function createDeferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('LearnTenseFlow eligible forms loading states', () => {
  let deferred

  beforeEach(() => {
    buildFormsForRegion.mockReset()
    getEligibleFormsForSettings.mockReset()
    useSettingsMock.mockReset()
    useSettingsMock.mockReturnValue({ region: 'la_general' })

    deferred = createDeferred()
    buildFormsForRegion.mockReturnValue(deferred.promise)
    getEligibleFormsForSettings.mockReturnValue([
      { lemma: 'hablar', value: 'hablo', mood: 'indicativo', tense: 'pres' }
    ])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows a loading indicator while eligible forms are loading and hides it after resolution', async () => {
    render(<LearnTenseFlowContainer onHome={vi.fn()} onGoToProgress={vi.fn()} />)

    fireEvent.click(screen.getByText('Seleccionar Presente'))

    await waitFor(() => {
      expect(screen.getByText('Cargando actividades de práctica…')).toBeInTheDocument()
    })

    expect(getEligibleFormsForSettings).not.toHaveBeenCalled()

    await act(async () => {
      deferred.resolve([
        { lemma: 'hablar', value: 'hablo', mood: 'indicativo', tense: 'pres' }
      ])
      await deferred.promise
    })

    await waitFor(() => {
      expect(getEligibleFormsForSettings).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ specificTense: 'pres' })
      )
      expect(screen.queryByText('Cargando actividades de práctica…')).not.toBeInTheDocument()
    })
  })
})

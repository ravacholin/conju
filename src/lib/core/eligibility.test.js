import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

describe('eligibility error recovery', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('falls back gracefully when recovery module is not ready during gating failure', async () => {
    const warnSpy = vi.fn()

    vi.doMock('../utils/logger.js', () => ({
      createLogger: () => ({
        warn: warnSpy,
        error: vi.fn(),
        debug: vi.fn()
      })
    }))

    vi.doMock('./curriculumGate.js', () => ({
      gateFormsByCurriculumAndDialect: () => {
        throw new Error('curriculum gating failed')
      },
      getAllowedCombosForLevel: vi.fn()
    }))

    vi.doMock('./verbDataService.js', () => ({
      getFormsForRegion: vi.fn()
    }))

    vi.doMock('./AutoRecoverySystem.js', () => {
      throw new Error('module not ready')
    })

    const { getEligibleFormsForSettings } = await import('./eligibility.js')

    const forms = [{ id: 1 }]
    const result = getEligibleFormsForSettings(forms, { level: 'C2' })

    expect(result).toEqual(forms)
    expect(warnSpy).toHaveBeenCalledWith(
      'handleErrorWithRecovery',
      'AutoRecovery not available, using fallback',
      expect.objectContaining({ error: 'curriculum gating failed' })
    )
  })
})

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'

const getVerbsMock = vi.fn()
const getVerbsSyncMock = vi.fn()
const areVerbsLoadedMock = vi.fn()

vi.mock('../../data/verbsLazy.js', () => ({
  getVerbs: getVerbsMock,
  getVerbsSync: getVerbsSyncMock,
  areVerbsLoaded: areVerbsLoadedMock
}))

const getAllVerbsWithRedundancyMock = vi.fn()
const getRedundancyManagerMock = vi.fn()

vi.mock('./VerbDataRedundancyManager.js', () => ({
  getAllVerbsWithRedundancy: getAllVerbsWithRedundancyMock,
  getRedundancyManager: getRedundancyManagerMock
}))

const validateAndHealVerbsMock = vi.fn()
const getIntegrityGuardMock = vi.fn()

vi.mock('./DataIntegrityGuard.js', () => ({
  validateAndHealVerbs: validateAndHealVerbsMock,
  getIntegrityGuard: getIntegrityGuardMock
}))

const handleErrorWithRecoveryMock = vi.fn()

vi.mock('./AutoRecoverySystem.js', () => ({
  handleErrorWithRecovery: handleErrorWithRecoveryMock
}))

vi.mock('../utils/logger.js', async () => {
  const actual = await vi.importActual('../utils/logger.js')
  return {
    ...actual,
    createLogger: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }),
    registerDebugTool: vi.fn()
  }
})

let verbDataService

describe('verbDataService getVerbByLemma fallback', () => {
  beforeAll(async () => {
    verbDataService = await import('./verbDataService.js')
  })

  beforeEach(() => {
    getVerbsMock.mockReset()
    getVerbsSyncMock.mockReset()
    areVerbsLoadedMock.mockReset()
    getAllVerbsWithRedundancyMock.mockReset()
    getRedundancyManagerMock.mockReset()
    validateAndHealVerbsMock.mockReset()
    getIntegrityGuardMock.mockReset()
    handleErrorWithRecoveryMock.mockReset()

    getVerbsMock.mockResolvedValue([])
    getVerbsSyncMock.mockReturnValue([])
    areVerbsLoadedMock.mockReturnValue(false)
    getAllVerbsWithRedundancyMock.mockReturnValue([])
    getRedundancyManagerMock.mockReturnValue({
      getAllVerbs: () => []
    })
    getIntegrityGuardMock.mockReturnValue({
      validateVerb: () => ({ valid: true }),
      healVerb: () => ({ healed: true })
    })
  })

  it('falls back to the minimal emergency verb set when lazy loading returns nothing', async () => {
    const lemma = 'ser'

    const verb = await verbDataService.getVerbByLemma(lemma)

    expect(getVerbsMock).toHaveBeenCalled()
    expect(handleErrorWithRecoveryMock).toHaveBeenCalled()
    expect(verb).toBeTruthy()
    expect(verb?.lemma).toBe(lemma)
    expect(verb?.type).toBe('irregular')
  })

  it('returns null for a non-critical lemma missing from every data source', async () => {
    const lemma = 'hablar'

    const verb = await verbDataService.getVerbByLemma(lemma)

    expect(verb).toBeNull()
  })
})

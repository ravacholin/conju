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

vi.mock('../utils/logger.js', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  })
}))

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

  it('returns a verb from the direct dataset when the primary path misses the lemma', async () => {
    const lemma = 'hablar'

    const verb = await verbDataService.getVerbByLemma(lemma)

    expect(getAllVerbsWithRedundancyMock).toHaveBeenCalled()
    expect(verb).toBeTruthy()
    expect(verb?.lemma).toBe(lemma)
    expect(verb?.type).toBe('regular')
  })
})

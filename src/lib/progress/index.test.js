import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./tracking.js', () => ({
  initTracking: vi.fn(() => Promise.resolve())
}))

vi.mock('./itemManagement.js', () => ({
  initializeItemsBatched: vi.fn(() => Promise.resolve())
}))

vi.mock('./ProgressSystemEvents.js', () => ({
  markProgressSystemReady: vi.fn()
}))

vi.mock('./verbMetadataProvider.js', () => ({
  injectVerbsIntoProvider: vi.fn()
}))

vi.mock('../core/verbDataService.js', () => ({
  getAllVerbs: vi.fn()
}))

vi.mock('./incrementalMastery.js', () => ({
  cleanupMasteryCache: vi.fn(() => ({ cleanedItems: 0, cleanedCells: 0 }))
}))

vi.mock('./database.js', () => ({
  initDB: vi.fn(() => Promise.resolve())
}))

describe('progress/index verb injection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inyecta los verbos del servicio cuando están disponibles', async () => {
    const mockVerbs = [{ lemma: 'probar', paradigms: [] }]
    const { getAllVerbs } = await import('../core/verbDataService.js')
    getAllVerbs.mockResolvedValue(mockVerbs)

    const { injectVerbsIntoProvider } = await import('./verbMetadataProvider.js')
    const { initProgressSystem } = await import('./index.js')

    await initProgressSystem('test-user-service-verbs')

    expect(injectVerbsIntoProvider).toHaveBeenCalledWith(mockVerbs)
  })
})

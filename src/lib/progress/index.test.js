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
  beforeEach(async () => {
    vi.clearAllMocks()
    const { resetProgressSystem } = await import('./index.js')
    await resetProgressSystem()
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

  it('deduplica el scheduler de limpieza de mastery y lo limpia en reset', async () => {
    const mockVerbs = [{ lemma: 'probar', paradigms: [] }]
    const { getAllVerbs } = await import('../core/verbDataService.js')
    getAllVerbs.mockResolvedValue(mockVerbs)

    const setIntervalSpy = vi.spyOn(window, 'setInterval')
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval')

    const { initProgressSystem, resetProgressSystem } = await import('./index.js')

    await initProgressSystem('test-user-cleanup-1')
    await resetProgressSystem()
    await initProgressSystem('test-user-cleanup-2')

    expect(setIntervalSpy).toHaveBeenCalledTimes(2)
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1)

    await resetProgressSystem()
    expect(clearIntervalSpy).toHaveBeenCalledTimes(2)

    setIntervalSpy.mockRestore()
    clearIntervalSpy.mockRestore()
  })
})

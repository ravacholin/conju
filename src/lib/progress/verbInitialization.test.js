import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { saveVerbMock, getAllVerbsMock } = vi.hoisted(() => ({
  saveVerbMock: vi.fn(),
  getAllVerbsMock: vi.fn()
}))

vi.mock('./database.js', () => ({
  saveVerb: saveVerbMock
}))

vi.mock('../core/verbDataService.js', () => ({
  getAllVerbs: getAllVerbsMock
}))

import { initializeVerbs } from './verbInitialization.js'

describe('initializeVerbs', () => {
  beforeEach(() => {
    getAllVerbsMock.mockReset()
    saveVerbMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('procesa y guarda cada verbo cuando hay verbos disponibles', async () => {
    getAllVerbsMock.mockResolvedValue([
      { lemma: 'hablar', type: 'regular' },
      { lemma: 'ser', type: 'irregular' }
    ])

    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await initializeVerbs()

    expect(getAllVerbsMock).toHaveBeenCalled()
    expect(saveVerbMock).toHaveBeenCalledTimes(2)
    expect(saveVerbMock).toHaveBeenCalledWith(
      expect.objectContaining({ lemma: 'hablar', type: 'regular' })
    )
    expect(saveVerbMock).toHaveBeenCalledWith(
      expect.objectContaining({ lemma: 'ser', type: 'irregular' })
    )

    consoleLogSpy.mockRestore()
  })

  it('advierte y abandona cuando no se encuentran verbos', async () => {
    getAllVerbsMock.mockResolvedValue([])

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await initializeVerbs()

    expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ No se encontraron verbos para inicializar.')
    expect(saveVerbMock).not.toHaveBeenCalled()

    consoleWarnSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })
})

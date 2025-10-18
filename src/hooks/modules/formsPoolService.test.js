import { describe, it, expect, vi } from 'vitest'
import { resolveFormsPool } from './formsPoolService.js'

describe('formsPoolService', () => {
  it('builds a new pool when cache is empty', async () => {
    const settings = { level: 'A1' }
    const generateAllFormsForRegion = vi.fn().mockResolvedValue(['form-a'])
    const getFormsCacheKey = vi.fn().mockReturnValue('sig')
    const now = vi.fn()
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(160)

    const result = await resolveFormsPool({
      settings,
      region: 'la_prueba',
      cache: {},
      generateAllFormsForRegion,
      getFormsCacheKey,
      now
    })

    expect(generateAllFormsForRegion).toHaveBeenCalledWith('la_prueba', settings)
    expect(getFormsCacheKey).toHaveBeenCalledWith('la_prueba', settings)
    expect(result.forms).toEqual(['form-a'])
    expect(result.reused).toBe(false)
    expect(result.signature).toBe('sig')
    expect(result.durationMs).toBe(60)
    expect(result.cache).toEqual({ signature: 'sig', forms: ['form-a'] })
  })

  it('reuses the cached pool when signature matches', async () => {
    const settings = { level: 'A2' }
    const cache = { signature: 'sig', forms: ['cached'] }
    const generateAllFormsForRegion = vi.fn()
    const getFormsCacheKey = vi.fn().mockReturnValue('sig')

    const result = await resolveFormsPool({
      settings,
      region: 'la_prueba',
      cache,
      generateAllFormsForRegion,
      getFormsCacheKey
    })

    expect(generateAllFormsForRegion).not.toHaveBeenCalled()
    expect(result.reused).toBe(true)
    expect(result.forms).toEqual(['cached'])
    expect(result.cache).toEqual(cache)
  })

  it('rebuilds the pool when signature differs', async () => {
    const settings = { level: 'B1' }
    const cache = { signature: 'old', forms: ['old-form'] }
    const generateAllFormsForRegion = vi.fn().mockResolvedValue(['new-form'])
    const getFormsCacheKey = vi.fn().mockReturnValue('new')
    const now = vi.fn().mockReturnValueOnce(10).mockReturnValueOnce(20)

    const result = await resolveFormsPool({
      settings,
      region: null,
      cache,
      generateAllFormsForRegion,
      getFormsCacheKey,
      now
    })

    expect(generateAllFormsForRegion).toHaveBeenCalledWith('la_general', settings)
    expect(result.reused).toBe(false)
    expect(result.forms).toEqual(['new-form'])
    expect(result.signature).toBe('new')
  })
})


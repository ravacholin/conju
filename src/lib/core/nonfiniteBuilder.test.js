import { describe, it, expect } from 'vitest'
import { buildGerund } from './nonfiniteBuilder.js'

describe('buildGerund', () => {
  // Verbs ending in -uar are -ar verbs and must use '-ando', not '-yendo'.
  // This test confirms they are not caught by vowel-stem rules meant for -er/-ir verbs.
  it('handles -uar verbs with -ando (e.g., averiguar → averiguando)', () => {
    expect(buildGerund('averiguar')).toBe('averiguando')
    expect(buildGerund('actuar')).toBe('actuando')
  })

  // -uir verbs use -yendo
  it('handles -uir verbs with -yendo', () => {
    expect(buildGerund('construir')).toBe('construyendo')
    expect(buildGerund('huir')).toBe('huyendo')
    expect(buildGerund('incluir')).toBe('incluyendo')
  })

  // Hiato cases for vowel + -er/-ir → -yendo
  it('handles vowel + -er/-ir hiatos with -yendo', () => {
    expect(buildGerund('leer')).toBe('leyendo')
    expect(buildGerund('caer')).toBe('cayendo')
    expect(buildGerund('oír')).toBe('oyendo')
  })

  it('handles -üir verbs with -yendo', () => {
    expect(buildGerund('argüir')).toBe('argüyendo')
  })

  // Verbs ending in -guir should not use -yendo
  it('handles -guir verbs correctly', () => {
    expect(buildGerund('distinguir')).toBe('distinguiendo')
    expect(buildGerund('seguir')).toBe('siguiendo') // irregular, handled by map
  })
})


import { describe, it, expect } from 'vitest'
import { buildGerund, buildParticiple } from './nonfiniteBuilder.js'

describe('buildGerund', () => {
  // -uar verbs should NOT use -yendo; ensure no regression from vowel-class change
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
})

describe('buildParticiple', () => {
  it('uses canonical irregular participles for core verbs', () => {
    expect(buildParticiple('hacer')).toBe('hecho')
    expect(buildParticiple('ver')).toBe('visto')
  })

  it('keeps extended fallback participles during migration', () => {
    expect(buildParticiple('desenvolver')).toBe('desenvuelto')
  })
})

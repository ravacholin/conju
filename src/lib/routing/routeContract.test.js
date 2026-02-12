import { describe, expect, it } from 'vitest'
import {
  buildRouteURL,
  normalizeRoute,
  parseRouteFromURL
} from './routeContract.js'

describe('routeContract', () => {
  it('normalizes invalid modes to onboarding', () => {
    const route = normalizeRoute({ mode: 'invalid-mode', step: 3 })
    expect(route.mode).toBe('onboarding')
    expect(route.step).toBeNull()
  })

  it('drops step for non-onboarding routes', () => {
    const route = normalizeRoute({ mode: 'drill', step: 4 })
    expect(route.mode).toBe('drill')
    expect(route.step).toBeNull()
  })

  it('parses onboarding step from pathname', () => {
    const route = parseRouteFromURL({ pathname: '/onboarding/5', search: '' })
    expect(route.mode).toBe('onboarding')
    expect(route.step).toBe(5)
  })

  it('ignores step for non-onboarding pathname', () => {
    const route = parseRouteFromURL({ pathname: '/drill/3', search: '' })
    expect(route.mode).toBe('drill')
    expect(route.step).toBeNull()
  })

  it('builds clean url with step only for onboarding', () => {
    expect(buildRouteURL({ mode: 'onboarding', step: 2 })).toBe('/onboarding/2')
    expect(buildRouteURL({ mode: 'progress', step: 7 })).toBe('/progress')
  })
})

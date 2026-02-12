import { z } from 'zod'

export const ROUTE_MODES = Object.freeze([
  'onboarding',
  'drill',
  'learning',
  'progress',
  'story',
  'timeline'
])

export const ONBOARDING_STEP_MIN = 1
export const ONBOARDING_STEP_MAX = 8
export const DEFAULT_ROUTE = Object.freeze({
  mode: 'onboarding',
  step: null
})

export const ROUTES = Object.freeze({
  onboarding: (step = null) => normalizeRoute({ mode: 'onboarding', step }),
  homeMenu: () => normalizeRoute({ mode: 'onboarding', step: 2 }),
  drill: () => normalizeRoute({ mode: 'drill' }),
  learning: () => normalizeRoute({ mode: 'learning' }),
  progress: () => normalizeRoute({ mode: 'progress' }),
  story: () => normalizeRoute({ mode: 'story' }),
  timeline: () => normalizeRoute({ mode: 'timeline' })
})

const routeSchema = z.object({
  mode: z.enum(ROUTE_MODES),
  step: z.number().int().min(ONBOARDING_STEP_MIN).max(ONBOARDING_STEP_MAX).nullable().optional(),
  timestamp: z.number().optional(),
  appNav: z.boolean().optional()
}).passthrough()

const normalizeStepForMode = (mode, step) => {
  if (mode !== 'onboarding') return null
  if (typeof step !== 'number' || Number.isNaN(step)) return null
  if (step < ONBOARDING_STEP_MIN || step > ONBOARDING_STEP_MAX) return null
  return step
}

export function normalizeRoute(route = {}, { withTimestamp = true } = {}) {
  const candidateMode = typeof route.mode === 'string' ? route.mode : DEFAULT_ROUTE.mode
  const modeIsValid = ROUTE_MODES.includes(candidateMode)
  const mode = modeIsValid ? candidateMode : DEFAULT_ROUTE.mode
  const rawStep = typeof route.step === 'number'
    ? route.step
    : (typeof route.step === 'string' ? parseInt(route.step, 10) : null)
  const step = modeIsValid ? normalizeStepForMode(mode, rawStep) : null

  const base = {
    ...route,
    mode,
    step
  }

  if (withTimestamp) {
    base.timestamp = Number.isFinite(route.timestamp) ? route.timestamp : Date.now()
  }

  return routeSchema.parse(base)
}

export function parseRouteFromURL({ pathname = '/', search = '' } = {}) {
  const pathMatch = String(pathname).match(/^\/(onboarding|drill|learning|progress|story|timeline)(?:\/(\d+))?\/?$/)
  if (pathMatch) {
    const route = normalizeRoute({
      mode: pathMatch[1],
      step: pathMatch[2] ? parseInt(pathMatch[2], 10) : null
    })
    return route
  }

  const params = new URLSearchParams(search || '')
  const mode = params.get('mode') || DEFAULT_ROUTE.mode
  const step = params.get('step')
  return normalizeRoute({
    mode,
    step: step ? parseInt(step, 10) : null
  })
}

export function buildRouteURL(route) {
  const normalized = normalizeRoute(route)
  if (normalized.mode === 'onboarding' && normalized.step) {
    return `/onboarding/${normalized.step}`
  }
  return `/${normalized.mode}`
}

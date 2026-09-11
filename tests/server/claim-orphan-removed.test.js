import { describe, expect, it } from 'vitest'
import { createAuthRoutes } from '../../server/src/auth-routes.js'

/**
 * Regression guard for audit finding C3.
 *
 * The former `POST /claim-orphan-data` endpoint reassigned progress rows to the caller's
 * account based on an arbitrary `orphanUserId` from the request body, guarded only by a lookup
 * in the `users` table. Device-scoped user ids are guessable (timestamp-based), so any
 * authenticated user could claim orphaned pre-account progress that never had a `users` row —
 * a data-theft vector. The endpoint had no client caller: account linking goes through
 * `POST /migrate` (guarded by `account_id IS NULL`), which is enough for `mergeAccountData` to
 * pick up a migrated device's data. The route was removed; this test keeps it removed.
 */

const listRoutePaths = (router) =>
  router.stack
    .map((entry) => entry?.route?.path)
    .filter((path) => typeof path === 'string')

describe('claim-orphan-data endpoint removal (audit C3)', () => {
  it('does not register a /claim-orphan-data route', () => {
    const router = createAuthRoutes()
    expect(listRoutePaths(router)).not.toContain('/claim-orphan-data')
  })

  it('still exposes the legitimate /migrate account-linking route', () => {
    const router = createAuthRoutes()
    expect(listRoutePaths(router)).toContain('/migrate')
  })
})

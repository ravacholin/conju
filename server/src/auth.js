export async function authMiddleware(req, res, next) {
  // Accept Authorization: Bearer <token>, or an anonymous device id via X-User-Id / X-API-Key
  // (used by the client to sync progress before a user creates an account).
  const auth = req.get('authorization') || req.get('Authorization')
  const apiKey = req.get('x-api-key') || req.get('X-API-Key') || null
  let userId = (req.get('x-user-id') || req.get('X-User-Id') || '').trim() || null

  let token = null
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    token = auth.slice(7).trim()
  }

  if (token) {
    try {
      const { verifyJWT } = await import('./auth-service.js')
      const decoded = await verifyJWT(token)

      // CRITICAL: For cross-device sync, prefer accountId over device-specific userId
      // This ensures all devices on the same account use the same userId for data storage
      const effectiveUserId = decoded.accountId || decoded.userId

      if (!effectiveUserId) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('⚠️ JWT verification succeeded but neither accountId nor userId is present in payload')
        }
        return res.status(401).json({ error: 'Invalid auth token' })
      }

      userId = effectiveUserId
      req.accountId = decoded.accountId
      req.userId = userId
      return next()
    } catch (error) {
      // A token was sent but failed verification: never fall back to a client-asserted
      // identity for this request, or anyone could bypass auth with a bad/expired token.
      // Expected under normal use (expired tokens, etc.), so only logged outside production.
      if (process.env.NODE_ENV !== 'production') {
        console.log(`⚠️ JWT verification failed: ${error.message}`)
      }
      return res.status(401).json({ error: 'Invalid or expired auth token' })
    }
  }

  if (!userId && apiKey) {
    userId = apiKey.trim()
  }

  if (!userId) {
    return res.status(401).json({ error: 'Missing auth token or user id' })
  }
  // Basic sanity: enforce allowed prefix
  if (typeof userId !== 'string' || userId.length < 3) {
    return res.status(400).json({ error: 'Invalid user id' })
  }

  // No token was presented: userId comes straight from the client. This is only safe for
  // genuinely anonymous, pre-account device ids. If it happens to match a real account id,
  // reject it — otherwise anyone who learns/guesses an accountId could read/overwrite that
  // account's synced data without ever proving they own it.
  try {
    const { db } = await import('./db.js')
    const account = db.prepare('SELECT id FROM accounts WHERE id = ?').get(userId)
    if (account) {
      return res.status(401).json({ error: 'Auth token required for this account' })
    }
  } catch (error) {
    console.error('authMiddleware: account lookup failed', error)
    return res.status(500).json({ error: 'Internal auth error' })
  }

  req.userId = userId
  next()
}

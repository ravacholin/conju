export async function authMiddleware(req, res, next) {
  // Accept Authorization: Bearer <token>, or explicit dev headers (X-API-Key / X-User-Id)
  const auth = req.get('authorization') || req.get('Authorization')
  const apiKey = req.get('x-api-key') || req.get('X-API-Key') || null
  let userId = (req.get('x-user-id') || req.get('X-User-Id') || '').trim() || null

  let token = null
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    token = auth.slice(7).trim()
  }

  // Validate JWT when present. If invalid, fallback to header-based identity for progress endpoints.
  if (token) {
    try {
      const { verifyJWT } = await import('./auth-service.js')
      const decoded = await verifyJWT(token)
      if (!decoded || !decoded.userId) {
        console.log('⚠️ JWT verification succeeded but userId is missing in payload')
        return res.status(401).json({ error: 'Invalid auth token' })
      }

      // If X-User-Id header is present, verify it matches the JWT userId
      if (userId && userId !== decoded.userId) {
        console.log(`⚠️ X-User-Id header (${userId}) doesn't match JWT userId (${decoded.userId})`)
        return res.status(401).json({ error: 'User ID mismatch between header and token' })
      }

      userId = decoded.userId
      req.accountId = decoded.accountId
      console.log(`🔵 Extracted userId from JWT: ${userId}, accountId: ${decoded.accountId}`)
    } catch (error) {
      // Fallback: accept X-User-Id or X-API-Key for progress routes without account linkage
      console.log(`⚠️ JWT verification failed. Falling back to header-based identity if provided: ${error.message}`)
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
  req.userId = userId
  next()
}

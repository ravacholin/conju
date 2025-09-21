export async function authMiddleware(req, res, next) {
  // Accept Authorization: Bearer <token>, or explicit dev headers (X-API-Key / X-User-Id)
  const auth = req.get('authorization') || req.get('Authorization')
  const apiKey = req.get('x-api-key') || req.get('X-API-Key') || null
  let userId = (req.get('x-user-id') || req.get('X-User-Id') || '').trim() || null

  let token = null
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    token = auth.slice(7).trim()
  }

  if (!userId && apiKey) {
    userId = apiKey.trim()
  }

  if (!userId && token) {
    try {
      const { verifyJWT } = await import('./auth-service.js')
      const decoded = await verifyJWT(token)
      if (!decoded || !decoded.userId) {
        console.log('⚠️ JWT verification succeeded but userId is missing in payload')
        return res.status(401).json({ error: 'Invalid auth token' })
      }
      userId = decoded.userId
      req.accountId = decoded.accountId
      console.log(`🔵 Extracted userId from JWT: ${userId}`)
    } catch (error) {
      console.log(`⚠️ JWT verification failed: ${error.message}`)
      return res.status(401).json({ error: 'Invalid auth token' })
    }
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

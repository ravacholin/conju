export async function authMiddleware(req, res, next) {
  // Accept Authorization: Bearer <token>, X-API-Key, or X-User-Id (dev)
  let token = null
  const auth = req.get('authorization') || req.get('Authorization')
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    token = auth.slice(7).trim()
  }
  if (!token) token = req.get('x-api-key') || req.get('X-API-Key') || null
  let userId = req.get('x-user-id') || req.get('X-User-Id') || null

  // If we have a JWT token, try to extract userId from it
  if (!userId && token) {
    try {
      // Import JWT verification from auth service
      const { verifyJWT } = await import('./auth-service.js')
      const decoded = verifyJWT(token)
      if (decoded && decoded.userId) {
        userId = decoded.userId
        console.log(`🔵 Extracted userId from JWT: ${userId}`)
      } else {
        // Fallback: treat token as userId for legacy compatibility
        userId = token
      }
    } catch (error) {
      console.log(`⚠️ JWT verification failed, treating as legacy token: ${error.message}`)
      // Fallback: treat token as userId for legacy compatibility
      userId = token
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


import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { migrate } from './db.js'
import { getDatabase } from './db.js'
import { authMiddleware } from './auth.js'
import { createRoutes } from './routes.js'
import { createAuthRoutes } from './auth-routes.js'

const PORT = process.env.PORT || 8787
const API_PREFIX = process.env.API_PREFIX || '/api'
// Permit all origins by default to avoid CORS issues across environments.
// Set CORS_ORIGIN env var to a comma-separated allowlist in production if needed.
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'

if (CORS_ORIGIN === '*' && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  CORS_ORIGIN is not set — reflecting all origins in production. Set CORS_ORIGIN to an explicit allowlist (see server/.env.example).')
}

migrate()

const app = express()
app.use(helmet())
app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map(s => s.trim()), credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use(morgan('dev'))

// Attach database to app for routes
const db = getDatabase()
app.set('db', db)

app.get('/', (_req, res) => res.json({ ok: true, name: 'progress-sync-server', ts: Date.now() }))

// Mitigate brute-force / credential stuffing against login/register/google endpoints.
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many auth requests, please try again later' }
})

// Auth routes (public)
app.use(`${API_PREFIX}/auth`, authRateLimiter, createAuthRoutes())

// Progress routes (protected by legacy auth for backward compatibility)
app.use(API_PREFIX, authMiddleware, createRoutes())

app.listen(PORT, '0.0.0.0', () => {
  console.log(`☁️  Progress Sync Server listening on http://localhost:${PORT}${API_PREFIX}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔒 CORS Origins: ${CORS_ORIGIN}`)
})

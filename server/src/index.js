import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { migrate } from './db.js'
import { getDatabase } from './db.js'
import { authMiddleware } from './auth.js'
import { createRoutes } from './routes.js'
import { createAuthRoutes } from './auth-routes.js'
import socialRoutes from './social-routes.js'

const PORT = process.env.PORT || 8787
const API_PREFIX = process.env.API_PREFIX || '/api'
// Permit all origins by default to avoid CORS issues across environments.
// Set CORS_ORIGIN env var to a comma-separated allowlist in production if needed.
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'

migrate()

const app = express()
app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map(s => s.trim()), credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use(morgan('dev'))

// Attach database to app for routes
const db = getDatabase()
app.set('db', db)

app.get('/', (_req, res) => res.json({ ok: true, name: 'progress-sync-server', ts: Date.now() }))

// Auth routes (public)
app.use(`${API_PREFIX}/auth`, createAuthRoutes())

// Progress routes (protected by legacy auth for backward compatibility)
app.use(API_PREFIX, authMiddleware, createRoutes())

// Social routes (public for leaderboards, some protected)
app.use(`${API_PREFIX}/social`, socialRoutes)

app.listen(PORT, '0.0.0.0', () => {
  console.log(`☁️  Progress Sync Server listening on http://localhost:${PORT}${API_PREFIX}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔒 CORS Origins: ${CORS_ORIGIN}`)
  console.log(`🎉 Social features enabled: /social/*`)
})

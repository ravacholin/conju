import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { migrate } from './db.js'
import { authMiddleware } from './auth.js'
import { createRoutes } from './routes.js'

const PORT = process.env.PORT || 8787
const API_PREFIX = process.env.API_PREFIX || '/api'

migrate()

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use(morgan('dev'))

app.get('/', (_req, res) => res.json({ ok: true, name: 'progress-sync-server', ts: Date.now() }))
app.use(API_PREFIX, authMiddleware, createRoutes())

app.listen(PORT, () => {
  console.log(`☁️  Progress Sync Server listening on http://localhost:${PORT}${API_PREFIX}`)
})


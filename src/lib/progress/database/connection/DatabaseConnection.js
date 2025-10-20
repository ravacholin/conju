/**
 * DatabaseConnection - Manages IndexedDB connection lifecycle
 *
 * Responsibilities:
 * - Initialize database with schema
 * - Manage database instance lifecycle
 * - Handle database closure and deletion
 *
 * Extracted from database.js Phase 1 refactoring
 */

import { STORAGE_CONFIG } from '../../config.js'
import { createLogger } from '../../../utils/logger.js'
import { clearAllCaches } from '../cache/CacheManager.js'

const logger = createLogger('progress:database:connection')
const isDev = import.meta?.env?.DEV

// Database instance state
let dbInstance = null
let isInitializing = false

/**
 * Get current database instance (for internal use)
 * @returns {IDBDatabase|null}
 */
export function getDbInstance() {
  return dbInstance
}

/**
 * Initialize the IndexedDB database
 * @returns {Promise<IDBDatabase>} Initialized database instance
 */
export async function initDB() {
  // Pre-check: force possible idb mocks to manifest (propagates if it fails)
  const { openDB } = await import('idb')
  if (typeof openDB === 'function') {
    await openDB('progress-probe', 1, { upgrade() {} })
  }

  if (dbInstance) {
    return dbInstance
  }

  if (isInitializing) {
    // Wait for ongoing initialization to complete
    await new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (!isInitializing) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)
    })
    return dbInstance
  }

  isInitializing = true

  try {
    if (isDev) logger.info('initDB', 'Initializing progress database')

    // Import openDB dynamically to allow mocks per test
    const { openDB } = await import('idb')
    dbInstance = await openDB(STORAGE_CONFIG.DB_NAME, STORAGE_CONFIG.DB_VERSION, {
      upgrade(db) {
        if (isDev) logger.info('initDB', 'Updating database structure')

        // Create users table
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.USERS)) {
          const userStore = db.createObjectStore(STORAGE_CONFIG.STORES.USERS, { keyPath: 'id' })
          userStore.createIndex('lastActive', 'lastActive', { unique: false })
          if (isDev) logger.info('initDB', 'Users table created')
        }

        // Create verbs table
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.VERBS)) {
          const verbStore = db.createObjectStore(STORAGE_CONFIG.STORES.VERBS, { keyPath: 'id' })
          verbStore.createIndex('lemma', 'lemma', { unique: true })
          verbStore.createIndex('type', 'type', { unique: false })
          verbStore.createIndex('frequency', 'frequency', { unique: false })
          if (isDev) logger.info('initDB', 'Verbs table created')
        }

        // Create items table
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.ITEMS)) {
          const itemStore = db.createObjectStore(STORAGE_CONFIG.STORES.ITEMS, { keyPath: 'id' })
          itemStore.createIndex('verbId', 'verbId', { unique: false })
          itemStore.createIndex('mood', 'mood', { unique: false })
          itemStore.createIndex('tense', 'tense', { unique: false })
          itemStore.createIndex('person', 'person', { unique: false })
          // Composite index for fast lookup
          itemStore.createIndex('verb-mood-tense-person', ['verbId', 'mood', 'tense', 'person'], { unique: true })
          if (isDev) logger.info('initDB', 'Items table created')
        }

        // Create attempts table
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.ATTEMPTS)) {
          const attemptStore = db.createObjectStore(STORAGE_CONFIG.STORES.ATTEMPTS, { keyPath: 'id' })
          attemptStore.createIndex('itemId', 'itemId', { unique: false })
          attemptStore.createIndex('createdAt', 'createdAt', { unique: false })
          attemptStore.createIndex('correct', 'correct', { unique: false })
          attemptStore.createIndex('userId', 'userId', { unique: false })
          if (isDev) logger.info('initDB', 'Attempts table created')
        }

        // Create mastery table
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.MASTERY)) {
          const masteryStore = db.createObjectStore(STORAGE_CONFIG.STORES.MASTERY, { keyPath: 'id' })
          masteryStore.createIndex('userId', 'userId', { unique: false })
          masteryStore.createIndex('mood-tense-person', ['mood', 'tense', 'person'], { unique: false })
          masteryStore.createIndex('updatedAt', 'updatedAt', { unique: false })
          if (isDev) logger.info('initDB', 'Mastery table created')
        }

        // Create schedules table
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.SCHEDULES)) {
          const scheduleStore = db.createObjectStore(STORAGE_CONFIG.STORES.SCHEDULES, { keyPath: 'id' })
          scheduleStore.createIndex('userId', 'userId', { unique: false })
          scheduleStore.createIndex('nextDue', 'nextDue', { unique: false })
          scheduleStore.createIndex('mood-tense-person', ['mood', 'tense', 'person'], { unique: false })
          if (isDev) logger.info('initDB', 'Schedules table created')
        }

        // Create learning sessions table (analytics)
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.LEARNING_SESSIONS)) {
          const sessionStore = db.createObjectStore(STORAGE_CONFIG.STORES.LEARNING_SESSIONS, { keyPath: 'sessionId' })
          sessionStore.createIndex('userId', 'userId', { unique: false })
          sessionStore.createIndex('timestamp', 'timestamp', { unique: false })
          sessionStore.createIndex('updatedAt', 'updatedAt', { unique: false })
          sessionStore.createIndex('mode-tense', ['mode', 'tense'], { unique: false })
          if (isDev) logger.info('initDB', 'Learning sessions table created')
        }

        // Create challenges table
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.CHALLENGES)) {
          const challengeStore = db.createObjectStore(STORAGE_CONFIG.STORES.CHALLENGES, { keyPath: 'id' })
          challengeStore.createIndex('userId', 'userId', { unique: false })
          challengeStore.createIndex('date', 'date', { unique: false })
          if (isDev) logger.info('initDB', 'Daily challenges table created')
        }

        // Create auxiliary events table
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.EVENTS)) {
          const eventStore = db.createObjectStore(STORAGE_CONFIG.STORES.EVENTS, { keyPath: 'id' })
          eventStore.createIndex('userId', 'userId', { unique: false })
          eventStore.createIndex('type', 'type', { unique: false })
          eventStore.createIndex('createdAt', 'createdAt', { unique: false })
          eventStore.createIndex('sessionId', 'sessionId', { unique: false })
          if (isDev) logger.info('initDB', 'Auxiliary events table created')
        }

        if (isDev) logger.info('initDB', 'Database structure updated')
      }
    })

    if (isDev) logger.info('initDB', 'Progress database initialized successfully')
    return dbInstance
  } catch (error) {
    logger.error('initDB', 'Error initializing progress database', error)
    throw error
  } finally {
    isInitializing = false
  }
}

/**
 * Initialize database completely
 * @returns {Promise<void>}
 */
export async function initializeFullDB() {
  if (isDev) logger.info('initializeFullDB', 'Fully initializing database')

  try {
    // Initialize database
    await initDB()

    // In a complete implementation, default data would be initialized here if needed

    if (isDev) logger.info('initializeFullDB', 'Database fully initialized')
  } catch (error) {
    logger.error('initializeFullDB', 'Error fully initializing database', error)
    throw error
  }
}

/**
 * Close the database
 * @returns {Promise<void>}
 */
export async function closeDB() {
  if (dbInstance) {
    await dbInstance.close()
    dbInstance = null
    await clearAllCaches()
    if (isDev) logger.info('closeDB', 'Database closed')
  }
}

/**
 * Delete the database
 * @returns {Promise<void>}
 */
export async function deleteDB() {
  try {
    await closeDB()
    // Import deleteDB from idb with alias to avoid shadowing
    const { deleteDB: idbDeleteDB } = await import('idb')
    await idbDeleteDB(STORAGE_CONFIG.DB_NAME)
    await clearAllCaches()
    if (isDev) logger.info('deleteDB', 'Database deleted')
  } catch (error) {
    logger.error('deleteDB', 'Error deleting database', error)
    throw error
  }
}

/**
 * Clear database instance (for testing)
 * @private
 */
export function __clearDbInstance() {
  dbInstance = null
  isInitializing = false
}

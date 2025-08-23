// Sistema de base de datos IndexedDB para progreso y analíticas

import { openDB } from 'idb'
import { get, set } from 'idb-keyval'

// Nombre y versión de la base de datos
const DB_NAME = 'SpanishConjugatorProgress'
const DB_VERSION = 1

// Nombre de las tablas
const STORES = {
  USERS: 'users',
  VERBS: 'verbs',
  ITEMS: 'items',
  ATTEMPTS: 'attempts',
  MASTERY: 'mastery',
  SCHEDULES: 'schedules'
}

/**
 * Inicializa la base de datos IndexedDB
 * @returns {Promise<IDBDatabase>} La base de datos inicializada
 */
export async function initDB() {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Crear tabla de usuarios
        if (!db.objectStoreNames.contains(STORES.USERS)) {
          const userStore = db.createObjectStore(STORES.USERS, { keyPath: 'id' })
          userStore.createIndex('lastActive', 'lastActive', { unique: false })
        }

        // Crear tabla de verbos
        if (!db.objectStoreNames.contains(STORES.VERBS)) {
          const verbStore = db.createObjectStore(STORES.VERBS, { keyPath: 'id' })
          verbStore.createIndex('lemma', 'lemma', { unique: true })
          verbStore.createIndex('type', 'type', { unique: false })
          verbStore.createIndex('frequency', 'frequency', { unique: false })
        }

        // Crear tabla de ítems
        if (!db.objectStoreNames.contains(STORES.ITEMS)) {
          const itemStore = db.createObjectStore(STORES.ITEMS, { keyPath: 'id' })
          itemStore.createIndex('verbId', 'verbId', { unique: false })
          itemStore.createIndex('mood', 'mood', { unique: false })
          itemStore.createIndex('tense', 'tense', { unique: false })
          itemStore.createIndex('person', 'person', { unique: false })
          // Índice compuesto para búsqueda rápida
          itemStore.createIndex('verb-mood-tense-person', ['verbId', 'mood', 'tense', 'person'], { unique: true })
        }

        // Crear tabla de intentos
        if (!db.objectStoreNames.contains(STORES.ATTEMPTS)) {
          const attemptStore = db.createObjectStore(STORES.ATTEMPTS, { keyPath: 'id' })
          attemptStore.createIndex('itemId', 'itemId', { unique: false })
          attemptStore.createIndex('createdAt', 'createdAt', { unique: false })
          attemptStore.createIndex('correct', 'correct', { unique: false })
        }

        // Crear tabla de mastery
        if (!db.objectStoreNames.contains(STORES.MASTERY)) {
          const masteryStore = db.createObjectStore(STORES.MASTERY, { keyPath: 'id' })
          masteryStore.createIndex('userId', 'userId', { unique: false })
          masteryStore.createIndex('mood-tense-person', ['mood', 'tense', 'person'], { unique: false })
          masteryStore.createIndex('updatedAt', 'updatedAt', { unique: false })
        }

        // Crear tabla de schedules
        if (!db.objectStoreNames.contains(STORES.SCHEDULES)) {
          const scheduleStore = db.createObjectStore(STORES.SCHEDULES, { keyPath: 'id' })
          scheduleStore.createIndex('userId', 'userId', { unique: false })
          scheduleStore.createIndex('nextDue', 'nextDue', { unique: false })
          scheduleStore.createIndex('mood-tense-person', ['mood', 'tense', 'person'], { unique: false })
        }
      }
    })
    
    console.log('✅ Base de datos de progreso inicializada correctamente')
    return db
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos de progreso:', error)
    throw error
  }
}

/**
 * Guarda un objeto en la base de datos
 * @param {string} storeName - Nombre de la tabla
 * @param {Object} data - Datos a guardar
 * @returns {Promise<void>}
 */
export async function saveToDB(storeName, data) {
  try {
    const db = await initDB()
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    
    // Si no tiene ID, generar uno
    if (!data.id) {
      data.id = `${storeName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    await store.put(data)
    await tx.done
  } catch (error) {
    console.error(`❌ Error al guardar en ${storeName}:`, error)
    throw error
  }
}

/**
 * Obtiene un objeto por ID
 * @param {string} storeName - Nombre de la tabla
 * @param {string} id - ID del objeto
 * @returns {Promise<Object|null>}
 */
export async function getFromDB(storeName, id) {
  try {
    const db = await initDB()
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const result = await store.get(id)
    await tx.done
    return result || null
  } catch (error) {
    console.error(`❌ Error al obtener de ${storeName}:`, error)
    return null
  }
}

/**
 * Obtiene todos los objetos de una tabla
 * @param {string} storeName - Nombre de la tabla
 * @returns {Promise<Object[]>}
 */
export async function getAllFromDB(storeName) {
  try {
    const db = await initDB()
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const result = await store.getAll()
    await tx.done
    return result
  } catch (error) {
    console.error(`❌ Error al obtener todos de ${storeName}:`, error)
    return []
  }
}

/**
 * Busca objetos por índice
 * @param {string} storeName - Nombre de la tabla
 * @param {string} indexName - Nombre del índice
 * @param {any} value - Valor a buscar
 * @returns {Promise<Object[]>}
 */
export async function getByIndex(storeName, indexName, value) {
  try {
    const db = await initDB()
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const index = store.index(indexName)
    const result = await index.getAll(value)
    await tx.done
    return result
  } catch (error) {
    console.error(`❌ Error al buscar por índice en ${storeName}:`, error)
    return []
  }
}

/**
 * Busca un objeto único por índice
 * @param {string} storeName - Nombre de la tabla
 * @param {string} indexName - Nombre del índice
 * @param {any} value - Valor a buscar
 * @returns {Promise<Object|null>}
 */
export async function getOneByIndex(storeName, indexName, value) {
  try {
    const db = await initDB()
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const index = store.index(indexName)
    const result = await index.get(value)
    await tx.done
    return result || null
  } catch (error) {
    console.error(`❌ Error al buscar por índice en ${storeName}:`, error)
    return null
  }
}

/**
 * Elimina un objeto por ID
 * @param {string} storeName - Nombre de la tabla
 * @param {string} id - ID del objeto
 * @returns {Promise<void>}
 */
export async function deleteFromDB(storeName, id) {
  try {
    const db = await initDB()
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    await store.delete(id)
    await tx.done
  } catch (error) {
    console.error(`❌ Error al eliminar de ${storeName}:`, error)
    throw error
  }
}

/**
 * Actualiza parcialmente un objeto
 * @param {string} storeName - Nombre de la tabla
 * @param {string} id - ID del objeto
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<void>}
 */
export async function updateInDB(storeName, id, updates) {
  try {
    const existing = await getFromDB(storeName, id)
    if (!existing) {
      throw new Error(`Objeto con ID ${id} no encontrado en ${storeName}`)
    }
    
    const updated = { ...existing, ...updates }
    await saveToDB(storeName, updated)
  } catch (error) {
    console.error(`❌ Error al actualizar en ${storeName}:`, error)
    throw error
  }
}

// Funciones específicas para cada tipo de objeto

/**
 * Guarda un usuario
 * @param {Object} user - Datos del usuario
 * @returns {Promise<void>}
 */
export async function saveUser(user) {
  await saveToDB(STORES.USERS, user)
}

/**
 * Obtiene un usuario por ID
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object|null>}
 */
export async function getUser(userId) {
  return await getFromDB(STORES.USERS, userId)
}

/**
 * Guarda un verbo
 * @param {Object} verb - Datos del verbo
 * @returns {Promise<void>}
 */
export async function saveVerb(verb) {
  await saveToDB(STORES.VERBS, verb)
}

/**
 * Obtiene un verbo por ID
 * @param {string} verbId - ID del verbo
 * @returns {Promise<Object|null>}
 */
export async function getVerb(verbId) {
  return await getFromDB(STORES.VERBS, verbId)
}

/**
 * Obtiene un verbo por lema
 * @param {string} lemma - Lema del verbo
 * @returns {Promise<Object|null>}
 */
export async function getVerbByLemma(lemma) {
  return await getOneByIndex(STORES.VERBS, 'lemma', lemma)
}

/**
 * Guarda un ítem
 * @param {Object} item - Datos del ítem
 * @returns {Promise<void>}
 */
export async function saveItem(item) {
  await saveToDB(STORES.ITEMS, item)
}

/**
 * Obtiene un ítem por ID
 * @param {string} itemId - ID del ítem
 * @returns {Promise<Object|null>}
 */
export async function getItem(itemId) {
  return await getFromDB(STORES.ITEMS, itemId)
}

/**
 * Busca un ítem por verbo, modo, tiempo y persona
 * @param {string} verbId - ID del verbo
 * @param {string} mood - Modo
 * @param {string} tense - Tiempo
 * @param {string} person - Persona
 * @returns {Promise<Object|null>}
 */
export async function getItemByProperties(verbId, mood, tense, person) {
  try {
    const db = await initDB()
    const tx = db.transaction(STORES.ITEMS, 'readonly')
    const store = tx.objectStore(STORES.ITEMS)
    const index = store.index('verb-mood-tense-person')
    const result = await index.get([verbId, mood, tense, person])
    await tx.done
    return result || null
  } catch (error) {
    console.error('❌ Error al buscar ítem por propiedades:', error)
    return null
  }
}

/**
 * Guarda un intento
 * @param {Object} attempt - Datos del intento
 * @returns {Promise<void>}
 */
export async function saveAttempt(attempt) {
  await saveToDB(STORES.ATTEMPTS, attempt)
}

/**
 * Obtiene un intento por ID
 * @param {string} attemptId - ID del intento
 * @returns {Promise<Object|null>}
 */
export async function getAttempt(attemptId) {
  return await getFromDB(STORES.ATTEMPTS, attemptId)
}

/**
 * Obtiene intentos por ítem
 * @param {string} itemId - ID del ítem
 * @returns {Promise<Object[]>}
 */
export async function getAttemptsByItem(itemId) {
  return await getByIndex(STORES.ATTEMPTS, 'itemId', itemId)
}

/**
 * Guarda un mastery score
 * @param {Object} mastery - Datos del mastery
 * @returns {Promise<void>}
 */
export async function saveMastery(mastery) {
  await saveToDB(STORES.MASTERY, mastery)
}

/**
 * Obtiene un mastery score por ID
 * @param {string} masteryId - ID del mastery
 * @returns {Promise<Object|null>}
 */
export async function getMastery(masteryId) {
  return await getFromDB(STORES.MASTERY, masteryId)
}

/**
 * Busca mastery score por usuario, modo, tiempo y persona
 * @param {string} userId - ID del usuario
 * @param {string} mood - Modo
 * @param {string} tense - Tiempo
 * @param {string} person - Persona
 * @returns {Promise<Object|null>}
 */
export async function getMasteryByCell(userId, mood, tense, person) {
  try {
    const db = await initDB()
    const tx = db.transaction(STORES.MASTERY, 'readonly')
    const store = tx.objectStore(STORES.MASTERY)
    const index = store.index('mood-tense-person')
    
    // Buscar todos los mastery scores para esta celda
    let result = await index.getAll([mood, tense, person])
    
    // Filtrar por usuario
    result = result.filter(m => m.userId === userId)
    
    await tx.done
    
    // Devolver el primero (debería haber solo uno)
    return result.length > 0 ? result[0] : null
  } catch (error) {
    console.error('❌ Error al buscar mastery por celda:', error)
    return null
  }
}

/**
 * Obtiene todos los mastery scores de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object[]>}
 */
export async function getMasteryByUser(userId) {
  return await getByIndex(STORES.MASTERY, 'userId', userId)
}

/**
 * Guarda un schedule
 * @param {Object} schedule - Datos del schedule
 * @returns {Promise<void>}
 */
export async function saveSchedule(schedule) {
  await saveToDB(STORES.SCHEDULES, schedule)
}

/**
 * Obtiene un schedule por ID
 * @param {string} scheduleId - ID del schedule
 * @returns {Promise<Object|null>}
 */
export async function getSchedule(scheduleId) {
  return await getFromDB(STORES.SCHEDULES, scheduleId)
}

/**
 * Busca schedules por usuario, modo, tiempo y persona
 * @param {string} userId - ID del usuario
 * @param {string} mood - Modo
 * @param {string} tense - Tiempo
 * @param {string} person - Persona
 * @returns {Promise<Object|null>}
 */
export async function getScheduleByCell(userId, mood, tense, person) {
  try {
    const db = await initDB()
    const tx = db.transaction(STORES.SCHEDULES, 'readonly')
    const store = tx.objectStore(STORES.SCHEDULES)
    const index = store.index('mood-tense-person')
    
    // Buscar todos los schedules para esta celda
    let result = await index.getAll([mood, tense, person])
    
    // Filtrar por usuario
    result = result.filter(s => s.userId === userId)
    
    await tx.done
    
    // Devolver el primero (debería haber solo uno)
    return result.length > 0 ? result[0] : null
  } catch (error) {
    console.error('❌ Error al buscar schedule por celda:', error)
    return null
  }
}

/**
 * Obtiene schedules pendientes para un usuario
 * @param {string} userId - ID del usuario
 * @param {Date} beforeDate - Fecha límite
 * @returns {Promise<Object[]>}
 */
export async function getDueSchedules(userId, beforeDate) {
  try {
    const db = await initDB()
    const tx = db.transaction(STORES.SCHEDULES, 'readonly')
    const store = tx.objectStore(STORES.SCHEDULES)
    const index = store.index('nextDue')
    
    // Obtener todos los schedules ordenados por fecha
    const allSchedules = await index.getAll()
    
    // Filtrar por usuario y fecha
    const result = allSchedules.filter(s => 
      s.userId === userId && new Date(s.nextDue) <= beforeDate
    )
    
    await tx.done
    return result
  } catch (error) {
    console.error('❌ Error al obtener schedules pendientes:', error)
    return []
  }
}

// Inicializar la base de datos cuando se cargue el módulo
initDB().catch(error => {
  console.error('❌ Error al inicializar la base de datos:', error)
})

export { STORES }
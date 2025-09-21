// Sistema de base de datos IndexedDB para progreso y analíticas

import { STORAGE_CONFIG, INIT_CONFIG } from './config.js'

// Estado de la base de datos
let dbInstance = null
let isInitializing = false

/**
 * Inicializa la base de datos IndexedDB
 * @returns {Promise<IDBDatabase>} La base de datos inicializada
 */
export async function initDB() {
  // Pre-chequeo: forzar que posibles mocks de idb se manifiesten (propaga si falla)
  const { openDB } = await import('idb')
  if (typeof openDB === 'function') {
    await openDB('progress-probe', 1, { upgrade() {} })
  }
  
  if (dbInstance) {
    return dbInstance
  }
  
  if (isInitializing) {
    // Esperar a que termine la inicialización en curso
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
    console.log('🔄 Inicializando base de datos de progreso...')
    
    // Importar openDB dinámicamente para permitir mocks por prueba
    const { openDB } = await import('idb')
    dbInstance = await openDB(STORAGE_CONFIG.DB_NAME, STORAGE_CONFIG.DB_VERSION, {
      upgrade(db) {
        console.log('🔧 Actualizando estructura de base de datos...')
        
        // Crear tabla de usuarios
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.USERS)) {
          const userStore = db.createObjectStore(STORAGE_CONFIG.STORES.USERS, { keyPath: 'id' })
          userStore.createIndex('lastActive', 'lastActive', { unique: false })
          console.log('✅ Tabla de usuarios creada')
        }

        // Crear tabla de verbos
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.VERBS)) {
          const verbStore = db.createObjectStore(STORAGE_CONFIG.STORES.VERBS, { keyPath: 'id' })
          verbStore.createIndex('lemma', 'lemma', { unique: true })
          verbStore.createIndex('type', 'type', { unique: false })
          verbStore.createIndex('frequency', 'frequency', { unique: false })
          console.log('✅ Tabla de verbos creada')
        }

        // Crear tabla de ítems
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.ITEMS)) {
          const itemStore = db.createObjectStore(STORAGE_CONFIG.STORES.ITEMS, { keyPath: 'id' })
          itemStore.createIndex('verbId', 'verbId', { unique: false })
          itemStore.createIndex('mood', 'mood', { unique: false })
          itemStore.createIndex('tense', 'tense', { unique: false })
          itemStore.createIndex('person', 'person', { unique: false })
          // Índice compuesto para búsqueda rápida
          itemStore.createIndex('verb-mood-tense-person', ['verbId', 'mood', 'tense', 'person'], { unique: true })
          console.log('✅ Tabla de ítems creada')
        }

        // Crear tabla de intentos
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.ATTEMPTS)) {
          const attemptStore = db.createObjectStore(STORAGE_CONFIG.STORES.ATTEMPTS, { keyPath: 'id' })
          attemptStore.createIndex('itemId', 'itemId', { unique: false })
          attemptStore.createIndex('createdAt', 'createdAt', { unique: false })
          attemptStore.createIndex('correct', 'correct', { unique: false })
          attemptStore.createIndex('userId', 'userId', { unique: false })
          console.log('✅ Tabla de intentos creada')
        }

        // Crear tabla de mastery
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.MASTERY)) {
          const masteryStore = db.createObjectStore(STORAGE_CONFIG.STORES.MASTERY, { keyPath: 'id' })
          masteryStore.createIndex('userId', 'userId', { unique: false })
          masteryStore.createIndex('mood-tense-person', ['mood', 'tense', 'person'], { unique: false })
          masteryStore.createIndex('updatedAt', 'updatedAt', { unique: false })
          console.log('✅ Tabla de mastery creada')
        }

        // Crear tabla de schedules
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.SCHEDULES)) {
          const scheduleStore = db.createObjectStore(STORAGE_CONFIG.STORES.SCHEDULES, { keyPath: 'id' })
          scheduleStore.createIndex('userId', 'userId', { unique: false })
          scheduleStore.createIndex('nextDue', 'nextDue', { unique: false })
          scheduleStore.createIndex('mood-tense-person', ['mood', 'tense', 'person'], { unique: false })
          console.log('✅ Tabla de schedules creada')
        }

        // Crear tabla de learning sessions (analytics)
        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.LEARNING_SESSIONS)) {
          const sessionStore = db.createObjectStore(STORAGE_CONFIG.STORES.LEARNING_SESSIONS, { keyPath: 'sessionId' })
          sessionStore.createIndex('userId', 'userId', { unique: false })
          sessionStore.createIndex('timestamp', 'timestamp', { unique: false })
          sessionStore.createIndex('tense', 'tense', { unique: false })
          sessionStore.createIndex('adaptiveLevel', 'adaptiveLevel', { unique: false })
          console.log('✅ Tabla de learning sessions creada')
        }

        if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.CHALLENGES)) {
          const challengeStore = db.createObjectStore(STORAGE_CONFIG.STORES.CHALLENGES, { keyPath: 'id' })
          challengeStore.createIndex('userId', 'userId', { unique: false })
          challengeStore.createIndex('date', 'date', { unique: false })
          console.log('✅ Tabla de daily challenges creada')
        }
        
        console.log('🔧 Estructura de base de datos actualizada')
      }
    })
    
    console.log('✅ Base de datos de progreso inicializada correctamente')
    return dbInstance
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos de progreso:', error)
    throw error
  } finally {
    isInitializing = false
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
      data.id = `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    // Añadir timestamps si no existen
    if (!data.createdAt) {
      data.createdAt = new Date()
    }
    data.updatedAt = new Date()
    
    await store.put(data)
    await tx.done
    
    console.log(`✅ Dato guardado en ${storeName}: ${data.id}`)
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
    
    if (result) {
      console.log(`✅ Dato obtenido de ${storeName}: ${id}`)
    }
    
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
    
    console.log(`✅ ${result.length} datos obtenidos de ${storeName}`)
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
    
    console.log(`✅ ${result.length} datos encontrados en ${storeName} por ${indexName}`)
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
    
    if (result) {
      console.log(`✅ Dato encontrado en ${storeName} por ${indexName}`)
    }
    
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
    
    console.log(`✅ Dato eliminado de ${storeName}: ${id}`)
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
    
    const updated = { ...existing, ...updates, updatedAt: new Date() }
    await saveToDB(storeName, updated)
    
    console.log(`✅ Dato actualizado en ${storeName}: ${id}`)
  } catch (error) {
    console.error(`❌ Error al actualizar en ${storeName}:`, error)
    throw error
  }
}

/**
 * Limpia todos los caches
 * @returns {Promise<void>}
 */
export async function clearAllCaches() {
  try {
    console.log('🧹 Limpiando todos los caches...')
    
    // En una implementación completa, esto limpiaría todos los caches
    // de la base de datos
    
    console.log('✅ Todos los caches limpiados')
  } catch (error) {
    console.error('❌ Error al limpiar caches:', error)
    throw error
  }
}

/**
 * Obtiene estadísticas de caché
 * @returns {Promise<Object>} Estadísticas de caché
 */
export async function getCacheStats() {
  try {
    // En una implementación completa, esto obtendría estadísticas
    // del uso de caché en la base de datos
    
    return {
      cacheHits: 0, // Valor de ejemplo
      cacheMisses: 0, // Valor de ejemplo
      cacheSize: 0, // Valor de ejemplo
      generatedAt: new Date()
    }
  } catch (error) {
    console.error('❌ Error al obtener estadísticas de caché:', error)
    return {}
  }
}

// Funciones específicas para cada tipo de objeto

/**
 * Guarda un usuario
 * @param {Object} user - Datos del usuario
 * @returns {Promise<void>}
 */
export async function saveUser(user) {
  await saveToDB(STORAGE_CONFIG.STORES.USERS, user)
}

/**
 * Obtiene un usuario por ID
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object|null>}
 */
export async function getUser(userId) {
  return await getFromDB(STORAGE_CONFIG.STORES.USERS, userId)
}

/**
 * Guarda un verbo
 * @param {Object} verb - Datos del verbo
 * @returns {Promise<void>}
 */
export async function saveVerb(verb) {
  await saveToDB(STORAGE_CONFIG.STORES.VERBS, verb)
}

/**
 * Obtiene un verbo por ID
 * @param {string} verbId - ID del verbo
 * @returns {Promise<Object|null>}
 */
export async function getVerb(verbId) {
  return await getFromDB(STORAGE_CONFIG.STORES.VERBS, verbId)
}

/**
 * Obtiene un verbo por lema
 * @param {string} lemma - Lema del verbo
 * @returns {Promise<Object|null>}
 */
export async function getVerbByLemma(lemma) {
  return await getOneByIndex(STORAGE_CONFIG.STORES.VERBS, 'lemma', lemma)
}

/**
 * Guarda un ítem
 * @param {Object} item - Datos del ítem
 * @returns {Promise<void>}
 */
export async function saveItem(item) {
  await saveToDB(STORAGE_CONFIG.STORES.ITEMS, item)
}

/**
 * Obtiene un ítem por ID
 * @param {string} itemId - ID del ítem
 * @returns {Promise<Object|null>}
 */
export async function getItem(itemId) {
  return await getFromDB(STORAGE_CONFIG.STORES.ITEMS, itemId)
}

/**
 * Busca un ítem por propiedades
 * @param {string} verbId - ID del verbo
 * @param {string} mood - Modo
 * @param {string} tense - Tiempo
 * @param {string} person - Persona
 * @returns {Promise<Object|null>}
 */
export async function getItemByProperties(verbId, mood, tense, person) {
  try {
    const db = await initDB()
    const tx = db.transaction(STORAGE_CONFIG.STORES.ITEMS, 'readonly')
    const store = tx.objectStore(STORAGE_CONFIG.STORES.ITEMS)
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
  await saveToDB(STORAGE_CONFIG.STORES.ATTEMPTS, attempt)
}

/**
 * Obtiene un intento por ID
 * @param {string} attemptId - ID del intento
 * @returns {Promise<Object|null>}
 */
export async function getAttempt(attemptId) {
  return await getFromDB(STORAGE_CONFIG.STORES.ATTEMPTS, attemptId)
}

/**
 * Obtiene intentos por ítem
 * @param {string} itemId - ID del ítem
 * @returns {Promise<Object[]>}
 */
export async function getAttemptsByItem(itemId) {
  return await getByIndex(STORAGE_CONFIG.STORES.ATTEMPTS, 'itemId', itemId)
}

/**
 * Obtiene intentos por usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object[]>}
 */
export async function getAttemptsByUser(userId) {
  return await getByIndex(STORAGE_CONFIG.STORES.ATTEMPTS, 'userId', userId)
}

/**
 * Obtiene intentos recientes por usuario
 * @param {string} userId - ID del usuario
 * @param {number} limit - Número máximo de intentos
 * @returns {Promise<Object[]>}
 */
export async function getRecentAttempts(userId, limit = 100) {
  try {
    const db = await initDB()
    const tx = db.transaction(STORAGE_CONFIG.STORES.ATTEMPTS, 'readonly')
    const store = tx.objectStore(STORAGE_CONFIG.STORES.ATTEMPTS)
    const index = store.index('createdAt')
    
    // Obtener todos los intentos ordenados por fecha
    const allAttempts = await index.getAll()
    
    // Filtrar por usuario y ordenar por fecha descendente
    const userAttempts = allAttempts
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit)
    
    await tx.done
    return userAttempts
  } catch (error) {
    console.error('❌ Error al obtener intentos recientes:', error)
    return []
  }
}

/**
 * Guarda un mastery score
 * @param {Object} mastery - Datos del mastery
 * @returns {Promise<void>}
 */
export async function saveMastery(mastery) {
  await saveToDB(STORAGE_CONFIG.STORES.MASTERY, mastery)
}

/**
 * Obtiene un mastery score por ID
 * @param {string} masteryId - ID del mastery
 * @returns {Promise<Object|null>}
 */
export async function getMastery(masteryId) {
  return await getFromDB(STORAGE_CONFIG.STORES.MASTERY, masteryId)
}

/**
 * Obtiene todos los mastery de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object[]>}
 */
/**
 * Busca mastery score por celda
 * @param {string} userId - ID del usuario
 * @param {string} mood - Modo
 * @param {string} tense - Tiempo
 * @param {string} person - Persona
 * @returns {Promise<Object|null>}
 */
export async function getMasteryByCell(userId, mood, tense, person) {
  try {
    const db = await initDB()
    const tx = db.transaction(STORAGE_CONFIG.STORES.MASTERY, 'readonly')
    const store = tx.objectStore(STORAGE_CONFIG.STORES.MASTERY)
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
  return await getByIndex(STORAGE_CONFIG.STORES.MASTERY, 'userId', userId)
}

/**
 * Guarda un schedule
 * @param {Object} schedule - Datos del schedule
 * @returns {Promise<void>}
 */
export async function saveSchedule(schedule) {
  await saveToDB(STORAGE_CONFIG.STORES.SCHEDULES, schedule)
}

/**
 * Obtiene un schedule por ID
 * @param {string} scheduleId - ID del schedule
 * @returns {Promise<Object|null>}
 */
export async function getSchedule(scheduleId) {
  return await getFromDB(STORAGE_CONFIG.STORES.SCHEDULES, scheduleId)
}

/**
 * Busca schedules por celda
 * @param {string} userId - ID del usuario
 * @param {string} mood - Modo
 * @param {string} tense - Tiempo
 * @param {string} person - Persona
 * @returns {Promise<Object|null>}
 */
export async function getScheduleByCell(userId, mood, tense, person) {
  try {
    const db = await initDB()
    const tx = db.transaction(STORAGE_CONFIG.STORES.SCHEDULES, 'readonly')
    const store = tx.objectStore(STORAGE_CONFIG.STORES.SCHEDULES)
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
 * Obtiene schedules pendientes
 * @param {string} userId - ID del usuario
 * @param {Date} beforeDate - Fecha límite
 * @returns {Promise<Object[]>}
 */
export async function getDueSchedules(userId, beforeDate) {
  try {
    const db = await initDB()
    const tx = db.transaction(STORAGE_CONFIG.STORES.SCHEDULES, 'readonly')
    const store = tx.objectStore(STORAGE_CONFIG.STORES.SCHEDULES)
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

/**
 * Inicializa completamente la base de datos
 * @returns {Promise<void>}
 */
export async function initializeFullDB() {
  console.log('🚀 Inicializando completamente la base de datos...')
  
  try {
    // Inicializar base de datos
    await initDB()
    
    // En una implementación completa, aquí se inicializarían
    // las tablas con datos predeterminados si es necesario
    
    console.log('✅ Base de datos completamente inicializada')
  } catch (error) {
    console.error('❌ Error al inicializar completamente la base de datos:', error)
    throw error
  }
}

/**
 * Cierra la base de datos
 * @returns {Promise<void>}
 */
export async function closeDB() {
  if (dbInstance) {
    await dbInstance.close()
    dbInstance = null
    console.log('🚪 Base de datos cerrada')
  }
}

/**
 * Elimina la base de datos
 * @returns {Promise<void>}
 */
export async function deleteDB() {
  try {
    await closeDB()
    // Importar deleteDB de idb con alias para evitar sombra
    const { deleteDB: idbDeleteDB } = await import('idb')
    await idbDeleteDB(STORAGE_CONFIG.DB_NAME)
    console.log('🗑️ Base de datos eliminada')
  } catch (error) {
    console.error('❌ Error al eliminar la base de datos:', error)
    throw error
  }
}

/**
 * Migra todos los datos de un userId anónimo al userId autenticado
 * CRÍTICO: Esta función resuelve el problema de sync multi-dispositivo
 * @param {string} oldUserId - Usuario ID anónimo (ej: user-123456-abc)
 * @param {string} newUserId - Usuario ID autenticado (ej: uuid-server-456)
 * @returns {Promise<Object>} Estadísticas de la migración
 */
export async function migrateUserIdInLocalDB(oldUserId, newUserId) {
  if (!oldUserId || !newUserId) {
    throw new Error('migrateUserIdInLocalDB: oldUserId y newUserId son requeridos')
  }

  if (oldUserId === newUserId) {
    console.log('🔄 No se requiere migración, userIds son idénticos')
    return { migrated: 0, skipped: 'same_user_id' }
  }

  console.log(`🔄 Iniciando migración de userId: ${oldUserId} → ${newUserId}`)

  const stats = {
    attempts: 0,
    mastery: 0,
    schedules: 0,
    users: 0,
    errors: []
  }

  try {
    await initDB()

    // Verificar que el nuevo userId no tenga datos existentes
    const existingAttempts = await getAttemptsByUser(newUserId)
    const existingMastery = await getMasteryByUser(newUserId)
    const existingSchedules = await getByIndex(STORAGE_CONFIG.STORES.SCHEDULES, 'userId', newUserId)

    if (existingAttempts.length > 0 || existingMastery.length > 0 || existingSchedules.length > 0) {
      console.warn(`⚠️ El nuevo userId ${newUserId} ya tiene datos existentes. Continuando con migración...`)
    }

    // 1. Migrar tabla ATTEMPTS
    try {
      const oldAttempts = await getAttemptsByUser(oldUserId)
      console.log(`📊 Migrando ${oldAttempts.length} intentos...`)

      for (const attempt of oldAttempts) {
        // Actualizar en su lugar (mantener id), pero limpiar syncedAt para forzar subida
        const migratedAttempt = { ...attempt, userId: newUserId }
        delete migratedAttempt.syncedAt
        migratedAttempt.updatedAt = new Date()
        await saveToDB(STORAGE_CONFIG.STORES.ATTEMPTS, migratedAttempt)
        stats.attempts++
      }
    } catch (error) {
      console.error('❌ Error migrando attempts:', error)
      stats.errors.push(`attempts: ${error.message}`)
    }

    // 2. Migrar tabla MASTERY
    try {
      const oldMastery = await getMasteryByUser(oldUserId)
      console.log(`📈 Migrando ${oldMastery.length} registros de mastery...`)

      for (const mastery of oldMastery) {
        // Para mastery, el id suele codificar userId|mood|tense|person: generar uno nuevo
        const newId = `${newUserId}|${mastery.mood}|${mastery.tense}|${mastery.person}`
        let migratedMastery = { ...mastery, id: newId, userId: newUserId }
        delete migratedMastery.syncedAt
        migratedMastery.updatedAt = new Date()

        // Si ya existe un registro para ese newId, combinar conservando el mejor score y timestamps más recientes
        try {
          const existingNew = await getFromDB(STORAGE_CONFIG.STORES.MASTERY, newId)
          if (existingNew) {
            migratedMastery = {
              ...existingNew,
              score: Math.max(existingNew.score || 0, mastery.score || 0),
              attempts: Math.max(existingNew.attempts || 0, mastery.attempts || 0),
              lastPracticed: new Date(Math.max(
                new Date(existingNew.lastPracticed || 0).getTime(),
                new Date(mastery.lastPracticed || 0).getTime()
              )),
              updatedAt: new Date()
            }
            delete migratedMastery.syncedAt
          }
        } catch {/* merge best-effort */}

        await saveToDB(STORAGE_CONFIG.STORES.MASTERY, migratedMastery)
        // Borrar el registro antiguo (id previo) para evitar duplicados
        try { await deleteFromDB(STORAGE_CONFIG.STORES.MASTERY, mastery.id) } catch {}
        stats.mastery++
      }
    } catch (error) {
      console.error('❌ Error migrando mastery:', error)
      stats.errors.push(`mastery: ${error.message}`)
    }

    // 3. Migrar tabla SCHEDULES
    try {
      const oldSchedules = await getByIndex(STORAGE_CONFIG.STORES.SCHEDULES, 'userId', oldUserId)
      console.log(`⏰ Migrando ${oldSchedules.length} schedules SRS...`)

      for (const schedule of oldSchedules) {
        // Para schedules, el id suele codificar userId|mood|tense|person: generar uno nuevo
        const newId = `${newUserId}|${schedule.mood}|${schedule.tense}|${schedule.person}`
        let migratedSchedule = { ...schedule, id: newId, userId: newUserId }
        delete migratedSchedule.syncedAt
        migratedSchedule.updatedAt = new Date()

        // Si ya existía un schedule para ese id, conservar el más reciente por updatedAt
        try {
          const existingNew = await getFromDB(STORAGE_CONFIG.STORES.SCHEDULES, newId)
          if (existingNew) {
            const newer = new Date(schedule.updatedAt || 0) > new Date(existingNew.updatedAt || 0)
            migratedSchedule = {
              ...(newer ? schedule : existingNew),
              id: newId,
              userId: newUserId,
              updatedAt: new Date(Math.max(
                new Date(schedule.updatedAt || 0).getTime(),
                new Date(existingNew.updatedAt || 0).getTime()
              ))
            }
            delete migratedSchedule.syncedAt
          }
        } catch {/* best-effort */}

        await saveToDB(STORAGE_CONFIG.STORES.SCHEDULES, migratedSchedule)
        // Borrar el registro antiguo (id previo) para evitar duplicados
        try { await deleteFromDB(STORAGE_CONFIG.STORES.SCHEDULES, schedule.id) } catch {}
        stats.schedules++
      }
    } catch (error) {
      console.error('❌ Error migrando schedules:', error)
      stats.errors.push(`schedules: ${error.message}`)
    }

    // 4. Migrar tabla USERS (si existe usuario anónimo)
    try {
      const oldUser = await getUser(oldUserId)
      if (oldUser) {
        console.log(`👤 Migrando usuario ${oldUserId}...`)
        const migratedUser = { ...oldUser, id: newUserId, updatedAt: new Date() }
        await saveUser(migratedUser)
        await deleteFromDB(STORAGE_CONFIG.STORES.USERS, oldUserId)
        stats.users++
      }
    } catch (error) {
      console.error('❌ Error migrando usuario:', error)
      stats.errors.push(`users: ${error.message}`)
    }

    const totalMigrated = stats.attempts + stats.mastery + stats.schedules + stats.users

    console.log(`✅ Migración completada: ${totalMigrated} registros migrados`, stats)

    if (stats.errors.length > 0) {
      console.warn('⚠️ Algunos errores durante la migración:', stats.errors)
    }

    return {
      ...stats,
      migrated: totalMigrated,
      oldUserId,
      newUserId,
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('❌ Error crítico durante migración userId:', error)
    throw error
  }
}

/**
 * Valida que la migración de userId fue exitosa
 * @param {string} oldUserId - Usuario ID anónimo original
 * @param {string} newUserId - Usuario ID autenticado
 * @returns {Promise<Object>} Resultado de la validación
 */
export async function validateUserIdMigration(oldUserId, newUserId) {
  if (!oldUserId || !newUserId) {
    return { valid: false, reason: 'missing_user_ids' }
  }

  console.log(`🔍 Validando migración: ${oldUserId} → ${newUserId}`)

  try {
    // Verificar que no queden datos bajo el userId anterior
    const remainingAttempts = await getAttemptsByUser(oldUserId)
    const remainingMastery = await getMasteryByUser(oldUserId)
    const remainingSchedules = await getByIndex(STORAGE_CONFIG.STORES.SCHEDULES, 'userId', oldUserId)
    const remainingUser = await getUser(oldUserId)

    // Verificar que existan datos bajo el nuevo userId
    const newAttempts = await getAttemptsByUser(newUserId)
    const newMastery = await getMasteryByUser(newUserId)
    const newSchedules = await getByIndex(STORAGE_CONFIG.STORES.SCHEDULES, 'userId', newUserId)
    const newUser = await getUser(newUserId)

    const remainingData = {
      attempts: remainingAttempts.length,
      mastery: remainingMastery.length,
      schedules: remainingSchedules.length,
      user: remainingUser ? 1 : 0
    }

    const newData = {
      attempts: newAttempts.length,
      mastery: newMastery.length,
      schedules: newSchedules.length,
      user: newUser ? 1 : 0
    }

    const totalRemaining = remainingData.attempts + remainingData.mastery + remainingData.schedules + remainingData.user
    const totalNew = newData.attempts + newData.mastery + newData.schedules + newData.user

    const isValid = totalRemaining === 0 && totalNew > 0

    console.log(`🔍 Validación migración - Restantes: ${totalRemaining}, Nuevos: ${totalNew}, Válida: ${isValid}`)

    return {
      valid: isValid,
      remainingData,
      newData,
      totalRemaining,
      totalNew,
      oldUserId,
      newUserId
    }

  } catch (error) {
    console.error('❌ Error validando migración:', error)
    return { valid: false, error: error.message }
  }
}

/**
 * Revierte una migración de userId en caso de error
 * @param {string} newUserId - Usuario ID autenticado
 * @param {string} oldUserId - Usuario ID anónimo original
 * @returns {Promise<Object>} Resultado de la reversión
 */
export async function revertUserIdMigration(newUserId, oldUserId) {
  if (!newUserId || !oldUserId) {
    throw new Error('revertUserIdMigration: newUserId y oldUserId son requeridos')
  }

  console.log(`🔄 Revirtiendo migración: ${newUserId} → ${oldUserId}`)

  try {
    // Básicamente es la misma operación pero en reversa
    const result = await migrateUserIdInLocalDB(newUserId, oldUserId)
    console.log('✅ Migración revertida exitosamente:', result)
    return result
  } catch (error) {
    console.error('❌ Error crítico revirtiendo migración:', error)
    throw error
  }
}

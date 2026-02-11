// Sistema de base de datos IndexedDB para progreso y analíticas

import { STORAGE_CONFIG, INIT_CONFIG } from "./config.js";
import { createLogger } from "../utils/logger.js";
import { generateId } from "../utils/id.js";
import { toDate } from "../utils/date.js";

const logger = createLogger("progress:database");
const isDev = import.meta?.env?.DEV;

// Timeout configuration for IndexedDB transactions
const DB_TRANSACTION_TIMEOUT = 10000; // 10 seconds
const CACHE_TTL_MS = 60000; // 60 seconds

// Estado de la base de datos
// Estado de la base de datos
let dbInstance = null;
let initPromise = null;

// Simple in-memory caches removed to avoid memory leaks
// IDB is fast enough for most operations
// const attemptsCache = new Map()
// const masteryCache = new Map()

function _freezeRecords(records) {
  if (!Array.isArray(records)) {
    return records;
  }
  const normalized = records.map((record) => {
    if (record && typeof record === "object") {
      return Object.isFrozen(record) ? record : Object.freeze({ ...record });
    }
    return record;
  });
  return Object.freeze(normalized);
}

// Cache functions removed as they are no longer used
// function setCacheEntry...
// function appendCacheEntry...
// function getCacheEntry...
// function invalidateCacheEntry...
// function resetMemoryCaches...

function assertValidStore(storeName) {
  const valid = Object.values(STORAGE_CONFIG.STORES);
  if (!valid.includes(storeName)) {
    const err = new Error(`invalid store: ${storeName}`);
    logger.error("assertValidStore", "Nombre de store inválido", {
      storeName,
      valid,
    });
    throw err;
  }
}

function normalizeTimestamps(record) {
  if (!record || typeof record !== "object") return record;
  if (record.createdAt && !(record.createdAt instanceof Date)) {
    const d = toDate(record.createdAt);
    if (d) record.createdAt = d;
  }
  if (record.updatedAt && !(record.updatedAt instanceof Date)) {
    const d = toDate(record.updatedAt);
    if (d) record.updatedAt = d;
  }
  return record;
}

function prefixForStore(storeName) {
  switch (storeName) {
    case STORAGE_CONFIG.STORES.ATTEMPTS:
      return "attempt";
    case STORAGE_CONFIG.STORES.MASTERY:
      return "mastery";
    case STORAGE_CONFIG.STORES.SCHEDULES:
      return "schedule";
    case STORAGE_CONFIG.STORES.ITEMS:
      return "item";
    case STORAGE_CONFIG.STORES.VERBS:
      return "verb";
    case STORAGE_CONFIG.STORES.USERS:
      return "user";
    case STORAGE_CONFIG.STORES.LEARNING_SESSIONS:
      return "session";
    case STORAGE_CONFIG.STORES.EVENTS:
      return "event";
    default:
      return "id";
  }
}

/**
 * Wraps a promise with a timeout to prevent hanging transactions
 * @param {Promise} promise - Promise to wrap
 * @param {number} timeout - Timeout in milliseconds
 * @param {string} operation - Operation name for error messages
 * @returns {Promise} Promise that rejects if timeout is reached
 */
function withTimeout(promise, timeout, operation) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${operation} timed out after ${timeout}ms`)),
      timeout,
    );
  });
  // Ensure timer is cleared once the main promise settles (avoid leaks)
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    timeoutPromise,
  ]);
}

// Safe access to IDBKeyRange across browsers and test shims
function getKeyRangeFactory() {
  return (
    globalThis.IDBKeyRange ||
    globalThis.webkitIDBKeyRange ||
    globalThis.mozIDBKeyRange ||
    globalThis.msIDBKeyRange
  );
}

/**
 * Retries an operation with exponential backoff to handle transient IndexedDB failures
 * @param {Function} operation - Async function to retry
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} delayMs - Initial delay in milliseconds (default: 100)
 * @returns {Promise} Promise that resolves/rejects after retries exhausted
 */
async function retryOperation(operation, maxRetries = 3, delayMs = 100) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        logger.error(
          "retryOperation",
          `All ${maxRetries} attempts failed`,
          error,
        );
        throw error;
      }
      logger.warn(
        "retryOperation",
        `Attempt ${attempt}/${maxRetries} failed, retrying in ${delayMs * attempt}ms...`,
        error,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt)); // Exponential backoff
    }
  }
}

/**
 * Inicializa la base de datos IndexedDB
 * @returns {Promise<IDBDatabase>} La base de datos inicializada
 */
export async function initDB() {
  // Pre-chequeo: forzar que posibles mocks de idb se manifiesten (propaga si falla)
  const { openDB } = await import("idb");
  if (typeof openDB === "function") {
    await openDB("progress-probe", 1, { upgrade() { } });
  }

  if (dbInstance) {
    return dbInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      if (isDev)
        logger.info("initDB", "Inicializando base de datos de progreso");

      // Importar openDB dinámicamente para permitir mocks por prueba
      const { openDB } = await import("idb");
      const db = await openDB(
        STORAGE_CONFIG.DB_NAME,
        STORAGE_CONFIG.DB_VERSION,
        {
          upgrade(db, oldVersion, newVersion, transaction) {
            if (isDev)
              logger.info("initDB", "Actualizando estructura de base de datos");

            // Crear tabla de usuarios
            if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.USERS)) {
              const userStore = db.createObjectStore(
                STORAGE_CONFIG.STORES.USERS,
                { keyPath: "id" },
              );
              userStore.createIndex("lastActive", "lastActive", {
                unique: false,
              });
              if (isDev) logger.info("initDB", "Tabla de usuarios creada");
            }

            // Crear tabla de verbos
            if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.VERBS)) {
              const verbStore = db.createObjectStore(
                STORAGE_CONFIG.STORES.VERBS,
                { keyPath: "id" },
              );
              verbStore.createIndex("lemma", "lemma", { unique: true });
              verbStore.createIndex("type", "type", { unique: false });
              verbStore.createIndex("frequency", "frequency", {
                unique: false,
              });
              if (isDev) logger.info("initDB", "Tabla de verbos creada");
            }

            // Crear tabla de ítems
            if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.ITEMS)) {
              const itemStore = db.createObjectStore(
                STORAGE_CONFIG.STORES.ITEMS,
                { keyPath: "id" },
              );
              itemStore.createIndex("verbId", "verbId", { unique: false });
              itemStore.createIndex("mood", "mood", { unique: false });
              itemStore.createIndex("tense", "tense", { unique: false });
              itemStore.createIndex("person", "person", { unique: false });
              // Índice compuesto para búsqueda rápida
              itemStore.createIndex(
                "verb-mood-tense-person",
                ["verbId", "mood", "tense", "person"],
                { unique: true },
              );
              if (isDev) logger.info("initDB", "Tabla de ítems creada");
            }

            // Crear tabla de intentos
            let attemptStore;
            if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.ATTEMPTS)) {
              attemptStore = db.createObjectStore(
                STORAGE_CONFIG.STORES.ATTEMPTS,
                { keyPath: "id" },
              );
              attemptStore.createIndex("itemId", "itemId", { unique: false });
              attemptStore.createIndex("createdAt", "createdAt", {
                unique: false,
              });
              attemptStore.createIndex("correct", "correct", { unique: false });
              attemptStore.createIndex("userId", "userId", { unique: false });
              attemptStore.createIndex("syncedAt", "syncedAt", {
                unique: false,
              });
              if (isDev) logger.info("initDB", "Tabla de intentos creada");
            } else if (transaction) {
              attemptStore = transaction.objectStore(
                STORAGE_CONFIG.STORES.ATTEMPTS,
              );
              if (!attemptStore.indexNames.contains("syncedAt")) {
                attemptStore.createIndex("syncedAt", "syncedAt", {
                  unique: false,
                });
              }
            }

            // Crear tabla de mastery
            let masteryStore;
            if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.MASTERY)) {
              masteryStore = db.createObjectStore(
                STORAGE_CONFIG.STORES.MASTERY,
                { keyPath: "id" },
              );
              masteryStore.createIndex("userId", "userId", { unique: false });
              masteryStore.createIndex(
                "mood-tense-person",
                ["mood", "tense", "person"],
                { unique: false },
              );
              masteryStore.createIndex("updatedAt", "updatedAt", {
                unique: false,
              });
              masteryStore.createIndex("syncedAt", "syncedAt", {
                unique: false,
              });
              if (isDev) logger.info("initDB", "Tabla de mastery creada");
            } else if (transaction) {
              masteryStore = transaction.objectStore(
                STORAGE_CONFIG.STORES.MASTERY,
              );
              if (!masteryStore.indexNames.contains("syncedAt")) {
                masteryStore.createIndex("syncedAt", "syncedAt", {
                  unique: false,
                });
              }
            }

            // Crear tabla de schedules
            let scheduleStore;
            if (
              !db.objectStoreNames.contains(STORAGE_CONFIG.STORES.SCHEDULES)
            ) {
              scheduleStore = db.createObjectStore(
                STORAGE_CONFIG.STORES.SCHEDULES,
                { keyPath: "id" },
              );
              scheduleStore.createIndex("userId", "userId", { unique: false });
              scheduleStore.createIndex("nextDue", "nextDue", {
                unique: false,
              });
              scheduleStore.createIndex(
                "userId-nextDue",
                ["userId", "nextDue"],
                { unique: false },
              );
              scheduleStore.createIndex(
                "mood-tense-person",
                ["mood", "tense", "person"],
                { unique: false },
              );
              scheduleStore.createIndex("syncedAt", "syncedAt", {
                unique: false,
              });
              if (isDev) logger.info("initDB", "Tabla de schedules creada");
            } else if (transaction) {
              scheduleStore = transaction.objectStore(
                STORAGE_CONFIG.STORES.SCHEDULES,
              );
              if (!scheduleStore.indexNames.contains("syncedAt")) {
                scheduleStore.createIndex("syncedAt", "syncedAt", {
                  unique: false,
                });
              }
            }

            if (
              scheduleStore &&
              !scheduleStore.indexNames.contains("userId-nextDue")
            ) {
              scheduleStore.createIndex(
                "userId-nextDue",
                ["userId", "nextDue"],
                { unique: false },
              );
            }

            // Crear tabla de learning sessions (analytics)
            let sessionStore;
            if (
              !db.objectStoreNames.contains(
                STORAGE_CONFIG.STORES.LEARNING_SESSIONS,
              )
            ) {
              sessionStore = db.createObjectStore(
                STORAGE_CONFIG.STORES.LEARNING_SESSIONS,
                { keyPath: "sessionId" },
              );
              sessionStore.createIndex("userId", "userId", { unique: false });
              sessionStore.createIndex("timestamp", "timestamp", {
                unique: false,
              });
              sessionStore.createIndex("updatedAt", "updatedAt", {
                unique: false,
              });
              sessionStore.createIndex("mode-tense", ["mode", "tense"], {
                unique: false,
              });
              sessionStore.createIndex("syncedAt", "syncedAt", {
                unique: false,
              });
              if (isDev)
                logger.info("initDB", "Tabla de learning sessions creada");
            } else if (transaction) {
              sessionStore = transaction.objectStore(
                STORAGE_CONFIG.STORES.LEARNING_SESSIONS,
              );
              if (!sessionStore.indexNames.contains("syncedAt")) {
                sessionStore.createIndex("syncedAt", "syncedAt", {
                  unique: false,
                });
              }
            }

            if (
              !db.objectStoreNames.contains(STORAGE_CONFIG.STORES.CHALLENGES)
            ) {
              const challengeStore = db.createObjectStore(
                STORAGE_CONFIG.STORES.CHALLENGES,
                { keyPath: "id" },
              );
              challengeStore.createIndex("userId", "userId", { unique: false });
              challengeStore.createIndex("date", "date", { unique: false });
              if (isDev)
                logger.info("initDB", "Tabla de daily challenges creada");
            }

            // Crear tabla de eventos auxiliares
            if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.EVENTS)) {
              const eventStore = db.createObjectStore(
                STORAGE_CONFIG.STORES.EVENTS,
                { keyPath: "id" },
              );
              eventStore.createIndex("userId", "userId", { unique: false });
              eventStore.createIndex("type", "type", { unique: false });
              eventStore.createIndex("createdAt", "createdAt", {
                unique: false,
              });
              eventStore.createIndex("sessionId", "sessionId", {
                unique: false,
              });
              if (isDev)
                logger.info("initDB", "Tabla de eventos auxiliares creada");
            }

            // Crear tabla de user settings para cross-device sync
            if (!db.objectStoreNames.contains(STORAGE_CONFIG.STORES.USER_SETTINGS)) {
              const settingsStore = db.createObjectStore(
                STORAGE_CONFIG.STORES.USER_SETTINGS,
                { keyPath: "id" },
              );
              settingsStore.createIndex("userId", "userId", { unique: false });
              settingsStore.createIndex("updatedAt", "updatedAt", {
                unique: false,
              });
              settingsStore.createIndex("syncedAt", "syncedAt", {
                unique: false,
              });
              if (isDev)
                logger.info("initDB", "Tabla de user settings creada");
            }

            // Add compound index for attempts if it doesn't exist
            if (
              transaction &&
              db.objectStoreNames.contains(STORAGE_CONFIG.STORES.ATTEMPTS)
            ) {
              const attemptStore = transaction.objectStore(
                STORAGE_CONFIG.STORES.ATTEMPTS,
              );
              if (!attemptStore.indexNames.contains("userId-createdAt")) {
                attemptStore.createIndex(
                  "userId-createdAt",
                  ["userId", "createdAt"],
                  { unique: false },
                );
                if (isDev)
                  logger.info(
                    "initDB",
                    "Índice userId-createdAt creado en attempts",
                  );
              }
            }

            // Migration: Ensure syncedAt exists for all records in syncable stores
            if (oldVersion < 5) {
              const storesToMigrate = [
                STORAGE_CONFIG.STORES.ATTEMPTS,
                STORAGE_CONFIG.STORES.MASTERY,
                STORAGE_CONFIG.STORES.SCHEDULES,
                STORAGE_CONFIG.STORES.LEARNING_SESSIONS,
              ];

              for (const storeName of storesToMigrate) {
                if (db.objectStoreNames.contains(storeName)) {
                  const store = transaction.objectStore(storeName);
                  // Iterate and update records without syncedAt
                  // Note: In a real large DB, we might want to do this more carefully,
                  // but for client-side IDB, this is usually acceptable during upgrade.
                  store.openCursor().then(async function iterate(cursor) {
                    if (!cursor) return;
                    const record = cursor.value;
                    let changed = false;
                    if (record.syncedAt === undefined) {
                      record.syncedAt = 0; // 0 indicates unsynced (indexable)
                      changed = true;
                    }
                    // Ensure createdAt is a Date object for proper indexing
                    if (typeof record.createdAt === "string") {
                      record.createdAt = new Date(record.createdAt);
                      changed = true;
                    }
                    if (changed) {
                      cursor.update(record);
                    }
                    await cursor.continue().then(iterate);
                  });
                }
              }
            }

            // Migration v6: normalize legacy null syncedAt to 0 so they are indexable
            if (oldVersion < 6) {
              const storesToNormalize = [
                STORAGE_CONFIG.STORES.ATTEMPTS,
                STORAGE_CONFIG.STORES.MASTERY,
                STORAGE_CONFIG.STORES.SCHEDULES,
                STORAGE_CONFIG.STORES.LEARNING_SESSIONS,
              ];
              for (const storeName of storesToNormalize) {
                if (db.objectStoreNames.contains(storeName)) {
                  const store = transaction.objectStore(storeName);
                  store.openCursor().then(async function iterate(cursor) {
                    if (!cursor) return;
                    const record = cursor.value;
                    if (record && record.syncedAt === null) {
                      record.syncedAt = 0;
                      cursor.update(record);
                    }
                    await cursor.continue().then(iterate);
                  });
                }
              }
            }

            // Migration v8: Add syncedAt and updatedAt to challenges and events
            if (oldVersion < 8) {
              const storesToMigrate = [
                STORAGE_CONFIG.STORES.CHALLENGES,
                STORAGE_CONFIG.STORES.EVENTS,
              ];
              for (const storeName of storesToMigrate) {
                if (db.objectStoreNames.contains(storeName)) {
                  const store = transaction.objectStore(storeName);
                  store.openCursor().then(async function iterate(cursor) {
                    if (!cursor) return;
                    const record = cursor.value;
                    if (record) {
                      // Add syncedAt if missing (0 = needs sync)
                      if (record.syncedAt === undefined || record.syncedAt === null) {
                        record.syncedAt = 0;
                      }
                      // Add updatedAt if missing (use createdAt as fallback)
                      if (!record.updatedAt) {
                        record.updatedAt = record.createdAt || new Date().toISOString();
                      }
                      cursor.update(record);
                    }
                    await cursor.continue().then(iterate);
                  });
                }
              }
            }

            if (isDev)
              logger.info("initDB", "Estructura de base de datos actualizada");
          },
        },
      );

      if (isDev)
        logger.info(
          "initDB",
          "Base de datos de progreso inicializada correctamente",
        );
      dbInstance = db;
      return db;
    } catch (error) {
      logger.error(
        "initDB",
        "Error al inicializar la base de datos de progreso",
        error,
      );
      initPromise = null; // Reset promise on error so we can retry
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Guarda un objeto en la base de datos
 * @param {string} storeName - Nombre de la tabla
 * @param {Object} data - Datos a guardar
 * @returns {Promise<void>}
 */
export async function saveToDB(storeName, data) {
  return retryOperation(async () => {
    try {
      assertValidStore(storeName);
      const db = await initDB();
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);

      // Si no tiene ID, generar uno
      if (!data.id) {
        data.id = generateId(prefixForStore(storeName));
      }

      // Añadir timestamps si no existen
      if (!data.createdAt) {
        data.createdAt = new Date();
      }
      data.updatedAt = new Date();

      // Normalizar timestamps si vienen como string/number
      normalizeTimestamps(data);

      // Initialize syncedAt if missing (0 = unsynced, indexable)
      if (data.syncedAt === undefined || data.syncedAt === null) {
        data.syncedAt = 0;
      }

      await store.put(data);
      await withTimeout(
        tx.done,
        DB_TRANSACTION_TIMEOUT,
        `saveToDB(${storeName})`,
      );

      if (isDev)
        logger.debug("saveToDB", `Dato guardado en ${storeName}`, {
          id: data.id,
        });
    } catch (error) {
      logger.error("saveToDB", `Error al guardar en ${storeName}`, error);
      throw error;
    }
  });
}

/**
 * Obtiene un objeto por ID
 * @param {string} storeName - Nombre de la tabla
 * @param {string} id - ID del objeto
 * @returns {Promise<Object|null>}
 */
export async function getFromDB(storeName, id) {
  try {
    assertValidStore(storeName);
    const db = await initDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const result = await store.get(id);
    await withTimeout(
      tx.done,
      DB_TRANSACTION_TIMEOUT,
      `getFromDB(${storeName})`,
    );

    if (result && isDev) {
      logger.debug("getFromDB", `Dato obtenido de ${storeName}`, { id });
    }

    return result || null;
  } catch (error) {
    logger.error("getFromDB", `Error al obtener de ${storeName}`, error);
    return null;
  }
}

/**
 * Obtiene todos los objetos de una tabla
 * @param {string} storeName - Nombre de la tabla
 * @returns {Promise<Object[]>}
 */
export async function getAllFromDB(storeName) {
  try {
    assertValidStore(storeName);
    const db = await initDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const result = await store.getAll();
    await withTimeout(
      tx.done,
      DB_TRANSACTION_TIMEOUT,
      `getAllFromDB(${storeName})`,
    );

    if (isDev)
      logger.debug(
        "getAllFromDB",
        `${result.length} datos obtenidos de ${storeName}`,
      );
    return result;
  } catch (error) {
    logger.error(
      "getAllFromDB",
      `Error al obtener todos de ${storeName}`,
      error,
    );
    return [];
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
    assertValidStore(storeName);
    const db = await initDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const result = await index.getAll(value);
    await withTimeout(
      tx.done,
      DB_TRANSACTION_TIMEOUT,
      `getByIndex(${storeName}.${indexName})`,
    );

    if (isDev)
      logger.debug(
        "getByIndex",
        `${result.length} datos encontrados en ${storeName} por ${indexName}`,
      );
    return result;
  } catch (error) {
    logger.error(
      "getByIndex",
      `Error al buscar por índice en ${storeName}`,
      error,
    );
    return [];
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
    assertValidStore(storeName);
    const db = await initDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const result = await index.get(value);
    await withTimeout(
      tx.done,
      DB_TRANSACTION_TIMEOUT,
      `getOneByIndex(${storeName}.${indexName})`,
    );

    if (result && isDev) {
      logger.debug(
        "getOneByIndex",
        `Dato encontrado en ${storeName} por ${indexName}`,
      );
    }

    return result || null;
  } catch (error) {
    logger.error(
      "getOneByIndex",
      `Error al buscar por índice en ${storeName}`,
      error,
    );
    return null;
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
    let _recordForCache = null;
    try {
      _recordForCache = await getFromDB(storeName, id);
    } catch {
      _recordForCache = null;
    }

    assertValidStore(storeName);
    const db = await initDB();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    await store.delete(id);
    await withTimeout(
      tx.done,
      DB_TRANSACTION_TIMEOUT,
      `deleteFromDB(${storeName})`,
    );

    // Cache invalidation removed
    // if (storeName === STORAGE_CONFIG.STORES.ATTEMPTS && recordForCache?.userId) {
    //   invalidateCacheEntry(attemptsCache, recordForCache.userId)
    // } else if (storeName === STORAGE_CONFIG.STORES.MASTERY && recordForCache?.userId) {
    //   invalidateCacheEntry(masteryCache, recordForCache.userId)
    // }

    if (isDev)
      logger.debug("deleteFromDB", `Dato eliminado de ${storeName}`, { id });
  } catch (error) {
    logger.error("deleteFromDB", `Error al eliminar de ${storeName}`, error);
    throw error;
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
    const existing = await getFromDB(storeName, id);
    if (!existing) {
      throw new Error(`Objeto con ID ${id} no encontrado en ${storeName}`);
    }

    assertValidStore(storeName);
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    await saveToDB(storeName, updated);

    // Cache invalidation removed
    // if (storeName === STORAGE_CONFIG.STORES.ATTEMPTS) { ... }
    // else if (storeName === STORAGE_CONFIG.STORES.MASTERY) { ... }

    if (isDev)
      logger.debug("updateInDB", `Dato actualizado en ${storeName}`, { id });
  } catch (error) {
    logger.error("updateInDB", `Error al actualizar en ${storeName}`, error);
    throw error;
  }
}

/**
 * Guarda múltiples objetos en una sola transacción (batch operation)
 * Optimiza el rendimiento al reducir overhead de transacciones múltiples
 * @param {string} storeName - Nombre de la tabla
 * @param {Object[]} dataArray - Array de objetos a guardar
 * @param {Object} options - Opciones de configuración
 * @param {boolean} [options.skipTimestamps=false] - No agregar timestamps automáticos
 * @returns {Promise<{saved: number, errors: Array}>} Resultado de la operación
 */
export async function batchSaveToDB(storeName, dataArray, options = {}) {
  return retryOperation(async () => {
    const { skipTimestamps = false } = options;
    const results = { saved: 0, errors: [] };

    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      if (isDev) logger.debug("batchSaveToDB", `Array vacío para ${storeName}`);
      return results;
    }

    try {
      assertValidStore(storeName);
      const db = await initDB();
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);

      const persistedRecords = [];

      // Procesar todos los objetos en una sola transacción
      for (const data of dataArray) {
        try {
          // Preparar el objeto
          const prepared = { ...data };

          // Generar ID si no existe
          if (!prepared.id) {
            prepared.id = generateId(prefixForStore(storeName));
          }

          // Agregar timestamps si no está deshabilitado
          if (!skipTimestamps) {
            if (!prepared.createdAt) {
              prepared.createdAt = new Date();
            }
            prepared.updatedAt = new Date();
          }

          normalizeTimestamps(prepared);

          // Asegurar valor indexable para items no sincronizados
          if (prepared.syncedAt === undefined || prepared.syncedAt === null) {
            prepared.syncedAt = 0;
          }

          await store.put(prepared);
          persistedRecords.push(prepared);
          results.saved++;
        } catch (itemError) {
          results.errors.push({
            id: data?.id || "unknown",
            error: itemError.message,
          });
          logger.error(
            "batchSaveToDB",
            `Error guardando item en ${storeName}`,
            itemError,
          );
        }
      }

      // Esperar a que la transacción complete con timeout
      await withTimeout(
        tx.done,
        DB_TRANSACTION_TIMEOUT,
        `batchSaveToDB(${storeName})`,
      );

      if (isDev)
        logger.debug(
          "batchSaveToDB",
          `${results.saved}/${dataArray.length} objetos guardados en ${storeName}`,
        );

      // Cache population removed
      // if (persistedRecords.length > 0) { ... }

      return results;
    } catch (error) {
      logger.error(
        "batchSaveToDB",
        `Error en batch save para ${storeName}`,
        error,
      );
      throw error;
    }
  });
}

/**
 * Actualiza múltiples objetos en una sola transacción (batch operation)
 * @param {string} storeName - Nombre de la tabla
 * @param {Array<{id: string, updates: Object}>} updateArray - Array de objetos {id, updates}
 * @returns {Promise<{updated: number, errors: Array}>} Resultado de la operación
 */
export async function batchUpdateInDB(storeName, updateArray) {
  return retryOperation(async () => {
    const results = { updated: 0, errors: [] };

    if (!Array.isArray(updateArray) || updateArray.length === 0) {
      if (isDev)
        logger.debug("batchUpdateInDB", `Array vacío para ${storeName}`);
      return results;
    }

    try {
      assertValidStore(storeName);
      const db = await initDB();
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);

      for (const { id, updates } of updateArray) {
        try {
          const existing = await store.get(id);
          if (!existing) {
            results.errors.push({
              id,
              error: `Objeto no encontrado: ${id}`,
            });
            continue;
          }

          const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date(),
          };

          await store.put(updated);
          results.updated++;
        } catch (itemError) {
          results.errors.push({
            id: id || "unknown",
            error: itemError.message,
          });
          logger.error(
            "batchUpdateInDB",
            `Error actualizando item en ${storeName}`,
            itemError,
          );
        }
      }

      await withTimeout(
        tx.done,
        DB_TRANSACTION_TIMEOUT,
        `batchUpdateInDB(${storeName})`,
      );

      if (isDev)
        logger.debug(
          "batchUpdateInDB",
          `${results.updated}/${updateArray.length} objetos actualizados en ${storeName}`,
        );

      return results;
    } catch (error) {
      logger.error(
        "batchUpdateInDB",
        `Error en batch update para ${storeName}`,
        error,
      );
      throw error;
    }
  });
}

/**
 * Limpia todos los caches
 * @returns {Promise<void>}
 */
export async function clearAllCaches() {
  try {
    if (isDev) logger.info("clearAllCaches", "Limpiando todos los caches");

    // resetMemoryCaches()

    if (isDev) logger.info("clearAllCaches", "Todos los caches limpiados");
  } catch (error) {
    logger.error("clearAllCaches", "Error al limpiar caches", error);
    throw error;
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
      generatedAt: new Date(),
    };
  } catch (error) {
    logger.error(
      "getCacheStats",
      "Error al obtener estadísticas de caché",
      error,
    );
    return {};
  }
}

// Funciones específicas para cada tipo de objeto

/**
 * Guarda un usuario
 * @param {Object} user - Datos del usuario
 * @returns {Promise<void>}
 */
export async function saveUser(user) {
  await saveToDB(STORAGE_CONFIG.STORES.USERS, user);
}

/**
 * Obtiene un usuario por ID
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object|null>}
 */
export async function getUser(userId) {
  return await getFromDB(STORAGE_CONFIG.STORES.USERS, userId);
}

/**
 * Alias para obtener un usuario por ID (consistencia con gamificación)
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object|null>}
 */
export async function getUserById(userId) {
  return await getUser(userId);
}

/**
 * Guarda un verbo
 * @param {Object} verb - Datos del verbo
 * @returns {Promise<void>}
 */
export async function saveVerb(verb) {
  await saveToDB(STORAGE_CONFIG.STORES.VERBS, verb);
}

/**
 * Obtiene un verbo por ID
 * @param {string} verbId - ID del verbo
 * @returns {Promise<Object|null>}
 */
export async function getVerb(verbId) {
  return await getFromDB(STORAGE_CONFIG.STORES.VERBS, verbId);
}

/**
 * Obtiene un verbo por lema
 * @param {string} lemma - Lema del verbo
 * @returns {Promise<Object|null>}
 */
export async function getVerbByLemma(lemma) {
  return await getOneByIndex(STORAGE_CONFIG.STORES.VERBS, "lemma", lemma);
}

/**
 * Guarda un ítem
 * @param {Object} item - Datos del ítem
 * @returns {Promise<void>}
 */
export async function saveItem(item) {
  await saveToDB(STORAGE_CONFIG.STORES.ITEMS, item);
}

/**
 * Obtiene un ítem por ID
 * @param {string} itemId - ID del ítem
 * @returns {Promise<Object|null>}
 */
export async function getItem(itemId) {
  return await getFromDB(STORAGE_CONFIG.STORES.ITEMS, itemId);
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
    const db = await initDB();
    const tx = db.transaction(STORAGE_CONFIG.STORES.ITEMS, "readonly");
    const store = tx.objectStore(STORAGE_CONFIG.STORES.ITEMS);
    const index = store.index("verb-mood-tense-person");
    const result = await index.get([verbId, mood, tense, person]);
    await withTimeout(tx.done, DB_TRANSACTION_TIMEOUT, "getItemByProperties");
    return result || null;
  } catch (error) {
    logger.error(
      "getItemByProperties",
      "Error al buscar ítem por propiedades",
      error,
    );
    return null;
  }
}

import { validateAttempt } from './runtimeValidation.js';

/**
 * Guarda un intento
 * @param {Object} attempt - Datos del intento
 * @returns {Promise<void>}
 */
export async function saveAttempt(attempt) {
  // Validar integridad de datos antes de guardar
  validateAttempt(attempt);

  await saveToDB(STORAGE_CONFIG.STORES.ATTEMPTS, attempt);
  // if (attempt?.userId) {
  //   appendCacheEntry(attemptsCache, attempt.userId, [attempt])
  // }
}

/**
 * Obtiene un intento por ID
 * @param {string} attemptId - ID del intento
 * @returns {Promise<Object|null>}
 */
export async function getAttempt(attemptId) {
  return await getFromDB(STORAGE_CONFIG.STORES.ATTEMPTS, attemptId);
}

/**
 * Obtiene intentos por ítem
 * @param {string} itemId - ID del ítem
 * @returns {Promise<Object[]>}
 */
export async function getAttemptsByItem(itemId) {
  return await getByIndex(STORAGE_CONFIG.STORES.ATTEMPTS, "itemId", itemId);
}

/**
 * Busca objetos por rango de índice
 * @param {string} storeName - Nombre de la tabla
 * @param {string} indexName - Nombre del índice
 * @param {any} key - Clave principal para el rango (ej: userId)
 * @param {Date|number} lowerBound - Límite inferior
 * @param {Date|number} upperBound - Límite superior
 * @returns {Promise<Object[]>}
 */
export async function getByIndexRange(storeName, indexName, key, lowerBound, upperBound) {
  try {
    assertValidStore(storeName);
    const db = await initDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);

    // Verificar si el índice existe
    if (!store.indexNames.contains(indexName)) {
      logger.warn("getByIndexRange", `Índice ${indexName} no existe en ${storeName}, usando fallback`);
      // Fallback a obtener todos y filtrar en memoria (lento pero seguro)
      const all = await getByIndex(storeName, "userId", key); // Asumiendo que key es userId por ahora
      const start = new Date(lowerBound).getTime();
      const end = new Date(upperBound).getTime();
      return all.filter(item => {
        const time = new Date(item.createdAt || item.timestamp || 0).getTime();
        return time >= start && time <= end;
      });
    }

    const index = store.index(indexName);
    const KR = getKeyRangeFactory();
    if (!KR) throw new Error("IDBKeyRange factory not available");

    // Crear rango compuesto [key, lower] a [key, upper]
    const range = KR.bound(
      [key, new Date(lowerBound)],
      [key, new Date(upperBound)]
    );

    const result = await index.getAll(range);
    await withTimeout(
      tx.done,
      DB_TRANSACTION_TIMEOUT,
      `getByIndexRange(${storeName}.${indexName})`
    );

    if (isDev)
      logger.debug(
        "getByIndexRange",
        `${result.length} datos encontrados en ${storeName} por rango`
      );
    return result;
  } catch (error) {
    logger.error(
      "getByIndexRange",
      `Error al buscar por rango en ${storeName}`,
      error
    );
    return [];
  }
}

/**
 * Obtiene intentos por usuario con opción de filtrado por fecha
 * @param {string} userId - ID del usuario
 * @param {Object} options - Opciones de filtrado
 * @param {Date|number} [options.startDate] - Fecha de inicio
 * @param {Date|number} [options.endDate] - Fecha de fin
 * @returns {Promise<Object[]>}
 */
export async function getAttemptsByUser(userId, options = {}) {
  // Cache check removed
  // const cached = getCacheEntry(attemptsCache, userId)
  // if (cached) return cached

  const { startDate, endDate } = options;

  // Si se especifican fechas, intentar usar búsqueda por rango optimizada
  if (startDate) {
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate ? (endDate instanceof Date ? endDate : new Date(endDate)) : new Date(); // Default to now

    // Intentar usar el índice compuesto userId-createdAt si existe (v5+)
    // Nota: getByIndexRange verificará internamente si el índice existe
    // y hará fallback si es necesario, pero aquí podemos ser más explícitos
    // para aprovechar la optimización.
    return await getByIndexRange(
      STORAGE_CONFIG.STORES.ATTEMPTS,
      "userId-createdAt",
      userId,
      start,
      end
    );
  }

  // Comportamiento original (todos los intentos)
  const attempts = await getByIndex(
    STORAGE_CONFIG.STORES.ATTEMPTS,
    "userId",
    userId,
  );
  // setCacheEntry(attemptsCache, userId, attempts || [])
  return attempts || [];
}

/**
 * Obtiene intentos recientes por usuario
 * @param {string} userId - ID del usuario
 * @param {number} limit - Número máximo de intentos
 * @returns {Promise<Object[]>}
 */
export async function getRecentAttempts(userId, limit = 100) {
  try {
    const db = await initDB();
    const tx = db.transaction(STORAGE_CONFIG.STORES.ATTEMPTS, "readonly");
    const store = tx.objectStore(STORAGE_CONFIG.STORES.ATTEMPTS);

    // Use compound index if available (DB v5+)
    if (store.indexNames.contains("userId-createdAt")) {
      const index = store.index("userId-createdAt");
      // Range for this user, all dates.
      // Note: We use a very wide date range.
      // Lower bound: new Date(0) (1970)
      // Upper bound: new Date(8640000000000000) (Max valid date)
      const KR = getKeyRangeFactory();
      if (!KR) throw new Error("IDBKeyRange factory not available");
      const range = KR.bound(
        [userId, new Date(0)],
        [userId, new Date(8640000000000000)],
      );

      const attempts = [];
      // Iterate backwards (prev) to get most recent first
      let cursor = await index.openCursor(range, "prev");

      while (cursor && attempts.length < limit) {
        attempts.push(cursor.value);
        cursor = await cursor.continue();
      }

      await withTimeout(tx.done, DB_TRANSACTION_TIMEOUT, "getRecentAttempts");
      return attempts;
    }

    // Fallback for older DB versions or missing index
    const index = store.index("createdAt");

    // Obtener todos los intentos ordenados por fecha
    const allAttempts = await index.getAll();

    // Filtrar por usuario y ordenar por fecha descendente
    const userAttempts = allAttempts
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    await withTimeout(tx.done, DB_TRANSACTION_TIMEOUT, "getRecentAttempts");
    return userAttempts;
  } catch (error) {
    logger.error(
      "getRecentAttempts",
      "Error al obtener intentos recientes",
      error,
    );
    return [];
  }
}

/**
 * Obtiene ítems pendientes de sincronización
 * @param {string} storeName - Nombre de la tabla
 * @param {string} userId - ID del usuario (opcional, para filtrar)
 * @param {number} limit - Límite de ítems (opcional)
 * @returns {Promise<Object[]>}
 */
export async function getUnsyncedItems(storeName, userId, limit = 100) {
  try {
    const db = await initDB();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);

    if (!store.indexNames.contains("syncedAt")) {
      // Fallback: scan all items (slow but works if index missing)
      const all = await store.getAll();
      return all
        .filter((item) => !item.syncedAt && (!userId || item.userId === userId))
        .slice(0, limit);
    }

    const index = store.index("syncedAt");
    const KR = getKeyRangeFactory();
    if (!KR) {
      // As a defensive fallback, do a full scan
      const all = await store.getAll();
      return all
        .filter((item) => !item.syncedAt && (!userId || item.userId === userId))
        .slice(0, limit);
    }

    // Primary: syncedAt = 0 (unsynced, indexable)
    const primary = await index.getAll(KR.only(0));

    // Legacy records may have syncedAt === null and thus not be indexed; fallback scan if needed
    let legacy = [];
    if (primary.length < limit) {
      const all = await store.getAll();
      legacy = all.filter(
        (item) =>
          (item.syncedAt === null || item.syncedAt === undefined) &&
          (!userId || item.userId === userId),
      );
    }

    const combined = userId
      ? primary.filter((i) => i.userId === userId).concat(legacy)
      : primary.concat(legacy);

    return combined.slice(0, limit);
  } catch (error) {
    logger.error(
      "getUnsyncedItems",
      `Error al obtener ítems sin sincronizar de ${storeName}`,
      error,
    );
    return [];
  }
}

/**
 * Guarda un mastery score
 * @param {Object} mastery - Datos del mastery
 * @returns {Promise<void>}
 */
export async function saveMastery(mastery) {
  await saveToDB(STORAGE_CONFIG.STORES.MASTERY, mastery);
  // if (mastery?.userId) {
  //   appendCacheEntry(masteryCache, mastery.userId, [mastery])
  // }
}

/**
 * Obtiene un mastery score por ID
 * @param {string} masteryId - ID del mastery
 * @returns {Promise<Object|null>}
 */
export async function getMastery(masteryId) {
  return await getFromDB(STORAGE_CONFIG.STORES.MASTERY, masteryId);
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
    const db = await initDB();
    const tx = db.transaction(STORAGE_CONFIG.STORES.MASTERY, "readonly");
    const store = tx.objectStore(STORAGE_CONFIG.STORES.MASTERY);
    const index = store.index("mood-tense-person");

    // Buscar todos los mastery scores para esta celda
    let result = await index.getAll([mood, tense, person]);

    // Filtrar por usuario
    result = result.filter((m) => m.userId === userId);

    await withTimeout(tx.done, DB_TRANSACTION_TIMEOUT, "getMasteryByCell");

    // Devolver el primero (debería haber solo uno)
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    logger.error(
      "getMasteryByCell",
      "Error al buscar mastery por celda",
      error,
    );
    return null;
  }
}

/**
 * Obtiene todos los mastery scores de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object[]>}
 */
export async function getMasteryByUser(userId) {
  // Cache check removed
  // const cached = getCacheEntry(masteryCache, userId)
  // if (cached) return cached

  const mastery = await getByIndex(
    STORAGE_CONFIG.STORES.MASTERY,
    "userId",
    userId,
  );
  // setCacheEntry(masteryCache, userId, mastery || [])
  return mastery || [];
}

/**
 * Guarda un schedule
 * @param {Object} schedule - Datos del schedule
 * @returns {Promise<void>}
 */
export async function saveSchedule(schedule) {
  await saveToDB(STORAGE_CONFIG.STORES.SCHEDULES, schedule);
}

/**
 * Obtiene un schedule por ID
 * @param {string} scheduleId - ID del schedule
 * @returns {Promise<Object|null>}
 */
export async function getSchedule(scheduleId) {
  return await getFromDB(STORAGE_CONFIG.STORES.SCHEDULES, scheduleId);
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
    const db = await initDB();
    const tx = db.transaction(STORAGE_CONFIG.STORES.SCHEDULES, "readonly");
    const store = tx.objectStore(STORAGE_CONFIG.STORES.SCHEDULES);
    const index = store.index("mood-tense-person");

    // Buscar todos los schedules para esta celda
    let result = await index.getAll([mood, tense, person]);

    // Filtrar por usuario
    result = result.filter((s) => s.userId === userId);

    await withTimeout(tx.done, DB_TRANSACTION_TIMEOUT, "getScheduleByCell");

    // Devolver el primero (debería haber solo uno)
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    logger.error(
      "getScheduleByCell",
      "Error al buscar schedule por celda",
      error,
    );
    return null;
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
    const db = await initDB();
    const tx = db.transaction(STORAGE_CONFIG.STORES.SCHEDULES, "readonly");
    const store = tx.objectStore(STORAGE_CONFIG.STORES.SCHEDULES);
    const index = store.index("userId-nextDue");

    const upperBound =
      beforeDate instanceof Date ? beforeDate : new Date(beforeDate);
    if (Number.isNaN(upperBound.getTime())) {
      throw new Error("getDueSchedules requiere una fecha válida");
    }
    const lowerBound = new Date(0);
    let dueSchedules;
    try {
      const rangeFactory = getKeyRangeFactory();
      if (!rangeFactory)
        throw new Error("IDBKeyRange no está disponible en este entorno");
      const keyRange = rangeFactory.bound(
        [userId, lowerBound],
        [userId, upperBound],
      );
      dueSchedules = await index.getAll(keyRange);
    } catch (rangeError) {
      // Defensive fallback for environments where composite range queries are flaky
      logger.warn(
        "getDueSchedules",
        "Range query failed, falling back to full scan",
        rangeError,
      );
      const all = await store.getAll();
      dueSchedules = all.filter((s) => s.userId === userId);
    }

    const result = dueSchedules.filter((schedule) => {
      if (!schedule?.nextDue) return false;
      const nextDueDate =
        schedule.nextDue instanceof Date
          ? schedule.nextDue
          : new Date(schedule.nextDue);
      return nextDueDate <= upperBound;
    });

    await withTimeout(tx.done, DB_TRANSACTION_TIMEOUT, "getDueSchedules");
    return result;
  } catch (error) {
    logger.error(
      "getDueSchedules",
      "Error al obtener schedules pendientes",
      error,
    );
    return [];
  }
}

/**
 * Guarda una sesión de aprendizaje
 * @param {Object} session - Datos de la sesión
 * @returns {Promise<void>}
 */
export async function saveLearningSession(session) {
  try {
    const db = await initDB();
    const tx = db.transaction(
      STORAGE_CONFIG.STORES.LEARNING_SESSIONS,
      "readwrite",
    );
    const store = tx.objectStore(STORAGE_CONFIG.STORES.LEARNING_SESSIONS);

    const sessionId =
      session.sessionId ||
      session.id ||
      `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const normalizedSyncedAt =
      session.syncedAt === undefined || session.syncedAt === null
        ? 0
        : session.syncedAt;
    const payload = {
      createdAt: session.createdAt || new Date().toISOString(),
      updatedAt: session.updatedAt || new Date().toISOString(),
      ...session,
      sessionId,
      syncedAt: normalizedSyncedAt,
    };

    await store.put(payload);
    await withTimeout(tx.done, DB_TRANSACTION_TIMEOUT, "saveLearningSession");
  } catch (error) {
    logger.error(
      "saveLearningSession",
      "Error al guardar learning session",
      error,
    );
    throw error;
  }
}

/**
 * Actualiza una sesión de aprendizaje existente
 * @param {string} sessionId - ID de la sesión
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<void>}
 */
export async function updateLearningSession(sessionId, updates) {
  try {
    const existing = await getFromDB(
      STORAGE_CONFIG.STORES.LEARNING_SESSIONS,
      sessionId,
    );
    if (!existing) throw new Error(`Learning session ${sessionId} not found`);
    const merged = {
      ...existing,
      ...updates,
      sessionId,
      updatedAt: updates?.updatedAt || new Date().toISOString(),
    };
    await saveToDB(STORAGE_CONFIG.STORES.LEARNING_SESSIONS, merged);
  } catch (error) {
    logger.error(
      "updateLearningSession",
      "Error al actualizar learning session",
      error,
    );
    throw error;
  }
}

/**
 * Obtiene sesiones de aprendizaje por usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object[]>}
 */
export async function getLearningSessionsByUser(userId) {
  return await getByIndex(
    STORAGE_CONFIG.STORES.LEARNING_SESSIONS,
    "userId",
    userId,
  );
}

/**
 * Guarda un evento
 * @param {Object} event - Datos del evento
 * @returns {Promise<void>}
 */
export async function saveEvent(event) {
  await saveToDB(STORAGE_CONFIG.STORES.EVENTS, event);
}

/**
 * Obtiene un evento por ID
 * @param {string} eventId - ID del evento
 * @returns {Promise<Object|null>}
 */
export async function getEvent(eventId) {
  return await getFromDB(STORAGE_CONFIG.STORES.EVENTS, eventId);
}

/**
 * Obtiene eventos por usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object[]>}
 */
export async function getEventsByUser(userId) {
  return await getByIndex(STORAGE_CONFIG.STORES.EVENTS, "userId", userId);
}

/**
 * Obtiene eventos por tipo
 * @param {string} type - Tipo de evento
 * @returns {Promise<Object[]>}
 */
export async function getEventsByType(type) {
  return await getByIndex(STORAGE_CONFIG.STORES.EVENTS, "type", type);
}

/**
 * Obtiene eventos por sesión
 * @param {string} sessionId - ID de la sesión
 * @returns {Promise<Object[]>}
 */
export async function getEventsBySession(sessionId) {
  return await getByIndex(STORAGE_CONFIG.STORES.EVENTS, "sessionId", sessionId);
}

/**
 * Obtiene eventos recientes por usuario
 * @param {string} userId - ID del usuario
 * @param {number} limit - Número máximo de eventos
 * @returns {Promise<Object[]>}
 */
export async function getRecentEvents(userId, limit = 100) {
  try {
    const db = await initDB();
    const tx = db.transaction(STORAGE_CONFIG.STORES.EVENTS, "readonly");
    const store = tx.objectStore(STORAGE_CONFIG.STORES.EVENTS);
    const index = store.index("createdAt");

    // Obtener todos los eventos ordenados por fecha
    const allEvents = await index.getAll();

    // Filtrar por usuario y ordenar por fecha descendente
    const userEvents = allEvents
      .filter((e) => e.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    await withTimeout(tx.done, DB_TRANSACTION_TIMEOUT, "getRecentEvents");
    return userEvents;
  } catch (error) {
    logger.error(
      "getRecentEvents",
      "Error al obtener eventos recientes",
      error,
    );
    return [];
  }
}

/**
 * Inicializa completamente la base de datos
 * @returns {Promise<void>}
 */
export async function initializeFullDB() {
  if (isDev)
    logger.info(
      "initializeFullDB",
      "Inicializando completamente la base de datos",
    );

  try {
    // Inicializar base de datos
    await initDB();

    // En una implementación completa, aquí se inicializarían
    // las tablas con datos predeterminados si es necesario

    if (isDev)
      logger.info(
        "initializeFullDB",
        "Base de datos completamente inicializada",
      );
  } catch (error) {
    logger.error(
      "initializeFullDB",
      "Error al inicializar completamente la base de datos",
      error,
    );
    throw error;
  }
}

/**
 * Cierra la base de datos
 * @returns {Promise<void>}
 */
export async function closeDB() {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
    initPromise = null;
    // clearAllCaches()
    if (isDev) logger.info("closeDB", "Base de datos cerrada");
  }
}

/**
 * Elimina la base de datos
 * @returns {Promise<void>}
 */
export async function deleteDB() {
  try {
    await closeDB();
    initPromise = null;
    // Importar deleteDB de idb con alias para evitar sombra
    const { deleteDB: idbDeleteDB } = await import("idb");
    await idbDeleteDB(STORAGE_CONFIG.DB_NAME);
    // clearAllCaches()
    if (isDev) logger.info("deleteDB", "Base de datos eliminada");
  } catch (error) {
    logger.error("deleteDB", "Error al eliminar la base de datos", error);
    throw error;
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
    throw new Error(
      "migrateUserIdInLocalDB: oldUserId y newUserId son requeridos",
    );
  }

  if (oldUserId === newUserId) {
    if (isDev)
      logger.info(
        "migrateUserIdInLocalDB",
        "No se requiere migración, userIds son idénticos",
      );
    return { migrated: 0, skipped: "same_user_id" };
  }

  if (isDev)
    logger.info(
      "migrateUserIdInLocalDB",
      `Iniciando migración de userId: ${oldUserId} → ${newUserId}`,
    );

  const stats = {
    attempts: 0,
    mastery: 0,
    schedules: 0,
    sessions: 0,
    events: 0,
    challenges: 0,
    settings: 0,
    users: 0,
    errors: [],
  };

  try {
    await initDB();

    // Helper function to update a record
    const updateUser = async (storeName, record, statName, keyOverride = null) => {
      try {
        const recordId = keyOverride || record?.id;
        if (!recordId) {
          stats.errors.push(`${statName}: missing id`);
          return;
        }
        await updateInDB(storeName, recordId, {
          userId: newUserId,
          syncedAt: 0, // Force sync (indexable)
          migratedAt: new Date(),
          syncPriority: true,
        });
        stats[statName]++;
      } catch (error) {
        logger.error(
          "updateUser",
          `Error migrando ${statName} (ID: ${record.id})`,
          error,
        );
        stats.errors.push(`${statName}: ${error.message}`);
      }
    };

    // 1. Migrar tabla ATTEMPTS
    const oldAttempts = await getAttemptsByUser(oldUserId);
    if (isDev)
      logger.info(
        "migrateUserIdInLocalDB",
        `Migrando ${oldAttempts.length} intentos`,
      );
    for (const attempt of oldAttempts) {
      await updateUser(STORAGE_CONFIG.STORES.ATTEMPTS, attempt, "attempts");
    }

    // 2. Migrar tabla MASTERY
    const oldMastery = await getMasteryByUser(oldUserId);
    if (isDev)
      logger.info(
        "migrateUserIdInLocalDB",
        `Migrando ${oldMastery.length} registros de mastery`,
      );
    for (const mastery of oldMastery) {
      await updateUser(STORAGE_CONFIG.STORES.MASTERY, mastery, "mastery");
    }

    // 3. Migrar tabla SCHEDULES
    const oldSchedules = await getByIndex(
      STORAGE_CONFIG.STORES.SCHEDULES,
      "userId",
      oldUserId,
    );
    if (isDev)
      logger.info(
        "migrateUserIdInLocalDB",
        `Migrando ${oldSchedules.length} schedules SRS`,
      );
    for (const schedule of oldSchedules) {
      await updateUser(STORAGE_CONFIG.STORES.SCHEDULES, schedule, "schedules");
    }

    // 3.5 Migrar tabla LEARNING_SESSIONS (analytics)
    const oldSessions = await getLearningSessionsByUser(oldUserId);
    if (isDev)
      logger.info(
        "migrateUserIdInLocalDB",
        `Migrando ${oldSessions.length} sesiones de aprendizaje`,
      );
    for (const session of oldSessions) {
      const sessionKey = session?.sessionId || session?.id;
      await updateUser(
        STORAGE_CONFIG.STORES.LEARNING_SESSIONS,
        session,
        "sessions",
        sessionKey,
      );
    }

    // 3.6 Migrar tabla EVENTS
    const oldEvents = await getByIndex(
      STORAGE_CONFIG.STORES.EVENTS,
      "userId",
      oldUserId,
    );
    if (isDev)
      logger.info(
        "migrateUserIdInLocalDB",
        `Migrando ${oldEvents.length} eventos`,
      );
    for (const event of oldEvents) {
      await updateUser(STORAGE_CONFIG.STORES.EVENTS, event, "events");
    }

    // 3.7 Migrar tabla CHALLENGES
    const oldChallenges = await getByIndex(
      STORAGE_CONFIG.STORES.CHALLENGES,
      "userId",
      oldUserId,
    );
    if (isDev)
      logger.info(
        "migrateUserIdInLocalDB",
        `Migrando ${oldChallenges.length} desafíos diarios`,
      );
    for (const challenge of oldChallenges) {
      await updateUser(STORAGE_CONFIG.STORES.CHALLENGES, challenge, "challenges");
    }

    // 3.8 Migrar tabla USER_SETTINGS (mantener el settings más reciente)
    try {
      const oldSettingsRecords = await getByIndex(
        STORAGE_CONFIG.STORES.USER_SETTINGS,
        "userId",
        oldUserId,
      );

      if (oldSettingsRecords.length > 0) {
        const sorted = [...oldSettingsRecords].sort(
          (a, b) => new Date(b?.updatedAt || b?.createdAt || 0) - new Date(a?.updatedAt || a?.createdAt || 0),
        );
        const latest = sorted[0];

        const existingNewSettings = await getUserSettings(newUserId);
        const oldUpdatedAt = new Date(
          latest?.updatedAt ||
          latest?.settings?.lastUpdated ||
          latest?.settings?.updatedAt ||
          latest?.createdAt ||
          0,
        ).getTime();
        const newUpdatedAt = new Date(
          existingNewSettings?.updatedAt ||
          existingNewSettings?.settings?.lastUpdated ||
          existingNewSettings?.settings?.updatedAt ||
          existingNewSettings?.createdAt ||
          0,
        ).getTime();

        if (!existingNewSettings || oldUpdatedAt > newUpdatedAt) {
          const settingsPayload = latest.settings || latest;
          await saveUserSettings(newUserId, settingsPayload, { alreadySynced: false });
          stats.settings++;
        }

        for (const rec of oldSettingsRecords) {
          await deleteFromDB(STORAGE_CONFIG.STORES.USER_SETTINGS, rec.id);
        }
      }
    } catch (error) {
      logger.error("migrateUserIdInLocalDB", "Error migrando user settings", error);
      stats.errors.push(`settings: ${error.message}`);
    }

    // 4. Migrar tabla USERS (si existe usuario anónimo)
    try {
      const oldUser = await getUser(oldUserId);
      if (oldUser) {
        if (isDev)
          logger.info(
            "migrateUserIdInLocalDB",
            `Migrando usuario ${oldUserId}`,
          );
        // Create new user record and delete old one
        const migratedUser = {
          ...oldUser,
          id: newUserId,
          updatedAt: new Date(),
          syncedAt: 0,
          syncPriority: true,
        };
        await saveUser(migratedUser);
        await deleteFromDB(STORAGE_CONFIG.STORES.USERS, oldUserId);
        stats.users++;
      }
    } catch (error) {
      logger.error("migrateUserIdInLocalDB", "Error migrando usuario", error);
      stats.errors.push(`users: ${error.message}`);
    }

    const totalMigrated =
      stats.attempts +
      stats.mastery +
      stats.schedules +
      stats.sessions +
      stats.events +
      stats.challenges +
      stats.settings +
      stats.users;

    if (isDev)
      logger.info(
        "migrateUserIdInLocalDB",
        `Migración completada: ${totalMigrated} registros migrados`,
        stats,
      );

    if (stats.errors.length > 0) {
      logger.warn(
        "migrateUserIdInLocalDB",
        "Algunos errores durante la migración",
        { errors: stats.errors },
      );
    }

    return {
      ...stats,
      migrated: totalMigrated,
      oldUserId,
      newUserId,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error(
      "migrateUserIdInLocalDB",
      "Error crítico durante migración userId",
      error,
    );
    throw error;
  }
}

// Helpers for tests
export function __clearProgressDatabaseCaches() {
  // clearAllCaches()
}

/**
 * Valida que la migración de userId fue exitosa
 * @param {string} oldUserId - Usuario ID anónimo original
 * @param {string} newUserId - Usuario ID autenticado
 * @returns {Promise<Object>} Resultado de la validación
 */
export async function validateUserIdMigration(oldUserId, newUserId) {
  if (!oldUserId || !newUserId) {
    return { valid: false, reason: "missing_user_ids" };
  }

  if (isDev)
    logger.info(
      "validateUserIdMigration",
      `Validando migración: ${oldUserId} → ${newUserId}`,
    );

  try {
    // Verificar que no queden datos bajo el userId anterior
    const remainingAttempts = await getAttemptsByUser(oldUserId);
    const remainingMastery = await getMasteryByUser(oldUserId);
    const remainingSchedules = await getByIndex(
      STORAGE_CONFIG.STORES.SCHEDULES,
      "userId",
      oldUserId,
    );
    const remainingSessions = await getLearningSessionsByUser(oldUserId);
    const remainingEvents = await getByIndex(
      STORAGE_CONFIG.STORES.EVENTS,
      "userId",
      oldUserId,
    );
    const remainingChallenges = await getByIndex(
      STORAGE_CONFIG.STORES.CHALLENGES,
      "userId",
      oldUserId,
    );
    const remainingSettings = await getByIndex(
      STORAGE_CONFIG.STORES.USER_SETTINGS,
      "userId",
      oldUserId,
    );
    const remainingUser = await getUser(oldUserId);

    // Verificar que existan datos bajo el nuevo userId
    const newAttempts = await getAttemptsByUser(newUserId);
    const newMastery = await getMasteryByUser(newUserId);
    const newSchedules = await getByIndex(
      STORAGE_CONFIG.STORES.SCHEDULES,
      "userId",
      newUserId,
    );
    const newSessions = await getLearningSessionsByUser(newUserId);
    const newEvents = await getByIndex(
      STORAGE_CONFIG.STORES.EVENTS,
      "userId",
      newUserId,
    );
    const newChallenges = await getByIndex(
      STORAGE_CONFIG.STORES.CHALLENGES,
      "userId",
      newUserId,
    );
    const newSettings = await getByIndex(
      STORAGE_CONFIG.STORES.USER_SETTINGS,
      "userId",
      newUserId,
    );
    const newUser = await getUser(newUserId);

    const remainingData = {
      attempts: remainingAttempts.length,
      mastery: remainingMastery.length,
      schedules: remainingSchedules.length,
      sessions: remainingSessions.length,
      events: remainingEvents.length,
      challenges: remainingChallenges.length,
      settings: remainingSettings.length,
      user: remainingUser ? 1 : 0,
    };

    const newData = {
      attempts: newAttempts.length,
      mastery: newMastery.length,
      schedules: newSchedules.length,
      sessions: newSessions.length,
      events: newEvents.length,
      challenges: newChallenges.length,
      settings: newSettings.length,
      user: newUser ? 1 : 0,
    };

    const totalRemaining =
      remainingData.attempts +
      remainingData.mastery +
      remainingData.schedules +
      remainingData.sessions +
      remainingData.events +
      remainingData.challenges +
      remainingData.settings +
      remainingData.user;
    const totalNew =
      newData.attempts +
      newData.mastery +
      newData.schedules +
      newData.sessions +
      newData.events +
      newData.challenges +
      newData.settings +
      newData.user;

    // Fix: Migrations with zero records (both totalRemaining and totalNew equal 0) are considered valid
    // This handles the case where a new device has no local data to migrate
    const isValid =
      totalRemaining === 0 &&
      (totalNew > 0 || (totalNew === 0 && totalRemaining === 0));

    if (isDev)
      logger.info(
        "validateUserIdMigration",
        `Validación migración - Restantes: ${totalRemaining}, Nuevos: ${totalNew}, Válida: ${isValid}`,
      );

    return {
      valid: isValid,
      remainingData,
      newData,
      totalRemaining,
      totalNew,
      oldUserId,
      newUserId,
    };
  } catch (error) {
    logger.error("validateUserIdMigration", "Error validando migración", error);
    return { valid: false, error: error.message };
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
    throw new Error(
      "revertUserIdMigration: newUserId y oldUserId son requeridos",
    );
  }

  if (isDev)
    logger.info(
      "revertUserIdMigration",
      `Revirtiendo migración: ${newUserId} → ${oldUserId}`,
    );

  try {
    // Básicamente es la misma operación pero en reversa
    const result = await migrateUserIdInLocalDB(newUserId, oldUserId);
    if (isDev)
      logger.info(
        "revertUserIdMigration",
        "Migración revertida exitosamente",
        result,
      );
    return result;
  } catch (error) {
    logger.error(
      "revertUserIdMigration",
      "Error crítico revirtiendo migración",
      error,
    );
    throw error;
  }
}

/**
 * Guarda user settings en IndexedDB
 * @param {string} userId - ID del usuario
 * @param {Object} settings - Configuración del usuario
 * @param {Object} [options] - Opciones adicionales
 * @param {boolean} [options.alreadySynced=false] - Si los settings ya están sincronizados (ej: vienen del servidor)
 * @returns {Promise<Object>} - Settings guardado con ID y timestamps
 */
export async function saveUserSettings(userId, settings, options = {}) {
  try {
    const { alreadySynced = false } = options;

    // Use consistent ID per user (no timestamp) to UPDATE existing record instead of creating new ones
    const settingsId = `settings-${userId}`;

    // Get existing record to preserve createdAt and check for changes
    const existing = await getFromDB(STORAGE_CONFIG.STORES.USER_SETTINGS, settingsId);

    // Deep equality check to prevent sync loops
    // If settings are identical to existing record, preserve the current synced status
    // unless explicitly forced by options.alreadySynced
    if (existing && JSON.stringify(existing.settings) === JSON.stringify(settings)) {
      // Data hasn't changed
      if (existing.synced && !options.alreadySynced) {
        // If it was already synced, and we're not forcing a change, keep it synced
        // This handles the case where dataMerger updates the store (synced: true),
        // and then the store subscriber triggers a save (normally synced: false).
        // Since data is identical, we keep synced: true.
        return existing;
      }
    }

    const settingsRecord = {
      id: settingsId,
      userId,
      settings,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      synced: options.alreadySynced === true,
      syncedAt: options.alreadySynced === true ? new Date().getTime() : 0
    };

    await saveToDB(STORAGE_CONFIG.STORES.USER_SETTINGS, settingsRecord);

    if (isDev) {
      logger.debug('saveUserSettings', 'Settings guardados', {
        userId,
        alreadySynced,
        syncedAt: settingsRecord.syncedAt
      });
    }

    return settingsRecord;
  } catch (error) {
    logger.error('saveUserSettings', 'Error guardando settings', error);
    throw error;
  }
}

/**
 * Obtiene los últimos settings de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object|null>} - Settings más recientes o null
 */
export async function getUserSettings(userId) {
  try {
    const db = await initDB();
    const tx = db.transaction(STORAGE_CONFIG.STORES.USER_SETTINGS, 'readonly');
    const store = tx.objectStore(STORAGE_CONFIG.STORES.USER_SETTINGS);
    const index = store.index('userId');

    const allSettings = await index.getAll(userId);

    if (!allSettings || allSettings.length === 0) {
      return null;
    }

    // Retornar el más reciente (por updatedAt)
    const sorted = allSettings.sort((a, b) =>
      new Date(b.updatedAt) - new Date(a.updatedAt)
    );

    return sorted[0];
  } catch (error) {
    logger.error('getUserSettings', 'Error obteniendo settings', error);
    return null;
  }
}

/**
 * Marca settings como sincronizados
 * @param {string[]} settingsIds - IDs de los settings a marcar
 * @returns {Promise<void>}
 */
export async function markSettingsAsSynced(settingsIds) {
  try {
    const db = await initDB();
    const tx = db.transaction(STORAGE_CONFIG.STORES.USER_SETTINGS, 'readwrite');
    const store = tx.objectStore(STORAGE_CONFIG.STORES.USER_SETTINGS);

    const now = Date.now();
    for (const id of settingsIds) {
      const record = await store.get(id);
      if (record) {
        record.synced = true;
        record.syncedAt = now;
        await store.put(record);
      }
    }

    await tx.done;
  } catch (error) {
    logger.error('markSettingsAsSynced', 'Error marcando settings como sincronizados', error);
    throw error;
  }
}

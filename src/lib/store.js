import { set, get } from 'idb-keyval'

let useLocalStorage = false

function isIndexedDBAvailable() {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null
  } catch {
    return false
  }
}

async function setWithFallback(key, data) {
  if (useLocalStorage) {
    localStorage.setItem(key, JSON.stringify(data))
    return
  }
  
  try {
    await set(key, data)
  } catch (error) {
    console.warn('IndexedDB failed, falling back to localStorage:', error)
    useLocalStorage = true
    localStorage.setItem(key, JSON.stringify(data))
  }
}

async function getWithFallback(key) {
  if (useLocalStorage) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : {}
    } catch {
      return {}
    }
  }
  
  try {
    return (await get(key)) || {}
  } catch (error) {
    console.warn('IndexedDB failed, falling back to localStorage:', error)
    useLocalStorage = true
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : {}
    } catch {
      return {}
    }
  }
}

export async function saveProgress(key, data) {
  if (!isIndexedDBAvailable()) {
    useLocalStorage = true
  }
  await setWithFallback(key, data)
}

export async function loadProgress(key) {
  if (!isIndexedDBAvailable()) {
    useLocalStorage = true
  }
  return await getWithFallback(key)
} 
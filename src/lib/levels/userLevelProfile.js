// User Level Profile System
// Manages personalized CEFR level progression and statistics

import { openDB } from 'idb'

const LEVEL_ORDER = {
  'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6
}

const REVERSE_LEVEL_ORDER = {
  1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2', 5: 'C1', 6: 'C2'
}

export const AVAILABLE_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

let db = null

async function getDB() {
  if (!db) {
    db = await openDB('user-level-profile', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'userId' })
        }
        if (!db.objectStoreNames.contains('levelHistory')) {
          db.createObjectStore('levelHistory', { keyPath: 'id', autoIncrement: true })
        }
      }
    })
  }
  return db
}

export class UserLevelProfile {
  constructor(userId = 'default') {
    this.userId = userId
    this.currentLevel = 'A2' // Default starting level
    this.levelProgress = 0 // 0-100%
    this.levelHistory = []
    this.competencyStats = {}
    this.lastAssessment = null
    this.manualOverride = false
    this.createdAt = new Date().toISOString()
    this.updatedAt = new Date().toISOString()
  }

  static async load(userId = 'default') {
    try {
      const database = await getDB()
      const profile = await database.get('profiles', userId)

      if (profile) {
        const instance = new UserLevelProfile(userId)
        Object.assign(instance, profile)
        return instance
      }
    } catch (error) {
      console.warn('Failed to load user level profile:', error)
    }

    // Return new profile if none exists
    return new UserLevelProfile(userId)
  }

  async save() {
    try {
      this.updatedAt = new Date().toISOString()
      const database = await getDB()
      await database.put('profiles', { ...this })
      return true
    } catch (error) {
      console.error('Failed to save user level profile:', error)
      return false
    }
  }

  getCurrentLevel() {
    return this.currentLevel
  }

  getLevelProgress() {
    return this.levelProgress
  }

  getLevelNumber() {
    return LEVEL_ORDER[this.currentLevel] || 2
  }

  getNextLevel() {
    const currentNum = this.getLevelNumber()
    const nextNum = currentNum + 1
    return REVERSE_LEVEL_ORDER[nextNum] || 'C2'
  }

  getPreviousLevel() {
    const currentNum = this.getLevelNumber()
    const prevNum = currentNum - 1
    return REVERSE_LEVEL_ORDER[prevNum] || 'A1'
  }

  async setLevel(newLevel, reason = 'manual', skipHistory = false) {
    if (!AVAILABLE_LEVELS.includes(newLevel)) {
      throw new Error(`Invalid level: ${newLevel}`)
    }

    const oldLevel = this.currentLevel
    this.currentLevel = newLevel
    this.levelProgress = 0 // Reset progress when changing level
    this.manualOverride = reason === 'manual'

    if (!skipHistory && oldLevel !== newLevel) {
      await this.addToHistory({
        fromLevel: oldLevel,
        toLevel: newLevel,
        reason,
        timestamp: new Date().toISOString(),
        progress: this.levelProgress
      })
    }

    await this.save()
    return true
  }

  async updateProgress(newProgress) {
    this.levelProgress = Math.max(0, Math.min(100, newProgress))
    await this.save()
  }

  async addToHistory(entry) {
    try {
      const database = await getDB()
      await database.add('levelHistory', {
        userId: this.userId,
        ...entry
      })

      // Keep only last 50 entries in memory
      this.levelHistory.push(entry)
      if (this.levelHistory.length > 50) {
        this.levelHistory = this.levelHistory.slice(-50)
      }
    } catch (error) {
      console.error('Failed to add level history:', error)
    }
  }

  async getFullHistory() {
    try {
      const database = await getDB()
      const tx = database.transaction('levelHistory', 'readonly')
      const store = tx.objectStore('levelHistory')
      const allEntries = await store.getAll()

      return allEntries
        .filter(entry => entry.userId === this.userId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    } catch (error) {
      console.error('Failed to get level history:', error)
      return this.levelHistory
    }
  }

  updateCompetencyStats(mood, tense, accuracy, responseTime) {
    const key = `${mood}_${tense}`

    if (!this.competencyStats[key]) {
      this.competencyStats[key] = {
        attempts: 0,
        correct: 0,
        accuracy: 0,
        avgResponseTime: 0,
        lastPracticed: null
      }
    }

    const stats = this.competencyStats[key]
    stats.attempts += 1
    stats.correct += accuracy ? 1 : 0
    stats.accuracy = stats.correct / stats.attempts
    stats.avgResponseTime = (stats.avgResponseTime * (stats.attempts - 1) + responseTime) / stats.attempts
    stats.lastPracticed = new Date().toISOString()

    this.save()
  }

  getCompetencyForMoodTense(mood, tense) {
    const key = `${mood}_${tense}`
    return this.competencyStats[key] || null
  }

  getOverallCompetency() {
    const stats = Object.values(this.competencyStats)
    if (stats.length === 0) return 0

    const totalAccuracy = stats.reduce((sum, stat) => sum + stat.accuracy, 0)
    return totalAccuracy / stats.length
  }

  isReadyForPromotion() {
    if (this.manualOverride) return false

    const overallCompetency = this.getOverallCompetency()
    const progressThreshold = 85 // 85% progress required
    const competencyThreshold = 0.80 // 80% accuracy required

    return this.levelProgress >= progressThreshold && overallCompetency >= competencyThreshold
  }

  canAccessLevel(targetLevel) {
    const currentNum = this.getLevelNumber()
    const targetNum = LEVEL_ORDER[targetLevel] || 999

    // Can always access current level and below
    return targetNum <= currentNum
  }

  shouldShowAdvancedWarning(targetLevel) {
    const currentNum = this.getLevelNumber()
    const targetNum = LEVEL_ORDER[targetLevel] || 999

    // Show warning if target is more than 1 level above current
    return targetNum > currentNum + 1
  }

  getLevelDisplayInfo() {
    return {
      current: this.currentLevel,
      progress: this.levelProgress,
      next: this.getNextLevel(),
      isMaxLevel: this.currentLevel === 'C2',
      readyForPromotion: this.isReadyForPromotion(),
      overallCompetency: Math.round(this.getOverallCompetency() * 100)
    }
  }

  async reset() {
    this.currentLevel = 'A2'
    this.levelProgress = 0
    this.competencyStats = {}
    this.manualOverride = false

    await this.addToHistory({
      fromLevel: this.currentLevel,
      toLevel: 'A2',
      reason: 'reset',
      timestamp: new Date().toISOString(),
      progress: 0
    })

    await this.save()
  }
}

// Global instance management
let globalProfile = null

export async function getCurrentUserProfile() {
  if (!globalProfile) {
    globalProfile = await UserLevelProfile.load()
  }
  return globalProfile
}

export async function setGlobalUserLevel(newLevel, reason = 'manual') {
  const profile = await getCurrentUserProfile()
  await profile.setLevel(newLevel, reason)
  return profile
}

export async function updateGlobalLevelProgress(progress) {
  const profile = await getCurrentUserProfile()
  await profile.updateProgress(progress)
  return profile
}

export async function recordGlobalCompetency(mood, tense, accuracy, responseTime) {
  const profile = await getCurrentUserProfile()
  profile.updateCompetencyStats(mood, tense, accuracy, responseTime)
  return profile
}

// Utility functions
export function getLevelColor(level) {
  const colors = {
    'A1': 'var(--text-secondary)',
    'A2': 'var(--text-secondary)',
    'B1': 'var(--accent-blue)',
    'B2': 'var(--accent-blue)',
    'C1': 'var(--accent-green)',
    'C2': 'var(--accent-green)'
  }
  return colors[level] || 'var(--text-secondary)'
}

export function getLevelDescription(level) {
  const descriptions = {
    'A1': 'Principiante',
    'A2': 'Básico',
    'B1': 'Intermedio',
    'B2': 'Intermedio Alto',
    'C1': 'Avanzado',
    'C2': 'Dominio'
  }
  return descriptions[level] || 'Desconocido'
}

export function isValidLevel(level) {
  return AVAILABLE_LEVELS.includes(level)
}
// Sistema de notificaciones inteligentes basado en patrones de aprendizaje
import { PROGRESS_CONFIG } from '../progress/config.js'
import { getCurrentUserId } from '../progress/userManager/index.js'
import { getAttemptsByUser, getDueSchedules } from '../progress/database.js'

// Configuración de notificaciones
const NOTIFICATION_CONFIG = {
  TIMING: {
    MORNING_START: 7, // 7 AM
    MORNING_END: 11,  // 11 AM
    AFTERNOON_START: 14, // 2 PM
    AFTERNOON_END: 17,   // 5 PM
    EVENING_START: 19,   // 7 PM
    EVENING_END: 21,     // 9 PM
  },

  INTERVALS: {
    MORNING_REMINDER: 9 * 60 * 60 * 1000,    // 9 AM
    AFTERNOON_REMINDER: 15 * 60 * 60 * 1000,  // 3 PM
    EVENING_REMINDER: 20 * 60 * 60 * 1000,    // 8 PM
    STREAK_RISK: 22 * 60 * 60 * 1000,         // 10 PM - riesgo de perder racha
  },

  MESSAGES: {
    MORNING_BOOST: [
      '🌅 ¡Buenos días! Tu mente está fresca, perfecto para repasar',
      '☀️ Momento ideal para fortalecer tu español matutino',
      '🧠 Tu cerebro está en modo óptimo, ¡aprovechemos!'
    ],

    AFTERNOON_FOCUS: [
      '⚡ Momento de energía post-almuerzo para tu español',
      '🎯 Sesión de enfoque: tienes repasos esperándote',
      '💪 ¡Dale un empujón a tu progreso esta tarde!'
    ],

    EVENING_CONSOLIDATION: [
      '🌙 Perfecto para consolidar lo aprendido hoy',
      '✨ Termina el día fortaleciendo tu español',
      '🎓 Última oportunidad para mantener tu racha'
    ],

    STREAK_PRESERVATION: [
      '🔥 ¡No pierdas tu racha! Solo faltan unos minutos',
      '⏰ Tu racha de {streak} días está en riesgo',
      '🚨 ¡Última llamada para mantener tu progreso!'
    ],

    DUE_REMINDERS: [
      '📚 Tienes {count} repasos listos para fortalecer tu memoria',
      '🎯 {count} elementos esperan tu atención',
      '⚡ ¡{count} oportunidades para mejorar tu español!'
    ],

    OPTIMAL_WINDOW: [
      '🎯 Momento perfecto basado en tu historial de aprendizaje',
      '⭐ Tu mente está en modo óptimo según tus patrones',
      '🚀 Ventana de productividad detectada, ¡aprovéchala!'
    ]
  }
}

/**
 * Clase principal para gestionar notificaciones inteligentes
 */
export class SmartNotificationManager {
  constructor() {
    const hasWindow = typeof window !== 'undefined' && typeof navigator !== 'undefined'
    this.isSupported = hasWindow && 'Notification' in window && 'serviceWorker' in navigator
    this.permission = null
    this.scheduledNotifications = new Map()
    this.userPatterns = null
    this.registrationPromise = null
    this.listenersInitialized = false
    this.dailyTimerId = null
    this.init()
  }

  async init() {
    if (!this.isSupported) return false

    // Verificar permisos existentes
    this.permission = Notification.permission

    // Analizar patrones del usuario
    await this.analyzeUserPatterns()

    // Configurar listeners de eventos
    this.setupEventListeners()

    console.log('🔔 Smart Notifications initialized')
    return true
  }

  /**
   * Solicita permisos de notificación al usuario
   */
  async requestPermission() {
    if (!this.isSupported) return false

    if (this.permission === 'granted') return true

    try {
      this.permission = await Notification.requestPermission()
      return this.permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  /**
   * Analiza los patrones de aprendizaje del usuario
   */
  async analyzeUserPatterns() {
    try {
      const userId = getCurrentUserId()
      if (!userId) return

      const attempts = await getAttemptsByUser(userId)
      if (attempts.length < 10) return // Necesitamos datos suficientes

      // Analizar horarios preferidos
      const hourlyActivity = {}
      attempts.forEach(attempt => {
        const hour = new Date(attempt.createdAt).getHours()
        hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1
      })

      // Encontrar picos de actividad
      const sortedHours = Object.entries(hourlyActivity)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => parseInt(hour))

      // Analizar días de la semana preferidos
      const weeklyActivity = {}
      attempts.forEach(attempt => {
        const day = new Date(attempt.createdAt).getDay()
        weeklyActivity[day] = (weeklyActivity[day] || 0) + 1
      })

      // Calcular precisión por hora para encontrar ventanas óptimas
      const accuracyByHour = {}
      attempts.forEach(attempt => {
        const hour = new Date(attempt.createdAt).getHours()
        if (!accuracyByHour[hour]) {
          accuracyByHour[hour] = { correct: 0, total: 0 }
        }
        accuracyByHour[hour].total++
        if (attempt.correct) {
          accuracyByHour[hour].correct++
        }
      })

      // Encontrar horarios con mayor precisión
      const optimalHours = Object.entries(accuracyByHour)
        .filter(([, data]) => data.total >= 5) // Mínimo 5 intentos
        .map(([hour, data]) => ({
          hour: parseInt(hour),
          accuracy: data.correct / data.total,
          attempts: data.total
        }))
        .sort((a, b) => b.accuracy - a.accuracy)
        .slice(0, 2)
        .map(item => item.hour)

      this.userPatterns = {
        preferredHours: sortedHours,
        optimalHours,
        weeklyActivity,
        totalAttempts: attempts.length,
        avgAccuracy: attempts.filter(a => a.correct).length / attempts.length
      }

      console.log('📊 User patterns analyzed:', this.userPatterns)
    } catch (error) {
      console.error('Error analyzing user patterns:', error)
    }
  }

  /**
   * Programa notificaciones basadas en patrones del usuario
   */
  async scheduleSmartNotifications() {
    if (this.permission !== 'granted') return false

    try {
      const userId = getCurrentUserId()
      if (!userId) return false

      // Obtener estado actual del SRS
      const [dueSchedules] = await Promise.all([
        getDueSchedules(userId, new Date())
      ])

      const dueCount = dueSchedules.length

      // Limpiar notificaciones previas
      this.clearScheduledNotifications()

      // Programar notificaciones para mañana
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      await this.scheduleForDay(tomorrow, dueCount)

      console.log('📅 Smart notifications scheduled')
      return true
    } catch (error) {
      console.error('Error scheduling notifications:', error)
      return false
    }
  }

  /**
   * Programa notificaciones para un día específico
   */
  async scheduleForDay(date, dueCount) {
    const notifications = []

    // Si el usuario tiene patrones identificados, usar sus horarios preferidos
    if (this.userPatterns && this.userPatterns.preferredHours.length > 0) {
      // Notificación en horario óptimo principal
      const primaryHour = this.userPatterns.optimalHours[0] || this.userPatterns.preferredHours[0]
      if (primaryHour) {
        const optimalTime = new Date(date)
        optimalTime.setHours(primaryHour, 0, 0, 0)

        notifications.push({
          id: `optimal-${date.toDateString()}`,
          time: optimalTime,
          title: '⭐ Momento óptimo para estudiar',
          body: this.getRandomMessage(NOTIFICATION_CONFIG.MESSAGES.OPTIMAL_WINDOW),
          tag: 'optimal-timing',
          data: { type: 'optimal', dueCount, userHour: primaryHour }
        })
      }

      // Notificación de backup en segundo horario preferido
      if (this.userPatterns.preferredHours[1]) {
        const backupTime = new Date(date)
        backupTime.setHours(this.userPatterns.preferredHours[1], 30, 0, 0)

        notifications.push({
          id: `backup-${date.toDateString()}`,
          time: backupTime,
          title: '💪 Otra oportunidad perfecta',
          body: dueCount > 0
            ? this.getRandomMessage(NOTIFICATION_CONFIG.MESSAGES.DUE_REMINDERS).replace('{count}', dueCount)
            : this.getRandomMessage(NOTIFICATION_CONFIG.MESSAGES.AFTERNOON_FOCUS),
          tag: 'backup-timing',
          data: { type: 'backup', dueCount }
        })
      }
    } else {
      // Usuario nuevo - usar horarios estándar
      this.scheduleDefaultNotifications(date, dueCount, notifications)
    }

    // Notificación de preservación de racha (si es necesario)
    await this.scheduleStreakPreservation(date, notifications)

    // Programar todas las notificaciones
    for (const notification of notifications) {
      await this.scheduleNotification(notification)
    }
  }

  /**
   * Programa notificaciones estándar para usuarios nuevos
   */
  scheduleDefaultNotifications(date, dueCount, notifications) {
    // Mañana
    const morningTime = new Date(date)
    morningTime.setHours(9, 0, 0, 0)
    notifications.push({
      id: `morning-${date.toDateString()}`,
      time: morningTime,
      title: '🌅 ¡Buenos días!',
      body: this.getRandomMessage(NOTIFICATION_CONFIG.MESSAGES.MORNING_BOOST),
      tag: 'morning-reminder',
      data: { type: 'morning', dueCount }
    })

    // Tarde (solo si hay elementos pendientes)
    if (dueCount > 0) {
      const afternoonTime = new Date(date)
      afternoonTime.setHours(15, 0, 0, 0)
      notifications.push({
        id: `afternoon-${date.toDateString()}`,
        time: afternoonTime,
        title: `⚡ ${dueCount} repasos te esperan`,
        body: this.getRandomMessage(NOTIFICATION_CONFIG.MESSAGES.DUE_REMINDERS).replace('{count}', dueCount),
        tag: 'due-reminder',
        data: { type: 'due', dueCount }
      })
    }

    // Noche (consolidación)
    const eveningTime = new Date(date)
    eveningTime.setHours(20, 0, 0, 0)
    notifications.push({
      id: `evening-${date.toDateString()}`,
      time: eveningTime,
      title: '🌙 Consolida tu aprendizaje',
      body: this.getRandomMessage(NOTIFICATION_CONFIG.MESSAGES.EVENING_CONSOLIDATION),
      tag: 'evening-consolidation',
      data: { type: 'evening', dueCount }
    })
  }

  /**
   * Programa notificación de preservación de racha
   */
  async scheduleStreakPreservation(date, notifications) {
    try {
      const userId = getCurrentUserId()
      if (!userId) return

      // Verificar racha actual (esto requeriría acceso a gamification stats)
      // Por ahora, asumimos que hay racha si hay actividad reciente
      const recentAttempts = await getAttemptsByUser(userId)
      const hasRecentActivity = recentAttempts.some(attempt => {
        const attemptDate = new Date(attempt.createdAt)
        const yesterday = new Date(date)
        yesterday.setDate(yesterday.getDate() - 1)
        return attemptDate.toDateString() === yesterday.toDateString()
      })

      if (hasRecentActivity) {
        const streakTime = new Date(date)
        streakTime.setHours(22, 0, 0, 0) // 10 PM

        notifications.push({
          id: `streak-${date.toDateString()}`,
          time: streakTime,
          title: '🔥 ¡Mantén tu racha!',
          body: this.getRandomMessage(NOTIFICATION_CONFIG.MESSAGES.STREAK_PRESERVATION).replace('{streak}', '?'),
          tag: 'streak-preservation',
          data: { type: 'streak', urgent: true },
          requireInteraction: true
        })
      }
    } catch (error) {
      console.error('Error scheduling streak preservation:', error)
    }
  }

  /**
   * Programa una notificación individual
   */
  async scheduleNotification(notification) {
    try {
      const now = new Date()
      if (notification.time <= now) return // No programar notificaciones pasadas

      if (this.isSupported && 'serviceWorker' in navigator) {
        await this.getServiceWorkerRegistration()
      }

      const delay = notification.time - now

      const timeoutId = setTimeout(() => {
        this.sendNotification(notification)
        this.scheduledNotifications.delete(notification.id)
      }, delay)

      this.scheduledNotifications.set(notification.id, timeoutId)

      console.log(`📅 Notification scheduled: ${notification.title} at ${notification.time.toLocaleString()}`)
    } catch (error) {
      console.error('Error scheduling individual notification:', error)
    }
  }

  /**
   * Envía una notificación
  */
  async sendNotification(notification) {
    if (this.permission !== 'granted') return

    try {
      const options = {
        body: notification.body,
        icon: '/icons/logo-192x192.png',
        badge: '/icons/logo-72x72.png',
        tag: notification.tag,
        data: notification.data,
        requireInteraction: notification.requireInteraction || false,
        actions: [
          {
            action: 'study',
            title: '📚 Estudiar ahora'
          },
          {
            action: 'later',
            title: '⏰ Más tarde'
          }
        ]
      }

      const registration = await this.getServiceWorkerRegistration()

      if (registration?.showNotification) {
        await registration.showNotification(notification.title, options)
        console.log('🔔 Notification sent (SW):', notification.title)
        return
      }

      const notif = new Notification(notification.title, options)

      notif.onclick = () => {
        window.focus()
        // Navegar a la app si es posible
        if (window.location.pathname !== '/') {
          window.location.href = '/'
        }
        notif.close()
      }

      console.log('🔔 Notification sent:', notification.title)
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  async getServiceWorkerRegistration() {
    if (!this.isSupported || !('serviceWorker' in navigator)) return null

    if (!this.registrationPromise) {
      this.registrationPromise = navigator.serviceWorker.ready.catch(error => {
        console.warn('Service worker registration unavailable:', error)
        this.registrationPromise = null
        return null
      })
    }

    const registration = await this.registrationPromise
    if (!registration) {
      this.registrationPromise = null
    }

    return registration
  }

  /**
   * Configurar listeners de eventos
   */
  setupEventListeners() {
    if (this.listenersInitialized) return
    this.listenersInitialized = true

    // Listener para cuando el usuario practica (actualizar patrones)
    window.addEventListener('progress:srs-updated', () => {
      // Reanalizar patrones después de nueva actividad
      setTimeout(() => this.analyzeUserPatterns(), 1000)
    })

    // Listener para configurar notificaciones al final del día
    window.addEventListener('beforeunload', () => {
      this.scheduleSmartNotifications()
    })

    // Programar re-análisis diario
    const scheduleDaily = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 30, 0, 0) // 12:30 AM

      const timeUntilMidnight = tomorrow - now
      this.dailyTimerId = setTimeout(() => {
        this.analyzeUserPatterns()
        this.scheduleSmartNotifications()
        scheduleDaily() // Reprogramar para el siguiente día
      }, timeUntilMidnight)
    }

    scheduleDaily()
  }

  /**
   * Limpia todas las notificaciones programadas
   */
  clearScheduledNotifications() {
    this.scheduledNotifications.forEach((timeoutId) => {
      clearTimeout(timeoutId)
    })
    this.scheduledNotifications.clear()
  }

  /**
   * Obtiene un mensaje aleatorio de un array
   */
  getRandomMessage(messages) {
    return messages[Math.floor(Math.random() * messages.length)]
  }

  /**
   * Verifica si las notificaciones están habilitadas
   */
  isEnabled() {
    return this.isSupported && this.permission === 'granted'
  }

  /**
   * Obtiene estadísticas del sistema de notificaciones
   */
  getStats() {
    return {
      supported: this.isSupported,
      permission: this.permission,
      scheduledCount: this.scheduledNotifications.size,
      hasPatterns: !!this.userPatterns,
      patterns: this.userPatterns
    }
  }
}

// Instancia global del manager
export const smartNotifications = new SmartNotificationManager()

// API de conveniencia
export const requestNotificationPermission = () => smartNotifications.requestPermission()
export const scheduleSmartNotifications = () => smartNotifications.scheduleSmartNotifications()
export const isNotificationSupported = () => smartNotifications.isSupported
export const getNotificationStats = () => smartNotifications.getStats()

export default smartNotifications

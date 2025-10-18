// Social Sharing Features - Share achievements to social media
// Generates share links and shareable images for achievements

import { createLogger } from '../utils/logger.js'

const logger = createLogger('progress:socialSharing')

/**
 * Platform-specific share templates
 */
const SHARE_TEMPLATES = {
  twitter: {
    url: 'https://twitter.com/intent/tweet',
    params: (text, url) => ({
      text,
      url,
      hashtags: 'SpanishLearning,LanguageLearning'
    })
  },
  facebook: {
    url: 'https://www.facebook.com/sharer/sharer.php',
    params: (text, url) => ({
      u: url,
      quote: text
    })
  },
  whatsapp: {
    url: 'https://wa.me/',
    params: (text, url) => ({
      text: `${text} ${url}`
    })
  },
  linkedin: {
    url: 'https://www.linkedin.com/sharing/share-offsite/',
    params: (text, url) => ({
      url,
      title: text
    })
  }
}

/**
 * Achievement share message templates
 */
const ACHIEVEMENT_MESSAGES = {
  level_up: (data) => `¡Alcancé el nivel ${data.level} en Spanish Conjugator! 🎉`,
  streak: (data) => `¡${data.streak} días de racha aprendiendo español! 🔥`,
  xp_milestone: (data) => `¡Llegué a ${data.xp} XP en Spanish Conjugator! 💪`,
  accuracy: (data) => `¡${data.accuracy}% de precisión en mis conjugaciones! 🎯`,
  mastery: (data) => `¡Dominé ${data.tense} en ${data.mood}! ✨`,
  challenge_won: (data) => `¡Gané un desafío contra ${data.opponent}! 🏆`,
  leaderboard: (data) => `¡Estoy en el top ${data.rank} del leaderboard! 📊`
}

/**
 * Generate share link for a specific platform
 * @param {Object} achievement - Achievement data
 * @param {('twitter'|'facebook'|'whatsapp'|'linkedin')} platform - Platform to share to
 * @param {Object} options - Additional options
 * @returns {string} Share URL
 */
export function shareAchievement(achievement, platform = 'twitter', options = {}) {
  try {
    const {
      customMessage = null,
      includeStats = true,
      appUrl = 'https://verb-os.vercel.app'
    } = options

    // Get achievement message
    const messageGenerator = ACHIEVEMENT_MESSAGES[achievement.type] || (() => achievement.title)
    const baseMessage = customMessage || messageGenerator(achievement.data || {})

    // Add stats if requested
    let fullMessage = baseMessage
    if (includeStats && achievement.stats) {
      const statsText = formatStats(achievement.stats)
      fullMessage = `${baseMessage}\n${statsText}`
    }

    // Get platform config
    const platformConfig = SHARE_TEMPLATES[platform]
    if (!platformConfig) {
      logger.warn(`Unknown platform: ${platform}, defaulting to Twitter`)
      return shareAchievement(achievement, 'twitter', options)
    }

    // Build share URL
    const shareUrl = new URL(platformConfig.url)
    const params = platformConfig.params(fullMessage, appUrl)

    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        shareUrl.searchParams.set(key, value)
      }
    })

    logger.debug('Generated share link', { platform, url: shareUrl.toString() })
    return shareUrl.toString()
  } catch (error) {
    logger.error('Error generating share link:', error)
    return ''
  }
}

/**
 * Format stats for sharing
 */
function formatStats(stats) {
  const parts = []

  if (stats.xp) parts.push(`${stats.xp} XP`)
  if (stats.streak) parts.push(`${stats.streak} días de racha`)
  if (stats.accuracy) parts.push(`${stats.accuracy}% precisión`)
  if (stats.level) parts.push(`Nivel ${stats.level}`)

  return parts.length > 0 ? `📊 ${parts.join(' • ')}` : ''
}

/**
 * Generate shareable image for an achievement
 * Uses HTML5 Canvas to create an image
 * @param {Object} stats - User stats to display
 * @returns {Promise<string>} Data URI of generated image
 */
export async function generateShareableImage(stats) {
  try {
    // Check if we're in a browser environment
    if (typeof document === 'undefined' || typeof HTMLCanvasElement === 'undefined') {
      logger.warn('Canvas not available, skipping image generation')
      return null
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // Set canvas size (optimized for social media)
    canvas.width = 1200
    canvas.height = 630

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#667eea')
    gradient.addColorStop(1, '#764ba2')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // App title
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 48px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Spanish Conjugator', canvas.width / 2, 100)

    // Main achievement text
    ctx.font = 'bold 72px sans-serif'
    const achievementText = stats.achievementText || '¡Logro Desbloqueado!'
    ctx.fillText(achievementText, canvas.width / 2, 250)

    // Stats display
    const statsY = 380
    const statsSpacing = 120
    const statsToShow = [
      { icon: '⚡', label: 'XP', value: stats.xp || 0 },
      { icon: '🔥', label: 'Racha', value: stats.streak || 0 },
      { icon: '🎯', label: 'Precisión', value: `${stats.accuracy || 0}%` },
      { icon: '📚', label: 'Nivel', value: stats.level || 'A1' }
    ]

    statsToShow.forEach((stat, index) => {
      const x = (canvas.width / statsToShow.length) * (index + 0.5)

      // Icon
      ctx.font = '48px sans-serif'
      ctx.fillText(stat.icon, x, statsY)

      // Value
      ctx.font = 'bold 56px sans-serif'
      ctx.fillText(String(stat.value), x, statsY + 80)

      // Label
      ctx.font = '24px sans-serif'
      ctx.fillStyle = '#e0e0e0'
      ctx.fillText(stat.label, x, statsY + 120)
      ctx.fillStyle = '#ffffff'
    })

    // Footer
    ctx.font = '20px sans-serif'
    ctx.fillStyle = '#e0e0e0'
    ctx.fillText('verb-os.vercel.app', canvas.width / 2, 580)

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png')
    logger.debug('Generated shareable image', { size: dataUrl.length })

    return dataUrl
  } catch (error) {
    logger.error('Error generating shareable image:', error)
    return null
  }
}

/**
 * Open native share dialog (Web Share API)
 * Falls back to custom share if not supported
 * @param {Object} achievement - Achievement to share
 * @param {Object} options - Share options
 * @returns {Promise<boolean>} Success status
 */
export async function shareNative(achievement, options = {}) {
  try {
    // Check for Web Share API support
    if (typeof navigator === 'undefined' || !navigator.share) {
      logger.debug('Web Share API not supported, falling back to custom share')
      return false
    }

    const messageGenerator = ACHIEVEMENT_MESSAGES[achievement.type] || (() => achievement.title)
    const message = messageGenerator(achievement.data || {})

    const shareData = {
      title: 'Spanish Conjugator Achievement',
      text: message,
      url: options.appUrl || 'https://verb-os.vercel.app'
    }

    // Try to include image if available
    if (achievement.imageUrl) {
      const blob = await fetch(achievement.imageUrl).then(r => r.blob())
      const file = new File([blob], 'achievement.png', { type: 'image/png' })
      shareData.files = [file]
    }

    await navigator.share(shareData)
    logger.debug('Shared via Web Share API')
    return true
  } catch (error) {
    // User cancelled or error occurred
    logger.debug('Native share cancelled or failed:', error.message)
    return false
  }
}

/**
 * Download achievement image
 * @param {string} dataUrl - Data URL of image
 * @param {string} filename - Filename for download
 */
export function downloadImage(dataUrl, filename = 'achievement.png') {
  try {
    if (typeof document === 'undefined') {
      logger.warn('Document not available, cannot download')
      return
    }

    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    logger.debug('Downloaded achievement image', { filename })
  } catch (error) {
    logger.error('Error downloading image:', error)
  }
}

/**
 * Copy share link to clipboard
 * @param {string} shareUrl - URL to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(shareUrl) {
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      logger.warn('Clipboard API not available')
      return false
    }

    await navigator.clipboard.writeText(shareUrl)
    logger.debug('Copied to clipboard', { url: shareUrl })
    return true
  } catch (error) {
    logger.error('Error copying to clipboard:', error)
    return false
  }
}

/**
 * Get all available share platforms
 * @returns {Array} Platform configurations
 */
export function getAvailablePlatforms() {
  return [
    { id: 'twitter', name: 'Twitter', icon: '🐦', color: '#1DA1F2' },
    { id: 'facebook', name: 'Facebook', icon: '👤', color: '#4267B2' },
    { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: '#25D366' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0077B5' }
  ]
}

/**
 * Track share event for analytics
 * @param {string} platform - Platform shared to
 * @param {string} achievementType - Type of achievement
 */
export function trackShare(platform, achievementType) {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'share', {
        method: platform,
        content_type: 'achievement',
        content_id: achievementType
      })
    }
    logger.debug('Tracked share event', { platform, achievementType })
  } catch (error) {
    logger.error('Error tracking share:', error)
  }
}

export default {
  shareAchievement,
  generateShareableImage,
  shareNative,
  downloadImage,
  copyToClipboard,
  getAvailablePlatforms,
  trackShare
}

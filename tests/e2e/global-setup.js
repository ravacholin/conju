import { chromium } from '@playwright/test'

/**
 * Global setup for Playwright tests
 * Runs once before all test files
 */
async function globalSetup() {
  console.log('🚀 Starting global test setup...')

  // Launch browser for setup
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Navigate to app and wait for it to be ready
    await page.goto(process.env.BASE_URL || 'http://localhost:4173')

    // Wait for app to be fully loaded
    await page.waitForSelector('[data-testid="app-ready"]', { timeout: 30000 })
      .catch(() => {
        // Fallback: wait for main content
        return page.waitForSelector('main', { timeout: 10000 })
      })

    // Clear any existing data
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('spanish-conjugator')
      }
    })

    console.log('✅ App is ready for testing')

    // Store authentication state if needed
    await context.storageState({
      path: 'tests/e2e/.auth/user.json'
    })

  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await context.close()
    await browser.close()
  }

  console.log('✅ Global setup completed')
}

export default globalSetup
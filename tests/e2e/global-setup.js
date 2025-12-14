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
    await page.goto(process.env.BASE_URL || 'http://localhost:4173', { waitUntil: 'domcontentloaded' })

    // Clear any existing data (requires an origin)
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('spanish-conjugator')
      }
    })

    // Seed minimal settings so routes like /drill work without first-run onboarding clicks.
    await page.evaluate(() => {
      const key = 'spanish-conjugator-settings'
      const next = {
        state: {
          region: 'la_general',
          useTuteo: true,
          useVoseo: false,
          useVosotros: false,
          strict: true,
          practicePronoun: 'mixed',
          level: 'A1',
          practiceMode: 'mixed'
        },
        version: 0
      }
      localStorage.setItem(key, JSON.stringify(next))
    })

    // Reload to ensure the app starts from a clean state
    await page.reload({ waitUntil: 'domcontentloaded' })

    // Wait for React to mount something into #root
    await page.waitForSelector('#root > *', { timeout: 30000 })

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

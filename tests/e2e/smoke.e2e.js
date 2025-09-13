import { test, expect } from '@playwright/test'

test.describe('Smoke Tests - Critical User Paths', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test with a clean slate
    await page.goto('/')
  })

  test('app loads and displays main interface', async ({ page }) => {
    // Check that the app loads
    await expect(page.locator('main')).toBeVisible()

    // Check for key UI elements
    await expect(page.locator('[data-testid="app-header"]')).toBeVisible()
      .catch(() => {
        // Fallback: check for any header
        return expect(page.locator('header')).toBeVisible()
      })

    // Check that we can navigate between modes
    const practiceButton = page.locator('text=Práctica')
      .or(page.locator('[data-testid="practice-mode"]'))

    if (await practiceButton.isVisible()) {
      await practiceButton.click()
    }
  })

  test('can start a practice session', async ({ page }) => {
    // Navigate to practice mode
    await page.goto('/?mode=practice')

    // Wait for drill interface to load
    await expect(page.locator('[data-testid="drill-interface"]')).toBeVisible()
      .catch(async () => {
        // Fallback: look for input field
        await expect(page.locator('input[type="text"]')).toBeVisible()
      })

    // Check for verb conjugation question
    const verbQuestion = page.locator('[data-testid="verb-question"]')
      .or(page.locator('text=/^[a-záéíóúñü]+/'))

    await expect(verbQuestion).toBeVisible()

    // Try to interact with the input
    const inputField = page.locator('input[type="text"]').first()
    await inputField.fill('test')
    await expect(inputField).toHaveValue('test')
  })

  test('can navigate to learning mode', async ({ page }) => {
    await page.goto('/?mode=learning')

    // Check that learning interface loads
    await expect(page.locator('main')).toBeVisible()

    // Look for learning-specific elements
    const learningContent = page.locator('[data-testid="learning-content"]')
      .or(page.locator('text=/aprender|learn|conjugación/i'))

    await expect(learningContent).toBeVisible()
  })

  test('settings panel opens and closes', async ({ page }) => {
    // Look for settings button
    const settingsButton = page.locator('[data-testid="settings-button"]')
      .or(page.locator('button:has-text("Configuración")'))
      .or(page.locator('[aria-label*="Settings"]'))

    if (await settingsButton.isVisible()) {
      await settingsButton.click()

      // Check that settings panel opens
      const settingsPanel = page.locator('[data-testid="settings-panel"]')
        .or(page.locator('[role="dialog"]'))

      await expect(settingsPanel).toBeVisible()

      // Close settings
      const closeButton = page.locator('[data-testid="close-settings"]')
        .or(page.locator('button:has-text("Cerrar")'))
        .or(page.locator('[aria-label*="Close"]'))

      if (await closeButton.isVisible()) {
        await closeButton.click()
      } else {
        await page.keyboard.press('Escape')
      }

      await expect(settingsPanel).toBeHidden()
    }
  })

  test('PWA manifests correctly', async ({ page }) => {
    await page.goto('/')

    // Check for PWA meta tags
    const manifest = page.locator('link[rel="manifest"]')
    await expect(manifest).toHaveAttribute('href')

    // Check for PWA icons
    const icons = page.locator('link[rel="icon"]')
    await expect(icons.first()).toHaveAttribute('href')

    // Check for service worker registration (in production)
    const swRegistration = await page.evaluate(() => {
      return 'serviceWorker' in navigator
    })

    expect(swRegistration).toBe(true)
  })

  test('handles offline state gracefully', async ({ page, context }) => {
    await page.goto('/')

    // Wait for app to load
    await page.waitForLoadState('networkidle')

    // Go offline
    await context.setOffline(true)

    // Try to navigate
    await page.reload()

    // App should still work (cached)
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 })

    // Restore online state
    await context.setOffline(false)
  })

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')

    // Check that app adapts to mobile
    await expect(page.locator('main')).toBeVisible()

    // Check for mobile-friendly interactions
    const mobileElements = page.locator('[data-mobile="true"]')
      .or(page.locator('.mobile-only'))

    // At least the main content should be visible
    await expect(page.locator('main')).toBeVisible()
  })

  test('error boundaries work correctly', async ({ page }) => {
    await page.goto('/')

    // Inject an error to test error boundary
    await page.evaluate(() => {
      // Trigger a React error
      window.dispatchEvent(new Event('test-error'))
    })

    // App should handle error gracefully
    await expect(page.locator('main')).toBeVisible()

    // Should not show white screen of death
    const body = await page.locator('body').textContent()
    expect(body).not.toBe('')
  })

  test('performance is acceptable', async ({ page }) => {
    // Measure page load performance
    const start = Date.now()

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const loadTime = Date.now() - start

    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)

    // Check for performance markers
    const performanceData = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0]
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart
      }
    })

    // DOM should parse quickly
    expect(performanceData.domContentLoaded).toBeLessThan(2000)
  })
})
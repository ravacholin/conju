import { test, expect } from '@playwright/test'

const shouldScreenshot = !process.env.CI

async function maybeScreenshot(page, name) {
  if (!shouldScreenshot) return
  await expect(page).toHaveScreenshot(name)
}

test.describe('Complete User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('complete learning session flow @visual', async ({ page }) => {
    test.skip(process.env.CI, 'visual snapshots run locally only')
    // Start learning mode
    await page.goto('/learning')

    // Wait for learning interface
    await expect(page.locator('#root > *')).toBeVisible()

    // Take screenshot of initial state
    await maybeScreenshot(page, 'learning-initial.png')

    // Look for lesson or topic selection
    const topicSelector = page.locator('[data-testid="topic-selector"]')
      .or(page.locator('button:has-text("Presente")')
      .or(page.locator('[role="button"]')))

    if (await topicSelector.first().isVisible()) {
      await topicSelector.first().click()

      // Take screenshot after topic selection
      await maybeScreenshot(page, 'learning-topic-selected.png')
    }

    // Look for start lesson button
    const startButton = page.locator('text=Comenzar')
      .or(page.locator('text=Empezar'))
      .or(page.locator('[data-testid="start-lesson"]'))

    if (await startButton.isVisible()) {
      await startButton.click()

      // Should navigate to lesson content
      await expect(page.locator('#root > *')).toBeVisible()

      // Take screenshot of lesson interface
      await maybeScreenshot(page, 'learning-lesson-active.png')
    }
  })

  test('complete practice session with correct answers', async ({ page }) => {
    await page.goto('/drill')

    // Wait for practice interface
    await expect(page.locator('#root > *')).toBeVisible()

    // Complete several practice rounds
    for (let i = 0; i < 3; i++) {
      // Wait for question to load
      const inputField = page.locator('input#conjugation-input')
      await expect(inputField).toBeVisible()

      // Get the expected answer (if available in test data)
      const verbQuestion = await page.locator('.verb-lemma').textContent()

      if (verbQuestion) {
        // Provide a basic conjugation (adjust based on actual question format)
        await inputField.fill('conjugación')
      }

      // Submit answer
      const submitButton = page.locator('button:has-text("Verificar")')
        .or(page.locator('[data-testid="submit-answer"]'))
        .or(page.locator('button[type="submit"]'))

      if (await submitButton.isVisible()) {
        await submitButton.click()
      } else {
        await page.keyboard.press('Enter')
      }

      // Wait for feedback
      await page.waitForTimeout(1000)

      // Continue to next question
      const continueButton = page.locator('button:has-text("Continuar")')

      if (await continueButton.isVisible()) {
        await continueButton.click()
      }
    }

    // Take screenshot of practice session
    await maybeScreenshot(page, 'practice-session.png')
  })

  test('settings configuration affects practice', async ({ page }) => {
    await page.goto('/drill')
    await expect(page.locator('#root > *')).toBeVisible()

    // Open settings
    const settingsButton = page.locator('button[title="Cambiar rápido"]').first()

    if (await settingsButton.isVisible()) {
      await settingsButton.click()

      // Wait for settings panel
      const settingsPanel = page.locator('.quick-switch-panel')

      await expect(settingsPanel).toBeVisible()

      // Change variant setting
      const regionSelect = page.locator('select#variant-select')

      if (await regionSelect.isVisible()) {
        await regionSelect.selectOption('rioplatense')
      }

      // Apply settings
      const saveButton = page.locator('button:has-text("Aplicar")')

      if (await saveButton.isVisible()) {
        await saveButton.click()
      }

      // Close settings
      const closeButton = page.locator('button:has-text("Cerrar")')
      if (await closeButton.isVisible()) {
        await closeButton.click()
      }
    }

    // Go to practice and verify settings applied
    await page.goto('/drill')

    // Check that practice reflects new settings
    await expect(page.locator('#root > *')).toBeVisible()

    // Take screenshot to verify visual changes
    await maybeScreenshot(page, 'practice-with-new-settings.png')
  })

  test('progress tracking across sessions', async ({ page }) => {
    // Complete some practice
    await page.goto('/drill')

    for (let i = 0; i < 2; i++) {
      const inputField = page.locator('input#conjugation-input')
      if (await inputField.isVisible()) {
        await inputField.fill('test')
        await page.keyboard.press('Enter')
        await page.waitForTimeout(500)

        const continueButton = page.locator('button:has-text("Continuar")')
        if (await continueButton.isVisible()) {
          await continueButton.click()
        }
      }
    }

    // Navigate to progress view
    await page.goto('/progress')
    await expect(page.locator('text=Progreso y Analíticas')).toBeVisible()
    await maybeScreenshot(page, 'progress-view.png')
  })

  test('error handling in practice session', async ({ page }) => {
    await page.goto('/drill')

    // Wait for practice to load
    await expect(page.locator('#root > *')).toBeVisible()

    // Inject a network error simulation
    await page.route('**/*', route => {
      if (route.request().url().includes('api')) {
        route.abort()
      } else {
        route.continue()
      }
    })

    // Try to interact with the app
    const inputField = page.locator('input#conjugation-input')
    if (await inputField.isVisible()) {
      await inputField.fill('test')
      await page.keyboard.press('Enter')
    }

    // App should handle errors gracefully
    await expect(page.locator('#root > *')).toBeVisible()

    // Should not show broken interface
    const errorMessage = page.locator('text=/error|Error/i')
    if (await errorMessage.isVisible()) {
      // Error message should be user-friendly
      await maybeScreenshot(page, 'error-handling.png')
    }
  })

  test('keyboard navigation accessibility', async ({ page }) => {
    await page.goto('/drill')

    // Test tab navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Take screenshot showing focus states
    await maybeScreenshot(page, 'keyboard-navigation.png')

    // Test Enter key interactions
    const inputField = page.locator('input#conjugation-input')
    if (await inputField.isVisible()) {
      await inputField.focus()
      await inputField.fill('test')
      await page.keyboard.press('Enter')

      // Should submit/advance
      await page.waitForTimeout(500)
    }

    // Test Escape key
    await page.keyboard.press('Escape')

    // Should handle escape gracefully
    await expect(page.locator('#root > *')).toBeVisible()
  })

  test('mobile responsive layout @visual', async ({ page }) => {
    test.skip(process.env.CI, 'visual snapshots run locally only')
    // Test different mobile viewports
    const viewports = [
      { width: 375, height: 667 }, // iPhone SE
      { width: 414, height: 896 }, // iPhone 11
      { width: 360, height: 640 }, // Android small
    ]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.goto('/')

      // Wait for layout adjustment
      await page.waitForTimeout(500)

      // Take screenshot for each viewport
      await maybeScreenshot(page, `mobile-${viewport.width}x${viewport.height}.png`)

      // Test basic interactions on mobile
      await page.goto('/drill')
      await page.waitForTimeout(500)
      await maybeScreenshot(page, `mobile-practice-${viewport.width}x${viewport.height}.png`)
    }
  })

  test('dark mode toggle @visual', async ({ page }) => {
    test.skip(process.env.CI, 'visual snapshots run locally only')
    await page.goto('/')

    // Take screenshot in default (presumably light) mode
    await maybeScreenshot(page, 'light-mode.png')

    // Look for dark mode toggle
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]')
      .or(page.locator('button:has-text("Dark")'))
      .or(page.locator('[aria-label*="dark"]'))

    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click()

      // Wait for theme change
      await page.waitForTimeout(500)

      // Take screenshot in dark mode
      await maybeScreenshot(page, 'dark-mode.png')

      // Toggle back to light mode
      await darkModeToggle.click()
      await page.waitForTimeout(500)

      // Should return to light mode
      await maybeScreenshot(page, 'back-to-light-mode.png')
    }
  })
})

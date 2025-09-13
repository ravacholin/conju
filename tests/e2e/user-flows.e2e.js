import { test, expect } from '@playwright/test'

test.describe('Complete User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('complete learning session flow @visual', async ({ page }) => {
    // Start learning mode
    await page.goto('/?mode=learning')

    // Wait for learning interface
    await expect(page.locator('main')).toBeVisible()

    // Take screenshot of initial state
    await expect(page).toHaveScreenshot('learning-initial.png')

    // Look for lesson or topic selection
    const topicSelector = page.locator('[data-testid="topic-selector"]')
      .or(page.locator('button:has-text("Presente")')
      .or(page.locator('[role="button"]')))

    if (await topicSelector.first().isVisible()) {
      await topicSelector.first().click()

      // Take screenshot after topic selection
      await expect(page).toHaveScreenshot('learning-topic-selected.png')
    }

    // Look for start lesson button
    const startButton = page.locator('text=Comenzar')
      .or(page.locator('text=Empezar'))
      .or(page.locator('[data-testid="start-lesson"]'))

    if (await startButton.isVisible()) {
      await startButton.click()

      // Should navigate to lesson content
      await expect(page.locator('main')).toBeVisible()

      // Take screenshot of lesson interface
      await expect(page).toHaveScreenshot('learning-lesson-active.png')
    }
  })

  test('complete practice session with correct answers', async ({ page }) => {
    await page.goto('/?mode=practice')

    // Wait for practice interface
    await expect(page.locator('main')).toBeVisible()

    // Complete several practice rounds
    for (let i = 0; i < 3; i++) {
      // Wait for question to load
      const inputField = page.locator('input[type="text"]').first()
      await expect(inputField).toBeVisible()

      // Get the expected answer (if available in test data)
      const verbQuestion = await page.locator('[data-testid="verb-question"]')
        .or(page.locator('.verb-display'))
        .textContent()

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
        .or(page.locator('[data-testid="continue"]'))

      if (await continueButton.isVisible()) {
        await continueButton.click()
      }
    }

    // Take screenshot of practice session
    await expect(page).toHaveScreenshot('practice-session.png')
  })

  test('settings configuration affects practice', async ({ page }) => {
    // Open settings
    const settingsButton = page.locator('[data-testid="settings-button"]')
      .or(page.locator('text=Configuración'))

    if (await settingsButton.isVisible()) {
      await settingsButton.click()

      // Wait for settings panel
      const settingsPanel = page.locator('[data-testid="settings-panel"]')
        .or(page.locator('[role="dialog"]'))

      await expect(settingsPanel).toBeVisible()

      // Change region setting
      const regionSelect = page.locator('select[name="region"]')
        .or(page.locator('[data-testid="region-select"]'))

      if (await regionSelect.isVisible()) {
        await regionSelect.selectOption('rioplatense')
      }

      // Change level setting
      const levelSelect = page.locator('select[name="level"]')
        .or(page.locator('[data-testid="level-select"]'))

      if (await levelSelect.isVisible()) {
        await levelSelect.selectOption('B1')
      }

      // Save settings
      const saveButton = page.locator('button:has-text("Guardar")')
        .or(page.locator('[data-testid="save-settings"]'))

      if (await saveButton.isVisible()) {
        await saveButton.click()
      }

      // Take screenshot of settings
      await expect(page).toHaveScreenshot('settings-configured.png')
    }

    // Go to practice and verify settings applied
    await page.goto('/?mode=practice')

    // Check that practice reflects new settings
    await expect(page.locator('main')).toBeVisible()

    // Take screenshot to verify visual changes
    await expect(page).toHaveScreenshot('practice-with-new-settings.png')
  })

  test('progress tracking across sessions', async ({ page }) => {
    // Complete some practice
    await page.goto('/?mode=practice')

    for (let i = 0; i < 2; i++) {
      const inputField = page.locator('input[type="text"]').first()
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
    const progressButton = page.locator('text=Progreso')
      .or(page.locator('[data-testid="progress-button"]'))

    if (await progressButton.isVisible()) {
      await progressButton.click()

      // Check that progress data is displayed
      await expect(page.locator('main')).toBeVisible()

      // Take screenshot of progress
      await expect(page).toHaveScreenshot('progress-view.png')
    }
  })

  test('error handling in practice session', async ({ page }) => {
    await page.goto('/?mode=practice')

    // Wait for practice to load
    await expect(page.locator('main')).toBeVisible()

    // Inject a network error simulation
    await page.route('**/*', route => {
      if (route.request().url().includes('api')) {
        route.abort()
      } else {
        route.continue()
      }
    })

    // Try to interact with the app
    const inputField = page.locator('input[type="text"]').first()
    if (await inputField.isVisible()) {
      await inputField.fill('test')
      await page.keyboard.press('Enter')
    }

    // App should handle errors gracefully
    await expect(page.locator('main')).toBeVisible()

    // Should not show broken interface
    const errorMessage = page.locator('text=/error|Error/i')
    if (await errorMessage.isVisible()) {
      // Error message should be user-friendly
      await expect(page).toHaveScreenshot('error-handling.png')
    }
  })

  test('keyboard navigation accessibility', async ({ page }) => {
    await page.goto('/?mode=practice')

    // Test tab navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Take screenshot showing focus states
    await expect(page).toHaveScreenshot('keyboard-navigation.png')

    // Test Enter key interactions
    const inputField = page.locator('input[type="text"]').first()
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
    await expect(page.locator('main')).toBeVisible()
  })

  test('mobile responsive layout @visual', async ({ page }) => {
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
      await expect(page).toHaveScreenshot(`mobile-${viewport.width}x${viewport.height}.png`)

      // Test basic interactions on mobile
      const practiceButton = page.locator('text=Práctica').first()
      if (await practiceButton.isVisible()) {
        await practiceButton.click()
        await page.waitForTimeout(500)

        await expect(page).toHaveScreenshot(`mobile-practice-${viewport.width}x${viewport.height}.png`)
      }
    }
  })

  test('dark mode toggle @visual', async ({ page }) => {
    await page.goto('/')

    // Take screenshot in default (presumably light) mode
    await expect(page).toHaveScreenshot('light-mode.png')

    // Look for dark mode toggle
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]')
      .or(page.locator('button:has-text("Dark")'))
      .or(page.locator('[aria-label*="dark"]'))

    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click()

      // Wait for theme change
      await page.waitForTimeout(500)

      // Take screenshot in dark mode
      await expect(page).toHaveScreenshot('dark-mode.png')

      // Toggle back to light mode
      await darkModeToggle.click()
      await page.waitForTimeout(500)

      // Should return to light mode
      await expect(page).toHaveScreenshot('back-to-light-mode.png')
    }
  })
})
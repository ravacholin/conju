import { test, expect } from '@playwright/test'

async function clickFirstOnboardingOption(page) {
  const option = page.locator('.options-grid [role="button"]').first()
  if ((await option.count()) === 0) {
    return false
  }
  if (!(await option.isVisible())) {
    return false
  }
  await option.click()
  return true
}

async function resetClientState(page) {
  await page.goto('/')
  await page.evaluate(async () => {
    localStorage.clear()
    sessionStorage.clear()

    if (typeof indexedDB === 'undefined' || typeof indexedDB.databases !== 'function') {
      return
    }

    const databases = await indexedDB.databases()
    await Promise.all(
      databases.map((db) => {
        if (!db.name) return Promise.resolve()
        return new Promise((resolve) => {
          const request = indexedDB.deleteDatabase(db.name)
          request.onsuccess = () => resolve()
          request.onerror = () => resolve()
          request.onblocked = () => resolve()
        })
      })
    )
  })
}

test.describe('Critical navigation flows', () => {
  test('onboarding end-to-end reaches drill', async ({ page }) => {
    await resetClientState(page)
    await page.goto('/onboarding/1')
    const drillInput = page.locator('input#conjugation-input')

    if (!(await drillInput.isVisible())) {
      await expect(page.locator('.onboarding')).toBeVisible()

      for (let step = 0; step < 7; step += 1) {
        if (await drillInput.isVisible()) {
          break
        }
        const clicked = await clickFirstOnboardingOption(page)
        if (!clicked) {
          break
        }
      }
    }

    await expect(page).toHaveURL(/\/drill(?:$|\?)/)
    await expect(drillInput).toBeVisible()
  })

  test('browser back/forward works during onboarding', async ({ page }) => {
    await page.goto('/onboarding/1')
    await expect(page.locator('.onboarding')).toBeVisible()

    expect(await clickFirstOnboardingOption(page)).toBe(true)
    const step2Url = page.url()

    expect(await clickFirstOnboardingOption(page)).toBe(true)
    const step3Url = page.url()

    expect(step2Url).not.toBe(step3Url)

    await page.goBack()
    await expect(page).toHaveURL(step2Url)

    await page.goForward()
    await expect(page).toHaveURL(step3Url)
  })

  test('can enter drill, go to progress, and return', async ({ page }) => {
    await page.goto('/drill')
    await expect(page.locator('input#conjugation-input')).toBeVisible()

    await page.goto('/progress')
    await expect(page.getByText(/Progreso y Analíticas/i)).toBeVisible()

    await page.goBack()
    await expect(page).toHaveURL(/\/drill(?:$|\?)/)
    await expect(page.locator('input#conjugation-input')).toBeVisible()

    await page.goForward()
    await expect(page).toHaveURL(/\/progress(?:$|\?)/)
    await expect(page.getByText(/Progreso y Analíticas/i)).toBeVisible()
  })

  test('normalizes legacy and non-canonical urls', async ({ page }) => {
    await page.goto('/?mode=progress')
    await expect(page).toHaveURL(/\/progress$/)

    await page.goto('/drill/3')
    await expect(page.locator('input#conjugation-input')).toBeVisible()
    const state = await page.evaluate(() => window.history.state)
    expect(state?.appNav).toBe(true)
    expect(state?.mode).toBe('drill')
    expect(state?.step).toBeNull()
  })
})

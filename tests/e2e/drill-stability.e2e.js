import { test, expect } from '@playwright/test'

/**
 * Regression cover for "the drill reloads itself right after showing an exercise".
 *
 * Each exercise used to be painted twice: once at full opacity, still carrying the
 * previous answer's feedback and the text the user had typed, and then again from
 * opacity 0 once the per-item state reset finally ran. On a phone the gap between
 * those two paints is wide enough to read as the whole screen reloading itself.
 * The CPU is throttled here (chromium only) to keep that gap observable.
 *
 * The companion defect — a second generation replacing the exercise about a second
 * after it appeared — is covered deterministically in
 * src/hooks/useDrillMode.generation-window.test.js, since it is a state-machine
 * race rather than something a browser test can provoke on demand. The "exercise is
 * not replaced" assertion below is the end-to-end smoke guard for it.
 *
 * A third defect hid from both of those for two releases, because the DOM state this
 * file records looks perfectly healthy while it happens: the exercise never changes
 * and the `fade-in` class is added and removed exactly when it should be. The card
 * was simply animating *twice* — `vdLiftIn` on arrival, then `fadeIn` restarting
 * 500ms later when the class came off and a bare `.drill-container` rule in App.css
 * took over as the fallback. Same verb, same person, but the whole card dropped back
 * to opacity 0.04 and faded in again, on every single exercise. Watching classes
 * cannot see that; only the animations themselves can, hence OBSERVE_ANIMATIONS.
 */

const OBSERVE_ANIMATIONS = () => {
  window.__drillAnimations = []
  document.addEventListener(
    'animationstart',
    (event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (!target.classList.contains('drill-container')) return
      window.__drillAnimations.push({
        t: Math.round(performance.now()),
        name: event.animationName,
        lemma: document.querySelector('.verb-lemma')?.textContent || null
      })
    },
    true
  )
}

const OBSERVE_DRILL = () => {
  window.__drillStates = []
  const read = () => {
    const container = document.querySelector('.drill-container')
    if (!container) return null
    return {
      t: Math.round(performance.now()),
      lemma: document.querySelector('.verb-lemma')?.textContent || null,
      person: document.querySelector('.person-display')?.textContent || null,
      fadeIn: container.classList.contains('fade-in'),
      hasResult: !!document.querySelector('.result'),
      input: document.querySelector('#conjugation-input')?.value ?? ''
    }
  }

  let last = null
  const record = () => {
    const state = read()
    if (!state) return
    const key = JSON.stringify({ ...state, t: undefined })
    if (key === last) return
    last = key
    window.__drillStates.push(state)
  }

  const start = () => {
    new MutationObserver(record).observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true
    })
    record()
  }

  // The init script runs before <body> exists on a fresh navigation.
  if (document.body) start()
  else document.addEventListener('DOMContentLoaded', start)
}

async function throttleCpu(page, browserName, rate) {
  if (browserName !== 'chromium') return
  const client = await page.context().newCDPSession(page)
  await client.send('Emulation.setCPUThrottlingRate', { rate })
}

async function readDrillStates(page) {
  const states = await page.evaluate(() => window.__drillStates || [])
  // Guard against the observer silently failing to install, which would make every
  // assertion below pass vacuously.
  expect(states.length, 'no drill states were recorded').toBeGreaterThan(0)
  return states
}

/** The states in which each distinct exercise was first rendered. */
function firstStatePerExercise(states) {
  const firsts = []
  let previousLemma = null

  for (const state of states) {
    if (!state.lemma) continue
    if (state.lemma !== previousLemma) {
      previousLemma = state.lemma
      firsts.push(state)
    }
  }

  return firsts
}

/**
 * Every exercise must run exactly one entrance animation. A second one on the same
 * exercise is the card visibly reloading itself with identical content.
 */
async function expectOneAnimationPerExercise(page) {
  const animations = await page.evaluate(() => window.__drillAnimations || [])

  expect(
    animations.length,
    'no drill animations were recorded, so this assertion would pass vacuously'
  ).toBeGreaterThan(0)

  const byExercise = new Map()
  for (const animation of animations) {
    const list = byExercise.get(animation.lemma) || []
    list.push(animation.name)
    byExercise.set(animation.lemma, list)
  }

  const repeated = [...byExercise.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([lemma, names]) => `${lemma}: ${names.join(' → ')}`)

  expect(
    repeated,
    'an exercise animated more than once, so the card faded in again with the same content'
  ).toEqual([])
}

function expectNoLateFadeIn(states) {
  expect(
    firstStatePerExercise(states).filter((state) => !state.fadeIn),
    'an exercise was painted before its entrance animation was applied, so it appeared and then faded in again'
  ).toEqual([])
}

test.describe('Drill stability', () => {
  // CPU throttling stretches item generation well past the default per-test budget.
  test.setTimeout(120000)

  test('the first exercise is not replaced on its own', async ({ page, browserName }) => {
    await throttleCpu(page, browserName, 6)
    await page.addInitScript(OBSERVE_DRILL)
    await page.addInitScript(OBSERVE_ANIMATIONS)
    await page.goto('/drill')

    const lemma = page.locator('.verb-lemma')
    await expect(lemma).toBeVisible({ timeout: 60000 })
    const firstExercise = await lemma.textContent()
    const firstPerson = await page.locator('.person-display').textContent()

    // The competing generation used to land ~1.2s after the first item.
    await page.waitForTimeout(4000)

    expect(await lemma.textContent()).toBe(firstExercise)
    expect(await page.locator('.person-display').textContent()).toBe(firstPerson)

    expectNoLateFadeIn(await readDrillStates(page))
    await expectOneAnimationPerExercise(page)
  })

  test('advancing to the next exercise does not flash the previous answer', async ({ page, browserName }) => {
    await throttleCpu(page, browserName, 6)
    await page.addInitScript(OBSERVE_DRILL)
    await page.addInitScript(OBSERVE_ANIMATIONS)
    await page.goto('/drill')

    const input = page.locator('input#conjugation-input')
    await expect(input).toBeVisible({ timeout: 60000 })

    for (let round = 0; round < 3; round += 1) {
      await input.fill('zzz')
      await page.locator('.action-buttons .btn').click()
      await expect(page.locator('.result')).toBeVisible()
      await page.locator('.action-buttons .btn').click()
      await expect(page.locator('.result')).toBeHidden()
      await page.waitForTimeout(1500)
    }

    const states = await readDrillStates(page)

    // No frame may show a freshly generated exercise still wearing the previous
    // answer's feedback or the text the user typed for it.
    expect(
      firstStatePerExercise(states).filter((state) => state.hasResult || state.input !== ''),
      'a new exercise was painted with the previous answer still on screen'
    ).toEqual([])

    expectNoLateFadeIn(states)
    await expectOneAnimationPerExercise(page)
  })
})

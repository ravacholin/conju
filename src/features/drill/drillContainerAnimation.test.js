/**
 * Guard against the drill card animating twice per exercise.
 *
 * `Drill.jsx` renders `<div className={`drill-container ${showAnimation ? 'fade-in' : ''}`}>`
 * and drops the `fade-in` class 500ms after each exercise arrives. The entrance
 * animation is supposed to come exclusively from `.verbos-drill .fade-in`
 * (`vdLiftIn`, in DrillVerbos.css).
 *
 * The bug this covers: App.css also declared `animation: fadeIn 0.3s ease` on a
 * bare `.drill-container` selector. That rule is less specific, so it lost while
 * `fade-in` was on — but the moment the class came off, the element fell back to
 * it, `animation-name` flipped `vdLiftIn` → `fadeIn`, and the browser *restarted*
 * the animation. Every exercise faded in a second time half a second after it
 * appeared, with identical content, which users read as the drill spontaneously
 * reloading itself. Measured on the production build: two `animationstart` events
 * per exercise, the second dropping the card back to opacity 0.04.
 *
 * The invariant: nothing may declare a running `animation` on a selector that
 * matches the drill container by itself, because any such rule becomes the
 * fallback that restarts when `fade-in` is toggled off. The entrance animation
 * belongs on the toggled class only.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const CSS_FILES = [
  'src/App.css',
  'src/index.css',
  'src/components/drill/DrillVerbos.css'
]

// Vitest runs with the repo root as cwd (vitest.config.js lives there).
const repoPath = (relative) => path.resolve(process.cwd(), relative)

/** Strip comments, then pull out every innermost `selectors { declarations }` block. */
function parseRules(css) {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const rules = []
  // `[^{}]` cannot cross a brace, so this only ever matches blocks whose body has
  // no nested block — i.e. real declaration blocks, including ones inside @media.
  const blockPattern = /([^{}]+)\{([^{}]*)\}/g
  let match
  while ((match = blockPattern.exec(withoutComments)) !== null) {
    rules.push({
      selectors: match[1].split(',').map((s) => s.trim()).filter(Boolean),
      declarations: match[2]
    })
  }
  return rules
}

/** Does this selector match a `.drill-container` that is NOT wearing `fade-in`? */
function targetsBareDrillContainer(selector) {
  if (!selector.includes('.drill-container')) return false
  // A rule that requires `fade-in` only applies while the class is on, so it can
  // never be the fallback that restarts when the class is removed.
  if (selector.includes('.fade-in')) return false
  // Pseudo-element rules paint a separate box and do not carry the card's animation.
  if (selector.includes('::')) return false
  return true
}

/** `animation: none` / `animation-name: none` stop animations; they never start one. */
function declaresRunningAnimation(declarations) {
  const found = declarations.match(/(?:^|;)\s*animation(?:-name)?\s*:([^;]*)/gi)
  if (!found) return null
  const running = found
    .map((d) => d.replace(/^[;\s]*animation(?:-name)?\s*:/i, '').trim())
    .filter((value) => !/^none\b/i.test(value.replace(/!important/i, '').trim()))
  return running.length > 0 ? running : null
}

describe('drill container entrance animation', () => {
  const parsed = CSS_FILES.map((file) => ({
    file,
    rules: parseRules(readFileSync(repoPath(file), 'utf8'))
  }))

  it('parses the stylesheets it is supposed to guard', () => {
    // Without this the assertions below could pass simply by finding nothing.
    for (const { file, rules } of parsed) {
      expect(rules.length, `${file} produced no CSS rules`).toBeGreaterThan(0)
    }
  })

  it('is declared only on the toggled .fade-in class, never on .drill-container itself', () => {
    const offenders = []

    for (const { file, rules } of parsed) {
      for (const rule of rules) {
        const selectors = rule.selectors.filter(targetsBareDrillContainer)
        if (selectors.length === 0) continue

        const running = declaresRunningAnimation(rule.declarations)
        if (running) {
          offenders.push(`${file}: "${selectors.join(', ')}" declares animation: ${running.join(' / ')}`)
        }
      }
    }

    expect(
      offenders,
      'a rule matching a bare .drill-container declares an animation; when Drill.jsx removes ' +
        'the `fade-in` class 500ms after each exercise, animation-name flips to this one and the ' +
        'browser restarts it, so the same exercise fades in twice and looks like a spontaneous reload'
    ).toEqual([])
  })

  it('still gives the drill card its entrance animation via .verbos-drill .fade-in', () => {
    const drillCss = parsed.find((entry) => entry.file.endsWith('DrillVerbos.css'))
    const fadeInRule = drillCss.rules.find((rule) =>
      rule.selectors.some((s) => s.includes('.fade-in'))
    )

    expect(fadeInRule, 'the drill entrance animation rule disappeared').toBeTruthy()
    expect(declaresRunningAnimation(fadeInRule.declarations)).toBeTruthy()
  })
})

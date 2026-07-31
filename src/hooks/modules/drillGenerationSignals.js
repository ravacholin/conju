/**
 * drillGenerationSignals.js - Shared markers for drill generation outcomes
 *
 * `generateNextItem` used to return `null` both when generation genuinely failed
 * and when a previous generation was still in flight. Callers cannot tell those
 * apart, so a concurrent call would be treated as a failure and replaced with an
 * emergency fallback item, producing a visible "reload" flash in the drill UI.
 *
 * This module lives outside `useDrillGenerator.js` on purpose: tests mock that
 * hook module wholesale, so the marker has to come from somewhere that stays real.
 */

/** Returned when a generation request is dropped because another one is running. */
export const GENERATION_SKIPPED = Object.freeze({ drillGenerationSkipped: true })

/**
 * @param {unknown} value - Value returned by a generation call
 * @returns {boolean} - Whether the call was skipped because generation was busy
 */
export function isGenerationSkipped(value) {
  return !!value && typeof value === 'object' && value.drillGenerationSkipped === true
}

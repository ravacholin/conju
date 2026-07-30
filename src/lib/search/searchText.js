/**
 * Text primitives for the menu topic search.
 *
 * Everything here is pure and dependency-free so it can be unit tested in
 * isolation and reused by both the index builder and the matcher.
 */

/**
 * Lowercase + strip diacritics so "pretérito" and "preterito" match.
 *
 * IMPORTANT: this is length-preserving. Highlight ranges computed against the
 * folded string are applied to the original label, so any transform that
 * changed the character count (trimming, collapsing whitespace, dropping
 * punctuation) would misalign the highlight. Only combining marks are removed,
 * and those are separate code points introduced by NFD, not present in NFC
 * source strings.
 */
export function foldForSearch(value) {
  if (typeof value !== 'string') return ''
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Split a raw query into folded, non-empty tokens. */
export function tokenize(query) {
  return foldForSearch(query)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

/**
 * Bounded Levenshtein: true when `a` can be turned into `b` in `max` edits or
 * fewer. Early-exits instead of computing the full matrix, which keeps the
 * per-keystroke cost negligible across the whole index.
 */
export function editDistanceWithin(a, b, max = 1) {
  if (a === b) return true
  const lenA = a.length
  const lenB = b.length
  if (Math.abs(lenA - lenB) > max) return false
  if (max < 1) return false

  // Only max === 1 is needed today; a single scan handles all three edit kinds.
  if (max === 1) {
    let i = 0
    let j = 0
    let edits = 0
    while (i < lenA && j < lenB) {
      if (a[i] === b[j]) {
        i++
        j++
        continue
      }
      if (++edits > max) return false
      if (lenA === lenB) {
        i++
        j++
      } else if (lenA > lenB) {
        i++
      } else {
        j++
      }
    }
    return edits + (lenA - i) + (lenB - j) <= max
  }

  // Generic fallback (unused today, kept correct rather than clever).
  let prev = Array.from({ length: lenB + 1 }, (_, k) => k)
  for (let i = 1; i <= lenA; i++) {
    const row = [i]
    let best = i
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      row[j] = Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
      if (row[j] < best) best = row[j]
    }
    if (best > max) return false
    prev = row
  }
  return prev[lenB] <= max
}

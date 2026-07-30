import { foldForSearch, tokenize, editDistanceWithin } from './searchText.js'
import { TOPIC_KINDS } from './topicSearchIndex.js'

/**
 * Ranking for the menu topic search.
 *
 * Pure and synchronous. ~180 entries scored per keystroke is sub-millisecond,
 * so there is deliberately no debounce — the results are supposed to feel like
 * they are already there.
 */

const SCORE = {
  EXACT_LABEL: 100,
  LABEL_PREFIX: 70,
  WORD_PREFIX: 50,
  KEYWORD_EXACT: 42,
  KEYWORD_PREFIX: 35,
  SUBSTRING: 20,
  FUZZY: 12
}

// Nudges so that, all else equal, the broad entry wins over the narrow one.
// Family labels lead with the family name ("participios irregulares · …"),
// which prefix-matches aggressively, so they need a real handicap or they
// bury the plain tense they belong to.
const KIND_BONUS = {
  [TOPIC_KINDS.LEVEL]: 30,
  [TOPIC_KINDS.TENSE]: 25,
  [TOPIC_KINDS.SECTION]: 20,
  [TOPIC_KINDS.VERB_TYPE]: 12,
  [TOPIC_KINDS.FAMILY]: 0
}

// Cap so that a query like "irregulares" (which matches ~66 family entries)
// still leaves room for the tense and verb-type rows.
const MAX_FAMILY_RESULTS = 3

/** Score one token against one entry. Returns 0 when the token doesn't match. */
function scoreToken(entry, token) {
  const label = entry.foldedLabel

  if (label === token) return SCORE.EXACT_LABEL
  if (label.startsWith(token)) return SCORE.LABEL_PREFIX
  // Spanish plural of the whole label ("participios" → "participio"). Without
  // this the plural drops to a keyword match and loses to any family whose
  // name happens to start with the same word.
  if (token.startsWith(label) && token.length - label.length <= 2) return SCORE.LABEL_PREFIX

  // Prefix of any word inside the label ("indefinido" in "pretérito indefinido")
  if (new RegExp(`(^|[^a-z0-9])${escapeRegExp(token)}`).test(label)) return SCORE.WORD_PREFIX

  let best = 0
  for (const keyword of entry.keywords) {
    if (keyword === token) {
      best = Math.max(best, SCORE.KEYWORD_EXACT)
    } else if (keyword.startsWith(token)) {
      best = Math.max(best, SCORE.KEYWORD_PREFIX)
    } else if (keyword.includes(token)) {
      best = Math.max(best, SCORE.SUBSTRING)
    }
    if (best === SCORE.KEYWORD_EXACT) break
  }
  if (best > 0) return best

  if (label.includes(token)) return SCORE.SUBSTRING

  // Typo tolerance, last resort and heavily penalised. Only worth attempting
  // for tokens long enough that a single edit isn't ambiguous.
  if (token.length >= 4) {
    for (const word of entry.haystack.split(' ')) {
      if (word.length >= 4 && editDistanceWithin(token, word, 1)) return SCORE.FUZZY
    }
  }

  return 0
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Where each token matched inside the (unfolded) label, so the UI can
 * highlight it. Safe because foldForSearch is length-preserving.
 */
export function computeHighlightRanges(entry, tokens) {
  const ranges = []
  tokens.forEach(token => {
    let from = 0
    for (;;) {
      const at = entry.foldedLabel.indexOf(token, from)
      if (at === -1) break
      ranges.push([at, at + token.length])
      from = at + token.length
    }
  })
  if (ranges.length === 0) return ranges

  // Merge overlaps so nested tokens don't produce split <mark> elements.
  ranges.sort((a, b) => a[0] - b[0])
  const merged = [ranges[0]]
  for (let i = 1; i < ranges.length; i++) {
    const last = merged[merged.length - 1]
    if (ranges[i][0] <= last[1]) {
      last[1] = Math.max(last[1], ranges[i][1])
    } else {
      merged.push(ranges[i])
    }
  }
  return merged
}

/**
 * @param {string} query - raw user input
 * @param {Array} index - from getTopicSearchIndex()
 * @param {{limit?: number}} options
 * @returns {Array<{entry: Object, score: number, ranges: Array<[number, number]>}>}
 */
export function searchTopics(query, index, { limit = 8 } = {}) {
  const tokens = tokenize(query)
  if (tokens.length === 0) return []

  const scored = []
  for (let i = 0; i < index.length; i++) {
    const entry = index[i]
    let total = 0
    let matchedAll = true

    // AND across tokens: "participio irregulares" must hit the refined variant.
    for (const token of tokens) {
      const tokenScore = scoreToken(entry, token)
      if (tokenScore === 0) {
        matchedAll = false
        break
      }
      total += tokenScore
    }
    if (!matchedAll) continue

    total += KIND_BONUS[entry.kind] ?? 0
    // Breaks ties among families only: the learner-facing group beats the
    // technical family that it expands to.
    if (entry.simplified) total += 4
    // Shorter labels are more likely to be what a short query meant.
    total -= Math.min(10, Math.floor(entry.foldedLabel.length / 6))

    scored.push({ entry, score: total, order: i })
  }

  scored.sort((a, b) => (b.score - a.score) || (a.order - b.order))

  const results = []
  let familyCount = 0
  for (const item of scored) {
    if (item.entry.kind === TOPIC_KINDS.FAMILY) {
      if (familyCount >= MAX_FAMILY_RESULTS) continue
      familyCount++
    }
    results.push({
      entry: item.entry,
      score: item.score,
      ranges: computeHighlightRanges(item.entry, tokens)
    })
    if (results.length >= limit) break
  }
  return results
}

export { foldForSearch, tokenize }

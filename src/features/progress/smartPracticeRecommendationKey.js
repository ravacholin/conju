export function buildSmartPracticeRecommendationKeyItem(rec = {}, index = 0) {
  const type = rec.type || 'recommendation'
  const targetMood = rec.targetMood || 'any-mood'
  const targetTense = rec.targetTense || 'any-tense'
  const title = rec.title || 'untitled'

  return `${type}|${targetMood}|${targetTense}|${title}|${index}`
}

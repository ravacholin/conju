// Enhanced verb analytics using per-tense irregularity data

import { getAllVerbs, getVerbByLemma } from '../core/verbDataService.js'
import { 
  getIrregularTenses, 
  getVerbIrregularityStats,
  isIrregularInTense,
  TENSE_GROUPS
} from '../utils/irregularityUtils.js'

/**
 * Generate comprehensive verb analytics using per-tense irregularity data
 * @returns {Object} Analytics report
 */
export async function generateVerbAnalytics() {
  const verbs = await getAllVerbs({ ensureChunks: true })
  const analytics = {
    overview: {},
    irregularityDistribution: {},
    tenseAnalysis: {},
    complexityAnalysis: {},
    recommendations: []
  }

  // Overview statistics
  analytics.overview = {
    totalVerbs: verbs.length,
    fullyRegular: verbs.filter(v => getIrregularTenses(v).length === 0).length,
    hasIrregularTenses: verbs.filter(v => getIrregularTenses(v).length > 0).length,
    averageIrregularityPercentage: 0
  }

  // Calculate average irregularity percentage
  const totalIrregularityPercentage = verbs.reduce((sum, verb) => {
    const stats = getVerbIrregularityStats(verb)
    return sum + stats.irregularityPercentage
  }, 0)
  analytics.overview.averageIrregularityPercentage = totalIrregularityPercentage / verbs.length

  // Irregularity distribution by percentage buckets
  const buckets = {
    '0%': 0,      // Fully regular
    '1-25%': 0,   // Low irregularity  
    '26-50%': 0,  // Medium irregularity
    '51-75%': 0,  // High irregularity
    '76-100%': 0  // Very high irregularity
  }

  verbs.forEach(verb => {
    const stats = getVerbIrregularityStats(verb)
    const percent = stats.irregularityPercentage
    
    if (percent === 0) buckets['0%']++
    else if (percent <= 25) buckets['1-25%']++
    else if (percent <= 50) buckets['26-50%']++
    else if (percent <= 75) buckets['51-75%']++
    else buckets['76-100%']++
  })

  analytics.irregularityDistribution = buckets

  // Per-tense analysis
  const tenseStats = {}
  const allTenses = ['pres', 'pretIndef', 'impf', 'fut', 'subjPres', 'subjImpf', 'impAff', 'impNeg', 'ger', 'pp']
  
  allTenses.forEach(tense => {
    const irregularInTense = verbs.filter(verb => isIrregularInTense(verb, tense)).length
    tenseStats[tense] = {
      irregularCount: irregularInTense,
      regularCount: verbs.length - irregularInTense,
      irregularityPercentage: (irregularInTense / verbs.length * 100).toFixed(1)
    }
  })

  analytics.tenseAnalysis = tenseStats

  // Tense group analysis
  const groupStats = {}
  Object.entries(TENSE_GROUPS).forEach(([groupName, tenses]) => {
    const verbsIrregularInGroup = verbs.filter(verb => {
      return tenses.some(tense => isIrregularInTense(verb, tense))
    }).length
    
    groupStats[groupName] = {
      verbsWithIrregularity: verbsIrregularInGroup,
      percentageOfVerbs: (verbsIrregularInGroup / verbs.length * 100).toFixed(1)
    }
  })

  analytics.tenseAnalysis.groups = groupStats

  // Complexity analysis
  const complexityLevels = {
    low: 0,      // 0-2 irregular tenses
    medium: 0,   // 3-5 irregular tenses
    high: 0,     // 6-8 irregular tenses
    veryHigh: 0  // 9+ irregular tenses
  }

  verbs.forEach(verb => {
    const irregularCount = getIrregularTenses(verb).length
    
    if (irregularCount <= 2) complexityLevels.low++
    else if (irregularCount <= 5) complexityLevels.medium++
    else if (irregularCount <= 8) complexityLevels.high++
    else complexityLevels.veryHigh++
  })

  analytics.complexityAnalysis = {
    distribution: complexityLevels,
    mostComplexVerbs: verbs
      .map(verb => ({
        lemma: verb.lemma,
        irregularTenses: getIrregularTenses(verb),
        count: getIrregularTenses(verb).length,
        stats: getVerbIrregularityStats(verb)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  // Generate recommendations
  analytics.recommendations = generateRecommendations(analytics)

  return analytics
}

/**
 * Generate learning recommendations based on analytics
 * @param {Object} analytics - Analytics data
 * @returns {Array} Array of recommendations
 */
function generateRecommendations(analytics) {
  const recommendations = []

  // Most irregular tenses
  const sortedTenses = Object.entries(analytics.tenseAnalysis)
    .filter(([tense]) => tense !== 'groups')
    .sort(([,a], [,b]) => b.irregularCount - a.irregularCount)

  recommendations.push({
    type: 'focus_tenses',
    title: 'Focus on Most Irregular Tenses',
    description: `${sortedTenses[0][0]} has the most irregular verbs (${sortedTenses[0][1].irregularCount} verbs, ${sortedTenses[0][1].irregularityPercentage}% of dataset)`,
    tenses: sortedTenses.slice(0, 3).map(([tense]) => tense)
  })

  // Complexity distribution insights  
  const complexity = analytics.complexityAnalysis.distribution
  const totalVerbs = Object.values(complexity).reduce((sum, count) => sum + count, 0)
  
  if (complexity.veryHigh > totalVerbs * 0.1) {
    recommendations.push({
      type: 'high_complexity_warning',
      title: 'Many Highly Irregular Verbs',
      description: `${complexity.veryHigh} verbs (${(complexity.veryHigh/totalVerbs*100).toFixed(1)}%) have 9+ irregular tenses. Consider progressive learning approaches.`,
      verbCount: complexity.veryHigh
    })
  }

  // Balanced learning recommendation
  const regularVerbs = analytics.overview.fullyRegular
  const irregularVerbs = analytics.overview.hasIrregularTenses
  
  recommendations.push({
    type: 'practice_balance',
    title: 'Recommended Practice Balance',
    description: `With ${regularVerbs} regular and ${irregularVerbs} irregular verbs, aim for 30% regular, 70% irregular practice for optimal challenge.`,
    ratio: { regular: 30, irregular: 70 }
  })

  return recommendations
}

/**
 * Get detailed verb information for a specific verb
 * @param {string} lemma - Verb lemma
 * @returns {Object|null} Detailed verb info or null if not found
 */
export async function getVerbDetailedInfo(lemma) {
  const verb = await getVerbByLemma(lemma)
  if (!verb) return null

  const stats = getVerbIrregularityStats(verb)
  const irregularTenses = getIrregularTenses(verb)

  return {
    lemma: verb.lemma,
    traditionalType: verb.type,
    stats,
    irregularTenses,
    tenseBreakdown: Object.entries(verb.irregularityMatrix || {}).reduce((acc, [tense, isIrregular]) => {
      acc[tense] = isIrregular
      return acc
    }, {}),
    complexity: irregularTenses.length <= 2 ? 'low' : 
                 irregularTenses.length <= 5 ? 'medium' :
                 irregularTenses.length <= 8 ? 'high' : 'very_high'
  }
}

/**
 * Compare two verbs' irregularity patterns
 * @param {string} lemma1 - First verb lemma
 * @param {string} lemma2 - Second verb lemma  
 * @returns {Object} Comparison result
 */
export function compareVerbIrregularity(lemma1, lemma2) {
  const verb1 = getVerbDetailedInfo(lemma1)
  const verb2 = getVerbDetailedInfo(lemma2)
  
  if (!verb1 || !verb2) {
    return { error: 'One or both verbs not found' }
  }

  const commonIrregularTenses = verb1.irregularTenses.filter(tense => 
    verb2.irregularTenses.includes(tense)
  )

  return {
    verb1: verb1.lemma,
    verb2: verb2.lemma,
    commonIrregularTenses,
    uniqueToVerb1: verb1.irregularTenses.filter(tense => !verb2.irregularTenses.includes(tense)),
    uniqueToVerb2: verb2.irregularTenses.filter(tense => !verb1.irregularTenses.includes(tense)),
    complexityDifference: verb1.stats.irregularTenseCount - verb2.stats.irregularTenseCount,
    recommendation: commonIrregularTenses.length > 2 ? 
      'These verbs share similar irregularity patterns - good for grouped practice' :
      'These verbs have different patterns - practice separately'
  }
}

/**
 * Learning Analytics Engine for Spanish Conjugator
 * Captures detailed metrics, generates heat maps, and tracks learning curves
 */

import { initDB, saveToDB, getAllFromDB, saveAttempt } from '../progress/database.js';

/**
 * Records detailed learning session metrics
 * @param {string} userId - User ID
 * @param {Object} sessionData - Complete session data
 */
export async function recordLearningSession(userId, sessionData) {
  try {
    const sessionMetrics = {
      userId,
      timestamp: Date.now(),
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...sessionData,
      // Additional computed metrics
      efficiencyScore: calculateEfficiencyScore(sessionData),
      difficultyProgression: calculateDifficultyProgression(sessionData),
      errorPatternAnalysis: analyzeErrorPatterns(sessionData.errorPatterns || {}),
      engagementMetrics: calculateEngagementMetrics(sessionData)
    };

    // Store in IndexedDB using the standard database API
    try {
      await initDB();
      await saveToDB('learning_sessions', sessionMetrics);
      console.log('📊 Learning session recorded:', sessionMetrics.sessionId);
    } catch (error) {
      console.error('Error storing learning session:', error);
    }

    // Also record individual attempts for detailed analysis
    if (sessionData.attempts && Array.isArray(sessionData.attempts)) {
      await Promise.all(sessionData.attempts.map(attempt => 
        recordDetailedAttempt(userId, attempt, sessionMetrics.sessionId)
      ));
    }

    return sessionMetrics;
  } catch (error) {
    console.error('Error recording learning session:', error);
    return null;
  }
}

/**
 * Records detailed individual attempt data
 * @param {string} userId - User ID
 * @param {Object} attempt - Individual attempt data
 * @param {string} sessionId - Session identifier
 */
async function recordDetailedAttempt(userId, attempt, sessionId) {
  try {
    const detailedAttempt = {
      ...attempt,
      userId,
      sessionId,
      timestamp: Date.now(),
      contextData: {
        difficulty: attempt.adaptiveDifficulty || 'medium',
        phaseType: attempt.phaseType || 'unknown',
        verbComplexity: analyzeVerbComplexity(attempt.verb),
        linguisticContext: analyzeLinguisticContext(attempt)
      }
    };

    // Use existing saveAttempt function but with enhanced data
    await saveAttempt(detailedAttempt);
    
  } catch (error) {
    console.error('Error recording detailed attempt:', error);
  }
}

/**
 * Generates error heat map data by tense
 * @param {string} userId - User ID
 * @param {string} timeframe - 'week' | 'month' | 'all'
 * @returns {Object} Heat map data structure
 */
export async function generateErrorHeatMap(userId, timeframe = 'month') {
  try {
    await initDB();
    const cutoffTime = getCutoffTime(timeframe);
    const heatMapData = {
      tenses: {},
      persons: {},
      verbTypes: {},
      errorTypes: {},
      timeDistribution: {},
      overall: {
        totalAttempts: 0,
        totalErrors: 0,
        errorRate: 0
      }
    };

    const allAttempts = await getAllFromDB('attempts');
    const attempts = allAttempts.filter(attempt => 
      attempt.userId === userId && 
      attempt.timestamp > cutoffTime
    );

    attempts.forEach(attempt => {
      heatMapData.overall.totalAttempts++;
      
      if (!attempt.correct) {
        heatMapData.overall.totalErrors++;
        
        // Tense error distribution
        const tense = attempt.tense || 'unknown';
        if (!heatMapData.tenses[tense]) {
          heatMapData.tenses[tense] = { errors: 0, attempts: 0 };
        }
        heatMapData.tenses[tense].errors++;
      }

      // Total attempts per tense
      const tense = attempt.tense || 'unknown';
      if (!heatMapData.tenses[tense]) {
        heatMapData.tenses[tense] = { errors: 0, attempts: 0 };
      }
      heatMapData.tenses[tense].attempts++;

      // Person error distribution
      if (attempt.person) {
        if (!heatMapData.persons[attempt.person]) {
          heatMapData.persons[attempt.person] = { errors: 0, attempts: 0 };
        }
        heatMapData.persons[attempt.person].attempts++;
        if (!attempt.correct) {
          heatMapData.persons[attempt.person].errors++;
        }
      }

      // Verb type distribution
      const verbType = attempt.isIrregular ? 'irregular' : 'regular';
      if (!heatMapData.verbTypes[verbType]) {
        heatMapData.verbTypes[verbType] = { errors: 0, attempts: 0 };
      }
      heatMapData.verbTypes[verbType].attempts++;
      if (!attempt.correct) {
        heatMapData.verbTypes[verbType].errors++;
      }

      // Error type distribution
      if (attempt.errorTags && Array.isArray(attempt.errorTags)) {
        attempt.errorTags.forEach(errorType => {
          if (!heatMapData.errorTypes[errorType]) {
            heatMapData.errorTypes[errorType] = 0;
          }
          heatMapData.errorTypes[errorType]++;
        });
      }

      // Time distribution (hour of day)
      const hour = new Date(attempt.timestamp).getHours();
      if (!heatMapData.timeDistribution[hour]) {
        heatMapData.timeDistribution[hour] = { errors: 0, attempts: 0 };
      }
      heatMapData.timeDistribution[hour].attempts++;
      if (!attempt.correct) {
        heatMapData.timeDistribution[hour].errors++;
      }
    });

    // Calculate error rates
    Object.keys(heatMapData.tenses).forEach(tense => {
      const data = heatMapData.tenses[tense];
      data.errorRate = data.attempts > 0 ? (data.errors / data.attempts) : 0;
    });

    Object.keys(heatMapData.persons).forEach(person => {
      const data = heatMapData.persons[person];
      data.errorRate = data.attempts > 0 ? (data.errors / data.attempts) : 0;
    });

    Object.keys(heatMapData.verbTypes).forEach(type => {
      const data = heatMapData.verbTypes[type];
      data.errorRate = data.attempts > 0 ? (data.errors / data.attempts) : 0;
    });

    Object.keys(heatMapData.timeDistribution).forEach(hour => {
      const data = heatMapData.timeDistribution[hour];
      data.errorRate = data.attempts > 0 ? (data.errors / data.attempts) : 0;
    });

    heatMapData.overall.errorRate = heatMapData.overall.totalAttempts > 0 ? 
      (heatMapData.overall.totalErrors / heatMapData.overall.totalAttempts) : 0;

    console.log('📈 Generated error heat map:', heatMapData);
    return heatMapData;

  } catch (error) {
    console.error('Error generating error heat map:', error);
    return null;
  }
}

/**
 * Generates learning curve data showing progress over time
 * @param {string} userId - User ID
 * @param {string} tense - Specific tense to analyze
 * @param {string} timeframe - 'week' | 'month' | 'all'
 * @returns {Object} Learning curve data
 */
export async function generateLearningCurve(userId, tense = null, timeframe = 'month') {
  try {
    await initDB();
    const cutoffTime = getCutoffTime(timeframe);
    
    const allAttempts = await getAllFromDB('attempts');
    let attempts = allAttempts.filter(attempt => 
      attempt.userId === userId && 
      attempt.timestamp > cutoffTime
    );

        if (tense) {
          attempts = attempts.filter(attempt => attempt.tense === tense);
        }

        // Sort by timestamp
        attempts.sort((a, b) => a.timestamp - b.timestamp);

        const curveData = {
          tense: tense || 'all',
          timeframe,
          points: [],
          trend: {
            overallImprovement: 0,
            averageAccuracy: 0,
            averageResponseTime: 0,
            learningVelocity: 0
          },
          milestones: []
        };

        // Group attempts into time buckets
        const bucketSize = getBucketSize(timeframe);
        const buckets = {};

        attempts.forEach(attempt => {
          const bucketKey = Math.floor(attempt.timestamp / bucketSize) * bucketSize;
          if (!buckets[bucketKey]) {
            buckets[bucketKey] = {
              timestamp: bucketKey,
              attempts: 0,
              correct: 0,
              totalResponseTime: 0,
              errorTypes: {}
            };
          }
          
          buckets[bucketKey].attempts++;
          if (attempt.correct) buckets[bucketKey].correct++;
          buckets[bucketKey].totalResponseTime += attempt.latencyMs || 0;
          
          if (attempt.errorTags && !attempt.correct) {
            attempt.errorTags.forEach(errorType => {
              buckets[bucketKey].errorTypes[errorType] = 
                (buckets[bucketKey].errorTypes[errorType] || 0) + 1;
            });
          }
        });

        // Convert buckets to curve points
        Object.values(buckets).forEach(bucket => {
          const accuracy = bucket.attempts > 0 ? (bucket.correct / bucket.attempts) : 0;
          const avgResponseTime = bucket.attempts > 0 ? 
            (bucket.totalResponseTime / bucket.attempts) : 0;

          curveData.points.push({
            timestamp: bucket.timestamp,
            date: new Date(bucket.timestamp).toISOString(),
            accuracy,
            avgResponseTime,
            attempts: bucket.attempts,
            errorTypes: bucket.errorTypes
          });
        });

        // Calculate trend metrics
        if (curveData.points.length > 1) {
          const firstPoint = curveData.points[0];
          const lastPoint = curveData.points[curveData.points.length - 1];
          
          curveData.trend.overallImprovement = lastPoint.accuracy - firstPoint.accuracy;
          curveData.trend.averageAccuracy = curveData.points.reduce((sum, p) => sum + p.accuracy, 0) / curveData.points.length;
          curveData.trend.averageResponseTime = curveData.points.reduce((sum, p) => sum + p.avgResponseTime, 0) / curveData.points.length;
          
          // Learning velocity (improvement per unit time)
          const timeSpan = lastPoint.timestamp - firstPoint.timestamp;
          curveData.trend.learningVelocity = timeSpan > 0 ? 
            (curveData.trend.overallImprovement / (timeSpan / (24 * 60 * 60 * 1000))) : 0; // per day
        }

        // Identify milestones
        curveData.points.forEach((point, index) => {
          if (point.accuracy >= 0.8 && index > 0 && curveData.points[index - 1].accuracy < 0.8) {
            curveData.milestones.push({
              type: 'accuracy_milestone',
              timestamp: point.timestamp,
              description: '80% accuracy achieved',
              value: point.accuracy
            });
          }
          
          if (point.attempts >= 100 && index > 0 && curveData.points[index - 1].attempts < 100) {
            curveData.milestones.push({
              type: 'practice_milestone', 
              timestamp: point.timestamp,
              description: '100 attempts completed',
              value: point.attempts
            });
          }
        });

    console.log('📈 Generated learning curve:', curveData);
    return curveData;

  } catch (error) {
    console.error('Error generating learning curve:', error);
    return null;
  }
}

/**
 * A/B Testing Framework for learning module improvements
 */
export class ABTestingFramework {
  constructor() {
    this.activeTests = new Map();
    this.userAssignments = new Map();
  }

  /**
   * Create a new A/B test
   * @param {string} testId - Unique test identifier
   * @param {Object} testConfig - Test configuration
   */
  createTest(testId, testConfig) {
    const test = {
      id: testId,
      name: testConfig.name,
      description: testConfig.description,
      variants: testConfig.variants || ['A', 'B'],
      trafficSplit: testConfig.trafficSplit || [50, 50],
      startDate: Date.now(),
      endDate: testConfig.duration ? Date.now() + testConfig.duration : null,
      metrics: testConfig.metrics || ['accuracy', 'engagement', 'completion_rate'],
      isActive: true,
      results: {
        participants: {},
        metrics: {}
      }
    };

    this.activeTests.set(testId, test);
    console.log('🧪 A/B Test created:', testId);
    return test;
  }

  /**
   * Assign user to test variant
   * @param {string} userId - User ID
   * @param {string} testId - Test identifier
   * @returns {string} Assigned variant
   */
  assignUserToVariant(userId, testId) {
    const test = this.activeTests.get(testId);
    if (!test || !test.isActive) return null;

    // Check if user already assigned
    const assignmentKey = `${userId}_${testId}`;
    if (this.userAssignments.has(assignmentKey)) {
      return this.userAssignments.get(assignmentKey);
    }

    // Assign based on user hash to ensure consistency
    const hash = this.hashUserId(userId + testId);
    const cumulative = test.trafficSplit.reduce((acc, val, idx) => {
      acc.push((acc[idx - 1] || 0) + val);
      return acc;
    }, []);

    const randomValue = hash % 100;
    let assignedVariant = test.variants[0];
    
    for (let i = 0; i < cumulative.length; i++) {
      if (randomValue < cumulative[i]) {
        assignedVariant = test.variants[i];
        break;
      }
    }

    this.userAssignments.set(assignmentKey, assignedVariant);
    
    // Initialize participant tracking
    if (!test.results.participants[assignedVariant]) {
      test.results.participants[assignedVariant] = [];
    }
    test.results.participants[assignedVariant].push(userId);

    console.log(`🧪 User ${userId} assigned to variant ${assignedVariant} for test ${testId}`);
    return assignedVariant;
  }

  /**
   * Record A/B test metrics
   * @param {string} userId - User ID
   * @param {string} testId - Test identifier
   * @param {Object} metrics - Metrics to record
   */
  recordTestMetrics(userId, testId, metrics) {
    const test = this.activeTests.get(testId);
    if (!test || !test.isActive) return;

    const assignmentKey = `${userId}_${testId}`;
    const variant = this.userAssignments.get(assignmentKey);
    if (!variant) return;

    if (!test.results.metrics[variant]) {
      test.results.metrics[variant] = [];
    }

    test.results.metrics[variant].push({
      userId,
      timestamp: Date.now(),
      ...metrics
    });

    console.log(`🧪 Recorded metrics for variant ${variant}:`, metrics);
  }

  /**
   * Get A/B test results
   * @param {string} testId - Test identifier
   * @returns {Object} Test results analysis
   */
  getTestResults(testId) {
    const test = this.activeTests.get(testId);
    if (!test) return null;

    const analysis = {
      testId,
      name: test.name,
      status: test.isActive ? 'active' : 'completed',
      duration: Date.now() - test.startDate,
      variants: {}
    };

    test.variants.forEach(variant => {
      const participantCount = (test.results.participants[variant] || []).length;
      const metrics = test.results.metrics[variant] || [];
      
      analysis.variants[variant] = {
        participants: participantCount,
        metrics: this.calculateVariantMetrics(metrics)
      };
    });

    return analysis;
  }

  /**
   * Simple hash function for consistent user assignment
   * @private
   */
  hashUserId(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Calculate metrics for a variant
   * @private
   */
  calculateVariantMetrics(metrics) {
    if (metrics.length === 0) return {};

    const result = {};
    const keys = Object.keys(metrics[0]).filter(key => 
      typeof metrics[0][key] === 'number' && key !== 'timestamp' && key !== 'userId'
    );

    keys.forEach(key => {
      const values = metrics.map(m => m[key]).filter(v => typeof v === 'number');
      if (values.length > 0) {
        result[key] = {
          mean: values.reduce((a, b) => a + b, 0) / values.length,
          count: values.length,
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }
    });

    return result;
  }
}

// Helper functions
function calculateEfficiencyScore(sessionData) {
  const { accuracy = 0, averageTime = 0, totalAttempts = 0 } = sessionData;
  if (totalAttempts === 0) return 0;
  
  // Efficiency combines accuracy with speed (normalized)
  const timeScore = Math.max(0, 100 - (averageTime / 1000)); // Penalty for slow responses
  return (accuracy * 0.7) + (timeScore * 0.3);
}

function calculateDifficultyProgression(sessionData) {
  // Analyze if user progressed through difficulty levels during session
  return sessionData.difficultyChanges || 0;
}

function analyzeErrorPatterns(errorPatterns) {
  const total = Object.values(errorPatterns).reduce((sum, count) => sum + count, 0);
  if (total === 0) return {};

  const analysis = {};
  Object.entries(errorPatterns).forEach(([errorType, count]) => {
    analysis[errorType] = {
      count,
      percentage: (count / total) * 100,
      severity: count > total * 0.3 ? 'high' : count > total * 0.1 ? 'medium' : 'low'
    };
  });

  return analysis;
}

function calculateEngagementMetrics(sessionData) {
  const { totalAttempts = 0, sessionDuration = 0, correctStreak = 0 } = sessionData;
  
  return {
    attemptsPerMinute: sessionDuration > 0 ? (totalAttempts / (sessionDuration / 60000)) : 0,
    maxStreak: correctStreak,
    completionRate: sessionData.completionRate || 0
  };
}

function analyzeVerbComplexity(verb) {
  if (!verb) return 'unknown';
  
  // Simple complexity analysis
  if (verb.type === 'irregular') return 'high';
  if (verb.lemma && verb.lemma.length > 8) return 'medium';
  return 'low';
}

function analyzeLinguisticContext(attempt) {
  return {
    tense: attempt.tense || 'unknown',
    person: attempt.person || 'unknown',
    mood: attempt.mood || 'indicative',
    verbEnding: attempt.verb?.lemma?.slice(-2) || 'unknown'
  };
}

function getCutoffTime(timeframe) {
  const now = Date.now();
  switch (timeframe) {
    case 'week': return now - (7 * 24 * 60 * 60 * 1000);
    case 'month': return now - (30 * 24 * 60 * 60 * 1000);
    case 'all': return 0;
    default: return now - (30 * 24 * 60 * 60 * 1000);
  }
}

function getBucketSize(timeframe) {
  switch (timeframe) {
    case 'week': return 24 * 60 * 60 * 1000; // Daily buckets
    case 'month': return 24 * 60 * 60 * 1000; // Daily buckets  
    case 'all': return 7 * 24 * 60 * 60 * 1000; // Weekly buckets
    default: return 24 * 60 * 60 * 1000;
  }
}

// Create global A/B testing instance
export const abTesting = new ABTestingFramework();
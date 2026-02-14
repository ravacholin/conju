const defaultSelectVariedForm = () => null

const pickRandom = forms => {
  if (!Array.isArray(forms) || forms.length === 0) return null
  const index = Math.floor(Math.random() * forms.length)
  return forms[index]
}

const normalizeArray = value => Array.isArray(value) ? value : []

// Probability of using an SRS due item during mixed/general practice.
// The rest of the time, the variety engine (chooseNext) handles selection.
const SRS_USE_PROBABILITY = 0.35

export const selectNextForm = async ({
  eligibleForms,
  settings,
  history,
  itemToExclude,
  specificConstraints,
  reviewSessionType,
  reviewSessionFilter,
  now,
  dependencies
}) => {
  const errors = []
  let selectionMethod = null
  let nextForm = null

  const {
    getCurrentUserId,
    getDueItems,
    gateDueItemsByCurriculum,
    filterDueForSpecific,
    filterByVerbType,
    selectVariedForm = defaultSelectVariedForm,
    getNextRecommendedItem,
    chooseNext,
    applyReviewSessionFilter,
    selectDueCandidate
  } = dependencies

  // Determine if the user is in an explicit review session vs general practice
  const isExplicitReview = settings.practiceMode === 'review'
  const isSpecificPractice = settings.practiceMode === 'specific' || settings.practiceMode === 'theme'
  const isGeneralPractice = !isExplicitReview && !isSpecificPractice

  // ─── PATH A: Explicit review or specific practice ───
  // Use the traditional hierarchy: SRS → adaptive → chooseNext
  if (isExplicitReview || isSpecificPractice) {
    const userId = typeof getCurrentUserId === 'function' ? getCurrentUserId() : null
    if (userId && typeof getDueItems === 'function') {
      const dueRaw = await getDueItems(userId, now)
      let dueCells = normalizeArray(dueRaw)

      if (typeof gateDueItemsByCurriculum === 'function') {
        dueCells = gateDueItemsByCurriculum(dueCells, settings)
      }
      if (typeof filterDueForSpecific === 'function') {
        dueCells = filterDueForSpecific(dueCells, specificConstraints)
      }
      if (isExplicitReview && typeof applyReviewSessionFilter === 'function') {
        dueCells = applyReviewSessionFilter(dueCells, reviewSessionType, reviewSessionFilter, now)
      }

      const pickFromDue = typeof selectDueCandidate === 'function'
        ? selectDueCandidate(dueCells)
        : null

      if (pickFromDue) {
        let candidateForms = eligibleForms.filter(f =>
          f.mood === pickFromDue.mood &&
          f.tense === pickFromDue.tense &&
          f.person === pickFromDue.person
        )

        if (typeof filterByVerbType === 'function' && settings?.verbType && settings.verbType !== 'all') {
          candidateForms = filterByVerbType(candidateForms, settings.verbType, settings)
        }

        if (candidateForms.length > 0) {
          nextForm = selectVariedForm(candidateForms, settings.level, settings.practiceMode, history) ||
            pickRandom(candidateForms)
          selectionMethod = 'srs_due_with_variety'
        }
      }
    }

    if (!nextForm && typeof getNextRecommendedItem === 'function') {
      try {
        const recommendation = await getNextRecommendedItem(settings.level || 'B1')
        if (recommendation) {
          const target = recommendation.targetCombination || recommendation
          const { mood, tense, verbId } = target
          let candidateForms = mood && tense
            ? eligibleForms.filter(f => f.mood === mood && f.tense === tense)
            : []

          if (verbId) {
            const specificVerbForms = candidateForms.filter(f => f.lemma === verbId)
            if (specificVerbForms.length > 0) candidateForms = specificVerbForms
          }

          if (typeof filterByVerbType === 'function' && settings?.verbType && settings.verbType !== 'all') {
            candidateForms = filterByVerbType(candidateForms, settings.verbType, settings)
          }

          if (candidateForms.length > 0) {
            nextForm = selectVariedForm(candidateForms, settings.level, settings.practiceMode, history) ||
              pickRandom(candidateForms)
            selectionMethod = 'adaptive_recommendation_with_variety'
          }
        }
      } catch (error) {
        errors.push({ stage: 'adaptive', error })
      }
    }

    if (!nextForm && typeof chooseNext === 'function') {
      nextForm = await chooseNext({
        forms: eligibleForms,
        history,
        currentItem: itemToExclude,
        sessionSettings: settings
      })
      selectionMethod = 'standard_generator'
    }

    return { form: nextForm, selectionMethod, errors }
  }

  // ─── PATH B: General mixed practice (the common case) ───
  // Use the variety engine as PRIMARY selector to ensure diverse tenses/persons.
  // SRS due items are used as a supplementary signal ~35% of the time.

  // Step 1: Occasionally use SRS due items (as tense hint only, not person)
  const userId = typeof getCurrentUserId === 'function' ? getCurrentUserId() : null
  if (userId && typeof getDueItems === 'function' && Math.random() < SRS_USE_PROBABILITY) {
    const dueRaw = await getDueItems(userId, now)
    let dueCells = normalizeArray(dueRaw)

    if (typeof gateDueItemsByCurriculum === 'function') {
      dueCells = gateDueItemsByCurriculum(dueCells, settings)
    }
    if (typeof filterDueForSpecific === 'function') {
      dueCells = filterDueForSpecific(dueCells, specificConstraints)
    }

    const pickFromDue = typeof selectDueCandidate === 'function'
      ? selectDueCandidate(dueCells)
      : null

    if (pickFromDue) {
      // Use SRS only as a tense hint - do NOT lock person
      let candidateForms = eligibleForms.filter(f =>
        f.mood === pickFromDue.mood &&
        f.tense === pickFromDue.tense
      )

      if (typeof filterByVerbType === 'function' && settings?.verbType && settings.verbType !== 'all') {
        candidateForms = filterByVerbType(candidateForms, settings.verbType, settings)
      }

      if (candidateForms.length > 0) {
        nextForm = selectVariedForm(candidateForms, settings.level, settings.practiceMode, history) ||
          pickRandom(candidateForms)
        selectionMethod = 'srs_due_with_variety'
      }
    }
  }

  // Step 2: Primary selection via chooseNext (variety engine)
  if (!nextForm && typeof chooseNext === 'function') {
    nextForm = await chooseNext({
      forms: eligibleForms,
      history,
      currentItem: itemToExclude,
      sessionSettings: settings
    })
    selectionMethod = 'standard_generator'
  }

  // Step 3: Last resort - adaptive recommendation
  if (!nextForm && typeof getNextRecommendedItem === 'function') {
    try {
      const recommendation = await getNextRecommendedItem(settings.level || 'B1')
      if (recommendation) {
        const target = recommendation.targetCombination || recommendation
        const { mood, tense, verbId } = target
        let candidateForms = mood && tense
          ? eligibleForms.filter(f => f.mood === mood && f.tense === tense)
          : []

        if (verbId) {
          const specificVerbForms = candidateForms.filter(f => f.lemma === verbId)
          if (specificVerbForms.length > 0) candidateForms = specificVerbForms
        }

        if (typeof filterByVerbType === 'function' && settings?.verbType && settings.verbType !== 'all') {
          candidateForms = filterByVerbType(candidateForms, settings.verbType, settings)
        }

        if (candidateForms.length > 0) {
          nextForm = selectVariedForm(candidateForms, settings.level, settings.practiceMode, history) ||
            pickRandom(candidateForms)
          selectionMethod = 'adaptive_recommendation_with_variety'
        }
      }
    } catch (error) {
      errors.push({ stage: 'adaptive', error })
    }
  }

  return { form: nextForm, selectionMethod, errors }
}

const defaultSelectVariedForm = () => null

const pickRandom = forms => {
  if (!Array.isArray(forms) || forms.length === 0) return null
  const index = Math.floor(Math.random() * forms.length)
  return forms[index]
}

const normalizeArray = value => Array.isArray(value) ? value : []

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

    if (settings.practiceMode === 'review' && typeof applyReviewSessionFilter === 'function') {
      dueCells = applyReviewSessionFilter(dueCells, reviewSessionType, reviewSessionFilter, now)
    }

    const pickFromDue = typeof selectDueCandidate === 'function'
      ? selectDueCandidate(dueCells, reviewSessionType)
      : null

    if (pickFromDue) {
      let candidateForms = eligibleForms.filter(f =>
        f.mood === pickFromDue.mood &&
        f.tense === pickFromDue.tense &&
        (!specificConstraints?.isSpecific ? f.person === pickFromDue.person : true)
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
        const { mood, tense, verbId } = recommendation
        let candidateForms = eligibleForms.filter(f => f.mood === mood && f.tense === tense)

        if (verbId) {
          const specificVerbForms = candidateForms.filter(f => f.lemma === verbId)
          if (specificVerbForms.length > 0) {
            candidateForms = specificVerbForms
          }
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

  return {
    form: nextForm,
    selectionMethod,
    errors
  }
}

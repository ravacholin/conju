const DEFAULT_REGION = 'la_general'

const defaultNow = () => Date.now()

const pushToMapBucket = (map, key, form) => {
  const bucket = map.get(key)
  if (bucket) {
    bucket.push(form)
    return
  }
  map.set(key, [form])
}

export const createFormsCombinationIndex = (forms = [], options = {}) => {
  const defaultRegion = options.defaultRegion || DEFAULT_REGION
  const byMoodTense = new Map()
  const byMoodTensePerson = new Map()
  const byRegionMoodTense = new Map()
  const byRegionMoodTensePerson = new Map()

  for (const form of forms) {
    if (!form) continue
    const moodTenseKey = `${form.mood}|${form.tense}`
    const moodTensePersonKey = `${form.mood}|${form.tense}|${form.person || ''}`
    const region = form.region || defaultRegion
    const byRegionMoodTenseKey = `${region}|${moodTenseKey}`
    const byRegionMoodTensePersonKey = `${region}|${moodTensePersonKey}`

    pushToMapBucket(byMoodTense, moodTenseKey, form)
    pushToMapBucket(byMoodTensePerson, moodTensePersonKey, form)
    pushToMapBucket(byRegionMoodTense, byRegionMoodTenseKey, form)
    pushToMapBucket(byRegionMoodTensePerson, byRegionMoodTensePersonKey, form)
  }

  return {
    byMoodTense,
    byMoodTensePerson,
    byRegionMoodTense,
    byRegionMoodTensePerson
  }
}

/**
 * Builds or reuses the cached forms pool for the provided settings.
 * @param {Object} params - Configuration for building the pool
 * @param {Object} params.settings - User settings that influence the pool
 * @param {string|null|undefined} params.region - Region override
 * @param {Object} [params.cache] - Existing cached pool { signature, forms }
 * @param {Function} params.generateAllFormsForRegion - Async builder for the pool
 * @param {Function} params.getFormsCacheKey - Deterministic signature generator
 * @param {Function} [params.now] - Timestamp factory for instrumentation
 * @returns {Promise<Object>} Resulting pool information
 */
export const resolveFormsPool = async ({
  settings,
  region,
  cache = { signature: null, forms: null },
  generateAllFormsForRegion,
  getFormsCacheKey,
  now = defaultNow
}) => {
  const effectiveRegion = region || DEFAULT_REGION
  const signature = getFormsCacheKey(effectiveRegion, settings)
  const hasCachedForms = Array.isArray(cache.forms) && cache.forms.length > 0

  if (hasCachedForms && cache.signature === signature) {
    const index = cache.index || createFormsCombinationIndex(cache.forms, { defaultRegion: effectiveRegion })
    return {
      forms: cache.forms,
      index,
      signature,
      reused: true,
      durationMs: 0,
      cache: { ...cache, index }
    }
  }

  const start = now()
  const forms = await generateAllFormsForRegion(effectiveRegion, settings)
  const end = now()
  const index = createFormsCombinationIndex(forms, { defaultRegion: effectiveRegion })

  return {
    forms,
    index,
    signature,
    reused: false,
    durationMs: Number((end - start).toFixed(2)),
    cache: {
      signature,
      forms,
      index
    }
  }
}

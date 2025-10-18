const DEFAULT_REGION = 'la_general'

const defaultNow = () => Date.now()

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
    return {
      forms: cache.forms,
      signature,
      reused: true,
      durationMs: 0,
      cache: { ...cache }
    }
  }

  const start = now()
  const forms = await generateAllFormsForRegion(effectiveRegion, settings)
  const end = now()

  return {
    forms,
    signature,
    reused: false,
    durationMs: Number((end - start).toFixed(2)),
    cache: {
      signature,
      forms
    }
  }
}


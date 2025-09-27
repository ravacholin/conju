import { isIrregularInTense as checkIrregularInTense } from '../utils/irregularityUtils.js'
import { getVerbByLemma } from '../core/verbDataService.js'

class VerbMetadataProvider {
  constructor() {
    this.cachedVerbs = new Map()
  }

  injectVerbs(verbs) {
    if (!Array.isArray(verbs)) {
      return
    }
    this.cachedVerbs.clear()
    verbs.forEach(verb => {
      const metadata = buildMetadataFromVerb(verb)
      if (metadata) {
        this.cachedVerbs.set(verb.lemma, metadata)
      }
    })
  }

  async getVerbMetadata(lemma) {
    if (!lemma) return null
    if (this.cachedVerbs.has(lemma)) {
      return this.cachedVerbs.get(lemma)
    }

    const verb = await getVerbByLemma(lemma)
    if (!verb) return null

    const metadata = buildMetadataFromVerb(verb)
    if (metadata) {
      this.cachedVerbs.set(lemma, metadata)
    }
    return metadata
  }

  async isVerbIrregularInTense(lemma, tense) {
    const metadata = await this.getVerbMetadata(lemma)
    if (!metadata) return false
    return metadata.isIrregularInTense(tense)
  }

  async getVerbType(lemma) {
    const metadata = await this.getVerbMetadata(lemma)
    return metadata?.type || 'regular'
  }

  async getVerbFrequency(lemma) {
    const metadata = await this.getVerbMetadata(lemma)
    return metadata?.frequency || 'medium'
  }

  clearCache() {
    this.cachedVerbs.clear()
  }

  getCacheStats() {
    return {
      size: this.cachedVerbs.size,
      keys: Array.from(this.cachedVerbs.keys())
    }
  }
}

function buildMetadataFromVerb(verb) {
  if (!verb || !verb.lemma) return null
  return {
    lemma: verb.lemma,
    type: verb.type || 'regular',
    frequency: verb.frequency || 'medium',
    isIrregularInTense: (tense) => checkIrregularInTense(verb, tense)
  }
}

export const verbMetadataProvider = new VerbMetadataProvider()

export function injectVerbsIntoProvider(verbs) {
  verbMetadataProvider.injectVerbs(verbs)
}

export function getVerbMetadata(lemma) {
  return verbMetadataProvider.getVerbMetadata(lemma)
}

export function isVerbIrregularInTense(lemma, tense) {
  return verbMetadataProvider.isVerbIrregularInTense(lemma, tense)
}

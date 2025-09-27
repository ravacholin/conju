import { useEffect, useState } from 'react'
import { useSettings } from '../state/settings.js'
import { buildFormsForRegion, getEligibleFormsForSettings } from '../lib/core/eligibility.js'

// Hook de conveniencia: retorna pool base por región y pool elegible (curriculum + dialecto)
export function useEligiblePool() {
  const settings = useSettings()
  const [base, setBase] = useState([])
  const [eligible, setEligible] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const baseForms = await buildFormsForRegion(settings.region, settings)
        if (cancelled) return
        setBase(baseForms)
        setEligible(getEligibleFormsForSettings(baseForms, settings))
      } catch (err) {
        if (cancelled) return
        console.error('useEligiblePool: failed to build forms for region', err)
        setError(err)
        setBase([])
        setEligible([])
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [settings])

  return { base, eligible, loading, error }
}

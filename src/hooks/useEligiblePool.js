import { useMemo } from 'react'
import { useSettings } from '../state/settings.js'
import { buildFormsForRegion, getEligibleFormsForSettings } from '../lib/core/eligibility.js'

// Hook de conveniencia: retorna pool base por región y pool elegible (curriculum + dialecto)
export function useEligiblePool() {
  const settings = useSettings()
  const base = useMemo(() => buildFormsForRegion(settings.region), [settings.region])
  const eligible = useMemo(() => getEligibleFormsForSettings(base, settings), [base, settings])
  return { base, eligible }
}


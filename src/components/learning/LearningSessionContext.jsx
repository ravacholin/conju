/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useSettings } from '../../state/settings.js'
import { createLogger } from '../../lib/utils/logger.js'

const SESSION_KEYS = [
  'practiceMode',
  'specificMood',
  'specificTense',
  'verbType',
  'selectedFamily',
  'allowedLemmas'
]

const LearningSessionContext = createContext(null)
const logger = createLogger('LearningSessionContext')

function pickSessionSlice(state) {
  return SESSION_KEYS.reduce((acc, key) => {
    acc[key] = state[key]
    return acc
  }, {})
}

export function LearningSessionProvider({ overrides = {}, children }) {
  const globalSettings = useSettings((state) => state)
  const [sessionOverrides, setSessionOverrides] = useState(() => ({
    practiceMode: 'specific',
    ...overrides
  }))
  const originalSliceRef = useRef(null)
  const hasMountedRef = useRef(false)

  const applyOverrides = useCallback(
    (nextOverrides) => {
      const updates = {}
      for (const key of SESSION_KEYS) {
        if (Object.prototype.hasOwnProperty.call(nextOverrides, key)) {
          const value = nextOverrides[key]
          if (value !== undefined) {
            updates[key] = value
          }
        }
      }
      if (Object.keys(updates).length > 0) {
        useSettings.setState(updates, false, 'learning/sessionOverrides')
        logger.debug('Applied learning session overrides', updates)
      }
    },
    []
  )

  useEffect(() => {
    if (!hasMountedRef.current) {
      const currentState = useSettings.getState()
      originalSliceRef.current = pickSessionSlice(currentState)
      hasMountedRef.current = true
      logger.debug('Captured original settings slice', originalSliceRef.current)
      applyOverrides(sessionOverrides)
    }
    return () => {
      if (originalSliceRef.current) {
        useSettings.setState(originalSliceRef.current, false, 'learning/sessionRestore')
        logger.debug('Restored original settings slice', originalSliceRef.current)
      }
    }
  }, [applyOverrides])

  useEffect(() => {
    if (hasMountedRef.current) {
      applyOverrides(sessionOverrides)
    }
  }, [sessionOverrides, applyOverrides])

  const sessionSettings = useMemo(() => ({
    ...globalSettings,
    ...sessionOverrides
  }), [globalSettings, sessionOverrides])

  const updateSessionOverrides = useCallback((updates) => {
    setSessionOverrides((prev) => ({
      ...prev,
      ...updates
    }))
  }, [])

  const value = useMemo(() => ({
    sessionSettings,
    sessionOverrides,
    updateSessionOverrides
  }), [sessionSettings, sessionOverrides, updateSessionOverrides])

  return (
    <LearningSessionContext.Provider value={value}>
      {children}
    </LearningSessionContext.Provider>
  )
}

export function useLearningSession() {
  const context = useContext(LearningSessionContext)
  if (!context) {
    throw new Error('useLearningSession must be used within a LearningSessionProvider')
  }
  return context
}

export function useOptionalLearningSession() {
  return useContext(LearningSessionContext)
}

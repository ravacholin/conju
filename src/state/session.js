import { create } from 'zustand'

const initialSessionState = {
  currentSession: null,
  currentActivityIndex: 0,
  sessionStartTime: null,
  activeSessionId: null,
  activePlanId: null
}

export const useSessionStore = create((set) => ({
  ...initialSessionState,
  startPersonalizedSession: (session) => set({
    currentSession: session || null,
    currentActivityIndex: 0,
    sessionStartTime: session ? Date.now() : null
  }),
  setCurrentActivityIndex: (index) => set({
    currentActivityIndex: Number.isFinite(index) ? index : 0
  }),
  setSessionStartTime: (timestamp) => set({
    sessionStartTime: timestamp ?? null
  }),
  clearPersonalizedSession: () => set({
    currentSession: null,
    currentActivityIndex: 0,
    sessionStartTime: null
  }),
  setPlanSession: (activeSessionId, activePlanId) => set({
    activeSessionId: activeSessionId || null,
    activePlanId: activePlanId || null
  }),
  clearPlanSession: () => set({
    activeSessionId: null,
    activePlanId: null
  }),
  resetSessionState: () => set({ ...initialSessionState })
}))

export const getSessionState = () => useSessionStore.getState()

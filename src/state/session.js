import { create } from 'zustand'

const initialSessionState = {
  currentSession: null,
  currentActivityIndex: 0,
  sessionStartTime: null,
  activeSessionId: null,
  activePlanId: null,
  runtimeCurrentBlock: null,
  runtimeReviewSessionType: null,
  runtimeReviewSessionFilter: null
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
  setDrillRuntimeContext: ({ currentBlock, reviewSessionType, reviewSessionFilter } = {}) => set((state) => ({
    runtimeCurrentBlock: currentBlock !== undefined ? (currentBlock || null) : state.runtimeCurrentBlock,
    runtimeReviewSessionType: reviewSessionType || state.runtimeReviewSessionType,
    runtimeReviewSessionFilter:
      reviewSessionFilter !== undefined
        ? (reviewSessionFilter && typeof reviewSessionFilter === 'object' ? reviewSessionFilter : {})
        : state.runtimeReviewSessionFilter
  })),
  clearDrillRuntimeContext: () => set({
    runtimeCurrentBlock: null,
    runtimeReviewSessionType: null,
    runtimeReviewSessionFilter: null
  }),
  resetSessionState: () => set({ ...initialSessionState })
}))

export const getSessionState = () => useSessionStore.getState()

export const getRuntimeDrillSettings = (baseSettings = {}) => {
  const runtime = useSessionStore.getState()
  return {
    ...baseSettings,
    currentBlock: runtime.runtimeCurrentBlock ?? baseSettings.currentBlock ?? null,
    reviewSessionType: runtime.runtimeReviewSessionType ?? baseSettings.reviewSessionType ?? 'due',
    reviewSessionFilter: runtime.runtimeReviewSessionFilter ?? baseSettings.reviewSessionFilter ?? {}
  }
}

import { create } from 'zustand'

// Estado efímero de los modos de juego del drill. Vive acá y no en `useSettings`
// para que no sobreviva a una recarga ni viaje en la sincronización de cuenta.
const initialGameState = {
  resistanceActive: false,
  resistanceMsLeft: 0,
  resistanceStartTs: null,
  reverseActive: false,
  doubleActive: false,
  // Cursores de rotación que el generador avanza en cada ítem.
  conmutacionIdx: 0,
  nextSecondPerson: '2s_vos'
}

const initialSessionState = {
  currentSession: null,
  currentActivityIndex: 0,
  sessionStartTime: null,
  activeSessionId: null,
  activePlanId: null,
  runtimeCurrentBlock: null,
  runtimeReviewSessionType: null,
  runtimeReviewSessionFilter: null,
  ...initialGameState
}

const GAME_STATE_KEYS = Object.freeze(Object.keys(initialGameState))

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
  setGameMode: (partial = {}) => set((state) => {
    const next = {}
    GAME_STATE_KEYS.forEach((key) => {
      if (partial[key] !== undefined) next[key] = partial[key]
    })

    // Inverso y Dos × Dos son mutuamente excluyentes.
    if (next.reverseActive) next.doubleActive = false
    if (next.doubleActive) next.reverseActive = false

    // Apagar Supervivencia limpia siempre su cronómetro.
    if (next.resistanceActive === false) {
      next.resistanceMsLeft = partial.resistanceMsLeft ?? 0
      next.resistanceStartTs = partial.resistanceStartTs ?? null
    }

    return { ...state, ...next }
  }),
  clearGameSession: () => set({ ...initialGameState }),
  resetSessionState: () => set({ ...initialSessionState })
}))

export const getSessionState = () => useSessionStore.getState()

export const getRuntimeDrillSettings = (baseSettings = {}) => {
  const runtime = useSessionStore.getState()
  return {
    ...baseSettings,
    currentBlock: runtime.runtimeCurrentBlock ?? baseSettings.currentBlock ?? null,
    reviewSessionType: runtime.runtimeReviewSessionType ?? baseSettings.reviewSessionType ?? 'due',
    reviewSessionFilter: runtime.runtimeReviewSessionFilter ?? baseSettings.reviewSessionFilter ?? {},
    resistanceActive: runtime.resistanceActive ?? baseSettings.resistanceActive ?? false,
    resistanceMsLeft: runtime.resistanceMsLeft ?? baseSettings.resistanceMsLeft ?? 0,
    resistanceStartTs: runtime.resistanceStartTs ?? baseSettings.resistanceStartTs ?? null,
    reverseActive: runtime.reverseActive ?? baseSettings.reverseActive ?? false,
    doubleActive: runtime.doubleActive ?? baseSettings.doubleActive ?? false,
    conmutacionIdx: runtime.conmutacionIdx ?? baseSettings.conmutacionIdx ?? 0,
    nextSecondPerson: runtime.nextSecondPerson ?? baseSettings.nextSecondPerson ?? '2s_vos'
  }
}

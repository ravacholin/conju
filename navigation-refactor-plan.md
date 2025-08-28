# Navigation System Refactor Plan

## Problem Analysis

The current navigation system tries to use one unified flow for two fundamentally different user journeys, creating complexity and fragility:

### Current Problematic Architecture
```
OnboardingFlow.jsx (unified, context-dependent)
├── Step 1: DialectSelection
├── Step 2: Main Menu (Por nivel / Por tema)
├── Step 3: LevelSelection (only "Por nivel")
├── Step 4: PracticeModeSelection (only "Por nivel") 
├── Step 5: MoodTenseSelection (shared, context-dependent)
├── Step 6: TenseSelection (only "Por tema")
├── Step 7: VerbTypeSelection (shared, context-dependent)
├── Step 8: FamilySelection (shared, context-dependent)
└── Drill Mode
```

### The Two Distinct User Flows
1. **"Por nivel" flow**: `Step1 → Step2 → Step3 → Step4 → Step5 → Step7 → (Step8?) → Drill`
2. **"Por tema" flow**: `Step1 → Step2 → Step5 → Step6 → Step7 → (Step8?) → Drill`

### Current Issues
- ❌ Shared components have context-dependent behavior
- ❌ Complex step calculation logic based on settings inference
- ❌ UI state sync timing issues  
- ❌ Fragile navigation with many edge cases
- ❌ Hard to maintain and extend

## Proposed Solution: Separate Flow Architecture

### New Clean Architecture
```
AppRouter.jsx
├── DialectSelection.jsx (Step 1 - shared)
├── MainMenu.jsx (Step 2 - shared)
├── PorNivelFlow/ 
│   ├── NivelLevelSelection.jsx
│   ├── NivelPracticeModeSelection.jsx  
│   ├── NivelMoodSelection.jsx
│   ├── NivelVerbTypeSelection.jsx
│   └── NivelFamilySelection.jsx
├── PorTemaFlow/
│   ├── TemaMoodSelection.jsx
│   ├── TemaTenseSelection.jsx
│   ├── TemaVerbTypeSelection.jsx
│   └── TemaFamilySelection.jsx
└── DrillMode.jsx (shared)
```

## Implementation Plan

### Phase 1: Create Separate Flow Components
**Goal**: Build new dedicated components without breaking existing functionality

#### 1.1 Create PorNivelFlow Module
- [ ] `src/components/onboarding/porNivel/NivelFlow.jsx` - Main flow controller
- [ ] `src/components/onboarding/porNivel/NivelLevelSelection.jsx` - Level selection (A1-C2)
- [ ] `src/components/onboarding/porNivel/NivelPracticeModeSelection.jsx` - Mixed vs Specific
- [ ] `src/components/onboarding/porNivel/NivelMoodSelection.jsx` - Mood selection for specific practice
- [ ] `src/components/onboarding/porNivel/NivelVerbTypeSelection.jsx` - Verb type selection
- [ ] `src/components/onboarding/porNivel/NivelFamilySelection.jsx` - Family selection for irregular verbs

#### 1.2 Create PorTemaFlow Module  
- [ ] `src/components/onboarding/porTema/TemaFlow.jsx` - Main flow controller
- [ ] `src/components/onboarding/porTema/TemaMoodSelection.jsx` - Mood selection
- [ ] `src/components/onboarding/porTema/TemaTenseSelection.jsx` - Tense selection  
- [ ] `src/components/onboarding/porTema/TemaVerbTypeSelection.jsx` - Verb type selection
- [ ] `src/components/onboarding/porTema/TemaFamilySelection.jsx` - Family selection for irregular verbs

### Phase 2: Implement Flow-Specific Navigation Hooks
**Goal**: Clean, predictable navigation with no context inference

#### 2.1 Create Flow-Specific Hooks
- [ ] `src/hooks/usePorNivelFlow.js` - Navigation logic for "Por nivel" flow
  - Steps: `nivel_selection → practice_mode → mood_selection → verb_type → family → drill`
  - Clear back navigation: each step knows its exact previous step
  
- [ ] `src/hooks/usePorTemaFlow.js` - Navigation logic for "Por tema" flow  
  - Steps: `mood_selection → tense_selection → verb_type → family → drill`
  - Clear back navigation: each step knows its exact previous step

#### 2.2 Navigation Benefits
- ✅ **No context inference**: Each flow knows its own steps
- ✅ **Predictable back navigation**: `currentStep - 1` logic
- ✅ **No shared component confusion**: Each component serves one flow
- ✅ **Easy to test**: Linear, predictable state transitions
- ✅ **Easy to extend**: Add new steps without affecting other flow

### Phase 3: Update AppRouter Integration
**Goal**: Route to correct flow based on user choice

#### 3.1 Modify AppRouter.jsx
```javascript
// Routing logic
if (currentMode === 'onboarding') {
  if (flowType === 'por_nivel') {
    return <PorNivelFlow onStartPractice={handleStartPractice} onHome={handleHome} />
  } else if (flowType === 'por_tema') {
    return <PorTemaFlow onStartPractice={handleStartPractice} onHome={handleHome} />
  }
  // Fallback to main menu
  return <OnboardingFlow />
}
```

#### 3.2 Flow Selection Logic
- [ ] Update MainMenu.jsx to set `flowType` when user chooses "Por nivel" or "Por tema"
- [ ] Store flow type in settings: `settings.flowType = 'por_nivel' | 'por_tema'`
- [ ] Clear flow type when returning to main menu

### Phase 4: Drill Mode Integration
**Goal**: Drill knows which flow it came from for correct back navigation

#### 4.1 Update Drill Back Navigation
```javascript
const calculatePreviousStepFromDrill = () => {
  if (settings.flowType === 'por_nivel') {
    // Por nivel flow logic
    if (settings.selectedFamily) return { flow: 'por_nivel', step: 'family_selection' }
    if (settings.verbType) return { flow: 'por_nivel', step: 'verb_type_selection' }
    if (settings.specificMood) return { flow: 'por_nivel', step: 'mood_selection' }
    return { flow: 'por_nivel', step: 'practice_mode_selection' }
  } else {
    // Por tema flow logic  
    if (settings.selectedFamily) return { flow: 'por_tema', step: 'family_selection' }
    if (settings.verbType) return { flow: 'por_tema', step: 'verb_type_selection' }
    if (settings.specificTense) return { flow: 'por_tema', step: 'tense_selection' }
    return { flow: 'por_tema', step: 'mood_selection' }
  }
}
```

### Phase 5: Testing & Validation
**Goal**: Ensure all navigation scenarios work reliably

#### 5.1 Flow Testing Checklist
- [ ] **Por Nivel Flow**: Step1 → Step2 → NivelFlow → Drill → Back navigation
- [ ] **Por Tema Flow**: Step1 → Step2 → TemaFlow → Drill → Back navigation  
- [ ] **Hardware back**: Works from every step in both flows
- [ ] **Software back**: Works from every step in both flows
- [ ] **Drill navigation**: Correctly returns to previous step in each flow
- [ ] **Settings cleanup**: Proper state cleanup when navigating back
- [ ] **Edge cases**: Browser refresh, direct URL access, etc.

#### 5.2 Regression Testing  
- [ ] Ensure existing functionality still works during transition
- [ ] Test all dialect combinations (vos, tú, vosotros, all)
- [ ] Test all levels (A1-C2, ALL)
- [ ] Test all practice modes (mixed, specific)
- [ ] Test irregular family selection

### Phase 6: Migration & Cleanup
**Goal**: Remove old unified system, keep codebase clean

#### 6.1 Gradual Migration
- [ ] Feature flag: `USE_SEPARATE_FLOWS` to toggle between old/new system
- [ ] A/B test with small user group first
- [ ] Monitor error rates and user feedback

#### 6.2 Old Code Removal
- [ ] Remove old `OnboardingFlow.jsx` (except Step 1, 2)
- [ ] Remove old `useOnboardingFlow.js` complex step calculation logic
- [ ] Remove old shared components: `MoodTenseSelection.jsx`, `VerbTypeSelection.jsx`, etc.
- [ ] Update imports throughout codebase

## Benefits of New Architecture

### 🎯 **Predictable Navigation**
- Each flow has linear step progression
- Back navigation is always `currentStep - 1`  
- No complex context inference logic

### 🧹 **Cleaner Code**
- Each component serves single purpose
- No shared components with context-dependent behavior
- Easier to reason about and maintain

### 🚀 **Better Performance**
- No unnecessary re-renders from shared state
- Simpler component lifecycle
- Faster development and debugging

### 🧪 **Easier Testing**
- Linear flow progression is easy to test
- No complex state combinations to test
- Clear component boundaries

### 📈 **Future Extensibility**
- Add new steps to specific flows without affecting others
- Easy to add new flow types (e.g., "Por conjugación", "Por verbo")
- Component reuse through composition, not shared complexity

## Migration Risk Mitigation

### Low Risk Migration Strategy
1. **Build new system alongside old** (no breaking changes)
2. **Feature flag rollout** (easy rollback)
3. **Gradual user migration** (monitor metrics)
4. **Keep old system** until new system is proven stable

### Rollback Plan
- Feature flag can instantly revert to old system
- Old components remain untouched during Phase 1-4
- Database/settings remain compatible with both systems

## Timeline Estimate

- **Phase 1-2**: 2-3 days (component creation, flow hooks)
- **Phase 3-4**: 1-2 days (integration, drill navigation)
- **Phase 5**: 2-3 days (comprehensive testing)
- **Phase 6**: 1 day (cleanup, migration)

**Total**: ~1-2 weeks for complete migration

## Success Metrics

- ✅ Zero navigation bugs reported
- ✅ Hardware/software back work 100% reliably  
- ✅ User flow completion rates improve
- ✅ Development velocity increases (easier to add features)
- ✅ Code maintainability score improves
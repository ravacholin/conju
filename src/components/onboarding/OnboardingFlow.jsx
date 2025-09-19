/**
 * OnboardingFlow.jsx - Componente principal del flujo de configuración inicial
 * 
 * Este componente orquesta el proceso de configuración inicial del usuario,
 * guiándolo a través de múltiples pasos para personalizar su experiencia de práctica.
 * 
 * @component
 * @description
 * Responsabilidades principales:
 * - Gestión del flujo multi-paso de onboarding (7 pasos máximo)
 * - Coordinación entre diferentes paneles de selección
 * - Manejo de navegación hacia atrás usando historial del navegador
 * - Integración con sistema de configuraciones globales
 * - Transición fluida hacia modo de práctica configurado
 * 
 * Flujo de pasos del onboarding:
 * 1. DialectSelection: Selección de dialecto regional (rioplatense/general/peninsular)
 * 2. LevelSelection: Modo básico de selección de nivel o navegación avanzada
 * 3. LevelSelection (detalles): Selección específica de nivel CEFR con descripción
 * 4. PracticeModeSelection: Elección entre práctica mixta o específica por tiempo
 * 5. MoodTenseSelection | VerbTypeSelection: Configuración específica según modo
 * 6. VerbTypeSelection: Tipo de verbos (regular/irregular/familia específica)
 * 7. FamilySelection: Selección de familias irregulares específicas
 * 
 * @example
 * ```jsx
 * // Uso típico desde AppRouter
 * <OnboardingFlow 
 *   onStartPractice={handleStartPractice}
 *   setCurrentMode={setCurrentMode}
 *   formsForRegion={allFormsForRegion}
 *   onboardingStep={onboardingFlow.onboardingStep}
 *   selectDialect={onboardingFlow.selectDialect}
 *   selectLevel={onboardingFlow.selectLevel}
 *   // ... otros props del hook onboardingFlow
 * />
 * ```
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onStartPractice - Callback para iniciar práctica configurada
 * @param {Function} props.setCurrentMode - Setter para cambiar modo de aplicación
 * @param {Array} props.formsForRegion - Forms elegibles para la región seleccionada
 * @param {Function} props.onStartLearningNewTense - Iniciar flujo de aprendizaje estructurado
 * @param {number} props.onboardingStep - Paso actual del onboarding (1-7)
 * @param {Function} props.selectDialect - Seleccionar dialecto y avanzar
 * @param {Function} props.selectLevel - Seleccionar nivel CEFR
 * @param {Function} props.selectPracticeMode - Seleccionar modo de práctica
 * @param {Function} props.selectMood - Seleccionar modo verbal
 * @param {Function} props.selectTense - Seleccionar tiempo verbal específico
 * @param {Function} props.selectVerbType - Seleccionar tipo de verbos
 * @param {Function} props.selectFamily - Seleccionar familia irregular específica
 * @param {Function} props.goToLevelDetails - Navegar a detalles de nivel
 * @param {Function} props.handleHome - Navegar al menú principal con limpieza de estado
 * @param {Object} props.settings - Configuraciones globales de usuario (Zustand store)
 * @param {Function} props.getAvailableMoodsForLevel - Obtener modos disponibles por nivel
 * @param {Function} props.getAvailableTensesForLevelAndMood - Obtener tiempos por nivel/modo
 * @param {Function} props.getModeSamples - Obtener ejemplos para modos de práctica
 * @param {Function} props.getConjugationExample - Obtener ejemplo de conjugación
 * @param {Function} props.onGoToProgress - Navegar al dashboard de progreso
 * 
 * @requires DialectSelection - Selección de dialecto regional
 * @requires LevelSelection - Selección de nivel CEFR con opciones avanzadas
 * @requires PracticeModeSelection - Elección de modo de práctica
 * @requires MoodTenseSelection - Selección específica de tiempo verbal
 * @requires VerbTypeSelection - Selección de tipo de verbos
 * @requires FamilySelection - Selección de familias irregulares
 * @requires ClickableCard - Componente base de interfaz
 * 
 * @see {@link ./DialectSelection.jsx} - Selección de dialecto
 * @see {@link ./LevelSelection.jsx} - Selección de nivel
 * @see {@link ./MoodTenseSelection.jsx} - Selección de tiempo específico
 * @see {@link ../../hooks/useOnboardingFlow.js} - Hook de lógica del flujo
 */

import React from 'react'
import Toast from '../Toast.jsx'
import DialectSelection from './DialectSelection.jsx'
import LevelSelection from './LevelSelection.jsx'
import PracticeModeSelection from './PracticeModeSelection.jsx'
import MoodTenseSelection from './MoodTenseSelection.jsx'
import VerbTypeSelection from './VerbTypeSelection.jsx'
import FamilySelection from './FamilySelection.jsx'
import ClickableCard from '../shared/ClickableCard.jsx'

/**
 * Componente principal del flujo de configuración inicial
 * 
 * @param {Object} props - Propiedades del componente según la documentación JSDoc superior
 * @returns {JSX.Element} El componente de flujo de onboarding
 */
function OnboardingFlow({ 
  onStartPractice, 
  setCurrentMode, 
  formsForRegion,
  onStartLearningNewTense,
  // Hook functions from AppRouter
  onboardingStep,
  selectDialect,
  selectLevel,
  selectPracticeMode,
  selectMood,
  selectTense,
  selectVerbType,
  selectFamily,
  // goBack, // Commented out - currently unused
  goToLevelDetails,
  handleHome,
  settings,
  getAvailableMoodsForLevel,
  getAvailableTensesForLevelAndMood,
  getModeSamples,
  getConjugationExample,
  onGoToProgress
}) {

  const [toast, setToast] = React.useState(null)
  const showToast = (message, type = 'success') => setToast({ message, type })
  const dialectLabel = (d) => ({ rioplatense: 'Rioplatense', la_general: 'Latinoamericano', peninsular: 'Peninsular', both: 'Todos' }[d] || 'Configurado')

  // Wrap handlers to add toasts
  const handleSelectDialect = (d) => {
    try { selectDialect(d); showToast(`Dialecto ${dialectLabel(d)} configurado`) } catch { /* ignore errors */ }
  }
  const handleSelectLevel = (lvl) => {
    try { selectLevel(lvl); showToast(`Nivel ${lvl} establecido`) } catch { /* ignore errors */ }
  }
  const handleSelectPracticeMode = (mode) => {
    try { selectPracticeMode(mode); showToast(`Modo de práctica: ${mode === 'mixed' ? 'Mixta' : 'Específica'}`) } catch { /* ignore errors */ }
  }
  const handleSelectMood = (mood) => {
    try { selectMood(mood); showToast(`Modo seleccionado`) } catch { /* ignore errors */ }
  }
  const handleSelectTense = (tense) => {
    try { selectTense(tense); showToast(`Tiempo seleccionado`) } catch { /* ignore errors */ }
  }
  const handleSelectVerbType = (verbType, onStart) => {
    try { selectVerbType(verbType, onStart); showToast(`Tipo: ${verbType}`) } catch { /* ignore errors */ }
  }
  const handleSelectFamily = (familyId, onStart) => {
    try { selectFamily(familyId, onStart); showToast(`Familia seleccionada`) } catch { /* ignore errors */ }
  }
  // Unified back behavior: use browser history for both UI and hardware back
  const handleBack = () => {
    try { 
      window.history.back() 
    } catch { 
      /* ignore */ 
    }
  }

  return (
    <div className="App">
      <div className="onboarding">
        <div className="center-column">
          {/* Header with logo */}
          <ClickableCard className="app-logo" onClick={() => handleHome(setCurrentMode)} title="Ir al menú ¿Qué querés practicar?">
            <img src="/verbosmain_transparent.png" alt="VerbOS" width="180" height="180" />
          </ClickableCard>
          
          {/* Step 1: Dialect Selection */}
          {onboardingStep === 1 && (
            <DialectSelection onSelectDialect={handleSelectDialect} />
          )}

          {/* Step 2: Level Selection Mode */}
          {onboardingStep === 2 && (
            <LevelSelection 
              onSelectLevel={handleSelectLevel}
              onSelectPracticeMode={handleSelectPracticeMode}
              onGoToLevelDetails={goToLevelDetails}
              onBack={handleBack}
              showLevelDetails={false}
              onGoToProgress={onGoToProgress}
              onStartLearningNewTense={onStartLearningNewTense}
            />
          )}

          {/* Step 3: Specific Level Selection */}
          {onboardingStep === 3 && (
            <LevelSelection 
              onSelectLevel={handleSelectLevel}
              onSelectPracticeMode={handleSelectPracticeMode}
              onGoToLevelDetails={goToLevelDetails}
              onBack={handleBack}
              showLevelDetails={true}
            />
          )}

          {/* Step 4: Practice Mode Selection */}
          {onboardingStep === 4 && (
            <PracticeModeSelection 
              onSelectPracticeMode={handleSelectPracticeMode}
              onBack={handleBack}
              settings={settings}
            />
          )}

          {/* Step 5: MoodTenseSelection (for theme practice) OR VerbTypeSelection (for mixed practice) */}
          {onboardingStep === 5 && (
            <>
              {settings.practiceMode === 'mixed' ? (
                <VerbTypeSelection 
                  onSelectVerbType={(verbType) => handleSelectVerbType(verbType, onStartPractice)}
                  onBack={handleBack}
                />
              ) : (
                <MoodTenseSelection 
                  formsForRegion={formsForRegion}
                  settings={settings}
                  onSelectMood={handleSelectMood}
                  onSelectTense={handleSelectTense}
                  onBack={handleBack}
                  getAvailableMoodsForLevel={getAvailableMoodsForLevel}
                  getAvailableTensesForLevelAndMood={getAvailableTensesForLevelAndMood}
                  getModeSamples={getModeSamples}
                  getConjugationExample={getConjugationExample}
                />
              )}
            </>
          )}

          {/* Step 6: MoodTenseSelection for mixed practice OR Tense selection after mood in theme practice */}
          {onboardingStep === 6 && (
            <>
              {settings.practiceMode === 'mixed' && settings.verbType === 'irregular' && !(settings.specificMood === 'nonfinite' && (settings.specificTense === 'ger' || settings.specificTense === 'nonfiniteMixed')) ? (
                <FamilySelection 
                  settings={settings}
                  onSelectFamily={(familyId) => handleSelectFamily(familyId, onStartPractice)}
                  onBack={handleBack}
                />
              ) : (
                <MoodTenseSelection 
                  formsForRegion={formsForRegion}
                  settings={settings}
                  onSelectMood={handleSelectMood}
                  onSelectTense={handleSelectTense}
                  onBack={handleBack}
                  getAvailableMoodsForLevel={getAvailableMoodsForLevel}
                  getAvailableTensesForLevelAndMood={getAvailableTensesForLevelAndMood}
                  getModeSamples={getModeSamples}
                  getConjugationExample={getConjugationExample}
                />
              )}
            </>
          )}

          {/* Step 7: VerbTypeSelection for any practice mode */}
          {onboardingStep === 7 && (
            <VerbTypeSelection 
              onSelectVerbType={(verbType) => handleSelectVerbType(verbType, onStartPractice)}
              onBack={handleBack}
            />
          )}

          {/* Step 8: Family Selection for Irregular Verbs */}
          {onboardingStep === 8 && settings.verbType === 'irregular' && !(settings.specificMood === 'nonfinite' && (settings.specificTense === 'ger' || settings.specificTense === 'nonfiniteMixed')) && (
            <FamilySelection 
              settings={settings}
              onSelectFamily={(familyId) => handleSelectFamily(familyId, onStartPractice)}
              onBack={handleBack}
            />
          )}
        </div>
        {toast?.message && (
          <Toast
            key={`${toast.type}-${toast.message}`}
            message={toast.message}
            type={toast.type}
            duration={1400}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
}

export default OnboardingFlow;

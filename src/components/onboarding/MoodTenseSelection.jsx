/**
 * MoodTenseSelection.jsx - Componente de selección específica de modo y tiempo verbal
 * 
 * Este componente maneja la selección granular de modos y tiempos verbales
 * para práctica específica, adaptándose dinámicamente al contexto del usuario.
 * 
 * @component
 * @description
 * Responsabilidades principales:
 * - Selección secuencial de modo verbal (indicativo, subjuntivo, imperativo)
 * - Selección específica de tiempo verbal dentro del modo elegido
 * - Filtrado dinámico por nivel CEFR cuando aplicable
 * - Generación de ejemplos contextuales para cada opción
 * - Manejo de múltiples flujos de entrada (desde menú principal vs. desde nivel)
 * 
 * Escenarios de renderizado:
 * 1. Nivel + modo específico → Selección de tiempo filtrada por nivel
 * 2. Nivel + práctica específica → Selección de modo filtrada por nivel
 * 3. Práctica específica + modo → Selección completa de tiempos
 * 4. Práctica específica sin nivel → Selección completa de modos
 * 
 * @example
 * ```jsx
 * // Desde OnboardingFlow para práctica específica
 * <MoodTenseSelection
 *   settings={settings}
 *   onSelectMood={onboardingFlow.selectMood}
 *   onSelectTense={onboardingFlow.selectTense}
 *   onBack={handleBack}
 *   getAvailableMoodsForLevel={onboardingFlow.getAvailableMoodsForLevel}
 *   getAvailableTensesForLevelAndMood={onboardingFlow.getAvailableTensesForLevelAndMood}
 *   getConjugationExample={onboardingFlow.getConjugationExample}
 * />
 * ```
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.settings - Configuraciones globales de usuario (Zustand store)
 * @param {Function} props.onSelectMood - Handler para seleccionar modo verbal
 * @param {Function} props.onSelectTense - Handler para seleccionar tiempo específico
 * @param {Function} props.onBack - Handler para navegación hacia atrás
 * @param {Function} props.getAvailableMoodsForLevel - Obtener modos disponibles por nivel CEFR
 * @param {Function} props.getAvailableTensesForLevelAndMood - Obtener tiempos por nivel y modo
 * @param {Function} props.getConjugationExample - Generar ejemplo de conjugación contextual
 * 
 * @requires ClickableCard - Componente base de selección
 * @requires verbLabels - Utilidades para etiquetas y filtrado de tiempos
 * 
 * @see {@link ../../lib/utils/verbLabels.js} - Utilidades de etiquetas y filtrado
 * @see {@link ../shared/ClickableCard.jsx} - Componente base de interfaz
 * @see {@link ../../hooks/useOnboardingFlow.js} - Hook con lógica de filtrado
 */

import React, { useEffect } from 'react'
import ClickableCard from '../shared/ClickableCard.jsx'
import { getTensesForMood, getTenseLabel, getMoodLabel } from '../../lib/utils/verbLabels.js'

/**
 * Componente de selección específica de modo y tiempo verbal
 * 
 * @param {Object} props - Propiedades del componente según la documentación JSDoc superior
 * @returns {JSX.Element} El componente de selección de modo/tiempo
 */
function MoodTenseSelection({ 
  settings, 
  // formsForRegion, // Commented out - currently unused
  onSelectMood, 
  onSelectTense,
  onBack,
  getAvailableMoodsForLevel,
  getAvailableTensesForLevelAndMood,
  // getModeSamples,
  getConjugationExample
}) {
  
  // Log state changes for debugging
  useEffect(() => {
    console.log('MoodTenseSelection: settings changed', {
      level: settings.level,
      practiceMode: settings.practiceMode,
      specificMood: settings.specificMood,
      specificTense: settings.specificTense
    });
  }, [settings.level, settings.practiceMode, settings.specificMood, settings.specificTense]);
  
  if (settings.level && settings.practiceMode === 'specific' && settings.specificMood) {
    // Level-specific practice with mood already selected - show tense selection
    return (
      <>
        <div className="options-grid">
          {getAvailableTensesForLevelAndMood(settings.level, settings.specificMood).map(tense => (
            <ClickableCard 
              key={tense} 
              className="option-card compact" 
              onClick={() => onSelectTense(tense)}
              title={`Seleccionar ${getTenseLabel(tense)}`}
            >
              <h3>{getTenseLabel(tense)}</h3>
              <p className="conjugation-example">{getConjugationExample(settings.specificMood, tense)}</p>
            </ClickableCard>
          ))}
        </div>
        
        <button onClick={onBack} className="back-btn">
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      </>
    )
  }
  
  if (settings.level && settings.practiceMode === 'specific') {
    // Specific practice from level - show filtered moods
    const availableMoods = getAvailableMoodsForLevel(settings.level)
    return (
      <>
        <div className="options-grid">
          {availableMoods.map(mood => (
            <ClickableCard 
              key={mood} 
              className="option-card compact" 
              onClick={() => onSelectMood(mood)}
              title={`Seleccionar ${getMoodLabel(mood)}`}
            >
              <h3>{getMoodLabel(mood)}</h3>
              <p className="conjugation-example">yo hablo, tú hablas, él/ella habla</p>
            </ClickableCard>
          ))}
        </div>
        
        <button onClick={onBack} className="back-btn">
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      </>
    )
  }
  
  if (!settings.level && settings.practiceMode === 'specific' && settings.specificMood) {
    // Coming from main menu - show tense selection
    console.log('MoodTenseSelection: Showing tense selection', {
      specificMood: settings.specificMood
    });
    
    // Use higher-level helper for examples
    
    return (
      <>
        <div className="options-grid">
          {getTensesForMood(settings.specificMood).map(tense => (
            <ClickableCard 
              key={tense} 
              className="option-card compact" 
              onClick={() => onSelectTense(tense)}
              title={`Seleccionar ${getTenseLabel(tense)}`}
            >
              <h3>{getTenseLabel(tense)}</h3>
              <p className="conjugation-example">{getConjugationExample(settings.specificMood, tense)}</p>
            </ClickableCard>
          ))}
        </div>
        
        <button onClick={onBack} className="back-btn">
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      </>
    )
  }
  
  if (!settings.level && settings.practiceMode === 'specific') {
    // Coming from forms specific without level - show mood selection
    console.log('MoodTenseSelection: Showing mood selection');
    return (
      <>
        <div className="options-grid">
          <ClickableCard 
            className="option-card compact" 
            onClick={() => onSelectMood('indicative')}
            title="Seleccionar modo indicativo"
          >
            <h3>Indicativo</h3>
            <p className="conjugation-example">yo hablo, tú hablas, él/ella habla</p>
          </ClickableCard>
          
          <ClickableCard 
            className="option-card compact" 
            onClick={() => onSelectMood('subjunctive')}
            title="Seleccionar modo subjuntivo"
          >
            <h3>Subjuntivo</h3>
            <p className="conjugation-example">yo hable, tú hables, él/ella hable</p>
          </ClickableCard>
          
          <ClickableCard 
            className="option-card compact" 
            onClick={() => onSelectMood('imperative')}
            title="Seleccionar modo imperativo"
          >
            <h3>Imperativo</h3>
            <p className="conjugation-example">tú habla, vos hablá, usted hable</p>
          </ClickableCard>
          
          <ClickableCard 
            className="option-card compact" 
            onClick={() => onSelectMood('conditional')}
            title="Seleccionar modo condicional"
          >
            <h3>Condicional</h3>
            <p className="conjugation-example">yo hablaría, tú hablarías, él/ella hablaría</p>
          </ClickableCard>
          
          <ClickableCard 
            className="option-card compact" 
            onClick={() => onSelectMood('nonfinite')}
            title="Seleccionar formas no conjugadas"
          >
            <h3>Formas no conjugadas</h3>
            <p className="conjugation-example">hablando, hablado</p>
          </ClickableCard>
        </div>
        
        <button onClick={onBack} className="back-btn">
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      </>
    )
  }
  
  // Theme mode: show tense selection if mood already selected
  if (settings.practiceMode === 'theme' && settings.specificMood) {
    console.log('MoodTenseSelection: Theme mode - showing tense selection for mood:', settings.specificMood);
    
    // Use higher-level helper for examples
    
    return (
      <>
        <div className="options-grid">
          {getTensesForMood(settings.specificMood).map(tense => (
            <ClickableCard 
              key={tense} 
              className="option-card compact" 
              onClick={() => onSelectTense(tense)}
              title={`Seleccionar ${getTenseLabel(tense)}`}
            >
              <h3>{getTenseLabel(tense)}</h3>
              <p className="conjugation-example">{getConjugationExample(settings.specificMood, tense)}</p>
            </ClickableCard>
          ))}
        </div>
        
        <button onClick={onBack} className="back-btn">
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      </>
    )
  }
  
  // Theme mode: show mood selection
  if (settings.practiceMode === 'theme') {
    console.log('MoodTenseSelection: Theme mode - showing mood selection');
    return (
      <>
        <div className="options-grid">
          <ClickableCard 
            className="option-card compact" 
            onClick={() => onSelectMood('indicative')}
            title="Seleccionar modo indicativo"
          >
            <h3>Indicativo</h3>
            <p className="conjugation-example">yo hablo, tú hablas, él/ella habla</p>
          </ClickableCard>
          
          <ClickableCard 
            className="option-card compact" 
            onClick={() => onSelectMood('subjunctive')}
            title="Seleccionar modo subjuntivo"
          >
            <h3>Subjuntivo</h3>
            <p className="conjugation-example">yo hable, tú hables, él/ella hable</p>
          </ClickableCard>
          
          <ClickableCard 
            className="option-card compact" 
            onClick={() => onSelectMood('imperative')}
            title="Seleccionar modo imperativo"
          >
            <h3>Imperativo</h3>
            <p className="conjugation-example">tú habla, vos hablá, usted hable</p>
          </ClickableCard>
          
          <ClickableCard 
            className="option-card compact" 
            onClick={() => onSelectMood('conditional')}
            title="Seleccionar modo condicional"
          >
            <h3>Condicional</h3>
            <p className="conjugation-example">yo hablaría, tú hablarías, él/ella hablaría</p>
          </ClickableCard>
          
          <ClickableCard 
            className="option-card compact" 
            onClick={() => onSelectMood('nonfinite')}
            title="Seleccionar formas no conjugadas"
          >
            <h3>Formas no conjugadas</h3>
            <p className="conjugation-example">hablando, hablado</p>
          </ClickableCard>
        </div>
        
        <button onClick={onBack} className="back-btn">
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      </>
    )
  }
  
  return null
}

export default MoodTenseSelection

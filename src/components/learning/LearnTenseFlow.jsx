/**
 * LearnTenseFlow.jsx - Componente principal del flujo de aprendizaje estructurado
 * 
 * Este componente orquesta el flujo completo de aprendizaje de tiempos verbales,
 * desde la selección hasta la práctica comunicativa con algoritmos adaptativos.
 * 
 * @component
 * @description
 * Responsabilidades principales:
 * - Gestión del flujo de aprendizaje multi-etapa (introducción → práctica mecánica → práctica significativa → práctica comunicativa)
 * - Selección dinámica de verbos basada en familias irregulares y nivel de dificultad
 * - Integración con motor de aprendizaje adaptativo y sistema de A/B testing
 * - Manejo de configuraciones de sesión personalizadas por duración
 * - Navegación inteligente con salto de fases según nivel de dominio del usuario
 * 
 * Fases del flujo de aprendizaje:
 * 1. 'tense-selection': Selección de tiempo verbal con ejemplos dinámicos
 * 2. 'type-selection': Elección entre verbos regulares/irregulares con categorías pedagógicas
 * 3. 'duration-selection': Configuración de duración personalizada de sesión
 * 4. 'introduction': Introducción narrativa con contexto cultural
 * 5. 'guided_drill_*': Práctica mecánica guiada por conjugaciones (-ar, -er, -ir)
 * 6. 'recap': Resumen y consolidación de patrones aprendidos
 * 7. 'practice': Práctica mecánica con verbos adicionales (excluyendo ejemplos iniciales)
 * 8. 'meaningful_practice': Práctica contextual con oraciones completas
 * 9. 'pronunciation_practice': Práctica de pronunciación con audio
 * 10. 'communicative_practice': Práctica comunicativa con situaciones reales
 * 
 * @example
 * ```jsx
 * // Uso típico desde AppRouter
 * <LearnTenseFlow 
 *   onHome={() => router.navigate({ mode: 'onboarding', step: 2 })}
 *   onGoToProgress={() => router.navigate({ mode: 'progress' })}
 * />
 * ```
 * 
 * Características avanzadas:
 * - Selección coherente de verbos ejemplo usando familias irregulares prioritarias
 * - Integración con motor adaptativo para personalización de dificultad
 * - Sistema de A/B testing para optimización de flujo
 * - Manejo de errores con ErrorBoundary por fase
 * - Soporte para dialectos regionales (voseo/tuteo)
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onHome - Función para navegar al menú principal
 * @param {Function} props.onGoToProgress - Función para navegar al dashboard de progreso
 * 
 * @requires useSettings - Hook de configuraciones globales (dialecto, voseo)
 * @requires verbs - Base de datos de verbos con paradigmas regionales
 * @requires curriculum - Configuración CEFR de niveles y tiempos
 * @requires adaptiveEngine - Motor de personalización de dificultad
 * @requires abTesting - Sistema de experimentación A/B
 * 
 * @see {@link ./LearningDrill.jsx} - Componente de práctica mecánica
 * @see {@link ./NarrativeIntroduction.jsx} - Componente de introducción narrativa
 * @see {@link ../shared/ClickableCard.jsx} - Componente base de selección
 * @see {@link ../../lib/data/learningIrregularFamilies.js} - Familias pedagógicas de verbos irregulares
 * @see {@link ../../lib/learning/adaptiveEngine.js} - Motor de aprendizaje adaptativo
 */

import React, { useState, useMemo, useEffect } from 'react';
import curriculum from '../../data/curriculum.json';
import { verbs } from '../../data/verbs.js';
import { storyData } from '../../data/narrativeStories.js';
import { MOOD_LABELS, TENSE_LABELS, formatMoodTense } from '../../lib/utils/verbLabels.js';
import { getLearningFamiliesForTense } from '../../lib/data/learningIrregularFamilies.js';
import { calculateAdaptiveDifficulty, personalizeSessionDuration, canSkipPhase } from '../../lib/learning/adaptiveEngine.js';
import { 
  SESSION_DURATIONS, 
  getSessionDurationOptions, 
  getNextFlowStep, 
  AB_TESTING_CONFIG 
} from '../../lib/learning/learningConfig.js';
import { abTesting } from '../../lib/learning/analytics.js';
import ClickableCard from '../shared/ClickableCard.jsx';
import NarrativeIntroduction from './NarrativeIntroduction.jsx';
import LearningDrill from './LearningDrill.jsx';
import MeaningfulPractice from './MeaningfulPractice.jsx';
import CommunicativePractice from './CommunicativePractice.jsx';
import PronunciationPractice from './PronunciationPractice.jsx';
import EndingsDrill from './EndingsDrill.jsx';
import ErrorBoundary from '../ErrorBoundary.jsx';
import { createLogger } from '../../lib/utils/logger.js';
import './LearnTenseFlow.css';
import { useSettings } from '../../state/settings.js';
import { getCurrentUserId } from '../../lib/progress/userManager.js';



// Import the family definitions directly
import { LEARNING_IRREGULAR_FAMILIES } from '../../lib/data/learningIrregularFamilies.js';

const logger = createLogger('LearnTenseFlow');

/**
 * Selecciona 3 verbos ejemplo coherentes basados en la elección del usuario
 * 
 * Esta función es la fuente única de verdad para la selección de verbos
 * en todo el flujo de aprendizaje, garantizando coherencia pedagógica.
 * 
 * @function selectExampleVerbs
 * @param {string} verbType - Tipo de verbos ('regular' | 'irregular')
 * @param {Array<string>} selectedFamilies - IDs de familias irregulares seleccionadas
 * @param {string} tense - Tiempo verbal objetivo
 * @returns {Array<Object>} Array de exactamente 3 objetos verb con paradigmas completos
 * 
 * Estrategia de selección:
 * - Regular: hablar (-ar), comer (-er), vivir (-ir)
 * - Irregular: Prioriza verbos de alta frecuencia de familias pedagógicas
 * - Mantiene coherencia: nunca mezcla regulares e irregulares
 * - Garantiza exactamente 3 verbos para demos consistentes
 */
function selectExampleVerbs(verbType, selectedFamilies, tense) {
  logger.debug('Selecting coherent verbs', { verbType, selectedFamilies, tense });
  let selectedVerbs = [];
  let candidateVerbs = [];

  if (verbType === 'regular') {
    // For regular verbs, use simple regular examples
    const regularAr = verbs.find(v => v.lemma === 'hablar' && v.type === 'regular');
    const regularEr = verbs.find(v => v.lemma === 'comer' && v.type === 'regular');
    const regularIr = verbs.find(v => v.lemma === 'vivir' && v.type === 'regular');
    selectedVerbs = [regularAr, regularEr, regularIr].filter(Boolean);
    
    logger.debug('Verbos regulares seleccionados:', selectedVerbs.map(v => v?.lemma));
    
  } else if (verbType === 'irregular' && selectedFamilies && selectedFamilies.length > 0) {
    // For irregular verbs, PRIORITIZE representative examples from family definitions
    logger.debug('Seleccionando de familias:', selectedFamilies);
    
    // Get PRIORITY examples from each selected family first
    selectedFamilies.forEach(familyId => {
      const family = LEARNING_IRREGULAR_FAMILIES[familyId];
      if (family && family.priorityExamples) {
        logger.debug(`Familia ${familyId} - verbos prioritarios:`, family.priorityExamples);
        
        // Add priority verbs that exist in our database
        family.priorityExamples.forEach(lemma => {
          const verbObj = verbs.find(v => v.lemma === lemma);
          if (verbObj && !candidateVerbs.some(v => v.lemma === lemma)) {
            candidateVerbs.push(verbObj);
          }
        });
      } else if (family && family.examples) {
        logger.debug(`Familia ${familyId} sin verbos prioritarios, usando ejemplos regulares:`, family.examples.slice(0, 3));
        
        // Fallback to first 3 regular examples if no priorityExamples defined
        family.examples.slice(0, 3).forEach(lemma => {
          const verbObj = verbs.find(v => v.lemma === lemma);
          if (verbObj && !candidateVerbs.some(v => v.lemma === lemma)) {
            candidateVerbs.push(verbObj);
          }
        });
      } else {
        logger.warn(`Familia ${familyId} no encontrada o sin ejemplos`);
      }
    });
    
    logger.debug('Candidatos prioritarios encontrados:', candidateVerbs.map(v => v.lemma));
    
    // For learning purposes, just take the first 3 priority candidates
    // They are already carefully selected to be pedagogically optimal
    selectedVerbs = candidateVerbs.slice(0, 3);
    logger.debug('Selección de verbos prioritarios:', selectedVerbs.map(v => v.lemma));
  }

  // Final check: ensure we have exactly 3 verbs
  if (selectedVerbs.length < 3) {
    logger.warn(`Solo se encontraron ${selectedVerbs.length} verbos, buscando más en las familias...`);
    
    // For irregular verbs, NEVER fall back to regular verbs - find more from same families
    if (verbType === 'irregular' && candidateVerbs.length > selectedVerbs.length) {
      // Take more candidates from the same families to maintain coherence
      while (selectedVerbs.length < 3 && candidateVerbs.length > selectedVerbs.length) {
        const nextCandidate = candidateVerbs[selectedVerbs.length];
        if (!selectedVerbs.some(v => v.lemma === nextCandidate.lemma)) {
          selectedVerbs.push(nextCandidate);
        }
      }
      logger.debug('Completado con más irregulares de las mismas familias');
    }
    
    // Only fall back to regular verbs if we're already working with regular verbs
    // OR if we absolutely can't find enough irregular verbs (which shouldn't happen)
    if (selectedVerbs.length < 3) {
      if (verbType === 'regular') {
        const defaults = [
          verbs.find(v => v.lemma === 'hablar'),
          verbs.find(v => v.lemma === 'comer'), 
          verbs.find(v => v.lemma === 'vivir')
        ];
        
        // Fill missing slots with defaults that don't duplicate
        while (selectedVerbs.length < 3) {
          const defaultVerb = defaults[selectedVerbs.length];
          if (defaultVerb && !selectedVerbs.some(v => v.lemma === defaultVerb.lemma)) {
            selectedVerbs.push(defaultVerb);
          }
        }
      } else {
        logger.error('CRITICAL: No se pudieron encontrar suficientes verbos irregulares para', selectedFamilies);
        logger.error('Esto es un error del sistema - las familias deberían tener suficientes verbos');
      }
    }
  }
  
  logger.debug('FINAL: Verbos seleccionados para', verbType, ':', selectedVerbs.map(v => v?.lemma));
  return selectedVerbs.slice(0, 3);
}

/**
 * Componente principal del flujo de aprendizaje estructurado
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onHome - Callback para navegar al menú principal
 * @param {Function} props.onGoToProgress - Callback para navegar al dashboard de progreso
 * @returns {JSX.Element} El componente de flujo de aprendizaje
 */
function LearnTenseFlow({ onHome, onGoToProgress }) {
  const [currentStep, setCurrentStep] = useState('tense-selection');
  const [selectedTense, setSelectedTense] = useState(null);
  const [duration, setDuration] = useState(null);
  const [verbType, setVerbType] = useState(null);
  const [selectedFamilies, setSelectedFamilies] = useState([]);
  const [exampleVerbs, setExampleVerbs] = useState(null);
  const [adaptiveSettings, setAdaptiveSettings] = useState(null);
  const [personalizedDuration, setPersonalizedDuration] = useState(null);
  const [abTestVariant, setAbTestVariant] = useState(null);
  const settings = useSettings();

  // Calculate adaptive settings when tense and type are selected
  useEffect(() => {
    if (selectedTense?.tense && verbType && duration) {
      try {
        const userId = getCurrentUserId();
        const adaptive = calculateAdaptiveDifficulty(userId, selectedTense.tense, verbType);
        setAdaptiveSettings(adaptive);
        
        // Personalize session duration based on adaptive settings
        const personalized = personalizeSessionDuration(adaptive, duration);
        setPersonalizedDuration(personalized);
        
        logger.debug('Adaptive learning configured:', { adaptive, personalized });
      } catch (error) {
        logger.error('Error calculating adaptive settings:', error);
      }
    }
  }, [selectedTense?.tense, verbType, duration]);

  // Initialize A/B testing on component mount
  useEffect(() => {
    const userId = getCurrentUserId();
    
    // Create sample A/B test for learning flow optimization
    const abConfig = AB_TESTING_CONFIG.LEARNING_FLOW_V1;
    abTesting.createTest(abConfig.testId, {
      name: abConfig.name,
      description: abConfig.description,
      variants: abConfig.variants,
      trafficSplit: abConfig.trafficSplit,
      duration: abConfig.duration,
      metrics: abConfig.metrics
    });

    // Assign user to variant
    const variant = abTesting.assignUserToVariant(userId, abConfig.testId);
    setAbTestVariant(variant);
    
    logger.debug('A/B Test variant assigned:', variant);
  }, []);

  const availableTenses = useMemo(() => {
    // Remove compound tenses from learning module
    const COMPOUND_TENSES = new Set([
      'pretPerf', // pretérito perfecto compuesto
      'plusc',    // pluscuamperfecto
      'futPerf',  // futuro perfecto
      'condPerf', // condicional compuesto
      'subjPerf', // perfecto de subjuntivo
      'subjPlusc' // pluscuamperfecto de subjuntivo
    ]);
    // Only show tenses that have narrative stories implemented
    const implementedTenses = Object.keys(storyData);
    
    const tenseSet = new Set();
    curriculum.forEach(item => {
      if (item.tense.includes('Mixed')) return;
      // Only include tenses that are implemented
      if (implementedTenses.includes(item.tense) && !COMPOUND_TENSES.has(item.tense)) {
        tenseSet.add(JSON.stringify({ mood: item.mood, tense: item.tense }));
      }
    });

    const tenses = Array.from(tenseSet).map(item => JSON.parse(item));

    const grouped = tenses.reduce((acc, { mood, tense }) => {
      if (!acc[mood]) {
        acc[mood] = [];
      }
      acc[mood].push(tense);
      return acc;
    }, {});

    return grouped;
  }, []);

  const handleTenseSelection = (mood, tense) => {
    setSelectedTense({ mood, tense });
    setCurrentStep('type-selection');
  };
  
  const handleTypeSelection = (type, families = []) => {
    logger.debug('Type selection:', { type, families });
    setVerbType(type);
    setSelectedFamilies(families);
    setCurrentStep('duration-selection');
  };
  
  const handleBackToTenseSelection = () => {
    setSelectedTense(null);
    setVerbType(null);
    setSelectedFamilies([]);
    setCurrentStep('tense-selection');
  };
  
  const handleBackToTypeSelection = () => {
    setVerbType(null);
    setSelectedFamilies([]);
    setDuration(null);
    setCurrentStep('type-selection');
  };

  const handleStartLearning = () => {
    if (selectedTense && duration && verbType) {
      // The true source of truth: select verbs based on user's choice
      const verbObjects = selectExampleVerbs(verbType, selectedFamilies, selectedTense.tense);
      setExampleVerbs(verbObjects);
      
      logger.debug('Starting learning with:', { selectedTense, duration, verbType, selectedFamilies, verbObjects: verbObjects.map(v => v?.lemma) });
      handleSmartStepTransition('duration-selection', 'introduction');
    }
  };

  // Create stable handler functions to prevent infinite re-renders
  const handleBackToIntroduction = React.useCallback(() => {
    setCurrentStep('introduction');
  }, []);

  const handleBackToArDrill = React.useCallback(() => {
    setCurrentStep('guided_drill_ar');
  }, []);

  const handleBackToErDrill = React.useCallback(() => {
    setCurrentStep('guided_drill_er');
  }, []);

  const handleCompleteArDrill = React.useCallback(() => {
    handleSmartStepTransition('guided_drill_ar', 'guided_drill_er');
  }, []);

  const handleCompleteErDrill = React.useCallback(() => {
    handleSmartStepTransition('guided_drill_er', 'guided_drill_ir');
  }, []);

  const handleCompleteIrDrill = React.useCallback(() => {
    handleSmartStepTransition('guided_drill_ir', 'recap');
  }, []);

  const handleFinish = () => {
    // Record A/B test completion metrics
    if (abTestVariant) {
      const userId = getCurrentUserId();
      const completionMetrics = {
        completion_rate: 1, // User completed the session
        session_duration: personalizedDuration?.totalDuration || duration || 0,
        tense_practiced: selectedTense?.tense,
        verb_type_practiced: verbType,
        adaptive_level: adaptiveSettings?.level || 'intermediate'
      };
      
      abTesting.recordTestMetrics(userId, AB_TESTING_CONFIG.LEARNING_FLOW_V1.testId, completionMetrics);
      logger.debug('A/B test completion metrics recorded:', completionMetrics);
    }

    setSelectedTense(null);
    setDuration(null);
    setVerbType(null);
    setSelectedFamilies([]);
    setExampleVerbs(null);
    setCurrentStep('tense-selection');
    if (onHome) onHome();
  };

  // Handle smart step transitions with skip logic
  const handleSmartStepTransition = (fromStep, toStep, depth = 0) => {
    // Prevent infinite recursion
    if (depth > 10) {
      logger.warn(`Max recursion depth reached, defaulting to ${toStep}`);
      setTimeout(() => setCurrentStep(toStep), 0);
      return;
    }

    if (!adaptiveSettings) {
      setTimeout(() => setCurrentStep(toStep), 0);
      return;
    }

    const userId = getCurrentUserId();
    
    // Check if target step can be skipped
    let canSkip = false;
    try {
      canSkip = canSkipPhase(userId, selectedTense?.tense, toStep);
    } catch (error) {
      logger.warn(`Error checking skip phase for ${toStep}:`, error);
      canSkip = false;
    }
    
    if (canSkip) {
      logger.debug(`Skipping ${toStep} based on user mastery (depth: ${depth})`);
      // Recursively check next step with depth tracking - use setTimeout to break sync chain
      const nextStepAfter = getNextStep(toStep);
      if (nextStepAfter) {
        setTimeout(() => {
          handleSmartStepTransition(fromStep, nextStepAfter, depth + 1);
        }, 0);
      } else {
        setTimeout(() => setCurrentStep(toStep), 0); // Fallback if no next step
      }
    } else {
      setTimeout(() => setCurrentStep(toStep), 0);
    }
  };

  // Get next step in sequence - now using centralized config
  const getNextStep = (currentPhase) => {
    return getNextFlowStep(currentPhase);
  };

  const handleMechanicalPhaseComplete = () => {
    logger.debug('Mechanical phase complete, moving to meaningful practice.');
    setCurrentStep('meaningful_practice');
  };

  const handleMeaningfulPhaseComplete = () => {
    logger.debug('Meaningful phase complete, moving to pronunciation practice.');
    setCurrentStep('pronunciation_practice');
  };

  const handlePronunciationPhaseComplete = () => {
    logger.debug('Pronunciation practice complete, moving to communicative practice.');
    setCurrentStep('communicative_practice');
  };

  if (currentStep === 'introduction') {
    return (
      <ErrorBoundary>
        <NarrativeIntroduction 
          tense={selectedTense}
          exampleVerbs={exampleVerbs}
          verbType={verbType}
          selectedFamilies={selectedFamilies}
          onBack={() => setCurrentStep('duration-selection')} 
          onContinue={() => handleSmartStepTransition('introduction', 'guided_drill_ar')}
        />
      </ErrorBoundary>
    );
  }

  if (currentStep === 'guided_drill_ar') {
    return (
      <ErrorBoundary>
        <EndingsDrill 
          key={`guided-ar-${exampleVerbs?.[0]?.lemma || 'ar'}`}
          verb={exampleVerbs[0]}
          tense={selectedTense}
          onBack={handleBackToIntroduction}
          onComplete={handleCompleteArDrill}
          onHome={onHome}
          onGoToProgress={onGoToProgress}
        />
      </ErrorBoundary>
    );
  }

  if (currentStep === 'guided_drill_er') {
    return (
      <ErrorBoundary>
        <EndingsDrill 
          key={`guided-er-${exampleVerbs?.[1]?.lemma || 'er'}`}
          verb={exampleVerbs[1]}
          tense={selectedTense}
          onBack={handleBackToArDrill}
          onComplete={handleCompleteErDrill}
          onHome={onHome}
          onGoToProgress={onGoToProgress}
        />
      </ErrorBoundary>
    );
  }

  if (currentStep === 'guided_drill_ir') {
    return (
      <ErrorBoundary>
        <EndingsDrill 
          key={`guided-ir-${exampleVerbs?.[2]?.lemma || 'ir'}`}
          verb={exampleVerbs[2]}
          tense={selectedTense}
          onBack={handleBackToErDrill}
          onComplete={handleCompleteIrDrill}
          onHome={onHome}
          onGoToProgress={onGoToProgress}
        />
      </ErrorBoundary>
    );
  }
  
  if (currentStep === 'recap') {
    return (
      <ErrorBoundary>
        <NarrativeIntroduction 
          tense={selectedTense}
          exampleVerbs={exampleVerbs}
          verbType={verbType}
          selectedFamilies={selectedFamilies}
          onBack={() => setCurrentStep('guided_drill_ir')} 
          onContinue={() => handleSmartStepTransition('recap', 'practice')}
        />
      </ErrorBoundary>
    );
  }

  if (currentStep === 'practice') {
    return (
      <ErrorBoundary>
        <LearningDrill 
          tense={selectedTense}
          verbType={verbType}
          selectedFamilies={selectedFamilies}
          duration={duration}
          excludeLemmas={(exampleVerbs || []).map(v => v?.lemma).filter(Boolean)}
          onBack={() => setCurrentStep('recap')} 
          onFinish={handleFinish}
          onPhaseComplete={handleMechanicalPhaseComplete}
          onHome={onHome}
          onGoToProgress={onGoToProgress}
        />
      </ErrorBoundary>
    );
  }

  if (currentStep === 'meaningful_practice') {
    return (
      <ErrorBoundary>
        <MeaningfulPractice 
          tense={selectedTense}
          verbType={verbType}
          selectedFamilies={selectedFamilies}
          onBack={() => setCurrentStep('practice')}
          onPhaseComplete={handleMeaningfulPhaseComplete}
        />
      </ErrorBoundary>
    );
  }

  if (currentStep === 'pronunciation_practice') {
    return (
      <ErrorBoundary>
        <PronunciationPractice 
          tense={selectedTense}
          onBack={() => setCurrentStep('meaningful_practice')}
          onContinue={handlePronunciationPhaseComplete}
        />
      </ErrorBoundary>
    );
  }

  if (currentStep === 'communicative_practice') {
    return (
      <ErrorBoundary>
        <CommunicativePractice 
          tense={selectedTense}
          verbType={verbType}
          selectedFamilies={selectedFamilies}
          onBack={() => setCurrentStep('pronunciation_practice')}
          onFinish={handleFinish}
        />
      </ErrorBoundary>
    );
  }

  // Step 1: Tense Selection
  if (currentStep === 'tense-selection') {
    return (
      <div className="App">
        <div className="onboarding learn-flow">
          {/* Header with logo */}
          <ClickableCard className="app-logo" onClick={onHome} title="Volver al menú">
            <img src="/verbosmain_transparent.png" alt="VerbOS" width="180" height="180" />
          </ClickableCard>
          
          {Object.entries(availableTenses).map(([mood, tenses]) => (
            <div key={mood} className="tense-section">
              <h2>{MOOD_LABELS[mood] || mood}</h2>
              <div className="options-grid">
                {tenses.map(tense => {
                  // Ejemplos dinámicos: 1s, 2s (tú/vos), 3s (ella) para "hablar"
                  const getPersonConjugationExample = (moodKey, tenseKey) => {
                    const hablar = verbs.find(v => v.lemma === 'hablar');
                    if (!hablar) {
                      return '';
                    }
                    
                    // Mapear nombres de español a inglés porque los datos están en inglés
                    const moodMap = {
                      'indicativo': 'indicative',
                      'subjuntivo': 'subjunctive', 
                      'imperativo': 'imperative',
                      'condicional': 'conditional',
                      'nonfinite': 'nonfinite'
                    };
                    
                    const englishMood = moodMap[moodKey] || moodKey;
                    
                    const para = hablar.paradigms?.find(p => p.forms?.some(f => f.mood === englishMood && f.tense === tenseKey));
                    if (!para) {
                      if (tenseKey === 'ger') return 'hablando';
                      if (tenseKey === 'part') return 'hablado';
                      return '';
                    }
                    const forms = para.forms?.filter(f => f.mood === englishMood && f.tense === tenseKey) || [];
                    const useVos = settings?.useVoseo === true;
                    const pron2Key = useVos ? '2s_vos' : '2s_tu';

                    const getForm = (key) => {
                      let f = forms.find(ff => ff.person === key);
                      if (!f && key === '2s_vos') {
                        const tu = forms.find(ff => ff.person === '2s_tu');
                        if (tu && moodKey === 'indicative' && tenseKey === 'pres') {
                          const base = tu.value || '';
                          if (/as$/.test(base)) return base.replace(/as$/, 'ás');
                          if (/es$/.test(base)) return base.replace(/es$/, 'és');
                        }
                        return tu?.value || '';
                      }
                      return f?.value || '';
                    };

                    const parts = [];
                    const f1 = getForm('1s');
                    if (f1) parts.push(`yo ${f1}`);
                    const f2 = getForm(pron2Key);
                    if (f2) parts.push(`${useVos ? 'vos' : 'tú'} ${f2}`);
                    const f3 = getForm('3s');
                    if (f3) parts.push(`ella ${f3}`);
                    const result = parts.join(', ');
                    return result;
                  }
                  
                  return (
                    <ClickableCard 
                      key={tense}
                      className="option-card"
                      onClick={() => handleTenseSelection(mood, tense)}
                      title={`Seleccionar ${formatMoodTense(mood, tense)}`}
                    >
                      <h3>
                        {formatMoodTense(mood, tense)}
                      </h3>
                      <p className="example">{getPersonConjugationExample(mood, tense)}</p>
                    </ClickableCard>
                  )
                })}
              </div>
            </div>
          ))}

          <button className="back-btn" onClick={onHome}>
            <img src="/back.png" alt="Volver" className="back-icon" />
          </button>
        </div>
      </div>
    );
  }
  
  // Step 2: Type Selection (Regular/Irregular categories)
  if (currentStep === 'type-selection') {
    const availableFamilies = getLearningFamiliesForTense(selectedTense.tense);
    
    // Grupos reorganizados con criterio pedagógico claro
    const irregularCategories = {};
    
    // Para PRESENTE: SOLO las 3 categorías pedagógicas solicitadas
    if (selectedTense.tense === 'pres') {
      irregularCategories['yo_irregular_g'] = {
        name: 'Irregulares en YO',
        description: 'Verbos muy frecuentes que añaden -g: salgo, pongo, hago',
        families: availableFamilies.filter(f => f.id === 'LEARNING_YO_G_PRESENT')
      };
      
      irregularCategories['diphthongs'] = {
        name: 'Verbos que diptongan',
        description: 'Cambios vocálicos: e→ie (quiero), e→i (pido), o→ue (puedo)',
        families: availableFamilies.filter(f => f.id === 'LEARNING_DIPHTHONGS')
      };
      
      irregularCategories['very_irregular'] = {
        name: 'Muy irregulares',
        description: 'Formas únicas: soy/eres, estoy/estás, voy/vas, doy/das',
        families: availableFamilies.filter(f => f.id === 'LEARNING_VERY_IRREGULAR')
      };
    }
    
    // Para PRETÉRITO INDEFINIDO: mostrar las 2 categorías principales
    else if (selectedTense.tense === 'pretIndef') {
      irregularCategories['pret_muy_irregulares'] = {
        name: 'Muy irregulares',
        description: 'Verbos frecuentes con raíces completamente nuevas: estuve, quise, hice',
        families: availableFamilies.filter(f => f.id === 'LEARNING_PRET_MUY_IRREGULARES')
      };
      
      irregularCategories['pret_3as_personas'] = {
        name: 'Irregulares en 3ª persona',
        description: 'Solo cambian en 3ª persona: pidió/pidieron, durmió/durmieron, leyó/leyeron',
        families: availableFamilies.filter(f => f.id === 'LEARNING_PRET_3AS_PERSONAS')
      };
    }
    
    // Para IMPERFECTO: mostrar los 3 irregulares
    else if (selectedTense.tense === 'impf') {
      irregularCategories['imperfect'] = {
        name: 'Irregulares del imperfecto',
        description: 'Los únicos 3 verbos con imperfecto irregular: ser (era), ir (iba), ver (veía)',
        families: availableFamilies.filter(f => f.id === 'LEARNING_IMPF_IRREGULAR')
      };
    }

    // Futuro/Condicional comparten raíces irregulares
    else if (selectedTense.tense === 'fut' || selectedTense.tense === 'cond') {
      irregularCategories['future_cond_roots'] = {
        name: 'Raíces irregulares',
        description: 'tendr-, dir-, podr-, sabr- comparten terminaciones regulares',
        families: availableFamilies.filter(f => f.id === 'LEARNING_FUT_COND_IRREGULAR')
      };
    }
    
    // Para otros tiempos: categorías tradicionales
    else {
      irregularCategories['orthographic'] = {
        name: 'Cambios ortográficos',
        description: 'Conservación del sonido: busqué, llegué',
        families: availableFamilies.filter(f => 
          ['LEARNING_ORTH_CAR', 'LEARNING_ORTH_GAR'].includes(f.id)
        )
      };
      
      irregularCategories['preterite'] = {
        name: 'Pretéritos fuertes',
        description: 'Cambios especiales en pretérito: tuve, estuve',
        families: availableFamilies.filter(f => 
          f.id === 'LEARNING_PRET_FUERTE'
        )
      };
    }
    
    return (
      <div className="App">
        <div className="onboarding learn-flow">
          {/* Header with logo */}
          <ClickableCard className="app-logo" onClick={onHome} title="Volver al menú">
            <img src="/verbosmain_transparent.png" alt="VerbOS" width="180" height="180" />
          </ClickableCard>
          
          <div className="tense-section">
            <h2>Elegir tipo de verbos para {formatMoodTense(selectedTense.mood, selectedTense.tense)}</h2>
            
            <div className="options-grid">
              {/* Regular verbs */}
              <ClickableCard 
                className="option-card"
                onClick={() => handleTypeSelection('regular')}
                title="Practicar verbos regulares"
              >
                <h3>Regulares</h3>
                <p className="example">hablar, comer, vivir</p>
              </ClickableCard>
              
              {/* Irregular categories */}
              {Object.entries(irregularCategories).map(([key, category]) => {
                if (category.families.length === 0) return null;
                
                return (
                  <ClickableCard 
                    key={key}
                    className="option-card"
                    onClick={() => handleTypeSelection('irregular', category.families.map(f => f.id))}
                    title={`Practicar ${category.name.toLowerCase()}`}
                  >
                    <h3>{category.name}</h3>
                    <p className="example">{category.description}</p>
                  </ClickableCard>
                );
              })}
            </div>
          </div>

          <button className="back-btn" onClick={handleBackToTenseSelection}>
            <img src="/back.png" alt="Volver" className="back-icon" />
          </button>
        </div>
      </div>
    );
  }
  
  // Step 3: Duration Selection
  if (currentStep === 'duration-selection') {
    return (
      <div className="App">
        <div className="onboarding learn-flow">
          {/* Header with logo */}
          <ClickableCard className="app-logo" onClick={onHome} title="Volver al menú">
            <img src="/verbosmain_transparent.png" alt="VerbOS" width="180" height="180" />
          </ClickableCard>
          
          <div className="tense-section">
            <h2>Duración de la sesión</h2>
            
            <div className="options-grid">
              {getSessionDurationOptions().map(durationConfig => (
                <ClickableCard 
                  key={durationConfig.minutes}
                  className="option-card"
                  onClick={() => setDuration(durationConfig.minutes)}
                  title={durationConfig.title}
                >
                  <h3>{durationConfig.label}</h3>
                  <p className="example">{durationConfig.description}</p>
                </ClickableCard>
              ))}
            </div>
            
            {duration && (
              <button 
                className="btn start-learning-btn"
                onClick={handleStartLearning}
              >
                Continuar
              </button>
            )}
          </div>

          <button className="back-btn" onClick={handleBackToTypeSelection}>
            <img src="/back.png" alt="Volver" className="back-icon" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default LearnTenseFlow;

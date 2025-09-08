import React, { useState, useMemo, useEffect } from 'react';
import curriculum from '../../data/curriculum.json';
import { verbs } from '../../data/verbs.js';
import { storyData } from '../../data/narrativeStories.js';
import { MOOD_LABELS, TENSE_LABELS } from '../../lib/utils/verbLabels.js';
import { getLearningFamiliesForTense } from '../../lib/data/learningIrregularFamilies.js';
import { calculateAdaptiveDifficulty, personalizeSessionDuration, canSkipPhase } from '../../lib/learning/adaptiveEngine.js';
import { abTesting } from '../../lib/learning/analytics.js';
import ClickableCard from '../shared/ClickableCard.jsx';
import NarrativeIntroduction from './NarrativeIntroduction.jsx';
import LearningDrill from './LearningDrill.jsx';
import MeaningfulPractice from './MeaningfulPractice.jsx';
import CommunicativePractice from './CommunicativePractice.jsx';
import PronunciationPractice from './PronunciationPractice.jsx';
import EndingsDrill from './EndingsDrill.jsx';
import ErrorBoundary from '../ErrorBoundary.jsx';
import './LearnTenseFlow.css';
import { useSettings } from '../../state/settings.js';



// Import the family definitions directly
import { LEARNING_IRREGULAR_FAMILIES } from '../../lib/data/learningIrregularFamilies.js';

// Function to select 3 coherent example verbs based on user's choice
// This is the single source of truth for the entire learning flow
function selectExampleVerbs(verbType, selectedFamilies, tense) {
  console.log('🔍 Seleccionando verbos coherentes:', { verbType, selectedFamilies, tense });
  let selectedVerbs = [];
  let candidateVerbs = [];

  if (verbType === 'regular') {
    // For regular verbs, use simple regular examples
    const regularAr = verbs.find(v => v.lemma === 'hablar' && v.type === 'regular');
    const regularEr = verbs.find(v => v.lemma === 'comer' && v.type === 'regular');
    const regularIr = verbs.find(v => v.lemma === 'vivir' && v.type === 'regular');
    selectedVerbs = [regularAr, regularEr, regularIr].filter(Boolean);
    
    console.log('✅ Verbos regulares seleccionados:', selectedVerbs.map(v => v?.lemma));
    
  } else if (verbType === 'irregular' && selectedFamilies && selectedFamilies.length > 0) {
    // For irregular verbs, PRIORITIZE representative examples from family definitions
    console.log('🎯 Seleccionando de familias:', selectedFamilies);
    
    // Get PRIORITY examples from each selected family first
    selectedFamilies.forEach(familyId => {
      const family = LEARNING_IRREGULAR_FAMILIES[familyId];
      if (family && family.priorityExamples) {
        console.log(`🏆 Familia ${familyId} - verbos prioritarios:`, family.priorityExamples);
        
        // Add priority verbs that exist in our database
        family.priorityExamples.forEach(lemma => {
          const verbObj = verbs.find(v => v.lemma === lemma);
          if (verbObj && !candidateVerbs.some(v => v.lemma === lemma)) {
            candidateVerbs.push(verbObj);
          }
        });
      } else if (family && family.examples) {
        console.log(`📚 Familia ${familyId} sin verbos prioritarios, usando ejemplos regulares:`, family.examples.slice(0, 3));
        
        // Fallback to first 3 regular examples if no priorityExamples defined
        family.examples.slice(0, 3).forEach(lemma => {
          const verbObj = verbs.find(v => v.lemma === lemma);
          if (verbObj && !candidateVerbs.some(v => v.lemma === lemma)) {
            candidateVerbs.push(verbObj);
          }
        });
      } else {
        console.warn(`⚠️ Familia ${familyId} no encontrada o sin ejemplos`);
      }
    });
    
    console.log('🔍 Candidatos prioritarios encontrados:', candidateVerbs.map(v => v.lemma));
    
    // For learning purposes, just take the first 3 priority candidates
    // They are already carefully selected to be pedagogically optimal
    selectedVerbs = candidateVerbs.slice(0, 3);
    console.log('✅ Selección de verbos prioritarios:', selectedVerbs.map(v => v.lemma));
  }

  // Final check: ensure we have exactly 3 verbs
  if (selectedVerbs.length < 3) {
    console.warn(`⚠️ Solo se encontraron ${selectedVerbs.length} verbos, buscando más en las familias...`);
    
    // For irregular verbs, NEVER fall back to regular verbs - find more from same families
    if (verbType === 'irregular' && candidateVerbs.length > selectedVerbs.length) {
      // Take more candidates from the same families to maintain coherence
      while (selectedVerbs.length < 3 && candidateVerbs.length > selectedVerbs.length) {
        const nextCandidate = candidateVerbs[selectedVerbs.length];
        if (!selectedVerbs.some(v => v.lemma === nextCandidate.lemma)) {
          selectedVerbs.push(nextCandidate);
        }
      }
      console.log('✅ Completado con más irregulares de las mismas familias');
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
        console.error('🚨 CRITICAL: No se pudieron encontrar suficientes verbos irregulares para', selectedFamilies);
        console.error('🚨 Esto es un error del sistema - las familias deberían tener suficientes verbos');
      }
    }
  }
  
  console.log('🎯 FINAL: Verbos seleccionados para', verbType, ':', selectedVerbs.map(v => v?.lemma));
  return selectedVerbs.slice(0, 3);
}

function LearnTenseFlow({ onHome }) {
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
        const userId = 'default'; // TODO: Get actual user ID
        const adaptive = calculateAdaptiveDifficulty(userId, selectedTense.tense, verbType);
        setAdaptiveSettings(adaptive);
        
        // Personalize session duration based on adaptive settings
        const personalized = personalizeSessionDuration(adaptive, duration);
        setPersonalizedDuration(personalized);
        
        console.log('🎯 Adaptive learning configured:', { adaptive, personalized });
      } catch (error) {
        console.error('Error calculating adaptive settings:', error);
      }
    }
  }, [selectedTense?.tense, verbType, duration]);

  // Initialize A/B testing on component mount
  useEffect(() => {
    const userId = 'default'; // TODO: Get actual user ID
    
    // Create sample A/B test for learning flow optimization
    abTesting.createTest('learning_flow_v1', {
      name: 'Learning Flow Optimization',
      description: 'Test different approaches to guided drill progression',
      variants: ['control', 'enhanced'],
      trafficSplit: [50, 50],
      duration: 30 * 24 * 60 * 60 * 1000, // 30 days
      metrics: ['completion_rate', 'accuracy', 'engagement', 'session_duration']
    });

    // Assign user to variant
    const variant = abTesting.assignUserToVariant(userId, 'learning_flow_v1');
    setAbTestVariant(variant);
    
    console.log('🧪 A/B Test variant assigned:', variant);
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
    console.log('🎯 Type selection:', { type, families });
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
      
      console.log('Starting learning with:', { selectedTense, duration, verbType, selectedFamilies, verbObjects: verbObjects.map(v => v?.lemma) });
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
      const userId = 'default'; // TODO: Get actual user ID
      const completionMetrics = {
        completion_rate: 1, // User completed the session
        session_duration: personalizedDuration?.totalDuration || duration || 0,
        tense_practiced: selectedTense?.tense,
        verb_type_practiced: verbType,
        adaptive_level: adaptiveSettings?.level || 'intermediate'
      };
      
      abTesting.recordTestMetrics(userId, 'learning_flow_v1', completionMetrics);
      console.log('🧪 A/B test completion metrics recorded:', completionMetrics);
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
      console.warn(`⚠️ Max recursion depth reached, defaulting to ${toStep}`);
      setTimeout(() => setCurrentStep(toStep), 0);
      return;
    }

    if (!adaptiveSettings) {
      setTimeout(() => setCurrentStep(toStep), 0);
      return;
    }

    const userId = 'default'; // TODO: Get actual user ID
    
    // Check if target step can be skipped
    let canSkip = false;
    try {
      canSkip = canSkipPhase(userId, selectedTense?.tense, toStep);
    } catch (error) {
      console.warn(`Error checking skip phase for ${toStep}:`, error);
      canSkip = false;
    }
    
    if (canSkip) {
      console.log(`⏭️ Skipping ${toStep} based on user mastery (depth: ${depth})`);
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

  // Get next step in sequence
  const getNextStep = (currentPhase) => {
    const stepSequence = [
      'introduction',
      'guided_drill_ar',
      'guided_drill_er', 
      'guided_drill_ir',
      'recap',
      'practice',
      'meaningful_practice',
      'pronunciation_practice',
      'communicative_practice'
    ];
    
    const currentIndex = stepSequence.indexOf(currentPhase);
    if (currentIndex >= 0 && currentIndex < stepSequence.length - 1) {
      return stepSequence[currentIndex + 1];
    }
    return null;
  };

  const handleMechanicalPhaseComplete = () => {
    console.log('Mechanical phase complete, moving to meaningful practice.');
    setCurrentStep('meaningful_practice');
  };

  const handleMeaningfulPhaseComplete = () => {
    console.log('Meaningful phase complete, moving to pronunciation practice.');
    setCurrentStep('pronunciation_practice');
  };

  const handlePronunciationPhaseComplete = () => {
    console.log('Pronunciation practice complete, moving to communicative practice.');
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
          onBack={() => setCurrentStep('recap')} 
          onFinish={handleFinish}
          onPhaseComplete={handleMechanicalPhaseComplete}
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
                    if (!hablar) return '';
                    const para = hablar.paradigms?.find(p => p.forms?.some(f => f.mood === moodKey && f.tense === tenseKey));
                    if (!para) {
                      if (tenseKey === 'ger') return 'hablando';
                      if (tenseKey === 'part') return 'hablado';
                      return '';
                    }
                    const forms = para.forms?.filter(f => f.mood === moodKey && f.tense === tenseKey) || [];
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
                    return parts.join(', ');
                  }
                  
                  return (
                    <ClickableCard 
                      key={tense}
                      className="option-card"
                      onClick={() => handleTenseSelection(mood, tense)}
                      title={`Seleccionar ${TENSE_LABELS[tense] || tense}`}
                    >
                      <h3>
                        {TENSE_LABELS[tense] || tense}
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
            <h2>Elegir tipo de verbos para {TENSE_LABELS[selectedTense.tense]}</h2>
            
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
              <ClickableCard 
                className="option-card"
                onClick={() => setDuration(5)}
                title="Sesión de 5 minutos"
              >
                <h3>5 minutos</h3>
                <p className="example">Práctica intensiva</p>
              </ClickableCard>
              
              <ClickableCard 
                className="option-card"
                onClick={() => setDuration(10)}
                title="Sesión de 10 minutos"
              >
                <h3>10 minutos</h3>
                <p className="example">Sesión media</p>
              </ClickableCard>
              
              <ClickableCard 
                className="option-card"
                onClick={() => setDuration(15)}
                title="Sesión de 15 minutos"
              >
                <h3>15 minutos</h3>
                <p className="example">Sesión larga</p>
              </ClickableCard>
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

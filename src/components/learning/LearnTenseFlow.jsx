import React, { useState, useMemo } from 'react';
import curriculum from '../../data/curriculum.json';
import { verbs } from '../../data/verbs.js';
import { storyData } from '../../data/narrativeStories.js';
import { MOOD_LABELS, TENSE_LABELS } from '../../lib/utils/verbLabels.js';
import { getLearningFamiliesForTense, categorizeLearningVerb } from '../../lib/data/learningIrregularFamilies.js';
import ClickableCard from '../shared/ClickableCard.jsx';
import NarrativeIntroduction from './NarrativeIntroduction.jsx';
import LearningDrill from './LearningDrill.jsx';
import MeaningfulPractice from './MeaningfulPractice.jsx';
import CommunicativePractice from './CommunicativePractice.jsx';
import EndingsDrill from './EndingsDrill.jsx';
import ErrorBoundary from '../ErrorBoundary.jsx';
import './LearnTenseFlow.css';
import { useSettings } from '../../state/settings.js';



// Helper function to get verbs belonging to a specific family
function getVerbsForFamily(familyId, tense) {
  return verbs.filter(verb => {
    const families = categorizeLearningVerb(verb.lemma, verb);
    return families.includes(familyId);
  });
}

function LearnTenseFlow({ onHome }) {
  const [currentStep, setCurrentStep] = useState('tense-selection'); // 'tense-selection' | 'type-selection' | 'duration-selection' | 'introduction' | 'guided_drill_ar' | 'guided_drill_er' | 'guided_drill_ir' | 'recap' | 'practice' | 'meaningful_practice' | 'communicative_practice'
  const [selectedTense, setSelectedTense] = useState(null);
  const [duration, setDuration] = useState(null); // 5, 10, 15
  const [verbType, setVerbType] = useState(null); // 'regular', 'irregular-basic', 'irregular-yo', 'irregular-dipthong', 'all'
  const [selectedFamilies, setSelectedFamilies] = useState([]);
  const [exampleVerbs, setExampleVerbs] = useState(null);
  const settings = useSettings();



  const availableTenses = useMemo(() => {
    // Only show tenses that have narrative stories implemented
    const implementedTenses = Object.keys(storyData);
    
    const tenseSet = new Set();
    curriculum.forEach(item => {
      if (item.tense.includes('Mixed')) return;
      // Only include tenses that are implemented
      if (implementedTenses.includes(item.tense)) {
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
      const tenseKey = selectedTense.tense;
      const tenseStoryData = storyData[tenseKey];
      
      let verbObjects = [];
      
      if (verbType === 'irregular' && selectedFamilies.length > 0) {
        // Generate example verbs from selected irregular families
        const irregularExamples = [];
        
        selectedFamilies.forEach(familyId => {
          // Get paradigmatic verbs for this family
          const familyVerbs = getVerbsForFamily(familyId, selectedTense.tense);
          if (familyVerbs.length > 0) {
            irregularExamples.push(familyVerbs[0]); // Take first verb as example
          }
        });
        
        // Ensure we have at least 3 examples for the drill phases (-ar, -er, -ir)
        while (irregularExamples.length < 3 && selectedFamilies.length > 0) {
          const familyId = selectedFamilies[irregularExamples.length % selectedFamilies.length];
          const familyVerbs = getVerbsForFamily(familyId, selectedTense.tense);
          if (familyVerbs.length > irregularExamples.length) {
            irregularExamples.push(familyVerbs[irregularExamples.length]);
          } else {
            // Fill with any irregular verb if needed
            const anyIrregular = verbs.find(v => v.type === 'irregular' && 
              v.lemma.endsWith(['ar', 'er', 'ir'][irregularExamples.length % 3]));
            if (anyIrregular) irregularExamples.push(anyIrregular);
          }
        }
        
        verbObjects = irregularExamples;
        console.log('🎯 Generated irregular examples:', irregularExamples.map(v => v?.lemma));
        
      } else if (tenseStoryData && tenseStoryData.deconstructions) {
        // Use regular story examples
        const exampleVerbLemmas = tenseStoryData.deconstructions.map(d => d.verb);
        verbObjects = exampleVerbLemmas.map(lemma => verbs.find(v => v.lemma === lemma)).filter(Boolean);
      }
      
      setExampleVerbs(verbObjects);
      
      console.log('Starting learning with:', { selectedTense, duration, verbType, selectedFamilies, tenseKey, verbObjects: verbObjects.map(v => v?.lemma) });
      setCurrentStep('introduction');
    }
  };

  const handleFinish = () => {
    setSelectedTense(null);
    setDuration(null);
    setVerbType(null);
    setSelectedFamilies([]);
    setExampleVerbs(null);
    setCurrentStep('tense-selection');
    if (onHome) onHome();
  };

  const handleMechanicalPhaseComplete = () => {
    console.log('Mechanical phase complete, moving to meaningful practice.');
    setCurrentStep('meaningful_practice');
  };

  const handleMeaningfulPhaseComplete = () => {
    console.log('Meaningful phase complete, moving to communicative practice.');
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
          onContinue={() => setCurrentStep('guided_drill_ar')}
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
          onBack={() => setCurrentStep('introduction')}
          onComplete={() => setCurrentStep('guided_drill_er')}
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
          onBack={() => setCurrentStep('guided_drill_ar')}
          onComplete={() => setCurrentStep('guided_drill_ir')}
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
          onBack={() => setCurrentStep('guided_drill_er')}
          onComplete={() => setCurrentStep('recap')}
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
          onContinue={() => setCurrentStep('practice')}
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

  if (currentStep === 'communicative_practice') {
    return (
      <ErrorBoundary>
        <CommunicativePractice 
          tense={selectedTense}
          verbType={verbType}
          selectedFamilies={selectedFamilies}
          onBack={() => setCurrentStep('meaningful_practice')}
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
                  // Function to get conjugation examples with 1st, 2nd, and 3rd person for "hablar"
                  const getPersonConjugationExample = (mood, tense) => {
                    const examples = {
                      // Indicativo
                      'pres': 'yo hablo, tú hablas, él/ella habla',
                      'pretIndef': 'yo hablé, tú hablaste, él/ella habló',
                      'impf': 'yo hablaba, tú hablabas, él/ella hablaba (regulares) / era, iba, veía (irregulares)',
                      'fut': 'yo hablaré, tú hablarás, él/ella hablará',
                      'pretPerf': 'yo he hablado, tú has hablado, él/ella ha hablado',
                      'plusc': 'yo había hablado, tú habías hablado, él/ella había hablado',
                      'futPerf': 'yo habré hablado, tú habrás hablado, él/ella habrá hablado',
                      
                      // Subjuntivo
                      'subjPres': 'yo hable, tú hables, él/ella hable',
                      'subjImpf': 'yo hablara, tú hablaras, él/ella hablara',
                      'subjPerf': 'yo haya hablado, tú hayas hablado, él/ella haya hablado',
                      'subjPlusc': 'yo hubiera hablado, tú hubieras hablado, él/ella hubiera hablado',
                      
                      // Imperativo
                      'impAff': 'tú habla, vos hablá, usted hable',
                      'impNeg': 'no hables, no habléis',
                      
                      // Condicional
                      'cond': 'yo hablaría, tú hablarías, él/ella hablaría',
                      'condPerf': 'yo habría hablado, tú habrías hablado, él/ella habría hablado',
                      
                      // Formas no conjugadas
                      'ger': 'hablando',
                      'part': 'hablado'
                    }
                    
                    return examples[tense] || ''
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
        description: 'Verbos muy frecuentes que añaden -g: tengo, pongo, hago, salgo',
        families: availableFamilies.filter(f => f.id === 'LEARNING_YO_G_PRESENT')
      };
      
      irregularCategories['diphthongs'] = {
        name: 'Verbos que diptongan',
        description: 'Cambios vocálicos: o→ue (puedo), e→ie (quiero), e→i (pido), u→ue (juego)',
        families: availableFamilies.filter(f => f.id === 'LEARNING_DIPHTHONGS')
      };
      
      irregularCategories['very_irregular'] = {
        name: 'Muy irregulares',
        description: 'Formas únicas: soy/eres, estoy/estás, voy/vas, doy/das',
        families: availableFamilies.filter(f => f.id === 'LEARNING_VERY_IRREGULAR')
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
                <p className="example">Sesión corta</p>
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
                <img src="/play.png" alt="Comenzar" className="play-icon" />
                Comenzar a Aprender
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

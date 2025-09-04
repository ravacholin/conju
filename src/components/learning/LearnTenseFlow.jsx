import React, { useState, useMemo } from 'react';
import curriculum from '../../data/curriculum.json';
import { verbs } from '../../data/verbs.js';
import { MOOD_LABELS, TENSE_LABELS } from '../../lib/utils/verbLabels.js';
import ClickableCard from '../shared/ClickableCard.jsx';
import NarrativeIntroduction from './NarrativeIntroduction.jsx';
import LearningDrill from './LearningDrill.jsx';
import MeaningfulPractice from './MeaningfulPractice.jsx';
import CommunicativePractice from './CommunicativePractice.jsx';
import EndingsDrill from './EndingsDrill.jsx';
import ErrorBoundary from '../ErrorBoundary.jsx';
import './LearnTenseFlow.css';

// NOTE: This is duplicated from NarrativeIntroduction to avoid breaking it.
// A better solution would be to move this to a shared data file.
const storyData = {
  pres: {
    deconstructions: [
      { group: '-ar', verb: 'hablar' },
      { group: '-er', verb: 'aprender' },
      { group: '-ir', verb: 'vivir' },
    ],
  },
  pretIndef: {
    deconstructions: [
        { group: '-ar', verb: 'hablar' },
        { group: '-er', verb: 'comer' },
        { group: '-ir', verb: 'escribir' },
    ],
  },
  impf: {
    deconstructions: [
      { group: '-ar', verb: 'cantar' },
      { group: '-er', verb: 'leer' },
      { group: '-ir', verb: 'vivir' },
    ],
  },
  fut: {
    deconstructions: [
      { group: '-ar', verb: 'visitar' },
      { group: '-er', verb: 'aprender' },
      { group: '-ir', verb: 'vivir' },
    ],
  },
   cond: {
    deconstructions: [
      { group: '-ar', verb: 'viajar' },
      { group: '-er', verb: 'comer' },
      { group: '-ir', verb: 'vivir' },
    ],
  },
  subjPres: {
    deconstructions: [
      { group: '-ar', verb: 'hablar' },
      { group: '-er', verb: 'beber' },
      { group: '-ir', verb: 'vivir' },
    ],
  },
};


function LearnTenseFlow({ onHome }) {
  const [currentStep, setCurrentStep] = useState('selection'); // 'selection' | 'introduction' | 'guided_drill_ar' | 'guided_drill_er' | 'guided_drill_ir' | 'recap' | 'practice' | 'meaningful_practice' | 'communicative_practice'
  const [selectedTense, setSelectedTense] = useState(null);
  const [duration, setDuration] = useState(null); // 5, 10, 15
  const [verbType, setVerbType] = useState(null); // 'regular', 'irregular', 'all'
  const [exampleVerbs, setExampleVerbs] = useState(null);

  const eligibleForms = useMemo(() => {
    if (!selectedTense || !verbType) return [];
    const forms = [];
    verbs.forEach(verb => {
      if (verbType !== 'all' && verb.type !== verbType) {
        return;
      }
      verb.paradigms.forEach(paradigm => {
        paradigm.forms.forEach(form => {
          if (form.mood === selectedTense.mood && form.tense === selectedTense.tense) {
            const altFromAccepts = form.accepts ? Object.values(form.accepts) : [];
            const altFromAlt = Array.isArray(form.alt) ? form.alt : [];
            const mergedAlt = Array.from(new Set([...altFromAlt, ...altFromAccepts]));
            forms.push({ ...form, lemma: verb.lemma, alt: mergedAlt });
          }
        });
      });
    });
    return forms;
  }, [selectedTense, verbType]);

  const availableTenses = useMemo(() => {
    const tenseSet = new Set();
    curriculum.forEach(item => {
      if (item.tense.includes('Mixed')) return;
      tenseSet.add(JSON.stringify({ mood: item.mood, tense: item.tense }));
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
  };

  const handleStartLearning = () => {
    if (selectedTense && duration && verbType) {
      const tenseKey = selectedTense.tense;
      const tenseStoryData = storyData[tenseKey];
      if (tenseStoryData && tenseStoryData.deconstructions) {
        const exampleVerbLemmas = tenseStoryData.deconstructions.map(d => d.verb);
        const verbObjects = exampleVerbLemmas.map(lemma => verbs.find(v => v.lemma === lemma)).filter(Boolean);
        setExampleVerbs(verbObjects);
      }
      
      console.log('Starting learning with:', { selectedTense, duration, verbType });
      setCurrentStep('introduction');
    }
  };

  const handleFinish = () => {
    setSelectedTense(null);
    setDuration(null);
    setVerbType(null);
    setExampleVerbs(null);
    setCurrentStep('selection');
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
          onBack={() => setCurrentStep('selection')} 
          onContinue={() => setCurrentStep('guided_drill_ar')}
        />
      </ErrorBoundary>
    );
  }

  if (currentStep === 'guided_drill_ar') {
    return (
      <ErrorBoundary>
        <EndingsDrill 
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
          eligibleForms={eligibleForms}
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
          eligibleForms={eligibleForms}
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
          eligibleForms={eligibleForms}
          onBack={() => setCurrentStep('meaningful_practice')}
          onFinish={handleFinish}
        />
      </ErrorBoundary>
    );
  }

  return (
    <div className="App">
      <div className="onboarding learn-flow">
        {/* Header with logo */}
        <ClickableCard className="app-logo" onClick={onHome} title="Volver al menú">
          <img src="/verbosmain_transparent.png" alt="VerbOS" width="180" height="180" />
        </ClickableCard>
        
        <h1>Aprender un Nuevo Tiempo</h1>
        <p className="subtitle">Elige qué tiempo verbal quieres dominar</p>

        {Object.entries(availableTenses).map(([mood, tenses]) => (
          <div key={mood} className="tense-section">
            <h2>{MOOD_LABELS[mood] || mood}</h2>
            <div className="options-grid">
              {tenses.map(tense => (
                <ClickableCard 
                  key={tense}
                  className={`option-card ${selectedTense?.tense === tense && selectedTense?.mood === mood ? 'selected' : ''}`}
                  onClick={() => handleTenseSelection(mood, tense)}
                  title={`Seleccionar ${TENSE_LABELS[tense] || tense}`}
                >
                  <h3>
                    <img src="/clock.png" alt="Tiempo" className="option-icon" />
                    {TENSE_LABELS[tense] || tense}
                  </h3>
                  <p>Domina este tiempo verbal paso a paso</p>
                  <p className="example">Ejercicios interactivos y contextualizados</p>
                </ClickableCard>
              ))}
            </div>
          </div>
        ))}

        {selectedTense && (
          <div className="settings-panel">
            <h3>Configuración de Aprendizaje</h3>
            
            <div className="setting-group">
              <label>Duración de la sesión</label>
              <div className="radio-group">
                <label>
                  <input 
                    type="radio" 
                    name="duration" 
                    checked={duration === 5} 
                    onChange={() => setDuration(5)} 
                  />
                  5 minutos
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="duration" 
                    checked={duration === 10} 
                    onChange={() => setDuration(10)} 
                  />
                  10 minutos
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="duration" 
                    checked={duration === 15} 
                    onChange={() => setDuration(15)} 
                  />
                  15 minutos
                </label>
              </div>
            </div>
            
            <div className="setting-group">
              <label>Tipo de verbos</label>
              <div className="radio-group">
                <label>
                  <input 
                    type="radio" 
                    name="verbType" 
                    checked={verbType === 'all'} 
                    onChange={() => setVerbType('all')} 
                  />
                  Todos los verbos
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="verbType" 
                    checked={verbType === 'regular'} 
                    onChange={() => setVerbType('regular')} 
                  />
                  Solo regulares
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="verbType" 
                    checked={verbType === 'irregular'} 
                    onChange={() => setVerbType('irregular')} 
                  />
                  Solo irregulares
                </label>
              </div>
            </div>
            
            <button 
              className="btn start-learning-btn"
              onClick={handleStartLearning}
              disabled={!selectedTense || !duration || !verbType}
            >
              <img src="/play.png" alt="Comenzar" className="play-icon" />
              Comenzar a Aprender
            </button>
          </div>
        )}

        <button className="back-btn" onClick={onHome}>
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      </div>
    </div>
  );
}

export default LearnTenseFlow;

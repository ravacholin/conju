import React, { useState, useMemo } from 'react';
import curriculum from '../../data/curriculum.json';
import { verbs } from '../../data/verbs.js';
import { MOOD_LABELS, TENSE_LABELS } from '../../lib/utils/verbLabels.js';
import ClickableCard from '../shared/ClickableCard.jsx';
import NarrativeIntroduction from './NarrativeIntroduction.jsx';
import LearningDrill from './LearningDrill.jsx';
import MeaningfulPractice from './MeaningfulPractice.jsx';
import CommunicativePractice from './CommunicativePractice.jsx';
import './LearnTenseFlow.css';

function LearnTenseFlow() {
  const [currentStep, setCurrentStep] = useState('selection'); // 'selection' | 'introduction' | 'practice' | 'meaningful_practice' | 'communicative_practice'
  const [selectedTense, setSelectedTense] = useState(null);
  const [duration, setDuration] = useState(null); // 5, 10, 15
  const [verbType, setVerbType] = useState(null); // 'regular', 'irregular', 'all'

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
            forms.push({ ...form, lemma: verb.lemma });
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
      console.log('Starting learning with:', { selectedTense, duration, verbType });
      setCurrentStep('introduction');
    }
  };

  const handleFinish = () => {
    setSelectedTense(null);
    setDuration(null);
    setVerbType(null);
    setCurrentStep('selection');
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
      <NarrativeIntroduction 
        tense={selectedTense}
        onBack={() => setCurrentStep('selection')} 
        onContinue={() => setCurrentStep('practice')}
      />
    );
  }

  if (currentStep === 'practice') {
    return (
      <LearningDrill 
        eligibleForms={eligibleForms}
        duration={duration}
        onBack={() => setCurrentStep('introduction')} 
        onFinish={handleFinish}
        onPhaseComplete={handleMechanicalPhaseComplete}
      />
    );
  }

  if (currentStep === 'meaningful_practice') {
    return (
      <MeaningfulPractice 
        tense={selectedTense}
        eligibleForms={eligibleForms}
        onBack={() => setCurrentStep('practice')}
        onPhaseComplete={handleMeaningfulPhaseComplete}
      />
    );
  }

  if (currentStep === 'communicative_practice') {
    return (
      <CommunicativePractice 
        tense={selectedTense}
        eligibleForms={eligibleForms}
        onBack={() => setCurrentStep('meaningful_practice')}
        onFinish={handleFinish}
      />
    );
  }

  return (
    <div className="App learn-flow">
      <div className="center-column">
        <h1>Aprender un Nuevo Tiempo</h1>
        <p className="subtitle">Paso 1: Elige qué tiempo verbal quieres dominar.</p>

        {Object.entries(availableTenses).map(([mood, tenses]) => (
          <div key={mood} className="tense-group">
            <h2>{MOOD_LABELS[mood] || mood}</h2>
            <div className="options-grid">
              {tenses.map(tense => (
                <ClickableCard 
                  key={tense}
                  className={`option-card tense-card ${selectedTense?.tense === tense ? 'selected' : ''}`}
                  onClick={() => handleTenseSelection(mood, tense)}
                >
                  <div className="tense-card-content">
                    <div className="mastery-placeholder">
                      {/* Placeholder for the circular progress bar */}
                    </div>
                    <span className="tense-label">{TENSE_LABELS[tense] || tense}</span>
                  </div>
                </ClickableCard>
              ))}
            </div>
          </div>
        ))}

        {selectedTense && (
          <div className="config-panel">
            <div className="config-section">
              <h3 className="subtitle">Paso 2: Elige la duración</h3>
              <div className="options-row">
                <button onClick={() => setDuration(5)} className={`btn-filter ${duration === 5 ? 'active' : ''}`}>5 min</button>
                <button onClick={() => setDuration(10)} className={`btn-filter ${duration === 10 ? 'active' : ''}`}>10 min</button>
                <button onClick={() => setDuration(15)} className={`btn-filter ${duration === 15 ? 'active' : ''}`}>15 min</button>
              </div>
            </div>
            <div className="config-section">
              <h3 className="subtitle">Paso 3: Elige el tipo de verbo</h3>
              <div className="options-row">
                <button onClick={() => setVerbType('all')} className={`btn-filter ${verbType === 'all' ? 'active' : ''}`}>Todos</button>
                <button onClick={() => setVerbType('regular')} className={`btn-filter ${verbType === 'regular' ? 'active' : ''}`}>Regulares</button>
                <button onClick={() => setVerbType('irregular')} className={`btn-filter ${verbType === 'irregular' ? 'active' : ''}`}>Irregulares</button>
              </div>
            </div>
            <button 
              className="btn-primary start-learning-btn"
              onClick={handleStartLearning}
              disabled={!duration || !verbType}
            >
              Comenzar a Aprender
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LearnTenseFlow;
import React, { useEffect } from 'react'
import ClickableCard from '../shared/ClickableCard.jsx'
import { getTensesForMood, getTenseLabel, getMoodLabel } from '../../lib/utils/verbLabels.js'

function MoodTenseSelection({ 
  settings, 
  // formsForRegion, // Commented out - currently unused
  onSelectMood, 
  onSelectTense,
  onBack,
  getAvailableMoodsForLevel,
  getAvailableTensesForLevelAndMood,
  getModeSamples,
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
              <p className="conjugation-example">{getModeSamples(mood)}</p>
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
    
    // Function to get conjugation examples with 1st, 2nd, and 3rd person
    const getPersonConjugationExample = (mood, tense) => {
      const examples = {
        // Indicativo
        'indicative_pres': 'yo hablo, tú hablas, él/ella habla',
        'indicative_pretIndef': 'yo hablé, tú hablaste, él/ella habló',
        'indicative_impf': 'yo hablaba, tú hablabas, él/ella hablaba',
        'indicative_fut': 'yo hablaré, tú hablarás, él/ella hablará',
        'indicative_pretPerf': 'yo he hablado, tú has hablado, él/ella ha hablado',
        'indicative_plusc': 'yo había hablado, tú habías hablado, él/ella había hablado',
        'indicative_futPerf': 'yo habré hablado, tú habrás hablado, él/ella habrá hablado',
        
        // Subjuntivo
        'subjunctive_subjPres': 'yo hable, tú hables, él/ella hable',
        'subjunctive_subjImpf': 'yo hablara, tú hablaras, él/ella hablara',
        'subjunctive_subjPerf': 'yo haya hablado, tú hayas hablado, él/ella haya hablado',
        'subjunctive_subjPlusc': 'yo hubiera hablado, tú hubieras hablado, él/ella hubiera hablado',
        
        // Imperativo (dialect-specific)
        'imperative_impAff': settings.useVoseo && !settings.useTuteo ? 'tú habla, vos hablá, usted hable' : 'tú habla, usted hable',
        'imperative_impNeg': settings.useVoseo && !settings.useTuteo ? 'no hables, no habléis' : 'no hables, no habléis',
        'imperative_impMixed': settings.useVoseo && !settings.useTuteo ? 'tú habla / no hables, vos hablá / no habléis' : 'tú habla / no hables',
        
        // Condicional
        'conditional_cond': 'yo hablaría, tú hablarías, él/ella hablaría',
        'conditional_condPerf': 'yo habría hablado, tú habrías hablado, él/ella habría hablado',
        
        // Formas no conjugadas
        'nonfinite_ger': 'hablando',
        'nonfinite_part': 'hablado',
        'nonfinite_nonfiniteMixed': 'hablando / hablado'
      }
      
      const key = `${mood}_${tense}`
      return examples[key] || ''
    }
    
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
              <p className="conjugation-example">{getPersonConjugationExample(settings.specificMood, tense)}</p>
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
    
    // Function to get conjugation examples with 1st, 2nd, and 3rd person
    const getPersonConjugationExample = (mood, tense) => {
      const examples = {
        // Indicativo
        'indicative_pres': 'yo hablo, tú hablas, él/ella habla',
        'indicative_pretIndef': 'yo hablé, tú hablaste, él/ella habló',
        'indicative_impf': 'yo hablaba, tú hablabas, él/ella hablaba',
        'indicative_fut': 'yo hablaré, tú hablarás, él/ella hablará',
        'indicative_pretPerf': 'yo he hablado, tú has hablado, él/ella ha hablado',
        'indicative_plusc': 'yo había hablado, tú habías hablado, él/ella había hablado',
        'indicative_futPerf': 'yo habré hablado, tú habrás hablado, él/ella habrá hablado',
        
        // Subjuntivo
        'subjunctive_subjPres': 'yo hable, tú hables, él/ella hable',
        'subjunctive_subjImpf': 'yo hablara, tú hablaras, él/ella hablara',
        'subjunctive_subjPerf': 'yo haya hablado, tú hayas hablado, él/ella haya hablado',
        'subjunctive_subjPlusc': 'yo hubiera hablado, tú hubieras hablado, él/ella hubiera hablado',
        
        // Imperativo (dialect-specific)
        'imperative_impAff': settings.useVoseo && !settings.useTuteo ? 'tú habla, vos hablá, usted hable' : 'tú habla, usted hable',
        'imperative_impNeg': settings.useVoseo && !settings.useTuteo ? 'no hables, no habléis' : 'no hables, no habléis',
        'imperative_impMixed': settings.useVoseo && !settings.useTuteo ? 'tú habla / no hables, vos hablá / no habléis' : 'tú habla / no hables',
        
        // Condicional
        'conditional_cond': 'yo hablaría, tú hablarías, él/ella hablaría',
        'conditional_condPerf': 'yo habría hablado, tú habrías hablado, él/ella habría hablado',
        
        // Formas no conjugadas
        'nonfinite_ger': 'hablando',
        'nonfinite_part': 'hablado',
        'nonfinite_nonfiniteMixed': 'hablando / hablado'
      }
      
      const key = `${mood}_${tense}`
      return examples[key] || ''
    }
    
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
              <p className="conjugation-example">{getPersonConjugationExample(settings.specificMood, tense)}</p>
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

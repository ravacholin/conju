import ClickableCard from '../shared/ClickableCard.jsx'
import { getTensesForMood, getTenseLabel, getMoodLabel } from '../../lib/utils/verbLabels.js'

function MoodTenseSelection({ 
  settings, 
  onSelectMood, 
  onSelectTense,
  onBack,
  getAvailableMoodsForLevel,
  getAvailableTensesForLevelAndMood,
  getModeSamples,
  getConjugationExample
}) {
  
  
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
    return (
      <>
        <div className="options-grid">
          <ClickableCard 
            className="option-card compact" 
            onClick={() => onSelectMood('indicative')}
            title="Seleccionar modo indicativo"
          >
            <h3>Indicativo</h3>
            <p className="conjugation-example">{getModeSamples('indicative')}</p>
          </ClickableCard>
          
          <ClickableCard 
            className="option-card compact" 
            onClick={() => onSelectMood('subjunctive')}
            title="Seleccionar modo subjuntivo"
          >
            <h3>Subjuntivo</h3>
            <p className="conjugation-example">{getModeSamples('subjunctive')}</p>
          </ClickableCard>
          
          <ClickableCard 
            className="option-card compact" 
            onClick={() => onSelectMood('imperative')}
            title="Seleccionar modo imperativo"
          >
            <h3>Imperativo</h3>
            <p className="conjugation-example">{getModeSamples('imperative')}</p>
          </ClickableCard>
          
          <ClickableCard 
            className="option-card compact" 
            onClick={() => onSelectMood('conditional')}
            title="Seleccionar modo condicional"
          >
            <h3>Condicional</h3>
            <p className="conjugation-example">{getModeSamples('conditional')}</p>
          </ClickableCard>
          
          <ClickableCard 
            className="option-card compact" 
            onClick={() => onSelectMood('nonfinite')}
            title="Seleccionar formas no conjugadas"
          >
            <h3>Formas no conjugadas</h3>
            <p className="conjugation-example">{getModeSamples('nonfinite')}</p>
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
import ClickableCard from '../shared/ClickableCard.jsx'
import { getFamiliesForMood, getFamiliesForTense } from '../../lib/data/irregularFamilies.js'
import { 
  getSimplifiedGroupsForMood, 
  getSimplifiedGroupsForTense, 
  shouldUseSimplifiedGroupingForMood, 
  shouldUseSimplifiedGrouping 
} from '../../lib/data/simplifiedFamilyGroups.js'

function FamilySelection({ settings, onSelectFamily, onBack }) {
  
  if (settings.verbType === 'irregular' && settings.level && settings.practiceMode === 'mixed') {
    // Show family selection for irregular verbs from mixed practice
    return (
      <>
        <div className="options-grid">
          {/* All irregulars option */}
          <ClickableCard 
            className="option-card featured" 
            onClick={() => onSelectFamily(null)}
            title="Seleccionar todos los verbos irregulares"
          >
            <h3><img src="/diana.png" alt="Diana" className="option-icon" /> Todos los Irregulares</h3>
            <p>Todas las familias juntas</p>
            <p className="example">Máxima variedad</p>
          </ClickableCard>

          {/* Show simplified groups for mixed practice */}
          <ClickableCard 
            className="option-card compact" 
            onClick={() => onSelectFamily('STEM_CHANGES')}
            title="Seleccionar verbos que diptongan"
          >
            <h3>Verbos que Diptongan</h3>
            <p className="hint">Cambios de raíz: e→ie, o→ue, e→i</p>
            <p className="conjugation-example">pensar→pienso, volver→vuelvo, pedir→pido</p>
          </ClickableCard>
          
          <ClickableCard 
            className="option-card compact" 
            onClick={() => onSelectFamily('FIRST_PERSON_IRREGULAR')}
            title="Seleccionar verbos irregulares en primera persona"
          >
            <h3>Irregulares en YO</h3>
            <p className="hint">1ª persona irregular que afecta el subjuntivo</p>
            <p className="conjugation-example">tengo, conozco, salgo, protejo</p>
          </ClickableCard>
          
          <ClickableCard 
            className="option-card compact" 
            onClick={() => onSelectFamily('PRET_UV')}
            title="Seleccionar verbos con pretérito -uv-"
          >
            <h3>Pretérito -uv-</h3>
            <p className="conjugation-example">andar, estar, tener</p>
          </ClickableCard>
          
          <ClickableCard 
            className="option-card compact" 
            onClick={() => onSelectFamily('PRET_J')}
            title="Seleccionar verbos con pretérito -j-"
          >
            <h3>Pretérito -j-</h3>
            <p className="conjugation-example">decir, traer</p>
          </ClickableCard>
        </div>
        
        <button onClick={onBack} className="back-btn">
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      </>
    )
  }
  
  if (settings.verbType === 'irregular') {
    // Show family selection for irregular verbs
    const mood = settings.specificMood
    const tense = settings.specificTense
    
    return (
      <>
        <div className="options-grid">
          {/* All irregulars option */}
          <ClickableCard 
            className="option-card featured" 
            onClick={() => onSelectFamily(null)}
            title="Seleccionar todos los verbos irregulares"
          >
            <h3><img src="/diana.png" alt="Diana" className="option-icon" /> Todos los Irregulares</h3>
            <p>Todas las familias juntas</p>
            <p className="example">Máxima variedad</p>
          </ClickableCard>

          {/* Show simplified groups for present tenses, full families for others */}
          {(() => {
            // Use simplified grouping for supported tenses (present, preterite)
            if (tense && shouldUseSimplifiedGrouping(tense)) {
              const simplifiedGroups = getSimplifiedGroupsForTense(tense)
              return simplifiedGroups.map(group => (
                <ClickableCard 
                  key={group.id} 
                  className="option-card compact" 
                  onClick={() => onSelectFamily(group.id)}
                  title={`Seleccionar ${group.name}`}
                >
                  <h3>{group.name}</h3>
                  <p className="hint">{group.explanation}</p>
                  <p className="conjugation-example">{group.description}</p>
                </ClickableCard>
              ))
            } else if (mood && shouldUseSimplifiedGroupingForMood(mood) && !tense) {
              // For mood selection without specific tense, show all relevant groups
              const simplifiedGroups = getSimplifiedGroupsForMood(mood)
              return simplifiedGroups.map(group => (
                <ClickableCard 
                  key={group.id} 
                  className="option-card compact" 
                  onClick={() => onSelectFamily(group.id)}
                  title={`Seleccionar ${group.name}`}
                >
                  <h3>{group.name}</h3>
                  <p className="hint">{group.explanation}</p>
                  <p className="conjugation-example">{group.description}</p>
                </ClickableCard>
              ))
            } else {
              // Use families for specific tense, or fallback to mood families
              const availableFamilies = tense
                ? getFamiliesForTense(tense)
                : mood
                ? getFamiliesForMood(mood)
                : Object.values({
                    'G_VERBS': { id: 'G_VERBS', name: 'Irregulares en YO', description: 'tener, poner, salir, conocer, vencer' },
                    'UIR_Y': { id: 'UIR_Y', name: '-uir (inserción y)', description: 'construir, huir' },
                    'PRET_UV': { id: 'PRET_UV', name: 'Pretérito -uv-', description: 'andar, estar, tener' },
                    'PRET_U': { id: 'PRET_U', name: 'Pretérito -u-', description: 'poder, poner, saber' },
                    'PRET_J': { id: 'PRET_J', name: 'Pretérito -j-', description: 'decir, traer' }
                  })
              
              return availableFamilies.slice(0, 8).map(family => (
                <ClickableCard 
                  key={family.id} 
                  className="option-card compact" 
                  onClick={() => onSelectFamily(family.id)}
                  title={`Seleccionar ${family.name}`}
                >
                  <h3>{family.name}</h3>
                  <p className="conjugation-example">{family.description}</p>
                </ClickableCard>
              ))
            }
          })()}
        </div>
        
        <button onClick={onBack} className="back-btn">
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      </>
    )
  }
  
  return null
}

export default FamilySelection
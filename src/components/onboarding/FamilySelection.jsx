import React, { useEffect, useRef } from 'react'
import ClickableCard from '../shared/ClickableCard.jsx'
import { getFamiliesForMood, getFamiliesForTense } from '../../lib/data/irregularFamilies.js'
import {
  getSimplifiedGroupsForMood,
  getSimplifiedGroupsForTense,
  shouldUseSimplifiedGroupingForMood,
  shouldUseSimplifiedGrouping
} from '../../lib/data/simplifiedFamilyGroups.js'

const COMPOUND_TENSES = new Set(['pretPerf', 'plusc', 'futPerf', 'condPerf', 'subjPerf', 'subjPlusc'])

const FALLBACK_FAMILIES = [
  { id: 'G_VERBS', name: 'Irregulares en YO', description: 'tener, poner, salir, conocer, vencer' },
  { id: 'UIR_Y', name: '-uir (inserción y)', description: 'construir, huir' },
  { id: 'PRET_UV', name: 'Pretérito -uv-', description: 'andar, estar, tener' },
  { id: 'PRET_U', name: 'Pretérito -u-', description: 'poder, poner, saber' },
  { id: 'PRET_J', name: 'Pretérito -j-', description: 'decir, traer' }
]

function FamilySelection({ settings = {}, onSelectFamily, onBack }) {
  const { verbType, level, practiceMode, specificMood, specificTense } = settings

  const isIrregular = verbType === 'irregular'
  const isMixedPractice = isIrregular && level && practiceMode === 'mixed'
  const isCompoundTense = Boolean(specificTense && COMPOUND_TENSES.has(specificTense))

  let shouldAutoSelect = false
  const autoSelectValue = null
  let content = null

  const backButton = (
    <button onClick={onBack} className="back-btn">
      <img src="/back.png" alt="Volver" className="back-icon" />
    </button>
  )

  if (isMixedPractice) {
    if (isCompoundTense) {
      shouldAutoSelect = true
    } else {
      content = (
        <>
          <div className="options-grid">
            <ClickableCard
              className="option-card featured"
              onClick={() => onSelectFamily(null)}
              title="Seleccionar todos los verbos irregulares"
            >
              <h3 className="option-title"><img src="/diana.png" alt="Diana" className="option-icon" /> Todos los Irregulares</h3>
              <p>Todas las familias juntas</p>
              <p className="example">Máxima variedad</p>
            </ClickableCard>

            <ClickableCard
              className="option-card compact"
              onClick={() => onSelectFamily('STEM_CHANGES')}
              title="Seleccionar verbos que diptongan"
            >
              <h3 className="option-title">Verbos que Diptongan</h3>
              <p className="hint">Cambios de raíz: e→ie, o→ue, e→i</p>
              <p className="conjugation-example">pensar→pienso, volver→vuelvo, pedir→pido</p>
            </ClickableCard>

            <ClickableCard
              className="option-card compact"
              onClick={() => onSelectFamily('FIRST_PERSON_IRREGULAR')}
              title="Seleccionar verbos irregulares en primera persona"
            >
              <h3 className="option-title">Irregulares en YO</h3>
              <p className="hint">1ª persona irregular que afecta el subjuntivo</p>
              <p className="conjugation-example">tengo, conozco, salgo, protejo</p>
            </ClickableCard>

            <ClickableCard
              className="option-card compact"
              onClick={() => onSelectFamily('PRET_UV')}
              title="Seleccionar verbos con pretérito -uv-"
            >
              <h3 className="option-title">Pretérito -uv-</h3>
              <p className="conjugation-example">andar, estar, tener</p>
            </ClickableCard>

            <ClickableCard
              className="option-card compact"
              onClick={() => onSelectFamily('PRET_J')}
              title="Seleccionar verbos con pretérito -j-"
            >
              <h3 className="option-title">Pretérito -j-</h3>
              <p className="conjugation-example">decir, traer</p>
            </ClickableCard>
          </div>
          {backButton}
        </>
      )
    }
  } else if (isIrregular) {
    if (isCompoundTense) {
      shouldAutoSelect = true
    } else {
      const optionCards = [
        (
          <ClickableCard
            key="all-irregulars"
            className="option-card featured"
            onClick={() => onSelectFamily(null)}
            title="Seleccionar todos los verbos irregulares"
          >
            <h3 className="option-title"><img src="/diana.png" alt="Diana" className="option-icon" /> Todos los Irregulares</h3>
            <p>Todas las familias juntas</p>
            <p className="example">Máxima variedad</p>
          </ClickableCard>
        )
      ]

      let simplifiedGroups = null
      let useSimplifiedGroups = false

      if (specificTense && shouldUseSimplifiedGrouping(specificTense)) {
        useSimplifiedGroups = true
        simplifiedGroups = getSimplifiedGroupsForTense(specificTense) || []
      } else if (specificMood && !specificTense && shouldUseSimplifiedGroupingForMood(specificMood)) {
        useSimplifiedGroups = true
        simplifiedGroups = getSimplifiedGroupsForMood(specificMood) || []
      }

      if (useSimplifiedGroups) {
        if (!simplifiedGroups || simplifiedGroups.length === 0) {
          shouldAutoSelect = true
        } else {
          simplifiedGroups.forEach(group => {
            optionCards.push(
              <ClickableCard
                key={group.id}
                className="option-card compact"
                onClick={() => onSelectFamily(group.id)}
                title={`Seleccionar ${group.name}`}
              >
                <h3 className="option-title">{group.name}</h3>
                <p className="hint">{group.explanation}</p>
                <p className="conjugation-example">{group.description}</p>
              </ClickableCard>
            )
          })
        }
      } else {
        const availableFamilies = specificTense
          ? getFamiliesForTense(specificTense)
          : specificMood
            ? getFamiliesForMood(specificMood)
            : FALLBACK_FAMILIES

        if (!availableFamilies || availableFamilies.length === 0) {
          shouldAutoSelect = true
        } else {
          availableFamilies.slice(0, 8).forEach(family => {
            optionCards.push(
              <ClickableCard
                key={family.id}
                className="option-card compact"
                onClick={() => onSelectFamily(family.id)}
                title={`Seleccionar ${family.name}`}
              >
                <h3 className="option-title">{family.name}</h3>
                <p className="conjugation-example">{family.description}</p>
              </ClickableCard>
            )
          })
        }
      }

      if (!shouldAutoSelect) {
        content = (
          <>
            <div className="options-grid">
              {optionCards}
            </div>
            {backButton}
          </>
        )
      }
    }
  }

  const lastAutoSelectionRef = useRef(null)

  useEffect(() => {
    if (!shouldAutoSelect) {
      lastAutoSelectionRef.current = null
      return
    }

    const key = JSON.stringify(autoSelectValue ?? null)
    if (lastAutoSelectionRef.current === key) {
      return
    }

    lastAutoSelectionRef.current = key
    onSelectFamily(autoSelectValue ?? null)
  }, [shouldAutoSelect, autoSelectValue, onSelectFamily])

  if (shouldAutoSelect) {
    return null
  }

  return content
}

export default FamilySelection

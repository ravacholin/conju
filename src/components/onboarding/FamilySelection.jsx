import React, { useEffect, useRef } from 'react'
import MenuOptionCard from './MenuOptionCard.jsx'
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
            <MenuOptionCard
              className="featured"
              eyebrow="AMPLIO"
              badge="ALL"
              title="TODOS LOS IRREGULARES"
              subtitle="Todas las familias juntas"
              description="Máxima variedad para explorar patrones cruzados."
              detail="Máxima variedad"
              onClick={() => onSelectFamily(null)}
              cardTitle="Seleccionar todos los verbos irregulares"
            />

            <MenuOptionCard
              className="compact"
              eyebrow="RAÍZ"
              badge="01"
              title="VERBOS QUE DIPTONGAN"
              subtitle="Cambios de raíz"
              description="e→ie, o→ue, e→i"
              detail="pensar→pienso, volver→vuelvo, pedir→pido"
              onClick={() => onSelectFamily('STEM_CHANGES')}
              cardTitle="Seleccionar verbos que diptongan"
            />

            <MenuOptionCard
              className="compact"
              eyebrow="YO"
              badge="02"
              title="IRREGULARES EN YO"
              subtitle="Primera persona irregular"
              description="Afecta también familias del subjuntivo."
              detail="tengo, conozco, salgo, protejo"
              onClick={() => onSelectFamily('FIRST_PERSON_IRREGULAR')}
              cardTitle="Seleccionar verbos irregulares en primera persona"
            />

            <MenuOptionCard
              className="compact"
              eyebrow="PRETÉRITO"
              badge="03"
              title="PRETÉRITO -UV-"
              subtitle="Radical alterado"
              description="Familia clásica de pretérito fuerte."
              detail="andar, estar, tener"
              onClick={() => onSelectFamily('PRET_UV')}
              cardTitle="Seleccionar verbos con pretérito -uv-"
            />

            <MenuOptionCard
              className="compact"
              eyebrow="PRETÉRITO"
              badge="04"
              title="PRETÉRITO -J-"
              subtitle="Tema consonántico"
              description="Casos intensos de irregularidad narrativa."
              detail="decir, traer"
              onClick={() => onSelectFamily('PRET_J')}
              cardTitle="Seleccionar verbos con pretérito -j-"
            />
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
          <MenuOptionCard
            key="all-irregulars"
            className="featured"
            eyebrow="AMPLIO"
            badge="ALL"
            title="TODOS LOS IRREGULARES"
            subtitle="Todas las familias juntas"
            description="Mantiene todos los patrones abiertos para máxima cobertura."
            detail="Máxima variedad"
            onClick={() => onSelectFamily(null)}
            cardTitle="Seleccionar todos los verbos irregulares"
          />
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
          simplifiedGroups.forEach((group) => {
            optionCards.push(
              <MenuOptionCard
                key={group.id}
                className="compact"
                eyebrow="GRUPO"
                badge={group.id}
                title={group.name}
                subtitle={group.explanation}
                description="Patrón irregular concentrado."
                detail={group.description}
                onClick={() => onSelectFamily(group.id)}
                cardTitle={`Seleccionar ${group.name}`}
              />
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
          availableFamilies.slice(0, 8).forEach((family) => {
            optionCards.push(
              <MenuOptionCard
                key={family.id}
                className="compact"
                eyebrow="FAMILIA"
                badge={family.id}
                title={family.name}
                subtitle="Patrón irregular"
                description="Entrada puntual para repetición concentrada."
                detail={family.description}
                onClick={() => onSelectFamily(family.id)}
                cardTitle={`Seleccionar ${family.name}`}
              />
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

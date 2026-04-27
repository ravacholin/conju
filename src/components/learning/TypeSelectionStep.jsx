import React, { useMemo } from 'react'
import MenuOptionCard from '../onboarding/MenuOptionCard.jsx'
import LearningMenuLayout from './LearningMenuLayout.jsx'
import { formatMoodTense } from '../../lib/utils/verbLabels.js'

const buildIrregularCategories = (tenseKey, availableFamilies) => {
  if (!tenseKey) {
    return {}
  }

  const categories = {}

  if (tenseKey === 'pres') {
    categories.yo_irregular_g = {
      name: 'Irregulares en YO',
      description: 'Primera persona irregular: conozco, salgo, estoy',
      families: [
        ...availableFamilies.filter(f => f.id === 'LEARNING_YO_ZCO_PRESENT'),
        ...availableFamilies.filter(f => f.id === 'LEARNING_YO_G_PRESENT'),
        ...availableFamilies.filter(f => f.id === 'LEARNING_VERY_IRREGULAR')
      ]
    }
    categories.diphthongs = {
      name: 'Verbos que diptongan',
      description: 'Cambios vocálicos: e→ie (quiero), e→i (pido), o→ue (puedo)',
      families: availableFamilies.filter(f => f.id === 'LEARNING_DIPHTHONGS')
    }
    categories.very_irregular = {
      name: 'Muy irregulares',
      description: 'Formas únicas: soy/eres, estoy/estás, voy/vas, doy/das',
      families: availableFamilies.filter(f => f.id === 'LEARNING_VERY_IRREGULAR')
    }
    return categories
  }

  if (tenseKey === 'pretIndef') {
    categories.pret_muy_irregulares = {
      name: 'Muy irregulares',
      description: 'Verbos frecuentes con raíces completamente nuevas: estuve, quise, hice',
      families: availableFamilies.filter(f => f.id === 'LEARNING_PRET_MUY_IRREGULARES')
    }
    categories.pret_3as_personas = {
      name: 'Irregulares en 3ª persona',
      description: 'Solo cambian en 3ª persona: pidió/pidieron, durmió/durmieron, leyó/leyeron',
      families: availableFamilies.filter(f => f.id === 'LEARNING_PRET_3AS_PERSONAS')
    }
    return categories
  }

  if (tenseKey === 'impf') {
    categories.imperfect = {
      name: 'Irregulares del imperfecto',
      description: 'Los únicos 3 verbos con imperfecto irregular: ser (era), ir (iba), ver (veía)',
      families: availableFamilies.filter(f => f.id === 'LEARNING_IMPF_IRREGULAR')
    }
    return categories
  }

  if (tenseKey === 'fut' || tenseKey === 'cond') {
    categories.future_cond_roots = {
      name: 'Raíces irregulares',
      description: 'tendr-, dir-, podr-, sabr- comparten terminaciones regulares',
      families: availableFamilies.filter(f => f.id === 'LEARNING_FUT_COND_IRREGULAR')
    }
    return categories
  }

  if (tenseKey === 'ger') {
    categories.irregular_gerunds = {
      name: 'Gerundios irregulares',
      description: 'yendo, diciendo, durmiendo: práctica rápida de formas clave',
      families: availableFamilies.filter(f => f.id === 'LEARNING_IRREG_GERUNDS')
    }
    return categories
  }

  if (tenseKey === 'part') {
    categories.irregular_participles = {
      name: 'Participios irregulares',
      description: 'hecho, visto, puesto, vuelto… Memoriza los indispensables',
      families: availableFamilies.filter(f => f.id === 'LEARNING_IRREG_PARTICIPLES')
    }
    return categories
  }

  categories.orthographic = {
    name: 'Cambios ortográficos',
    description: 'Conservación del sonido: busqué, llegué',
    families: availableFamilies.filter(f => ['LEARNING_ORTH_CAR', 'LEARNING_ORTH_GAR'].includes(f.id))
  }

  categories.preterite = {
    name: 'Pretéritos fuertes',
    description: 'Cambios especiales en pretérito: tuve, estuve',
    families: availableFamilies.filter(f => f.id === 'LEARNING_PRET_MUY_IRREGULARES')
  }

  return categories
}

function TypeSelectionStep({ selectedTense, availableFamilies = [], onSelectType, onBack, onHome }) {
  const tenseKey = selectedTense?.tense

  const irregularCategories = useMemo(
    () => buildIrregularCategories(tenseKey, availableFamilies),
    [tenseKey, availableFamilies]
  )

  return (
    <LearningMenuLayout
      step="02"
      kicker="MATERIAL"
      title="Elegí el tipo de verbos"
      description={`Para ${selectedTense ? formatMoodTense(selectedTense.mood, selectedTense.tense) : 'este tiempo'}, podés ir por patrones regulares o atacar familias irregulares concretas.`}
      onHome={onHome}
      footer={(
        <button className="back-btn" onClick={onBack}>
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      )}
    >
        <div className="tense-section">
          <h2>{selectedTense ? formatMoodTense(selectedTense.mood, selectedTense.tense) : ''}</h2>
          <div className="options-grid">
            <MenuOptionCard
              className="learning-option-card"
              eyebrow="BASE"
              badge="REG"
              title="Regulares"
              subtitle="Patrones estables"
              description="Ideal para fijar terminaciones y lógica del tiempo sin ruido extra."
              detail="hablar, comer, vivir"
              onClick={() => onSelectType('regular')}
              cardTitle="Practicar verbos regulares"
            />

            {Object.entries(irregularCategories).map(([key, category]) => {
              if (category.families.length === 0) return null

              return (
                <MenuOptionCard
                  key={key}
                  className="learning-option-card"
                  eyebrow="IRREGULAR"
                  badge={String(category.families.length).padStart(2, '0')}
                  title={category.name}
                  subtitle="Familia pedagógica"
                  description="Agrupación enfocada para aprender un patrón reconocible."
                  detail={category.description}
                  onClick={() => onSelectType('irregular', category.families.map(f => f.id))}
                  cardTitle={`Practicar ${category.name.toLowerCase()}`}
                />
              )
            })}
          </div>
        </div>
    </LearningMenuLayout>
  )
}

export default TypeSelectionStep

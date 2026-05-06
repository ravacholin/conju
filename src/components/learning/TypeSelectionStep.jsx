import React, { useMemo } from 'react'
import LearningStepView from './LearningStepView.jsx'
import { formatMoodTense } from '../../lib/utils/verbLabels.js'

const buildIrregularCategories = (tenseKey, availableFamilies) => {
  if (!tenseKey) return {}

  const categories = {}

  if (tenseKey === 'pres') {
    categories.yo_irregular_g = {
      name: 'Irregulares en YO',
      description: 'conozco, salgo, estoy',
      families: [
        ...availableFamilies.filter(f => f.id === 'LEARNING_YO_ZCO_PRESENT'),
        ...availableFamilies.filter(f => f.id === 'LEARNING_YO_G_PRESENT'),
        ...availableFamilies.filter(f => f.id === 'LEARNING_VERY_IRREGULAR')
      ]
    }
    categories.diphthongs = {
      name: 'Verbos que diptongan',
      description: 'quiero, pido, puedo',
      families: availableFamilies.filter(f => f.id === 'LEARNING_DIPHTHONGS')
    }
    categories.very_irregular = {
      name: 'Muy irregulares',
      description: 'soy, estoy, voy, doy',
      families: availableFamilies.filter(f => f.id === 'LEARNING_VERY_IRREGULAR')
    }
    return categories
  }

  if (tenseKey === 'pretIndef') {
    categories.pret_muy_irregulares = {
      name: 'Muy irregulares',
      description: 'estuve, quise, hice',
      families: availableFamilies.filter(f => f.id === 'LEARNING_PRET_MUY_IRREGULARES')
    }
    categories.pret_3as_personas = {
      name: 'Irregulares en 3ª persona',
      description: 'pidió, durmió, leyó',
      families: availableFamilies.filter(f => f.id === 'LEARNING_PRET_3AS_PERSONAS')
    }
    return categories
  }

  if (tenseKey === 'impf') {
    categories.imperfect = {
      name: 'Irregulares del imperfecto',
      description: 'era, iba, veía',
      families: availableFamilies.filter(f => f.id === 'LEARNING_IMPF_IRREGULAR')
    }
    return categories
  }

  if (tenseKey === 'fut' || tenseKey === 'cond') {
    categories.future_cond_roots = {
      name: 'Raíces irregulares',
      description: 'tendr-, dir-, podr-, sabr-',
      families: availableFamilies.filter(f => f.id === 'LEARNING_FUT_COND_IRREGULAR')
    }
    return categories
  }

  if (tenseKey === 'ger') {
    categories.irregular_gerunds = {
      name: 'Gerundios irregulares',
      description: 'yendo, diciendo, durmiendo',
      families: availableFamilies.filter(f => f.id === 'LEARNING_IRREG_GERUNDS')
    }
    return categories
  }

  if (tenseKey === 'part') {
    categories.irregular_participles = {
      name: 'Participios irregulares',
      description: 'hecho, visto, puesto, vuelto',
      families: availableFamilies.filter(f => f.id === 'LEARNING_IRREG_PARTICIPLES')
    }
    return categories
  }

  categories.orthographic = {
    name: 'Cambios ortográficos',
    description: 'busqué, llegué',
    families: availableFamilies.filter(f => ['LEARNING_ORTH_CAR', 'LEARNING_ORTH_GAR'].includes(f.id))
  }
  categories.preterite = {
    name: 'Pretéritos fuertes',
    description: 'tuve, estuve',
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

  const options = useMemo(() => {
    const opts = [
      {
        id: 'regular',
        label: 'regulares',
        tag: 'SISTEMA',
        gloss: 'siguen la regla',
        ex: 'hablar, comer, vivir',
        onSelect: () => onSelectType('regular'),
      }
    ]

    Object.entries(irregularCategories).forEach(([key, category]) => {
      if (category.families.length === 0) return
      opts.push({
        id: key,
        label: category.name,
        tag: 'IRREGULAR',
        gloss: `${category.families.length} familia${category.families.length !== 1 ? 's' : ''}`,
        ex: category.description,
        onSelect: () => onSelectType('irregular', category.families.map(f => f.id)),
      })
    })

    return opts
  }, [irregularCategories, onSelectType])

  const tenseName = selectedTense ? formatMoodTense(selectedTense.mood, selectedTense.tense) : 'este tiempo'

  const stepConfig = {
    n: '02',
    kicker: 'TIPO DE VERBOS',
    prompt: 'Trabajás...',
    aux: `Regulares o familias irregulares para ${tenseName}.`,
    options,
  }

  const breadcrumb = [
    { label: 'FLUJO', value: 'aprender' },
    ...(selectedTense ? [{ label: 'TIEMPO', value: tenseName }] : []),
  ]

  return (
    <LearningStepView
      stepConfig={stepConfig}
      onBack={onBack}
      breadcrumb={breadcrumb}
      stepNum={2}
      totalSteps={3}
    />
  )
}

export default TypeSelectionStep

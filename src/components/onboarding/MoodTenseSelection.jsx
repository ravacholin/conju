import React from 'react'
import MenuOptionCard from './MenuOptionCard.jsx'
import { getTensesForMood, getTenseLabel, getMoodLabel } from '../../lib/utils/verbLabels.js'

function MoodTenseSelection({
  settings,
  onSelectMood,
  onSelectTense,
  onBack,
  getAvailableMoodsForLevel,
  getAvailableTensesForLevelAndMood,
  getConjugationExample
}) {
  if (settings.level && settings.practiceMode === 'specific' && settings.specificMood) {
    return (
      <>
        <div className="options-grid">
          {getAvailableTensesForLevelAndMood(settings.level, settings.specificMood).map((tense) => (
            <MenuOptionCard
              key={tense}
              eyebrow={getMoodLabel(settings.specificMood)}
              badge={settings.level}
              title={getTenseLabel(tense)}
              subtitle="Tiempo habilitado por tu nivel"
              description="Recorte directo del drill sin modificar la mecánica de corrección."
              detail={getConjugationExample(settings.specificMood, tense)}
              onClick={() => onSelectTense(tense)}
              cardTitle={`Seleccionar ${getTenseLabel(tense)}`}
            />
          ))}
        </div>

        <button onClick={onBack} className="back-btn">
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      </>
    )
  }

  if (settings.level && settings.practiceMode === 'specific') {
    const availableMoods = getAvailableMoodsForLevel(settings.level)

    return (
      <>
        <div className="options-grid">
          {availableMoods.map((mood) => (
            <MenuOptionCard
              key={mood}
              eyebrow={settings.level}
              badge="MODO"
              title={getMoodLabel(mood)}
              subtitle="Modo verbal"
              description="Activa solo este bloque para filtrar tiempos y ejemplos relevantes."
              detail="yo hablo, tú hablas, él/ella habla"
              onClick={() => onSelectMood(mood)}
              cardTitle={`Seleccionar ${getMoodLabel(mood)}`}
            />
          ))}
        </div>

        <button onClick={onBack} className="back-btn">
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      </>
    )
  }

  if (!settings.level && settings.practiceMode === 'specific' && settings.specificMood) {
    return (
      <>
        <div className="options-grid">
          {getTensesForMood(settings.specificMood).map((tense) => (
            <MenuOptionCard
              key={tense}
              eyebrow={getMoodLabel(settings.specificMood)}
              badge="FOCO"
              title={getTenseLabel(tense)}
              subtitle="Tiempo verbal"
              description="Entrada limpia a práctica temática o específica."
              detail={getConjugationExample(settings.specificMood, tense)}
              onClick={() => onSelectTense(tense)}
              cardTitle={`Seleccionar ${getTenseLabel(tense)}`}
            />
          ))}
        </div>

        <button onClick={onBack} className="back-btn">
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      </>
    )
  }

  const moodCards = (
    <div className="options-grid">
      <MenuOptionCard
        eyebrow="FINITAS"
        badge="01"
        title="INDICATIVO"
        subtitle="Hechos, hábitos y relato"
        description="El bloque más amplio para tiempos de uso central."
        detail="yo hablo, tú hablas, él/ella habla"
        onClick={() => onSelectMood('indicative')}
        cardTitle="Seleccionar modo indicativo"
      />

      <MenuOptionCard
        eyebrow="FINITAS"
        badge="02"
        title="SUBJUNTIVO"
        subtitle="Hipótesis, deseo y matiz"
        description="Recorta la práctica a contraste modal fino."
        detail="yo hable, tú hables, él/ella hable"
        onClick={() => onSelectMood('subjunctive')}
        cardTitle="Seleccionar modo subjuntivo"
      />

      <MenuOptionCard
        eyebrow="MANDATO"
        badge="03"
        title="IMPERATIVO"
        subtitle="Órdenes e instrucciones"
        description="Concentra las personas útiles para directivas y comandos."
        detail="tú habla, vos hablá, usted hable"
        onClick={() => onSelectMood('imperative')}
        cardTitle="Seleccionar modo imperativo"
      />

      <MenuOptionCard
        eyebrow="HIPÓTESIS"
        badge="04"
        title="CONDICIONAL"
        subtitle="Consecuencia y posibilidad"
        description="Modo ideal para estructuras de probabilidad y cortesía."
        detail="yo hablaría, tú hablarías, él/ella hablaría"
        onClick={() => onSelectMood('conditional')}
        cardTitle="Seleccionar modo condicional"
      />

      <MenuOptionCard
        eyebrow="NO FINITAS"
        badge="05"
        title="NO CONJUGADAS"
        subtitle="Infinitivo, gerundio y participio"
        description="Ataca las formas periféricas sin entrar en paradigma personal."
        detail="hablando, hablado"
        onClick={() => onSelectMood('nonfinite')}
        cardTitle="Seleccionar formas no conjugadas"
      />
    </div>
  )

  if (!settings.level && settings.practiceMode === 'specific') {
    return (
      <>
        {moodCards}

        <button onClick={onBack} className="back-btn">
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      </>
    )
  }

  if (settings.practiceMode === 'theme' && settings.specificMood) {
    return (
      <>
        <div className="options-grid">
          {getTensesForMood(settings.specificMood).map((tense) => (
            <MenuOptionCard
              key={tense}
              eyebrow={getMoodLabel(settings.specificMood)}
              badge="TEMA"
              title={getTenseLabel(tense)}
              subtitle="Tiempo verbal"
              description="Entrada temática directa para practicar un bloque concreto."
              detail={getConjugationExample(settings.specificMood, tense)}
              onClick={() => onSelectTense(tense)}
              cardTitle={`Seleccionar ${getTenseLabel(tense)}`}
            />
          ))}
        </div>

        <button onClick={onBack} className="back-btn">
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      </>
    )
  }

  if (settings.practiceMode === 'theme') {
    return (
      <>
        {moodCards}

        <button onClick={onBack} className="back-btn">
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      </>
    )
  }

  return null
}

export default MoodTenseSelection

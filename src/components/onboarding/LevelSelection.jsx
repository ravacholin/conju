import React from 'react'
import MenuOptionCard from './MenuOptionCard.jsx'

function LevelSelection({
  onSelectLevel,
  onSelectPracticeMode,
  onGoToLevelDetails,
  onBack,
  showLevelDetails = false,
  onGoToProgress,
  onStartLearningNewTense,
  onStartLevelTest
}) {
  if (showLevelDetails) {
    return (
      <>
        <div className="options-grid">
          <MenuOptionCard
            eyebrow="ACCESO"
            badge="01"
            title="A1"
            subtitle="Principiante"
            description="Entrada directa a las formas núcleo."
            detail="Presente"
            onClick={() => onSelectLevel('A1')}
            cardTitle="Seleccionar nivel A1 - Principiante"
          />

          <MenuOptionCard
            eyebrow="BASE"
            badge="02"
            title="A2"
            subtitle="Elemental"
            description="Amplía repertorio con primeros tiempos narrativos."
            detail="Pretéritos, Futuro, Imperativo"
            onClick={() => onSelectLevel('A2')}
            cardTitle="Seleccionar nivel A2 - Elemental"
          />

          <MenuOptionCard
            eyebrow="TRACCIÓN"
            badge="03"
            title="B1"
            subtitle="Intermedio"
            description="Consolida contraste temporal y precisión verbal."
            detail="Futuro compuesto, Condicional"
            onClick={() => onSelectLevel('B1')}
            cardTitle="Seleccionar nivel B1 - Intermedio"
          />

          <MenuOptionCard
            eyebrow="PRECISIÓN"
            badge="04"
            title="B2"
            subtitle="Intermedio alto"
            description="Empieza a exigir control real de variación y subordinación."
            detail="Subjuntivo imperfecto"
            onClick={() => onSelectLevel('B2')}
            cardTitle="Seleccionar nivel B2 - Intermedio alto"
          />

          <MenuOptionCard
            eyebrow="MATIZ"
            badge="05"
            title="C1"
            subtitle="Avanzado"
            description="Pensado para discurso flexible, rápido y fino."
            detail="Discurso preciso y fluido"
            onClick={() => onSelectLevel('C1')}
            cardTitle="Seleccionar nivel C1 - Avanzado"
          />

          <MenuOptionCard
            eyebrow="DOMINIO"
            badge="06"
            title="C2"
            subtitle="Superior"
            description="Máxima complejidad y repertorio verbal completo."
            detail="Dominio nativo"
            onClick={() => onSelectLevel('C2')}
            cardTitle="Seleccionar nivel C2 - Superior"
          />

          {onStartLevelTest && (
            <MenuOptionCard
              className="level-test-card"
              eyebrow="AUTOMÁTICO"
              badge="TEST"
              title="TEST"
              subtitle="Determinar nivel"
              description="Diagnóstico adaptativo para elegir dificultad sin fricción."
              detail="Automático • Adaptativo"
              onClick={onStartLevelTest}
              cardTitle="Test de nivel adaptativo - Determina tu nivel automáticamente"
            />
          )}
        </div>

        <p>Volver al menú: Por tema / Por nivel</p>

        <button onClick={onBack} className="back-btn">
          <img src="/back.png" alt="Volver" className="back-icon" />
        </button>
      </>
    )
  }

  return (
    <>
      <div className="options-grid">
        <MenuOptionCard
          eyebrow="PROGRESIÓN"
          badge="A1-C2"
          title="NIVELES"
          subtitle="Por dificultad"
          description="Recorrido estructurado por tramo CEFR con filtros pedagógicos."
          detail="Camino progresivo estructurado"
          onClick={onGoToLevelDetails}
          cardTitle="Practicar por nivel específico (A1-C2)"
        />

        <MenuOptionCard
          eyebrow="FOCO"
          badge="MODO"
          title="TEMAS"
          subtitle="Por tiempo verbal"
          description="Entrá directo a un territorio verbal concreto sin pasar por la escala CEFR."
          detail="Presente, Subjuntivo, etc."
          onClick={() => onSelectPracticeMode('theme')}
          cardTitle="Practicar temas específicos (presente, subjuntivo, etc.)"
        />

        <MenuOptionCard
          eyebrow="GUIADO"
          badge="LEARN"
          title="APRENDER"
          subtitle="Lecciones guiadas"
          description="Flujo pedagógico paso a paso para incorporar tiempos nuevos."
          detail="Explicaciones y práctica paso a paso"
          onClick={onStartLearningNewTense}
          cardTitle="Aprender un tiempo verbal nuevo con un método guiado"
        />

        {onGoToProgress && (
          <MenuOptionCard
            eyebrow="TRACKING"
            badge="DATA"
            title="PROGRESO"
            subtitle="Estadísticas"
            description="Dashboard con métricas, mapas y recomendaciones."
            detail="Analíticas y mapa de calor"
            onClick={() => onGoToProgress()}
            cardTitle="Ver progreso y analíticas"
          />
        )}
      </div>

      <button onClick={onBack} className="back-btn">
        <img src="/back.png" alt="Volver" className="back-icon" />
      </button>
    </>
  )
}

export default LevelSelection

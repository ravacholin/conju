// REPORTE COMPLETO DE DISPONIBILIDAD DE VERBOS
// ================================================

export const verbAvailabilityReport = {
  summary: {
    totalVerbsNeeded: 251,
    currentVerbsAvailable: 80,
    missingVerbs: 171,
    estimatedFormsNeeded: 760,
    categoriesToCover: 19
  },
  
  currentStatus: {
    A1: {
      indicative: { pres: '✅ OK' },
      nonfinite: { part: '❌ INSUFICIENTE', ger: '❌ INSUFICIENTE' }
    },
    A2: {
      indicative: { 
        pres: '✅ OK', 
        pretIndef: '❌ INSUFICIENTE', 
        impf: '❌ INSUFICIENTE', 
        fut: '❌ INSUFICIENTE' 
      },
      imperative: { impAff: '❌ INSUFICIENTE' },
      nonfinite: { part: '❌ INSUFICIENTE', ger: '❌ INSUFICIENTE' }
    },
    B1: {
      indicative: { 
        pres: '✅ OK', 
        pretIndef: '❌ INSUFICIENTE', 
        impf: '❌ INSUFICIENTE', 
        fut: '❌ INSUFICIENTE',
        plusc: '❌ INSUFICIENTE',
        pretPerf: '❌ INSUFICIENTE',
        futPerf: '❌ INSUFICIENTE'
      },
      subjunctive: { 
        subjPres: '❌ INSUFICIENTE', 
        subjPerf: '❌ INSUFICIENTE' 
      },
      imperative: { impNeg: '❌ INSUFICIENTE' },
      conditional: { cond: '❌ INSUFICIENTE' },
      nonfinite: { part: '❌ INSUFICIENTE', ger: '❌ INSUFICIENTE' }
    },
    B2: {
      indicative: { 
        pres: '✅ OK', 
        pretIndef: '❌ INSUFICIENTE', 
        impf: '❌ INSUFICIENTE', 
        fut: '❌ INSUFICIENTE',
        plusc: '❌ INSUFICIENTE',
        pretPerf: '❌ INSUFICIENTE',
        futPerf: '❌ INSUFICIENTE'
      },
      subjunctive: { 
        subjPres: '❌ INSUFICIENTE', 
        subjPerf: '❌ INSUFICIENTE',
        subjImpf: '❌ INSUFICIENTE',
        subjPlusc: '❌ INSUFICIENTE'
      },
      imperative: { 
        impAff: '❌ INSUFICIENTE', 
        impNeg: '❌ INSUFICIENTE' 
      },
      conditional: { 
        cond: '❌ INSUFICIENTE', 
        condPerf: '❌ INSUFICIENTE' 
      },
      nonfinite: { part: '❌ INSUFICIENTE', ger: '❌ INSUFICIENTE' }
    },
    C1: {
      indicative: { 
        pres: '❌ INSUFICIENTE', 
        pretIndef: '❌ INSUFICIENTE', 
        impf: '❌ INSUFICIENTE', 
        fut: '❌ INSUFICIENTE',
        plusc: '❌ INSUFICIENTE',
        pretPerf: '❌ INSUFICIENTE',
        futPerf: '❌ INSUFICIENTE'
      },
      subjunctive: { 
        subjPres: '❌ INSUFICIENTE', 
        subjPerf: '❌ INSUFICIENTE',
        subjImpf: '❌ INSUFICIENTE',
        subjPlusc: '❌ INSUFICIENTE'
      },
      imperative: { 
        impAff: '❌ INSUFICIENTE', 
        impNeg: '❌ INSUFICIENTE' 
      },
      conditional: { 
        cond: '❌ INSUFICIENTE', 
        condPerf: '❌ INSUFICIENTE' 
      },
      nonfinite: { part: '❌ INSUFICIENTE', ger: '❌ INSUFICIENTE' }
    },
    C2: {
      indicative: { 
        pres: '❌ INSUFICIENTE', 
        pretIndef: '❌ INSUFICIENTE', 
        impf: '❌ INSUFICIENTE', 
        fut: '❌ INSUFICIENTE',
        plusc: '❌ INSUFICIENTE',
        pretPerf: '❌ INSUFICIENTE',
        futPerf: '❌ INSUFICIENTE'
      },
      subjunctive: { 
        subjPres: '❌ INSUFICIENTE', 
        subjPerf: '❌ INSUFICIENTE',
        subjImpf: '❌ INSUFICIENTE',
        subjPlusc: '❌ INSUFICIENTE'
      },
      imperative: { 
        impAff: '❌ INSUFICIENTE', 
        impNeg: '❌ INSUFICIENTE' 
      },
      conditional: { 
        cond: '❌ INSUFICIENTE', 
        condPerf: '❌ INSUFICIENTE' 
      },
      nonfinite: { part: '❌ INSUFICIENTE', ger: '❌ INSUFICIENTE' }
    }
  },
  
  priorityVerbs: [
    // Verbos regulares - AR (alta frecuencia)
    'trabajar', 'estudiar', 'caminar', 'bailar', 'cantar', 'nadar', 'cocinar', 'limpiar', 'preguntar',
    'ayudar', 'buscar', 'comprar', 'llevar', 'dejar', 'pasar', 'llegar', 'empezar', 'terminar', 'esperar',
    'llamar', 'mirar', 'escuchar', 'pensar', 'recordar', 'olvidar', 'encontrar', 'entrar', 'salir', 'volver',
    'regresar', 'cambiar', 'mejorar', 'comenzar', 'continuar', 'acabar', 'quedar',
    
    // Verbos regulares - ER (alta frecuencia)
    'aprender', 'comprender', 'entender', 'vender', 'perder', 'correr', 'leer', 'creer',
    'ver', 'hacer', 'poner', 'saber', 'caber', 'valer', 'traer', 'caer', 'oir', 'conocer',
    'merecer', 'parecer', 'deber', 'querer', 'poder', 'tener',
    
    // Verbos regulares - IR (alta frecuencia)
    'escribir', 'recibir', 'decidir', 'abrir', 'cubrir', 'descubrir', 'sufrir', 'subir', 'partir',
    'dormir', 'morir', 'sentir', 'pedir', 'servir', 'seguir', 'conseguir', 'repetir', 'medir', 'reír',
    'sonreír', 'freír', 'elegir', 'corregir', 'dirigir', 'exigir', 'distinguir', 'extinguir', 'construir',
    'destruir', 'incluir', 'concluir', 'excluir', 'contribuir', 'distribuir', 'atribuir', 'retribuir',
    
    // Verbos irregulares (alta frecuencia)
    'ser', 'estar', 'tener', 'hacer', 'ir', 'venir', 'decir', 'poder', 'saber', 'dar',
    'ver', 'poner', 'salir', 'traer', 'caer', 'oir', 'conocer', 'querer', 'llegar', 'pasar',
    'deber', 'parecer', 'quedar', 'hablar', 'llevar', 'dejar', 'seguir', 'encontrar', 'llamar',
    'pensar', 'vivir', 'sentir', 'volver', 'tomar', 'tratar', 'contar', 'esperar', 'buscar',
    'existir', 'entrar', 'trabajar', 'escribir', 'perder', 'producir', 'ocurrir', 'entender',
    'pedir', 'recordar', 'terminar', 'permitir', 'aparecer', 'conseguir', 'comenzar', 'servir',
    'sacar', 'necesitar', 'mantener', 'resultar', 'leer', 'cambiar', 'presentar', 'crear',
    'abrir', 'considerar', 'oír', 'acabar', 'convertir', 'ganar', 'formar', 'partir', 'morir',
    'aceptar', 'realizar', 'suponer', 'comprender', 'lograr', 'explicar', 'aparecer', 'creer',
    'sacar', 'actuar', 'ocurrir', 'indicar', 'responder', 'obtener', 'corresponder', 'depender',
    'recibir', 'mantener', 'situar', 'constituir', 'representar', 'incluir', 'continuar',
    'sufrir', 'reducir', 'evitar', 'impedir', 'expresar', 'comprobar', 'acabar', 'acompañar',
    'describir', 'existir', 'permitir', 'considerar', 'obtener', 'conseguir', 'producir',
    'establecer', 'presentar', 'comprender', 'lograr', 'explicar', 'creer', 'actuar', 'indicar',
    'responder', 'corresponder', 'depender', 'recibir', 'situar', 'constituir', 'representar',
    'incluir', 'continuar', 'sufrir', 'reducir', 'evitar', 'impedir', 'expresar', 'comprobar',
    'acompañar', 'describir', 'establecer'
  ],
  
  actionPlan: {
    immediate: [
      '1. Agregar al menos 100 verbos regulares e irregulares',
      '2. Asegurar que cada verbo tenga todas las formas necesarias (50-60 formas por verbo)',
      '3. Priorizar verbos de alta frecuencia para cada nivel MCER',
      '4. Verificar que cada combinación tenga mínimo 40 verbos',
      '5. Probar todas las combinaciones antes de lanzar'
    ],
    shortTerm: [
      '1. Crear un sistema automatizado para generar formas verbales',
      '2. Implementar validación de cobertura por categoría',
      '3. Agregar verbos específicos para cada nivel MCER',
      '4. Optimizar el sistema de filtrado para mejor rendimiento'
    ],
    longTerm: [
      '1. Expandir a 500+ verbos para cobertura completa',
      '2. Agregar verbos especializados por región/dialecto',
      '3. Implementar sistema de verbos personalizados',
      '4. Crear base de datos de verbos con conjugaciones completas'
    ]
  },
  
  recommendations: {
    critical: [
      '🚨 CRÍTICO: Agregar inmediatamente al menos 100 verbos faltantes',
      '🚨 CRÍTICO: Asegurar que cada categoría tenga mínimo 40 verbos',
      '🚨 CRÍTICO: Verificar que no haya errores de "verbos insuficientes"',
      '🚨 CRÍTICO: Probar todas las combinaciones antes del lanzamiento'
    ],
    important: [
      '📋 IMPORTANTE: Crear un sistema de monitoreo de disponibilidad de verbos',
      '📋 IMPORTANTE: Implementar alertas cuando una categoría tenga menos de 40 verbos',
      '📋 IMPORTANTE: Documentar todos los verbos agregados',
      '📋 IMPORTANTE: Mantener consistencia en las conjugaciones'
    ],
    niceToHave: [
      '✨ NICE TO HAVE: Agregar verbos especializados por nivel',
      '✨ NICE TO HAVE: Implementar verbos con conjugaciones regionales',
      '✨ NICE TO HAVE: Crear sistema de verbos personalizados',
      '✨ NICE TO HAVE: Agregar verbos técnicos y académicos'
    ]
  },
  
  estimatedEffort: {
    immediate: '2-3 días de trabajo intensivo',
    shortTerm: '1-2 semanas',
    longTerm: '1-2 meses'
  }
}

// Función para generar el reporte en consola
export function generateVerbReport() {
  console.log('📊 REPORTE DE DISPONIBILIDAD DE VERBOS')
  console.log('='.repeat(60))
  
  console.log(`\n📈 RESUMEN:`)
  console.log(`- Verbos necesarios: ${verbAvailabilityReport.summary.totalVerbsNeeded}`)
  console.log(`- Verbos disponibles: ${verbAvailabilityReport.summary.currentVerbsAvailable}`)
  console.log(`- Verbos faltantes: ${verbAvailabilityReport.summary.missingVerbs}`)
  console.log(`- Formas estimadas: ${verbAvailabilityReport.summary.estimatedFormsNeeded}`)
  console.log(`- Categorías a cubrir: ${verbAvailabilityReport.summary.categoriesToCover}`)
  
  console.log(`\n🚨 ESTADO ACTUAL:`)
  Object.entries(verbAvailabilityReport.currentStatus).forEach(([level, moods]) => {
    console.log(`\n${level}:`)
    Object.entries(moods).forEach(([mood, tenses]) => {
      Object.entries(tenses).forEach(([tense, status]) => {
        console.log(`  ${mood} ${tense}: ${status}`)
      })
    })
  })
  
  console.log(`\n🎯 ACCIONES INMEDIATAS:`)
  verbAvailabilityReport.actionPlan.immediate.forEach(action => {
    console.log(`- ${action}`)
  })
  
  console.log(`\n🚨 RECOMENDACIONES CRÍTICAS:`)
  verbAvailabilityReport.recommendations.critical.forEach(rec => {
    console.log(rec)
  })
  
  console.log(`\n⏱️  ESFUERZO ESTIMADO:`)
  console.log(`- Inmediato: ${verbAvailabilityReport.estimatedEffort.immediate}`)
  console.log(`- Corto plazo: ${verbAvailabilityReport.estimatedEffort.shortTerm}`)
  console.log(`- Largo plazo: ${verbAvailabilityReport.estimatedEffort.longTerm}`)
  
  console.log('\n' + '='.repeat(60))
  console.log('🎯 CONCLUSIÓN: Se necesita trabajo inmediato para agregar verbos')
  console.log('y asegurar que todas las categorías tengan al menos 40 verbos.')
  console.log('='.repeat(60))
}

// Exportar para uso en otros archivos
export default verbAvailabilityReport 
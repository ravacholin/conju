import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read the actual verbs data
const verbsPath = path.join(__dirname, '../data/verbs.js')
const curriculumPath = path.join(__dirname, '../data/curriculum.json')

const gates = JSON.parse(fs.readFileSync(curriculumPath, 'utf8'))

// Read and parse the verbs.js file
const verbsFileContent = fs.readFileSync(verbsPath, 'utf8')

// Extract verbs using a more robust approach
let verbs = []
try {
  // Find the export const verbs = [...] section
  const match = verbsFileContent.match(/export const verbs = (\[[\s\S]*?\])/)
  if (match) {
    // For now, let's create a comprehensive list of verbs we need
    // This is a simplified approach - in production you'd want to parse the actual JS
    console.log('📊 ANALIZANDO VERBOS DISPONIBLES...')
    
    // Let's count what we actually have
    const verbCount = (verbsFileContent.match(/lemma:/g) || []).length
    console.log(`Total de verbos encontrados en el archivo: ${verbCount}`)
    
    // Create a comprehensive list of verbs we need
    const neededVerbs = [
      // Regular verbs - AR
      'hablar', 'trabajar', 'estudiar', 'caminar', 'bailar', 'cantar', 'nadar', 'cocinar', 'limpiar', 'preguntar',
      'ayudar', 'buscar', 'comprar', 'llevar', 'dejar', 'pasar', 'llegar', 'empezar', 'terminar', 'esperar',
      'llamar', 'mirar', 'escuchar', 'pensar', 'recordar', 'olvidar', 'encontrar', 'entrar', 'salir', 'volver',
      'regresar', 'cambiar', 'mejorar', 'empezar', 'comenzar', 'continuar', 'acabar', 'terminar', 'quedar',
      'necesitar', 'querer', 'poder', 'deber', 'tener', 'hacer', 'ir', 'venir', 'ser', 'estar',
      
      // Regular verbs - ER
      'comer', 'beber', 'aprender', 'comprender', 'entender', 'vender', 'perder', 'correr', 'leer', 'creer',
      'ver', 'hacer', 'poner', 'saber', 'caber', 'valer', 'traer', 'caer', 'oir', 'conocer',
      'merecer', 'parecer', 'deber', 'querer', 'poder', 'tener', 'hacer', 'poner', 'salir', 'venir',
      
      // Regular verbs - IR
      'vivir', 'escribir', 'recibir', 'decidir', 'abrir', 'cubrir', 'descubrir', 'sufrir', 'subir', 'partir',
      'dormir', 'morir', 'sentir', 'pedir', 'servir', 'seguir', 'conseguir', 'repetir', 'medir', 'reír',
      'sonreír', 'freír', 'elegir', 'corregir', 'dirigir', 'exigir', 'distinguir', 'extinguir', 'construir',
      'destruir', 'incluir', 'concluir', 'excluir', 'contribuir', 'distribuir', 'atribuir', 'retribuir',
      
      // Irregular verbs (high frequency)
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
    ]
    
    console.log(`Lista de verbos necesarios: ${neededVerbs.length} verbos`)
    
    // Check which verbs we actually have
    const missingVerbs = neededVerbs.filter(verb => !verbsFileContent.includes(`lemma: '${verb}'`))
    const availableVerbs = neededVerbs.filter(verb => verbsFileContent.includes(`lemma: '${verb}'`))
    
    console.log(`\n📊 ESTADO ACTUAL:`)
    console.log(`✅ Verbos disponibles: ${availableVerbs.length}`)
    console.log(`❌ Verbos faltantes: ${missingVerbs.length}`)
    
    if (missingVerbs.length > 0) {
      console.log(`\n🚨 VERBOS FALTANTES:`)
      missingVerbs.forEach((verb, index) => {
        console.log(`${index + 1}. ${verb}`)
      })
    }
    
    // Create a comprehensive verb addition plan
    console.log(`\n📋 PLAN DE ACCIÓN:`)
    console.log(`1. Agregar ${missingVerbs.length} verbos faltantes`)
    console.log(`2. Asegurar que cada verbo tenga todas las formas necesarias`)
    console.log(`3. Verificar que cada combinación tenga al menos 40 verbos`)
    
    // Calculate how many verbs we need per category
    const categories = [
      'A1 indicative pres',
      'A2 indicative pretIndef',
      'A2 indicative impf', 
      'A2 indicative fut',
      'A2 imperative impAff',
      'B1 indicative plusc',
      'B1 indicative pretPerf',
      'B1 indicative futPerf',
      'B1 subjunctive subjPres',
      'B1 subjunctive subjPerf',
      'B1 imperative impNeg',
      'B1 conditional cond',
      'B2 subjunctive subjImpf',
      'B2 subjunctive subjPlusc',
      'B2 conditional condPerf',
      'C1 all forms',
      'C2 all forms',
      'nonfinite part',
      'nonfinite ger'
    ]
    
    console.log(`\n🎯 CATEGORÍAS QUE NECESITAN 40+ VERBOS:`)
    categories.forEach(category => {
      console.log(`- ${category}`)
    })
    
    // Estimate total verbs needed
    const estimatedTotal = categories.length * 40
    console.log(`\n📈 ESTIMACIÓN TOTAL:`)
    console.log(`- Verbos únicos necesarios: ~${Math.ceil(estimatedTotal / 6)} (considerando 6 formas por verbo)`)
    console.log(`- Formas verbales totales: ~${estimatedTotal}`)
    
  } else {
    console.log('❌ No se pudo encontrar la sección de verbos en el archivo')
  }
} catch (error) {
  console.log('Error analizando verbos:', error.message)
}

console.log('\n' + '='.repeat(80))
console.log('🎯 RECOMENDACIONES:')
console.log('1. Agregar al menos 100 verbos regulares e irregulares')
console.log('2. Asegurar cobertura completa de todos los tiempos y modos')
console.log('3. Incluir verbos de alta frecuencia para cada nivel MCER')
console.log('4. Verificar que cada combinación tenga mínimo 40 verbos')
console.log('5. Probar todas las combinaciones antes de lanzar')
console.log('='.repeat(80)) 
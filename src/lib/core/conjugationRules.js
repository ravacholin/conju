// Módulo centralizado de reglas de conjugación española
// Consolidación de lógica duplicada de grader.js y generator.js

// Import and re-export from centralized accent utils
import { normalize } from '../utils/accentUtils.js'
export { normalize }

/**
 * Verifica si una forma verbal es regular para un mood/tense/person específico
 * @param {string} lemma - Infinitivo del verbo
 * @param {string} mood - Modo verbal (indicative, subjunctive, imperative, conditional, nonfinite)
 * @param {string} tense - Tiempo verbal
 * @param {string} person - Persona gramatical
 * @param {string} value - Forma conjugada a verificar
 * @returns {boolean} - true si la forma es regular, false si es irregular
 */
export function isRegularFormForMood(lemma, mood, tense, person, value) {
  // Validación de parámetros - si value es undefined/null, no es una forma válida para evaluar
  if (!lemma || !value || typeof lemma !== 'string' || typeof value !== 'string') {
    // Silenciar warning para forms con value undefined (común en base de datos)
    if (value === undefined) {
      return false // No considerar como regular para evitar filtrado incorrecto
    }
    console.warn('️ isRegularFormForMood called with invalid params:', { lemma, mood, tense, person, value })
    return false
  }
  
  const normalizedLemma = normalize(lemma)
  const normalizedValue = normalize(value)

  // Helper: detectar participio regular en formas perifrásticas
  const isRegularPerfectWithParticiple = () => {
    const tokens = normalizedValue.trim().split(/\s+/)
    const part = tokens[tokens.length - 1] || ''
    if (normalizedLemma.endsWith('ar')) {
      return part === normalizedLemma.replace(/ar$/, 'ado')
    }
    if (normalizedLemma.endsWith('er')) {
      return part === normalizedLemma.replace(/er$/, 'ido')
    }
    if (normalizedLemma.endsWith('ir')) {
      return part === normalizedLemma.replace(/ir$/, 'ido')
    }
    return false
  }
  
  // Patrones regulares para verbos -ar
  if (lemma.endsWith('ar')) {
    if (mood === 'indicative') {
      if (tense === 'pres') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace(/ar$/, 'o'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/ar$/, 'as'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/ar$/, 'ás'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace(/ar$/, 'a'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace(/ar$/, 'amos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/ar$/, 'áis'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace(/ar$/, 'an'))) return true
      }
      if (tense === 'pretIndef') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace(/ar$/, 'é'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/ar$/, 'aste'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/ar$/, 'aste'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace(/ar$/, 'ó'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace(/ar$/, 'amos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/ar$/, 'asteis'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace(/ar$/, 'aron'))) return true
      }
      if (tense === 'impf') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace(/ar$/, 'aba'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/ar$/, 'abas'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/ar$/, 'abas'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace(/ar$/, 'aba'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace(/ar$/, 'ábamos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/ar$/, 'abais'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace(/ar$/, 'aban'))) return true
      }
      if (tense === 'fut') {
        if (person === '1s' && normalizedValue === normalize(lemma + 'é')) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma + 'ás')) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma + 'ás')) return true
        if (person === '3s' && normalizedValue === normalize(lemma + 'á')) return true
        if (person === '1p' && normalizedValue === normalize(lemma + 'emos')) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma + 'éis')) return true
        if (person === '3p' && normalizedValue === normalize(lemma + 'án')) return true
      }
      if (tense === 'pretPerf' || tense === 'plusc' || tense === 'futPerf') {
        return isRegularPerfectWithParticiple()
      }
    }
    
    if (mood === 'subjunctive') {
      if (tense === 'subjPres') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace(/ar$/, 'e'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/ar$/, 'es'))) return true
        // Subjuntivo: vos = tú (misma forma, sin acento)
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/ar$/, 'es'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace(/ar$/, 'e'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace(/ar$/, 'emos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/ar$/, 'éis'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace(/ar$/, 'en'))) return true
      }
      if (tense === 'subjImpf') {
        // FORMAS EN -RA (SIEMPRE CORRECTAS)
        if (person === '1s' && normalizedValue === normalize(lemma.replace(/ar$/, 'ara'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/ar$/, 'aras'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/ar$/, 'aras'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace(/ar$/, 'ara'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace(/ar$/, 'áramos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/ar$/, 'arais'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace(/ar$/, 'aran'))) return true
        // FORMAS EN -SE (TAMBIÉN SIEMPRE CORRECTAS)
        if (person === '1s' && normalizedValue === normalize(lemma.replace(/ar$/, 'ase'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/ar$/, 'ases'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/ar$/, 'ases'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace(/ar$/, 'ase'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace(/ar$/, 'ásemos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/ar$/, 'aseis'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace(/ar$/, 'asen'))) return true
      }
      if (tense === 'subjPerf' || tense === 'subjPlusc') {
        return isRegularPerfectWithParticiple()
      }
    }
    
    if (mood === 'imperative') {
      if (tense === 'impAff') {
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/ar$/, 'a'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/ar$/, 'á'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace(/ar$/, 'e'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace(/ar$/, 'emos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/ar$/, 'ad'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace(/ar$/, 'en'))) return true
      }
      if (tense === 'impNeg') {
        if (person === '2s_tu' && normalizedValue === normalize('no ' + lemma.replace(/ar$/, 'es'))) return true
        // Subjuntivo/imperativo negativo: vos = tú
        if (person === '2s_vos' && normalizedValue === normalize('no ' + lemma.replace(/ar$/, 'es'))) return true
        if (person === '3s' && normalizedValue === normalize('no ' + lemma.replace(/ar$/, 'e'))) return true
        if (person === '1p' && normalizedValue === normalize('no ' + lemma.replace(/ar$/, 'emos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize('no ' + lemma.replace(/ar$/, 'éis'))) return true
        if (person === '3p' && normalizedValue === normalize('no ' + lemma.replace(/ar$/, 'en'))) return true
      }
    }
    
    if (mood === 'conditional') {
      if (tense === 'cond') {
        if (person === '1s' && normalizedValue === normalize(lemma + 'ía')) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma + 'ías')) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma + 'ías')) return true
        if (person === '3s' && normalizedValue === normalize(lemma + 'ía')) return true
        if (person === '1p' && normalizedValue === normalize(lemma + 'íamos')) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma + 'íais')) return true
        if (person === '3p' && normalizedValue === normalize(lemma + 'ían')) return true
      }
      if (tense === 'condPerf') {
        return isRegularPerfectWithParticiple()
      }
    }
  }
  
  // Patrones regulares para verbos -er
  else if (lemma.endsWith('er')) {
    if (mood === 'indicative') {
      if (tense === 'pres') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace(/er$/, 'o'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/er$/, 'es'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/er$/, 'és'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace(/er$/, 'e'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace(/er$/, 'emos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/er$/, 'éis'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace(/er$/, 'en'))) return true
      }
      if (tense === 'pretIndef') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace(/er$/, 'í'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/er$/, 'iste'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/er$/, 'iste'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace(/er$/, 'ió'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace(/er$/, 'imos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/er$/, 'isteis'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace(/er$/, 'ieron'))) return true
      }
      if (tense === 'impf') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace(/er$/, 'ía'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/er$/, 'ías'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/er$/, 'ías'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace(/er$/, 'ía'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace(/er$/, 'íamos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/er$/, 'íais'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace(/er$/, 'ían'))) return true
      }
      if (tense === 'fut') {
        if (person === '1s' && normalizedValue === normalize(lemma + 'é')) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma + 'ás')) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma + 'ás')) return true
        if (person === '3s' && normalizedValue === normalize(lemma + 'á')) return true
        if (person === '1p' && normalizedValue === normalize(lemma + 'emos')) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma + 'éis')) return true
        if (person === '3p' && normalizedValue === normalize(lemma + 'án')) return true
      }
      if (tense === 'pretPerf' || tense === 'plusc' || tense === 'futPerf') {
        return isRegularPerfectWithParticiple()
      }
    }
    
    if (mood === 'subjunctive') {
      if (tense === 'subjPres') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace(/er$/, 'a'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/er$/, 'as'))) return true
        // Subjuntivo: vos = tú
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/er$/, 'as'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace(/er$/, 'a'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace(/er$/, 'amos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/er$/, 'áis'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace(/er$/, 'an'))) return true
      }
      if (tense === 'subjImpf') {
        // FORMAS EN -RA (SIEMPRE CORRECTAS)
        if (person === '1s' && normalizedValue === normalize(lemma.replace(/er$/, 'iera'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/er$/, 'ieras'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/er$/, 'ieras'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace(/er$/, 'iera'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace(/er$/, 'iéramos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/er$/, 'ierais'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace(/er$/, 'ieran'))) return true
        // FORMAS EN -SE (TAMBIÉN SIEMPRE CORRECTAS)
        if (person === '1s' && normalizedValue === normalize(lemma.replace(/er$/, 'iese'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/er$/, 'ieses'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/er$/, 'ieses'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace(/er$/, 'iese'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace(/er$/, 'iésemos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/er$/, 'ieseis'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace(/er$/, 'iesen'))) return true
      }
      if (tense === 'subjPerf' || tense === 'subjPlusc') {
        return isRegularPerfectWithParticiple()
      }
    }
    
    if (mood === 'imperative') {
      if (tense === 'impAff') {
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/er$/, 'e'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/er$/, 'é'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace(/er$/, 'a'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace(/er$/, 'amos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/er$/, 'ed'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace(/er$/, 'an'))) return true
      }
      if (tense === 'impNeg') {
        if (person === '2s_tu' && normalizedValue === normalize('no ' + lemma.replace(/er$/, 'as'))) return true
        // Imperativo negativo: vos = tú
        if (person === '2s_vos' && normalizedValue === normalize('no ' + lemma.replace(/er$/, 'as'))) return true
        if (person === '3s' && normalizedValue === normalize('no ' + lemma.replace(/er$/, 'a'))) return true
        if (person === '1p' && normalizedValue === normalize('no ' + lemma.replace(/er$/, 'amos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize('no ' + lemma.replace(/er$/, 'áis'))) return true
        if (person === '3p' && normalizedValue === normalize('no ' + lemma.replace(/er$/, 'an'))) return true
      }
    }
    
    if (mood === 'conditional') {
      if (tense === 'cond') {
        if (person === '1s' && normalizedValue === normalize(lemma + 'ía')) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma + 'ías')) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma + 'ías')) return true
        if (person === '3s' && normalizedValue === normalize(lemma + 'ía')) return true
        if (person === '1p' && normalizedValue === normalize(lemma + 'íamos')) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma + 'íais')) return true
        if (person === '3p' && normalizedValue === normalize(lemma + 'ían')) return true
      }
      if (tense === 'condPerf') {
        return isRegularPerfectWithParticiple()
      }
    }
  }
  
  // Patrones regulares para verbos -ir
  else if (lemma.endsWith('ir')) {
    if (mood === 'indicative') {
      if (tense === 'pres') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace(/ir$/, 'o'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/ir$/, 'es'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/ir$/, 'ís'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace(/ir$/, 'e'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace(/ir$/, 'imos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/ir$/, 'ís'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace(/ir$/, 'en'))) return true
      }
      if (tense === 'pretIndef') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace(/ir$/, 'í'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/ir$/, 'iste'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/ir$/, 'iste'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace(/ir$/, 'ió'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace(/ir$/, 'imos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/ir$/, 'isteis'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace(/ir$/, 'ieron'))) return true
      }
      if (tense === 'impf') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace(/ir$/, 'ía'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/ir$/, 'ías'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/ir$/, 'ías'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace(/ir$/, 'ía'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace(/ir$/, 'íamos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/ir$/, 'íais'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace(/ir$/, 'ían'))) return true
      }
      if (tense === 'fut') {
        if (person === '1s' && normalizedValue === normalize(lemma + 'é')) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma + 'ás')) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma + 'ás')) return true
        if (person === '3s' && normalizedValue === normalize(lemma + 'á')) return true
        if (person === '1p' && normalizedValue === normalize(lemma + 'emos')) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma + 'éis')) return true
        if (person === '3p' && normalizedValue === normalize(lemma + 'án')) return true
      }
      if (tense === 'pretPerf' || tense === 'plusc' || tense === 'futPerf') {
        return isRegularPerfectWithParticiple()
      }
    }
    
    if (mood === 'subjunctive') {
      if (tense === 'subjPres') {
        if (person === '1s' && normalizedValue === normalize(lemma.replace(/ir$/, 'a'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/ir$/, 'as'))) return true
        // Subjuntivo: vos = tú
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/ir$/, 'as'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace(/ir$/, 'a'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace(/ir$/, 'amos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/ir$/, 'áis'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace(/ir$/, 'an'))) return true
      }
      if (tense === 'subjImpf') {
        // FORMAS EN -RA (SIEMPRE CORRECTAS)
        if (person === '1s' && normalizedValue === normalize(lemma.replace(/ir$/, 'iera'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/ir$/, 'ieras'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/ir$/, 'ieras'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace(/ir$/, 'iera'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace(/ir$/, 'iéramos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/ir$/, 'ierais'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace(/ir$/, 'ieran'))) return true
        // FORMAS EN -SE (TAMBIÉN SIEMPRE CORRECTAS)
        if (person === '1s' && normalizedValue === normalize(lemma.replace(/ir$/, 'iese'))) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/ir$/, 'ieses'))) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/ir$/, 'ieses'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace(/ir$/, 'iese'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace(/ir$/, 'iésemos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/ir$/, 'ieseis'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace(/ir$/, 'iesen'))) return true
      }
      if (tense === 'subjPerf' || tense === 'subjPlusc') {
        return isRegularPerfectWithParticiple()
      }
    }
    
    if (mood === 'imperative') {
      if (tense === 'impAff') {
        if (person === '2s_tu' && normalizedValue === normalize(lemma.replace(/ir$/, 'e'))) return true
        // Voseo afirmativo regular en verbos -ir termina en -í (viví), no -é
        if (person === '2s_vos' && normalizedValue === normalize(lemma.replace(/ir$/, 'í'))) return true
        if (person === '3s' && normalizedValue === normalize(lemma.replace(/ir$/, 'a'))) return true
        if (person === '1p' && normalizedValue === normalize(lemma.replace(/ir$/, 'amos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma.replace(/ir$/, 'id'))) return true
        if (person === '3p' && normalizedValue === normalize(lemma.replace(/ir$/, 'an'))) return true
      }
      if (tense === 'impNeg') {
        if (person === '2s_tu' && normalizedValue === normalize('no ' + lemma.replace(/ir$/, 'as'))) return true
        // Imperativo negativo: vos = tú
        if (person === '2s_vos' && normalizedValue === normalize('no ' + lemma.replace(/ir$/, 'as'))) return true
        if (person === '3s' && normalizedValue === normalize('no ' + lemma.replace(/ir$/, 'a'))) return true
        if (person === '1p' && normalizedValue === normalize('no ' + lemma.replace(/ir$/, 'amos'))) return true
        if (person === '2p_vosotros' && normalizedValue === normalize('no ' + lemma.replace(/ir$/, 'áis'))) return true
        if (person === '3p' && normalizedValue === normalize('no ' + lemma.replace(/ir$/, 'an'))) return true
      }
    }
    
    if (mood === 'conditional') {
      if (tense === 'cond') {
        if (person === '1s' && normalizedValue === normalize(lemma + 'ía')) return true
        if (person === '2s_tu' && normalizedValue === normalize(lemma + 'ías')) return true
        if (person === '2s_vos' && normalizedValue === normalize(lemma + 'ías')) return true
        if (person === '3s' && normalizedValue === normalize(lemma + 'ía')) return true
        if (person === '1p' && normalizedValue === normalize(lemma + 'íamos')) return true
        if (person === '2p_vosotros' && normalizedValue === normalize(lemma + 'íais')) return true
        if (person === '3p' && normalizedValue === normalize(lemma + 'ían')) return true
      }
      if (tense === 'condPerf') {
        return isRegularPerfectWithParticiple()
      }
    }
  }
  
  return false
}

/**
 * Verifica si una forma no finita (gerundio/participio) es regular
 * @param {string} lemma - Infinitivo del verbo
 * @param {string} tense - Tiempo (ger, part)
 * @param {string} value - Forma a verificar
 * @returns {boolean} - true si la forma es regular, false si es irregular
 */
export function isRegularNonfiniteForm(lemma, tense, value) {
  if (!lemma || !value || typeof lemma !== 'string' || typeof value !== 'string') {
    console.warn('️ isRegularNonfiniteForm called with invalid params:', { lemma, tense, value })
    return false
  }
  
  const normalizedValue = normalize(value)
  
  if (lemma.endsWith('ar')) {
    if (tense === 'ger' && normalizedValue === normalize(lemma.replace(/ar$/, 'ando'))) return true
    if (tense === 'part' && normalizedValue === normalize(lemma.replace(/ar$/, 'ado'))) return true
  } else if (lemma.endsWith('er')) {
    if (tense === 'ger' && normalizedValue === normalize(lemma.replace(/er$/, 'iendo'))) return true
    if (tense === 'part' && normalizedValue === normalize(lemma.replace(/er$/, 'ido'))) return true
  } else if (lemma.endsWith('ir')) {
    if (tense === 'ger' && normalizedValue === normalize(lemma.replace(/ir$/, 'iendo'))) return true
    if (tense === 'part' && normalizedValue === normalize(lemma.replace(/ir$/, 'ido'))) return true
  }
  
  return false
}

/**
 * Verifica si un verbo tiene un participio pasado irregular
 * @param {string} lemma - Infinitivo del verbo
 * @returns {boolean} - true si el verbo tiene participio irregular, false si es regular
 */


// ENHANCED IRREGULAR VERB PATTERNS 
// Handles edge cases and complex irregular verbs better
function isEnhancedIrregularForm(lemma, mood, tense, person, value) {
  const normalizedLemma = normalize(lemma)
  const normalizedValue = normalize(value)
  
  // Enhanced irregular patterns for common problematic verbs
  const irregularPatterns = {
    'pensar': {
      'indicative-pres': {
        '1s': ['pienso'], '2s_tu': ['piensas'], '3s': ['piensa'], '3p': ['piensan']
      },
      'subjunctive-subjPres': {
        '1s': ['piense'], '2s_tu': ['pienses'], '2s_vos': ['pienses'], '3s': ['piense'], '3p': ['piensen']
      }
    },
    'volver': {
      'indicative-pres': {
        '1s': ['vuelvo'], '2s_tu': ['vuelves'], '3s': ['vuelve'], '3p': ['vuelven']
      },
      'nonfinite-part': { '': ['vuelto'] }
    },
    'hacer': {
      'nonfinite-part': { '': ['hecho'] },
      'indicative-pres': { '1s': ['hago'] }
    },
    'ver': {
      'nonfinite-part': { '': ['visto'] },
      'indicative-impf': {
        '1s': ['veia'], '2s_tu': ['veias'], '2s_vos': ['veias'], '3s': ['veia'],
        '1p': ['veiamos'], '2p_vosotros': ['veiais'], '3p': ['veian']
      }
    },
    'decir': {
      'nonfinite-part': { '': ['dicho'] },
      'nonfinite-ger': { '': ['diciendo'] }
    }
  }
  
  const verbPatterns = irregularPatterns[normalizedLemma]
  if (verbPatterns) {
    const tenseKey = mood + '-' + tense
    const tenseForms = verbPatterns[tenseKey]
    if (tenseForms && tenseForms[person]) {
      return tenseForms[person].some(form => normalize(form) === normalizedValue)
    }
  }
  
  return false
}

// Enhanced main function that includes irregular patterns
function isEnhancedRegularForm(lemma, mood, tense, person, value) {
  // First check enhanced irregular patterns
  if (isEnhancedIrregularForm(lemma, mood, tense, person, value)) {
    return true // Irregular form is "regular" for this verb
  }
  
  // Fall back to original logic
  return isRegularFormForMood(lemma, mood, tense, person, value)
}

export function hasIrregularParticiple(lemma) {
  if (!lemma || typeof lemma !== 'string') {
    return false
  }
  
  // Lista de verbos con participios irregulares conocidos
  const irregularParticiples = {
    // Participios más comunes
    'abrir': 'abierto',
    'escribir': 'escrito', 
    'hacer': 'hecho',
    'poner': 'puesto',
    'ver': 'visto',
    'volver': 'vuelto',
    'romper': 'roto',
    'morir': 'muerto',
    'cubrir': 'cubierto',
    'decir': 'dicho',
    'resolver': 'resuelto',
    'devolver': 'devuelto',
    'satisfacer': 'satisfecho',
    'revolver': 'revuelto',
    'envolver': 'envuelto',
    'desenvolver': 'desenvuelto',
    
    // Compuestos de verbos irregulares
    'describir': 'descrito',
    'inscribir': 'inscrito',
    'prescribir': 'prescrito',
    'suscribir': 'suscrito',
    'transcribir': 'transcrito',
    'reescribir': 'reescrito',
    'deshacerse': 'deshecho',
    'deshacer': 'deshecho',
    'rehacer': 'rehecho',
    'contrahacer': 'contrahecho',
    'descubrir': 'descubierto',
    'encubrir': 'encubierto',
    'recubrir': 'recubierto',
    'predecir': 'predicho',
    'contradecir': 'contradicho',
    'bendecir': 'bendecido', // En realidad tiene dos: bendecido/bendito
    'maldecir': 'maldecido', // En realidad tiene dos: maldecido/maldito
    'anteponer': 'antepuesto',
    'componer': 'compuesto',
    'deponer': 'depuesto',
    'disponer': 'dispuesto',
    'exponer': 'expuesto',
    'imponer': 'impuesto',
    'interponer': 'interpuesto',
    'oponer': 'opuesto',
    'posponer': 'pospuesto',
    'predisponer': 'predispuesto',
    'presuponer': 'presupuesto',
    'proponer': 'propuesto',
    'reponer': 'repuesto',
    'sobreponer': 'sobrepuesto',
    'suponer': 'supuesto',
    'yuxtaponer': 'yuxtapuesto',
    'entrever': 'entrevisto',
    'prever': 'previsto',
    'rever': 'revisto',
    'antever': 'antevisto'
  }
  
  return Object.prototype.hasOwnProperty.call(irregularParticiples, lemma)
}
export { isEnhancedRegularForm }

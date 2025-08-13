#!/usr/bin/env node

// Herramienta para generar automáticamente conjugaciones de verbos irregulares
console.log('🔧 Generador Automático de Conjugaciones de Verbos\n')

// Plantillas de conjugación por patrón
const verbTemplates = {
  'E_I_IR': (lemma) => {
    const stem = lemma.slice(0, -2) // quitar -ir
    const eStem = stem.replace(/e([^aeiou]*)$/, 'i$1') // e→i en la última e
    
    return {
      id: lemma,
      lemma: lemma,
      type: "irregular",
      paradigms: [{
        regionTags: ["rioplatense", "la_general", "peninsular"],
        forms: [
          // Presente
          { mood: "indicative", tense: "pres", person: "1s", value: `${eStem}o`, rules: ["STEM_E_I"] },
          { mood: "indicative", tense: "pres", person: "2s_tu", value: `${eStem}es`, rules: ["STEM_E_I"], accepts: { vos: `${stem}ís` } },
          { mood: "indicative", tense: "pres", person: "2s_vos", value: `${stem}ís`, accepts: { tu: `${eStem}es` } },
          { mood: "indicative", tense: "pres", person: "3s", value: `${eStem}e`, rules: ["STEM_E_I"] },
          { mood: "indicative", tense: "pres", person: "1p", value: `${stem}imos` },
          { mood: "indicative", tense: "pres", person: "2p_vosotros", value: `${stem}ís` },
          { mood: "indicative", tense: "pres", person: "3p", value: `${eStem}en`, rules: ["STEM_E_I"] },
          
          // Pretérito indefinido
          { mood: "indicative", tense: "pretIndef", person: "1s", value: `${stem}í` },
          { mood: "indicative", tense: "pretIndef", person: "2s_tu", value: `${stem}iste` },
          { mood: "indicative", tense: "pretIndef", person: "2s_vos", value: `${stem}iste` },
          { mood: "indicative", tense: "pretIndef", person: "3s", value: `${eStem}ió`, rules: ["STEM_E_I"] },
          { mood: "indicative", tense: "pretIndef", person: "1p", value: `${stem}imos` },
          { mood: "indicative", tense: "pretIndef", person: "2p_vosotros", value: `${stem}isteis` },
          { mood: "indicative", tense: "pretIndef", person: "3p", value: `${eStem}ieron`, rules: ["STEM_E_I"] },
          
          // No finitas
          { mood: "nonfinite", tense: "inf", person: "inv", value: lemma },
          { mood: "nonfinite", tense: "ger", person: "inv", value: `${eStem}iendo`, rules: ["STEM_E_I"] },
          { mood: "nonfinite", tense: "part", person: "inv", value: `${stem}ido` }
        ]
      }]
    }
  },
  
  'O_U_IR': (lemma) => {
    const stem = lemma.slice(0, -2) // quitar -ir
    const oStem = stem.replace(/o([^aeiou]*)$/, 'ue$1') // o→ue diptongación
    const uStem = stem.replace(/o([^aeiou]*)$/, 'u$1') // o→u en pretérito
    
    return {
      id: lemma,
      lemma: lemma,
      type: "irregular", 
      paradigms: [{
        regionTags: ["rioplatense", "la_general", "peninsular"],
        forms: [
          // Presente
          { mood: "indicative", tense: "pres", person: "1s", value: `${oStem}o`, rules: ["DIPHT_O_UE"] },
          { mood: "indicative", tense: "pres", person: "2s_tu", value: `${oStem}es`, rules: ["DIPHT_O_UE"], accepts: { vos: `${stem}ís` } },
          { mood: "indicative", tense: "pres", person: "2s_vos", value: `${stem}ís`, accepts: { tu: `${oStem}es` } },
          { mood: "indicative", tense: "pres", person: "3s", value: `${oStem}e`, rules: ["DIPHT_O_UE"] },
          { mood: "indicative", tense: "pres", person: "1p", value: `${stem}imos` },
          { mood: "indicative", tense: "pres", person: "2p_vosotros", value: `${stem}ís` },
          { mood: "indicative", tense: "pres", person: "3p", value: `${oStem}en`, rules: ["DIPHT_O_UE"] },
          
          // Pretérito indefinido
          { mood: "indicative", tense: "pretIndef", person: "1s", value: `${stem}í` },
          { mood: "indicative", tense: "pretIndef", person: "2s_tu", value: `${stem}iste` },
          { mood: "indicative", tense: "pretIndef", person: "2s_vos", value: `${stem}iste` },
          { mood: "indicative", tense: "pretIndef", person: "3s", value: `${uStem}ió`, rules: ["STEM_O_U"] },
          { mood: "indicative", tense: "pretIndef", person: "1p", value: `${stem}imos` },
          { mood: "indicative", tense: "pretIndef", person: "2p_vosotros", value: `${stem}isteis` },
          { mood: "indicative", tense: "pretIndef", person: "3p", value: `${uStem}ieron`, rules: ["STEM_O_U"] },
          
          // No finitas
          { mood: "nonfinite", tense: "inf", person: "inv", value: lemma },
          { mood: "nonfinite", tense: "ger", person: "inv", value: `${uStem}iendo`, rules: ["STEM_O_U"] },
          { mood: "nonfinite", tense: "part", person: "inv", value: `${stem}ido` }
        ]
      }]
    }
  },
  
  'UIR_HIATUS': (lemma) => {
    const stem = lemma.slice(0, -2) // quitar -ir
    
    return {
      id: lemma,
      lemma: lemma,
      type: "irregular",
      paradigms: [{
        regionTags: ["rioplatense", "la_general", "peninsular"],
        forms: [
          // Presente
          { mood: "indicative", tense: "pres", person: "1s", value: `${stem}yo`, rules: ["UIR_Y"] },
          { mood: "indicative", tense: "pres", person: "2s_tu", value: `${stem}yes`, rules: ["UIR_Y"], accepts: { vos: `${stem}ís` } },
          { mood: "indicative", tense: "pres", person: "2s_vos", value: `${stem}ís`, accepts: { tu: `${stem}yes` } },
          { mood: "indicative", tense: "pres", person: "3s", value: `${stem}ye`, rules: ["UIR_Y"] },
          { mood: "indicative", tense: "pres", person: "1p", value: `${stem}imos` },
          { mood: "indicative", tense: "pres", person: "2p_vosotros", value: `${stem}ís` },
          { mood: "indicative", tense: "pres", person: "3p", value: `${stem}yen`, rules: ["UIR_Y"] },
          
          // Pretérito indefinido
          { mood: "indicative", tense: "pretIndef", person: "1s", value: `${stem}í` },
          { mood: "indicative", tense: "pretIndef", person: "2s_tu", value: `${stem}iste` },
          { mood: "indicative", tense: "pretIndef", person: "2s_vos", value: `${stem}iste` },
          { mood: "indicative", tense: "pretIndef", person: "3s", value: `${stem}yó`, rules: ["HIATUS_Y"] },
          { mood: "indicative", tense: "pretIndef", person: "1p", value: `${stem}imos` },
          { mood: "indicative", tense: "pretIndef", person: "2p_vosotros", value: `${stem}isteis` },
          { mood: "indicative", tense: "pretIndef", person: "3p", value: `${stem}yeron`, rules: ["HIATUS_Y"] },
          
          // No finitas
          { mood: "nonfinite", tense: "inf", person: "inv", value: lemma },
          { mood: "nonfinite", tense: "ger", person: "inv", value: `${stem}yendo`, rules: ["UIR_Y"] },
          { mood: "nonfinite", tense: "part", person: "inv", value: `${stem}ido` }
        ]
      }]
    }
  },
  
  'ER_HIATUS': (lemma) => {
    const stem = lemma.slice(0, -2) // quitar -er
    
    return {
      id: lemma,
      lemma: lemma,
      type: "irregular",
      paradigms: [{
        regionTags: ["rioplatense", "la_general", "peninsular"],
        forms: [
          // Presente
          { mood: "indicative", tense: "pres", person: "1s", value: `${stem}o` },
          { mood: "indicative", tense: "pres", person: "2s_tu", value: `${stem}es`, accepts: { vos: `${stem}és` } },
          { mood: "indicative", tense: "pres", person: "2s_vos", value: `${stem}és`, accepts: { tu: `${stem}es` } },
          { mood: "indicative", tense: "pres", person: "3s", value: `${stem}e` },
          { mood: "indicative", tense: "pres", person: "1p", value: `${stem}emos` },
          { mood: "indicative", tense: "pres", person: "2p_vosotros", value: `${stem}éis` },
          { mood: "indicative", tense: "pres", person: "3p", value: `${stem}en` },
          
          // Pretérito indefinido
          { mood: "indicative", tense: "pretIndef", person: "1s", value: `${stem}í` },
          { mood: "indicative", tense: "pretIndef", person: "2s_tu", value: `${stem}íste` },
          { mood: "indicative", tense: "pretIndef", person: "2s_vos", value: `${stem}íste` },
          { mood: "indicative", tense: "pretIndef", person: "3s", value: `${stem}yó`, rules: ["HIATUS_Y"] },
          { mood: "indicative", tense: "pretIndef", person: "1p", value: `${stem}ímos` },
          { mood: "indicative", tense: "pretIndef", person: "2p_vosotros", value: `${stem}ísteis` },
          { mood: "indicative", tense: "pretIndef", person: "3p", value: `${stem}yeron`, rules: ["HIATUS_Y"] },
          
          // No finitas
          { mood: "nonfinite", tense: "inf", person: "inv", value: lemma },
          { mood: "nonfinite", tense: "ger", person: "inv", value: `${stem}yendo`, rules: ["HIATUS_Y"] },
          { mood: "nonfinite", tense: "part", person: "inv", value: `${stem}ído` }
        ]
      }]
    }
  }
}

// Verbos a generar por patrón
const verbsToGenerate = {
  'E_I_IR': ['repetir', 'sentir', 'preferir', 'mentir', 'competir', 'medir', 'vestir'],
  'O_U_IR': ['morir'],
  'UIR_HIATUS': ['huir', 'incluir', 'concluir', 'contribuir', 'distribuir'],
  'ER_HIATUS': [] // creer ya lo hicimos manualmente
}

console.log('🏭 Generando conjugaciones automáticamente...\n')

for (const [pattern, verbs] of Object.entries(verbsToGenerate)) {
  if (verbs.length === 0) continue
  
  console.log(`📝 Patrón ${pattern}:`)
  
  for (const verb of verbs) {
    const template = verbTemplates[pattern]
    if (template) {
      const conjugation = template(verb)
      console.log(`   ✅ ${verb} - ${conjugation.paradigms[0].forms.length} formas generadas`)
      
      // Aquí podríamos escribir las conjugaciones a un archivo JSON
      // Por ahora solo las mostramos como ejemplo
      if (verb === verbs[0]) {
        console.log(`      Ejemplo 3ª persona singular: ${verb} → ${conjugation.paradigms[0].forms.find(f => f.person === '3s' && f.tense === 'pretIndef')?.value}`)
        console.log(`      Ejemplo 3ª persona plural: ${verb} → ${conjugation.paradigms[0].forms.find(f => f.person === '3p' && f.tense === 'pretIndef')?.value}`)
      }
    }
  }
  console.log()
}

// Generar un ejemplo completo para mostrar el formato
console.log('📄 Ejemplo de conjugación generada (repetir):\n')
const repetirExample = verbTemplates['E_I_IR']('repetir')
console.log(JSON.stringify(repetirExample, null, 2))

console.log('\n🎯 Próximos pasos:')
console.log('1. Revisar las conjugaciones generadas')
console.log('2. Agregar manualmente al archivo verbs.js')
console.log('3. Probar que funcionan correctamente')
console.log('4. Continuar con más verbos según sea necesario')
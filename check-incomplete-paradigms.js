#!/usr/bin/env node

// Check which verbs have incomplete subjunctive present paradigms

console.log('🔍 CHECKING INCOMPLETE SUBJUNCTIVE PARADIGMS')
console.log('==============================================\n')

async function checkIncompleteParadigms() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    
    console.log(`📚 Checking ${verbs.length} verbs...\n`)
    
    const expectedPersons = ['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']
    const incompleteVerbs = []
    const missingVerbs = []
    const completeVerbs = []
    
    for (const verb of verbs) {
      const subjForms = []
      
      verb.paradigms.forEach(paradigm => {
        paradigm.forms.forEach(form => {
          if (form.mood === 'subjunctive' && form.tense === 'subjPres') {
            subjForms.push(form)
          }
        })
      })
      
      if (subjForms.length === 0) {
        missingVerbs.push(verb.lemma)
      } else if (subjForms.length < 7) {
        const availablePersons = subjForms.map(f => f.person)
        const missingPersons = expectedPersons.filter(p => !availablePersons.includes(p))
        
        incompleteVerbs.push({
          lemma: verb.lemma,
          available: subjForms.length,
          availablePersons: availablePersons,
          missingPersons: missingPersons
        })
      } else {
        completeVerbs.push(verb.lemma)
      }
    }
    
    console.log('📊 RESULTS SUMMARY')
    console.log('==================')
    console.log(`✅ Complete subjunctive present: ${completeVerbs.length} verbs`)
    console.log(`⚠️  Incomplete subjunctive present: ${incompleteVerbs.length} verbs`)
    console.log(`❌ Missing subjunctive present: ${missingVerbs.length} verbs`)
    
    if (incompleteVerbs.length > 0) {
      console.log('\n⚠️  INCOMPLETE VERBS DETAILS')
      console.log('============================')
      incompleteVerbs.forEach(verb => {
        console.log(`• ${verb.lemma}: ${verb.available}/7 forms`)
        console.log(`  Available: ${verb.availablePersons.join(', ')}`)
        console.log(`  Missing: ${verb.missingPersons.join(', ')}`)
      })
    }
    
    if (missingVerbs.length > 0) {
      console.log('\n❌ VERBS COMPLETELY MISSING SUBJUNCTIVE PRESENT')
      console.log('===============================================')
      console.log(`${missingVerbs.join(', ')}`)
    }
    
    console.log('\n🎯 PRIORITY ACTIONS')
    console.log('==================')
    
    const criticalIncomplete = incompleteVerbs.filter(v => 
      ['pensar', 'volver', 'ir', 'dar', 'poder', 'pedir', 'tener', 'hacer', 'ser', 'ver'].includes(v.lemma)
    )
    
    const criticalMissing = missingVerbs.filter(lemma => 
      ['haber', 'vivir', 'hablar', 'comer'].includes(lemma)
    )
    
    if (criticalIncomplete.length > 0) {
      console.log(`1. Fix incomplete paradigms for critical verbs: ${criticalIncomplete.map(v => v.lemma).join(', ')}`)
    }
    
    if (criticalMissing.length > 0) {
      console.log(`2. Add missing subjunctive present forms for: ${criticalMissing.join(', ')}`)
    }
    
    console.log(`3. Consider completing all ${incompleteVerbs.length} incomplete verbs for better coverage`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkIncompleteParadigms()
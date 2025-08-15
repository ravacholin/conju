#!/usr/bin/env node

// Test the categorizeVerb function directly

console.log('🧪 CATEGORIZATION FUNCTION TEST')
console.log('=================================\n')

async function testCategorizationFunction() {
  try {
    const { verbs } = await import('./src/data/verbs.js')
    const { categorizeVerb } = await import('./src/lib/data/irregularFamilies.js')
    
    console.log('✅ Successfully imported functions\n')
    
    const testVerbs = ['pensar', 'volver', 'poder', 'pedir', 'hablar', 'tener', 'hacer']
    
    console.log('📊 TESTING CATEGORIZATION')
    console.log('==========================')
    
    for (const lemma of testVerbs) {
      const verb = verbs.find(v => v.lemma === lemma)
      
      if (!verb) {
        console.log(`❌ ${lemma}: not found in database`)
        continue
      }
      
      const families = categorizeVerb(lemma, verb)
      console.log(`📝 ${lemma}:`)
      console.log(`   Categories: ${families.length > 0 ? families.join(', ') : 'NONE'}`)
      
      // Check what the audit script expects
      const expectedFamilies = {
        'pensar': 'DIPHT_E_IE',
        'volver': 'DIPHT_O_UE', 
        'poder': 'DIPHT_O_UE',
        'pedir': 'E_I_IR',
        'tener': 'G_VERBS',
        'hacer': 'G_VERBS',
        'hablar': 'none (regular)'
      }
      
      const expected = expectedFamilies[lemma]
      if (expected === 'none (regular)') {
        if (families.length === 0 || families.every(f => f.startsWith('ORTH_'))) {
          console.log(`   ✅ Correctly identified as regular`)
        } else {
          console.log(`   ❌ Expected regular, but got: ${families.join(', ')}`)
        }
      } else if (families.includes(expected)) {
        console.log(`   ✅ Correctly categorized as ${expected}`)
      } else {
        console.log(`   ❌ Expected ${expected}, but got: ${families.join(', ') || 'NONE'}`)
      }
      
      console.log()
    }
    
    // Now test the audit script logic
    console.log('🔍 TESTING AUDIT SCRIPT LOGIC')
    console.log('==============================')
    
    const allForms = []
    verbs.forEach(verb => {
      verb.paradigms.forEach(paradigm => {
        paradigm.forms.forEach(form => {
          allForms.push({
            ...form,
            lemma: verb.lemma,
            type: verb.type || 'regular'
          })
        })
      })
    })
    
    // Test subjunctive present forms for DIPHT_E_IE family
    console.log('Testing DIPHT_E_IE family for subjunctive present...')
    
    const subjForms = allForms.filter(f => f.mood === 'subjunctive' && f.tense === 'subjPres')
    console.log(`Total subjunctive present forms: ${subjForms.length}`)
    
    let diphtEIECount = 0
    const diphtEIEVerbs = new Set()
    
    subjForms.forEach(form => {
      const verb = verbs.find(v => v.lemma === form.lemma)
      if (verb) {
        const families = categorizeVerb(form.lemma, verb)
        if (families.includes('DIPHT_E_IE')) {
          diphtEIECount++
          diphtEIEVerbs.add(form.lemma)
        }
      }
    })
    
    console.log(`Forms categorized as DIPHT_E_IE: ${diphtEIECount}`)
    console.log(`Verbs in DIPHT_E_IE: ${[...diphtEIEVerbs].join(', ') || 'NONE'}`)
    
    if (diphtEIECount === 0) {
      console.log(`\n❌ CONFIRMED: No verbs are being categorized as DIPHT_E_IE`)
      console.log(`This explains why the audit shows 0 verbs for diphthongization families`)
    } else {
      console.log(`\n✅ DIPHT_E_IE categorization is working`)
    }
    
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error.stack)
  }
}

testCategorizationFunction()
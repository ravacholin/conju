#!/usr/bin/env node

// Simple test to check verb categorization without importing the full system

import { readFileSync } from 'fs'
import { join } from 'path'

console.log('🔍 SIMPLE CATEGORIZATION TEST')
console.log('==============================\n')

// Test specific verbs by examining their actual forms
const testCases = [
  {
    lemma: 'pensar',
    expectedFamily: 'DIPHT_E_IE',
    expectedPattern: 'e→ie',
    testForm: { person: '1s', mood: 'subjunctive', tense: 'subjPres', expected: 'piense' }
  },
  {
    lemma: 'volver',
    expectedFamily: 'DIPHT_O_UE', 
    expectedPattern: 'o→ue',
    testForm: { person: '1s', mood: 'subjunctive', tense: 'subjPres', expected: 'vuelva' }
  },
  {
    lemma: 'poder',
    expectedFamily: 'DIPHT_O_UE',
    expectedPattern: 'o→ue', 
    testForm: { person: '1s', mood: 'subjunctive', tense: 'subjPres', expected: 'pueda' }
  },
  {
    lemma: 'pedir',
    expectedFamily: 'E_I_IR',
    expectedPattern: 'e→i',
    testForm: { person: '1s', mood: 'subjunctive', tense: 'subjPres', expected: 'pida' }
  }
]

async function testVerbCategorization() {
  console.log('1️⃣ LOADING VERB DATA')
  console.log('====================')
  
  try {
    const { verbs } = await import('./src/data/verbs.js')
    console.log(`✅ Loaded ${verbs.length} verbs\n`)
    
    console.log('2️⃣ TESTING SPECIFIC PATTERNS')
    console.log('=============================')
    
    for (const test of testCases) {
      console.log(`🔍 Testing ${test.lemma} (expected: ${test.expectedFamily})`)
      
      const verb = verbs.find(v => v.lemma === test.lemma)
      if (!verb) {
        console.log(`   ❌ Verb not found in database`)
        continue
      }
      
      // Check if the verb has subjunctive present forms
      const subjForms = []
      verb.paradigms.forEach(p => {
        p.forms.forEach(f => {
          if (f.mood === 'subjunctive' && f.tense === 'subjPres') {
            subjForms.push(f)
          }
        })
      })
      
      console.log(`   📊 Subjunctive present forms found: ${subjForms.length}`)
      
      if (subjForms.length > 0) {
        // Check if the specific form shows the expected pattern
        const testFormData = subjForms.find(f => f.person === test.testForm.person)
        if (testFormData) {
          const matches = testFormData.value === test.testForm.expected
          console.log(`   ${matches ? '✅' : '❌'} ${test.testForm.person} form: "${testFormData.value}" ${matches ? '(correct)' : `(expected "${test.testForm.expected}")`}`)
          
          if (matches) {
            console.log(`   ✅ Shows ${test.expectedPattern} pattern - should be categorized as ${test.expectedFamily}`)
          } else {
            console.log(`   ⚠️  Form doesn't match expected pattern`)
          }
        } else {
          console.log(`   ❌ Missing ${test.testForm.person} form`)
        }
        
        // Show all available forms
        console.log(`   📝 Available forms: ${subjForms.map(f => `${f.person}="${f.value}"`).join(', ')}`)
      } else {
        console.log(`   ❌ No subjunctive present forms found`)
      }
      
      console.log()
    }
    
    console.log('3️⃣ ANALYSIS RESULTS')
    console.log('===================')
    
    const hasSubjForms = testCases.filter(test => {
      const verb = verbs.find(v => v.lemma === test.lemma)
      if (!verb) return false
      
      return verb.paradigms.some(p => 
        p.forms.some(f => f.mood === 'subjunctive' && f.tense === 'subjPres')
      )
    })
    
    console.log(`✅ Verbs with subjunctive present forms: ${hasSubjForms.length}/${testCases.length}`)
    
    if (hasSubjForms.length === testCases.length) {
      console.log(`🎉 All critical verbs have subjunctive present forms!`)
      console.log(`❌ The issue is likely in the categorization system`)
      console.log(`   - Forms exist but aren't being categorized into families`)
      console.log(`   - The audit script can't find them because categorizeVerb() isn't working`)
    } else {
      console.log(`⚠️  Some critical verbs are missing subjunctive present forms`)
      const missing = testCases.filter(t => !hasSubjForms.includes(t))
      console.log(`   Missing: ${missing.map(t => t.lemma).join(', ')}`)
    }
    
  } catch (error) {
    console.error('❌ Error loading verb data:', error.message)
  }
}

// Run the test
testVerbCategorization()
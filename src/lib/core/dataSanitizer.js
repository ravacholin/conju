// Lightweight runtime sanitizer for known dataset issues
// - Fixes mislabeled persons and truncated values in present subjunctive

function endsWithOneOf(s, arr) {
  return arr.find(e => s.endsWith(e)) || null
}

function getGroup(lemma) {
  if (lemma.endsWith('ar')) return 'ar'
  if (lemma.endsWith('er')) return 'er'
  if (lemma.endsWith('ir')) return 'ir'
  return null
}

const SUBJ_ENDINGS = {
  ar: {
    '1s': 'e', '2s_tu': 'es', '2s_vos': 'es', '3s': 'e', '1p': 'emos', '2p_vosotros': 'éis', '3p': 'en'
  },
  er: {
    '1s': 'a', '2s_tu': 'as', '2s_vos': 'as', '3s': 'a', '1p': 'amos', '2p_vosotros': 'áis', '3p': 'an'
  },
  ir: {
    '1s': 'a', '2s_tu': 'as', '2s_vos': 'as', '3s': 'a', '1p': 'amos', '2p_vosotros': 'áis', '3p': 'an'
  }
}

const ENDING_TO_PERSON = {
  ar: new Map([
    ['e','1s|3s'], ['es','2s_tu|2s_vos'], ['emos','1p'], ['éis','2p_vosotros'], ['en','3p']
  ]),
  er: new Map([
    ['a','1s|3s'], ['as','2s_tu|2s_vos'], ['amos','1p'], ['áis','2p_vosotros'], ['an','3p']
  ]),
  ir: new Map([
    ['a','1s|3s'], ['as','2s_tu|2s_vos'], ['amos','1p'], ['áis','2p_vosotros'], ['an','3p']
  ])
}

function deriveYoStem(verb) {
  try {
    const yo = verb.paradigms?.flatMap(p => p.forms||[]).find(f => f.mood==='indicative' && f.tense==='pres' && f.person==='1s')?.value
    if (yo && yo.endsWith('o')) return yo.slice(0,-1)
  } catch { /* Form parsing error ignored */ }
  return null
}

function rebuildSubjPresValue(verb, person) {
  const group = getGroup(verb.lemma)
  if (!group) return null
  const end = SUBJ_ENDINGS[group][person]
  // Known irregular bases: skip if yo form not usable
  const yoStem = deriveYoStem(verb)
  if (!yoStem) return null
  // For -ar: use lemma base except yoStem if it contains spelling changes like zc
  let stem = yoStem
  // Handle nosotros/vosotros for -ar/-er: remove stem-change by falling back to lemma base
  if ((group === 'ar' || group === 'er') && (person === '1p' || person === '2p_vosotros')) {
    stem = verb.lemma.slice(0, -2)
    if (group === 'er') stem = verb.lemma.slice(0, -2)
  }
  return stem + end
}

export function sanitizeVerbsInPlace(verbs){
  for (const verb of verbs) {
    for (const paradigm of verb.paradigms || []) {
      for (const form of paradigm.forms || []) {
        if (form.mood === 'subjunctive' && form.tense === 'subjPres' && typeof form.value === 'string') {
          const group = getGroup(verb.lemma)
          if (!group) continue
          const endings = SUBJ_ENDINGS[group]
          const expected = endings[form.person]
          const hasExpectedEnding = expected ? form.value.endsWith(expected) : false
          const endingFound = endsWithOneOf(form.value, Object.values(endings))

          // 1) If ending corresponds to a different person, relabel
          if (endingFound && !hasExpectedEnding) {
            const persons = (ENDING_TO_PERSON[group].get(endingFound) || '').split('|')
            // Prefer exact match for 2s_tu over 2s_vos and 1s over 3s when ambiguous
            const preferOrder = ['2s_tu','2s_vos','1s','3s','1p','2p_vosotros','3p']
            const newPerson = persons.sort((a,b)=>preferOrder.indexOf(a)-preferOrder.indexOf(b))[0]
            if (newPerson) form.person = newPerson
          }

          // 2) If value seems truncated or has no known ending, try to rebuild conservatively
          if (!endingFound || form.value.length <= verb.lemma.length - 2) {
            const rebuilt = rebuildSubjPresValue(verb, form.person)
            if (rebuilt && rebuilt.length > form.value.length) {
              form.value = rebuilt
              continue
            }
          }

          // 3) Orthographic fix for -cer/-cir zc-pattern: enforce 'zc' before ending
          try {
            const yoStem = deriveYoStem(verb)
            if (/(cer|cir)$/.test(verb.lemma) && yoStem && /zc$/.test(yoStem)) {
              const end = SUBJ_ENDINGS[group][form.person]
              const stemPart = form.value.slice(0, -end.length)
              if (!stemPart.endsWith('zc')) {
                const rebuilt = yoStem + end
                if (rebuilt && rebuilt !== form.value) {
                  form.value = rebuilt
                }
              }
            }
          } catch { /* Sanitization error ignored */ }
        }
      }
    }
  }
}

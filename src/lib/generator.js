import gates from '../data/curriculum.json'
import { useSettings } from '../state/settings.js'

export function chooseNext({forms, history}){
  const { 
    level, useVoseo, useTuteo, useVosotros,
    practiceMode, specificMood, specificTense
  } = useSettings.getState()
  
  const eligible = forms.filter(f=>{
    // Level filtering
    const gate = gates.find(g => g.mood===f.mood && g.tense===f.tense && levelOrder(g.level) <= levelOrder(level))
    if(!gate) return false
    
    // Person filtering (dialect) - exclude forms not used in the selected dialect
    if(f.person==='2s_vos' && !useVoseo) return false  // Exclude vos if not using voseo
    if(f.person==='2s_tu' && !useTuteo) return false   // Exclude tú if not using tuteo  
    if(f.person==='2p_vosotros' && !useVosotros) return false  // Exclude vosotros if not using vosotros
    
    // Specific practice filtering
    if(practiceMode === 'specific') {
      if(specificMood && f.mood !== specificMood) return false
      if(specificTense && f.tense !== specificTense) return false
    }
    
    return true
  })
  
  // Check if we have any eligible forms
  if (eligible.length === 0) {
    return null
  }
  
  // Sort by accuracy (lowest first)
  eligible.sort((a,b)=> (acc(a,history) - acc(b,history)))
  
  // Find the lowest accuracy score
  const lowestAcc = acc(eligible[0], history)
  
  // Get all forms with the same lowest accuracy (to add randomness among equals)
  const candidates = eligible.filter(f => acc(f, history) === lowestAcc)
  
  // Randomly select from candidates with equal accuracy
  const randomIndex = Math.floor(Math.random() * candidates.length)
  return candidates[randomIndex]
}

function acc(f, history){
  const k = key(f); const h = history[k]||{seen:0, correct:0}
  return (h.correct + 1) / (h.seen + 2)
}
function key(f){ return `${f.mood}:${f.tense}:${f.person}:${f.value}` }
function levelOrder(L){ return ['A1','A2','B1','B2','C1','C2'].indexOf(L) } 
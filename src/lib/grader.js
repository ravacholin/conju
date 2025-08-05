import { normalize } from './rules.js'

export function grade(input, expected, settings){
  const candidates = new Set([expected.value, ...(expected.alt||[])])
  if(!settings.strict){
    const a = expected.accepts||{}
    if(settings.useTuteo && a.tu) candidates.add(a.tu)
    if(settings.useVoseo && a.vos) candidates.add(a.vos)
    if(settings.useVosotros && a.vosotros) candidates.add(a.vosotros)
  }
  const inCanon = normalize(input)
  const hits = [...candidates].map(normalize)
  const correct = hits.includes(inCanon)
  return {
    correct,
    accepted: correct ? input : null,
    targets: [...candidates],
    note: !correct && settings.accentTolerance !== 'off'
      ? 'Check accents / ending' : undefined
  }
} 
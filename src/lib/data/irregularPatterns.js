export const FUTURE_CONDITIONAL_ROOTS = [
  { lemma: 'tener', root: 'tendr', group: 'dr', meaning: 'tener' },
  { lemma: 'poner', root: 'pondr', group: 'dr', meaning: 'poner' },
  { lemma: 'salir', root: 'saldr', group: 'dr', meaning: 'salir' },
  { lemma: 'venir', root: 'vendr', group: 'dr', meaning: 'venir' },
  { lemma: 'valer', root: 'valdr', group: 'dr', meaning: 'valer' },
  { lemma: 'poder', root: 'podr', group: 'drop_d', meaning: 'poder' },
  { lemma: 'saber', root: 'sabr', group: 'drop_d', meaning: 'saber' },
  { lemma: 'haber', root: 'habr', group: 'drop_d', meaning: 'haber' },
  { lemma: 'hacer', root: 'har', group: 'short', meaning: 'hacer' },
  { lemma: 'decir', root: 'dir', group: 'short', meaning: 'decir' },
  { lemma: 'querer', root: 'querr', group: 'double_r', meaning: 'querer' },
  { lemma: 'caber', root: 'cabr', group: 'drop_d', meaning: 'caber' }
]

export const IRREGULAR_GERUNDS = [
  { lemma: 'ir', form: 'yendo' },
  { lemma: 'poder', form: 'pudiendo' },
  { lemma: 'venir', form: 'viniendo' },
  { lemma: 'decir', form: 'diciendo' },
  { lemma: 'traer', form: 'trayendo' },
  { lemma: 'dormir', form: 'durmiendo' },
  { lemma: 'morir', form: 'muriendo' },
  { lemma: 'sentir', form: 'sintiendo' },
  { lemma: 'pedir', form: 'pidiendo' },
  { lemma: 'servir', form: 'sirviendo' },
  { lemma: 'leer', form: 'leyendo' },
  { lemma: 'oír', form: 'oyendo' },
  { lemma: 'construir', form: 'construyendo' }
]

export const IRREGULAR_PARTICIPLES = [
  { lemma: 'hacer', form: 'hecho' },
  { lemma: 'ver', form: 'visto' },
  { lemma: 'escribir', form: 'escrito' },
  { lemma: 'poner', form: 'puesto' },
  { lemma: 'volver', form: 'vuelto' },
  { lemma: 'morir', form: 'muerto' },
  { lemma: 'abrir', form: 'abierto' },
  { lemma: 'cubrir', form: 'cubierto' },
  { lemma: 'decir', form: 'dicho' },
  { lemma: 'romper', form: 'roto' },
  { lemma: 'resolver', form: 'resuelto' },
  { lemma: 'freír', form: 'frito', alt: ['freído'] }
]

export const FUTURE_ENDINGS = {
  '1s': 'é',
  '2s_tu': 'ás',
  '2s_vos': 'ás',
  '3s': 'á',
  '1p': 'emos',
  '2p_vosotros': 'éis',
  '3p': 'án'
}

export const CONDITIONAL_ENDINGS = {
  '1s': 'ía',
  '2s_tu': 'ías',
  '2s_vos': 'ías',
  '3s': 'ía',
  '1p': 'íamos',
  '2p_vosotros': 'íais',
  '3p': 'ían'
}

export function buildFutureConditionalForm(root, tenseKey, pronoun) {
  const endings = tenseKey === 'cond' ? CONDITIONAL_ENDINGS : FUTURE_ENDINGS
  const ending = endings[pronoun] ?? endings['3s']
  return `${root}${ending}`
}

export function getPronounLabel(pronoun, useVoseo) {
  if (pronoun === '1s') return 'yo'
  if (pronoun === '1p') return 'nosotros/as'
  if (pronoun === '3p') return 'ellos/as'
  if (pronoun === '3s') return 'él / ella'
  if (pronoun === '2p_vosotros') return 'vosotros/as'
  if (pronoun === '2s_vos') return 'vos'
  if (pronoun === '2s_tu') return useVoseo ? 'vos' : 'tú'
  return pronoun
}

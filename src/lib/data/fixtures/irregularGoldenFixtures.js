export const IRREGULAR_GOLDEN_FIXTURES = Object.freeze({
  nonfinite: Object.freeze([
    { lemma: 'decir', gerund: 'diciendo', participle: 'dicho' },
    { lemma: 'hacer', gerund: 'haciendo', participle: 'hecho' },
    { lemma: 'ver', gerund: 'viendo', participle: 'visto' },
    { lemma: 'poner', gerund: 'poniendo', participle: 'puesto' },
    { lemma: 'morir', gerund: 'muriendo', participle: 'muerto' },
    { lemma: 'resolver', gerund: 'resolviendo', participle: 'resuelto' },
    { lemma: 'romper', gerund: 'rompiendo', participle: 'roto' },
    { lemma: 'abrir', gerund: 'abriendo', participle: 'abierto' }
  ]),
  preteriteStrong: Object.freeze([
    {
      lemma: 'tener',
      family: 'PRET_UV',
      forms: Object.freeze({ '1s': 'tuve', '3s': 'tuvo', '3p': 'tuvieron' })
    },
    {
      lemma: 'estar',
      family: 'PRET_UV',
      forms: Object.freeze({ '1s': 'estuve', '3s': 'estuvo', '3p': 'estuvieron' })
    },
    {
      lemma: 'poder',
      family: 'PRET_U',
      forms: Object.freeze({ '1s': 'pude', '3s': 'pudo', '3p': 'pudieron' })
    },
    {
      lemma: 'hacer',
      family: 'PRET_I',
      forms: Object.freeze({ '1s': 'hice', '3s': 'hizo', '3p': 'hicieron' })
    },
    {
      lemma: 'decir',
      family: 'PRET_J',
      forms: Object.freeze({ '1s': 'dije', '3s': 'dijo', '3p': 'dijeron' })
    },
    {
      lemma: 'traer',
      family: 'PRET_J',
      forms: Object.freeze({ '1s': 'traje', '3s': 'trajo', '3p': 'trajeron' })
    },
    {
      lemma: 'ser',
      family: 'PRET_SUPPL',
      forms: Object.freeze({ '1s': 'fui', '3s': 'fue', '3p': 'fueron' })
    }
  ])
})

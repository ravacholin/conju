// Verbos de alta prioridad que faltan en la base de datos principal
// Estos son verbos esenciales para estudiantes de español

export const priorityVerbs = [
  // Verbos básicos críticos que faltan
  {
    "id": "haber_priority",
    "lemma": "haber",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "he" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "has", "accepts": { "vos": "has" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "ha" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "hemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "habéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "han" },
          
          // Pretérito indefinido
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "hube" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "hubiste", "accepts": { "vos": "hubiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "hubo" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "hubimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "hubisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "hubieron" },

          // Presente subjuntivo  
          { "mood": "subjunctive", "tense": "pres", "person": "1s", "value": "haya" },
          { "mood": "subjunctive", "tense": "pres", "person": "2s_tu", "value": "hayas", "accepts": { "vos": "hayas" } },
          { "mood": "subjunctive", "tense": "pres", "person": "3s", "value": "haya" },
          { "mood": "subjunctive", "tense": "pres", "person": "1p", "value": "hayamos" },
          { "mood": "subjunctive", "tense": "pres", "person": "2p_vosotros", "value": "hayáis" },
          { "mood": "subjunctive", "tense": "pres", "person": "3p", "value": "hayan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "haber" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "habiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "habido" }
        ]
      }
    ]
  },

  // Verbos ortográficos importantes
  {
    "id": "sacar_priority", 
    "lemma": "sacar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "saco" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "sacas", "accepts": { "vos": "sacás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "saca" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "sacamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "sacáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "sacan" },
          
          // Pretérito indefinido (cambio c→qu)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "saqué" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "sacaste", "accepts": { "vos": "sacaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "sacó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "sacamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "sacasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "sacaron" },

          // Presente subjuntivo (cambio c→qu)
          { "mood": "subjunctive", "tense": "pres", "person": "1s", "value": "saque" },
          { "mood": "subjunctive", "tense": "pres", "person": "2s_tu", "value": "saques", "accepts": { "vos": "saques" } },
          { "mood": "subjunctive", "tense": "pres", "person": "3s", "value": "saque" },
          { "mood": "subjunctive", "tense": "pres", "person": "1p", "value": "saquemos" },
          { "mood": "subjunctive", "tense": "pres", "person": "2p_vosotros", "value": "saquéis" },
          { "mood": "subjunctive", "tense": "pres", "person": "3p", "value": "saquen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "sacar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "sacando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "sacado" }
        ]
      }
    ]
  },

  {
    "id": "proteger_priority",
    "lemma": "proteger", 
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (cambio g→j)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "protejo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "proteges", "accepts": { "vos": "protegés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "protege" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "protegemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "protegéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "protegen" },

          // Presente subjuntivo (cambio g→j)
          { "mood": "subjunctive", "tense": "pres", "person": "1s", "value": "proteja" },
          { "mood": "subjunctive", "tense": "pres", "person": "2s_tu", "value": "protejas", "accepts": { "vos": "protejas" } },
          { "mood": "subjunctive", "tense": "pres", "person": "3s", "value": "proteja" },
          { "mood": "subjunctive", "tense": "pres", "person": "1p", "value": "protejamos" },
          { "mood": "subjunctive", "tense": "pres", "person": "2p_vosotros", "value": "protejáis" },
          { "mood": "subjunctive", "tense": "pres", "person": "3p", "value": "protejan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "proteger" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "protegiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "protegido" }
        ]
      }
    ]
  },

  {
    "id": "coger_priority",
    "lemma": "coger",
    "type": "irregular", 
    "paradigms": [
      {
        "regionTags": ["peninsular"], // Nota: Este verbo tiene connotaciones diferentes por región
        "forms": [
          // Presente indicativo (cambio g→j)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "cojo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "coges" },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "coge" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "cogemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "cogéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "cogen" },

          // Presente subjuntivo (cambio g→j)
          { "mood": "subjunctive", "tense": "pres", "person": "1s", "value": "coja" },
          { "mood": "subjunctive", "tense": "pres", "person": "2s_tu", "value": "cojas" },
          { "mood": "subjunctive", "tense": "pres", "person": "3s", "value": "coja" },
          { "mood": "subjunctive", "tense": "pres", "person": "1p", "value": "cojamos" },
          { "mood": "subjunctive", "tense": "pres", "person": "2p_vosotros", "value": "cojáis" },
          { "mood": "subjunctive", "tense": "pres", "person": "3p", "value": "cojan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "coger" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "cogiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "cogido" }
        ]
      }
    ]
  },

  // Verbos -zco (conocer, parecer, nacer, crecer)
  {
    "id": "conocer_priority",
    "lemma": "conocer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (cambio c→zc en 1ª persona)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "conozco" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "conoces", "accepts": { "vos": "conocés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "conoce" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "conocemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "conocéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "conocen" },

          // Presente subjuntivo (cambio c→zc en todas las personas)
          { "mood": "subjunctive", "tense": "pres", "person": "1s", "value": "conozca" },
          { "mood": "subjunctive", "tense": "pres", "person": "2s_tu", "value": "conozcas", "accepts": { "vos": "conozcas" } },
          { "mood": "subjunctive", "tense": "pres", "person": "3s", "value": "conozca" },
          { "mood": "subjunctive", "tense": "pres", "person": "1p", "value": "conozcamos" },
          { "mood": "subjunctive", "tense": "pres", "person": "2p_vosotros", "value": "conozcáis" },
          { "mood": "subjunctive", "tense": "pres", "person": "3p", "value": "conozcan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "conocer" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "conociendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "conocido" }
        ]
      }
    ]
  },

  {
    "id": "parecer_priority",
    "lemma": "parecer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (cambio c→zc en 1ª persona)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "parezco" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "pareces", "accepts": { "vos": "parecés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "parece" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "parecemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "parecéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "parecen" },

          // Presente subjuntivo (cambio c→zc en todas las personas)
          { "mood": "subjunctive", "tense": "pres", "person": "1s", "value": "parezca" },
          { "mood": "subjunctive", "tense": "pres", "person": "2s_tu", "value": "parezcas", "accepts": { "vos": "parezcas" } },
          { "mood": "subjunctive", "tense": "pres", "person": "3s", "value": "parezca" },
          { "mood": "subjunctive", "tense": "pres", "person": "1p", "value": "parezcamos" },
          { "mood": "subjunctive", "tense": "pres", "person": "2p_vosotros", "value": "parezcáis" },
          { "mood": "subjunctive", "tense": "pres", "person": "3p", "value": "parezcan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "parecer" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "pareciendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "parecido" }
        ]
      }
    ]
  },

  {
    "id": "nacer_priority",
    "lemma": "nacer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (cambio c→zc en 1ª persona)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "nazco" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "naces", "accepts": { "vos": "nacés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "nace" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "nacemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "nacéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "nacen" },

          // Presente subjuntivo (cambio c→zc en todas las personas)
          { "mood": "subjunctive", "tense": "pres", "person": "1s", "value": "nazca" },
          { "mood": "subjunctive", "tense": "pres", "person": "2s_tu", "value": "nazcas", "accepts": { "vos": "nazcas" } },
          { "mood": "subjunctive", "tense": "pres", "person": "3s", "value": "nazca" },
          { "mood": "subjunctive", "tense": "pres", "person": "1p", "value": "nazcamos" },
          { "mood": "subjunctive", "tense": "pres", "person": "2p_vosotros", "value": "nazcáis" },
          { "mood": "subjunctive", "tense": "pres", "person": "3p", "value": "nazcan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "nacer" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "naciendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "nacido" }
        ]
      }
    ]
  },

  {
    "id": "crecer_priority",
    "lemma": "crecer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (cambio c→zc en 1ª persona)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "crezco" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "creces", "accepts": { "vos": "crecés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "crece" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "crecemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "crecéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "crecen" },

          // Presente subjuntivo (cambio c→zc en todas las personas)
          { "mood": "subjunctive", "tense": "pres", "person": "1s", "value": "crezca" },
          { "mood": "subjunctive", "tense": "pres", "person": "2s_tu", "value": "crezcas", "accepts": { "vos": "crezcas" } },
          { "mood": "subjunctive", "tense": "pres", "person": "3s", "value": "crezca" },
          { "mood": "subjunctive", "tense": "pres", "person": "1p", "value": "crezcamos" },
          { "mood": "subjunctive", "tense": "pres", "person": "2p_vosotros", "value": "crezcáis" },
          { "mood": "subjunctive", "tense": "pres", "person": "3p", "value": "crezcan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "crecer" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "creciendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "crecido" }
        ]
      }
    ]
  }
  
  // Se pueden agregar más verbos aquí según necesidades
]

// Función para combinar con verbos principales sin duplicados
export function getAllVerbsWithPriority(mainVerbs) {
  const existingLemmas = new Set(mainVerbs.map(v => v.lemma))
  const uniquePriorityVerbs = priorityVerbs.filter(v => !existingLemmas.has(v.lemma))
  return [...mainVerbs, ...uniquePriorityVerbs]
}
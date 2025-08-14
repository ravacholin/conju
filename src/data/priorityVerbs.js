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
  }
  
  // Se pueden agregar más verbos aquí según necesidades
]

// Función para combinar con verbos principales sin duplicados
export function getAllVerbsWithPriority(mainVerbs) {
  const existingLemmas = new Set(mainVerbs.map(v => v.lemma))
  const uniquePriorityVerbs = priorityVerbs.filter(v => !existingLemmas.has(v.lemma))
  return [...mainVerbs, ...uniquePriorityVerbs]
}
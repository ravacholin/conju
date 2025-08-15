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
  },

  // Verbos de diptongación e→ie críticos faltantes
  {
    "id": "cerrar_priority",
    "lemma": "cerrar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (e→ie)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "cierro" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "cierras", "accepts": { "vos": "cerrás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "cierra" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "cerramos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "cerráis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "cierran" },

          // Presente subjuntivo (e→ie) 
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "cierre" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "cierres", "accepts": { "vos": "cierres" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "cierre" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "cerremos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "cerréis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "cierren" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "cerrar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "cerrando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "cerrado" }
        ]
      }
    ]
  },

  {
    "id": "comenzar_priority",
    "lemma": "comenzar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (e→ie)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "comienzo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "comienzas", "accepts": { "vos": "comenzás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "comienza" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "comenzamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "comenzáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "comienzan" },

          // Presente subjuntivo (e→ie)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "comience" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "comiences", "accepts": { "vos": "comiences" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "comience" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "comencemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "comencéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "comiencen" },

          // Pretérito indefinido (z→c)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "comencé" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "comenzaste", "accepts": { "vos": "comenzaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "comenzó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "comenzamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "comenzasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "comenzaron" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "comenzar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "comenzando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "comenzado" }
        ]
      }
    ]
  },

  // Verbos de diptongación o→ue críticos faltantes
  {
    "id": "contar_priority",
    "lemma": "contar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (o→ue)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "cuento" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "cuentas", "accepts": { "vos": "contás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "cuenta" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "contamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "contáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "cuentan" },

          // Presente subjuntivo (o→ue)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "cuente" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "cuentes", "accepts": { "vos": "cuentes" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "cuente" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "contemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "contéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "cuenten" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "contar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "contando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "contado" }
        ]
      }
    ]
  },

  {
    "id": "mostrar_priority",
    "lemma": "mostrar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (o→ue)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "muestro" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "muestras", "accepts": { "vos": "mostrás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "muestra" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "mostramos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "mostráis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "muestran" },

          // Presente subjuntivo (o→ue)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "muestre" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "muestres", "accepts": { "vos": "muestres" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "muestre" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "mostremos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "mostréis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "muestren" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "mostrar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "mostrando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "mostrado" }
        ]
      }
    ]
  },

  // Verbos -ger/-gir → -jo críticos faltantes (familia JO_VERBS con solo 2 verbos)
  {
    "id": "elegir_priority",
    "lemma": "elegir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (g→j + e→i)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "elijo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "eliges", "accepts": { "vos": "elegís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "elige" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "elegimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "elegís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "eligen" },

          // Presente subjuntivo (g→j + e→i)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "elija" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "elijas", "accepts": { "vos": "elijas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "elija" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "elijamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "elijáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "elijan" },

          // Pretérito indefinido (e→i en 3ª persona)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "elegí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "elegiste", "accepts": { "vos": "elegiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "eligió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "elegimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "elegisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "eligieron" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "elegir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "eligiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "elegido" }
        ]
      }
    ]
  },

  // Verbos -guir críticos faltantes (familia GU_DROP con solo 1 verbo)
  {
    "id": "distinguir_priority",
    "lemma": "distinguir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (gu→g)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "distingo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "distingues", "accepts": { "vos": "distinguís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "distingue" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "distinguimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "distinguís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "distinguen" },

          // Presente subjuntivo (gu→g)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "distinga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "distingas", "accepts": { "vos": "distingas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "distinga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "distingamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "distingáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "distingan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "distinguir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "distinguiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "distinguido" }
        ]
      }
    ]
  },

  // Verbo e→i crítico faltante
  {
    "id": "sentir_priority",
    "lemma": "sentir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (e→ie)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "siento" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "sientes", "accepts": { "vos": "sentís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "siente" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "sentimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "sentís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "sienten" },

          // Presente subjuntivo (e→ie)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "sienta" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "sientas", "accepts": { "vos": "sientas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "sienta" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "sintamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "sintáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "sientan" },

          // Pretérito indefinido (e→i en 3ª persona)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "sentí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "sentiste", "accepts": { "vos": "sentiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "sintió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "sentimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "sentisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "sintieron" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "sentir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "sintiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "sentido" }
        ]
      }
    ]
  },

  // Verbos ortográficos -gar → -gu (familia ORTH_GAR completamente vacía)
  {
    "id": "llegar_priority",
    "lemma": "llegar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "llego" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "llegas", "accepts": { "vos": "llegás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "llega" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "llegamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "llegáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "llegan" },

          // Pretérito indefinido (g→gu)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "llegué" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "llegaste", "accepts": { "vos": "llegaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "llegó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "llegamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "llegasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "llegaron" },

          // Presente subjuntivo (g→gu)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "llegue" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "llegues", "accepts": { "vos": "llegues" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "llegue" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "lleguemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "lleguéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "lleguen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "llegar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "llegando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "llegado" }
        ]
      }
    ]
  },

  {
    "id": "pagar_priority",
    "lemma": "pagar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "pago" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "pagas", "accepts": { "vos": "pagás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "paga" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "pagamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "pagáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "pagan" },

          // Pretérito indefinido (g→gu)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "pagué" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "pagaste", "accepts": { "vos": "pagaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "pagó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "pagamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "pagasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "pagaron" },

          // Presente subjuntivo (g→gu)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "pague" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "pagues", "accepts": { "vos": "pagues" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "pague" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "paguemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "paguéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "paguen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "pagar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "pagando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "pagado" }
        ]
      }
    ]
  },

  // Verbos ortográficos -zar → -c (familia ORTH_ZAR con solo 1 verbo)
  {
    "id": "organizar_priority",
    "lemma": "organizar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "organizo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "organizas", "accepts": { "vos": "organizás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "organiza" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "organizamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "organizáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "organizan" },

          // Pretérito indefinido (z→c)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "organicé" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "organizaste", "accepts": { "vos": "organizaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "organizó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "organizamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "organizasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "organizaron" },

          // Presente subjuntivo (z→c)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "organice" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "organices", "accepts": { "vos": "organices" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "organice" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "organicemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "organicéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "organicen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "organizar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "organizando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "organizado" }
        ]
      }
    ]
  },

  {
    "id": "realizar_priority",
    "lemma": "realizar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "realizo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "realizas", "accepts": { "vos": "realizás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "realiza" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "realizamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "realizáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "realizan" },

          // Pretérito indefinido (z→c)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "realicé" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "realizaste", "accepts": { "vos": "realizaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "realizó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "realizamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "realizasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "realizaron" },

          // Presente subjuntivo (z→c)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "realice" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "realices", "accepts": { "vos": "realices" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "realice" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "realicemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "realicéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "realicen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "realizar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "realizando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "realizado" }
        ]
      }
    ]
  },

  {
    "id": "leer_priority",
    "lemma": "leer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "leo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "lees", "accepts": { "vos": "leés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "lee" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "leemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "leéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "leen" },

          // Pretérito indefinido (i→y en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "leí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "leíste", "accepts": { "vos": "leíste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "leyó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "leímos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "leísteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "leyeron" },

          // Presente subjuntivo (regular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "lea" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "leas", "accepts": { "vos": "leas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "lea" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "leamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "leáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "lean" },
          
          // Formas no conjugadas (gerundio con y)
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "leer" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "leyendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "leído" }
        ]
      }
    ]
  },

  {
    "id": "caer_priority",
    "lemma": "caer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (irregular yo: caigo)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "caigo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "caes", "accepts": { "vos": "caés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "cae" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "caemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "caéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "caen" },

          // Pretérito indefinido (i→y en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "caí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "caíste", "accepts": { "vos": "caíste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "cayó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "caímos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "caísteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "cayeron" },

          // Presente subjuntivo (basado en caigo)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "caiga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "caigas", "accepts": { "vos": "caigas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "caiga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "caigamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "caigáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "caigan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "caer" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "cayendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "caído" }
        ]
      }
    ]
  },

  {
    "id": "oir_priority",
    "lemma": "oír",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (irregular yo: oigo)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "oigo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "oyes", "accepts": { "vos": "oís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "oye" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "oímos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "oís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "oyen" },

          // Pretérito indefinido (i→y en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "oí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "oíste", "accepts": { "vos": "oíste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "oyó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "oímos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "oísteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "oyeron" },

          // Presente subjuntivo (basado en oigo)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "oiga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "oigas", "accepts": { "vos": "oigas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "oiga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "oigamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "oigáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "oigan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "oír" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "oyendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "oído" }
        ]
      }
    ]
  },

  {
    "id": "construir_priority",
    "lemma": "construir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (inserción de y)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "construyo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "construyes", "accepts": { "vos": "construís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "construye" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "construimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "construís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "construyen" },

          // Pretérito indefinido (i→y en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "construí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "construiste", "accepts": { "vos": "construiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "construyó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "construimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "construisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "construyeron" },

          // Presente subjuntivo (inserción de y)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "construya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "construyas", "accepts": { "vos": "construyas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "construya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "construyamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "construyáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "construyan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "construir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "construyendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "construido" }
        ]
      }
    ]
  },

  {
    "id": "huir_priority",
    "lemma": "huir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (inserción de y)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "huyo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "huyes", "accepts": { "vos": "huís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "huye" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "huimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "huís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "huyen" },

          // Pretérito indefinido (i→y en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "huí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "huiste", "accepts": { "vos": "huiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "huyó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "huimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "huisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "huyeron" },

          // Presente subjuntivo (inserción de y)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "huya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "huyas", "accepts": { "vos": "huyas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "huya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "huyamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "huyáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "huyan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "huir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "huyendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "huido" }
        ]
      }
    ]
  },

  // UIR_Y: destruir (inserción de y)
  {
    "id": "destruir_priority",
    "lemma": "destruir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (inserción de y)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "destruyo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "destruyes", "accepts": { "vos": "destruís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "destruye" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "destruimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "destruís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "destruyen" },

          // Pretérito indefinido (i→y en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "destruí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "destruiste", "accepts": { "vos": "destruiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "destruyó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "destruimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "destruisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "destruyeron" },

          // Presente subjuntivo (inserción de y)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "destruya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "destruyas", "accepts": { "vos": "destruyas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "destruya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "destruyamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "destruyáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "destruyan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "destruir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "destruyendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "destruido" }
        ]
      }
    ]
  },

  // UIR_Y: incluir (inserción de y)
  {
    "id": "incluir_priority",
    "lemma": "incluir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (inserción de y)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "incluyo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "incluyes", "accepts": { "vos": "incluís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "incluye" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "incluimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "incluís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "incluyen" },

          // Pretérito indefinido (i→y en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "incluí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "incluiste", "accepts": { "vos": "incluiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "incluyó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "incluimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "incluisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "incluyeron" },

          // Presente subjuntivo (inserción de y)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "incluya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "incluyas", "accepts": { "vos": "incluyas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "incluya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "incluyamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "incluyáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "incluyan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "incluir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "incluyendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "incluido" }
        ]
      }
    ]
  },

  // UIR_Y: concluir (inserción de y)
  {
    "id": "concluir_priority",
    "lemma": "concluir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (inserción de y)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "concluyo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "concluyes", "accepts": { "vos": "concluís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "concluye" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "concluimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "concluís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "concluyen" },

          // Pretérito indefinido (i→y en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "concluí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "concluiste", "accepts": { "vos": "concluiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "concluyó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "concluimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "concluisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "concluyeron" },

          // Presente subjuntivo (inserción de y)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "concluya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "concluyas", "accepts": { "vos": "concluyas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "concluya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "concluyamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "concluyáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "concluyan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "concluir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "concluyendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "concluido" }
        ]
      }
    ]
  },

  // UIR_Y: contribuir (inserción de y)
  {
    "id": "contribuir_priority",
    "lemma": "contribuir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (inserción de y)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "contribuyo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "contribuyes", "accepts": { "vos": "contribuís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "contribuye" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "contribuimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "contribuís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "contribuyen" },

          // Pretérito indefinido (i→y en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "contribuí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "contribuiste", "accepts": { "vos": "contribuiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "contribuyó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "contribuimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "contribuisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "contribuyeron" },

          // Presente subjuntivo (inserción de y)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "contribuya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "contribuyas", "accepts": { "vos": "contribuyas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "contribuya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "contribuyamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "contribuyáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "contribuyan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "contribuir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "contribuyendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "contribuido" }
        ]
      }
    ]
  },

  // UIR_Y: distribuir (inserción de y)
  {
    "id": "distribuir_priority",
    "lemma": "distribuir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (inserción de y)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "distribuyo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "distribuyes", "accepts": { "vos": "distribuís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "distribuye" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "distribuimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "distribuís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "distribuyen" },

          // Pretérito indefinido (i→y en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "distribuí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "distribuiste", "accepts": { "vos": "distribuiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "distribuyó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "distribuimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "distribuisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "distribuyeron" },

          // Presente subjuntivo (inserción de y)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "distribuya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "distribuyas", "accepts": { "vos": "distribuyas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "distribuya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "distribuyamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "distribuyáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "distribuyan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "distribuir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "distribuyendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "distribuido" }
        ]
      }
    ]
  },

  // UIR_Y: instruir (inserción de y)
  {
    "id": "instruir_priority",
    "lemma": "instruir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (inserción de y)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "instruyo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "instruyes", "accepts": { "vos": "instruís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "instruye" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "instruimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "instruís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "instruyen" },

          // Pretérito indefinido (i→y en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "instruí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "instruiste", "accepts": { "vos": "instruiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "instruyó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "instruimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "instruisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "instruyeron" },

          // Presente subjuntivo (inserción de y)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "instruya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "instruyas", "accepts": { "vos": "instruyas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "instruya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "instruyamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "instruyáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "instruyan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "instruir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "instruyendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "instruido" }
        ]
      }
    ]
  },

  // UIR_Y: sustituir (inserción de y)
  {
    "id": "sustituir_priority",
    "lemma": "sustituir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (inserción de y)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "sustituyo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "sustituyes", "accepts": { "vos": "sustituís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "sustituye" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "sustituimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "sustituís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "sustituyen" },

          // Pretérito indefinido (i→y en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "sustituí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "sustituiste", "accepts": { "vos": "sustituiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "sustituyó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "sustituimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "sustituisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "sustituyeron" },

          // Presente subjuntivo (inserción de y)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "sustituya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "sustituyas", "accepts": { "vos": "sustituyas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "sustituya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "sustituyamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "sustituyáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "sustituyan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "sustituir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "sustituyendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "sustituido" }
        ]
      }
    ]
  },

  // UIR_Y: atribuir (inserción de y)
  {
    "id": "atribuir_priority",
    "lemma": "atribuir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (inserción de y)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "atribuyo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "atribuyes", "accepts": { "vos": "atribuís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "atribuye" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "atribuimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "atribuís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "atribuyen" },

          // Pretérito indefinido (i→y en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "atribuí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "atribuiste", "accepts": { "vos": "atribuiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "atribuyó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "atribuimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "atribuisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "atribuyeron" },

          // Presente subjuntivo (inserción de y)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "atribuya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "atribuyas", "accepts": { "vos": "atribuyas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "atribuya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "atribuyamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "atribuyáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "atribuyan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "atribuir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "atribuyendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "atribuido" }
        ]
      }
    ]
  },

  // UIR_Y: excluir (inserción de y)
  {
    "id": "excluir_priority",
    "lemma": "excluir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (inserción de y)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "excluyo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "excluyes", "accepts": { "vos": "excluís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "excluye" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "excluimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "excluís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "excluyen" },

          // Pretérito indefinido (i→y en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "excluí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "excluiste", "accepts": { "vos": "excluiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "excluyó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "excluimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "excluisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "excluyeron" },

          // Presente subjuntivo (inserción de y)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "excluya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "excluyas", "accepts": { "vos": "excluyas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "excluya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "excluyamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "excluyáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "excluyan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "excluir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "excluyendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "excluido" }
        ]
      }
    ]
  },

  // O_U_GER_IR: reñir (o→u en gerundio, 3ª personas pretérito)
  {
    "id": "reñir_priority",
    "lemma": "reñir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (e→i diptongación)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "riño" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "riñes", "accepts": { "vos": "reñís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "riñe" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "reñimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "reñís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "riñen" },

          // Pretérito indefinido (e→i, 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "reñí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "reñiste", "accepts": { "vos": "reñiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "riñó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "reñimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "reñisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "riñeron" },

          // Presente subjuntivo (e→i)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "riña" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "riñas", "accepts": { "vos": "riñas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "riña" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "riñamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "riñáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "riñan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "reñir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "riñendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "reñido" }
        ]
      }
    ]
  },

  // O_U_GER_IR: teñir (e→i diptongación, o→u gerundio)  
  {
    "id": "teñir_priority",
    "lemma": "teñir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (e→i diptongación)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "tiño" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "tiñes", "accepts": { "vos": "teñís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "tiñe" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "teñimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "teñís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "tiñen" },

          // Pretérito indefinido (e→i, 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "teñí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "teñiste", "accepts": { "vos": "teñiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "tiñó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "teñimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "teñisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "tiñeron" },

          // Presente subjuntivo (e→i)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "tiña" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "tiñas", "accepts": { "vos": "tiñas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "tiña" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "tiñamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "tiñáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "tiñan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "teñir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "tiñendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "teñido" }
        ]
      }
    ]
  },

  // O_U_GER_IR: ceñir (e→i diptongación)
  {
    "id": "ceñir_priority",
    "lemma": "ceñir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (e→i diptongación)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "ciño" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "ciñes", "accepts": { "vos": "ceñís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "ciñe" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "ceñimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "ceñís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "ciñen" },

          // Pretérito indefinido (e→i, 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "ceñí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "ceñiste", "accepts": { "vos": "ceñiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "ciñó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "ceñimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "ceñisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "ciñeron" },

          // Presente subjuntivo (e→i)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "ciña" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "ciñas", "accepts": { "vos": "ciñas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "ciña" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "ciñamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "ciñáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "ciñan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "ceñir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "ciñendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "ceñido" }
        ]
      }
    ]
  },

  // O_U_GER_IR: tañir
  {
    "id": "tañir_priority",
    "lemma": "tañir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "taño" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "tañes", "accepts": { "vos": "tañés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "tañe" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "tañimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "tañís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "tañen" },

          // Pretérito indefinido (3ª personas con cambio)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "tañí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "tañiste", "accepts": { "vos": "tañiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "tañó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "tañimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "tañisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "tañeron" },

          // Presente subjuntivo
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "taña" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "tañas", "accepts": { "vos": "tañas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "taña" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "tañamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "tañáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "tañan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "tañir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "tañendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "tañido" }
        ]
      }
    ]
  },

  // O_U_GER_IR: bullir
  {
    "id": "bullir_priority",
    "lemma": "bullir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "bullo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "bulles", "accepts": { "vos": "bullís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "bulle" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "bullimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "bullís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "bullen" },

          // Pretérito indefinido (3ª personas con cambio)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "bullí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "bulliste", "accepts": { "vos": "bulliste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "bulló" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "bullimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "bullisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "bulleron" },

          // Presente subjuntivo
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "bulla" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "bullas", "accepts": { "vos": "bullas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "bulla" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "bullamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "bulláis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "bullan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "bullir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "bullendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "bullido" }
        ]
      }
    ]
  },

  // O_U_GER_IR: engullir
  {
    "id": "engullir_priority",
    "lemma": "engullir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "engullo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "engulles", "accepts": { "vos": "engullís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "engulle" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "engullimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "engullís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "engullen" },

          // Pretérito indefinido (3ª personas con cambio)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "engullí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "engulliste", "accepts": { "vos": "engulliste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "engulló" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "engullimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "engullisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "engulleron" },

          // Presente subjuntivo
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "engulla" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "engullas", "accepts": { "vos": "engullas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "engulla" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "engullamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "engulláis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "engullan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "engullir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "engullendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "engullido" }
        ]
      }
    ]
  },

  // O_U_GER_IR: zambullir
  {
    "id": "zambullir_priority",
    "lemma": "zambullir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "zambullo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "zambulles", "accepts": { "vos": "zambullís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "zambulle" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "zambullimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "zambullís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "zambullen" },

          // Pretérito indefinido (3ª personas con cambio)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "zambullí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "zambulliste", "accepts": { "vos": "zambulliste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "zambulló" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "zambullimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "zambullisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "zambulleron" },

          // Presente subjuntivo
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "zambulla" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "zambullas", "accepts": { "vos": "zambullas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "zambulla" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "zambullamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "zambulláis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "zambullan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "zambullir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "zambullendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "zambullido" }
        ]
      }
    ]
  },

  // GU_DROP: argüir (pérdida de u en 1ª persona)
  {
    "id": "arguir_priority",
    "lemma": "argüir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (pérdida de u en 1ª persona)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "arguyo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "arguyes", "accepts": { "vos": "argüís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "arguye" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "argüimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "argüís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "arguyen" },

          // Pretérito indefinido (i→y en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "argüí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "argüiste", "accepts": { "vos": "argüiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "arguyó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "argüimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "argüisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "arguyeron" },

          // Presente subjuntivo (pérdida de u)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "arguya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "arguyas", "accepts": { "vos": "arguyas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "arguya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "arguyamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "arguyáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "arguyan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "argüir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "arguyendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "argüido" }
        ]
      }
    ]
  },

  // GU_DROP: erguir (pérdida de u, irregular en presente)  
  {
    "id": "erguir_priority",
    "lemma": "erguir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (e→i/ye + pérdida de u)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "yergo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "yergues", "accepts": { "vos": "erguís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "yergue" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "erguimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "erguís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "yerguen" },

          // Pretérito indefinido (e→i en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "erguí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "erguiste", "accepts": { "vos": "erguiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "irguió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "erguimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "erguisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "irguieron" },

          // Presente subjuntivo (e→i/ye)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "yerga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "yergas", "accepts": { "vos": "yergas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "yerga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "yergamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "yergáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "yergan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "erguir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "irguiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "erguido" }
        ]
      }
    ]
  },

  // PRET_SUPPL: estar (pretérito suppletivo: estuve)
  {
    "id": "estar_priority",
    "lemma": "estar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (irregular primera persona)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "estoy" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "estás", "accepts": { "vos": "estás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "está" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "estamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "estáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "están" },

          // Pretérito indefinido (suppletivo: estuve)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "estuve" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "estuviste", "accepts": { "vos": "estuviste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "estuvo" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "estuvimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "estuvisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "estuvieron" },

          // Presente subjuntivo (basado en estoy)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "esté" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "estés", "accepts": { "vos": "estés" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "esté" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "estemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "estéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "estén" },

          // Subjuntivo imperfecto (basado en estuvieron)
          { "mood": "subjunctive", "tense": "subjImpf", "person": "1s", "value": "estuviera" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "2s_tu", "value": "estuvieras", "accepts": { "vos": "estuvieras" } },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "3s", "value": "estuviera" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "1p", "value": "estuviéramos" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "2p_vosotros", "value": "estuvierais" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "3p", "value": "estuvieran" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "estar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "estando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "estado" }
        ]
      }
    ]
  },

  // ORTH_GAR: apagar (cambio ortográfico g→gu)
  {
    "id": "apagar_priority",
    "lemma": "apagar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "apago" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "apagas", "accepts": { "vos": "apagás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "apaga" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "apagamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "apagáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "apagan" },

          // Pretérito indefinido (g→gu en 1ª persona)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "apagué" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "apagaste", "accepts": { "vos": "apagaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "apagó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "apagamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "apagasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "apagaron" },

          // Presente subjuntivo (g→gu en todas las personas)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "apague" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "apagues", "accepts": { "vos": "apagues" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "apague" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "apaguemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "apaguéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "apaguen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "apagar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "apagando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "apagado" }
        ]
      }
    ]
  },

  // ORTH_GAR: cargar (cambio ortográfico g→gu)
  {
    "id": "cargar_priority",
    "lemma": "cargar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "cargo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "cargas", "accepts": { "vos": "cargás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "carga" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "cargamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "cargáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "cargan" },

          // Pretérito indefinido (g→gu en 1ª persona)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "cargué" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "cargaste", "accepts": { "vos": "cargaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "cargó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "cargamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "cargasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "cargaron" },

          // Presente subjuntivo (g→gu en todas las personas)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "cargue" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "cargues", "accepts": { "vos": "cargues" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "cargue" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "carguemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "carguéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "carguen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "cargar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "cargando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "cargado" }
        ]
      }
    ]
  },

  // ORTH_GAR: navegar (cambio ortográfico g→gu)
  {
    "id": "navegar_priority",
    "lemma": "navegar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "navego" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "navegas", "accepts": { "vos": "navegás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "navega" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "navegamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "navegáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "navegan" },

          // Pretérito indefinido (g→gu en 1ª persona)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "navegué" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "navegaste", "accepts": { "vos": "navegaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "navegó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "navegamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "navegasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "navegaron" },

          // Presente subjuntivo (g→gu en todas las personas)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "navegue" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "navegues", "accepts": { "vos": "navegues" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "navegue" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "naveguemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "naveguéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "naveguen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "navegar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "navegando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "navegado" }
        ]
      }
    ]
  },

  // PRET_UV: obtener (pretérito fuerte -uv-)
  {
    "id": "obtener_priority",
    "lemma": "obtener",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (g-verb + diptongación e→ie)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "obtengo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "obtienes", "accepts": { "vos": "obtenés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "obtiene" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "obtenemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "obtenéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "obtienen" },

          // Pretérito indefinido (pretérito fuerte -uv-)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "obtuve" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "obtuviste", "accepts": { "vos": "obtuviste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "obtuvo" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "obtuvimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "obtuvisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "obtuvieron" },

          // Presente subjuntivo (basado en obtengo)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "obtenga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "obtengas", "accepts": { "vos": "obtengas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "obtenga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "obtengamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "obtengáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "obtengan" },

          // Condicional (radical irregular)
          { "mood": "conditional", "tense": "cond", "person": "1s", "value": "obtendría" },
          { "mood": "conditional", "tense": "cond", "person": "2s_tu", "value": "obtendrías", "accepts": { "vos": "obtendrías" } },
          { "mood": "conditional", "tense": "cond", "person": "3s", "value": "obtendría" },
          { "mood": "conditional", "tense": "cond", "person": "1p", "value": "obtendríamos" },
          { "mood": "conditional", "tense": "cond", "person": "2p_vosotros", "value": "obtendríais" },
          { "mood": "conditional", "tense": "cond", "person": "3p", "value": "obtendrían" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "obtener" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "obteniendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "obtenido" }
        ]
      }
    ]
  },

  // PRET_UV: retener (pretérito fuerte -uv-)
  {
    "id": "retener_priority",
    "lemma": "retener",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (g-verb + diptongación e→ie)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "retengo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "retienes", "accepts": { "vos": "retenés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "retiene" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "retenemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "retenéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "retienen" },

          // Pretérito indefinido (pretérito fuerte -uv-)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "retuve" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "retuviste", "accepts": { "vos": "retuviste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "retuvo" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "retuvimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "retuvisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "retuvieron" },

          // Presente subjuntivo (basado en retengo)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "retenga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "retengas", "accepts": { "vos": "retengas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "retenga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "retengamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "retengáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "retengan" },

          // Condicional (radical irregular)
          { "mood": "conditional", "tense": "cond", "person": "1s", "value": "retendría" },
          { "mood": "conditional", "tense": "cond", "person": "2s_tu", "value": "retendrías", "accepts": { "vos": "retendrías" } },
          { "mood": "conditional", "tense": "cond", "person": "3s", "value": "retendría" },
          { "mood": "conditional", "tense": "cond", "person": "1p", "value": "retendríamos" },
          { "mood": "conditional", "tense": "cond", "person": "2p_vosotros", "value": "retendríais" },
          { "mood": "conditional", "tense": "cond", "person": "3p", "value": "retendrían" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "retener" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "reteniendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "retenido" }
        ]
      }
    ]
  },

  // PRET_UV: detener (pretérito fuerte -uv-)
  {
    "id": "detener_priority",
    "lemma": "detener",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (g-verb + diptongación e→ie)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "detengo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "detienes", "accepts": { "vos": "detenés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "detiene" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "detenemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "detenéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "detienen" },

          // Pretérito indefinido (pretérito fuerte -uv-)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "detuve" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "detuviste", "accepts": { "vos": "detuviste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "detuvo" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "detuvimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "detuvisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "detuvieron" },

          // Presente subjuntivo (basado en detengo)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "detenga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "detengas", "accepts": { "vos": "detengas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "detenga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "detengamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "detengáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "detengan" },

          // Condicional (radical irregular)
          { "mood": "conditional", "tense": "cond", "person": "1s", "value": "detendría" },
          { "mood": "conditional", "tense": "cond", "person": "2s_tu", "value": "detendrías", "accepts": { "vos": "detendrías" } },
          { "mood": "conditional", "tense": "cond", "person": "3s", "value": "detendría" },
          { "mood": "conditional", "tense": "cond", "person": "1p", "value": "detendríamos" },
          { "mood": "conditional", "tense": "cond", "person": "2p_vosotros", "value": "detendríais" },
          { "mood": "conditional", "tense": "cond", "person": "3p", "value": "detendrían" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "detener" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "deteniendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "detenido" }
        ]
      }
    ]
  },

  // PRET_U: componer (pretérito fuerte -u-)
  {
    "id": "componer_priority",
    "lemma": "componer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (g-verb)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "compongo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "compones", "accepts": { "vos": "componés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "compone" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "componemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "componéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "componen" },

          // Pretérito indefinido (pretérito fuerte -u-)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "compuse" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "compusiste", "accepts": { "vos": "compusiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "compuso" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "compusimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "compusisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "compusieron" },

          // Presente subjuntivo (basado en compongo)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "componga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "compongas", "accepts": { "vos": "compongas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "componga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "compongamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "compongáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "compongan" },

          // Condicional (radical irregular)
          { "mood": "conditional", "tense": "cond", "person": "1s", "value": "compondría" },
          { "mood": "conditional", "tense": "cond", "person": "2s_tu", "value": "compondrías", "accepts": { "vos": "compondrías" } },
          { "mood": "conditional", "tense": "cond", "person": "3s", "value": "compondría" },
          { "mood": "conditional", "tense": "cond", "person": "1p", "value": "compondríamos" },
          { "mood": "conditional", "tense": "cond", "person": "2p_vosotros", "value": "compondríais" },
          { "mood": "conditional", "tense": "cond", "person": "3p", "value": "compondrían" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "componer" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "componiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "compuesto" }
        ]
      }
    ]
  },

  // PRET_U: proponer (pretérito fuerte -u-)
  {
    "id": "proponer_priority",
    "lemma": "proponer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (g-verb)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "propongo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "propones", "accepts": { "vos": "proponés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "propone" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "proponemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "proponéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "proponen" },

          // Pretérito indefinido (pretérito fuerte -u-)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "propuse" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "propusiste", "accepts": { "vos": "propusiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "propuso" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "propusimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "propusisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "propusieron" },

          // Presente subjuntivo (basado en propongo)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "proponga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "propongas", "accepts": { "vos": "propongas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "proponga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "propongamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "propongáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "propongan" },

          // Condicional (radical irregular)
          { "mood": "conditional", "tense": "cond", "person": "1s", "value": "propondría" },
          { "mood": "conditional", "tense": "cond", "person": "2s_tu", "value": "propondrías", "accepts": { "vos": "propondrías" } },
          { "mood": "conditional", "tense": "cond", "person": "3s", "value": "propondría" },
          { "mood": "conditional", "tense": "cond", "person": "1p", "value": "propondríamos" },
          { "mood": "conditional", "tense": "cond", "person": "2p_vosotros", "value": "propondríais" },
          { "mood": "conditional", "tense": "cond", "person": "3p", "value": "propondrían" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "proponer" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "proponiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "propuesto" }
        ]
      }
    ]
  },

  {
    "id": "usar_priority",
    "lemma": "usar",
    "type": "regular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "uso" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "usas", "accepts": { "vos": "usás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "usa" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "usamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "usáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "usan" },

          // Pretérito indefinido (regular)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "usé" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "usaste", "accepts": { "vos": "usaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "usó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "usamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "usasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "usaron" },

          // Presente subjuntivo (regular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "use" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "uses", "accepts": { "vos": "uses" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "use" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "usemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "uséis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "usen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "usar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "usando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "usado" }
        ]
      }
    ]
  },

  {
    "id": "entender_priority",
    "lemma": "entender",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (diptongación e→ie)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "entiendo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "entiendes", "accepts": { "vos": "entendés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "entiende" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "entendemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "entendéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "entienden" },

          // Pretérito indefinido (regular)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "entendí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "entendiste", "accepts": { "vos": "entendiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "entendió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "entendimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "entendisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "entendieron" },

          // Presente subjuntivo (diptongación e→ie)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "entienda" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "entiendas", "accepts": { "vos": "entiendas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "entienda" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "entendamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "entendáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "entiendan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "entender" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "entendiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "entendido" }
        ]
      }
    ]
  },

  {
    "id": "averiguar_priority",
    "lemma": "averiguar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "averiguo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "averiguas", "accepts": { "vos": "averiguás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "averigua" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "averiguamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "averiguáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "averiguan" },

          // Pretérito indefinido (guar → güé)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "averigüé" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "averiguaste", "accepts": { "vos": "averiguaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "averiguó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "averiguamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "averiguasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "averiguaron" },

          // Presente subjuntivo (guar → güe)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "averigüe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "averigües", "accepts": { "vos": "averigües" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "averigüe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "averigüemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "averigüéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "averigüen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "averiguar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "averiguando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "averiguado" }
        ]
      }
    ]
  },

  {
    "id": "apaciguar_priority",
    "lemma": "apaciguar",
    "type": "irregular", 
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "apaciguo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "apaciguas", "accepts": { "vos": "apaciguás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "apacigua" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "apaciguamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "apaciguáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "apaciguan" },

          // Pretérito indefinido (guar → güé)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "apacigüé" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "apaciguaste", "accepts": { "vos": "apaciguaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "apaciguó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "apaciguamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "apaciguasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "apaciguaron" },

          // Presente subjuntivo (guar → güe)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "apacigüe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "apacigües", "accepts": { "vos": "apacigües" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "apacigüe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "apacigüemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "apacigüéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "apacigüen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "apaciguar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "apaciguando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "apaciguado" }
        ]
      }
    ]
  },

  {
    "id": "aguar_priority",
    "lemma": "aguar", 
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "aguo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "aguas", "accepts": { "vos": "aguás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "agua" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "aguamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "aguáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "aguan" },

          // Pretérito indefinido (guar → güé)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "agüé" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "aguaste", "accepts": { "vos": "aguaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "aguó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "aguamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "aguasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "aguaron" },

          // Presente subjuntivo (guar → güe)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "agüe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "agües", "accepts": { "vos": "agües" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "agüe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "agüemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "agüéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "agüen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "aguar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "aguando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "aguado" }
        ]
      }
    ]
  },

  {
    "id": "continuar_priority",
    "lemma": "continuar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (uar → úo, úa)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "continúo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "continúas", "accepts": { "vos": "continuás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "continúa" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "continuamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "continuáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "continúan" },

          // Pretérito indefinido (regular)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "continué" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "continuaste", "accepts": { "vos": "continuaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "continuó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "continuamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "continuasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "continuaron" },

          // Presente subjuntivo (uar → úe)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "continúe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "continúes", "accepts": { "vos": "continúes" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "continúe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "continuemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "continuéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "continúen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "continuar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "continuando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "continuado" }
        ]
      }
    ]
  },

  {
    "id": "actuar_priority",
    "lemma": "actuar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (uar → úo, úa)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "actúo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "actúas", "accepts": { "vos": "actuás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "actúa" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "actuamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "actuáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "actúan" },

          // Pretérito indefinido (regular)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "actué" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "actuaste", "accepts": { "vos": "actuaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "actuó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "actuamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "actuasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "actuaron" },

          // Presente subjuntivo (uar → úe)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "actúe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "actúes", "accepts": { "vos": "actúes" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "actúe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "actuemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "actuéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "actúen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "actuar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "actuando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "actuado" }
        ]
      }
    ]
  },

  {
    "id": "evaluar_priority",
    "lemma": "evaluar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (uar → úo, úa)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "evalúo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "evalúas", "accepts": { "vos": "evaluás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "evalúa" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "evaluamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "evaluáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "evalúan" },

          // Pretérito indefinido (regular)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "evalué" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "evaluaste", "accepts": { "vos": "evaluaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "evaluó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "evaluamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "evaluasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "evaluaron" },

          // Presente subjuntivo (uar → úe)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "evalúe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "evalúes", "accepts": { "vos": "evalúes" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "evalúe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "evaluemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "evaluéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "evalúen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "evaluar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "evaluando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "evaluado" }
        ]
      }
    ]
  },

  {
    "id": "enviar_priority",
    "lemma": "enviar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (iar → ío, ía)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "envío" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "envías", "accepts": { "vos": "enviás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "envía" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "enviamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "enviáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "envían" },

          // Pretérito indefinido (regular)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "envié" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "enviaste", "accepts": { "vos": "enviaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "envió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "enviamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "enviasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "enviaron" },

          // Presente subjuntivo (iar → íe)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "envíe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "envíes", "accepts": { "vos": "envíes" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "envíe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "enviemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "enviéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "envíen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "enviar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "enviando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "enviado" }
        ]
      }
    ]
  },

  {
    "id": "confiar_priority",
    "lemma": "confiar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (iar → ío, ía)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "confío" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "confías", "accepts": { "vos": "confiás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "confía" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "confiamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "confiáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "confían" },

          // Pretérito indefinido (regular)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "confié" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "confiaste", "accepts": { "vos": "confiaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "confió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "confiamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "confiasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "confiaron" },

          // Presente subjuntivo (iar → íe)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "confíe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "confíes", "accepts": { "vos": "confíes" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "confíe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "confiemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "confiéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "confíen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "confiar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "confiando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "confiado" }
        ]
      }
    ]
  },

  {
    "id": "guiar_priority",
    "lemma": "guiar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (iar → ío, ía)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "guío" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "guías", "accepts": { "vos": "guiás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "guía" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "guiamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "guiáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "guían" },

          // Pretérito indefinido (regular)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "guié" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "guiaste", "accepts": { "vos": "guiaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "guió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "guiamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "guiasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "guiaron" },

          // Presente subjuntivo (iar → íe)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "guíe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "guíes", "accepts": { "vos": "guíes" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "guíe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "guiemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "guiéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "guíen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "guiar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "guiando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "guiado" }
        ]
      }
    ]
  },

  {
    "id": "prohibir_priority",
    "lemma": "prohibir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (cambio de acento: prohíbo)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "prohíbo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "prohíbes", "accepts": { "vos": "prohibís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "prohíbe" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "prohibimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "prohibís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "prohíben" },

          // Pretérito indefinido (regular)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "prohibí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "prohibiste", "accepts": { "vos": "prohibiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "prohibió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "prohibimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "prohibisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "prohibieron" },

          // Presente subjuntivo (prohíba)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "prohíba" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "prohíbas", "accepts": { "vos": "prohíbas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "prohíba" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "prohibamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "prohibáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "prohíban" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "prohibir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "prohibiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "prohibido" }
        ]
      }
    ]
  },

  {
    "id": "reunir_priority",
    "lemma": "reunir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (cambio de acento: reúno)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "reúno" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "reúnes", "accepts": { "vos": "reunís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "reúne" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "reunimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "reunís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "reúnen" },

          // Pretérito indefinido (regular)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "reuní" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "reuniste", "accepts": { "vos": "reuniste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "reunió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "reunimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "reunisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "reunieron" },

          // Presente subjuntivo (reúna)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "reúna" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "reúnas", "accepts": { "vos": "reúnas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "reúna" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "reunamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "reunáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "reúnan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "reunir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "reuniendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "reunido" }
        ]
      }
    ]
  },

  {
    "id": "aislar_priority",
    "lemma": "aislar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (cambio de acento: aíslo)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "aíslo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "aíslas", "accepts": { "vos": "aislás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "aísla" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "aislamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "aisláis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "aíslan" },

          // Pretérito indefinido (regular)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "aislé" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "aislaste", "accepts": { "vos": "aislaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "aisló" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "aislamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "aislasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "aislaron" },

          // Presente subjuntivo (aísle)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "aísle" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "aísles", "accepts": { "vos": "aísles" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "aísle" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "aislemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "aisléis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "aíslen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "aislar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "aislando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "aislado" }
        ]
      }
    ]
  },

  {
    "id": "fraguar_priority",
    "lemma": "fraguar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (u→ue + diéresis en subjuntivo)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "fraguo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "fraguas", "accepts": { "vos": "fraguás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "fragua" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "fraguamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "fraguáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "fraguan" },

          // Pretérito indefinido (guar → güé)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "fragüé" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "fraguaste", "accepts": { "vos": "fraguaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "fraguó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "fraguamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "fraguasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "fraguaron" },

          // Presente subjuntivo (guar → güe)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "fragüe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "fragües", "accepts": { "vos": "fragües" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "fragüe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "fragüemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "fragüéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "fragüen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "fraguar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "fraguando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "fraguado" }
        ]
      }
    ]
  },

  {
    "id": "menguar_priority",
    "lemma": "menguar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (u→ue + diéresis en subjuntivo)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "menguo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "menguas", "accepts": { "vos": "menguás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "mengua" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "menguamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "menguáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "menguan" },

          // Pretérito indefinido (guar → güé)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "mengüé" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "menguaste", "accepts": { "vos": "menguaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "menguó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "menguamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "menguasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "menguaron" },

          // Presente subjuntivo (guar → güe)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "mengüe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "mengües", "accepts": { "vos": "mengües" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "mengüe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "mengüemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "mengüéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "mengüen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "menguar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "menguando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "menguado" }
        ]
      }
    ]
  },

  {
    "id": "conseguir_priority",
    "lemma": "conseguir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (pérdida de u: -guir → -go)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "consigo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "consigues", "accepts": { "vos": "conseguís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "consigue" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "conseguimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "conseguís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "consiguen" },

          // Pretérito indefinido (e→i en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "conseguí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "conseguiste", "accepts": { "vos": "conseguiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "consiguió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "conseguimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "conseguisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "consiguieron" },

          // Presente subjuntivo (basado en consigo)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "consiga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "consigas", "accepts": { "vos": "consigas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "consiga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "consigamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "consigáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "consigan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "conseguir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "consiguiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "conseguido" }
        ]
      }
    ]
  },

  {
    "id": "perseguir_priority",
    "lemma": "perseguir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (pérdida de u: -guir → -go)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "persigo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "persigues", "accepts": { "vos": "perseguís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "persigue" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "perseguimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "perseguís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "persiguen" },

          // Pretérito indefinido (e→i en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "perseguí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "perseguiste", "accepts": { "vos": "perseguiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "persiguió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "perseguimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "perseguisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "persiguieron" },

          // Presente subjuntivo (basado en persigo)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "persiga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "persigas", "accepts": { "vos": "persigas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "persiga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "persigamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "persigáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "persigan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "perseguir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "persiguiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "perseguido" }
        ]
      }
    ]
  },

  {
    "id": "podrir_priority",
    "lemma": "podrir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (o→ue diptongación)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "pudro" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "pudres", "accepts": { "vos": "podrís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "pudre" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "podrimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "podrís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "pudren" },

          // Pretérito indefinido (o→u en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "podrí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "podriste", "accepts": { "vos": "podriste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "pudrió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "podrimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "podristeis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "pudrieron" },

          // Presente subjuntivo (o→ue)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "pudra" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "pudras", "accepts": { "vos": "pudras" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "pudra" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "podramos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "podráis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "pudran" },
          
          // Formas no conjugadas (gerundio con u)
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "podrir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "pudriendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "podrido" }
        ]
      }
    ]
  },

  {
    "id": "tocar_priority",
    "lemma": "tocar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "toco" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "tocas", "accepts": { "vos": "tocás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "toca" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "tocamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "tocáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "tocan" },

          // Pretérito indefinido (c→qu)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "toqué" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "tocaste", "accepts": { "vos": "tocaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "tocó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "tocamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "tocasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "tocaron" },

          // Presente subjuntivo (c→qu)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "toque" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "toques", "accepts": { "vos": "toques" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "toque" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "toquemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "toquéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "toquen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "tocar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "tocando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "tocado" }
        ]
      }
    ]
  },

  {
    "id": "practicar_priority",
    "lemma": "practicar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "practico" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "practicas", "accepts": { "vos": "practicás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "practica" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "practicamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "practicáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "practican" },

          // Pretérito indefinido (c→qu)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "practiqué" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "practicaste", "accepts": { "vos": "practicaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "practicó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "practicamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "practicasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "practicaron" },

          // Presente subjuntivo (c→qu)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "practique" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "practiques", "accepts": { "vos": "practiques" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "practique" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "practiquemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "practiquéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "practiquen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "practicar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "practicando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "practicado" }
        ]
      }
    ]
  },

  {
    "id": "explicar_priority",
    "lemma": "explicar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "explico" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "explicas", "accepts": { "vos": "explicás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "explica" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "explicamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "explicáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "explican" },

          // Pretérito indefinido (c→qu)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "expliqué" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "explicaste", "accepts": { "vos": "explicaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "explicó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "explicamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "explicasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "explicaron" },

          // Presente subjuntivo (c→qu)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "explique" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "expliques", "accepts": { "vos": "expliques" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "explique" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "expliquemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "expliquéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "expliquen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "explicar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "explicando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "explicado" }
        ]
      }
    ]
  },

  {
    "id": "tener_imperative_priority",
    "lemma": "tener",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (irregular yo + diptongación)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "tengo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "tienes", "accepts": { "vos": "tenés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "tiene" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "tenemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "tenéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "tienen" },

          // Pretérito indefinido (fuerte -uv)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "tuve" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "tuviste", "accepts": { "vos": "tuviste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "tuvo" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "tuvimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "tuvisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "tuvieron" },

          // Futuro irregular
          { "mood": "indicative", "tense": "fut", "person": "1s", "value": "tendré" },
          { "mood": "indicative", "tense": "fut", "person": "2s_tu", "value": "tendrás", "accepts": { "vos": "tendrás" } },
          { "mood": "indicative", "tense": "fut", "person": "3s", "value": "tendrá" },
          { "mood": "indicative", "tense": "fut", "person": "1p", "value": "tendremos" },
          { "mood": "indicative", "tense": "fut", "person": "2p_vosotros", "value": "tendréis" },
          { "mood": "indicative", "tense": "fut", "person": "3p", "value": "tendrán" },

          // Condicional irregular
          { "mood": "conditional", "tense": "cond", "person": "1s", "value": "tendría" },
          { "mood": "conditional", "tense": "cond", "person": "2s_tu", "value": "tendrías", "accepts": { "vos": "tendrías" } },
          { "mood": "conditional", "tense": "cond", "person": "3s", "value": "tendría" },
          { "mood": "conditional", "tense": "cond", "person": "1p", "value": "tendríamos" },
          { "mood": "conditional", "tense": "cond", "person": "2p_vosotros", "value": "tendríais" },
          { "mood": "conditional", "tense": "cond", "person": "3p", "value": "tendrían" },

          // Presente subjuntivo (basado en tengo)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "tenga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "tengas", "accepts": { "vos": "tengas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "tenga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "tengamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "tengáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "tengan" },

          // Imperativo irregular
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "ten" },
          { "mood": "imperative", "tense": "impAff", "person": "2s_vos", "value": "tené" },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "tenga" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "tengamos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "tened" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "tengan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "tener" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "teniendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "tenido" }
        ]
      }
    ]
  },

  {
    "id": "poner_conditional_priority", 
    "lemma": "poner",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (irregular yo)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "pongo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "pones", "accepts": { "vos": "ponés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "pone" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "ponemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "ponéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "ponen" },

          // Pretérito indefinido (fuerte -u)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "puse" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "pusiste", "accepts": { "vos": "pusiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "puso" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "pusimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "pusisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "pusieron" },

          // Futuro irregular
          { "mood": "indicative", "tense": "fut", "person": "1s", "value": "pondré" },
          { "mood": "indicative", "tense": "fut", "person": "2s_tu", "value": "pondrás", "accepts": { "vos": "pondrás" } },
          { "mood": "indicative", "tense": "fut", "person": "3s", "value": "pondrá" },
          { "mood": "indicative", "tense": "fut", "person": "1p", "value": "pondremos" },
          { "mood": "indicative", "tense": "fut", "person": "2p_vosotros", "value": "pondréis" },
          { "mood": "indicative", "tense": "fut", "person": "3p", "value": "pondrán" },

          // Condicional irregular
          { "mood": "conditional", "tense": "cond", "person": "1s", "value": "pondría" },
          { "mood": "conditional", "tense": "cond", "person": "2s_tu", "value": "pondrías", "accepts": { "vos": "pondrías" } },
          { "mood": "conditional", "tense": "cond", "person": "3s", "value": "pondría" },
          { "mood": "conditional", "tense": "cond", "person": "1p", "value": "pondríamos" },
          { "mood": "conditional", "tense": "cond", "person": "2p_vosotros", "value": "pondríais" },
          { "mood": "conditional", "tense": "cond", "person": "3p", "value": "pondrían" },

          // Presente subjuntivo (basado en pongo)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "ponga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "pongas", "accepts": { "vos": "pongas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "ponga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "pongamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "pongáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "pongan" },

          // Imperativo irregular
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "pon" },
          { "mood": "imperative", "tense": "impAff", "person": "2s_vos", "value": "poné" },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "ponga" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "pongamos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "poned" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "pongan" },

          // Formas no conjugadas (participio irregular)
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "poner" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "poniendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "puesto" }
        ]
      }
    ]
  },

  {
    "id": "ir_gerund_priority",
    "lemma": "ir",
    "type": "irregular", 
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (completamente irregular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "voy" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "vas", "accepts": { "vos": "vas" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "va" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "vamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "vais" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "van" },

          // Pretérito indefinido (supletivo)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "fui" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "fuiste", "accepts": { "vos": "fuiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "fue" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "fuimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "fuisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "fueron" },

          // Presente subjuntivo (irregular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "vaya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "vayas", "accepts": { "vos": "vayas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "vaya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "vayamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "vayáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "vayan" },

          // Imperativo irregular
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "ve" },
          { "mood": "imperative", "tense": "impAff", "person": "2s_vos", "value": "andá" },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "vaya" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "vamos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "id" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "vayan" },
          
          // Formas no conjugadas (gerundio irregular)
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "ir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "yendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "ido" }
        ]
      }
    ]
  },

  {
    "id": "hacer_participle_priority",
    "lemma": "hacer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (irregular yo)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "hago" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "haces", "accepts": { "vos": "hacés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "hace" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "hacemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "hacéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "hacen" },

          // Pretérito indefinido (fuerte -i)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "hice" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "hiciste", "accepts": { "vos": "hiciste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "hizo" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "hicimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "hicisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "hicieron" },

          // Futuro irregular
          { "mood": "indicative", "tense": "fut", "person": "1s", "value": "haré" },
          { "mood": "indicative", "tense": "fut", "person": "2s_tu", "value": "harás", "accepts": { "vos": "harás" } },
          { "mood": "indicative", "tense": "fut", "person": "3s", "value": "hará" },
          { "mood": "indicative", "tense": "fut", "person": "1p", "value": "haremos" },
          { "mood": "indicative", "tense": "fut", "person": "2p_vosotros", "value": "haréis" },
          { "mood": "indicative", "tense": "fut", "person": "3p", "value": "harán" },

          // Condicional irregular
          { "mood": "conditional", "tense": "cond", "person": "1s", "value": "haría" },
          { "mood": "conditional", "tense": "cond", "person": "2s_tu", "value": "harías", "accepts": { "vos": "harías" } },
          { "mood": "conditional", "tense": "cond", "person": "3s", "value": "haría" },
          { "mood": "conditional", "tense": "cond", "person": "1p", "value": "haríamos" },
          { "mood": "conditional", "tense": "cond", "person": "2p_vosotros", "value": "haríais" },
          { "mood": "conditional", "tense": "cond", "person": "3p", "value": "harían" },

          // Presente subjuntivo (basado en hago)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "haga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "hagas", "accepts": { "vos": "hagas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "haga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "hagamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "hagáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "hagan" },

          // Imperativo irregular
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "haz" },
          { "mood": "imperative", "tense": "impAff", "person": "2s_vos", "value": "hacé" },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "haga" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "hagamos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "haced" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "hagan" },

          // Formas no conjugadas (participio irregular)
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "hacer" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "haciendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "hecho" }
        ]
      }
    ]
  },

  {
    "id": "freir_priority",
    "lemma": "freír",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (e→i)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "frío" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "fríes", "accepts": { "vos": "freís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "fríe" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "freímos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "freís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "fríen" },

          // Pretérito indefinido (e→i en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "freí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "freíste", "accepts": { "vos": "freíste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "frió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "freímos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "freísteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "frieron" },

          // Presente subjuntivo (e→i)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "fría" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "frías", "accepts": { "vos": "frías" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "fría" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "friamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "friáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "frían" },
          
          // Formas no conjugadas (doble participio)
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "freír" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "friendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "frito" }
        ]
      }
    ]
  },

  {
    "id": "soler_priority",
    "lemma": "soler",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (o→ue, defectivo)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "suelo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "sueles", "accepts": { "vos": "solés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "suele" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "solemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "soléis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "suelen" },

          // Pretérito imperfecto (las únicas formas en pasado disponibles)
          { "mood": "indicative", "tense": "impf", "person": "1s", "value": "solía" },
          { "mood": "indicative", "tense": "impf", "person": "2s_tu", "value": "solías", "accepts": { "vos": "solías" } },
          { "mood": "indicative", "tense": "impf", "person": "3s", "value": "solía" },
          { "mood": "indicative", "tense": "impf", "person": "1p", "value": "solíamos" },
          { "mood": "indicative", "tense": "impf", "person": "2p_vosotros", "value": "solíais" },
          { "mood": "indicative", "tense": "impf", "person": "3p", "value": "solían" },

          // Presente subjuntivo (o→ue)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "suela" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "suelas", "accepts": { "vos": "suelas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "suela" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "solamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "soláis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "suelan" },
          
          // Formas no conjugadas (limitadas)
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "soler" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "soliendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "solido" }
        ]
      }
    ]
  },
  
  // Se pueden agregar más verbos aquí según necesidades

  // ===== IRREG_GERUNDS: Gerundios irregulares críticos =====
  {
    "id": "poder_priority",
    "lemma": "poder",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (diptongación o→ue)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "puedo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "puedes", "accepts": { "vos": "podés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "puede" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "podemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "podéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "pueden" },

          // Pretérito indefinido (fuerte -u-)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "pude" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "pudiste", "accepts": { "vos": "pudiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "pudo" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "pudimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "pudisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "pudieron" },

          // Presente subjuntivo (diptongación o→ue)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "pueda" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "puedas", "accepts": { "vos": "puedas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "pueda" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "podamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "podáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "puedan" },

          // Condicional irregular
          { "mood": "conditional", "tense": "cond", "person": "1s", "value": "podría" },
          { "mood": "conditional", "tense": "cond", "person": "2s_tu", "value": "podrías", "accepts": { "vos": "podrías" } },
          { "mood": "conditional", "tense": "cond", "person": "3s", "value": "podría" },
          { "mood": "conditional", "tense": "cond", "person": "1p", "value": "podríamos" },
          { "mood": "conditional", "tense": "cond", "person": "2p_vosotros", "value": "podríais" },
          { "mood": "conditional", "tense": "cond", "person": "3p", "value": "podrían" },

          // Futuro irregular
          { "mood": "indicative", "tense": "fut", "person": "1s", "value": "podré" },
          { "mood": "indicative", "tense": "fut", "person": "2s_tu", "value": "podrás", "accepts": { "vos": "podrás" } },
          { "mood": "indicative", "tense": "fut", "person": "3s", "value": "podrá" },
          { "mood": "indicative", "tense": "fut", "person": "1p", "value": "podremos" },
          { "mood": "indicative", "tense": "fut", "person": "2p_vosotros", "value": "podréis" },
          { "mood": "indicative", "tense": "fut", "person": "3p", "value": "podrán" },
          
          // Formas no conjugadas (GERUNDIO IRREGULAR)
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "poder" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "pudiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "podido" }
        ]
      }
    ]
  },

  {
    "id": "venir_priority",
    "lemma": "venir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (irregular yo + diptongación)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "vengo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "vienes", "accepts": { "vos": "venís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "viene" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "venimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "venís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "vienen" },

          // Pretérito indefinido (fuerte -i-)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "vine" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "viniste", "accepts": { "vos": "viniste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "vino" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "vinimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "vinisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "vinieron" },

          // Presente subjuntivo (irregular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "venga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "vengas", "accepts": { "vos": "vengas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "venga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "vengamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "vengáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "vengan" },

          // Imperativo irregular
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "ven" },
          { "mood": "imperative", "tense": "impAff", "person": "2s_vos", "value": "vení" },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "venga" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "vengamos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "venid" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "vengan" },

          // Condicional irregular
          { "mood": "conditional", "tense": "cond", "person": "1s", "value": "vendría" },
          { "mood": "conditional", "tense": "cond", "person": "2s_tu", "value": "vendrías", "accepts": { "vos": "vendrías" } },
          { "mood": "conditional", "tense": "cond", "person": "3s", "value": "vendría" },
          { "mood": "conditional", "tense": "cond", "person": "1p", "value": "vendríamos" },
          { "mood": "conditional", "tense": "cond", "person": "2p_vosotros", "value": "vendríais" },
          { "mood": "conditional", "tense": "cond", "person": "3p", "value": "vendrían" },

          // Futuro irregular
          { "mood": "indicative", "tense": "fut", "person": "1s", "value": "vendré" },
          { "mood": "indicative", "tense": "fut", "person": "2s_tu", "value": "vendrás", "accepts": { "vos": "vendrás" } },
          { "mood": "indicative", "tense": "fut", "person": "3s", "value": "vendrá" },
          { "mood": "indicative", "tense": "fut", "person": "1p", "value": "vendremos" },
          { "mood": "indicative", "tense": "fut", "person": "2p_vosotros", "value": "vendréis" },
          { "mood": "indicative", "tense": "fut", "person": "3p", "value": "vendrán" },
          
          // Formas no conjugadas (GERUNDIO IRREGULAR)
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "venir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "viniendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "venido" }
        ]
      }
    ]
  },

  {
    "id": "traer_priority",
    "lemma": "traer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (irregular yo)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "traigo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "traes", "accepts": { "vos": "traés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "trae" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "traemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "traéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "traen" },

          // Pretérito indefinido (fuerte -j-)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "traje" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "trajiste", "accepts": { "vos": "trajiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "trajo" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "trajimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "trajisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "trajeron" },

          // Presente subjuntivo (irregular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "traiga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "traigas", "accepts": { "vos": "traigas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "traiga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "traigamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "traigáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "traigan" },
          
          // Formas no conjugadas (GERUNDIO IRREGULAR)
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "traer" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "trayendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "traído" }
        ]
      }
    ]
  },

  // ===== DEFECTIVE_VERBS: Verbos defectivos críticos =====
  {
    "id": "abolir_priority",
    "lemma": "abolir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (solo 1p y 2p - formas sin hiato)
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "abolimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "abolís" },

          // Pretérito indefinido (completo)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "abolí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "aboliste", "accepts": { "vos": "aboliste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "abolió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "abolimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "abolisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "abolieron" },

          // Imperfecto (completo)
          { "mood": "indicative", "tense": "impf", "person": "1s", "value": "abolía" },
          { "mood": "indicative", "tense": "impf", "person": "2s_tu", "value": "abolías", "accepts": { "vos": "abolías" } },
          { "mood": "indicative", "tense": "impf", "person": "3s", "value": "abolía" },
          { "mood": "indicative", "tense": "impf", "person": "1p", "value": "abolíamos" },
          { "mood": "indicative", "tense": "impf", "person": "2p_vosotros", "value": "abolíais" },
          { "mood": "indicative", "tense": "impf", "person": "3p", "value": "abolían" },

          // Presente subjuntivo (solo 1p y 2p)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "abolamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "aboláis" },

          // Imperativo (solo formas disponibles)
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "abolamos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "abolid" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "abolir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "aboliendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "abolido" }
        ]
      }
    ]
  },

  {
    "id": "blandir_priority",
    "lemma": "blandir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (solo 1p y 2p - formas sin hiato)
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "blandimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "blandís" },

          // Pretérito indefinido (completo)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "blandí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "blandiste", "accepts": { "vos": "blandiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "blandió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "blandimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "blandisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "blandieron" },

          // Imperfecto (completo)
          { "mood": "indicative", "tense": "impf", "person": "1s", "value": "blandía" },
          { "mood": "indicative", "tense": "impf", "person": "2s_tu", "value": "blandías", "accepts": { "vos": "blandías" } },
          { "mood": "indicative", "tense": "impf", "person": "3s", "value": "blandía" },
          { "mood": "indicative", "tense": "impf", "person": "1p", "value": "blandíamos" },
          { "mood": "indicative", "tense": "impf", "person": "2p_vosotros", "value": "blandíais" },
          { "mood": "indicative", "tense": "impf", "person": "3p", "value": "blandían" },

          // Presente subjuntivo (solo 1p y 2p)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "blandamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "blandáis" },

          // Imperativo (solo formas disponibles)
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "blandamos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "blandid" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "blandir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "blandiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "blandido" }
        ]
      }
    ]
  },

  // ===== DOUBLE_PARTICIPLES: Doble participio críticos =====
  {
    "id": "imprimir_priority",
    "lemma": "imprimir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "imprimo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "imprimes", "accepts": { "vos": "imprimís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "imprime" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "imprimimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "imprimís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "imprimen" },

          // Pretérito indefinido (regular)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "imprimí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "imprimiste", "accepts": { "vos": "imprimiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "imprimió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "imprimimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "imprimisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "imprimieron" },

          // Presente subjuntivo (regular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "imprima" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "imprimas", "accepts": { "vos": "imprimas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "imprima" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "imprimamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "imprimáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "impriman" },
          
          // Formas no conjugadas (DOBLE PARTICIPIO)
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "imprimir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "imprimiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "impreso" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "imprimido" }
        ]
      }
    ]
  },

  {
    "id": "proveer_priority",
    "lemma": "proveer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "proveo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "provees", "accepts": { "vos": "proveés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "provee" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "proveemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "proveéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "proveen" },

          // Pretérito indefinido (hiato y→leyó)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "proveí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "proveíste", "accepts": { "vos": "proveíste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "proveyó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "proveímos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "proveísteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "proveyeron" },

          // Presente subjuntivo (regular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "provea" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "proveas", "accepts": { "vos": "proveas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "provea" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "proveamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "proveáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "provean" },
          
          // Formas no conjugadas (DOBLE PARTICIPIO)
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "proveer" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "proveyendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "provisto" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "proveído" }
        ]
      }
    ]
  },

  // ===== ORTH_GAR: Expansión de verbos -gar → -gu =====
  {
    "id": "entregar_priority",
    "lemma": "entregar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "entrego" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "entregas", "accepts": { "vos": "entregás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "entrega" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "entregamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "entregáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "entregan" },

          // Pretérito indefinido (cambio ortográfico g→gu)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "entregué" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "entregaste", "accepts": { "vos": "entregaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "entregó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "entregamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "entregasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "entregaron" },

          // Presente subjuntivo (cambio ortográfico g→gu)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "entregue" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "entregues", "accepts": { "vos": "entregues" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "entregue" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "entreguemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "entreguéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "entreguen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "entregar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "entregando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "entregado" }
        ]
      }
    ]
  },

  {
    "id": "obligar_priority",
    "lemma": "obligar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "obligo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "obligas", "accepts": { "vos": "obligás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "obliga" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "obligamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "obligáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "obligan" },

          // Pretérito indefinido (cambio ortográfico g→gu)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "obligué" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "obligaste", "accepts": { "vos": "obligaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "obligó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "obligamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "obligasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "obligaron" },

          // Presente subjuntivo (cambio ortográfico g→gu)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "obligue" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "obliques", "accepts": { "vos": "obliques" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "obligue" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "obliguemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "obliguéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "obliguen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "obligar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "obligando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "obligado" }
        ]
      }
    ]
  },

  // ===== DIPHT_U_UE: Expansión de diptongación u→ue =====
  {
    "id": "amuar_priority",
    "lemma": "amuar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (diptongación u→ue)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "amúo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "amúas", "accepts": { "vos": "amuás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "amúa" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "amuamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "amuáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "amúan" },

          // Pretérito indefinido (regular)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "amué" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "amuaste", "accepts": { "vos": "amuaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "amuó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "amuamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "amuasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "amuaron" },

          // Presente subjuntivo (diptongación u→ue)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "amúe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "amúes", "accepts": { "vos": "amúes" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "amúe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "amuemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "amuéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "amúen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "amuar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "amuando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "amuado" }
        ]
      }
    ]
  },

  {
    "id": "desaguar_priority",
    "lemma": "desaguar",
    "type": "irregular", 
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (diptongación u→ue)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "desaguo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "desaguas", "accepts": { "vos": "desaguás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "desagua" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "desaguamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "desaguáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "desaguan" },

          // Pretérito indefinido (cambio ortográfico gu→gü)  
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "desagüé" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "desaguaste", "accepts": { "vos": "desaguaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "desaguó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "desaguamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "desaguasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "desaguaron" },

          // Presente subjuntivo (diptongación u→ue + diéresis)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "desagüe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "desagües", "accepts": { "vos": "desagües" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "desagüe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "desaguemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "desaguéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "desagüen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "desaguar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "desaguando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "desaguado" }
        ]
      }
    ]
  },

  {
    "id": "atestiguar_priority",
    "lemma": "atestiguar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (diptongación u→ue)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "atestiguo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "atestiguas", "accepts": { "vos": "atestiguás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "atestigua" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "atestiguamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "atestiguáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "atestiguan" },

          // Pretérito indefinido (cambio ortográfico gu→gü)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "atestigüé" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "atestiguaste", "accepts": { "vos": "atestiguaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "atestiguó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "atestiguamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "atestiguasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "atestiguaron" },

          // Presente subjuntivo (diptongación u→ue + diéresis)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "atestigüe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "atestigües", "accepts": { "vos": "atestigües" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "atestigüe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "atestiguemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "atestiguéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "atestigüen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "atestiguar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "atestiguando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "atestiguado" }
        ]
      }
    ]
  },

  {
    "id": "aguar_priority",
    "lemma": "aguar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (diptongación u→ue)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "aguo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "aguas", "accepts": { "vos": "aguás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "agua" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "aguamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "aguáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "aguan" },

          // Pretérito indefinido (cambio ortográfico gu→gü)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "agüé" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "aguaste", "accepts": { "vos": "aguaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "aguó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "aguamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "aguasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "aguaron" },

          // Presente subjuntivo (diptongación u→ue + diéresis)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "agüe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "agües", "accepts": { "vos": "agües" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "agüe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "aguemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "aguéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "agüen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "aguar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "aguando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "aguado" }
        ]
      }
    ]
  },

  {
    "id": "santiguar_priority",
    "lemma": "santiguar", 
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (diptongación u→ue)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "santiguo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "santiguas", "accepts": { "vos": "santiguás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "santigua" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "santiguamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "santiguáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "santiguan" },

          // Pretérito indefinido (cambio ortográfico gu→gü)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "santigüé" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "santiguaste", "accepts": { "vos": "santiguaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "santiguó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "santiguamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "santiguasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "santiguaron" },

          // Presente subjuntivo (diptongación u→ue + diéresis)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "santigüe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "santigües", "accepts": { "vos": "santigües" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "santigüe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "santiguemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "santiguéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "santigüen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "santiguar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "santiguando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "santiguado" }
        ]
      }
    ]
  },

  // ===== O_U_GER_IR: Expansión de o→u en gerundio y pretérito =====
  {
    "id": "gruñir_priority",
    "lemma": "gruñir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "gruño" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "gruñes", "accepts": { "vos": "gruñís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "gruñe" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "gruñimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "gruñís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "gruñen" },

          // Pretérito indefinido (o→u en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "gruñí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "gruñiste", "accepts": { "vos": "gruñiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "gruñó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "gruñimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "gruñisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "gruñeron" },

          // Presente subjuntivo (regular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "gruña" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "gruñas", "accepts": { "vos": "gruñas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "gruña" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "gruñamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "gruñáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "gruñan" },
          
          // Formas no conjugadas (gerundio irregular o→u)
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "gruñir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "gruñendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "gruñido" }
        ]
      }
    ]
  },

  {
    "id": "adormir_priority",
    "lemma": "adormir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (diptongación o→ue)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "aduermo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "aduermes", "accepts": { "vos": "adormís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "aduerme" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "adormimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "adormís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "aduermen" },

          // Pretérito indefinido (o→u en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "adormí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "adormiste", "accepts": { "vos": "adormiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "adurmiú" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "adormimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "adormisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "adurmieron" },

          // Presente subjuntivo (diptongación o→ue)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "aduerma" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "aduermas", "accepts": { "vos": "aduermas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "aduerma" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "adurmamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "adurmáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "aduerman" },
          
          // Formas no conjugadas (gerundio irregular o→u)
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "adormir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "adurmiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "adormido" }
        ]
      }
    ]
  },

  {
    "id": "redormir_priority",
    "lemma": "redormir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (diptongación o→ue)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "reduermo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "reduermes", "accepts": { "vos": "redormís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "reduerme" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "redormimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "redormís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "reduerme" },

          // Pretérito indefinido (o→u en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "redormí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "redormiste", "accepts": { "vos": "redormiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "redurmiú" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "redormimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "redormisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "redurmieron" },

          // Presente subjuntivo (diptongación o→ue)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "reduerma" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "reduermas", "accepts": { "vos": "reduermas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "reduerma" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "redurmamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "redurmáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "reduerme" },
          
          // Formas no conjugadas (gerundio irregular o→u)
          { "mood": "nonfinite", "tense": "inf", "person": "ner", "value": "redormir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "redurmiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "redormido" }
        ]
      }
    ]
  },

  // ===== JO_VERBS: Expansión de verbos -ger/-gir → -jo =====
  {
    "id": "dirigir_priority",
    "lemma": "dirigir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (irregular yo -jo)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "dirijo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "diriges", "accepts": { "vos": "dirigís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "dirige" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "dirigimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "dirigís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "dirigen" },

          // Pretérito indefinido (regular)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "dirigí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "dirigiste", "accepts": { "vos": "dirigiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "dirigió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "dirigimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "dirigisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "dirigieron" },

          // Presente subjuntivo (propagación -jo)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "dirija" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "dirijas", "accepts": { "vos": "dirijas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "dirija" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "dirijamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "dirijáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "dirijan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "dirigir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "dirigiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "dirigido" }
        ]
      }
    ]
  },

  {
    "id": "corregir_priority",
    "lemma": "corregir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (irregular yo -jo + e→i)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "corrijo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "corriges", "accepts": { "vos": "corregís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "corrige" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "corregimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "corregís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "corrigen" },

          // Pretérito indefinido (e→i en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "corregí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "corregiste", "accepts": { "vos": "corregiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "corrigió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "corregimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "corregisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "corrigieron" },

          // Presente subjuntivo (propagación -jo + e→i)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "corrija" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "corrijas", "accepts": { "vos": "corrijas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "corrija" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "corrijamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "corrijáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "corrijan" },
          
          // Formas no conjugadas (gerundio con e→i)
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "corregir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "corrigiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "corregido" }
        ]
      }
    ]
  },

  {
    "id": "recoger_priority",
    "lemma": "recoger",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (irregular yo -jo)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "recojo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "recoges", "accepts": { "vos": "recogés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "recoge" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "recogemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "recogéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "recogen" },

          // Pretérito indefinido (regular)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "recogí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "recogiste", "accepts": { "vos": "recogiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "recogió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "recogimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "recogisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "recogieron" },

          // Presente subjuntivo (propagación -jo)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "recoja" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "recojas", "accepts": { "vos": "recojas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "recoja" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "recojamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "recojáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "recojan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "recoger" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "recogiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "recogido" }
        ]
      }
    ]
  },

  {
    "id": "escoger_priority",
    "lemma": "escoger",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (irregular yo -jo)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "escojo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "escoges", "accepts": { "vos": "escogés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "escoge" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "escogemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "escogéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "escogen" },

          // Pretérito indefinido (regular)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "escogí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "escogiste", "accepts": { "vos": "escogiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "escogió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "escogimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "escogisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "escogieron" },

          // Presente subjuntivo (propagación -jo)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "escoja" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "escojas", "accepts": { "vos": "escojas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "escoja" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "escojamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "escojáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "escojan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "escoger" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "escogiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "escogido" }
        ]
      }
    ]
  },

  // ===== GU_DROP: Expansión de verbos -guir (pérdida de u) =====
  {
    "id": "extinguir_priority",
    "lemma": "extinguir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (pérdida de u en yo)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "extingo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "extingues", "accepts": { "vos": "extinguís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "extingue" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "extinguimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "extinguís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "extinguen" },

          // Pretérito indefinido (regular)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "extinguí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "extinguiste", "accepts": { "vos": "extinguiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "extinguió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "extinguimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "extinguisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "extinguieron" },

          // Presente subjuntivo (propagación pérdida de u)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "extinga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "extingas", "accepts": { "vos": "extingas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "extinga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "extingamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "extingáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "extingan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "extinguir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "extinguiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "extinguido" }
        ]
      }
    ]
  },

  {
    "id": "proseguir_priority",
    "lemma": "proseguir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (pérdida de u en yo + e→i)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "prosigo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "prosigues", "accepts": { "vos": "proseguís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "prosigue" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "proseguimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "proseguís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "prosiguen" },

          // Pretérito indefinido (e→i en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "proseguí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "proseguiste", "accepts": { "vos": "proseguiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "prosiguió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "proseguimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "proseguisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "prosiguieron" },

          // Presente subjuntivo (propagación pérdida de u + e→i)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "prosiga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "prosigas", "accepts": { "vos": "prosigas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "prosiga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "prosigamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "prosigáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "prosigan" },
          
          // Formas no conjugadas (gerundio con e→i)
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "proseguir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "prosiguiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "proseguido" }
        ]
      }
    ]
  },

  // ===== ORTH_CAR: Expansión de verbos -car → -qu =====
  {
    "id": "atacar_priority",
    "lemma": "atacar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "ataco" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "atacas", "accepts": { "vos": "atacás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "ataca" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "atacamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "atacáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "atacan" },

          // Pretérito indefinido (cambio ortográfico c→qu)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "ataqué" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "atacaste", "accepts": { "vos": "atacaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "atacó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "atacamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "atacasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "atacaron" },

          // Presente subjuntivo (cambio ortográfico c→qu)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "ataque" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "ataques", "accepts": { "vos": "ataques" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "ataque" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "ataquemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "ataquéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "ataquen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "atacar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "atacando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "atacado" }
        ]
      }
    ]
  },

  {
    "id": "aplicar_priority",
    "lemma": "aplicar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "aplico" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "aplicas", "accepts": { "vos": "aplicás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "aplica" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "aplicamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "aplicáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "aplican" },

          // Pretérito indefinido (cambio ortográfico c→qu)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "apliqué" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "aplicaste", "accepts": { "vos": "aplicaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "aplicó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "aplicamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "aplicasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "aplicaron" },

          // Presente subjuntivo (cambio ortográfico c→qu)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "aplique" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "apliques", "accepts": { "vos": "apliques" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "aplique" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "apliquemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "apliquéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "apliquen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "aplicar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "aplicando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "aplicado" }
        ]
      }
    ]
  },

  {
    "id": "fabricar_priority",
    "lemma": "fabricar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "fabrico" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "fabricas", "accepts": { "vos": "fabricás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "fabrica" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "fabricamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "fabricáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "fabrican" },

          // Pretérito indefinido (cambio ortográfico c→qu)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "fabriqué" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "fabricaste", "accepts": { "vos": "fabricaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "fabricó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "fabricamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "fabricasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "fabricaron" },

          // Presente subjuntivo (cambio ortográfico c→qu)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "fabrique" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "fabriques", "accepts": { "vos": "fabriques" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "fabrique" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "fabriquemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "fabriquéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "fabriquen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "fabricar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "fabricando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "fabricado" }
        ]
      }
    ]
  },

  // ===== PRET_UV: Expansión de pretéritos fuertes -uv- =====
  {
    "id": "mantener_priority",
    "lemma": "mantener",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (irregular yo + diptongación)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "mantengo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "mantienes", "accepts": { "vos": "mantenés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "mantiene" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "mantenemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "mantenéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "mantienen" },

          // Pretérito indefinido (fuerte -uv-)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "mantuve" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "mantuviste", "accepts": { "vos": "mantuviste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "mantuvo" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "mantuvimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "mantuvisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "mantuvieron" },

          // Presente subjuntivo (irregular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "mantenga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "mantengas", "accepts": { "vos": "mantengas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "mantenga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "mantengamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "mantengáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "mantengan" },

          // Futuro irregular
          { "mood": "indicative", "tense": "fut", "person": "1s", "value": "mantendré" },
          { "mood": "indicative", "tense": "fut", "person": "2s_tu", "value": "mantendrás", "accepts": { "vos": "mantendrás" } },
          { "mood": "indicative", "tense": "fut", "person": "3s", "value": "mantendrá" },
          { "mood": "indicative", "tense": "fut", "person": "1p", "value": "mantendremos" },
          { "mood": "indicative", "tense": "fut", "person": "2p_vosotros", "value": "mantendréis" },
          { "mood": "indicative", "tense": "fut", "person": "3p", "value": "mantendrán" },

          // Condicional irregular
          { "mood": "conditional", "tense": "cond", "person": "1s", "value": "mantendría" },
          { "mood": "conditional", "tense": "cond", "person": "2s_tu", "value": "mantendrías", "accepts": { "vos": "mantendrías" } },
          { "mood": "conditional", "tense": "cond", "person": "3s", "value": "mantendría" },
          { "mood": "conditional", "tense": "cond", "person": "1p", "value": "mantendríamos" },
          { "mood": "conditional", "tense": "cond", "person": "2p_vosotros", "value": "mantendríais" },
          { "mood": "conditional", "tense": "cond", "person": "3p", "value": "mantendrían" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "mantener" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "manteniendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "mantenido" }
        ]
      }
    ]
  },

  {
    "id": "contener_priority",
    "lemma": "contener",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (irregular yo + diptongación)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "contengo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "contienes", "accepts": { "vos": "contenés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "contiene" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "contenemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "contenéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "contienen" },

          // Pretérito indefinido (fuerte -uv-)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "contuve" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "contuviste", "accepts": { "vos": "contuviste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "contuvo" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "contuvimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "contuvisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "contuvieron" },

          // Presente subjuntivo (irregular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "contenga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "contengas", "accepts": { "vos": "contengas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "contenga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "contengamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "contengáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "contengan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "contener" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "conteniendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "contenido" }
        ]
      }
    ]
  },

  // ===== ORTH_ZAR: Expansión de verbos -zar → -c =====
  {
    "id": "almorzar_priority",
    "lemma": "almorzar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (diptongación o→ue)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "almuerzo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "almuerzas", "accepts": { "vos": "almorzás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "almuerza" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "almorzamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "almorzáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "almuerzan" },

          // Pretérito indefinido (cambio ortográfico z→c)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "almorcé" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "almorzaste", "accepts": { "vos": "almorzaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "almorzó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "almorzamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "almorzasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "almorzaron" },

          // Presente subjuntivo (diptongación + cambio ortográfico)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "almuerce" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "almuerces", "accepts": { "vos": "almuerces" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "almuerce" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "almorcemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "almorcéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "almuercen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "almorzar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "almorzando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "almorzado" }
        ]
      }
    ]
  },

  {
    "id": "utilizar_priority",
    "lemma": "utilizar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "utilizo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "utilizas", "accepts": { "vos": "utilizás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "utiliza" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "utilizamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "utilizáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "utilizan" },

          // Pretérito indefinido (cambio ortográfico z→c)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "utilicé" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "utilizaste", "accepts": { "vos": "utilizaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "utilizó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "utilizamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "utilizasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "utilizaron" },

          // Presente subjuntivo (cambio ortográfico z→c)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "utilice" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "utilices", "accepts": { "vos": "utilices" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "utilice" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "utilicemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "utilicéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "utilicen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "utilizar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "utilizando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "utilizado" }
        ]
      }
    ]
  },

  // PRET_UV: sostener (pretérito fuerte -uv-)
  {
    "id": "sostener_priority",
    "lemma": "sostener",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (raíz irregular sostengo)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "sostengo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "sostienes", "accepts": { "vos": "sostenés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "sostiene" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "sostenemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "sostenéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "sostienen" },

          // Pretérito indefinido (fuerte -uv-)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "sostuve" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "sostuviste", "accepts": { "vos": "sostuviste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "sostuvo" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "sostuvimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "sostuvisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "sostuvieron" },

          // Futuro (irregular)
          { "mood": "indicative", "tense": "fut", "person": "1s", "value": "sostendré" },
          { "mood": "indicative", "tense": "fut", "person": "2s_tu", "value": "sostendrás", "accepts": { "vos": "sostendrás" } },
          { "mood": "indicative", "tense": "fut", "person": "3s", "value": "sostendrá" },
          { "mood": "indicative", "tense": "fut", "person": "1p", "value": "sostendremos" },
          { "mood": "indicative", "tense": "fut", "person": "2p_vosotros", "value": "sostendréis" },
          { "mood": "indicative", "tense": "fut", "person": "3p", "value": "sostendrán" },

          // Condicional (irregular)
          { "mood": "conditional", "tense": "cond", "person": "1s", "value": "sostendría" },
          { "mood": "conditional", "tense": "cond", "person": "2s_tu", "value": "sostendrías", "accepts": { "vos": "sostendrías" } },
          { "mood": "conditional", "tense": "cond", "person": "3s", "value": "sostendría" },
          { "mood": "conditional", "tense": "cond", "person": "1p", "value": "sostendríamos" },
          { "mood": "conditional", "tense": "cond", "person": "2p_vosotros", "value": "sostendríais" },
          { "mood": "conditional", "tense": "cond", "person": "3p", "value": "sostendrían" },

          // Presente subjuntivo (propagación de la raíz irregular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "sostenga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "sostengas", "accepts": { "vos": "sostengas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "sostenga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "sostengamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "sostengáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "sostengan" },

          // Subjuntivo imperfecto (basado en pretérito fuerte)
          { "mood": "subjunctive", "tense": "subjImpf", "person": "1s", "value": "sostuviera" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "2s_tu", "value": "sostuvieras", "accepts": { "vos": "sostuvieras" } },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "3s", "value": "sostuviera" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "1p", "value": "sostuviéramos" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "2p_vosotros", "value": "sostuvierais" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "3p", "value": "sostuvieran" },

          // Imperativo
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "sostén", "accepts": { "vos": "sostené" } },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "sostenga" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "sostengamos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "sostened" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "sostengan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "sostener" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "sosteniendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "sostenido" }
        ]
      }
    ]
  },

  // PRET_U: haber (pretérito fuerte -u-)
  {
    "id": "haber_priority",
    "lemma": "haber",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (formas especiales)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "he" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "has", "accepts": { "vos": "has" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "ha" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "hemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "habéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "han" },

          // Pretérito indefinido (fuerte -u-)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "hube" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "hubiste", "accepts": { "vos": "hubiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "hubo" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "hubimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "hubisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "hubieron" },

          // Futuro (irregular)
          { "mood": "indicative", "tense": "fut", "person": "1s", "value": "habré" },
          { "mood": "indicative", "tense": "fut", "person": "2s_tu", "value": "habrás", "accepts": { "vos": "habrás" } },
          { "mood": "indicative", "tense": "fut", "person": "3s", "value": "habrá" },
          { "mood": "indicative", "tense": "fut", "person": "1p", "value": "habremos" },
          { "mood": "indicative", "tense": "fut", "person": "2p_vosotros", "value": "habréis" },
          { "mood": "indicative", "tense": "fut", "person": "3p", "value": "habrán" },

          // Condicional (irregular)
          { "mood": "conditional", "tense": "cond", "person": "1s", "value": "habría" },
          { "mood": "conditional", "tense": "cond", "person": "2s_tu", "value": "habrías", "accepts": { "vos": "habrías" } },
          { "mood": "conditional", "tense": "cond", "person": "3s", "value": "habría" },
          { "mood": "conditional", "tense": "cond", "person": "1p", "value": "habríamos" },
          { "mood": "conditional", "tense": "cond", "person": "2p_vosotros", "value": "habríais" },
          { "mood": "conditional", "tense": "cond", "person": "3p", "value": "habrían" },

          // Presente subjuntivo (formas especiales)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "haya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "hayas", "accepts": { "vos": "hayas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "haya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "hayamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "hayáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "hayan" },

          // Subjuntivo imperfecto (basado en pretérito fuerte)
          { "mood": "subjunctive", "tense": "subjImpf", "person": "1s", "value": "hubiera" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "2s_tu", "value": "hubieras", "accepts": { "vos": "hubieras" } },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "3s", "value": "hubiera" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "1p", "value": "hubiéramos" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "2p_vosotros", "value": "hubierais" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "3p", "value": "hubieran" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "haber" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "habiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "habido" }
        ]
      }
    ]
  },

  // PRET_U: deber (pretérito fuerte -u- en algunos dialectos)
  {
    "id": "deber_priority",
    "lemma": "deber",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "debo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "debes", "accepts": { "vos": "debés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "debe" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "debemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "debéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "deben" },

          // Pretérito indefinido (puede ser regular "debí" o fuerte "dube" según región)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "debí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "debiste", "accepts": { "vos": "debiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "debió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "debimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "debisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "debieron" },

          // Presente subjuntivo (regular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "deba" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "debas", "accepts": { "vos": "debas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "deba" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "debamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "debáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "deban" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "deber" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "debiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "debido" }
        ]
      }
    ]
  },

  // PRET_I: convenir (pretérito fuerte -i-)
  {
    "id": "convenir_priority",
    "lemma": "convenir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (diptongación e→ie)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "convengo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "convienes", "accepts": { "vos": "convenís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "conviene" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "convenimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "convenís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "convienen" },

          // Pretérito indefinido (fuerte -i-)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "convine" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "conviniste", "accepts": { "vos": "conviniste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "convino" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "convinimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "convinisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "convinieron" },

          // Futuro (irregular)
          { "mood": "indicative", "tense": "fut", "person": "1s", "value": "convendré" },
          { "mood": "indicative", "tense": "fut", "person": "2s_tu", "value": "convendrás", "accepts": { "vos": "convendrás" } },
          { "mood": "indicative", "tense": "fut", "person": "3s", "value": "convendrá" },
          { "mood": "indicative", "tense": "fut", "person": "1p", "value": "convendremos" },
          { "mood": "indicative", "tense": "fut", "person": "2p_vosotros", "value": "convendréis" },
          { "mood": "indicative", "tense": "fut", "person": "3p", "value": "convendrán" },

          // Presente subjuntivo (propagación de la raíz irregular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "convenga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "convengas", "accepts": { "vos": "convengas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "convenga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "convengamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "convengáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "convengan" },

          // Subjuntivo imperfecto (basado en pretérito fuerte)
          { "mood": "subjunctive", "tense": "subjImpf", "person": "1s", "value": "conviniera" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "2s_tu", "value": "convinieras", "accepts": { "vos": "convinieras" } },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "3s", "value": "conviniera" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "1p", "value": "conviniéramos" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "2p_vosotros", "value": "convinierais" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "3p", "value": "convinieran" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "convenir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "conviniendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "convenido" }
        ]
      }
    ]
  },

  // PRET_I: prevenir (pretérito fuerte -i-)
  {
    "id": "prevenir_priority",
    "lemma": "prevenir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (diptongación e→ie)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "prevengo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "previenes", "accepts": { "vos": "prevenís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "previene" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "prevenimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "prevenís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "previenen" },

          // Pretérito indefinido (fuerte -i-)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "previne" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "previniste", "accepts": { "vos": "previniste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "previno" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "previnimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "previnisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "previnieron" },

          // Futuro (irregular)
          { "mood": "indicative", "tense": "fut", "person": "1s", "value": "prevendré" },
          { "mood": "indicative", "tense": "fut", "person": "2s_tu", "value": "prevendrás", "accepts": { "vos": "prevendrás" } },
          { "mood": "indicative", "tense": "fut", "person": "3s", "value": "prevendrá" },
          { "mood": "indicative", "tense": "fut", "person": "1p", "value": "prevendremos" },
          { "mood": "indicative", "tense": "fut", "person": "2p_vosotros", "value": "prevendréis" },
          { "mood": "indicative", "tense": "fut", "person": "3p", "value": "prevendrán" },

          // Presente subjuntivo (propagación de la raíz irregular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "prevenga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "prevengas", "accepts": { "vos": "prevengas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "prevenga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "prevengamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "prevengáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "prevengan" },

          // Subjuntivo imperfecto (basado en pretérito fuerte)
          { "mood": "subjunctive", "tense": "subjImpf", "person": "1s", "value": "previniera" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "2s_tu", "value": "previnieras", "accepts": { "vos": "previnieras" } },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "3s", "value": "previniera" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "1p", "value": "previniéramos" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "2p_vosotros", "value": "previnierais" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "3p", "value": "previnieran" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "prevenir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "previniendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "prevenido" }
        ]
      }
    ]
  },

  // PRET_I: rehacer (pretérito fuerte -i-)
  {
    "id": "rehacer_priority",
    "lemma": "rehacer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (raíz irregular rehago)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "rehago" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "rehaces", "accepts": { "vos": "rehacés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "rehace" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "rehacemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "rehacéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "rehacen" },

          // Pretérito indefinido (fuerte -i-)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "rehice" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "rehiciste", "accepts": { "vos": "rehiciste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "rehizo" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "rehicimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "rehicisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "rehicieron" },

          // Futuro (irregular)
          { "mood": "indicative", "tense": "fut", "person": "1s", "value": "reharé" },
          { "mood": "indicative", "tense": "fut", "person": "2s_tu", "value": "reharás", "accepts": { "vos": "reharás" } },
          { "mood": "indicative", "tense": "fut", "person": "3s", "value": "rehará" },
          { "mood": "indicative", "tense": "fut", "person": "1p", "value": "reharemos" },
          { "mood": "indicative", "tense": "fut", "person": "2p_vosotros", "value": "reharéis" },
          { "mood": "indicative", "tense": "fut", "person": "3p", "value": "reharán" },

          // Presente subjuntivo (propagación de la raíz irregular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "rehaga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "rehagas", "accepts": { "vos": "rehagas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "rehaga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "rehagamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "rehagáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "rehagan" },

          // Subjuntivo imperfecto (basado en pretérito fuerte)
          { "mood": "subjunctive", "tense": "subjImpf", "person": "1s", "value": "rehiciera" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "2s_tu", "value": "rehicieras", "accepts": { "vos": "rehicieras" } },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "3s", "value": "rehiciera" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "1p", "value": "rehiciéramos" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "2p_vosotros", "value": "rehicierais" },
          { "mood": "subjunctive", "tense": "subjImpf", "person": "3p", "value": "rehicieran" },

          // Imperativo
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "rehaz", "accepts": { "vos": "rehacé" } },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "rehaga" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "rehagamos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "rehaced" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "rehagan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "rehacer" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "rehaciendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "rehecho" }
        ]
      }
    ]
  },

  // IRREG_GERUNDS: caer (cayendo)
  {
    "id": "caer_priority",
    "lemma": "caer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (raíz irregular caigo)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "caigo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "caes", "accepts": { "vos": "caés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "cae" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "caemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "caéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "caen" },

          // Pretérito indefinido (cambio i→y en 3ª persona)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "caí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "caíste", "accepts": { "vos": "caíste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "cayó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "caímos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "caísteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "cayeron" },

          // Presente subjuntivo (propagación de la raíz irregular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "caiga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "caigas", "accepts": { "vos": "caigas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "caiga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "caigamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "caigáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "caigan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "caer" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "cayendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "caído" }
        ]
      }
    ]
  },

  // IRREG_GERUNDS: leer (leyendo)
  {
    "id": "leer_priority",
    "lemma": "leer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "leo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "lees", "accepts": { "vos": "leés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "lee" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "leemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "leéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "leen" },

          // Pretérito indefinido (cambio i→y en 3ª persona)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "leí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "leíste", "accepts": { "vos": "leíste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "leyó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "leímos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "leísteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "leyeron" },

          // Presente subjuntivo (regular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "lea" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "leas", "accepts": { "vos": "leas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "lea" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "leamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "leáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "lean" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "leer" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "leyendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "leído" }
        ]
      }
    ]
  },

  // IRREG_GERUNDS: creer (creyendo)
  {
    "id": "creer_priority",
    "lemma": "creer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "creo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "crees", "accepts": { "vos": "creés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "cree" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "creemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "creéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "creen" },

          // Pretérito indefinido (cambio i→y en 3ª persona)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "creí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "creíste", "accepts": { "vos": "creíste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "creyó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "creímos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "creísteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "creyeron" },

          // Presente subjuntivo (regular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "crea" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "creas", "accepts": { "vos": "creas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "crea" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "creamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "creáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "crean" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "creer" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "creyendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "creído" }
        ]
      }
    ]
  },

  // IRREG_PARTICIPLES: abrir (abierto)
  {
    "id": "abrir_priority",
    "lemma": "abrir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "abro" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "abres", "accepts": { "vos": "abrís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "abre" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "abrimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "abrís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "abren" },

          // Presente subjuntivo (regular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "abra" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "abras", "accepts": { "vos": "abras" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "abra" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "abramos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "abráis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "abran" },

          // Imperativo
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "abre", "accepts": { "vos": "abrí" } },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "abra" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "abramos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "abrid" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "abran" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "abrir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "abriendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "abierto" }
        ]
      }
    ]
  },

  // IRREG_PARTICIPLES: cubrir (cubierto)
  {
    "id": "cubrir_priority",
    "lemma": "cubrir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "cubro" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "cubres", "accepts": { "vos": "cubrís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "cubre" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "cubrimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "cubrís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "cubren" },

          // Presente subjuntivo (regular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "cubra" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "cubras", "accepts": { "vos": "cubras" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "cubra" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "cubramos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "cubráis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "cubran" },

          // Imperativo
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "cubre", "accepts": { "vos": "cubrí" } },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "cubra" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "cubramos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "cubrid" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "cubran" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "cubrir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "cubriendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "cubierto" }
        ]
      }
    ]
  },

  // IRREG_PARTICIPLES: romper (roto)
  {
    "id": "romper_priority",
    "lemma": "romper",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "rompo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "rompes", "accepts": { "vos": "rompés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "rompe" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "rompemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "rompéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "rompen" },

          // Presente subjuntivo (regular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "rompa" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "rompas", "accepts": { "vos": "rompas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "rompa" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "rompamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "rompáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "rompan" },

          // Imperativo
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "rompe", "accepts": { "vos": "rompé" } },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "rompa" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "rompamos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "romped" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "rompan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "romper" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "rompiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "roto" }
        ]
      }
    ]
  },

  // DEFECTIVE_VERBS: agredir (solo 3ª persona)
  {
    "id": "agredir_priority",
    "lemma": "agredir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (solo 3ª persona)
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "agrede" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "agreden" },

          // Pretérito indefinido (solo 3ª persona)
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "agredió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "agredieron" },

          // Imperfecto (solo 3ª persona)
          { "mood": "indicative", "tense": "impf", "person": "3s", "value": "agredía" },
          { "mood": "indicative", "tense": "impf", "person": "3p", "value": "agredían" },

          // Presente subjuntivo (solo 3ª persona)
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "agreda" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "agredan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "agredir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "agrediendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "agredido" }
        ]
      }
    ]
  },

  // DEFECTIVE_VERBS: empedernir (solo 3ª persona)
  {
    "id": "empedernir_priority",
    "lemma": "empedernir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (solo 3ª persona)
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "empederne" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "empedernen" },

          // Pretérito indefinido (solo 3ª persona)
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "empedernió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "empedernieron" },

          // Imperfecto (solo 3ª persona)
          { "mood": "indicative", "tense": "impf", "person": "3s", "value": "empedernía" },
          { "mood": "indicative", "tense": "impf", "person": "3p", "value": "empedernían" },

          // Presente subjuntivo (solo 3ª persona)
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "empederna" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "empedernan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "empedernir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "empederniendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "empedernido" }
        ]
      }
    ]
  },

  // DEFECTIVE_VERBS: blandir (solo infinitivo y 3ª persona)
  {
    "id": "blandir_priority",
    "lemma": "blandir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (solo 3ª persona)
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "blande" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "blanden" },

          // Imperfecto (solo 3ª persona)
          { "mood": "indicative", "tense": "impf", "person": "3s", "value": "blandía" },
          { "mood": "indicative", "tense": "impf", "person": "3p", "value": "blandían" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "blandir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "blandiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "blandido" }
        ]
      }
    ]
  },

  // DOUBLE_PARTICIPLES: prender (preso/prendido)
  {
    "id": "prender_priority",
    "lemma": "prender",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "prendo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "prendes", "accepts": { "vos": "prendés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "prende" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "prendemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "prendéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "prenden" },

          // Presente subjuntivo (regular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "prenda" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "prendas", "accepts": { "vos": "prendas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "prenda" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "prendamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "prendáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "prendan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "prender" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "prendiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "preso" }
        ]
      }
    ]
  },

  // DOUBLE_PARTICIPLES: suspender (suspenso/suspendido)
  {
    "id": "suspender_priority",
    "lemma": "suspender",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "suspendo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "suspendes", "accepts": { "vos": "suspendés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "suspende" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "suspendemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "suspendéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "suspenden" },

          // Presente subjuntivo (regular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "suspenda" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "suspendas", "accepts": { "vos": "suspendas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "suspenda" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "suspendamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "suspendáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "suspendan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "suspender" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "suspendiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "suspenso" }
        ]
      }
    ]
  },

  // ORTH_GAR: llegar (cambio ortográfico g→gu)
  {
    "id": "llegar_priority",
    "lemma": "llegar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "llego" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "llegas", "accepts": { "vos": "llegás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "llega" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "llegamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "llegáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "llegan" },

          // Pretérito indefinido (cambio ortográfico g→gu)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "llegué" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "llegaste", "accepts": { "vos": "llegaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "llegó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "llegamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "llegasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "llegaron" },

          // Presente subjuntivo (cambio ortográfico g→gu)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "llegue" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "llegues", "accepts": { "vos": "llegues" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "llegue" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "lleguemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "lleguéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "lleguen" },

          // Imperativo
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "llega", "accepts": { "vos": "llegá" } },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "llegue" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "lleguemos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "llegad" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "lleguen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "llegar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "llegando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "llegado" }
        ]
      }
    ]
  },

  // ORTH_GAR: pagar (cambio ortográfico g→gu)
  {
    "id": "pagar_priority",
    "lemma": "pagar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "pago" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "pagas", "accepts": { "vos": "pagás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "paga" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "pagamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "pagáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "pagan" },

          // Pretérito indefinido (cambio ortográfico g→gu)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "pagué" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "pagaste", "accepts": { "vos": "pagaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "pagó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "pagamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "pagasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "pagaron" },

          // Presente subjuntivo (cambio ortográfico g→gu)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "pague" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "pagues", "accepts": { "vos": "pagues" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "pague" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "paguemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "paguéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "paguen" },

          // Imperativo
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "paga", "accepts": { "vos": "pagá" } },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "pague" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "paguemos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "pagad" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "paguen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "pagar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "pagando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "pagado" }
        ]
      }
    ]
  },

  // ORTH_GAR: entregar (cambio ortográfico g→gu)
  {
    "id": "entregar_priority",
    "lemma": "entregar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "entrego" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "entregas", "accepts": { "vos": "entregás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "entrega" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "entregamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "entregáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "entregan" },

          // Pretérito indefinido (cambio ortográfico g→gu)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "entregué" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "entregaste", "accepts": { "vos": "entregaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "entregó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "entregamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "entregasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "entregaron" },

          // Presente subjuntivo (cambio ortográfico g→gu)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "entregue" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "entregues", "accepts": { "vos": "entregues" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "entregue" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "entreguemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "entreguéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "entreguen" },

          // Imperativo
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "entrega", "accepts": { "vos": "entregá" } },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "entregue" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "entreguemos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "entregad" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "entreguen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "entregar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "entregando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "entregado" }
        ]
      }
    ]
  },

  // ORTH_ZAR: comenzar (cambio ortográfico z→c + diptongación e→ie)
  {
    "id": "comenzar_priority",
    "lemma": "comenzar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (diptongación e→ie)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "comienzo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "comienzas", "accepts": { "vos": "comenzás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "comienza" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "comenzamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "comenzáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "comienzan" },

          // Pretérito indefinido (cambio ortográfico z→c)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "comencé" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "comenzaste", "accepts": { "vos": "comenzaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "comenzó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "comenzamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "comenzasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "comenzaron" },

          // Presente subjuntivo (diptongación e→ie + cambio z→c)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "comience" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "comiences", "accepts": { "vos": "comiences" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "comience" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "comencemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "comencéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "comiencen" },

          // Imperativo
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "comienza", "accepts": { "vos": "comenzá" } },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "comience" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "comencemos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "comenzad" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "comiencen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "comenzar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "comenzando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "comenzado" }
        ]
      }
    ]
  },

  // ORTH_ZAR: realizar (cambio ortográfico z→c)
  {
    "id": "realizar_priority",
    "lemma": "realizar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "realizo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "realizas", "accepts": { "vos": "realizás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "realiza" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "realizamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "realizáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "realizan" },

          // Pretérito indefinido (cambio ortográfico z→c)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "realicé" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "realizaste", "accepts": { "vos": "realizaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "realizó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "realizamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "realizasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "realizaron" },

          // Presente subjuntivo (cambio ortográfico z→c)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "realice" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "realices", "accepts": { "vos": "realices" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "realice" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "realicemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "realicéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "realicen" },

          // Imperativo
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "realiza", "accepts": { "vos": "realizá" } },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "realice" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "realicemos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "realizad" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "realicen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "realizar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "realizando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "realizado" }
        ]
      }
    ]
  },

  // IAR_VERBS: ampliar (tilde en presente)
  {
    "id": "ampliar_priority",
    "lemma": "ampliar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (tilde en algunas formas)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "amplío" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "amplías", "accepts": { "vos": "ampliás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "amplía" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "ampliamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "ampliáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "amplían" },

          // Presente subjuntivo (tilde en algunas formas)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "amplíe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "amplíes", "accepts": { "vos": "amplíes" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "amplíe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "ampliemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "ampliéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "amplíen" },

          // Imperativo
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "amplía", "accepts": { "vos": "ampliá" } },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "amplíe" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "ampliemos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "ampliad" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "amplíen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "ampliar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "ampliando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "ampliado" }
        ]
      }
    ]
  },

  // IAR_VERBS: copiar (tilde en presente)
  {
    "id": "copiar_priority",
    "lemma": "copiar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (tilde en algunas formas)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "copio" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "copias", "accepts": { "vos": "copiás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "copia" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "copiamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "copiáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "copian" },

          // Presente subjuntivo (regular para copiar)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "copie" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "copies", "accepts": { "vos": "copies" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "copie" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "copiemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "copiéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "copien" },

          // Imperativo
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "copia", "accepts": { "vos": "copiá" } },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "copie" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "copiemos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "copiad" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "copien" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "copiar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "copiando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "copiado" }
        ]
      }
    ]
  },

  // IAR_VERBS: criar (tilde en presente)
  {
    "id": "criar_priority",
    "lemma": "criar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (tilde en algunas formas)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "crío" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "crías", "accepts": { "vos": "criás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "cría" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "criamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "criáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "crían" },

          // Presente subjuntivo (tilde en algunas formas)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "críe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "críes", "accepts": { "vos": "críes" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "críe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "criemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "criéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "críen" },

          // Imperativo
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "cría", "accepts": { "vos": "criá" } },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "críe" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "criemos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "criad" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "críen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "criar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "criando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "criado" }
        ]
      }
    ]
  },

  // IAR_VERBS: variar (tilde en presente)
  {
    "id": "variar_priority",
    "lemma": "variar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (tilde en algunas formas)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "varío" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "varías", "accepts": { "vos": "variás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "varía" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "variamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "variáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "varían" },

          // Presente subjuntivo (tilde en algunas formas)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "varíe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "varíes", "accepts": { "vos": "varíes" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "varíe" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "variemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "variéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "varíen" },

          // Imperativo
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "varía", "accepts": { "vos": "variá" } },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "varíe" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "variemos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "variad" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "varíen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "variar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "variando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "variado" }
        ]
      }
    ]
  },

  // ACCENT_CHANGES: aullar (cambio de acentuación)
  {
    "id": "aullar_priority",
    "lemma": "aullar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (cambio de acento)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "aúllo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "aúllas", "accepts": { "vos": "aullás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "aúlla" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "aullamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "aulláis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "aúllan" },

          // Presente subjuntivo (cambio de acento)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "aúlle" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "aúlles", "accepts": { "vos": "aúlles" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "aúlle" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "aullemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "aulléis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "aúllen" },

          // Imperativo
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "aúlla", "accepts": { "vos": "aullá" } },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "aúlle" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "aullemos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "aullad" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "aúllen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "aullar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "aullando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "aullado" }
        ]
      }
    ]
  },

  // ACCENT_CHANGES: maullar (cambio de acentuación)
  {
    "id": "maullar_priority",
    "lemma": "maullar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (cambio de acento)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "maúllo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "maúllas", "accepts": { "vos": "maullás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "maúlla" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "maullamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "maulláis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "maúllan" },

          // Presente subjuntivo (cambio de acento)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "maúlle" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "maúlles", "accepts": { "vos": "maúlles" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "maúlle" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "maullemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "maulléis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "maúllen" },

          // Imperativo
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "maúlla", "accepts": { "vos": "maullá" } },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "maúlle" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "maullemos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "maullad" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "maúllen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "maullar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "maullando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "maullado" }
        ]
      }
    ]
  },

  // ACCENT_CHANGES: rehusar (cambio de acentuación)
  {
    "id": "rehusar_priority",
    "lemma": "rehusar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (cambio de acento)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "rehúso" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "rehúsas", "accepts": { "vos": "rehusás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "rehúsa" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "rehusamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "rehusáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "rehúsan" },

          // Presente subjuntivo (cambio de acento)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "rehúse" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "rehúses", "accepts": { "vos": "rehúses" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "rehúse" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "rehusemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "rehuséis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "rehúsen" },

          // Imperativo
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "rehúsa", "accepts": { "vos": "rehusá" } },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "rehúse" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "rehusemos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "rehusad" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "rehúsen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "rehusar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "rehusando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "rehusado" }
        ]
      }
    ]
  },

  // ACCENT_CHANGES: descafainar (cambio de acentuación)
  {
    "id": "descafainar_priority",
    "lemma": "descafainar",
    "type": "irregular", 
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (cambio de acento)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "descafaíno" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "descafaínas", "accepts": { "vos": "descafainás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "descafaína" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "descafainamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "descafaináis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "descafaínan" },

          // Presente subjuntivo (cambio de acento)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "descafaíne" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "descafaínes", "accepts": { "vos": "descafaínes" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "descafaíne" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "descafainemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "descafainéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "descafaínen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "descafainar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "descafainando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "descafainado" }
        ]
      }
    ]
  },

  // ACCENT_CHANGES: enraizar (cambio de acentuación)
  {
    "id": "enraizar_priority",
    "lemma": "enraizar",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (cambio de acento)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "enraízo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "enraízas", "accepts": { "vos": "enraizás" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "enraíza" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "enraizamos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "enraizáis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "enraízan" },

          // Pretérito indefinido (cambio ortográfico z→c)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "enraicé" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "enraizaste", "accepts": { "vos": "enraizaste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "enraizó" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "enraizamos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "enraizasteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "enraizaron" },

          // Presente subjuntivo (cambio de acento + ortográfico)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "enraíce" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "enraíces", "accepts": { "vos": "enraíces" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "enraíce" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "enraicemos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "enraicéis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "enraícen" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "enraizar" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "enraizando" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "enraizado" }
        ]
      }
    ]
  },

  // PRET_I: deshacer (pretérito fuerte -i-)
  {
    "id": "deshacer_priority",
    "lemma": "deshacer",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (g en yo)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "deshago" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "deshaces", "accepts": { "vos": "deshacés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "deshace" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "deshacemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "deshacéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "deshacen" },

          // Pretérito indefinido (fuerte -i-)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "deshice" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "deshiciste", "accepts": { "vos": "deshiciste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "deshizo" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "deshicimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "deshicisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "deshicieron" },

          // Presente subjuntivo
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "deshaga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "deshagas", "accepts": { "vos": "deshagas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "deshaga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "deshagamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "deshagáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "deshagan" },

          // Futuro
          { "mood": "indicative", "tense": "fut", "person": "1s", "value": "desharé" },
          { "mood": "indicative", "tense": "fut", "person": "2s_tu", "value": "desharás", "accepts": { "vos": "desharás" } },
          { "mood": "indicative", "tense": "fut", "person": "3s", "value": "deshará" },
          { "mood": "indicative", "tense": "fut", "person": "1p", "value": "desharemos" },
          { "mood": "indicative", "tense": "fut", "person": "2p_vosotros", "value": "desharéis" },
          { "mood": "indicative", "tense": "fut", "person": "3p", "value": "desharán" },

          // Condicional
          { "mood": "conditional", "tense": "cond", "person": "1s", "value": "desharía" },
          { "mood": "conditional", "tense": "cond", "person": "2s_tu", "value": "desharías", "accepts": { "vos": "desharías" } },
          { "mood": "conditional", "tense": "cond", "person": "3s", "value": "desharía" },
          { "mood": "conditional", "tense": "cond", "person": "1p", "value": "desharíamos" },
          { "mood": "conditional", "tense": "cond", "person": "2p_vosotros", "value": "desharíais" },
          { "mood": "conditional", "tense": "cond", "person": "3p", "value": "desharían" },

          // Imperativo afirmativo
          { "mood": "imperative", "tense": "impAff", "person": "2s_tu", "value": "deshaz", "accepts": { "vos": "deshacé" } },
          { "mood": "imperative", "tense": "impAff", "person": "3s", "value": "deshaga" },
          { "mood": "imperative", "tense": "impAff", "person": "1p", "value": "deshagamos" },
          { "mood": "imperative", "tense": "impAff", "person": "2p_vosotros", "value": "deshaced" },
          { "mood": "imperative", "tense": "impAff", "person": "3p", "value": "deshagan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "deshacer" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "deshaciendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "deshecho" }
        ]
      }
    ]
  },

  // PRET_I: intervenir (pretérito fuerte -i-)
  {
    "id": "intervenir_priority",
    "lemma": "intervenir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (g en yo, e→ie diptongación)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "intervengo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "intervienes", "accepts": { "vos": "intervenís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "interviene" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "intervenimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "intervenís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "intervienen" },

          // Pretérito indefinido (fuerte -i-)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "intervine" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "interviniste", "accepts": { "vos": "interviniste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "intervino" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "intervinimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "intervinisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "intervinieron" },

          // Presente subjuntivo (e→ie)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "intervenga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "intervengas", "accepts": { "vos": "intervengas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "intervenga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "intervengamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "intervengáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "intervengan" },

          // Futuro (irregular)
          { "mood": "indicative", "tense": "fut", "person": "1s", "value": "intervendré" },
          { "mood": "indicative", "tense": "fut", "person": "2s_tu", "value": "intervendrás", "accepts": { "vos": "intervendrás" } },
          { "mood": "indicative", "tense": "fut", "person": "3s", "value": "intervendrá" },
          { "mood": "indicative", "tense": "fut", "person": "1p", "value": "intervendremos" },
          { "mood": "indicative", "tense": "fut", "person": "2p_vosotros", "value": "intervendréis" },
          { "mood": "indicative", "tense": "fut", "person": "3p", "value": "intervendrán" },

          // Condicional (irregular)
          { "mood": "conditional", "tense": "cond", "person": "1s", "value": "intervendría" },
          { "mood": "conditional", "tense": "cond", "person": "2s_tu", "value": "intervendrías", "accepts": { "vos": "intervendrías" } },
          { "mood": "conditional", "tense": "cond", "person": "3s", "value": "intervendría" },
          { "mood": "conditional", "tense": "cond", "person": "1p", "value": "intervendríamos" },
          { "mood": "conditional", "tense": "cond", "person": "2p_vosotros", "value": "intervendríais" },
          { "mood": "conditional", "tense": "cond", "person": "3p", "value": "intervendrían" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "intervenir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "interviniendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "intervenido" }
        ]
      }
    ]
  },

  // DEFECTIVE_VERBS: desvaír (verbo defectivo)
  {
    "id": "desvaír_priority",
    "lemma": "desvaír",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Solo 3ª persona del presente
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "desvae" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "desvaen" },

          // Solo 3ª persona del subjuntivo presente
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "desvaya" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "desvayan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "desvaír" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "desvayendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "desvaído" }
        ]
      }
    ]
  },

  // DEFECTIVE_VERBS: balbucir (verbo defectivo)
  {
    "id": "balbucir_priority",
    "lemma": "balbucir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Solo 1ª y 2ª persona del presente
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "balbuceo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "balbuces", "accepts": { "vos": "balbucís" } },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "balbucimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "balbucís" },

          // Solo 1ª y 2ª persona del subjuntivo presente
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "balbucea" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "balbuceas", "accepts": { "vos": "balbuceas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "balbuceamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "balbuceáis" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "balbucir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "balbuciendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "balbucido" }
        ]
      }
    ]
  },

  // DEFECTIVE_VERBS: colorir (verbo defectivo)
  {
    "id": "colorir_priority",
    "lemma": "colorir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Solo infinitivo y participio comúnmente usados
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "colorir" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "colorido" }
        ]
      }
    ]
  },

  // DOUBLE_PARTICIPLES: elegir (doble participio: elegido/electo)
  {
    "id": "elegir_priority",
    "lemma": "elegir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (e→i, jo en yo)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "elijo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "eliges", "accepts": { "vos": "elegís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "elige" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "elegimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "elegís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "eligen" },

          // Pretérito indefinido (e→i en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "elegí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "elegiste", "accepts": { "vos": "elegiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "eligió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "elegimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "elegisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "eligieron" },

          // Presente subjuntivo (e→i, jo→ja)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "elija" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "elijas", "accepts": { "vos": "elijas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "elija" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "elijamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "elijáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "elijan" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "elegir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "eligiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "elegido" }
        ]
      }
    ]
  },

  // DOUBLE_PARTICIPLES: absorber (doble participio: absorbido/absorto)
  {
    "id": "absorber_priority",
    "lemma": "absorber",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (regular)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "absorbo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "absorbes", "accepts": { "vos": "absorbés" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "absorbe" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "absorbemos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "absorbéis" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "absorben" },

          // Pretérito indefinido (regular)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "absorbí" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "absorbiste", "accepts": { "vos": "absorbiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "absorbió" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "absorbimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "absorbisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "absorbieron" },

          // Presente subjuntivo (regular)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "absorba" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "absorbas", "accepts": { "vos": "absorbas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "absorba" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "absorbamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "absorbáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "absorban" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "absorber" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "absorbiendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "absorbido" }
        ]
      }
    ]
  },

  // DOUBLE_PARTICIPLES: bendecir (doble participio: bendecido/bendito)
  {
    "id": "bendecir_priority",
    "lemma": "bendecir",
    "type": "irregular",
    "paradigms": [
      {
        "regionTags": ["rioplatense", "la_general", "peninsular"],
        "forms": [
          // Presente indicativo (e→i, go en yo)
          { "mood": "indicative", "tense": "pres", "person": "1s", "value": "bendigo" },
          { "mood": "indicative", "tense": "pres", "person": "2s_tu", "value": "bendices", "accepts": { "vos": "bendecís" } },
          { "mood": "indicative", "tense": "pres", "person": "3s", "value": "bendice" },
          { "mood": "indicative", "tense": "pres", "person": "1p", "value": "bendecimos" },
          { "mood": "indicative", "tense": "pres", "person": "2p_vosotros", "value": "bendecís" },
          { "mood": "indicative", "tense": "pres", "person": "3p", "value": "bendicen" },

          // Pretérito indefinido (e→i en 3ª personas)
          { "mood": "indicative", "tense": "pretIndef", "person": "1s", "value": "bendije" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2s_tu", "value": "bendijiste", "accepts": { "vos": "bendijiste" } },
          { "mood": "indicative", "tense": "pretIndef", "person": "3s", "value": "bendijo" },
          { "mood": "indicative", "tense": "pretIndef", "person": "1p", "value": "bendijimos" },
          { "mood": "indicative", "tense": "pretIndef", "person": "2p_vosotros", "value": "bendijisteis" },
          { "mood": "indicative", "tense": "pretIndef", "person": "3p", "value": "bendijeron" },

          // Presente subjuntivo (e→i, go→ga)
          { "mood": "subjunctive", "tense": "subjPres", "person": "1s", "value": "bendiga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2s_tu", "value": "bendigas", "accepts": { "vos": "bendigas" } },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3s", "value": "bendiga" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "1p", "value": "bendigamos" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "2p_vosotros", "value": "bendigáis" },
          { "mood": "subjunctive", "tense": "subjPres", "person": "3p", "value": "bendigan" },

          // Futuro (irregular)
          { "mood": "indicative", "tense": "fut", "person": "1s", "value": "bendeciré" },
          { "mood": "indicative", "tense": "fut", "person": "2s_tu", "value": "bendecirás", "accepts": { "vos": "bendecirás" } },
          { "mood": "indicative", "tense": "fut", "person": "3s", "value": "bendecirá" },
          { "mood": "indicative", "tense": "fut", "person": "1p", "value": "bendeciremos" },
          { "mood": "indicative", "tense": "fut", "person": "2p_vosotros", "value": "bendeciréis" },
          { "mood": "indicative", "tense": "fut", "person": "3p", "value": "bendecirán" },

          // Condicional (irregular)
          { "mood": "conditional", "tense": "cond", "person": "1s", "value": "bendeciría" },
          { "mood": "conditional", "tense": "cond", "person": "2s_tu", "value": "bendecirías", "accepts": { "vos": "bendecirías" } },
          { "mood": "conditional", "tense": "cond", "person": "3s", "value": "bendeciría" },
          { "mood": "conditional", "tense": "cond", "person": "1p", "value": "bendeciríamos" },
          { "mood": "conditional", "tense": "cond", "person": "2p_vosotros", "value": "bendeciríais" },
          { "mood": "conditional", "tense": "cond", "person": "3p", "value": "bendecirían" },
          
          // Formas no conjugadas
          { "mood": "nonfinite", "tense": "inf", "person": "", "value": "bendecir" },
          { "mood": "nonfinite", "tense": "ger", "person": "", "value": "bendiciendo" },
          { "mood": "nonfinite", "tense": "part", "person": "", "value": "bendecido" }
        ]
      }
    ]
  }
]

// Función para combinar con verbos principales sin duplicados
export function getAllVerbsWithPriority(mainVerbs) {
  const existingLemmas = new Set(mainVerbs.map(v => v.lemma))
  const uniquePriorityVerbs = priorityVerbs.filter(v => !existingLemmas.has(v.lemma))
  return [...mainVerbs, ...uniquePriorityVerbs]
}
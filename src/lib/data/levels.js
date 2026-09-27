// levels.js — Config y validadores de niveles (JS puro con JSDoc)

/** @typedef {"A1"|"A2"|"B1"|"B2"|"C1"|"C2"} CEFR */
/** @typedef {"indicativo"|"subjuntivo"|"imperativo"|"condicional"} Mood */
/** @typedef {"presente"|"preterito_perfecto_simple"|"preterito_imperfecto"|"preterito_perfecto_compuesto"|"preterito_pluscuamperfecto"|"futuro_simple"|"futuro_compuesto"|"imperfecto_subjuntivo"|"pluscuamperfecto_subjuntivo"|"presente_subjuntivo"|"preterito_perfecto_subjuntivo"|"imperativo_afirmativo"|"imperativo_negativo"|"condicional_simple"|"condicional_compuesto"|"futuro_subjuntivo"|"futuro_perfecto_subjuntivo"} Tense */
/** @typedef {"1sg"|"2sg"|"3sg"|"1pl"|"2pl"|"3pl"} Person */
/** @typedef {"vos"|"tu"|"usted"|"ustedes"|"vosotros"} Treatment */

const P = (mood, tense) => ({ mood, tense });

const INVENTORY = {
  A1: [ P("indicativo","pres") ],
  A2: [
    P("indicativo","pretIndef"),
    P("indicativo","impf"),
    P("indicativo","fut"),
    P("imperativo","impAff"),
    P("indicativo","pres"),
  ],
  B1: [
    P("indicativo","plusc"),
    P("indicativo","pretPerf"),
    P("indicativo","futPerf"),
    P("subjuntivo","subjPres"),
    P("subjuntivo","subjPerf"),
    P("imperativo","impNeg"),
    P("condicional","cond"),
    P("indicativo","pres"),
    P("indicativo","pretIndef"),
    P("indicativo","impf"),
    P("indicativo","fut"),
    P("imperativo","impAff"),
  ],
  B2: [
    P("subjuntivo","subjImpf"),
    P("subjuntivo","subjPlusc"),
    P("condicional","condPerf"),
    P("indicativo","pres"),
    P("indicativo","pretIndef"),
    P("indicativo","impf"),
    P("indicativo","pretPerf"),
    P("indicativo","plusc"),
    P("indicativo","fut"),
    P("indicativo","futPerf"),
    P("subjuntivo","subjPres"),
    P("subjuntivo","subjPerf"),
    P("imperativo","impAff"),
    P("imperativo","impNeg"),
    P("condicional","cond"),
  ],
  C1: [
    P("indicativo","pres"),
    P("indicativo","pretIndef"),
    P("indicativo","impf"),
    P("indicativo","pretPerf"),
    P("indicativo","plusc"),
    P("indicativo","fut"),
    P("indicativo","futPerf"),
    P("subjuntivo","subjPres"),
    P("subjuntivo","subjPerf"),
    P("subjuntivo","subjImpf"),
    P("subjuntivo","subjPlusc"),
    P("imperativo","impAff"),
    P("imperativo","impNeg"),
    P("condicional","cond"),
    P("condicional","condPerf"),
    P("subjuntivo","subjFut"),
    P("subjuntivo","subjFutPerf"),
  ],
  C2: [
    // Igual que C1 en inventario
    ...[
      "pres","pretIndef","impf",
      "pretPerf","plusc",
      "fut","futPerf"
    ].map(t=>P("indicativo",t)),
    ...[
      "subjPres","subjPerf",
      "subjImpf","subjPlusc",
      "subjFut","subjFutPerf"
    ].map(t=>P("subjuntivo",t)),
    P("imperativo","impAff"),
    P("imperativo","impNeg"),
    P("condicional","cond"),
    P("condicional","condPerf"),
  ],
};

// Expanded verb packs with existing verbs only
export const PACKS = {
  A1_CORE: { 
    id:"A1_CORE", 
    lemmas:[
      // Irregulares básicos esenciales
      "ser","estar","tener","haber","ir","venir","poder","querer","hacer","decir","poner","dar",
      // Regulares básicos esenciales (TODOS los disponibles)
      "hablar","comer","vivir","trabajar","estudiar","caminar","bailar","cantar","escuchar","mirar",
      "comprar","necesitar","usar","ayudar","beber","correr","escribir","aprender","decidir","responder",
      "subir","vender","amar","buscar","comprender","permitir","recibir","sufrir","unir"
    ] 
  },
  A1_REGULARES_AR: {
    id:"A1_REGULARES_AR",
    lemmas:["hablar","trabajar","estudiar","caminar","bailar","cantar","escuchar","mirar","comprar","necesitar","usar","ayudar","amar","buscar"]
  },
  A1_REGULARES_ER: {
    id:"A1_REGULARES_ER", 
    lemmas:["comer","beber","correr","aprender","comprender","responder","vender"]
  },
  A1_REGULARES_IR: {
    id:"A1_REGULARES_IR",
    lemmas:["vivir","escribir","decidir","subir","sufrir","unir","recibir","permitir"]
  },
  A2_PASTS: { 
    id:"A2_PASTS", 
    lemmas:["buscar","llegar","almorzar","poder","poner","estar","tener","venir","hacer","decir","querer","andar","traer","dormir","pedir"] 
  },
  B1_PARTICIPLES: { 
    id:"B1_PARTICIPLES", 
    lemmas:["ver","escribir","volver","freír","imprimir","romper","abrir","poner","hacer","decir","cubrir","descubrir","morir","proveer"] 
  },
  B1_EXPANDED: {
    id:"B1_EXPANDED",
    lemmas:[
      // Verbos regulares esenciales para B1
      "hablar","comer","vivir","trabajar","estudiar","caminar","bailar","cantar","escuchar","mirar",
      "comprar","necesitar","usar","ayudar","beber","correr","aprender","decidir","responder",
      "subir","vender","amar","buscar","comprender","permitir","recibir","sufrir","unir",
      "entrar","salir","llegar","empezar","terminar","seguir","encontrar","llamar","llevar","pasar",
      "deber","dejar","parecer","conseguir","sentir","servir","caer","leer","creer","construir",
      "contar","dormir","morir","pedir","repetir","mentir","convertir","divertir","preferir",
      // Irregulares importantes para B1 (subjuntivo, imperativo, condicional)
      "ser","estar","tener","haber","ir","venir","poder","querer","hacer","decir","poner","dar",
      "saber","salir","valer","conocer","parecer","producir","conducir","traducir","ofrecer",
      "traer","oír","caer","leer","creer","construir","destruir","huir","incluir","concluir"
    ]
  },
  B2_ALTER: { 
    id:"B2_ALTER", 
    lemmas:["conocer","distinguir","seguir","oír","crecer","nacer","parecer","obedecer","merecer","agradecer","establecer","conducir","traducir","producir","reducir","construir","instruir","contribuir","distribuir","incluir","trabajar","estudiar","organizar","utilizar","comunicar"] 
  },
  C1_RARE: { 
    id:"C1_RARE", 
    lemmas:["argüir","abolir","erguir","aullar","balbucir","blandir","colorir","empedernir","gruñir","bullir","zambullir","engullir","adecuar","actuar","situar","graduar","evacuar","evaluar","fraguar","atestiguar","menguar","desaguar","aguar","apaciguar","santiguar","absorber","fabricar","practicar","educar","publicar"] 
  },
  C2_ADVANCED: { 
    id:"C2_ADVANCED", 
    lemmas:["argüir","abolir","erguir","aullar","balbucir","blandir","colorir","empedernir","gruñir","bullir","zambullir","engullir","adecuar","actuar","situar","graduar","evacuar","evaluar","fraguar","atestiguar","menguar","desaguar","aguar","apaciguar","santiguar","podrir","teñir","ceñir","reñir","tañir","desvaír","bendecir","absorber","fabricar","practicar","educar","publicar","navegar","obligar","provocar","castigar","atacar","estudiar","trabajar","organizar","utilizar","comunicar","realizar","explicar"] 
  }
};

// Config por nivel (las “perillas”)
export const LEVELS = {
  A1: {
    level:"A1",
    dialect:"rioplatense",
    persons:["1sg","2sg","3sg","1pl"],
    treatments:["vos","tu","usted"],
    inventory:INVENTORY.A1,
    orth:{ accents:"off", dieresisRequired:false, hardBlockBadForms:false },
    variants:{ impSubj:"accept_both", futureSubjunctive:"off" },
    defectives:{ behavior:"warn" },
    mixing:{ switchesPerDrill:0, crossMode:false, fastTreatmentSwitch:false },
    timing:{ perItemMs:null },
    scoring:{ minAccuracy:90, orthPenalty:0, allowDoubleParticiples:false },
    verbPacks:[PACKS.A1_CORE], rareVerbs:false,
  },
  A2: {
    level:"A2",
    dialect:"rioplatense",
    persons:["1sg","2sg","3sg","1pl","3pl"],
    treatments:["vos","tu","usted","ustedes"],
    inventory:INVENTORY.A2,
    orth:{ accents:"lenient", dieresisRequired:false, hardBlockBadForms:false },
    variants:{ impSubj:"accept_both", futureSubjunctive:"off" },
    defectives:{ behavior:"warn" },
    mixing:{ switchesPerDrill:0, crossMode:false, fastTreatmentSwitch:false },
    timing:{ perItemMs:8000 },
    scoring:{ minAccuracy:92, orthPenalty:0.25, allowDoubleParticiples:false },
    verbPacks:[PACKS.A1_CORE, PACKS.A2_PASTS], rareVerbs:false,
  },
  B1: {
    level:"B1",
    dialect:"rioplatense",
    persons:["1sg","2sg","3sg","1pl","3pl"],
    treatments:["vos","tu","usted","ustedes"],
    inventory:INVENTORY.B1,
    orth:{ accents:"strict", dieresisRequired:false, hardBlockBadForms:false },
    variants:{ impSubj:"accept_both", futureSubjunctive:"off" },
    defectives:{ behavior:"warn" },
    mixing:{ switchesPerDrill:2, crossMode:true, fastTreatmentSwitch:false },
    timing:{ perItemMs:6000, targetMedianMs:3000 },
    scoring:{ minAccuracy:94, orthPenalty:0.5, allowDoubleParticiples:true },
    verbPacks:[PACKS.B1_EXPANDED], rareVerbs:false,
  },
  B2: {
    level:"B2",
    dialect:"rioplatense",
    persons:["1sg","2sg","3sg","1pl","3pl"],
    treatments:["vos","usted","ustedes"],
    inventory:INVENTORY.B2,
    orth:{ accents:"strict", dieresisRequired:true, hardBlockBadForms:false },
    variants:{ impSubj:"accept_both", futureSubjunctive:"off" },
    defectives:{ behavior:"block_invalid_persons" },
    mixing:{ switchesPerDrill:4, crossMode:true, fastTreatmentSwitch:true },
    timing:{ perItemMs:5000, targetMedianMs:2500 },
    scoring:{ minAccuracy:95, orthPenalty:0.75, allowDoubleParticiples:true },
    verbPacks:[PACKS.B1_PARTICIPLES, PACKS.B2_ALTER], rareVerbs:false,
  },
  C1: {
    level:"C1",
    dialect:"rioplatense",
    persons:["1sg","2sg","3sg","1pl","3pl"],
    treatments:["vos","usted","ustedes"],
    inventory:INVENTORY.C1,
    orth:{ accents:"strict", dieresisRequired:true, hardBlockBadForms:true },
    variants:{ impSubj:"enforce", futureSubjunctive:"labelled_optional" },
    defectives:{ behavior:"block_invalid_persons" },
    mixing:{ switchesPerDrill:8, crossMode:true, fastTreatmentSwitch:true },
    timing:{ perItemMs:3500, targetMedianMs:1800 },
    scoring:{ minAccuracy:97, orthPenalty:1.0, allowDoubleParticiples:true },
    verbPacks:[PACKS.B2_ALTER, PACKS.C1_RARE], rareVerbs:true,
  },
  C2: {
    level:"C2",
    dialect:"rioplatense",
    persons:["1sg","2sg","3sg","1pl","3pl"],
    treatments:["vos","usted","ustedes"],
    inventory:INVENTORY.C2,
    orth:{ accents:"hard", dieresisRequired:true, hardBlockBadForms:true },
    variants:{ impSubj:"must_match_prompt", futureSubjunctive:"labelled_optional" },
    defectives:{ behavior:"hard_block" },
    mixing:{ switchesPerDrill:12, crossMode:true, fastTreatmentSwitch:true },
    timing:{ perItemMs:2500, targetMedianMs:1200 },
    scoring:{ minAccuracy:98, orthPenalty:1.0, allowDoubleParticiples:true },
    verbPacks:[PACKS.C2_ADVANCED], rareVerbs:true,
  },
};

// ——— Helpers mínimos ————————————————————————————————————————————————

const UNIPERSONALES = new Set(["llover","nevar","granizar","amanecer"]);

/** @param {string} lemma @param {Person} person @param {CEFR} level */
export function isPersonAllowed(lemma, person, level){
  const behavior = LEVELS[level].defectives.behavior;
  if (behavior === "warn") return true;
  const only3 = UNIPERSONALES.has(lemma);
  if (!only3) return true;
  const ok = (person==="3sg"||person==="3pl");
  if (behavior === "block_invalid_persons") return ok;
  if (behavior === "hard_block") return ok;
  return true;
}

/** Normalización suave (espacios múltiples, mayúsculas). No toca tildes salvo que strict=false. */
function _normalize(s, strictAccents){
  if (!strictAccents) {
    // minúsculas + quita acentos/diéresis SOLO si no son estrictos
    return s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .replace(/\s+/g," ")
      .trim();
  }
  return s.toLowerCase().replace(/\s+/g," ").trim();
}

// VALIDADOR ELIMINADO: isCorrect() era un validador alternativo
// no utilizado que duplicaba funcionalidad del grader principal.
// Su lógica ha sido consolidada en src/lib/core/grader.js para
// mantener un solo punto de validación en toda la aplicación.

// ——— Builder de consigna ———————————————————————————————————————————————

/**
 * buildItemSpec: arma la consigna con reglas del nivel.
 * @returns {{lemma:string,target:{mood:Mood,tense:Tense,person:Person,treatment:Treatment},policies:any}}
 */
export function buildItemSpec({ lemma, mood, tense, person, level, treatment="vos", enforceVariantSe=false }){
  const cfg = LEVELS[level];
  const variantNote = enforceVariantSe
    ? "forma en -se"
    : (cfg.variants.impSubj==="enforce"||cfg.variants.impSubj==="must_match_prompt")
      ? "variante especificada en consigna"
      : "acepta -ra/-se";

  return {
    lemma,
    target:{ mood, tense, person, treatment },
    policies:{
      level,
      orth: cfg.orth,
      variants:{ ...cfg.variants, note: variantNote },
      defectives: cfg.defectives,
      mixing: cfg.mixing,
      timing: cfg.timing,
      scoring: cfg.scoring,
    }
  };
}

// Lightweight levels and correctness helper layer

// (Removed older placeholder exports to avoid duplicates)

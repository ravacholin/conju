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
const PACKS = {
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
    clitics:null,
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
    clitics:{ requiredPercent:0, position:"any", exactString:null },
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
    clitics:{ requiredPercent:0, position:"any", exactString:null },
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
    clitics:{ requiredPercent:10, position:"any", exactString:null },
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
    clitics:{ requiredPercent:30, position:"enclitic", exactString:null },
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
    clitics:{ requiredPercent:60, position:"enclitic", exactString:null },
    mixing:{ switchesPerDrill:12, crossMode:true, fastTreatmentSwitch:true },
    timing:{ perItemMs:2500, targetMedianMs:1200 },
    scoring:{ minAccuracy:98, orthPenalty:1.0, allowDoubleParticiples:true },
    verbPacks:[PACKS.C2_ADVANCED], rareVerbs:true,
  },
};

// ——— Helpers mínimos ————————————————————————————————————————————————

const UNIPERSONALES = new Set(["llover","nevar","granizar","amanecer"]);
const DEFECTIVOS_PARCIALES = new Set(["abolir"]); // ajustá si querés

/** @param {string} lemma @param {Person} person @param {CEFR} level */
export function isPersonAllowed(lemma, person, level){
  const behavior = LEVELS[level].defectives.behavior;
  if (behavior === "warn") return true;
  const only3 = UNIPERSONALES.has(lemma) || DEFECTIVOS_PARCIALES.has(lemma);
  if (!only3) return true;
  const ok = (person==="3sg"||person==="3pl");
  if (behavior === "block_invalid_persons") return ok;
  if (behavior === "hard_block") return ok;
  return true;
}

/** Normalización suave (espacios múltiples, mayúsculas). No toca tildes salvo que strict=false. */
function normalize(s, strictAccents){
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

/** Chequea clíticos y acentuación básica de imperativo afirmativo + enclíticos */
function checkClitics(user, spec){
  const c = spec.policies.clitics;
  if (!c || !c.required) return { ok:true, reason:null };
  // posición mínima: si imperativo afirmativo ⇒ enclítico
  if (spec.target.mood==="imperativo" && spec.target.tense==="imperativo_afirmativo" && c.position==="enclitic"){
    // heurística: debe terminar en "me|te|se|lo|la|le|nos|los|las|les" (o combinaciones) y llevar tilde si corresponde
    const encliticRegex = /(me|te|se|lo|la|le|nos|los|las|les)+$/;
    const okAttach = encliticRegex.test(user.replace(/\s+/g,""));
    if (!okAttach) return { ok:false, reason:"clitics_position" };
    // acentuación mínima: si termina en -melo/-selo/-noslo etc. y la sílaba cae en la antepenúltima, debería llevar tilde (dámelo, oigámoselo)
    // No implementamos prosodia completa; validación liviana:
    const needsTilde = /(melo|selo|noslo|mela|sela|nosla|selos|selas|melos|melas)$/i.test(user.replace(/\s+/g,""));
    const hasTilde = /á|é|í|ó|ú/i.test(user);
    if (needsTilde && !hasTilde) return { ok:false, reason:"accent_missing_on_enclitic" };
  }
  // Solo exigir cadena exacta si NO es enclítico
  if (c.exact && c.position !== "enclitic") {
    const want = c.exact.replace(/\s+/g," ").toLowerCase()
    const has = user.toLowerCase().includes(want)
    if (!has) return { ok:false, reason:"clitics_string_mismatch" };
  }
  return { ok:true, reason:null };
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
export function buildItemSpec({ lemma, mood, tense, person, level, treatment="vos", enforceVariantSe=false, clitics=null }){
  const cfg = LEVELS[level];
  const variantNote = enforceVariantSe
    ? "forma en -se"
    : (cfg.variants.impSubj==="enforce"||cfg.variants.impSubj==="must_match_prompt")
      ? "variante especificada en consigna"
      : "acepta -ra/-se";

  const cliticPolicy = (cfg.clitics && cfg.clitics.requiredPercent>0)
    ? {
        required: Boolean(clitics),
        position: cfg.clitics.position,
        // Para enclítico (imperativo afirmativo), no exigir cadena exacta separada
        exact: cfg.clitics.position === 'enclitic' ? null : clitics,
      }
    : { required:false, position:"any", exact:null };

  return {
    lemma,
    target:{ mood, tense, person, treatment },
    policies:{
      level,
      orth: cfg.orth,
      variants:{ ...cfg.variants, note: variantNote },
      defectives: cfg.defectives,
      clitics: cliticPolicy,
      mixing: cfg.mixing,
      timing: cfg.timing,
      scoring: cfg.scoring,
    }
  };
}

// Lightweight levels and correctness helper layer

// (Removed older placeholder exports to avoid duplicates)

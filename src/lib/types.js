/** @typedef {"A1"|"A2"|"B1"|"B2"|"C1"|"C2"} Level */
/** @typedef {"produce"|"recognize"} SkillTarget */
/** @typedef {"indicative"|"subjunctive"|"imperative"|"conditional"|"nonfinite"} Mood */
/** @typedef {
 *  | "pres"|"pretPerf"|"pretIndef"|"impf"|"plusc"|"fut"|"futPerf"
 *  | "subjPres"|"subjImpf"|"subjPerf"|"subjPlusc"
 *  | "impAff"|"impNeg"
 *  | "cond"|"condPerf"
 *  | "inf"|"ger"|"part"|"irAInf"|"presFuturate"
 * } Tense */
/** @typedef {"1s"|"2s_tu"|"2s_vos"|"3s"|"1p"|"2p_vosotros"|"3p"} Person */

/**
 * @typedef {Object} CurriculumGate
 * @property {Level} level
 * @property {Mood} mood
 * @property {Tense} tense
 * @property {SkillTarget} target
 */

/**
 * @typedef {Object} Form
 * @property {Mood} mood
 * @property {Tense} tense
 * @property {Person} person
 * @property {string} value
 * @property {string[]=} alt
 * @property {{tu?: string, vos?: string, vosotros?: string}=} accepts
 * @property {string[]=} rules
 */

/**
 * @typedef {Object} Paradigm
 * @property {("rioplatense"|"la_general"|"peninsular"|"voseo_ca")[]=} regionTags
 * @property {Form[]} forms
 */

/**
 * @typedef {Object} VerbEntry
 * @property {string} id
 * @property {string} lemma
 * @property {number=} freq
 * @property {string[]=} notes
 * @property {Paradigm[]} paradigms
 */ 
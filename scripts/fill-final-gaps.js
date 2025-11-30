import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERBS_FILE_PATH = path.join(__dirname, '../src/data/verbs.js');

let verbsModuleContent = fs.readFileSync(VERBS_FILE_PATH, 'utf8');
const verbsMatch = verbsModuleContent.match(/export const verbs = (\[[\s\S]*?\]);/);
if (!verbsMatch) process.exit(1);

let verbs = JSON.parse(verbsMatch[1]);
const changesReport = [];
let hasChanges = false;

console.log(`🔍 Rellenando últimos huecos en la base de datos...`);

const IMPERATIVE_TU_IRREGULARS = {
    'decir': 'di', 'hacer': 'haz', 'ir': 've', 'poner': 'pon', 'salir': 'sal', 'ser': 'sé', 'tener': 'ten', 'venir': 'ven'
};

function getTuImperative(lemma) {
    if (IMPERATIVE_TU_IRREGULARS[lemma]) return IMPERATIVE_TU_IRREGULARS[lemma];
    
    // Check for derived irregulars (compounds like 'mantener' -> 'mantén')
    for (const baseLemma in IMPERATIVE_TU_IRREGULARS) {
        if (lemma !== baseLemma && lemma.endsWith(baseLemma)) {
            const prefix = lemma.slice(0, -baseLemma.length);
            let form = IMPERATIVE_TU_IRREGULARS[baseLemma];
            
            // Special cases for 'decir' compounds (e.g., 'bendecir' -> 'bendice', not 'bendi')
            if (baseLemma === 'decir') {
                 // For now, assume it copies 3s pres ind, which is 'bendice'.
                 // We need the pres3s here, which implies a circular dependency if we don't fetch it first.
                 // For safety, let's treat 'decir' compounds as regular (derived from 3s pres ind)
                 // This will be handled by the general rule if pres3s is available.
                 continue; // Skip specific irregular handling for 'decir' compounds for now.
            }
            
            // Apply accentuation if needed for compounds
            // This is a complex rule, simplest is to check if it's already in the DB
            // Or assume general rule if not explicitly handled.
            // For now, simple prefixing for other irregular roots
            return prefix + form;
        }
    }

    // Default regular rule: same as 3s pres indicative.
    // This value needs to be retrieved from the verb's data, which implies a 2-pass approach
    // or passing the pres3s value to this function.
    // For this backfill, we'll try to get it directly from the verb object.
    const pres3sForm = findForm(verb, 'indicative', 'pres', '3s');
    return pres3sForm ? pres3sForm.value : null;
}

// Helper para buscar forma existente dentro de un paradigma
const findForm = (verbObj, mood, tense, person) => {
    const paradigm = verbObj.paradigms[0];
    return paradigm.forms.find(f => f.mood === mood && f.tense === tense && f.person === person);
};

verbs.forEach(verb => {
    const paradigm = verb.paradigms[0];
    if (!paradigm) return;

    // --- PASO 1: Rellenar imperative|impAff|2s_vos ---
    const impAffVos = findForm(verb, 'imperative', 'impAff', '2s_vos');
    if (!impAffVos) {
        const presVos = findForm(verb, 'indicative', 'pres', '2s_vos');
        if (presVos && presVos.value) {
            let newValue = presVos.value;
            // cantás -> cantá; comés -> comé; vivís -> viví
            if (newValue.endsWith('ás')) newValue = newValue.slice(0, -2) + 'á';
            else if (newValue.endsWith('és')) newValue = newValue.slice(0, -2) + 'é';
            else if (newValue.endsWith('ís')) newValue = newValue.slice(0, -2) + 'í';
            else if (newValue.endsWith('s') && !newValue.endsWith('es') && !newValue.endsWith('as')) newValue = newValue.slice(0, -1); // Caso monosílabos?
            // Excepción especial para IR: 'vos vas' -> 'andá' o 'id'
            if (verb.lemma === 'ir') newValue = 'andá'; 

            paradigm.forms.push({
                mood: 'imperative',
                tense: 'impAff',
                person: '2s_vos',
                value: newValue
            });
            changesReport.push({ lemma: verb.lemma, change: `impAff 2s_vos añadido: ${newValue}` });
            hasChanges = true;
        }
    }
    
    // --- PASO 2: Rellenar Tiempos Faltantes (Indicativo e Imperativo) ---
    // Este es el grupo de verbos que tenían muchos huecos después de la reparación del subjuntivo
    const missingVerbsForFullRegen = [
        "recordar", "costar", "preferir", "resolver", "sonar", "volar", "despertar", "competir", "vestir", "andar"
    ];

    if (missingVerbsForFullRegen.includes(verb.lemma)) {
        const lemma = verb.lemma;
        const isAr = lemma.endsWith('ar');
        const isEr = lemma.endsWith('er');
        const isIr = lemma.endsWith('ir');

        // Personas estándar
        const persons = ['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p'];

        // Desinencias de Futuro/Condicional (regulares)
        const futEndings = ['é', 'ás', 'ás', 'á', 'emos', 'éis', 'án']; // Tu/vos same
        const condEndings = ['ía', 'ías', 'ías', 'ía', 'íamos', 'íais', 'ían']; // Tu/vos same
        
        // --- Generar Futuro ---
        if (!findForm(verb, 'indicative', 'fut', '1s')) { // Si falta la 1s, asumimos que falta todo
            persons.forEach((person, idx) => {
                const existing = findForm(verb, 'indicative', 'fut', person);
                if (!existing) {
                    let futValue = lemma + futEndings[idx];
                    // Excepciones irregulares (mantener -> mantendré)
                    if (['tener', 'venir', 'poner', 'salir', 'valer', 'saber', 'haber', 'caber', 'poder'].includes(lemma) ||
                        lemma.endsWith('tener') || lemma.endsWith('venir') || lemma.endsWith('poner') || lemma.endsWith('salir')) {
                        // Derivar stem irregular (tendr, vendr, pondr, saldr, valdr, sabr, habr, cabr, podr)
                        // Para estos, el algoritmo de generacion es mas complejo. Por ahora, asumimos que existen o los dejaremos como faltantes.
                        // Solo arreglaremos los que son regularish en Fut/Cond
                    }
                    if (verb.lemma === 'hacer') futValue = 'har' + futEndings[idx];
                    if (verb.lemma === 'decir') futValue = 'dir' + futEndings[idx];

                    paradigm.forms.push({ mood: 'indicative', tense: 'fut', person, value: futValue });
                    changesReport.push({ lemma: verb.lemma, change: `Futuro ${person} generado: ${futValue}` });
                    hasChanges = true;
                }
            });
        }
        
        // --- Generar Condicional ---
        if (!findForm(verb, 'conditional', 'cond', '1s')) { // Si falta la 1s, asumimos que falta todo
            persons.forEach((person, idx) => {
                const existing = findForm(verb, 'conditional', 'cond', person);
                if (!existing) {
                    let condValue = lemma + condEndings[idx];
                    // Irregularidades (tendría, vendría, etc.) - Igual que futuro
                    if (verb.lemma === 'hacer') condValue = 'har' + condEndings[idx];
                    if (verb.lemma === 'decir') condValue = 'dir' + condEndings[idx];

                    paradigm.forms.push({ mood: 'conditional', tense: 'cond', person, value: condValue });
                    changesReport.push({ lemma: verb.lemma, change: `Condicional ${person} generado: ${condValue}` });
                    hasChanges = true;
                }
            });
        }

        // --- Generar Imperfecto --- (Todos son regulares salvo excepciones muy raras)
        if (!findForm(verb, 'indicative', 'impf', '1s')) {
             const impfStem = lemma.slice(0, -2);
             const impfVowel = isAr ? 'a' : 'í'; // amar -> amaba, comer -> comía, vivir -> vivía
             const impfEndingsAr = ['ba', 'bas', 'bas', 'ba', 'bamos', 'bais', 'ban']; // tu/vos same
             const impfEndingsErIr = ['a', 'as', 'as', 'a', 'amos', 'ais', 'an']; // tu/vos same

             persons.forEach((person, idx) => {
                 const existing = findForm(verb, 'indicative', 'impf', person);
                 if (!existing) {
                     let impfValue = impfStem + (isAr ? impfEndingsAr[idx] : impfVowel + impfEndingsErIr[idx]);
                     if (verb.lemma === 'ir') impfValue = (person === '1s' || person === '3s' ? 'iba' : (person === '2s_tu' || person === '2s_vos' ? 'ibas' : (person === '1p' ? 'íbamos' : (person === '2p_vosotros' ? 'ibais' : 'iban'))));
                     if (verb.lemma === 'ser') impfValue = (person === '1s' || person === '3s' ? 'era' : (person === '2s_tu' || person === '2s_vos' ? 'eras' : (person === '1p' ? 'éramos' : (person === '2p_vosotros' ? 'erais' : 'eran'))));
                     if (verb.lemma === 'ver') impfValue = (person === '1s' || person === '3s' ? 'veía' : (person === '2s_tu' || person === '2s_vos' ? 'veías' : (person === '1p' ? 'veíamos' : (person === '2p_vosotros' ? 'veíais' : 'veían'))));

                     paradigm.forms.push({ mood: 'indicative', tense: 'impf', person, value: impfValue });
                     changesReport.push({ lemma: verb.lemma, change: `Imperfecto ${person} generado: ${impfValue}` });
                     hasChanges = true;
                 }
             });
        }

        // --- Generar Pretérito Indefinido ---
        // Aquí hay que ser más cuidadoso con irregulares
        if (!findForm(verb, 'indicative', 'pretIndef', '1s')) {
            const pretStem = lemma.slice(0, -2);
            const pretEndingsAr = ['é', 'aste', 'aste', 'ó', 'amos', 'asteis', 'aron']; // Tu/vos same
            const pretEndingsErIr = ['í', 'iste', 'iste', 'ió', 'imos', 'isteis', 'ieron']; // Tu/vos same

            persons.forEach((person, idx) => {
                 const existing = findForm(verb, 'indicative', 'pretIndef', person);
                 if (!existing) {
                     let pretValue = '';
                     // Verbos con irregulares fuertes (andar, tener, etc.)
                     if (verb.lemma === 'andar') {
                         const andarForms = ['anduve', 'anduviste', 'anduviste', 'anduvo', 'anduvimos', 'anduvisteis', 'anduvieron'];
                         pretValue = andarForms[idx];
                     } else if (verb.lemma === 'estar') {
                        const estarForms = ['estuve', 'estuviste', 'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron'];
                        pretValue = estarForms[idx];
                     } // ... otros irregulares fuertes (poder, poner, caber, saber, hacer, decir, querer, venir, haber)
                     else if (verb.lemma.endsWith('ir') && findForm(verb, 'indicative', 'pres', '1s')?.value.includes('ie') ) { // e->ie en pres (preferir)
                        // preferir -> preferí, preferiste, prefirió
                        const irPretEndings = ['í', 'iste', 'iste', 'ió', 'imos', 'isteis', 'ieron'];
                        let stem = pretStem;
                        if (idx === 3 || idx === 6) stem = stem.replace('e', 'i'); // 3s y 3p: prefirió, prefirieron
                        pretValue = stem + irPretEndings[idx];
                     } else if (verb.lemma.endsWith('ir') && findForm(verb, 'indicative', 'pres', '1s')?.value.includes('ue') ) { // o->ue en pres (dormir)
                        // dormir -> dormí, dormiste, durmió
                        const irPretEndings = ['í', 'iste', 'iste', 'ió', 'imos', 'isteis', 'ieron'];
                        let stem = pretStem;
                        if (idx === 3 || idx === 6) stem = stem.replace('o', 'u'); // 3s y 3p: durmió, durmieron
                        pretValue = stem + irPretEndings[idx];
                     }
                     else { // Regular
                         pretValue = pretStem + (isAr ? pretEndingsAr[idx] : pretEndingsErIr[idx]);
                     }
                     
                     paradigm.forms.push({ mood: 'indicative', tense: 'pretIndef', person, value: pretValue });
                     changesReport.push({ lemma: verb.lemma, change: `Pretérito Indefinido ${person} generado: ${pretValue}` });
                     hasChanges = true;
                 }
            });
        }
    }
});

if (hasChanges) {
    const newVerbsArrayString = JSON.stringify(verbs, null, 2);
    const newModuleContent = verbsModuleContent.replace(/export const verbs = \[[\s\S]*?\];/, `export const verbs = ${newVerbsArrayString};`);
    fs.writeFileSync(VERBS_FILE_PATH, newModuleContent, 'utf8');
    console.log(`✅ Base de datos actualizada con relleno final.`);
    console.log(`   Total de cambios: ${changesReport.length}`);
    fs.writeFileSync(path.join(__dirname, 'final_fill_report.json'), JSON.stringify(changesReport, null, 2));
} else {
    console.log('✅ No se requirieron cambios de relleno final.');
}

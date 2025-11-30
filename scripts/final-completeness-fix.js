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

console.log(`🔍 Aplicando arreglo final de completitud (Pase 2)...`);

// Helper para buscar forma existente dentro de un paradigma
const findForm = (verbObj, mood, tense, person) => {
    const paradigm = verbObj.paradigms[0];
    return paradigm.forms.find(f => f.mood === mood && f.tense === tense && f.person === person);
};

// Helper para obtener todas las formas de un modo/tiempo para un verbo
const findAllForms = (verbObj, mood, tense) => {
    const paradigm = verbObj.paradigms[0];
    return paradigm.forms.filter(f => f.mood === mood && f.tense === tense);
};


verbs.forEach(verb => {
    const paradigm = verb.paradigms[0]; // Corrected: paradigms
    if (!paradigm) return;
    
    // --- Paso 1: Rellenar o CORREGIR indicative|pres|2s_vos ---
    const presTu = findForm(verb, 'indicative', 'pres', '2s_tu');
    let presVos = findForm(verb, 'indicative', 'pres', '2s_vos');

    if (presTu && presTu.value) { // Solo si tenemos 'tú' para derivar
        let derivedPresVosValue = presTu.value;
        // Aplicar reglas de voseo para presente indicativo
        if (verb.lemma.endsWith('ar')) { // Cantar -> cantas -> cantás
            if (derivedPresVosValue.endsWith('as')) derivedPresVosValue = derivedPresVosValue.slice(0, -2) + 'ás';
        } else if (verb.lemma.endsWith('er')) { // Comer -> comes -> comés
            if (derivedPresVosValue.endsWith('es')) derivedPresVosValue = derivedPresVosValue.slice(0, -2) + 'és';
        } else if (verb.lemma.endsWith('ir')) { // Vivir -> vives -> vivís
            if (derivedPresVosValue.endsWith('es')) derivedPresVosValue = derivedPresVosValue.slice(0, -2) + 'ís';
        }
        
        // Excepciones (solo "haber", "ser", "ir" son muy irregulares)
        if (verb.lemma === 'haber') derivedPresVosValue = 'has'; // Vos has
        else if (verb.lemma === 'ser') derivedPresVosValue = 'sos'; // Vos sos
        else if (verb.lemma === 'ir') derivedPresVosValue = 'vas'; // Vos vas (no confundir con andá del imperativo)
        
        if (!presVos) {
            paradigm.forms.push({
                mood: 'indicative',
                tense: 'pres',
                person: '2s_vos',
                value: derivedPresVosValue
            });
            changesReport.push({ lemma: verb.lemma, change: `indicative|pres|2s_vos añadido: ${derivedPresVosValue}` });
            hasChanges = true;
        } else if (presVos.value !== derivedPresVosValue) {
            changesReport.push({ lemma: verb.lemma, change: `indicative|pres|2s_vos corregido: ${presVos.value} -> ${derivedPresVosValue}` });
            presVos.value = derivedPresVosValue;
            hasChanges = true;
        }
    }


    // --- Paso 2: Rellenar subjunctive|subjImpf (derivado de pretIndef|3s) ---
    // Buscar si falta alguna forma de subjImpf (contamos formas, si es < 7, está incompleto)
    const currentSubjImpfForms = findAllForms(verb, 'subjunctive', 'subjImpf');

    if (currentSubjImpfForms.length < 7) { // 7 personas (1s, 2s_tu, 2s_vos, 3s, 1p, 2p_vosotros, 3p)
        const pretIndef3s = findForm(verb, 'indicative', 'pretIndef', '3s');
        if (pretIndef3s && pretIndef3s.value) {
            let stem = '';
            if (pretIndef3s.value.endsWith('ó')) stem = pretIndef3s.value.slice(0, -1);
            else if (pretIndef3s.value.endsWith('ió')) stem = pretIndef3s.value.slice(0, -2);
            else if (pretIndef3s.value.endsWith('o')) stem = pretIndef3s.value.slice(0, -1); // Caso hizo -> hiz
            else { /* No se pudo derivar el stem del pretIndef. Dejamos como faltante. */ return; }
            
            const persons = ['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p'];
            
            persons.forEach(person => {
                const existing = findForm(verb, 'subjunctive', 'subjImpf', person);
                if (!existing) { // Solo añadir si no existe
                    let ending = '';
                    if (person === '1s' || person === '3s') ending = 'ra';
                    else if (person === '2s_tu' || person === '2s_vos') ending = 'ras';
                    else if (person === '1p') ending = 'ramos';
                    else if (person === '2p_vosotros') ending = 'rais';
                    else if (person === '3p') ending = 'ran';

                    let value = stem + ending;
                    if (person === '1p') { 
                        const vowels = { 'a': 'á', 'e': 'é', 'i': 'í', 'o': 'ó', 'u': 'ú' };
                        let temp = value.split('');
                        for (let i = temp.length - 3; i >= 0; i--) { 
                            if (vowels[temp[i]]) {
                                temp[i] = vowels[temp[i]];
                                value = temp.join('');
                                break;
                            }
                        }
                    }
                    
                    paradigm.forms.push({
                        mood: 'subjunctive',
                        tense: 'subjImpf',
                        person: person,
                        value: value
                    });
                    changesReport.push({ lemma: verb.lemma, change: `subjunctive|subjImpf|${person} (-ra) añadido: ${value}` });
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
    console.log(`✅ Base de datos actualizada con arreglo de faltantes finales (Pase 2).`);
    console.log(`   Total de cambios: ${changesReport.length}`);
    fs.writeFileSync(path.join(__dirname, 'final_final_fill_report_pass2.json'), JSON.stringify(changesReport, null, 2));
} else {
    console.log('✅ No se requirieron cambios en el arreglo final (Pase 2).');
}
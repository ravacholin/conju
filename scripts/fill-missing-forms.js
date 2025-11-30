import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERBS_FILE_PATH = path.join(__dirname, '../src/data/verbs.js');

let verbsModuleContent = fs.readFileSync(VERBS_FILE_PATH, 'utf8');
const verbsMatch = verbsModuleContent.match(/export const verbs = (\[[\s\S]*?\]);/);

if (!verbsMatch || verbsMatch.length < 2) {
    console.error('❌ No se pudo extraer el array de verbos.');
    process.exit(1);
}

let verbs = JSON.parse(verbsMatch[1]);
const changesReport = [];
let hasChanges = false;

console.log(`🔍 Iniciando Relleno Automático para ${verbs.length} verbos...`);

verbs.forEach(verb => {
    verb.paradigms.forEach(paradigm => {
        const newForms = [];

        // Helper para buscar forma existente
        const findForm = (mood, tense, person) => {
            return paradigm.forms.find(f => f.mood === mood && f.tense === tense && f.person === person);
        };
        
        // Helper para buscar en la lista de nuevos (para encadenar dependencias en el mismo ciclo)
        const findNewForm = (mood, tense, person) => {
            return newForms.find(f => f.mood === mood && f.tense === tense && f.person === person);
        };

        const getFormValue = (mood, tense, person) => {
            const existing = findForm(mood, tense, person);
            if (existing) return existing.value;
            const createNew = findNewForm(mood, tense, person);
            return createNew ? createNew.value : null;
        };

        // 1. REPARAR SUBJUNTIVO PRESENTE 3S (Regla: igual a 1s)
        if (!findForm('subjunctive', 'subjPres', '3s')) {
            const val1s = getFormValue('subjunctive', 'subjPres', '1s');
            if (val1s) {
                newForms.push({
                    mood: 'subjunctive',
                    tense: 'subjPres',
                    person: '3s',
                    value: val1s
                });
                changesReport.push({ lemma: verb.lemma, change: `SubjPres 3s rellenado con 1s: ${val1s}` });
                hasChanges = true;
            }
        }
        
        // Combinamos temporalmente para que los imperativos puedan leer este nuevo 3s
        const currentAndNewForms = [...paradigm.forms, ...newForms];
        const getVal = (m, t, p) => {
            const f = currentAndNewForms.find(x => x.mood === m && x.tense === t && x.person === p);
            return f ? f.value : null;
        };

        // 2. RELLENAR IMPERATIVO NEGATIVO (Copia exacta de Subjuntivo Presente)
        const impNegPersons = ['2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p'];
        impNegPersons.forEach(person => {
            if (!findForm('imperative', 'impNeg', person)) {
                const subjVal = getVal('subjunctive', 'subjPres', person);
                if (subjVal) {
                    // NOTA: Guardamos "no [verbo]" explícitamente para evitar ambigüedades en la UI,
                    // o guardamos solo el verbo?
                    // Revisando debug-voseo-mismatch anterior, vi "no elijas" en impNeg.
                    // Así que la convención de esta BD es INCLUIR "no ".
                    
                    const valWithNo = `no ${subjVal}`;
                    
                    newForms.push({
                        mood: 'imperative',
                        tense: 'impNeg',
                        person: person,
                        value: valWithNo
                    });
                    changesReport.push({ lemma: verb.lemma, change: `ImpNeg ${person} creado: ${valWithNo}` });
                    hasChanges = true;
                } else {
                   // console.warn(`⚠️ No se pudo rellenar ImpNeg ${person} para ${verb.lemma} porque falta SubjPres`);
                }
            }
        });

        // 3. RELLENAR IMPERATIVO AFIRMATIVO (Formal/Plural copia de Subjuntivo)
        // 3s (usted), 1p (nosotros), 3p (ustedes)
        const impAffSharedPersons = ['3s', '1p', '3p'];
        impAffSharedPersons.forEach(person => {
            if (!findForm('imperative', 'impAff', person)) {
                const subjVal = getVal('subjunctive', 'subjPres', person);
                if (subjVal) {
                    newForms.push({
                        mood: 'imperative',
                        tense: 'impAff',
                        person: person,
                        value: subjVal
                    });
                    changesReport.push({ lemma: verb.lemma, change: `ImpAff ${person} rellenado desde Subj: ${subjVal}` });
                    hasChanges = true;
                }
            }
        });

        // 4. RELLENAR IMPERATIVO AFIRMATIVO VOSEO (2s_vos)
        const impAffVosPersons = ['2s_vos']; // Solo esta persona
        impAffVosPersons.forEach(person => {
            if (!findForm('imperative', 'impAff', person)) {
                const presVos = findForm('indicative', 'pres', person);
                if (presVos && presVos.value) {
                    let newValue = presVos.value;
                    // Derivar de presVos (ej: cantás -> cantá)
                    if (newValue.endsWith('ás')) newValue = newValue.slice(0, -1);
                    else if (newValue.endsWith('és')) newValue = newValue.slice(0, -1);
                    else if (newValue.endsWith('ís')) newValue = newValue.slice(0, -1);
                    // Excepción IR: vos vas -> andá
                    if (verb.lemma === 'ir') newValue = 'andá'; 

                    newForms.push({
                        mood: 'imperative',
                        tense: 'impAff',
                        person: person,
                        value: newValue
                    });
                    changesReport.push({ lemma: verb.lemma, change: `impAff ${person} añadido: ${newValue}` });
                    hasChanges = true;
                }
            }
        });
        
        if (newForms.length > 0) {
            paradigm.forms.push(...newForms);
        }
    });
});

if (hasChanges) {
    const newVerbsArrayString = JSON.stringify(verbs, null, 2);
    const newModuleContent = verbsModuleContent.replace(/export const verbs = \[[\s\S]*?\];/, `export const verbs = ${newVerbsArrayString};`);
    fs.writeFileSync(VERBS_FILE_PATH, newModuleContent, 'utf8');
    console.log(`✅ Base de datos actualizada.`);
    console.log(`   Total de celdas rellenadas: ${changesReport.length}`);
    
    // Guardar log
    fs.writeFileSync(path.join(__dirname, 'fill_report.json'), JSON.stringify(changesReport, null, 2));
} else {
    console.log('✅ No se requirieron cambios.');
}

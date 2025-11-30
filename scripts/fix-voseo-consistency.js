import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper para obtener la ruta absoluta
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta al archivo de verbos
const VERBS_FILE_PATH = path.join(__dirname, '../src/data/verbs.js');

// Leer el archivo de verbos
let verbsModuleContent = fs.readFileSync(VERBS_FILE_PATH, 'utf8');

// Extraer solo el array de verbos. Esto es un poco rústico, asumiendo el formato `export const verbs = [...]`
const verbsMatch = verbsModuleContent.match(/export const verbs = (\[[\s\S]*?\]);/);

if (!verbsMatch || verbsMatch.length < 2) {
    console.error('❌ No se pudo extraer el array de verbos del archivo.');
    process.exit(1);
}

let verbs = JSON.parse(verbsMatch[1]); // Parsear el JSON de los verbos

const changesReport = [];
let hasChanges = false;

console.log(`🔍 Iniciando la corrección de consistencia del voseo para ${verbs.length} verbos...`);

verbs.forEach(verb => {
    verb.paradigms.forEach(paradigm => {
        const formsToModify = [];
        
        paradigm.forms.forEach(form => {
            // Buscamos la forma de 'tú' correspondiente
            if (form.person === '2s_tu') {
                const mood = form.mood;
                const tense = form.tense;
                const tuValue = form.value;
                const tuAccepts = form.accepts; // También copiamos los 'accepts' si existen
                
                // Excepciones donde 'vos' y 'tú' son diferentes
                const isPresentIndicative = mood === 'indicative' && tense === 'pres';
                const isImperativeAffirmative = mood === 'imperative' && tense === 'impAff';

                if (isPresentIndicative || isImperativeAffirmative) {
                    return; // Ignorar, ya sabemos que son diferentes
                }

                // Buscar la forma de 'vos' correspondiente
                let vosForm = paradigm.forms.find(f => 
                    f.mood === mood && 
                    f.tense === tense && 
                    f.person === '2s_vos'
                );

                if (!vosForm) {
                    // Si no existe la forma de 'vos', la creamos idéntica a 'tú'
                    const newVosForm = { ...form, person: '2s_vos' };
                    formsToModify.push(newVosForm);
                    changesReport.push({
                        lemma: verb.lemma,
                        mood,
                        tense,
                        change: `Añadida forma 2s_vos (copia de 2s_tu): ${newVosForm.value}`
                    });
                    hasChanges = true;
                } else if (vosForm.value !== tuValue) {
                    // Si existe y es diferente, la sobrescribimos con 'tú'
                    const oldValue = vosForm.value;
                    vosForm.value = tuValue;
                    // También actualizamos los 'accepts' si 'tú' los tiene
                    if (tuAccepts) vosForm.accepts = tuAccepts;
                    else delete vosForm.accepts;

                    changesReport.push({
                        lemma: verb.lemma,
                        mood,
                        tense,
                        change: `Corregida forma 2s_vos: "${oldValue}" -> "${tuValue}" (copia de 2s_tu)`
                    });
                    hasChanges = true;
                }
            }
        });
        
        // Añadir nuevas formas al paradigma si se crearon
        if (formsToModify.length > 0) {
            paradigm.forms.push(...formsToModify);
        }
    });
});

if (hasChanges) {
    // Reconstruir el contenido del módulo con los verbos corregidos
    const newVerbsArrayString = JSON.stringify(verbs, null, 2);
    const newModuleContent = verbsModuleContent.replace(/export const verbs = \[[\s\S]*?\];/, `export const verbs = ${newVerbsArrayString};`);

    fs.writeFileSync(VERBS_FILE_PATH, newModuleContent, 'utf8');
    console.log(`✅ Archivo ${VERBS_FILE_PATH} actualizado con éxito.`);
    console.log(`📋 Reporte de cambios:`);
    console.log(JSON.stringify(changesReport, null, 2));
} else {
    console.log('✅ No se detectaron inconsistencias de voseo fuera de presente indicativo e imperativo afirmativo. No se realizaron cambios en el archivo.');
}

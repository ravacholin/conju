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

// DATOS MANUALES CORREGIDOS
const MANUAL_FIXES = {
    'oír': [
        // Presente Vos
        { mood: 'indicative', tense: 'pres', person: '2s_vos', value: 'oís' },
        // Imperfecto (Regularish)
        { mood: 'indicative', tense: 'impf', person: '1s', value: 'oía' },
        { mood: 'indicative', tense: 'impf', person: '2s_tu', value: 'oías' },
        { mood: 'indicative', tense: 'impf', person: '2s_vos', value: 'oías' },
        { mood: 'indicative', tense: 'impf', person: '3s', value: 'oía' },
        { mood: 'indicative', tense: 'impf', person: '1p', value: 'oíamos' },
        { mood: 'indicative', tense: 'impf', person: '2p_vosotros', value: 'oíais' },
        { mood: 'indicative', tense: 'impf', person: '3p', value: 'oían' },
        // Futuro (Regular)
        { mood: 'indicative', tense: 'fut', person: '1s', value: 'oiré' },
        { mood: 'indicative', tense: 'fut', person: '2s_tu', value: 'oirás' },
        { mood: 'indicative', tense: 'fut', person: '2s_vos', value: 'oirás' },
        { mood: 'indicative', tense: 'fut', person: '3s', value: 'oirá' },
        { mood: 'indicative', tense: 'fut', person: '1p', value: 'oiremos' },
        { mood: 'indicative', tense: 'fut', person: '2p_vosotros', value: 'oiréis' },
        { mood: 'indicative', tense: 'fut', person: '3p', value: 'oirán' },
        // Condicional (Regular)
        { mood: 'conditional', tense: 'cond', person: '1s', value: 'oiría' },
        { mood: 'conditional', tense: 'cond', person: '2s_tu', value: 'oirías' },
        { mood: 'conditional', tense: 'cond', person: '2s_vos', value: 'oirías' },
        { mood: 'conditional', tense: 'cond', person: '3s', value: 'oiría' },
        { mood: 'conditional', tense: 'cond', person: '1p', value: 'oiríamos' },
        { mood: 'conditional', tense: 'cond', person: '2p_vosotros', value: 'oiríais' },
        { mood: 'conditional', tense: 'cond', person: '3p', value: 'oirían' }
    ],
    'freír': [
        // Presente Vos
        { mood: 'indicative', tense: 'pres', person: '2s_vos', value: 'freís' },
        // Imperfecto
        { mood: 'indicative', tense: 'impf', person: '1s', value: 'freía' },
        { mood: 'indicative', tense: 'impf', person: '2s_tu', value: 'freías' },
        { mood: 'indicative', tense: 'impf', person: '2s_vos', value: 'freías' },
        { mood: 'indicative', tense: 'impf', person: '3s', value: 'freía' },
        { mood: 'indicative', tense: 'impf', person: '1p', value: 'freíamos' },
        { mood: 'indicative', tense: 'impf', person: '2p_vosotros', value: 'freíais' },
        { mood: 'indicative', tense: 'impf', person: '3p', value: 'freían' },
        // Futuro
        { mood: 'indicative', tense: 'fut', person: '1s', value: 'freiré' },
        { mood: 'indicative', tense: 'fut', person: '2s_tu', value: 'freirás' },
        { mood: 'indicative', tense: 'fut', person: '2s_vos', value: 'freirás' },
        { mood: 'indicative', tense: 'fut', person: '3s', value: 'freirá' },
        { mood: 'indicative', tense: 'fut', person: '1p', value: 'freiremos' },
        { mood: 'indicative', tense: 'fut', person: '2p_vosotros', value: 'freiréis' },
        { mood: 'indicative', tense: 'fut', person: '3p', value: 'freirán' },
        // Condicional
        { mood: 'conditional', tense: 'cond', person: '1s', value: 'freiría' },
        { mood: 'conditional', tense: 'cond', person: '2s_tu', value: 'freirías' },
        { mood: 'conditional', tense: 'cond', person: '2s_vos', value: 'freirías' },
        { mood: 'conditional', tense: 'cond', person: '3s', value: 'freiría' },
        { mood: 'conditional', tense: 'cond', person: '1p', value: 'freiríamos' },
        { mood: 'conditional', tense: 'cond', person: '2p_vosotros', value: 'freiríais' },
        { mood: 'conditional', tense: 'cond', person: '3p', value: 'freirían' }
    ]
};

console.log('🛠 Aplicando parches manuales para Oír y Freír...');

let totalFixed = 0;

verbs.forEach(verb => {
    if (MANUAL_FIXES[verb.lemma]) {
        const fixes = MANUAL_FIXES[verb.lemma];
        const paradigm = verb.paradigms[0];
        
        fixes.forEach(fix => {
            // Buscar si ya existe
            const existingIdx = paradigm.forms.findIndex(f => 
                f.mood === fix.mood && 
                f.tense === fix.tense && 
                f.person === fix.person
            );
            
            if (existingIdx >= 0) {
                // Sobrescribir si es diferente (o si queremos forzar)
                paradigm.forms[existingIdx].value = fix.value;
            } else {
                // Agregar
                paradigm.forms.push(fix);
                totalFixed++;
            }
        });
    }
});

const newVerbsArrayString = JSON.stringify(verbs, null, 2);
const newModuleContent = verbsModuleContent.replace(/export const verbs = \[[\s\S]*?\];/, `export const verbs = ${newVerbsArrayString};`);
fs.writeFileSync(VERBS_FILE_PATH, newModuleContent, 'utf8');

console.log(`✅ Reparación manual completada. ${totalFixed} formas inyectadas.`);

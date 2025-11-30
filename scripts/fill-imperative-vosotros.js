import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERBS_FILE_PATH = path.join(__dirname, '../src/data/verbs.js');

let verbsModuleContent = fs.readFileSync(VERBS_FILE_PATH, 'utf8');
const verbsMatch = verbsModuleContent.match(/export const verbs = (\[[\s\S]*?\]);/);

if (!verbsMatch || verbsMatch.length < 2) { console.error('❌ Error leyendo DB'); process.exit(1); }

let verbs = JSON.parse(verbsMatch[1]);
const changesReport = [];
let hasChanges = false;

console.log(`🔍 Iniciando Relleno de Imperativos 'vosotros' para ${verbs.length} verbos...`);

verbs.forEach(verb => {
    verb.paradigms.forEach(paradigm => {
        // Buscamos si falta impAff/2p_vosotros
        const impVosotros = paradigm.forms.find(f => f.mood === 'imperative' && f.tense === 'impAff' && f.person === '2p_vosotros');
        
        if (!impVosotros) {
            const lemma = verb.lemma;
            let newValue = '';

            // Generar usando la regla del infinitivo
            if (lemma.endsWith('ar')) {
                newValue = lemma.slice(0, -2) + 'ad';
            } else if (lemma.endsWith('er')) {
                newValue = lemma.slice(0, -2) + 'ed';
            } else if (lemma.endsWith('ir')) {
                newValue = lemma.slice(0, -2) + 'id';
            } else {
                // Caso excepcional o error en lemma
                // console.warn(`⚠️ No se pudo generar impAff 2p_vosotros para ${lemma}, terminación desconocida.`);
                return;
            }

            paradigm.forms.push({
                mood: 'imperative',
                tense: 'impAff',
                person: '2p_vosotros',
                value: newValue
            });
            
            changesReport.push({ 
                lemma: verb.lemma, 
                value: newValue 
            });
            hasChanges = true;
        }
    });
});

if (hasChanges) {
    const newVerbsArrayString = JSON.stringify(verbs, null, 2);
    const newModuleContent = verbsModuleContent.replace(/export const verbs = \[[\s\S]*?\];/, `export const verbs = ${newVerbsArrayString};`);
    fs.writeFileSync(VERBS_FILE_PATH, newModuleContent, 'utf8');
    console.log(`✅ Imperativos 'vosotros' generados.`);
    console.log(`   Total generados: ${changesReport.length}`);
    fs.writeFileSync(path.join(__dirname, 'imperative_vosotros_fix_report.json'), JSON.stringify(changesReport, null, 2));
} else {
    console.log('✅ No se requirieron cambios para imperativos de vosotros.');
}

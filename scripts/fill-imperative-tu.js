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

// MAPA DE RAÍCES IRREGULARES DE IMPERATIVO (2s_tu)
// Key: terminación del lema (raíz base)
// Value: terminación del imperativo
const IRREGULAR_ROOTS = {
    'decir': 'di',
    'hacer': 'haz',
    'ir': 've',
    'poner': 'pon',
    'salir': 'sal',
    'ser': 'sé',
    'tener': 'ten',
    'venir': 'ven',
    // Valer a veces se considera irregular (vale/val), pero 'vale' es lo común hoy día. Lo tratamos regular por defecto salvo que quieras 'val'.
};

// Helper para poner tilde en la última vocal si es necesario (para compuestos agudos: manten -> mantén)
// Solo se aplica si la palabra termina en n, s o vocal, que es el caso de 'ten', 'pon', 'ven'. 
// 'haz', 'sal', 'di', 've', 'sé' no suelen llevar tilde extra en compuestos agudos de imperativo salvo que rompan hiato o reglas generales.
// Ejemplo: deshacer -> deshaz (aguda terminada en z -> sin tilde).
// proponer -> propón (aguda terminada en n -> con tilde).
// prevenir -> prevén (aguda terminada en n -> con tilde).
function accentLastVowel(word) {
    const vowels = { 'a': 'á', 'e': 'é', 'i': 'í', 'o': 'ó', 'u': 'ú' };
    // Buscar la última vocal
    let arr = word.split('');
    for (let i = arr.length - 1; i >= 0; i--) {
        if (vowels[arr[i]]) {
            arr[i] = vowels[arr[i]];
            break;
        }
    }
    return arr.join('');
}

function getImperativeTu(lemma, pres3sValue) {
    // 1. Chequeo de irregulares y compuestos
    for (const [root, irregForm] of Object.entries(IRREGULAR_ROOTS)) {
        if (lemma === root) return irregForm; // Caso base: tener -> ten
        
        if (lemma.endsWith(root)) {
            // Es un compuesto (mantener)
            const prefix = lemma.slice(0, -root.length);
            
            // Caso especial: 'satisfacer' viene de 'hacer' -> 'satisfaz'
            // Caso especial: 'ben-decir' -> 'bendice' (NO 'bendi'), mal-decir -> 'maldice'. 
            // ¡OJO! Decir tiene compuestos regulares en imperativo a veces.
            // RAE: bendecir -> bendice; maldecir -> maldice; contradecir -> contradice (o contradí); predecir -> predice (o predí).
            // Por seguridad, 'decir' en compuestos suele comportarse como regular (copia de pres3s) en el uso moderno, salvo 'predecir' que acepta ambos.
            // Para simplificar y evitar arcaísmos raros como 'bendi', si es compuesto de DECIR, usamos la regla regular (predice) que coincide con pres3s.
            if (root === 'decir') return pres3sValue; 
            
            const baseForm = irregForm;
            let result = prefix + baseForm;
            
            // Aplicar reglas de acentuación para compuestos
            // Si termina en n, s o vocal y es aguda (que lo son, porque el prefijo añade sílabas tónicas antes? No, la fuerza de voz está en la raíz del imperativo).
            // espera. ten (fuerte). man-TEN. Aguda terminada en N -> tilde.
            // pon. com-PON. Aguda terminada en N -> tilde.
            // ven. pre-VEN. Aguda terminada en N -> tilde.
            // sal. sobre-SAL. Aguda terminada en L -> sin tilde.
            // haz. des-HAZ. Aguda terminada en Z -> sin tilde.
            // ve. pre-VE. Aguda terminada en Vocal -> tilde? pre-vé. Sí.
            
            const lastChar = result.slice(-1);
            const isVowel = /[aeiou]/.test(lastChar);
            
            if (lastChar === 'n' || lastChar === 's' || isVowel) {
                // Necesita tilde
                return accentLastVowel(result);
            }
            return result;
        }
    }

    // 2. Regla General: Igual a 3s del Presente Indicativo
    // Si no tenemos el valor de pres3s, no podemos adivinar (podría ser irregular de raíz como 'pide').
    return pres3sValue; 
}

verbs.forEach(verb => {
    verb.paradigms.forEach(paradigm => {
        // Buscamos si falta impAff/2s_tu
        const impTu = paradigm.forms.find(f => f.mood === 'imperative' && f.tense === 'impAff' && f.person === '2s_tu');
        
        if (!impTu) {
            // Necesitamos el pres3s como base
            const pres3s = paradigm.forms.find(f => f.mood === 'indicative' && f.tense === 'pres' && f.person === '3s');
            
            if (pres3s) {
                const newValue = getImperativeTu(verb.lemma, pres3s.value);
                
                paradigm.forms.push({
                    mood: 'imperative',
                    tense: 'impAff',
                    person: '2s_tu',
                    value: newValue
                });
                
                changesReport.push({ 
                    lemma: verb.lemma, 
                    method: verb.lemma.endsWith('ner') || verb.lemma.endsWith('cir') ? 'COMPOUND/CHECK' : 'REGULAR',
                    value: newValue 
                });
                hasChanges = true;
            }
        }
    });
});

if (hasChanges) {
    const newVerbsArrayString = JSON.stringify(verbs, null, 2);
    const newModuleContent = verbsModuleContent.replace(/export const verbs = \[[\s\S]*?\];/, `export const verbs = ${newVerbsArrayString};`);
    fs.writeFileSync(VERBS_FILE_PATH, newModuleContent, 'utf8');
    console.log(`✅ Imperativos 'tú' generados.`);
    console.log(`   Total generados: ${changesReport.length}`);
    fs.writeFileSync(path.join(__dirname, 'imperative_fix_report.json'), JSON.stringify(changesReport, null, 2));
}

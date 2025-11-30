import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VERBS_FILE_PATH = path.join(__dirname, '../src/data/verbs.js');

let verbsModuleContent = fs.readFileSync(VERBS_FILE_PATH, 'utf8');
const verbsMatch = verbsModuleContent.match(/export const verbs = (\[[\s\S]*?\]);/);

if (!verbsMatch || verbsMatch.length < 2) process.exit(1);

let verbs = JSON.parse(verbsMatch[1]);
const changesReport = [];
let hasChanges = false;

// Lista de verbos que sabemos que faltan y sus estrategias
const VERBS_TO_PROCESS = [
    'andar', 'recordar', 'costar', 'preferir', 'resolver', 'sonar', 'volar', 
    'despertar', 'competir', 'vestir', 'agredir'
];

function generateSubjPres(verb) {
    const lemma = verb.lemma;
    const paradigm = verb.paradigms[0];
    const pres1s = paradigm.forms.find(f => f.mood === 'indicative' && f.tense === 'pres' && f.person === '1s')?.value;
    
    // Andar es regular en pres subj aunque irregular en pret, así que usamos stem 'and'
    if (!pres1s && lemma !== 'andar') return null; 

    let forms = {}; // 1s, 2s_tu, ...

    // Detectar conjugación
    const isAr = lemma.endsWith('ar');
    const isEr = lemma.endsWith('er');
    const isIr = lemma.endsWith('ir');
    
    const vowel1 = isAr ? 'e' : 'a'; // Para yo, tu, el, ellos (ames / comas)
    
    let stemStrong = '';
    let stemWeak = lemma.slice(0, -2); // record-

    if (lemma === 'andar') {
        stemStrong = 'and';
        stemWeak = 'and';
    } else {
        stemStrong = pres1s.slice(0, -1); // recuerd-, compit-
    }

    // Generar Singulares y 3p (Usan stemStrong)
    forms['1s'] = stemStrong + vowel1;
    forms['2s_tu'] = stemStrong + (isAr ? 'es' : 'as');
    forms['2s_vos'] = forms['2s_tu']; // En subjuntivo pres, vos = tu (ames, comas)
    forms['3s'] = forms['1s'];
    forms['3p'] = stemStrong + (isAr ? 'en' : 'an');

    // Generar Nosotros/Vosotros (Complejo)
    let stemNosVos = stemWeak; // Por defecto regular (record-emos)

    // Reglas especiales
    if (isIr) {
        // Verbos -IR con cambio
        // Si pres1s tiene 'ie' (prefiero) -> nosotros 'i' (prefiramos)
        // Si pres1s tiene 'i' (visto) -> nosotros 'i' (vistamos) -> coincide con stemStrong
        // Si pres1s tiene 'ue' (duermo) -> nosotros 'u' (durmamos)
        
        // Chequeamos pres1s para detectar el tipo de cambio
        // const stemStrongVowel = stemStrong.match(/[aeiouáéíóú]+/g).pop(); // última vocal o grupo
        
        if (pres1s.includes('ie')) { // preferir -> prefiramos
             stemNosVos = stemWeak.replace(/e/g, 'i'); // prefer -> prefir
        } else if (pres1s.includes('ue')) { // dormir -> durmamos
             stemNosVos = stemWeak.replace(/o/g, 'u'); // dorm -> durm
        } else if (stemStrong === pres1s.slice(0, -1) && pres1s.includes('i')) { 
             // Vestir -> visto -> vistamos
             stemNosVos = stemStrong;
        }
    }

    const vowelNos = isAr ? 'emos' : 'amos'; // AMOS para er/ir en subjuntivo! (comamos, vivamos)
    const vowelVos = isAr ? 'éis' : 'áis';   // AIS para er/ir en subjuntivo! (comáis, viváis)

    forms['1p'] = stemNosVos + vowelNos;
    forms['2p_vosotros'] = stemNosVos + vowelVos;

    return forms;
}

verbs.forEach(verb => {
    // Solo procesar los verbos que identificamos como problemáticos
    if (!VERBS_TO_PROCESS.includes(verb.lemma)) return; 

    verb.paradigms.forEach(paradigm => {
        const newFormsMap = generateSubjPres(verb);
        if (!newFormsMap) return;

        const persons = ['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p'];

        persons.forEach(person => {
            const existingForm = paradigm.forms.find(f => 
                f.mood === 'subjunctive' && f.tense === 'subjPres' && f.person === person
            );
            const valueToGenerate = newFormsMap[person];

            if (valueToGenerate && (!existingForm || existingForm.value !== valueToGenerate)) {
                if (existingForm) {
                    existingForm.value = valueToGenerate;
                    changesReport.push({ lemma: verb.lemma, change: `SubjPres ${person} corregido: ${valueToGenerate}` });
                } else {
                    paradigm.forms.push({
                        mood: 'subjunctive',
                        tense: 'subjPres',
                        person: person,
                        value: valueToGenerate
                    });
                    changesReport.push({ lemma: verb.lemma, change: `SubjPres ${person} generado: ${valueToGenerate}` });
                }
                hasChanges = true;
            }
        });
    });
});


if (hasChanges) {
    const newVerbsArrayString = JSON.stringify(verbs, null, 2);
    const newModuleContent = verbsModuleContent.replace(/export const verbs = \[[\s\S]*?\];/, `export const verbs = ${newVerbsArrayString};`);
    fs.writeFileSync(VERBS_FILE_PATH, newModuleContent, 'utf8');
    console.log(`✅ Subjuntivos Presentes generados.`);
    console.log(`   Verbos reparados: ${changesReport.length}`);
    console.log(JSON.stringify(changesReport, null, 2));
}

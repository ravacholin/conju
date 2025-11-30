import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Necesitamos importar verbs.js. Como es un archivo del proyecto, usamos import dinámico o ruta relativa.
// Asumimos que se ejecuta desde la raíz.
import { verbs } from '../src/data/verbs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`🔍 Iniciando Auditoría Forense sobre ${verbs.length} verbos...`);

const REPORT = {
    anomalies: [],
    voseoIssues: [],
    stats: {
        totalGroups: 0,
        totalAnomalies: 0
    }
};

// --- HELPERS ---

function getEnding(lemma) {
    return lemma.slice(-3);
}

// Detecta el patrón de cambio entre lemma y forma conjugada
// Ej: contar -> cuento => "o->ue"
function detectPattern(lemma, formValue) {
    if (!formValue) return 'MISSING';
    
    // Simplificación para detectar cambios de raíz
    const stemLemma = lemma.slice(0, -2); // cont
    const stemForm = formValue.slice(0, -1); // cuent (aprox)
    
    if (formValue.startsWith(stemLemma)) return 'REGULAR_STEM';
    
    // Detección rústica de irregularidad común
    if (stemLemma.includes('o') && formValue.includes('ue')) return 'O->UE';
    if (stemLemma.includes('e') && formValue.includes('ie')) return 'E->IE';
    if (stemLemma.includes('e') && formValue.includes('i')) return 'E->I';
    if (formValue.endsWith('zco')) return 'ZCO';
    if (formValue.endsWith('go')) return 'GO';
    
    return 'OTHER_IRREGULAR';
}

function checkVoseoConsistency(verb) {
    // Buscamos en todos los paradigmas (aunque suele haber 1)
    let voseoForm = null;
    for (const paradigm of verb.paradigms) {
        voseoForm = paradigm.forms.find(f => 
            f.mood === 'indicative' && 
            f.tense === 'pres' && 
            f.person === '2s_vos'
        );
        if (voseoForm) break;
    }
    
    if (!voseoForm) return;

    const value = voseoForm.value;
    const lemma = verb.lemma;
    
    // Excepciones conocidas
    if (['ser', 'ir', 'haber'].includes(lemma)) return;

    // Regla general: infinitivo - 'r' + 's' + tilde
    // amar -> amás
    // temer -> temés
    // partir -> partís
    
    const lastChar = value.slice(-1);
    const hasTilde = /[áéíóú]/.test(value);
    
    if (lastChar !== 's') {
        REPORT.voseoIssues.push({
            lemma,
            issue: 'Voseo no termina en "s"',
            value
        });
        return;
    }

    if (!hasTilde) {
         // Caso monosílabos (dar -> das, ver -> ves) no llevan tilde a veces, pero en voseo agudo sí suelen llevarla o cambiar.
         // dar -> das (tuteo) vs das (voseo) -> Espera, dar es 'dás' en voseo? No, es 'das'.
         // ver -> ves.
         const isMonosyllable = value.length <= 3;
         if (!isMonosyllable) {
             REPORT.voseoIssues.push({
                lemma,
                issue: 'Voseo sin tilde en polisílabo',
                value
            });
         }
    }
}

// --- MAIN LOGIC ---

// 1. Agrupamiento
const clusters = {};

verbs.forEach(verb => {
    const ending = getEnding(verb.lemma);
    if (!clusters[ending]) clusters[ending] = [];
    clusters[ending].push(verb);
});

REPORT.stats.totalGroups = Object.keys(clusters).length;

// 2. Análisis Intra-Cluster
Object.keys(clusters).forEach(ending => {
    const group = clusters[ending];
    // Si el grupo es muy pequeño, es difícil estadísticamente, pero lo miramos igual.
    
    // Mapeamos "Firmas" (Signatures) dentro del grupo
    const signatures = {};
    
    group.forEach(verb => {
        const paradigm = verb.paradigms[0];
        
        // Extraer puntos clave
        const pres1s = paradigm.forms.find(f => f.mood === 'indicative' && f.tense === 'pres' && f.person === '1s')?.value || '';
        const pret3s = paradigm.forms.find(f => f.mood === 'indicative' && f.tense === 'pretIndef' && f.person === '3s')?.value || '';
        
        // Creamos una firma simplificada de comportamiento
        // Ej: "conocer" -> 1s termina en 'zco', 3s pret termina en 'ció' (regular)
        // Firma: "1s:ZCO|3p:REG"
        
        let sig1s = 'REG';
        if (pres1s.endsWith('zco')) sig1s = 'ZCO';
        else if (pres1s.endsWith('go')) sig1s = 'GO';
        else if (pres1s.endsWith('oy')) sig1s = 'OY';
        else if (detectPattern(verb.lemma, pres1s) !== 'REGULAR_STEM') sig1s = detectPattern(verb.lemma, pres1s);
        
        let sigPret = 'REG';
        if (detectPattern(verb.lemma, pret3s) !== 'REGULAR_STEM') sigPret = 'IRREG';
        
        const signature = `${sig1s}|${sigPret}`;
        
        if (!signatures[signature]) signatures[signature] = [];
        signatures[signature].push(verb.lemma);
        
        // Chequeo voseo de paso
        checkVoseoConsistency(verb);
    });
    
    // 3. Detección de Outliers
    const totalInGroup = group.length;
    Object.keys(signatures).forEach(sig => {
        const count = signatures[sig].length;
        const percentage = (count / totalInGroup) * 100;
        
        // CRITERIO DE ANOMALÍA:
        // Si un patrón ocurre en menos del 1% de los casos del grupo, Y el grupo tiene al menos 20 verbos.
        // O si es un patrón único (count === 1) en un grupo de > 5 verbos.
        
        const isSuspicious = (percentage < 1 && totalInGroup > 50) || (count === 1 && totalInGroup > 10);
        
        if (isSuspicious) {
            REPORT.anomalies.push({
                group: ending,
                suspiciousPattern: sig,
                count: count,
                totalInGroup: totalInGroup,
                verbs: signatures[sig] // Lista de los verbos sospechosos
            });
        }
    });
});

REPORT.stats.totalAnomalies = REPORT.anomalies.length;

// --- OUTPUT ---

const outputPath = path.join(__dirname, 'audit_report.json');
fs.writeFileSync(outputPath, JSON.stringify(REPORT, null, 2));

console.log(`✅ Auditoría completada.`);
console.log(`   Grupos analizados: ${REPORT.stats.totalGroups}`);
console.log(`   Anomalías detectadas: ${REPORT.stats.totalAnomalies}`);
console.log(`   Problemas de Voseo: ${REPORT.voseoIssues.length}`);
console.log(`📄 Reporte guardado en: ${outputPath}`);

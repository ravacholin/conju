import { verbs } from '../src/data/verbs.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(`🔍 Iniciando Auditoría de Completitud sobre ${verbs.length} verbos...`);

const EXPECTED_GRID = {
    indicative: ['pres', 'impf', 'pretIndef', 'fut'],
    conditional: ['cond'],
    subjunctive: ['subjPres', 'subjImpf'], // subjFut es arcaico, lo ignoramos por ahora
    imperative: ['impAff', 'impNeg']
};

const EXPECTED_PERSONS = {
    standard: ['1s', '2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p'],
    imperative_aff: ['2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p'], // No existe 1s
    imperative_neg: ['2s_tu', '2s_vos', '3s', '1p', '2p_vosotros', '3p']  // No existe 1s
};

const REPORT = {
    missingCells: [],
    stats: {
        totalVerbs: verbs.length,
        totalMissing: 0
    }
};

verbs.forEach(verb => {
    const paradigm = verb.paradigms[0]; // Asumimos 1 paradigma principal por simplicidad
    
    if (!paradigm) {
        REPORT.missingCells.push({
            lemma: verb.lemma,
            issue: 'MISSING_PARADIGM'
        });
        return;
    }

    // Crear un mapa rápido de lo que tenemos
    const existingForms = new Set();
    paradigm.forms.forEach(f => {
        existingForms.add(`${f.mood}|${f.tense}|${f.person}`);
    });

    // Verificar contra la grilla esperada
    Object.keys(EXPECTED_GRID).forEach(mood => {
        const tenses = EXPECTED_GRID[mood];
        
        tenses.forEach(tense => {
            let persons = EXPECTED_PERSONS.standard;
            if (mood === 'imperative' && tense === 'impAff') persons = EXPECTED_PERSONS.imperative_aff;
            if (mood === 'imperative' && tense === 'impNeg') persons = EXPECTED_PERSONS.imperative_neg;

            persons.forEach(person => {
                // Excepciones lógicas
                // 1. Verbos defectivos o unipersonales (llover, nevar).
                //    Para esta auditoría masiva, si faltan muchas personas en un verbo, podría ser defectivo.
                //    Pero si falta SOLO UNA, es un error.
                
                const key = `${mood}|${tense}|${person}`;
                
                // El subjImpf puede tener dos variantes (ra/se).
                // En la BD suele guardarse como 'subjImpf' con un solo valor, o dos entradas.
                // Aquí solo chequeamos que exista AL MENOS UNA entrada para 'subjImpf'.
                
                // Mapeo de nombres de tense si la BD usa otros
                // La BD usa: pres, impf, pretIndef, fut, cond, subjPres, subjImpf...
                // Chequeamos si existe la key exacta
                
                if (!existingForms.has(key)) {
                    // Doble check para nombres de tense que a veces varían
                    // Ej: subjPres vs pres (en mood subjunctive)
                    let found = false;
                    
                    // Intento de fallback flexible
                    if (mood === 'subjunctive' && tense === 'subjPres') {
                         if (existingForms.has(`subjunctive|pres|${person}`)) found = true;
                    }
                    
                    if (!found) {
                        REPORT.missingCells.push({
                            lemma: verb.lemma,
                            missing: key
                        });
                    }
                }
            });
        });
    });
});

REPORT.stats.totalMissing = REPORT.missingCells.length;

const outputPath = path.join(__dirname, 'audit_completeness_report.json');
fs.writeFileSync(outputPath, JSON.stringify(REPORT, null, 2));

console.log(`✅ Auditoría de Completitud terminada.`);
console.log(`   Celdas faltantes detectadas: ${REPORT.stats.totalMissing}`);
console.log(`📄 Reporte guardado en: ${outputPath}`);

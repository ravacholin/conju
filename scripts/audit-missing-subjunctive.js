import { verbs } from '../src/data/verbs.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const missingSubjPres = [];

console.log(`🔍 Buscando verbos sin Presente de Subjuntivo...`);

verbs.forEach(verb => {
    const paradigm = verb.paradigms[0];
    if (!paradigm) return;

    const subjPresForms = paradigm.forms.filter(f => f.mood === 'subjunctive' && f.tense === 'subjPres');
    
    if (subjPresForms.length === 0) {
        missingSubjPres.push(verb.lemma);
    } else if (subjPresForms.length < 6) { // Debería tener al menos 6 formas (sin contar vos)
         // Opcional: listar los incompletos también
    }
});

console.log(`❌ Verbos sin NINGÚN Subjuntivo Presente: ${missingSubjPres.length}`);
console.log(JSON.stringify(missingSubjPres, null, 2));

const outputPath = path.join(__dirname, 'missing_subjunctive_report.json');
fs.writeFileSync(outputPath, JSON.stringify(missingSubjPres, null, 2));

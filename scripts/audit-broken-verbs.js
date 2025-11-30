import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORT_PATH = path.join(__dirname, 'audit_completeness_report.json');

const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));

const brokenVerbs = {};

report.missingCells.forEach(item => {
    if (!brokenVerbs[item.lemma]) {
        brokenVerbs[item.lemma] = 0;
    }
    brokenVerbs[item.lemma]++;
});

console.log('📊 Verbos con celdas faltantes:');
const sorted = Object.entries(brokenVerbs).sort((a, b) => b[1] - a[1]);

sorted.forEach(([lemma, count]) => {
    console.log(`   - ${lemma}: ${count} faltantes`);
});

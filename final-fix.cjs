#!/usr/bin/env node

const fs = require('fs');

const VERBS_FILE = './src/data/verbs.js';
let verbsContent = fs.readFileSync(VERBS_FILE, 'utf8');

console.log('🔧 Aplicando correcciones finales específicas...\n');

// Lista de correcciones específicas restantes
const specificFixes = [
  // vivir: vivamos 3p → 1p
  {
    find: /"tense": "subjPres",\s*"mood": "subjunctive",\s*"person": "3p",\s*"value": "vivamos"/g,
    replace: '"tense": "subjPres",\n            "mood": "subjunctive",\n            "person": "1p",\n            "value": "vivamos"'
  },
  // Patrón general para -amos asignados como 3s
  {
    find: /("tense": "[^"]*",\s*"mood": "(?:subjunctive|imperative)",\s*"person": "3s",\s*"value": ")([a-zA-Z]*amos)(")/g,
    replace: '$1$2$3'.replace('"person": "3s"', '"person": "1p"')
  }
];

// Método más directo: reemplazar todos los casos problemáticos
const problematicVerbs = ['comprender', 'responder', 'descubrir', 'decidir', 'ocurrir', 'permitir', 'sufrir', 'unir', 'obedecer', 'merecer', 'agradecer', 'establecer', 'ofrecer', 'introducir', 'reducir', 'abolir', 'blandir'];

problematicVerbs.forEach(verb => {
  const verbRegex = new RegExp(`("tense": "subjPres",\\s*"mood": "subjunctive",\\s*"person": "3s",\\s*"value": "${verb.slice(0, -2)}amos")`, 'g');
  const replaced = verbsContent.replace(verbRegex, (match) => {
    return match.replace('"person": "3s"', '"person": "1p"');
  });
  
  if (replaced !== verbsContent) {
    console.log(`✅ Corregido: ${verb}amos 3s → 1p`);
    verbsContent = replaced;
  }
});

// Corrección específica para vivir (que es 3p en lugar de 3s)
verbsContent = verbsContent.replace(
  /"tense": "subjPres",\s*"mood": "subjunctive",\s*"person": "3p",\s*"value": "vivamos"/g,
  '"tense": "subjPres",\n            "mood": "subjunctive",\n            "person": "1p",\n            "value": "vivamos"'
);

console.log('✅ Corregido: vivamos 3p → 1p');

// Guardar cambios
fs.writeFileSync(VERBS_FILE, verbsContent, 'utf8');
console.log('\n💾 Correcciones finales guardadas');
console.log('🎉 Script de corrección final completado');
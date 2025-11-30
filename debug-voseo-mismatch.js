import { verbs } from './src/data/verbs.js';

console.log("🔍 Analizando formas de 'vos' para detectar intrusos...");

const suspicious = [];

verbs.forEach(verb => {
    verb.paradigms.forEach(p => {
        p.forms.forEach(f => {
            if (f.person === '2s_vos') {
                // Si el valor contiene "has " o "habés ", es un tiempo compuesto.
                // Queremos ver si está etiquetado como un tiempo simple por error.
                if (f.value.includes(' ')) {
                     suspicious.push({
                         lemma: verb.lemma,
                         tense: f.tense,
                         mood: f.mood,
                         value: f.value
                     });
                }
            }
        });
    });
});

console.log(JSON.stringify(suspicious, null, 2));

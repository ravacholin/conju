import { verbs } from '../src/data/verbs.js';
import { priorityVerbs } from '../src/data/priorityVerbs.js';
import { additionalVerbs } from '../src/data/additionalVerbs.js';
import { commonVerbs } from '../src/data/commonVerbs.js';
import { missingVerbs } from '../src/data/missingVerbs.js';
import fs from 'fs';

const VERB_COLLECTIONS = [
    { name: 'verbs.js', data: verbs },
    { name: 'priorityVerbs.js', data: priorityVerbs },
    { name: 'additionalVerbs.js', data: additionalVerbs },
    { name: 'commonVerbs.js', data: commonVerbs },
    { name: 'missingVerbs.js', data: missingVerbs },
];

const REGULAR_ENDINGS = {
    ar: {
        indicative: {
            pres: { '1s': 'o', '2s_tu': 'as', '3s': 'a', '1p': 'amos', '2p_vosotros': 'áis', '3p': 'an' },
            pretIndef: { '1s': 'é', '2s_tu': 'aste', '3s': 'ó', '1p': 'amos', '2p_vosotros': 'asteis', '3p': 'aron' },
            impf: { '1s': 'aba', '2s_tu': 'abas', '3s': 'aba', '1p': 'ábamos', '2p_vosotros': 'abais', '3p': 'aban' },
            fut: { '1s': 'aré', '2s_tu': 'arás', '3s': 'ará', '1p': 'aremos', '2p_vosotros': 'aréis', '3p': 'arán' },
        },
        conditional: {
            cond: { '1s': 'aría', '2s_tu': 'arías', '3s': 'aría', '1p': 'aríamos', '2p_vosotros': 'aríais', '3p': 'arían' },
        },
        subjunctive: {
            pres: { '1s': 'e', '2s_tu': 'es', '3s': 'e', '1p': 'emos', '2p_vosotros': 'éis', '3p': 'en' },
            impf: { '1s': 'ara', '2s_tu': 'aras', '3s': 'ara', '1p': 'áramos', '2p_vosotros': 'arais', '3p': 'aran' }, // -ara form
        },
        imperative: {
            impAff: { '2s_tu': 'a', '3s': 'e', '1p': 'emos', '2p_vosotros': 'ad', '3p': 'en' },
        }
    },
    er: {
        indicative: {
            pres: { '1s': 'o', '2s_tu': 'es', '3s': 'e', '1p': 'emos', '2p_vosotros': 'éis', '3p': 'en' },
            pretIndef: { '1s': 'í', '2s_tu': 'iste', '3s': 'ió', '1p': 'imos', '2p_vosotros': 'isteis', '3p': 'ieron' },
            impf: { '1s': 'ía', '2s_tu': 'ías', '3s': 'ía', '1p': 'íamos', '2p_vosotros': 'íais', '3p': 'ían' },
            fut: { '1s': 'eré', '2s_tu': 'erás', '3s': 'erá', '1p': 'eremos', '2p_vosotros': 'eréis', '3p': 'erán' },
        },
        conditional: {
            cond: { '1s': 'ería', '2s_tu': 'erías', '3s': 'ería', '1p': 'eríamos', '2p_vosotros': 'eríais', '3p': 'erían' },
        },
        subjunctive: {
            pres: { '1s': 'a', '2s_tu': 'as', '3s': 'a', '1p': 'amos', '2p_vosotros': 'áis', '3p': 'an' },
            impf: { '1s': 'iera', '2s_tu': 'ieras', '3s': 'iera', '1p': 'iéramos', '2p_vosotros': 'ierais', '3p': 'ieran' },
        },
        imperative: {
            impAff: { '2s_tu': 'e', '3s': 'a', '1p': 'amos', '2p_vosotros': 'ed', '3p': 'an' },
        }
    },
    ir: {
        indicative: {
            pres: { '1s': 'o', '2s_tu': 'es', '3s': 'e', '1p': 'imos', '2p_vosotros': 'ís', '3p': 'en' },
            pretIndef: { '1s': 'í', '2s_tu': 'iste', '3s': 'ió', '1p': 'imos', '2p_vosotros': 'isteis', '3p': 'ieron' },
            impf: { '1s': 'ía', '2s_tu': 'ías', '3s': 'ía', '1p': 'íamos', '2p_vosotros': 'íais', '3p': 'ían' },
            fut: { '1s': 'iré', '2s_tu': 'irás', '3s': 'irá', '1p': 'iremos', '2p_vosotros': 'iréis', '3p': 'irán' },
        },
        conditional: {
            cond: { '1s': 'iría', '2s_tu': 'irías', '3s': 'iría', '1p': 'iríamos', '2p_vosotros': 'iríais', '3p': 'irían' },
        },
        subjunctive: {
            pres: { '1s': 'a', '2s_tu': 'as', '3s': 'a', '1p': 'amos', '2p_vosotros': 'áis', '3p': 'an' },
            impf: { '1s': 'iera', '2s_tu': 'ieras', '3s': 'iera', '1p': 'iéramos', '2p_vosotros': 'ierais', '3p': 'ieran' },
        },
        imperative: {
            impAff: { '2s_tu': 'e', '3s': 'a', '1p': 'amos', '2p_vosotros': 'id', '3p': 'an' },
        }
    }
};

function getEndingType(lemma) {
    if (lemma.endsWith('ar')) return 'ar';
    if (lemma.endsWith('er')) return 'er';
    if (lemma.endsWith('ir')) return 'ir';
    return null;
}


function normalizeForms(verb, collectionName) {
    // Schema A: verbs.js, priorityVerbs.js, additionalVerbs.js
    if (verb.paradigms && Array.isArray(verb.paradigms)) {
        return verb.paradigms[0].forms;
    }

    // Schema C: missingVerbs.js (flat forms array)
    if (Array.isArray(verb.forms)) {
        return verb.forms;
    }

    // Schema B: commonVerbs.js (nested object)
    if (verb.forms && typeof verb.forms === 'object') {
        const normalized = [];
        const tenseToMood = {
            'pres': 'indicative',
            'pretIndef': 'indicative',
            'impf': 'indicative',
            'fut': 'indicative',
            'cond': 'conditional',
            'subjPres': 'subjunctive',
            'subjImpf': 'subjunctive',
            'impAff': 'imperative',
            'inf': 'nonfinite',
            'ger': 'nonfinite',
            'part': 'nonfinite'
        };

        Object.entries(verb.forms).forEach(([tense, values]) => {
            const mood = tenseToMood[tense] || 'unknown';
            if (typeof values === 'string') {
                // Non-finite
                normalized.push({ mood, tense, person: 'inv', value: values });
            } else {
                Object.entries(values).forEach(([person, value]) => {
                    normalized.push({ mood, tense, person, value });
                });
            }
        });
        return normalized;
    }

    return [];
}

function verifyVerbs() {
    let totalErrorCount = 0;
    const allSeenIds = new Set();

    for (const collection of VERB_COLLECTIONS) {
        console.log(`\nVerifying ${collection.name} (${collection.data.length} verbs)...`);

        const seenIds = new Set();
        const seenLemmas = new Set();
        let errorCount = 0;

        collection.data.forEach((verb, index) => {
            // 1. Check ID uniqueness within file (Skip for commonVerbs/missingVerbs if they don't have IDs)
            if (verb.id) {
                if (seenIds.has(verb.id)) {
                    console.error(`[ERROR] [${collection.name}] Duplicate ID found in file: ${verb.id} at index ${index}`);
                    errorCount++;
                }
                seenIds.add(verb.id);
                allSeenIds.add(verb.id);
            }

            // 2. Check Lemma uniqueness (warning)
            if (verb.lemma) {
                if (seenLemmas.has(verb.lemma)) {
                    // console.warn(`[WARN] Duplicate Lemma found: ${verb.lemma} at index ${index}`);
                }
                seenLemmas.add(verb.lemma);
            } else {
                console.error(`[ERROR] [${collection.name}] Verb at index ${index} has no lemma.`);
                errorCount++;
            }

            // 3. Normalize and Check Structure
            const forms = normalizeForms(verb, collection.name);
            if (forms.length === 0) {
                console.error(`[ERROR] [${collection.name}] Verb ${verb.lemma} has no forms (or unknown structure).`);
                errorCount++;
                return;
            }

            // 4. Verify Regular Verbs
            if (verb.type === 'regular') {
                const endingType = getEndingType(verb.lemma);
                if (!endingType) {
                    console.error(`[ERROR] [${collection.name}] Regular verb ${verb.lemma} does not end in ar/er/ir.`);
                    errorCount++;
                    return;
                }

                const stem = verb.lemma.slice(0, -2);
                const rules = REGULAR_ENDINGS[endingType];

                forms.forEach(form => {
                    // Only check forms we have rules for
                    if (rules[form.mood] && rules[form.mood][form.tense] && rules[form.mood][form.tense][form.person]) {
                        let expectedSuffix = rules[form.mood][form.tense][form.person];
                        let expectedValue = '';
                        if (['fut', 'cond'].includes(form.tense)) {
                            expectedValue = stem + expectedSuffix;
                        } else {
                            expectedValue = stem + expectedSuffix;
                        }

                        if (form.value !== expectedValue) {
                            console.error(`[ERROR] [${collection.name}] Verb ${verb.lemma} mismatch for ${form.mood} ${form.tense} ${form.person}. Expected: ${expectedValue}, Found: ${form.value}`);
                            errorCount++;
                        }
                    }
                });
            }

            // 5. General Form Check
            forms.forEach(form => {
                if (!form.value) {
                    console.error(`[ERROR] [${collection.name}] Verb ${verb.lemma} has empty value for ${form.mood} ${form.tense} ${form.person}`);
                    errorCount++;
                }
            });

        });

        console.log(`[${collection.name}] Verification complete. Found ${errorCount} errors.`);
        totalErrorCount += errorCount;
    }

    console.log(`\nTotal errors: ${totalErrorCount}`);
    if (totalErrorCount > 0) process.exit(1);
}


verifyVerbs();

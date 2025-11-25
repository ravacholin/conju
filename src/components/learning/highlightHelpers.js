import { LEARNING_IRREGULAR_FAMILIES } from '../../lib/data/learningIrregularFamilies.js';

/**
 * Helper function to highlight stem vowel changes in infinitive forms
 * @param {string} lemma - The verb infinitive (e.g., "pensar", "pedir", "dormir")
 * @returns {Object} Object with highlighted parts or plain stem/ending
 */
export function highlightStemVowel(lemma) {
    // Check if this verb has vowel change metadata
    const diphthongFamily = LEARNING_IRREGULAR_FAMILIES['LEARNING_DIPHTHONGS'];
    const vowelChangeData = diphthongFamily?.vowelChanges?.[lemma];

    if (!vowelChangeData) {
        // No stem change data, return plain infinitive
        return { stem: lemma.slice(0, -2), ending: lemma.slice(-2), hasHighlight: false };
    }

    const { stemVowel } = vowelChangeData;
    const stem = lemma.slice(0, -2);
    const ending = lemma.slice(-2);

    // Find the position of the stem vowel (last occurrence in the stem)
    const vowelIndex = stem.lastIndexOf(stemVowel);

    if (vowelIndex === -1) {
        // Vowel not found, fallback to plain rendering
        return { stem, ending, hasHighlight: false };
    }

    // Split the stem into before-vowel, vowel, and after-vowel
    const beforeVowel = stem.slice(0, vowelIndex);
    const vowel = stem.slice(vowelIndex, vowelIndex + stemVowel.length);
    const afterVowel = stem.slice(vowelIndex + stemVowel.length);

    return {
        beforeVowel,
        vowel,
        afterVowel,
        ending,
        hasHighlight: true,
        changeType: vowelChangeData.type
    };
}

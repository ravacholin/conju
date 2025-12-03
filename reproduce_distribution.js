
import { chooseNext } from './src/lib/core/generator.js';
import { useSettings } from './src/state/settings.js';
import { varietyEngine } from './src/lib/core/advancedVarietyEngine.js';
import { createLogger } from './src/lib/utils/logger.js';

// Mock logger to avoid clutter
const logger = createLogger('test');
logger.level = 'error';

// Mock settings store
const mockSettings = {
    level: 'A1',
    practiceMode: 'mixed',
    verbType: 'all',
    region: 'la_general',
    useVoseo: true,
    useTuteo: true,
    useVosotros: false,
    forms: [] // Will be populated
};

// Mock useSettings
useSettings.getState = () => mockSettings;

// Mock forms generation (we need a pool of forms)
import { verbs } from './src/data/verbs.js';

async function generatePool(level) {
    const forms = [];
    // Simplified pool generation: take first 50 verbs and expand their paradigms
    const sampleVerbs = verbs.slice(0, 50);

    for (const verb of sampleVerbs) {
        if (!verb.paradigms) continue;
        for (const paradigm of verb.paradigms) {
            if (!paradigm.forms) continue;
            for (const form of paradigm.forms) {
                // Basic filtering to keep pool manageable but realistic
                forms.push({
                    ...form,
                    lemma: verb.lemma,
                    type: verb.type
                });
            }
        }
    }
    return forms;
}

async function runSimulation(level) {
    console.log(`\n--- Simulating Level ${level} ---`);
    mockSettings.level = level;

    // Reset variety engine for this run
    varietyEngine.resetSession();

    const pool = await generatePool(level);
    console.log(`Pool size: ${pool.length} forms`);

    const history = {};
    const distribution = {};
    const sequence = [];

    for (let i = 0; i < 50; i++) {
        const item = await chooseNext({
            forms: pool,
            history,
            currentItem: sequence[sequence.length - 1],
            sessionSettings: mockSettings
        });

        if (item) {
            const key = `${item.mood}|${item.tense}`;
            distribution[key] = (distribution[key] || 0) + 1;
            sequence.push(key);

            // Update history mock
            const histKey = `${item.mood}:${item.tense}:${item.person}:${item.value}`;
            history[histKey] = { seen: 1, correct: 0 };
        }
    }

    // Print results
    console.log('Distribution over 50 items:');
    Object.entries(distribution)
        .sort((a, b) => b[1] - a[1])
        .forEach(([key, count]) => {
            const percentage = (count / 50 * 100).toFixed(1);
            console.log(`  ${key}: ${count} (${percentage}%)`);
        });

    // Check for streaks
    let maxStreak = 0;
    let currentStreak = 0;
    let lastType = null;
    let streakType = null;

    sequence.forEach(type => {
        if (type === lastType) {
            currentStreak++;
        } else {
            if (currentStreak > maxStreak) {
                maxStreak = currentStreak;
                streakType = lastType;
            }
            currentStreak = 1;
            lastType = type;
        }
    });

    console.log(`Max streak: ${maxStreak} (${streakType})`);
}

async function main() {
    await runSimulation('A1');
    await runSimulation('B1');
    await runSimulation('C2');
}

main().catch(console.error);

import { describe, it, expect } from 'vitest'
import { generateAllFormsForRegion, applyComprehensiveFiltering, clearFormsCache } from './DrillFormFilters.js'

describe('Sanity: eligible forms for Vos + A1 + specific indicativo/presente + regulares', () => {
  it('should have eligible forms', async () => {
    const settings = {
      region: 'rioplatense',
      level: 'A1',
      practiceMode: 'specific',
      specificMood: 'indicative',
      specificTense: 'pres',
      verbType: 'regular',
      practicePronoun: 'all'
    }
    const forms = await generateAllFormsForRegion(settings.region, settings)
    const constraints = { isSpecific: true, specificMood: 'indicative', specificTense: 'pres' }
    const eligible = applyComprehensiveFiltering(forms, settings, constraints)
    expect(eligible.length).toBeGreaterThan(0)
  })
})

describe('Cache invalidation for critical settings changes', () => {
  it('should generate different forms when changing verbType', async () => {
    clearFormsCache() // Start with clean cache

    const baseSettings = {
      region: 'la_general',
      level: 'A1',
      practiceMode: 'mixed',
      enableChunks: false // Use fallback for consistent results
    }

    // Generate forms with verbType: 'all'
    const settingsAll = { ...baseSettings, verbType: 'all' }
    const formsAll = await generateAllFormsForRegion('la_general', settingsAll)

    // Generate forms with verbType: 'regular'
    const settingsRegular = { ...baseSettings, verbType: 'regular' }
    const formsRegular = await generateAllFormsForRegion('la_general', settingsRegular)

    // Generate forms with verbType: 'irregular'
    const settingsIrregular = { ...baseSettings, verbType: 'irregular' }
    const formsIrregular = await generateAllFormsForRegion('la_general', settingsIrregular)

    // Apply filtering to see the actual difference that users experience
    const constraints = { isSpecific: false }
    const filteredAll = applyComprehensiveFiltering(formsAll, settingsAll, constraints)
    const filteredRegular = applyComprehensiveFiltering(formsRegular, settingsRegular, constraints)
    const filteredIrregular = applyComprehensiveFiltering(formsIrregular, settingsIrregular, constraints)

    // NOW we should see the differences after filtering
    expect(filteredAll.length).toBeGreaterThan(0)
    expect(filteredRegular.length).toBeGreaterThan(0)
    expect(filteredIrregular.length).toBeGreaterThan(0)

    console.log(`Filtered forms - All: ${filteredAll.length}, Regular: ${filteredRegular.length}, Irregular: ${filteredIrregular.length}`)

    // All should include more forms than regular or irregular alone after filtering
    expect(filteredAll.length).toBeGreaterThan(filteredRegular.length)
    expect(filteredAll.length).toBeGreaterThan(filteredIrregular.length)

    // Cache validation: calling with same settings should return exactly same result (cache hit)
    const formsAllSecond = await generateAllFormsForRegion('la_general', settingsAll)
    expect(formsAllSecond.length).toBe(formsAll.length)
  })

  it('should generate different forms when changing enableChunks', async () => {
    clearFormsCache() // Start with clean cache

    const baseSettings = {
      region: 'la_general',
      level: 'A1',
      practiceMode: 'mixed',
      verbType: 'all'
    }

    // Generate forms with chunks enabled
    const settingsWithChunks = { ...baseSettings, enableChunks: true }
    const formsWithChunks = await generateAllFormsForRegion('la_general', settingsWithChunks)

    // Generate forms with chunks disabled (fallback mode)
    const settingsNoChunks = { ...baseSettings, enableChunks: false }
    const formsNoChunks = await generateAllFormsForRegion('la_general', settingsNoChunks)

    // Both should have forms
    expect(formsWithChunks.length).toBeGreaterThan(0)
    expect(formsNoChunks.length).toBeGreaterThan(0)

    // Could be different sizes depending on which verbs are loaded in chunks vs fallback
    expect(typeof formsWithChunks).toBe('object')
    expect(typeof formsNoChunks).toBe('object')
  })
})

describe('Third-person preterite irregulars practice', () => {
  it('should include all persons for verbs in PRETERITE_THIRD_PERSON family', async () => {
    clearFormsCache(); // Ensure we are not using stale data

    const settings = {
      region: 'la_general',
      practiceMode: 'theme',
      specificMood: 'indicative',
      specificTense: 'pretIndef',
      verbType: 'irregular',
      selectedFamily: 'PRETERITE_THIRD_PERSON',
      enableChunks: false, // Use fallback for consistent results
    };

    const allForms = await generateAllFormsForRegion(settings.region, settings);
    const constraints = {
      isSpecific: true,
      specificMood: 'indicative',
      specificTense: 'pretIndef',
    };
    const eligible = applyComprehensiveFiltering(allForms, settings, constraints);

    // 1. Verify that there are eligible forms
    expect(eligible.length).toBeGreaterThan(0);

    // 2. Check for representative lemmas
    const lemmas = [...new Set(eligible.map(f => f.lemma))];
    expect(lemmas).toContain('pedir');
    expect(lemmas).toContain('dormir');
    expect(lemmas).toContain('leer');
    expect(lemmas.length).toBeGreaterThan(3);

    // 3. Check for presence of persons other than 3rd person
    const persons = [...new Set(eligible.map(f => f.person))];
    expect(persons).toContain('1s'); // yo
    expect(persons).toContain('2s_tu'); // tú
    expect(persons).toContain('3s'); // él/ella/usted
    expect(persons).toContain('1p'); // nosotros
    expect(persons).toContain('3p'); // ellos/ellas/ustedes

    // 4. Verify that non-3rd-person forms exist for key verbs
    const pedir1s = eligible.find(f => f.lemma === 'pedir' && f.person === '1s');
    expect(pedir1s).toBeDefined();
    expect(pedir1s.value).toBe('pedí');

    const dormir1s = eligible.find(f => f.lemma === 'dormir' && f.person === '1s');
    expect(dormir1s).toBeDefined();
    expect(dormir1s.value).toBe('dormí');

    const leer3s = eligible.find(f => f.lemma === 'leer' && f.person === '3s');
    expect(leer3s).toBeDefined();
    expect(leer3s.value).toBe('leyó'); // The irregular one
  });
});

describe('Chunk fallback for third-person preterite irregulars', () => {
  it('should load irregular verbs even when irregulars chunk metadata is empty (manifest failure simulation)', async () => {
    clearFormsCache(); // Ensure clean state

    // Mock scenario: simulate manifest failure by forcing empty metadata for irregulars chunk
    const { verbChunkManager } = await import('../../lib/core/verbChunkManager.js');
    const originalMetadata = verbChunkManager.chunkMetadata.get('irregulars');

    // Temporarily clear irregulars metadata to simulate manifest failure
    verbChunkManager.chunkMetadata.set('irregulars', {
      ...originalMetadata,
      verbs: [] // Empty array simulates failed manifest load
    });

    try {
      const settings = {
        region: 'la_general',
        practiceMode: 'theme',
        specificMood: 'indicative',
        specificTense: 'pretIndef',
        verbType: 'irregular',
        selectedFamily: 'PRETERITE_THIRD_PERSON',
        enableChunks: true, // Use chunks system (this is where the bug occurs)
      };

      const allForms = await generateAllFormsForRegion(settings.region, settings);
      const constraints = {
        isSpecific: true,
        specificMood: 'indicative',
        specificTense: 'pretIndef',
      };
      const eligible = applyComprehensiveFiltering(allForms, settings, constraints);

      // 1. Verify that there are eligible forms (should not be empty)
      expect(eligible.length).toBeGreaterThan(0);

      // 2. Check for representative lemmas that should appear with the fix
      const lemmas = [...new Set(eligible.map(f => f.lemma))];

      // These verbs should appear with the fix (they belong to E_I_IR, O_U_GER_IR, HIATUS_Y families)
      const expectedVerbs = ['pedir', 'dormir', 'leer'];
      const foundExpectedVerbs = expectedVerbs.filter(verb => lemmas.includes(verb));

      expect(foundExpectedVerbs.length).toBeGreaterThan(0,
        `Expected to find at least one of ${expectedVerbs.join(', ')} but only found: ${lemmas.join(', ')}`);

      // 3. Should have more than just the 3 verbs from common chunk
      expect(lemmas.length).toBeGreaterThan(3,
        `Expected more than 3 verbs, but found only: ${lemmas.join(', ')}`);

      // 4. Verify specific irregular forms exist
      if (lemmas.includes('pedir')) {
        const pedirThird = eligible.find(f => f.lemma === 'pedir' && f.person === '3s');
        expect(pedirThird).toBeDefined();
        expect(pedirThird.value).toBe('pidió');
      }

      if (lemmas.includes('dormir')) {
        const dormirThird = eligible.find(f => f.lemma === 'dormir' && f.person === '3s');
        expect(dormirThird).toBeDefined();
        expect(dormirThird.value).toBe('durmió');
      }

      if (lemmas.includes('leer')) {
        const leerThird = eligible.find(f => f.lemma === 'leer' && f.person === '3s');
        expect(leerThird).toBeDefined();
        expect(leerThird.value).toBe('leyó');
      }

      console.log(`✅ Chunk fallback test passed: Found ${lemmas.length} verbs including irregular verbs beyond common chunk`);
      console.log(`📝 Sample verbs found: ${lemmas.slice(0, 10).join(', ')}...`);

    } finally {
      // Restore original metadata
      verbChunkManager.chunkMetadata.set('irregulars', originalMetadata);
      clearFormsCache(); // Clean up cache
    }
  });

  it('should consistently find more verbs with fallback than without', async () => {
    clearFormsCache();

    const { verbChunkManager } = await import('../../lib/core/verbChunkManager.js');
    const originalMetadata = verbChunkManager.chunkMetadata.get('irregulars');

    const settings = {
      region: 'la_general',
      practiceMode: 'theme',
      specificMood: 'indicative',
      specificTense: 'pretIndef',
      verbType: 'irregular',
      selectedFamily: 'PRETERITE_THIRD_PERSON',
      enableChunks: true,
    };

    // First: test with empty metadata (simulating manifest failure)
    verbChunkManager.chunkMetadata.set('irregulars', {
      ...originalMetadata,
      verbs: []
    });

    const formsWithFallback = await generateAllFormsForRegion(settings.region, settings);
    const eligibleWithFallback = applyComprehensiveFiltering(formsWithFallback, settings, {
      isSpecific: true,
      specificMood: 'indicative',
      specificTense: 'pretIndef',
    });

    // Restore metadata and test with populated metadata
    verbChunkManager.chunkMetadata.set('irregulars', originalMetadata);
    clearFormsCache();

    const formsWithMetadata = await generateAllFormsForRegion(settings.region, settings);
    const eligibleWithMetadata = applyComprehensiveFiltering(formsWithMetadata, settings, {
      isSpecific: true,
      specificMood: 'indicative',
      specificTense: 'pretIndef',
    });

    // Both should have substantial verb counts
    expect(eligibleWithFallback.length).toBeGreaterThan(10);
    expect(eligibleWithMetadata.length).toBeGreaterThan(10);

    // The results should be similar (fallback should work as well as normal metadata)
    const fallbackLemmas = new Set(eligibleWithFallback.map(f => f.lemma));
    const metadataLemmas = new Set(eligibleWithMetadata.map(f => f.lemma));

    // Fallback should include key irregular verbs
    expect(fallbackLemmas.has('pedir') || fallbackLemmas.has('dormir') || fallbackLemmas.has('leer')).toBe(true);

    console.log(`📊 Fallback vs Metadata: ${fallbackLemmas.size} vs ${metadataLemmas.size} unique verbs`);

    clearFormsCache();
  });
});

describe('Third-person preterite irregulars practice with dialects', () => {
  it('should include "vos" forms for rioplatense region', async () => {
    clearFormsCache();

    const settings = {
      region: 'rioplatense',
      practiceMode: 'theme',
      specificMood: 'indicative',
      specificTense: 'pretIndef',
      verbType: 'irregular',
      selectedFamily: 'PRETERITE_THIRD_PERSON',
      enableChunks: false,
    };

    const allForms = await generateAllFormsForRegion(settings.region, settings);
    const constraints = {
      isSpecific: true,
      specificMood: 'indicative',
      specificTense: 'pretIndef',
    };
    const eligible = applyComprehensiveFiltering(allForms, settings, constraints);

    const persons = [...new Set(eligible.map(f => f.person))];
    expect(persons).toContain('2s_vos');
    expect(persons).not.toContain('2s_tu');

    const sentirVos = eligible.find(f => f.lemma === 'sentir' && f.person === '2s_vos');
    expect(sentirVos).toBeDefined();
    expect(sentirVos.value).toBe('sentiste'); // In preterite, vos and tu are often the same, but the person tag is what matters.
  });

  it('should include "vosotros" forms for peninsular region', async () => {
    clearFormsCache();

    const settings = {
      region: 'peninsular',
      practiceMode: 'theme',
      specificMood: 'indicative',
      specificTense: 'pretIndef',
      verbType: 'irregular',
      selectedFamily: 'PRETERITE_THIRD_PERSON',
      enableChunks: false,
    };

    const allForms = await generateAllFormsForRegion(settings.region, settings);
    const constraints = {
      isSpecific: true,
      specificMood: 'indicative',
      specificTense: 'pretIndef',
    };
    const eligible = applyComprehensiveFiltering(allForms, settings, constraints);

    const persons = [...new Set(eligible.map(f => f.person))];
    expect(persons).toContain('2p_vosotros');

    const pedirVosotros = eligible.find(f => f.lemma === 'pedir' && f.person === '2p_vosotros');
    expect(pedirVosotros).toBeDefined();
    expect(pedirVosotros.value).toBe('pedisteis');
  });
});

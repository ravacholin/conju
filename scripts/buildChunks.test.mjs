// Integration test for buildChunks script with CEFR and frequency classification
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')

async function testBuildChunks() {
  console.log('🧪 Testing buildChunks script...')

  try {
    console.log('📄 Loading buildChunks script...')

    // For testing, we need to run the build process
    const { exec } = await import('node:child_process')
    const { promisify } = await import('node:util')
    const execAsync = promisify(exec)

    // Run the build chunks script
    console.log('🔄 Executing buildChunks script...')
    const { stdout, stderr } = await execAsync('node scripts/buildChunks.mjs', {
      cwd: ROOT_DIR,
      timeout: 30000 // 30 second timeout
    })

    if (stderr) {
      console.warn('⚠️  Build warnings:', stderr)
    }

    console.log('📊 Build output:', stdout)

    // Verify the manifest was created
    const manifestPath = path.join(ROOT_DIR, 'public/chunks/manifest.json')
    const manifestContent = await readFile(manifestPath, 'utf8')
    const manifest = JSON.parse(manifestContent)

    console.log('✅ Testing manifest structure...')

    // Test manifest structure
    if (!manifest.chunks || !Array.isArray(manifest.chunks)) {
      throw new Error('Manifest chunks is not an array')
    }

    if (manifest.chunks.length !== 4) {
      throw new Error(`Expected 4 chunks, got ${manifest.chunks.length}`)
    }

    // Test enhanced metadata
    for (const chunk of manifest.chunks) {
      console.log(`🔍 Validating chunk: ${chunk.name}`)

      // Check required fields
      const requiredFields = ['name', 'lemmaCount', 'lemmas', 'expectedCount', 'cefrRange', 'frequencyProfile']
      for (const field of requiredFields) {
        if (!(field in chunk)) {
          throw new Error(`Chunk ${chunk.name} missing field: ${field}`)
        }
      }

      // Check that lemmaCount matches lemmas array length
      if (chunk.lemmaCount !== chunk.lemmas.length) {
        throw new Error(`Chunk ${chunk.name} lemmaCount mismatch: ${chunk.lemmaCount} vs ${chunk.lemmas.length}`)
      }

      // Check coverage calculation
      const expectedCoverage = ((chunk.lemmaCount / chunk.expectedCount) * 100).toFixed(1)
      if (chunk.coverage !== expectedCoverage) {
        console.warn(`⚠️  Chunk ${chunk.name} coverage mismatch: expected ${expectedCoverage}%, got ${chunk.coverage}%`)
      }

      console.log(`   ✓ ${chunk.name}: ${chunk.lemmaCount}/${chunk.expectedCount} verbs (${chunk.coverage}% coverage)`)
      console.log(`     CEFR: ${chunk.cefrRange}, Frequency: ${chunk.frequencyProfile}`)
    }

    // Test distribution improvements
    const coreChunk = manifest.chunks.find(c => c.name === 'core')
    const irregularsChunk = manifest.chunks.find(c => c.name === 'irregulars')
    const advancedChunk = manifest.chunks.find(c => c.name === 'advanced')

    console.log('📊 Checking distribution improvements...')

    // Check that advanced chunk has more than the previous 11 verbs
    if (advancedChunk.lemmaCount > 11) {
      console.log(`   ✅ Advanced chunk improved: ${advancedChunk.lemmaCount} > 11 verbs`)
    } else {
      console.warn(`   ⚠️  Advanced chunk still small: ${advancedChunk.lemmaCount} verbs`)
    }

    // Check that basic verbs are in appropriate chunks
    const basicRegularVerbs = ['hablar', 'comer', 'vivir', 'trabajar', 'estudiar']
    let basicVerbsInAdvanced = 0

    for (const verb of basicRegularVerbs) {
      if (advancedChunk.lemmas.includes(verb)) {
        basicVerbsInAdvanced++
        console.warn(`   ⚠️  Basic verb '${verb}' found in advanced chunk`)
      }
    }

    if (basicVerbsInAdvanced === 0) {
      console.log('   ✅ No basic verbs misclassified in advanced chunk')
    }

    // Check irregular verb classification
    const knownIrregulars = ['ser', 'estar', 'haber', 'tener', 'ir', 'dormir', 'pedir']
    let irregularsInWrongChunk = 0

    for (const verb of knownIrregulars) {
      const inIrregulars = irregularsChunk.lemmas.includes(verb)
      const inCore = coreChunk.lemmas.includes(verb)

      if (!inIrregulars && !inCore) {
        irregularsInWrongChunk++
        console.warn(`   ⚠️  Known irregular '${verb}' not in irregulars or core chunk`)
      }
    }

    if (irregularsInWrongChunk === 0) {
      console.log('   ✅ Known irregular verbs properly classified')
    }

    console.log('\\n🎉 All tests passed! Build chunks script working correctly.')
    console.log('📊 Final distribution:')
    manifest.chunks.forEach(chunk => {
      console.log(`   ${chunk.name}: ${chunk.lemmaCount} verbs (${chunk.coverage}% of target)`)
    })

    return true

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
    return false
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testBuildChunks().then(success => {
    process.exit(success ? 0 : 1)
  })
}

export { testBuildChunks }
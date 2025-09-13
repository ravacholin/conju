/**
 * Global teardown for Playwright tests
 * Runs once after all test files
 */
async function globalTeardown() {
  console.log('🧹 Starting global test teardown...')

  // Cleanup any resources
  try {
    // Clean up auth files
    const fs = await import('fs')
    const path = await import('path')

    const authDir = path.resolve('tests/e2e/.auth')
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true })
    }

    // Clean up any temporary test data
    const testResults = path.resolve('test-results')
    if (fs.existsSync(testResults)) {
      // Keep results but clean up temporary files
      const tempFiles = fs.readdirSync(testResults).filter(file =>
        file.includes('temp') || file.includes('tmp')
      )

      tempFiles.forEach(file => {
        fs.rmSync(path.join(testResults, file), { force: true })
      })
    }

    console.log('✅ Global teardown completed')
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
  }
}

export default globalTeardown
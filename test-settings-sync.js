// Test script to verify settings sync

async function testSettingsSync() {
  const testSettings = {
    id: 'settings-test-user-123',
    userId: 'test-user-123',
    settings: {
      level: 'C1',
      userLevel: 'C1',
      region: 'rioplatense',
      lastUpdated: Date.now()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncedAt: 0
  }

  console.log('Testing settings upload to:', 'http://localhost:8787/api/progress/settings/bulk')
  console.log('Payload:', JSON.stringify({ records: [testSettings] }, null, 2))

  try {
    const response = await fetch('http://localhost:8787/api/progress/settings/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'  // Replace with real token
      },
      body: JSON.stringify({ records: [testSettings] })
    })

    const result = await response.json()
    console.log('Response status:', response.status)
    console.log('Response:', result)
  } catch (error) {
    console.error('Error:', error.message)
  }
}

testSettingsSync()

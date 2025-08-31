// 🧪 Test rápido de persistencia - Ejecutar en consola del navegador
// Copia y pega este código en la consola de las DevTools

console.log('🧪 INICIANDO TEST RÁPIDO DE PERSISTENCIA');

async function testPersistenceQuick() {
  try {
    // Importar módulos
    const { initProgressSystem, getCurrentUserId, resetProgressSystem } = 
      await import('./src/lib/progress/index.js');
    const { trackAttemptStarted, trackAttemptSubmitted } = 
      await import('./src/lib/progress/tracking.js');
    const { getAttemptsByUser, getMasteryByUser } = 
      await import('./src/lib/progress/database.js');

    console.log('📦 Módulos importados correctamente');

    // 1. Verificar estado inicial
    console.log('\n🔍 PASO 1: Verificando estado inicial...');
    const storedUserId = localStorage.getItem('progress-system-user-id');
    console.log('📱 userId en localStorage:', storedUserId || 'NO ENCONTRADO');

    // 2. Inicializar sistema
    console.log('\n🚀 PASO 2: Inicializando sistema...');
    const userId = await initProgressSystem();
    console.log('👤 Usuario actual:', userId);

    // 3. Verificar persistencia de userId
    const newStoredUserId = localStorage.getItem('progress-system-user-id');
    console.log('💾 userId ahora en localStorage:', newStoredUserId);
    console.log('🔄 ¿Se guardó?:', userId === newStoredUserId ? '✅ SÍ' : '❌ NO');

    // 4. Simular práctica
    console.log('\n🎯 PASO 3: Simulando práctica...');
    const testItem = {
      id: 'test-ser-' + Date.now(),
      lemma: 'ser',
      mood: 'indicative', 
      tense: 'pres',
      person: 'yo',
      value: 'soy'
    };

    const attemptId = trackAttemptStarted(testItem);
    await trackAttemptSubmitted(attemptId, {
      correct: true,
      latencyMs: 1500,
      hintsUsed: 0,
      errorTags: [],
      userAnswer: 'soy',
      correctAnswer: 'soy',
      item: testItem
    });
    console.log('✅ Intento simulado y guardado');

    // 5. Verificar datos guardados
    console.log('\n📊 PASO 4: Verificando datos guardados...');
    const attempts = await getAttemptsByUser(userId);
    const mastery = await getMasteryByUser(userId);
    console.log(`📈 Intentos guardados: ${attempts.length}`);
    console.log(`🏆 Registros de mastery: ${mastery.length}`);

    if (attempts.length > 0) {
      console.log('📝 Último intento:', attempts[attempts.length - 1]);
    }

    // 6. Test de recuperación con getCurrentUserId
    console.log('\n🔄 PASO 5: Testando getCurrentUserId...');
    const recoveredUserId = getCurrentUserId();
    console.log('🔍 getCurrentUserId() retorna:', recoveredUserId);
    console.log('✅ ¿Coincide con userId actual?:', recoveredUserId === userId ? 'SÍ' : 'NO');

    // Resultado final
    console.log('\n' + '='.repeat(50));
    const persistenceWorks = 
      userId === newStoredUserId && 
      recoveredUserId === userId && 
      attempts.length > 0;

    if (persistenceWorks) {
      console.log('🎉 ¡PERSISTENCIA FUNCIONA CORRECTAMENTE!');
      console.log('✅ UserId se guarda en localStorage');
      console.log('✅ getCurrentUserId() funciona correctamente'); 
      console.log('✅ Los datos se guardan en IndexedDB');
      console.log('✅ Los datos están asociados al usuario correcto');
    } else {
      console.log('💥 ¡HAY PROBLEMAS DE PERSISTENCIA!');
      console.log('❌ Revisar implementación');
    }

    return {
      success: persistenceWorks,
      userId,
      attempts: attempts.length,
      mastery: mastery.length,
      localStorage: !!newStoredUserId
    };

  } catch (error) {
    console.error('💥 ERROR EN TEST:', error);
    return { success: false, error: error.message };
  }
}

// Ejecutar el test
testPersistenceQuick().then(result => {
  console.log('\n📋 RESULTADO DEL TEST:', result);
});

console.log('\n📝 INSTRUCCIONES:');
console.log('1. Este script verifica que la persistencia funcione correctamente');
console.log('2. Si aparece "🎉 ¡PERSISTENCIA FUNCIONA CORRECTAMENTE!" todo está bien');
console.log('3. Si aparece "💥 ¡HAY PROBLEMAS DE PERSISTENCIA!" hay que revisar');
console.log('4. Puedes recargar la página y ejecutar el script de nuevo');
console.log('5. Debería recuperar el mismo userId y mostrar los datos guardados');
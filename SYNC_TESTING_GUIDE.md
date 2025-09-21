# 🔧 Guía de Pruebas del Sync Multi-Dispositivo

Este archivo contiene instrucciones detalladas para probar que el sistema de sincronización multi-dispositivo funciona correctamente después de implementar la solución del **userId mismatch**.

## 🚀 Preparación del Entorno

### 1. Servidor Backend
```bash
# Terminal 1: Iniciar servidor backend
cd server/
npm run server:start
# Debería mostrar: "☁️ Progress Sync Server listening on http://localhost:8787/api"
```

### 2. Cliente Frontend
```bash
# Terminal 2: Iniciar frontend
npm run dev
# Debería abrir en http://localhost:5173
```

## 🧪 Plan de Pruebas

### Fase 1: Preparar Datos Anónimos
1. **Abrir navegador en modo incógnito** (para empezar limpio)
2. **Ir a http://localhost:5173**
3. **Practicar algunas conjugaciones** (al menos 10-15 intentos)
4. **Verificar que se crean datos locales:**
   ```javascript
   // En consola del navegador:
   window.debugSync()
   // Debería mostrar userId anónimo como "user-1234567890-abc123"
   ```
5. **Verificar datos pendientes:**
   ```javascript
   window.cloudSync.hasPendingSyncData()
   // Debería devolver true
   ```

### Fase 2: Hacer Login con Google
1. **Hacer click en "Login with Google"**
2. **Completar autenticación**
3. **OBSERVAR LOGS EN CONSOLA** - deberías ver:
   ```
   🔄 Iniciando migración local de IndexedDB...
   📊 Migrando X intentos...
   📈 Migrando X registros de mastery...
   ⏰ Migrando X schedules SRS...
   ✅ Migración local de IndexedDB completada
   🔍 Validando migración: user-1234567890-abc123 → uuid-servidor-456
   ✅ Migración validada exitosamente
   🔄 UserId del sistema de progreso actualizado
   ```

### Fase 3: Verificar Migración Exitosa
1. **Verificar nuevo userId:**
   ```javascript
   window.debugSync()
   // Debería mostrar nuevo userId del servidor
   ```
2. **Verificar que datos fueron migrados:**
   ```javascript
   window.cloudSync.hasPendingSyncData()
   // Debería devolver true (datos listos para subir)
   ```

### Fase 4: Probar Sync Inicial
1. **Ejecutar sync manualmente:**
   ```javascript
   window.cloudSync.syncWithCloud()
   // Debería mostrar logs detallados de subida
   ```
2. **Verificar que datos se subieron:**
   ```javascript
   window.cloudSync.hasPendingSyncData()
   // Ahora debería devolver false
   ```

### Fase 5: Probar Multi-Dispositivo
1. **Abrir segunda ventana/tab del navegador**
2. **Ir a http://localhost:5173**
3. **Hacer login con la misma cuenta Google**
4. **Verificar descarga automática:**
   ```javascript
   window.debugSync()
   // Debería mostrar mismo userId del servidor
   ```
5. **Verificar que datos aparecen:**
   - Debería ver el progreso del primer dispositivo
   - Las estadísticas deberían coincidir
   - El historial de práctica debería estar presente

### Fase 6: Probar Sync Bidireccional
1. **En el segundo dispositivo:**
   - Practicar algunas conjugaciones adicionales
   - Ejecutar sync: `window.cloudSync.syncWithCloud()`
2. **En el primer dispositivo:**
   - Refrescar página o ejecutar sync
   - Verificar que aparecen los nuevos datos

## 🐛 Debugging y Logs Importantes

### Logs de Migración Exitosa
```
🔍 DEBUG syncNow: getCurrentUserId() retornó: uuid-servidor-456
🔍 DEBUG: Encontrados X attempts totales para userId: uuid-servidor-456
📤 Subiendo X attempts al servidor...
✅ Attempts subidos exitosamente: X
```

### Logs de Account Sync
```
🔄 Iniciando sincronización de cuenta multi-dispositivo...
📥 Datos recibidos de la cuenta: { attempts: X, mastery: Y, schedules: Z }
✅ Sincronización de cuenta completada
```

### Comandos de Debug Útiles
```javascript
// Estado completo del sync
window.debugSync()

// Estado de autenticación
window.authService.isLoggedIn()
window.authService.getToken()

// Datos pendientes
window.cloudSync.hasPendingSyncData()

// Estado del sync
window.cloudSync.getSyncStatus()

// Forzar sync
window.cloudSync.forceSync()
```

## ❌ Problemas Comunes y Soluciones

### 1. "No hay datos para sincronizar"
**Causa:** userId mismatch no resuelto
**Solución:** Verificar logs de migración, puede que la migración haya fallado

### 2. "Sync failed: not enabled"
**Causa:** URL del servidor no configurada
**Solución:** Verificar que backend esté corriendo en puerto 8787

### 3. "HTTP 401: Invalid or expired token"
**Causa:** Token de autenticación expirado
**Solución:** Hacer logout y login nuevamente

### 4. "Account sync falló"
**Causa:** Problemas de conectividad o servidor
**Solución:** Verificar que servidor backend esté funcionando

## ✅ Criterios de Éxito

La implementación es exitosa cuando:

1. ✅ **Migración automática:** Al hacer login, los datos anónimos se migran automáticamente
2. ✅ **Logs detallados:** Se ven logs claros de todo el proceso
3. ✅ **Validación:** La migración se valida y confirma que fue exitosa
4. ✅ **Sync inicial:** Los datos migrados se suben al servidor
5. ✅ **Multi-dispositivo:** Un segundo dispositivo descarga los datos automáticamente
6. ✅ **Bidireccional:** Cambios en cualquier dispositivo se sincronizan a otros
7. ✅ **Sin pérdida de datos:** Todos los attempts, mastery y schedules se preservan

## 🚨 Rollback en Caso de Problemas

Si algo sale mal durante las pruebas:

1. **Limpiar datos locales:**
   ```javascript
   localStorage.clear()
   // Refrescar página
   ```

2. **Reiniciar servidor backend:**
   ```bash
   # Ctrl+C en terminal del servidor
   npm run server:start
   ```

3. **Verificar logs del servidor** para errores de backend

---

**¡El sync multi-dispositivo ya debería funcionar perfectamente!** 🎉
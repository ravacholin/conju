# Progress Sync Server

Servidor de sincronización de progreso para Spanish Conjugator, construido con Node.js, Express y SQLite.

## 🚀 Deployment en Railway

### Opción 1: Desde GitHub (Recomendado)

1. **Conectar repositorio a Railway:**
   ```bash
   # 1. Ir a https://railway.app
   # 2. Crear cuenta y nuevo proyecto
   # 3. Conectar GitHub repository
   # 4. Seleccionar el directorio 'server' como Root Directory
   ```

2. **Configurar variables de entorno en Railway:**
   ```
   NODE_ENV=production
   PORT=8787
   CORS_ORIGIN=https://verb-os.vercel.app,http://localhost:5173
   ```

3. **Deploy automático:**
   - Railway detecta automáticamente Node.js
   - Ejecuta `npm install` y `npm start`
   - URL disponible en formato: `https://[proyecto-id].railway.app`

### Opción 2: Deploy directo

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login y deploy
railway login
railway link  # Conectar a proyecto existente
railway up    # Deploy desde directorio server/
```

## 🌐 Deployment en Render (Alternativa)

1. **Crear servicio en Render:**
   - Ir a https://render.com
   - Conectar GitHub repository
   - Seleccionar "Web Service"
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Variables de entorno:**
   ```
   NODE_ENV=production
   PORT=10000
   CORS_ORIGIN=https://verb-os.vercel.app
   ```

## 📦 Deployment con Docker

```bash
# Construir imagen
cd server/
docker build -t spanish-conjugator-api .

# Ejecutar localmente
docker run -p 8787:8787 spanish-conjugator-api

# Deploy a cualquier plataforma que soporte Docker
```

## 🔧 Configuración del Cliente

Después del deployment, actualizar `.env.local` en el proyecto principal:

```env
# Cambiar la URL por la del servidor desplegado
VITE_PROGRESS_SYNC_URL=https://tu-proyecto.railway.app/api
VITE_PROGRESS_SYNC_AUTH_HEADER_NAME=Authorization
```

## ✅ Verificación

1. **Healthcheck del servidor:**
   ```bash
   curl https://tu-servidor.railway.app/
   # Respuesta: {"ok":true,"name":"progress-sync-server","ts":1234567890}
   ```

2. **Test de API:**
   ```bash
   curl -X GET https://tu-servidor.railway.app/api/health \
        -H "X-User-Id: test-user"
   ```

3. **Verificar CORS:**
   - Abrir verb-os.vercel.app
   - Ir a Panel de Gestión de Datos > Configurar Sync
   - Probar conectividad con el servidor

## 🗄️ Base de Datos

- **Desarrollo:** SQLite local en `.data/progress-sync.db`
- **Producción:** SQLite persistente (Railway/Render proporcionan almacenamiento)
- **Migraciones:** Automáticas al arrancar el servidor

## 🔐 Autenticación

El servidor soporta múltiples métodos de autenticación:

1. **Authorization: Bearer [token]** - Producción
2. **X-API-Key: [key]** - Alternativa
3. **X-User-Id: [user-id]** - Desarrollo/testing

## 📊 Endpoints Disponibles

- `GET /` - Healthcheck
- `GET /api/health` - API healthcheck
- `POST /api/progress/attempts/bulk` - Subir intentos
- `POST /api/progress/mastery/bulk` - Subir datos de dominio
- `POST /api/progress/schedules/bulk` - Subir horarios SRS
- `GET /api/progress/export` - Exportar datos del usuario

## 🚨 Troubleshooting

1. **Error de CORS:** Verificar que `CORS_ORIGIN` incluya el dominio correcto
2. **Error de autenticación:** Verificar headers y tokens
3. **Error de conexión:** Verificar que el servidor esté ejecutándose
4. **Error de SQLite:** Verificar permisos de escritura en directorio `.data`
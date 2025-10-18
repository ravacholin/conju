# Interfaz pública de sincronización y autenticación

Esta guía resume la interfaz REST expuesta por el servidor de sincronización para facilitar la
migración de clientes existentes. Todos los endpoints cuelgan de `https://<host>/api` (o del prefijo
configurado vía `API_PREFIX`).

## Autenticación moderna (JWT)

1. **Registro** – `POST /api/auth/register`
   - `body`: `{ email, password, name?, deviceName? }`
   - Respuesta `201`: `{ token, account, user }`
2. **Login email/contraseña** – `POST /api/auth/login`
   - `body`: `{ email, password, deviceName? }`
   - Respuesta `200`: `{ token, account, user }`
3. **Login Google** – `POST /api/auth/google`
   - `body`: `{ credential, deviceName?, profile? }`
   - Requiere que el servidor tenga `GOOGLE_CLIENT_IDS`.
4. **Perfil y dispositivos** (token Bearer obligatorio)
   - `GET /api/auth/me` – datos de cuenta + sincronización fusionada.
   - `PATCH /api/auth/account` – actualiza `name` u otros campos.
   - `GET /api/auth/devices` – lista dispositivos vinculados.
   - `PATCH /api/auth/devices/:deviceId` – renombra dispositivo.
   - `DELETE /api/auth/devices/:deviceId` – revoca dispositivo ajeno.
5. **Migraciones**
   - `POST /api/auth/migrate` – enlaza un `anonymousUserId` existente a la cuenta autenticada.
6. **Descarga multi-dispositivo**
   - `POST /api/auth/sync/download` – devuelve `{ data, timestamp }` fusionando intents, mastery,
     schedules y sessions de todos los dispositivos del usuario autenticado.

> **Nota:** Todos los endpoints autenticados exigen cabecera `Authorization: Bearer <token>` emitido
> por `generateJWT`. Los clientes antiguos que enviaban `X-API-Key` deben migrar a JWT tan pronto
> completen el flujo de login o registro.

## Endpoints legados protegidos por middleware heredado

Mientras los clientes migran, `/api/progress/...` continúa aceptando `Authorization: Bearer` o la
pareja `X-API-Key` + `X-User-Id` (uso temporal). Cada petición llama internamente a `upsertUser`
para garantizar la existencia del usuario.

### Bulk upload (JSON)

- `POST /api/progress/attempts/bulk`
- `POST /api/progress/mastery/bulk`
- `POST /api/progress/schedules/bulk`
- `POST /api/progress/sessions/bulk`

`body`: `{ records: [ { id, ...camposDatos } ] }`. El servidor normaliza campos de fecha (`createdAt`,
`updatedAt`, `nextDue`, `timestamp`) y fuerza `userId` desde el token/cabecera.

**Respuesta**: `{ success: true, uploaded, updated }`.

### Export completo

- `GET /api/progress/export`

Devuelve `{ userId, attempts[], mastery[], schedules[], sessions[] }` con los registros del usuario
actual.

## Recomendaciones de migración

1. Completar flujo de login/registro y persistir `token` JWT por dispositivo.
2. Remplazar cabeceras `X-API-Key`/`X-User-Id` por `Authorization: Bearer <token>` en todas las
   llamadas.
3. Mantener el mismo payload JSON que en la API anterior; el servidor aplica compatibilidad hacia
   atrás normalizando fechas y claves de sesión.
4. Para sincronizaciones multi-dispositivo, usar `POST /api/auth/sync/download` en lugar de descargar
   datos manualmente de cada tabla.

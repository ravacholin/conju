# Progress Event Catalog

Este catalogo define el contrato minimo de eventos `progress:*` usados por dashboard, cache y tracking.

## Eventos principales
| Evento | Payload base | Origen principal | Consumidores principales |
| --- | --- | --- | --- |
| `progress:dataUpdated` | `type?`, `userId?`, `attemptId?`, `challengeId?`, `mood?`, `tense?`, `person?`, `correct?`, `forceFullRefresh?` | `tracking`, `challenges`, `sync` | `useProgressDashboardData`, `ProgressDataCache`, widgets de progreso |
| `progress:challengeCompleted` | `userId?`, `challengeId?`, `reward?`, `emittedAt?` | `challenges` | `ProgressDataCache`, dashboard |
| `progress:navigate` | `mood?`, `tense?`, `person?`, `micro?` (+ campos extra permitidos) | UI de progreso | `ProgressDashboard` |
| `progress:srs-updated` | `userId?`, `mood?`, `tense?`, `person?` | `srs` | `SRSPanel`, notificaciones |

## API unificada
- Emision: `emitProgressEvent(eventName, detail, { validate })`
- Suscripcion: `onProgressEvent(eventName, handler, { validate })`
- Validacion: `validateProgressEventDetail(eventName, detail)`
- Fuente de verdad: `src/lib/events/progressEventBus.js`

## Regla de uso
- Para nuevos eventos `progress:*`, registrar primero el contrato en `PROGRESS_EVENT_CATALOG` y su schema Zod.
- No usar `window.dispatchEvent(new CustomEvent(...))` directo para eventos `progress:*` nuevos; usar helpers del event bus.

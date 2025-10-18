# ADR-006: Separación de capas para persistencia, autenticación y sincronización

- **Estado**: Propuesto
- **Fecha**: 2024-03-16

## Contexto

El backend de sincronización de progreso creció combinando persistencia SQLite, autenticación
tradicional y endpoints de sincronización legados en un único bloque Express. Esta mezcla hacía
costoso evolucionar cada dimensión de manera independiente (p. ej. reemplazar el almacenamiento o
introducir OAuth) y complicaba el hardening de seguridad.

## Decisión

Adoptamos una separación explícita de tres capas con contratos bien definidos:

```
┌───────────────────────┐
│   Capa de Sincronización │
│   (`routes.js`)        │
│   - Expone API REST    │
│   - Orquesta validación│
│     y transformaciones │
└────────────▲──────────┘
             │ usa
┌────────────┴──────────┐          depende de
│   Capa de Autenticación│──────────┐
│   (`auth-routes.js`,   │          │
│    `auth-service.js`,  │◀─────────┘
│    `auth.js`)          │  verifica/inyecta
└────────────▲──────────┘
             │ persiste
┌────────────┴──────────┐
│   Capa de Persistencia │
│   (`db.js`, migraciones│
│    SQL)                │
└────────────────────────┘
```

- **Persistencia** encapsula el acceso a SQLite (`db.js`) y mantiene migraciones idempotentes.
  Expone utilidades como `upsertUser` usadas desde capas superiores.
- **Autenticación** concentra la lógica de cuentas, dispositivos y tokens (`auth-service.js`),
  además de los endpoints públicos (`auth-routes.js`) y el middleware heredado (`auth.js`).
- **Sincronización** ofrece endpoints de progreso (`routes.js`) que dependen de la identidad
  provista por la capa de autenticación y escriben/leen mediante la capa de persistencia.

## Consecuencias

- **Positivas**
  - Facilita sustituir la base de datos o añadir proveedores OAuth sin tocar `routes.js`.
  - Permite hardening y auditorías de seguridad enfocadas en `auth-service.js`.
  - Documentación y on-boarding más claros al tener fronteras explícitas.
- **Negativas**
  - Se requiere disciplina para mantener APIs estrechas entre capas.
  - Aparecen dependencias circulares si la capa de sincronización accede directamente al modelo;
    se debe preferir exponer funciones específicas desde persistencia.

## Próximos pasos

1. Extraer DTOs compartidos a un módulo neutral para reducir duplicación entre capas.
2. Añadir pruebas de contrato que validen el intercambio de datos entre `auth-routes.js` y
   `routes.js`.

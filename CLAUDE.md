# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
npm run dev            # Servidor de desarrollo
npm run build          # Build productivo
npm run typecheck      # tsc --noEmit (TS strict)
npm run lint           # ESLint
npm run db:migrate     # prisma migrate dev (requiere DIRECT_URL en .env)
npm run db:deploy      # prisma migrate deploy (CI/prod)
npm run db:studio      # UI visual de la BD
npx prisma validate    # Validar schema sin tocar la BD
npx prisma generate    # Regenerar PrismaClient (lo hace postinstall)
```

Setup inicial: `cp .env.example .env` → completar valores → `npm install` → `npx prisma migrate dev --name init` → `npm run dev`.

## Arquitectura

Aplicación Next.js 15 (App Router) que es un asistente para ejercer derechos LPDP (Ley 19.628 + Ley 21.719). Toda la lógica vive en un único proyecto Next.js: las API routes hacen de backend.

**Flujo central**: usuario se autentica → describe un caso + adjunta archivos → inicia conversación multi-turno con Clarita → al cierre, la solicitud formal se extrae como Reporte → descargable como PDF. Cada turno del agente es síncrono en una request HTTP — no hay job queue.

### Capas

- `app/(auth)/` y `app/(dashboard)/` — route groups. Dashboard está protegido por `middleware.ts`.
- `app/api/` — handlers REST (`route.ts`). Cada handler valida la sesión vía el header `x-user-id` que inyecta el middleware (no llama a `getSession()` directamente para evitar duplicar la verificación).
- `lib/` — código server-only. No importar desde componentes cliente.
- `components/` — UI. Server Components por defecto; los que llevan `"use client"` están en `forms/` y `dashboard/` cuando necesitan estado o eventos.
- `prisma/schema.prisma` — modelo de datos: `User`, `Solicitud` (con enum `SolicitudEstado`), `Adjunto`, `Mensaje`, `Reporte`.
- `knowledge-base/*.md` — base legal versionada en git. **No mover a BD ni a Storage** — `lib/kb.ts` la lee del filesystem en runtime y la cachea en memoria.

### Autenticación

Tres piezas trabajan juntas:

1. **`lib/auth.ts`** firma JWTs con **`jose`** (HS256). Importante: NO usar `jsonwebtoken` — el middleware corre en Edge runtime y `jsonwebtoken` no es compatible.
2. **`middleware.ts`** corre antes de cada request a rutas protegidas, verifica el JWT de la cookie `cdt_session` e inyecta `x-user-id` y `x-user-email` en los headers de la request reescrita.
3. **API routes protegidas** leen `x-user-id` con `headers()` de `next/headers`. Si lo necesitan en componentes, usan `getSession()` de `lib/auth.ts`.

El registro NO crea sesión. El usuario debe verificar el correo (Resend → token de 32 bytes hex con expiración 24h) antes de poder hacer login. El handler de login bloquea si `emailVerified` es null.

### Agente Claude (`lib/agent.ts`)

Punto crítico de costo y latencia. Decisiones a respetar:

- Modelo: **`claude-sonnet-4-6`**.
- **Extended thinking** (`thinking: { type: "enabled", budget_tokens: 10000 }`).
- **Prompt caching obligatorio**: el `system` se envía como dos bloques `[preámbulo, KB-completa-con-cache_control-ephemeral]`. La KB es estática y voluminosa → ~90% cache hit.
- Streaming con `stream.finalMessage()`. NO usar `messages.create()` directo.

**Arquitectura multi-turno**: la conversación es multi-turno. Cada turno es una request HTTP síncrona. Los mensajes se almacenan en la tabla `Mensaje` (rol: `user` | `assistant`). El agente decide cuándo cerrar el caso emitiendo `[CASO_CERRADO]` y envolviendo la solicitud formal en `<solicitud_formal>...</solicitud_formal>`. Límite: 20 mensajes por solicitud.

**Flujo**:
1. `POST /api/solicitudes` — crea Solicitud + primer mensaje user → ejecuta primer turno del agente → guarda respuesta como Mensaje.
2. `POST /api/solicitudes/[id]/messages` — guarda mensaje user → carga historial → ejecuta turno → guarda respuesta. Si el agente emite `[CASO_CERRADO]`, extrae `<solicitud_formal>` → guarda como `Reporte` → marca `CERRADA`.
3. Si el agente falla, la solicitud vuelve a `ACTIVA` para permitir reintentos.

### Storage de archivos

Supabase Storage, bucket privado `cdt-files`. **No usar BYTEA** — el usuario consideró ambas opciones y eligió Storage. El frontend nunca recibe URLs públicas; cuando se necesite descargar un adjunto, usar `getSignedUrl()` (`lib/storage.ts`) con TTL de 5 minutos.

Path convention: `solicitudes/{userId}/{solicitudId}/{uuid}-{filename-sanitizado}`. El sanitizado lo hace `sanitizeFilename()` en `lib/validators.ts` — no confiar en el `file.name` del cliente.

### PDF

`@react-pdf/renderer` (no Puppeteer — Vercel serverless). El componente `lib/pdf/ReporteDocument.tsx` parsea el markdown del reporte con un parser propio mínimo (h1/h2/h3, párrafos, listas ul/ol). Si el agente cambia el formato de salida, ese parser puede necesitar ajustes.

### Validaciones

Todas en `lib/validators.ts` con Zod. Casos especiales:

- `lib/rut.ts` — validador chileno con dígito verificador. NO usar regex simple; usa `computeDv()` con el algoritmo del cálculo módulo 11.
- Uploads: whitelist de MIME en `ALLOWED_MIME_TYPES`, máx 5 archivos, 10MB c/u, 25MB total.

## Decisiones de stack que NO cambiar sin discutir con el usuario

Documentadas en detalle en `README.md` → "Decisiones técnicas". Resumen:

- `jose` (no `jsonwebtoken`) por compatibilidad con Edge runtime del middleware.
- `directUrl` separado en Prisma porque `prisma migrate` necesita conexión directa, no el pooler PgBouncer de Supabase.
- KB en `/knowledge-base/*.md` (no en BD ni Storage) — versionada con git, revisable en PRs.
- Cookie HttpOnly+Secure+SameSite=Lax (no localStorage) para inmunidad XSS.
- `claude-sonnet-4-6` con extended thinking + prompt caching.
- Conversación multi-turno con tabla `Mensaje` y señal de cierre `[CASO_CERRADO]`.

## Convenciones de código

- TypeScript strict. Path alias: `@/*` mapea a la raíz del proyecto.
- Componentes Server por defecto. Solo agregar `"use client"` cuando se necesite estado, hooks o eventos del DOM.
- Importar tipos de Prisma desde `@prisma/client` (`SolicitudEstado`, etc.).
- Para el agente y la BD, NO crear interfaces paralelas — reutilizar tipos del SDK Anthropic (`Anthropic.TextBlock`, etc.) y de Prisma.
- Mensajes y errores user-facing en **español ES-CL**.
- Estilo visual: dark SaaS, paleta brand `#7C5CFF`, fondo `#0B0D10` — definida en `tailwind.config.ts`. Componentes reutilizables expuestos como clases `@layer components` en `app/globals.css` (`.card`, `.btn-primary`, `.input`, `.label`, `.badge-*`, `.prose-invert`).

## Despliegue

Vercel + Supabase. Antes del primer deploy productivo:

```bash
DATABASE_URL=<DIRECT_URL_de_prod> npx prisma migrate deploy
```

(usar `DIRECT_URL` del proyecto Supabase de producción, no `DATABASE_URL` que apunta al pooler).

`postinstall` corre `prisma generate` automáticamente en build.

Bucket `cdt-files` en Supabase debe ser **privado**; el backend usa la `service_role` key que SOLO debe vivir en variables de entorno server-side.

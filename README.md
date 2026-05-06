# CDT — Asistente LPDP ejecutable

MVP de una aplicación web que convierte el derecho de protección de datos
personales en algo accionable: el ciudadano describe un caso (crédito negado,
seguro encarecido, CV filtrado, beneficio rechazado), adjunta evidencia, y un
agente especializado en la **Ley 19.628 + Ley 21.719** genera un reporte con
sus derechos, fundamentos legales, plantillas de cartas y un PDF descargable.

## Stack

- **Next.js 15** (App Router) + **TypeScript** strict
- **Prisma** ORM + **PostgreSQL** (Supabase)
- **TailwindCSS** + componentes custom (estética SaaS oscura)
- **JWT** (HS256, jose) en cookie HttpOnly + verificación por correo
- **Resend** para correos transaccionales
- **Anthropic SDK** (`claude-opus-4-7`) con prompt caching de la base de conocimiento
- **@react-pdf/renderer** para PDFs sin headless browser
- **Supabase Storage** para adjuntos

---

## Setup local

### 1. Requisitos
- Node.js 20+
- Cuenta gratis en [Supabase](https://supabase.com), [Resend](https://resend.com) y [Anthropic](https://console.anthropic.com)

### 2. Supabase

1. Crear un proyecto.
2. Copiar las connection strings (Settings → Database):
   - **DATABASE_URL** (pooler, puerto 6543)
   - **DIRECT_URL** (direct, puerto 5432, para migrations)
3. En Storage, crear un bucket privado llamado **`cdt-files`**.
4. Copiar el `URL` y la `service_role` key (Settings → API).

### 3. Resend

1. Crear API key.
2. Para producción, verificar dominio. Para desarrollo, usar `onboarding@resend.dev` como sender.

### 4. Anthropic

1. Crear API key en `console.anthropic.com`.

### 5. Configurar el proyecto

```bash
git clone <repo> cdt
cd cdt
cp .env.example .env
# Edita .env con tus valores reales
npm install
npx prisma migrate dev --name init
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run typecheck` | TypeScript sin emit |
| `npm run lint` | ESLint |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | `prisma migrate deploy` (CI/prod) |
| `npm run db:studio` | UI visual de la BD |

---

## Estructura

```
app/
  (auth)/                # login, register, verify
  (dashboard)/           # protegido por middleware
    dashboard/           # listado de solicitudes
    solicitudes/         # nueva + detalle
  api/
    auth/{register,login,verify,logout,me}/
    solicitudes/         # POST crea + dispara agente; GET lista
    solicitudes/[id]/    # detalle
    solicitudes/[id]/pdf # streaming del reporte
  page.tsx               # landing pública
lib/
  prisma.ts              # PrismaClient singleton
  auth.ts                # JWT (jose), bcrypt, cookies
  rut.ts                 # validador chileno
  validators.ts          # zod schemas
  email.ts               # cliente Resend
  storage.ts             # Supabase Storage helpers
  kb.ts                  # carga lazy de /knowledge-base/*.md
  agent.ts               # Anthropic SDK + prompt caching
  pdf/ReporteDocument.tsx
components/
  ui/                    # Spinner, Alert
  forms/                 # LoginForm, RegisterForm, SolicitudForm
  dashboard/             # EstadoBadge, LogoutButton, ReporteView
middleware.ts            # JWT en cookie → x-user-id header
prisma/schema.prisma
knowledge-base/*.md      # base legal — versionada en git
```

---

## Flujo end-to-end

1. **Registro**: `/register` → `POST /api/auth/register` → valida RUT chileno (DV) + Zod → crea usuario sin verificar → envía correo Resend con `?token=…`.
2. **Verificación**: link → `/verify` → `POST /api/auth/verify` → marca `emailVerified` y limpia el token.
3. **Login**: `/login` → `POST /api/auth/login` → bcrypt compare → firma JWT (7d) → cookie `cdt_session` HttpOnly+Secure+SameSite=Lax. Bloquea login si `emailVerified` es null.
4. **Middleware**: protege `/dashboard/*`, `/solicitudes/*`, `/api/solicitudes/*`. Inyecta `x-user-id` en headers para handlers downstream.
5. **Nueva solicitud**: `/solicitudes/nueva` → `POST /api/solicitudes` (`multipart/form-data`):
   - Valida glosa, MIME types, tamaño (10MB/archivo, 25MB total, 5 archivos máx).
   - Crea `Solicitud { ACTIVA }`.
   - Sube cada adjunto a Supabase Storage (`solicitudes/{userId}/{solicitudId}/{uuid}-{filename}`) y registra en BD.
   - Marca `EN_PROCESO`.
   - Llama `analyzeSolicitud()`: Anthropic con system de dos bloques — preámbulo + KB completa con `cache_control: ephemeral` (90% cache hit esperado en cargas reales).
   - Persiste reporte y marca `CERRADA`. En error, vuelve a `ACTIVA`.
6. **Detalle**: `/solicitudes/[id]` muestra glosa, adjuntos, reporte renderizado con `react-markdown`.
7. **PDF**: botón "Descargar PDF" → `GET /api/solicitudes/[id]/pdf` → `renderToBuffer` con `@react-pdf/renderer` → stream al navegador.

---

## Decisiones técnicas

### `jose` en lugar de `jsonwebtoken`
El middleware corre en Edge runtime; `jsonwebtoken` no es compatible. `jose` sí.

### `directUrl` separado en Prisma
Supabase expone un pooler PgBouncer (puerto 6543) optimizado para queries rápidas, pero `prisma migrate` necesita conexión directa con transacciones largas (puerto 5432). Por eso `DATABASE_URL` apunta al pooler y `DIRECT_URL` al direct.

### Prompt caching sobre la KB
`SYSTEM_PREAMBLE` y la concatenación de los `.md` van como dos bloques en `system`, con `cache_control: { type: "ephemeral" }` en el bloque grande. La primera request paga el costo de escritura (~1.25×); las siguientes leen al 0.1× durante 5 minutos. La KB es estable entre solicitudes → cache hit ~90%.

### Sin extracción de PDF al agente (v1)
Los adjuntos se referencian por nombre/tipo en el prompt; el agente puede pedir más contexto en "Información que falta". v2: integrar `pdf-parse` o la Files API de Anthropic.

### Supabase Storage en lugar de BYTEA
El usuario pidió "blob"; al escalar la decisión, se prefirió Storage para no inflar la BD ni los backups. Las columnas `storagePath`/`pdfPath` guardan rutas, no bytes.

### Cookie HttpOnly en lugar de localStorage
Inmune a XSS para robo de sesión. `SameSite=Lax` mitiga CSRF en navegación normal.

### `claude-opus-4-7` con `thinking: adaptive`
Modelo más capaz disponible (1M context). Adaptive thinking deja que el modelo decida cuánto razonar; sin tuning manual de `budget_tokens`. Streaming con `finalMessage()` evita timeouts en respuestas largas.

---

## Seguridad (OWASP Top 10 cubierto)

- **A01 Broken Access**: middleware verifica JWT y `x-user-id`; cada query usa `userId` del header. Ownership verificado en GET/PDF antes de devolver.
- **A02 Crypto**: bcrypt cost 12; JWT HS256 con secret ≥ 32 bytes; cookies `HttpOnly; Secure; SameSite=Lax`.
- **A03 Injection**: Prisma parametriza; Zod valida y sanitiza; `sanitizeFilename` elimina caracteres peligrosos antes del path en Storage.
- **A04 Insecure Design**: timing-safe login (bcrypt dummy compare cuando el usuario no existe → no filtra existencia); token de verificación de 32 bytes con expiración de 24h.
- **A05 Misconfig**: `SUPABASE_SERVICE_ROLE_KEY` y `ANTHROPIC_API_KEY` solo en archivos server.
- **A07 Auth Failures**: login bloqueado sin `emailVerified`; mensaje genérico en credenciales incorrectas.
- **Uploads**: tamaño máximo, whitelist de MIME, sanitización de filename, paths bajo `solicitudes/{userId}/...` (sin path traversal).

> **Pendiente para producción**: rate limiting (Upstash o middleware con Redis) en `/api/auth/*` y `/api/solicitudes`.

---

## Despliegue (Vercel + Supabase)

1. Push del repo a GitHub.
2. **Vercel** → Import Project → seleccionar repo.
3. Pegar todas las variables de `.env` en **Environment Variables**.
4. Build command: `next build` (default). El `postinstall` corre `prisma generate`.
5. Antes del primer deploy productivo:
   ```bash
   DATABASE_URL=<DIRECT_URL_de_prod> npx prisma migrate deploy
   ```
6. **Resend**: verificar dominio antes de prod (sin verificación, los correos solo van al owner de la API key).
7. **Supabase Storage**: el bucket `cdt-files` debe ser **privado**. El backend usa `service_role`; el frontend nunca obtiene URLs públicas — siempre signed URLs de corta duración (helper `getSignedUrl()` con `expiresIn: 300`).
8. Verificar `APP_URL` apunte al dominio productivo (los correos de verificación lo usan).

---

## Verificación end-to-end

```bash
npm run dev
```

1. `/register` con RUT inválido → muestra error de DV.
2. `/register` con datos válidos → "Revisa tu correo".
3. Click link de Resend → `/verify?token=…` → "Cuenta verificada".
4. `/login` → redirect a `/dashboard`.
5. `/solicitudes/nueva` con glosa + 1 PDF → estado pasa por `ACTIVA → EN_PROCESO → CERRADA`.
6. Detalle muestra reporte renderizado.
7. "Descargar PDF" → archivo con título, glosa y reporte formateado.
8. Logout → `/dashboard` redirige a `/login`.
9. Registrar segundo usuario → `GET /api/solicitudes/{id-de-otro}` → 403.

### Checks de calidad

```bash
npm run typecheck   # TS strict, sin errores
npm run lint        # ESLint
npx prisma validate # esquema válido
npm run build       # build productivo
```

---

## Roadmap (v2)

- OAuth social / Clave Única
- Streaming SSE de la respuesta del agente (en lugar de bloqueo síncrono)
- Files API de Anthropic para enviar PDFs nativos al modelo
- Panel admin para editar la KB desde UI
- Rate limiting con Upstash
- Notificaciones push cuando termine un análisis largo
- i18n (por ahora todo en español ES-CL)

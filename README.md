# Cumpleaños de Luis · 18 — Control de invitados

Plataforma web para el cumpleaños número 18 de Luis. Los invitados crean su invitación y generan un código QR; los guardias inician sesión, escanean los QR y registran la entrada y el regalo de cada invitado en tiempo real.

## Stack

- React 19 + Vite 8 + TypeScript
- Bun como gestor de paquetes y runner de scripts
- Supabase (Auth, Postgres, Storage, Realtime)
- React Router v7
- QR: generación con `qrcode`, lectura con `jsqr`
- Iconos: `lucide-react`
- Lint: oxlint

## Variables de entorno

Copia `.env.example` a `.env` y completa los valores de tu proyecto de Supabase.

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=tu-publishable-key-anon
```

> IMPORTANTE: usa la **Publishable key (anon)**, nunca la Secret key ni service_role. Los valores reales **no** se suben a GitHub (`.env` está en `.gitignore`).

## Scripts

```bash
bun install          # instalar dependencias
bun run dev          # servidor de desarrollo
bun run lint         # oxlint
bun run build        # typecheck (tsc -b) + build de producción
bun run preview      # previsualizar el build
```

## Estructura

```
src/
  components/    Avatar, GuestCard, GuardRoute, QRCodeDisplay, QRScanner, StatCard, LoadingScreen
  pages/         Home, GuestRegistration, GuestQR, GuardLogin, GuardDashboard, GuardScanner
  hooks/         useGuard, useRealtimeGuests
  services/      auth, guests, entries, storage
  context/       GuardiaContext, GuardiaProvider
  lib/           supabase (cliente), errors, format
  types/         database
```

## Rutas

- `/` · Landing (CREAR MI QR / SOY GUARDIA)
- `/invitado` · Registro del invitado (nombre + foto opcional)
- `/invitado/qr` · QR generado (+ guardar imagen)
- `/guardia/login` · Login de guardias (Supabase Auth)
- `/guardia` · Panel del guardia (protegida)
- `/guardia/escanear` · Escáner de QR (protegida)

Las rutas de guardia están protegidas: sin sesión o sin pertenecer a la tabla `guardias`, se redirige a `/guardia/login`.

## Supabase (funcionalidades consumidas)

- **Auth**: login de guardias con email y contraseña. La identidad real sale de `auth.uid() → guardias.auth_id`.
- **RPC**: `crear_invitado(p_nombre, p_foto)` para registrar invitados.
- **Tablas**: `guardias`, `invitados`, `entradas`. `entradas.invitado_id` es UNIQUE: un invitado solo puede ingresar una vez.
- **Storage**: bucket privado `fotos-invitados`. Las fotos se muestran a guardias autenticados mediante signed URLs.
- **Realtime**: los cambios en `invitados` y `entradas` se reflejan al instante en el panel de los guardias.

> Durante el desarrollo no se modifican RLS, policies, funciones ni el esquema. Si se necesita un cambio de backend, se detiene y se propone al dueño del proyecto.

## Deploy en Vercel

- Framework preset: **Vite** (build: `bun run build`, output: `dist`).
- `vercel.json` incluye un rewrite SPA a `/index.html` para que recargar rutas funcione en producción.
- Configura las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en el dashboard de Vercel.

## Seguridad

- No se usa `service_role` ni Secret Key en el frontend.
- No hay registro público de guardias.
- La entrada siempre se registra con `guardia_id` del guardia autenticado en sesión (nunca seleccionable por el usuario).
- `hora_entrada` la fija la base de datos (`DEFAULT NOW()`); el cliente no la envía.
- Los QR contienen únicamente `codigo_qr` (UUID), sin datos personales.

## Flujo esperado

**Invitado**: Landing → Crear mi QR → nombre + foto opcional → Supabase → QR único → guardar/mostrar QR.

**Guardia**: Landing → Soy guardia → Login → Dashboard (stats + lista en tiempo real) → Escanear → QR → invitado encontrado → regalo → confirmar entrada → hora automática + guardia autenticado. Los cambios llegan por Realtime a ambos guardias.
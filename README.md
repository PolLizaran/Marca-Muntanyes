# Marca Muntanyes 🏔️

Web app para registrar las cimas y rutas de montaña que has hecho, verlas en un mapa,
subir fotos y compartirlas con tus amigos.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + TypeScript + Tailwind CSS
- [Supabase](https://supabase.com/) para autenticación, base de datos (Postgres) y
  almacenamiento de fotos
- [Leaflet](https://leafletjs.com/) + [OpenTopoMap](https://opentopomap.org/) para el mapa
  (sin necesidad de API key)
- [@tmcw/togeojson](https://github.com/mapbox/togeojson) para importar tracks GPX/KML

## Funcionalidades

- Registro/login por email
- Crear rutas subiendo un archivo GPX/KML o dibujándolas a mano sobre el mapa
- Registrar cimas (asociadas a una ruta o sueltas), con nombre, altitud y notas
- Subir fotos a cada ruta
- Mapa con todas tus rutas y cimas, y las de tus amigos
- Sistema de amigos (solicitud/aceptar) — solo tú y tus amigos veis vuestro contenido
  (aplicado con Row Level Security en la base de datos, no solo en la interfaz)

## Puesta en marcha

### 1. Crear el proyecto de Supabase

1. Crea una cuenta y un proyecto en [supabase.com](https://supabase.com) (el plan gratuito
   es suficiente para empezar).
2. En **Project Settings → API** copia la `Project URL` y la clave `anon public`.
3. En **Project Settings → Authentication → Email**, puedes dejar activada la confirmación
   por email (por defecto) o desactivarla mientras desarrollas.

### 2. Aplicar el esquema de base de datos

Abre el **SQL Editor** de tu proyecto de Supabase y ejecuta el contenido de
[`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql). Esto crea:

- Las tablas `profiles`, `friendships`, `routes`, `summits`, `route_photos`
- Las políticas de *Row Level Security* que garantizan que cada usuario solo ve su
  contenido y el de sus amigos aceptados
- El bucket de Storage privado `route-photos` y sus políticas de acceso

Si prefieres usar la CLI de Supabase: `supabase link` y luego `supabase db push`.

### 3. Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores del paso 1:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Instalar dependencias y arrancar

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Despliegue

La forma más sencilla es [Vercel](https://vercel.com): importa el repo, añade las mismas
dos variables de entorno en la configuración del proyecto, y despliega. Recuerda añadir la
URL de producción en Supabase, en **Authentication → URL Configuration**, para que los
enlaces de confirmación de email funcionen.

## Estructura del proyecto

```
app/                  Páginas (App Router de Next.js)
  routes/new           Crear ruta (subir GPX/KML o dibujar a mano)
  routes/[id]          Detalle de una ruta: mapa, estadísticas, fotos
  summits/new          Registrar una cima
  friends               Gestión de amigos
  dashboard            Mapa general + actividad reciente
  u/[username]         Perfil público (visible para amigos)
components/           Componentes de React (mapa, formularios, etc.)
lib/                   Utilidades: cliente de Supabase, parseo de GPX, cálculo de
                       distancia/desnivel
supabase/migrations/  Esquema SQL y políticas de seguridad
```

## Próximos pasos posibles

- Comentarios o "me gusta" en las rutas de amigos
- Catálogo compartido de cimas (para no tener que introducir cada cima desde cero)
- Estadísticas agregadas (km/desnivel acumulado por año)
- Notificaciones cuando un amigo sube una ruta nueva

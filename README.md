# Influmetrics Frontend

Aplicación web construida con Next.js, TypeScript, Prisma, PostgreSQL, Tailwind CSS y shadcn/ui para el dashboard de gestión de influencers.

## 🚀 Stack Técnico

- **Next.js 16** con App Router
- **TypeScript**
- **Prisma** como ORM
- **PostgreSQL** como base de datos
- **Tailwind CSS** para estilos
- **shadcn/ui** para componentes de interfaz
- **Recharts** para gráficos

## 📁 Estructura del Proyecto

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── influencers/      # CRUD de influencers
│   │   ├── campaigns/        # CRUD de campañas
│   │   ├── posts/            # CRUD de posts
│   │   ├── metrics/          # Métricas y carga manual
│   │   ├── dashboard/        # Endpoints del dashboard
│   │   └── data/             # Datos de referencia (seed, plataformas, etc.)
│   └── dashboard/            # Páginas del dashboard
│       ├── influencers/      # Listado y detalle de influencers
│       ├── campaigns/        # Listado y detalle de campañas
│       ├── reports/          # Reportes descargables
│       └── metrics/          # Formulario de carga de métricas
├── components/               # Componentes reutilizables
│   ├── layout/              # Componentes de layout
│   └── ui/                  # Componentes de shadcn/ui
├── lib/                     # Utilidades y helpers
│   ├── prisma.ts            # Cliente de Prisma
│   └── metrics.ts           # Cálculos de métricas (engagement, ROI, rankings)
├── shared/                  # Código compartido
│   ├── constants/          # Constantes y rutas
│   ├── types/              # Tipos TypeScript
│   └── utils/              # Utilidades
└── contexts/               # Contextos de React
```

## 🛠️ Instalación

1. **Clonar el repositorio** (si aplica)

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
```bash
cp .env.example .env
```

Editar `.env` y configurar la conexión a PostgreSQL:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/influmetics_db?schema=public"
```

4. **Generar el cliente de Prisma:**
```bash
npx prisma generate
```

5. **Ejecutar migraciones:**
```bash
npx prisma migrate dev --name init
```

6. **Poblar la base de datos con datos de ejemplo:**
```bash
# Ejecutar el endpoint de seed (desde el navegador o con curl)
curl -X POST http://localhost:3000/api/data/seed
```

O desde el navegador: `http://localhost:3000/api/data/seed`

## 🏃 Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📊 Características Principales

### 1. Dashboard Principal
- KPIs consolidados (Alcance, Engagement, Conversiones, Clics, Revenue)
- Gráficos de evolución temporal
- Filtros por campaña e influencer
- Comparativas mes actual vs mes anterior

### 2. Gestión de Influencers
- Listado con búsqueda
- Detalle completo con métricas
- Creación y edición
- Visualización de campañas y posts asociados

### 3. Gestión de Campañas
- Listado de campañas
- Detalle con rankings de influencers
- Asociación de influencers a campañas
- Visualización de posts por campaña

### 4. Carga Manual de Métricas
- Formulario para cargar métricas de posts
- Carga masiva (varias métricas a la vez)
- Cálculo automático de engagement y ROI

### 5. Reportes
- Exportación de datos en CSV/JSON
- Comparativas entre TikTok e Instagram
- Reportes por influencer y campaña

## 🎨 Sistema de Diseño

La aplicación usa un sistema de diseño personalizado con la paleta de colores:

- **Primario**: `#6C48C5`
- **Secundario**: `#C68FFF`
- **Acento**: `#FFD700`
- **Fondo**: `#F8F7FC`
- **Texto**: `#1A1A2E` / `#6B6B8D`

## 📝 API Routes

### Influencers
- `GET /api/influencers` - Listar influencers
- `POST /api/influencers` - Crear influencer
- `GET /api/influencers/[id]` - Obtener detalle
- `PUT /api/influencers/[id]` - Actualizar influencer
- `DELETE /api/influencers/[id]` - Eliminar influencer

### Campañas
- `GET /api/campaigns` - Listar campañas
- `POST /api/campaigns` - Crear campaña
- `GET /api/campaigns/[id]` - Obtener detalle con rankings
- `PUT /api/campaigns/[id]` - Actualizar campaña
- `DELETE /api/campaigns/[id]` - Eliminar campaña

### Posts
- `GET /api/posts` - Listar posts (con filtros)
- `POST /api/posts` - Crear post

### Métricas
- `GET /api/metrics` - Listar métricas
- `POST /api/metrics` - Crear/actualizar métrica
- `POST /api/metrics/bulk` - Carga masiva de métricas

### Dashboard
- `GET /api/dashboard/stats` - KPIs consolidados
- `GET /api/dashboard/timeline` - Datos para gráficos temporales

### Datos de Referencia
- `GET /api/data/platforms` - Plataformas sociales
- `GET /api/data/content-types` - Tipos de contenido
- `GET /api/data/campaign-goals` - Tipos de objetivos
- `POST /api/data/seed` - Poblar base de datos

## 🔧 Scripts Disponibles

```bash
npm run dev      # Desarrollo
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Linting
```

## 📚 Prisma

### Comandos útiles:

```bash
# Generar cliente de Prisma
npx prisma generate

# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones
npx prisma migrate deploy

# Abrir Prisma Studio (GUI para la base de datos)
npx prisma studio

# Resetear la base de datos (CUIDADO: elimina todos los datos)
npx prisma migrate reset
```

## 🎯 Cálculos de Métricas

Las funciones de cálculo están en `src/lib/metrics.ts`:

- **Engagement Rate**: `(likes + shares) / views * 100`
- **ROI**: `(revenue - cost) / cost * 100`
- **CTR**: `clicks / views * 100`
- **Conversion Rate**: `conversions / views * 100`
- **Rankings**: Ordenamiento por ROI, engagement, reach o conversions
- **Comparativas**: Mes actual vs mes anterior

## 📄 Licencia

Este proyecto fue desarrollado para el Influmetics.

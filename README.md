# Influmetics

Dashboard para gestión de influencers y campañas de marketing.

## Stack

Next.js 16 (App Router), Prisma + PostgreSQL (Supabase), Tailwind CSS v4, shadcn/ui, Recharts, Tabler Icons.

## Quick start

```bash
# 1. Clonar e instalar
npm install

# 2. Variables de entorno (solo necesitas DATABASE_URL)
cp .env.example .env  # o crea .env con:
# DATABASE_URL=postgresql://user:pass@host:5432/db

# 3. Sincronizar esquema y generar cliente
npx prisma generate
npx prisma migrate dev

# 4. Poblar DB con datos de ejemplo
npm run prisma:seed  # curl -X POST http://localhost:3000/api/data/seed

# 5. Arrancar
npm run dev
```

## Proyecto

```
app/                          # App Router (páginas + API)
├── api/                      # Backend (18 endpoints)
│   ├── campaigns/            #   CRUD campañas + detalle con rankings
│   ├── dashboard/            #   stats, timeline, influencer-ranking
│   ├── influencers/          #   CRUD + upload CSV + import-social
│   ├── metrics/              #   Métricas de posts (individual + bulk)
│   ├── posts/                #   Posts CRUD
│   ├── data/                 #   Datos ref (platforms, seed, etc.)
│   └── scraping/             #   Proxy a backend externo (TikTok)
├── dashboard/                # Páginas del dashboard
│   ├── influencers/          #   Lista (búsqueda + paginación), detalle [id], crear, simulación
│   ├── campaigns/            #   Lista, detalle [id], crear
│   ├── metrics/              #   Carga de métricas
│   └── roi/                  #   Retorno de inversión
├── forgot-password/
├── signup/
├── layout.tsx                # Root layout (AuthProvider, ThemeProvider, Toaster)
└── page.tsx                  # Login
src/
├── components/               # UI components (shadcn + custom)
│   ├── ui/                   #   29 primitivas shadcn
│   ├── app-sidebar.tsx       #   Sidebar de navegación
│   ├── login-form.tsx        #   Formulario login
│   └── ...                   #   chart-area-interactive, data-table, section-cards, etc.
├── contexts/AuthContext.tsx  # Auth mock (localStorage, sin backend real)
├── lib/
│   ├── prisma.ts             # Cliente singleton
│   └── metrics.ts            # Cálculos (engagement, ROI, rankings)
└── shared/                   # Tipos, constantes, utilidades
prisma/schema.prisma          # 13 modelos PostgreSQL
```

Nota: hay un `src/app/` duplicado con pages alternativas (login, dashboard simplificado). Las rutas reales están en `app/`.

## Scripts

```bash
npm run dev              # next dev
npm run build            # next build
npm run prisma:generate  # prisma generate
npm run prisma:migrate   # prisma migrate dev
npm run prisma:studio    # prisma studio (GUI DB)
npm run prisma:seed      # curl POST /api/data/seed
```

## API endpoints principales

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/influencers` | GET | Lista paginada (search, page, limit, niche) |
| `/api/influencers` | POST | Crear (valida email único, handles duplicados) |
| `/api/influencers/upload` | POST | Importar CSV/XLSX |
| `/api/campaigns` | GET/POST | CRUD campañas |
| `/api/campaigns/[id]` | GET | Detalle con rankings de influencers |
| `/api/dashboard/stats` | GET | KPIs (alcance, engagement, conversiones, CTR, revenue) |
| `/api/dashboard/timeline` | GET | Serie temporal (groupBy day/week/month) |
| `/api/dashboard/influencer-ranking` | GET | Ranking ponderado de influencers |
| `/api/metrics/bulk` | POST | Carga masiva de métricas |
| `/api/data/seed` | POST | Poblar DB con datos de ejemplo |

## Auth

Mock implementado con React Context + localStorage. `login()` crea un usuario en memoria sin llamar a ningún backend. No hay JWT, sesiones ni verificación real.

## DB (Prisma)

13 modelos: `User`, `UserType`, `SocialPlatform`, `Influencer`, `InfluencerSocialAccount`, `Campaign`, `CampaignGoalType`, `InfluencerCampaign`, `ContentType`, `Post`, `PostMetricSnapshot`, `InternalMetricType`, `InternalMetric`.

```bash
npx prisma migrate dev --name <nombre>
npx prisma studio        # Explorar datos
npx prisma migrate reset # Borra todo
```

## Dependencias clave

`next`, `react`, `prisma`, `@prisma/client`, `@tanstack/react-table`, `recharts`, `@tabler/icons-react`, `@dnd-kit/*`, `exceljs`, `sonner`, `zod`, `date-fns`, `react-day-picker`, `next-themes`, `vaul`.

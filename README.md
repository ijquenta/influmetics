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
app/                          # App Router (rutas + API)
├── api/                      # API endpoints
│   ├── campaigns/            #   CRUD campañas + detalle [id]
│   ├── dashboard/            #   stats, timeline, influencer-ranking
│   ├── influencers/          #   CRUD + upload CSV, import-social, save-scraped
│   ├── metrics/              #   Métricas (individual + bulk)
│   ├── posts/                #   Posts
│   ├── data/                 #   Datos ref (platforms, seed, campaign-goals, content-types)
│   ├── scraping/             #   Proxy scraping TikTok
│   └── health/               #   Health check
├── dashboard/                # Páginas del dashboard
│   ├── influencers/          #   Lista, detalle [id], crear, simulación
│   ├── campaigns/            #   Lista, detalle [id], crear
│   ├── metrics/              #   Carga de métricas
│   ├── roi/                  #   Retorno de inversión
│   └── page.tsx              #   Dashboard principal
├── forgot-password/
├── signup/
├── globals.css               # Estilos globales
├── layout.tsx                # Root layout (AuthProvider, ThemeProvider, Toaster)
└── page.tsx                  # Login
src/                          # Código compartido (alias @/* → ./src/*)
├── components/               # Componentes React (shadcn/ui + custom)
│   ├── ui/                   #   29 primitivas shadcn
│   ├── app-sidebar.tsx
│   ├── login-form.tsx
│   └── ...                   #   chart-area-interactive, data-table, section-cards, etc.
├── contexts/                 # Contextos React
│   ├── AuthContext.tsx       #   Auth mock (localStorage)
│   └── index.ts
├── hooks/                    # Hooks personalizados
│   └── use-mobile.ts
├── lib/                      # Utilidades y lógica de negocio
│   ├── api/                  #   Cliente API
│   ├── metrics.ts            #   Cálculos (engagement, ROI, rankings)
│   ├── prisma.ts             #   Cliente singleton
│   └── utils.ts              #   Utilidades generales
└── shared/                   # Tipos, constantes, utilidades compartidas
    ├── constants/
    ├── types/
    └── utils/
prisma/schema.prisma          # 13 modelos PostgreSQL
```

> **Patrón:** `app/` contiene exclusivamente rutas y API (App Router). Todo el código compartido (componentes, lógica, hooks, tipos) vive en `src/`, accesible mediante el alias `@/*` → `./src/*` configurado en `tsconfig.json`.

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

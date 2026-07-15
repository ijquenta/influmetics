# ROI (Return on Investment) — Sistema de cálculo

## ¿Qué es esto?

El sistema calcula automáticamente el **ROI de cada influencer** usando los datos que ya tenemos:

- **Inversión** → el `agreedCost` que pusiste al asignar un influencer a una campaña
- **Retorno (EMV)** → el **valor estimado de la exposición** en TikTok, calculado a partir de las vistas y el engagement real de sus videos

No necesitas hacer nada manual. Si el influencer tiene videos scrapeados con métricas (playCount, likes, comments, etc.) y tiene un `agreedCost` en alguna campaña, el ROI se calcula solo.

---

## La fórmula (simple)

```
EMV = (vistas_totales / 1000) × 8
ROI = (EMV - inversión) / inversión × 100
```

**Ejemplo:**
- Invertiste $500 en un influencer
- Sus videos suman 250,000 vistas
- EMV = (250,000 / 1000) × $8 = **$2,000**
- ROI = ($2,000 - $500) / $500 × 100 = **+300%** → "Bueno"

El `$8` es el **CPM benchmark** (costo por cada 1,000 vistas). Es el estándar conservador de la industria para TikTok orgánico en 2025-2026.

---

## Dónde se ve

| Pantalla | Ruta | Qué muestra |
|---|---|---|
| Dashboard ROI | `/dashboard/roi` | Gráfico EMV en el tiempo + tabla con ROI por influencer + alertas |
| Detalle del influencer | `/dashboard/influencers/[id]` | KPI "ROI estimado" con color y etiqueta |

---

## Archivos del sistema

```
src/lib/roi.ts                    ← Constantes y fórmulas (el "motor")
app/api/roi/calculate/route.ts    ← API que calcula todo
app/dashboard/roi/page.tsx        ← Página ROI
```

---

### 1. `src/lib/roi.ts` — El motor

Aquí viven las constantes y funciones de cálculo. Es lo único que necesitas tocar si quieres cambiar cómo se calcula el ROI.

**Constantes clave:**

```ts
export const CPM_BENCHMARK = 8;   // $8 por cada 1,000 vistas (puedes cambiarlo)
```

**Funciones principales:**

| Función | Qué hace |
|---|---|
| `calculateEMV(vistas)` | Convierte vistas en dinero: `(vistas / 1000) × CPM_BENCHMARK` |
| `calculateROI(emv, inversion)` | `((emv - inversion) / inversion) × 100` |
| `getROILabel(roi)` | Devuelve "Excelente", "Bueno", "Promedio", "Bajo" o "Negativo" |
| `getROIColor(roi)` | Devuelve una clase CSS de color según el valor |

**Si quieres cambiar los umbrales:**

```ts
export const ROI_THRESHOLDS = {
    excellent: 500,  // ≥500% → Excelente
    good: 300,       // ≥300% → Bueno
    average: 150,    // ≥150% → Promedio
    poor: 0,         // ≥0%   → Bajo
    // <0 → Negativo
};
```

---

### 2. `app/api/roi/calculate/route.ts` — La API

**Endpoint:** `GET /api/roi/calculate`

**Parámetros (query string):**

| Parámetro | Ejemplo | Qué hace |
|---|---|---|
| `campaignId` | `3` | Filtra por campaña específica. `all` o vacío = todas |
| `startDate` | `2025-01-01` | Fecha inicio (default: desde siempre) |
| `endDate` | `2025-12-31` | Fecha fin (default: hoy) |

**Lo que hace internamente:**

1. Busca todos los `InfluencerCampaign` (influencers asignados a campañas)
2. Por cada uno, obtiene sus posts y las métricas scrapeadas (`PostMetricSnapshot`)
3. Suma todas las vistas, likes, comments, shares, saves de todos sus videos
4. Calcula EMV, ROI, CPM, CPE y engagement rate
5. Arma un timeline diario (para el gráfico) y un summary por influencer

**Respuesta:**

```json
{
  "timeline": [
    { "date": "2025-01-01", "CODIGO_1": 150, "CODIGO_2": 200 },
    { "date": "2025-01-02", "CODIGO_1": 180, "CODIGO_2": 220 }
  ],
  "summary": [
    {
      "influencerId": 1,
      "name": "Maria",
      "referralCode": "MARIA10",
      "username": "@maria.beauty",
      "nau": 2000,         ← EMV en dólares
      "roi": 300,          ← 300%
      "views": 250000,
      "engagements": 15000,
      "engagementRate": 6,
      "cpm": 4,
      "cpe": 0.08,
      "investment": 500,
      "emv": 2000
    }
  ],
  "meta": {
    "totalInvestment": 5000,
    "totalEMV": 15000,
    "cpmBenchmark": 8
  }
}
```

---

### 3. `app/dashboard/roi/page.tsx` — La página

Esta página:
1. Al montarse, carga la lista de influencers (para los filtros)
2. Cuando cambian los filtros (fechas, campaña), llama a `/api/roi/calculate`
3. Muestra un gráfico de líneas con el EMV diario del Top 5
4. Muestra una tabla con EMV y ROI por influencer
5. Muestra alertas para influencers con EMV = 0 o ROI negativo
6. Botón para exportar a Excel

---

## Flujo completo de datos

```
TikTok scraper
     ↓
PostMetricSnapshot (playCount, likes, comments, shares, saves)
     ↓
src/lib/roi.ts (calculateEMV + calculateROI)
     ↓
/api/roi/calculate (agrega por influencer + campaña)
     ↓
/dashboard/roi (gráfico + tabla + alertas)
/dashboard/influencers/[id] (KPI ROI)
```

---

## Preguntas frecuentes

### ¿De dónde salen las vistas?
Del scraper de TikTok. Cuando usas la página "Analysis" (`/dashboard/influencers/analysis`) para extraer un perfil, también se guardan las métricas de sus videos en `PostMetricSnapshot`.

### ¿Y si el influencer no tiene videos scrapeados?
El ROI será 0% (o "—" si no hay inversión). Necesitas al menos un video con métricas para que el cálculo funcione.

### ¿Qué significa EMV?
**Earned Media Value** — lo que costaría esa misma exposición si la hubieras pagado como publicidad. Es el estándar de la industria para medir retorno cuando no tienes datos de ventas directas.

### ¿Puedo cambiar el CPM benchmark?
Sí. En `src/lib/roi.ts`, cambia `CPM_BENCHMARK`. El rango típico para TikTok es $5–$15. Un número más alto = ROI más alto.

### ¿Qué pasa si el influencer está en múltiples campañas?
El cálculo suma las inversiones de todas sus campañas y compara contra el EMV total. En la página ROI puedes filtrar por campaña específica.

### ¿Por qué algunas cifras aparecen en la página ROI pero no en el detalle?
El detalle del influencer muestra el ROI **total** (suma de todas sus campañas). La página ROI permite filtrar por campaña y ver el detalle por influencer-campaña.

// Constantes de rutas de la aplicación

export const ROUTES = {
    HOME: "/",
    DASHBOARD: "/dashboard",
    INFLUENCERS: "/dashboard/influencers",
    INFLUENCER_DETAIL: (id: string | number) => `/dashboard/influencers/${id}`,
    CAMPAIGNS: "/dashboard/campaigns",
    CAMPAIGN_DETAIL: (id: string | number) => `/dashboard/campaigns/${id}`,
    CAMPAIGN_NEW: "/dashboard/campaigns/new",
    REPORTS: "/dashboard/reports",
    METRICS: "/dashboard/metrics",
} as const;

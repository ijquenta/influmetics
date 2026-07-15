// Configuración general de la aplicación

export const APP_CONFIG = {
    name: "Influmetics",
    version: "0.1.0",
    apiUrl: process.env.NEXT_PUBLIC_API_URL || "/api",
    defaultPageSize: 10,
    maxPageSize: 100,
} as const;

export const STATUS_OPTIONS = [
    { label: "Activo", value: "active" },
    { label: "Inactivo", value: "inactive" },
    { label: "Pendiente", value: "pending" },
    { label: "Suspendido", value: "suspended" },
] as const;

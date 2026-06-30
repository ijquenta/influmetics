import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return "—";
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" });
}

export function formatNumber(value: number | string | null | undefined): string {
    if (value === null || value === undefined) return "-";
    const num = typeof value === "string" ? Number(value) : value;
    if (Number.isNaN(num)) return "-";
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString("es-ES");
}

export function getMetricColor(value: number | null | undefined, type: "views" | "likes" | "engagement" | "roi"): string {
    if (value === null || value === undefined) return "text-muted-foreground";
    if (type === "roi") {
        if (value >= 50) return "text-green-600";
        if (value >= 0) return "text-amber-600";
        return "text-red-600";
    }
    if (type === "engagement") {
        if (value >= 10) return "text-green-600";
        if (value >= 3) return "text-amber-600";
        return "text-muted-foreground";
    }
    return "text-foreground";
}

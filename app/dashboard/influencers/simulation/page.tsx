"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbSeparator,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IconSearch, IconLoader2 } from "@tabler/icons-react";

interface ScrapedVideo {
    id: string;
    desc: string;
    create_time?: number;
    views: number;
    likes: number;
    comments: number;
    saves: number;
    duration: number;
    hashtags: string[];
    engagement_rate: number;
    engagement_level: string;
    percentile: string;
    score_100: number;
    is_most_viewed: number;
    is_most_saved: number;
    is_highest_engagement: number;
    is_top_percentile: number;
}

interface ScrapedProfileData {
    profile: {
        username: string;
        followers: number;
        following: number;
        likes: number;
        engagement_median: number;
        engagement_range: { low: number; high: number };
    };
    statistics: {
        total_videos: number;
        median_engagement: number;
        average_engagement: number;
        totals: {
            views: string;
            likes: string;
            comments: string;
        };
    };
    top_videos: {
        most_saved: ScrapedVideo;
        most_viewed: ScrapedVideo;
        highest_engagement: ScrapedVideo;
    };
    videos: ScrapedVideo[];
    scraped_at: string;
}

interface ScrapedResponse {
    success: boolean;
    data: ScrapedProfileData;
    message: string;
    timestamp: string;
}

const DEMO_SCRAPED_RESPONSE: ScrapedResponse = {
    success: true,
    message: "Datos de ejemplo (demo, sin scraping real)",
    timestamp: new Date().toISOString(),
    data: {
        profile: {
            username: "demo.influencer",
            followers: 152340,
            following: 320,
            likes: 982340,
            engagement_median: 0.045,
            engagement_range: { low: 0.03, high: 0.06 },
        },
        statistics: {
            total_videos: 3,
            median_engagement: 0.045,
            average_engagement: 0.048,
            totals: {
                views: "325000",
                likes: "18400",
                comments: "860",
            },
        },
        top_videos: {
            most_saved: {
                id: "vid-3",
                desc: "Tutorial de skincare nocturno",
                create_time: 1711929600,
                views: 95000,
                likes: 6200,
                comments: 310,
                saves: 1200,
                duration: 32,
                hashtags: ["#skincare", "#nightroutine"],
                engagement_rate: 0.068,
                engagement_level: "top",
                percentile: "95.00",
                score_100: 100,
                is_most_viewed: 0,
                is_most_saved: 1,
                is_highest_engagement: 0,
                is_top_percentile: 1,
            },
            most_viewed: {
                id: "vid-2",
                desc: "Vida diaria como creadora de contenido",
                create_time: 1711411200,
                views: 150000,
                likes: 7800,
                comments: 290,
                saves: 600,
                duration: 45,
                hashtags: ["#dayinmylife", "#influencer"],
                engagement_rate: 0.053,
                engagement_level: "alto",
                percentile: "88.00",
                score_100: 78,
                is_most_viewed: 1,
                is_most_saved: 0,
                is_highest_engagement: 0,
                is_top_percentile: 0,
            },
            highest_engagement: {
                id: "vid-1",
                desc: "Tips rápidos para crecer en TikTok en 2025",
                create_time: 1710999000,
                views: 80000,
                likes: 6400,
                comments: 260,
                saves: 900,
                duration: 28,
                hashtags: ["#tiktokgrowth", "#creadordecontenido"],
                engagement_rate: 0.071,
                engagement_level: "top",
                percentile: "97.00",
                score_100: 100,
                is_most_viewed: 0,
                is_most_saved: 0,
                is_highest_engagement: 1,
                is_top_percentile: 1,
            },
        },
        videos: [
            {
                id: "vid-1",
                desc: "Tips rápidos para crecer en TikTok en 2025",
                create_time: 1710999000,
                views: 80000,
                likes: 6400,
                comments: 260,
                saves: 900,
                duration: 28,
                hashtags: ["#tiktokgrowth", "#creadordecontenido"],
                engagement_rate: 0.071,
                engagement_level: "top",
                percentile: "97.00",
                score_100: 100,
                is_most_viewed: 0,
                is_most_saved: 0,
                is_highest_engagement: 1,
                is_top_percentile: 1,
            },
            {
                id: "vid-2",
                desc: "Vida diaria como creadora de contenido",
                create_time: 1711411200,
                views: 150000,
                likes: 7800,
                comments: 290,
                saves: 600,
                duration: 45,
                hashtags: ["#dayinmylife", "#influencer"],
                engagement_rate: 0.053,
                engagement_level: "alto",
                percentile: "88.00",
                score_100: 78,
                is_most_viewed: 1,
                is_most_saved: 0,
                is_highest_engagement: 0,
                is_top_percentile: 0,
            },
            {
                id: "vid-3",
                desc: "Tutorial de skincare nocturno",
                create_time: 1711929600,
                views: 95000,
                likes: 6200,
                comments: 310,
                saves: 1200,
                duration: 32,
                hashtags: ["#skincare", "#nightroutine"],
                engagement_rate: 0.068,
                engagement_level: "top",
                percentile: "95.00",
                score_100: 92,
                is_most_viewed: 0,
                is_most_saved: 1,
                is_highest_engagement: 0,
                is_top_percentile: 1,
            },
        ],
        scraped_at: new Date().toISOString(),
    },
};

export default function InfluencerSimulationPage() {
    const [platform, setPlatform] = useState<"tiktok" | "instagram">("tiktok");
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ScrapedResponse | null>(null);
    const [backendHealth, setBackendHealth] = useState<Record<string, unknown> | null>(null);
    const [error, setError] = useState<string | null>(null);

    const openTikTokProfile = () => {
        const inputUsername = value.trim();
        const username = inputUsername.replace(/^@/, "") || (result?.data.profile.username ?? "").toString().trim();

        if (!username) {
            console.log("[TikTok puzzle] No hay username para abrir perfil.");
            setError("Ingresa un nombre de usuario para abrir el perfil en TikTok.");
            return;
        }

        const url = `https://www.tiktok.com/@${username}`;
        console.log("[TikTok puzzle] Navegando al perfil en esta pestaña:", url);

        if (typeof window !== "undefined") {
            window.location.href = url;
        }
    };

    const handleSimulate = async () => {
        const trimmed = value.trim();
        if (!trimmed) {
            setError("Ingresa un nombre de usuario.");
            return;
        }
        setError(null);
        setLoading(true);

        try {
            const res = await fetch("/api/scraping/tiktok", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: trimmed,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError((data && data.error) || "Error al obtener la simulación.");
                setResult(null);
                setBackendHealth(null);
                return;
            }

            const real = data as ScrapedResponse;

            // Mezcla: perfil real desde backend + videos y estadísticas dummy.
            const mixed: ScrapedResponse = {
                success: true,
                message: real.message || "Perfil obtenido desde backend. Videos y estadísticas simulados (dummy).",
                timestamp: new Date().toISOString(),
                data: {
                    ...DEMO_SCRAPED_RESPONSE.data,
                    profile: {
                        ...real.data.profile,
                    },
                },
            };

            console.log("[Simulación mixta] Perfil real + videos dummy:", {
                backendProfile: real.data.profile,
                demoVideosCount: DEMO_SCRAPED_RESPONSE.data.videos.length,
            });

            setResult(mixed);
            setBackendHealth((data.backendHealth as Record<string, unknown>) ?? null);
        } catch (err) {
            console.error("Error simulando importación:", err);
            setError("Ocurrió un error al obtener los datos simulados.");
            setResult(null);
            setBackendHealth(null);
        } finally {
            setLoading(false);
        }
    };

    const formatNumber = (value: number | string) => {
        const num = typeof value === "string" ? Number(value) : value;
        if (Number.isNaN(num)) return "-";
        if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
        return num.toLocaleString("es-ES");
    };

    const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

    const formatDateTime = (value: string) => {
        if (!value) return "-";
        const d = new Date(value);
        return d.toLocaleString("es-ES", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatUnixToDate = (ts: number) => {
        if (!ts) return "-";
        return new Date(ts * 1000).toLocaleString("es-ES", {
            year: "numeric",
            month: "short",
            day: "2-digit",
        });
    };

    const useDemoData = () => {
        console.log("[Simulación demo] Usando datos de ejemplo (sin backend).");
        setError(null);
        setBackendHealth(null);
        setResult({
            ...DEMO_SCRAPED_RESPONSE,
            timestamp: new Date().toISOString(),
            data: {
                ...DEMO_SCRAPED_RESPONSE.data,
                profile: {
                    ...DEMO_SCRAPED_RESPONSE.data.profile,
                    username: value.trim().replace(/^@/, "") || DEMO_SCRAPED_RESPONSE.data.profile.username,
                },
                scraped_at: new Date().toISOString(),
            },
        });
    };

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 bg-[#F8F7FC] min-h-full">
                            {/* Header */}
                            <div className="flex flex-col gap-2 mb-4">
                                <Breadcrumb>
                                    <BreadcrumbList>
                                        <BreadcrumbItem>
                                            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            <BreadcrumbLink href="/dashboard/influencers">Influencers</BreadcrumbLink>
                                        </BreadcrumbItem>
                                        <BreadcrumbSeparator />
                                        <BreadcrumbItem>
                                            <BreadcrumbPage>Explorar rendimiento</BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </BreadcrumbList>
                                </Breadcrumb>
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <h1 className="text-[28px] font-bold text-[#1A1A2E] mb-1">
                                            Explora el rendimiento de un influencer
                                        </h1>
                                        <p className="text-[16px] text-[#6B6B8D]">
                                            Consulta cómo rinde un perfil de TikTok: perfil, estadísticas principales y sus videos más
                                            relevantes.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Formulario de simulación */}
                            <Card className="rounded-[20px] border-[rgba(108,72,197,0.1)] shadow-[0_4px_20px_rgba(108,72,197,0.08)]">
                                <CardHeader>
                                    <CardTitle className="text-[18px] font-bold text-[#1A1A2E]">Analizar un perfil de TikTok</CardTitle>
                                    <CardDescription className="text-[14px] text-[#6B6B8D]">
                                        Ingresa un usuario o enlace de perfil para ver un ejemplo de cómo Takenos presenta la información de
                                        rendimiento.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label className="text-[14px] font-semibold text-[#1A1A2E] mb-2 block">Plataforma</Label>
                                            <Select value={platform} onValueChange={(val) => setPlatform(val as "tiktok" | "instagram")}>
                                                <SelectTrigger className="rounded-2xl">
                                                    <SelectValue placeholder="Selecciona" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="tiktok">TikTok</SelectItem>
                                                    <SelectItem value="instagram">Instagram</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <Label className="text-[14px] font-semibold text-[#1A1A2E] mb-2 block">
                                                Usuario o enlace de perfil
                                            </Label>
                                            <div className="relative">
                                                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6B6B8D]" />
                                                <Input
                                                    className="pl-9 rounded-2xl"
                                                    placeholder="@usuario o https://..."
                                                    value={value}
                                                    onChange={(e) => setValue(e.target.value)}
                                                />
                                            </div>
                                            <p className="text-xs text-[#6B6B8D] mt-2">
                                                Ejemplos: <span className="font-mono">@maria.beauty</span> o{" "}
                                                <span className="font-mono">https://www.tiktok.com/@maria.beauty</span>
                                            </p>
                                        </div>
                                    </div>
                                    {error && <p className="text-xs text-[#EF4444]">{error}</p>}
                                    <div className="flex flex-col gap-2 md:flex-row md:justify-end">
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" onClick={openTikTokProfile} className="rounded-2xl">
                                                Abrir perfil en TikTok
                                            </Button>
                                        </div>
                                        <Button
                                            onClick={handleSimulate}
                                            disabled={loading}
                                            className="bg-gradient-to-r from-[#8B6FD9] to-[#6C48C5] text-white rounded-2xl px-6"
                                        >
                                            {loading ? (
                                                <span className="flex items-center gap-2">
                                                    <IconLoader2 className="w-4 h-4 animate-spin" />
                                                    Cargando datos...
                                                </span>
                                            ) : (
                                                "Ver datos conectados"
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Resultados */}
                            {result && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Estado del backend (healthcheck) */}

                                    {/* Perfil y estadísticas generales */}
                                    <Card className="lg:col-span-1 rounded-[20px] border-[rgba(108,72,197,0.1)] shadow-[0_4px_20px_rgba(108,72,197,0.08)]">
                                        <CardHeader>
                                            <CardTitle className="text-[18px] font-bold text-[#1A1A2E]">Perfil del influencer</CardTitle>
                                            <CardDescription className="text-[14px] text-[#6B6B8D]">
                                                Datos básicos del perfil en TikTok.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3 text-sm">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-[#6B6B8D] mb-1">Usuario</p>
                                                    <p className="text-sm font-semibold text-[#1A1A2E]">@{result.data.profile.username}</p>
                                                </div>
                                                <Badge className="bg-[#E8DEFF] text-[#6C48C5] text-xs px-2 py-0.5">Ejemplo</Badge>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                <div>
                                                    <p className="text-xs text-[#6B6B8D] mb-1">Seguidores</p>
                                                    <p className="text-sm font-semibold text-[#1A1A2E]">
                                                        {formatNumber(result.data.profile.followers)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-[#6B6B8D] mb-1">Siguiendo</p>
                                                    <p className="text-sm font-semibold text-[#1A1A2E]">
                                                        {formatNumber(result.data.profile.following)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-[#6B6B8D] mb-1">Likes totales</p>
                                                    <p className="text-sm font-semibold text-[#1A1A2E]">
                                                        {formatNumber(result.data.profile.likes)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-[#6B6B8D] mb-1">Engagement mediano</p>
                                                    <p className="text-sm font-semibold text-[#1A1A2E]">
                                                        {formatPercent(result.data.profile.engagement_median)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-[rgba(108,72,197,0.1)] mt-2">
                                                <p className="text-xs text-[#6B6B8D] mb-1">Rango de engagement</p>
                                                <p className="text-sm font-semibold text-[#1A1A2E]">
                                                    {formatPercent(result.data.profile.engagement_range.low)} –{" "}
                                                    {formatPercent(result.data.profile.engagement_range.high)}
                                                </p>
                                            </div>

                                            <div className="pt-3 border-t border-[rgba(108,72,197,0.1)] mt-2 space-y-2">
                                                <p className="text-xs text-[#6B6B8D]">Resumen del JSON</p>
                                                <p className="text-[11px] text-[#6B6B8D]">
                                                    Scraped at: <span className="font-mono">{formatDateTime(result.data.scraped_at)}</span>
                                                </p>
                                                <p className="text-[11px] text-[#6B6B8D]">
                                                    Timestamp: <span className="font-mono">{formatDateTime(result.timestamp)}</span>
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Estadísticas agregadas */}
                                    <Card className="lg:col-span-1 rounded-[20px] border-[rgba(108,72,197,0.1)] shadow-[0_4px_20px_rgba(108,72,197,0.08)]">
                                        <CardHeader>
                                            <CardTitle className="text-[18px] font-bold text-[#1A1A2E]">Estadísticas agregadas</CardTitle>
                                            <CardDescription className="text-[14px] text-[#6B6B8D]">
                                                Resumen de volumen, engagement y actividad del perfil.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3 text-sm">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <p className="text-xs text-[#6B6B8D] mb-1">Total de videos</p>
                                                    <p className="text-sm font-semibold text-[#1A1A2E]">
                                                        {result.data.statistics.total_videos}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-[#6B6B8D] mb-1">Engagement mediano</p>
                                                    <p className="text-sm font-semibold text-[#1A1A2E]">
                                                        {formatPercent(result.data.statistics.median_engagement)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-[#6B6B8D] mb-1">Engagement promedio</p>
                                                    <p className="text-sm font-semibold text-[#1A1A2E]">
                                                        {formatPercent(result.data.statistics.average_engagement)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[rgba(108,72,197,0.1)] mt-2">
                                                <div>
                                                    <p className="text-[11px] text-[#6B6B8D] mb-1">Vistas totales</p>
                                                    <p className="text-sm font-semibold text-[#1A1A2E]">
                                                        {formatNumber(result.data.statistics.totals.views)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] text-[#6B6B8D] mb-1">Likes totales</p>
                                                    <p className="text-sm font-semibold text-[#1A1A2E]">
                                                        {formatNumber(result.data.statistics.totals.likes)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] text-[#6B6B8D] mb-1">Comentarios</p>
                                                    <p className="text-sm font-semibold text-[#1A1A2E]">
                                                        {formatNumber(result.data.statistics.totals.comments)}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Top videos */}
                                    <Card className="lg:col-span-1 rounded-[20px] border-[rgba(108,72,197,0.1)] shadow-[0_4px_20px_rgba(108,72,197,0.08)]">
                                        <CardHeader>
                                            <CardTitle className="text-[18px] font-bold text-[#1A1A2E]">Top videos en TikTok</CardTitle>
                                            <CardDescription className="text-[14px] text-[#6B6B8D]">
                                                Los videos que mejor funcionan por vistas, interacción y guardados.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3 text-sm">
                                            {(
                                                [
                                                    {
                                                        label: "Más visto",
                                                        video: result.data.top_videos.most_viewed,
                                                    },
                                                    {
                                                        label: "Mayor engagement",
                                                        video: result.data.top_videos.highest_engagement,
                                                    },
                                                    {
                                                        label: "Más guardado",
                                                        video: result.data.top_videos.most_saved,
                                                    },
                                                ] as const
                                            ).map(({ label, video }) => (
                                                <div key={video.id} className="p-2 rounded-lg bg-[rgba(108,72,197,0.03)] space-y-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-xs font-semibold text-[#1A1A2E]">{label}</span>
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px] bg-[#E8DEFF] text-[#6C48C5] px-2 py-0.5"
                                                        >
                                                            Score {video.score_100}/100
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[11px] text-[#6B6B8D] line-clamp-2">
                                                        {video.desc || "Sin descripción"}
                                                    </p>
                                                    <div className="grid grid-cols-3 gap-2 text-[10px] mt-1">
                                                        <div>
                                                            <p className="text-[#6B6B8D]">Vistas</p>
                                                            <p className="font-semibold text-[#1A1A2E]">{formatNumber(video.views)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[#6B6B8D]">Engagement</p>
                                                            <p className="font-semibold text-[#1A1A2E]">
                                                                {formatPercent(video.engagement_rate)}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[#6B6B8D]">Nivel</p>
                                                            <p className="font-semibold text-[#1A1A2E]">{video.engagement_level}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>

                                    {/* Tabla completa de videos */}
                                    <Card className="lg:col-span-3 rounded-[20px] border-[rgba(108,72,197,0.1)] shadow-[0_4px_20px_rgba(108,72,197,0.08)]">
                                        <CardHeader>
                                            <CardTitle className="text-[18px] font-bold text-[#1A1A2E]">Lista completa de videos</CardTitle>
                                            <CardDescription className="text-[14px] text-[#6B6B8D]">
                                                Detalle de cada publicación del perfil y sus métricas clave.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {result.data.videos.length === 0 ? (
                                                <p className="text-xs text-[#6B6B8D]">No hay videos en el JSON.</p>
                                            ) : (
                                                <div className="w-full overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="border-[rgba(108,72,197,0.1)]">
                                                                <TableHead className="text-[#1A1A2E] font-semibold">ID</TableHead>
                                                                <TableHead className="text-[#1A1A2E] font-semibold">Fecha</TableHead>
                                                                <TableHead className="text-[#1A1A2E] font-semibold">Descripción</TableHead>
                                                                <TableHead className="text-[#1A1A2E] font-semibold">Vistas</TableHead>
                                                                <TableHead className="text-[#1A1A2E] font-semibold">Likes</TableHead>
                                                                <TableHead className="text-[#1A1A2E] font-semibold">Comentarios</TableHead>
                                                                <TableHead className="text-[#1A1A2E] font-semibold">Guardados</TableHead>
                                                                <TableHead className="text-[#1A1A2E] font-semibold">Engagement</TableHead>
                                                                <TableHead className="text-[#1A1A2E] font-semibold">Nivel</TableHead>
                                                                <TableHead className="text-[#1A1A2E] font-semibold">Tags</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {result.data.videos.map((video) => (
                                                                <TableRow
                                                                    key={video.id}
                                                                    className="border-[rgba(108,72,197,0.1)] hover:bg-[#F8F7FC]"
                                                                >
                                                                    <TableCell className="text-xs font-mono text-[#6B6B8D] max-w-[140px] truncate">
                                                                        {video.id}
                                                                    </TableCell>
                                                                    <TableCell className="text-xs text-[#6B6B8D]">
                                                                        {formatUnixToDate(video.create_time || 0)}
                                                                    </TableCell>
                                                                    <TableCell className="text-xs text-[#1A1A2E] max-w-[260px] truncate">
                                                                        {video.desc || "Sin descripción"}
                                                                    </TableCell>
                                                                    <TableCell className="text-xs text-[#1A1A2E]">
                                                                        {formatNumber(video.views)}
                                                                    </TableCell>
                                                                    <TableCell className="text-xs text-[#1A1A2E]">
                                                                        {formatNumber(video.likes)}
                                                                    </TableCell>
                                                                    <TableCell className="text-xs text-[#1A1A2E]">
                                                                        {formatNumber(video.comments)}
                                                                    </TableCell>
                                                                    <TableCell className="text-xs text-[#1A1A2E]">
                                                                        {formatNumber(video.saves)}
                                                                    </TableCell>
                                                                    <TableCell className="text-xs text-[#1A1A2E]">
                                                                        {formatPercent(video.engagement_rate)}
                                                                    </TableCell>
                                                                    <TableCell className="text-xs text-[#1A1A2E]">
                                                                        {video.engagement_level}
                                                                    </TableCell>
                                                                    <TableCell className="text-xs text-[#6B6B8D] max-w-[200px]">
                                                                        {video.hashtags && video.hashtags.length > 0
                                                                            ? video.hashtags.join(", ")
                                                                            : "-"}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

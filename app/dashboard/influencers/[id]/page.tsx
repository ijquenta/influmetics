"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { InfluencerWithRelations } from "@/shared/types/influencer.types";

interface ScrapedVideo {
    id: string;
    desc: string;
    views: number;
    likes: number;
    comments: number;
    saves: number;
    duration: number;
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
        avatar_url?: string;
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

const DUMMY_NAMES = [
    "María García",
    "Carlos Rodríguez",
    "Ana Martínez",
    "Luis Fernández",
    "Sofía Herrera",
    "Diego López",
    "Valentina Torres",
    "Javier Morales",
];

const DUMMY_NICHES = ["Beauty & Skincare", "Tech & Gadgets", "Fitness & Wellness", "Lifestyle", "Gastronomía", "Educación y tips"];

const createDummyInfluencer = (id: number): InfluencerWithRelations => {
    const name = DUMMY_NAMES[id % DUMMY_NAMES.length];
    const niche = DUMMY_NICHES[id % DUMMY_NICHES.length];
    const slug = name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ".");

    return {
        id,
        name,
        email: `${slug}@influmetics.com`,
        birthDate: null,
        niche,
        referralCode: `INFLUMETICS${2000 + id}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        socialAccounts: [],
        influencerCampaigns: [],
        posts: [],
        _count: {
            posts: 0,
            influencerCampaigns: 0,
        },
    };
};

type DummyJson = {
    data?: {
        profile?: {
            username?: string;
            avatar_url?: string;
            followers?: number;
            following?: number;
            likes?: number;
        };
        videos?: Array<Record<string, unknown>>;
    };
};

const buildScrapedFromDummyJson = (id: number, raw: DummyJson): ScrapedResponse => {
    const profile = raw?.data?.profile ?? {};
    const allVideos: Record<string, unknown>[] = raw?.data?.videos ?? [];

    if (!allVideos.length) {
        return {
            success: true,
            message: "Sin videos en datos dummy.",
            timestamp: new Date().toISOString(),
            data: {
                profile: {
                    username: profile.username ?? `demo_${id}`,
                    avatar_url: profile.avatar_url ?? "/profile.png",
                    followers: profile.followers ?? 0,
                    following: profile.following ?? 0,
                    likes: profile.likes ?? 0,
                    engagement_median: 0,
                    engagement_range: { low: 0, high: 0 },
                },
                statistics: {
                    total_videos: 0,
                    median_engagement: 0,
                    average_engagement: 0,
                    totals: { views: "0", likes: "0", comments: "0" },
                },
                top_videos: {
                    most_saved: {
                        id: "",
                        desc: "",
                        views: 0,
                        likes: 0,
                        comments: 0,
                        saves: 0,
                        duration: 0,
                        engagement_rate: 0,
                        engagement_level: "bajo",
                        percentile: "0.00",
                        score_100: 0,
                        is_most_viewed: 0,
                        is_most_saved: 0,
                        is_highest_engagement: 0,
                        is_top_percentile: 0,
                    },
                    most_viewed: {
                        id: "",
                        desc: "",
                        views: 0,
                        likes: 0,
                        comments: 0,
                        saves: 0,
                        duration: 0,
                        engagement_rate: 0,
                        engagement_level: "bajo",
                        percentile: "0.00",
                        score_100: 0,
                        is_most_viewed: 0,
                        is_most_saved: 0,
                        is_highest_engagement: 0,
                        is_top_percentile: 0,
                    },
                    highest_engagement: {
                        id: "",
                        desc: "",
                        views: 0,
                        likes: 0,
                        comments: 0,
                        saves: 0,
                        duration: 0,
                        engagement_rate: 0,
                        engagement_level: "bajo",
                        percentile: "0.00",
                        score_100: 0,
                        is_most_viewed: 0,
                        is_most_saved: 0,
                        is_highest_engagement: 0,
                        is_top_percentile: 0,
                    },
                },
                videos: [],
                scraped_at: new Date().toISOString(),
            },
        };
    }

    // Para dummy: usar siempre los primeros N videos para todos los influencers
    const videosForInfluencer = allVideos.slice(0, 20);

    const mappedVideos: ScrapedVideo[] = videosForInfluencer.map((v) => {
        const views = Number(v.views ?? 0);
        const likes = Number(v.likes ?? 0);
        const comments = Number(v.comments ?? 0);
        const saves = Number(v.saves ?? 0);
        const engagementRate = Number(v.engagement_rate ?? 0);
        const engagementLevel = (v.engagement_level as string | undefined) ?? "estándar";
        const percentile = typeof v.percentile === "number" || typeof v.percentile === "string" ? String(v.percentile) : "0.00";
        const score100 = Number(v.score_100 ?? 0);

        return {
            id: String(v.id),
            desc: (v.desc as string | undefined) ?? "",
            views,
            likes,
            comments,
            saves,
            duration: Number(v.duration ?? 0),
            engagement_rate: engagementRate,
            engagement_level: engagementLevel,
            percentile,
            score_100: score100,
            is_most_viewed: 0,
            is_most_saved: 0,
            is_highest_engagement: 0,
            is_top_percentile: Number(percentile) >= 90 ? 1 : 0,
        };
    });
    const engagements = mappedVideos.map((v) => v.engagement_rate).sort((a, b) => a - b);
    const totalVideos = mappedVideos.length;

    const median =
        engagements.length === 0
            ? 0
            : engagements.length % 2 !== 0
                ? engagements[Math.floor(engagements.length / 2)]
                : (engagements[engagements.length / 2 - 1] + engagements[engagements.length / 2]) / 2;

    const average = engagements.length === 0 ? 0 : engagements.reduce((a, b) => a + b, 0) / engagements.length;

    const totalsViews = mappedVideos.reduce((sum, v) => sum + (v.views ?? 0), 0);
    const totalsLikes = mappedVideos.reduce((sum, v) => sum + (v.likes ?? 0), 0);
    const totalsComments = mappedVideos.reduce((sum, v) => sum + (v.comments ?? 0), 0);

    const mostViewed = mappedVideos.reduce((best, v) => (v.views > best.views ? v : best), mappedVideos[0]) ?? mappedVideos[0];
    const mostSaved = mappedVideos.reduce((best, v) => (v.saves > best.saves ? v : best), mappedVideos[0]) ?? mappedVideos[0];
    const highestEngagement =
        mappedVideos.reduce((best, v) => (v.engagement_rate > best.engagement_rate ? v : best), mappedVideos[0]) ?? mappedVideos[0];

    // Marcar flags en los videos
    mappedVideos.forEach((v) => {
        v.is_most_viewed = v.id === mostViewed.id ? 1 : 0;
        v.is_most_saved = v.id === mostSaved.id ? 1 : 0;
        v.is_highest_engagement = v.id === highestEngagement.id ? 1 : 0;
    });

    return {
        success: true,
        message: "Datos de ejemplo obtenidos desde la fuente de TikTok",
        timestamp: new Date().toISOString(),
        data: {
            profile: {
                username: profile.username ?? `demo_${id}`,
                avatar_url: profile.avatar_url ?? "/profile.png",
                followers: profile.followers ?? 0,
                following: profile.following ?? 0,
                likes: profile.likes ?? 0,
                engagement_median: median,
                engagement_range: { low: median * 0.8, high: median * 1.2 },
            },
            statistics: {
                total_videos: totalVideos,
                median_engagement: median,
                average_engagement: average,
                totals: {
                    views: String(totalsViews),
                    likes: String(totalsLikes),
                    comments: String(totalsComments),
                },
            },
            top_videos: {
                most_saved: mostSaved,
                most_viewed: mostViewed,
                highest_engagement: highestEngagement,
            },
            videos: mappedVideos,
            scraped_at: new Date().toISOString(),
        },
    };
};

export default function InfluencerDetailPage() {
    const params = useParams();
    const id = Number(params?.id);
    const router = useRouter();

    const [influencer, setInfluencer] = useState<InfluencerWithRelations | null>(null);
    const [loading, setLoading] = useState(true);

    const [scraped, setScraped] = useState<ScrapedResponse | null>(null);
    const [scrapeLoading, setScrapeLoading] = useState(false);

    useEffect(() => {
        if (!id || Number.isNaN(id)) return;
        fetchInfluencer();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchInfluencer = async (): Promise<void> => {
        try {
            const res = await fetch(`/api/influencers/${id}`);
            if (!res.ok) {
                // Modo dummy si la API devuelve error o 404
                const dummyRes = await fetch("/json-influencers.json");
                const dummyJson = (await dummyRes.json()) as DummyJson;
                setInfluencer(createDummyInfluencer(id));
                setScraped(buildScrapedFromDummyJson(id, dummyJson));
                return;
            }

            type InfluencerResponse = { data?: InfluencerWithRelations | null };
            const data: InfluencerResponse = await res.json();
            const item = data.data ?? null;
            setInfluencer(item);

            if (item) {
                fetchScrapedData(item);
            }
        } catch (error) {
            console.error("Error fetching influencer detail:", error);
            // Modo dummy en caso de error
            try {
                const dummyRes = await fetch("/json-influencers.json");
                const dummyJson = (await dummyRes.json()) as DummyJson;
                setInfluencer(createDummyInfluencer(id));
                setScraped(buildScrapedFromDummyJson(id, dummyJson));
            } catch {
                setInfluencer(createDummyInfluencer(id));
                setScraped(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchScrapedData = async (item: InfluencerWithRelations) => {
        try {
            setScrapeLoading(true);

            // Obtener handle de TikTok si existe; si no, usar el nombre como referencia
            const tiktokAccount = item.socialAccounts?.find((acc) => acc.socialPlatform.code.toLowerCase() === "tiktok");

            const value =
                tiktokAccount && tiktokAccount.handle
                    ? `@${tiktokAccount.handle.replace(/^@/, "")}`
                    : `@${item.name.replace(/\s+/g, "").toLowerCase()}`;

            const res = await fetch("/api/scraping/tiktok", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: value,
                }),
            });

            if (!res.ok) return;

            const data = await res.json();
            // El endpoint devuelve el objeto de scraping completo en la raíz:
            // { success, data: { profile, statistics, top_videos, videos }, message, timestamp }
            setScraped(data as ScrapedResponse);
        } catch (error) {
            console.error("Error obteniendo datos de TikTok:", error);
            setScraped(null);
        } finally {
            setScrapeLoading(false);
        }
    };

    const formatNumber = (value: number | string) => {
        const num = typeof value === "string" ? Number(value) : value;
        if (Number.isNaN(num)) return "-";
        if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
        return num.toLocaleString("es-ES");
    };

    const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

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
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 bg-muted min-h-full">
                            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                                <div>
                                    <PageBreadcrumb />
                                    <h1 className="text-[24px] font-bold text-foreground mb-1">
                                        {influencer ? influencer.name : "Influencer demo"}
                                    </h1>
                                    <p className="text-[14px] text-muted-foreground">
                                        Ficha rápida del influencer y resumen de su impacto en redes sociales.
                                    </p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center py-12 text-muted-foreground">Cargando...</div>
                            ) : !influencer ? (
                                <div className="text-center py-12 text-muted-foreground">No se encontró el influencer.</div>
                            ) : (
                                <Tabs defaultValue="details" className="mt-2">
                                    <TabsList className="bg-primary/10 rounded-2xl px-1 py-1 w-fit">
                                        <TabsTrigger
                                            value="details"
                                            className="rounded-2xl px-4 py-1 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white"
                                        >
                                            Detalles
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="posts"
                                            className="rounded-2xl px-4 py-1 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white"
                                        >
                                            Publicaciones
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="details" className="mt-4">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Información básica + redes */}
                                            <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                                <CardHeader>
                                                    <CardTitle className="text-[18px] font-bold text-foreground">
                                                        Resumen del influencer
                                                    </CardTitle>
                                                    <CardDescription className="text-[14px] text-muted-foreground">
                                                        Información clave que ves en el listado: nicho, código, campañas y actividad.
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4 text-sm">
                                                    <div className="grid grid-cols-1 gap-2">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <p className="text-xs text-muted-foreground">Nombre</p>
                                                            <p className="text-sm font-semibold text-foreground truncate">
                                                                {influencer.name}
                                                            </p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <p className="text-xs text-muted-foreground">Nicho</p>
                                                            <p className="text-sm text-foreground truncate">
                                                                {influencer.niche || <span className="text-muted-foreground">No definido</span>}
                                                            </p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <p className="text-xs text-muted-foreground">Código referido</p>
                                                            <p className="text-sm text-foreground">
                                                                {influencer.referralCode || (
                                                                    <span className="text-muted-foreground">No definido</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <p className="text-xs text-muted-foreground">Campañas</p>
                                                            <p className="text-sm font-semibold text-foreground">
                                                                {influencer._count?.influencerCampaigns ?? 0}
                                                            </p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <p className="text-xs text-muted-foreground">Posts</p>
                                                            <p className="text-sm font-semibold text-foreground">
                                                                {influencer._count?.posts ?? 0}
                                                            </p>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <p className="text-xs text-muted-foreground">Email</p>
                                                            <p className="text-sm text-foreground truncate">
                                                                {influencer.email || <span className="text-muted-foreground">No definido</span>}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="pt-3 border-t border-border mt-1">
                                                        <p className="text-xs text-muted-foreground mb-2">Redes sociales</p>
                                                        {influencer.socialAccounts && influencer.socialAccounts.length > 0 ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {influencer.socialAccounts.map((account) => (
                                                                    <Badge
                                                                        key={account.id}
                                                                        variant="outline"
                                                                        className="text-xs rounded-2xl"
                                                                    >
                                                                        {account.socialPlatform.name}
                                                                        {account.handle && ` · @${account.handle.replace(/^@/, "")}`}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground">
                                                                No hay redes sociales registradas para este influencer.
                                                            </p>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            {/* TikTok: perfil y resumen de rendimiento */}
                                            <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                                <CardHeader>
                                                    <CardTitle className="text-[18px] font-bold text-foreground">
                                                        Rendimiento en TikTok
                                                    </CardTitle>
                                                    <CardDescription className="text-[14px] text-muted-foreground">
                                                        Perfil y engagement promedio del influencer en TikTok.
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-3 text-sm">
                                                    {scrapeLoading ? (
                                                        <p className="text-xs text-muted-foreground">Cargando datos de TikTok...</p>
                                                    ) : !scraped ? (
                                                        <p className="text-xs text-muted-foreground">
                                                            No se pudieron obtener los datos de TikTok para este influencer.
                                                        </p>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar className="h-24 w-24">
                                                                        <AvatarImage
                                                                            src={scraped.data.profile.avatar_url}
                                                                            alt={scraped.data.profile.username}
                                                                        />
                                                                        <AvatarFallback className="text-xs">
                                                                            {scraped.data.profile.username.slice(0, 2).toUpperCase()}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <p className="text-xs text-muted-foreground mb-0.5">Usuario</p>
                                                                        <p className="text-sm font-semibold text-foreground">
                                                                            @{scraped.data.profile.username}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Badge className="bg-primary/10 text-primary text-xs px-2 py-0.5">
                                                                    Datos de TikTok
                                                                </Badge>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground mb-1">Seguidores</p>
                                                                    <p className="text-sm font-semibold text-foreground">
                                                                        {formatNumber(scraped.data.profile.followers)}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground mb-1">Seguidos</p>
                                                                    <p className="text-sm font-semibold text-foreground">
                                                                        {formatNumber(scraped.data.profile.following)}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground mb-1">Likes totales</p>
                                                                    <p className="text-sm font-semibold text-foreground">
                                                                        {formatNumber(scraped.data.profile.likes)}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground mb-1">
                                                                        Engagement medio (mediana)
                                                                    </p>
                                                                    <p className="text-sm font-semibold text-foreground">
                                                                        {formatPercent(scraped.data.profile.engagement_median)}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="pt-3 border-t border-border mt-2">
                                                                <p className="text-xs text-muted-foreground mb-1">Rango de engagement estimado</p>
                                                                <p className="text-sm font-semibold text-foreground">
                                                                    {formatPercent(scraped.data.profile.engagement_range.low)} –{" "}
                                                                    {formatPercent(scraped.data.profile.engagement_range.high)}
                                                                </p>
                                                            </div>

                                                            <div className="pt-3 border-t border-border mt-2 space-y-2">
                                                                <p className="text-xs text-muted-foreground">
                                                                    Resumen de contenido (últimos {scraped.data.statistics.total_videos}{" "}
                                                                    videos analizados)
                                                                </p>
                                                                <div className="grid grid-cols-3 gap-2">
                                                                    <div>
                                                                        <p className="text-[10px] text-muted-foreground mb-1">Vistas totales</p>
                                                                        <p className="text-sm font-semibold text-foreground">
                                                                            {formatNumber(scraped.data.statistics.totals.views)}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] text-muted-foreground mb-1">Likes totales</p>
                                                                        <p className="text-sm font-semibold text-foreground">
                                                                            {formatNumber(scraped.data.statistics.totals.likes)}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] text-muted-foreground mb-1">Comentarios</p>
                                                                        <p className="text-sm font-semibold text-foreground">
                                                                            {formatNumber(scraped.data.statistics.totals.comments)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="posts" className="mt-4">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Top videos (resumen compacto) */}
                                            <Card className="lg:col-span-2 rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                                <CardHeader>
                                                    <CardTitle className="text-[18px] font-bold text-foreground">
                                                        Top videos en TikTok
                                                    </CardTitle>
                                                    <CardDescription className="text-[14px] text-muted-foreground">
                                                        Tres videos clave según alcance, interacción y guardados.
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    {scrapeLoading ? (
                                                        <p className="text-xs text-muted-foreground">Cargando datos de videos...</p>
                                                    ) : !scraped ? (
                                                        <p className="text-xs text-muted-foreground">
                                                            No hay datos disponibles para mostrar los top videos.
                                                        </p>
                                                    ) : (
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            {(
                                                                [
                                                                    {
                                                                        key: "most_viewed",
                                                                        label: "Más visto",
                                                                        video: scraped.data.top_videos.most_viewed,
                                                                    },
                                                                    {
                                                                        key: "highest_engagement",
                                                                        label: "Mayor engagement",
                                                                        video: scraped.data.top_videos.highest_engagement,
                                                                    },
                                                                    {
                                                                        key: "most_saved",
                                                                        label: "Más guardado",
                                                                        video: scraped.data.top_videos.most_saved,
                                                                    },
                                                                ] as const
                                                            ).map(({ key, label, video }) => (
                                                                <div
                                                                    key={key}
                                                                    className="p-3 rounded-xl bg-primary/5 flex flex-col gap-2"
                                                                >
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <span className="text-xs font-semibold text-foreground">
                                                                            {label}
                                                                        </span>
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className="text-[10px] bg-primary/10 text-primary px-2 py-0.5"
                                                                        >
                                                                            Score {video.score_100}/100
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground line-clamp-3 min-h-[2.5rem]">
                                                                        {video.desc || "Sin descripción"}
                                                                    </p>
                                                                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                                                                        <div>
                                                                            <p className="text-muted-foreground">Vistas</p>
                                                                            <p className="font-semibold text-foreground">
                                                                                {formatNumber(video.views)}
                                                                            </p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-muted-foreground">Engagement</p>
                                                                            <p className="font-semibold text-foreground">
                                                                                {formatPercent(video.engagement_rate)}
                                                                            </p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-muted-foreground">Nivel</p>
                                                                            <p className="font-semibold text-foreground">
                                                                                {video.engagement_level}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>

                                            {/* Videos y comentarios (vista compacta para marketing) */}
                                            <Card className="lg:col-span-2 rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                                <CardHeader>
                                                    <CardTitle className="text-[18px] font-bold text-foreground">
                                                        Videos y preguntas de la comunidad
                                                    </CardTitle>
                                                    <CardDescription className="text-[14px] text-muted-foreground">
                                                        Lista de videos para que marketing identifique dónde se concentran las
                                                        conversaciones.
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-3 text-sm">
                                                    {scrapeLoading ? (
                                                        <p className="text-xs text-muted-foreground">Cargando lista de videos...</p>
                                                    ) : !scraped || scraped.data.videos.length === 0 ? (
                                                        <p className="text-xs text-muted-foreground">
                                                            Todavía no hay videos disponibles para analizar las conversaciones.
                                                        </p>
                                                    ) : (
                                                        <>
                                                            <div className="grid grid-cols-5 gap-2 text-[11px] text-muted-foreground">
                                                                <span>Video</span>
                                                                <span>Vistas</span>
                                                                <span>Comentarios</span>
                                                                <span>Engagement</span>
                                                                <span>Acción</span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {scraped.data.videos.map((video) => (
                                                                    <div
                                                                        key={video.id}
                                                                        className="grid grid-cols-5 gap-2 items-start rounded-xl bg-[rgba(108,72,197,0.02)] px-3 py-2"
                                                                    >
                                                                        <div className="pr-2">
                                                                            <p className="text-xs font-medium text-foreground truncate">
                                                                                {video.desc || "Sin descripción"}
                                                                            </p>
                                                                            <p className="text-[11px] text-muted-foreground">
                                                                                ID:{" "}
                                                                                <span className="font-mono">{video.id.slice(0, 8)}...</span>
                                                                            </p>
                                                                        </div>
                                                                        <p className="text-xs font-semibold text-foreground">
                                                                            {formatNumber(video.views)}
                                                                        </p>
                                                                        <p className="text-xs font-semibold text-foreground">
                                                                            {video.comments.toLocaleString("es-ES")}
                                                                        </p>
                                                                        <div className="flex flex-col gap-0.5 items-start">
                                                                            <span className="text-xs font-semibold text-foreground">
                                                                                {formatPercent(video.engagement_rate)}
                                                                            </span>
                                                                            <span className="text-[11px] text-muted-foreground">
                                                                                Nivel {video.engagement_level}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center">
                                                                            <Button
                                                                                type="button"
                                                                                size="sm"
                                                                                className="h-7 text-[11px] rounded-2xl bg-primary hover:bg-primary/90 text-white border-0"
                                                                                onClick={() =>
                                                                                    router.push(
                                                                                        `/dashboard/influencers/${influencer.id}/posts/${video.id}`
                                                                                    )
                                                                                }
                                                                            >
                                                                                Ver comentarios
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground pt-1">
                                                                En una siguiente versión podrás ver aquí las preguntas más frecuentes y un
                                                                resumen automático para el equipo de marketing.
                                                            </p>
                                                        </>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            )}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

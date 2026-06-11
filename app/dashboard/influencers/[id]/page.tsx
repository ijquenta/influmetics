"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    IconBrandTiktok,
    IconBrandInstagram,
    IconBrandYoutube,
    IconBrandX,
    IconRefresh,
    IconLoader2,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { InfluencerWithRelations } from "@/shared/types/influencer.types";
import { toast } from "sonner";

interface TikTokProfile {
    username: string;
    nickName: string;
    avatar: string;
    verified: boolean;
    signature: string;
    fans: number;
    following: number;
    heart: number;
    video: number;
    scrapedAt: string | null;
}

interface TikTokVideo {
    id: number;
    tiktokVideoId: string;
    caption: string;
    publishedAt: string;
    coverUrl: string;
    duration: number;
    playCount: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    hashtags: string[];
    webVideoUrl: string;
}

function buildTikTokProfile(account: InfluencerWithRelations["socialAccounts"][number]): TikTokProfile | null {
    if (!account || account.socialPlatform.code !== "tiktok") return null;
    return {
        username: account.handle,
        nickName: account.nickName || account.handle,
        avatar: account.avatar || "",
        verified: account.verified || false,
        signature: account.signature || "",
        fans: account.fans || 0,
        following: account.following || 0,
        heart: account.heart || 0,
        video: account.video || 0,
        scrapedAt: account.scrapedAt ? new Date(account.scrapedAt).toISOString() : null,
    };
}

function buildTikTokVideos(posts: InfluencerWithRelations["posts"]): TikTokVideo[] {
    return posts
        .filter((p) => p.tiktokVideoId)
        .map((p) => {
            const metric = p.metrics?.[0];
            return {
                id: p.id,
                tiktokVideoId: p.tiktokVideoId || "",
                caption: p.caption || "",
                publishedAt: new Date(p.publishedAt).toISOString(),
                coverUrl: p.coverUrl || "",
                duration: p.duration || 0,
                playCount: metric?.playCount ?? metric?.views ?? 0,
                likes: metric?.likes ?? 0,
                comments: metric?.commentCount ?? 0,
                shares: metric?.shares ?? 0,
                saves: metric?.saves ?? 0,
                hashtags: p.hashtags?.map((h) => h.name) || [],
                webVideoUrl: p.webVideoUrl || p.url,
            };
        });
}

function formatNumber(value: number | string): string {
    const num = typeof value === "string" ? Number(value) : value;
    if (Number.isNaN(num)) return "-";
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString("es-ES");
}

function formatDuration(seconds: number): string {
    if (!seconds) return "-";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function InfluencerDetailPage() {
    const params = useParams();
    const id = Number(params?.id);
    const router = useRouter();

    const [influencer, setInfluencer] = useState<InfluencerWithRelations | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!id || Number.isNaN(id)) return;
        fetchInfluencer();
    }, [id]);

    const fetchInfluencer = async () => {
        try {
            const res = await fetch(`/api/influencers/${id}`);
            if (!res.ok) throw new Error("Not found");
            const data = await res.json();
            setInfluencer(data.data ?? null);
        } catch (error) {
            console.error("Error fetching influencer:", error);
            setInfluencer(null);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        if (!influencer) return;
        setRefreshing(true);

        const tiktokAccount = influencer.socialAccounts?.find(
            (acc) => acc.socialPlatform.code.toLowerCase() === "tiktok"
        );
        const username = tiktokAccount?.handle || influencer.name;

        try {
            const res = await fetch("/api/influencers/save-scraped", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profileInput: username }),
            });

            if (!res.ok) {
                const err = await res.json();
                toast.error(err?.error || "Error al refrescar datos");
                return;
            }

            toast.success("Datos de TikTok actualizados");
            await fetchInfluencer();
        } catch {
            toast.error("Error al refrescar datos de TikTok");
        } finally {
            setRefreshing(false);
        }
    };

    const tiktokAccount = influencer?.socialAccounts?.find(
        (acc) => acc.socialPlatform.code.toLowerCase() === "tiktok"
    );
    const tikTokProfile = tiktokAccount ? buildTikTokProfile(tiktokAccount) : null;
    const tikTokVideos = influencer?.posts ? buildTikTokVideos(influencer.posts) : [];

    const totalViews = tikTokVideos.reduce((sum, v) => sum + v.playCount, 0);
    const totalLikes = tikTokVideos.reduce((sum, v) => sum + v.likes, 0);
    const totalComments = tikTokVideos.reduce((sum, v) => sum + v.comments, 0);

    const topViewed = [...tikTokVideos].sort((a, b) => b.playCount - a.playCount).slice(0, 1);
    const topLiked = [...tikTokVideos].sort((a, b) => b.likes - a.likes).slice(0, 1);
    const topSaved = [...tikTokVideos].sort((a, b) => b.saves - a.saves).slice(0, 1);

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
                                        {influencer ? influencer.name : "Influencer"}
                                    </h1>
                                    <p className="text-[14px] text-muted-foreground">
                                        Ficha rápida del influencer con datos de TikTok.
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
                                            {/* Basic info */}
                                            <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                                <CardHeader>
                                                    <CardTitle className="text-[18px] font-bold text-foreground">
                                                        Resumen del influencer
                                                    </CardTitle>
                                                    <CardDescription className="text-[14px] text-muted-foreground">
                                                        Información clave: nicho, código, campañas y actividad.
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

                                                    {influencer.socialAccounts && influencer.socialAccounts.length > 0 && (
                                                        <div className="pt-3 border-t border-border mt-1">
                                                            <p className="text-xs text-muted-foreground mb-2">Redes sociales</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {influencer.socialAccounts.map((account) => (
                                                                    <Badge
                                                                        key={account.id}
                                                                        variant="outline"
                                                                        className="gap-1.5 py-1 rounded-2xl"
                                                                    >
                                                                        {(() => {
                                                                            const code = account.socialPlatform.code.toLowerCase();
                                                                            const icons: Record<string, React.ComponentType<{ className?: string }>> = {
                                                                                tiktok: IconBrandTiktok,
                                                                                instagram: IconBrandInstagram,
                                                                                youtube: IconBrandYoutube,
                                                                                x: IconBrandX,
                                                                            };
                                                                            const Icon = icons[code];
                                                                            return Icon ? <Icon className="size-4" /> : null;
                                                                        })()}
                                                                        {account.socialPlatform.name}
                                                                        {account.handle && (
                                                                            <span className="text-xs">· @{account.handle.replace(/^@/, "")}</span>
                                                                        )}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>

                                            {/* TikTok profile card */}
                                            <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                                <CardHeader className="flex flex-row items-start justify-between">
                                                    <div>
                                                        <CardTitle className="text-[18px] font-bold text-foreground">
                                                            Rendimiento en TikTok
                                                        </CardTitle>
                                                        <CardDescription className="text-[14px] text-muted-foreground">
                                                            Perfil y engagement del influencer en TikTok.
                                                        </CardDescription>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleRefresh}
                                                        disabled={refreshing}
                                                        className="rounded-2xl gap-2"
                                                    >
                                                        {refreshing ? (
                                                            <IconLoader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <IconRefresh className="w-4 h-4" />
                                                        )}
                                                        {refreshing ? "Actualizando..." : "Actualizar"}
                                                    </Button>
                                                </CardHeader>
                                                <CardContent className="space-y-3 text-sm">
                                                    {!tikTokProfile ? (
                                                        <p className="text-xs text-muted-foreground">
                                                            Este influencer no tiene cuenta de TikTok registrada. Usa la
                                                            página de{" "}
                                                            <a
                                                                href="/dashboard/influencers/simulation"
                                                                className="text-primary underline"
                                                            >
                                                                simulación
                                                            </a>{" "}
                                                            para scrapear y guardar su perfil.
                                                        </p>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar className="h-24 w-24">
                                                                        <AvatarImage
                                                                            src={tikTokProfile.avatar}
                                                                            alt={tikTokProfile.username}
                                                                        />
                                                                        <AvatarFallback className="text-xs">
                                                                            {tikTokProfile.username.slice(0, 2).toUpperCase()}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <p className="text-xs text-muted-foreground mb-0.5">Usuario</p>
                                                                        <p className="text-sm font-semibold text-foreground">
                                                                            @{tikTokProfile.username}
                                                                        </p>
                                                                        {tikTokProfile.nickName && (
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {tikTokProfile.nickName}
                                                                            </p>
                                                                        )}
                                                                        {tikTokProfile.verified && (
                                                                            <Badge className="bg-blue-100 text-blue-700 text-[10px] mt-1">
                                                                                Verificado
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {tikTokProfile.signature && (
                                                                <p className="text-xs text-muted-foreground italic">
                                                                    &ldquo;{tikTokProfile.signature}&rdquo;
                                                                </p>
                                                            )}

                                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground mb-1">Seguidores</p>
                                                                    <p className="text-sm font-semibold text-foreground">
                                                                        {formatNumber(tikTokProfile.fans)}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground mb-1">Seguidos</p>
                                                                    <p className="text-sm font-semibold text-foreground">
                                                                        {formatNumber(tikTokProfile.following)}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground mb-1">Likes totales</p>
                                                                    <p className="text-sm font-semibold text-foreground">
                                                                        {formatNumber(tikTokProfile.heart)}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground mb-1">Videos totales</p>
                                                                    <p className="text-sm font-semibold text-foreground">
                                                                        {formatNumber(tikTokProfile.video)}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {tikTokVideos.length > 0 && (
                                                                <div className="pt-3 border-t border-border mt-2 space-y-2">
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Resumen de contenido ({tikTokVideos.length} videos scrapeados)
                                                                    </p>
                                                                    <div className="grid grid-cols-3 gap-2">
                                                                        <div>
                                                                            <p className="text-[10px] text-muted-foreground mb-1">
                                                                                Vistas totales
                                                                            </p>
                                                                            <p className="text-sm font-semibold text-foreground">
                                                                                {formatNumber(totalViews)}
                                                                            </p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] text-muted-foreground mb-1">
                                                                                Likes totales
                                                                            </p>
                                                                            <p className="text-sm font-semibold text-foreground">
                                                                                {formatNumber(totalLikes)}
                                                                            </p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] text-muted-foreground mb-1">
                                                                                Comentarios
                                                                            </p>
                                                                            <p className="text-sm font-semibold text-foreground">
                                                                                {formatNumber(totalComments)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {tikTokProfile.scrapedAt && (
                                                                <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
                                                                    Última actualización: {new Date(tikTokProfile.scrapedAt).toLocaleString("es-ES")}
                                                                </p>
                                                            )}
                                                        </>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="posts" className="mt-4">
                                        <div className="grid grid-cols-1 gap-6">
                                            {/* Top videos */}
                                            {tikTokVideos.length > 0 && (
                                                <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                                    <CardHeader>
                                                        <CardTitle className="text-[18px] font-bold text-foreground">
                                                            Top videos en TikTok
                                                        </CardTitle>
                                                        <CardDescription className="text-[14px] text-muted-foreground">
                                                            Videos destacados según rendimiento.
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                            {topViewed.length > 0 && (
                                                                <div className="p-3 rounded-xl bg-primary/5 flex flex-col gap-2">
                                                                    <span className="text-xs font-semibold text-foreground">Más visto</span>
                                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                                        {topViewed[0].caption || "Sin descripción"}
                                                                    </p>
                                                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                                        <div>
                                                                            <p className="text-muted-foreground">Vistas</p>
                                                                            <p className="font-semibold text-foreground">
                                                                                {formatNumber(topViewed[0].playCount)}
                                                                            </p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-muted-foreground">Likes</p>
                                                                            <p className="font-semibold text-foreground">
                                                                                {formatNumber(topViewed[0].likes)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {topLiked.length > 0 && (
                                                                <div className="p-3 rounded-xl bg-primary/5 flex flex-col gap-2">
                                                                    <span className="text-xs font-semibold text-foreground">Más likes</span>
                                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                                        {topLiked[0].caption || "Sin descripción"}
                                                                    </p>
                                                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                                        <div>
                                                                            <p className="text-muted-foreground">Vistas</p>
                                                                            <p className="font-semibold text-foreground">
                                                                                {formatNumber(topLiked[0].playCount)}
                                                                            </p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-muted-foreground">Likes</p>
                                                                            <p className="font-semibold text-foreground">
                                                                                {formatNumber(topLiked[0].likes)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {topSaved.length > 0 && (
                                                                <div className="p-3 rounded-xl bg-primary/5 flex flex-col gap-2">
                                                                    <span className="text-xs font-semibold text-foreground">Más guardado</span>
                                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                                        {topSaved[0].caption || "Sin descripción"}
                                                                    </p>
                                                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                                        <div>
                                                                            <p className="text-muted-foreground">Vistas</p>
                                                                            <p className="font-semibold text-foreground">
                                                                                {formatNumber(topSaved[0].playCount)}
                                                                            </p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-muted-foreground">Guardados</p>
                                                                            <p className="font-semibold text-foreground">
                                                                                {formatNumber(topSaved[0].saves)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {/* Video list */}
                                            <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                                <CardHeader>
                                                    <CardTitle className="text-[18px] font-bold text-foreground">
                                                        Videos ({tikTokVideos.length})
                                                    </CardTitle>
                                                    <CardDescription className="text-[14px] text-muted-foreground">
                                                        Lista de videos scrapeados de TikTok.
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    {tikTokVideos.length === 0 ? (
                                                        <p className="text-xs text-muted-foreground">
                                                            No hay videos scrapeados. Usa el botón "Actualizar" para obtener datos de TikTok.
                                                        </p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {tikTokVideos.map((video) => (
                                                                <div
                                                                    key={video.id}
                                                                    className="grid grid-cols-6 gap-2 items-start rounded-xl bg-[rgba(108,72,197,0.02)] px-3 py-2"
                                                                >
                                                                    <div className="col-span-2">
                                                                        <p className="text-xs font-medium text-foreground truncate">
                                                                            {video.caption || "Sin descripción"}
                                                                        </p>
                                                                        <div className="flex gap-2 text-[10px] text-muted-foreground mt-1">
                                                                            <span>{formatDuration(video.duration)}</span>
                                                                            {video.hashtags.length > 0 && (
                                                                                <span className="truncate">
                                                                                    {video.hashtags.slice(0, 3).join(", ")}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <p className="text-[10px] text-muted-foreground">Vistas</p>
                                                                        <p className="text-xs font-semibold text-foreground">
                                                                            {formatNumber(video.playCount)}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <p className="text-[10px] text-muted-foreground">Likes</p>
                                                                        <p className="text-xs font-semibold text-foreground">
                                                                            {formatNumber(video.likes)}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <p className="text-[10px] text-muted-foreground">Coment.</p>
                                                                        <p className="text-xs font-semibold text-foreground">
                                                                            {formatNumber(video.comments)}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center justify-center">
                                                                        <Button
                                                                            type="button"
                                                                            size="sm"
                                                                            className="h-7 text-[11px] rounded-2xl"
                                                                            onClick={() =>
                                                                                router.push(
                                                                                    `/dashboard/influencers/${influencer.id}/posts/${video.tiktokVideoId}`
                                                                                )
                                                                            }
                                                                        >
                                                                            Ver
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
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

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    IconBrandTiktok,
    IconBrandInstagram,
    IconBrandYoutube,
    IconBrandX,
    IconRefresh,
    IconLoader2,
    IconEdit,
    IconCurrencyDollar,
    IconMessage,
    IconArrowRight,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import type { InfluencerWithRelations } from "@/shared/types/influencer.types";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { IconCalendar } from "@tabler/icons-react";
import { calculateEMV, calculateROI, getROILabel, getROIColor } from "@/lib/roi";
import { getMetricColor } from "@/lib/utils";

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
    const id = Number(Array.isArray(params?.id) ? params.id[0] : params?.id);
    const router = useRouter();

    const [influencer, setInfluencer] = useState<InfluencerWithRelations | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", email: "", birthDate: "", niche: "", referralCode: "", notes: "" });
    const [linkOpen, setLinkOpen] = useState(false);
    const [campaigns, setCampaigns] = useState<{ id: number; name: string }[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState("");
    const [agreedCost, setAgreedCost] = useState("");

    useEffect(() => {
        if (!id || Number.isNaN(id)) return;
        fetchInfluencer();
    }, [id]);

    const fetchInfluencer = async () => {
        try {
            const res = await fetch(`/api/influencers/${id}`);
            if (res.status === 404) throw new Error("Not found");
            if (!res.ok) throw new Error("Error del servidor");
            const data = await res.json();
            setInfluencer(data.data ?? null);
        } catch (error) {
            console.error("Error fetching influencer:", error);
            setInfluencer(null);
        } finally {
            setLoading(false);
        }
    };

    const openEdit = () => {
        if (!influencer) return;
        setEditForm({
            name: influencer.name,
            email: influencer.email || "",
            birthDate: influencer.birthDate ? new Date(influencer.birthDate).toISOString().split("T")[0] : "",
            niche: influencer.niche || "",
            referralCode: influencer.referralCode || "",
            notes: influencer.notes || "",
        });
        setEditOpen(true);
    };

    const handleSave = async () => {
        if (!influencer) return;
        setSaving(true);
        try {
            const payload = {
                name: editForm.name.trim(),
                email: editForm.email.trim(),
                birthDate: editForm.birthDate || null,
                niche: editForm.niche.trim(),
                referralCode: editForm.referralCode.trim(),
                notes: editForm.notes.trim(),
            };
            const res = await fetch(`/api/influencers/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al actualizar");
            toast.success("Influencer actualizado");
            setEditOpen(false);
            setLoading(true);
            await fetchInfluencer();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error al actualizar");
        } finally {
            setSaving(false);
        }
    };

    const fetchCampaigns = async () => {
        try {
            const res = await fetch("/api/campaigns");
            if (!res.ok) throw new Error("Error al cargar campañas");
            const data = await res.json();
            setCampaigns((data.data || []).map((c: { id: number; name: string }) => ({ id: c.id, name: c.name })));
        } catch {
            toast.error("No se pudieron cargar las campañas");
        }
    };

    const openLinkDialog = () => {
        fetchCampaigns();
        setSelectedCampaignId("");
        setAgreedCost("");
        setLinkOpen(true);
    };

    const linkedCampaignIds = new Set(
        influencer?.influencerCampaigns?.map((ic) => ic.campaignId.toString()) || []
    );
    const availableCampaigns = campaigns.filter((c) => !linkedCampaignIds.has(c.id.toString()));

    const handleLinkCampaign = async () => {
        if (!selectedCampaignId) return;
        try {
            const res = await fetch("/api/campaigns/link-influencer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ influencerId: id, campaignId: selectedCampaignId, agreedCost }),
            });
            if (!res.ok) {
                const err = await res.json();
                toast.error(err.error || "Error al asignar");
                return;
            }
            toast.success("Influencer asignado a la campaña");
            setLinkOpen(false);
            const updated = await fetch(`/api/influencers/${id}`);
            const data = await updated.json();
            setInfluencer(data.data ?? null);
        } catch {
            toast.error("Error al asignar");
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

    const totalInvestment = influencer?.influencerCampaigns?.reduce(
        (sum, ic) => sum + (ic.agreedCost ? Number(ic.agreedCost) : 0), 0
    ) ?? 0;

    const engagementRate = tikTokVideos.length > 0
        ? tikTokVideos.reduce((sum, v) => {
            const engagement = v.playCount > 0 ? ((v.likes + v.comments + v.saves) / v.playCount) * 100 : 0;
            return sum + engagement;
        }, 0) / tikTokVideos.length
        : 0;

    const avgViews = tikTokVideos.length > 0 ? Math.round(totalViews / tikTokVideos.length) : 0;
    const avgLikes = tikTokVideos.length > 0 ? Math.round(totalLikes / tikTokVideos.length) : 0;

    const topVideos = [...tikTokVideos].sort((a, b) => b.playCount - a.playCount).slice(0, 6);

    const emv = calculateEMV(totalViews);
    const roi = calculateROI(emv, totalInvestment);

    if (loading) {
        return (

                    <div className="flex flex-1 flex-col">
                        <div className="@container/main flex flex-1 flex-col gap-2">
                            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 bg-muted min-h-full">
                                <Skeleton className="h-5 w-48 rounded-xl mb-2" />
                                <Skeleton className="h-8 w-72 rounded-xl mb-1" />
                                <Skeleton className="h-4 w-64 rounded-xl mb-6" />
                                {/* KPI cards */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="rounded-[20px] border border-[rgba(108,72,197,0.06)] bg-background p-5 space-y-3">
                                            <Skeleton className="h-3 w-16 rounded-lg" />
                                            <Skeleton className="h-7 w-24 rounded-lg" />
                                            <Skeleton className="h-2.5 w-12 rounded-lg" />
                                        </div>
                                    ))}
                                </div>
                                {/* Main grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Left column */}
                                    <div className="lg:col-span-1 space-y-6">
                                        {/* Profile card skeleton */}
                                        <div className="rounded-[20px] border border-[rgba(108,72,197,0.06)] bg-background p-6 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-12 w-12 rounded-full" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32 rounded-lg" />
                                                    <Skeleton className="h-3 w-24 rounded-lg" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Skeleton className="h-3 w-full rounded-lg" />
                                                <Skeleton className="h-3 w-3/4 rounded-lg" />
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Skeleton className="h-5 w-20 rounded-lg" />
                                                <Skeleton className="h-5 w-16 rounded-lg" />
                                            </div>
                                        </div>
                                        {/* Quick stats skeleton */}
                                        <div className="rounded-[20px] border border-[rgba(108,72,197,0.06)] bg-background p-5 space-y-4">
                                            <Skeleton className="h-4 w-28 rounded-lg" />
                                            {Array.from({ length: 4 }).map((_, i) => (
                                                <div key={i} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <Skeleton className="h-3 w-20 rounded-lg" />
                                                        <Skeleton className="h-3 w-12 rounded-lg" />
                                                    </div>
                                                    <Skeleton className="h-2 w-full rounded-full" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Right column */}
                                    <div className="lg:col-span-2 space-y-6">
                                        {/* Campaigns skeleton */}
                                        <div className="rounded-[20px] border border-[rgba(108,72,197,0.06)] bg-background p-5 space-y-3">
                                            <Skeleton className="h-4 w-32 rounded-lg" />
                                            {Array.from({ length: 2 }).map((_, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[rgba(108,72,197,0.02)]">
                                                    <div className="space-y-1.5">
                                                        <Skeleton className="h-3.5 w-28 rounded-lg" />
                                                        <Skeleton className="h-3 w-20 rounded-lg" />
                                                    </div>
                                                    <Skeleton className="h-3 w-16 rounded-lg" />
                                                </div>
                                            ))}
                                        </div>
                                        {/* Videos skeleton */}
                                        <div className="space-y-3">
                                            <Skeleton className="h-4 w-24 rounded-lg" />
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <div key={i} className="rounded-[20px] border border-[rgba(108,72,197,0.06)] bg-background overflow-hidden">
                                                        <Skeleton className="aspect-video w-full rounded-none" />
                                                        <div className="p-3 space-y-2">
                                                            <Skeleton className="h-3 w-16 rounded-lg" />
                                                            <Skeleton className="h-3 w-full rounded-lg" />
                                                            <Skeleton className="h-3 w-3/4 rounded-lg" />
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <Skeleton className="h-3 w-12 rounded-lg" />
                                                                <Skeleton className="h-3 w-12 rounded-lg justify-self-end" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

        );
    }

    if (!influencer) {
        return (

                    <div className="flex flex-1 flex-col items-center justify-center p-6 gap-3">
                        <div className="w-16 h-16 rounded-full bg-destructive/5 flex items-center justify-center">
                            <span className="text-2xl">😕</span>
                        </div>
                        <p className="text-sm font-medium text-foreground">Influencer no encontrado</p>
                        <p className="text-xs text-muted-foreground">El influencer que buscas no existe o fue eliminado.</p>
                        <div className="flex gap-2 mt-1">
                            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/influencers")} className="rounded-2xl">
                                Volver a influencers
                            </Button>
                            <Button size="sm" onClick={() => { setLoading(true); fetchInfluencer(); }} className="rounded-2xl">
                                Reintentar
                            </Button>
                        </div>
                    </div>

        );
    }

    return (

                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 bg-muted min-h-full">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-2 flex-wrap gap-4">
                                <div>
                                    <PageBreadcrumb />
                                    <h1 className="text-[24px] font-bold text-foreground mb-1">{influencer.name}</h1>
                                    <p className="text-[14px] text-muted-foreground">
                                        Análisis completo de rendimiento y campañas del influencer.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={openEdit} className="rounded-2xl gap-2">
                                        <IconEdit className="w-4 h-4" />
                                        Editar
                                    </Button>
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
                                        {refreshing ? "Actualizando..." : "Actualizar datos"}
                                    </Button>
                                </div>
                            </div>

                            {/* Dialogs */}
                            <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
                                <DialogContent className="rounded-[20px] max-w-sm">
                                    <DialogHeader>
                                        <DialogTitle>Asignar a campaña</DialogTitle>
                                        <DialogDescription>Selecciona la campaña y la inversión acordada</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Campaña</Label>
                                            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                                                <SelectTrigger className="rounded-2xl h-10">
                                                    <SelectValue placeholder="Seleccionar campaña" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableCampaigns.length === 0 ? (
                                                        <SelectItem value="_none" disabled>Todas las campañas ya están asignadas</SelectItem>
                                                    ) : (
                                                        availableCampaigns.map((c) => (
                                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Inversión acordada ($)</Label>
                                            <Input type="number" value={agreedCost} onChange={(e) => setAgreedCost(e.target.value)} placeholder="0.00" className="rounded-2xl h-10" />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setLinkOpen(false)} className="rounded-2xl">Cancelar</Button>
                                        <Button onClick={handleLinkCampaign} disabled={!selectedCampaignId} className="rounded-2xl">Asignar</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                                <DialogContent className="rounded-[20px] max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Editar influencer</DialogTitle>
                                        <DialogDescription>Actualiza la información básica del influencer</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Nombre</Label>
                                            <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="rounded-2xl h-10" />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Email</Label>
                                            <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="rounded-2xl h-10" />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Fecha de nacimiento</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={`w-full justify-start text-left font-normal rounded-2xl h-10 ${!editForm.birthDate ? "text-muted-foreground" : ""}`}
                                                    >
                                                        <IconCalendar className="mr-2 h-4 w-4" />
                                                        {editForm.birthDate
                                                            ? format(new Date(editForm.birthDate), "PPP", { locale: es })
                                                            : "Seleccionar fecha"}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={editForm.birthDate ? new Date(editForm.birthDate) : undefined}
                                                        onSelect={(date) => setEditForm({ ...editForm, birthDate: date ? date.toISOString().split("T")[0] : "" })}
                                                        locale={es}
                                                        className="rounded-2xl"
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Nicho</Label>
                                            <Input value={editForm.niche} onChange={(e) => setEditForm({ ...editForm, niche: e.target.value })} className="rounded-2xl h-10" />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Código de referido</Label>
                                            <Input value={editForm.referralCode} onChange={(e) => setEditForm({ ...editForm, referralCode: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter" && !saving) handleSave(); }} className="rounded-2xl h-10" />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Notas internas</Label>
                                            <Textarea
                                                value={editForm.notes}
                                                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                                placeholder="Observaciones, acuerdos, información relevante..."
                                                className="rounded-2xl min-h-[80px] resize-y"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setEditOpen(false)} className="rounded-2xl">Cancelar</Button>
                                        <Button onClick={handleSave} disabled={saving} className="rounded-2xl">
                                            {saving ? "Guardando..." : "Guardar"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            {/* KPI Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)] overflow-hidden">
                                    <CardContent className="p-4 md:p-5 relative">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/[0.03] rounded-bl-full" />
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5" title="Número total de seguidores en TikTok">Seguidores</p>
                                        <p className="text-[28px] font-extrabold text-foreground tracking-tight leading-none mb-1">{tikTokProfile ? formatNumber(tikTokProfile.fans) : "—"}</p>
                                        {tikTokProfile && <p className="text-[11px] text-muted-foreground">@{tikTokProfile.username}</p>}
                                    </CardContent>
                                </Card>
                                <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)] overflow-hidden">
                                    <CardContent className="p-4 md:p-5 relative">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/[0.03] rounded-bl-full" />
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5" title="Porcentaje de interacción promedio ((likes + comentarios + saves) / vistas) × 100">Engagement rate</p>
                                        <p className={`text-[28px] font-extrabold tracking-tight leading-none mb-1 ${getMetricColor(engagementRate, "engagement")}`}>
                                            {tikTokVideos.length > 0 ? `${engagementRate.toFixed(2)}%` : "—"}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {tikTokVideos.length > 0 ? `Promedio en ${tikTokVideos.length} videos` : "Sin datos"}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)] overflow-hidden">
                                    <CardContent className="p-4 md:p-5 relative">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/[0.03] rounded-bl-full" />
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5" title="Suma total de vistas en todos los videos">Vistas totales</p>
                                        <p className="text-[28px] font-extrabold text-foreground tracking-tight leading-none mb-1">{tikTokVideos.length > 0 ? formatNumber(totalViews) : "—"}</p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {avgViews > 0 ? `~${formatNumber(avgViews)} / video` : "Sin datos"}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)] overflow-hidden">
                                    <CardContent className="p-4 md:p-5 relative">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/[0.03] rounded-bl-full" />
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5" title="Suma total de inversión acordada en todas las campañas">Inversión total</p>
                                        <p className="text-[28px] font-extrabold text-foreground tracking-tight leading-none mb-1">
                                            {totalInvestment > 0 ? `$${totalInvestment.toLocaleString("es-ES")}` : "—"}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {influencer._count?.influencerCampaigns ?? 0} campañas activas
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)] overflow-hidden">
                                    <CardContent className="p-4 md:p-5 relative">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-primary/[0.03] rounded-bl-full" />
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5" title="Retorno de inversión estimado basado en EMV (Earned Media Value)">ROI estimado</p>
                                        <p className={`text-[28px] font-extrabold tracking-tight leading-none mb-1 ${totalInvestment > 0 ? getROIColor(roi) : "text-foreground"}`}>
                                            {totalInvestment > 0 ? `${roi >= 0 ? "+" : ""}${Math.round(roi)}%` : "—"}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {totalInvestment > 0 ? getROILabel(roi) : "Sin inversión registrada"}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Main two-column grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left column: Profile overview */}
                                <div className="lg:col-span-1 space-y-6">
                                    <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                        <CardHeader>
                                            <CardTitle className="text-[18px] font-bold text-foreground">Perfil</CardTitle>
                                            <CardDescription className="text-[14px] text-muted-foreground">
                                                Información general del influencer
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {tikTokProfile ? (
                                                <div className="flex items-center gap-4 mb-4">
                                                    <Avatar className="h-16 w-16">
                                                        <AvatarImage src={tikTokProfile.avatar} alt={tikTokProfile.username} />
                                                        <AvatarFallback className="text-xs">{tikTokProfile.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground">@{tikTokProfile.username}</p>
                                                        {tikTokProfile.nickName && (
                                                            <p className="text-xs text-muted-foreground">{tikTokProfile.nickName}</p>
                                                        )}
                                                        {tikTokProfile.verified && (
                                                            <Badge className="bg-blue-100 text-blue-700 text-[10px] mt-1">Verificado</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-4 mb-4">
                                                    <Avatar className="h-16 w-16">
                                                        <AvatarFallback className="text-base">{influencer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground">{influencer.name}</p>
                                                        <p className="text-xs text-muted-foreground">Sin perfil de TikTok</p>
                                                    </div>
                                                </div>
                                            )}

                                            {tikTokProfile?.signature && (
                                                <p className="text-xs text-muted-foreground italic leading-relaxed">
                                                    &ldquo;{tikTokProfile.signature}&rdquo;
                                                </p>
                                            )}

                                            <div className="space-y-2.5 pt-1">
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-muted-foreground">Nicho</span>
                                                    <span className="text-xs font-medium text-foreground">{influencer.niche || "Sin definir"}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-muted-foreground">Email</span>
                                                    <span className="text-xs font-medium text-foreground truncate max-w-[180px]">{influencer.email || "—"}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-muted-foreground">Código referido</span>
                                                    <span className="text-xs font-medium text-foreground">{influencer.referralCode || "—"}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-muted-foreground">Total videos</span>
                                                    <span className="text-xs font-medium text-foreground">{tikTokProfile ? formatNumber(tikTokProfile.video) : "—"}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-xs text-muted-foreground">Likes totales</span>
                                                    <span className="text-xs font-medium text-foreground">{tikTokProfile ? formatNumber(tikTokProfile.heart) : "—"}</span>
                                                </div>
                                                {tikTokProfile?.scrapedAt && (
                                                    <div className="flex justify-between">
                                                        <span className="text-xs text-muted-foreground">Última actualización</span>
                                                        <span className="text-xs font-medium text-foreground">{new Date(tikTokProfile.scrapedAt).toLocaleDateString("es-ES")}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {influencer.socialAccounts && influencer.socialAccounts.length > 0 && (
                                                <div className="pt-3 border-t border-border space-y-2">
                                                    <p className="text-xs text-muted-foreground">Redes sociales</p>
                                                    {influencer.socialAccounts.map((account) => (
                                                        <div key={account.id} className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                {(() => {
                                                                    const code = account.socialPlatform.code.toLowerCase();
                                                                    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
                                                                        tiktok: IconBrandTiktok,
                                                                        instagram: IconBrandInstagram,
                                                                        youtube: IconBrandYoutube,
                                                                        x: IconBrandX,
                                                                    };
                                                                    const Icon = icons[code];
                                                                    return Icon ? <Icon className="size-4 shrink-0" /> : null;
                                                                })()}
                                                                <span className="text-xs font-medium">{account.socialPlatform.name}</span>
                                                                {account.handle && (
                                                                    <span className="text-xs text-muted-foreground truncate">@{account.handle.replace(/^@/, "")}</span>
                                                                )}
                                                            </div>
                                                            <Switch
                                                                checked={account.isActive}
                                                                onCheckedChange={async (checked) => {
                                                                    const res = await fetch(`/api/influencer-social-accounts/${account.id}`, {
                                                                        method: "PATCH",
                                                                        headers: { "Content-Type": "application/json" },
                                                                        body: JSON.stringify({ isActive: checked }),
                                                                    });
                                                                    if (res.ok) {
                                                                        setInfluencer((prev) => {
                                                                            if (!prev) return prev;
                                                                            return {
                                                                                ...prev,
                                                                                socialAccounts: prev.socialAccounts.map((sa) =>
                                                                                    sa.id === account.id ? { ...sa, isActive: checked } : sa
                                                                                ),
                                                                            };
                                                                        });
                                                                        toast.success(checked ? "Cuenta activada" : "Cuenta desactivada");
                                                                    } else {
                                                                        toast.error("Error al actualizar estado");
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Quick stats mini-card */}
                                    <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                        <CardHeader>
                                            <CardTitle className="text-[18px] font-bold text-foreground">Estadísticas rápidas</CardTitle>
                                            <CardDescription className="text-[14px] text-muted-foreground">
                                                Promedio por video publicado
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="flex justify-between text-xs mb-1.5">
                                                        <span className="text-muted-foreground">Vistas promedio</span>
                                                        <span className="font-semibold text-foreground">{formatNumber(avgViews)}</span>
                                                    </div>
                                                    <Progress value={Math.min((avgViews / (tikTokProfile?.fans || 1)) * 100, 100)} className="h-2" />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-xs mb-1.5">
                                                        <span className="text-muted-foreground">Likes promedio</span>
                                                        <span className="font-semibold text-foreground">{formatNumber(avgLikes)}</span>
                                                    </div>
                                                    <Progress value={Math.min((avgLikes / (tikTokProfile?.fans || 1)) * 100, 100)} className="h-2 [&>div]:bg-green-500" />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-xs mb-1.5">
                                                        <span className="text-muted-foreground">Engagement rate</span>
                                                        <span className="font-semibold text-foreground">{tikTokVideos.length > 0 ? `${engagementRate.toFixed(2)}%` : "—"}</span>
                                                    </div>
                                                    <Progress value={Math.min(engagementRate * 10, 100)} className="h-2 [&>div]:bg-amber-500" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right column: Campaigns */}
                                <div className="lg:col-span-2 space-y-6">
                                    <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                        <CardHeader className="flex flex-row items-start justify-between">
                                            <div>
                                                <CardTitle className="text-[18px] font-bold text-foreground">Campañas</CardTitle>
                                                <CardDescription className="text-[14px] text-muted-foreground">
                                                    Campañas asignadas y rendimiento de inversión
                                                </CardDescription>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={openLinkDialog} className="rounded-2xl">
                                                + Asignar
                                            </Button>
                                        </CardHeader>
                                        <CardContent>
                                            {(!influencer.influencerCampaigns || influencer.influencerCampaigns.length === 0) ? (
                                                <div className="text-center py-8">
                                                    <p className="text-sm text-muted-foreground">No tiene campañas asignadas.</p>
                                                    <p className="text-xs text-muted-foreground mt-1">Asigna una campaña para empezar a medir su rendimiento.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {influencer.influencerCampaigns.map((ic) => (
                                                        <div key={ic.id} className="flex items-center justify-between p-4 rounded-xl bg-[rgba(108,72,197,0.02)] border border-[rgba(108,72,197,0.06)]">
                                                            <div className="space-y-1">
                                                                <p className="text-sm font-medium text-foreground">{ic.campaign.name}</p>
                                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                    {ic.agreedCost && (
                                                                        <span className="flex items-center gap-1">
                                                                            <IconCurrencyDollar className="size-3" />
                                                                            Inversión: ${Number(ic.agreedCost).toLocaleString("es-ES")}
                                                                        </span>
                                                                    )}
                                                                    <span className="text-[10px] text-muted-foreground/60">ROI: —</span>
                                                                </div>
                                                            </div>
                                                            <Badge variant={ic.campaign.isActive ? "default" : "secondary"} className="rounded-2xl">
                                                                {ic.campaign.isActive ? "Activa" : "Inactiva"}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                    {totalInvestment > 0 && (
                                                        <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
                                                            <p className="text-sm font-semibold text-foreground">Inversión total</p>
                                                            <p className="text-sm font-bold text-foreground">${totalInvestment.toLocaleString("es-ES")}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Content Performance - Top Videos */}
                                    {topVideos.length > 0 && (
                                        <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                            <CardHeader>
                                                <CardTitle className="text-[18px] font-bold text-foreground">Contenido destacado</CardTitle>
                                                <CardDescription className="text-[14px] text-muted-foreground">
                                                    Top {topVideos.length} videos con mejor rendimiento en TikTok
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <Carousel className="w-full">
                                                    <CarouselContent>
                                                        {topVideos.map((video, i) => (
                                                            <CarouselItem key={video.id} className="basis-full sm:basis-1/2 lg:basis-1/3">
                                                                <div className="rounded-xl bg-[rgba(108,72,197,0.02)] border border-[rgba(108,72,197,0.06)] overflow-hidden h-full">
                                                                    {video.coverUrl && (
                                                                        <div className="relative aspect-video bg-muted">
                                                                            <img
                                                                                src={video.coverUrl}
                                                                                alt={video.caption || "Video thumbnail"}
                                                                                className="w-full h-full object-cover"
                                                                                loading="lazy"
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                                                <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                                                                                    <svg className="w-3.5 h-3.5 text-foreground ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                                                                        <path d="M8 5v14l11-7z" />
                                                                                    </svg>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    <div className="p-3 space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">#{i + 1}</span>
                                                                            <span className="text-[10px] text-muted-foreground">{formatDuration(video.duration)}</span>
                                                                        </div>
                                                                        <p className="text-xs text-foreground line-clamp-2 min-h-[2rem]">
                                                                            {video.caption || "Sin descripción"}
                                                                        </p>
                                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                                                                            <span className="text-muted-foreground">Vistas</span>
                                                                            <span className="font-semibold text-foreground text-right">{formatNumber(video.playCount)}</span>
                                                                            <span className="text-muted-foreground">Likes</span>
                                                                            <span className="font-semibold text-foreground text-right">{formatNumber(video.likes)}</span>
                                                                            <span className="text-muted-foreground">Comentarios</span>
                                                                            <span className="font-semibold text-foreground text-right">{formatNumber(video.comments)}</span>
                                                                            <span className="text-muted-foreground">Compartido</span>
                                                                            <span className="font-semibold text-foreground text-right">{formatNumber(video.shares)}</span>
                                                                        </div>
                                                                        <button
                                                                            onClick={() => router.push(`/dashboard/influencers/${influencer.id}/posts/${video.id}/comments`)}
                                                                            className="w-full mt-1 flex items-center justify-center gap-1.5 text-[10px] font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-lg py-1.5 transition-colors"
                                                                        >
                                                                            <IconMessage className="w-3 h-3" />
                                                                            Ver comentarios
                                                                            <IconArrowRight className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </CarouselItem>
                                                        ))}
                                                    </CarouselContent>
                                                    <CarouselPrevious className="rounded-full" />
                                                    <CarouselNext className="rounded-full" />
                                                </Carousel>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

    );
}

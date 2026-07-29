"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { IconLoader2, IconSearch, IconPlus, IconTrash, IconArrowLeft, IconBrandTiktok, IconChartBar, IconMessage, IconHash, IconUsers } from "@tabler/icons-react";
import { toast } from "sonner";

interface CampaignHashtagItem {
    id: number;
    campaignId: number;
    hashtag: string | null;
    keyword: string | null;
}

interface InfluencerAnalysis {
    influencerId: number;
    influencerName: string;
    avatar: string | null;
    handle: string | null;
    postsDetected: number;
    totalViews: number;
    avgEngagement: number;
    brandMentions: number;
    topHashtags: string[];
    posts: {
        id: number;
        caption: string | null;
        url: string;
        publishedAt: string;
        metrics: {
            views: number | null;
            likes: number | null;
            shares: number | null;
            commentCount: number | null;
        } | null;
    }[];
}

interface DiscoverResult {
    campaignId: number;
    campaignName: string;
    hashtags: string[];
    keywords: string[];
    totalVideosFound: number;
    totalInfluencersDetected: number;
    discoveredAt: string;
    influencers: InfluencerAnalysis[];
}

export default function CampaignAnalysisPage() {
    const params = useParams();
    const id = Number(params?.id);
    const router = useRouter();

    const [hashtags, setHashtags] = useState<CampaignHashtagItem[]>([]);
    const [loadingHashtags, setLoadingHashtags] = useState(true);
    const [newHashtag, setNewHashtag] = useState("");
    const [newKeyword, setNewKeyword] = useState("");
    const [knownHandles, setKnownHandles] = useState("");
    const [limit, setLimit] = useState("10");

    const [discovering, setDiscovering] = useState(false);
    const [result, setResult] = useState<DiscoverResult | null>(null);
    const [campaignName, setCampaignName] = useState("");

    const fetchHashtags = useCallback(async () => {
        if (!id || Number.isNaN(id)) return;
        try {
            const res = await fetch(`/api/campaigns/${id}/hashtags`);
            const data = await res.json();
            setHashtags(data.data || []);
        } catch {
            setHashtags([]);
        } finally {
            setLoadingHashtags(false);
        }
    }, [id]);

    useEffect(() => {
        if (!id || Number.isNaN(id)) return;
        fetchHashtags();
        fetch(`/api/campaigns/${id}`)
            .then((r) => r.json())
            .then((d) => setCampaignName(d.data?.name || ""))
            .catch(() => {});
    }, [id, fetchHashtags]);

    const addHashtag = async () => {
        if (!newHashtag && !newKeyword) return;
        try {
            const body: Record<string, string> = {};
            if (newHashtag) body.hashtag = newHashtag;
            if (newKeyword) body.keyword = newKeyword;

            const res = await fetch(`/api/campaigns/${id}/hashtags`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error();
            toast.success(newHashtag ? `Hashtag #${newHashtag} agregado` : `Keyword "${newKeyword}" agregada`);
            setNewHashtag("");
            setNewKeyword("");
            await fetchHashtags();
        } catch {
            toast.error("Error al agregar");
        }
    };

    const deleteHashtag = async (hid: number) => {
        try {
            await fetch(`/api/campaigns/${id}/hashtags/${hid}`, { method: "DELETE" });
            toast.success("Eliminado");
            await fetchHashtags();
        } catch {
            toast.error("Error al eliminar");
        }
    };

    const runDiscovery = async () => {
        setDiscovering(true);
        setResult(null);
        try {
            const handles = knownHandles
                .split(",")
                .map((h) => h.trim().replace("@", ""))
                .filter(Boolean);

            const res = await fetch(`/api/campaigns/${id}/discover?limit=${limit}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ knownHandles: handles }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error");
            setResult(data.data);
            toast.success(`Descubrimiento completado: ${data.data.totalInfluencersDetected} influencers encontrados`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Error al descubrir campaña");
        } finally {
            setDiscovering(false);
        }
    };

    const formatNumber = (n: number) => n.toLocaleString("es-ES");

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 bg-muted min-h-full">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <PageBreadcrumb />
                            <h1 className="text-[28px] font-bold text-foreground mb-1">
                                Análisis Retrospectivo
                            </h1>
                            <p className="text-[16px] text-muted-foreground">
                                {campaignName ? `Campaña: ${campaignName}` : "Descubre y analiza influencers por hashtag"}
                            </p>
                        </div>
                        <Button variant="outline" onClick={() => router.push(`/dashboard/campaigns/${id}`)} className="rounded-2xl gap-2">
                            <IconArrowLeft className="w-4 h-4" />
                            Volver a la campaña
                        </Button>
                    </div>

                    <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                        <CardHeader>
                            <CardTitle className="text-[18px] font-bold text-foreground flex items-center gap-2">
                                <IconHash className="w-5 h-5 text-primary" />
                                Configurar Descubrimiento
                            </CardTitle>
                            <CardDescription className="text-[14px] text-muted-foreground">
                                Agrega los hashtags y palabras clave de la campaña pasada para descubrir influencers
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Hashtag (ej: ExpoAgro)</label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={newHashtag}
                                            onChange={(e) => setNewHashtag(e.target.value)}
                                            placeholder="expoagro2024"
                                            className="rounded-2xl"
                                            onKeyDown={(e) => e.key === "Enter" && addHashtag()}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Keyword de negocio (ej: hamburguesa)</label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={newKeyword}
                                            onChange={(e) => setNewKeyword(e.target.value)}
                                            placeholder="hamburguesa"
                                            className="rounded-2xl"
                                            onKeyDown={(e) => e.key === "Enter" && addHashtag()}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-end">
                                    <Button onClick={addHashtag} className="rounded-2xl gap-2 w-full" disabled={!newHashtag && !newKeyword}>
                                        <IconPlus className="w-4 h-4" />
                                        Agregar
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">Handles conocidos (opcional, separados por coma)</label>
                                    <Input
                                        value={knownHandles}
                                        onChange={(e) => setKnownHandles(e.target.value)}
                                        placeholder="influencer1, influencer2, influencer3"
                                        className="rounded-2xl"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground mb-1 block flex items-center gap-1">
                                        <IconUsers className="w-3 h-3" />
                                        Cantidad de influencers
                                    </label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={limit}
                                        onChange={(e) => setLimit(e.target.value)}
                                        className="rounded-2xl w-24"
                                    />
                                </div>
                            </div>

                            {loadingHashtags ? (
                                <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                                    <IconLoader2 className="w-4 h-4 animate-spin" />
                                    Cargando...
                                </div>
                            ) : hashtags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {hashtags.map((h) => (
                                        <Badge key={h.id} variant="secondary" className="rounded-2xl text-sm px-3 py-1.5 gap-2">
                                            {h.hashtag && <span>#{h.hashtag}</span>}
                                            {h.keyword && <span className="text-primary">"{h.keyword}"</span>}
                                            <button onClick={() => deleteHashtag(h.id)} className="text-muted-foreground hover:text-red-500 ml-1">
                                                <IconTrash className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground py-2">No hay hashtags configurados. Agrega al menos uno para descubrir influencers.</p>
                            )}

                            <Button
                                onClick={runDiscovery}
                                disabled={discovering || hashtags.length === 0}
                                className="rounded-2xl gap-2 px-6 h-11"
                            >
                                {discovering ? (
                                    <>
                                        <IconLoader2 className="w-4 h-4 animate-spin" />
                                        Descubriendo campaña...
                                    </>
                                ) : (
                                    <>
                                        <IconSearch className="w-4 h-4" />
                                        Descubrir Campaña
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {result && (
                        <>
                            <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                <CardHeader>
                                    <CardTitle className="text-[18px] font-bold text-foreground flex items-center gap-2">
                                        <IconChartBar className="w-5 h-5 text-primary" />
                                        Resultados del Descubrimiento
                                    </CardTitle>
                                    <CardDescription className="text-[14px] text-muted-foreground">
                                        {result.totalVideosFound} videos encontrados · {result.totalInfluencersDetected} influencers detectados
                                        {result.keywords.length > 0 && ` · Midiendo menciones de: ${result.keywords.map((k) => `"${k}"`).join(", ")}`}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {result.influencers.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground text-sm px-6">
                                            No se encontraron influencers con los hashtags proporcionados.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="border-primary/10">
                                                        <TableHead className="text-foreground font-semibold">Influencer</TableHead>
                                                        <TableHead className="text-foreground font-semibold text-center">Videos</TableHead>
                                                        <TableHead className="text-foreground font-semibold text-right">Vistas Totales</TableHead>
                                                        <TableHead className="text-foreground font-semibold text-right">Engagement Avg</TableHead>
                                                        <TableHead className="text-foreground font-semibold text-right">Menciones</TableHead>
                                                        <TableHead className="text-foreground font-semibold hidden lg:table-cell">Top Hashtags</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {result.influencers.map((inf) => (
                                                        <TableRow
                                                            key={inf.influencerId}
                                                            className="border-primary/10 cursor-pointer hover:bg-muted/50"
                                                            onClick={() => router.push(`/dashboard/influencers/${inf.influencerId}`)}
                                                        >
                                                            <TableCell>
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar className="h-8 w-8">
                                                                        {inf.avatar ? <AvatarImage src={inf.avatar} /> : null}
                                                                        <AvatarFallback className="text-[10px]">
                                                                            {inf.influencerName.slice(0, 2).toUpperCase()}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <p className="text-sm font-medium text-foreground">{inf.influencerName}</p>
                                                                        {inf.handle && (
                                                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                                <IconBrandTiktok className="w-3 h-3" />
                                                                                @{inf.handle}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-center text-sm text-foreground">
                                                                {inf.postsDetected}
                                                            </TableCell>
                                                            <TableCell className="text-right text-sm text-foreground font-semibold">
                                                                {formatNumber(inf.totalViews)}
                                                            </TableCell>
                                                            <TableCell className="text-right text-sm">
                                                                <span className={inf.avgEngagement > 5 ? "text-green-600" : "text-muted-foreground"}>
                                                                    {inf.avgEngagement.toFixed(1)}%
                                                                </span>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                {result.keywords.length > 0 ? (
                                                                    <Badge
                                                                        variant={inf.brandMentions > 0 ? "default" : "secondary"}
                                                                        className="rounded-2xl"
                                                                    >
                                                                        {inf.brandMentions}
                                                                    </Badge>
                                                                ) : (
                                                                    <span className="text-sm text-muted-foreground">—</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="hidden lg:table-cell">
                                                                <div className="flex gap-1 flex-wrap max-w-[200px]">
                                                                    {inf.topHashtags.slice(0, 4).map((tag) => (
                                                                        <Badge key={tag} variant="outline" className="rounded-2xl text-[10px]">
                                                                            #{tag}
                                                                        </Badge>
                                                                    ))}
                                                                    {inf.topHashtags.length > 4 && (
                                                                        <span className="text-[10px] text-muted-foreground">
                                                                            +{inf.topHashtags.length - 4}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {result.keywords.length > 0 && (
                                <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                    <CardHeader>
                                        <CardTitle className="text-[18px] font-bold text-foreground flex items-center gap-2">
                                            <IconMessage className="w-5 h-5 text-primary" />
                                            Menciones de Negocio
                                        </CardTitle>
                                        <CardDescription className="text-[14px] text-muted-foreground">
                                            Veces que se mencionó {result.keywords.map((k) => `"${k}"`).join(" y ")} en los captions de los videos
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {result.influencers
                                                .filter((inf) => inf.brandMentions > 0)
                                                .sort((a, b) => b.brandMentions - a.brandMentions)
                                                .map((inf) => (
                                                    <Card key={inf.influencerId} className="rounded-[16px] border-primary/10">
                                                        <CardContent className="p-4 text-center">
                                                            <Avatar className="h-10 w-10 mx-auto mb-2">
                                                                {inf.avatar ? <AvatarImage src={inf.avatar} /> : null}
                                                                <AvatarFallback>{inf.influencerName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                            <p className="text-sm font-semibold text-foreground truncate">{inf.influencerName}</p>
                                                            <p className="text-[28px] font-bold text-primary mt-1">{inf.brandMentions}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">menciones</p>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            {result.influencers.filter((inf) => inf.brandMentions > 0).length === 0 && (
                                                <div className="col-span-full text-center py-4 text-muted-foreground text-sm">
                                                    Ningún influencer mencionó las palabras clave en sus videos.
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
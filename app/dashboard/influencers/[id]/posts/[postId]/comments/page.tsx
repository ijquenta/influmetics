"use client";

import { useEffect, useState, useCallback, useRef, KeyboardEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    IconMessage,
    IconLoader2,
    IconArrowLeft,
    IconHeart,
    IconRefresh,
    IconDownload,
    IconAlertCircle,
    IconCheck,
    IconEye,
    IconFileExport,
    IconArrowUp,
    IconArrowDown,
    IconChevronLeft,
    IconChevronRight,
    IconStars,
    IconMoodSmile,
    IconMoodSad,
    IconMoodEmpty,
    IconSearch,
    IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CommentData {
    id: number;
    postId: number;
    tiktokCommentId: string | null;
    text: string;
    diggCount: number;
    replyCount: number;
    createTimeISO: string | null;
    authorUsername: string | null;
    authorUserId: string | null;
    createdAt: string;
    sentimentLabel: string | null;
    sentimentScore: number | null;
    sentimentReason: string | null;
    analyzedAt: string | null;
}

interface PostInfo {
    id: number;
    tiktokVideoId: string | null;
    caption: string | null;
    coverUrl: string | null;
    webVideoUrl: string | null;
    publishedAt: string | null;
    duration: number | null;
    views: number | null;
    likes: number | null;
    commentCount: number | null;
    shares: number | null;
    saves: number | null;
    temasDestacados: string | null;
    sugerencia: string | null;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

type SortField = "diggCount" | "createTimeISO" | "replyCount";

function formatNumber(value: number): string {
    if (Number.isNaN(value)) return "0";
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toLocaleString("es-ES");
}

function formatDuration(seconds: number | null): string {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function exportToCsv(comments: CommentData[], filename: string) {
    const headers = ["Usuario", "Texto", "Likes", "Respuestas", "Fecha", "Sentimiento", "Confianza"];
    const rows = comments.map((c) => [
        c.authorUsername || "anónimo",
        `"${(c.text || "").replace(/"/g, '""')}"`,
        c.diggCount.toString(),
        c.replyCount.toString(),
        c.createTimeISO ? new Date(c.createTimeISO).toISOString() : "",
        c.sentimentLabel || "",
        c.sentimentScore ? c.sentimentScore.toFixed(2) : "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

const SORT_OPTIONS: { value: SortField; label: string }[] = [
    { value: "diggCount", label: "Más likes" },
    { value: "createTimeISO", label: "Más recientes" },
    { value: "replyCount", label: "Más respuestas" },
];

export default function VideoCommentsPage() {
    const params = useParams();
    const router = useRouter();
    const postId = Number(Array.isArray(params?.postId) ? params.postId[0] : params?.postId);
    const influencerId = Number(Array.isArray(params?.id) ? params.id[0] : params?.id);
    const listRef = useRef<HTMLDivElement>(null);

    const [post, setPost] = useState<PostInfo | null>(null);
    const [comments, setComments] = useState<CommentData[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 });
    const [sortBy, setSortBy] = useState<SortField>("diggCount");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [extracting, setExtracting] = useState(false);
    const [extractProgress, setExtractProgress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [sentimentFilter, setSentimentFilter] = useState<string | null>(null);
    const [searchText, setSearchText] = useState("");
    const [goToPage, setGoToPage] = useState("");
    const [sentimentSummary, setSentimentSummary] = useState<{
        positivo: number;
        negativo: number;
        neutro: number;
        temas_destacados: string[];
        sugerencia: string;
    } | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/posts/${postId}/comments?page=${page}&limit=50&sortBy=${sortBy}&sortOrder=${sortOrder}`);
            if (!res.ok) {
                setError("Error al cargar comentarios.");
                return;
            }

            const json = await res.json();

            if (json.post) {
                setPost(json.post);
            }
            setComments(json.data || []);
            setPagination(json.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 });

            if (json.sentimentCounts) {
                setSentimentSummary((prev) => {
                    let temas: string[] = [];
                    let sugerencia = "";
                    try {
                        if (json.post?.temasDestacados) {
                            const parsed = JSON.parse(json.post.temasDestacados);
                            if (Array.isArray(parsed)) temas = parsed;
                        }
                        if (json.post?.sugerencia) sugerencia = json.post.sugerencia;
                    } catch {}
                    if (prev?.sugerencia && !sugerencia) return prev;
                    return {
                        positivo: json.sentimentCounts?.positivo ?? 0,
                        negativo: json.sentimentCounts?.negativo ?? 0,
                        neutro: json.sentimentCounts?.neutro ?? 0,
                        temas_destacados: temas,
                        sugerencia,
                    };
                });
            }
        } catch {
            setError("Error al cargar datos.");
        } finally {
            setLoading(false);
        }
    }, [postId, page, sortBy, sortOrder]);

    useEffect(() => {
        if (!postId || Number.isNaN(postId)) return;
        loadData();
    }, [loadData, postId]);

    useEffect(() => {
        const handleKeyDown = (e: globalThis.KeyboardEvent) => {
            if (e.ctrlKey && e.key === "e") {
                e.preventDefault();
                if (!extracting && post?.tiktokVideoId) handleExtract();
            }
            if (e.ctrlKey && e.shiftKey && e.key === "A") {
                e.preventDefault();
                if (!analyzing && pagination.total > 0) handleAnalyze();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [extracting, analyzing, post, pagination.total]);

    const handleExtract = async () => {
        if (!post || !post.tiktokVideoId) return;
        setExtracting(true);
        setExtractProgress("Conectando con TikTok...");

        const videoUrl = post.webVideoUrl || `https://www.tiktok.com/@unknown/video/${post.tiktokVideoId}`;

        try {
            setExtractProgress("Extrayendo comentarios...");
            const res = await fetch(`/api/posts/${postId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoUrl }),
            });

            const body = await res.text();
            let data;
            try { data = JSON.parse(body); } catch { data = {}; }

            if (!res.ok) {
                toast.error(data?.error || "Error al extraer comentarios");
                return;
            }

            setExtractProgress("Guardando en base de datos...");
            await loadData();
            toast.success(`${data.total} comentarios extraídos y guardados`);
        } catch {
            toast.error("Error al conectar con el servicio de extracción");
        } finally {
            setExtracting(false);
            setExtractProgress(null);
        }
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        try {
            const res = await fetch(`/api/posts/${postId}/comments/analyze`, {
                method: "POST",
            });
            const body = await res.text();
            let data;
            try { data = JSON.parse(body); } catch { data = {}; }
            if (!res.ok) {
                toast.error(data?.error || "Error al analizar comentarios");
                return;
            }
            setSentimentSummary({
                positivo: typeof data.resumen?.positivo === "number" ? data.resumen.positivo : 0,
                negativo: typeof data.resumen?.negativo === "number" ? data.resumen.negativo : 0,
                neutro: typeof data.resumen?.neutro === "number" ? data.resumen.neutro : 0,
                temas_destacados: Array.isArray(data.temas_destacados) ? data.temas_destacados : [],
                sugerencia: typeof data.sugerencia === "string" ? data.sugerencia : "",
            });
            await loadData();
            toast.success(`${data.analyzed} comentarios analizados`);
        } catch {
            toast.error("Error al conectar con el servicio de análisis");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSort = (field: SortField) => {
        if (sortBy === field) {
            setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
        } else {
            setSortBy(field);
            setSortOrder("desc");
        }
        setPage(1);
    };

    const handleExport = () => {
        const name = `comentarios_${post?.tiktokVideoId || postId}_${new Date().toISOString().split("T")[0]}`;
        exportToCsv(comments, name);
        toast.success("Archivo CSV exportado");
    };

    const totalLikes = comments.reduce((sum, c) => sum + (c.diggCount || 0), 0);

    if (loading && !post) {
        return (

                    <div className="flex flex-1 flex-col p-6 gap-4 bg-muted">
                        <Skeleton className="h-5 w-48 rounded-xl" />
                        <Skeleton className="h-8 w-72 rounded-xl" />
                        <Skeleton className="h-4 w-64 rounded-xl" />
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                            <Skeleton className="h-48 rounded-[20px] lg:col-span-1" />
                            <div className="lg:col-span-2 space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-[20px]" />)}
                                </div>
                                <Skeleton className="h-96 rounded-[20px]" />
                            </div>
                        </div>
                    </div>

        );
    }

    if (error && !post) {
        return (

                    <div className="flex flex-1 items-center justify-center p-6">
                        <div className="text-center space-y-3">
                            <IconAlertCircle className="w-10 h-10 text-destructive mx-auto" />
                            <p className="text-muted-foreground">{error || "Video no encontrado"}</p>
                            <Button variant="outline" onClick={() => router.back()} className="rounded-2xl gap-2">
                                <IconArrowLeft className="w-4 h-4" />
                                Volver
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
                                    <h1 className="text-[24px] font-bold text-foreground mb-1">Comentarios del video</h1>
                                    <p className="text-[14px] text-muted-foreground">
                                        Extrae, revisa y analiza los comentarios de este video de TikTok.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => router.back()} className="rounded-2xl gap-2" title="Volver al video">
                                        <IconArrowLeft className="w-4 h-4" />
                                        Volver
                                    </Button>
                                    {comments.length > 0 && (
                                        <Button variant="outline" onClick={handleExport} className="rounded-2xl gap-2" title="Exportar comentarios a CSV">
                                            <IconFileExport className="w-4 h-4" />
                                            Exportar CSV
                                        </Button>
                                    )}
                                    <Button onClick={handleExtract} disabled={extracting} className="rounded-2xl gap-2" title="Ctrl+E para extraer">
                                        {extracting ? (
                                            <IconLoader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <IconDownload className="w-4 h-4" />
                                        )}
                                        {extracting ? extractProgress || "Extrayendo..." : "Extraer"}
                                    </Button>
                                    {pagination.total > 0 && (
                                        <Button onClick={handleAnalyze} disabled={analyzing} variant="outline" className="rounded-2xl gap-2" title="Ctrl+Shift+A para analizar">
                                            {analyzing ? (
                                                <IconLoader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <IconStars className="w-4 h-4" />
                                            )}
                                            {analyzing ? "Analizando..." : "Analizar"}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Extraction progress bar */}
                            {extracting && (
                                <div className="w-full bg-primary/10 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-primary h-1.5 rounded-full w-1/3 animate-pulse" style={{ animation: "shimmer 2s infinite" }} />
                                </div>
                            )}

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left: Video info with metrics */}
                                <div className="lg:col-span-1 space-y-6">
                                    <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                        <CardHeader>
                                            <CardTitle className="text-[18px] font-bold text-foreground flex items-center gap-2">
                                                <IconMessage className="w-5 h-5" />
                                                Video
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {post?.coverUrl && (
                                                <div className="aspect-video max-h-[320px] rounded-xl overflow-hidden bg-muted">
                                                    <img
                                                        src={post.coverUrl}
                                                        alt={post.caption || "Video thumbnail"}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                                                {post?.caption || "Sin descripción"}
                                            </p>
                                            <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                                                {post?.duration && (
                                                    <span className="bg-[rgba(108,72,197,0.04)] px-2.5 py-1 rounded-lg">
                                                        {formatDuration(post.duration)}
                                                    </span>
                                                )}
                                                {post?.publishedAt && (
                                                    <span className="bg-[rgba(108,72,197,0.04)] px-2.5 py-1 rounded-lg">
                                                        {new Date(post.publishedAt).toLocaleDateString("es-ES")}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Video metrics */}
                                            {post && (post.views !== null || post.likes !== null) && (
                                                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                                                    {post.views !== null && (
                                                        <div className="text-center">
                                                            <IconEye className="w-5 h-5 text-primary mx-auto mb-1" />
                                                            <p className="text-[22px] font-extrabold text-foreground tracking-tight">{formatNumber(post.views)}</p>
                                                            <p className="text-[11px] text-muted-foreground">Vistas</p>
                                                        </div>
                                                    )}
                                                    {post.likes !== null && (
                                                        <div className="text-center">
                                                            <IconHeart className="w-5 h-5 text-primary mx-auto mb-1" />
                                                            <p className="text-[22px] font-extrabold text-foreground tracking-tight">{formatNumber(post.likes)}</p>
                                                            <p className="text-[11px] text-muted-foreground">Likes</p>
                                                        </div>
                                                    )}
                                                    {post.commentCount !== null && (
                                                        <div className="text-center">
                                                            <IconMessage className="w-5 h-5 text-primary mx-auto mb-1" />
                                                            <p className="text-[22px] font-extrabold text-foreground tracking-tight">{formatNumber(post.commentCount)}</p>
                                                            <p className="text-[11px] text-muted-foreground">Comentarios</p>
                                                        </div>
                                                    )}
                                                    {post.shares !== null && (
                                                        <div className="text-center">
                                                            <IconRefresh className="w-5 h-5 text-primary mx-auto mb-1" />
                                                            <p className="text-[22px] font-extrabold text-foreground tracking-tight">{formatNumber(post.shares)}</p>
                                                            <p className="text-[11px] text-muted-foreground">Compartido</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {post?.webVideoUrl && (
                                                <a
                                                    href={post.webVideoUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary hover:underline block pt-1"
                                                >
                                                    Ver en TikTok →
                                                </a>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right: Comments */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Stats cards */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                            <CardContent className="p-4 md:p-5">
                                                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Total</p>
                                                {loading ? (
                                                    <Skeleton className="h-7 w-16 rounded-lg" />
                                                ) : (
                                                    <p className="text-[28px] font-extrabold text-foreground tracking-tight">{formatNumber(pagination.total)}</p>
                                                )}
                                                <p className="text-[10px] text-muted-foreground mt-0.5">comentarios</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                            <CardContent className="p-4 md:p-5">
                                                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Likes totales</p>
                                                {loading ? (
                                                    <Skeleton className="h-7 w-16 rounded-lg" />
                                                ) : (
                                                    <p className="text-[28px] font-extrabold text-foreground tracking-tight">{formatNumber(totalLikes)}</p>
                                                )}
                                                <p className="text-[10px] text-muted-foreground mt-0.5">en comentarios</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                            <CardContent className="p-4 md:p-5">
                                                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Top like</p>
                                                {loading ? (
                                                    <Skeleton className="h-7 w-16 rounded-lg" />
                                                ) : (
                                                    <p className="text-[28px] font-extrabold text-foreground tracking-tight">
                                                        {comments[0] ? formatNumber(comments[0].diggCount) : "—"}
                                                    </p>
                                                )}
                                                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                                    {loading ? "" : comments[0] ? `@${comments[0].authorUsername}` : "Sin datos"}
                                                </p>
                                            </CardContent>
                                        </Card>
                                        <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                            <CardContent className="p-4 md:p-5">
                                                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Sentimiento</p>
                                                {loading ? (
                                                    <Skeleton className="h-7 w-16 rounded-lg" />
                                                ) : sentimentSummary ? (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-green-500" />
                                                            <span className="text-[13px] font-medium text-foreground">{sentimentSummary.positivo}</span>
                                                            <span className="text-[10px] text-muted-foreground">pos</span>
                                                            <div className="h-2 w-2 rounded-full bg-red-500 ml-1" />
                                                            <span className="text-[13px] font-medium text-foreground">{sentimentSummary.negativo}</span>
                                                            <span className="text-[10px] text-muted-foreground">neg</span>
                                                            <div className="h-2 w-2 rounded-full bg-gray-400 ml-1" />
                                                            <span className="text-[13px] font-medium text-foreground">{sentimentSummary.neutro}</span>
                                                            <span className="text-[10px] text-muted-foreground">neu</span>
                                                        </div>
                                                        <div className="flex h-1.5 rounded-full overflow-hidden">
                                                            {(() => {
                                                                const t = sentimentSummary.positivo + sentimentSummary.negativo + sentimentSummary.neutro;
                                                                return t > 0 ? (
                                                                    <>
                                                                        <div style={{ width: `${(sentimentSummary.positivo / t) * 100}%` }} className="h-full bg-green-500" />
                                                                        <div style={{ width: `${(sentimentSummary.negativo / t) * 100}%` }} className="h-full bg-red-500" />
                                                                        <div style={{ width: `${(sentimentSummary.neutro / t) * 100}%` }} className="h-full bg-gray-400" />
                                                                    </>
                                                                ) : (<div className="h-full bg-gray-200" />);
                                                            })()}
                                                        </div>
                                                    </div>
                                                ) : pagination.total > 0 ? (
                                                    <p className="text-[11px] text-muted-foreground">Sin analizar</p>
                                                ) : (
                                                    <p className="text-[11px] text-muted-foreground">Sin datos</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Temas destacados + Sugerencia */}
                                    {sentimentSummary && (sentimentSummary.temas_destacados.length > 0 || sentimentSummary.sugerencia) && (
                                        <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                            <CardContent className="p-4 md:p-5">
                                                <div className="flex items-start justify-between flex-wrap gap-3">
                                                    <div className="space-y-1">
                                                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Temas destacados</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {sentimentSummary.temas_destacados.length > 0 ? (
                                                                sentimentSummary.temas_destacados.map((t) => (
                                                                    <span key={t} className="text-[11px] bg-primary/5 text-primary px-2 py-0.5 rounded-lg">{t}</span>
                                                                ))
                                                            ) : (
                                                                <span className="text-[11px] text-muted-foreground italic">Sin datos</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="text-right max-w-[300px]">
                                                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Sugerencia</p>
                                                        <p className="text-[12px] text-foreground leading-relaxed">
                                                            {sentimentSummary.sugerencia || <span className="text-muted-foreground italic">Sin datos</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Search + filter */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="relative flex-1 min-w-[180px] max-w-xs">
                                            <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                                            <input
                                                type="text"
                                                value={searchText}
                                                onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
                                                placeholder="Buscar en comentarios..."
                                                className="w-full h-8 text-[11px] pl-8 pr-7 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                            />
                                            {searchText && (
                                                <button
                                                    onClick={() => { setSearchText(""); setPage(1); }}
                                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
                                                >
                                                    <IconX className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                        {comments.some((c) => c.sentimentLabel) && (
                                            <div className="flex gap-1">
                                                {[
                                                    { key: null, label: "Todos", icon: null },
                                                    { key: "POSITIVO", label: "Positivos", icon: <IconMoodSmile className="w-3.5 h-3.5 text-green-600" /> },
                                                    { key: "NEGATIVO", label: "Negativos", icon: <IconMoodSad className="w-3.5 h-3.5 text-red-600" /> },
                                                    { key: "NEUTRO", label: "Neutros", icon: <IconMoodEmpty className="w-3.5 h-3.5 text-gray-500" /> },
                                                ].map((opt) => (
                                                    <button
                                                        key={opt.key ?? "all"}
                                                        onClick={() => { setPage(1); setSentimentFilter(opt.key); }}
                                                        className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                                                            sentimentFilter === opt.key
                                                                ? "bg-primary/10 text-primary"
                                                                : "bg-[rgba(108,72,197,0.02)] text-muted-foreground hover:text-foreground"
                                                        }`}
                                                    >
                                                        {opt.icon}
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Comments list */}
                                    <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)] max-h-[700px] flex flex-col">
                                        <CardHeader className="shrink-0">
                                            <div className="flex items-center justify-between flex-wrap gap-3">
                                                <div>
                                                    <CardTitle className="text-[18px] font-bold text-foreground flex items-center gap-2">
                                                        <IconMessage className="w-5 h-5" />
                                                        Comentarios {pagination.total > 0 && `(${pagination.total})`}
                                                    </CardTitle>
                                                    <CardDescription className="text-[14px] text-muted-foreground">
                                                        {pagination.total > 0
                                                            ? `Página ${pagination.page} de ${pagination.totalPages}`
                                                            : "Usa el botón Extraer comentarios para obtener los datos"}
                                                    </CardDescription>
                                                </div>

                                                {/* Sort buttons */}
                                                {pagination.total > 0 && (
                                                    <div className="flex gap-1">
                                                        {SORT_OPTIONS.map((opt) => (
                                                            <button
                                                                key={opt.value}
                                                                onClick={() => handleSort(opt.value)}
                                                                className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                                                                    sortBy === opt.value
                                                                        ? "bg-primary/10 text-primary"
                                                                        : "bg-[rgba(108,72,197,0.02)] text-muted-foreground hover:text-foreground"
                                                                }`}
                                                            >
                                                                {opt.label}
                                                                {sortBy === opt.value && (
                                                                    sortOrder === "desc" ? <IconArrowDown className="w-3 h-3" /> : <IconArrowUp className="w-3 h-3" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="overflow-y-auto flex-1">
                                            {loading ? (
                                                <div className="space-y-3">
                                                    {[1, 2, 3, 4, 5].map((i) => (
                                                        <div key={i} className="p-4 rounded-xl bg-[rgba(108,72,197,0.02)] border border-[rgba(108,72,197,0.06)] space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <Skeleton className="w-7 h-7 rounded-full" />
                                                                <Skeleton className="h-4 w-24 rounded-lg" />
                                                            </div>
                                                            <Skeleton className="h-4 w-full rounded-lg" />
                                                            <Skeleton className="h-4 w-3/4 rounded-lg" />
                                                            <Skeleton className="h-3 w-16 rounded-lg" />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : comments.length === 0 ? (
                                                <div className="text-center py-12 space-y-3">
                                                    <IconMessage className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                                                    <p className="text-sm text-muted-foreground">
                                                        {searchText || sentimentFilter
                                                            ? "No hay comentarios que coincidan con los filtros aplicados."
                                                            : post?.commentCount && post.commentCount > 0
                                                            ? "Los comentarios aún no se han extraído. Usa el botón Extraer para obtenerlos."
                                                            : "No hay comentarios guardados para este video."}
                                                    </p>
                                                    {!searchText && !sentimentFilter && (
                                                        <Button onClick={handleExtract} disabled={extracting} variant="outline" className="rounded-2xl gap-2">
                                                            {extracting ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <IconDownload className="w-4 h-4" />}
                                                            Extraer comentarios
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="space-y-3 pr-1">
                                                        {comments
                                                            .filter((c) => !sentimentFilter || c.sentimentLabel === sentimentFilter)
                                                            .filter((c) => !searchText || c.text.toLowerCase().includes(searchText.toLowerCase()) || (c.authorUsername || "").toLowerCase().includes(searchText.toLowerCase()))
                                                            .map((comment) => {
                                                                const confidence = comment.sentimentScore ? Math.round(Math.abs(comment.sentimentScore) * 100) : null;
                                                                const colorIndex = (comment.authorUsername || "").length % 5;
                                                                const avatarColors = ["bg-pink-100 text-pink-700", "bg-blue-100 text-blue-700", "bg-amber-100 text-amber-700", "bg-emerald-100 text-emerald-700", "bg-purple-100 text-purple-700"];
                                                                return (
                                                            <div
                                                                key={comment.id}
                                                                className="group p-4 rounded-xl bg-[rgba(108,72,197,0.02)] border border-[rgba(108,72,197,0.06)] space-y-2 hover:bg-[rgba(108,72,197,0.04)] hover:border-[rgba(108,72,197,0.12)] transition-all duration-150"
                                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className={`w-7 h-7 rounded-full ${avatarColors[colorIndex]} flex items-center justify-center text-[11px] font-bold shrink-0`}>
                                                            {(comment.authorUsername || "?").charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm font-semibold text-foreground truncate">
                                                            @{comment.authorUsername || "anónimo"}
                                                        </span>
                                                        {comment.sentimentLabel && (
                                                            <span
                                                                title={comment.sentimentReason || ""}
                                                                className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                                                                    comment.sentimentLabel === "POSITIVO"
                                                                        ? "bg-green-100 text-green-700"
                                                                        : comment.sentimentLabel === "NEGATIVO"
                                                                        ? "bg-red-100 text-red-700"
                                                                        : "bg-gray-100 text-gray-600"
                                                                }`}
                                                            >
                                                                {comment.sentimentLabel === "POSITIVO" ? (
                                                                    <IconMoodSmile className="w-3 h-3" />
                                                                ) : comment.sentimentLabel === "NEGATIVO" ? (
                                                                    <IconMoodSad className="w-3 h-3" />
                                                                ) : (
                                                                    <IconMoodEmpty className="w-3 h-3" />
                                                                )}
                                                                {comment.sentimentLabel === "POSITIVO" ? "Positivo"
                                                                    : comment.sentimentLabel === "NEGATIVO" ? "Negativo"
                                                                    : "Neutro"}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        {confidence !== null && (
                                                            <span
                                                                title={`Confianza: ${confidence}%`}
                                                                className={`text-[10px] font-medium ${
                                                                    confidence >= 70 ? "text-green-600" : confidence >= 40 ? "text-amber-600" : "text-muted-foreground"
                                                                }`}
                                                            >
                                                                {confidence}%
                                                            </span>
                                                        )}
                                                        <span className="text-[11px] text-muted-foreground">
                                                            {comment.createTimeISO
                                                                ? new Date(comment.createTimeISO).toLocaleDateString("es-ES", {
                                                                      year: "numeric",
                                                                      month: "short",
                                                                      day: "numeric",
                                                                  })
                                                                : ""}
                                                        </span>
                                                        <button
                                                            onClick={() => { navigator.clipboard.writeText(comment.text); toast.success("Texto copiado"); }}
                                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-[rgba(108,72,197,0.06)] text-muted-foreground hover:text-foreground"
                                                            title="Copiar texto"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                                                <p className="text-sm text-foreground leading-relaxed break-words">
                                                                    {comment.text}
                                                                </p>
                                                                <div className="flex items-center gap-3 text-[11px]">
                                                                    <span className="flex items-center gap-1 text-muted-foreground" title="Likes">
                                                                        <IconHeart className="w-3 h-3" />
                                                                        {comment.diggCount}
                                                                    </span>
                                                                    {comment.replyCount > 0 && (
                                                                        <span className="text-muted-foreground" title="Respuestas">
                                                                            {comment.replyCount} respuestas
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                                );
                                                            })}
                                                    </div>

                                                    {/* Pagination */}
                                                    {pagination.totalPages > 1 && (
                                                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-border flex-wrap gap-3">
                                                            <p className="text-[11px] text-muted-foreground">
                                                                Mostrando {((pagination.page - 1) * pagination.limit) + 1}–
                                                                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex gap-1">
                                                                    <button
                                                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                                        disabled={pagination.page <= 1}
                                                                        className="p-1.5 rounded-lg hover:bg-[rgba(108,72,197,0.06)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                                        title="Página anterior"
                                                                    >
                                                                        <IconChevronLeft className="w-4 h-4 text-muted-foreground" />
                                                                    </button>
                                                                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                                                        .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                                                                        .map((p, idx, arr) => (
                                                                            <span key={p} className="flex items-center">
                                                                                {idx > 0 && arr[idx - 1] !== p - 1 && (
                                                                                    <span className="px-1 text-[11px] text-muted-foreground">...</span>
                                                                                )}
                                                                                <button
                                                                                    onClick={() => setPage(p)}
                                                                                    className={`min-w-[28px] h-7 text-[11px] font-medium rounded-lg transition-colors ${
                                                                                        pagination.page === p
                                                                                            ? "bg-primary/10 text-primary"
                                                                                            : "text-muted-foreground hover:bg-[rgba(108,72,197,0.04)]"
                                                                                    }`}
                                                                                >
                                                                                    {p}
                                                                                </button>
                                                                            </span>
                                                                        ))}
                                                                    <button
                                                                        onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                                                                        disabled={pagination.page >= pagination.totalPages}
                                                                        className="p-1.5 rounded-lg hover:bg-[rgba(108,72,197,0.06)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                                        title="Página siguiente"
                                                                    >
                                                                        <IconChevronRight className="w-4 h-4 text-muted-foreground" />
                                                                    </button>
                                                                </div>
                                                                <span className="text-[11px] text-muted-foreground">Ir a</span>
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    max={pagination.totalPages}
                                                                    value={goToPage}
                                                                    onChange={(e) => setGoToPage(e.target.value)}
                                                                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                                                                        if (e.key === "Enter") {
                                                                            const p = parseInt(goToPage);
                                                                            if (p >= 1 && p <= pagination.totalPages) {
                                                                                setPage(p);
                                                                                setGoToPage("");
                                                                            }
                                                                        }
                                                                    }}
                                                                    className="w-14 h-7 text-[11px] text-center rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                    placeholder="N°"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

    );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DummyVideo {
    id: string;
    desc: string;
    views: number;
    likes: number;
    comments: number;
    saves: number;
    duration: number;
    engagement_rate: number;
    engagement_level: string;
}

type DummyJson = {
    data?: {
        profile?: {
            username?: string;
        };
        videos?: DummyVideo[];
    };
};

export default function InfluencerPostCommentsPage() {
    const params = useParams();
    const videoId = String(params?.videoId || "");

    const [loading, setLoading] = useState(true);
    const [video, setVideo] = useState<DummyVideo | null>(null);
    const [username, setUsername] = useState<string>("influencer");
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<{
        faqs: string[];
        feedback: string[];
        issues: string[];
        summary: string;
    } | null>(null);

    useEffect(() => {
        const loadDummy = async () => {
            try {
                const res = await fetch("/json-influencers.json");
                const json = (await res.json()) as DummyJson;
                const allVideos = json.data?.videos ?? [];
                const found = allVideos.find((v) => String(v.id) === videoId) ?? null;
                setVideo(
                    found && {
                        id: String(found.id),
                        desc: found.desc ?? "",
                        views: found.views ?? 0,
                        likes: found.likes ?? 0,
                        comments: found.comments ?? 0,
                        saves: found.saves ?? 0,
                        duration: found.duration ?? 0,
                        engagement_rate: found.engagement_rate ?? 0,
                        engagement_level: found.engagement_level ?? "estándar",
                    }
                );
                if (json.data?.profile?.username) {
                    setUsername(json.data.profile.username);
                }
            } catch (error) {
                console.error("Error cargando dummy de comentarios:", error);
            } finally {
                setLoading(false);
            }
        };

        void loadDummy();
    }, [videoId]);

    const formatNumber = (value: number | string) => {
        const num = typeof value === "string" ? Number(value) : value;
        if (Number.isNaN(num)) return "-";
        if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
        return num.toLocaleString("es-ES");
    };

    const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

    const handleAnalyze = () => {
        if (!video) return;
        setAnalyzing(true);
        // Simulación de análisis con IA (Gemini) en frontend
        setTimeout(() => {
            setAnalysis({
                faqs: [
                    "¿Qué beneficios concretos obtengo usando Takenos en mis campañas con influencers?",
                    "¿La plataforma se integra con TikTok e Instagram para traer métricas automáticamente?",
                    "¿Puedo exportar los resultados a Excel o compartirlos con mi equipo?",
                ],
                feedback: [
                    "La visualización de ROI por campaña es clara, pero sería útil ver ejemplos concretos por influencer.",
                    "A los usuarios les gusta tener todos los datos en un solo dashboard en lugar de usar hojas de cálculo.",
                ],
                issues: [
                    "Algunos usuarios comentan que no tienen claro cómo definir el objetivo de campaña dentro de la app.",
                    "Se mencionan dudas sobre cómo se calculan ciertas métricas avanzadas, como el NAU.",
                ],
                summary:
                    "Los comentarios se concentran en entender mejor cómo Takenos calcula el impacto de cada influencer, " +
                    "cómo se integran las redes sociales y cómo aprovechar los reportes para tomar decisiones rápidas. " +
                    "Hay oportunidad de educar al usuario con guías cortas dentro de la app y contenidos que expliquen casos reales.",
            });
            setAnalyzing(false);
        }, 600);
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
                            <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
                                <div className="space-y-1">
                                    <PageBreadcrumb />
                                    <h1 className="text-[24px] font-bold text-[#1A1A2E]">Conversaciones en este video</h1>
                                    <p className="text-[14px] text-[#6B6B8D]">
                                        Aquí puedes revisar de forma sencilla qué están preguntando y comentando las personas en un
                                        contenido concreto.
                                    </p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center py-12 text-[#6B6B8D]">Cargando comentarios...</div>
                            ) : !video ? (
                                <div className="text-center py-12 text-[#6B6B8D]">No se encontró información dummy para este video.</div>
                            ) : (
                                <div className="w-full max-w-6xl grid gap-4 grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
                                    {/* Card: detalle del video */}
                                    <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
                                        <CardHeader>
                                            <CardTitle className="text-[18px] font-bold text-[#1A1A2E]">Resumen del video</CardTitle>
                                            <CardDescription className="text-[14px] text-[#6B6B8D]">
                                                @{username} · ID {video.id}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4 text-sm">
                                            <div className="rounded-xl bg-[rgba(108,72,197,0.03)] p-3">
                                                <p className="text-xs text-[#6B6B8D] mb-1">Descripción del contenido</p>
                                                <p className="text-sm text-[#1A1A2E]">{video.desc || "Sin descripción"}</p>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                <div>
                                                    <p className="text-[11px] text-[#6B6B8D] mb-1">Vistas</p>
                                                    <p className="text-sm font-semibold text-[#1A1A2E]">{formatNumber(video.views)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] text-[#6B6B8D] mb-1">Likes</p>
                                                    <p className="text-sm font-semibold text-[#1A1A2E]">{formatNumber(video.likes)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] text-[#6B6B8D] mb-1">Comentarios</p>
                                                    <p className="text-sm font-semibold text-[#1A1A2E]">{formatNumber(video.comments)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] text-[#6B6B8D] mb-1">Engagement del video</p>
                                                    <p className="text-sm font-semibold text-[#1A1A2E]">
                                                        {formatPercent(video.engagement_rate)}
                                                    </p>
                                                    <p className="text-[11px] text-[#6B6B8D]">Nivel {video.engagement_level}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Card: comentarios + análisis IA */}
                                    <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
                                        <CardHeader>
                                            <CardTitle className="text-[18px] font-bold text-[#1A1A2E]">
                                                Comentarios y análisis del video
                                            </CardTitle>
                                            <CardDescription className="text-[14px] text-[#6B6B8D]">
                                                Ejemplos de preguntas y feedback que Takenos podría analizar con IA.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4 text-sm">
                                            <Button
                                                type="button"
                                                className="w-full rounded-2xl bg-[#6C48C5] hover:bg-[#5B3AB0] text-white border-0 transition-all duration-200 disabled:opacity-80 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                disabled={analyzing}
                                                onClick={handleAnalyze}
                                            >
                                                {analyzing && (
                                                    <span className="inline-flex h-4 w-4">
                                                        <span className="animate-spin h-4 w-4 rounded-full border-2 border-white border-t-transparent" />
                                                    </span>
                                                )}
                                                {analyzing ? "Analizando comentarios..." : "Ver resumen automático de comentarios"}
                                            </Button>

                                            <div className="space-y-3">
                                                <p className="text-xs text-[#6B6B8D]">
                                                    Ejemplos de comentarios que suelen aparecer en este tipo de contenido:
                                                </p>
                                                <ul className="space-y-2">
                                                    <li className="bg-[#F9FAFB] rounded-lg px-3 py-2 text-[#1A1A2E] text-xs md:text-sm">
                                                        “¿Este video pertenece a una campaña específica o es contenido orgánico?” — Equipo
                                                        marketing
                                                    </li>
                                                    <li className="bg-[#F9FAFB] rounded-lg px-3 py-2 text-[#1A1A2E] text-xs md:text-sm">
                                                        “Muchos usuarios están preguntando por el precio, ¿podemos fijar un mensaje
                                                        destacado con la info?” — Social media
                                                    </li>
                                                    <li className="bg-[#F9FAFB] rounded-lg px-3 py-2 text-[#1A1A2E] text-xs md:text-sm">
                                                        “Veo dudas sobre disponibilidad en otros países, ¿armamos un contenido de FAQs
                                                        internacionales?” — Growth
                                                    </li>
                                                </ul>
                                            </div>

                                            {analysis && (
                                                <div className="pt-4 border-top border-[rgba(148,163,184,0.3)] space-y-4">
                                                    <div className="rounded-xl bg-[#F9FAFB] px-4 py-3">
                                                        <p className="text-[11px] md:text-xs text-[#6B6B8D] mb-1 font-medium">
                                                            Resumen para el equipo de marketing
                                                        </p>
                                                        <p className="text-xs md:text-sm text-[#1F2933] leading-relaxed">
                                                            {analysis.summary}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-[#6B6B8D] mb-1 uppercase tracking-wide">
                                                            Preguntas frecuentes que se repiten
                                                        </p>
                                                        <ul className="list-disc list-inside text-xs md:text-sm text-[#1F2933] space-y-1">
                                                            {analysis.faqs.map((q) => (
                                                                <li key={q}>{q}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-[#6B6B8D] mb-1 uppercase tracking-wide">
                                                            Comentarios y feedback de la audiencia
                                                        </p>
                                                        <ul className="list-disc list-inside text-xs md:text-sm text-[#1F2933] space-y-1">
                                                            {analysis.feedback.map((f) => (
                                                                <li key={f}>{f}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-[#6B6B8D] mb-1 uppercase tracking-wide">
                                                            Posibles fricciones o puntos de mejora
                                                        </p>
                                                        <ul className="list-disc list-inside text-xs md:text-sm text-[#1F2933] space-y-1">
                                                            {analysis.issues.map((i) => (
                                                                <li key={i}>{i}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            )}
                                            {!analysis && !analyzing && (
                                                <p className="text-[11px] text-[#9CA3AF]">
                                                    Haz clic en “Ver resumen automático de comentarios” para ver, en un solo lugar, las
                                                    preguntas más frecuentes, el feedback y oportunidades de mejora que podrías convertir en
                                                    acciones de marketing.
                                                </p>
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

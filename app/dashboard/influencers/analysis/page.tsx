"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    IconSearch,
    IconLoader2,
    IconBrandTiktok,
    IconUsers,
    IconUserPlus,
    IconHeart,
    IconVideo,
    IconCheck,
    IconAlertCircle,
} from "@tabler/icons-react";
import { toast } from "sonner";

interface Author {
    id: string;
    name: string;
    nickName: string;
    verified: boolean;
    signature: string;
    avatar: string;
    fans: number;
    following: number;
    heart: number;
    video: number;
}

interface ScraperResult {
    author: Author;
}

interface ScraperResponse {
    profiles: string[];
    total: number;
    results: ScraperResult[];
}

const EXTRACT_STEPS = [
    { key: "connecting", label: "Conectando con TikTok" },
    { key: "extracting", label: "Extrayendo datos del perfil" },
    { key: "processing", label: "Procesando información" },
] as const;

function AnalysisPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [value, setValue] = useState(searchParams.get("username") || "");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [author, setAuthor] = useState<Author | null>(null);
    const [rawData, setRawData] = useState<ScraperResponse | null>(null);
    const [savedId, setSavedId] = useState<number | null>(null);
    const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [error, setError] = useState<string | null>(null);

    const runStep = (stepIndex: number, delay: number) =>
        new Promise<void>((resolve) => {
            setCurrentStep(stepIndex);
            setTimeout(resolve, delay);
        });

    useEffect(() => {
        return () => {
            if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
        };
    }, []);

    const handleExtract = async () => {
        const trimmed = value.trim();
        if (!trimmed) {
            setError("Ingresa un nombre de usuario o URL de TikTok.");
            return;
        }
        setError(null);
        setAuthor(null);
        setRawData(null);
        setSavedId(null);
        setLoading(true);

        try {
            await runStep(0, 400);
            await runStep(1, 300);

            const res = await fetch("/api/scraping/tiktok", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: trimmed }),
            });

            await runStep(2, 300);

            const body = await res.text();
            let data: ScraperResponse;
            try { data = JSON.parse(body); } catch { data = {} as ScraperResponse; }

            if (!res.ok) {
                setError((data as any)?.error || "No se pudieron obtener los datos de este perfil.");
                return;
            }

            if (!data.results || data.results.length === 0) {
                setError("No se encontraron resultados para este perfil.");
                return;
            }

            setRawData(data);
            setAuthor(data.results[0].author);
            toast.success("Perfil extraído correctamente");
        } catch {
            setError("Ocurrió un error al conectar con TikTok. Verifica que el usuario exista.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!rawData) return;
        setSaving(true);
        try {
            const res = await fetch("/api/influencers/save-scraped", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scrapedData: rawData }),
            });

            const body = await res.text();
            let data;
            try { data = JSON.parse(body); } catch { data = {}; }

            if (!res.ok) {
                toast.error(data?.error || "Error al guardar el perfil.");
                return;
            }

            const id = data?.data?.id;
            if (id) {
                setSavedId(id);
                toast.success("Perfil guardado correctamente");
                redirectTimerRef.current = setTimeout(() => router.push(`/dashboard/influencers/${id}`), 800);
            } else {
                toast.error("Error al guardar: no se recibió el ID del perfil.");
            }
        } catch {
            toast.error("Error al guardar los datos.");
        } finally {
            setSaving(false);
        }
    };

    return (

                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 bg-muted min-h-full">
                            {/* Breadcrumb + Header */}
                            <div className="flex flex-col gap-2 mb-2">
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
                                            <BreadcrumbPage>Análisis</BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </BreadcrumbList>
                                </Breadcrumb>
                                <h1 className="text-[28px] font-bold text-foreground mb-1">
                                    Análisis de perfil TikTok
                                </h1>
                                <p className="text-[16px] text-muted-foreground">
                                    Ingresa un usuario de TikTok para extraer los datos del perfil y guardarlos en tu base de datos.
                                </p>
                            </div>

                            {/* Input Card */}
                            <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                <CardHeader>
                                    <CardTitle className="text-[18px] font-bold text-foreground flex items-center gap-2">
                                        <IconBrandTiktok className="w-5 h-5" />
                                        Extraer perfil de TikTok
                                    </CardTitle>
                                    <CardDescription className="text-[14px] text-muted-foreground">
                                        Pega un usuario o URL de TikTok para analizar y almacenar los datos.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label className="text-[14px] font-semibold text-foreground mb-2 block">
                                            Usuario o URL
                                        </Label>
                                        <div className="relative">
                                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                className="pl-9 rounded-2xl h-11"
                                                placeholder="@usuario o https://www.tiktok.com/@..."
                                                value={value}
                                                onChange={(e) => setValue(e.target.value)}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Ejemplos: <span className="font-mono">@maria.beauty</span> o{" "}
                                            <span className="font-mono">https://www.tiktok.com/@maria.beauty</span>
                                        </p>
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 bg-destructive/10 text-destructive text-sm rounded-xl px-4 py-3">
                                            <IconAlertCircle className="w-4 h-4 shrink-0" />
                                            {error}
                                        </div>
                                    )}

                                    {loading && (
                                        <div className="space-y-4">
                                            <div className="bg-[rgba(108,72,197,0.04)] rounded-xl p-4 space-y-3">
                                                {EXTRACT_STEPS.map((step, i) => (
                                                    <div key={step.key} className="flex items-center gap-3 text-sm">
                                                        <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                                            {i < currentStep ? (
                                                                <IconCheck className="w-4 h-4 text-green-500" />
                                                            ) : i === currentStep ? (
                                                                <IconLoader2 className="w-4 h-4 animate-spin text-primary" />
                                                            ) : (
                                                                <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/20" />
                                                            )}
                                                        </div>
                                                        <span
                                                            className={
                                                                i <= currentStep
                                                                    ? "text-foreground font-medium"
                                                                    : "text-muted-foreground/40"
                                                            }
                                                        >
                                                            {step.label}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Preview skeleton */}
                                            <div className="rounded-[20px] border border-[rgba(108,72,197,0.06)] bg-background p-5 space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <Skeleton className="h-12 w-12 rounded-full" />
                                                    <div className="space-y-1.5">
                                                        <Skeleton className="h-4 w-32 rounded-lg" />
                                                        <Skeleton className="h-3 w-20 rounded-lg" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    {Array.from({ length: 4 }).map((_, i) => (
                                                        <div key={i} className="space-y-1.5">
                                                            <Skeleton className="h-6 w-16 rounded-lg" />
                                                            <Skeleton className="h-3 w-12 rounded-lg" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end">
                                        <Button
                                            onClick={handleExtract}
                                            disabled={loading}
                                            className="rounded-2xl px-6 h-11 gap-2"
                                        >
                                            {loading ? (
                                                <>
                                                    <IconLoader2 className="w-4 h-4 animate-spin" />
                                                    Extrayendo...
                                                </>
                                            ) : (
                                                <>
                                                    <IconSearch className="w-4 h-4" />
                                                    Extraer perfil
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Result Preview */}
                            {author && (
                                <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                    <CardHeader>
                                        <CardTitle className="text-[18px] font-bold text-foreground flex items-center gap-2">
                                            <IconCheck className="w-5 h-5 text-green-500" />
                                            Perfil extraído correctamente
                                        </CardTitle>
                                        <CardDescription className="text-[14px] text-muted-foreground">
                                            Revisa los datos del perfil antes de guardarlos en tu base de datos.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-col sm:flex-row gap-6">
                                            <div className="flex flex-col items-center gap-3 shrink-0">
                                                <Avatar className="h-20 w-20">
                                                    <AvatarImage src={author.avatar} alt={author.name} />
                                                    <AvatarFallback className="text-lg">
                                                        {(author.name || "?").slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {author.verified && (
                                                    <Badge className="bg-blue-100 text-blue-700 text-[10px]">
                                                        Verificado
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <div>
                                                    <p className="text-lg font-bold text-foreground">
                                                        @{author.name}
                                                    </p>
                                                    {author.nickName && (
                                                        <p className="text-sm text-muted-foreground">{author.nickName}</p>
                                                    )}
                                                </div>
                                                {author.signature && (
                                                    <p className="text-sm text-muted-foreground italic leading-relaxed">
                                                        &ldquo;{author.signature}&rdquo;
                                                    </p>
                                                )}
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                    <div className="bg-[rgba(108,72,197,0.04)] rounded-xl p-3 text-center">
                                                        <IconUsers className="w-4 h-4 text-primary mx-auto mb-1" />
                                                        <p className="text-lg font-bold text-foreground">
                                                            {(author.fans ?? 0).toLocaleString()}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">Seguidores</p>
                                                    </div>
                                                    <div className="bg-[rgba(108,72,197,0.04)] rounded-xl p-3 text-center">
                                                        <IconUserPlus className="w-4 h-4 text-primary mx-auto mb-1" />
                                                        <p className="text-lg font-bold text-foreground">
                                                            {(author.following ?? 0).toLocaleString()}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">Seguidos</p>
                                                    </div>
                                                    <div className="bg-[rgba(108,72,197,0.04)] rounded-xl p-3 text-center">
                                                        <IconHeart className="w-4 h-4 text-primary mx-auto mb-1" />
                                                        <p className="text-lg font-bold text-foreground">
                                                            {(author.heart ?? 0).toLocaleString()}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">Likes totales</p>
                                                    </div>
                                                    <div className="bg-[rgba(108,72,197,0.04)] rounded-xl p-3 text-center">
                                                        <IconVideo className="w-4 h-4 text-primary mx-auto mb-1" />
                                                        <p className="text-lg font-bold text-foreground">
                                                            {(author.video ?? 0).toLocaleString()}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">Videos</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {savedId && (
                                            <div className="mt-4 bg-green-50 dark:bg-green-950/20 rounded-xl p-4 flex items-center justify-between">
                                                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                                                    Perfil guardado. Redirigiendo...
                                                </p>
                                                <IconLoader2 className="w-4 h-4 animate-spin text-green-500" />
                                            </div>
                                        )}

                                        {!savedId && (
                                            <div className="mt-4 flex justify-end gap-2 pt-4 border-t border-border">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setAuthor(null);
                                                        setRawData(null);
                                                        setValue("");
                                                    }}
                                                    className="rounded-2xl"
                                                >
                                                    Descartar
                                                </Button>
                                                <Button
                                                    onClick={handleSave}
                                                    disabled={saving}
                                                    className="rounded-2xl gap-2"
                                                >
                                                    {saving ? (
                                                        <>
                                                            <IconLoader2 className="w-4 h-4 animate-spin" />
                                                            Guardando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <IconCheck className="w-4 h-4" />
                                                            Guardar y ver perfil
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
    );
}

export default function AnalysisPageWrapper() {
    return (
        <Suspense fallback={
            <div className="flex flex-1 flex-col p-6 gap-4 bg-muted">
                <Skeleton className="h-5 w-48 rounded-xl" />
                <Skeleton className="h-8 w-72 rounded-xl" />
                <Skeleton className="h-4 w-64 rounded-xl" />
                <Skeleton className="h-48 rounded-[20px]" />
            </div>
        }>
            <AnalysisPage />
        </Suspense>
    );
}

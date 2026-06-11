"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { IconSearch, IconLoader2, IconCopy, IconDeviceFloppy } from "@tabler/icons-react";
import { toast } from "sonner";

export default function InfluencerSimulationPage() {
    const router = useRouter();
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [jsonResult, setJsonResult] = useState<string | null>(null);
    const [savedInfluencerId, setSavedInfluencerId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleScrape = async () => {
        const trimmed = value.trim();
        if (!trimmed) {
            setError("Ingresa un nombre de usuario o URL.");
            return;
        }
        setError(null);
        setJsonResult(null);
        setSavedInfluencerId(null);
        setLoading(true);

        try {
            const res = await fetch("/api/scraping/tiktok", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: trimmed }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError((data && data.error) || "Error al obtener datos del scraper.");
                return;
            }

            setJsonResult(JSON.stringify(data, null, 2));
        } catch {
            setError("Ocurrió un error al obtener los datos.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveToDb = async () => {
        if (!jsonResult) return;
        setSaving(true);
        try {
            const parsedData = JSON.parse(jsonResult);
            const res = await fetch("/api/influencers/save-scraped", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scrapedData: parsedData }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data?.error || "Error al guardar en la base de datos.");
                return;
            }

            const influencerId = data?.data?.id;
            if (influencerId) {
                setSavedInfluencerId(influencerId);
                toast.success("Datos guardados correctamente en la base de datos.");
            }
        } catch {
            toast.error("Error al guardar los datos.");
        } finally {
            setSaving(false);
        }
    };

    const handleCopy = async () => {
        if (!jsonResult) return;
        await navigator.clipboard.writeText(jsonResult);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 bg-muted min-h-full">
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
                                            <BreadcrumbPage>Analizar perfil TikTok</BreadcrumbPage>
                                        </BreadcrumbItem>
                                    </BreadcrumbList>
                                </Breadcrumb>
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <h1 className="text-[28px] font-bold text-foreground mb-1">
                                            Analizar perfil de TikTok
                                        </h1>
                                        <p className="text-[16px] text-muted-foreground">
                                            Ingresa un usuario o enlace de perfil para obtener y guardar los datos.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Form */}
                            <Card className="rounded-[20px] border-primary/10 shadow-[0_4px_20px_rgba(108,72,197,0.08)]">
                                <CardHeader>
                                    <CardTitle className="text-[18px] font-bold text-foreground">Analizar un perfil de TikTok</CardTitle>
                                    <CardDescription className="text-[14px] text-muted-foreground">
                                        Ingresa un usuario o enlace de perfil para scrapear, ver el JSON y guardar los datos en la base de
                                        datos.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <Label className="text-[14px] font-semibold text-foreground mb-2 block">TikTok</Label>
                                            <div className="relative">
                                                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    className="pl-9 rounded-2xl"
                                                    placeholder="@usuario o https://..."
                                                    value={value}
                                                    onChange={(e) => setValue(e.target.value)}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Ejemplos: <span className="font-mono">@maria.beauty</span> o{" "}
                                                <span className="font-mono">https://www.tiktok.com/@maria.beauty</span>
                                            </p>
                                        </div>
                                    </div>
                                    {error && <p className="text-xs text-destructive">{error}</p>}
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            onClick={handleScrape}
                                            disabled={loading}
                                            className="bg-gradient-to-r from-primary/80 to-primary text-white rounded-2xl px-6"
                                        >
                                            {loading ? (
                                                <span className="flex items-center gap-2">
                                                    <IconLoader2 className="w-4 h-4 animate-spin" />
                                                    Scrapeando...
                                                </span>
                                            ) : (
                                                "Obtener datos JSON"
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* JSON Result */}
                            {jsonResult && (
                                <Card className="rounded-[20px] border-primary/10 shadow-[0_4px_20px_rgba(108,72,197,0.08)]">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="text-[18px] font-bold text-foreground">Respuesta JSON</CardTitle>
                                            <CardDescription className="text-[14px] text-muted-foreground">
                                                Datos obtenidos del scraper de TikTok.
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-2xl gap-2">
                                                <IconCopy className="w-4 h-4" />
                                                {copied ? "Copiado" : "Copiar"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleSaveToDb}
                                                disabled={saving}
                                                className="rounded-2xl gap-2 bg-primary text-white"
                                            >
                                                {saving ? (
                                                    <IconLoader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <IconDeviceFloppy className="w-4 h-4" />
                                                )}
                                                {saving ? "Guardando..." : "Guardar en BD"}
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <pre className="bg-muted p-4 rounded-xl overflow-auto max-h-[600px] text-xs leading-relaxed">
                                            {jsonResult}
                                        </pre>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Saved confirmation */}
                            {savedInfluencerId && (
                                <Card className="rounded-[20px] border-green-200 bg-green-50 dark:bg-green-950/20 shadow-sm">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <p className="text-sm text-green-700 dark:text-green-300">
                                            Datos guardados correctamente. El influencer ya está en la base de datos.
                                        </p>
                                        <Button
                                            onClick={() => router.push(`/dashboard/influencers/${savedInfluencerId}`)}
                                            className="rounded-2xl"
                                        >
                                            Ver detalle del influencer
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

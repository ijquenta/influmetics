"use client";

import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { IconPlus, IconTrash } from "@tabler/icons-react";

interface MetricRow {
    id: string;
    postId: string;
    snapshotDate: string;
    views?: string;
    likes?: string;
    shares?: string;
    clicks?: string;
    conversions?: string;
    revenue?: string;
}

interface SimpleCampaign {
    id: number;
    name: string;
}

interface SimpleInfluencer {
    id: number;
    name: string;
}

interface SimplePost {
    id: number;
    influencer: { id: number; name: string };
    socialPlatform: { id: number; name: string };
    publishedAt: string;
}

export default function MetricsPage() {
    const [campaigns, setCampaigns] = useState<SimpleCampaign[]>([]);
    const [influencers, setInfluencers] = useState<SimpleInfluencer[]>([]);
    const [posts, setPosts] = useState<SimplePost[]>([]);
    const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
    const [selectedInfluencer, setSelectedInfluencer] = useState<string>("all");
    const [rows, setRows] = useState<MetricRow[]>([
        {
            id: "1",
            postId: "",
            snapshotDate: new Date().toISOString().split("T")[0],
            views: "",
            likes: "",
            shares: "",
            clicks: "",
            conversions: "",
            revenue: "",
        },
    ]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCampaigns();
        fetchInfluencers();
    }, []);

    useEffect(() => {
        if (selectedInfluencer && selectedInfluencer !== "all") {
            fetchPosts();
        } else {
            setPosts([]);
        }
    }, [selectedInfluencer, selectedCampaign]);

    const fetchCampaigns = async () => {
        try {
            const res = await fetch("/api/campaigns");
            const data = await res.json();
            setCampaigns(data.data || []);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        }
    };

    const fetchInfluencers = async () => {
        try {
            const res = await fetch("/api/influencers");
            const data = await res.json();
            setInfluencers(data.data || []);
        } catch (error) {
            console.error("Error fetching influencers:", error);
        }
    };

    const fetchPosts = async () => {
        try {
            const params = new URLSearchParams();
            if (selectedInfluencer && selectedInfluencer !== "all") params.append("influencerId", selectedInfluencer);
            if (selectedCampaign && selectedCampaign !== "all") params.append("campaignId", selectedCampaign);

            const res = await fetch(`/api/posts?${params.toString()}`);
            const data = await res.json();
            setPosts(data.data || []);
        } catch (error) {
            console.error("Error fetching posts:", error);
        }
    };

    const addRow = () => {
        setRows([
            ...rows,
            {
                id: Date.now().toString(),
                postId: "",
                snapshotDate: new Date().toISOString().split("T")[0],
                views: "",
                likes: "",
                shares: "",
                clicks: "",
                conversions: "",
                revenue: "",
            },
        ]);
    };

    const removeRow = (id: string) => {
        if (rows.length > 1) {
            setRows(rows.filter((row) => row.id !== id));
        }
    };

    const updateRow = (id: string, field: keyof MetricRow, value: string) => {
        setRows(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const metrics = rows
                .filter((row) => row.postId && row.snapshotDate)
                .map((row) => ({
                    postId: parseInt(row.postId),
                    snapshotDate: row.snapshotDate,
                    views: row.views ? parseInt(row.views) : null,
                    likes: row.likes ? parseInt(row.likes) : null,
                    shares: row.shares ? parseInt(row.shares) : null,
                    clicks: row.clicks ? parseInt(row.clicks) : null,
                    conversions: row.conversions ? parseInt(row.conversions) : null,
                    revenue: row.revenue ? parseFloat(row.revenue) : null,
                }));

            if (metrics.length === 0) {
                toast.error("Debes completar al menos una fila con Post y Fecha");
                return;
            }

            const res = await fetch("/api/metrics/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ metrics }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(`${data.summary.successful} métricas guardadas exitosamente`);
                // Limpiar formulario
                setRows([
                    {
                        id: Date.now().toString(),
                        postId: "",
                        snapshotDate: new Date().toISOString().split("T")[0],
                        views: "",
                        likes: "",
                        shares: "",
                        clicks: "",
                        conversions: "",
                        revenue: "",
                    },
                ]);
                setSelectedCampaign("all");
                setSelectedInfluencer("all");
            } else {
                throw new Error(data.error || "Error al guardar métricas");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al guardar métricas");
        } finally {
            setLoading(false);
        }
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
                            <div className="mb-6">
                                <h1 className="text-[28px] font-bold text-[#1A1A2E] mb-2">Cargar Métricas</h1>
                                <p className="text-[16px] text-[#6B6B8D]">Ingresa las métricas de los posts manualmente</p>
                            </div>

                            <Card className="rounded-[20px] border-[rgba(108,72,197,0.1)] shadow-[0_4px_20px_rgba(108,72,197,0.08)]">
                                <CardHeader>
                                    <CardTitle className="text-[20px] font-bold text-[#1A1A2E]">Formulario de Métricas</CardTitle>
                                    <CardDescription className="text-[14px] text-[#6B6B8D]">
                                        Completa los campos para cada post. Puedes agregar múltiples filas para cargar varias métricas a la
                                        vez.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* Filtros */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <div>
                                                <Label htmlFor="campaign" className="text-[14px] font-semibold text-[#1A1A2E] mb-2">
                                                    Campaña (opcional)
                                                </Label>
                                                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                                                    <SelectTrigger id="campaign" className="rounded-2xl">
                                                        <SelectValue placeholder="Selecciona una campaña" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Todas las campañas</SelectItem>
                                                        {campaigns.map((campaign) => (
                                                            <SelectItem key={campaign.id} value={campaign.id.toString()}>
                                                                {campaign.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label htmlFor="influencer" className="text-[14px] font-semibold text-[#1A1A2E] mb-2">
                                                    Influencer (opcional)
                                                </Label>
                                                <Select value={selectedInfluencer} onValueChange={setSelectedInfluencer}>
                                                    <SelectTrigger id="influencer" className="rounded-2xl">
                                                        <SelectValue placeholder="Selecciona un influencer" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">Todos los influencers</SelectItem>
                                                        {influencers.map((influencer) => (
                                                            <SelectItem key={influencer.id} value={influencer.id.toString()}>
                                                                {influencer.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Tabla de métricas */}
                                        <div className="space-y-4">
                                            {rows.map((row, index) => (
                                                <Card key={row.id} className="rounded-2xl border-[rgba(108,72,197,0.1)] p-4">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-[16px] font-semibold text-[#1A1A2E]">Métrica #{index + 1}</h3>
                                                        {rows.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeRow(row.id)}
                                                                className="text-[#EF4444] hover:text-[#DC2626]"
                                                            >
                                                                <IconTrash className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                        <div>
                                                            <Label htmlFor={`post-${row.id}`} className="text-[12px] text-[#6B6B8D]">
                                                                Post *
                                                            </Label>
                                                            <Select
                                                                value={row.postId}
                                                                onValueChange={(value) => updateRow(row.id, "postId", value)}
                                                            >
                                                                <SelectTrigger id={`post-${row.id}`} className="rounded-2xl">
                                                                    <SelectValue placeholder="Selecciona un post" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {posts.length === 0 ? (
                                                                        <SelectItem value="no-posts" disabled>
                                                                            {selectedInfluencer && selectedInfluencer !== "all"
                                                                                ? "No hay posts disponibles"
                                                                                : "Selecciona un influencer primero"}
                                                                        </SelectItem>
                                                                    ) : (
                                                                        posts.map((post) => (
                                                                            <SelectItem key={post.id} value={post.id.toString()}>
                                                                                {post.influencer.name} - {post.socialPlatform.name} -{" "}
                                                                                {new Date(post.publishedAt).toLocaleDateString()}
                                                                            </SelectItem>
                                                                        ))
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <div>
                                                            <Label htmlFor={`date-${row.id}`} className="text-[12px] text-[#6B6B8D]">
                                                                Fecha de Medición *
                                                            </Label>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        className="w-full justify-between rounded-2xl text-left font-normal"
                                                                    >
                                                                        {row.snapshotDate
                                                                            ? new Date(row.snapshotDate).toLocaleDateString("es-ES", {
                                                                                  day: "2-digit",
                                                                                  month: "short",
                                                                                  year: "numeric",
                                                                              })
                                                                            : "Seleccionar fecha"}
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                    <Calendar
                                                                        mode="single"
                                                                        selected={row.snapshotDate ? new Date(row.snapshotDate) : undefined}
                                                                        onSelect={(date: Date | undefined) =>
                                                                            updateRow(
                                                                                row.id,
                                                                                "snapshotDate",
                                                                                date ? date.toISOString().split("T")[0] : ""
                                                                            )
                                                                        }
                                                                        initialFocus
                                                                    />
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>

                                                        <div>
                                                            <Label htmlFor={`views-${row.id}`} className="text-[12px] text-[#6B6B8D]">
                                                                Views
                                                            </Label>
                                                            <Input
                                                                id={`views-${row.id}`}
                                                                type="number"
                                                                value={row.views}
                                                                onChange={(e) => updateRow(row.id, "views", e.target.value)}
                                                                className="rounded-2xl"
                                                                min="0"
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label htmlFor={`likes-${row.id}`} className="text-[12px] text-[#6B6B8D]">
                                                                Likes
                                                            </Label>
                                                            <Input
                                                                id={`likes-${row.id}`}
                                                                type="number"
                                                                value={row.likes}
                                                                onChange={(e) => updateRow(row.id, "likes", e.target.value)}
                                                                className="rounded-2xl"
                                                                min="0"
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label htmlFor={`shares-${row.id}`} className="text-[12px] text-[#6B6B8D]">
                                                                Shares
                                                            </Label>
                                                            <Input
                                                                id={`shares-${row.id}`}
                                                                type="number"
                                                                value={row.shares}
                                                                onChange={(e) => updateRow(row.id, "shares", e.target.value)}
                                                                className="rounded-2xl"
                                                                min="0"
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label htmlFor={`clicks-${row.id}`} className="text-[12px] text-[#6B6B8D]">
                                                                Clics
                                                            </Label>
                                                            <Input
                                                                id={`clicks-${row.id}`}
                                                                type="number"
                                                                value={row.clicks}
                                                                onChange={(e) => updateRow(row.id, "clicks", e.target.value)}
                                                                className="rounded-2xl"
                                                                min="0"
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label htmlFor={`conversions-${row.id}`} className="text-[12px] text-[#6B6B8D]">
                                                                Conversiones
                                                            </Label>
                                                            <Input
                                                                id={`conversions-${row.id}`}
                                                                type="number"
                                                                value={row.conversions}
                                                                onChange={(e) => updateRow(row.id, "conversions", e.target.value)}
                                                                className="rounded-2xl"
                                                                min="0"
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label htmlFor={`revenue-${row.id}`} className="text-[12px] text-[#6B6B8D]">
                                                                Revenue ($)
                                                            </Label>
                                                            <Input
                                                                id={`revenue-${row.id}`}
                                                                type="number"
                                                                step="0.01"
                                                                value={row.revenue}
                                                                onChange={(e) => updateRow(row.id, "revenue", e.target.value)}
                                                                className="rounded-2xl"
                                                                min="0"
                                                            />
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>

                                        <div className="flex gap-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={addRow}
                                                className="border-[#6C48C5] text-[#6C48C5] rounded-2xl"
                                            >
                                                <IconPlus className="w-4 h-4 mr-2" />
                                                Agregar Fila
                                            </Button>

                                            <Button
                                                type="submit"
                                                disabled={loading}
                                                className="bg-gradient-to-r from-[#8B6FD9] to-[#6C48C5] text-white rounded-2xl px-8"
                                            >
                                                {loading ? "Guardando..." : "Guardar Métricas"}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

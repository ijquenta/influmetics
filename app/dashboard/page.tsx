"use client";

import { useEffect, useState, useCallback } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { CartesianGrid, XAxis, YAxis, Area, AreaChart, LabelList } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { IconTrendingUp, IconTrendingDown, IconChevronDown, IconX, IconCrown, IconTrophy, IconDownload } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import ExcelJS from "exceljs";
import { toast } from "sonner";

interface DashboardStats {
    reach: { value: number; change: number; isPositive: boolean };
    engagement: { value: number; change: number; isPositive: boolean };
    clicks: { value: number; change: number; isPositive: boolean };
    conversions: { value: number; change: number; isPositive: boolean };
    ctr: { value: number; change: number; isPositive: boolean };
    revenue: { value: number; change: number; isPositive: boolean };
}

interface TimelineData {
    date: string;
    views: number;
    engagement: number;
    conversions: number;
    [key: string]: string | number; // Para permitir datos dinámicos por plataforma
}

interface InfluencerRanking {
    id: number;
    name: string;
    email: string | null;
    niche: string | null;
    rank: number;
    totalViews: number;
    totalEngagement: number;
    totalConversions: number;
    totalRevenue: number;
    engagementRate: number;
    roi: number;
}

export default function DashboardPage() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [timeline, setTimeline] = useState<TimelineData[]>([]);
    const [platforms, setPlatforms] = useState<Array<{ id: number; name: string; code: string }>>([]);
    const [campaigns, setCampaigns] = useState<Array<{ id: number; name: string }>>([]);
    const [influencerRanking, setInfluencerRanking] = useState<InfluencerRanking[]>([]);

    const [dateMode, setDateMode] = useState<"range" | "monthly">("range");
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const [startDate, setStartDate] = useState<string>(firstDayOfMonth.toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState<string>(today.toISOString().split("T")[0]);
    const [year, setYear] = useState<string>(currentYear.toString());
    const [selectedMonths, setSelectedMonths] = useState<string[]>([currentMonth.toString()]);
    const [selectedPlatformIds, setSelectedPlatformIds] = useState<number[]>([]); // canales seleccionados
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all"); // campaña para stats / gráfica / ranking
    const [platformsOpen, setPlatformsOpen] = useState(false);

    const [loading, setLoading] = useState(true);

    const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

    const months = [
        { value: "1", label: "Ene" },
        { value: "2", label: "Feb" },
        { value: "3", label: "Mar" },
        { value: "4", label: "Abr" },
        { value: "5", label: "May" },
        { value: "6", label: "Jun" },
        { value: "7", label: "Jul" },
        { value: "8", label: "Ago" },
        { value: "9", label: "Sep" },
        { value: "10", label: "Oct" },
        { value: "11", label: "Nov" },
        { value: "12", label: "Dic" },
    ];

    const updateDatesFromMonthSelection = (yearValue: string, monthsValues: string[]) => {
        const yearNum = parseInt(yearValue || currentYear.toString(), 10);
        const monthNums = monthsValues.length > 0 ? monthsValues.map((m) => parseInt(m, 10)).sort((a, b) => a - b) : [currentMonth];

        const firstMonth = monthNums[0];
        const lastMonth = monthNums[monthNums.length - 1];

        const rangeStart = new Date(yearNum, firstMonth - 1, 1);
        const rangeEnd = new Date(yearNum, lastMonth, 0);

        setStartDate(rangeStart.toISOString().split("T")[0]);
        setEndDate(rangeEnd.toISOString().split("T")[0]);
    };

    const fetchPlatforms = async () => {
        try {
            const res = await fetch("/api/data/platforms");
            const data = await res.json();
            const platformsData: Array<{ id: number; code: string; name: string }> = data.data || [];
            console.log("Platforms fetched:", platformsData); // Debug
            setPlatforms(platformsData);

            // Seleccionar TikTok por defecto si existe, sino la primera plataforma
            if (platformsData.length > 0 && selectedPlatformIds.length === 0) {
                const tiktok = platformsData.find((p) => p.code.toLowerCase() === "tiktok");
                const defaultId = tiktok ? tiktok.id : platformsData[0].id;
                setSelectedPlatformIds([defaultId]);
            }
        } catch (error) {
            console.error("Error fetching platforms:", error);
            // En caso de error, establecer plataformas por defecto
            const fallback = [
                { id: 1, code: "tiktok", name: "TikTok" },
                { id: 2, code: "instagram", name: "Instagram" },
                { id: 3, code: "youtube", name: "YouTube" },
                { id: 4, code: "x", name: "X (Twitter)" },
            ];
            setPlatforms(fallback);

            if (selectedPlatformIds.length === 0) {
                // Por defecto seleccionar TikTok (id 1) en fallback
                setSelectedPlatformIds([fallback[0].id]);
            }
        }
    };

    const fetchCampaigns = async () => {
        try {
            const res = await fetch("/api/campaigns");
            const data = await res.json();
            const apiCampaigns = (data.data || []) as Array<{
                id: number;
                name: string;
            }>;
            const list = apiCampaigns.map((c) => ({
                id: c.id,
                name: c.name,
            }));
            setCampaigns(list);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        }
    };

    const fetchInfluencerRanking = useCallback(async () => {
        try {
            const params = new URLSearchParams();

            // Fechas basadas en los filtros de inicio/fin
            if (startDate && endDate) {
                params.append("startDate", new Date(startDate).toISOString());
                params.append("endDate", new Date(endDate).toISOString());
            }
            params.append("limit", "10");

            // Filtro por campaña (usa el selector principal de campaña)
            if (selectedCampaignId && selectedCampaignId !== "all") {
                params.append("campaignId", selectedCampaignId);
            }

            // Agregar múltiples plataformas si hay seleccionadas
            if (selectedPlatformIds.length > 0) {
                params.append("socialPlatformId", selectedPlatformIds.join(","));
            }

            const res = await fetch(`/api/dashboard/influencer-ranking?${params.toString()}`);
            const data = await res.json();
            setInfluencerRanking(data.data || []);
        } catch (error) {
            console.error("Error fetching influencer ranking:", error);
            setInfluencerRanking([]);
        }
    }, [startDate, endDate, selectedPlatformIds, selectedCampaignId]);

    useEffect(() => {
        fetchPlatforms();
        fetchCampaigns();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (platforms.length >= 0) {
            fetchInfluencerRanking();
        }
    }, [fetchInfluencerRanking, platforms.length]);

    useEffect(() => {
        // Esperar a que las plataformas se carguen antes de hacer fetch
        if (platforms.length > 0 || (platforms.length === 0 && selectedPlatformIds.length === 0)) {
            fetchStats();
            fetchTimeline();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate, selectedPlatformIds, selectedCampaignId, platforms.length]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            if (startDate && endDate) {
                params.append("startDate", new Date(startDate).toISOString());
                params.append("endDate", new Date(endDate).toISOString());
            }

            if (selectedCampaignId && selectedCampaignId !== "all") {
                params.append("campaignId", selectedCampaignId);
            }

            if (selectedPlatformIds.length > 0) {
                selectedPlatformIds.forEach((id) => {
                    params.append("socialPlatformId", id.toString());
                });
            }

            const res = await fetch(`/api/dashboard/stats?${params.toString()}`);

            if (!res.ok) {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
            }

            const data = await res.json();
            setStats(data.data || null);
        } catch (error) {
            console.error("Error fetching stats:", error);
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchTimeline = async () => {
        try {
            const params = new URLSearchParams();

            if (startDate && endDate) {
                params.append("startDate", new Date(startDate).toISOString());
                params.append("endDate", new Date(endDate).toISOString());
            }
            params.append("groupBy", "day");

            if (selectedCampaignId) {
                params.append("campaignId", selectedCampaignId);
            }

            if (selectedPlatformIds.length > 0) {
                selectedPlatformIds.forEach((id) => {
                    params.append("socialPlatformId", id.toString());
                });
            }

            const res = await fetch(`/api/dashboard/timeline?${params.toString()}`);

            if (!res.ok) {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
            }

            const data = await res.json();
            const timelineData = data.data || [];

            const validatedData = timelineData.map((item: TimelineData) => ({
                date: item.date || "",
                views: typeof item.views === "number" && !isNaN(item.views) ? item.views : 0,
                engagement: typeof item.engagement === "number" && !isNaN(item.engagement) ? item.engagement : 0,
                conversions: typeof item.conversions === "number" && !isNaN(item.conversions) ? item.conversions : 0,
            }));

            setTimeline(validatedData);
        } catch (error) {
            console.error("Error fetching timeline:", error);
            setTimeline([]);
        }
    };

    // Colores para cada plataforma
    const platformColors: Record<number, string> = {
        1: "#1E90FF", // TikTok - Primary Blue
        2: "#E4405F", // Instagram - Rosa/Rojo
        3: "#FF0000", // YouTube - Rojo
        4: "#000000", // X - Negro
    };

    // Generar chartConfig dinámicamente basado en plataformas seleccionadas
    const chartConfig: ChartConfig = {
        views: {
            label: "Vistas",
            color: "#1E90FF",
        },
        engagement: {
            label: "Engagement",
            color: "#2EC7FF",
        },
        conversions: {
            label: "Conversiones",
            color: "#4CAF50",
        },
    };

    // Agregar configuraciones para cada plataforma seleccionada
    selectedPlatformIds.forEach((platformId) => {
        const platform = platforms.find((p) => p.id === platformId);
        if (platform) {
            const color = platformColors[platformId] || "#6C48C5";
            chartConfig[`views_${platform.code}`] = {
                label: `Vistas ${platform.name}`,
                color,
            };
            chartConfig[`engagement_${platform.code}`] = {
                label: `Engagement ${platform.name}`,
                color,
            };
        }
    });

    // Formatear fecha para el eje X
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
        });
    };

    // Función para exportar a Excel
    const exportToExcel = async () => {
        if (timeline.length === 0) {
            toast.error("No hay datos para exportar");
            return;
        }

        try {
            const selectedCampaignName =
                selectedCampaignId && selectedCampaignId !== "all"
                    ? (campaigns.find((c) => c.id === Number(selectedCampaignId))?.name ?? "Campaña seleccionada")
                    : "Todas las campañas";

            const selectedPlatformNames =
                selectedPlatformIds.length > 0
                    ? selectedPlatformIds
                          .map((id) => platforms.find((p) => p.id === id)?.name)
                          .filter(Boolean)
                          .join(", ")
                    : "Todas las plataformas";

            const excelData = timeline.map((item) => {
                const row: Record<string, string | number> = {
                    Fecha: new Date(item.date).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    }),
                };

                row["Canales"] = selectedPlatformNames;
                row["Campaña"] = selectedCampaignName;

                if (selectedPlatformIds.length > 1) {
                    selectedPlatformIds.forEach((platformId) => {
                        const platform = platforms.find((p) => p.id === platformId);
                        if (platform) {
                            const viewsKey = `views_${platform.code}` as keyof typeof item;
                            const engagementKey = `engagement_${platform.code}` as keyof typeof item;
                            const conversionsKey = `conversions_${platform.code}` as keyof typeof item;

                            row[`Vistas ${platform.name}`] = typeof item[viewsKey] === "number" ? item[viewsKey] : 0;
                            const engagementValue = item[engagementKey];
                            row[`Engagement ${platform.name} (%)`] =
                                typeof engagementValue === "number" ? Number(engagementValue.toFixed(2)) : 0;
                            row[`Conversiones ${platform.name}`] = typeof item[conversionsKey] === "number" ? item[conversionsKey] : 0;
                        }
                    });

                    row["Vistas Totales"] = item.views || 0;
                    row["Engagement Total (%)"] = typeof item.engagement === "number" ? Number(item.engagement.toFixed(2)) : 0;
                    row["Conversiones Totales"] = item.conversions || 0;
                } else {
                    row["Vistas"] = item.views || 0;
                    row["Engagement (%)"] = typeof item.engagement === "number" ? Number(item.engagement.toFixed(2)) : 0;
                    row["Conversiones"] = item.conversions || 0;
                }

                return row;
            });

            // Crear workbook y worksheet usando ExcelJS
            const workbook = new ExcelJS.Workbook();
            const sheetNameBase = "Impacto de campaña";
            const sheetName = sheetNameBase.slice(0, 31);
            const ws = workbook.addWorksheet(sheetName);

            const headers = Object.keys(excelData[0] || {});
            // Agregar fila de encabezados
            ws.addRow(headers);

            // Agregar filas
            for (const rowObj of excelData) {
                const row = headers.map((h) => (rowObj[h] !== undefined ? rowObj[h] : ""));
                ws.addRow(row);
            }

            // Ajustar ancho de columnas
            headers.forEach((key, idx) => {
                const maxLen = Math.max(
                    key.length,
                    ...excelData.map((r) => String(r[key] ?? "").length)
                );
                ws.getColumn(idx + 1).width = Math.min(50, maxLen + 2);
            });

            const monthName = "Rango_fechas";
            const platformNames =
                selectedPlatformIds.length > 0
                    ? selectedPlatformIds
                          .map((id) => platforms.find((p) => p.id === id)?.name)
                          .filter(Boolean)
                          .join("_")
                    : "Todas";
            const fileName = `Evolucion_de_impacto_de_campaña_${monthName}_${platformNames}.xlsx`;

            const buf = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            toast.success("Archivo Excel descargado exitosamente");
        } catch (error) {
            console.error("Error exporting to Excel:", error);
            toast.error("Error al exportar a Excel");
        }
    };

    if (loading && !stats) {
        return (
            <SidebarProvider>
                <AppSidebar variant="inset" />
                <SidebarInset>
                    <SiteHeader />
                    <div className="flex flex-1 flex-col items-center justify-center p-6">
                        <p className="text-[var(--muted-foreground)]">Cargando...</p>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        );
    }

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
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 bg-[var(--background)] min-h-full">
                            {/* Header con filtros */}
                            <div className="flex flex-col gap-4 mb-6">
                                <div>
                                    <h1 className="text-[28px] font-bold text-[var(--foreground)] mb-2">Dashboard</h1>
                                    <p className="text-[16px] text-[var(--muted-foreground)]">Resumen general de métricas y rendimiento</p>
                                </div>

                                {/* Filtros */}
                                <div className="flex gap-3 flex-wrap items-center">
                                    {/* Switch modo fechas / mensual */}
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs text-[var(--muted-foreground)]">Modo mensual</Label>
                                        <Switch
                                            checked={dateMode === "monthly"}
                                            onCheckedChange={(checked: boolean) => {
                                                const newMode = checked ? "monthly" : "range";
                                                setDateMode(newMode);
                                                if (newMode === "monthly") {
                                                    updateDatesFromMonthSelection(year, selectedMonths);
                                                }
                                            }}
                                            className="data-[state=checked]:bg-primary"
                                        />
                                    </div>

                                    {dateMode === "range" ? (
                                        <>
                                            {/* Fecha inicio */}
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs text-[var(--muted-foreground)]">Fecha inicio</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="h-10 w-[220px] justify-between rounded-2xl text-left font-normal"
                                                        >
                                                            {startDate
                                                                ? new Date(startDate).toLocaleDateString("es-ES", {
                                                                      day: "2-digit",
                                                                      month: "short",
                                                                      year: "numeric",
                                                                  })
                                                                : "Seleccionar fecha"}
                                                            <IconChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={startDate ? new Date(startDate) : undefined}
                                                            onSelect={(date: Date | undefined) => {
                                                                if (date) setStartDate(date.toISOString().split("T")[0]);
                                                            }}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>

                                            {/* Fecha fin */}
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs text-[var(--muted-foreground)]">Fecha fin</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="h-10 w-[220px] justify-between rounded-2xl text-left font-normal"
                                                        >
                                                            {endDate
                                                                ? new Date(endDate).toLocaleDateString("es-ES", {
                                                                      day: "2-digit",
                                                                      month: "short",
                                                                      year: "numeric",
                                                                  })
                                                                : "Seleccionar fecha"}
                                                            <IconChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={endDate ? new Date(endDate) : undefined}
                                                            onSelect={(date: Date | undefined) => {
                                                                if (date) setEndDate(date.toISOString().split("T")[0]);
                                                            }}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* Año */}
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs text-[var(--muted-foreground)]">Año</Label>
                                                <Select
                                                    value={year}
                                                    onValueChange={(value) => {
                                                        setYear(value);
                                                        updateDatesFromMonthSelection(value, selectedMonths);
                                                    }}
                                                >
                                                    <SelectTrigger className="h-10 w-[220px] rounded-2xl">
                                                        <SelectValue placeholder="Selecciona año" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {years.map((y) => (
                                                            <SelectItem key={y} value={y}>
                                                                {y}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Meses (multi-select) */}
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs text-[var(--muted-foreground)]">Meses</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className="h-10 w-[220px] justify-between rounded-2xl border-[var(--border)]"
                                                        >
                                                            {selectedMonths.length === 0
                                                                ? "Seleccionar meses"
                                                                : selectedMonths.length === 1
                                                                  ? months.find((m) => m.value === selectedMonths[0])?.label
                                                                  : `${selectedMonths.length} meses seleccionados`}
                                                            <IconChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[220px] p-3 rounded-2xl">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-semibold text-[var(--foreground)]">Meses</span>
                                                            {selectedMonths.length > 0 && (
                                                                    <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 px-2 text-[10px] text-primary"
                                                                    onClick={() => {
                                                                        setSelectedMonths([]);
                                                                        updateDatesFromMonthSelection(year, []);
                                                                    }}
                                                                >
                                                                    Limpiar
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <div className="max-h-64 overflow-y-auto space-y-1">
                                                            {months.map((m) => {
                                                                const checked = selectedMonths.includes(m.value);
                                                                return (
                                                                    <div
                                                                        key={m.value}
                                                                        className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-primary/10 cursor-pointer"
                                                                        onClick={() => {
                                                                            const next = checked
                                                                                ? selectedMonths.filter((v) => v !== m.value)
                                                                                : [...selectedMonths, m.value];
                                                                            setSelectedMonths(next);
                                                                            updateDatesFromMonthSelection(year, next);
                                                                        }}
                                                                    >
                                                                            <Checkbox
                                                                            checked={checked}
                                                                            onCheckedChange={(value) => {
                                                                                const isChecked = Boolean(value);
                                                                                const next = isChecked
                                                                                    ? [...selectedMonths, m.value]
                                                                                    : selectedMonths.filter((v) => v !== m.value);
                                                                                setSelectedMonths(next);
                                                                                updateDatesFromMonthSelection(year, next);
                                                                            }}
                                                                            className="border-primary data-[state=checked]:bg-primary"
                                                                        />
                                                                        <span className="text-xs text-[var(--foreground)]">{m.label}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </>
                                    )}

                                    {/* Canal de ingreso (Redes sociales) - Multi-select */}
                                    <Popover open={platformsOpen} onOpenChange={setPlatformsOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                        "h-10 w-[220px] justify-between rounded-2xl border-[var(--border)]",
                                                        selectedPlatformIds.length === 0 && "text-muted-foreground"
                                                    )}
                                            >
                                                {selectedPlatformIds.length === 0
                                                    ? "Seleccionar canales"
                                                    : selectedPlatformIds.length === 1
                                                      ? platforms.find((p) => p.id === selectedPlatformIds[0])?.name ||
                                                        "1 canal seleccionado"
                                                      : `${selectedPlatformIds.length} canales seleccionados`}
                                                <IconChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[250px] p-4 rounded-2xl">
                                            <div className="space-y-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                    <Label className="text-sm font-semibold text-[var(--foreground)]">Canales de ingreso</Label>
                                                    {selectedPlatformIds.length > 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 px-2 text-xs text-primary"
                                                            onClick={() => setSelectedPlatformIds([])}
                                                        >
                                                            Limpiar
                                                        </Button>
                                                    )}
                                                </div>
                                                        {platforms.length > 0 ? (
                                                    platforms.map((platform) => {
                                                        const isSelected = selectedPlatformIds.includes(platform.id);
                                                        return (
                                                            <div
                                                                key={platform.id}
                                                                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-primary/10 cursor-pointer"
                                                                onClick={() => {
                                                                    if (isSelected) {
                                                                        setSelectedPlatformIds(
                                                                            selectedPlatformIds.filter((id) => id !== platform.id)
                                                                        );
                                                                    } else {
                                                                        setSelectedPlatformIds([...selectedPlatformIds, platform.id]);
                                                                    }
                                                                }}
                                                            >
                                                                <Checkbox
                                                                    id={`platform-${platform.id}`}
                                                                    checked={isSelected}
                                                                    onCheckedChange={(checked) => {
                                                                        if (checked) {
                                                                            setSelectedPlatformIds([...selectedPlatformIds, platform.id]);
                                                                        } else {
                                                                            setSelectedPlatformIds(
                                                                                selectedPlatformIds.filter((id) => id !== platform.id)
                                                                            );
                                                                        }
                                                                    }}
                                                                            className="border-primary data-[state=checked]:bg-primary"
                                                                />
                                                                <Label
                                                                    htmlFor={`platform-${platform.id}`}
                                                                    className="flex-1 cursor-pointer text-sm text-foreground font-medium"
                                                                >
                                                                    {platform.name}
                                                                </Label>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="text-sm text-[var(--muted-foreground)] py-2">Cargando plataformas...</div>
                                                )}
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    {/* Mostrar badges de plataformas seleccionadas */}
                                    {selectedPlatformIds.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                                    {selectedPlatformIds.map((platformId) => {
                                                const platform = platforms.find((p) => p.id === platformId);
                                                if (!platform) return null;
                                                return (
                                                    <div
                                                        key={platformId}
                                                                className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium"
                                                    >
                                                        {platform.name}
                                                        <button
                                                            onClick={() => {
                                                                setSelectedPlatformIds(
                                                                    selectedPlatformIds.filter((id) => id !== platformId)
                                                                );
                                                            }}
                                                                    className="ml-1 hover:bg-primary hover:text-white rounded-full p-0.5"
                                                        >
                                                            <IconX className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Campañas - selector simple */}
                                    <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                                        <SelectTrigger className="h-10 w-[220px] rounded-2xl">
                                            <SelectValue placeholder="Todas las campañas" />
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
                            </div>

                            {/* KPIs Cards */}
                            {stats && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                    <Card className="rounded-[20px] border-[var(--border)] shadow-[0_4px_20px_rgba(46,199,255,0.08)]">
                                        <CardHeader className="pb-3">
                                            <CardDescription className="text-[14px] text-[var(--muted-foreground)]">Alcance Total</CardDescription>
                                            <CardTitle className="text-[24px] font-bold text-[var(--foreground)]">
                                                {stats.reach.value.toLocaleString()}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-2 cursor-default">
                                                        {stats.reach.isPositive ? (
                                                            <IconTrendingUp className="w-4 h-4 text-success" />
                                                        ) : (
                                                            <IconTrendingDown className="w-4 h-4 text-destructive" />
                                                        )}
                                                        <span
                                                            className={`text-sm font-semibold ${stats.reach.isPositive ? "text-success" : "text-destructive"}`}
                                                        >
                                                            {stats.reach.change > 0 ? "+" : ""}
                                                            {stats.reach.change.toFixed(1)}%
                                                        </span>
                                                        <span className="text-sm text-[var(--muted-foreground)]">vs mes anterior</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>Cambio porcentual de alcance respecto al periodo anterior.</TooltipContent>
                                            </Tooltip>
                                        </CardContent>
                                    </Card>

                                        <Card className="rounded-[20px] border-[var(--border)] shadow-[0_4px_20px_rgba(46,199,255,0.08)]">
                                        <CardHeader className="pb-3">
                                            <CardDescription className="text-[14px] text-[var(--muted-foreground)]">Engagement Rate</CardDescription>
                                            <CardTitle className="text-[24px] font-bold text-[var(--foreground)]">
                                                {stats.engagement.value.toFixed(2)}%
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-2 cursor-default">
                                                        {stats.engagement.isPositive ? (
                                                            <IconTrendingUp className="w-4 h-4 text-success" />
                                                        ) : (
                                                            <IconTrendingDown className="w-4 h-4 text-destructive" />
                                                        )}
                                                        <span
                                                            className={`text-sm font-semibold ${stats.engagement.isPositive ? "text-success" : "text-destructive"}`}
                                                        >
                                                            {stats.engagement.change > 0 ? "+" : ""}
                                                            {stats.engagement.change.toFixed(1)}%
                                                        </span>
                                                        <span className="text-sm text-[var(--muted-foreground)]">vs mes anterior</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    Engagement medio (likes + shares) sobre el alcance en el periodo.
                                                </TooltipContent>
                                            </Tooltip>
                                        </CardContent>
                                    </Card>

                                    <Card className="rounded-[20px] border-[var(--border)] shadow-[0_4px_20px_rgba(46,199,255,0.08)]">
                                        <CardHeader className="pb-3">
                                            <CardDescription className="text-[14px] text-[var(--muted-foreground)]">Conversiones</CardDescription>
                                            <CardTitle className="text-[24px] font-bold text-[var(--foreground)]">
                                                {stats.conversions.value.toLocaleString()}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-2 cursor-default">
                                                        {stats.conversions.isPositive ? (
                                                            <IconTrendingUp className="w-4 h-4 text-success" />
                                                        ) : (
                                                            <IconTrendingDown className="w-4 h-4 text-destructive" />
                                                        )}
                                                        <span
                                                            className={`text-sm font-semibold ${stats.conversions.isPositive ? "text-success" : "text-destructive"}`}
                                                        >
                                                            {stats.conversions.change > 0 ? "+" : ""}
                                                            {stats.conversions.change.toFixed(1)}%
                                                        </span>
                                                        <span className="text-sm text-[var(--muted-foreground)]">vs mes anterior</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    Número de conversiones atribuidas a las campañas en el periodo.
                                                </TooltipContent>
                                            </Tooltip>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Contenedor principal: Ranking (1/4) + Gráfico (3/4) */}
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                {/* Ranking de Influencers - 1/4 */}
                                <Card className="lg:col-span-1 rounded-[20px] border-[var(--border)] shadow-[0_4px_20px_rgba(46,199,255,0.08)]">
                                    <CardHeader className="space-y-1">
                                        <CardTitle className="text-[18px] font-bold text-foreground flex items-center gap-2">
                                            <IconTrophy className="w-5 h-5 text-accent" />
                                            Ranking Top Influencers
                                        </CardTitle>
                                        <CardDescription className="text-[14px] text-[var(--muted-foreground)]">
                                            Desde {startDate} hasta {endDate}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        {influencerRanking.length === 0 ? (
                                            <div className="flex items-center justify-center h-[400px] text-[var(--muted-foreground)] text-sm">
                                                <p>No hay datos disponibles</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                                {influencerRanking.map((influencer) => (
                                                    <div
                                                        key={influencer.id}
                                                        className={cn(
                                                            "flex items-start gap-3 p-3 rounded-xl transition-all hover:bg-primary/10 cursor-pointer",
                                                            influencer.rank <= 3 &&
                                                                "bg-gradient-to-r from-accent/10 to-transparent border border-accent/20"
                                                        )}
                                                    >
                                                        {/* Rank */}
                                                        <div
                                                            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm"
                                                            style={{
                                                                backgroundColor:
                                                                    influencer.rank === 1
                                                                        ? "#FFD700"
                                                                        : influencer.rank === 2
                                                                          ? "#C0C0C0"
                                                                          : influencer.rank === 3
                                                                            ? "#CD7F32"
                                                                            : "#E6F0FF",
                                                                            color: influencer.rank <= 3 ? "#1A1A2E" : "#1E90FF",
                                                            }}
                                                        >
                                                            {influencer.rank === 1 ? <IconCrown className="w-4 h-4" /> : influencer.rank}
                                                        </div>

                                                        {/* Información del influencer */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Avatar className="w-8 h-8">
                                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                                                        {influencer.name
                                                                            .split(" ")
                                                                            .map((n) => n[0])
                                                                            .join("")
                                                                            .toUpperCase()
                                                                            .slice(0, 2)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                                                                        {influencer.name}
                                                                    </p>
                                                                    {influencer.niche && (
                                                                        <p className="text-xs text-[var(--muted-foreground)] truncate">
                                                                            {influencer.niche}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Métricas */}
                                                            <div className="mt-2 space-y-1">
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-[var(--muted-foreground)]">Views:</span>
                                                                    <span className="font-semibold text-[var(--foreground)]">
                                                                        {(influencer.totalViews / 1000).toFixed(0)}k
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-[var(--muted-foreground)]">Engagement:</span>
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="text-xs px-1.5 py-0 bg-primary/10 text-primary"
                                                                    >
                                                                        {influencer.engagementRate.toFixed(1)}%
                                                                    </Badge>
                                                                </div>
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-[var(--muted-foreground)]">Conversiones:</span>
                                                                    <span className="font-semibold text-foreground">
                                                                        {influencer.totalConversions.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-[var(--muted-foreground)]">ROI:</span>
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className={cn(
                                                                            "text-xs px-1.5 py-0",
                                                                            influencer.roi > 50
                                                                                ? "bg-success/10 text-success"
                                                                                : influencer.roi > 0
                                                                                  ? "bg-accent/10 text-accent"
                                                                                  : "bg-destructive/10 text-destructive"
                                                                        )}
                                                                    >
                                                                        {influencer.roi > 0 ? "+" : ""}
                                                                        {influencer.roi.toFixed(1)}%
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Gráfico principal - 3/4 */}
                                <Card className="lg:col-span-3 rounded-[20px] border-[var(--border)] shadow-[0_4px_20px_rgba(46,199,255,0.08)]">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-[18px] font-bold text-foreground">
                                                    Evolución del impacto de campaña
                                                </CardTitle>
                                                <CardDescription className="text-[14px] text-[var(--muted-foreground)]">
                                                    Vistas, Engagement y Conversiones por día - desde {startDate} hasta {endDate}
                                                </CardDescription>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={exportToExcel}
                                                disabled={timeline.length === 0}
                                                className="h-10 border-primary text-primary hover:bg-primary/10 rounded-2xl px-4"
                                            >
                                                <IconDownload className="w-4 h-4 mr-2" />
                                                Descargar Excel
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                                        {timeline.length === 0 ? (
                                            <div className="flex items-center justify-center h-[400px] text-[var(--muted-foreground)]">
                                                <p>No hay datos disponibles para el período seleccionado</p>
                                            </div>
                                        ) : (
                                            <ChartContainer config={chartConfig} className="aspect-auto h-[400px] w-full">
                                                <AreaChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                                    <defs>
                                                        {selectedPlatformIds.length > 0 ? (
                                                            // Gradientes para cada plataforma seleccionada
                                                            selectedPlatformIds.map((platformId) => {
                                                                const platform = platforms.find((p) => p.id === platformId);
                                                                if (!platform) return null;
                                                                const color = platformColors[platformId] || "#6C48C5";
                                                                return (
                                                                    <linearGradient
                                                                        key={`fill_${platform.code}`}
                                                                        id={`fill_${platform.code}`}
                                                                        x1="0"
                                                                        y1="0"
                                                                        x2="0"
                                                                        y2="1"
                                                                    >
                                                                        <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                                                                        <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                                                                    </linearGradient>
                                                                );
                                                            })
                                                        ) : (
                                                            // Gradientes para métricas consolidadas
                                                            <>
                                                                <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#6C48C5" stopOpacity={0.8} />
                                                                    <stop offset="95%" stopColor="#6C48C5" stopOpacity={0.1} />
                                                                </linearGradient>
                                                                <linearGradient id="fillEngagement" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#C68FFF" stopOpacity={0.8} />
                                                                    <stop offset="95%" stopColor="#C68FFF" stopOpacity={0.1} />
                                                                </linearGradient>
                                                                <linearGradient id="fillConversions" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8} />
                                                                    <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.1} />
                                                                </linearGradient>
                                                            </>
                                                        )}
                                                    </defs>
                                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E8DEFF" />
                                                    <XAxis
                                                        dataKey="date"
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickMargin={8}
                                                        minTickGap={32}
                                                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                                                        tickFormatter={(value) => formatDate(value)}
                                                    />
                                                    <YAxis
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                                                        tickFormatter={(value) => {
                                                            if (value >= 1000) {
                                                                return `${(value / 1000).toFixed(1)}k`;
                                                            }
                                                            return value.toString();
                                                        }}
                                                    />
                                                    <ChartTooltip
                                                        cursor={false}
                                                        content={
                                                            <ChartTooltipContent
                                                                labelFormatter={(value) => {
                                                                    return formatDate(value as string);
                                                                }}
                                                                indicator="dot"
                                                            />
                                                        }
                                                    />
                                                    {selectedPlatformIds.length > 0 ? (
                                                        // Si hay plataformas seleccionadas, mostrar áreas por plataforma (solo vistas para comparar)
                                                        selectedPlatformIds.map((platformId) => {
                                                            const platform = platforms.find((p) => p.id === platformId);
                                                            if (!platform) return null;
                                                            const color = platformColors[platformId] || "#6C48C5";
                                                            return (
                                                                <Area
                                                                    key={`views_${platform.code}`}
                                                                    dataKey={`views_${platform.code}`}
                                                                    type="natural"
                                                                    fill={`url(#fill_${platform.code})`}
                                                                    stroke={color}
                                                                    strokeWidth={2}
                                                                    name={`Vistas ${platform.name}`}
                                                                    stackId={selectedPlatformIds.length > 1 ? "a" : undefined}
                                                                >
                                                                    <LabelList dataKey={`views_${platform.code}`} position="top" />
                                                                </Area>
                                                            );
                                                        })
                                                    ) : (
                                                        // Si no hay plataformas seleccionadas, mostrar áreas consolidadas con labels
                                                        <>
                                                            <Area
                                                                dataKey="views"
                                                                type="natural"
                                                                fill="url(#fillViews)"
                                                                stroke="#6C48C5"
                                                                strokeWidth={2}
                                                                name="Vistas"
                                                            >
                                                                <LabelList dataKey="views" position="top" />
                                                            </Area>
                                                            <Area
                                                                dataKey="engagement"
                                                                type="natural"
                                                                fill="url(#fillEngagement)"
                                                                stroke="#C68FFF"
                                                                strokeWidth={2}
                                                                name="Engagement (%)"
                                                            >
                                                                <LabelList dataKey="engagement" position="top" />
                                                            </Area>
                                                            <Area
                                                                dataKey="conversions"
                                                                type="natural"
                                                                fill="url(#fillConversions)"
                                                                stroke="#4CAF50"
                                                                strokeWidth={2}
                                                                name="Conversiones"
                                                            >
                                                                <LabelList dataKey="conversions" position="top" />
                                                            </Area>
                                                        </>
                                                    )}
                                                    <ChartLegend content={<ChartLegendContent />} />
                                                </AreaChart>
                                            </ChartContainer>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

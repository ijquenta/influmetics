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

// Generar datos dummy para el mes seleccionado
const generateDummyData = (
    year: number,
    month: number,
    selectedPlatformIds: number[] = [],
    platforms: Array<{ id: number; code: string }> = []
): TimelineData[] => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const data: TimelineData[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dateString = date.toISOString().split("T")[0];

        // Agregar variación diaria
        const dayVariation = Math.sin((day / daysInMonth) * Math.PI * 2) * 0.3 + 1;

        // Si hay plataformas seleccionadas, generar datos por plataforma
        if (selectedPlatformIds.length > 0) {
            const item: TimelineData = {
                date: dateString,
                views: 0,
                engagement: 0,
                conversions: 0,
            };

            selectedPlatformIds.forEach((platformId) => {
                const platform = platforms.find((p) => p.id === platformId);
                if (platform) {
                    // Generar valores aleatorios pero realistas por plataforma
                    const baseViews = (10000 + Math.random() * 50000) / selectedPlatformIds.length;
                    const baseEngagement = 2 + Math.random() * 8; // 2-10%
                    const baseConversions = (50 + Math.random() * 200) / selectedPlatformIds.length;

                    item[`views_${platform.code}`] = Math.round(baseViews * dayVariation);
                    item[`engagement_${platform.code}`] = Number((baseEngagement * dayVariation).toFixed(2));
                    item[`conversions_${platform.code}`] = Math.round(baseConversions * dayVariation);

                    // Acumular para los totales
                    item.views += Math.round(baseViews * dayVariation);
                    item.conversions += Math.round(baseConversions * dayVariation);
                }
            });

            // Calcular engagement total promedio
            item.engagement =
                selectedPlatformIds.length > 0
                    ? Number((((item.views > 0 ? item.views * 0.06 : 0) / item.views) * 100).toFixed(2))
                    : Number((2 + Math.random() * 8).toFixed(2));

            data.push(item);
        } else {
            // Si no hay plataformas seleccionadas, generar datos consolidados
            const baseViews = 10000 + Math.random() * 50000;
            const baseEngagement = 2 + Math.random() * 8; // 2-10%
            const baseConversions = 50 + Math.random() * 200;

            data.push({
                date: dateString,
                views: Math.round(baseViews * dayVariation),
                engagement: Number((baseEngagement * dayVariation).toFixed(2)),
                conversions: Math.round(baseConversions * dayVariation),
            });
        }
    }

    return data;
};

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
            // En caso de error, dejar vacío o usar datos dummy
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

            // Fechas basadas en los filtros de inicio/fin
            if (startDate && endDate) {
                params.append("startDate", new Date(startDate).toISOString());
                params.append("endDate", new Date(endDate).toISOString());
            }

            // Filtro por campaña
            if (selectedCampaignId && selectedCampaignId !== "all") {
                params.append("campaignId", selectedCampaignId);
            }
            // Agregar múltiples plataformas
            if (selectedPlatformIds.length > 0) {
                selectedPlatformIds.forEach((id) => {
                    params.append("socialPlatformId", id.toString());
                });
            }

            const res = await fetch(`/api/dashboard/stats?${params.toString()}`);
            const data = await res.json();

            // Si no hay stats, generar datos dummy
            if (!data.data) {
                const yearNum = currentYear;
                const monthNum = currentMonth;
                const dummyTimeline = generateDummyData(yearNum, monthNum, selectedPlatformIds, platforms);
                const totalViews = dummyTimeline.reduce((sum, item) => sum + item.views, 0);
                const avgEngagement = dummyTimeline.reduce((sum, item) => sum + item.engagement, 0) / dummyTimeline.length;
                const totalConversions = dummyTimeline.reduce((sum, item) => sum + item.conversions, 0);
                const totalClicks = Math.round(totalViews * 0.05); // 5% CTR
                const totalRevenue = totalConversions * 150; // $150 por conversión

                setStats({
                    reach: { value: totalViews, change: 12.5, isPositive: true },
                    engagement: { value: avgEngagement, change: 5.3, isPositive: true },
                    clicks: { value: totalClicks, change: 8.2, isPositive: true },
                    conversions: {
                        value: totalConversions,
                        change: 15.7,
                        isPositive: true,
                    },
                    ctr: { value: 5.0, change: 0, isPositive: true },
                    revenue: { value: totalRevenue, change: 18.4, isPositive: true },
                });
            } else {
                setStats(data.data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
            // En caso de error, generar stats dummy
            const yearNum = currentYear;
            const monthNum = currentMonth;
            const dummyTimeline = generateDummyData(yearNum, monthNum, selectedPlatformIds, platforms);
            const totalViews = dummyTimeline.reduce((sum, item) => sum + item.views, 0);
            const avgEngagement = dummyTimeline.reduce((sum, item) => sum + item.engagement, 0) / dummyTimeline.length;
            const totalConversions = dummyTimeline.reduce((sum, item) => sum + item.conversions, 0);
            const totalClicks = Math.round(totalViews * 0.05);
            const totalRevenue = totalConversions * 150;

            setStats({
                reach: { value: totalViews, change: 12.5, isPositive: true },
                engagement: { value: avgEngagement, change: 5.3, isPositive: true },
                clicks: { value: totalClicks, change: 8.2, isPositive: true },
                conversions: {
                    value: totalConversions,
                    change: 15.7,
                    isPositive: true,
                },
                ctr: { value: 5.0, change: 0, isPositive: true },
                revenue: { value: totalRevenue, change: 18.4, isPositive: true },
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchTimeline = async () => {
        try {
            const params = new URLSearchParams();

            // Fechas basadas en los filtros de inicio/fin
            if (startDate && endDate) {
                params.append("startDate", new Date(startDate).toISOString());
                params.append("endDate", new Date(endDate).toISOString());
            }
            params.append("groupBy", "day");

            // Filtro por campaña
            if (selectedCampaignId) {
                params.append("campaignId", selectedCampaignId);
            }
            // Agregar múltiples plataformas
            if (selectedPlatformIds.length > 0) {
                selectedPlatformIds.forEach((id) => {
                    params.append("socialPlatformId", id.toString());
                });
            }

            const res = await fetch(`/api/dashboard/timeline?${params.toString()}`);
            const data = await res.json();
            let timelineData = data.data || [];

            // Si no hay datos, generar datos dummy
            if (timelineData.length === 0) {
                const yearNum = currentYear;
                const monthNum = currentMonth;
                timelineData = generateDummyData(yearNum, monthNum, selectedPlatformIds, platforms);
                console.log("Using dummy data for timeline", timelineData.length);
            }

            // Validar y asegurar que los datos tengan el formato correcto
            let validatedData = timelineData.map((item: TimelineData) => {
                const validated: TimelineData = {
                    date: item.date || "",
                    views: typeof item.views === "number" && !isNaN(item.views) ? item.views : 0,
                    engagement: typeof item.engagement === "number" && !isNaN(item.engagement) ? item.engagement : 0,
                    conversions: typeof item.conversions === "number" && !isNaN(item.conversions) ? item.conversions : 0,
                };

                // Agregar datos por plataforma si existen o generar valores por defecto
                if (selectedPlatformIds.length > 0 && platforms.length > 0) {
                    selectedPlatformIds.forEach((platformId) => {
                        const platform = platforms.find((p) => p.id === platformId);
                        if (platform) {
                            const viewsKey = `views_${platform.code}`;
                            const engagementKey = `engagement_${platform.code}`;
                            const conversionsKey = `conversions_${platform.code}`;

                            const viewsValue = item[viewsKey as keyof TimelineData];
                            const engagementValue = item[engagementKey as keyof TimelineData];
                            const conversionsValue = item[conversionsKey as keyof TimelineData];

                            // Validar y asignar valores para vistas
                            if (typeof viewsValue === "number" && !isNaN(viewsValue) && viewsValue >= 0) {
                                validated[viewsKey] = viewsValue;
                            } else {
                                // Si no hay valor, dividir el total entre las plataformas
                                validated[viewsKey] =
                                    validated.views > 0
                                        ? Math.round(validated.views / selectedPlatformIds.length)
                                        : Math.round((10000 + Math.random() * 50000) / selectedPlatformIds.length);
                            }

                            // Validar y asignar valores para engagement
                            if (typeof engagementValue === "number" && !isNaN(engagementValue) && engagementValue >= 0) {
                                validated[engagementKey] = engagementValue;
                            } else {
                                validated[engagementKey] =
                                    validated.engagement > 0 ? validated.engagement : Number((2 + Math.random() * 8).toFixed(2));
                            }

                            // Validar y asignar valores para conversiones
                            if (typeof conversionsValue === "number" && !isNaN(conversionsValue) && conversionsValue >= 0) {
                                validated[conversionsKey] = conversionsValue;
                            } else {
                                validated[conversionsKey] =
                                    validated.conversions > 0
                                        ? Math.round(validated.conversions / selectedPlatformIds.length)
                                        : Math.round((50 + Math.random() * 200) / selectedPlatformIds.length);
                            }
                        }
                    });
                }

                return validated;
            });

            // Asegurar que haya al menos un dato válido
            if (validatedData.length === 0) {
                const yearNum = currentYear;
                const monthNum = currentMonth;
                validatedData = generateDummyData(yearNum, monthNum, selectedPlatformIds, platforms);
            }

            console.log("Timeline data:", validatedData.length, "items"); // Debug
            console.log("Sample data:", validatedData[0]); // Debug
            console.log("First item keys:", Object.keys(validatedData[0] || {})); // Debug
            console.log("Selected platforms:", selectedPlatformIds); // Debug
            setTimeline(validatedData);
        } catch (error) {
            console.error("Error fetching timeline:", error);
            // En caso de error, usar datos dummy
            const yearNum = currentYear;
            const monthNum = currentMonth;
            const dummyData = generateDummyData(yearNum, monthNum, selectedPlatformIds, platforms);
            setTimeline(dummyData);
        }
    };

    // Colores para cada plataforma
    const platformColors: Record<number, string> = {
        1: "#6C48C5", // TikTok - Púrpura
        2: "#E4405F", // Instagram - Rosa/Rojo
        3: "#FF0000", // YouTube - Rojo
        4: "#000000", // X - Negro
    };

    // Generar chartConfig dinámicamente basado en plataformas seleccionadas
    const chartConfig: ChartConfig = {
        views: {
            label: "Vistas",
            color: "#6C48C5",
        },
        engagement: {
            label: "Engagement",
            color: "#C68FFF",
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
                        <p className="text-[#6B6B8D]">Cargando...</p>
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
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 bg-[#F8F7FC] min-h-full">
                            {/* Header con filtros */}
                            <div className="flex flex-col gap-4 mb-6">
                                <div>
                                    <h1 className="text-[28px] font-bold text-[#1A1A2E] mb-2">Dashboard</h1>
                                    <p className="text-[16px] text-[#6B6B8D]">Resumen general de métricas y rendimiento</p>
                                </div>

                                {/* Filtros */}
                                <div className="flex gap-3 flex-wrap items-center">
                                    {/* Switch modo fechas / mensual */}
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs text-[#6B6B8D]">Modo mensual</Label>
                                        <Switch
                                            checked={dateMode === "monthly"}
                                            onCheckedChange={(checked: boolean) => {
                                                const newMode = checked ? "monthly" : "range";
                                                setDateMode(newMode);
                                                if (newMode === "monthly") {
                                                    updateDatesFromMonthSelection(year, selectedMonths);
                                                }
                                            }}
                                            className="data-[state=checked]:bg-[#6C48C5]"
                                        />
                                    </div>

                                    {dateMode === "range" ? (
                                        <>
                                            {/* Fecha inicio */}
                                            <div className="flex items-center gap-2">
                                                <Label className="text-xs text-[#6B6B8D]">Fecha inicio</Label>
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
                                                <Label className="text-xs text-[#6B6B8D]">Fecha fin</Label>
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
                                                <Label className="text-xs text-[#6B6B8D]">Año</Label>
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
                                                <Label className="text-xs text-[#6B6B8D]">Meses</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className="h-10 w-[220px] justify-between rounded-2xl border-[rgba(108,72,197,0.1)]"
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
                                                            <span className="text-xs font-semibold text-[#1A1A2E]">Meses</span>
                                                            {selectedMonths.length > 0 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 px-2 text-[10px] text-[#6C48C5]"
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
                                                                        className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-[rgba(108,72,197,0.05)] cursor-pointer"
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
                                                                            className="border-[#6C48C5] data-[state=checked]:bg-[#6C48C5]"
                                                                        />
                                                                        <span className="text-xs text-[#1A1A2E]">{m.label}</span>
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
                                                    "h-10 w-[220px] justify-between rounded-2xl border-[rgba(108,72,197,0.1)]",
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
                                                    <Label className="text-sm font-semibold text-[#1A1A2E]">Canales de ingreso</Label>
                                                    {selectedPlatformIds.length > 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 px-2 text-xs text-[#6C48C5]"
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
                                                                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[rgba(108,72,197,0.05)] cursor-pointer"
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
                                                                    className="border-[#6C48C5] data-[state=checked]:bg-[#6C48C5]"
                                                                />
                                                                <Label
                                                                    htmlFor={`platform-${platform.id}`}
                                                                    className="flex-1 cursor-pointer text-sm text-[#1A1A2E] font-medium"
                                                                >
                                                                    {platform.name}
                                                                </Label>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="text-sm text-[#6B6B8D] py-2">Cargando plataformas...</div>
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
                                                        className="flex items-center gap-1 px-2 py-1 bg-[#E8DEFF] text-[#6C48C5] rounded-lg text-xs font-medium"
                                                    >
                                                        {platform.name}
                                                        <button
                                                            onClick={() => {
                                                                setSelectedPlatformIds(
                                                                    selectedPlatformIds.filter((id) => id !== platformId)
                                                                );
                                                            }}
                                                            className="ml-1 hover:bg-[#6C48C5] hover:text-white rounded-full p-0.5"
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
                                    <Card className="rounded-[20px] border-[rgba(108,72,197,0.1)] shadow-[0_4px_20px_rgba(108,72,197,0.08)]">
                                        <CardHeader className="pb-3">
                                            <CardDescription className="text-[14px] text-[#6B6B8D]">Alcance Total</CardDescription>
                                            <CardTitle className="text-[24px] font-bold text-[#1A1A2E]">
                                                {stats.reach.value.toLocaleString()}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-2 cursor-default">
                                                        {stats.reach.isPositive ? (
                                                            <IconTrendingUp className="w-4 h-4 text-[#4CAF50]" />
                                                        ) : (
                                                            <IconTrendingDown className="w-4 h-4 text-[#EF4444]" />
                                                        )}
                                                        <span
                                                            className={`text-sm font-semibold ${stats.reach.isPositive ? "text-[#4CAF50]" : "text-[#EF4444]"}`}
                                                        >
                                                            {stats.reach.change > 0 ? "+" : ""}
                                                            {stats.reach.change.toFixed(1)}%
                                                        </span>
                                                        <span className="text-sm text-[#6B6B8D]">vs mes anterior</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>Cambio porcentual de alcance respecto al periodo anterior.</TooltipContent>
                                            </Tooltip>
                                        </CardContent>
                                    </Card>

                                    <Card className="rounded-[20px] border-[rgba(108,72,197,0.1)] shadow-[0_4px_20px_rgba(108,72,197,0.08)]">
                                        <CardHeader className="pb-3">
                                            <CardDescription className="text-[14px] text-[#6B6B8D]">Engagement Rate</CardDescription>
                                            <CardTitle className="text-[24px] font-bold text-[#1A1A2E]">
                                                {stats.engagement.value.toFixed(2)}%
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-2 cursor-default">
                                                        {stats.engagement.isPositive ? (
                                                            <IconTrendingUp className="w-4 h-4 text-[#4CAF50]" />
                                                        ) : (
                                                            <IconTrendingDown className="w-4 h-4 text-[#EF4444]" />
                                                        )}
                                                        <span
                                                            className={`text-sm font-semibold ${stats.engagement.isPositive ? "text-[#4CAF50]" : "text-[#EF4444]"}`}
                                                        >
                                                            {stats.engagement.change > 0 ? "+" : ""}
                                                            {stats.engagement.change.toFixed(1)}%
                                                        </span>
                                                        <span className="text-sm text-[#6B6B8D]">vs mes anterior</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    Engagement medio (likes + shares) sobre el alcance en el periodo.
                                                </TooltipContent>
                                            </Tooltip>
                                        </CardContent>
                                    </Card>

                                    <Card className="rounded-[20px] border-[rgba(108,72,197,0.1)] shadow-[0_4px_20px_rgba(108,72,197,0.08)]">
                                        <CardHeader className="pb-3">
                                            <CardDescription className="text-[14px] text-[#6B6B8D]">Conversiones</CardDescription>
                                            <CardTitle className="text-[24px] font-bold text-[#1A1A2E]">
                                                {stats.conversions.value.toLocaleString()}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-2 cursor-default">
                                                        {stats.conversions.isPositive ? (
                                                            <IconTrendingUp className="w-4 h-4 text-[#4CAF50]" />
                                                        ) : (
                                                            <IconTrendingDown className="w-4 h-4 text-[#EF4444]" />
                                                        )}
                                                        <span
                                                            className={`text-sm font-semibold ${stats.conversions.isPositive ? "text-[#4CAF50]" : "text-[#EF4444]"}`}
                                                        >
                                                            {stats.conversions.change > 0 ? "+" : ""}
                                                            {stats.conversions.change.toFixed(1)}%
                                                        </span>
                                                        <span className="text-sm text-[#6B6B8D]">vs mes anterior</span>
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
                                <Card className="lg:col-span-1 rounded-[20px] border-[rgba(108,72,197,0.1)] shadow-[0_4px_20px_rgba(108,72,197,0.08)]">
                                    <CardHeader className="space-y-1">
                                        <CardTitle className="text-[18px] font-bold text-[#1A1A2E] flex items-center gap-2">
                                            <IconTrophy className="w-5 h-5 text-[#FFD700]" />
                                            Ranking Top Influencers
                                        </CardTitle>
                                        <CardDescription className="text-[14px] text-[#6B6B8D]">
                                            Desde {startDate} hasta {endDate}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        {influencerRanking.length === 0 ? (
                                            <div className="flex items-center justify-center h-[400px] text-[#6B6B8D] text-sm">
                                                <p>No hay datos disponibles</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                                {influencerRanking.map((influencer) => (
                                                    <div
                                                        key={influencer.id}
                                                        className={cn(
                                                            "flex items-start gap-3 p-3 rounded-xl transition-all hover:bg-[rgba(108,72,197,0.05)] cursor-pointer",
                                                            influencer.rank <= 3 &&
                                                                "bg-gradient-to-r from-[rgba(255,215,0,0.1)] to-transparent border border-[rgba(255,215,0,0.2)]"
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
                                                                            : "#E8DEFF",
                                                                color: influencer.rank <= 3 ? "#1A1A2E" : "#6C48C5",
                                                            }}
                                                        >
                                                            {influencer.rank === 1 ? <IconCrown className="w-4 h-4" /> : influencer.rank}
                                                        </div>

                                                        {/* Información del influencer */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Avatar className="w-8 h-8">
                                                                    <AvatarFallback className="bg-[#E8DEFF] text-[#6C48C5] text-xs font-semibold">
                                                                        {influencer.name
                                                                            .split(" ")
                                                                            .map((n) => n[0])
                                                                            .join("")
                                                                            .toUpperCase()
                                                                            .slice(0, 2)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-semibold text-[#1A1A2E] truncate">
                                                                        {influencer.name}
                                                                    </p>
                                                                    {influencer.niche && (
                                                                        <p className="text-xs text-[#6B6B8D] truncate">
                                                                            {influencer.niche}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Métricas */}
                                                            <div className="mt-2 space-y-1">
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-[#6B6B8D]">Views:</span>
                                                                    <span className="font-semibold text-[#1A1A2E]">
                                                                        {(influencer.totalViews / 1000).toFixed(0)}k
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-[#6B6B8D]">Engagement:</span>
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="text-xs px-1.5 py-0 bg-[#E8DEFF] text-[#6C48C5]"
                                                                    >
                                                                        {influencer.engagementRate.toFixed(1)}%
                                                                    </Badge>
                                                                </div>
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-[#6B6B8D]">Conversiones:</span>
                                                                    <span className="font-semibold text-[#1A1A2E]">
                                                                        {influencer.totalConversions.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span className="text-[#6B6B8D]">ROI:</span>
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className={cn(
                                                                            "text-xs px-1.5 py-0",
                                                                            influencer.roi > 50
                                                                                ? "bg-[#E8F5E9] text-[#4CAF50]"
                                                                                : influencer.roi > 0
                                                                                  ? "bg-[#FFF3E0] text-[#FF9800]"
                                                                                  : "bg-[#FFEBEE] text-[#EF4444]"
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
                                <Card className="lg:col-span-3 rounded-[20px] border-[rgba(108,72,197,0.1)] shadow-[0_4px_20px_rgba(108,72,197,0.08)]">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-[18px] font-bold text-[#1A1A2E]">
                                                    Evolución del impacto de campaña
                                                </CardTitle>
                                                <CardDescription className="text-[14px] text-[#6B6B8D]">
                                                    Vistas, Engagement y Conversiones por día - desde {startDate} hasta {endDate}
                                                </CardDescription>
                                            </div>
                                            <Button
                                                variant="outline"
                                                onClick={exportToExcel}
                                                disabled={timeline.length === 0}
                                                className="h-10 border-[#6C48C5] text-[#6C48C5] hover:bg-[#E8DEFF] rounded-2xl px-4"
                                            >
                                                <IconDownload className="w-4 h-4 mr-2" />
                                                Descargar Excel
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                                        {timeline.length === 0 ? (
                                            <div className="flex items-center justify-center h-[400px] text-[#6B6B8D]">
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
                                                        tick={{ fill: "#6B6B8D", fontSize: 12 }}
                                                        tickFormatter={(value) => formatDate(value)}
                                                    />
                                                    <YAxis
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tick={{ fill: "#6B6B8D", fontSize: 12 }}
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

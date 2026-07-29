"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar } from "@/components/ui/calendar";
import { CartesianGrid, XAxis, YAxis, Area, AreaChart, Bar, BarChart } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { IconTrendingUp, IconTrendingDown, IconChevronDown, IconX, IconCrown, IconDownload, IconEye, IconHeart, IconShare, IconClick, IconArrowsShuffle, IconCurrencyDollar, IconUsers, IconFilter, IconCalendar, IconLoader2 } from "@tabler/icons-react";
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
    likes: number;
    shares: number;
    clicks: number;
    conversions: number;
    revenue: number;
    engagement: number;
    ctr: number;
    [key: string]: string | number;
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

const MONTHS = [
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

function fmt(n: number, style?: "currency" | "percent"): string {
    if (style === "currency") return `$${n.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    if (style === "percent") return `${n.toFixed(2)}%`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return n.toLocaleString("es-ES");
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
    const [selectedPlatformIds, setSelectedPlatformIds] = useState<number[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
    const [platformsOpen, setPlatformsOpen] = useState(false);
    const [chartMetric, setChartMetric] = useState<string>("views");
    const [loading, setLoading] = useState(true);

    const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

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

    const platformColors: Record<number, string> = {
        1: "#1E90FF",
        2: "#E4405F",
        3: "#FF0000",
        4: "#000000",
    };

    const fetchPlatforms = async () => {
        try {
            const res = await fetch("/api/data/platforms");
            const data = await res.json();
            const platformsData: Array<{ id: number; code: string; name: string }> = data.data || [];
            setPlatforms(platformsData);
            if (platformsData.length > 0 && selectedPlatformIds.length === 0) {
                const tiktok = platformsData.find((p) => p.code.toLowerCase() === "tiktok");
                const defaultId = tiktok ? tiktok.id : platformsData[0].id;
                setSelectedPlatformIds([defaultId]);
            }
        } catch {
            const fallback = [
                { id: 1, code: "tiktok", name: "TikTok" },
                { id: 2, code: "instagram", name: "Instagram" },
                { id: 3, code: "youtube", name: "YouTube" },
                { id: 4, code: "x", name: "X (Twitter)" },
            ];
            setPlatforms(fallback);
            if (selectedPlatformIds.length === 0) {
                setSelectedPlatformIds([fallback[0].id]);
            }
        }
    };

    const fetchCampaigns = async () => {
        try {
            const res = await fetch("/api/campaigns");
            const data = await res.json();
            const apiCampaigns = (data.data || []) as Array<{ id: number; name: string }>;
            setCampaigns(apiCampaigns.map((c) => ({ id: c.id, name: c.name })));
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        }
    };

    const fetchInfluencerRanking = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (startDate && endDate) {
                params.append("startDate", new Date(startDate).toISOString());
                params.append("endDate", new Date(endDate).toISOString());
            }
            params.append("limit", "10");
            if (selectedCampaignId && selectedCampaignId !== "all") params.append("campaignId", selectedCampaignId);
            if (selectedPlatformIds.length > 0) params.append("socialPlatformId", selectedPlatformIds.join(","));
            const res = await fetch(`/api/dashboard/influencer-ranking?${params.toString()}`);
            const data = await res.json();
            setInfluencerRanking(data.data || []);
        } catch {
            setInfluencerRanking([]);
        }
    }, [startDate, endDate, selectedPlatformIds, selectedCampaignId]);

    useEffect(() => {
        fetchPlatforms();
        fetchCampaigns();
    }, []);

    useEffect(() => {
        if (platforms.length >= 0) fetchInfluencerRanking();
    }, [fetchInfluencerRanking, platforms.length]);

    useEffect(() => {
        if (platforms.length > 0 || (platforms.length === 0 && selectedPlatformIds.length === 0)) {
            fetchStats();
            fetchTimeline();
        }
    }, [startDate, endDate, selectedPlatformIds, selectedCampaignId, platforms.length]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (startDate && endDate) {
                params.append("startDate", new Date(startDate).toISOString());
                params.append("endDate", new Date(endDate).toISOString());
            }
            if (selectedCampaignId && selectedCampaignId !== "all") params.append("campaignId", selectedCampaignId);
            if (selectedPlatformIds.length > 0) selectedPlatformIds.forEach((id) => params.append("socialPlatformId", id.toString()));
            const res = await fetch(`/api/dashboard/stats?${params.toString()}`);
            if (!res.ok) throw new Error(`Error ${res.status}`);
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
            if (selectedCampaignId) params.append("campaignId", selectedCampaignId);
            if (selectedPlatformIds.length > 0) selectedPlatformIds.forEach((id) => params.append("socialPlatformId", id.toString()));
            const res = await fetch(`/api/dashboard/timeline?${params.toString()}`);
            if (!res.ok) throw new Error(`Error ${res.status}`);
            const data = await res.json();
            const timelineData = (data.data || []).map((item: TimelineData) => ({
                date: item.date || "",
                views: typeof item.views === "number" && !isNaN(item.views) ? item.views : 0,
                likes: typeof item.likes === "number" && !isNaN(item.likes) ? item.likes : 0,
                shares: typeof item.shares === "number" && !isNaN(item.shares) ? item.shares : 0,
                clicks: typeof item.clicks === "number" && !isNaN(item.clicks) ? item.clicks : 0,
                conversions: typeof item.conversions === "number" && !isNaN(item.conversions) ? item.conversions : 0,
                revenue: typeof item.revenue === "number" && !isNaN(item.revenue) ? item.revenue : 0,
                engagement: typeof item.engagement === "number" && !isNaN(item.engagement) ? item.engagement : 0,
                ctr: typeof item.ctr === "number" && !isNaN(item.ctr) ? item.ctr : 0,
            }));
            setTimeline(timelineData);
        } catch (error) {
            console.error("Error fetching timeline:", error);
            setTimeline([]);
        }
    };

    const chartConfig = useMemo<ChartConfig>(() => {
        const config: ChartConfig = {
            views: { label: "Vistas", color: "#6C48C5" },
            likes: { label: "Likes", color: "#E4405F" },
            shares: { label: "Shares", color: "#2EC7FF" },
            clicks: { label: "Clics", color: "#FF8C00" },
            conversions: { label: "Conversiones", color: "#4CAF50" },
            revenue: { label: "Ingresos", color: "#F59E0B" },
            engagement: { label: "Engagement %", color: "#8B5CF6" },
            ctr: { label: "CTR %", color: "#06B6D4" },
        };

        selectedPlatformIds.forEach((platformId) => {
            const platform = platforms.find((p) => p.id === platformId);
            if (platform) {
                const color = platformColors[platformId] || "#6C48C5";
                config[`views_${platform.code}`] = { label: `Vistas ${platform.name}`, color };
                config[`engagement_${platform.code}`] = { label: `Engagement ${platform.name}`, color };
            }
        });

        return config;
    }, [selectedPlatformIds, platforms]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    };

    const exportToExcel = async () => {
        if (timeline.length === 0) {
            toast.error("No hay datos para exportar");
            return;
        }
        try {
            const selectedCampaignName = selectedCampaignId && selectedCampaignId !== "all"
                ? (campaigns.find((c) => c.id === Number(selectedCampaignId))?.name ?? "Campaña seleccionada")
                : "Todas las campañas";
            const selectedPlatformNames = selectedPlatformIds.length > 0
                ? selectedPlatformIds.map((id) => platforms.find((p) => p.id === id)?.name).filter(Boolean).join(", ")
                : "Todas las plataformas";

            const excelData = timeline.map((item) => {
                const row: Record<string, string | number> = {
                    Fecha: new Date(item.date).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" }),
                    Canales: selectedPlatformNames,
                    Campaña: selectedCampaignName,
                };
                if (selectedPlatformIds.length > 1) {
                    selectedPlatformIds.forEach((platformId) => {
                        const platform = platforms.find((p) => p.id === platformId);
                        if (platform) {
                            const viewsKey = `views_${platform.code}` as keyof typeof item;
                            const engagementKey = `engagement_${platform.code}` as keyof typeof item;
                            const conversionsKey = `conversions_${platform.code}` as keyof typeof item;
                            row[`Vistas ${platform.name}`] = typeof item[viewsKey] === "number" ? item[viewsKey] : 0;
                            const ev = item[engagementKey];
                            row[`Engagement ${platform.name} (%)`] = typeof ev === "number" ? Number(ev.toFixed(2)) : 0;
                            row[`Conversiones ${platform.name}`] = typeof item[conversionsKey] === "number" ? item[conversionsKey] : 0;
                        }
                    });
                    row["Vistas Totales"] = item.views || 0;
                    row["Engagement Total (%)"] = typeof item.engagement === "number" ? Number(item.engagement.toFixed(2)) : 0;
                    row["Conversiones Totales"] = item.conversions || 0;
                } else {
                    row["Vistas"] = item.views || 0;
                    row["Likes"] = item.likes || 0;
                    row["Shares"] = item.shares || 0;
                    row["Clics"] = item.clicks || 0;
                    row["Conversiones"] = item.conversions || 0;
                    row["Ingresos"] = item.revenue || 0;
                    row["Engagement (%)"] = typeof item.engagement === "number" ? Number(item.engagement.toFixed(2)) : 0;
                    row["CTR (%)"] = typeof item.ctr === "number" ? Number(item.ctr.toFixed(2)) : 0;
                }
                return row;
            });

            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet("Impacto de campaña");
            const headers = Object.keys(excelData[0] || {});
            ws.addRow(headers);
            for (const rowObj of excelData) {
                ws.addRow(headers.map((h) => (rowObj[h] !== undefined ? rowObj[h] : "")));
            }
            headers.forEach((key, idx) => {
                const maxLen = Math.max(key.length, ...excelData.map((r) => String(r[key] ?? "").length));
                ws.getColumn(idx + 1).width = Math.min(50, maxLen + 2);
            });
            const platformNames = selectedPlatformIds.length > 0
                ? selectedPlatformIds.map((id) => platforms.find((p) => p.id === id)?.name).filter(Boolean).join("_")
                : "Todas";
            const fileName = `Evolucion_impacto_${platformNames}.xlsx`;

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
            toast.success("Excel descargado");
        } catch {
            toast.error("Error al exportar");
        }
    };

    const KPI_CARDS = stats ? [
        { key: "reach", label: "Alcance", value: fmt(stats.reach.value), change: stats.reach.change, isPositive: stats.reach.isPositive, icon: IconEye, color: "#6C48C5" },
        { key: "engagement", label: "Engagement", value: `${stats.engagement.value.toFixed(2)}%`, change: stats.engagement.change, isPositive: stats.engagement.isPositive, icon: IconHeart, color: "#E4405F" },
        { key: "clicks", label: "Clics", value: fmt(stats.clicks.value), change: stats.clicks.change, isPositive: stats.clicks.isPositive, icon: IconClick, color: "#FF8C00" },
        { key: "conversions", label: "Conversiones", value: fmt(stats.conversions.value), change: stats.conversions.change, isPositive: stats.conversions.isPositive, icon: IconArrowsShuffle, color: "#4CAF50" },
        { key: "ctr", label: "CTR", value: `${stats.ctr.value.toFixed(2)}%`, change: stats.ctr.change, isPositive: stats.ctr.isPositive, icon: IconShare, color: "#06B6D4" },
        { key: "revenue", label: "Ingresos", value: fmt(stats.revenue.value, "currency"), change: stats.revenue.change, isPositive: stats.revenue.isPositive, icon: IconCurrencyDollar, color: "#F59E0B" },
    ] : [];

    const totalFromTimeline = {
        views: timeline.reduce((s, i) => s + i.views, 0),
        likes: timeline.reduce((s, i) => s + i.likes, 0),
        shares: timeline.reduce((s, i) => s + i.shares, 0),
        clicks: timeline.reduce((s, i) => s + i.clicks, 0),
        conversions: timeline.reduce((s, i) => s + i.conversions, 0),
        revenue: timeline.reduce((s, i) => s + i.revenue, 0),
    };

    const chartMetricConfig = chartConfig[chartMetric as keyof typeof chartConfig] || { label: "Métrica", color: "#6C48C5" };
    const chartDataKey = selectedPlatformIds.length > 1 ? (() => {
        const first = platforms.find((p) => p.id === selectedPlatformIds[0]);
        return first ? `views_${first.code}` : "views";
    })() : chartMetric;

    const totalTimelineDays = timeline.length;
    const avgPerDay = totalTimelineDays > 0 ? {
        views: Math.round(totalFromTimeline.views / totalTimelineDays),
        engagement: timeline.reduce((s, i) => s + i.engagement, 0) / totalTimelineDays,
        conversions: Math.round(totalFromTimeline.conversions / totalTimelineDays),
    } : null;

    if (loading && !stats) {
        return (

                    <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground">
                        <IconLoader2 className="w-5 h-5 animate-spin" />
                        Cargando dashboard...
                    </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-5 md:py-5 px-4 lg:px-6 bg-muted min-h-full">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div>
                                    <h1 className="text-[28px] font-bold text-foreground mb-1">
                                        Dashboard
                                        {loading && <IconLoader2 className="w-4 h-4 inline animate-spin ml-2 text-muted-foreground" />}
                                    </h1>
                                    <p className="text-[16px] text-muted-foreground">Métricas clave y rendimiento de campañas</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={exportToExcel} disabled={timeline.length === 0} className="rounded-2xl gap-2 h-9">
                                        <IconDownload className="w-4 h-4" />
                                        Exportar
                                    </Button>
                                </div>
                            </div>

                            {/* Filters bar */}
                            <div className="flex flex-wrap items-center gap-2 bg-card rounded-2xl px-4 py-3 border border-primary/5 shadow-sm">
                                <IconFilter className="w-4 h-4 text-muted-foreground shrink-0" />
                                <div className="flex items-center gap-2">
                                    <Switch checked={dateMode === "monthly"} onCheckedChange={(c) => {
                                        const newMode = c ? "monthly" : "range";
                                        setDateMode(newMode);
                                        if (newMode === "monthly") updateDatesFromMonthSelection(year, selectedMonths);
                                    }} className="data-[state=checked]:bg-primary" />
                                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Mensual</Label>
                                </div>
                                <div className="w-px h-6 bg-primary/10" />
                                {dateMode === "range" ? (
                                    <>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="sm" className="rounded-2xl h-8 gap-1.5 text-xs font-normal">
                                                    <IconCalendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                    {new Date(startDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={new Date(startDate)} onSelect={(d) => d && setStartDate(d.toISOString().split("T")[0])} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                        <span className="text-xs text-muted-foreground">→</span>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="sm" className="rounded-2xl h-8 gap-1.5 text-xs font-normal">
                                                    <IconCalendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                    {new Date(endDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={new Date(endDate)} onSelect={(d) => d && setEndDate(d.toISOString().split("T")[0])} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                    </>
                                ) : (
                                    <>
                                        <Select value={year} onValueChange={(v) => { setYear(v); updateDatesFromMonthSelection(v, selectedMonths); }}>
                                            <SelectTrigger className="h-8 w-[100px] rounded-2xl text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {years.map((y) => (<SelectItem key={y} value={y} className="text-xs">{y}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="sm" className="rounded-2xl h-8 text-xs gap-1 font-normal">
                                                    {selectedMonths.length === 0 ? "Meses" : selectedMonths.length === 1
                                                        ? MONTHS.find((m) => m.value === selectedMonths[0])?.label
                                                        : `${selectedMonths.length} meses`}
                                                    <IconChevronDown className="w-3 h-3 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-3 rounded-2xl">
                                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                                    {MONTHS.map((m) => {
                                                        const checked = selectedMonths.includes(m.value);
                                                        return (
                                                            <div key={m.value} className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-primary/10 cursor-pointer" onClick={() => {
                                                                const next = checked ? selectedMonths.filter((v) => v !== m.value) : [...selectedMonths, m.value];
                                                                setSelectedMonths(next);
                                                                updateDatesFromMonthSelection(year, next);
                                                            }}>
                                                                <Checkbox checked={checked} className="border-primary data-[state=checked]:bg-primary" />
                                                                <span className="text-xs text-foreground">{m.label}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </>
                                )}
                                <div className="w-px h-6 bg-primary/10" />
                                <Popover open={platformsOpen} onOpenChange={setPlatformsOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm" className={cn("rounded-2xl h-8 text-xs gap-1", selectedPlatformIds.length === 0 && "text-muted-foreground")}>
                                            <IconUsers className="w-3.5 h-3.5" />
                                            {selectedPlatformIds.length === 0 ? "Canales" : selectedPlatformIds.length === 1
                                                ? platforms.find((p) => p.id === selectedPlatformIds[0])?.name || "1 canal"
                                                : `${selectedPlatformIds.length} canales`}
                                            <IconChevronDown className="w-3 h-3 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[220px] p-3 rounded-2xl">
                                        {platforms.map((platform) => {
                                            const isSelected = selectedPlatformIds.includes(platform.id);
                                            return (
                                                <div key={platform.id} className="flex items-center gap-2 px-1.5 py-1.5 rounded-lg hover:bg-primary/10 cursor-pointer" onClick={() => {
                                                    if (isSelected) setSelectedPlatformIds(selectedPlatformIds.filter((id) => id !== platform.id));
                                                    else setSelectedPlatformIds([...selectedPlatformIds, platform.id]);
                                                }}>
                                                    <Checkbox checked={isSelected} className="border-primary data-[state=checked]:bg-primary" />
                                                    <span className="text-xs text-foreground font-medium">{platform.name}</span>
                                                </div>
                                            );
                                        })}
                                    </PopoverContent>
                                </Popover>
                                {selectedPlatformIds.length > 0 && (
                                    <div className="flex gap-1">
                                        {selectedPlatformIds.map((id) => {
                                            const p = platforms.find((pl) => pl.id === id);
                                            if (!p) return null;
                                            return (
                                                <div key={id} className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded-lg text-[10px] font-medium">
                                                    {p.name}
                                                    <button onClick={() => {
                                                        setSelectedPlatformIds(selectedPlatformIds.filter((pid) => pid !== id));
                                                    }} className="hover:bg-primary hover:text-primary-foreground rounded-full p-0.5">
                                                        <IconX className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                <div className="w-px h-6 bg-primary/10" />
                                <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                                    <SelectTrigger className="h-8 w-[180px] rounded-2xl text-xs">
                                        <SelectValue placeholder="Todas las campañas" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all" className="text-xs">Todas las campañas</SelectItem>
                                        {campaigns.map((c) => (
                                            <SelectItem key={c.id} value={c.id.toString()} className="text-xs">{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Empty state */}
                            {!stats && !loading && (
                                <Card className="rounded-[20px] border-primary/5 p-12 text-center">
                                    <p className="text-muted-foreground text-lg">No hay datos disponibles</p>
                                    <p className="text-muted-foreground text-sm mt-1">Ajusta los filtros o carga métricas para ver resultados</p>
                                </Card>
                            )}

                            {/* KPIs */}
                            {stats && (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                    {KPI_CARDS.map((kpi) => {
                                        const Icon = kpi.icon;
                                        return (
                                            <Card key={kpi.key} className="rounded-[20px] border-primary/5 shadow-[var(--card-shadow-sm)]">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
                                                        <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                                                    </div>
                                                    <p className="text-3xl font-bold text-foreground leading-tight">{kpi.value}</p>
                                                    <div className="flex items-center gap-1 mt-1.5">
                                                        {kpi.change > 0 ? (
                                                            <IconTrendingUp className="w-3.5 h-3.5 text-green-600" />
                                                        ) : (
                                                            <IconTrendingDown className="w-3.5 h-3.5 text-red-500" />
                                                        )}
                                                        <span className={cn("text-[11px] font-semibold", kpi.isPositive ? "text-green-600" : "text-red-500")}>
                                                            {kpi.change > 0 ? "+" : ""}{kpi.change.toFixed(1)}%
                                                        </span>
                                                        <span className="text-[11px] text-muted-foreground">vs anterior</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Summary row */}
                            {timeline.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <Card className="rounded-[16px] border-primary/5 shadow-sm col-span-2">
                                        <CardContent className="p-4 flex items-center gap-6 flex-wrap">
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Total vistas</p>
                                                <p className="text-3xl font-bold text-foreground">{fmt(totalFromTimeline.views)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Likes</p>
                                                <p className="text-3xl font-bold text-foreground">{fmt(totalFromTimeline.likes)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Shares</p>
                                                <p className="text-3xl font-bold text-foreground">{fmt(totalFromTimeline.shares)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Clics</p>
                                                <p className="text-3xl font-bold text-foreground">{fmt(totalFromTimeline.clicks)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Conversiones</p>
                                                <p className="text-3xl font-bold text-foreground">{fmt(totalFromTimeline.conversions)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Ingresos</p>
                                                <p className="text-3xl font-bold text-foreground">{fmt(totalFromTimeline.revenue, "currency")}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    {avgPerDay && (
                                        <Card className="rounded-[16px] border-primary/5 shadow-sm col-span-1">
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <div>
                                                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Promedio diario</p>
                                                    <div className="flex gap-4 mt-1">
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground">Vistas</p>
                                                            <p className="text-3xl font-bold text-foreground">{fmt(avgPerDay.views)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground">Eng.</p>
                                                            <p className="text-3xl font-bold text-foreground">{avgPerDay.engagement.toFixed(2)}%</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground">Conv.</p>
                                                            <p className="text-3xl font-bold text-foreground">{fmt(avgPerDay.conversions)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                    <Card className="rounded-[16px] border-primary/5 shadow-sm col-span-1">
                                        <CardContent className="p-4">
                                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Período activo</p>
                                            <p className="text-3xl font-bold text-foreground mt-1">{totalTimelineDays} días</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                {new Date(startDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })} — {new Date(endDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Ranking + Chart */}
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                                {/* Ranking */}
                                <Card className="lg:col-span-1 rounded-[20px] border-primary/5 shadow-[var(--card-shadow-sm)]">
                                    <CardHeader className="pb-2 px-5 pt-5">
                                        <CardTitle className="text-[16px] font-bold text-foreground flex items-center gap-2">
                                            <IconCrown className="w-4 h-4 text-amber-500" />
                                            Top Influencers
                                        </CardTitle>
                                        <CardDescription className="text-[12px] text-muted-foreground">
                                            {influencerRanking.length > 0 ? `Ranking de ${influencerRanking.length} influencers` : "Sin datos"}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        {influencerRanking.length === 0 ? (
                                            <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">No hay datos disponibles</div>
                                        ) : (
                                            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                                                {influencerRanking.map((inf) => {
                                                    const maxViews = Math.max(...influencerRanking.map((i) => i.totalViews), 1);
                                                    const barWidth = (inf.totalViews / maxViews) * 100;
                                                    return (
                                                        <div key={inf.id} className={cn(
                                                            "p-3 rounded-xl transition-all hover:bg-primary/5"
                                                        )}>
                                                            <div className="flex items-start gap-2.5">
                                                                <div className={cn(
                                                                    "flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold",
                                                                    inf.rank === 1 ? "bg-amber-400 text-amber-950" : inf.rank === 2 ? "bg-gray-300 text-gray-700" : inf.rank === 3 ? "bg-orange-300 text-orange-900" : "bg-primary/10 text-primary"
                                                                )}>
                                                                    {inf.rank === 1 ? <IconCrown className="w-3.5 h-3.5" /> : inf.rank}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <Avatar className="w-6 h-6">
                                                                            <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-semibold">
                                                                                {inf.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <p className="text-sm font-semibold text-foreground truncate">{inf.name}</p>
                                                                    </div>
                                                                    {inf.niche && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{inf.niche}</p>}
                                                                    {/* Mini bar */}
                                                                    <div className="mt-1.5 h-1.5 bg-primary/5 rounded-full overflow-hidden">
                                                                        <div className="h-full rounded-full bg-[#2EC7FF]" style={{ width: `${barWidth}%` }} />
                                                                    </div>
                                                                    <div className="flex items-center justify-between mt-1 text-[10px]">
                                                                        <span className="text-muted-foreground">{fmt(inf.totalViews)} vistas</span>
                                                                        <Badge variant="secondary" className={cn(
                                                                            "text-[9px] px-1.5 py-0 h-4",
                                                                            inf.roi > 50 ? "bg-green-500/10 text-green-600 dark:text-green-400" : inf.roi > 0 ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
                                                                        )}>
                                                                            {inf.roi > 0 ? "+" : ""}{inf.roi.toFixed(0)}% ROI
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Chart */}
                                <Card className="lg:col-span-3 rounded-[20px] border-primary/5 shadow-[var(--card-shadow-sm)]">
                                    <CardHeader className="pb-2 px-5 pt-5">
                                        <div className="flex items-center justify-between flex-wrap gap-3">
                                            <div>
                                                <CardTitle className="text-[16px] font-bold text-foreground">Evolución de métricas</CardTitle>
                                                <CardDescription className="text-[12px] text-muted-foreground">
                                                    {new Date(startDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })} — {new Date(endDate).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                                                </CardDescription>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-muted rounded-2xl p-1">
                                                {["views", "likes", "shares", "conversions", "revenue", "engagement", "ctr"].map((m) => {
                                                    const cfg = chartConfig[m as keyof typeof chartConfig];
                                                    if (!cfg) return null;
                                                    return (
                                                        <button key={m} onClick={() => setChartMetric(m)} className={cn(
                                                            "px-2.5 py-1 rounded-xl text-[10px] font-medium transition-all",
                                                            chartMetric === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                                        )}>
                                                            {cfg.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-2 pt-2 sm:px-5 sm:pt-4">
                                        {timeline.length === 0 ? (
                                            <div className="flex items-center justify-center h-[350px] text-muted-foreground text-sm">No hay datos para el período seleccionado</div>
                                        ) : (
                                            <ChartContainer config={chartConfig} className="aspect-auto h-[350px] w-full">
                                                <AreaChart data={timeline} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
                                                    <defs>
                                                        <linearGradient id="fillMetric" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor={chartMetricConfig.color || "#6C48C5"} stopOpacity={0.35} />
                                                            <stop offset="95%" stopColor={chartMetricConfig.color || "#6C48C5"} stopOpacity={0.03} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                                                    <XAxis
                                                        dataKey="date"
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickMargin={6}
                                                        minTickGap={40}
                                                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                                                        tickFormatter={(v) => formatDate(v)}
                                                    />
                                                    <YAxis
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                                                        tickFormatter={(v) => {
                                                            if (["engagement", "ctr"].includes(chartMetric)) return `${v.toFixed(1)}%`;
                                                            if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                                                            if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                                                            return v.toString();
                                                        }}
                                                        width={45}
                                                    />
                                                    <ChartTooltip
                                                        cursor={false}
                                                        content={<ChartTooltipContent
                                                            labelFormatter={(v) => formatDate(v as string)}
                                                            formatter={(value, name) => {
                                                                const cfg = chartConfig[name as keyof typeof chartConfig];
                                                                const label = cfg?.label || name;
                                                                if (["engagement", "ctr"].includes(name as string)) return [`${Number(value).toFixed(2)}%`, label];
                                                                return [Number(value).toLocaleString("es-ES"), label];
                                                            }}
                                                            indicator="dot"
                                                        />}
                                                    />
                                                    {selectedPlatformIds.length > 1 ? (
                                                        selectedPlatformIds.map((platformId) => {
                                                            const platform = platforms.find((p) => p.id === platformId);
                                                            if (!platform) return null;
                                                            const color = platformColors[platformId] || "#6C48C5";
                                                            return (
                                                                <Area
                                                                    key={`views_${platform.code}`}
                                                                    dataKey={`views_${platform.code}`}
                                                                    type="natural"
                                                                    fill={`url(#fillMetric)`}
                                                                    stroke={color}
                                                                    strokeWidth={2}
                                                                    name={`Vistas ${platform.name}`}
                                                                    stackId="a"
                                                                />
                                                            );
                                                        })
                                                    ) : (
                                                        <Area
                                                            dataKey={chartDataKey}
                                                            type="natural"
                                                            fill="url(#fillMetric)"
                                                            stroke={chartMetricConfig.color || "#6C48C5"}
                                                            strokeWidth={2.5}
                                                            name={chartMetric}
                                                        />
                                                    )}
                                                    {selectedPlatformIds.length <= 1 && <ChartLegend content={<ChartLegendContent />} />}
                                                </AreaChart>
                                            </ChartContainer>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
    );
}

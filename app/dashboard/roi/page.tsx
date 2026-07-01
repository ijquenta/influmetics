"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, LabelList, ResponsiveContainer } from "recharts";
import { IconTrendingUp, IconTrendingDown, IconWallet, IconUsers, IconAlertCircle, IconChevronDown, IconLoader2, IconDownload, IconInfoCircle } from "@tabler/icons-react";
import ExcelJS from "exceljs";
import { toast } from "sonner";
import { getROILabel, getROIColor } from "@/lib/roi";

interface InfluencerOption {
    id: number;
    name: string;
    referralCode: string | null;
    username?: string | null;
    socialPlatforms?: string[];
    campaignId?: number | null;
    campaignName?: string | null;
}

interface RoiTimelinePoint {
    date: string;
    [key: string]: number | string;
}

interface RoiSummary {
    influencerId: number;
    name: string;
    referralCode: string | null;
    username?: string | null;
    socialPlatforms?: string[];
    campaignId?: number | null;
    campaignName?: string | null;
    nau: number;
    roi: number;
    views: number;
    engagements: number;
    engagementRate: number;
    cpm: number | null;
    cpe: number | null;
    investment: number;
    emv: number;
}

// Helper para formatear fechas al formato YYYY-MM-DD del input date
const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0];
};


export default function RoiPage() {
    const [influencers, setInfluencers] = useState<InfluencerOption[]>([]);
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const [startDate, setStartDate] = useState<string>(formatDateForInput(firstDayOfMonth));
    const [endDate, setEndDate] = useState<string>(formatDateForInput(today));
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
    const [selectedReferralCodes, setSelectedReferralCodes] = useState<string[]>([]);

    const chartConfig: ChartConfig = useMemo(
        () => ({
            roi: {
                label: "EMV",
                color: "#6C48C5",
            },
        }),
        []
    );

    const LINE_COLORS = ["#6C48C5", "#10B981", "#F59E0B", "#3B82F6", "#EF4444"];

    const fetchInfluencers = async () => {
        try {
            const res = await fetch("/api/influencers");
            const data = await res.json();
            const apiInfluencers = (data.data || []) as Array<{
                id: number;
                name: string;
                referralCode: string | null;
                socialAccounts?: Array<{
                    handle: string | null;
                    socialPlatform: { name: string };
                }>;
                influencerCampaigns?: Array<{
                    campaign: { id: number; name: string };
                }>;
            }>;

            const list: InfluencerOption[] = apiInfluencers.flatMap((inf) => {
                const platforms = inf.socialAccounts?.map((sa) => sa.socialPlatform.name) ?? [];
                const primaryHandleRaw = inf.socialAccounts?.[0]?.handle ?? null;
                const primaryHandle = primaryHandleRaw ? "@" + primaryHandleRaw.replace(/^@/, "") : null;
                const username = primaryHandle || null;
                const socialPlatforms = platforms.length > 0 ? platforms : [];

                if (!inf.influencerCampaigns || inf.influencerCampaigns.length === 0) {
                    const single: InfluencerOption = {
                        id: inf.id,
                        name: inf.name,
                        referralCode: inf.referralCode,
                        username,
                        socialPlatforms,
                        campaignId: undefined,
                        campaignName: undefined,
                    };
                    return [single];
                }

                return inf.influencerCampaigns.map<InfluencerOption>((ic) => ({
                    id: inf.id,
                    name: inf.name,
                    referralCode: inf.referralCode,
                    username,
                    socialPlatforms,
                    campaignId: ic.campaign.id,
                    campaignName: ic.campaign.name,
                }));
            });

            setInfluencers(list);

            // Preseleccionar primera campaña si aún no hay una seleccionada
            if (selectedCampaignId === "all") {
                const firstCampaign = list.find((inf) => inf.campaignId != null);
                if (firstCampaign?.campaignId != null) {
                    setSelectedCampaignId(firstCampaign.campaignId.toString());
                }
            }

            // Preseleccionar hasta 3 códigos de referido distintos por defecto
            const defaultCodes = Array.from(new Set(list.map((inf) => inf.referralCode).filter((code): code is string => !!code))).slice(
                0,
                3
            );
            setSelectedReferralCodes(defaultCodes);
        } catch (error) {
            console.error("Error fetching influencers:", error);
            setInfluencers([]);
        }
    };

    useEffect(() => {
        // Cargar influencers al montar el componente
        void fetchInfluencers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [timeline, setTimeline] = useState<RoiTimelinePoint[]>([]);
    const [summary, setSummary] = useState<RoiSummary[]>([]);
    const [loadingRoi, setLoadingRoi] = useState(false);

    const fetchRoiData = async () => {
        setLoadingRoi(true);
        try {
            const params = new URLSearchParams({
                startDate,
                endDate,
                campaignId: selectedCampaignId,
            });
            const res = await fetch(`/api/roi/calculate?${params}`);
            const data = await res.json();
            if (res.ok) {
                setTimeline(data.timeline || []);
                setSummary(data.summary || []);
            }
        } catch {
            console.error("Error fetching ROI data");
        } finally {
            setLoadingRoi(false);
        }
    };

    useEffect(() => {
        if (influencers.length > 0) {
            fetchRoiData();
        }
    }, [startDate, endDate, selectedCampaignId, influencers]);

    const selectedCampaignName = useMemo(() => {
        if (selectedCampaignId === "all") return "Todas las campañas";
        const idNum = parseInt(selectedCampaignId);
        const campaign = influencers.find((inf) => inf.campaignId === idNum);
        return campaign?.campaignName || "Campaña seleccionada";
    }, [selectedCampaignId, influencers]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
        });
    };

    const alerts = useMemo(() => summary.filter((item) => item.nau === 0 || item.roi < 0), [summary]);

    // Top 5 influencers por ROI
    const topSummaryForChart = useMemo(() => summary.slice(0, 5), [summary]);

    const totalInvestment = useMemo(() => summary.reduce((s, r) => s + r.investment, 0), [summary]);
    const totalEMV = useMemo(() => summary.reduce((s, r) => s + r.emv, 0), [summary]);
    const avgROI = useMemo(() => {
        if (summary.length === 0) return 0;
        return summary.reduce((s, r) => s + r.roi, 0) / summary.length;
    }, [summary]);
    const negativeCount = useMemo(() => summary.filter((r) => r.roi < 0 || r.nau === 0).length, [summary]);

    const exportTimelineToExcel = async () => {
        if (timeline.length === 0 || topSummaryForChart.length === 0) {
            toast.error("No hay datos de EMV para exportar");
            return;
        }

        try {
            const excelData = timeline.map((item) => {
                const row: Record<string, string | number> = {
                    Fecha: new Date(item.date).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                    }),
                    Campaña: selectedCampaignName,
                };

                topSummaryForChart.forEach((inf) => {
                    const key = inf.referralCode || `INF_${inf.influencerId}`;
                    const label = inf.referralCode ? `${inf.referralCode} / ${inf.name}` : inf.name;
                    const value = item[key as keyof RoiTimelinePoint];
                    row[`EMV ${label}`] = typeof value === "number" && !Number.isNaN(value) ? value : 0;
                });

                return row;
            });

            // Usar ExcelJS para generar el archivo en el cliente
            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet("EMV en el tiempo");

            const headers = Object.keys(excelData[0] || {});
            ws.addRow(headers);
            for (const rowObj of excelData) {
                const row = headers.map((h) => (rowObj[h] !== undefined ? rowObj[h] : ""));
                ws.addRow(row);
            }

            headers.forEach((key, idx) => {
                const maxLen = Math.max(key.length, ...excelData.map((r) => String(r[key] ?? "").length));
                ws.getColumn(idx + 1).width = Math.min(50, maxLen + 2);
            });

            const fileName = `ROI_EMV_Top5_${selectedCampaignName
                .replace(/\s+/g, "_")
                .replace(/[^a-zA-Z0-9_]/g, "")}_${startDate}_${endDate}.xlsx`;

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
            console.error("Error exportando NAU a Excel:", error);
            toast.error("Error al exportar los datos");
        }
    };

    return (

                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 bg-muted min-h-full">
                            {/* Header */}
                            <div className="flex flex-col gap-1 mb-2">
                                <h1 className="text-[28px] font-bold text-foreground">ROI y retorno de inversión</h1>
                                <p className="text-[16px] text-muted-foreground">
                                    Mide el retorno que genera cada influencer según sus métricas en TikTok y la inversión registrada.
                                </p>
                            </div>

                            {/* KPI Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                    <CardContent className="p-4 md:p-5">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <IconWallet className="w-4 h-4" />
                                            <p className="text-[11px] font-medium uppercase tracking-wider">Inversión total</p>
                                        </div>
                                        <p className="text-[22px] font-bold text-foreground">
                                            ${totalInvestment.toLocaleString("es-ES")}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{summary.length} influencers</p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                    <CardContent className="p-4 md:p-5">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <IconTrendingUp className="w-4 h-4" />
                                            <p className="text-[11px] font-medium uppercase tracking-wider">Valor engagement</p>
                                        </div>
                                        <p className="text-[22px] font-bold text-foreground">
                                            ${totalEMV.toLocaleString("es-ES")}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">Basado en EMV (vistas × CPM $8)</p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                    <CardContent className="p-4 md:p-5">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <IconTrendingUp className="w-4 h-4" />
                                            <p className="text-[11px] font-medium uppercase tracking-wider">ROI promedio</p>
                                        </div>
                                        <p className={`text-[22px] font-bold ${getROIColor(avgROI)}`}>
                                            {avgROI >= 0 ? "+" : ""}{Math.round(avgROI)}%
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{getROILabel(avgROI)}</p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                    <CardContent className="p-4 md:p-5">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <IconUsers className="w-4 h-4" />
                                            <p className="text-[11px] font-medium uppercase tracking-wider">Influencers</p>
                                        </div>
                                        <p className="text-[22px] font-bold text-foreground">{summary.length}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                            {summary.filter((r) => r.roi > 0).length} con ROI positivo
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                    <CardContent className="p-4 md:p-5">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <IconTrendingDown className="w-4 h-4" />
                                            <p className="text-[11px] font-medium uppercase tracking-wider">Con pérdida</p>
                                        </div>
                                        <p className={`text-[22px] font-bold ${negativeCount > 0 ? "text-red-500" : "text-foreground"}`}>
                                            {negativeCount}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">
                                            {negativeCount > 0 ? "Revisar campañas" : "Sin incidencias"}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Filters */}
                            <div className="flex flex-wrap gap-3 items-end">
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Desde</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="h-10 w-[180px] justify-between rounded-2xl text-left font-normal">
                                                {startDate
                                                    ? new Date(startDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
                                                    : "Seleccionar"}
                                                <IconChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={startDate ? new Date(startDate) : undefined} onSelect={(d) => d && setStartDate(formatDateForInput(d))} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Hasta</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="h-10 w-[180px] justify-between rounded-2xl text-left font-normal">
                                                {endDate
                                                    ? new Date(endDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
                                                    : "Seleccionar"}
                                                <IconChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={endDate ? new Date(endDate) : undefined} onSelect={(d) => d && setEndDate(formatDateForInput(d))} initialFocus />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Campaña</Label>
                                    <Select value={selectedCampaignId} onValueChange={(v) => {
                                        setSelectedCampaignId(v);
                                        if (v !== "all") {
                                            const cid = parseInt(v);
                                            const codes = Array.from(new Set(influencers.filter((i) => i.campaignId === cid && i.referralCode).map((i) => i.referralCode as string))).slice(0, 3);
                                            if (codes.length > 0) setSelectedReferralCodes(codes);
                                        }
                                    }}>
                                        <SelectTrigger className="h-10 w-[200px] rounded-2xl">
                                            <SelectValue placeholder="Todas las campañas" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todas las campañas</SelectItem>
                                            {Array.from(new Map(influencers.filter((i) => i.campaignId != null && i.campaignName).map((i) => [i.campaignId as number, { id: i.campaignId as number, name: i.campaignName as string }])).values()).map((c) => (
                                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Código referido</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className="h-10 w-[240px] justify-between rounded-2xl">
                                                {selectedReferralCodes.length === 0
                                                    ? "Todos los códigos"
                                                    : selectedReferralCodes.length <= 2
                                                        ? selectedReferralCodes.join(", ")
                                                        : `${selectedReferralCodes.length} códigos`}
                                                <IconChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[260px] p-3 rounded-2xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-semibold text-foreground">Códigos</span>
                                                {selectedReferralCodes.length > 0 && (
                                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-primary" onClick={() => setSelectedReferralCodes([])}>Limpiar</Button>
                                                )}
                                            </div>
                                            <div className="max-h-64 overflow-y-auto space-y-1">
                                                {Array.from(new Map(influencers.filter((i) => i.referralCode).map((i) => [i.referralCode as string, `${i.referralCode} · ${i.name}${i.campaignName ? " · " + i.campaignName : ""}`])).entries()).map(([code, label]) => (
                                                    <div key={code} className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-primary/10 cursor-pointer" onClick={() => setSelectedReferralCodes(selectedReferralCodes.includes(code) ? selectedReferralCodes.filter((c) => c !== code) : [...selectedReferralCodes, code])}>
                                                        <Checkbox checked={selectedReferralCodes.includes(code)} className="border-primary data-[state=checked]:bg-primary" />
                                                        <span className="text-xs text-foreground">{label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            {/* Chart */}
                            <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                <CardHeader className="flex flex-row items-start justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-[18px] font-bold text-foreground">Evolución del valor de engagement</CardTitle>
                                        <CardDescription className="text-[14px] text-muted-foreground">
                                            Top 5 influencers con mejor ROI — valor diario generado en engagement
                                        </CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={exportTimelineToExcel} disabled={timeline.length === 0} className="rounded-2xl gap-2 h-9">
                                        <IconDownload className="w-4 h-4" />
                                        Exportar
                                    </Button>
                                </CardHeader>
                                <CardContent className="h-[320px]">
                                    {loadingRoi ? (
                                        <div className="flex items-center justify-center h-full gap-2 text-muted-foreground text-sm">
                                            <IconLoader2 className="w-4 h-4 animate-spin" />
                                            Calculando ROI...
                                        </div>
                                    ) : timeline.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                                            <IconInfoCircle className="w-8 h-8 opacity-40" />
                                            <p className="text-sm">No hay datos para el período seleccionado.</p>
                                            <p className="text-xs">Asigna influencers a campañas y extrae sus métricas de TikTok para ver el ROI.</p>
                                        </div>
                                    ) : (
                                        <ChartContainer config={chartConfig} className="h-full w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={timeline} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6F0FF" />
                                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tick={{ fill: "#A0B8D0", fontSize: 12 }} tickFormatter={(v) => formatDate(v as string)} />
                                                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "#A0B8D0", fontSize: 12 }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString()} />
                                                    <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={(v) => formatDate(v as string)} indicator="dot" />} />
                                                    {topSummaryForChart.map((row, i) => {
                                                        const key = row.referralCode || `INF_${row.influencerId}`;
                                                        return (
                                                            <Line key={key} type="monotone" dataKey={key} name={row.referralCode ? `${row.referralCode} / ${row.name}` : row.name} stroke={LINE_COLORS[i % LINE_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                                                        );
                                                    })}
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </ChartContainer>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Table */}
                            <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                <CardHeader>
                                    <CardTitle className="text-[18px] font-bold text-foreground">Detalle por influencer</CardTitle>
                                    <CardDescription className="text-[14px] text-muted-foreground">
                                        Inversión, valor de engagement y ROI calculado por influencer
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {summary.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground text-sm px-6">
                                            No hay datos para los filtros seleccionados.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="border-primary/10">
                                                        <TableHead className="text-foreground font-semibold">Influencer</TableHead>
                                                        <TableHead className="text-foreground font-semibold hidden md:table-cell">Campaña</TableHead>
                                                        <TableHead className="text-foreground font-semibold text-right">Inversión</TableHead>
                                                        <TableHead className="text-foreground font-semibold text-right hidden sm:table-cell">Vistas</TableHead>
                                                        <TableHead className="text-foreground font-semibold text-right">Engagement</TableHead>
                                                        <TableHead className="text-foreground font-semibold text-right">ROI</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {summary.map((row) => (
                                                        <TableRow key={`${row.influencerId}-${row.referralCode ?? "none"}`} className="border-primary/10">
                                                            <TableCell>
                                                                <div>
                                                                    <p className="text-sm font-medium text-foreground">{row.name}</p>
                                                                    <p className="text-xs text-muted-foreground">{row.referralCode ? `${row.referralCode}` : row.username ?? `@influencer_${row.influencerId}`}</p>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{row.campaignName ?? "-"}</TableCell>
                                                            <TableCell className="text-right text-sm text-foreground">
                                                                ${row.investment.toLocaleString("es-ES")}
                                                            </TableCell>
                                                            <TableCell className="text-right text-sm text-muted-foreground hidden sm:table-cell">
                                                                {row.views.toLocaleString("es-ES")}
                                                            </TableCell>
                                                            <TableCell className="text-right text-sm text-foreground">
                                                                ${row.emv.toLocaleString("es-ES")}
                                                            </TableCell>
                                                            <TableCell className="text-right text-sm">
                                                                <span className={`font-semibold ${getROIColor(row.roi)}`}>
                                                                    {row.roi >= 0 ? "+" : ""}{row.roi.toFixed(1)}%
                                                                </span>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    {/* Total row */}
                                                    {summary.length > 0 && (
                                                        <TableRow className="border-primary/10 bg-primary/5">
                                                            <TableCell className="text-sm font-bold text-foreground">Total</TableCell>
                                                            <TableCell className="hidden md:table-cell" />
                                                            <TableCell className="text-right text-sm font-bold text-foreground">
                                                                ${totalInvestment.toLocaleString("es-ES")}
                                                            </TableCell>
                                                            <TableCell className="text-right text-sm font-bold text-foreground hidden sm:table-cell">
                                                                {summary.reduce((s, r) => s + r.views, 0).toLocaleString("es-ES")}
                                                            </TableCell>
                                                            <TableCell className="text-right text-sm font-bold text-foreground">
                                                                ${totalEMV.toLocaleString("es-ES")}
                                                            </TableCell>
                                                            <TableCell className="text-right text-sm font-bold">
                                                                <span className={getROIColor(avgROI)}>
                                                                    {avgROI >= 0 ? "+" : ""}{Math.round(avgROI)}%
                                                                </span>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Alerts */}
                            {alerts.length > 0 && (
                                <Card className="rounded-[20px] border-red-200 dark:border-red-900 shadow-sm">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-2">
                                            <IconAlertCircle className="w-5 h-5 text-red-500" />
                                            <CardTitle className="text-[18px] font-bold text-foreground">Alertas</CardTitle>
                                            <span className="text-xs text-muted-foreground ml-1">({alerts.length} influencers)</span>
                                        </div>
                                        <CardDescription className="text-[14px] text-muted-foreground">
                                            Influencers con EMV = 0 o ROI negativo. Revisa sus campañas.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {alerts.slice(0, 9).map((row) => (
                                                <div key={`${row.influencerId}-${row.referralCode ?? "none"}`} className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50">
                                                    <p className="text-sm font-semibold text-red-700 dark:text-red-300">{row.name}</p>
                                                    <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">{row.referralCode ?? "sin código"} · {row.campaignName ?? "—"}</p>
                                                    <div className="flex gap-3 mt-2 text-xs text-red-600/80">
                                                        {row.nau === 0 && <span>EMV = $0</span>}
                                                        {row.roi < 0 && <span>ROI: {row.roi.toFixed(1)}%</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
    );
}

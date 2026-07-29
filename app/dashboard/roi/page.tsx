"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { IconTrendingUp, IconTrendingDown, IconWallet, IconUsers, IconAlertCircle, IconChevronDown, IconLoader2, IconDownload, IconInfoCircle, IconEye, IconShoppingCart, IconCash } from "@tabler/icons-react";
import ExcelJS from "exceljs";
import { toast } from "sonner";
import { getROILabel, getROIColor, ROI_SCENARIOS, type ScenarioKey } from "@/lib/roi";
import { cn } from "@/lib/utils";

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

interface ScenarioResultData {
    ctr: number;
    cr: number;
    Q: number;
    I: number;
    roi: number;
}

interface FormulaResultData {
    V_m: number;
    V_e: number;
    totalViews: number;
    scenarios: Record<ScenarioKey, ScenarioResultData>;
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
    formula: FormulaResultData | null;
}

const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0];
};

const fmt = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n: number) => n.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function RoiPage() {
    const [influencers, setInfluencers] = useState<InfluencerOption[]>([]);
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const [startDate, setStartDate] = useState<string>(formatDateForInput(firstDayOfMonth));
    const [endDate, setEndDate] = useState<string>(formatDateForInput(today));
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
    const [selectedReferralCodes, setSelectedReferralCodes] = useState<string[]>([]);

    const [ticket, setTicket] = useState("");
    const [margin, setMargin] = useState("");
    const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>("expected");
    const [inputSource, setInputSource] = useState<{ ticket: string; margin: string; botRate: string; conversionRate: string } | null>(null);

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
                    return [{
                        id: inf.id, name: inf.name, referralCode: inf.referralCode, username, socialPlatforms,
                        campaignId: undefined, campaignName: undefined,
                    }];
                }

                return inf.influencerCampaigns.map<InfluencerOption>((ic) => ({
                    id: inf.id, name: inf.name, referralCode: inf.referralCode, username, socialPlatforms,
                    campaignId: ic.campaign.id, campaignName: ic.campaign.name,
                }));
            });

            setInfluencers(list);

            const defaultCodes = Array.from(new Set(list.map((inf) => inf.referralCode).filter((code): code is string => !!code))).slice(0, 3);
            setSelectedReferralCodes(defaultCodes);
        } catch {
            setInfluencers([]);
        }
    };

    useEffect(() => {
        void fetchInfluencers();
    }, []);

    const [timeline, setTimeline] = useState<RoiTimelinePoint[]>([]);
    const [summary, setSummary] = useState<RoiSummary[]>([]);
    const [meta, setMeta] = useState<any>(null);
    const [loadingRoi, setLoadingRoi] = useState(false);

    const prevCampaignRef = useRef<string>("all");

    const fetchRoiData = async () => {
        if (!ticket || !margin) return;
        setLoadingRoi(true);
        try {
            const params = new URLSearchParams({
                startDate, endDate,
                campaignId: selectedCampaignId,
                ticket, margin,
            });
            const res = await fetch(`/api/roi/calculate?${params}`);
            const data = await res.json();
            if (res.ok) {
                setTimeline(data.timeline || []);
                setSummary(data.summary || []);
                setMeta(data.meta || null);
                if (data.meta?.formulaInputs?.source) {
                    setInputSource(data.meta.formulaInputs.source);
                }
                // Pre-fill T/M from campaign defaults if user hasn't set them manually
                if (data.meta?.campaignDefaults) {
                    const cd = data.meta.campaignDefaults;
                    if (!ticket && cd.ticketAverage) setTicket(String(cd.ticketAverage));
                    if (!margin && cd.marginNet) setMargin(String(cd.marginNet));
                }
            } else {
                toast.error(data.error || "Error al calcular ROI");
            }
        } catch {
            toast.error("Error al calcular ROI");
        } finally {
            setLoadingRoi(false);
        }
    };

    useEffect(() => {
        if (influencers.length > 0 && ticket && margin) {
            const prevCampaign = prevCampaignRef.current;
            prevCampaignRef.current = selectedCampaignId;
            // Clear stale data immediately when campaign changes
            if (prevCampaign !== selectedCampaignId) {
                setSummary([]);
                setTimeline([]);
                setMeta(null);
                setInputSource(null);
            }
            fetchRoiData();
        }
    }, [startDate, endDate, selectedCampaignId, influencers, ticket, margin]);

    const selectedCampaignName = useMemo(() => {
        if (selectedCampaignId === "all") return "Todas las campañas";
        const idNum = parseInt(selectedCampaignId);
        const campaign = influencers.find((inf) => inf.campaignId === idNum);
        return campaign?.campaignName || "Campaña seleccionada";
    }, [selectedCampaignId, influencers]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    };

    const alerts = useMemo(() => summary.filter((item) => item.nau === 0 || item.roi < 0), [summary]);

    const topSummaryForChart = useMemo(() => summary.slice(0, 5), [summary]);

    const totalInvestment = useMemo(() => summary.reduce((s, r) => s + r.investment, 0), [summary]);
    const totalEMV = useMemo(() => summary.reduce((s, r) => s + r.emv, 0), [summary]);
    const avgROI = useMemo(() => {
        if (summary.length === 0) return 0;
        return summary.reduce((s, r) => s + r.roi, 0) / summary.length;
    }, [summary]);
    const negativeCount = useMemo(() => summary.filter((r) => r.roi < 0 || r.nau === 0).length, [summary]);
    const totalViews = useMemo(() => summary.reduce((s, r) => s + r.views, 0), [summary]);

    const totalVe = useMemo(() => {
        if (!meta?.scenarioTotals) return 0;
        return summary.reduce((s, r) => s + (r.formula?.V_e || 0), 0);
    }, [summary, meta]);

    const hasFormula = useMemo(() => summary.some((r) => r.formula), [summary]);

    const exportTimelineToExcel = async () => {
        if (timeline.length === 0 || topSummaryForChart.length === 0) {
            toast.error("No hay datos de EMV para exportar");
            return;
        }

        try {
            const excelData = timeline.map((item) => {
                const row: Record<string, string | number> = {
                    Fecha: new Date(item.date).toLocaleDateString("es-ES", {
                        year: "numeric", month: "short", day: "numeric",
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

            const workbook = new ExcelJS.Workbook();
            const ws = workbook.addWorksheet("EMV en el tiempo");

            const headers = Object.keys(excelData[0] || {});
            ws.addRow(headers);
            for (const rowObj of excelData) {
                ws.addRow(headers.map((h) => (rowObj[h] !== undefined ? rowObj[h] : "")));
            }

            headers.forEach((key, idx) => {
                const maxLen = Math.max(key.length, ...excelData.map((r) => String(r[key] ?? "").length));
                ws.getColumn(idx + 1).width = Math.min(50, maxLen + 2);
            });

            const fileName = `ROI_EMV_Top5_${selectedCampaignName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "")}_${startDate}_${endDate}.xlsx`;

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
        } catch {
            toast.error("Error al exportar los datos");
        }
    };

    const canCalculate = ticket && margin && parseFloat(ticket) > 0 && parseFloat(margin) > 0;

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 bg-muted min-h-full">
                    {/* Header */}
                    <div className="flex flex-col gap-1 mb-2">
                        <h1 className="text-[28px] font-bold text-foreground">ROI Predictivo</h1>
                        <p className="text-[16px] text-muted-foreground">
                            Proyecta el retorno de inversión usando el modelo de 4 pasos: V_e → Q → I → ROI
                        </p>
                    </div>

                    {/* Formula Inputs */}
                    <Card className="rounded-[20px] border-primary/5 shadow-[var(--card-shadow-sm)]">
                        <CardContent className="p-4">
                            <div className="flex flex-wrap items-end gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        Ticket promedio ($)
                                        {inputSource?.ticket === "campaign" && (
                                            <span className="text-[9px] font-normal text-green-600 bg-green-50 dark:bg-green-950 px-1.5 py-0.5 rounded-full">de campaña</span>
                                        )}
                                    </Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        value={ticket}
                                        onChange={(e) => setTicket(e.target.value)}
                                        placeholder={meta?.campaignDefaults?.ticketAverage ? `Ej: ${meta.campaignDefaults.ticketAverage}` : "Ej: 50"}
                                        className="rounded-2xl w-32 h-10"
                                    />
                                    <p className="text-[9px] text-muted-foreground">Dato del cliente</p>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        Margen de ganancia (%)
                                        {inputSource?.margin === "campaign" && (
                                            <span className="text-[9px] font-normal text-green-600 bg-green-50 dark:bg-green-950 px-1.5 py-0.5 rounded-full">de campaña</span>
                                        )}
                                    </Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={0.1}
                                        value={margin}
                                        onChange={(e) => setMargin(e.target.value)}
                                        placeholder={meta?.campaignDefaults?.marginNet ? `Ej: ${meta.campaignDefaults.marginNet}` : "Ej: 30"}
                                        className="rounded-2xl w-32 h-10"
                                    />
                                    <p className="text-[9px] text-muted-foreground">Dato del cliente</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-[10px] text-muted-foreground border-t border-primary/5 pt-2">
                                <span><strong>① V_e</strong> = V_m × (1−B) · <em className="text-[9px]">sistema (scraping + tasa bots)</em></span>
                                <span><strong>② Q</strong> = V_e × CTR × CR · <em className="text-[9px]">sistema (benchmarks) {meta?.formulaInputs?.source?.conversionRate === "campaign" ? "+ CR de campaña" : ""}</em></span>
                                <span><strong>③ I</strong> = Q × T × M · <em className="text-[9px]">cliente (ticket + margen)</em></span>
                                <span><strong>④ ROI</strong> = (I − C) / C × 100 · <em className="text-[9px]">sistema (costo campaña)</em></span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <Card className="rounded-[20px] border-primary/5 shadow-[var(--card-shadow-sm)]">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Inversión total</p>
                                    <IconWallet className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <p className="text-3xl font-bold text-foreground leading-tight">${fmtInt(totalInvestment)}</p>
                                <p className="text-[11px] text-muted-foreground mt-1">{summary.length} influencers</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-[20px] border-primary/5 shadow-[var(--card-shadow-sm)]">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Vistas totales</p>
                                    <IconEye className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <p className="text-3xl font-bold text-foreground leading-tight">{fmtInt(totalViews)}</p>
                                <p className="text-[11px] text-muted-foreground mt-1">en el período</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-[20px] border-primary/5 shadow-[var(--card-shadow-sm)]">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Valor engagement</p>
                                    <IconTrendingUp className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <p className="text-3xl font-bold text-foreground leading-tight">${fmtInt(totalEMV)}</p>
                                <p className="text-[11px] text-muted-foreground mt-1">EMV (CPM ${meta?.cpmBenchmark || 8})</p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-[20px] border-primary/5 shadow-[var(--card-shadow-sm)]">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Influencers</p>
                                    <IconUsers className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <p className="text-3xl font-bold text-foreground leading-tight">{summary.length}</p>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    {summary.filter((r) => r.roi > 0).length} con ROI positivo
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="rounded-[20px] border-primary/5 shadow-[var(--card-shadow-sm)]">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Con pérdida</p>
                                    <IconTrendingDown className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <p className={`text-3xl font-bold leading-tight ${negativeCount > 0 ? "text-red-500" : "text-foreground"}`}>
                                    {negativeCount}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-1">
                                    {negativeCount > 0 ? "Revisar campañas" : "Sin incidencias"}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Scenario KPI Cards */}
                    {hasFormula && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <p className="text-[13px] font-semibold text-foreground">Proyección de ingresos</p>
                                <div className="flex bg-muted rounded-2xl p-0.5">
                                    {(Object.entries(ROI_SCENARIOS) as [ScenarioKey, typeof ROI_SCENARIOS[ScenarioKey]][]).map(([key, sc]) => (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedScenario(key)}
                                            className={cn(
                                                "px-3 py-1 rounded-xl text-[11px] font-medium transition-all",
                                                selectedScenario === key
                                                    ? "bg-card text-foreground shadow-sm"
                                                    : "text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            {sc.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <Card className="rounded-[16px] border-primary/5 shadow-sm">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Vistas efectivas</p>
                                            <IconEye className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <p className="text-2xl font-bold text-foreground">{fmtInt(totalVe)}</p>
                                        <p className="text-[11px] text-muted-foreground mt-1">V_e = V_total × (1-B)</p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-[16px] border-primary/5 shadow-sm">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Transacciones (Q)</p>
                                            <IconShoppingCart className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <p className="text-2xl font-bold text-foreground">
                                            {meta?.scenarioTotals?.[selectedScenario]?.totalQ !== undefined
                                                ? fmt(meta.scenarioTotals[selectedScenario].totalQ)
                                                : "—"}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-1">Q = V_e × CTR × CR</p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-[16px] border-primary/5 shadow-sm">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Ingreso neto (I)</p>
                                            <IconCash className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <p className="text-2xl font-bold text-foreground">
                                            {meta?.scenarioTotals?.[selectedScenario]?.totalI !== undefined
                                                ? `$${fmtInt(Math.round(meta.scenarioTotals[selectedScenario].totalI))}`
                                                : "—"}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-1">I = Q × T × M</p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-[16px] border-primary/5 shadow-sm">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">ROI promedio</p>
                                            <IconTrendingUp className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <p className={cn("text-2xl font-bold", ROI_SCENARIOS[selectedScenario].color)}>
                                            {meta?.scenarioTotals?.[selectedScenario]?.avgRoi !== undefined
                                                ? `${meta.scenarioTotals[selectedScenario].avgRoi >= 0 ? "+" : ""}${meta.scenarioTotals[selectedScenario].avgRoi.toFixed(1)}%`
                                                : "—"}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground mt-1">
                                            CTR {ROI_SCENARIOS[selectedScenario].ctr * 100}% · CR {ROI_SCENARIOS[selectedScenario].cr * 100}%
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

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
                    <Card className="rounded-[20px] border-primary/5 shadow-[var(--card-shadow-sm)]">
                        <CardHeader className="flex flex-row items-start justify-between gap-4">
                            <div>
                                <CardTitle className="text-[18px] font-bold text-foreground">Evolución del valor de engagement</CardTitle>
                                <CardDescription className="text-[14px] text-muted-foreground">
                                    Top 5 influencers con mejor ROI — valor diario generado en engagement (EMV)
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
                    <Card className="rounded-[20px] border-primary/5 shadow-[var(--card-shadow-sm)]">
                        <CardHeader>
                            <CardTitle className="text-[18px] font-bold text-foreground">Detalle por influencer</CardTitle>
                            <CardDescription className="text-[14px] text-muted-foreground">
                                Inversión, métricas reales y proyección de ingresos (modelo predictivo 4 pasos)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {!canCalculate ? (
                                <div className="text-center py-8 text-muted-foreground text-sm px-6">
                                    Ingresa el ticket promedio y margen de ganancia para ver la proyección de ROI.
                                </div>
                            ) : summary.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm px-6">
                                    No hay datos para los filtros seleccionados.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-primary/10">
                                                <TableHead className="text-foreground font-semibold whitespace-nowrap">Influencer</TableHead>
                                                <TableHead className="text-foreground font-semibold text-right whitespace-nowrap">Inversión</TableHead>
                                                <TableHead className="text-foreground font-semibold text-right whitespace-nowrap">Vistas</TableHead>
                                                {hasFormula && (
                                                    <>
                                                        <TableHead className="text-foreground font-semibold text-right whitespace-nowrap">V_m</TableHead>
                                                        <TableHead className="text-foreground font-semibold text-right whitespace-nowrap">V_e</TableHead>
                                                        <TableHead className="text-foreground font-semibold text-right whitespace-nowrap">Q</TableHead>
                                                        <TableHead className="text-foreground font-semibold text-right whitespace-nowrap">I ($)</TableHead>
                                                    </>
                                                )}
                                                {hasFormula ? (
                                                    <TableHead className="text-foreground font-semibold text-center whitespace-nowrap" colSpan={3}>
                                                        ROI por escenario
                                                    </TableHead>
                                                ) : (
                                                    <TableHead className="text-foreground font-semibold text-right whitespace-nowrap">ROI</TableHead>
                                                )}
                                            </TableRow>
                                            {hasFormula && (
                                                <TableRow className="border-primary/10">
                                                    <TableHead colSpan={7} className="p-0" />
                                                    {(Object.entries(ROI_SCENARIOS) as [ScenarioKey, typeof ROI_SCENARIOS[ScenarioKey]][]).map(([key, sc]) => (
                                                        <TableHead key={key} className={cn("text-center text-[10px] font-semibold whitespace-nowrap", sc.color)}>
                                                            {sc.short}
                                                        </TableHead>
                                                    ))}
                                                </TableRow>
                                            )}
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
                                                    <TableCell className="text-right text-sm text-foreground whitespace-nowrap">
                                                        ${row.investment.toLocaleString("es-ES")}
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                                                        {fmtInt(row.views)}
                                                    </TableCell>
                                                    {hasFormula && row.formula && (
                                                        <>
                                                            <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                                                                {row.formula.V_m > 0 ? fmtInt(row.formula.V_m) : <span className="text-orange-400 text-[10px]">Sin datos</span>}
                                                            </TableCell>
                                                            <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                                                                {row.formula.V_e > 0 ? fmtInt(row.formula.V_e) : <span className="text-orange-400 text-[10px]">Sin datos</span>}
                                                            </TableCell>
                                                            <TableCell className="text-right text-sm text-foreground whitespace-nowrap">
                                                                {row.formula.V_m > 0 ? fmt(row.formula.scenarios[selectedScenario].Q) : <span className="text-muted-foreground text-[10px]">—</span>}
                                                            </TableCell>
                                                            <TableCell className="text-right text-sm text-foreground font-semibold whitespace-nowrap">
                                                                {row.formula.V_m > 0 ? `$${fmtInt(Math.round(row.formula.scenarios[selectedScenario].I))}` : <span className="text-muted-foreground text-[10px]">—</span>}
                                                            </TableCell>
                                                        </>
                                                    )}
                                                    {hasFormula && row.formula && row.formula.V_m > 0 ? (
                                                        (Object.entries(ROI_SCENARIOS) as [ScenarioKey, typeof ROI_SCENARIOS[ScenarioKey]][]).map(([key, sc]) => {
                                                            const s = row.formula!.scenarios[key];
                                                            return (
                                                                <TableCell key={key} className={cn("text-right text-sm font-semibold whitespace-nowrap", s.roi >= 0 ? "text-green-600" : "text-red-500")}>
                                                                    {s.roi >= 0 ? "+" : ""}{s.roi.toFixed(1)}%
                                                                </TableCell>
                                                            );
                                                        })
                                                    ) : hasFormula && row.formula ? (
                                                        (Object.entries(ROI_SCENARIOS) as [ScenarioKey, typeof ROI_SCENARIOS[ScenarioKey]][]).map(([key]) => (
                                                            <TableCell key={key} className="text-right text-sm text-muted-foreground whitespace-nowrap">—</TableCell>
                                                        ))
                                                    ) : (
                                                        <TableCell className="text-right text-sm">
                                                            <span className={`font-semibold ${getROIColor(row.roi)}`}>
                                                                {row.roi >= 0 ? "+" : ""}{row.roi.toFixed(1)}%
                                                            </span>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))}
                                            {/* Total row */}
                                            {summary.length > 0 && (
                                                <TableRow className="border-primary/10 bg-primary/5">
                                                    <TableCell className="text-sm font-bold text-foreground">Total</TableCell>
                                                    <TableCell className="text-right text-sm font-bold text-foreground whitespace-nowrap">
                                                        ${totalInvestment.toLocaleString("es-ES")}
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm font-bold text-foreground whitespace-nowrap">
                                                        {fmtInt(totalViews)}
                                                    </TableCell>
                                                    {hasFormula && (
                                                        <>
                                                            <TableCell />
                                                            <TableCell className="text-right text-sm font-bold text-foreground whitespace-nowrap">
                                                                {fmtInt(totalVe)}
                                                            </TableCell>
                                                            <TableCell className="text-right text-sm font-bold text-foreground whitespace-nowrap">
                                                                {meta?.scenarioTotals?.[selectedScenario]?.totalQ !== undefined
                                                                    ? fmt(meta.scenarioTotals[selectedScenario].totalQ)
                                                                    : "—"}
                                                            </TableCell>
                                                            <TableCell className="text-right text-sm font-bold text-foreground whitespace-nowrap">
                                                                {meta?.scenarioTotals?.[selectedScenario]?.totalI !== undefined
                                                                    ? `$${fmtInt(Math.round(meta.scenarioTotals[selectedScenario].totalI))}`
                                                                    : "—"}
                                                            </TableCell>
                                                        </>
                                                    )}
                                                    {hasFormula ? (
                                                        (Object.entries(ROI_SCENARIOS) as [ScenarioKey, typeof ROI_SCENARIOS[ScenarioKey]][]).map(([key, sc]) => {
                                                            const avg = meta?.scenarioTotals?.[key]?.avgRoi;
                                                            return (
                                                                <TableCell key={key} className={cn("text-right text-sm font-bold whitespace-nowrap", avg >= 0 ? "text-green-600" : "text-red-500")}>
                                                                    {avg !== undefined ? `${avg >= 0 ? "+" : ""}${avg.toFixed(1)}%` : "—"}
                                                                </TableCell>
                                                            );
                                                        })
                                                    ) : (
                                                        <TableCell className="text-right text-sm font-bold">
                                                            <span className={getROIColor(avgROI)}>
                                                                {avgROI >= 0 ? "+" : ""}{Math.round(avgROI)}%
                                                            </span>
                                                        </TableCell>
                                                    )}
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

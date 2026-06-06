"use client";

import { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
import { IconChevronDown } from "@tabler/icons-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

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
}

// Helper para formatear fechas al formato YYYY-MM-DD del input date
const formatDateForInput = (date: Date) => {
    return date.toISOString().split("T")[0];
};

// Generar NAU y ROI dummy para un rango de fechas y un conjunto de influencers,
// filtrando opcionalmente por campaña y/o código de referido.
function generateRoiDummyData(
    start: Date,
    end: Date,
    influencers: InfluencerOption[],
    selectedCampaignId?: number,
    selectedReferralCodes: string[] = []
) {
    const timeline: RoiTimelinePoint[] = [];
    const summary: RoiSummary[] = [];

    const days: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    const effectiveInfluencers =
        selectedCampaignId || (selectedReferralCodes && selectedReferralCodes.length > 0)
            ? influencers.filter((inf) => {
                  const matchesCampaign =
                      selectedCampaignId !== undefined && selectedCampaignId !== null ? inf.campaignId === selectedCampaignId : true;
                  const matchesReferral =
                      selectedReferralCodes && selectedReferralCodes.length > 0
                          ? inf.referralCode != null && selectedReferralCodes.includes(inf.referralCode)
                          : true;
                  return matchesCampaign && matchesReferral;
              })
            : influencers;

    effectiveInfluencers.forEach((inf) => {
        let totalNau = 0;

        days.forEach((day, dayIndex) => {
            const key = inf.referralCode || `INF_${inf.id}`;
            const seed = inf.id * 37 + dayIndex * 17;
            const rand = Math.abs(Math.sin(seed)); // 0..1 aprox

            const baseNau = 5 + rand * 40; // 5–45 NAU por día
            const nau = Math.round(baseNau);
            totalNau += nau;

            const dateKey = day.toISOString().split("T")[0];
            let point = timeline.find((p) => p.date === dateKey);
            if (!point) {
                point = { date: dateKey };
                timeline.push(point);
            }
            (point as RoiTimelinePoint)[key] = nau;
        });

        // ROI dummy en función del NAU total
        const roiSeed = Math.abs(Math.sin(inf.id * 123.456));
        const roi = Number((roiSeed * 60 - 10).toFixed(1)); // -10% a +50%

        summary.push({
            influencerId: inf.id,
            name: inf.name,
            referralCode: inf.referralCode,
            username: inf.username,
            socialPlatforms: inf.socialPlatforms,
            campaignId: inf.campaignId ?? null,
            campaignName: inf.campaignName ?? null,
            nau: totalNau,
            roi,
        });
    });

    // Ordenar timeline por fecha
    timeline.sort((a, b) => (a.date as string).localeCompare(b.date as string));

    // Ordenar summary por ROI desc
    summary.sort((a, b) => b.roi - a.roi);

    return { timeline, summary };
}

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
                label: "NAU",
                color: "#6C48C5",
            },
        }),
        []
    );

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

            let list: InfluencerOption[] = apiInfluencers.flatMap((inf) => {
                const platforms = inf.socialAccounts?.map((sa) => sa.socialPlatform.name) ?? [];
                const primaryHandleRaw = inf.socialAccounts?.[0]?.handle ?? null;
                const primaryHandle = primaryHandleRaw ? "@" + primaryHandleRaw.replace(/^@/, "") : null;

                const username = primaryHandle || `@${inf.name.split(" ")[0].toLowerCase()}_${inf.id}`; // dummy si no hay handle
                const socialPlatforms = platforms.length > 0 ? platforms : ["TikTok", "Instagram"]; // dummy si no hay redes

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

            // Si ningún influencer viene con campaña (modo demo sin BD),
            // asignar campañas dummy para que el selector tenga opciones.
            if (list.every((inf) => inf.campaignId == null)) {
                const dummyCampaigns = [
                    { id: 1, name: "Lanzamiento Takenos" },
                    { id: 2, name: "Performance Q1 Ecommerce" },
                    { id: 3, name: "Branding Latam" },
                ];
                list = list.map((inf, index) => {
                    const dc = dummyCampaigns[index % dummyCampaigns.length];
                    return {
                        ...inf,
                        campaignId: dc.id,
                        campaignName: dc.name,
                    };
                });
            }

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
            // Dummy mínimo si falla la API
            const dummyList: InfluencerOption[] = [
                {
                    id: 1,
                    name: "María García",
                    referralCode: "MARIA2025",
                    username: "@maria.beauty",
                    socialPlatforms: ["TikTok", "Instagram"],
                    campaignId: 1,
                    campaignName: "Lanzamiento Takenos",
                },
                {
                    id: 2,
                    name: "Carlos Rodríguez",
                    referralCode: "CARLOS2025",
                    username: "@carlos.tech",
                    socialPlatforms: ["YouTube", "X (Twitter)"],
                    campaignId: 2,
                    campaignName: "Performance Q1 Ecommerce",
                },
                {
                    id: 3,
                    name: "Ana Martínez",
                    referralCode: "ANA2025",
                    username: "@ana.fit",
                    socialPlatforms: ["Instagram", "TikTok"],
                    campaignId: 1,
                    campaignName: "Lanzamiento Takenos",
                },
            ];
            setInfluencers(dummyList);

            if (selectedCampaignId === "all") {
                const firstCampaign = dummyList.find((inf) => inf.campaignId != null);
                if (firstCampaign?.campaignId != null) {
                    setSelectedCampaignId(firstCampaign.campaignId.toString());
                }
            }

            const defaultCodes = Array.from(
                new Set(dummyList.map((inf) => inf.referralCode).filter((code): code is string => !!code))
            ).slice(0, 3);
            setSelectedReferralCodes(defaultCodes);
        }
    };

    useEffect(() => {
        // Cargar influencers al montar el componente
        void fetchInfluencers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Calcular timeline y summary en memoria según filtros
    const { timeline, summary } = useMemo(() => {
        if (influencers.length === 0 || !startDate || !endDate) {
            return {
                timeline: [] as RoiTimelinePoint[],
                summary: [] as RoiSummary[],
            };
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        const effectiveCampaignId = selectedCampaignId !== "all" ? parseInt(selectedCampaignId) : undefined;

        return generateRoiDummyData(start, end, influencers, effectiveCampaignId, selectedReferralCodes);
    }, [startDate, endDate, influencers, selectedCampaignId, selectedReferralCodes]);

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

    // Top 5 influencers por ROI (ya viene ordenado desc en generateRoiDummyData)
    const topSummaryForChart = useMemo(() => summary.slice(0, 5), [summary]);

    const exportTimelineToExcel = () => {
        if (timeline.length === 0 || topSummaryForChart.length === 0) {
            toast.error("No hay datos de NAU para exportar");
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
                    row[`NAU ${label}`] = typeof value === "number" && !Number.isNaN(value) ? value : 0;
                });

                return row;
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(excelData);
            const colWidths = Object.keys(excelData[0] || {}).map((key) => ({
                wch: Math.max(key.length, 16),
            }));
            // Ajustar anchos de columna
            (ws as XLSX.WorkSheet)["!cols"] = colWidths;
            XLSX.utils.book_append_sheet(wb, ws, "NAU en el tiempo");

            const fileName = `ROI_NAU_Top5_${selectedCampaignName
                .replace(/\s+/g, "_")
                .replace(/[^a-zA-Z0-9_]/g, "")}_${startDate}_${endDate}.xlsx`;

            XLSX.writeFile(wb, fileName);
            toast.success("Archivo Excel descargado exitosamente");
        } catch (error) {
            console.error("Error exportando NAU a Excel:", error);
            toast.error("Error al exportar los datos");
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
                            {/* Header y filtros */}
                            <div className="flex flex-col gap-4 mb-4">
                                <div>
                                    <h1 className="text-[28px] font-bold text-[#1A1A2E] mb-2">Retorno y nuevos clientes por campaña</h1>
                                    <p className="text-[16px] text-[#6B6B8D]">
                                        Analiza el retorno de la inversión (ROI) por influencer, código de referido y campaña.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3 items-center">
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
                                                        if (date) setStartDate(formatDateForInput(date));
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
                                                        if (date) setEndDate(formatDateForInput(date));
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Campaña */}
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs text-[#6B6B8D]">Campaña</Label>
                                        <Select
                                            value={selectedCampaignId}
                                            onValueChange={(value) => {
                                                setSelectedCampaignId(value);

                                                // Cuando se selecciona una campaña, seleccionar por defecto
                                                // los códigos de referido que pertenecen a esa campaña (máx. 3).
                                                const campaignIdNum = value !== "all" ? parseInt(value) : undefined;

                                                if (campaignIdNum) {
                                                    const campaignCodes = Array.from(
                                                        new Set(
                                                            influencers
                                                                .filter((inf) => inf.campaignId === campaignIdNum && inf.referralCode)
                                                                .map((inf) => inf.referralCode as string)
                                                        )
                                                    ).slice(0, 3);

                                                    if (campaignCodes.length > 0) {
                                                        setSelectedReferralCodes(campaignCodes);
                                                    }
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-10 w-[220px] rounded-2xl">
                                                <SelectValue placeholder="Todas las campañas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas las campañas</SelectItem>
                                                {Array.from(
                                                    new Map(
                                                        influencers
                                                            .filter((inf) => inf.campaignId != null && inf.campaignName)
                                                            .map((inf) => [
                                                                inf.campaignId as number,
                                                                {
                                                                    id: inf.campaignId as number,
                                                                    name: inf.campaignName as string,
                                                                },
                                                            ])
                                                    ).values()
                                                ).map((campaign) => (
                                                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                                                        {campaign.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Código referido (multi-select) */}
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs text-[#6B6B8D]">Código referido</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className="h-10 w-[320px] justify-between rounded-2xl"
                                                >
                                                    {selectedReferralCodes.length === 0
                                                        ? "Todos los códigos"
                                                        : selectedReferralCodes.length <= 3
                                                          ? selectedReferralCodes.join(", ")
                                                          : `${selectedReferralCodes.length} códigos seleccionados`}
                                                    <IconChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[260px] p-3 rounded-2xl">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-semibold text-[#1A1A2E]">Códigos de referido</span>
                                                    {selectedReferralCodes.length > 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 px-2 text-[10px] text-[#6C48C5]"
                                                            onClick={() => setSelectedReferralCodes([])}
                                                        >
                                                            Limpiar
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="max-h-64 overflow-y-auto space-y-1">
                                                    {Array.from(
                                                        new Map(
                                                            influencers
                                                                .filter((inf) => inf.referralCode)
                                                                .map((inf) => {
                                                                    const key = inf.referralCode as string;
                                                                    const label = inf.campaignName
                                                                        ? `${key} · ${inf.name} · ${inf.campaignName}`
                                                                        : `${key} · ${inf.name}`;
                                                                    return [key, label] as [string, string];
                                                                })
                                                        ).entries()
                                                    ).map(([code, label]) => {
                                                        const checked = selectedReferralCodes.includes(code);
                                                        return (
                                                            <div
                                                                key={code}
                                                                className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-[rgba(108,72,197,0.05)] cursor-pointer"
                                                                onClick={() => {
                                                                    setSelectedReferralCodes(
                                                                        checked
                                                                            ? selectedReferralCodes.filter((c) => c !== code)
                                                                            : [...selectedReferralCodes, code]
                                                                    );
                                                                }}
                                                            >
                                                                <Checkbox
                                                                    checked={checked}
                                                                    onCheckedChange={(value) => {
                                                                        const isChecked = Boolean(value);
                                                                        setSelectedReferralCodes(
                                                                            isChecked
                                                                                ? [...selectedReferralCodes, code]
                                                                                : selectedReferralCodes.filter((c) => c !== code)
                                                                        );
                                                                    }}
                                                                    className="border-[#6C48C5] data-[state=checked]:bg-[#6C48C5]"
                                                                />
                                                                <span className="text-xs text-[#1A1A2E]">{label}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </div>

                            {/* Sección principal: Gráfico arriba y tabla abajo */}
                            <div className="grid grid-cols-1 gap-6">
                                {/* Gráfico de línea NAU en el tiempo (full width) */}
                                <Card className="rounded-[20px] border-[rgba(108,72,197,0.1)] shadow-[0_4px_20px_rgba(108,72,197,0.08)]">
                                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-[18px] font-bold text-[#1A1A2E]">
                                                NAU en el tiempo (Top 5 por ROI)
                                            </CardTitle>
                                            <CardDescription className="text-[14px] text-[#6B6B8D]">
                                                Evolución diaria del NAU por código referido / influencer.
                                            </CardDescription>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={exportTimelineToExcel}
                                            disabled={timeline.length === 0 || topSummaryForChart.length === 0}
                                            className="h-9 rounded-2xl border-[#6C48C5] text-[#6C48C5] hover:bg-[#E8DEFF]"
                                        >
                                            Descargar datos
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="h-[320px]">
                                        {timeline.length === 0 ? (
                                            <div className="flex items-center justify-center h-full text-[#6B6B8D] text-sm">
                                                No hay datos para mostrar.
                                            </div>
                                        ) : (
                                            <ChartContainer config={chartConfig} className="h-full w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={timeline} margin={{ top: 16, right: 24, left: 0, bottom: 8 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DEFF" />
                                                        <XAxis
                                                            dataKey="date"
                                                            tickLine={false}
                                                            axisLine={false}
                                                            tickMargin={8}
                                                            minTickGap={32}
                                                            tick={{ fill: "#6B6B8D", fontSize: 12 }}
                                                            tickFormatter={(value) => formatDate(value as string)}
                                                        />
                                                        <YAxis
                                                            tickLine={false}
                                                            axisLine={false}
                                                            tick={{ fill: "#6B6B8D", fontSize: 12 }}
                                                            tickFormatter={(value) =>
                                                                value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()
                                                            }
                                                        />
                                                        <ChartTooltip
                                                            cursor={false}
                                                            content={
                                                                <ChartTooltipContent
                                                                    labelFormatter={(value) => formatDate(value as string)}
                                                                    indicator="dot"
                                                                />
                                                            }
                                                        />
                                                        {/* Una línea por código referido / influencer (Top 5 por ROI) */}
                                                        {topSummaryForChart.map((row) => {
                                                            const key = row.referralCode || `INF_${row.influencerId}`;
                                                            return (
                                                                <Line
                                                                    key={key}
                                                                    type="monotone"
                                                                    dataKey={key}
                                                                    name={
                                                                        row.referralCode
                                                                            ? `${row.referralCode} / ${row.name}${
                                                                                  row.campaignName ? " · " + row.campaignName : ""
                                                                              }`
                                                                            : `${row.name}${row.campaignName ? " · " + row.campaignName : ""}`
                                                                    }
                                                                    stroke="#6C48C5"
                                                                    strokeWidth={2}
                                                                    dot={{ r: 3 }}
                                                                    activeDot={{ r: 5 }}
                                                                >
                                                                    <LabelList dataKey={key} position="top" />
                                                                </Line>
                                                            );
                                                        })}
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </ChartContainer>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Tabla dinámica NAU / ROI por influencer (debajo de la gráfica) */}
                                <Card className="rounded-[20px] border-[rgba(108,72,197,0.1)] shadow-[0_4px_20px_rgba(108,72,197,0.08)]">
                                    <CardHeader>
                                        <CardTitle className="text-[18px] font-bold text-[#1A1A2E]">NAU y ROI por Influencer</CardTitle>
                                        <CardDescription className="text-[14px] text-[#6B6B8D]">
                                            Código, clientes nuevos y retorno estimado por cada influencer.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {summary.length === 0 ? (
                                            <div className="text-center py-8 text-[#6B6B8D] text-sm">
                                                No hay datos para los filtros seleccionados.
                                            </div>
                                        ) : (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="border-[rgba(108,72,197,0.1)]">
                                                        <TableHead className="text-[#1A1A2E] font-semibold">Código</TableHead>
                                                        <TableHead className="text-[#1A1A2E] font-semibold">Influencer</TableHead>
                                                        <TableHead className="text-[#1A1A2E] font-semibold">Username</TableHead>
                                                        <TableHead className="text-[#1A1A2E] font-semibold">Redes</TableHead>
                                                        <TableHead className="text-[#1A1A2E] font-semibold">Campaña</TableHead>
                                                        <TableHead className="text-[#1A1A2E] font-semibold text-right">
                                                            Clientes nuevos (NAU)
                                                        </TableHead>
                                                        <TableHead className="text-[#1A1A2E] font-semibold text-right">ROI</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {summary.map((row) => (
                                                        <TableRow
                                                            key={`${row.influencerId}-${row.referralCode ?? "none"}`}
                                                            className="border-[rgba(108,72,197,0.1)]"
                                                        >
                                                            <TableCell className="text-[#6B6B8D] text-sm">
                                                                {row.referralCode ?? "-"}
                                                            </TableCell>
                                                            <TableCell className="text-sm font-medium text-[#1A1A2E]">{row.name}</TableCell>
                                                            <TableCell className="text-[#6B6B8D] text-sm">
                                                                {row.username ?? `@influencer_${row.influencerId}`}
                                                            </TableCell>
                                                            <TableCell className="text-[#6B6B8D] text-sm">
                                                                {(row.socialPlatforms && row.socialPlatforms.length > 0
                                                                    ? row.socialPlatforms
                                                                    : ["TikTok", "Instagram"]
                                                                ).join(" · ")}
                                                            </TableCell>
                                                            <TableCell className="text-[#6B6B8D] text-sm">
                                                                {row.campaignName ?? "-"}
                                                            </TableCell>
                                                            <TableCell className="text-right text-sm text-[#1A1A2E]">
                                                                {row.nau.toLocaleString()}
                                                            </TableCell>
                                                            <TableCell className="text-right text-sm">
                                                                <span
                                                                    className={
                                                                        row.roi >= 0
                                                                            ? "text-[#4CAF50] font-semibold"
                                                                            : "text-[#EF4444] font-semibold"
                                                                    }
                                                                >
                                                                    {row.roi >= 0 ? "+" : ""}
                                                                    {row.roi.toFixed(1)}%
                                                                </span>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sección inferior: Alertas */}
                            <div className="grid grid-cols-1 gap-6">
                                {/* Alertas NAU / ROI */}
                                <Card className="rounded-[20px] border-[rgba(108,72,197,0.1)] shadow-[0_4px_20px_rgba(108,72,197,0.08)]">
                                    <CardHeader>
                                        <CardTitle className="text-[18px] font-bold text-[#1A1A2E]">Alertas</CardTitle>
                                        <CardDescription className="text-[14px] text-[#6B6B8D]">
                                            Influencers con NAU = 0 o ROI negativo.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {alerts.length === 0 ? (
                                            <div className="text-sm text-[#6B6B8D]">No hay alertas para el periodo seleccionado.</div>
                                        ) : (
                                            <div className="space-y-3 max-h-[260px] overflow-y-auto">
                                                {alerts.map((row) => (
                                                    <div
                                                        key={`${row.influencerId}-${row.referralCode ?? "none"}`}
                                                        className="p-3 rounded-xl bg-[#FFEBEE] text-[#B91C1C]"
                                                    >
                                                        <p className="text-sm font-semibold">
                                                            {row.name} ({row.referralCode ?? "sin código"})
                                                        </p>
                                                        <p className="text-sm mt-1 text-[#7F1D1D]">
                                                            {row.username ?? `@influencer_${row.influencerId}`} ·{" "}
                                                            {(row.socialPlatforms && row.socialPlatforms.length > 0
                                                                ? row.socialPlatforms
                                                                : ["TikTok", "Instagram"]
                                                            ).join(" · ")}
                                                        </p>
                                                        {row.nau === 0 && (
                                                            <p className="text-xs mt-1">NAU = 0 para el periodo seleccionado.</p>
                                                        )}
                                                        {row.roi < 0 && (
                                                            <p className="text-xs mt-1">ROI negativo de {row.roi.toFixed(1)}%.</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
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

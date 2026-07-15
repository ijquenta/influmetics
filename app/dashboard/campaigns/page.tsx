"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IconPlus, IconEye, IconLoader2, IconTarget, IconUsers, IconCurrencyDollar, IconActivity } from "@tabler/icons-react";
import type { CampaignWithRelations } from "@/shared/types/influencer.types";

export default function CampaignsPage() {
    const router = useRouter();
    const [campaigns, setCampaigns] = useState<CampaignWithRelations[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const fetchCampaigns = async () => {
        try {
            const res = await fetch("/api/campaigns");
            const data = await res.json();
            setCampaigns(data.data || []);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string | Date | null) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const activeCount = campaigns.filter((c) => c.isActive).length;
    const totalInvestment = campaigns.reduce((sum, c) => {
        return sum + (c.influencerCampaigns || []).reduce((s, ic) => s + (ic.agreedCost ? Number(ic.agreedCost) : 0), 0);
    }, 0);
    const totalInfluencers = campaigns.reduce((sum, c) => sum + (c._count?.influencerCampaigns ?? 0), 0);

    return (
        <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 bg-muted min-h-full">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div>
                                    <h1 className="text-[28px] font-bold text-foreground mb-1">Campañas</h1>
                                    <p className="text-[16px] text-muted-foreground">Gestiona las campañas de marketing y los influencers asignados</p>
                                </div>
                                <Button onClick={() => router.push("/dashboard/campaigns/new")} className="rounded-2xl px-6 gap-2 h-11">
                                    <IconPlus className="w-4 h-4" />
                                    Nueva campaña
                                </Button>
                            </div>

                            {/* KPI Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                    <CardContent className="p-4 md:p-5">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <IconTarget className="w-4 h-4" />
                                            <p className="text-[11px] font-medium uppercase tracking-wider">Total</p>
                                        </div>
                                        <p className="text-[22px] font-bold text-foreground">{campaigns.length}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{activeCount} activas</p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                    <CardContent className="p-4 md:p-5">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <IconActivity className="w-4 h-4" />
                                            <p className="text-[11px] font-medium uppercase tracking-wider">Activas</p>
                                        </div>
                                        <p className="text-[22px] font-bold text-green-600">{activeCount}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">{campaigns.length - activeCount} finalizadas</p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                    <CardContent className="p-4 md:p-5">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <IconUsers className="w-4 h-4" />
                                            <p className="text-[11px] font-medium uppercase tracking-wider">Influencers</p>
                                        </div>
                                        <p className="text-[22px] font-bold text-foreground">{totalInfluencers}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">asignados a campañas</p>
                                    </CardContent>
                                </Card>
                                <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                    <CardContent className="p-4 md:p-5">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                            <IconCurrencyDollar className="w-4 h-4" />
                                            <p className="text-[11px] font-medium uppercase tracking-wider">Inversión total</p>
                                        </div>
                                        <p className="text-[22px] font-bold text-foreground">${totalInvestment.toLocaleString("es-ES")}</p>
                                        <p className="text-[10px] text-muted-foreground mt-0.5">en todas las campañas</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Table */}
                            <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                <CardContent className="p-0">
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                                            <IconLoader2 className="w-4 h-4 animate-spin" />
                                            Cargando campañas...
                                        </div>
                                    ) : campaigns.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                                            <IconTarget className="w-10 h-10 opacity-30" />
                                            <p className="text-sm">No hay campañas todavía.</p>
                                            <p className="text-xs">Crea tu primera campaña para empezar a gestionar influencers.</p>
                                            <Button onClick={() => router.push("/dashboard/campaigns/new")} variant="outline" className="rounded-2xl mt-2 gap-2">
                                                <IconPlus className="w-4 h-4" />
                                                Crear campaña
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="border-primary/10">
                                                        <TableHead className="text-foreground font-semibold">Nombre</TableHead>
                                                        <TableHead className="text-foreground font-semibold hidden md:table-cell">País</TableHead>
                                                        <TableHead className="text-foreground font-semibold hidden lg:table-cell">Fechas</TableHead>
                                                        <TableHead className="text-foreground font-semibold">Estado</TableHead>
                                                        <TableHead className="text-foreground font-semibold text-center">Influencers</TableHead>
                                                        <TableHead className="text-foreground font-semibold text-right hidden sm:table-cell">Inversión</TableHead>
                                                        <TableHead className="text-foreground font-semibold text-right">Acciones</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {campaigns.map((campaign) => {
                                                        const investment = (campaign.influencerCampaigns || []).reduce((s, ic) => s + (ic.agreedCost ? Number(ic.agreedCost) : 0), 0);
                                                        return (
                                                            <TableRow
                                                                key={campaign.id}
                                                                className="border-primary/10 cursor-pointer hover:bg-muted/50"
                                                                onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                                                            >
                                                                <TableCell>
                                                                    <p className="text-sm font-medium text-foreground">{campaign.name}</p>
                                                                    {campaign.primaryGoalType && (
                                                                        <p className="text-xs text-muted-foreground mt-0.5">{campaign.primaryGoalType.name}</p>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                                                                    {campaign.country || "—"}
                                                                </TableCell>
                                                                <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">
                                                                    <p>{formatDate(campaign.startDate)}</p>
                                                                    {campaign.endDate && <p className="text-xs">al {formatDate(campaign.endDate)}</p>}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge variant={campaign.isActive ? "default" : "secondary"} className="rounded-2xl">
                                                                        {campaign.isActive ? "Activa" : "Finalizada"}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-center text-sm text-foreground">
                                                                    {campaign._count?.influencerCampaigns ?? 0}
                                                                </TableCell>
                                                                <TableCell className="text-right text-sm text-foreground hidden sm:table-cell">
                                                                    {investment > 0 ? `$${investment.toLocaleString("es-ES")}` : "—"}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            router.push(`/dashboard/campaigns/${campaign.id}`);
                                                                        }}
                                                                        className="text-primary"
                                                                    >
                                                                        <IconEye className="w-4 h-4 mr-1" />
                                                                        Ver
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
    );
}

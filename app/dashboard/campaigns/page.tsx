"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IconPlus, IconEye } from "@tabler/icons-react";
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
        if (!date) return "-";
        return new Date(date).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
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
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h1 className="text-[28px] font-bold text-foreground mb-2">Campañas</h1>
                                    <p className="text-[16px] text-muted-foreground">Gestiona y visualiza las campañas de marketing</p>
                                </div>
                                <Button
                                    onClick={() => router.push("/dashboard/campaigns/new")}
                                    className="bg-gradient-to-r from-primary/80 to-primary text-white rounded-2xl px-6"
                                >
                                    <IconPlus className="w-4 h-4 mr-2" />
                                    Nueva Campaña
                                </Button>
                            </div>

                            <Card className="rounded-[20px] border-primary/10 shadow-[0_4px_20px_rgba(108,72,197,0.08)]">
                                <CardContent className="p-6">
                                    {loading ? (
                                        <div className="text-center py-8 text-muted-foreground">Cargando...</div>
                                    ) : campaigns.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No se encontraron campañas. Crea una nueva campaña para comenzar.
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-primary/10">
                                                    <TableHead className="text-foreground font-semibold">Nombre</TableHead>
                                                    <TableHead className="text-foreground font-semibold">País</TableHead>
                                                    <TableHead className="text-foreground font-semibold">Objetivo</TableHead>
                                                    <TableHead className="text-foreground font-semibold">Fecha Inicio</TableHead>
                                                    <TableHead className="text-foreground font-semibold">Fecha Fin</TableHead>
                                                    <TableHead className="text-foreground font-semibold">Estado</TableHead>
                                                    <TableHead className="text-foreground font-semibold">Influencers</TableHead>
                                                    <TableHead className="text-foreground font-semibold">Posts</TableHead>
                                                    <TableHead className="text-foreground font-semibold text-right">Acciones</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {campaigns.map((campaign) => (
                                                    <TableRow
                                                        key={campaign.id}
                                                        className="border-primary/10 hover:bg-muted"
                                                    >
                                                        <TableCell className="font-medium text-foreground">{campaign.name}</TableCell>
                                                        <TableCell className="text-muted-foreground">{campaign.country || "-"}</TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {campaign.primaryGoalType?.name || "-"}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">{formatDate(campaign.startDate)}</TableCell>
                                                        <TableCell className="text-muted-foreground">{formatDate(campaign.endDate)}</TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={campaign.isActive ? "default" : "secondary"}
                                                                className={
                                                                    campaign.isActive
                                                                        ? "bg-success text-white"
                                                                        : "bg-muted text-white"
                                                                }
                                                            >
                                                                {campaign.isActive ? "Activa" : "Finalizada"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">
                                                            {campaign._count?.influencerCampaigns || 0}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">{campaign._count?.posts || 0}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    router.push(`/dashboard/campaigns/${campaign.id}`);
                                                                }}
                                                                className="text-primary hover:text-primary/90"
                                                            >
                                                                <IconEye className="w-4 h-4 mr-2" />
                                                                Ver
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

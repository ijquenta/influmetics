"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CampaignWithRelations } from "@/shared/types/influencer.types";

export default function CampaignDetailPage() {
    const params = useParams();
    const id = Number(params?.id);

    const [campaign, setCampaign] = useState<CampaignWithRelations | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id || Number.isNaN(id)) return;
        fetchCampaign();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchCampaign = async () => {
        try {
            const res = await fetch(`/api/campaigns?id=${id}`);
            const data = await res.json();
            const item = (data.data || [])[0] as CampaignWithRelations | undefined;
            if (item) {
                setCampaign(item);
            } else {
                setCampaign(null);
            }
        } catch (error) {
            console.error("Error fetching campaign detail:", error);
            setCampaign(null);
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
                            <div className="flex items-center gap-4 mb-4">
                                <div>
                                    <PageBreadcrumb />
                                    <h1 className="text-[28px] font-bold text-foreground mb-1">{campaign ? campaign.name : "Campaña"}</h1>
                                    <p className="text-[16px] text-muted-foreground">Detalle de la campaña y distribución de costos</p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center py-12 text-muted-foreground">Cargando...</div>
                            ) : !campaign ? (
                                <div className="text-center py-12 text-muted-foreground">No se encontró la campaña.</div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Card principal de info */}
                                    <Card className="lg:col-span-2 rounded-[20px] border-primary/10 shadow-[0_4px_20px_rgba(108,72,197,0.08)]">
                                        <CardHeader>
                                            <CardTitle className="text-[18px] font-bold text-foreground">Información general</CardTitle>
                                            <CardDescription className="text-[14px] text-muted-foreground">
                                                Datos básicos de la campaña
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {campaign.description && <p className="text-[14px] text-muted-foreground">{campaign.description}</p>}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">País</p>
                                                    <p className="text-sm font-semibold text-foreground">{campaign.country || "N/A"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Objetivo principal</p>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {campaign.primaryGoalType?.name || "Sin objetivo definido"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Fecha de inicio</p>
                                                    <p className="text-sm font-semibold text-foreground">{formatDate(campaign.startDate)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Fecha de fin</p>
                                                    <p className="text-sm font-semibold text-foreground">{formatDate(campaign.endDate)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Estado</p>
                                                    <Badge
                                                        variant={campaign.isActive ? "default" : "secondary"}
                                                        className={
                                                            campaign.isActive ? "bg-success text-white" : "bg-muted text-white"
                                                        }
                                                    >
                                                        {campaign.isActive ? "Activa" : "Finalizada"}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Influencers asociados</p>
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {campaign._count?.influencerCampaigns ?? 0}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

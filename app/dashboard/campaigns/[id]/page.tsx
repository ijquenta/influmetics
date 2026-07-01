"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { IconLoader2, IconEdit, IconTrash, IconCurrencyDollar, IconUsers, IconArticle, IconTrendingUp, IconArrowLeft } from "@tabler/icons-react";
import { toast } from "sonner";
import type { CampaignWithRelations } from "@/shared/types/influencer.types";

interface CampaignDetail extends CampaignWithRelations {
    rankings?: {
        roi: { id: number; name: string; value: number }[];
        engagement: { id: number; name: string; value: number }[];
        reach: { id: number; name: string; value: number }[];
        conversions: { id: number; name: string; value: number }[];
    };
}

const GOAL_TYPES = [
    { value: "1", label: "Awareness / Alcance" },
    { value: "2", label: "Consideración" },
    { value: "3", label: "Conversiones" },
    { value: "4", label: "Branding" },
];

const COUNTRIES = [
    { value: "BO", label: "Bolivia" },
    { value: "MX", label: "México" },
    { value: "PE", label: "Perú" },
    { value: "CL", label: "Chile" },
    { value: "AR", label: "Argentina" },
];

export default function CampaignDetailPage() {
    const params = useParams();
    const id = Number(params?.id);
    const router = useRouter();

    const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [form, setForm] = useState({
        name: "",
        description: "",
        country: "",
        startDate: "",
        endDate: "",
        isActive: true,
        primaryGoalTypeId: "",
    });

    useEffect(() => {
        if (!id || Number.isNaN(id)) return;
        fetchCampaign();
    }, [id]);

    const fetchCampaign = async () => {
        try {
            const res = await fetch(`/api/campaigns/${id}`);
            const data = await res.json();
            setCampaign(data.data ?? null);
        } catch {
            setCampaign(null);
        } finally {
            setLoading(false);
        }
    };

    const openEdit = () => {
        if (!campaign) return;
        setForm({
            name: campaign.name,
            description: campaign.description || "",
            country: campaign.country || "",
            startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split("T")[0] : "",
            endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split("T")[0] : "",
            isActive: campaign.isActive,
            primaryGoalTypeId: campaign.primaryGoalTypeId?.toString() || "",
        });
        setEditOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/campaigns/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error();
            toast.success("Campaña actualizada");
            setEditOpen(false);
            await fetchCampaign();
        } catch {
            toast.error("Error al actualizar campaña");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            toast.success("Campaña eliminada");
            router.push("/dashboard/campaigns");
        } catch {
            toast.error("Error al eliminar campaña");
        } finally {
            setDeleting(false);
        }
    };

    const formatDate = (date: string | Date | null) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("es-ES", { year: "numeric", month: "short", day: "numeric" });
    };

    const investment = (campaign?.influencerCampaigns || []).reduce((s, ic) => s + (ic.agreedCost ? Number(ic.agreedCost) : 0), 0);
    const influencerCount = campaign?._count?.influencerCampaigns ?? 0;
    const postsCount = campaign?._count?.posts ?? 0;

    return (
        <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 bg-muted min-h-full">
                            {/* Loading */}
                            {loading ? (
                                <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
                                    <IconLoader2 className="w-5 h-5 animate-spin" />
                                    Cargando campaña...
                                </div>
                            ) : !campaign ? (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                                    <p className="text-lg">Campaña no encontrada</p>
                                    <Button variant="outline" onClick={() => router.push("/dashboard/campaigns")} className="rounded-2xl gap-2">
                                        <IconArrowLeft className="w-4 h-4" />
                                        Volver a campañas
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div>
                                            <PageBreadcrumb />
                                            <h1 className="text-[28px] font-bold text-foreground mb-1">{campaign.name}</h1>
                                            <p className="text-[16px] text-muted-foreground">{campaign.description || "Detalle de la campaña"}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={openEdit} className="rounded-2xl gap-2">
                                                <IconEdit className="w-4 h-4" />
                                                Editar
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)} className="rounded-2xl gap-2 text-red-500 border-red-200 hover:bg-red-50">
                                                <IconTrash className="w-4 h-4" />
                                                Eliminar
                                            </Button>
                                        </div>
                                    </div>

                                    {/* KPI Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                            <CardContent className="p-4 md:p-5">
                                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                    <IconCurrencyDollar className="w-4 h-4" />
                                                    <p className="text-[11px] font-medium uppercase tracking-wider">Inversión</p>
                                                </div>
                                                <p className="text-[22px] font-bold text-foreground">${investment.toLocaleString("es-ES")}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">{influencerCount} influencers</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                            <CardContent className="p-4 md:p-5">
                                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                    <IconUsers className="w-4 h-4" />
                                                    <p className="text-[11px] font-medium uppercase tracking-wider">Influencers</p>
                                                </div>
                                                <p className="text-[22px] font-bold text-foreground">{influencerCount}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">asignados a la campaña</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                            <CardContent className="p-4 md:p-5">
                                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                    <IconArticle className="w-4 h-4" />
                                                    <p className="text-[11px] font-medium uppercase tracking-wider">Posts</p>
                                                </div>
                                                <p className="text-[22px] font-bold text-foreground">{postsCount}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">publicados</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                            <CardContent className="p-4 md:p-5">
                                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                                    <IconTrendingUp className="w-4 h-4" />
                                                    <p className="text-[11px] font-medium uppercase tracking-wider">Estado</p>
                                                </div>
                                                <Badge variant={campaign.isActive ? "default" : "secondary"} className="rounded-2xl text-sm px-3 py-1">
                                                    {campaign.isActive ? "Activa" : "Finalizada"}
                                                </Badge>
                                                <p className="text-[10px] text-muted-foreground mt-1.5">
                                                    {campaign.isActive ? "En curso" : "Campaña cerrada"}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Info Card */}
                                    <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                        <CardHeader>
                                            <CardTitle className="text-[18px] font-bold text-foreground">Información general</CardTitle>
                                            <CardDescription className="text-[14px] text-muted-foreground">Datos y fechas de la campaña</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">País</p>
                                                    <p className="font-semibold text-foreground">{campaign.country || "No especificado"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Objetivo</p>
                                                    <p className="font-semibold text-foreground">{campaign.primaryGoalType?.name || "Sin definir"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Fecha inicio</p>
                                                    <p className="font-semibold text-foreground">{formatDate(campaign.startDate)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Fecha fin</p>
                                                    <p className="font-semibold text-foreground">{formatDate(campaign.endDate)}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Influencers assigned */}
                                    <Card className="rounded-[20px] border-[rgba(108,72,197,0.06)] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                                        <CardHeader>
                                            <CardTitle className="text-[18px] font-bold text-foreground">Influencers asignados</CardTitle>
                                            <CardDescription className="text-[14px] text-muted-foreground">
                                                {influencerCount > 0 ? `${influencerCount} influencer${influencerCount !== 1 ? "es" : ""} con inversión registrada` : "Sin influencers asignados"}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            {(!campaign.influencerCampaigns || campaign.influencerCampaigns.length === 0) ? (
                                                <div className="text-center py-8 text-muted-foreground text-sm px-6">
                                                    No hay influencers asignados a esta campaña.
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="border-primary/10">
                                                                <TableHead className="text-foreground font-semibold">Influencer</TableHead>
                                                                <TableHead className="text-foreground font-semibold text-right">Inversión</TableHead>
                                                                <TableHead className="text-foreground font-semibold text-right">Creado</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {campaign.influencerCampaigns.map((ic) => (
                                                                <TableRow key={ic.id} className="border-primary/10 cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/dashboard/influencers/${ic.influencer.id}`)}>
                                                                    <TableCell>
                                                                        <div className="flex items-center gap-3">
                                                                            <Avatar className="h-8 w-8">
                                                                                <AvatarFallback className="text-[10px]">{ic.influencer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                                            </Avatar>
                                                                            <div>
                                                                                <p className="text-sm font-medium text-foreground">{ic.influencer.name}</p>
                                                                                {ic.influencer.niche && <p className="text-xs text-muted-foreground">{ic.influencer.niche}</p>}
                                                                            </div>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell className="text-right text-sm text-foreground">
                                                                        {ic.agreedCost ? `$${Number(ic.agreedCost).toLocaleString("es-ES")}` : "—"}
                                                                    </TableCell>
                                                                    <TableCell className="text-right text-sm text-muted-foreground">
                                                                        {new Date(ic.createdAt).toLocaleDateString("es-ES")}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </>
                            )}

                            {/* Edit Dialog */}
                            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                                <DialogContent className="rounded-[20px] max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle>Editar campaña</DialogTitle>
                                        <DialogDescription>Actualiza los datos de la campaña</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Nombre</Label>
                                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-2xl" />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Descripción</Label>
                                            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-2xl border border-primary/10 bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary" rows={3} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm font-semibold mb-2 block">País</Label>
                                                <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                                                    <SelectTrigger className="rounded-2xl">
                                                        <SelectValue placeholder="Seleccionar" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {COUNTRIES.map((c) => (
                                                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-semibold mb-2 block">Objetivo</Label>
                                                <Select value={form.primaryGoalTypeId} onValueChange={(v) => setForm({ ...form, primaryGoalTypeId: v })}>
                                                    <SelectTrigger className="rounded-2xl">
                                                        <SelectValue placeholder="Seleccionar" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {GOAL_TYPES.map((g) => (
                                                            <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label className="text-sm font-semibold mb-2 block">Fecha inicio</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" className="w-full justify-between rounded-2xl font-normal">
                                                            {form.startDate ? new Date(form.startDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "Seleccionar"}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar mode="single" selected={form.startDate ? new Date(form.startDate) : undefined} onSelect={(d) => d && setForm({ ...form, startDate: d.toISOString().split("T")[0] })} initialFocus />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-semibold mb-2 block">Fecha fin</Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" className="w-full justify-between rounded-2xl font-normal">
                                                            {form.endDate ? new Date(form.endDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "Seleccionar"}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar mode="single" selected={form.endDate ? new Date(form.endDate) : undefined} onSelect={(d) => d && setForm({ ...form, endDate: d.toISOString().split("T")[0] })} initialFocus />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-primary/30" />
                                            <Label htmlFor="isActive" className="text-sm">Campaña activa</Label>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setEditOpen(false)} className="rounded-2xl">Cancelar</Button>
                                        <Button onClick={handleSave} disabled={saving} className="rounded-2xl">{saving ? "Guardando..." : "Guardar"}</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            {/* Delete Dialog */}
                            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                                <DialogContent className="rounded-[20px] max-w-sm">
                                    <DialogHeader>
                                        <DialogTitle>Eliminar campaña</DialogTitle>
                                        <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
                                    </DialogHeader>
                                    <p className="text-sm text-muted-foreground py-2">
                                        ¿Estás seguro de eliminar la campaña <strong>{campaign?.name}</strong>? También se eliminarán las asignaciones de influencers.
                                    </p>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setDeleteOpen(false)} className="rounded-2xl">Cancelar</Button>
                                        <Button onClick={handleDelete} disabled={deleting} className="rounded-2xl bg-red-600 hover:bg-red-700 text-white">
                                            {deleting ? "Eliminando..." : "Eliminar"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </div>
    );
}

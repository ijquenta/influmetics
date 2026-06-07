"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconArrowLeft } from "@tabler/icons-react";
import { toast } from "sonner";

const goalTypes = [
    { value: "AWARENESS", label: "Awareness / Alcance" },
    { value: "CONSIDERATION", label: "Consideración" },
    { value: "CONVERSIONS", label: "Conversiones" },
    { value: "BRANDING", label: "Branding" },
];

const countries = [
    { value: "BO", label: "Bolivia" },
    { value: "MX", label: "México" },
    { value: "PE", label: "Perú" },
    { value: "CL", label: "Chile" },
    { value: "AR", label: "Argentina" },
];

export default function NewCampaignPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        country: "BO",
        startDate: "",
        endDate: "",
        isActive: true,
        primaryGoalTypeId: "",
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData({
            ...formData,
            [field]: value,
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error("El nombre de la campaña es requerido");
            return;
        }

        if (!formData.startDate) {
            toast.error("La fecha de inicio es requerida");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                country: formData.country || null,
                startDate: formData.startDate,
                endDate: formData.endDate || null,
                isActive: formData.isActive,
                primaryGoalTypeId: formData.primaryGoalTypeId || null,
            };

            const res = await fetch("/api/campaigns", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Campaña creada exitosamente");
                router.push("/dashboard/campaigns");
            } else {
                // En modo demo, el endpoint devuelve 501
                toast.error(data.error || "Error al crear campaña");
            }
        } catch (error) {
            console.error("Error creating campaign:", error);
            toast.error(error instanceof Error ? error.message : "Error al crear campaña");
        } finally {
            setLoading(false);
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
                            {/* Header */}
                            <div className="flex items-center gap-4 mb-6">
                                <div>
                                    <PageBreadcrumb />
                                    <h1 className="text-[28px] font-bold text-[#1A1A2E] mb-2">Nueva Campaña</h1>
                                    <p className="text-[16px] text-[#6B6B8D]">Define la información principal de la campaña</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <Card className="rounded-[20px] border-[rgba(108,72,197,0.1)] shadow-[0_4px_20px_rgba(108,72,197,0.08)] max-w-4xl">
                                    <CardHeader>
                                        <CardTitle className="text-[18px] font-bold text-[#1A1A2E]">Detalles de la Campaña</CardTitle>
                                        <CardDescription className="text-[14px] text-[#6B6B8D]">
                                            Nombre, fechas, país y objetivo principal
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5">
                                        <div>
                                            <Label htmlFor="name" className="text-[14px] font-semibold text-[#1A1A2E] mb-2 block">
                                                Nombre de la campaña <span className="text-[#EF4444]">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                value={formData.name}
                                                onChange={(e) => handleInputChange("name", e.target.value)}
                                                placeholder="Ej: Lanzamiento Influmetics Bolivia"
                                                className="rounded-2xl"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="description" className="text-[14px] font-semibold text-[#1A1A2E] mb-2 block">
                                                Descripción
                                            </Label>
                                            <textarea
                                                id="description"
                                                value={formData.description}
                                                onChange={(e) => handleInputChange("description", e.target.value)}
                                                placeholder="Describe brevemente el objetivo y contexto de la campaña..."
                                                className="w-full rounded-2xl border border-[rgba(108,72,197,0.1)] bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#6C48C5]"
                                                rows={4}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="country" className="text-[14px] font-semibold text-[#1A1A2E] mb-2 block">
                                                    País
                                                </Label>
                                                <Select
                                                    value={formData.country}
                                                    onValueChange={(value) => handleInputChange("country", value)}
                                                >
                                                    <SelectTrigger id="country" className="rounded-2xl">
                                                        <SelectValue placeholder="Selecciona un país" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {countries.map((c) => (
                                                            <SelectItem key={c.value} value={c.value}>
                                                                {c.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label
                                                    htmlFor="primaryGoalTypeId"
                                                    className="text-[14px] font-semibold text-[#1A1A2E] mb-2 block"
                                                >
                                                    Objetivo principal
                                                </Label>
                                                <Select
                                                    value={formData.primaryGoalTypeId}
                                                    onValueChange={(value) => handleInputChange("primaryGoalTypeId", value)}
                                                >
                                                    <SelectTrigger id="primaryGoalTypeId" className="rounded-2xl">
                                                        <SelectValue placeholder="Selecciona un objetivo" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {goalTypes.map((g) => (
                                                            <SelectItem key={g.value} value={g.value}>
                                                                {g.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="startDate" className="text-[14px] font-semibold text-[#1A1A2E] mb-2 block">
                                                    Fecha de inicio <span className="text-[#EF4444]">*</span>
                                                </Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="w-full justify-between rounded-2xl text-left font-normal"
                                                        >
                                                            {formData.startDate
                                                                ? new Date(formData.startDate).toLocaleDateString("es-ES", {
                                                                    day: "2-digit",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                })
                                                                : "Seleccionar fecha"}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={formData.startDate ? new Date(formData.startDate) : undefined}
                                                            onSelect={(date: Date | undefined) =>
                                                                handleInputChange("startDate", date ? date.toISOString().split("T")[0] : "")
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>

                                            <div>
                                                <Label htmlFor="endDate" className="text-[14px] font-semibold text-[#1A1A2E] mb-2 block">
                                                    Fecha de fin
                                                </Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className="w-full justify-between rounded-2xl text-left font-normal"
                                                        >
                                                            {formData.endDate
                                                                ? new Date(formData.endDate).toLocaleDateString("es-ES", {
                                                                    day: "2-digit",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                })
                                                                : "Seleccionar fecha"}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={formData.endDate ? new Date(formData.endDate) : undefined}
                                                            onSelect={(date: Date | undefined) =>
                                                                handleInputChange("endDate", date ? date.toISOString().split("T")[0] : "")
                                                            }
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => router.push("/dashboard/campaigns")}
                                                className="rounded-2xl"
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={loading}
                                                className="bg-gradient-to-r from-[#8B6FD9] to-[#6C48C5] text-white rounded-2xl px-8"
                                            >
                                                {loading ? "Guardando..." : "Guardar Campaña"}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </form>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

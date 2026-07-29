"use client";

import { useState, useEffect } from "react";
import { PageBreadcrumb } from "@/components/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth, type Company } from "@/contexts/AuthContext";

const countries = [
    { value: "BO", label: "Bolivia" },
    { value: "MX", label: "México" },
    { value: "PE", label: "Perú" },
    { value: "CL", label: "Chile" },
    { value: "AR", label: "Argentina" },
];

const sizes = [
    { value: "1-10", label: "1-10 empleados" },
    { value: "11-50", label: "11-50 empleados" },
    { value: "51-200", label: "51-200 empleados" },
    { value: "201-500", label: "201-500 empleados" },
    { value: "500+", label: "Más de 500 empleados" },
];

export default function SettingsPage() {
    const { company, refreshCompany } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Company>>({});

    useEffect(() => {
        if (company) {
            setFormData({ ...company });
        }
    }, [company]);

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData.name?.trim()) {
            toast.error("El nombre de la empresa es requerido");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/company", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success("Perfil actualizado exitosamente");
                await refreshCompany();
            } else {
                const data = await res.json();
                toast.error(data.error || "Error al actualizar perfil");
            }
        } catch {
            toast.error("Error al actualizar perfil");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
                <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 bg-muted min-h-full">
                    <div className="flex items-center gap-4 mb-6">
                        <div>
                            <PageBreadcrumb />
                            <h1 className="text-[28px] font-bold text-foreground mb-2">Ajustes</h1>
                            <p className="text-[16px] text-muted-foreground">Perfil de tu empresa</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <Card className="rounded-[20px] border-primary/10 shadow-[var(--card-shadow-md)] max-w-4xl">
                            <CardHeader>
                                <CardTitle className="text-[18px] font-bold text-foreground">Información de la Empresa</CardTitle>
                                <CardDescription className="text-[14px] text-muted-foreground">
                                    Datos principales de tu compañía
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div>
                                    <Label htmlFor="name" className="text-[14px] font-semibold text-foreground mb-2 block">
                                        Nombre de la empresa <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={formData.name || ""}
                                        onChange={(e) => handleChange("name", e.target.value)}
                                        placeholder="Ej: Influmetics SRL"
                                        className="rounded-2xl"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="rubro" className="text-[14px] font-semibold text-foreground mb-2 block">
                                            Rubro
                                        </Label>
                                        <Input
                                            id="rubro"
                                            value={formData.rubro || ""}
                                            onChange={(e) => handleChange("rubro", e.target.value)}
                                            placeholder="Ej: Marketing Digital"
                                            className="rounded-2xl"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="country" className="text-[14px] font-semibold text-foreground mb-2 block">
                                            País
                                        </Label>
                                        <Select
                                            value={formData.country || ""}
                                            onValueChange={(value) => handleChange("country", value)}
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
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="website" className="text-[14px] font-semibold text-foreground mb-2 block">
                                            Sitio web
                                        </Label>
                                        <Input
                                            id="website"
                                            value={formData.website || ""}
                                            onChange={(e) => handleChange("website", e.target.value)}
                                            placeholder="https://ejemplo.com"
                                            className="rounded-2xl"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="size" className="text-[14px] font-semibold text-foreground mb-2 block">
                                            Tamaño de la empresa
                                        </Label>
                                        <Select
                                            value={formData.size || ""}
                                            onValueChange={(value) => handleChange("size", value)}
                                        >
                                            <SelectTrigger id="size" className="rounded-2xl">
                                                <SelectValue placeholder="Selecciona un rango" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sizes.map((s) => (
                                                    <SelectItem key={s.value} value={s.value}>
                                                        {s.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="culture" className="text-[14px] font-semibold text-foreground mb-2 block">
                                        Cultura empresarial
                                    </Label>
                                    <textarea
                                        id="culture"
                                        value={formData.culture || ""}
                                        onChange={(e) => handleChange("culture", e.target.value)}
                                        placeholder="Describe los valores, misión y visión de tu empresa..."
                                        className="w-full rounded-2xl border border-primary/10 bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="description" className="text-[14px] font-semibold text-foreground mb-2 block">
                                        Descripción
                                    </Label>
                                    <textarea
                                        id="description"
                                        value={formData.description || ""}
                                        onChange={(e) => handleChange("description", e.target.value)}
                                        placeholder="Describe brevemente tu empresa..."
                                        className="w-full rounded-2xl border border-primary/10 bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                        rows={4}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-gradient-to-r from-primary/80 to-primary text-primary-foreground rounded-2xl px-8"
                                    >
                                        {loading ? "Guardando..." : "Guardar Cambios"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>
            </div>
        </div>
    );
}

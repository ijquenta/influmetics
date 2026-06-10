"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconPlus, IconX } from "@tabler/icons-react";
import { toast } from "sonner";

interface SocialAccount {
    id: string;
    socialPlatformId: string;
    handle: string;
    profileUrl: string;
    isActive: boolean;
}

interface SocialPlatform {
    id: number;
    code: string;
    name: string;
}

export default function NewInfluencerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
    const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        birthDate: "",
        niche: "",
        referralCode: "",
    });

    useEffect(() => {
        fetchPlatforms();
    }, []);

    const fetchPlatforms = async () => {
        try {
            const res = await fetch("/api/data/platforms");
            const data = await res.json();
            setPlatforms(data.data || []);
        } catch (error) {
            console.error("Error fetching platforms:", error);
            // Plataformas por defecto
            setPlatforms([
                { id: 1, code: "tiktok", name: "TikTok" },
                { id: 2, code: "instagram", name: "Instagram" },
                { id: 3, code: "youtube", name: "YouTube" },
                { id: 4, code: "x", name: "X (Twitter)" },
            ]);
        }
    };

    const addSocialAccount = () => {
        setSocialAccounts([
            ...socialAccounts,
            {
                id: Date.now().toString(),
                socialPlatformId: "",
                handle: "",
                profileUrl: "",
                isActive: true,
            },
        ]);
    };

    const removeSocialAccount = (id: string) => {
        setSocialAccounts(socialAccounts.filter((account) => account.id !== id));
    };

    const updateSocialAccount = (id: string, field: keyof SocialAccount, value: string | boolean) => {
        setSocialAccounts(
            socialAccounts.map((account) =>
                account.id === id
                    ? {
                          ...account,
                          [field]: value,
                      }
                    : account
            )
        );
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error("El nombre es requerido");
            return;
        }

        // Validar que no haya plataformas duplicadas
        const platformIds = socialAccounts.filter((acc) => acc.socialPlatformId && acc.handle.trim()).map((acc) => acc.socialPlatformId);
        const uniquePlatformIds = new Set(platformIds);

        if (platformIds.length !== uniquePlatformIds.size) {
            toast.error("No puedes agregar la misma plataforma social dos veces");
            return;
        }

        setLoading(true);

        try {
            // Filtrar cuentas sociales válidas
            const validSocialAccounts = socialAccounts
                .filter((acc) => acc.socialPlatformId && acc.handle.trim())
                .map((acc) => ({
                    socialPlatformId: parseInt(acc.socialPlatformId),
                    handle: acc.handle.replace("@", "").trim(),
                    profileUrl: acc.profileUrl.trim() || null,
                    isActive: acc.isActive,
                }));

            const payload = {
                ...formData,
                birthDate: formData.birthDate || null,
                email: formData.email.trim() || null,
                niche: formData.niche.trim() || null,
                referralCode: formData.referralCode.trim() || null,
                socialAccounts: validSocialAccounts,
            };

            const res = await fetch("/api/influencers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success("Influencer creado exitosamente");
                router.push("/dashboard/influencers");
            } else {
                throw new Error(data.error || "Error al crear influencer");
            }
        } catch (error) {
            console.error("Error creating influencer:", error);
            toast.error(error instanceof Error ? error.message : "Error al crear influencer");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData({
            ...formData,
            [field]: value,
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
                            {/* Header */}
                            <div className="flex items-center gap-4 mb-6">
                                <div>
                                    <h1 className="text-[28px] font-bold text-foreground mb-2">Nuevo Influencer</h1>
                                    <p className="text-[16px] text-muted-foreground">
                                        Completa la información del influencer y sus cuentas de redes sociales
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Información Básica */}
                                    <Card className="rounded-[20px] border-primary/10 shadow-[0_4px_20px_rgba(108,72,197,0.08)]">
                                        <CardHeader>
                                            <CardTitle className="text-[18px] font-bold text-foreground">Información Básica</CardTitle>
                                            <CardDescription className="text-[14px] text-muted-foreground">
                                                Datos personales del influencer
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <Label htmlFor="name" className="text-[14px] font-semibold text-foreground mb-2 block">
                                                    Nombre completo <span className="text-destructive">*</span>
                                                </Label>
                                                <Input
                                                    id="name"
                                                    value={formData.name}
                                                    onChange={(e) => handleInputChange("name", e.target.value)}
                                                    placeholder="Ej: María García"
                                                    className="rounded-2xl"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="email" className="text-[14px] font-semibold text-foreground mb-2 block">
                                                    Email
                                                </Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => handleInputChange("email", e.target.value)}
                                                    placeholder="Ej: maria@example.com"
                                                    className="rounded-2xl"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="birthDate" className="text-[14px] font-semibold text-foreground mb-2 block">
                                                    Fecha de nacimiento
                                                </Label>
                                                <Input
                                                    id="birthDate"
                                                    type="date"
                                                    value={formData.birthDate}
                                                    onChange={(e) => handleInputChange("birthDate", e.target.value)}
                                                    className="rounded-2xl"
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="niche" className="text-[14px] font-semibold text-foreground mb-2 block">
                                                    Nicho
                                                </Label>
                                                <Input
                                                    id="niche"
                                                    value={formData.niche}
                                                    onChange={(e) => handleInputChange("niche", e.target.value)}
                                                    placeholder="Ej: Beauty & Lifestyle"
                                                    className="rounded-2xl"
                                                />
                                            </div>

                                            <div>
                                                <Label
                                                    htmlFor="referralCode"
                                                    className="text-[14px] font-semibold text-foreground mb-2 block"
                                                >
                                                    Código de referido
                                                </Label>
                                                <Input
                                                    id="referralCode"
                                                    value={formData.referralCode}
                                                    onChange={(e) => handleInputChange("referralCode", e.target.value)}
                                                    placeholder="Ej: MARIA2025"
                                                    className="rounded-2xl"
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Cuentas de Redes Sociales */}
                                    <Card className="rounded-[20px] border-primary/10 shadow-[0_4px_20px_rgba(108,72,197,0.08)]">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="text-[18px] font-bold text-foreground">Redes Sociales</CardTitle>
                                                    <CardDescription className="text-[14px] text-muted-foreground">
                                                        Agrega las cuentas de redes sociales del influencer
                                                    </CardDescription>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={addSocialAccount}
                                                    className="border-primary text-primary hover:bg-primary/10 rounded-2xl"
                                                >
                                                    <IconPlus className="w-4 h-4 mr-1" />
                                                    Agregar
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {socialAccounts.length === 0 ? (
                                                <div className="text-center py-8 text-muted-foreground text-sm">
                                                    <p>No hay cuentas de redes sociales agregadas</p>
                                                    <p className="text-xs mt-2">Haz clic en &quot;Agregar&quot; para añadir una cuenta</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {socialAccounts.map((account, index) => (
                                                        <Card
                                                            key={account.id}
                                                            className="p-4 rounded-[16px] border-primary/10 shadow-sm"
                                                        >
                                                            <div className="flex items-center justify-between mb-3">
                                                                <span className="text-sm font-semibold text-foreground">
                                                                    Cuenta #{index + 1}
                                                                </span>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => removeSocialAccount(account.id)}
                                                                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/10 h-6 w-6 p-0"
                                                                >
                                                                    <IconX className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <Label className="text-xs text-muted-foreground mb-1 block">
                                                                        Plataforma <span className="text-destructive">*</span>
                                                                    </Label>
                                                                    <Select
                                                                        value={account.socialPlatformId}
                                                                        onValueChange={(value) =>
                                                                            updateSocialAccount(account.id, "socialPlatformId", value)
                                                                        }
                                                                    >
                                                                        <SelectTrigger className="rounded-2xl h-10">
                                                                            <SelectValue placeholder="Selecciona una plataforma" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {platforms.map((platform) => {
                                                                                // Verificar si esta plataforma ya está seleccionada en otra cuenta
                                                                                const isUsed = socialAccounts.some(
                                                                                    (acc) =>
                                                                                        acc.id !== account.id &&
                                                                                        acc.socialPlatformId === platform.id.toString() &&
                                                                                        acc.handle.trim()
                                                                                );
                                                                                return (
                                                                                    <SelectItem
                                                                                        key={platform.id}
                                                                                        value={platform.id.toString()}
                                                                                        disabled={isUsed}
                                                                                    >
                                                                                        {platform.name}
                                                                                        {isUsed && " (ya agregada)"}
                                                                                    </SelectItem>
                                                                                );
                                                                            })}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>

                                                                <div>
                                                                    <Label className="text-xs text-muted-foreground mb-1 block">
                                                                        Handle/Usuario <span className="text-destructive">*</span>
                                                                    </Label>
                                                                    <Input
                                                                        value={account.handle}
                                                                        onChange={(e) =>
                                                                            updateSocialAccount(account.id, "handle", e.target.value)
                                                                        }
                                                                        placeholder="@usuario o usuario"
                                                                        className="rounded-2xl h-10"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <Label className="text-xs text-muted-foreground mb-1 block">
                                                                        URL del perfil (opcional)
                                                                    </Label>
                                                                    <Input
                                                                        type="url"
                                                                        value={account.profileUrl}
                                                                        onChange={(e) =>
                                                                            updateSocialAccount(account.id, "profileUrl", e.target.value)
                                                                        }
                                                                        placeholder="https://..."
                                                                        className="rounded-2xl h-10"
                                                                    />
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`active-${account.id}`}
                                                                        checked={account.isActive}
                                                                        onChange={(e) =>
                                                                            updateSocialAccount(account.id, "isActive", e.target.checked)
                                                                        }
                                                                        className="w-4 h-4 rounded border-primary text-primary focus:ring-primary"
                                                                    />
                                                                    <Label
                                                                        htmlFor={`active-${account.id}`}
                                                                        className="text-xs text-muted-foreground cursor-pointer"
                                                                    >
                                                                        Cuenta activa
                                                                    </Label>
                                                                </div>
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Botones de acción */}
                                <div className="flex justify-end gap-4 mt-6">
                                    <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-2xl px-6">
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-gradient-to-r from-primary/80 to-primary text-white rounded-2xl px-8"
                                    >
                                        {loading ? "Guardando..." : "Crear Influencer"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

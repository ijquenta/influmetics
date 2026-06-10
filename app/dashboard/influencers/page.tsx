"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IconSearch, IconPlus, IconEdit, IconTrash, IconUpload, IconFile, IconX } from "@tabler/icons-react";
import Image from "next/image";
import { toast } from "sonner";
import type { InfluencerWithRelations } from "@/shared/types/influencer.types";

export default function InfluencersPage() {
    const router = useRouter();
    const [influencers, setInfluencers] = useState<InfluencerWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [importPlatform, setImportPlatform] = useState<"tiktok" | "instagram">("tiktok");
    const [importValue, setImportValue] = useState("");
    const [importLoading, setImportLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchInfluencers();
    }, [search]);

    const fetchInfluencers = async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);

            const res = await fetch(`/api/influencers?${params.toString()}`);
            const data = await res.json();
            setInfluencers(data.data || []);
        } catch (error) {
            console.error("Error fetching influencers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar este influencer?")) return;

        try {
            await fetch(`/api/influencers/${id}`, { method: "DELETE" });
            toast.success("Influencer eliminado exitosamente");
            fetchInfluencers();
        } catch (error) {
            console.error("Error deleting influencer:", error);
            toast.error("Error al eliminar influencer");
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validExtensions = [".csv", ".xlsx", ".xls"];
            const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

            if (!validExtensions.includes(fileExtension)) {
                toast.error("Por favor, selecciona un archivo CSV o XLSX");
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                // 10MB limit
                toast.error("El archivo es demasiado grande. Máximo 10MB");
                return;
            }

            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error("Por favor, selecciona un archivo");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            const res = await fetch("/api/influencers/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || `Se importaron ${data.count || 0} influencers exitosamente`);
                setUploadDialogOpen(false);
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                fetchInfluencers();
            } else {
                throw new Error(data.error || "Error al cargar el archivo");
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error(error instanceof Error ? error.message : "Error al cargar el archivo");
        } finally {
            setUploading(false);
        }
    };

    const removeSelectedFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleImportFromSocial = async () => {
        const trimmed = importValue.trim();
        if (!trimmed) {
            toast.error("Ingresa un nombre de usuario");
            return;
        }

        setImportLoading(true);
        try {
            const res = await fetch("/api/scraping/tiktok", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: trimmed,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(data.message || "Influencer importado correctamente");
                setImportDialogOpen(false);
                setImportValue("");
                await fetchInfluencers();
            } else {
                toast.error(data.error || "No se pudo importar desde la red social.");
            }
        } catch (error) {
            console.error("Error importing influencer from social:", error);
            toast.error("No se pudo importar desde la red social. Revisa la URL o inténtalo de nuevo más tarde.");
        } finally {
            setImportLoading(false);
        }
    };

    // Función helper para obtener el nombre de la plataforma
    const getPlatformName = (code: string) => {
        const platformNames: Record<string, string> = {
            tiktok: "TikTok",
            instagram: "Instagram",
            youtube: "YouTube",
            x: "X (Twitter)",
        };
        return platformNames[code.toLowerCase()] || code;
    };

    // Dummy de redes sociales cuando el influencer no tiene cuentas cargadas (modo demo)
    const getDummySocialAccounts = (influencer: InfluencerWithRelations) => {
        const baseHandle =
            influencer.referralCode?.toLowerCase() || influencer.name.split(" ")[0]?.toLowerCase() || `influencer${influencer.id}`;

        return [
            {
                id: `${influencer.id}-tiktok`,
                platformCode: "tiktok",
                handle: `${baseHandle}_tt`,
                isActive: true,
            },
            {
                id: `${influencer.id}-instagram`,
                platformCode: "instagram",
                handle: `${baseHandle}_ig`,
                isActive: true,
            },
        ];
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
                            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                                <div>
                                    <h1 className="text-[28px] font-bold text-[#1A1A2E] mb-2">Influencers</h1>
                                    <p className="text-[16px] text-[#6B6B8D]">Gestiona y visualiza la información de los influencers</p>
                                </div>
                                <div className="flex gap-3 flex-wrap justify-end">
                                    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="border-[#6C48C5] text-[#6C48C5] hover:bg-[#E8DEFF] rounded-2xl px-6"
                                            >
                                                <IconUpload className="w-4 h-4 mr-2" />
                                                Cargar CSV/XLSX
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="rounded-[20px] max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="text-[20px] font-bold text-[#1A1A2E]">
                                                    Cargar Influencers desde Archivo
                                                </DialogTitle>
                                                <DialogDescription className="text-[14px] text-[#6B6B8D]">
                                                    Selecciona un archivo CSV o XLSX con los datos de los influencers. El archivo debe
                                                    incluir columnas como: nombre, email, nicho, código de referido, y cuentas de redes
                                                    sociales.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div>
                                                    <Label
                                                        htmlFor="file-upload"
                                                        className="text-[14px] font-semibold text-[#1A1A2E] mb-2 block"
                                                    >
                                                        Seleccionar archivo
                                                    </Label>
                                                    <Input
                                                        id="file-upload"
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept=".csv,.xlsx,.xls"
                                                        onChange={handleFileSelect}
                                                        className="rounded-2xl cursor-pointer"
                                                    />
                                                    <p className="text-xs text-[#6B6B8D] mt-2">
                                                        Formatos soportados: CSV, XLSX, XLS (máximo 10MB)
                                                    </p>
                                                </div>
                                                {selectedFile && (
                                                    <div className="flex items-center gap-3 p-3 bg-[#E8DEFF] rounded-xl">
                                                        <IconFile className="w-5 h-5 text-[#6C48C5]" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-[#1A1A2E] truncate">
                                                                {selectedFile.name}
                                                            </p>
                                                            <p className="text-xs text-[#6B6B8D]">
                                                                {(selectedFile.size / 1024).toFixed(2)} KB
                                                            </p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={removeSelectedFile}
                                                            className="text-[#6B6B8D] hover:text-[#1A1A2E]"
                                                        >
                                                            <IconX className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setUploadDialogOpen(false);
                                                        setSelectedFile(null);
                                                        if (fileInputRef.current) {
                                                            fileInputRef.current.value = "";
                                                        }
                                                    }}
                                                    className="rounded-2xl"
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    onClick={handleUpload}
                                                    disabled={!selectedFile || uploading}
                                                    className="bg-gradient-to-r from-[#8B6FD9] to-[#6C48C5] text-white rounded-2xl px-6"
                                                >
                                                    {uploading ? "Cargando..." : "Cargar Archivo"}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                                        <DialogTrigger asChild>
                                            {/*<Button
                        variant="outline"
                        className="border-[#6C48C5] text-[#6C48C5] hover:bg-[#E8DEFF] rounded-2xl px-6"
                      >
                        <IconUpload className="w-4 h-4 mr-2" />
                        Importar desde TikTok / IG
                      </Button>*/}
                                        </DialogTrigger>
                                        <DialogContent className="rounded-[20px] max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="text-[20px] font-bold text-[#1A1A2E]">
                                                    Importar desde redes sociales
                                                </DialogTitle>
                                                <DialogDescription className="text-[14px] text-[#6B6B8D]">
                                                    Pega el usuario o enlace del perfil de TikTok o Instagram. Usaremos esta información
                                                    para prellenar los datos del influencer.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div className="md:col-span-1">
                                                        <Label className="text-[14px] font-semibold text-[#1A1A2E] mb-2 block">
                                                            Plataforma
                                                        </Label>
                                                        <Select
                                                            value={importPlatform}
                                                            onValueChange={(value) => setImportPlatform(value as "tiktok" | "instagram")}
                                                        >
                                                            <SelectTrigger className="rounded-2xl">
                                                                <SelectValue placeholder="Selecciona" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="tiktok">TikTok</SelectItem>
                                                                <SelectItem value="instagram">Instagram</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <Label className="text-[14px] font-semibold text-[#1A1A2E] mb-2 block">
                                                            Usuario o enlace de perfil
                                                        </Label>
                                                        <Input
                                                            placeholder="@usuario o https://..."
                                                            value={importValue}
                                                            onChange={(e) => setImportValue(e.target.value)}
                                                            className="rounded-2xl"
                                                        />
                                                        <p className="text-xs text-[#6B6B8D] mt-2">
                                                            Ejemplos: <span className="font-mono">@maria.beauty</span> o{" "}
                                                            <span className="font-mono">https://www.tiktok.com/@maria.beauty</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-[#6B6B8D]">
                                                    Nota: esta funcionalidad está pensada para conectarse a la API oficial de cada
                                                    plataforma o a un servicio intermedio. En este demo, el backend todavía es un
                                                    placeholder.
                                                </p>
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setImportDialogOpen(false);
                                                        setImportValue("");
                                                    }}
                                                    className="rounded-2xl"
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    onClick={handleImportFromSocial}
                                                    disabled={importLoading}
                                                    className="bg-gradient-to-r from-[#8B6FD9] to-[#6C48C5] text-white rounded-2xl px-6"
                                                >
                                                    {importLoading ? "Importando..." : "Importar"}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push("/dashboard/influencers/simulation")}
                                        className="border-[#6C48C5] text-[#6C48C5] hover:bg-[#E8DEFF] rounded-2xl px-6"
                                    >
                                        Recuperar desde Red Social
                                    </Button>
                                    <Button
                                        onClick={() => router.push("/dashboard/influencers/new")}
                                        className="bg-primary text-white rounded-2xl px-6"
                                    >
                                        <IconPlus className="w-4 h-4 mr-2" />
                                        Nuevo Influencer
                                    </Button>
                                </div>
                            </div>

                            <Card className="rounded-[20px] border-[rgba(108,72,197,0.1)] shadow-[0_4px_20px_rgba(108,72,197,0.08)]">
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="relative flex-1 max-w-md">
                                            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#6B6B8D]" />
                                            <Input
                                                placeholder="Buscar por nombre, email o código de referido..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="pl-10 rounded-2xl"
                                            />
                                        </div>
                                    </div>

                                    {loading ? (
                                        <div className="text-center py-8 text-[#6B6B8D]">Cargando...</div>
                                    ) : influencers.length === 0 ? (
                                        <div className="text-center py-8 text-[#6B6B8D]">No se encontraron influencers</div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-[rgba(108,72,197,0.1)]">
                                                    <TableHead className="text-[#1A1A2E] font-semibold">Nombre</TableHead>
                                                    <TableHead className="text-[#1A1A2E] font-semibold">Nicho</TableHead>
                                                    <TableHead className="text-[#1A1A2E] font-semibold">Código Referido</TableHead>
                                                    <TableHead className="text-[#1A1A2E] font-semibold">Redes Sociales</TableHead>
                                                    <TableHead className="text-[#1A1A2E] font-semibold">Campañas</TableHead>
                                                    <TableHead className="text-[#1A1A2E] font-semibold">Posts</TableHead>
                                                    <TableHead className="text-[#1A1A2E] font-semibold text-right">Acciones</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {influencers.map((influencer) => {
                                                    const campaignsCount = influencer._count?.influencerCampaigns;
                                                    const postsCount = influencer._count?.posts;

                                                    // Para influencers sin datos de conteo, mostrar valores de ejemplo
                                                    const displayCampaigns = campaignsCount ?? (influencer.id % 3) + 1;
                                                    const displayPosts = postsCount ?? (influencer.id % 7) + 5;

                                                    return (
                                                        <TableRow
                                                            key={influencer.id}
                                                            className="border-[rgba(108,72,197,0.1)] hover:bg-[#F8F7FC]"
                                                        >
                                                            <TableCell className="font-medium text-[#1A1A2E]">{influencer.name}</TableCell>
                                                            <TableCell className="text-[#6B6B8D]">{influencer.niche || "-"}</TableCell>
                                                            <TableCell className="text-[#6B6B8D]">
                                                                {influencer.referralCode || "-"}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-col gap-2">
                                                                    {(influencer.socialAccounts && influencer.socialAccounts.length > 0
                                                                        ? influencer.socialAccounts.map((account) => ({
                                                                            id: account.id,
                                                                            platformCode: account.socialPlatform.code,
                                                                            handle: account.handle,
                                                                            isActive: account.isActive,
                                                                        }))
                                                                        : getDummySocialAccounts(influencer)
                                                                    ).map((account) => (
                                                                        <div key={account.id} className="flex items-center gap-2">
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="border-[#6C48C5] text-[#6C48C5] flex items-center justify-center p-1 rounded-full"
                                                                            >
                                                                                <Image
                                                                                    src={
                                                                                        account.platformCode.toLowerCase() === "tiktok"
                                                                                            ? "/logo-tiktok.png"
                                                                                            : account.platformCode.toLowerCase() ===
                                                                                                "instagram"
                                                                                                ? "/logo-instragram.png"
                                                                                                : account.platformCode.toLowerCase() ===
                                                                                                    "youtube"
                                                                                                    ? "/file.svg"
                                                                                                    : account.platformCode.toLowerCase() === "x"
                                                                                                        ? "/file.svg"
                                                                                                        : "/file.svg"
                                                                                    }
                                                                                    alt={getPlatformName(account.platformCode)}
                                                                                    width={64}
                                                                                    height={64}
                                                                                    className="rounded-full"
                                                                                />
                                                                            </Badge>
                                                                            {account.handle && (
                                                                                <span className="text-xs text-[#6B6B8D] truncate max-w-[120px]">
                                                                                    @{account.handle.replace(/^@/, "")}
                                                                                </span>
                                                                            )}
                                                                            <Badge
                                                                                variant="secondary"
                                                                                className={
                                                                                    account.isActive
                                                                                        ? "text-xs bg-[#E8F5E9] text-[#4CAF50] px-1.5 py-0"
                                                                                        : "text-xs bg-[#FFEBEE] text-[#EF4444] px-1.5 py-0"
                                                                                }
                                                                            >
                                                                                {account.isActive ? "Activo" : "Inactivo"}
                                                                            </Badge>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-[#6B6B8D]">{displayCampaigns}</TableCell>
                                                            <TableCell className="text-[#6B6B8D]">{displayPosts}</TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            router.push(`/dashboard/influencers/${influencer.id}`);
                                                                        }}
                                                                        className="rounded-2xl"
                                                                    >
                                                                        Ver información
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            router.push(`/dashboard/influencers/${influencer.id}/edit`);
                                                                        }}
                                                                        className="text-[#6C48C5] hover:text-[#5A3AA8]"
                                                                    >
                                                                        <IconEdit className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDelete(influencer.id);
                                                                        }}
                                                                        className="text-[#EF4444] hover:text-[#DC2626]"
                                                                    >
                                                                        <IconTrash className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
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

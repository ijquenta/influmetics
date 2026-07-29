"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
    IconSearch,
    IconPlus,
    IconTrash,
    IconUpload,
    IconFile,
    IconX,
    IconChevronLeft,
    IconChevronRight,
    IconEye,
    IconUsers,
    IconDotsVertical,
    IconEdit,
    IconLink,
    IconBrandTiktok,
    IconBrandInstagram,
    IconBrandYoutube,
    IconBrandX,
} from "@tabler/icons-react";
import { toast } from "sonner";
import type { InfluencerWithRelations, SocialAccountWithPlatform } from "@/shared/types/influencer.types";

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    tiktok: IconBrandTiktok,
    instagram: IconBrandInstagram,
    youtube: IconBrandYoutube,
    x: IconBrandX,
};

const formatNumber = (value: number | string): string => {
    const num = typeof value === "string" ? Number(value) : value;
    if (Number.isNaN(num)) return "-";
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toLocaleString("es-ES");
};

export default function InfluencersPage() {
    const router = useRouter();
    const [influencers, setInfluencers] = useState<InfluencerWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const limit = 10;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const fetchInfluencers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append("search", search);
            params.append("page", page.toString());
            params.append("limit", limit.toString());

            const res = await fetch(`/api/influencers?${params.toString()}`);
            if (!res.ok) throw new Error("Error al cargar influencers");
            const data = await res.json();
            setInfluencers(data.data || []);
            setTotal(data.total || 0);
        } catch (error) {
            console.error("Error fetching influencers:", error);
            toast.error("Error al cargar influencers");
        } finally {
            setLoading(false);
        }
    }, [search, page]);

    useEffect(() => {
        fetchInfluencers();
    }, [fetchInfluencers]);

    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            setPage(1);
        }, 400);
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [search]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`/api/influencers/${deleteId}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Error al eliminar influencer");
            }
            toast.success("Influencer eliminado");
            setDeleteId(null);
            fetchInfluencers();
        } catch {
            toast.error("Error al eliminar influencer");
        }
    };

    const validateFile = (file: File): boolean => {
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (![".csv", ".xlsx", ".xls"].includes(ext)) {
            toast.error("Selecciona un archivo CSV o XLSX");
            return false;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("El archivo es demasiado grande. Máximo 10MB");
            return false;
        }
        return true;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (validateFile(file)) setSelectedFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && validateFile(file)) setSelectedFile(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            const res = await fetch("/api/influencers/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || `Importados ${data.count || 0} influencers`);
                setUploadDialogOpen(false);
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                fetchInfluencers();
            } else {
                throw new Error(data.error || "Error al cargar archivo");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error al cargar archivo");
        } finally {
            setUploading(false);
        }
    };

    const getTikTokFollowers = (accounts: SocialAccountWithPlatform[]): number | null => {
        const tt = accounts.find((a) => a.socialPlatform?.code?.toLowerCase() === "tiktok");
        return tt?.fans ?? null;
    };

    const getTikTokAvatar = (accounts: SocialAccountWithPlatform[]): string | null => {
        const tt = accounts.find((a) => a.socialPlatform?.code?.toLowerCase() === "tiktok");
        return tt?.avatar ?? null;
    };

    return (

                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 bg-muted min-h-full">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">Influencers</h1>
                                    <p className="text-sm text-muted-foreground">Gestiona y visualiza la información de los influencers</p>
                                </div>
                                <div className="flex gap-3 flex-wrap justify-end">
                                    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10 rounded-2xl px-6">
                                                <IconUpload className="w-4 h-4 mr-2" />
                                                Cargar CSV/XLSX
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="rounded-[20px] max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="text-lg font-bold text-foreground">Cargar desde Archivo</DialogTitle>
                                                <DialogDescription className="text-sm text-muted-foreground">
                                                    Selecciona un archivo CSV o XLSX con los datos de los influencers.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={handleDrop}
                                                    className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer ${
                                                        dragOver
                                                            ? "border-primary bg-primary/5"
                                                            : selectedFile
                                                            ? "border-primary/30 bg-primary/3"
                                                            : "border-border hover:border-primary/40 hover:bg-muted/30"
                                                    }`}
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <Input
                                                        id="file-upload"
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept=".csv,.xlsx,.xls"
                                                        onChange={handleFileSelect}
                                                        className="hidden"
                                                    />
                                                    {selectedFile ? (
                                                        <div className="flex items-center gap-3 justify-center">
                                                            <IconFile className="w-8 h-8 text-primary shrink-0" />
                                                            <div className="text-left">
                                                                <p className="text-sm font-medium text-foreground truncate max-w-[200px]">{selectedFile.name}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                                                </p>
                                                            </div>
                                                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="shrink-0">
                                                                <IconX className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <IconUpload className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                                                            <p className="text-sm text-muted-foreground">
                                                                {dragOver ? "Suelta el archivo aquí" : "Arrastra un archivo o haz clic para seleccionar"}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">CSV, XLSX, XLS (máx. 10MB)</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setUploadDialogOpen(false);
                                                        setSelectedFile(null);
                                                    }}
                                                    className="rounded-2xl"
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="rounded-2xl">
                                                    {uploading ? "Cargando..." : "Cargar Archivo"}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>

                                    <Button
                                        variant="outline"
                                        onClick={() => router.push("/dashboard/influencers/analysis")}
                                        className="border-primary text-primary hover:bg-primary/10 rounded-2xl px-6"
                                    >
                                        Analizar TikTok
                                    </Button>
                                    <Button onClick={() => router.push("/dashboard/influencers/new")} className="rounded-2xl px-6">
                                        <IconPlus className="w-4 h-4 mr-2" />
                                        Nuevo
                                    </Button>
                                </div>
                            </div>

                            <Card className="rounded-[20px] border-primary/10 shadow-[var(--card-shadow-md)]">
                                <CardContent className="p-6">
                                    <div className="relative max-w-md mb-6">
                                        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar por nombre, email o código..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-9 rounded-2xl"
                                        />
                                    </div>

                                    {loading ? (
                                        <div className="space-y-2">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 border border-border/50">
                                                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                                                    <div className="flex-1 min-w-0 space-y-1.5">
                                                        <Skeleton className="h-4 w-[180px] rounded-lg" />
                                                        <Skeleton className="h-3 w-[120px] rounded-lg" />
                                                    </div>
                                                    <Skeleton className="h-3 w-[80px] rounded-lg hidden md:block" />
                                                    <Skeleton className="h-3 w-[60px] rounded-lg hidden sm:block" />
                                                    <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : influencers.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                                            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
                                                <IconUsers className="w-8 h-8 text-primary/40" />
                                            </div>
                                            <p className="text-sm font-medium text-foreground">
                                                {search ? "Sin resultados" : "No hay influencers aún"}
                                            </p>
                                            <p className="text-xs text-muted-foreground max-w-sm text-center">
                                                {search
                                                    ? `No encontramos nada para "${search}". Prueba con otro término.`
                                                    : "Comienza agregando tu primer influencer para gestionar tus campañas."}
                                            </p>
                                            {search ? (
                                                <Button variant="outline" size="sm" onClick={() => setSearch("")} className="rounded-2xl">
                                                    Limpiar búsqueda
                                                </Button>
                                            ) : (
                                                <div className="flex gap-2 mt-1">
                                                    <Button size="sm" onClick={() => router.push("/dashboard/influencers/new")} className="rounded-2xl gap-1.5">
                                                        <IconPlus className="w-3.5 h-3.5" />
                                                        Crear influencer
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/influencers/analysis")} className="rounded-2xl">
                                                        Importar de TikTok
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="text-foreground font-semibold w-12">Foto</TableHead>
                                                        <TableHead className="text-foreground font-semibold">Nombre</TableHead>
                                                        <TableHead className="text-foreground font-semibold hidden md:table-cell">Nicho</TableHead>
                                                        <TableHead className="text-foreground font-semibold text-center w-20">Campañas</TableHead>
                                                        <TableHead className="text-foreground font-semibold">Redes Sociales</TableHead>
                                                        <TableHead className="text-foreground font-semibold text-center w-24">Seguidores TT</TableHead>
                                                        <TableHead className="text-foreground font-semibold text-center w-20">Posts</TableHead>
                                                        <TableHead className="text-foreground font-semibold text-right w-28">Acciones</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {influencers.map((influencer) => {
                                                        const socialAccounts = influencer.socialAccounts || [];
                                                        const followers = getTikTokFollowers(socialAccounts);
                                                        const avatar = getTikTokAvatar(socialAccounts);
                                                        return (
                                                            <TableRow key={influencer.id} className="hover:bg-muted/50 cursor-pointer transition-colors duration-150" onClick={() => router.push(`/dashboard/influencers/${influencer.id}`)}>
                                                                <TableCell>
                                                                    <Avatar className="h-8 w-8">
                                                                        {avatar ? (
                                                                            <AvatarImage src={avatar} alt={influencer.name} />
                                                                        ) : null}
                                                                        <AvatarFallback className="text-xs">{influencer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                                    </Avatar>
                                                                </TableCell>
                                                                <TableCell className="font-medium text-foreground">
                                                                    <HoverCard>
                                                                        <HoverCardTrigger asChild>
                                                                            <span className="cursor-default">{influencer.name}</span>
                                                                        </HoverCardTrigger>
                                                                        <HoverCardContent className="w-64 rounded-2xl" side="right" align="start">
                                                                            <div className="flex items-start gap-3">
                                                                                <Avatar className="h-10 w-10">
                                                                                    {avatar ? <AvatarImage src={avatar} alt={influencer.name} /> : null}
                                                                                    <AvatarFallback className="text-xs">{influencer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                                                </Avatar>
                                                                                <div className="space-y-1">
                                                                                    <p className="text-sm font-semibold">{influencer.name}</p>
                                                                                    {influencer.niche && <p className="text-xs text-muted-foreground">{influencer.niche}</p>}
                                                                                    <div className="flex gap-2 text-xs text-muted-foreground">
                                                                                        <span>{formatNumber(followers ?? 0)} seguidores</span>
                                                                                        <span>·</span>
                                                                                        <span>{influencer._count?.posts ?? 0} posts</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </HoverCardContent>
                                                                    </HoverCard>
                                                                </TableCell>
                                                                 <TableCell className="text-muted-foreground hidden md:table-cell">
                                                                     {influencer.niche || <span className="text-muted-foreground/50">—</span>}
                                                                 </TableCell>
                                                                 <TableCell className="text-center text-muted-foreground">
                                                                     {influencer._count?.influencerCampaigns ?? 0}
                                                                 </TableCell>
                                                                <TableCell>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {socialAccounts.length === 0 ? (
                                                                            <span className="text-xs text-muted-foreground">—</span>
                                                                        ) : (
                                                                            socialAccounts.map((account) => (
                                                                                <Badge
                                                                                    key={account.id}
                                                                                    variant="outline"
                                                                                    className="gap-1.5 py-1 px-2 border-primary/20"
                                                                                >
                                                                                    {(() => {
                                                                                        const Icon = PLATFORM_ICONS[account.socialPlatform.code.toLowerCase()];
                                                                                        return Icon ? <Icon className="size-4" /> : null;
                                                                                    })()}
                                                                                    <span className="text-xs">
                                                                                        @{account.handle.replace(/^@/, "")}
                                                                                    </span>
                                                                                </Badge>
                                                                            ))
                                                                        )}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-center text-muted-foreground">
                                                                    {followers != null ? formatNumber(followers) : "—"}
                                                                </TableCell>
                                                                <TableCell className="text-center text-muted-foreground">
                                                                    {influencer._count?.posts ?? "—"}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                                    <IconDotsVertical className="w-4 h-4" />
                                                                                </Button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="end" className="rounded-2xl min-w-[180px]">
                                                                                <DropdownMenuItem onClick={() => router.push(`/dashboard/influencers/${influencer.id}`)} className="cursor-pointer rounded-xl gap-2">
                                                                                    <IconEye className="w-4 h-4 text-primary" />
                                                                                    Ver detalle
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuItem onClick={() => router.push(`/dashboard/influencers/${influencer.id}`)} className="cursor-pointer rounded-xl gap-2">
                                                                                    <IconEdit className="w-4 h-4 text-amber-600" />
                                                                                    Editar
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuSeparator />
                                                                                <AlertDialog>
                                                                                    <AlertDialogTrigger asChild>
                                                                                        <DropdownMenuItem className="cursor-pointer rounded-xl gap-2 text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                                                                            <IconTrash className="w-4 h-4" />
                                                                                            Eliminar
                                                                                        </DropdownMenuItem>
                                                                                    </AlertDialogTrigger>
                                                                                    <AlertDialogContent className="rounded-[20px]">
                                                                                        <AlertDialogHeader>
                                                                                            <AlertDialogTitle>Eliminar influencer</AlertDialogTitle>
                                                                                            <AlertDialogDescription>
                                                                                                ¿Estás seguro de eliminar a <strong>{influencer.name}</strong>? Esta acción no se puede deshacer.
                                                                                            </AlertDialogDescription>
                                                                                        </AlertDialogHeader>
                                                                                        <AlertDialogFooter>
                                                                                            <AlertDialogCancel className="rounded-2xl" onClick={() => setDeleteId(null)}>
                                                                                                Cancelar
                                                                                            </AlertDialogCancel>
                                                                                            <AlertDialogAction onClick={handleDelete} className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                                                                Eliminar
                                                                                            </AlertDialogAction>
                                                                                        </AlertDialogFooter>
                                                                                    </AlertDialogContent>
                                                                                </AlertDialog>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>

                                            {totalPages > 1 && (
                                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border flex-wrap gap-3">
                                                    <p className="text-sm text-muted-foreground">
                                                        {total} resultado{total !== 1 ? "s" : ""} · Página {page} de {totalPages}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1">
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                max={totalPages}
                                                                placeholder="Ir a"
                                                                className="w-16 h-8 text-xs rounded-2xl text-center"
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") {
                                                                        const val = parseInt((e.target as HTMLInputElement).value);
                                                                        if (val >= 1 && val <= totalPages) setPage(val);
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-2xl">
                                                                <IconChevronLeft className="w-4 h-4" />
                                                            </Button>
                                                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                                                let pageNum: number;
                                                                if (totalPages <= 7) {
                                                                    pageNum = i + 1;
                                                                } else if (page <= 4) {
                                                                    pageNum = i + 1;
                                                                } else if (page >= totalPages - 3) {
                                                                    pageNum = totalPages - 6 + i;
                                                                } else {
                                                                    pageNum = page - 3 + i;
                                                                }
                                                                return (
                                                                    <Button
                                                                        key={pageNum}
                                                                        variant={page === pageNum ? "default" : "outline"}
                                                                        size="sm"
                                                                        onClick={() => setPage(pageNum)}
                                                                        className="rounded-2xl min-w-[32px]"
                                                                    >
                                                                        {pageNum}
                                                                    </Button>
                                                                );
                                                            })}
                                                            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded-2xl">
                                                                <IconChevronRight className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
    );
}

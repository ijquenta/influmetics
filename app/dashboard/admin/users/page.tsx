"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { IconUsers, IconPlus } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/profile";

const ROLE_BADGES: Record<string, string> = {
  admin: "bg-blue-500",
  growth_manager: "bg-emerald-500",
  viewer: "bg-gray-500",
};

export default function UsersPage() {
    const { profile, isLoading } = useAuth();
    const [users, setUsers] = useState<Profile[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [creating, setCreating] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        if (profile?.role !== "admin") return;
        const supabase = createClient();
        supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false })
            .then(({ data, error }) => {
                if (error) toast.error("Error al cargar usuarios");
                else setUsers(data || []);
                setLoadingUsers(false);
            });
    }, [profile?.role]);

    if (isLoading) {
        return (

                    <div className="flex flex-1 items-center justify-center p-6">
                        <Spinner />
                    </div>
        );
    }

    if (profile?.role !== "admin") {
        return (

                    <div className="flex flex-1 items-center justify-center p-6">
                        <p className="text-muted-foreground">No tienes permisos para acceder a esta página.</p>
                    </div>
        );
    }

    const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setCreating(true);

        const formData = new FormData(e.currentTarget);
        const body = {
            email: formData.get("email"),
            password: formData.get("password"),
            name: formData.get("name"),
            role: formData.get("role") || "growth_manager",
            company: formData.get("company") || "",
        };

        try {
            const res = await fetch("/api/auth/create-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Error al crear usuario");
                return;
            }

            toast.success(`Usuario ${body.name} creado`);
            setDialogOpen(false);
            (e.target as HTMLFormElement).reset();
            const supabase = createClient();
            const { data: newProfile } = await supabase
                .from("profiles")
                .select("*")
                .eq("email", body.email)
                .single();
            if (newProfile) setUsers((prev) => [newProfile, ...prev]);
        } catch {
            toast.error("Error de conexión");
        } finally {
            setCreating(false);
        }
    };

    return (
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6 bg-muted min-h-full">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
                                    <p className="text-sm text-muted-foreground">Gestiona los usuarios de la plataforma</p>
                                </div>
                                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="rounded-2xl px-6">
                                            <IconPlus className="w-4 h-4 mr-2" />
                                            Nuevo usuario
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-[20px] max-w-md">
                                        <DialogHeader>
                                            <DialogTitle className="text-lg font-bold">Crear usuario</DialogTitle>
                                            <DialogDescription>Crea un nuevo usuario con el rol que elijas</DialogDescription>
                                        </DialogHeader>
                                        <form className="space-y-4 py-4" onSubmit={handleCreateUser}>
                                            <div>
                                                <Label htmlFor="name" className="text-sm font-semibold mb-2 block">Nombre completo</Label>
                                                <Input id="name" name="name" placeholder="Juan Pérez" required className="rounded-2xl h-10" />
                                            </div>
                                            <div>
                                                <Label htmlFor="email" className="text-sm font-semibold mb-2 block">Correo electrónico</Label>
                                                <Input id="email" name="email" type="email" placeholder="usuario@ejemplo.com" required className="rounded-2xl h-10" />
                                            </div>
                                            <div>
                                                <Label htmlFor="password" className="text-sm font-semibold mb-2 block">Contraseña</Label>
                                                <Input id="password" name="password" type="password" required className="rounded-2xl h-10" />
                                            </div>
                                            <div>
                                                <Label htmlFor="role" className="text-sm font-semibold mb-2 block">Rol</Label>
                                                <Select name="role" defaultValue="growth_manager">
                                                    <SelectTrigger className="rounded-2xl h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                        <SelectItem value="growth_manager">Growth Manager</SelectItem>
                                                        <SelectItem value="viewer">Viewer</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="company" className="text-sm font-semibold mb-2 block">Empresa</Label>
                                                <Input id="company" name="company" placeholder="Influmetics" className="rounded-2xl h-10" />
                                            </div>
                                            <div className="flex justify-end gap-4 pt-2">
                                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-2xl px-6">
                                                    Cancelar
                                                </Button>
                                                <Button type="submit" disabled={creating} className="rounded-2xl px-6">
                                                    {creating ? "Creando..." : "Crear usuario"}
                                                </Button>
                                            </div>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <IconUsers className="size-5" />
                                            Usuarios registrados
                                        </CardTitle>
                                        <CardDescription>{users.length} usuario{users.length !== 1 ? "s" : ""} en total</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {loadingUsers ? (
                                        <div className="flex justify-center py-12">
                                            <Spinner />
                                        </div>
                                    ) : users.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                                            <IconUsers className="size-8" />
                                            <p className="text-sm">No hay usuarios registrados</p>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-foreground font-semibold">Nombre</TableHead>
                                                    <TableHead className="text-foreground font-semibold hidden md:table-cell">Email</TableHead>
                                                    <TableHead className="text-foreground font-semibold">Rol</TableHead>
                                                    <TableHead className="text-foreground font-semibold hidden lg:table-cell">Empresa</TableHead>
                                                    <TableHead className="text-foreground font-semibold hidden lg:table-cell">Registro</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {users.map((u) => (
                                                    <TableRow key={u.id}>
                                                        <TableCell className="font-medium">{u.name}</TableCell>
                                                        <TableCell className="hidden md:table-cell text-muted-foreground">{u.email}</TableCell>
                                                        <TableCell>
                                                            <Badge className={ROLE_BADGES[u.role] || "bg-gray-500"}>
                                                                {u.role.replace("_", " ")}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="hidden lg:table-cell text-muted-foreground">{u.company || "—"}</TableCell>
                                                        <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                                                            {new Date(u.created_at).toLocaleDateString()}
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
    );
}

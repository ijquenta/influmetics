"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export const DashboardHeader = () => {
    const { user, profile, logout } = useAuth();

    const displayName = profile?.name || (user?.user_metadata?.full_name as string) || user?.email || "";
    const role = profile?.role || "growth_manager";

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <header className="border-b bg-background sticky top-0 z-10">
            <div className="flex items-center justify-between px-6 py-4">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                </div>
                <div className="flex items-center gap-4">
                    {user && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="hidden md:block text-left">
                                        <p className="text-sm font-medium leading-none">{displayName}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">{role.replace("_", " ")}</p>
                                    </div>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>Perfil</DropdownMenuItem>
                                <DropdownMenuItem onClick={logout}>Cerrar sesión</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </header>
    );
};

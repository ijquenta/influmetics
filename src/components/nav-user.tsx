"use client";

import { IconLogout, IconSun, IconMoon, IconSettings, IconShield, IconUser, IconEye } from "@tabler/icons-react";
import { ChevronsUpDown } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    admin: { label: "Admin", color: "bg-blue-500 hover:bg-blue-600", icon: <IconShield className="size-3" /> },
    growth_manager: { label: "Growth Manager", color: "bg-emerald-500 hover:bg-emerald-600", icon: <IconUser className="size-3" /> },
    viewer: { label: "Viewer", color: "bg-gray-500 hover:bg-gray-600", icon: <IconEye className="size-3" /> },
};

export function NavUser() {
    const { isMobile } = useSidebar();
    const router = useRouter();
    const { resolvedTheme, setTheme } = useTheme();
    const { user, profile, logout } = useAuth();

    const displayName = profile?.name || (user?.user_metadata?.full_name as string) || user?.email || "";
    const email = user?.email || "";
    const role = profile?.role || "growth_manager";
    const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.growth_manager;

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleLogout = async () => {
        await logout();
        router.push("/");
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarFallback className="rounded-lg">{getInitials(displayName) || "?"}</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{displayName}</span>
                                <span className="truncate text-xs">{email}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarFallback className="rounded-lg">{getInitials(displayName) || "?"}</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{displayName}</span>
                                    <span className="truncate text-xs">{email}</span>
                                    <Badge className={`mt-1 w-fit ${roleConfig.color}`}>
                                        <span className="flex items-center gap-1">
                                            {roleConfig.icon}
                                            {roleConfig.label}
                                        </span>
                                    </Badge>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
                                {resolvedTheme === "dark" ? (
                                    <>
                                        <IconSun className="size-4" />
                                        <span>Modo claro</span>
                                    </>
                                ) : (
                                    <>
                                        <IconMoon className="size-4" />
                                        <span>Modo oscuro</span>
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <IconSettings className="size-4" />
                                <span>Configuración</span>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <IconLogout className="size-4" />
                            <span>Cerrar sesión</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

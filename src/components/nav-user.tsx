"use client";

import { IconLogout, IconSun, IconMoon, IconDeviceLaptop, IconChevronDown, IconShield, IconUser, IconEye } from "@tabler/icons-react";
import { ChevronsUpDown } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
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

const ROLE_CONFIG: Record<string, { label: string; dot: string; bg: string; icon: React.ReactNode }> = {
    admin: { label: "Admin", dot: "bg-blue-500", bg: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300", icon: <IconShield className="size-3" /> },
    growth_manager: { label: "Growth Manager", dot: "bg-emerald-500", bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", icon: <IconUser className="size-3" /> },
    viewer: { label: "Viewer", dot: "bg-gray-400", bg: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400", icon: <IconEye className="size-3" /> },
};

const THEME_OPTIONS = [
    { value: "light", label: "Claro", icon: IconSun },
    { value: "dark", label: "Oscuro", icon: IconMoon },
    { value: "system", label: "Auto", icon: IconDeviceLaptop },
] as const;

export function NavUser() {
    const { isMobile } = useSidebar();
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const { user, profile, isLoading, logout } = useAuth();

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

    if (isLoading && !user) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg" disabled>
                        <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
                        <div className="grid flex-1 gap-1">
                            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                            <div className="h-2 w-16 bg-muted animate-pulse rounded" />
                        </div>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        );
    }

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
                                <span className="flex items-center gap-1.5">
                                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${roleConfig.dot}`} />
                                    <span className="truncate text-xs text-muted-foreground">{roleConfig.label}</span>
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-3 px-3 py-3">
                                <Avatar className="h-10 w-10 rounded-xl">
                                    <AvatarFallback className="rounded-xl text-sm">{getInitials(displayName) || "?"}</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold text-foreground">{displayName}</span>
                                    <span className="truncate text-xs text-muted-foreground">{email}</span>
                                    <span className={`mt-1 inline-flex items-center gap-1 w-fit text-[11px] font-medium px-2 py-0.5 rounded-full ${roleConfig.bg}`}>
                                        {roleConfig.icon}
                                        {roleConfig.label}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-2">
                            <p className="px-1 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Tema</p>
                            <div className="flex gap-1">
                                {THEME_OPTIONS.map((opt) => {
                                    const OptIcon = opt.icon;
                                    const isActive = theme === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => setTheme(opt.value)}
                                            className={`flex items-center justify-center gap-1.5 flex-1 h-8 rounded-lg text-xs font-medium transition-all ${
                                                isActive
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-muted-foreground hover:bg-muted"
                                            }`}
                                        >
                                            <OptIcon className="size-3.5" />
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="gap-2 rounded-lg text-muted-foreground">
                            <IconLogout className="size-4" />
                            <span>Cerrar sesión</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}

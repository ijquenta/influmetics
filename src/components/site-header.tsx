"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
    const pathname = usePathname();

    const getPageTitle = () => {
        if (pathname === "/dashboard") return "Dashboard";
        if (pathname === "/dashboard/influencers") return "Influencers";
        if (pathname.startsWith("/dashboard/influencers/")) return "Detalle Influencer";
        if (pathname === "/dashboard/campaigns") return "Campañas";
        if (pathname.startsWith("/dashboard/campaigns/")) return pathname.includes("/new") ? "Nueva Campaña" : "Detalle Campaña";
        if (pathname === "/dashboard/reports") return "Reportes";
        if (pathname === "/dashboard/metrics") return "Cargar Métricas";
        return "Influmetics";
    };

    return (
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b border-border bg-card transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
            <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
                <SidebarTrigger className="-ml-1 text-primary hover:text-primary/90" />
                <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
                <h1 className="text-lg font-bold text-foreground">{getPageTitle()}</h1>
                <ThemeToggle className="ml-auto" />
            </div>
        </header>
    );
}



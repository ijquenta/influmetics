"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
    IconChartInfographic,
    IconDashboard,
    IconBrandCampaignmonitor,
    IconUsers,
    IconLifebuoy,
    IconSend,
    IconShield,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { profile } = useAuth();
    const role = profile?.role || "growth_manager";

    const navMain = [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: IconDashboard,
            items: [
                { title: "Resumen", url: "/dashboard" },
                { title: "Métricas", url: "/dashboard/metrics" },
            ],
        },
        {
            title: "Influencers",
            url: "/dashboard/influencers",
            icon: IconUsers,
            items: [
                { title: "Todos", url: "/dashboard/influencers" },
                ...(role !== "viewer"
                    ? [{ title: "Nuevo", url: "/dashboard/influencers/new" as const }]
                    : []),
                { title: "Análisis de perfil", url: "/dashboard/influencers/analysis" },
            ],
        },
        {
            title: "Campañas",
            url: "/dashboard/campaigns",
            icon: IconBrandCampaignmonitor,
            items: [
                { title: "Todas", url: "/dashboard/campaigns" },
                ...(role !== "viewer"
                    ? [{ title: "Nueva", url: "/dashboard/campaigns/new" as const }]
                    : []),
            ],
        },
        {
            title: "Retorno inversión",
            url: "/dashboard/roi",
            icon: IconChartInfographic,
        },
        ...(role === "admin"
            ? [
                  {
                      title: "Administración",
                      url: "/dashboard/admin",
                      icon: IconShield,
                      items: [{ title: "Usuarios", url: "/dashboard/admin/users" as const }],
                  },
              ]
            : []),
    ];

    const navSecondary = [
        { title: "Soporte", url: "#", icon: IconLifebuoy },
        { title: "Feedback", url: "#", icon: IconSend },
    ];

    return (
        <Sidebar variant="inset" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard">
                                <div className="flex items-center justify-center rounded-lg text-sidebar-primary-foreground">
                                    <Image
                                        src="/logo-sidebar.png"
                                        alt="Influmetics"
                                        width={128}
                                        height={64}
                                        className="size-10"
                                    />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">Influmetics</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navMain} />
                <NavSecondary items={navSecondary} className="mt-auto" />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

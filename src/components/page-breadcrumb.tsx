"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function PageBreadcrumb() {
    const pathname = usePathname();

    const getItems = () => {
        const items: { label: string; href?: string }[] = [{ label: "Dashboard", href: "/dashboard" }];

        if (pathname === "/dashboard") {
            return items;
        }

        if (pathname.startsWith("/dashboard/influencers")) {
            items.push({ label: "Influencers", href: "/dashboard/influencers" });

            if (pathname.endsWith("/new")) {
                items.push({ label: "Nuevo Influencer" });
            } else if (pathname !== "/dashboard/influencers") {
                items.push({ label: "Detalle Influencer" });
            }

            return items;
        }

        if (pathname.startsWith("/dashboard/campaigns")) {
            items.push({ label: "Campañas", href: "/dashboard/campaigns" });

            if (pathname.endsWith("/new")) {
                items.push({ label: "Nueva Campaña" });
            } else if (pathname !== "/dashboard/campaigns") {
                items.push({ label: "Detalle Campaña" });
            }

            return items;
        }

        if (pathname === "/dashboard/reports") {
            items.push({ label: "Reportes" });
            return items;
        }

        if (pathname === "/dashboard/metrics") {
            items.push({ label: "Cargar Métricas" });
            return items;
        }

        return items;
    };

    const items = getItems();

    if (items.length <= 1) return null;

    return (
        <Breadcrumb className="mb-2">
            <BreadcrumbList>
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    return (
                        <React.Fragment key={`${item.label}-${index}`}>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={item.href || "#"}>{item.label}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </React.Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}

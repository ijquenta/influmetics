"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const DashboardSidebar = () => {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-background border-r h-screen sticky top-0">
            <div className="p-4 border-b">
                <Link href="/" className="block">
                    <h2 className="text-xl font-bold">Influmetics</h2>
                </Link>
            </div>
            <nav className="p-4">
                <Link
                    href="/dashboard"
                    className={cn(
                        "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                        pathname === "/dashboard" ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"
                    )}
                >
                    <span>🏠</span>
                    <span>Dashboard</span>
                </Link>
            </nav>
        </aside>
    );
};

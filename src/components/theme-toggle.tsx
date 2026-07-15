"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const THEME_OPTIONS = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Oscuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Monitor },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const current = THEME_OPTIONS.find((o) => o.value === theme) || THEME_OPTIONS[0];
    const Icon = current.icon;

    if (!mounted) {
        return <div className="w-9 h-9" />
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted", className)}
                >
                    <Icon className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Cambiar tema</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl min-w-[140px]">
                {THEME_OPTIONS.map((opt) => {
                    const OptIcon = opt.icon;
                    const isActive = theme === opt.value;
                    return (
                        <DropdownMenuItem
                            key={opt.value}
                            onClick={() => setTheme(opt.value)}
                            className={cn(
                                "gap-2 rounded-lg",
                                isActive && "bg-primary/10 text-primary font-medium"
                            )}
                        >
                            <OptIcon className="h-4 w-4" />
                            <span>{opt.label}</span>
                            {isActive && <span className="ml-auto text-[10px] text-primary">✓</span>}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

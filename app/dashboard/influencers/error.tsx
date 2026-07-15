"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";

export default function InfluencersError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => { console.error(error); }, [error]);

    return (
        <div className="flex flex-1 items-center justify-center p-6 bg-muted min-h-screen">
            <div className="text-center space-y-4 max-w-md">
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                    <IconAlertCircle className="w-7 h-7 text-destructive" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Algo salió mal</h2>
                <p className="text-sm text-muted-foreground">
                    Ocurrió un error inesperado al cargar esta sección. Intenta de nuevo.
                </p>
                <Button onClick={reset} className="rounded-2xl gap-2">
                    <IconRefresh className="w-4 h-4" />
                    Reintentar
                </Button>
            </div>
        </div>
    );
}

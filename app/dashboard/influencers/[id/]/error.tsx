"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { IconAlertCircle, IconRefresh, IconArrowLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export default function InfluencerDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const router = useRouter();
    useEffect(() => { console.error(error); }, [error]);

    return (
        <div className="flex flex-1 items-center justify-center p-6 bg-muted min-h-screen">
            <div className="text-center space-y-4 max-w-md">
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                    <IconAlertCircle className="w-7 h-7 text-destructive" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Error al cargar el influencer</h2>
                <p className="text-sm text-muted-foreground">
                    No se pudo cargar la información de este influencer. Puede que haya sido eliminado o que ocurrió un error temporal.
                </p>
                <div className="flex gap-2 justify-center">
                    <Button variant="outline" onClick={() => router.back()} className="rounded-2xl gap-2">
                        <IconArrowLeft className="w-4 h-4" />
                        Volver
                    </Button>
                    <Button onClick={reset} className="rounded-2xl gap-2">
                        <IconRefresh className="w-4 h-4" />
                        Reintentar
                    </Button>
                </div>
            </div>
        </div>
    );
}

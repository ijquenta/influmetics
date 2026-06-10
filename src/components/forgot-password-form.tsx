"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { IconArrowLeft, IconMail } from "@tabler/icons-react";
import { toast } from "sonner";

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<"form">) {
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;

        if (!email) {
            toast.error("Ingresa tu correo electrónico");
            return;
        }

        setLoading(true);
        // Simula envío de correo
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setLoading(false);
        setSent(true);
        toast.success("Si el correo existe, recibirás instrucciones");
    };

    if (sent) {
        return (
            <div className={cn("flex flex-col gap-6", className)}>
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                        <IconMail className="w-6 h-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold">Revisa tu correo</h1>
                    <p className="text-sm text-balance text-muted-foreground max-w-sm">
                        Te hemos enviado un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.
                    </p>
                </div>
                <Button variant="outline" className="w-full" asChild>
                    <Link href="/">Volver al inicio de sesión</Link>
                </Button>
            </div>
        );
    }

    return (
        <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
            <FieldGroup>
                <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">¿Olvidaste tu contraseña?</h1>
                    <p className="text-sm text-balance text-muted-foreground">
                        Ingresa tu correo y te enviaremos instrucciones para restablecerla
                    </p>
                </div>
                <Field>
                    <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                    <Input id="email" name="email" type="email" placeholder="admin@influmetics.com" required />
                </Field>
                <Field>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Enviando..." : "Enviar instrucciones"}
                    </Button>
                </Field>
                <Field>
                    <FieldDescription className="text-center">
                        <Link href="/" className="inline-flex items-center gap-1 text-sm underline underline-offset-4">
                            <IconArrowLeft className="w-3 h-3" />
                            Volver al inicio de sesión
                        </Link>
                    </FieldDescription>
                </Field>
            </FieldGroup>
        </form>
    );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ERROR_MESSAGES: Record<string, string> = {
  "User already registered": "Este correo ya está registrado",
  "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres",
};

function getErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  return ERROR_MESSAGES[message] || message || "Error inesperado. Intenta de nuevo.";
}

export function SignupForm({ className, ...props }: React.ComponentProps<"form">) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const username = searchParams.get("username");
    const { signup } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirm-password") as string;

        if (password !== confirmPassword) {
          const msg = "Las contraseñas no coinciden";
          setError(msg);
          toast.error(msg);
          return;
        }

        setLoading(true);
        setError("");

        try {
          await signup(email, password, name);
          const target = username ? `/dashboard?username=${encodeURIComponent(username)}` : "/dashboard";
          router.push(target);
        } catch (err) {
          const message = getErrorMessage(err);
          setError(message);
          toast.error(message);
        } finally {
          setLoading(false);
        }
    };

    return (
        <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
            <FieldGroup>
                <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">Crea tu cuenta</h1>
                    <p className="text-sm text-balance text-muted-foreground">
                        {username ? "Completa el registro para ver tu análisis completo" : "Completa el formulario para registrarte"}
                    </p>
                </div>
                <Field>
                    <FieldLabel htmlFor="name">Nombre completo</FieldLabel>
                    <Input id="name" name="name" type="text" placeholder="Juan Pérez" required />
                </Field>
                <Field>
                    <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                    <Input id="email" name="email" type="email" placeholder="usuario@ejemplo.com" required />
                    <FieldDescription>
                        Usaremos este correo para contactarte. No lo compartiremos con nadie más.
                    </FieldDescription>
                </Field>
                <Field>
                    <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                    <Input id="password" name="password" type="password" required />
                    <FieldDescription>
                        Debe tener al menos 8 caracteres.
                    </FieldDescription>
                </Field>
                <Field>
                    <FieldLabel htmlFor="confirm-password">Confirmar contraseña</FieldLabel>
                    <Input id="confirm-password" name="confirm-password" type="password" required />
                    <FieldDescription>Por favor confirma tu contraseña.</FieldDescription>
                </Field>
                {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                )}
                <Field>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Spinner data-icon="inline-start" />}
                        Crear cuenta
                    </Button>
                </Field>
                <Field>
                    <FieldDescription className="text-center">
                        ¿Ya tienes una cuenta?{" "}
                        <Link href="/login" className="underline underline-offset-4">
                            Inicia sesión
                        </Link>
                    </FieldDescription>
                </Field>
            </FieldGroup>
        </form>
    );
}

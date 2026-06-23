"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ERROR_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Correo o contraseña incorrectos",
  "Email not confirmed": "Debes confirmar tu correo antes de iniciar sesión",
  "User already registered": "Este correo ya está registrado",
};

function getErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  return ERROR_MESSAGES[message] || message || "Error inesperado. Intenta de nuevo.";
}

export function LoginForm({ className, ...props }: React.ComponentProps<"form">) {
    const router = useRouter();
    const { login, isAuthenticated, isLoading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
      if (!authLoading && isAuthenticated) {
        router.replace("/dashboard");
      }
    }, [authLoading, isAuthenticated, router]);

    if (authLoading) {
      return <div className="flex justify-center py-12"><Spinner /></div>;
    }

    if (isAuthenticated) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
          await login(email, password);
          router.push("/dashboard");
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
                    <h1 className="text-2xl font-bold">Inicia sesión</h1>
                    <p className="text-sm text-balance text-muted-foreground">
                        Ingresa tu correo para acceder a tu cuenta
                    </p>
                </div>
                <Field>
                    <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                    <Input id="email" name="email" type="email" placeholder="admin@influmetics.com" required />
                </Field>
                <Field>
                    <div className="flex items-center">
                        <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                        <Link href="/forgot-password" className="ml-auto text-sm underline-offset-4 hover:underline">
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                    <Input id="password" name="password" type="password" required />
                </Field>
                {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                )}
                <Field>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Spinner data-icon="inline-start" />}
                        Iniciar sesión
                    </Button>
                </Field>
                <Field>
                    <FieldDescription className="text-center">
                        ¿No tienes una cuenta?{" "}
                        <Link href="/signup" className="underline underline-offset-4">
                            Regístrate
                        </Link>
                    </FieldDescription>
                </Field>
            </FieldGroup>
        </form>
    );
}

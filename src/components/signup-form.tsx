"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field";
import { useAuth } from "@/contexts/AuthContext";

export function SignupForm({ className, ...props }: React.ComponentProps<"form">) {
    const router = useRouter();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        // Crear cuenta y luego iniciar sesión
        await login(email, password);
        router.push("/dashboard");
    };

    return (
        <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
            <FieldGroup>
                <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">Crea tu cuenta</h1>
                    <p className="text-sm text-balance text-muted-foreground">
                        Completa el formulario para registrarte
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
                <Field>
                    <Button type="submit" className="w-full">
                        Crear cuenta
                    </Button>
                </Field>
                <Field>
                    
                    <FieldDescription className="text-center">
                        ¿Ya tienes una cuenta?{" "}
                        <Link href="/" className="underline underline-offset-4">
                            Inicia sesión
                        </Link>
                    </FieldDescription>
                </Field>
            </FieldGroup>
        </form>
    );
}

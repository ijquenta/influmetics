"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Aquí puedes agregar lógica de autenticación
        // Por ahora simplemente redirige al dashboard
        router.push("/dashboard");
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-6 md:p-8 bg-[#F8F7FC]" onSubmit={handleSubmit}>
                        <FieldGroup>
                            <div className="flex flex-col items-center gap-2 text-center mb-4">
                                <h1 className="text-[28px] font-bold text-[#1A1A2E]">Bienvenido</h1>
                                <p className="text-[#6B6B8D] text-balance text-[16px]">Inicia sesión</p>
                            </div>
                            <Field>
                                <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                                <Input id="email" type="email" defaultValue="admin@takenos.com" placeholder="admin@takenos.com" required />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                                <Input id="password" type="password" defaultValue="takenos" placeholder="takenos" required />
                            </Field>
                            <Field>
                                <Button type="submit" className="w-full">
                                    Iniciar sesión
                                </Button>
                            </Field>
                        </FieldGroup>
                    </form>
                    <div className="bg-muted relative hidden md:block">
                        <Image
                            src="/imagen-1.png"
                            alt="Image"
                            fill
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                            priority
                        />
                    </div>
                </CardContent>
            </Card>
            <FieldDescription className="px-6 text-center text-[12px] text-[#6B6B8D]">
                Al hacer clic en continuar, aceptas nuestros{" "}
                <a href="#" className="text-[#6C48C5] hover:underline">
                    Términos de Servicio
                </a>{" "}
                y{" "}
                <a href="#" className="text-[#6C48C5] hover:underline">
                    Política de Privacidad
                </a>
                .
            </FieldDescription>
        </div>
    );
}

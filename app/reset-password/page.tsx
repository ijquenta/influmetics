"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function ResetPasswordPage() {
    const router = useRouter();
    const { updatePassword } = useAuth();
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const password = formData.get("password") as string;
        const confirm = formData.get("confirm-password") as string;

        if (password !== confirm) {
            toast.error("Las contraseñas no coinciden");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            toast.error("La contraseña debe tener al menos 6 caracteres");
            setLoading(false);
            return;
        }

        try {
            await updatePassword(password);
            toast.success("Contraseña actualizada exitosamente");
            setDone(true);
            setTimeout(() => router.push("/dashboard"), 2000);
        } catch {
            toast.error("Error al actualizar la contraseña");
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div className="grid min-h-svh lg:grid-cols-2">
                <div className="flex flex-col gap-4 p-6 md:p-10">
                    <div className="flex justify-center gap-2 md:justify-start">
                        <Link href="/" className="flex items-center gap-2 font-bold">
                            <Image src="/logo-sidebar.png" alt="Influmetics" width={40} height={40} />
                            Influmetics
                        </Link>
                    </div>
                    <div className="flex flex-1 items-center justify-center">
                        <div className="w-full max-w-xs text-center space-y-4">
                            <h1 className="text-2xl font-bold">Contraseña actualizada</h1>
                            <p className="text-sm text-muted-foreground">Serás redirigido al dashboard...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
                    <Link href="/" className="flex items-center gap-2 font-bold">
                        <Image src="/logo-sidebar.png" alt="Influmetics" width={40} height={40} />
                        Influmetics
                    </Link>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <form className={cn("flex flex-col gap-6")} onSubmit={handleSubmit}>
                            <FieldGroup>
                                <div className="flex flex-col items-center gap-1 text-center">
                                    <h1 className="text-2xl font-bold">Nueva contraseña</h1>
                                    <p className="text-sm text-balance text-muted-foreground">
                                        Ingresa tu nueva contraseña
                                    </p>
                                </div>
                                <Field>
                                    <FieldLabel htmlFor="password">Nueva contraseña</FieldLabel>
                                    <Input id="password" name="password" type="password" required />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="confirm-password">Confirmar contraseña</FieldLabel>
                                    <Input id="confirm-password" name="confirm-password" type="password" required />
                                </Field>
                                <Field>
                                    <Button type="submit" className="w-full" disabled={loading}>
                                        {loading && <Spinner />}
                                        Actualizar contraseña
                                    </Button>
                                </Field>
                            </FieldGroup>
                        </form>
                    </div>
                </div>
            </div>
            <div className="relative hidden lg:block overflow-hidden rounded-2xl">
                <Image
                    src="/login-image-influmetics.png"
                    alt="Cover"
                    fill
                    className="object-cover object-center scale-[1.1] origin-center"
                    priority
                />
            </div>
        </div>
    );
}

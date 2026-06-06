import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

function extractUsername(value: string): string {
    const trimmed = value.trim();

    // Si empieza con @, quitarlo
    if (trimmed.startsWith("@")) {
        return trimmed.slice(1);
    }

    try {
        // Intentar parsear como URL
        const url = new URL(trimmed);
        // TikTok suele tener /@username al final
        const parts = url.pathname.split("/").filter(Boolean);
        const last = parts[parts.length - 1] || "";
        if (last.startsWith("@")) {
            return last.slice(1);
        }
        return last || trimmed;
    } catch {
        // No es URL, devolver tal cual
        return trimmed;
    }
}

function validateTikTokUsername(username: string): string | null {
    if (!username || !username.trim()) {
        return "Username is required";
    }

    const trimmed = username.trim();

    if (trimmed.length < 2 || trimmed.length > 30) {
        return "Username must be between 2 and 30 characters";
    }

    const regex = /^[a-zA-Z0-9_.-]+$/;
    if (!regex.test(trimmed)) {
        return "Username can only contain letters, numbers, dots, hyphens and underscores";
    }

    if (trimmed.startsWith("@")) {
        return "Username should not include @ symbol";
    }

    return null;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const rawUsername = (body.username as string | undefined) ?? (body.value as string | undefined);

        if (!rawUsername || !rawUsername.trim()) {
            return NextResponse.json({ error: "Debes enviar un username o URL de perfil." }, { status: 400 });
        }

        const username = extractUsername(rawUsername);

        // Validación estilo tiktokUsernameValidation
        const validationError = validateTikTokUsername(username);
        if (validationError) {
            return NextResponse.json({ error: validationError }, { status: 400 });
        }

        // Llamar a la API de tu backend solo para mostrar su estado (healthcheck)
        let backendHealth: unknown = null;
        try {
            const healthRes = await fetch(`${BACKEND_BASE_URL}/health`);
            if (healthRes.ok) {
                backendHealth = await healthRes.json();
            } else {
                backendHealth = {
                    status: "error",
                    message: `Healthcheck responded with status ${healthRes.status}`,
                };
            }
        } catch (healthError) {
            console.error("Error llamando a /health del backend:", healthError);
            backendHealth = {
                status: "error",
                message: `No se pudo conectar a ${BACKEND_BASE_URL}/health`,
            };
        }

        // Usar la API real de scraping de tu backend (ruta Express: /api/scraping/tiktok)
        try {
            const scrapingRes = await fetch(`${BACKEND_BASE_URL}/api/scraping/tiktok`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // Enviamos solo username como espera el backend
                body: JSON.stringify({ username }),
            });

            const responseBody = await scrapingRes.json().catch(() => null);

            if (scrapingRes.ok) {
                // Esperamos que el backend devuelva { success, data, message, ... }
                type ScrapingSuccessPayload = {
                    success?: boolean;
                    data?: unknown;
                    message?: string;
                    // Permitimos campos extra del backend
                    [key: string]: unknown;
                };

                const payload: ScrapingSuccessPayload =
                    responseBody && typeof responseBody === "object"
                        ? (responseBody as ScrapingSuccessPayload)
                        : {
                              success: true,
                              data: responseBody,
                          };

                return NextResponse.json(
                    {
                        ...payload,
                        message: payload.message ?? `Scraping completado para @${username}`,
                        backendHealth,
                    },
                    { status: 200 }
                );
            }

            console.error("Scraping API respondió con error:", scrapingRes.status, responseBody);

            return NextResponse.json(
                {
                    error: "La API de scraping respondió con error.",
                    statusCode: scrapingRes.status,
                    backendResponse: responseBody,
                    backendHealth,
                },
                { status: scrapingRes.status === 404 ? 404 : 502 }
            );
        } catch (scrapeError) {
            console.error("Error llamando a /api/scraping del backend:", scrapeError);
        }

        // Si la API real falla, devolvemos error
        return NextResponse.json(
            {
                error: "No se pudo obtener datos desde la API de scraping.",
                backendHealth,
            },
            { status: 502 }
        );
    } catch (error) {
        console.error("Error procesando la petición de import-social:", error);
        return NextResponse.json(
            {
                error: "Error en la simulación de importación. Revisa el formato del cuerpo o inténtalo de nuevo.",
            },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from "next/server";

const SCRAPER_API_URL = process.env.SCRAPER_API_URL ?? "https://influmetics-scraper-service.onrender.com";
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY ?? "";

function extractUsername(value: string): string {
    const trimmed = value.trim();

    if (trimmed.startsWith("@")) {
        return trimmed.slice(1);
    }

    try {
        const url = new URL(trimmed);
        const parts = url.pathname.split("/").filter(Boolean);
        const last = parts[parts.length - 1] || "";
        if (last.startsWith("@")) {
            return last.slice(1);
        }
        return last || trimmed;
    } catch {
        return trimmed;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const rawUsername = (body.username as string | undefined) ?? (body.value as string | undefined);

        if (!rawUsername || !rawUsername.trim()) {
            return NextResponse.json({ error: "Debes enviar un username o URL de perfil." }, { status: 400 });
        }

        const username = extractUsername(rawUsername);

        const scraperRes = await fetch(`${SCRAPER_API_URL}/scrape/profile`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "accept": "application/json",
                "X-API-Key": SCRAPER_API_KEY,
            },
            body: JSON.stringify({
                profiles: [username],
                resultsPerPage: 1,
                shouldDownloadVideos: false,
                shouldDownloadCovers: false,
                shouldDownloadSlideshowImages: false,
                shouldDownloadSubtitles: false,
            }),
        });

        const responseBody = await scraperRes.json();

        if (!scraperRes.ok) {
            return NextResponse.json(
                {
                    error: "La API de scraping respondió con error.",
                    statusCode: scraperRes.status,
                    backendResponse: responseBody,
                },
                { status: scraperRes.status }
            );
        }

        return NextResponse.json(responseBody, { status: 200 });
    } catch (error) {
        console.error("Error en scraper:", error);
        return NextResponse.json(
            { error: "Error interno al consultar el scraper." },
            { status: 500 }
        );
    }
}

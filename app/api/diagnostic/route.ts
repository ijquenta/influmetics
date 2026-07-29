import { NextRequest, NextResponse } from "next/server";
import { computeDiagnostic } from "@/lib/diagnostic";

const SCRAPER_API_URL = process.env.SCRAPER_API_URL ?? "http://localhost:8000";
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY ?? "";

function extractUsername(value: string): string {
    const trimmed = value.trim().replace(/^@/, "");
    try {
        const url = new URL(trimmed);
        const parts = url.pathname.split("/").filter(Boolean);
        const last = parts[parts.length - 1]?.replace(/^@/, "") || "";
        return last || trimmed;
    } catch {
        return trimmed;
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const rawUsername = searchParams.get("username");

        if (!rawUsername || !rawUsername.trim()) {
            return NextResponse.json({ error: "Ingresa un usuario de TikTok" }, { status: 400 });
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
                resultsPerPage: 5,
                shouldDownloadVideos: false,
                shouldDownloadCovers: false,
                shouldDownloadSlideshowImages: false,
                shouldDownloadSubtitles: false,
            }),
            signal: AbortSignal.timeout(120000),
        });

        if (!scraperRes.ok) {
            const body = await scraperRes.json().catch(() => ({}));
            if (body.detail?.includes?.("timed out") || scraperRes.status === 504) {
                return NextResponse.json(
                    { error: "El servicio está tardando mucho. Intenta de nuevo en un momento." },
                    { status: 504 }
                );
            }
            return NextResponse.json(
                { error: "Error al consultar TikTok. Verifica que el usuario exista." },
                { status: scraperRes.status === 404 ? 404 : 502 }
            );
        }

        const responseBody = await scraperRes.json();
        const items = responseBody.results || [];

        if (items.length === 0 || !items[0]?.author?.name) {
            return NextResponse.json(
                { error: "Usuario no encontrado en TikTok. Verifica que el nombre sea correcto." },
                { status: 404 }
            );
        }

        const author = items[0].author;

        if (author.privateAccount) {
            return NextResponse.json(
                { error: "Esta cuenta es privada. Prueba con otra." },
                { status: 403 }
            );
        }

        const profile = {
            id: author.id || username,
            name: author.name || author.nickName || username,
            username: author.name || username,
            avatar: author.avatar || null,
            signature: author.signature || null,
            followers: author.fans || 0,
            following: author.following || 0,
            hearts: author.heart || 0,
            videos: author.video || 0,
            verified: author.verified || false,
            privateAccount: false,
        };

        const posts = items.slice(0, 10).map((v: any) => ({
            id: v.id || `post_${Math.random()}`,
            caption: v.text || null,
            playCount: v.playCount || 0,
            likes: v.diggCount || 0,
            comments: v.commentCount || 0,
            shares: v.shareCount || 0,
            saves: v.collectCount || Math.round((v.diggCount || 0) * 0.15),
            coverUrl: v.video?.coverUrl || null,
            webVideoUrl: v.webVideoUrl || null,
            duration: v.video?.duration || null,
            publishedAt: v.createTimeISO || new Date().toISOString(),
        }));

        const result = computeDiagnostic(profile, posts);

        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        console.error("Error en diagnóstico:", error);
        if (error?.name === "TimeoutError" || error?.name === "AbortError") {
            return NextResponse.json(
                { error: "El servicio está tardando mucho. Intenta de nuevo." },
                { status: 504 }
            );
        }
        return NextResponse.json(
            { error: "Error interno al realizar el diagnóstico." },
            { status: 500 }
        );
    }
}

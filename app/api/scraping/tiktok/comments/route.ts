import { NextRequest, NextResponse } from "next/server";

const SCRAPER_API_URL = process.env.SCRAPER_API_URL ?? "https://influmetics-scraper-service.onrender.com";
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY ?? "";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { videoUrl, commentsPerPost, maxRepliesPerComment } = body as {
            videoUrl?: string;
            commentsPerPost?: number;
            maxRepliesPerComment?: number;
        };

        if (!videoUrl || !videoUrl.trim()) {
            return NextResponse.json({ error: "Debes enviar una URL de video." }, { status: 400 });
        }

        const scraperRes = await fetch(`${SCRAPER_API_URL}/scrape/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "accept": "application/json",
                "X-API-Key": SCRAPER_API_KEY,
            },
            body: JSON.stringify({
                videoUrls: [videoUrl.trim()],
                commentsPerPost: commentsPerPost ?? 30,
                maxRepliesPerComment: maxRepliesPerComment ?? 0,
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
        console.error("Error en scraper de comentarios:", error);
        return NextResponse.json(
            { error: "Error interno al consultar comentarios." },
            { status: 500 }
        );
    }
}

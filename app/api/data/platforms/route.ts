import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Datos dummy de plataformas (modo demo / sin BD)
const dummyPlatforms = [
    { id: 1, code: "tiktok", name: "TikTok" },
    { id: 2, code: "instagram", name: "Instagram" },
    { id: 3, code: "youtube", name: "YouTube" },
    { id: 4, code: "x", name: "X (Twitter)" },
];

export async function GET() {
    // Si no hay DATABASE_URL, responder siempre con dummy y no tocar Prisma
    if (!process.env.DATABASE_URL) {
        return NextResponse.json({ data: dummyPlatforms });
    }

    try {
        const platforms = await prisma.socialPlatform.findMany({
            orderBy: {
                name: "asc",
            },
        });

        // Si no hay plataformas en la BD, retornar datos dummy
        if (platforms.length === 0) {
            return NextResponse.json({ data: dummyPlatforms });
        }

        return NextResponse.json({ data: platforms });
    } catch (error) {
        console.error("Error fetching platforms:", error);
        // En caso de error, retornar datos dummy
        return NextResponse.json({ data: dummyPlatforms });
    }
}

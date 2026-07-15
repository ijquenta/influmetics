import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const platforms = await prisma.socialPlatform.findMany({
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json({ data: platforms });
    } catch (error) {
        console.error("Error fetching platforms:", error);
        return NextResponse.json({ error: "Error al obtener plataformas" }, { status: 500 });
    }
}

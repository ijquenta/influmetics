import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const contentTypes = await prisma.contentType.findMany({
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json({ data: contentTypes });
    } catch (error) {
        console.error("Error fetching content types:", error);
        return NextResponse.json({ error: "Error al obtener tipos de contenido" }, { status: 500 });
    }
}

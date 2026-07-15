import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const goalTypes = await prisma.campaignGoalType.findMany({
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json({ data: goalTypes });
    } catch (error) {
        console.error("Error fetching campaign goal types:", error);
        return NextResponse.json({ error: "Error al obtener tipos de objetivos" }, { status: 500 });
    }
}

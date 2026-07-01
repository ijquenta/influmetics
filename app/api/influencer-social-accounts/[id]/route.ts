import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const body = await request.json();

        const updated = await prisma.influencerSocialAccount.update({
            where: { id },
            data: {
                isActive: body.isActive,
            },
        });

        return NextResponse.json({ data: updated });
    } catch (error) {
        console.error("Error updating social account:", error);
        return NextResponse.json({ error: "Error al actualizar cuenta social" }, { status: 500 });
    }
}

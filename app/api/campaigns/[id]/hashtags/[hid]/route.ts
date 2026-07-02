import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; hid: string }> }) {
    try {
        const { id: idParam, hid: hidParam } = await params;
        const id = parseInt(idParam);
        const hid = parseInt(hidParam);

        if (isNaN(id) || isNaN(hid)) {
            return NextResponse.json({ error: "ID inválido" }, { status: 400 });
        }

        const existing = await prisma.campaignHashtag.findFirst({
            where: { id: hid, campaignId: id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Hashtag no encontrado" }, { status: 404 });
        }

        await prisma.campaignHashtag.delete({
            where: { id: hid },
        });

        return NextResponse.json({ message: "Hashtag eliminado" });
    } catch (error) {
        console.error("Error deleting campaign hashtag:", error);
        return NextResponse.json({ error: "Error al eliminar hashtag" }, { status: 500 });
    }
}
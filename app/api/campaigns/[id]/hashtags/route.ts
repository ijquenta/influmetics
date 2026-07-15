import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return NextResponse.json({ error: "ID inválido" }, { status: 400 });
        }

        const hashtags = await prisma.campaignHashtag.findMany({
            where: { campaignId: id },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ data: hashtags });
    } catch (error) {
        console.error("Error fetching campaign hashtags:", error);
        return NextResponse.json({ error: "Error al obtener hashtags" }, { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return NextResponse.json({ error: "ID inválido" }, { status: 400 });
        }

        const body = await request.json();
        const { hashtag, keyword } = body;

        if (!hashtag && !keyword) {
            return NextResponse.json({ error: "Se requiere hashtag o keyword" }, { status: 400 });
        }

        const campaign = await prisma.campaign.findUnique({ where: { id } });
        if (!campaign) {
            return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
        }

        const created = await prisma.campaignHashtag.create({
            data: {
                campaignId: id,
                hashtag: hashtag || null,
                keyword: keyword || null,
            },
        });

        return NextResponse.json({ data: created }, { status: 201 });
    } catch (error) {
        console.error("Error creating campaign hashtag:", error);
        return NextResponse.json({ error: "Error al crear hashtag" }, { status: 500 });
    }
}
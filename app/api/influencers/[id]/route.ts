import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);

        const influencer = await prisma.influencer.findUnique({
            where: { id },
            include: {
                socialAccounts: {
                    include: {
                        socialPlatform: true,
                    },
                },
                influencerCampaigns: {
                    include: {
                        campaign: {
                            include: {
                                primaryGoalType: true,
                            },
                        },
                    },
                },
                posts: {
                    include: {
                        campaign: true,
                        socialPlatform: true,
                        contentType: true,
                        metrics: {
                            orderBy: {
                                snapshotDate: "desc",
                            },
                            take: 1,
                        },
                    },
                    orderBy: {
                        publishedAt: "desc",
                    },
                },
                _count: {
                    select: {
                        posts: true,
                        influencerCampaigns: true,
                    },
                },
            },
        });

        if (!influencer) {
            return NextResponse.json({ error: "Influencer no encontrado" }, { status: 404 });
        }

        return NextResponse.json({ data: influencer });
    } catch (error) {
        console.error("Error fetching influencer:", error);
        return NextResponse.json({ error: "Error al obtener influencer" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const body = await request.json();
        const { name, email, birthDate, niche, referralCode } = body;

        const influencer = await prisma.influencer.update({
            where: { id },
            data: {
                name,
                email,
                birthDate: birthDate ? new Date(birthDate) : null,
                niche,
                referralCode,
            },
            include: {
                socialAccounts: {
                    include: {
                        socialPlatform: true,
                    },
                },
                _count: {
                    select: {
                        posts: true,
                        influencerCampaigns: true,
                    },
                },
            },
        });

        return NextResponse.json({ data: influencer });
    } catch (error) {
        console.error("Error updating influencer:", error);
        return NextResponse.json({ error: "Error al actualizar influencer" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);

        await prisma.influencer.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Influencer eliminado" });
    } catch (error) {
        console.error("Error deleting influencer:", error);
        return NextResponse.json({ error: "Error al eliminar influencer" }, { status: 500 });
    }
}

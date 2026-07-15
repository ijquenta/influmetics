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

        if (Number.isNaN(id) || id <= 0) {
            return NextResponse.json({ error: "ID inválido" }, { status: 400 });
        }

        const body = await request.json();
        const { name, email, birthDate, niche, referralCode } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
        }

        const cleanEmail = email?.trim() || null;
        const cleanReferralCode = referralCode?.trim() || null;

        if (cleanEmail) {
            const existing = await prisma.influencer.findFirst({
                where: { email: cleanEmail, id: { not: id } },
            });
            if (existing) {
                return NextResponse.json({ error: "Ya existe un influencer con este email" }, { status: 400 });
            }
        }

        if (cleanReferralCode) {
            const existing = await prisma.influencer.findFirst({
                where: { referralCode: cleanReferralCode, id: { not: id } },
            });
            if (existing) {
                return NextResponse.json({ error: "Ya existe un influencer con este código de referido" }, { status: 400 });
            }
        }

        let parsedDate = null;
        if (birthDate) {
            parsedDate = new Date(birthDate);
            if (isNaN(parsedDate.getTime())) {
                return NextResponse.json({ error: "Fecha de nacimiento inválida" }, { status: 400 });
            }
        }

        const influencer = await prisma.influencer.update({
            where: { id },
            data: {
                name: name.trim(),
                email: cleanEmail,
                birthDate: parsedDate,
                niche: niche?.trim() || null,
                referralCode: cleanReferralCode,
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
        if (typeof error === "object" && error !== null && (error as { code?: string }).code === "P2025") {
            return NextResponse.json({ error: "Influencer no encontrado" }, { status: 404 });
        }
        console.error("Error updating influencer:", error);
        return NextResponse.json({ error: "Error al actualizar influencer" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);

        if (Number.isNaN(id) || id <= 0) {
            return NextResponse.json({ error: "ID inválido" }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.influencerSocialAccount.deleteMany({ where: { influencerId: id } });
            await tx.influencerCampaign.deleteMany({ where: { influencerId: id } });
            await tx.postHashtag.deleteMany({ where: { post: { influencerId: id } } });
            await tx.postMention.deleteMany({ where: { post: { influencerId: id } } });
            await tx.postSubtitle.deleteMany({ where: { post: { influencerId: id } } });
            await tx.comment.deleteMany({ where: { post: { influencerId: id } } });
            await tx.postMetricSnapshot.deleteMany({ where: { post: { influencerId: id } } });
            await tx.post.deleteMany({ where: { influencerId: id } });
            await tx.internalMetric.deleteMany({ where: { influencerId: id } });
            await tx.influencer.delete({ where: { id } });
        });

        return NextResponse.json({ message: "Influencer eliminado" });
    } catch (error) {
        console.error("Error deleting influencer:", error);
        return NextResponse.json({ error: "Error al eliminar influencer" }, { status: 500 });
    }
}

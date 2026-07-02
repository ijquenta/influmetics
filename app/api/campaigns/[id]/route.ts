import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rankInfluencers, aggregateMetrics } from "@/lib/metrics";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);

        const campaign = await prisma.campaign.findUnique({
            where: { id },
            include: {
                primaryGoalType: true,
                campaignHashtags: true,
                influencerCampaigns: {
                    include: {
                        influencer: {
                            include: {
                                posts: {
                                    where: {
                                        campaignId: id,
                                    },
                                    include: {
                                        metrics: true,
                                    },
                                },
                            },
                        },
                    },
                },
                posts: {
                    include: {
                        influencer: true,
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
                        influencerCampaigns: true,
                        posts: true,
                    },
                },
            },
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
        }

        // Calcular rankings de influencers
        const influencersWithMetrics = campaign.influencerCampaigns.map((ic) => ({
            id: ic.influencer.id,
            name: ic.influencer.name,
            metrics: ic.influencer.posts.flatMap((p) => p.metrics),
            cost: ic.agreedCost,
        }));

        const rankings = {
            roi: rankInfluencers(influencersWithMetrics, "roi"),
            engagement: rankInfluencers(influencersWithMetrics, "engagement"),
            reach: rankInfluencers(influencersWithMetrics, "reach"),
            conversions: rankInfluencers(influencersWithMetrics, "conversions"),
        };

        return NextResponse.json({ data: { ...campaign, rankings } });
    } catch (error) {
        console.error("Error fetching campaign:", error);
        return NextResponse.json({ error: "Error al obtener campaña" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);
        const body = await request.json();
        const { name, description, country, startDate, endDate, isActive, primaryGoalTypeId } = body;

        const campaign = await prisma.campaign.update({
            where: { id },
            data: {
                name,
                description,
                country,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : null,
                isActive,
                primaryGoalTypeId: primaryGoalTypeId ? parseInt(primaryGoalTypeId) : null,
            },
            include: {
                primaryGoalType: true,
                _count: {
                    select: {
                        influencerCampaigns: true,
                        posts: true,
                    },
                },
            },
        });

        return NextResponse.json({ data: campaign });
    } catch (error) {
        console.error("Error updating campaign:", error);
        return NextResponse.json({ error: "Error al actualizar campaña" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);

        await prisma.campaign.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Campaña eliminada" });
    } catch (error) {
        console.error("Error deleting campaign:", error);
        return NextResponse.json({ error: "Error al eliminar campaña" }, { status: 500 });
    }
}

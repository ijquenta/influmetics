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
        const { name, description, country, startDate, endDate, isActive, primaryGoalTypeId, botRate, ticketAverage, marginNet, conversionRate } = body;

        const data: Record<string, unknown> = {};
        if (name !== undefined) data.name = name;
        if (description !== undefined) data.description = description;
        if (country !== undefined) data.country = country;
        if (startDate !== undefined) data.startDate = new Date(startDate);
        if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
        if (isActive !== undefined) data.isActive = isActive;
        if (primaryGoalTypeId !== undefined) {
            data.primaryGoalType = primaryGoalTypeId
                ? { connect: { id: parseInt(primaryGoalTypeId) } }
                : { disconnect: true };
        }
        if (botRate !== undefined) data.botRate = botRate === null ? null : parseFloat(botRate);
        if (ticketAverage !== undefined) data.ticketAverage = ticketAverage === null ? null : parseFloat(ticketAverage);
        if (marginNet !== undefined) data.marginNet = marginNet === null ? null : parseFloat(marginNet);
        if (conversionRate !== undefined) data.conversionRate = conversionRate === null ? null : parseFloat(conversionRate);

        const campaign = await prisma.campaign.update({
            where: { id },
            data,
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

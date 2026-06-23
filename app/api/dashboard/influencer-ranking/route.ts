import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aggregateMetrics, calculateROI } from "@/lib/metrics";

interface InfluencerRanking {
    id: number;
    name: string;
    email: string | null;
    niche: string | null;
    rank: number;
    totalViews: number;
    totalEngagement: number;
    totalConversions: number;
    totalRevenue: number;
    engagementRate: number;
    roi: number;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const socialPlatformId = searchParams.get("socialPlatformId");
    const campaignId = searchParams.get("campaignId");
    const limit = parseInt(searchParams.get("limit") || "10");

    try {
        const snapshotFilter: { snapshotDate?: { gte?: Date; lte?: Date } } = {};
        if (startDate) snapshotFilter.snapshotDate = { ...snapshotFilter.snapshotDate, gte: new Date(startDate) };
        if (endDate) snapshotFilter.snapshotDate = { ...snapshotFilter.snapshotDate, lte: new Date(endDate) };

        const postsFilter: { campaignId?: number; socialPlatformId?: number; OR?: { socialPlatformId: number }[] } = {};

        if (campaignId && !isNaN(parseInt(campaignId))) {
            postsFilter.campaignId = parseInt(campaignId);
        }

        if (socialPlatformId) {
            const platformIds = socialPlatformId.split(",").map((id) => parseInt(id)).filter((id) => !isNaN(id));
            if (platformIds.length === 1) {
                postsFilter.socialPlatformId = platformIds[0];
            } else if (platformIds.length > 1) {
                postsFilter.OR = platformIds.map((id) => ({ socialPlatformId: id }));
            }
        }

        const influencers = await prisma.influencer.findMany({
            where: {
                posts: {
                    some: {
                        ...postsFilter,
                        metrics: { some: snapshotFilter },
                    },
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                niche: true,
                influencerCampaigns: {
                    select: { agreedCost: true },
                },
                posts: {
                    where: postsFilter,
                    select: {
                        socialPlatformId: true,
                        metrics: {
                            where: snapshotFilter,
                            select: {
                                views: true,
                                likes: true,
                                shares: true,
                                clicks: true,
                                conversions: true,
                                revenue: true,
                            },
                        },
                    },
                },
            },
        });

        const rankings: InfluencerRanking[] = influencers
            .map((influencer) => {
                const allMetrics = influencer.posts.flatMap((post) => post.metrics);

                if (socialPlatformId && socialPlatformId.includes(",")) {
                    const platformIds = socialPlatformId.split(",").map((id) => parseInt(id));
                    const filteredPosts = influencer.posts.filter((post) => platformIds.includes(post.socialPlatformId));
                    const filteredMetrics = filteredPosts.flatMap((post) => post.metrics);
                    return { ...influencer, allMetrics: filteredMetrics };
                }

                return { ...influencer, allMetrics };
            })
            .map((influencer) => {
                if (!influencer.allMetrics || influencer.allMetrics.length === 0) {
                    return null;
                }

                const aggregated = aggregateMetrics(influencer.allMetrics);
                const totalCost = influencer.influencerCampaigns.reduce(
                    (sum, ic) => sum + (ic.agreedCost ? Number(ic.agreedCost) : 0),
                    0
                );
                const roi = calculateROI(aggregated.total.revenue, totalCost || 1);

                return {
                    id: influencer.id,
                    name: influencer.name,
                    email: influencer.email,
                    niche: influencer.niche,
                    rank: 0,
                    totalViews: aggregated.total.views,
                    totalEngagement: aggregated.engagementRate,
                    totalConversions: aggregated.total.conversions,
                    totalRevenue: aggregated.total.revenue,
                    engagementRate: aggregated.engagementRate,
                    roi,
                };
            })
            .filter((item): item is InfluencerRanking => item !== null)
            .sort((a, b) => {
                const scoreA = a.totalViews * 0.3 + a.engagementRate * 100 + a.totalConversions * 10;
                const scoreB = b.totalViews * 0.3 + b.engagementRate * 100 + b.totalConversions * 10;
                return scoreB - scoreA;
            })
            .map((item, index) => ({
                ...item,
                rank: index + 1,
            }))
            .slice(0, limit);

        return NextResponse.json({ data: rankings });
    } catch (error) {
        console.error("Error fetching influencer ranking:", error);
        return NextResponse.json({ error: "Error al obtener ranking de influencers" }, { status: 500 });
    }
}

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
        interface PostWhere {
            campaignId?: number;
            socialPlatformId?: number;
            OR?: Array<{ socialPlatformId: number }>;
        }

        const postWhere: PostWhere = {};

        if (campaignId) {
            const cid = parseInt(campaignId);
            if (!isNaN(cid)) {
                postWhere.campaignId = cid;
            }
        }

        if (socialPlatformId) {
            const platformIds = socialPlatformId
                .split(",")
                .map((id) => parseInt(id))
                .filter((id) => !isNaN(id));
            if (platformIds.length === 1) {
                postWhere.socialPlatformId = platformIds[0];
            } else if (platformIds.length > 1) {
                postWhere.OR = platformIds.map((id) => ({ socialPlatformId: id }));
            }
        }

        interface MetricWhere {
            post: PostWhere;
            snapshotDate?: {
                gte?: Date;
                lte?: Date;
            };
        }

        const metricWhere: MetricWhere = {
            post: postWhere,
        };

        if (startDate || endDate) {
            metricWhere.snapshotDate = {};
            if (startDate) {
                metricWhere.snapshotDate.gte = new Date(startDate);
            }
            if (endDate) {
                metricWhere.snapshotDate.lte = new Date(endDate);
            }
        }

        const influencers = await prisma.influencer.findMany({
            include: {
                posts: {
                    include: {
                        metrics: {
                            where: metricWhere,
                        },
                    },
                },
                influencerCampaigns: {
                    include: {
                        campaign: true,
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
                    return {
                        ...influencer,
                        posts: filteredPosts,
                        allMetrics: filteredMetrics,
                    };
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

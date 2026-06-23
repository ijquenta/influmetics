import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { aggregateMetrics, comparePeriods } from "@/lib/metrics";

interface PostWhere {
    campaignId?: number;
    influencerId?: number;
    socialPlatformId?: number;
}

interface MetricWhere {
    post: PostWhere;
    snapshotDate?: {
        gte?: Date;
        lte?: Date;
    };
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const campaignId = searchParams.get("campaignId");
    const influencerId = searchParams.get("influencerId");
    const socialPlatformId = searchParams.get("socialPlatformId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    try {
        const postWhere: PostWhere = {};

        if (campaignId) {
            postWhere.campaignId = parseInt(campaignId);
        }

        if (influencerId) {
            postWhere.influencerId = parseInt(influencerId);
        }

        if (socialPlatformId) {
            postWhere.socialPlatformId = parseInt(socialPlatformId);
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

        const endDateObj = endDate ? new Date(endDate) : new Date();
        const startDateObj = startDate ? new Date(startDate) : new Date(endDateObj.getFullYear(), endDateObj.getMonth() - 1, 1);

        const previousStartDate = new Date(startDateObj);
        previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        const previousEndDate = new Date(startDateObj);

        const previousMetricWhere = {
            ...metricWhere,
            snapshotDate: {
                gte: previousStartDate,
                lte: previousEndDate,
            },
        };

        const [currentMetrics, previousMetrics] = await Promise.all([
            prisma.postMetricSnapshot.findMany({
                where: metricWhere,
                select: {
                    views: true,
                    likes: true,
                    shares: true,
                    clicks: true,
                    conversions: true,
                    revenue: true,
                    post: {
                        select: { socialPlatformId: true },
                    },
                },
            }),
            prisma.postMetricSnapshot.findMany({
                where: previousMetricWhere,
                select: {
                    views: true,
                    likes: true,
                    shares: true,
                    clicks: true,
                    conversions: true,
                    revenue: true,
                },
            }),
        ]);

        const currentAggregated = aggregateMetrics(currentMetrics);
        const previousAggregated = aggregateMetrics(previousMetrics);

        const comparison = comparePeriods(
            {
                views: currentAggregated.total.views ?? 0,
                engagement: currentAggregated.engagementRate,
                conversions: currentAggregated.total.conversions ?? 0,
            },
            {
                views: previousAggregated.total.views ?? 0,
                engagement: previousAggregated.engagementRate,
                conversions: previousAggregated.total.conversions ?? 0,
            }
        );

        const stats = {
            reach: {
                value: currentAggregated.total.views,
                change: comparison.views.change,
                isPositive: comparison.views.isPositive,
            },
            engagement: {
                value: currentAggregated.engagementRate,
                change: comparison.engagement.change,
                isPositive: comparison.engagement.isPositive,
            },
            clicks: {
                value: currentAggregated.total.clicks,
                change: 0,
                isPositive: true,
            },
            conversions: {
                value: currentAggregated.total.conversions,
                change: comparison.conversions.change,
                isPositive: comparison.conversions.isPositive,
            },
            ctr: {
                value: currentAggregated.ctr,
                change: 0,
                isPositive: true,
            },
            revenue: {
                value: currentAggregated.total.revenue,
                change: 0,
                isPositive: true,
            },
        };

        return NextResponse.json({ data: stats });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 });
    }
}


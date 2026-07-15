import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

interface TimelineItem {
    date: string;
    views: number;
    likes: number;
    shares: number;
    clicks: number;
    conversions: number;
    revenue: number;
    engagement: number;
    ctr: number;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const campaignId = searchParams.get("campaignId");
    const influencerId = searchParams.get("influencerId");
    const socialPlatformIds = searchParams.getAll("socialPlatformId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const groupBy = searchParams.get("groupBy") || "day"; // 'day' | 'week' | 'month'

    try {
        const postWhere: PostWhere = {};

        if (campaignId) {
            postWhere.campaignId = parseInt(campaignId);
        }

        if (influencerId) {
            postWhere.influencerId = parseInt(influencerId);
        }

        if (socialPlatformIds.length === 1) {
            postWhere.socialPlatformId = parseInt(socialPlatformIds[0]);
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

        const metrics = await prisma.postMetricSnapshot.findMany({
            where: metricWhere,
            include: {
                post: {
                    include: {
                        influencer: true,
                        campaign: true,
                        socialPlatform: true,
                    },
                },
            },
            orderBy: {
                snapshotDate: "asc",
            },
        });

        const platformIds = socialPlatformIds.length > 0 ? socialPlatformIds.map((id) => parseInt(id)) : [];

        const filteredMetrics =
            platformIds.length > 1 ? metrics.filter((metric) => platformIds.includes(metric.post.socialPlatformId)) : metrics;

        const grouped: Record<string, TimelineItem> = {};

        if (platformIds.length > 1) {
            const groupedByPlatform: Record<string, Record<string, TimelineItem>> = {};

            filteredMetrics.forEach((metric) => {
                const platformCode = metric.post.socialPlatform.code;
                const date = new Date(metric.snapshotDate);
                let key = "";

                switch (groupBy) {
                    case "week": {
                        const weekStart = new Date(date);
                        weekStart.setDate(date.getDate() - date.getDay());
                        key = weekStart.toISOString().split("T")[0];
                        break;
                    }
                    case "month":
                        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                        break;
                    default:
                        key = date.toISOString().split("T")[0];
                }

                if (!groupedByPlatform[platformCode]) {
                    groupedByPlatform[platformCode] = {};
                }

                if (!groupedByPlatform[platformCode][key]) {
                    groupedByPlatform[platformCode][key] = {
                        date: key,
                        views: 0,
                        likes: 0,
                        shares: 0,
                        clicks: 0,
                        conversions: 0,
                        revenue: 0,
                        engagement: 0,
                        ctr: 0,
                    };
                }

                groupedByPlatform[platformCode][key].views += metric.views || 0;
                groupedByPlatform[platformCode][key].likes += metric.likes || 0;
                groupedByPlatform[platformCode][key].shares += metric.shares || 0;
                groupedByPlatform[platformCode][key].clicks += metric.clicks || 0;
                groupedByPlatform[platformCode][key].conversions += metric.conversions || 0;
                groupedByPlatform[platformCode][key].revenue += metric.revenue ? Number(metric.revenue) : 0;
            });

            const allDates = new Set<string>();
            Object.values(groupedByPlatform).forEach((platformData) => {
                Object.keys(platformData).forEach((date) => allDates.add(date));
            });

            allDates.forEach((date) => {
                grouped[date] = {
                    date,
                    views: 0,
                    likes: 0,
                    shares: 0,
                    clicks: 0,
                    conversions: 0,
                    revenue: 0,
                    engagement: 0,
                    ctr: 0,
                };

                Object.entries(groupedByPlatform).forEach(([platformCode, platformData]) => {
                    if (platformData[date]) {
                        const item = platformData[date];
                        grouped[date].views += item.views;
                        grouped[date].likes += item.likes;
                        grouped[date].shares += item.shares;
                        grouped[date].clicks += item.clicks;
                        grouped[date].conversions += item.conversions;
                        grouped[date].revenue += item.revenue;

                        const engagement = item.views > 0 ? ((item.likes + item.shares) / item.views) * 100 : 0;
                        const dateItem = grouped[date] as TimelineItem & Record<string, number>;
                        dateItem[`views_${platformCode}`] = item.views;
                        dateItem[`engagement_${platformCode}`] = engagement;
                        dateItem[`conversions_${platformCode}`] = item.conversions;
                    }
                });
            });
        } else {
            filteredMetrics.forEach((metric) => {
                const date = new Date(metric.snapshotDate);
                let key = "";

                switch (groupBy) {
                    case "week": {
                        const weekStart = new Date(date);
                        weekStart.setDate(date.getDate() - date.getDay());
                        key = weekStart.toISOString().split("T")[0];
                        break;
                    }
                    case "month":
                        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                        break;
                    default:
                        key = date.toISOString().split("T")[0];
                }

                if (!grouped[key]) {
                    grouped[key] = {
                        date: key,
                        views: 0,
                        likes: 0,
                        shares: 0,
                        clicks: 0,
                        conversions: 0,
                        revenue: 0,
                        engagement: 0,
                        ctr: 0,
                    };
                }

                grouped[key].views += metric.views || 0;
                grouped[key].likes += metric.likes || 0;
                grouped[key].shares += metric.shares || 0;
                grouped[key].clicks += metric.clicks || 0;
                grouped[key].conversions += metric.conversions || 0;
                grouped[key].revenue += metric.revenue ? Number(metric.revenue) : 0;
            });
        }

        const timeline = Object.values(grouped).map((item) => ({
            ...item,
            engagement: item.views > 0 ? ((item.likes + item.shares) / item.views) * 100 : 0,
            ctr: item.views > 0 ? (item.clicks / item.views) * 100 : 0,
        }));

        return NextResponse.json({ data: timeline });
    } catch (error) {
        console.error("Error fetching timeline:", error);
        return NextResponse.json({ error: "Error al obtener timeline" }, { status: 500 });
    }
}

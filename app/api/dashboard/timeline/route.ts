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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const groupBy = searchParams.get("groupBy") || "day"; // 'day' | 'week' | 'month'

    // Si no hay DATABASE_URL, devolver siempre timeline dummy (modo demo)
    if (!process.env.DATABASE_URL) {
        const start = startDate ? new Date(startDate) : new Date();
        const end = endDate ? new Date(endDate) : new Date();
        const dummyTimeline = generateDummyTimeline(start, end, groupBy);
        return NextResponse.json({ data: dummyTimeline });
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const campaignId = searchParams.get("campaignId");
        const influencerId = searchParams.get("influencerId");
        const socialPlatformIds = searchParams.getAll("socialPlatformId"); // Obtener todos los IDs
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const groupBy = searchParams.get("groupBy") || "day"; // 'day' | 'week' | 'month'

        const postWhere: PostWhere = {};

        if (campaignId) {
            postWhere.campaignId = parseInt(campaignId);
        }

        if (influencerId) {
            postWhere.influencerId = parseInt(influencerId);
        }

        // Si hay múltiples plataformas, usar OR en lugar de un solo ID
        if (socialPlatformIds.length > 0) {
            const platformIds = socialPlatformIds.map((id) => parseInt(id));
            if (platformIds.length === 1) {
                postWhere.socialPlatformId = platformIds[0];
            } else {
                // Para múltiples plataformas, necesitamos usar una estructura diferente
                // Por ahora, vamos a filtrar después
            }
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

        // Si hay múltiples plataformas, filtrar y agrupar por plataforma
        const platformIds = socialPlatformIds.length > 0 ? socialPlatformIds.map((id) => parseInt(id)) : [];

        // Filtrar métricas por plataformas si hay múltiples seleccionadas
        const filteredMetrics =
            platformIds.length > 1 ? metrics.filter((metric) => platformIds.includes(metric.post.socialPlatformId)) : metrics;

        // Agrupar por fecha según groupBy
        // Si hay múltiples plataformas, agrupar también por plataforma
        const grouped: Record<string, TimelineItem> = {};

        if (platformIds.length > 1) {
            // Agrupar por fecha Y por plataforma
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
                    default: // day
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

            // Combinar datos de todas las plataformas por fecha
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

                // Agregar datos de cada plataforma como campos separados
                Object.entries(groupedByPlatform).forEach(([platformCode, platformData]) => {
                    if (platformData[date]) {
                        const item = platformData[date];
                        grouped[date].views += item.views;
                        grouped[date].likes += item.likes;
                        grouped[date].shares += item.shares;
                        grouped[date].clicks += item.clicks;
                        grouped[date].conversions += item.conversions;
                        grouped[date].revenue += item.revenue;

                        // Agregar campos específicos por plataforma
                        const engagement = item.views > 0 ? ((item.likes + item.shares) / item.views) * 100 : 0;
                        const dateItem = grouped[date] as TimelineItem & Record<string, number>;
                        dateItem[`views_${platformCode}`] = item.views;
                        dateItem[`engagement_${platformCode}`] = engagement;
                        dateItem[`conversions_${platformCode}`] = item.conversions;
                    }
                });
            });
        } else {
            // Agrupar normalmente (una sola plataforma o todas)
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
                    default: // day
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

        // Calcular engagement por día
        const timeline = Object.values(grouped).map((item) => ({
            ...item,
            engagement: item.views > 0 ? ((item.likes + item.shares) / item.views) * 100 : 0,
            ctr: item.views > 0 ? (item.clicks / item.views) * 100 : 0,
        }));

        // Si no hay datos, generar datos dummy
        if (timeline.length === 0) {
            const start = startDate ? new Date(startDate) : new Date();
            const end = endDate ? new Date(endDate) : new Date();

            const dummyTimeline = generateDummyTimeline(start, end, groupBy || "day");
            return NextResponse.json({ data: dummyTimeline });
        }

        return NextResponse.json({ data: timeline });
    } catch (error) {
        console.error("Error fetching timeline:", error);

        // Generar datos dummy en caso de error
        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");
        const groupBy = searchParams.get("groupBy") || "day";

        const start = startDate ? new Date(startDate) : new Date();
        const end = endDate ? new Date(endDate) : new Date();

        const dummyTimeline = generateDummyTimeline(start, end, groupBy);
        return NextResponse.json({ data: dummyTimeline });
    }
}

// Función helper para generar datos dummy del timeline
function generateDummyTimeline(startDate: Date, endDate: Date, groupBy: string): TimelineItem[] {
    const timeline: TimelineItem[] = [];

    if (groupBy === "day") {
        const current = new Date(startDate);
        while (current <= endDate) {
            const baseViews = 10000 + Math.random() * 50000;
            const baseEngagement = 2 + Math.random() * 8;
            const baseConversions = 50 + Math.random() * 200;

            timeline.push({
                date: current.toISOString().split("T")[0],
                views: Math.round(baseViews),
                engagement: Number(baseEngagement.toFixed(2)),
                conversions: Math.round(baseConversions),
                likes: Math.round(baseViews * (baseEngagement / 100) * 0.7),
                shares: Math.round(baseViews * (baseEngagement / 100) * 0.3),
                clicks: Math.round(baseViews * 0.05),
                revenue: Number((baseConversions * 150).toFixed(2)),
                ctr: 5.0,
            });

            current.setDate(current.getDate() + 1);
        }
    } else if (groupBy === "week") {
        const current = new Date(startDate);
        const weekStart = new Date(current);
        weekStart.setDate(current.getDate() - current.getDay());

        const weekStartCopy = new Date(weekStart);
        while (weekStartCopy <= endDate) {
            const baseViews = 70000 + Math.random() * 350000;
            const baseEngagement = 2 + Math.random() * 8;
            const baseConversions = 350 + Math.random() * 1400;

            timeline.push({
                date: weekStartCopy.toISOString().split("T")[0],
                views: Math.round(baseViews),
                engagement: Number(baseEngagement.toFixed(2)),
                conversions: Math.round(baseConversions),
                likes: Math.round(baseViews * (baseEngagement / 100) * 0.7),
                shares: Math.round(baseViews * (baseEngagement / 100) * 0.3),
                clicks: Math.round(baseViews * 0.05),
                revenue: Number((baseConversions * 150).toFixed(2)),
                ctr: 5.0,
            });

            weekStartCopy.setDate(weekStartCopy.getDate() + 7);
        }
    } else if (groupBy === "month") {
        const current = new Date(startDate);
        while (current <= endDate) {
            const baseViews = 300000 + Math.random() * 1500000;
            const baseEngagement = 2 + Math.random() * 8;
            const baseConversions = 1500 + Math.random() * 6000;

            const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
            timeline.push({
                date: monthKey,
                views: Math.round(baseViews),
                engagement: Number(baseEngagement.toFixed(2)),
                conversions: Math.round(baseConversions),
                likes: Math.round(baseViews * (baseEngagement / 100) * 0.7),
                shares: Math.round(baseViews * (baseEngagement / 100) * 0.3),
                clicks: Math.round(baseViews * 0.05),
                revenue: Number((baseConversions * 150).toFixed(2)),
                ctr: 5.0,
            });

            current.setMonth(current.getMonth() + 1);
        }
    }

    return timeline;
}

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

    // Helper para generar KPIs dummy en modo demo de forma dinámica
    const buildDummyStats = () => {
        // Usar campaña, plataforma y mes como semillas
        const cid = campaignId && campaignId !== "all" ? parseInt(campaignId) || 0 : 0;
        const pid = socialPlatformId ? parseInt(socialPlatformId) || 0 : 0;
        const dateSeed = startDate ? new Date(startDate).getMonth() + 1 : new Date().getMonth() + 1;

        const seed = cid * 31 + pid * 17 + dateSeed * 7 || 1;
        const rand = Math.abs(Math.sin(seed * 123.456)); // 0..1
        const rand2 = Math.abs(Math.sin(seed * 78.9)); // 0..1

        // Alcance base entre 250k y 800k
        const reachValue = Math.round(250_000 + rand * 550_000);

        // Engagement medio entre 3% y 9%
        const engagementValue = Number((3 + rand2 * 6).toFixed(2));

        // Conversions ~ 0.15% – 0.4% del reach
        const conversionsValue = Math.round(reachValue * (0.0015 + rand * 0.0025));

        // Clicks ~ 4% – 7% del reach
        const clicksValue = Math.round(reachValue * (0.04 + rand2 * 0.03));

        // Revenue ~ 100–200 USD por conversión
        const revenuePerConv = 100 + rand * 100;
        const revenueValue = Math.round(conversionsValue * revenuePerConv);

        // CTR real
        const ctrValue = Number(((clicksValue / Math.max(reachValue, 1)) * 100).toFixed(2));

        // Cambios vs mes anterior (-10% a +25%)
        const changeSeed = Math.abs(Math.sin(seed * 45.67));
        const reachChange = Number((changeSeed * 35 - 10).toFixed(1)); // -10% a +25%
        const engagementChange = Number((changeSeed * 20 - 5).toFixed(1)); // -5% a +15%
        const convChange = Number((changeSeed * 40 - 10).toFixed(1)); // -10% a +30%
        const ctrChange = Number((changeSeed * 10 - 3).toFixed(1)); // -3% a +7%
        const revenueChange = Number((changeSeed * 45 - 10).toFixed(1)); // -10% a +35%

        return {
            reach: {
                value: reachValue,
                change: reachChange,
                isPositive: reachChange >= 0,
            },
            engagement: {
                value: engagementValue,
                change: engagementChange,
                isPositive: engagementChange >= 0,
            },
            clicks: {
                value: clicksValue,
                change: 0, // podríamos hacer dinámico también si se requiere
                isPositive: true,
            },
            conversions: {
                value: conversionsValue,
                change: convChange,
                isPositive: convChange >= 0,
            },
            ctr: {
                value: ctrValue,
                change: ctrChange,
                isPositive: ctrChange >= 0,
            },
            revenue: {
                value: revenueValue,
                change: revenueChange,
                isPositive: revenueChange >= 0,
            },
        };
    };

    // Si no hay DATABASE_URL, usar siempre stats dummy dinámicos (modo demo)
    if (!process.env.DATABASE_URL) {
        const dummyStats = buildDummyStats();
        return NextResponse.json({ data: dummyStats });
    }

    try {
        // Construir filtros para posts
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

        // Obtener todas las métricas con filtros
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

        // Obtener métricas del período actual
        const currentMetrics = await prisma.postMetricSnapshot.findMany({
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
        });

        // Calcular período anterior (mes anterior)
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

        const previousMetrics = await prisma.postMetricSnapshot.findMany({
            where: previousMetricWhere,
        });

        // Agregar métricas
        const currentAggregated = aggregateMetrics(currentMetrics);
        const previousAggregated = aggregateMetrics(previousMetrics);

        // Comparar períodos
        const comparison = comparePeriods(
            {
                views: currentAggregated.total.views,
                engagement: currentAggregated.engagementRate,
                conversions: currentAggregated.total.conversions,
            },
            {
                views: previousAggregated.total.views,
                engagement: previousAggregated.engagementRate,
                conversions: previousAggregated.total.conversions,
            }
        );

        // KPIs principales
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
                change: 0, // Calcular si es necesario
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

        // Retornar datos dummy dinámicos en caso de error
        const dummyStats = buildDummyStats();
        return NextResponse.json({ data: dummyStats });
    }
}

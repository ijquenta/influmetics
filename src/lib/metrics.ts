// Helpers para cálculos de métricas

import type { PostMetricSnapshot } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Calcula el engagement rate: (likes + shares) / views
 */
export function calculateEngagementRate(likes: number | null, shares: number | null, views: number | null): number {
    if (!views || views === 0) return 0;
    const engagement = (likes || 0) + (shares || 0);
    return (engagement / views) * 100;
}

/**
 * Calcula el ROI: (revenue - cost) / cost * 100
 */
export function calculateROI(revenue: Decimal | number | null, cost: Decimal | number | null): number {
    if (!cost || cost === 0) return 0;
    const revenueNum = typeof revenue === "object" ? Number(revenue) : revenue || 0;
    const costNum = typeof cost === "object" ? Number(cost) : cost || 0;
    return ((revenueNum - costNum) / costNum) * 100;
}

/**
 * Calcula métricas agregadas de una lista de snapshots
 */
export function aggregateMetrics(snapshots: PostMetricSnapshot[]) {
    const latest = snapshots[snapshots.length - 1];
    const total = snapshots.reduce(
        (acc, snap) => ({
            views: acc.views + (snap.views || 0),
            likes: acc.likes + (snap.likes || 0),
            shares: acc.shares + (snap.shares || 0),
            clicks: acc.clicks + (snap.clicks || 0),
            conversions: acc.conversions + (snap.conversions || 0),
            revenue: acc.revenue + (snap.revenue ? Number(snap.revenue) : 0),
        }),
        { views: 0, likes: 0, shares: 0, clicks: 0, conversions: 0, revenue: 0 }
    );

    const engagementRate = calculateEngagementRate(total.likes, total.shares, total.views);

    return {
        total,
        latest,
        engagementRate,
        conversionRate: total.views > 0 ? (total.conversions / total.views) * 100 : 0,
        ctr: total.views > 0 ? (total.clicks / total.views) * 100 : 0,
    };
}

/**
 * Calcula el ranking de influencers por métrica
 */
export function rankInfluencers(
    influencers: Array<{
        id: number;
        name: string;
        metrics: PostMetricSnapshot[];
        cost?: Decimal | number | null;
    }>,
    metric: "roi" | "engagement" | "reach" | "conversions"
) {
    return influencers
        .map((inf) => {
            const aggregated = aggregateMetrics(inf.metrics);
            let score = 0;

            switch (metric) {
                case "roi":
                    score = calculateROI(aggregated.total.revenue, inf.cost || 0);
                    break;
                case "engagement":
                    score = aggregated.engagementRate;
                    break;
                case "reach":
                    score = aggregated.total.views;
                    break;
                case "conversions":
                    score = aggregated.total.conversions;
                    break;
            }

            return {
                ...inf,
                score,
                ...aggregated,
            };
        })
        .sort((a, b) => b.score - a.score)
        .map((item, index) => ({
            ...item,
            rank: index + 1,
        }));
}

/**
 * Compara métricas del mes actual vs mes anterior
 */
export function comparePeriods(
    current: { views: number; engagement: number; conversions: number },
    previous: { views: number; engagement: number; conversions: number }
) {
    const viewsChange = previous.views > 0 ? ((current.views - previous.views) / previous.views) * 100 : 0;

    const engagementChange = previous.engagement > 0 ? ((current.engagement - previous.engagement) / previous.engagement) * 100 : 0;

    const conversionsChange = previous.conversions > 0 ? ((current.conversions - previous.conversions) / previous.conversions) * 100 : 0;

    return {
        views: {
            value: current.views,
            change: viewsChange,
            isPositive: viewsChange > 0,
        },
        engagement: {
            value: current.engagement,
            change: engagementChange,
            isPositive: engagementChange > 0,
        },
        conversions: {
            value: current.conversions,
            change: conversionsChange,
            isPositive: conversionsChange > 0,
        },
    };
}

/**
 * Genera insights en texto simple
 */
export function generateInsight(
    influencerName: string,
    metric: string,
    value: number,
    comparison: number,
    type: "campaign" | "influencer"
): string {
    const percentChange = comparison > 0 ? ((value - comparison) / comparison) * 100 : 0;
    const isPositive = percentChange > 0;

    if (type === "campaign") {
        return `La campaña ${influencerName} tiene ${Math.abs(percentChange).toFixed(1)}% ${isPositive ? "más" : "menos"} de ${metric} que el promedio de la campaña.`;
    } else {
        return `El influencer ${influencerName} tiene ${Math.abs(percentChange).toFixed(1)}% ${isPositive ? "más" : "menos"} de ${metric} que el promedio.`;
    }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    calculateEMV,
    calculateROI,
    calculateEngagementRate,
    calculateCPM,
    calculateCPE,
    totalEngagements,
    CPM_BENCHMARK,
} from "@/lib/roi";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const campaignId = searchParams.get("campaignId");
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        const startDate = startDateParam ? new Date(startDateParam) : new Date(0);
        const endDate = endDateParam ? new Date(endDateParam) : new Date();

        // Build filter for InfluencerCampaigns
        const campaignFilter: Record<string, unknown> = {};
        if (campaignId && campaignId !== "all") {
            campaignFilter.campaignId = parseInt(campaignId);
        }

        const influencerCampaigns = await prisma.influencerCampaign.findMany({
            where: campaignFilter,
            include: {
                influencer: {
                    include: {
                        socialAccounts: {
                            include: { socialPlatform: true },
                        },
                        posts: {
                            where: {
                                publishedAt: { gte: startDate, lte: endDate },
                            },
                            include: {
                                metrics: {
                                    where: {
                                        snapshotDate: { gte: startDate, lte: endDate },
                                    },
                                },
                            },
                        },
                    },
                },
                campaign: true,
            },
        });

        const summary: {
            influencerId: number;
            name: string;
            referralCode: string | null;
            username: string | null;
            socialPlatforms: string[];
            campaignId: number | null;
            campaignName: string | null;
            nau: number;
            roi: number;
            views: number;
            engagements: number;
            engagementRate: number;
            cpm: number | null;
            cpe: number | null;
            investment: number;
            emv: number;
        }[] = [];

        const dailyMap = new Map<string, Record<string, number>>();

        for (const ic of influencerCampaigns) {
            const inf = ic.influencer;
            const tiktokAccount = inf.socialAccounts.find(
                (a) => a.socialPlatform.code === "tiktok"
            );
            const username = tiktokAccount?.handle
                ? `@${tiktokAccount.handle.replace(/^@/, "")}`
                : null;

            // Aggregate all metrics
            let totalViews = 0;
            let totalLikes = 0;
            let totalComments = 0;
            let totalShares = 0;
            let totalSaves = 0;

            for (const post of inf.posts) {
                for (const metric of post.metrics) {
                    totalViews += metric.playCount ?? metric.views ?? 0;
                    totalLikes += metric.likes ?? 0;
                    totalComments += metric.commentCount ?? 0;
                    totalShares += metric.shares ?? 0;
                    totalSaves += metric.saves ?? 0;
                }
            }

            const engagements = totalLikes + totalComments + totalShares + totalSaves;
            const investment = ic.agreedCost ? Number(ic.agreedCost) : 0;
            const emv = calculateEMV(totalViews);
            const roi = calculateROI(emv, investment);
            const engagementRate = totalViews > 0
                ? (engagements / totalViews) * 100
                : 0;
            const cpm = investment > 0 && totalViews > 0
                ? (investment / totalViews) * 1000
                : null;
            const cpe = investment > 0 && engagements > 0
                ? investment / engagements
                : null;

            summary.push({
                influencerId: inf.id,
                name: inf.name,
                referralCode: inf.referralCode,
                username,
                socialPlatforms: inf.socialAccounts.map((a) => a.socialPlatform.code),
                campaignId: ic.campaignId,
                campaignName: ic.campaign.name,
                nau: Math.round(emv),
                roi: Math.round(roi * 100) / 100,
                views: totalViews,
                engagements,
                engagementRate: Math.round(engagementRate * 100) / 100,
                cpm,
                cpe,
                investment,
                emv: Math.round(emv),
            });

            // Build daily timeline
            const key = inf.referralCode || `INF_${inf.id}`;

            for (const post of inf.posts) {
                for (const metric of post.metrics) {
                    const day = metric.snapshotDate.toISOString().split("T")[0];
                    if (!dailyMap.has(day)) {
                        dailyMap.set(day, {});
                    }
                    const dayData = dailyMap.get(day)!;
                    const postEmv = calculateEMV(
                        (metric.playCount ?? metric.views ?? 0)
                    );
                    dayData[key] = (dayData[key] || 0) + Math.round(postEmv);
                }
            }
        }

        // Sort daily map and build timeline
        const sortedDays = Array.from(dailyMap.entries()).sort(
            (a, b) => a[0].localeCompare(b[0])
        );

        const timeline = sortedDays.map(([date, values]) => ({
            date,
            ...values,
        }));

        // Sort summary by ROI descending
        summary.sort((a, b) => b.roi - a.roi);

        return NextResponse.json({
            timeline,
            summary,
            meta: {
                totalInvestment: summary.reduce((s, r) => s + r.investment, 0),
                totalEMV: summary.reduce((s, r) => s + r.emv, 0),
                cpmBenchmark: CPM_BENCHMARK,
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("Error calculating ROI:", error);
        return NextResponse.json(
            { error: "Error al calcular ROI" },
            { status: 500 }
        );
    }
}

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
    BOT_RATE_DEFAULT,
    computeScenariosWithMedian,
    computeScenarios,
    type ScenarioKey,
    type FormulaInputs,
    type FormulaResult,
} from "@/lib/roi";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const campaignId = searchParams.get("campaignId");
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        const urlTicket = searchParams.get("ticket");
        const urlMargin = searchParams.get("margin");
        const urlBotRate = searchParams.get("botRate");
        const useMedian = searchParams.get("useMedian") !== "false";

        // Load campaign defaults if campaign is specified
        let campaignDefaults: {
            ticketAverage: number | null;
            marginNet: number | null;
            botRate: number | null;
            conversionRate: number | null;
        } | null = null;

        const campaignIdNum = campaignId && campaignId !== "all" ? parseInt(campaignId) : null;
        if (campaignIdNum) {
            const campaign = await prisma.campaign.findUnique({
                where: { id: campaignIdNum },
                select: { ticketAverage: true, marginNet: true, botRate: true, conversionRate: true },
            });
            if (campaign) {
                campaignDefaults = {
                    ticketAverage: campaign.ticketAverage ? Number(campaign.ticketAverage) : null,
                    marginNet: campaign.marginNet ? Number(campaign.marginNet) : null,
                    botRate: campaign.botRate ?? null,
                    conversionRate: campaign.conversionRate ?? null,
                };
            }
        }

        const ticket = urlTicket ? parseFloat(urlTicket) : (campaignDefaults?.ticketAverage ?? 0);
        const margin = urlMargin ? parseFloat(urlMargin) : (campaignDefaults?.marginNet ?? 0);
        const botRate = urlBotRate ? parseFloat(urlBotRate) : (campaignDefaults?.botRate ?? BOT_RATE_DEFAULT);
        const conversionRateOverride = campaignDefaults?.conversionRate ?? null;

        if (ticket <= 0) {
            return NextResponse.json({ error: "El ticket promedio (ticket) es requerido y debe ser > 0. Configúralo en la campaña o ingrésalo manualmente." }, { status: 400 });
        }
        if (margin <= 0 || margin > 100) {
            return NextResponse.json({ error: "El margen de ganancia (margin) debe ser entre 1 y 100. Configúralo en la campaña o ingrésalo manualmente." }, { status: 400 });
        }

        const startDate = startDateParam ? new Date(startDateParam) : new Date(0);
        const endDate = endDateParam ? new Date(endDateParam) : new Date();

        const campaignFilter: Record<string, unknown> = {};
        if (campaignId && campaignId !== "all") {
            campaignFilter.campaignId = campaignIdNum;
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

        const formulaInputs: FormulaInputs = { ticket, margin, botRate };

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
            formula: FormulaResult | null;
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

            let totalViews = 0;
            let totalLikes = 0;
            let totalComments = 0;
            let totalShares = 0;
            let totalSaves = 0;
            const viewsPerPost: number[] = [];

            for (const post of inf.posts) {
                for (const metric of post.metrics) {
                    const views = metric.playCount ?? metric.views ?? 0;
                    totalViews += views;
                    totalLikes += metric.likes ?? 0;
                    totalComments += metric.commentCount ?? 0;
                    totalShares += metric.shares ?? 0;
                    totalSaves += metric.saves ?? 0;
                }
                const postViews = post.metrics.reduce(
                    (s, m) => s + (m.playCount ?? m.views ?? 0), 0
                );
                if (postViews > 0) viewsPerPost.push(postViews);
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

            const formula = ticket > 0 && margin > 0
                ? (useMedian && viewsPerPost.length > 0
                    ? computeScenariosWithMedian(viewsPerPost, investment, formulaInputs, conversionRateOverride)
                    : computeScenarios(totalViews, investment, formulaInputs, conversionRateOverride))
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
                formula,
            });

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

        const sortedDays = Array.from(dailyMap.entries()).sort(
            (a, b) => a[0].localeCompare(b[0])
        );

        const timeline = sortedDays.map(([date, values]) => ({
            date,
            ...values,
        }));

        summary.sort((a, b) => b.roi - a.roi);

        const scenarioKeys: ScenarioKey[] = ["conservative", "expected", "optimistic"];
        const scenarioTotals: Record<ScenarioKey, { totalQ: number; totalI: number; totalRoi: number; count: number }> = {
            conservative: { totalQ: 0, totalI: 0, totalRoi: 0, count: 0 },
            expected: { totalQ: 0, totalI: 0, totalRoi: 0, count: 0 },
            optimistic: { totalQ: 0, totalI: 0, totalRoi: 0, count: 0 },
        };

        for (const row of summary) {
            if (row.formula) {
                for (const key of scenarioKeys) {
                    const s = row.formula.scenarios[key];
                    scenarioTotals[key].totalQ += s.Q;
                    scenarioTotals[key].totalI += s.I;
                    scenarioTotals[key].totalRoi += s.roi;
                    scenarioTotals[key].count += 1;
                }
            }
        }

        const meta = {
            totalInvestment: summary.reduce((s, r) => s + r.investment, 0),
            totalEMV: summary.reduce((s, r) => s + r.emv, 0),
            cpmBenchmark: CPM_BENCHMARK,
            generatedAt: new Date().toISOString(),
            formulaInputs: {
                ticket,
                margin,
                botRate: Math.round(botRate * 100),
                conversionRate: conversionRateOverride,
                source: campaignDefaults
                    ? { ticket: urlTicket ? "user" : (campaignDefaults.ticketAverage ? "campaign" : "missing"),
                       margin: urlMargin ? "user" : (campaignDefaults.marginNet ? "campaign" : "missing"),
                       botRate: urlBotRate ? "user" : (campaignDefaults.botRate !== null ? "campaign" : "system"),
                       conversionRate: conversionRateOverride ? "campaign" : "scenario" }
                    : { ticket: "user", margin: "user", botRate: "user", conversionRate: "scenario" },
            },
            campaignDefaults,
            scenarioTotals: Object.fromEntries(
                scenarioKeys.map((key) => [
                    key,
                    {
                        totalQ: Math.round(scenarioTotals[key].totalQ * 100) / 100,
                        totalI: Math.round(scenarioTotals[key].totalI * 100) / 100,
                        avgRoi: scenarioTotals[key].count > 0
                            ? Math.round((scenarioTotals[key].totalRoi / scenarioTotals[key].count) * 100) / 100
                            : 0,
                    },
                ])
            ),
        };

        return NextResponse.json({ timeline, summary, meta });
    } catch (error) {
        console.error("Error calculating ROI:", error);
        return NextResponse.json(
            { error: "Error al calcular ROI" },
            { status: 500 }
        );
    }
}

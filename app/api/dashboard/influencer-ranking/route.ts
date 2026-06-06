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

    const baseDummyRankings: InfluencerRanking[] = [
        {
            id: 1,
            name: "María García",
            email: "maria@example.com",
            niche: "Beauty & Lifestyle",
            rank: 1,
            totalViews: 450000,
            totalEngagement: 7.5,
            totalConversions: 1250,
            totalRevenue: 187500,
            engagementRate: 7.5,
            roi: 68.5,
        },
        {
            id: 2,
            name: "Carlos Rodríguez",
            email: "carlos@example.com",
            niche: "Tech & Gadgets",
            rank: 2,
            totalViews: 380000,
            totalEngagement: 6.8,
            totalConversions: 1050,
            totalRevenue: 157500,
            engagementRate: 6.8,
            roi: 55.2,
        },
        {
            id: 3,
            name: "Ana Martínez",
            email: "ana@example.com",
            niche: "Fitness & Wellness",
            rank: 3,
            totalViews: 320000,
            totalEngagement: 8.2,
            totalConversions: 980,
            totalRevenue: 147000,
            engagementRate: 8.2,
            roi: 62.3,
        },
        {
            id: 4,
            name: "Luis Fernández",
            email: "luis@example.com",
            niche: "Travel & Adventure",
            rank: 4,
            totalViews: 290000,
            totalEngagement: 6.5,
            totalConversions: 850,
            totalRevenue: 127500,
            engagementRate: 6.5,
            roi: 48.7,
        },
        {
            id: 5,
            name: "Sofia Pérez",
            email: "sofia@example.com",
            niche: "Fashion & Style",
            rank: 5,
            totalViews: 270000,
            totalEngagement: 7.1,
            totalConversions: 780,
            totalRevenue: 117000,
            engagementRate: 7.1,
            roi: 52.4,
        },
        {
            id: 6,
            name: "Diego Morales",
            email: "diego@example.com",
            niche: "Food & Cooking",
            rank: 6,
            totalViews: 240000,
            totalEngagement: 6.2,
            totalConversions: 720,
            totalRevenue: 108000,
            engagementRate: 6.2,
            roi: 45.1,
        },
        {
            id: 7,
            name: "Valentina Ruiz",
            email: "valentina@example.com",
            niche: "Music & Entertainment",
            rank: 7,
            totalViews: 260000,
            totalEngagement: 7.8,
            totalConversions: 840,
            totalRevenue: 126000,
            engagementRate: 7.8,
            roi: 57.3,
        },
        {
            id: 8,
            name: "Andrés Sánchez",
            email: "andres@example.com",
            niche: "Sports & Fitness",
            rank: 8,
            totalViews: 300000,
            totalEngagement: 6.9,
            totalConversions: 910,
            totalRevenue: 136500,
            engagementRate: 6.9,
            roi: 49.8,
        },
        {
            id: 9,
            name: "Laura Castillo",
            email: "laura@example.com",
            niche: "Travel & Lifestyle",
            rank: 9,
            totalViews: 210000,
            totalEngagement: 5.9,
            totalConversions: 640,
            totalRevenue: 96000,
            engagementRate: 5.9,
            roi: 40.4,
        },
        {
            id: 10,
            name: "Miguel Torres",
            email: "miguel@example.com",
            niche: "Gaming & Streaming",
            rank: 10,
            totalViews: 275000,
            totalEngagement: 8.5,
            totalConversions: 990,
            totalRevenue: 148500,
            engagementRate: 8.5,
            roi: 63.7,
        },
    ];

    // Si no hay DATABASE_URL, devolver ranking dummy (modo demo), pero
    // hacerlo sensible a la campaña seleccionada y mezclar el orden para que se vea dinámico.
    if (!process.env.DATABASE_URL) {
        // Sin campaña: devolver el ranking base
        if (!campaignId || campaignId === "all") {
            return NextResponse.json({ data: baseDummyRankings.slice(0, limit) });
        }

        const cid = parseInt(campaignId);
        const seed = isNaN(cid) ? 1 : cid;

        // Ajustar métricas por campaña para simular diferencias de performance
        const adjusted = baseDummyRankings.map((inf, index) => {
            // Pseudo random determinista basado en campaña + índice
            const rand = Math.abs(Math.sin(seed * 1000 + index * 97 + inf.id * 31)); // 0..1 aprox
            const factor = 0.85 + rand * 0.4; // 0.85 – 1.25 aprox

            const totalViews = Math.round(inf.totalViews * factor);
            const totalConversions = Math.round(inf.totalConversions * (factor * 0.9));
            const totalRevenue = Math.round(inf.totalRevenue * (factor * 0.95));
            const engagementRate = Number((inf.engagementRate * (0.9 + factor * 0.1)).toFixed(1));
            const roi = Number((inf.roi * (0.9 + factor * 0.1)).toFixed(1));

            return {
                ...inf,
                totalViews,
                totalConversions,
                totalRevenue,
                engagementRate,
                totalEngagement: engagementRate,
                roi,
            };
        });

        // Reordenar según score ponderado por un componente pseudoaleatorio
        // para que el orden cambie entre campañas (incluida María García)
        const ranked = adjusted
            .sort((a, b) => {
                const baseScoreA = a.totalViews * 0.3 + a.engagementRate * 100 + a.totalConversions * 10;
                const baseScoreB = b.totalViews * 0.3 + b.engagementRate * 100 + b.totalConversions * 10;

                const randA = Math.abs(Math.sin(seed * 17 + a.id * 13)); // 0..1
                const randB = Math.abs(Math.sin(seed * 17 + b.id * 13)); // 0..1

                const scoreA = baseScoreA * randA;
                const scoreB = baseScoreB * randB;

                return scoreB - scoreA;
            })
            .map((item, index) => ({
                ...item,
                rank: index + 1,
            }))
            .slice(0, limit);

        return NextResponse.json({ data: ranked });
    }

    try {
        // Construir filtros
        interface PostWhere {
            campaignId?: number;
            socialPlatformId?: number;
            OR?: Array<{ socialPlatformId: number }>;
        }

        const postWhere: PostWhere = {};

        // Filtro por campaña
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
                // Usar OR para múltiples plataformas
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

        // Obtener influencers con sus métricas
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

        // Calcular ranking
        const rankings: InfluencerRanking[] = influencers
            .map((influencer) => {
                // Obtener todos los snapshots de métricas del influencer
                const allMetrics = influencer.posts.flatMap((post) => post.metrics);

                // Si hay filtro por plataforma múltiple, filtrar
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

                // Calcular costo total del influencer (suma de agreedCost en campañas)
                const totalCost = influencer.influencerCampaigns.reduce((sum, ic) => sum + (ic.agreedCost ? Number(ic.agreedCost) : 0), 0);

                const roi = calculateROI(aggregated.total.revenue, totalCost || 1);

                return {
                    id: influencer.id,
                    name: influencer.name,
                    email: influencer.email,
                    niche: influencer.niche,
                    rank: 0, // Se asignará después del sort
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
                // Ordenar por una combinación de métricas (puntuación compuesta)
                const scoreA = a.totalViews * 0.3 + a.engagementRate * 100 + a.totalConversions * 10;
                const scoreB = b.totalViews * 0.3 + b.engagementRate * 100 + b.totalConversions * 10;
                return scoreB - scoreA;
            })
            .map((item, index) => ({
                ...item,
                rank: index + 1,
            }))
            .slice(0, limit);

        // Si no hay datos, generar datos dummy
        if (rankings.length === 0) {
            const dummyRankings: InfluencerRanking[] = [
                {
                    id: 1,
                    name: "María García",
                    email: "maria@example.com",
                    niche: "Beauty & Lifestyle",
                    rank: 1,
                    totalViews: 450000,
                    totalEngagement: 7.5,
                    totalConversions: 1250,
                    totalRevenue: 187500,
                    engagementRate: 7.5,
                    roi: 68.5,
                },
                {
                    id: 2,
                    name: "Carlos Rodríguez",
                    email: "carlos@example.com",
                    niche: "Tech & Gadgets",
                    rank: 2,
                    totalViews: 380000,
                    totalEngagement: 6.8,
                    totalConversions: 1050,
                    totalRevenue: 157500,
                    engagementRate: 6.8,
                    roi: 55.2,
                },
                {
                    id: 3,
                    name: "Ana Martínez",
                    email: "ana@example.com",
                    niche: "Fitness & Wellness",
                    rank: 3,
                    totalViews: 320000,
                    totalEngagement: 8.2,
                    totalConversions: 980,
                    totalRevenue: 147000,
                    engagementRate: 8.2,
                    roi: 62.3,
                },
                {
                    id: 4,
                    name: "Luis Fernández",
                    email: "luis@example.com",
                    niche: "Travel & Adventure",
                    rank: 4,
                    totalViews: 290000,
                    totalEngagement: 6.5,
                    totalConversions: 850,
                    totalRevenue: 127500,
                    engagementRate: 6.5,
                    roi: 48.7,
                },
                {
                    id: 5,
                    name: "Sofia Pérez",
                    email: "sofia@example.com",
                    niche: "Fashion & Style",
                    rank: 5,
                    totalViews: 270000,
                    totalEngagement: 7.1,
                    totalConversions: 780,
                    totalRevenue: 117000,
                    engagementRate: 7.1,
                    roi: 52.4,
                },
            ];
            return NextResponse.json({ data: dummyRankings });
        }

        return NextResponse.json({ data: rankings });
    } catch (error) {
        console.error("Error fetching influencer ranking:", error);

        // Retornar datos dummy en caso de error
        return NextResponse.json({ data: baseDummyRankings.slice(0, limit) });
    }
}

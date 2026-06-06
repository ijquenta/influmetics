import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const postId = searchParams.get("postId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const where: any = {};

        if (postId) {
            where.postId = parseInt(postId);
        }

        if (startDate || endDate) {
            where.snapshotDate = {};
            if (startDate) {
                where.snapshotDate.gte = new Date(startDate);
            }
            if (endDate) {
                where.snapshotDate.lte = new Date(endDate);
            }
        }

        const metrics = await prisma.postMetricSnapshot.findMany({
            where,
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
                snapshotDate: "desc",
            },
        });

        return NextResponse.json({ data: metrics });
    } catch (error) {
        console.error("Error fetching metrics:", error);
        return NextResponse.json({ error: "Error al obtener métricas" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { postId, snapshotDate, views, likes, shares, clicks, conversions, revenue, roi } = body;

        // Si ya existe un snapshot para esta fecha y post, actualizar
        const existing = await prisma.postMetricSnapshot.findUnique({
            where: {
                postId_snapshotDate: {
                    postId: parseInt(postId),
                    snapshotDate: new Date(snapshotDate),
                },
            },
        });

        let metric;

        if (existing) {
            metric = await prisma.postMetricSnapshot.update({
                where: { id: existing.id },
                data: {
                    views: views !== undefined ? views : existing.views,
                    likes: likes !== undefined ? likes : existing.likes,
                    shares: shares !== undefined ? shares : existing.shares,
                    clicks: clicks !== undefined ? clicks : existing.clicks,
                    conversions: conversions !== undefined ? conversions : existing.conversions,
                    revenue: revenue !== undefined ? new Decimal(revenue) : existing.revenue,
                    roi: roi !== undefined ? new Decimal(roi) : existing.roi,
                },
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
        } else {
            metric = await prisma.postMetricSnapshot.create({
                data: {
                    postId: parseInt(postId),
                    snapshotDate: new Date(snapshotDate),
                    views: views || null,
                    likes: likes || null,
                    shares: shares || null,
                    clicks: clicks || null,
                    conversions: conversions || null,
                    revenue: revenue !== undefined ? new Decimal(revenue) : null,
                    roi: roi !== undefined ? new Decimal(roi) : null,
                },
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
        }

        return NextResponse.json({ data: metric }, { status: existing ? 200 : 201 });
    } catch (error) {
        console.error("Error creating/updating metric:", error);
        return NextResponse.json({ error: "Error al guardar métrica" }, { status: 500 });
    }
}

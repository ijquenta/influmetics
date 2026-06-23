import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const postId = searchParams.get("postId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const where: Prisma.PostMetricSnapshotWhereInput = {};

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

        const metric = await prisma.postMetricSnapshot.upsert({
            where: {
                postId_snapshotDate: {
                    postId: parseInt(postId),
                    snapshotDate: new Date(snapshotDate),
                },
            },
            create: {
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
            update: {
                views: views !== undefined ? views : undefined,
                likes: likes !== undefined ? likes : undefined,
                shares: shares !== undefined ? shares : undefined,
                clicks: clicks !== undefined ? clicks : undefined,
                conversions: conversions !== undefined ? conversions : undefined,
                revenue: revenue !== undefined ? new Decimal(revenue) : undefined,
                roi: roi !== undefined ? new Decimal(roi) : undefined,
            },
        });

        return NextResponse.json({ data: metric }, { status: 200 });
    } catch (error) {
        console.error("Error upserting metric:", error);
        return NextResponse.json({ error: "Error al guardar métrica" }, { status: 500 });
    }
}

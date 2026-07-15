import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { metrics } = body;

        if (!Array.isArray(metrics) || metrics.length === 0) {
            return NextResponse.json({ error: "Se requiere un array de métricas" }, { status: 400 });
        }

        const results = await prisma.$transaction(
            metrics.map((metric) => {
                const { postId, snapshotDate, views, likes, shares, clicks, conversions, revenue, roi } = metric;
                return prisma.postMetricSnapshot.upsert({
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
            })
        );

        return NextResponse.json({
            data: results,
            summary: {
                total: metrics.length,
                successful: results.length,
                failed: 0,
            },
        });
    } catch (error) {
        console.error("Error creating bulk metrics:", error);
        return NextResponse.json({ error: "Error al guardar métricas" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { metrics } = body; // Array de métricas

        if (!Array.isArray(metrics) || metrics.length === 0) {
            return NextResponse.json({ error: "Se requiere un array de métricas" }, { status: 400 });
        }

        const results = [];

        for (const metric of metrics) {
            const { postId, snapshotDate, views, likes, shares, clicks, conversions, revenue, roi } = metric;

            try {
                // Verificar si ya existe
                const existing = await prisma.postMetricSnapshot.findUnique({
                    where: {
                        postId_snapshotDate: {
                            postId: parseInt(postId),
                            snapshotDate: new Date(snapshotDate),
                        },
                    },
                });

                let result;

                if (existing) {
                    result = await prisma.postMetricSnapshot.update({
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
                    });
                } else {
                    result = await prisma.postMetricSnapshot.create({
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
                    });
                }

                results.push({ success: true, data: result });
            } catch (error) {
                results.push({
                    success: false,
                    error: error instanceof Error ? error.message : "Error desconocido",
                });
            }
        }

        return NextResponse.json({
            data: results,
            summary: {
                total: metrics.length,
                successful: results.filter((r) => r.success).length,
                failed: results.filter((r) => !r.success).length,
            },
        });
    } catch (error) {
        console.error("Error creating bulk metrics:", error);
        return NextResponse.json({ error: "Error al guardar métricas" }, { status: 500 });
    }
}

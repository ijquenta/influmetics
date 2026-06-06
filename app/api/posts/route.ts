import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const influencerId = searchParams.get("influencerId");
        const campaignId = searchParams.get("campaignId");
        const socialPlatformId = searchParams.get("socialPlatformId");
        const isTakenosContent = searchParams.get("isTakenosContent");

        const where: any = {};

        if (influencerId) {
            where.influencerId = parseInt(influencerId);
        }

        if (campaignId) {
            where.campaignId = parseInt(campaignId);
        }

        if (socialPlatformId) {
            where.socialPlatformId = parseInt(socialPlatformId);
        }

        if (isTakenosContent !== null) {
            where.isTakenosContent = isTakenosContent === "true";
        }

        const posts = await prisma.post.findMany({
            where,
            include: {
                influencer: true,
                campaign: true,
                socialPlatform: true,
                contentType: true,
                metrics: {
                    orderBy: {
                        snapshotDate: "desc",
                    },
                },
            },
            orderBy: {
                publishedAt: "desc",
            },
        });

        return NextResponse.json({ data: posts });
    } catch (error) {
        console.error("Error fetching posts:", error);
        return NextResponse.json({ error: "Error al obtener posts" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { influencerId, campaignId, socialPlatformId, contentTypeId, url, caption, publishedAt, isTakenosContent } = body;

        const post = await prisma.post.create({
            data: {
                influencerId: parseInt(influencerId),
                campaignId: campaignId ? parseInt(campaignId) : null,
                socialPlatformId: parseInt(socialPlatformId),
                contentTypeId: contentTypeId ? parseInt(contentTypeId) : null,
                url,
                caption,
                publishedAt: new Date(publishedAt),
                isTakenosContent: isTakenosContent || false,
            },
            include: {
                influencer: true,
                campaign: true,
                socialPlatform: true,
                contentType: true,
            },
        });

        return NextResponse.json({ data: post }, { status: 201 });
    } catch (error) {
        console.error("Error creating post:", error);
        return NextResponse.json({ error: "Error al crear post" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const isActive = searchParams.get("isActive");
    const country = searchParams.get("country");

    try {
        const where: any = {};

        if (id) {
            const idNum = parseInt(id);
            if (!isNaN(idNum)) {
                where.id = idNum;
            }
        }

        if (isActive !== null) {
            where.isActive = isActive === "true";
        }

        if (country) {
            where.country = country;
        }

        const campaigns = await prisma.campaign.findMany({
            where,
            include: {
                primaryGoalType: true,
                influencerCampaigns: {
                    include: {
                        influencer: true,
                    },
                },
                _count: {
                    select: {
                        influencerCampaigns: true,
                        posts: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({ data: campaigns });
    } catch (error) {
        console.error("Error fetching campaigns:", error);
        return NextResponse.json({ error: "Error al obtener campañas" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, country, startDate, endDate, isActive, primaryGoalTypeId } = body;

        const campaign = await prisma.campaign.create({
            data: {
                name,
                description,
                country,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                isActive: isActive !== undefined ? isActive : true,
                primaryGoalTypeId: primaryGoalTypeId ? parseInt(primaryGoalTypeId) : null,
            },
            include: {
                primaryGoalType: true,
                _count: {
                    select: {
                        influencerCampaigns: true,
                        posts: true,
                    },
                },
            },
        });

        return NextResponse.json({ data: campaign }, { status: 201 });
    } catch (error) {
        console.error("Error creating campaign:", error);
        return NextResponse.json({ error: "Error al crear campaña" }, { status: 500 });
    }
}


import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Datos dummy de campañas para modo demo (sin BD)
const dummyCampaigns = [
    {
        id: 1,
        name: "Lanzamiento Takenos Bolivia",
        description: "Campaña de lanzamiento de la plataforma Takenos en Bolivia con creadores clave.",
        country: "BO",
        startDate: new Date("2025-01-05").toISOString(),
        endDate: new Date("2025-02-05").toISOString(),
        isActive: true,
        primaryGoalType: { code: "AWARENESS", name: "Awareness / Alcance" },
        influencerCampaigns: [],
        posts: [],
        _count: {
            influencerCampaigns: 8,
            posts: 42,
        },
    },
    {
        id: 2,
        name: "Performance Q1 Ecommerce",
        description: "Campaña always-on para performance en e-commerce con foco en conversiones.",
        country: "BO",
        startDate: new Date("2025-01-01").toISOString(),
        endDate: new Date("2025-03-31").toISOString(),
        isActive: true,
        primaryGoalType: { code: "CONVERSIONS", name: "Conversiones" },
        influencerCampaigns: [],
        posts: [],
        _count: {
            influencerCampaigns: 12,
            posts: 68,
        },
    },
    {
        id: 3,
        name: "Branding Takenos Latam",
        description: "Construcción de marca en mercados clave de Latam.",
        country: "MX",
        startDate: new Date("2024-11-01").toISOString(),
        endDate: new Date("2025-01-31").toISOString(),
        isActive: false,
        primaryGoalType: { code: "BRANDING", name: "Branding" },
        influencerCampaigns: [],
        posts: [],
        _count: {
            influencerCampaigns: 15,
            posts: 95,
        },
    },
];

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const isActive = searchParams.get("isActive");
    const country = searchParams.get("country");

    // Modo demo: si no hay DATABASE_URL, siempre responder con dummy
    if (!process.env.DATABASE_URL) {
        let data = [...dummyCampaigns];

        if (id) {
            const idNum = parseInt(id);
            if (!isNaN(idNum)) {
                data = data.filter((c) => c.id === idNum);
            }
        }

        if (isActive !== null) {
            const active = isActive === "true";
            data = data.filter((c) => c.isActive === active);
        }

        if (country) {
            data = data.filter((c) => c.country === country);
        }

        return NextResponse.json({ data });
    }

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

        // Si la BD no tiene campañas, usar dummy como fallback
        if (campaigns.length === 0) {
            let data = [...dummyCampaigns];

            if (isActive !== null) {
                const active = isActive === "true";
                data = data.filter((c) => c.isActive === active);
            }

            if (country) {
                data = data.filter((c) => c.country === country);
            }

            return NextResponse.json({ data });
        }

        return NextResponse.json({ data: campaigns });
    } catch (error) {
        console.error("Error fetching campaigns:", error);
        // En caso de error, devolver dummy
        let data = [...dummyCampaigns];

        if (isActive !== null) {
            const active = isActive === "true";
            data = data.filter((c) => c.isActive === active);
        }

        if (country) {
            data = data.filter((c) => c.country === country);
        }

        return NextResponse.json({ data });
    }
}

export async function POST(request: NextRequest) {
    // En modo demo sin BD, bloquear creación real
    if (!process.env.DATABASE_URL) {
        return NextResponse.json(
            {
                error: "Modo demo: la creación de campañas no está disponible sin base de datos.",
            },
            { status: 501 }
        );
    }

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

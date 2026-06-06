import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Datos dummy de influencers (modo demo / sin BD)
const dummyInfluencers = [
    {
        id: 1,
        name: "María García",
        email: "maria@example.com",
        niche: "Beauty & Lifestyle",
        referralCode: "MARIA2025",
    },
    {
        id: 2,
        name: "Carlos Rodríguez",
        email: "carlos@example.com",
        niche: "Tech & Gadgets",
        referralCode: "CARLOS2025",
    },
    {
        id: 3,
        name: "Ana Martínez",
        email: "ana@example.com",
        niche: "Fitness & Wellness",
        referralCode: "ANA2025",
    },
    {
        id: 4,
        name: "Luis Fernández",
        email: "luis@example.com",
        niche: "Travel & Adventure",
        referralCode: "LUIS2025",
    },
    {
        id: 5,
        name: "Sofia Pérez",
        email: "sofia@example.com",
        niche: "Fashion & Style",
        referralCode: "SOFIA2025",
    },
    {
        id: 6,
        name: "Diego Morales",
        email: "diego@example.com",
        niche: "Food & Cooking",
        referralCode: "DIEGO2025",
    },
    {
        id: 7,
        name: "Valentina Ruiz",
        email: "valentina@example.com",
        niche: "Music & Entertainment",
        referralCode: "VALEN2025",
    },
    {
        id: 8,
        name: "Andrés Sánchez",
        email: "andres@example.com",
        niche: "Sports & Fitness",
        referralCode: "ANDRES2025",
    },
];

function filterDummyInfluencers(search: string | null, niche: string | null) {
    let filteredDummy = dummyInfluencers;

    if (search) {
        const s = search.toLowerCase();
        filteredDummy = filteredDummy.filter(
            (inf) =>
                inf.name.toLowerCase().includes(s) || inf.email?.toLowerCase().includes(s) || inf.referralCode?.toLowerCase().includes(s)
        );
    }

    if (niche) {
        filteredDummy = filteredDummy.filter((inf) => inf.niche === niche);
    }

    return filteredDummy;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search");
    const niche = searchParams.get("niche");

    // Si no hay DATABASE_URL, responder siempre con dummy filtrado y no tocar Prisma
    if (!process.env.DATABASE_URL) {
        const filteredDummy = filterDummyInfluencers(search, niche);
        return NextResponse.json({ data: filteredDummy });
    }

    try {
        const where: Prisma.InfluencerWhereInput = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { referralCode: { contains: search, mode: "insensitive" } },
            ];
        }

        if (niche) {
            where.niche = niche;
        }

        const influencers = await prisma.influencer.findMany({
            where,
            include: {
                socialAccounts: {
                    include: {
                        socialPlatform: true,
                    },
                },
                influencerCampaigns: {
                    include: {
                        campaign: true,
                    },
                },
                _count: {
                    select: {
                        posts: true,
                        influencerCampaigns: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Si no hay influencers en la BD, retornar datos dummy
        if (influencers.length === 0) {
            let filteredDummy = dummyInfluencers;

            if (search) {
                filteredDummy = dummyInfluencers.filter(
                    (inf) =>
                        inf.name.toLowerCase().includes(search.toLowerCase()) ||
                        inf.email?.toLowerCase().includes(search.toLowerCase()) ||
                        inf.referralCode?.toLowerCase().includes(search.toLowerCase())
                );
            }

            if (niche) {
                filteredDummy = filteredDummy.filter((inf) => inf.niche === niche);
            }

            return NextResponse.json({ data: filteredDummy });
        }

        return NextResponse.json({ data: influencers });
    } catch (error) {
        console.error("Error fetching influencers:", error);
        // En caso de error, retornar datos dummy filtrados
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get("search");
        const niche = searchParams.get("niche");
        const filteredDummy = filterDummyInfluencers(search, niche);
        return NextResponse.json({ data: filteredDummy });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, birthDate, niche, referralCode, socialAccounts } = body;

        // Validaciones básicas
        if (!name || !name.trim()) {
            return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
        }

        // Validar que no haya emails duplicados (si se proporciona email)
        // Usamos findFirst porque el email no es clave única en el esquema actual
        if (email && email.trim()) {
            const existingInfluencer = await prisma.influencer.findFirst({
                where: { email: email.trim() },
            });

            if (existingInfluencer) {
                return NextResponse.json({ error: "Ya existe un influencer con este email" }, { status: 400 });
            }
        }

        // Validar que no haya códigos de referido duplicados (si se proporciona)
        if (referralCode && referralCode.trim()) {
            const existingReferral = await prisma.influencer.findFirst({
                where: { referralCode: referralCode.trim() },
            });

            if (existingReferral) {
                return NextResponse.json({ error: "Ya existe un influencer con este código de referido" }, { status: 400 });
            }
        }

        // Validar cuentas de redes sociales
        if (socialAccounts && Array.isArray(socialAccounts)) {
            // Verificar que no haya plataformas duplicadas
            const platformIds = socialAccounts.map((acc: { socialPlatformId: number }) => acc.socialPlatformId);
            const uniquePlatformIds = new Set(platformIds);

            if (platformIds.length !== uniquePlatformIds.size) {
                return NextResponse.json({ error: "No puedes agregar la misma plataforma social dos veces" }, { status: 400 });
            }

            // Verificar que todas las plataformas existan
            const validPlatformIds = await prisma.socialPlatform.findMany({
                where: {
                    id: {
                        in: platformIds.map((id: number) => parseInt(id.toString())),
                    },
                },
            });

            if (validPlatformIds.length !== platformIds.length) {
                return NextResponse.json({ error: "Una o más plataformas sociales no son válidas" }, { status: 400 });
            }

            // Verificar handles duplicados por plataforma
            for (const account of socialAccounts) {
                const existingAccount = await prisma.influencerSocialAccount.findFirst({
                    where: {
                        socialPlatformId: parseInt(account.socialPlatformId.toString()),
                        handle: account.handle.replace("@", "").trim(),
                    },
                });

                if (existingAccount) {
                    return NextResponse.json(
                        {
                            error: `El handle "${account.handle}" ya está registrado para esta plataforma`,
                        },
                        { status: 400 }
                    );
                }
            }
        }

        // Crear influencer con sus cuentas sociales usando transacción
        const influencer = await prisma.$transaction(async (tx) => {
            // Crear el influencer
            const newInfluencer = await tx.influencer.create({
                data: {
                    name: name.trim(),
                    email: email && email.trim() ? email.trim() : null,
                    birthDate: birthDate ? new Date(birthDate) : null,
                    niche: niche && niche.trim() ? niche.trim() : null,
                    referralCode: referralCode && referralCode.trim() ? referralCode.trim() : null,
                },
            });

            // Crear las cuentas de redes sociales si se proporcionaron
            if (socialAccounts && Array.isArray(socialAccounts) && socialAccounts.length > 0) {
                const validAccounts = socialAccounts
                    .filter(
                        (acc: { socialPlatformId: number; handle: string; profileUrl?: string | null; isActive?: boolean }) =>
                            acc.socialPlatformId && acc.handle && acc.handle.trim()
                    )
                    .map((acc: { socialPlatformId: number; handle: string; profileUrl?: string | null; isActive?: boolean }) => ({
                        influencerId: newInfluencer.id,
                        socialPlatformId: parseInt(acc.socialPlatformId.toString()),
                        handle: acc.handle.replace("@", "").trim(),
                        profileUrl: acc.profileUrl && acc.profileUrl.trim() ? acc.profileUrl.trim() : null,
                        isActive: acc.isActive !== undefined ? acc.isActive : true,
                    }));

                if (validAccounts.length > 0) {
                    await tx.influencerSocialAccount.createMany({
                        data: validAccounts,
                    });
                }
            }

            // Retornar el influencer con todas sus relaciones
            return await tx.influencer.findUnique({
                where: { id: newInfluencer.id },
                include: {
                    socialAccounts: {
                        include: {
                            socialPlatform: true,
                        },
                    },
                    _count: {
                        select: {
                            posts: true,
                            influencerCampaigns: true,
                        },
                    },
                },
            });
        });

        return NextResponse.json({ data: influencer }, { status: 201 });
    } catch (error: unknown) {
        console.error("Error creating influencer:", error);

        // Manejar errores específicos de Prisma
        if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002") {
            return NextResponse.json({ error: "Ya existe un registro con estos datos únicos" }, { status: 400 });
        }

        const message =
            typeof error === "object" && error !== null && "message" in error && typeof (error as { message?: string }).message === "string"
                ? (error as { message?: string }).message
                : "Error al crear influencer";

        return NextResponse.json({ error: message }, { status: 500 });
    }
}

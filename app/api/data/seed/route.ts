import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

export async function POST() {
    try {
        // Limpiar datos existentes (opcional - solo para desarrollo)
        await prisma.postMetricSnapshot.deleteMany();
        await prisma.post.deleteMany();
        await prisma.influencerCampaign.deleteMany();
        await prisma.internalMetric.deleteMany();
        await prisma.campaign.deleteMany();
        await prisma.influencerSocialAccount.deleteMany();
        await prisma.influencer.deleteMany();

        // Crear tipos de usuario (para uso futuro)
        await prisma.userType.upsert({
            where: { code: "growth_manager" },
            update: {},
            create: {
                code: "growth_manager",
                name: "Growth Manager",
            },
        });

        // Crear plataformas sociales
        const tiktok = await prisma.socialPlatform.upsert({
            where: { code: "tiktok" },
            update: {},
            create: {
                code: "tiktok",
                name: "TikTok",
            },
        });

        const instagram = await prisma.socialPlatform.upsert({
            where: { code: "instagram" },
            update: {},
            create: {
                code: "instagram",
                name: "Instagram",
            },
        });

        const youtube = await prisma.socialPlatform.upsert({
            where: { code: "youtube" },
            update: {},
            create: {
                code: "youtube",
                name: "YouTube",
            },
        });

        const x = await prisma.socialPlatform.upsert({
            where: { code: "x" },
            update: {},
            create: {
                code: "x",
                name: "X (Twitter)",
            },
        });

        // Crear tipos de contenido
        const videoType = await prisma.contentType.upsert({
            where: { code: "video" },
            update: {},
            create: {
                code: "video",
                name: "Video",
            },
        });

        const reelType = await prisma.contentType.upsert({
            where: { code: "reel" },
            update: {},
            create: {
                code: "reel",
                name: "Reel",
            },
        });

        // Story type para uso futuro
        await prisma.contentType.upsert({
            where: { code: "story" },
            update: {},
            create: {
                code: "story",
                name: "Story",
            },
        });

        // Crear tipos de métricas internas (para uso futuro)
        await prisma.internalMetricType.upsert({
            where: { code: "NUA" },
            update: {},
            create: {
                code: "NUA",
                name: "Nuevos Usuarios Activados",
                description: "Usuarios nuevos que se activaron",
            },
        });

        // Crear tipos de objetivos de campaña
        const awarenessGoal = await prisma.campaignGoalType.upsert({
            where: { code: "awareness" },
            update: {},
            create: {
                code: "awareness",
                name: "Awareness",
            },
        });

        const acquisitionGoal = await prisma.campaignGoalType.upsert({
            where: { code: "acquisition" },
            update: {},
            create: {
                code: "acquisition",
                name: "Adquisición",
            },
        });

        // Crear influencers
        const influencer1 = await prisma.influencer.create({
            data: {
                name: "María García",
                email: "maria@example.com",
                birthDate: new Date("1995-05-15"),
                niche: "Beauty & Lifestyle",
                referralCode: "MARIA2025",
            },
        });

        const influencer2 = await prisma.influencer.create({
            data: {
                name: "Carlos Rodríguez",
                email: "carlos@example.com",
                birthDate: new Date("1992-08-20"),
                niche: "Tech & Gadgets",
                referralCode: "CARLOS2025",
            },
        });

        const influencer3 = await prisma.influencer.create({
            data: {
                name: "Ana Martínez",
                email: "ana@example.com",
                birthDate: new Date("1998-03-10"),
                niche: "Fitness & Wellness",
                referralCode: "ANA2025",
            },
        });

        const influencer4 = await prisma.influencer.create({
            data: {
                name: "Luis Fernández",
                email: "luis@example.com",
                birthDate: new Date("1990-11-25"),
                niche: "Travel & Adventure",
                referralCode: "LUIS2025",
            },
        });

        const influencer5 = await prisma.influencer.create({
            data: {
                name: "Sofia Pérez",
                email: "sofia@example.com",
                birthDate: new Date("1996-07-08"),
                niche: "Fashion & Style",
                referralCode: "SOFIA2025",
            },
        });

        const influencer6 = await prisma.influencer.create({
            data: {
                name: "Diego Morales",
                email: "diego@example.com",
                birthDate: new Date("1993-02-14"),
                niche: "Food & Cooking",
                referralCode: "DIEGO2025",
            },
        });

        const influencer7 = await prisma.influencer.create({
            data: {
                name: "Valentina Ruiz",
                email: "valentina@example.com",
                birthDate: new Date("1997-09-30"),
                niche: "Music & Entertainment",
                referralCode: "VALEN2025",
            },
        });

        const influencer8 = await prisma.influencer.create({
            data: {
                name: "Andrés Sánchez",
                email: "andres@example.com",
                birthDate: new Date("1994-12-05"),
                niche: "Sports & Fitness",
                referralCode: "ANDRES2025",
            },
        });

        // Crear cuentas sociales
        await prisma.influencerSocialAccount.create({
            data: {
                influencerId: influencer1.id,
                socialPlatformId: tiktok.id,
                handle: "@mariagarcia",
                profileUrl: "https://tiktok.com/@mariagarcia",
                isActive: true,
            },
        });

        await prisma.influencerSocialAccount.create({
            data: {
                influencerId: influencer1.id,
                socialPlatformId: instagram.id,
                handle: "@mariagarcia_",
                profileUrl: "https://instagram.com/mariagarcia_",
                isActive: true,
            },
        });

        await prisma.influencerSocialAccount.create({
            data: {
                influencerId: influencer2.id,
                socialPlatformId: tiktok.id,
                handle: "@carlosrodriguez",
                profileUrl: "https://tiktok.com/@carlosrodriguez",
                isActive: true,
            },
        });

        await prisma.influencerSocialAccount.create({
            data: {
                influencerId: influencer2.id,
                socialPlatformId: instagram.id,
                handle: "@carlosrodriguez_tech",
                profileUrl: "https://instagram.com/carlosrodriguez_tech",
                isActive: true,
            },
        });

        await prisma.influencerSocialAccount.create({
            data: {
                influencerId: influencer3.id,
                socialPlatformId: instagram.id,
                handle: "@anamartinez",
                profileUrl: "https://instagram.com/anamartinez",
                isActive: true,
            },
        });

        await prisma.influencerSocialAccount.create({
            data: {
                influencerId: influencer3.id,
                socialPlatformId: tiktok.id,
                handle: "@anamartinezfit",
                profileUrl: "https://tiktok.com/@anamartinezfit",
                isActive: true,
            },
        });

        await prisma.influencerSocialAccount.create({
            data: {
                influencerId: influencer4.id,
                socialPlatformId: tiktok.id,
                handle: "@luisviajero",
                profileUrl: "https://tiktok.com/@luisviajero",
                isActive: true,
            },
        });

        await prisma.influencerSocialAccount.create({
            data: {
                influencerId: influencer4.id,
                socialPlatformId: instagram.id,
                handle: "@luisviajero",
                profileUrl: "https://instagram.com/luisviajero",
                isActive: true,
            },
        });

        await prisma.influencerSocialAccount.create({
            data: {
                influencerId: influencer5.id,
                socialPlatformId: instagram.id,
                handle: "@sofiafashion",
                profileUrl: "https://instagram.com/sofiafashion",
                isActive: true,
            },
        });

        await prisma.influencerSocialAccount.create({
            data: {
                influencerId: influencer6.id,
                socialPlatformId: tiktok.id,
                handle: "@diegococina",
                profileUrl: "https://tiktok.com/@diegococina",
                isActive: true,
            },
        });

        await prisma.influencerSocialAccount.create({
            data: {
                influencerId: influencer7.id,
                socialPlatformId: tiktok.id,
                handle: "@valentinamusic",
                profileUrl: "https://tiktok.com/@valentinamusic",
                isActive: true,
            },
        });

        await prisma.influencerSocialAccount.create({
            data: {
                influencerId: influencer7.id,
                socialPlatformId: instagram.id,
                handle: "@valentinamusic",
                profileUrl: "https://instagram.com/valentinamusic",
                isActive: true,
            },
        });

        await prisma.influencerSocialAccount.create({
            data: {
                influencerId: influencer8.id,
                socialPlatformId: instagram.id,
                handle: "@andressports",
                profileUrl: "https://instagram.com/andressports",
                isActive: true,
            },
        });

        // Agregar más cuentas sociales en otras plataformas
        await prisma.influencerSocialAccount.create({
            data: {
                influencerId: influencer1.id,
                socialPlatformId: youtube.id,
                handle: "@mariagarcia",
                profileUrl: "https://youtube.com/@mariagarcia",
                isActive: true,
            },
        });

        await prisma.influencerSocialAccount.create({
            data: {
                influencerId: influencer2.id,
                socialPlatformId: x.id,
                handle: "@carlosrodriguez_tech",
                profileUrl: "https://x.com/carlosrodriguez_tech",
                isActive: true,
            },
        });

        await prisma.influencerSocialAccount.create({
            data: {
                influencerId: influencer3.id,
                socialPlatformId: youtube.id,
                handle: "@anamartinezfit",
                profileUrl: "https://youtube.com/@anamartinezfit",
                isActive: true,
            },
        });

        await prisma.influencerSocialAccount.create({
            data: {
                influencerId: influencer4.id,
                socialPlatformId: youtube.id,
                handle: "@luisviajero",
                profileUrl: "https://youtube.com/@luisviajero",
                isActive: true,
            },
        });

        await prisma.influencerSocialAccount.create({
            data: {
                influencerId: influencer5.id,
                socialPlatformId: x.id,
                handle: "@sofiafashion",
                profileUrl: "https://x.com/sofiafashion",
                isActive: true,
            },
        });

        await prisma.influencerSocialAccount.create({
            data: {
                influencerId: influencer6.id,
                socialPlatformId: youtube.id,
                handle: "@diegococina",
                profileUrl: "https://youtube.com/@diegococina",
                isActive: true,
            },
        });

        await prisma.influencerSocialAccount.create({
            data: {
                influencerId: influencer7.id,
                socialPlatformId: x.id,
                handle: "@valentinamusic",
                profileUrl: "https://x.com/valentinamusic",
                isActive: true,
            },
        });

        await prisma.influencerSocialAccount.create({
            data: {
                influencerId: influencer8.id,
                socialPlatformId: youtube.id,
                handle: "@andressports",
                profileUrl: "https://youtube.com/@andressports",
                isActive: true,
            },
        });

        // Crear campañas
        const campaign1 = await prisma.campaign.create({
            data: {
                name: "Campaña Q1 2025",
                description: "Campaña de lanzamiento Q1 - Enfoque en awareness",
                country: "Bolivia",
                startDate: new Date("2025-01-01"),
                endDate: new Date("2025-03-31"),
                isActive: true,
                primaryGoalTypeId: awarenessGoal.id,
            },
        });

        const campaign2 = await prisma.campaign.create({
            data: {
                name: "Campaña Verano 2025",
                description: "Campaña especial de verano - Adquisición de usuarios",
                country: "Bolivia",
                startDate: new Date("2025-01-15"),
                endDate: new Date("2025-02-28"),
                isActive: true,
                primaryGoalTypeId: acquisitionGoal.id,
            },
        });

        const campaign3 = await prisma.campaign.create({
            data: {
                name: "Campaña Marzo 2025",
                description: "Campaña de marzo - Enfoque en conversiones",
                country: "Bolivia",
                startDate: new Date("2025-03-01"),
                endDate: new Date("2025-03-31"),
                isActive: true,
                primaryGoalTypeId: acquisitionGoal.id,
            },
        });

        const campaign4 = await prisma.campaign.create({
            data: {
                name: "Campaña Abril 2025",
                description: "Campaña de abril - Awareness y engagement",
                country: "Bolivia",
                startDate: new Date("2025-04-01"),
                endDate: new Date("2025-04-30"),
                isActive: true,
                primaryGoalTypeId: awarenessGoal.id,
            },
        });

        const campaign5 = await prisma.campaign.create({
            data: {
                name: "Campaña Mayo 2025",
                description: "Campaña de mayo - Foco en ROI",
                country: "Bolivia",
                startDate: new Date("2025-05-01"),
                endDate: new Date("2025-05-31"),
                isActive: true,
                primaryGoalTypeId: acquisitionGoal.id,
            },
        });

        const campaign6 = await prisma.campaign.create({
            data: {
                name: "Campaña Diciembre 2024",
                description: "Campaña de fin de año 2024",
                country: "Bolivia",
                startDate: new Date("2024-12-01"),
                endDate: new Date("2024-12-31"),
                isActive: false,
                primaryGoalTypeId: awarenessGoal.id,
            },
        });

        // Asociar influencers a campañas
        // Campaña 1
        await prisma.influencerCampaign.create({
            data: {
                influencerId: influencer1.id,
                campaignId: campaign1.id,
                agreedCost: new Decimal("5000.00"),
                notes: "Influencer principal de la campaña",
            },
        });

        await prisma.influencerCampaign.create({
            data: {
                influencerId: influencer2.id,
                campaignId: campaign1.id,
                agreedCost: new Decimal("3500.00"),
            },
        });

        await prisma.influencerCampaign.create({
            data: {
                influencerId: influencer3.id,
                campaignId: campaign1.id,
                agreedCost: new Decimal("4200.00"),
            },
        });

        await prisma.influencerCampaign.create({
            data: {
                influencerId: influencer5.id,
                campaignId: campaign1.id,
                agreedCost: new Decimal("3800.00"),
            },
        });

        // Campaña 2
        await prisma.influencerCampaign.create({
            data: {
                influencerId: influencer3.id,
                campaignId: campaign2.id,
                agreedCost: new Decimal("4500.00"),
            },
        });

        await prisma.influencerCampaign.create({
            data: {
                influencerId: influencer4.id,
                campaignId: campaign2.id,
                agreedCost: new Decimal("4000.00"),
            },
        });

        await prisma.influencerCampaign.create({
            data: {
                influencerId: influencer6.id,
                campaignId: campaign2.id,
                agreedCost: new Decimal("3200.00"),
            },
        });

        // Campaña 3
        await prisma.influencerCampaign.create({
            data: {
                influencerId: influencer1.id,
                campaignId: campaign3.id,
                agreedCost: new Decimal("5200.00"),
            },
        });

        await prisma.influencerCampaign.create({
            data: {
                influencerId: influencer7.id,
                campaignId: campaign3.id,
                agreedCost: new Decimal("4800.00"),
            },
        });

        await prisma.influencerCampaign.create({
            data: {
                influencerId: influencer8.id,
                campaignId: campaign3.id,
                agreedCost: new Decimal("4100.00"),
            },
        });

        // Campaña 4
        await prisma.influencerCampaign.create({
            data: {
                influencerId: influencer2.id,
                campaignId: campaign4.id,
                agreedCost: new Decimal("3900.00"),
            },
        });

        await prisma.influencerCampaign.create({
            data: {
                influencerId: influencer5.id,
                campaignId: campaign4.id,
                agreedCost: new Decimal("4400.00"),
            },
        });

        await prisma.influencerCampaign.create({
            data: {
                influencerId: influencer6.id,
                campaignId: campaign4.id,
                agreedCost: new Decimal("3600.00"),
            },
        });

        // Campaña 5
        await prisma.influencerCampaign.create({
            data: {
                influencerId: influencer4.id,
                campaignId: campaign5.id,
                agreedCost: new Decimal("4700.00"),
            },
        });

        await prisma.influencerCampaign.create({
            data: {
                influencerId: influencer7.id,
                campaignId: campaign5.id,
                agreedCost: new Decimal("4300.00"),
            },
        });

        await prisma.influencerCampaign.create({
            data: {
                influencerId: influencer8.id,
                campaignId: campaign5.id,
                agreedCost: new Decimal("4000.00"),
            },
        });

        // Campaña 6 (Histórica)
        await prisma.influencerCampaign.create({
            data: {
                influencerId: influencer1.id,
                campaignId: campaign6.id,
                agreedCost: new Decimal("4500.00"),
            },
        });

        await prisma.influencerCampaign.create({
            data: {
                influencerId: influencer3.id,
                campaignId: campaign6.id,
                agreedCost: new Decimal("3800.00"),
            },
        });

        // Crear posts
        const post1 = await prisma.post.create({
            data: {
                influencerId: influencer1.id,
                campaignId: campaign1.id,
                socialPlatformId: tiktok.id,
                contentTypeId: videoType.id,
                url: "https://tiktok.com/@mariagarcia/video/123",
                caption: "Descubriendo Takenos!",
                publishedAt: new Date("2025-01-05"),
                isTakenosContent: true,
            },
        });

        const post2 = await prisma.post.create({
            data: {
                influencerId: influencer1.id,
                campaignId: campaign1.id,
                socialPlatformId: instagram.id,
                contentTypeId: reelType.id,
                url: "https://instagram.com/p/abc123",
                caption: "Tutorial de Takenos",
                publishedAt: new Date("2025-01-10"),
                isTakenosContent: true,
            },
        });

        const post3 = await prisma.post.create({
            data: {
                influencerId: influencer2.id,
                campaignId: campaign1.id,
                socialPlatformId: tiktok.id,
                contentTypeId: videoType.id,
                url: "https://tiktok.com/@carlosrodriguez/video/456",
                caption: "Review de Takenos",
                publishedAt: new Date("2025-01-08"),
                isTakenosContent: true,
            },
        });

        const post4 = await prisma.post.create({
            data: {
                influencerId: influencer3.id,
                campaignId: campaign1.id,
                socialPlatformId: instagram.id,
                contentTypeId: reelType.id,
                url: "https://instagram.com/p/def456",
                caption: "Usando Takenos en mi rutina",
                publishedAt: new Date("2025-01-12"),
                isTakenosContent: true,
            },
        });

        const post5 = await prisma.post.create({
            data: {
                influencerId: influencer5.id,
                campaignId: campaign1.id,
                socialPlatformId: instagram.id,
                contentTypeId: reelType.id,
                url: "https://instagram.com/p/ghi789",
                caption: "Style con Takenos",
                publishedAt: new Date("2025-01-15"),
                isTakenosContent: true,
            },
        });

        const post6 = await prisma.post.create({
            data: {
                influencerId: influencer3.id,
                campaignId: campaign2.id,
                socialPlatformId: tiktok.id,
                contentTypeId: videoType.id,
                url: "https://tiktok.com/@anamartinezfit/video/789",
                caption: "Verano con Takenos",
                publishedAt: new Date("2025-01-20"),
                isTakenosContent: true,
            },
        });

        const post7 = await prisma.post.create({
            data: {
                influencerId: influencer4.id,
                campaignId: campaign2.id,
                socialPlatformId: tiktok.id,
                contentTypeId: videoType.id,
                url: "https://tiktok.com/@luisviajero/video/101",
                caption: "Viajando con Takenos",
                publishedAt: new Date("2025-01-22"),
                isTakenosContent: true,
            },
        });

        const post8 = await prisma.post.create({
            data: {
                influencerId: influencer6.id,
                campaignId: campaign2.id,
                socialPlatformId: tiktok.id,
                contentTypeId: videoType.id,
                url: "https://tiktok.com/@diegococina/video/202",
                caption: "Recetas con Takenos",
                publishedAt: new Date("2025-01-25"),
                isTakenosContent: true,
            },
        });

        const post9 = await prisma.post.create({
            data: {
                influencerId: influencer1.id,
                campaignId: campaign3.id,
                socialPlatformId: instagram.id,
                contentTypeId: reelType.id,
                url: "https://instagram.com/p/jkl012",
                caption: "Marzo con Takenos",
                publishedAt: new Date("2025-03-05"),
                isTakenosContent: true,
            },
        });

        const post10 = await prisma.post.create({
            data: {
                influencerId: influencer7.id,
                campaignId: campaign3.id,
                socialPlatformId: tiktok.id,
                contentTypeId: videoType.id,
                url: "https://tiktok.com/@valentinamusic/video/303",
                caption: "Música y Takenos",
                publishedAt: new Date("2025-03-10"),
                isTakenosContent: true,
            },
        });

        // Posts adicionales en YouTube y X
        const post13 = await prisma.post.create({
            data: {
                influencerId: influencer1.id,
                campaignId: campaign1.id,
                socialPlatformId: youtube.id,
                contentTypeId: videoType.id,
                url: "https://youtube.com/watch?v=abc123",
                caption: "Video completo sobre Takenos",
                publishedAt: new Date("2025-01-14"),
                isTakenosContent: true,
            },
        });

        const post14 = await prisma.post.create({
            data: {
                influencerId: influencer2.id,
                campaignId: campaign1.id,
                socialPlatformId: x.id,
                contentTypeId: null,
                url: "https://x.com/carlosrodriguez_tech/status/123456",
                caption: "Nuevo review de Takenos en el hilo",
                publishedAt: new Date("2025-01-09"),
                isTakenosContent: true,
            },
        });

        const post15 = await prisma.post.create({
            data: {
                influencerId: influencer4.id,
                campaignId: campaign2.id,
                socialPlatformId: youtube.id,
                contentTypeId: videoType.id,
                url: "https://youtube.com/watch?v=def456",
                caption: "Viajando con Takenos - Vlog completo",
                publishedAt: new Date("2025-01-23"),
                isTakenosContent: true,
            },
        });

        const post16 = await prisma.post.create({
            data: {
                influencerId: influencer5.id,
                campaignId: campaign4.id,
                socialPlatformId: x.id,
                contentTypeId: null,
                url: "https://x.com/sofiafashion/status/789012",
                caption: "Nuevo estilo con Takenos 🎨",
                publishedAt: new Date("2025-04-05"),
                isTakenosContent: true,
            },
        });

        // Posts sin campaña (contenido general del influencer)
        const post11 = await prisma.post.create({
            data: {
                influencerId: influencer1.id,
                campaignId: null,
                socialPlatformId: tiktok.id,
                contentTypeId: videoType.id,
                url: "https://tiktok.com/@mariagarcia/video/404",
                caption: "Rutina diaria",
                publishedAt: new Date("2025-01-18"),
                isTakenosContent: false,
            },
        });

        const post12 = await prisma.post.create({
            data: {
                influencerId: influencer2.id,
                campaignId: null,
                socialPlatformId: instagram.id,
                contentTypeId: reelType.id,
                url: "https://instagram.com/p/mno345",
                caption: "Nuevo gadget",
                publishedAt: new Date("2025-01-28"),
                isTakenosContent: false,
            },
        });

        // Crear métricas de ejemplo
        // Post 1 - Métricas en diferentes fechas
        await prisma.postMetricSnapshot.create({
            data: {
                postId: post1.id,
                snapshotDate: new Date("2025-01-06"),
                views: 50000,
                likes: 5000,
                shares: 800,
                clicks: 1200,
                conversions: 150,
                revenue: new Decimal("4500.00"),
                roi: new Decimal("45.00"),
            },
        });

        await prisma.postMetricSnapshot.create({
            data: {
                postId: post1.id,
                snapshotDate: new Date("2025-01-12"),
                views: 85000,
                likes: 9000,
                shares: 1500,
                clicks: 2200,
                conversions: 280,
                revenue: new Decimal("8400.00"),
                roi: new Decimal("68.00"),
            },
        });

        // Post 2
        await prisma.postMetricSnapshot.create({
            data: {
                postId: post2.id,
                snapshotDate: new Date("2025-01-11"),
                views: 35000,
                likes: 3500,
                shares: 600,
                clicks: 900,
                conversions: 120,
                revenue: new Decimal("3600.00"),
                roi: new Decimal("72.00"),
            },
        });

        await prisma.postMetricSnapshot.create({
            data: {
                postId: post2.id,
                snapshotDate: new Date("2025-01-18"),
                views: 52000,
                likes: 5500,
                shares: 900,
                clicks: 1400,
                conversions: 180,
                revenue: new Decimal("5400.00"),
                roi: new Decimal("42.11"),
            },
        });

        // Post 3
        await prisma.postMetricSnapshot.create({
            data: {
                postId: post3.id,
                snapshotDate: new Date("2025-01-09"),
                views: 42000,
                likes: 4200,
                shares: 700,
                clicks: 1000,
                conversions: 130,
                revenue: new Decimal("3900.00"),
                roi: new Decimal("11.43"),
            },
        });

        // Post 4
        await prisma.postMetricSnapshot.create({
            data: {
                postId: post4.id,
                snapshotDate: new Date("2025-01-13"),
                views: 28000,
                likes: 3200,
                shares: 550,
                clicks: 750,
                conversions: 95,
                revenue: new Decimal("2850.00"),
                roi: new Decimal("32.14"),
            },
        });

        await prisma.postMetricSnapshot.create({
            data: {
                postId: post4.id,
                snapshotDate: new Date("2025-01-20"),
                views: 45000,
                likes: 4800,
                shares: 850,
                clicks: 1200,
                conversions: 155,
                revenue: new Decimal("4650.00"),
                roi: new Decimal("10.71"),
            },
        });

        // Post 5
        await prisma.postMetricSnapshot.create({
            data: {
                postId: post5.id,
                snapshotDate: new Date("2025-01-16"),
                views: 32000,
                likes: 3800,
                shares: 620,
                clicks: 880,
                conversions: 110,
                revenue: new Decimal("3300.00"),
                roi: new Decimal("13.16"),
            },
        });

        // Post 6
        await prisma.postMetricSnapshot.create({
            data: {
                postId: post6.id,
                snapshotDate: new Date("2025-01-21"),
                views: 38000,
                likes: 4100,
                shares: 680,
                clicks: 950,
                conversions: 125,
                revenue: new Decimal("3750.00"),
                roi: new Decimal("16.67"),
            },
        });

        // Post 7
        await prisma.postMetricSnapshot.create({
            data: {
                postId: post7.id,
                snapshotDate: new Date("2025-01-23"),
                views: 55000,
                likes: 5800,
                shares: 950,
                clicks: 1350,
                conversions: 175,
                revenue: new Decimal("5250.00"),
                roi: new Decimal("31.25"),
            },
        });

        // Post 8
        await prisma.postMetricSnapshot.create({
            data: {
                postId: post8.id,
                snapshotDate: new Date("2025-01-26"),
                views: 29000,
                likes: 3100,
                shares: 520,
                clicks: 720,
                conversions: 90,
                revenue: new Decimal("2700.00"),
                roi: new Decimal("15.63"),
            },
        });

        // Post 9
        await prisma.postMetricSnapshot.create({
            data: {
                postId: post9.id,
                snapshotDate: new Date("2025-03-06"),
                views: 48000,
                likes: 5200,
                shares: 850,
                clicks: 1200,
                conversions: 160,
                revenue: new Decimal("4800.00"),
                roi: new Decimal("7.69"),
            },
        });

        // Post 10
        await prisma.postMetricSnapshot.create({
            data: {
                postId: post10.id,
                snapshotDate: new Date("2025-03-11"),
                views: 41000,
                likes: 4500,
                shares: 750,
                clicks: 1050,
                conversions: 140,
                revenue: new Decimal("4200.00"),
                roi: new Decimal("12.50"),
            },
        });

        // Post 11 (sin campaña)
        await prisma.postMetricSnapshot.create({
            data: {
                postId: post11.id,
                snapshotDate: new Date("2025-01-19"),
                views: 25000,
                likes: 2800,
                shares: 450,
                clicks: 600,
                conversions: 75,
                revenue: new Decimal("2250.00"),
                roi: new Decimal("50.00"),
            },
        });

        // Post 12 (sin campaña)
        await prisma.postMetricSnapshot.create({
            data: {
                postId: post12.id,
                snapshotDate: new Date("2025-01-29"),
                views: 18000,
                likes: 2000,
                shares: 320,
                clicks: 450,
                conversions: 55,
                revenue: new Decimal("1650.00"),
                roi: new Decimal("56.58"),
            },
        });

        // Post 13 (YouTube)
        await prisma.postMetricSnapshot.create({
            data: {
                postId: post13.id,
                snapshotDate: new Date("2025-01-15"),
                views: 125000,
                likes: 12000,
                shares: 2500,
                clicks: 4500,
                conversions: 320,
                revenue: new Decimal("9600.00"),
                roi: new Decimal("92.00"),
            },
        });

        // Post 14 (X/Twitter)
        await prisma.postMetricSnapshot.create({
            data: {
                postId: post14.id,
                snapshotDate: new Date("2025-01-10"),
                views: 15000,
                likes: 1800,
                shares: 450,
                clicks: 650,
                conversions: 85,
                revenue: new Decimal("2550.00"),
                roi: new Decimal("27.14"),
            },
        });

        // Post 15 (YouTube)
        await prisma.postMetricSnapshot.create({
            data: {
                postId: post15.id,
                snapshotDate: new Date("2025-01-24"),
                views: 98000,
                likes: 9500,
                shares: 1800,
                clicks: 3200,
                conversions: 240,
                revenue: new Decimal("7200.00"),
                roi: new Decimal("80.00"),
            },
        });

        // Post 16 (X/Twitter)
        await prisma.postMetricSnapshot.create({
            data: {
                postId: post16.id,
                snapshotDate: new Date("2025-04-06"),
                views: 12000,
                likes: 1500,
                shares: 380,
                clicks: 520,
                conversions: 70,
                revenue: new Decimal("2100.00"),
                roi: new Decimal("52.27"),
            },
        });

        return NextResponse.json({
            message: "Seed completado exitosamente",
            data: {
                influencers: 8,
                campaigns: 6,
                posts: 16,
                metrics: 17,
                influencerCampaigns: 17,
                socialAccounts: 20,
                platforms: 4,
            },
        });
    } catch (error) {
        console.error("Error seeding database:", error);
        return NextResponse.json(
            {
                error: "Error al poblar la base de datos",
                details: error instanceof Error ? error.message : "Error desconocido",
            },
            { status: 500 }
        );
    }
}

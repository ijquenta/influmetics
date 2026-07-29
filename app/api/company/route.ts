import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/supabase/server";

export async function GET() {
    try {
        const authUser = await getServerUser();
        if (!authUser) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        let prismaUser = await prisma.user.findUnique({
            where: { supabaseId: authUser.id },
            include: { company: true },
        });

        if (!prismaUser) {
            const profileName = authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Usuario";
            const companyName = authUser.user_metadata?.company || `${profileName}'s Company`;

            const company = await prisma.company.create({
                data: { name: companyName },
            });

            let userType = await prisma.userType.findFirst();
            if (!userType) {
                userType = await prisma.userType.create({
                    data: { code: "GROWTH_MANAGER", name: "Growth Manager" },
                });
            }

            prismaUser = await prisma.user.create({
                data: {
                    supabaseId: authUser.id,
                    name: profileName,
                    email: authUser.email!,
                    userTypeId: userType.id,
                    companyId: company.id,
                },
                include: { company: true },
            });
        }

        if (!prismaUser.company) {
            const company = await prisma.company.create({
                data: { name: prismaUser.name },
            });
            await prisma.user.update({
                where: { id: prismaUser.id },
                data: { companyId: company.id },
            });
            prismaUser.company = company;
        }

        return NextResponse.json(prismaUser.company);
    } catch (error) {
        console.error("Error in company GET:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const authUser = await getServerUser();
        if (!authUser) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        const prismaUser = await prisma.user.findUnique({
            where: { supabaseId: authUser.id },
        });

        if (!prismaUser || !prismaUser.companyId) {
            return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
        }

        const body = await request.json();
        const allowedFields = ["name", "rubro", "culture", "description", "country", "website", "logo", "size"];
        const data: Record<string, string> = {};

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                data[field] = body[field];
            }
        }

        const company = await prisma.company.update({
            where: { id: prismaUser.companyId },
            data,
        });

        return NextResponse.json(company);
    } catch (error) {
        console.error("Error in company PATCH:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}

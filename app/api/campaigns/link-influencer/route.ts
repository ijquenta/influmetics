import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { influencerId, campaignId, agreedCost } = await request.json();

    if (!influencerId || !campaignId) {
      return NextResponse.json({ error: "influencerId y campaignId son requeridos" }, { status: 400 });
    }

    const link = await prisma.influencerCampaign.create({
      data: {
        influencerId: parseInt(influencerId),
        campaignId: parseInt(campaignId),
        agreedCost: agreedCost ? parseFloat(agreedCost) : null,
      },
      include: {
        campaign: true,
        influencer: true,
      },
    });

    return NextResponse.json({ data: link }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "El influencer ya está asignado a esta campaña" }, { status: 400 });
    }
    console.error("Error linking influencer to campaign:", error);
    return NextResponse.json({ error: "Error al asignar influencer a campaña" }, { status: 500 });
  }
}

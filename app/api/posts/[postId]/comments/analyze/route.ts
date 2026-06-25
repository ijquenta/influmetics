import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";

interface GeminiResult {
    resumen: {
        positivo: number;
        negativo: number;
        neutro: number;
    };
    comentarios: Array<{
        id: string;
        sentimiento: "POSITIVO" | "NEGATIVO" | "NEUTRO";
        score: number;
        razon: string;
    }>;
    temas_destacados: string[];
    sugerencia: string;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
    try {
        const { postId: postIdParam } = await params;
        const postId = parseInt(postIdParam);

        const url = new URL(request.url);
        const force = url.searchParams.get("force") === "true";

        const where = force ? { postId } : { postId, analyzedAt: null };

        const comments = await prisma.comment.findMany({
            where,
            orderBy: { diggCount: "desc" },
            take: 200,
        });

        if (comments.length === 0) {
            return NextResponse.json({
                error: force ? "No hay comentarios para analizar" : "Todos los comentarios ya están analizados",
            }, { status: 400 });
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: "GEMINI_API_KEY no configurada" }, { status: 500 });
        }

        const commentList = comments.map((c) => ({
            id: c.tiktokCommentId,
            texto: c.text,
        }));

        const prompt = `Eres un analizador de sentimiento para comentarios de TikTok en español de Bolivia.
Analiza cada comentario y clasifícalo como POSITIVO, NEGATIVO o NEUTRO.

Reglas:
- POSITIVO: elogio, agradecimiento, risa, emoji positivo, entusiasmo
- NEGATIVO: queja, crítica, reclamo, insatisfacción, emoji negativo
- NEUTRO: pregunta, hecho, opinión sin carga, etiqueta a amigos, comentario sin emoción clara
- Para cada comentario da un score de 0.0 a 1.0 y una razón breve en "razon" (máx 10 palabras)

Debes responder ÚNICAMENTE con un JSON que tenga EXACTAMENTE esta estructura, sin markdown, sin notas adicionales:

{
  "resumen": { "positivo": 0, "negativo": 0, "neutro": 0 },
  "comentarios": [
    { "id": "comment_id", "sentimiento": "POSITIVO", "score": 0.0, "razon": "..." }
  ],
  "temas_destacados": ["tema1", "tema2"],
  "sugerencia": "Consejo corto para el creador basado en el sentimiento general"
}

Comentarios a analizar:
${JSON.stringify(commentList, null, 2)}`;

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 8192,
                    },
                }),
            }
        );

        if (!geminiRes.ok) {
            const errBody = await geminiRes.json().catch(() => ({}));
            return NextResponse.json(
                { error: "Error de Gemini API", details: errBody },
                { status: geminiRes.status }
            );
        }

        const geminiData = await geminiRes.json();
        const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        let result: GeminiResult;
        try {
            const cleaned = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
            result = JSON.parse(cleaned) as GeminiResult;
        } catch {
            return NextResponse.json(
                { error: "Error al parsear respuesta de Gemini", raw: rawText },
                { status: 500 }
            );
        }

        const now = new Date();
        let updatedCount = 0;

        for (const item of result.comentarios) {
            const label = item.sentimiento === "POSITIVO" ? "POSITIVO"
                : item.sentimiento === "NEGATIVO" ? "NEGATIVO"
                : "NEUTRO";

            const score = Math.max(0, Math.min(1, item.score ?? 0.5));

            await prisma.comment.updateMany({
                where: { postId, tiktokCommentId: item.id },
                data: {
                    sentimentLabel: label,
                    sentimentScore: score,
                    sentimentReason: item.razon || null,
                    analyzedAt: now,
                },
            });
            updatedCount++;
        }

        return NextResponse.json({
            analyzed: updatedCount,
            total: comments.length,
            resumen: result.resumen,
            temas_destacados: result.temas_destacados,
            sugerencia: result.sugerencia,
        });
    } catch (error) {
        console.error("Error analyzing comments:", error);
        return NextResponse.json({ error: "Error al analizar comentarios" }, { status: 500 });
    }
}

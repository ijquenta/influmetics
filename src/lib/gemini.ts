const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";

export interface SentimentResult {
  label: "positivo" | "negativo" | "neutral";
  score: number;
}

export async function analyzeSentiments(comments: string[]): Promise<SentimentResult[]> {
  if (!GEMINI_API_KEY || comments.length === 0) {
    return comments.map(() => ({ label: "neutral", score: 0.5 }));
  }

  const batchSize = 20;
  const results: SentimentResult[] = [];

  for (let i = 0; i < comments.length; i += batchSize) {
    const batch = comments.slice(i, i + batchSize);
    const prompt = `Analiza el sentimiento de cada comentario de TikTok y responde SOLO con un JSON array. Cada elemento debe tener "label" ("positivo", "negativo" o "neutral") y "score" (0-1, confianza).

Comentarios:
${batch.map((c, idx) => `${idx + 1}. "${c}"`).join("\n")}

Responde SOLO con el JSON array, nada más.`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`Gemini error: ${res.status}`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          results.push({
            label: ["positivo", "negativo", "neutral"].includes(item.label) ? item.label : "neutral",
            score: typeof item.score === "number" ? item.score : 0.5,
          });
        }
      }
    } catch (e) {
      console.error("Gemini batch error:", e);
      for (const _ of batch) {
        results.push({ label: "neutral", score: 0.5 });
      }
    }
  }

  return results;
}

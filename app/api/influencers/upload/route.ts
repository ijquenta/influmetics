import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Función simple para parsear CSV (línea por línea)
function parseCSV(csvText: string): string[][] {
    const lines: string[][] = [];
    const rows = csvText.split("\n").filter((line) => line.trim());

    for (const row of rows) {
        const values: string[] = [];
        let current = "";
        let insideQuotes = false;

        for (let i = 0; i < row.length; i++) {
            const char = row[i];

            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === "," && !insideQuotes) {
                values.push(current.trim());
                current = "";
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        lines.push(values);
    }

    return lines;
}

// Función para leer archivo Excel usando exceljs
async function parseExcel(buffer: Buffer): Promise<string[][]> {
    const rows: string[][] = [];
    try {
        const ExcelJS = await import("exceljs");
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as any);
        const worksheet = workbook.worksheets[0];
        if (!worksheet) return rows;

        worksheet.eachRow((row) => {
            const values: string[] = [];
            row.eachCell((cell) => {
                const v = cell.value;
                if (v === null || v === undefined) values.push("");
                else if (typeof v === "object" && (v as any).richText) values.push((v as any).richText.map((r: any) => r.text).join(""));
                else values.push(String(v));
            });
            rows.push(values);
        });
        return rows;
    } catch (err) {
        throw new Error("Error parsing Excel: ensure 'exceljs' is installed");
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name.toLowerCase();
        let rows: string[][] = [];

        // Determinar el tipo de archivo y parsearlo
        if (fileName.endsWith(".csv")) {
            const csvText = buffer.toString("utf-8");
            rows = parseCSV(csvText);
        } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
            try {
                // Intentar parsear Excel si está disponible
                rows = await parseExcel(buffer);
            } catch (error) {
                // Si no está disponible xlsx, retornar error informativo
                return NextResponse.json(
                    {
                        error: "Para procesar archivos Excel, instala la librería xlsx. Ejecuta: npm install xlsx",
                        suggestion: "Mientras tanto, usa formato CSV",
                    },
                    { status: 400 }
                );
            }
        } else {
            return NextResponse.json({ error: "Formato de archivo no soportado. Use CSV o XLSX" }, { status: 400 });
        }

        if (rows.length < 2) {
            return NextResponse.json(
                {
                    error: "El archivo debe contener al menos una fila de encabezados y una fila de datos",
                },
                { status: 400 }
            );
        }

        // Obtener encabezados (primera fila)
        const headers = rows[0].map((h) => h.toLowerCase().trim());

        // Buscar índices de columnas relevantes
        const nameIdx = headers.findIndex((h) => h.includes("nombre") || h.includes("name"));
        const emailIdx = headers.findIndex((h) => h.includes("email") || h.includes("correo"));
        const nicheIdx = headers.findIndex((h) => h.includes("nicho") || h.includes("niche"));
        const referralCodeIdx = headers.findIndex((h) => h.includes("codigo") || h.includes("referral") || h.includes("code"));

        // Índices para redes sociales (pueden variar)
        const tiktokHandleIdx = headers.findIndex((h) => h.includes("tiktok") || h.includes("tik tok"));
        const instagramHandleIdx = headers.findIndex((h) => h.includes("instagram") || h.includes("insta"));
        const youtubeHandleIdx = headers.findIndex((h) => h.includes("youtube") || h.includes("yt"));
        const xHandleIdx = headers.findIndex((h) => (h.includes("twitter") || h.includes("x")) && !h.includes("instagram"));

        if (nameIdx === -1) {
            return NextResponse.json({ error: 'No se encontró la columna "nombre" o "name" en el archivo' }, { status: 400 });
        }

        // Obtener plataformas sociales de la base de datos
        const platforms = await prisma.socialPlatform.findMany();
        const platformMap: Record<string, number> = {};
        platforms.forEach((p) => {
            platformMap[p.code.toLowerCase()] = p.id;
        });

        // Procesar cada fila en una transacción
        const results = await prisma.$transaction(async (tx) => {
            let successCount = 0;
            let errorCount = 0;
            const errors: string[] = [];

            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];

                if (row.length === 0 || !row[nameIdx]) {
                    continue;
                }

                try {
                    const influencer = await tx.influencer.create({
                        data: {
                            name: row[nameIdx] || "",
                            email: emailIdx !== -1 && row[emailIdx] ? row[emailIdx] : null,
                            niche: nicheIdx !== -1 && row[nicheIdx] ? row[nicheIdx] : null,
                            referralCode: referralCodeIdx !== -1 && row[referralCodeIdx] ? row[referralCodeIdx] : null,
                        },
                    });

                    const socialAccounts: {
                        influencerId: number;
                        socialPlatformId: number;
                        handle: string;
                        isActive: boolean;
                    }[] = [];

                    if (tiktokHandleIdx !== -1 && row[tiktokHandleIdx] && platformMap["tiktok"]) {
                        socialAccounts.push({
                            influencerId: influencer.id,
                            socialPlatformId: platformMap["tiktok"],
                            handle: row[tiktokHandleIdx].replace("@", ""),
                            isActive: true,
                        });
                    }

                    if (instagramHandleIdx !== -1 && row[instagramHandleIdx] && platformMap["instagram"]) {
                        socialAccounts.push({
                            influencerId: influencer.id,
                            socialPlatformId: platformMap["instagram"],
                            handle: row[instagramHandleIdx].replace("@", ""),
                            isActive: true,
                        });
                    }

                    if (youtubeHandleIdx !== -1 && row[youtubeHandleIdx] && platformMap["youtube"]) {
                        socialAccounts.push({
                            influencerId: influencer.id,
                            socialPlatformId: platformMap["youtube"],
                            handle: row[youtubeHandleIdx].replace("@", ""),
                            isActive: true,
                        });
                    }

                    if (xHandleIdx !== -1 && row[xHandleIdx] && platformMap["x"]) {
                        socialAccounts.push({
                            influencerId: influencer.id,
                            socialPlatformId: platformMap["x"],
                            handle: row[xHandleIdx].replace("@", ""),
                            isActive: true,
                        });
                    }

                    if (socialAccounts.length > 0) {
                        await tx.influencerSocialAccount.createMany({
                            data: socialAccounts,
                        });
                    }

                    successCount++;
                } catch (error: any) {
                    errorCount++;
                    errors.push(`Fila ${i + 1}: ${error.message || "Error desconocido"}`);
                }
            }

            return { successCount, errorCount, errors };
        });

        return NextResponse.json({
            message: `Importación completada: ${results.successCount} influencers creados exitosamente`,
            count: results.successCount,
            errors: results.errorCount > 0 ? results.errors.slice(0, 10) : [],
            errorCount: results.errorCount,
        });
    } catch (error: any) {
        console.error("Error uploading file:", error);
        return NextResponse.json({ error: error.message || "Error al procesar el archivo" }, { status: 500 });
    }
}

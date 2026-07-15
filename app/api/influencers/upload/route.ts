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
        const birthDateIdx = headers.findIndex((h) => h.includes("fecha") || h.includes("birth") || h.includes("nacimiento") || h.includes("date"));

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

        // Pre-validación de duplicados
        const existingEmails = new Set<string>();
        const existingRefCodes = new Set<string>();
        const existingHandles: Map<string, Set<string>> = new Map();

        if (emailIdx !== -1) {
            const emails = await prisma.influencer.findMany({
                where: { email: { not: null } },
                select: { email: true },
            });
            emails.forEach((e) => e.email && existingEmails.add(e.email));
        }

        if (referralCodeIdx !== -1) {
            const refs = await prisma.influencer.findMany({
                where: { referralCode: { not: null } },
                select: { referralCode: true },
            });
            refs.forEach((r) => r.referralCode && existingRefCodes.add(r.referralCode));
        }

        for (const platformCode of ["tiktok", "instagram", "youtube", "x"] as const) {
            if (platformMap[platformCode]) {
                const accounts = await prisma.influencerSocialAccount.findMany({
                    where: { socialPlatformId: platformMap[platformCode] },
                    select: { handle: true },
                });
                const handles = new Set(accounts.map((a) => a.handle.toLowerCase()));
                existingHandles.set(platformCode, handles);
            }
        }

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

                const rowName = row[nameIdx]?.trim();
                if (!rowName) {
                    errorCount++;
                    errors.push(`Fila ${i + 1}: El nombre es requerido`);
                    continue;
                }

                const rowEmail = emailIdx !== -1 && row[emailIdx] ? row[emailIdx].trim() : null;
                const rowRefCode = referralCodeIdx !== -1 && row[referralCodeIdx] ? row[referralCodeIdx].trim() : null;

                if (rowEmail && existingEmails.has(rowEmail)) {
                    errorCount++;
                    errors.push(`Fila ${i + 1}: El email "${rowEmail}" ya existe`);
                    continue;
                }

                if (rowRefCode && existingRefCodes.has(rowRefCode)) {
                    errorCount++;
                    errors.push(`Fila ${i + 1}: El código de referido "${rowRefCode}" ya existe`);
                    continue;
                }

                // Verificar handles duplicados
                const handleChecks: { platform: string; handle: string }[] = [];
                if (tiktokHandleIdx !== -1 && row[tiktokHandleIdx] && platformMap["tiktok"]) {
                    handleChecks.push({ platform: "tiktok", handle: row[tiktokHandleIdx] });
                }
                if (instagramHandleIdx !== -1 && row[instagramHandleIdx] && platformMap["instagram"]) {
                    handleChecks.push({ platform: "instagram", handle: row[instagramHandleIdx] });
                }
                if (youtubeHandleIdx !== -1 && row[youtubeHandleIdx] && platformMap["youtube"]) {
                    handleChecks.push({ platform: "youtube", handle: row[youtubeHandleIdx] });
                }
                if (xHandleIdx !== -1 && row[xHandleIdx] && platformMap["x"]) {
                    handleChecks.push({ platform: "x", handle: row[xHandleIdx] });
                }

                let duplicateHandle = false;
                for (const hc of handleChecks) {
                    const cleanHandle = hc.handle.replace(/^@+/, "").trim().toLowerCase();
                    const existing = existingHandles.get(hc.platform);
                    if (existing && existing.has(cleanHandle)) {
                        errorCount++;
                        errors.push(`Fila ${i + 1}: El handle "${hc.handle}" ya está registrado en ${hc.platform}`);
                        duplicateHandle = true;
                        break;
                    }
                }
                if (duplicateHandle) continue;

                // Parse birthDate
                let rowBirthDate = null;
                if (birthDateIdx !== -1 && row[birthDateIdx]) {
                    rowBirthDate = new Date(row[birthDateIdx]);
                    if (isNaN(rowBirthDate.getTime())) {
                        errorCount++;
                        errors.push(`Fila ${i + 1}: Fecha de nacimiento inválida: "${row[birthDateIdx]}"`);
                        continue;
                    }
                }

                try {
                    const influencer = await tx.influencer.create({
                        data: {
                            name: rowName,
                            email: rowEmail,
                            niche: nicheIdx !== -1 && row[nicheIdx] ? row[nicheIdx].trim() : null,
                            referralCode: rowRefCode,
                            birthDate: rowBirthDate,
                        },
                    });

                    // Marcar como usados para evitar duplicados en el mismo archivo
                    if (rowEmail) existingEmails.add(rowEmail);
                    if (rowRefCode) existingRefCodes.add(rowRefCode);

                    const socialAccounts: {
                        influencerId: number;
                        socialPlatformId: number;
                        handle: string;
                        isActive: boolean;
                    }[] = [];

                    if (tiktokHandleIdx !== -1 && row[tiktokHandleIdx] && platformMap["tiktok"]) {
                        const h = row[tiktokHandleIdx].replace(/^@+/, "").trim();
                        socialAccounts.push({ influencerId: influencer.id, socialPlatformId: platformMap["tiktok"], handle: h, isActive: true });
                        existingHandles.get("tiktok")?.add(h.toLowerCase());
                    }

                    if (instagramHandleIdx !== -1 && row[instagramHandleIdx] && platformMap["instagram"]) {
                        const h = row[instagramHandleIdx].replace(/^@+/, "").trim();
                        socialAccounts.push({ influencerId: influencer.id, socialPlatformId: platformMap["instagram"], handle: h, isActive: true });
                        existingHandles.get("instagram")?.add(h.toLowerCase());
                    }

                    if (youtubeHandleIdx !== -1 && row[youtubeHandleIdx] && platformMap["youtube"]) {
                        const h = row[youtubeHandleIdx].replace(/^@+/, "").trim();
                        socialAccounts.push({ influencerId: influencer.id, socialPlatformId: platformMap["youtube"], handle: h, isActive: true });
                        existingHandles.get("youtube")?.add(h.toLowerCase());
                    }

                    if (xHandleIdx !== -1 && row[xHandleIdx] && platformMap["x"]) {
                        const h = row[xHandleIdx].replace(/^@+/, "").trim();
                        socialAccounts.push({ influencerId: influencer.id, socialPlatformId: platformMap["x"], handle: h, isActive: true });
                        existingHandles.get("x")?.add(h.toLowerCase());
                    }

                    if (socialAccounts.length > 0) {
                        await tx.influencerSocialAccount.createMany({ data: socialAccounts });
                    }

                    successCount++;
                } catch (error: any) {
                    errorCount++;
                    errors.push(`Fila ${i + 1}: ${error.message || "Error desconocido"}`);
                }
            }

            return { successCount, errorCount, errors };
        });

        const displayErrors = results.errors.slice(0, 10);
        const moreErrors = results.errors.length - displayErrors.length;

        return NextResponse.json({
            message: results.errorCount > 0
                ? `Importación completada: ${results.successCount} creados, ${results.errorCount} errores`
                : `Importación completada: ${results.successCount} influencers creados exitosamente`,
            count: results.successCount,
            errors: displayErrors,
            errorCount: results.errorCount,
            moreErrors: moreErrors > 0 ? `... y ${moreErrors} errores más` : null,
        });
    } catch (error: any) {
        console.error("Error uploading file:", error);
        return NextResponse.json({ error: error.message || "Error al procesar el archivo" }, { status: 500 });
    }
}

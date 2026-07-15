import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_SORTS = ["diggCount", "createTimeISO", "replyCount"] as const;
type SortField = (typeof VALID_SORTS)[number];

export async function GET(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
    try {
        const { postId: postIdParam } = await params;
        const postId = parseInt(postIdParam);

        const url = new URL(request.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
        const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
        const sortBy = (url.searchParams.get("sortBy") || "diggCount") as SortField;
        const sortOrder = url.searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

        if (!VALID_SORTS.includes(sortBy)) {
            return NextResponse.json({ error: `sortBy debe ser uno de: ${VALID_SORTS.join(", ")}` }, { status: 400 });
        }

        const skip = (page - 1) * limit;

        const [comments, total, post, sentimentCounts] = await Promise.all([
            prisma.comment.findMany({
                where: { postId },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit,
            }),
            prisma.comment.count({ where: { postId } }),
            prisma.post.findUnique({
                where: { id: postId },
                include: {
                    metrics: { orderBy: { snapshotDate: "desc" }, take: 1 },
                },
            }),
            prisma.comment.groupBy({
                by: ["sentimentLabel"],
                where: { postId, sentimentLabel: { not: null } },
                _count: true,
            }),
        ]);

        const counts = { positivo: 0, negativo: 0, neutro: 0 };
        for (const row of sentimentCounts) {
            if (row.sentimentLabel === "POSITIVO") counts.positivo = row._count;
            else if (row.sentimentLabel === "NEGATIVO") counts.negativo = row._count;
            else if (row.sentimentLabel === "NEUTRO") counts.neutro = row._count;
        }

        return NextResponse.json({
            data: comments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            sentimentCounts: counts,
            post: post
                ? {
                      id: post.id,
                      tiktokVideoId: post.tiktokVideoId,
                      caption: post.caption,
                      coverUrl: post.coverUrl,
                      webVideoUrl: post.webVideoUrl,
                      publishedAt: post.publishedAt,
                      duration: post.duration,
                      views: post.metrics?.[0]?.playCount ?? post.metrics?.[0]?.views ?? null,
                      likes: post.metrics?.[0]?.likes ?? null,
                      commentCount: post.metrics?.[0]?.commentCount ?? null,
                      shares: post.metrics?.[0]?.shares ?? null,
                      saves: post.metrics?.[0]?.saves ?? null,
                      temasDestacados: post.temasDestacados,
                      sugerencia: post.sugerencia,
                  }
                : null,
        });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json({ error: "Error al obtener comentarios" }, { status: 500 });
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
    try {
        const { postId: postIdParam } = await params;
        const postId = parseInt(postIdParam);

        const post = await prisma.post.findUnique({ where: { id: postId } });
        if (!post) {
            return NextResponse.json({ error: "Post no encontrado" }, { status: 404 });
        }

        const { videoUrl } = await request.json() as { videoUrl?: string };
        if (!videoUrl) {
            return NextResponse.json({ error: "videoUrl es requerido" }, { status: 400 });
        }

        const scraperUrl = process.env.SCRAPER_API_URL ?? "https://influmetics-scraper-service.onrender.com";
        const scraperKey = process.env.SCRAPER_API_KEY ?? "";

        const scraperRes = await fetch(`${scraperUrl}/scrape/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "accept": "application/json",
                "X-API-Key": scraperKey,
            },
            body: JSON.stringify({
                videoUrls: [videoUrl],
                commentsPerPost: 30,
                maxRepliesPerComment: 0,
            }),
        });

        if (!scraperRes.ok) {
            const errBody = await scraperRes.json().catch(() => ({}));
            return NextResponse.json(
                { error: "Error del scraper", details: errBody },
                { status: scraperRes.status }
            );
        }

        const scraperData = await scraperRes.json();
        const rawComments = scraperData.results || [];

        type RawComment = Record<string, unknown>;
        type CommentItem = {
            tiktokCommentId: string;
            text: string;
            diggCount: number;
            replyCount: number;
            createTimeISO: Date | null;
            authorUsername: string | null;
            authorUserId: string | null;
        };

        const deriveId = (c: RawComment): string | null => {
            const uid = c.uid as string | undefined;
            const ts = c.createTimeISO as string | undefined;
            return uid && ts ? `${uid}_${ts}` : null;
        };

        const incomingIds = new Set<string>();
        const mapped: CommentItem[] = [];

        for (const c of rawComments) {
            const id = deriveId(c as RawComment);
            if (!id) continue;
            incomingIds.add(id);
            mapped.push({
                tiktokCommentId: id,
                text: (c.text as string) || "",
                diggCount: (c.diggCount as number) ?? 0,
                replyCount: (c.replyCommentTotal as number) ?? 0,
                createTimeISO: c.createTimeISO ? new Date(c.createTimeISO as string) : null,
                authorUsername: (c.uniqueId as string) || null,
                authorUserId: (c.uid as string) || null,
            });
        }

        // Delete stale comments no longer returned by TikTok
        if (incomingIds.size > 0) {
            await prisma.comment.deleteMany({
                where: {
                    postId,
                    tiktokCommentId: { notIn: Array.from(incomingIds) },
                },
            });
        }

        // Upsert each comment (batch not supported for upsert)
        const upserted: Record<string, unknown>[] = [];
        for (const item of mapped) {
            const created = await prisma.comment.upsert({
                where: {
                    postId_tiktokCommentId: { postId, tiktokCommentId: item.tiktokCommentId },
                },
                create: { postId, ...item },
                update: item,
            });
            upserted.push(created);
        }

        return NextResponse.json({ data: upserted, total: upserted.length }, { status: 200 });
    } catch (error) {
        console.error("Error extracting comments:", error);
        return NextResponse.json({ error: "Error al extraer comentarios" }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function n<T>(value: T | undefined): T | null {
    return value === undefined ? null : value;
}

interface ScraperAuthorMeta {
    id: string;
    name: string;
    profileUrl: string;
    nickName: string;
    verified: boolean;
    signature: string;
    bioLink: string;
    avatar: string;
    commerceUserInfo?: { commerceUser?: boolean };
    privateAccount: boolean;
    roomId: string;
    ttSeller: boolean;
    createTime: number;
    following: number;
    friends: number;
    fans: number;
    heart: number;
    video: number;
    digg: number;
    originalAvatarUrl: string;
}

interface ScraperMusicMeta {
    musicName: string;
    musicAuthor: string;
    musicOriginal: boolean;
    playUrl: string;
    coverMediumUrl: string;
    musicId: string;
    originalCoverMediumUrl: string;
}

interface ScraperVideoMeta {
    height: number;
    width: number;
    duration: number;
    coverUrl: string;
    definition: string;
    format: string;
    subtitleLinks: { language: string; downloadLink: string; source: string }[] | null;
    transcriptionLink: string | null;
    originalCoverUrl: string;
}

interface ScraperDetailedMention {
    id: string;
    name: string;
    nickName: string;
    profileUrl: string;
}

interface ScraperHashtag {
    name: string;
}

interface ScraperResult {
    id: string;
    text: string;
    textLanguage: string;
    createTime: number;
    createTimeISO: string;
    isAd: boolean;
    authorMeta: ScraperAuthorMeta;
    musicMeta: ScraperMusicMeta;
    webVideoUrl: string;
    videoMeta: ScraperVideoMeta;
    diggCount: number;
    shareCount: number;
    playCount: number;
    collectCount: number;
    commentCount: number;
    repostCount: number;
    mentions: string[];
    detailedMentions: ScraperDetailedMention[];
    hashtags: ScraperHashtag[];
    effectStickers: string[];
    isSlideshow: boolean;
    isPinned: boolean;
    isSponsored: boolean;
    mediaUrls: string[];
    input: string;
    fromProfileSection: string;
    commentsDatasetUrl: string | null;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { scrapedData, profileInput } = body as {
            scrapedData?: { profiles: string[]; total: number; results: ScraperResult[] };
            profileInput?: string;
        };

        let scraperData: { profiles: string[]; total: number; results: ScraperResult[] };

        if (scrapedData) {
            // Data already scraped, use it directly
            scraperData = scrapedData;
        } else if (profileInput && profileInput.trim()) {
            // Scrape the profile
            const scraperUrl = process.env.SCRAPER_API_URL ?? "https://influmetics-scraper-service.onrender.com";
            const scraperKey = process.env.SCRAPER_API_KEY ?? "";

            const username = profileInput.trim().replace(/^@/, "").replace(/https?:\/\/[^/]+\//, "").replace(/^@/, "");

            const scraperRes = await fetch(`${scraperUrl}/scrape/profile`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "accept": "application/json",
                    "X-API-Key": scraperKey,
                },
                body: JSON.stringify({
                    profiles: [username],
                    resultsPerPage: 12,
                    shouldDownloadVideos: false,
                    shouldDownloadCovers: false,
                    shouldDownloadSlideshowImages: false,
                    shouldDownloadSubtitles: false,
                }),
            });

            if (!scraperRes.ok) {
                const errBody = await scraperRes.json().catch(() => ({}));
                return NextResponse.json(
                    { error: "Error al scrapear perfil", details: errBody },
                    { status: scraperRes.status }
                );
            }

            scraperData = await scraperRes.json();
        } else {
            return NextResponse.json({ error: "Envia scrapedData o profileInput" }, { status: 400 });
        }

        if (!scraperData.results || scraperData.results.length === 0) {
            return NextResponse.json({ error: "No se encontraron resultados para este perfil" }, { status: 404 });
        }

        const firstResult = scraperData.results[0];
        const author = firstResult.authorMeta;

        // Find or create the social platform "tiktok"
        const tiktokPlatform = await prisma.socialPlatform.findUnique({ where: { code: "tiktok" } });

        const result = await prisma.$transaction(async (tx) => {
            // Find or create the influencer by TikTok handle
            const existingAccount = await tx.influencerSocialAccount.findFirst({
                where: {
                    socialPlatformId: tiktokPlatform!.id,
                    handle: { equals: author.name, mode: "insensitive" },
                },
                include: { influencer: true },
            });

            let influencerId: number;

            if (existingAccount) {
                // Update existing social account with fresh scraped data
                await tx.influencerSocialAccount.update({
                    where: { id: existingAccount.id },
                    data: {
                        profileUrl: n(author.profileUrl),
                        isActive: true,
                        tiktokUserId: n(author.id),
                        nickName: n(author.nickName),
                        verified: n(author.verified) ?? false,
                        signature: n(author.signature),
                        bioLink: n(author.bioLink),
                        avatar: n(author.avatar),
                        following: n(author.following) ?? 0,
                        friends: n(author.friends) ?? 0,
                        fans: n(author.fans) ?? 0,
                        heart: n(author.heart) ?? 0,
                        video: n(author.video) ?? 0,
                        digg: n(author.digg) ?? 0,
                        privateAccount: n(author.privateAccount) ?? false,
                        ttSeller: n(author.ttSeller) ?? false,
                        commerceUser: author.commerceUserInfo?.commerceUser ?? false,
                        scrapedAt: new Date(),
                    },
                });
                influencerId = existingAccount.influencerId;
            } else {
                // Create a new influencer with this TikTok account
                const newInfluencer = await tx.influencer.create({
                    data: {
                        name: author.nickName || author.name,
                        referralCode: `TT_${author.name}`,
                    },
                });
                influencerId = newInfluencer.id;

                await tx.influencerSocialAccount.create({
                    data: {
                        influencerId: newInfluencer.id,
                        socialPlatformId: tiktokPlatform!.id,
                        handle: author.name,
                        profileUrl: n(author.profileUrl),
                        isActive: true,
                        tiktokUserId: n(author.id),
                        nickName: n(author.nickName),
                        verified: n(author.verified) ?? false,
                        signature: n(author.signature),
                        bioLink: n(author.bioLink),
                        avatar: n(author.avatar),
                        following: n(author.following) ?? 0,
                        friends: n(author.friends) ?? 0,
                        fans: n(author.fans) ?? 0,
                        heart: n(author.heart) ?? 0,
                        video: n(author.video) ?? 0,
                        digg: n(author.digg) ?? 0,
                        privateAccount: n(author.privateAccount) ?? false,
                        ttSeller: n(author.ttSeller) ?? false,
                        commerceUser: author.commerceUserInfo?.commerceUser ?? false,
                        scrapedAt: new Date(),
                    },
                });
            }

            // Save all posts
            for (const result of scraperData.results) {
                const publishedAt = new Date(result.createTimeISO);

                let existingPost = await tx.post.findFirst({
                    where: { tiktokVideoId: result.id, influencerId },
                });

                if (existingPost) {
                    await tx.post.update({
                        where: { id: existingPost.id },
                        data: {
                            caption: result.text,
                            publishedAt,
                            duration: result.videoMeta.duration,
                            coverUrl: result.videoMeta.coverUrl,
                            webVideoUrl: result.webVideoUrl,
                            isPinned: result.isPinned,
                        },
                    });
                } else {
                    existingPost = await tx.post.create({
                        data: {
                            influencerId,
                            socialPlatformId: tiktokPlatform!.id,
                            url: result.webVideoUrl,
                            caption: result.text,
                            publishedAt,
                            tiktokVideoId: result.id,
                            textLanguage: result.textLanguage,
                            isAd: result.isAd,
                            duration: result.videoMeta.duration,
                            width: result.videoMeta.width,
                            height: result.videoMeta.height,
                            coverUrl: result.videoMeta.coverUrl,
                            definition: result.videoMeta.definition,
                            format: result.videoMeta.format,
                            webVideoUrl: result.webVideoUrl,
                            musicName: result.musicMeta.musicName,
                            musicAuthor: result.musicMeta.musicAuthor,
                            musicPlayUrl: result.musicMeta.playUrl,
                            musicId: result.musicMeta.musicId,
                            isSlideshow: result.isSlideshow,
                            isPinned: result.isPinned,
                            isSponsored: result.isSponsored,
                            fromProfileSection: result.fromProfileSection,
                            commentsDatasetUrl: result.commentsDatasetUrl,
                        },
                    });
                }

                const postId = existingPost.id;

                // Create or update metric snapshot
                await tx.postMetricSnapshot.upsert({
                    where: {
                        postId_snapshotDate: {
                            postId,
                            snapshotDate: publishedAt,
                        },
                    },
                    create: {
                        postId,
                        snapshotDate: publishedAt,
                        views: result.playCount,
                        likes: result.diggCount,
                        shares: result.shareCount,
                        saves: result.collectCount,
                        reposts: result.repostCount,
                        playCount: result.playCount,
                        commentCount: result.commentCount,
                    },
                    update: {
                        views: result.playCount,
                        likes: result.diggCount,
                        shares: result.shareCount,
                        saves: result.collectCount,
                        reposts: result.repostCount,
                        playCount: result.playCount,
                        commentCount: result.commentCount,
                    },
                });

                // Save hashtags
                if (result.hashtags && result.hashtags.length > 0) {
                    await tx.postHashtag.deleteMany({ where: { postId } });
                    await tx.postHashtag.createMany({
                        data: result.hashtags
                            .filter((h) => h.name && h.name.trim())
                            .map((h) => ({
                                postId,
                                name: h.name.trim(),
                            })),
                    });
                }

                // Save subtitles
                if (result.videoMeta.subtitleLinks && result.videoMeta.subtitleLinks.length > 0) {
                    await tx.postSubtitle.deleteMany({ where: { postId } });
                    await tx.postSubtitle.createMany({
                        data: result.videoMeta.subtitleLinks.map((s) => ({
                            postId,
                            language: s.language,
                            downloadLink: s.downloadLink,
                            source: s.source,
                        })),
                    });
                }

                // Save mentions
                if (result.detailedMentions && result.detailedMentions.length > 0) {
                    await tx.postMention.deleteMany({ where: { postId } });
                    await tx.postMention.createMany({
                        data: result.detailedMentions.map((m) => ({
                            postId,
                            mentionedUserId: m.id,
                            mentionedName: m.name,
                            nickName: m.nickName,
                            profileUrl: m.profileUrl,
                        })),
                    });
                }
            }

            // Return the updated influencer with all data
            return await tx.influencer.findUnique({
                where: { id: influencerId },
                include: {
                    socialAccounts: {
                        include: { socialPlatform: true },
                    },
                    influencerCampaigns: {
                        include: { campaign: true },
                    },
                    posts: {
                        include: {
                            metrics: { orderBy: { snapshotDate: "desc" }, take: 1 },
                            hashtags: true,
                            mentions: true,
                            subtitles: true,
                        },
                        orderBy: { publishedAt: "desc" },
                    },
                    _count: {
                        select: { posts: true, influencerCampaigns: true },
                    },
                },
            });
        }, { timeout: 30000 });

        return NextResponse.json({ success: true, data: result }, { status: 200 });
    } catch (error) {
        console.error("Error saving scraped data:", error);
        return NextResponse.json(
            { error: "Error al guardar datos del scraper" },
            { status: 500 }
        );
    }
}

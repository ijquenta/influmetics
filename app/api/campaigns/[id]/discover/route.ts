import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SCRAPER_URL = process.env.SCRAPER_API_URL || "http://localhost:8000";
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY || "";

async function callScraper(endpoint: string, body: unknown) {
    const res = await fetch(`${SCRAPER_URL}${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-Key": SCRAPER_API_KEY,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Scraper error (${res.status}): ${err}`);
    }
    return res.json();
}

let _tiktokPlatform: { id: number } | null = null;

async function getTikTokPlatform() {
    if (!_tiktokPlatform) {
        _tiktokPlatform = await prisma.socialPlatform.findUnique({ where: { code: "tiktok" } });
    }
    return _tiktokPlatform;
}

async function getOrCreateInfluencer(author: {
    name: string;
    nickName?: string;
    profileUrl?: string;
    avatar?: string;
    fans?: number;
    heart?: number;
    video?: number;
    following?: number;
    verified?: boolean;
    signature?: string;
}) {
    const username = author.name?.toLowerCase().trim();
    if (!username) return null;

    const platform = await getTikTokPlatform();
    if (!platform) return null;

    const existingAccount = await prisma.influencerSocialAccount.findFirst({
        where: { handle: username, socialPlatformId: platform.id },
        include: { influencer: true },
    });

    if (existingAccount) return existingAccount.influencer;

    const influencer = await prisma.influencer.create({
        data: {
            name: author.nickName || username,
            socialAccounts: {
                create: {
                    socialPlatformId: platform.id,
                    handle: username,
                    profileUrl: author.profileUrl,
                    nickName: author.nickName,
                    avatar: author.avatar,
                    verified: author.verified ?? false,
                    signature: author.signature,
                    fans: author.fans ?? 0,
                    heart: author.heart ?? 0,
                    video: author.video ?? 0,
                    following: author.following ?? 0,
                    friends: 0,
                },
            },
        },
    });

    return influencer;
}

async function linkInfluencerToCampaign(influencerId: number, campaignId: number) {
    const existing = await prisma.influencerCampaign.findUnique({
        where: { influencerId_campaignId: { influencerId, campaignId } },
    });
    if (!existing) {
        await prisma.influencerCampaign.create({
            data: { influencerId, campaignId },
        });
    }
}

async function upsertPost(
    item: {
        id?: string;
        text?: string;
        createTimeISO?: string;
        webVideoUrl?: string;
        diggCount?: number;
        playCount?: number;
        shareCount?: number;
        commentCount?: number;
        collectCount?: number;
        hashtags?: string[];
        isSponsored?: boolean;
        author?: { name?: string };
        video?: { duration?: number; coverUrl?: string };
    },
    influencerId: number,
    campaignId: number
) {
    if (!item.id) return null;

    const platform = await getTikTokPlatform();

    const existing = await prisma.post.findFirst({
        where: { tiktokVideoId: item.id },
    });

    if (existing) {
        if (existing.campaignId !== campaignId) {
            await prisma.post.update({
                where: { id: existing.id },
                data: { campaignId },
            });
        }
        return existing;
    }

    const post = await prisma.post.create({
        data: {
            influencerId,
            campaignId,
            socialPlatformId: platform!.id,
            url: item.webVideoUrl || `https://www.tiktok.com/video/${item.id}`,
            caption: item.text,
            publishedAt: item.createTimeISO ? new Date(item.createTimeISO) : new Date(),
            tiktokVideoId: item.id,
            duration: item.video?.duration,
            coverUrl: item.video?.coverUrl,
            isSponsored: item.isSponsored ?? false,
            metrics: {
                create: {
                    snapshotDate: new Date(),
                    views: item.playCount ?? 0,
                    likes: item.diggCount ?? 0,
                    shares: item.shareCount ?? 0,
                    commentCount: item.commentCount ?? 0,
                    saves: item.collectCount ?? 0,
                },
            },
        },
    });

    if (item.hashtags && item.hashtags.length > 0) {
        await prisma.postHashtag.createMany({
            data: item.hashtags.map((name) => ({
                postId: post.id,
                name,
            })),
        });
    }

    return post;
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countKeywordMentions(text: string | undefined, keywords: string[]): number {
    if (!text || keywords.length === 0) return 0;
    const lower = text.toLowerCase();
    return keywords.reduce((count, kw) => {
        const escaped = escapeRegex(kw.toLowerCase());
        const regex = new RegExp(escaped, "g");
        const matches = lower.match(regex);
        return count + (matches ? matches.length : 0);
    }, 0);
}

function calculateEngagementRate(post: { diggCount?: number; commentCount?: number; shareCount?: number; playCount?: number }): number {
    const views = post.playCount || 0;
    if (views === 0) return 0;
    const engagement = (post.diggCount || 0) + (post.commentCount || 0) + (post.shareCount || 0);
    return (engagement / views) * 100;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);

        const campaign = await prisma.campaign.findUnique({
            where: { id },
            include: { campaignHashtags: true },
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
        }

        const body = await request.json().catch(() => ({}));
        const knownHandles: string[] = body.knownHandles || [];

        const hashtags = campaign.campaignHashtags.map((h) => h.hashtag).filter(Boolean) as string[];
        const keywords = campaign.campaignHashtags.map((h) => h.keyword).filter(Boolean) as string[];

        if (hashtags.length === 0 && keywords.length === 0) {
            return NextResponse.json({ error: "La campaña no tiene hashtags ni keywords configurados. Agrega al menos uno." }, { status: 400 });
        }

        const scraperResult = await callScraper("/scrape/hashtags", {
            hashtags,
            keywords,
            maxItems: 50,
        });

        const results: unknown[] = scraperResult.results || [];
        const mentionsCount: Record<number, number> = {};
        const postsPerInfluencer: Record<number, unknown[]> = {};
        const engagementPerInfluencer: Record<number, number[]> = {};

        for (const item of results) {
            const itemTyped = item as Record<string, unknown>;
            const author = itemTyped.author as Record<string, unknown> | undefined;
            if (!author) continue;

            const influencer = await getOrCreateInfluencer({
                name: author.name as string,
                nickName: author.nickName as string,
                profileUrl: author.profileUrl as string,
                avatar: author.avatar as string,
                fans: author.fans as number,
                heart: author.heart as number,
                video: author.video as number,
                following: author.following as number,
                verified: author.verified as boolean,
                signature: author.signature as string,
            });

            if (!influencer) continue;

            await linkInfluencerToCampaign(influencer.id, id);

            const post = await upsertPost(itemTyped as Parameters<typeof upsertPost>[0], influencer.id, id);
            if (!post) continue;

            if (!postsPerInfluencer[influencer.id]) postsPerInfluencer[influencer.id] = [];
            postsPerInfluencer[influencer.id].push(post);

            if (!engagementPerInfluencer[influencer.id]) engagementPerInfluencer[influencer.id] = [];
            engagementPerInfluencer[influencer.id].push(calculateEngagementRate(itemTyped as Parameters<typeof calculateEngagementRate>[0]));

            if (!mentionsCount[influencer.id]) mentionsCount[influencer.id] = 0;
            mentionsCount[influencer.id] += countKeywordMentions(itemTyped.text as string, keywords);
        }

        if (knownHandles.length > 0) {
            const platform = await getTikTokPlatform();
            if (platform) {
                const cleanHandles = knownHandles.map((h: string) => h.toLowerCase().trim());
                const accounts = await prisma.influencerSocialAccount.findMany({
                    where: { handle: { in: cleanHandles }, socialPlatformId: platform.id },
                    include: { influencer: true },
                });
                for (const account of accounts) {
                    await linkInfluencerToCampaign(account.influencer.id, id);
                }
            }
        }

        await prisma.campaign.update({
            where: { id },
            data: { lastDiscoveredAt: new Date() },
        });

        const campaignWithData = await prisma.campaign.findUnique({
            where: { id },
            include: {
                campaignHashtags: true,
                influencerCampaigns: {
                    include: {
                        influencer: {
                            include: {
                                socialAccounts: {
                                    where: { socialPlatform: { code: "tiktok" } },
                                },
                                posts: {
                                    where: { campaignId: id },
                                    include: {
                                        hashtags: true,
                                        metrics: { orderBy: { snapshotDate: "desc" }, take: 1 },
                                    },
                                },
                            },
                        },
                    },
                },
                _count: { select: { influencerCampaigns: true, posts: true } },
            },
        });

        const analysis = (campaignWithData?.influencerCampaigns || []).map((ic) => {
            const inf = ic.influencer;
            const posts_data = inf.posts;
            const totalViews = posts_data.reduce((s, p) => s + (p.metrics[0]?.views || 0), 0);
            const totalLikes = posts_data.reduce((s, p) => s + (p.metrics[0]?.likes || 0), 0);
            const totalComments = posts_data.reduce((s, p) => s + (p.metrics[0]?.commentCount || 0), 0);
            const totalShares = posts_data.reduce((s, p) => s + (p.metrics[0]?.shares || 0), 0);
            const avgEngagement = totalViews > 0 ? ((totalLikes + totalComments + totalShares) / totalViews) * 100 : 0;
            const brandMentions = mentionsCount[inf.id] || 0;
            const allHashtags = [...new Set(posts_data.flatMap((p) => p.hashtags.map((h) => h.name)))];

            return {
                influencerId: inf.id,
                influencerName: inf.name,
                avatar: inf.socialAccounts[0]?.avatar || null,
                handle: inf.socialAccounts[0]?.handle || null,
                postsDetected: posts_data.length,
                totalViews,
                avgEngagement: Math.round(avgEngagement * 100) / 100,
                brandMentions,
                topHashtags: allHashtags.slice(0, 10),
                posts: posts_data.map((p) => ({
                    id: p.id,
                    caption: p.caption,
                    url: p.url,
                    publishedAt: p.publishedAt,
                    metrics: p.metrics[0] || null,
                })),
            };
        });

        analysis.sort((a, b) => b.brandMentions - a.brandMentions || b.totalViews - a.totalViews);

        return NextResponse.json({
            data: {
                campaignId: id,
                campaignName: campaign.name,
                hashtags,
                keywords,
                totalVideosFound: results.length,
                totalInfluencersDetected: analysis.length,
                discoveredAt: new Date().toISOString(),
                influencers: analysis,
            },
        });
    } catch (error) {
        console.error("Error discovering campaign:", error);
        const message = error instanceof Error ? error.message : "Error interno";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
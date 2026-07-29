import { NextRequest, NextResponse } from "next/server";
import { computeDiagnostic } from "@/lib/diagnostic";
import { analyzeSentiments } from "@/lib/gemini";

const SCRAPER_API_URL = process.env.SCRAPER_API_URL ?? "http://localhost:8000";
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY ?? "";

export interface CampaignInfluencerResult {
  username: string;
  profile: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    signature: string | null;
    followers: number;
    following: number;
    hearts: number;
    videos: number;
    verified: boolean;
  };
  posts: {
    id: string;
    caption: string | null;
    playCount: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    coverUrl: string | null;
    webVideoUrl: string | null;
    duration: number | null;
    publishedAt: string;
  }[];
  comments: {
    videoId: string;
    text: string;
    diggCount: number;
    uniqueId: string;
    sentiment: { label: "positivo" | "negativo" | "neutral"; score: number };
  }[];
  metrics: {
    totalViews: number;
    avgViews: number;
    totalEngagements: number;
    engagementRate: number;
    estimatedEMV: number;
    postsAnalyzed: number;
  };
  score: {
    total: number;
    audience: number;
    engagement: number;
    reach: number;
    consistency: number;
    label: string;
    topPercent: string;
  };
  sentimentSummary: {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
    positiveRate: number;
  };
}

export interface CampaignResult {
  influencers: CampaignInfluencerResult[];
  campaignMetrics: {
    totalInfluencers: number;
    totalVideos: number;
    totalComments: number;
    totalEMV: number;
    avgEngagementRate: number;
    totalPositiveRate: number;
  };
}

async function callScraperWithComments(usernames: string[]) {
  const res = await fetch(`${SCRAPER_API_URL}/scrape/profile-with-comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "accept": "application/json",
      "X-API-Key": SCRAPER_API_KEY,
    },
    body: JSON.stringify({
      profiles: usernames,
      resultsPerPage: 3,
      commentsPerPost: 15,
      maxRepliesPerComment: 0,
      topVideos: 3,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
      shouldDownloadSlideshowImages: false,
      shouldDownloadSubtitles: false,
    }),
    signal: AbortSignal.timeout(180000),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Error del scraper");
  }

  return await res.json();
}

function extractUsername(value: string): string {
  const trimmed = value.trim().replace(/^@/, "");
  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1]?.replace(/^@/, "") || trimmed;
  } catch {
    return trimmed;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawUsernames = body.usernames as string[] | undefined;

    if (!rawUsernames || rawUsernames.length === 0) {
      return NextResponse.json(
        { error: "Ingresa al menos un influencer" },
        { status: 400 }
      );
    }

    const usernames = rawUsernames.map(extractUsername).filter(Boolean);
    if (usernames.length === 0) {
      return NextResponse.json(
        { error: "Ingresa al menos un usuario de TikTok válido" },
        { status: 400 }
      );
    }

    const scraperData = await callScraperWithComments(usernames);
    const items = scraperData.results || [];
    const commentsMap = scraperData.comments || {};

    if (items.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron datos para los usuarios proporcionados" },
        { status: 404 }
      );
    }

    const authorMap = new Map<string, { author: any; videos: any[] }>();
    for (const item of items) {
      const author = item.author;
      if (!author?.name) continue;
      const key = author.name;
      if (!authorMap.has(key)) {
        authorMap.set(key, { author, videos: [] });
      }
      authorMap.get(key)!.videos.push(item);
    }

    const influencerResults: CampaignInfluencerResult[] = [];

    for (const [username, data] of authorMap) {
      const { author, videos } = data;

      const profile = {
        id: author.id || username,
        name: author.name || author.nickName || username,
        username: author.name || username,
        avatar: author.avatar || null,
        signature: author.signature || null,
        followers: author.fans || 0,
        following: author.following || 0,
        hearts: author.heart || 0,
        videos: author.video || 0,
        verified: author.verified || false,
      };

      const posts = videos.slice(0, 3).map((v: any) => ({
        id: v.id || `post_${Math.random()}`,
        caption: v.text || null,
        playCount: v.playCount || 0,
        likes: v.diggCount || 0,
        comments: v.commentCount || 0,
        shares: v.shareCount || 0,
        saves: v.collectCount || Math.round((v.diggCount || 0) * 0.15),
        coverUrl: v.video?.coverUrl || null,
        webVideoUrl: v.webVideoUrl || null,
        duration: v.video?.duration || null,
        publishedAt: v.createTimeISO || new Date().toISOString(),
      }));

      const allComments: { videoId: string; text: string; diggCount: number; uniqueId: string }[] = [];
      for (const vid of videos) {
        const vidComments = commentsMap[vid.id] || [];
        for (const c of vidComments) {
          if (c.text) {
            allComments.push({
              videoId: vid.id,
              text: c.text,
              diggCount: c.diggCount || 0,
              uniqueId: c.uniqueId || "",
            });
          }
        }
      }

      let commentsWithSentiment: CampaignInfluencerResult["comments"] = [];
      if (allComments.length > 0) {
        const commentTexts = allComments.map((c) => c.text);
        const sentiments = await analyzeSentiments(commentTexts);
        commentsWithSentiment = allComments.map((c, i) => ({
          ...c,
          sentiment: sentiments[i] || { label: "neutral" as const, score: 0.5 },
        }));
      }

      const diagnostic = computeDiagnostic(
        { ...profile, privateAccount: false },
        posts.map((p: any) => ({ ...p, id: p.id || `p_${Math.random()}` }))
      );

      const positive = commentsWithSentiment.filter((c) => c.sentiment.label === "positivo").length;
      const negative = commentsWithSentiment.filter((c) => c.sentiment.label === "negativo").length;
      const neutral = commentsWithSentiment.filter((c) => c.sentiment.label === "neutral").length;
      const totalComments = commentsWithSentiment.length;

      influencerResults.push({
        username,
        profile,
        posts,
        comments: commentsWithSentiment,
        metrics: diagnostic.metrics,
        score: diagnostic.score,
        sentimentSummary: {
          total: totalComments,
          positive,
          negative,
          neutral,
          positiveRate: totalComments > 0 ? Math.round((positive / totalComments) * 100) : 0,
        },
      });
    }

    const totalEMV = influencerResults.reduce((s, r) => s + r.metrics.estimatedEMV, 0);
    const totalEngagement = influencerResults.reduce((s, r) => s + r.metrics.engagementRate, 0);
    const totalPositiveRate = influencerResults.reduce(
      (s, r) => s + r.sentimentSummary.positiveRate,
      0
    );
    const totalVideos = influencerResults.reduce((s, r) => s + r.posts.length, 0);
    const totalComments = influencerResults.reduce((s, r) => s + r.comments.length, 0);

    const result: CampaignResult = {
      influencers: influencerResults,
      campaignMetrics: {
        totalInfluencers: influencerResults.length,
        totalVideos,
        totalComments,
        totalEMV,
        avgEngagementRate:
          influencerResults.length > 0
            ? Math.round((totalEngagement / influencerResults.length) * 100) / 100
            : 0,
        totalPositiveRate:
          influencerResults.length > 0
            ? Math.round(totalPositiveRate / influencerResults.length)
            : 0,
      },
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Error en campaña:", error);
    if (error?.message?.includes?.("timed out") || error?.name === "TimeoutError" || error?.name === "AbortError") {
      return NextResponse.json(
        { error: "El análisis está tomando más tiempo del esperado. Intenta con menos influencers." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: error?.message || "Error al analizar la campaña" },
      { status: 500 }
    );
  }
}

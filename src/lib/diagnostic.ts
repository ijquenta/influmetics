export interface DiagnosticProfile {
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
  privateAccount: boolean;
}

export interface DiagnosticPost {
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
}

export interface DiagnosticMetrics {
  totalViews: number;
  avgViews: number;
  totalEngagements: number;
  engagementRate: number;
  estimatedEMV: number;
  postsAnalyzed: number;
}

export interface DiagnosticScore {
  total: number;
  audience: number;
  engagement: number;
  reach: number;
  consistency: number;
  label: string;
  topPercent: string;
}

export interface DiagnosticResult {
  profile: DiagnosticProfile;
  posts: DiagnosticPost[];
  metrics: DiagnosticMetrics;
  score: DiagnosticScore;
}

export interface CommentSentiment {
  videoId: string;
  text: string;
  diggCount: number;
  uniqueId: string;
  sentiment: { label: "positivo" | "negativo" | "neutral"; score: number };
}

export interface SentimentSummary {
  total: number;
  positive: number;
  negative: number;
  neutral: number;
  positiveRate: number;
}

export interface CampaignInfluencerResult {
  username: string;
  profile: DiagnosticProfile;
  posts: DiagnosticPost[];
  comments: CommentSentiment[];
  metrics: DiagnosticMetrics;
  score: DiagnosticScore;
  sentimentSummary: SentimentSummary;
}

export interface CampaignMetrics {
  totalInfluencers: number;
  totalVideos: number;
  totalComments: number;
  totalEMV: number;
  avgEngagementRate: number;
  totalPositiveRate: number;
}

export interface CampaignResult {
  influencers: CampaignInfluencerResult[];
  campaignMetrics: CampaignMetrics;
}

export function calculateEMV(totalViews: number, engagementRate: number): number {
  const baseCPM = 10;
  const engagementMultiplier = 1 + (engagementRate / 100) * 2;
  const estimatedImpressions = totalViews * 0.7;
  return Math.round((estimatedImpressions / 1000) * baseCPM * engagementMultiplier);
}

export function calculateER(likes: number, comments: number, shares: number, saves: number, followers: number): number {
  if (followers <= 0) return 0;
  return ((likes + comments + shares + saves) / followers) * 100;
}

export function calculateScore(
  followers: number,
  avgViews: number,
  engagementRate: number,
  totalPosts: number,
  hearts: number
): DiagnosticScore {
  const BASE = 15;

  const audienceScore = followers > 0
    ? Math.min(25, Math.log10(followers) * 4.2)
    : 5;

  const engagementScore = Math.min(30, engagementRate * 2.5);

  const reachScore = (followers > 0 && avgViews > 0)
    ? Math.min(25, Math.min(avgViews / followers, 10) * 2.5)
    : 10;

  const consistencyBase = Math.min(totalPosts, 500);
  const consistencyScore = Math.min(20, (consistencyBase / 500) * 20);

  const total = Math.min(100, Math.max(0, Math.round(BASE + audienceScore + engagementScore + reachScore + consistencyScore)));

  let label: string;
  if (total >= 80) label = "Top Creador";
  else if (total >= 60) label = "Creador Destacado";
  else if (total >= 40) label = "Creador en Crecimiento";
  else label = "Perfil Inicial";

  let topPercent: string;
  if (total >= 85) topPercent = "Top 5%";
  else if (total >= 75) topPercent = "Top 15%";
  else if (total >= 60) topPercent = "Top 30%";
  else if (total >= 45) topPercent = "Top 50%";
  else topPercent = "Top 70%";

  return {
    total,
    audience: Math.round(audienceScore),
    engagement: Math.round(engagementScore),
    reach: Math.round(reachScore),
    consistency: Math.round(consistencyScore),
    label,
    topPercent,
  };
}

export function computeDiagnostic(profile: DiagnosticProfile, posts: DiagnosticPost[]): DiagnosticResult {
  const followers = profile.followers || 0;
  const totalPosts = profile.videos || posts.length || 1;

  const totalViews = posts.reduce((s, p) => s + (p.playCount || 0), 0);
  const avgViews = posts.length > 0 ? Math.round(totalViews / posts.length) : 0;

  const totalLikes = posts.reduce((s, p) => s + (p.likes || 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.comments || 0), 0);
  const totalShares = posts.reduce((s, p) => s + (p.shares || 0), 0);
  const totalSaves = posts.reduce((s, p) => s + (p.saves || 0), 0);
  const totalEngagements = totalLikes + totalComments + totalShares + totalSaves;

  const engagementRate = calculateER(totalLikes, totalComments, totalShares, totalSaves, followers);
  const estimatedEMV = calculateEMV(totalViews, engagementRate);

  const score = calculateScore(followers, avgViews, engagementRate, totalPosts, profile.hearts || 0);

  return {
    profile,
    posts: posts.slice(0, 10),
    metrics: {
      totalViews,
      avgViews,
      totalEngagements,
      engagementRate: Math.round(engagementRate * 100) / 100,
      estimatedEMV,
      postsAnalyzed: posts.length,
    },
    score,
  };
}

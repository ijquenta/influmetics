// Tipos relacionados con influencers

import type { Influencer, InfluencerSocialAccount, Post, PostMetricSnapshot, Campaign, InfluencerCampaign } from "@prisma/client";

export interface InfluencerWithRelations extends Influencer {
    socialAccounts: (InfluencerSocialAccount & {
        socialPlatform: { code: string; name: string };
    })[];
    influencerCampaigns: (InfluencerCampaign & {
        campaign: Campaign;
    })[];
    posts: Post[];
    _count?: {
        posts: number;
        influencerCampaigns: number;
    };
}

export interface PostWithMetrics extends Post {
    influencer: Influencer;
    campaign: Campaign | null;
    socialPlatform: { code: string; name: string };
    contentType: { code: string; name: string } | null;
    metrics: PostMetricSnapshot[];
}

export interface CampaignWithRelations extends Campaign {
    primaryGoalType: { code: string; name: string } | null;
    influencerCampaigns: (InfluencerCampaign & {
        influencer: Influencer;
    })[];
    posts: Post[];
    _count?: {
        influencerCampaigns: number;
        posts: number;
    };
}

export interface MetricInput {
    postId: number;
    snapshotDate: Date;
    views?: number | null;
    likes?: number | null;
    shares?: number | null;
    clicks?: number | null;
    conversions?: number | null;
    revenue?: number | null;
    roi?: number | null;
}

export interface DashboardFilters {
    campaignId?: number;
    influencerId?: number;
    socialPlatformId?: number;
    startDate?: Date;
    endDate?: Date;
}

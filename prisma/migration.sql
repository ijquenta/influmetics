-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "rubro" TEXT,
    "culture" TEXT,
    "description" TEXT,
    "country" TEXT,
    "website" TEXT,
    "logo" TEXT,
    "size" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserType" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "UserType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "country" TEXT,
    "userTypeId" INTEGER NOT NULL,
    "companyId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPlatform" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SocialPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Influencer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "birthDate" TIMESTAMP(3),
    "niche" TEXT,
    "referralCode" TEXT,
    "notes" TEXT,
    "companyId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Influencer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerSocialAccount" (
    "id" SERIAL NOT NULL,
    "influencerId" INTEGER NOT NULL,
    "socialPlatformId" INTEGER NOT NULL,
    "handle" TEXT NOT NULL,
    "profileUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tiktokUserId" TEXT,
    "nickName" TEXT,
    "verified" BOOLEAN DEFAULT false,
    "signature" TEXT,
    "avatar" TEXT,
    "following" INTEGER DEFAULT 0,
    "friends" INTEGER DEFAULT 0,
    "fans" INTEGER DEFAULT 0,
    "heart" INTEGER DEFAULT 0,
    "video" INTEGER DEFAULT 0,
    "privateAccount" BOOLEAN DEFAULT false,
    "scrapedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfluencerSocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignGoalType" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CampaignGoalType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignHashtag" (
    "id" SERIAL NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "hashtag" TEXT,
    "keyword" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignHashtag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "country" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "primaryGoalTypeId" INTEGER,
    "companyId" INTEGER,
    "lastDiscoveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerCampaign" (
    "id" SERIAL NOT NULL,
    "influencerId" INTEGER NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "agreedCost" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InfluencerCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentType" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ContentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "influencerId" INTEGER NOT NULL,
    "campaignId" INTEGER,
    "socialPlatformId" INTEGER NOT NULL,
    "contentTypeId" INTEGER,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "isTakenosContent" BOOLEAN NOT NULL DEFAULT false,
    "tiktokVideoId" TEXT,
    "textLanguage" TEXT,
    "duration" INTEGER,
    "coverUrl" TEXT,
    "webVideoUrl" TEXT,
    "isPinned" BOOLEAN DEFAULT false,
    "isSponsored" BOOLEAN DEFAULT false,
    "temasDestacados" TEXT,
    "sugerencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostMetricSnapshot" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "views" INTEGER,
    "likes" INTEGER,
    "shares" INTEGER,
    "clicks" INTEGER,
    "conversions" INTEGER,
    "revenue" DECIMAL(14,2),
    "roi" DECIMAL(10,4),
    "saves" INTEGER DEFAULT 0,
    "reposts" INTEGER DEFAULT 0,
    "playCount" INTEGER DEFAULT 0,
    "commentCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostMetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostHashtag" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostHashtag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostMention" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "mentionedUserId" TEXT,
    "mentionedName" TEXT,
    "nickName" TEXT,
    "profileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostSubtitle" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "downloadLink" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostSubtitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "tiktokCommentId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "diggCount" INTEGER DEFAULT 0,
    "replyCount" INTEGER DEFAULT 0,
    "createTimeISO" TIMESTAMP(3),
    "authorUsername" TEXT,
    "authorUserId" TEXT,
    "sentimentLabel" TEXT,
    "sentimentScore" DOUBLE PRECISION,
    "sentimentReason" TEXT,
    "analyzedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalMetricType" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "InternalMetricType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalMetric" (
    "id" SERIAL NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "influencerId" INTEGER,
    "metricTypeId" INTEGER NOT NULL,
    "metricDate" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(14,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternalMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserType_code_key" ON "UserType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPlatform_code_key" ON "SocialPlatform"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Influencer_referralCode_key" ON "Influencer"("referralCode");

-- CreateIndex
CREATE INDEX "InfluencerSocialAccount_handle_idx" ON "InfluencerSocialAccount"("handle");

-- CreateIndex
CREATE INDEX "InfluencerSocialAccount_socialPlatformId_handle_idx" ON "InfluencerSocialAccount"("socialPlatformId", "handle");

-- CreateIndex
CREATE UNIQUE INDEX "InfluencerSocialAccount_influencerId_socialPlatformId_key" ON "InfluencerSocialAccount"("influencerId", "socialPlatformId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignGoalType_code_key" ON "CampaignGoalType"("code");

-- CreateIndex
CREATE INDEX "CampaignHashtag_campaignId_idx" ON "CampaignHashtag"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "InfluencerCampaign_influencerId_campaignId_key" ON "InfluencerCampaign"("influencerId", "campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentType_code_key" ON "ContentType"("code");

-- CreateIndex
CREATE INDEX "Post_tiktokVideoId_idx" ON "Post"("tiktokVideoId");

-- CreateIndex
CREATE UNIQUE INDEX "PostMetricSnapshot_postId_snapshotDate_key" ON "PostMetricSnapshot"("postId", "snapshotDate");

-- CreateIndex
CREATE UNIQUE INDEX "Comment_postId_tiktokCommentId_key" ON "Comment"("postId", "tiktokCommentId");

-- CreateIndex
CREATE UNIQUE INDEX "InternalMetricType_code_key" ON "InternalMetricType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "InternalMetric_campaignId_influencerId_metricTypeId_metricD_key" ON "InternalMetric"("campaignId", "influencerId", "metricTypeId", "metricDate");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_userTypeId_fkey" FOREIGN KEY ("userTypeId") REFERENCES "UserType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Influencer" ADD CONSTRAINT "Influencer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerSocialAccount" ADD CONSTRAINT "InfluencerSocialAccount_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerSocialAccount" ADD CONSTRAINT "InfluencerSocialAccount_socialPlatformId_fkey" FOREIGN KEY ("socialPlatformId") REFERENCES "SocialPlatform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignHashtag" ADD CONSTRAINT "CampaignHashtag_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_primaryGoalTypeId_fkey" FOREIGN KEY ("primaryGoalTypeId") REFERENCES "CampaignGoalType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerCampaign" ADD CONSTRAINT "InfluencerCampaign_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerCampaign" ADD CONSTRAINT "InfluencerCampaign_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_socialPlatformId_fkey" FOREIGN KEY ("socialPlatformId") REFERENCES "SocialPlatform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_contentTypeId_fkey" FOREIGN KEY ("contentTypeId") REFERENCES "ContentType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostMetricSnapshot" ADD CONSTRAINT "PostMetricSnapshot_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostHashtag" ADD CONSTRAINT "PostHashtag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostMention" ADD CONSTRAINT "PostMention_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostSubtitle" ADD CONSTRAINT "PostSubtitle_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalMetric" ADD CONSTRAINT "InternalMetric_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalMetric" ADD CONSTRAINT "InternalMetric_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalMetric" ADD CONSTRAINT "InternalMetric_metricTypeId_fkey" FOREIGN KEY ("metricTypeId") REFERENCES "InternalMetricType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add ROI configuration columns to Campaign (run after table creation)
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "botRate" DOUBLE PRECISION;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "ticketAverage" DECIMAL(12,2);
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "marginNet" DECIMAL(5,2);
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "conversionRate" DOUBLE PRECISION;


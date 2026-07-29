"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TikTokScoreRing } from "@/components/tiktok-score-ring";
import {
  IconUsers,
  IconHeart,
  IconEye,
  IconVideo,
  IconCurrencyDollar,
  IconTrendingUp,
  IconPercentage,
  IconChartBar,
  IconBrandTiktok,
  IconCheck,
  IconMessage,
  IconMoodSmile,
  IconMoodSad,
  IconMoodEmpty,
  IconStar,
} from "@tabler/icons-react";
import type { CampaignResult } from "@/lib/diagnostic";
import Link from "next/link";

interface DiagnosticStepResultsProps {
  result: CampaignResult;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("es-ES");
}

function fmtCurrency(n: number): string {
  return `$${n.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function SentimentBadge({ label, score }: { label: string; score: number }) {
  const config: Record<string, { icon: any; color: string; bg: string }> = {
    positivo: { icon: IconMoodSmile, color: "text-green-600", bg: "bg-green-100" },
    negativo: { icon: IconMoodSad, color: "text-red-600", bg: "bg-red-100" },
    neutral: { icon: IconMoodEmpty, color: "text-muted-foreground", bg: "bg-muted" },
  };
  const cfg = config[label] || config.neutral;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} font-medium`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function InfluencerTab({ inf }: { inf: CampaignResult["influencers"][number] }) {
  const { profile, posts, comments, metrics, score, sentimentSummary } = inf;
  const followers = profile.followers || 1;
  const avgViews = metrics.avgViews;

  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-col items-center gap-3">
        <Avatar className="h-16 w-16 ring-2 ring-primary/20 ring-offset-2">
          {profile.avatar ? <AvatarImage src={profile.avatar} alt={profile.username} /> : null}
          <AvatarFallback className="bg-primary/10 text-primary">
            {profile.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-lg font-bold text-foreground">@{profile.username}</h3>
            {profile.verified && (
              <Badge className="bg-sky-100 text-sky-700 text-[10px] gap-0.5 rounded-full">
                <IconCheck className="w-2.5 h-2.5" /> Verificado
              </Badge>
            )}
          </div>
          {profile.signature && (
            <p className="text-xs text-muted-foreground italic max-w-sm mx-auto mt-1">
              &ldquo;{profile.signature}&rdquo;
            </p>
          )}
        </div>
        <TikTokScoreRing score={score.total} label={score.label} topPercent={score.topPercent} size={140} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card className="rounded-xl border-primary/5">
          <CardContent className="p-3 flex flex-col items-center gap-1 text-center">
            <IconUsers className="w-3.5 h-3.5 text-primary" />
            <span className="text-base font-bold text-foreground">{fmt(profile.followers)}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Seguidores</span>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-primary/5">
          <CardContent className="p-3 flex flex-col items-center gap-1 text-center">
            <IconHeart className="w-3.5 h-3.5 text-red-400" />
            <span className="text-base font-bold text-foreground">{metrics.engagementRate.toFixed(1)}%</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Engagement</span>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-primary/5">
          <CardContent className="p-3 flex flex-col items-center gap-1 text-center">
            <IconEye className="w-3.5 h-3.5 text-sky-500" />
            <span className="text-base font-bold text-foreground">{fmt(avgViews)}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Views Prom.</span>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-primary/5">
          <CardContent className="p-3 flex flex-col items-center gap-1 text-center">
            <IconCurrencyDollar className="w-3.5 h-3.5 text-green-500" />
            <span className="text-base font-bold text-foreground">{fmtCurrency(metrics.estimatedEMV)}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">EMV</span>
          </CardContent>
        </Card>
      </div>

      {followers > 0 && (
        <div className="space-y-2 bg-muted/30 rounded-xl p-3 border border-border/50">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Rendimiento</p>
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-muted-foreground">Views / followers</span>
              <span className="font-semibold text-foreground">{((avgViews / followers) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={Math.min((avgViews / followers) * 100, 100)} className="h-1.5" />
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-muted-foreground">Engagement rate</span>
              <span className="font-semibold text-foreground">{metrics.engagementRate.toFixed(2)}%</span>
            </div>
            <Progress value={Math.min(metrics.engagementRate * 10, 100)} className="h-1.5 [&>div]:bg-amber-500" />
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <IconBrandTiktok className="w-3 h-3" />
            Videos analizados ({posts.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {posts.map((post, i) => (
              <div key={post.id} className="rounded-xl bg-muted/50 border border-border/50 overflow-hidden">
                {post.coverUrl && (
                  <div className="relative aspect-video bg-muted">
                    <img
                      src={post.coverUrl}
                      alt={post.caption || "Video"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-semibold text-muted-foreground uppercase">#{i + 1}</span>
                    <span className="text-[9px] text-muted-foreground">{formatDuration(post.duration || 0)}</span>
                  </div>
                  <p className="text-[10px] text-foreground line-clamp-2">{post.caption || "Sin descripción"}</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px]">
                    <span className="text-muted-foreground">Vistas</span>
                    <span className="font-semibold text-foreground text-right">{fmt(post.playCount || 0)}</span>
                    <span className="text-muted-foreground">Likes</span>
                    <span className="font-semibold text-foreground text-right">{fmt(post.likes || 0)}</span>
                    <span className="text-muted-foreground">Comentarios</span>
                    <span className="font-semibold text-foreground text-right">{fmt(post.comments || 0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {comments.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <IconMessage className="w-3 h-3" />
            Comentarios ({comments.length})
            <span className="text-[9px] text-muted-foreground font-normal ml-1">
              · {sentimentSummary.positiveRate}% positivo
            </span>
          </h4>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="rounded-2xl text-[9px] gap-1 bg-green-50 text-green-700 border-green-200">
              <IconMoodSmile className="w-3 h-3" />
              {sentimentSummary.positive} positivos
            </Badge>
            <Badge variant="outline" className="rounded-2xl text-[9px] gap-1 bg-red-50 text-red-700 border-red-200">
              <IconMoodSad className="w-3 h-3" />
              {sentimentSummary.negative} negativos
            </Badge>
            <Badge variant="outline" className="rounded-2xl text-[9px] gap-1">
              <IconMoodEmpty className="w-3 h-3" />
              {sentimentSummary.neutral} neutrales
            </Badge>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {comments.slice(0, 15).map((c, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/30">
                <SentimentBadge label={c.sentiment.label} score={c.sentiment.score} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-foreground line-clamp-2">{c.text}</p>
                  <p className="text-[8px] text-muted-foreground mt-0.5">
                    @{c.uniqueId} · {c.diggCount > 0 ? `${fmt(c.diggCount)} likes` : ""}
                  </p>
                </div>
              </div>
            ))}
            {comments.length > 15 && (
              <p className="text-[9px] text-muted-foreground text-center pt-1">
                +{comments.length - 15} comentarios más
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function DiagnosticStepResults({ result }: DiagnosticStepResultsProps) {
  const { influencers, campaignMetrics } = result;

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4 w-full max-w-5xl mx-auto">
      <div className="flex flex-col items-center gap-2 text-center">
        <IconChartBar className="w-7 h-7 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Resultados de Campaña</h2>
        <p className="text-sm text-muted-foreground">
          {campaignMetrics.totalInfluencers} influencer{campaignMetrics.totalInfluencers !== 1 ? "es" : ""} ·{" "}
          {campaignMetrics.totalVideos} videos · {campaignMetrics.totalComments} comentarios
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
        <Card className="rounded-2xl border-primary/5 shadow-sm">
          <CardContent className="p-4 flex flex-col items-center gap-1.5 text-center">
            <IconUsers className="w-4 h-4 text-primary" />
            <span className="text-xl font-bold text-foreground">{campaignMetrics.totalInfluencers}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Influencers</span>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-primary/5 shadow-sm">
          <CardContent className="p-4 flex flex-col items-center gap-1.5 text-center">
            <IconVideo className="w-4 h-4 text-amber-500" />
            <span className="text-xl font-bold text-foreground">{campaignMetrics.totalVideos}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Videos</span>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-primary/5 shadow-sm">
          <CardContent className="p-4 flex flex-col items-center gap-1.5 text-center">
            <IconCurrencyDollar className="w-4 h-4 text-green-500" />
            <span className="text-lg font-bold text-foreground">{fmtCurrency(campaignMetrics.totalEMV)}</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">EMV Total</span>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-primary/5 shadow-sm">
          <CardContent className="p-4 flex flex-col items-center gap-1.5 text-center">
            <IconMoodSmile className="w-4 h-4 text-green-500" />
            <span className="text-xl font-bold text-foreground">{campaignMetrics.totalPositiveRate}%</span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Sentimiento Positivo</span>
          </CardContent>
        </Card>
      </div>

      <Separator className="max-w-xs" />

      <Tabs defaultValue={influencers[0]?.username} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto rounded-2xl">
          {influencers.map((inf) => (
            <TabsTrigger key={inf.username} value={inf.username} className="rounded-xl text-xs gap-1.5">
              <Avatar className="w-5 h-5">
                {inf.profile.avatar ? <AvatarImage src={inf.profile.avatar} /> : null}
                <AvatarFallback className="text-[6px]">{inf.username.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              @{inf.username}
            </TabsTrigger>
          ))}
        </TabsList>
        {influencers.map((inf) => (
          <TabsContent key={inf.username} value={inf.username}>
            <InfluencerTab inf={inf} />
          </TabsContent>
        ))}
      </Tabs>

      <Separator className="max-w-xs" />

      <Link href="/signup" className="w-full max-w-sm">
        <Button size="lg" className="w-full h-12 rounded-2xl text-base gap-2">
          <IconChartBar className="w-5 h-5" />
          Crear cuenta — Dashboard completo
        </Button>
      </Link>
      <p className="text-xs text-muted-foreground text-center max-w-xs">
        Gestiona campañas multi-influencer, ROI predictivo y más métricas avanzadas.
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { FadeIn, Stagger, StaggerItem, ScaleIn } from "@/components/fade-in";
import { TikTokScoreRing } from "@/components/tiktok-score-ring";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import {
  IconUsers, IconHeart, IconEye, IconCurrencyDollar,
  IconChartBar, IconCheck, IconMoodSmile, IconMoodSad,
  IconMoodEmpty, IconMessage, IconStar, IconVideo,
  IconChevronDown, IconChevronUp,
} from "@tabler/icons-react";
import type { CampaignResult } from "@/lib/diagnostic";
import Link from "next/link";

const chartConfig = {
  engagement: {
    label: "Engagement Rate",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const pieConfig = {
  positivo: { label: "Positivo", color: "#22c55e" },
  negativo: { label: "Negativo", color: "#ef4444" },
  neutral: { label: "Neutral", color: "#a1a1aa" },
} satisfies ChartConfig;

interface Props {
  result: CampaignResult;
  onReset?: () => void;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("es-ES");
}

function fmtCurrency(n: number): string {
  return `$${n.toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function DiagnosticStepResults({ result, onReset }: Props) {
  const { influencers, campaignMetrics } = result;

  const [expandedInf, setExpandedInf] = useState<string | null>(null);

  const totalReach = influencers.reduce((s, i) => s + i.metrics.avgViews, 0);
  const avgScore = Math.round(influencers.reduce((s, i) => s + i.score.total, 0) / influencers.length);
  const avgER = campaignMetrics.avgEngagementRate ||
    influencers.reduce((s, i) => s + i.metrics.engagementRate, 0) / influencers.length;
  const totalPositive = influencers.reduce((s, i) => s + i.sentimentSummary.positive, 0);
  const totalNegative = influencers.reduce((s, i) => s + i.sentimentSummary.negative, 0);
  const totalNeutral = influencers.reduce((s, i) => s + i.sentimentSummary.neutral, 0);
  const topInf = influencers.reduce((best, i) => (i.score.total > (best?.score.total || 0) ? i : best), influencers[0]);

  const chartData = influencers.map((i) => ({
    name: `@${i.username}`,
    followers: i.profile.followers,
    engagement: Number(i.metrics.engagementRate.toFixed(1)),
    emv: i.metrics.estimatedEMV,
    views: i.metrics.avgViews,
  }));

  const pieData = [
    { name: "Positivo", value: totalPositive },
    { name: "Negativo", value: totalNegative },
    { name: "Neutral", value: totalNeutral },
  ].filter((d) => d.value > 0);

  return (
    <div className="flex flex-col items-center gap-0 w-full max-w-5xl mx-auto">
      {/* ─── HERO ─── */}
      <FadeIn className="w-full">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-primary/5 to-transparent px-6 py-8 sm:py-10 text-center">
          <div className="pointer-events-none absolute inset-0 -z-0">
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/10 blur-[100px]" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-primary/5 blur-[100px]" />
          </div>
          <div className="relative z-10 flex flex-col items-center gap-5">
            <Badge variant="secondary" className="rounded-2xl text-xs gap-1">
              <IconChartBar className="w-3 h-3" />
              {campaignMetrics.totalInfluencers} influencer{campaignMetrics.totalInfluencers !== 1 && "es"}
            </Badge>
            <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
              <TikTokScoreRing score={avgScore} label="Score Campaña" topPercent="" size={130} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
                <div>
                  <p className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">{fmtCurrency(campaignMetrics.totalEMV)}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">EMV Total</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">{fmt(totalReach)}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Alcance Total</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">{avgER.toFixed(1)}%</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Engagement Prom.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ─── TOP PERFORMER ─── */}
      <FadeIn delay={0.15} className="w-full max-w-2xl mt-5">
        <div className="rounded-xl bg-card border border-border/60 p-3 flex items-center gap-3">
          <IconStar className="w-5 h-5 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">
              Mejor desempeño: <span className="text-primary">@{topInf.username}</span>
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              Score {topInf.score.total}/100 · {fmt(topInf.profile.followers)} seguidores · {topInf.metrics.engagementRate.toFixed(1)}% ER
            </p>
          </div>
          <Avatar className="h-8 w-8 ring-2 ring-primary/20 shrink-0">
            {topInf.profile.avatar ? <AvatarImage src={topInf.profile.avatar} /> : null}
            <AvatarFallback className="text-[8px]">{topInf.username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </FadeIn>

      {/* ─── CHARTS ROW ─── */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <FadeIn delay={0.2} className="w-full">
          <div className="rounded-2xl bg-card border border-border/60 p-4">
            <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <IconHeart className="w-3.5 h-3.5 text-muted-foreground" />
              Engagement Rate por Influencer
            </p>
            <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
              <BarChart data={chartData} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={65} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(value) => `${Number(value).toFixed(1)}%`} />} />
                <Bar dataKey="engagement" radius={[0, 6, 6, 0]} barSize={22} />
              </BarChart>
            </ChartContainer>
          </div>
        </FadeIn>

        <FadeIn delay={0.25} className="w-full">
          <div className="rounded-2xl bg-card border border-border/60 p-4">
            <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <IconMoodSmile className="w-3.5 h-3.5 text-muted-foreground" />
              Sentimiento Global
            </p>
            {pieData.length > 0 ? (
              <ChartContainer config={pieConfig} className="aspect-auto h-[220px] w-full">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={`var(--color-${entry.name.toLowerCase()})`} />
                    ))}
                  </Pie>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">Sin datos de sentimiento</div>
            )}
            <div className="flex items-center justify-center gap-3 mt-1">
              {pieData.map((d) => (
                <span key={d.name} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ background: `var(--color-${d.name.toLowerCase()})` }} />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>

      {/* ─── INFLUENCER COMPACT GRID ─── */}
      <FadeIn delay={0.3} className="w-full mt-6">
        <h3 className="text-sm font-bold text-foreground mb-3 px-1">Desglose por Influencer</h3>
        <Stagger className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {influencers.map((inf) => {
            const isExpanded = expandedInf === inf.username;
            return (
              <StaggerItem key={inf.username}>
                <motion.div
                  layout
                  className="rounded-2xl bg-card border border-border/60 overflow-hidden cursor-pointer"
                  onClick={() => setExpandedInf(isExpanded ? null : inf.username)}
                >
                  <div className="p-4 flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/20 shrink-0">
                      {inf.profile.avatar ? <AvatarImage src={inf.profile.avatar} /> : null}
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {inf.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <TikTokScoreRing score={inf.score.total} label="" topPercent="" size={56} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-foreground">@{inf.username}</span>
                        {inf.profile.verified && <IconCheck className="w-3 h-3 text-muted-foreground shrink-0" />}
                      </div>
                      <div className="grid grid-cols-3 gap-x-2 gap-y-0 mt-1 text-[10px]">
                        <span className="text-muted-foreground">{fmt(inf.profile.followers)} seg.</span>
                        <span className="text-muted-foreground">{inf.metrics.engagementRate.toFixed(1)}% ER</span>
                        <span className="text-muted-foreground">{fmtCurrency(inf.metrics.estimatedEMV)} EMV</span>
                      </div>
                    </div>
                    <div className="text-muted-foreground shrink-0">
                      {isExpanded ? <IconChevronUp className="w-4 h-4" /> : <IconChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <Separator />
                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-xs font-bold text-foreground">{fmt(inf.profile.followers)}</span>
                              <span className="text-[8px] uppercase tracking-wider text-muted-foreground">Seguidores</span>
                            </div>
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-xs font-bold text-foreground">{inf.metrics.engagementRate.toFixed(1)}%</span>
                              <span className="text-[8px] uppercase tracking-wider text-muted-foreground">Engagement</span>
                            </div>
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-xs font-bold text-foreground">{fmt(inf.metrics.avgViews)}</span>
                              <span className="text-[8px] uppercase tracking-wider text-muted-foreground">Views Prom.</span>
                            </div>
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-xs font-bold text-foreground">{fmtCurrency(inf.metrics.estimatedEMV)}</span>
                              <span className="text-[8px] uppercase tracking-wider text-muted-foreground">EMV</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                              <IconMoodSmile className="w-2.5 h-2.5" /> {inf.sentimentSummary.positive}
                            </span>
                            <span className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                              <IconMoodSad className="w-2.5 h-2.5" /> {inf.sentimentSummary.negative}
                            </span>
                            <span className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                              <IconMoodEmpty className="w-2.5 h-2.5" /> {inf.sentimentSummary.neutral}
                            </span>
                            <span className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              Score {inf.score.total}/100
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </FadeIn>

      {/* ─── CTA ─── */}
      <FadeIn delay={0.35} className="mt-8 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link href="/signup">
              <Button size="lg" className="rounded-2xl gap-2 h-12 text-base shadow-md px-8">
                <IconChartBar className="w-5 h-5" />
                Crear cuenta &mdash; Dashboard completo
              </Button>
            </Link>
          </motion.div>
          {onReset && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button variant="outline" size="lg" onClick={onReset} className="rounded-2xl gap-2 h-12 text-base px-8">
                Nueva prueba
              </Button>
            </motion.div>
          )}
        </div>
      </FadeIn>
    </div>
  );
}

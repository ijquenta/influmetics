"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  IconMessage,
  IconMoodSmile,
  IconMoodSad,
  IconMoodEmpty,
  IconBrandTiktok,
  IconCheck,
  IconEye,
  IconHeart,
  IconArrowRight,
} from "@tabler/icons-react";
import type { CampaignResult } from "@/lib/diagnostic";

interface DiagnosticStepCommentsProps {
  result: CampaignResult;
  onContinue: () => void;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("es-ES");
}

function formatDuration(seconds: number): string {
  if (!seconds) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function SentimentBadge({ label }: { label: string }) {
  const config: Record<string, { icon: any }> = {
    positivo: { icon: IconMoodSmile },
    negativo: { icon: IconMoodSad },
    neutral: { icon: IconMoodEmpty },
  };
  const cfg = config[label] || config.neutral;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

function InfluencerComments({ inf }: { inf: CampaignResult["influencers"][number] }) {
  const { profile, posts, comments } = inf;

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
          {profile.avatar ? <AvatarImage src={profile.avatar} alt={profile.username} /> : null}
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {profile.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">@{profile.username}</span>
            {profile.verified && (
              <Badge variant="outline" className="text-[9px] gap-0.5 rounded-full text-muted-foreground">
                <IconCheck className="w-2.5 h-2.5" /> Verificado
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{profile.followers?.toLocaleString("es-ES")} seguidores</p>
        </div>
      </div>

      <div className="space-y-4">
        {posts.map((post, pi) => {
          const postComments = comments.filter((c) => c.videoId === post.id);
          return (
            <Card key={post.id} className="rounded-xl border-border/60 overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-0">
                {post.coverUrl && (
                  <div className="relative aspect-video sm:aspect-auto sm:h-full bg-muted">
                    <img
                      src={post.coverUrl}
                      alt={post.caption || ""}
                      className="w-full h-full object-cover absolute inset-0"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className={post.coverUrl ? "sm:col-span-2" : "sm:col-span-3"}>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                        Video #{pi + 1}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDuration(post.duration || 0)}
                      </span>
                    </div>
                    <p className="text-xs text-foreground line-clamp-2 leading-relaxed">
                      {post.caption || "Sin descripción"}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <IconEye className="w-3 h-3" /> {fmt(post.playCount || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <IconHeart className="w-3 h-3 text-red-400" /> {fmt(post.likes || 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <IconMessage className="w-3 h-3" /> {fmt(post.comments || 0)}
                      </span>
                    </div>

                    <div className="border-t border-border/40 pt-2 mt-2">
                      <div className="flex items-center gap-2 mb-2">
                        <IconMessage className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-semibold text-foreground">
                          Comentarios ({postComments.length})
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-52 overflow-y-auto">
                        {postComments.length > 0 ? (
                          postComments.map((c, ci) => (
                            <div key={ci} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/30">
                              <SentimentBadge label={c.sentiment.label} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-foreground leading-relaxed">{c.text}</p>
                                <p className="text-[8px] text-muted-foreground mt-0.5">
                                  @{c.uniqueId}
                                  {c.diggCount > 0 && ` · ${fmt(c.diggCount)} likes`}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] text-muted-foreground italic">Sin comentarios disponibles</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function DiagnosticStepComments({ result, onContinue }: DiagnosticStepCommentsProps) {
  const { influencers, campaignMetrics } = result;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center gap-4 py-4 px-4 w-full max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-center">
        <IconMessage className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Comentarios por Video</h2>
        <Badge variant="secondary" className="rounded-2xl text-xs">
          {campaignMetrics.totalComments} comentarios analizados
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground text-center max-w-lg">
        Revisa los comentarios y el análisis de sentimiento de cada video antes de ver los resultados de campaña.
      </p>

      <Tabs defaultValue={influencers[0]?.username} className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="w-fit rounded-2xl">
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
        </div>
        {influencers.map((inf) => (
          <TabsContent key={inf.username} value={inf.username}>
            <InfluencerComments inf={inf} />
          </TabsContent>
        ))}
      </Tabs>

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button onClick={onContinue} className="rounded-2xl gap-2 px-8 h-11 mt-2 shadow-md">
          Ver resultados de campaña
          <IconArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}

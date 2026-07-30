"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { IconCheck, IconLoader2 } from "@tabler/icons-react";

const STAGES = [
  { label: "Scraping perfiles de TikTok...", duration: 3000 },
  { label: "Extrayendo mejores videos...", duration: 2500 },
  { label: "Scraping comentarios...", duration: 4000 },
  { label: "Analizando sentimiento con IA...", duration: 3000 },
  { label: "Calculando ROI de campaña...", duration: 1500 },
];

interface DiagnosticStepScanningProps {
  influencerCount: number;
}

export function DiagnosticStepScanning({ influencerCount }: DiagnosticStepScanningProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(5);
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    const totalDuration = STAGES.reduce((s, s2) => s + s2.duration, 0);

    const stageTimers: NodeJS.Timeout[] = [];
    let elapsed = 0;

    STAGES.forEach((stage, index) => {
      const timer = setTimeout(() => {
        setCurrentStage(index + 1);
      }, elapsed + stage.duration);
      stageTimers.push(timer);
      elapsed += stage.duration;
    });

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(progressTimer);
          return 95;
        }
        return prev + 1;
      });
    }, totalDuration / 90);

    const slowTimer = setTimeout(() => {
      setShowSlowMessage(true);
    }, 20000);

    return () => {
      stageTimers.forEach(clearTimeout);
      clearInterval(progressTimer);
      clearTimeout(slowTimer);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-sm flex flex-col items-center gap-6">
        <div className="relative">
          <motion.div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
          <IconLoader2 className="w-10 h-10 text-primary animate-spin relative" />
        </div>

        <Badge variant="outline" className="rounded-2xl text-xs gap-1">
          {influencerCount} influencer{influencerCount !== 1 ? "es" : ""}
        </Badge>

        <div className="w-full space-y-3">
          {STAGES.map((stage, index) => {
            const isDone = index < currentStage;
            const isActive = index === currentStage;
            return (
              <div key={stage.label} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                  {isDone ? (
                    <IconCheck className="w-5 h-5 text-green-500" />
                  ) : isActive ? (
                    <IconLoader2 className="w-4 h-4 text-primary animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>
                <span
                  className={`text-sm transition-colors ${
                    isDone
                      ? "text-muted-foreground"
                      : isActive
                      ? "text-foreground font-medium"
                      : "text-muted-foreground/40"
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>

        <Progress value={progress} className="w-full h-2" />

        <p className="text-xs text-muted-foreground">
          {progress < 40 ? "~1 minuto" : progress < 70 ? "~2 minutos" : "Finalizando..."}
        </p>

        {showSlowMessage && (
          <p className="text-sm text-muted-foreground text-center mt-2">
            TikTok puede tardar hasta 3 minutos. Gracias por tu paciencia.
          </p>
        )}
      </motion.div>
    </div>
  );
}

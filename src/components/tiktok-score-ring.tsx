"use client";

import { useEffect, useState, useRef } from "react";

interface TikTokScoreRingProps {
  score: number;
  label: string;
  topPercent: string;
  size?: number;
}

export function TikTokScoreRing({ score, label, topPercent, size = 180 }: TikTokScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const duration = 1200;
    const steps = 40;
    const stepTime = duration / steps;
    let current = 0;
    const increment = score / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [visible, score]);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  const isLarge = size >= 140;
  const isMedium = size >= 100;
  const scoreSize = isLarge ? "text-4xl" : isMedium ? "text-2xl" : "text-lg";
  const scoreLabelSize = isLarge ? "text-[10px]" : isMedium ? "text-[9px]" : "text-[8px]";
  const labelSize = isLarge ? "text-sm" : "text-xs";
  const topSize = isLarge ? "text-xs" : "text-[10px]";
  const strokeW = isLarge ? "10" : isMedium ? "8" : "6";

  return (
    <div ref={ref} className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 160 160" className="transform -rotate-90">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={strokeW} />
          <circle
            cx="80" cy="80" r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${scoreSize} font-bold tracking-tight text-foreground`}>
            {animatedScore}
          </span>
          <span className={`${scoreLabelSize} uppercase tracking-widest text-muted-foreground`}>
            Score
          </span>
        </div>
      </div>
      {label && <span className={`${labelSize} font-semibold text-foreground text-center leading-tight`}>{label}</span>}
      {topPercent && <span className={`${topSize} text-muted-foreground`}>{topPercent}</span>}
    </div>
  );
}

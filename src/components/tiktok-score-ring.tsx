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

  const getColor = () => {
    if (score >= 80) return "#16a34a";
    if (score >= 60) return "#6C48C5";
    if (score >= 40) return "#f59e0b";
    return "#6b7280";
  };

  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 160 160" className="transform -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold tracking-tight" style={{ color: getColor() }}>
            {animatedScore}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
            TikTok Score
          </span>
        </div>
      </div>
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground">{topPercent}</span>
    </div>
  );
}

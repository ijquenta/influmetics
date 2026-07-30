"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DiagnosticStepInput } from "@/components/diagnostic-step-input";
import { DiagnosticStepScanning } from "@/components/diagnostic-step-scanning";
import { DiagnosticStepResults } from "@/components/diagnostic-step-results";
import { DiagnosticStepComments } from "@/components/diagnostic-step-comments";
import type { CampaignResult } from "@/lib/diagnostic";

type WizardStep = "input" | "scanning" | "comments" | "results";

const STEP_INDEX: WizardStep[] = ["input", "scanning", "comments", "results"];

export function DiagnosticWizard() {
  const [step, setStep] = useState<WizardStep>("input");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [error, setError] = useState("");
  const [influencerCount, setInfluencerCount] = useState(0);

  const currentIndex = STEP_INDEX.indexOf(step);

  const handleStart = useCallback(async (usernames: string[]) => {
    setInfluencerCount(usernames.length);
    setStep("scanning");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/diagnostic/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al analizar la campaña");
        setStep("input");
        setLoading(false);
        return;
      }

      setResult(data);
      setTimeout(() => setStep("comments"), 600);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setStep("input");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleContinueToResults = useCallback(() => setStep("results"), []);

  const handleReset = useCallback(() => {
    setStep("input");
    setResult(null);
    setError("");
  }, []);

  const handleCloseError = useCallback(() => setError(""), []);

  return (
    <div className="w-full py-4">
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-destructive text-destructive-foreground px-5 py-3 rounded-2xl shadow-lg text-sm max-w-sm text-center flex items-center gap-3">
          <p className="flex-1">{error}</p>
          <button onClick={handleCloseError} className="opacity-70 hover:opacity-100 font-bold">
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 mb-10">
        {STEP_INDEX.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                i <= currentIndex
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-base sm:text-lg hidden sm:inline ${
                i <= currentIndex ? "text-foreground font-bold" : "text-muted-foreground"
              }`}
            >
              {s === "input" ? "Influencers" : s === "scanning" ? "Análisis" : s === "comments" ? "Comentarios" : "Resultados"}
            </span>
            {i < STEP_INDEX.length - 1 && (
              <div
                className={`w-8 h-px ${
                  i < currentIndex ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === "input" && (
          <motion.div key="input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35, ease: "easeOut" }}>
            <DiagnosticStepInput onStart={handleStart} loading={loading} />
          </motion.div>
        )}
        {step === "scanning" && (
          <motion.div key="scanning" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35, ease: "easeOut" }}>
            <DiagnosticStepScanning influencerCount={influencerCount} />
          </motion.div>
        )}
        {step === "comments" && result && (
          <motion.div key="comments" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35, ease: "easeOut" }}>
            <DiagnosticStepComments result={result} onContinue={handleContinueToResults} />
          </motion.div>
        )}
        {step === "results" && result && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35, ease: "easeOut" }}>
            <DiagnosticStepResults result={result} onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

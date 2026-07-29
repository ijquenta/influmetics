"use client";

import { useState, useCallback } from "react";
import { DiagnosticStepInput } from "@/components/diagnostic-step-input";
import { DiagnosticStepScanning } from "@/components/diagnostic-step-scanning";
import { DiagnosticStepResults } from "@/components/diagnostic-step-results";
import type { CampaignResult } from "@/lib/diagnostic";

type WizardStep = "input" | "scanning" | "results";

const STEP_INDEX: WizardStep[] = ["input", "scanning", "results"];

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
      setTimeout(() => setStep("results"), 600);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setStep("input");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCloseError = useCallback(() => setError(""), []);

  return (
    <div className="w-full">
      {error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-destructive text-destructive-foreground px-5 py-3 rounded-2xl shadow-lg text-sm max-w-sm text-center flex items-center gap-3">
          <p className="flex-1">{error}</p>
          <button onClick={handleCloseError} className="opacity-70 hover:opacity-100 font-bold">
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 mb-8">
        {STEP_INDEX.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                i <= currentIndex
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-xs hidden sm:inline ${
                i <= currentIndex ? "text-foreground font-medium" : "text-muted-foreground"
              }`}
            >
              {s === "input" ? "Influencers" : s === "scanning" ? "Análisis" : "Resultados"}
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

      <div className="transition-opacity duration-300">
        {step === "input" && (
          <DiagnosticStepInput onStart={handleStart} loading={loading} />
        )}
        {step === "scanning" && (
          <DiagnosticStepScanning influencerCount={influencerCount} />
        )}
        {step === "results" && result && (
          <DiagnosticStepResults result={result} />
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconPlus, IconTrash, IconArrowRight, IconLoader2, IconChartBar, IconUsers } from "@tabler/icons-react";

interface DiagnosticStepInputProps {
  onStart: (usernames: string[]) => void;
  loading: boolean;
}

export function DiagnosticStepInput({ onStart, loading }: DiagnosticStepInputProps) {
  const [usernames, setUsernames] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [error, setError] = useState("");

  const addUsername = () => {
    const trimmed = currentInput.trim().replace(/^@/, "");
    if (!trimmed) {
      setError("Ingresa un usuario de TikTok");
      return;
    }
    if (usernames.includes(trimmed)) {
      setError("Este usuario ya fue agregado");
      return;
    }
    setUsernames([...usernames, trimmed]);
    setCurrentInput("");
    setError("");
  };

  const removeUsername = (idx: number) => {
    setUsernames(usernames.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernames.length === 0) {
      setError("Agrega al menos un influencer");
      return;
    }
    setError("");
    onStart(usernames);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addUsername();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="flex flex-col items-center gap-2 mb-8 text-center">
        <IconChartBar className="w-8 h-8 text-primary mb-1" />
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-foreground">
          Analiza tu campaña
          <br />
          de influencers en TikTok
        </h1>
        <p className="text-base text-muted-foreground max-w-lg mt-3 leading-relaxed">
          Agrega los influencers de tu campaña. Analizaremos sus 3 mejores videos,
          comentarios y sentimiento para calcular el ROI real.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-lg flex flex-col items-center gap-4">
        <div className="w-full flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
              @
            </span>
            <Input
              value={currentInput}
              onChange={(e) => { setCurrentInput(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              placeholder="usuario_tiktok"
              className="pl-8 h-11 text-base rounded-2xl border-primary/20 focus-visible:border-primary"
              disabled={loading}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addUsername}
            disabled={loading || !currentInput.trim()}
            className="rounded-2xl gap-1.5 px-4"
          >
            <IconPlus className="w-4 h-4" />
            Agregar
          </Button>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {usernames.length > 0 && (
          <div className="w-full flex flex-wrap gap-2">
            {usernames.map((u, idx) => (
              <Badge key={u} variant="secondary" className="rounded-2xl text-sm px-3 py-1.5 gap-2">
                <IconUsers className="w-3 h-3" />
                @{u}
                <button onClick={() => removeUsername(idx)} className="text-muted-foreground hover:text-red-500 ml-0.5">
                  <IconTrash className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full h-12 rounded-2xl text-base gap-2 mt-2"
          disabled={loading || usernames.length === 0}
        >
          {loading ? (
            <IconLoader2 className="w-5 h-5 animate-spin" />
          ) : (
            <IconArrowRight className="w-5 h-5" />
          )}
          {loading
            ? "Analizando campaña..."
            : `Analizar campaña (${usernames.length} influencer${usernames.length !== 1 ? "es" : ""})`}
        </Button>
        <p className="text-xs text-muted-foreground">
          Analizaremos perfil, 3 videos, comentarios y sentimiento · ~2-3 minutos
        </p>
      </form>
    </div>
  );
}

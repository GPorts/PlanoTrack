"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { PlanPreview } from "@/components/PlanPreview";
import type { GeneratedPlan } from "@/lib/types";

const weekdays = ["Segunda-feira", "Terca-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sabado"];

export function PlanCreator() {
  const [mode, setMode] = useState<"manual" | "ai">("manual");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const selectedDays = weekdays.filter((day) => form.get(day) === "on");

    const response = await fetch("/api/ai/generate-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        routine: {
          examName: form.get("examName"),
          examDate: form.get("examDate"),
          hoursPerDay: Number(form.get("hoursPerDay") || 2),
          studyDays: selectedDays,
          preferredBlocks: form.get("preferredBlocks")
        },
        editalText: form.get("editalText")
      })
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Nao foi possivel gerar o plano.");
      return;
    }

    setPlan(data.plan);
  }

  return (
    <section className="grid-2">
      <form className="card form" onSubmit={submit}>
        <div className="split-fields">
          <label className="field">
            Nome da prova
            <input name="examName" defaultValue="Concurso PGM" required />
          </label>
          <label className="field">
            Data da prova
            <input name="examDate" type="date" required />
          </label>
        </div>

        <div className="split-fields">
          <label className="field">
            Horas por dia
            <input name="hoursPerDay" type="number" min="1" max="12" defaultValue="6" required />
          </label>
          <label className="field">
            Modo
            <select value={mode} onChange={(event) => setMode(event.target.value as "manual" | "ai")}>
              <option value="manual">Manual gratis</option>
              <option value="ai">Gerar com IA - assinatura</option>
            </select>
          </label>
        </div>

        <fieldset className="card" style={{ boxShadow: "none", padding: 12 }}>
          <legend style={{ fontWeight: 900 }}>Dias de estudo</legend>
          <div className="grid" style={{ gap: 8, marginTop: 10 }}>
            {weekdays.map((day) => (
              <label key={day} style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 700 }}>
                <input name={day} type="checkbox" defaultChecked style={{ width: "auto" }} />
                {day.replace("-feira", "")}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="field">
          Rotina desejada
          <span>Exemplo: teoria de manha e tarde, questoes a noite.</span>
          <input name="preferredBlocks" defaultValue="Manha e tarde para teoria; noite para questoes e revisao." />
        </label>

        <label className="field">
          Texto do edital
          <span>No MVP 0.1, cole o texto. Na 0.2 entra upload real de PDF.</span>
          <textarea
            name="editalText"
            placeholder="Cole aqui disciplinas, topicos e pesos do edital..."
            defaultValue={"1. Lingua Portuguesa\n2. Direito Administrativo\n3. Direito Constitucional"}
          />
        </label>

        {mode === "ai" ? (
          <div className="notice">
            Gerar com IA exige assinatura ativa quando Supabase/Cakto estiverem ligados. Em demo, o mock fica liberado.
          </div>
        ) : null}

        {error ? <div className="notice">{error}</div> : null}

        <button className="button" type="submit" disabled={loading}>
          {loading ? <Loader2 size={18} /> : <Sparkles size={18} />}
          {loading ? "Gerando..." : "Gerar plano"}
        </button>
      </form>

      {plan ? (
        <PlanPreview plan={plan} />
      ) : (
        <aside className="card">
          <h2>Como o MVP cobra</h2>
          <p className="muted">
            Criacao manual fica gratis. Quando o usuario escolhe IA, o backend confere assinatura ativa no Supabase
            antes de gerar.
          </p>
          <div className="notice" style={{ marginTop: 14 }}>
            Primeiro objetivo: validar se as pessoas pagam por um plano bem gerado a partir do edital.
          </div>
        </aside>
      )}
    </section>
  );
}

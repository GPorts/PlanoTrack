"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { PlanPreview } from "@/components/PlanPreview";
import type { GeneratedPlan, StudyWeekday } from "@/lib/types";

const weekdays: StudyWeekday[] = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];

export function PlanCreator() {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [error, setError] = useState("");
  const [hoursByDay, setHoursByDay] = useState<Record<StudyWeekday, string>>(
    () => Object.fromEntries(weekdays.map((day) => [day, ""])) as Record<StudyWeekday, string>
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const availability = Object.fromEntries(
      weekdays
        .map((day) => [day, Number(hoursByDay[day])] as const)
        .filter(([, hours]) => Number.isFinite(hours) && hours > 0)
    );
    const selectedDays = Object.keys(availability);
    form.set("studyDays", selectedDays.join(","));
    form.set("hoursByDay", JSON.stringify(availability));

    if (!selectedDays.length) {
      setLoading(false);
      setError("Informe as horas de estudo de pelo menos um dia da semana.");
      return;
    }

    const response = await fetch("/api/ai/generate-plan", {
      method: "POST",
      body: form
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Não foi possível gerar o plano.");
      return;
    }

    setPlan(data.plan);
  }

  return (
    <section className="grid-2">
      <form className="card form create-form" onSubmit={submit}>
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

        <label className="field">
          Edital em arquivo
          <input name="editalFile" type="file" accept=".pdf,.txt,.md,.doc,.docx,application/pdf,text/plain" />
        </label>

        <fieldset className="availability-picker">
          <legend>Horas de estudo por dia</legend>
          <div className="availability-heading">
            <p>Deixe em branco os dias em que você não pretende estudar.</p>
            <strong>{formatWeeklyHours(hoursByDay)} por semana</strong>
          </div>
          <div className="availability-grid">
            {weekdays.map((day) => (
              <label className={Number(hoursByDay[day]) > 0 ? "active" : ""} key={day}>
                <span>{day.replace("-feira", "")}</span>
                <span className="hours-input">
                  <input
                    aria-label={`${day}: horas de estudo`}
                    max="12"
                    min="0.5"
                    placeholder="0"
                    step="0.5"
                    type="number"
                    value={hoursByDay[day]}
                    onChange={(event) => setHoursByDay((current) => ({ ...current, [day]: event.target.value }))}
                  />
                  <span>h</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="field">
          Rotina desejada
          <span>Exemplo: teoria de manhã e tarde, questões à noite.</span>
          <input name="preferredBlocks" defaultValue="Ex: manhã e tarde para teoria; noite para questões e revisão." />
        </label>

        <label className="field">
          Texto do edital
          <span>Cole o texto ou anexe o PDF do edital acima.</span>
          <textarea
            name="editalText"
            placeholder="Cole aqui disciplinas, tópicos e pesos do edital..."
            defaultValue={"1. Língua Portuguesa\n2. Direito Administrativo\n3. Direito Constitucional"}
          />
        </label>

        <div className="notice">A IA extrai o edital e o PlanoTracker monta o calendário completo até a prova.</div>

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
            A assinatura libera gerações ilimitadas com IA. O app pode conferir assinatura ativa no Supabase antes de
            gerar o plano.
          </p>
          <div className="notice" style={{ marginTop: 14 }}>
            Primeiro objetivo: validar se as pessoas pagam por um plano bem gerado a partir do edital.
          </div>
        </aside>
      )}
    </section>
  );
}

function formatWeeklyHours(hoursByDay: Record<StudyWeekday, string>) {
  const minutes = Math.round(weekdays.reduce((sum, day) => sum + (Number(hoursByDay[day]) || 0), 0) * 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!rest) return `${hours}h`;
  return `${hours}h ${rest}min`;
}


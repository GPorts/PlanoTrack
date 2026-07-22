"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenCheck,
  Brain,
  Check,
  CirclePause,
  CirclePlay,
  Clock3,
  FileText,
  Gauge,
  Layers3,
  ListRestart,
  Plus,
  RotateCcw,
  Target,
  TrendingUp,
  WandSparkles,
  X
} from "lucide-react";
import {
  buildRebalancePreview,
  calculatePlanBudget,
  calculateTopicMastery,
  recommendNextSession,
  weeklyReview
} from "@/lib/adaptive-plan";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { calculateElapsedSeconds, elapsedMinutes } from "@/lib/session-timer";
import type {
  ErrorEntry,
  RebalancePreview,
  RecallRating,
  ReviewState,
  ScheduleItem,
  ScheduleStatus,
  SimulationRecord,
  StudySessionRecord,
  TopicMastery
} from "@/lib/types";

export type AdaptiveSubject = {
  id?: string;
  name: string;
  questions?: number;
  weight?: number;
  color: string;
  topics: string[];
  topicIds?: string[];
};

type StartSession = (item: ScheduleItem) => void;

export function AdaptiveOverview({
  schedule,
  sessions,
  subjects,
  examDate,
  onStart,
  onOpenRecovery,
  onOpenReviews,
  errors
}: {
  schedule: ScheduleItem[];
  sessions: StudySessionRecord[];
  subjects: AdaptiveSubject[];
  examDate: string;
  onStart: StartSession;
  onOpenRecovery: () => void;
  onOpenReviews: () => void;
  errors: ErrorEntry[];
}) {
  const mastery = useMemo(() => buildMastery(subjects, sessions), [subjects, sessions]);
  const budget = useMemo(
    () => (examDate ? calculatePlanBudget(schedule, examDate) : null),
    [schedule, examDate]
  );
  const review = useMemo(() => weeklyReview(schedule, sessions), [schedule, sessions]);
  const priorities = useMemo(() => Object.fromEntries(subjects.map((subject) => [subject.name, { weight: subject.weight, unresolvedErrors: errors.filter((entry) => entry.subject === subject.name && !entry.resolved).length }])), [subjects, errors]);
  const next = useMemo(() => recommendNextSession(schedule, mastery, priorities), [schedule, mastery, priorities]);

  if (!schedule.length || !examDate || !budget) return null;

  return (
    <section className="adaptive-overview" aria-label="Rota adaptativa">
      <div className={`route-budget route-risk-${budget.risk}`}>
        <div className="route-budget-main">
          <span className="adaptive-kicker"><Gauge size={15} /> Orçamento do edital</span>
          <div className="route-risk-line">
            <strong>{riskLabel(budget.risk)}</strong>
            <span>{budget.coveragePercent}% da rota concluída</span>
          </div>
          <div className="route-meter" aria-label={`${budget.coveragePercent}% concluído`}>
            <i style={{ width: `${budget.coveragePercent}%` }} />
          </div>
          <p>
            Restam <b>{formatMinutes(budget.remainingMinutes)}</b> para distribuir em <b>{budget.daysLeft} dias disponíveis</b>.
            {budget.backlogMinutes ? ` Há ${formatMinutes(budget.backlogMinutes)} em atraso.` : " Sua rota está em dia."}
          </p>
        </div>
        <div className="route-budget-actions">
          <button className={budget.backlogMinutes ? "primary-button" : "ghost-button"} type="button" onClick={onOpenRecovery}>
            <ListRestart size={17} /> {budget.backlogMinutes ? "Modo recuperação" : "Ajustar rota"}
          </button>
          <button className="ghost-button" type="button" onClick={onOpenReviews}>
            <Brain size={17} /> Ver revisões
          </button>
        </div>
      </div>

      <div className="adaptive-summary-grid">
        <article className="adaptive-card next-session-card">
          <div className="adaptive-card-heading">
            <span className="adaptive-kicker"><Target size={15} /> Próxima melhor sessão</span>
            {next?.date < todayIso() ? <span className="overdue-tag">Em atraso</span> : null}
          </div>
          {next ? (
            <>
              <h3>{next.subject}</h3>
              <p>{next.topic}</p>
              <div className="adaptive-card-meta">
                <span><Clock3 size={14} /> {formatMinutes(next.minutes)}</span>
                <span>{displayKind(next.kind)}</span>
              </div>
              <button className="primary-button" type="button" onClick={() => onStart(next)}>
                <CirclePlay size={18} /> Iniciar agora
              </button>
            </>
          ) : <p>Você concluiu todas as sessões planejadas.</p>}
        </article>

        <article className="adaptive-card weekly-review-card">
          <span className="adaptive-kicker"><TrendingUp size={15} /> Revisão dos últimos 7 dias</span>
          <div className="weekly-review-score">
            <strong>{review.adherence}%</strong>
            <span>de aderência</span>
          </div>
          <div className="weekly-review-metrics">
            <span><b>{formatMinutes(review.studiedMinutes)}</b> realizados</span>
            <span><b>{review.completed}</b> concluídas</span>
            <span><b>{review.missed}</b> pendentes</span>
            <span><b>{review.accuracy}%</b> de acerto</span>
          </div>
          <p>{weeklySuggestion(review.adherence, review.missed)}</p>
        </article>
      </div>
    </section>
  );
}

export function SessionExecutionModal({
  item,
  planId,
  onClose,
  onSaved
}: {
  item: ScheduleItem;
  planId: string;
  onClose: () => void;
  onSaved: (session: StudySessionRecord, item: ScheduleItem, review?: ReviewState) => void;
}) {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [manualMinutes, setManualMinutes] = useState<string | null>(null);
  const accumulatedSeconds = useRef(0);
  const startedAt = useRef<number | null>(null);
  const [status, setStatus] = useState<Extract<ScheduleStatus, "completed" | "partial" | "postponed" | "missed">>("completed");
  const [rating, setRating] = useState<RecallRating | undefined>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!running) return;

    const syncElapsedTime = () => {
      setSeconds(calculateElapsedSeconds(accumulatedSeconds.current, startedAt.current));
    };
    const timer = window.setInterval(syncElapsedTime, 1000);
    document.addEventListener("visibilitychange", syncElapsedTime);
    window.addEventListener("focus", syncElapsedTime);

    syncElapsedTime();
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", syncElapsedTime);
      window.removeEventListener("focus", syncElapsedTime);
    };
  }, [running]);

  function toggleTimer() {
    if (running) {
      const elapsed = calculateElapsedSeconds(accumulatedSeconds.current, startedAt.current);
      accumulatedSeconds.current = elapsed;
      startedAt.current = null;
      setSeconds(elapsed);
      setRunning(false);
      return;
    }

    startedAt.current = Date.now();
    setRunning(true);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const completionPercent = status === "completed" ? 100 : status === "partial" ? Number(form.get("completionPercent")) : 0;
    const timerSeconds = calculateElapsedSeconds(accumulatedSeconds.current, startedAt.current);
    const actualMinutes = status === "missed" || status === "postponed"
      ? 0
      : Math.max(1, Number(form.get("actualMinutes")) || (timerSeconds ? elapsedMinutes(timerSeconds) : item.minutes));
    const feedback = {
      planId,
      scheduleItemId: item.id,
      topicId: item.topicId,
      subject: item.subject,
      topicTitle: item.topic,
      kind: item.kind,
      status,
      actualMinutes,
      questions: Number(form.get("questions") || 0),
      correct: Number(form.get("correct") || 0),
      difficulty: status === "completed" || status === "partial" ? Number(form.get("difficulty")) : undefined,
      confidence: status === "completed" || status === "partial" ? Number(form.get("confidence")) : undefined,
      completionPercent,
      recallRating: status === "completed" || status === "partial" ? rating : undefined,
      notes: String(form.get("notes") || ""),
      studiedAt: todayIso()
    };

    if (feedback.correct > feedback.questions) {
      setError("O número de acertos não pode superar o total de questões.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const token = await accessToken();
      const response = await fetch("/api/adaptive/complete-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(feedback)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível concluir a sessão.");
      const session: StudySessionRecord = {
        id: data.sessionId,
        date: todayIso(),
        subject: item.subject,
        scheduleItemId: item.id,
        topicId: item.topicId,
        topic: item.topic,
        kind: item.kind,
        minutes: actualMinutes,
        questions: feedback.questions,
        correct: feedback.correct,
        difficulty: feedback.difficulty,
        confidence: feedback.confidence,
        completionPercent,
        recallRating: feedback.recallRating,
        notes: feedback.notes
      };
      onSaved(session, { ...item, status, completionPercent, completedAt: status === "completed" ? new Date().toISOString() : undefined }, data.reviewState);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível concluir a sessão.");
    } finally {
      setSaving(false);
    }
  }

  const studying = status === "completed" || status === "partial";

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal-card execution-modal" onSubmit={submit}>
        <div className="execution-header">
          <div>
            <span className="adaptive-kicker">Sessão em foco</span>
            <h2>{item.subject}</h2>
            <p>{item.topic}</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </div>

        <div className="study-timer">
          <strong>{formatClock(seconds)}</strong>
          <span>Meta: {formatMinutes(item.minutes)}</span>
          <button className={running ? "ghost-button" : "primary-button"} type="button" onClick={toggleTimer}>
            {running ? <><CirclePause size={18} /> Pausar</> : <><CirclePlay size={18} /> {seconds ? "Continuar" : "Iniciar"}</>}
          </button>
        </div>

        <fieldset className="status-choice">
          <legend>Como ficou esta sessão?</legend>
          {(["completed", "partial", "postponed", "missed"] as const).map((value) => (
            <button className={status === value ? "active" : ""} type="button" key={value} onClick={() => setStatus(value)}>
              {statusLabel(value)}
            </button>
          ))}
        </fieldset>

        {studying ? (
          <>
            <div className="form-row">
              <label>
                Minutos reais
                <input
                  name="actualMinutes"
                  type="number"
                  min="1"
                  max="1440"
                  value={manualMinutes ?? (seconds ? elapsedMinutes(seconds) : item.minutes)}
                  onChange={(event) => setManualMinutes(event.target.value)}
                />
              </label>
              {status === "partial" ? <label>Quanto concluiu (%)<input name="completionPercent" type="number" min="1" max="99" defaultValue="50" /></label> : null}
            </div>
            <div className="form-row">
              <label>Questões<input name="questions" type="number" min="0" defaultValue="0" /></label>
              <label>Acertos<input name="correct" type="number" min="0" defaultValue="0" /></label>
            </div>
            <div className="form-row">
              <label>Dificuldade<select name="difficulty" defaultValue="2"><option value="1">Baixa</option><option value="2">Moderada</option><option value="3">Alta</option><option value="4">Muito alta</option></select></label>
              <label>Confiança<select name="confidence" defaultValue="3"><option value="1">Muito baixa</option><option value="2">Baixa</option><option value="3">Média</option><option value="4">Boa</option><option value="5">Alta</option></select></label>
            </div>
            <fieldset className="recall-choice">
              <legend>Como você se lembra deste tópico?</legend>
              {(["forgot", "hard", "good", "easy"] as const).map((value) => (
                <button className={rating === value ? "active" : ""} type="button" key={value} onClick={() => setRating(value)}>{ratingLabel(value)}</button>
              ))}
            </fieldset>
          </>
        ) : null}

        <label>Observações<textarea name="notes" placeholder="Dúvidas, pontos importantes ou motivo do adiamento..." /></label>
        {error ? <div className="notice">{error}</div> : null}
        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={onClose}>Cancelar</button>
          <button className="primary-button" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar resultado"}</button>
        </div>
      </form>
    </div>
  );
}

export function RecoveryModal({
  planId,
  examDate,
  schedule,
  onClose,
  onApplied
}: {
  planId: string;
  examDate: string;
  schedule: ScheduleItem[];
  onClose: () => void;
  onApplied: (schedule: ScheduleItem[]) => void;
}) {
  const preview = useMemo(() => buildRebalancePreview(schedule, examDate), [schedule, examDate]);
  const [saving, setSaving] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [error, setError] = useState("");

  async function apply() {
    setSaving(true);
    setError("");
    try {
      const token = await accessToken();
      const response = await fetch("/api/adaptive/rebalance", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId, apply: true, reason: "Modo recuperação confirmado pelo usuário" })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível reorganizar a rota.");
      onApplied((data.preview as RebalancePreview).schedule);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível reorganizar a rota.");
    } finally {
      setSaving(false);
    }
  }

  async function undo() {
    setUndoing(true);
    setError("");
    try {
      const token = await accessToken();
      const response = await fetch("/api/adaptive/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível desfazer a reorganização.");
      onApplied(data.schedule as ScheduleItem[]);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível desfazer a reorganização.");
    } finally {
      setUndoing(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-card recovery-modal">
        <div className="execution-header">
          <div><span className="adaptive-kicker">Prévia obrigatória</span><h2>Recuperar sessões atrasadas</h2><p>Nada concluído será alterado. Confira as mudanças antes de aplicar.</p></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </div>
        <div className={`recovery-risk route-risk-${preview.risk}`}>
          <AlertTriangle size={18} /><strong>{riskLabel(preview.risk)}</strong>
          <span>{preview.moves.length} sessão(ões) podem ser redistribuídas</span>
        </div>
        <div className="recovery-moves">
          {preview.moves.length ? preview.moves.map((move) => (
            <div key={move.itemId}>
              <span><b>{move.subject}</b><small>{move.topic}</small></span>
              <span className="move-date">{formatDate(move.fromDate)} <ArrowRight size={14} /> {formatDate(move.toDate)}</span>
            </div>
          )) : <p>Nenhuma sessão atrasada cabe em um novo dia sem sobrecarregar a rota.</p>}
        </div>
        {preview.suggestions.length ? <ul className="adaptive-suggestions">{preview.suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}</ul> : null}
        {error ? <div className="notice">{error}</div> : null}
        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={undo} disabled={undoing}>{undoing ? "Desfazendo..." : "Desfazer última"}</button>
          <button className="ghost-button" type="button" onClick={onClose}>Manter como está</button>
          <button className="primary-button" type="button" onClick={apply} disabled={saving || !preview.moves.length}>{saving ? "Aplicando..." : "Confirmar reorganização"}</button>
        </div>
      </div>
    </div>
  );
}

export function ReviewsView({ subjects, sessions, reviewStates, errors, onStart }: {
  subjects: AdaptiveSubject[];
  sessions: StudySessionRecord[];
  reviewStates: ReviewState[];
  errors: ErrorEntry[];
  onStart: StartSession;
}) {
  const dueByTopic = new Map(reviewStates.map((item) => [item.topicId, item.dueAt]));
  const mastery = buildMastery(subjects, sessions, dueByTopic);
  const due = mastery.filter((item) => item.nextReviewAt && item.nextReviewAt.slice(0, 10) <= todayIso()).sort((a, b) => a.mastery - b.mastery);

  return (
    <div className="adaptive-page-grid">
      <section className="panel review-queue-panel">
        <div className="panel-header"><div><h2>Fila de revisões</h2><p className="muted">O FSRS agenda o próximo contato conforme sua lembrança.</p></div><span className="queue-count">{due.length} vencida(s)</span></div>
        <div className="stack-list">
          {due.length ? due.map((item) => (
            <article className="review-queue-item" key={`${item.subject}-${item.topic}`}>
              <div><strong>{item.topic}</strong><span>{item.subject} · domínio {item.mastery}%</span></div>
              <button className="primary-button compact-button" type="button" onClick={() => onStart(masteryToReview(item))}><RotateCcw size={16} /> Revisar</button>
            </article>
          )) : <div className="empty-state">Nenhuma revisão vencida. As próximas aparecerão depois que você avaliar uma sessão.</div>}
        </div>
      </section>
      <section className="panel risk-map-panel">
        <div className="panel-header"><div><h2>Mapa de risco do edital</h2><p className="muted">Peso, cobertura, acertos e tempo desde o último estudo.</p></div></div>
        <div className="risk-map-list">
          {subjects.map((subject) => {
            const entries = mastery.filter((item) => item.subject === subject.name);
            const average = entries.length ? Math.round(entries.reduce((sum, item) => sum + item.mastery, 0) / entries.length) : 0;
            const unresolved = errors.filter((entry) => entry.subject === subject.name && !entry.resolved).length;
            const priority = Math.round((100 - average) * (1 + Number(subject.weight || 0) / 100) + unresolved * 5);
            return <div className="risk-map-row" key={subject.name}><span className="dot" style={{ background: subject.color }} /><div><strong>{subject.name}</strong><span>{entries.length} subtópicos · {unresolved} erro(s) pendente(s) · prioridade {priority}</span></div><b>{average}%</b><i><em style={{ width: `${average}%` }} /></i></div>;
          })}
        </div>
      </section>
    </div>
  );
}

export function ErrorsView({ entries, subjects, onCreate, onToggle }: {
  entries: ErrorEntry[];
  subjects: AdaptiveSubject[];
  onCreate: (entry: Omit<ErrorEntry, "id" | "createdAt" | "resolved">) => Promise<void>;
  onToggle: (entry: ErrorEntry) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const pending = entries.filter((entry) => !entry.resolved);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    await onCreate({
      subject: String(form.get("subject")),
      topic: String(form.get("topic") || ""),
      title: String(form.get("title")),
      details: String(form.get("details") || ""),
      errorType: String(form.get("errorType")) as ErrorEntry["errorType"],
      source: String(form.get("source") || "")
    });
    setSaving(false);
    setOpen(false);
  }

  return (
    <>
      <section className="panel">
        <div className="panel-header"><div><h2>Caderno de erros</h2><p className="muted">Transforme cada erro em uma revisão objetiva.</p></div><button className="primary-button" type="button" onClick={() => setOpen(true)}><Plus size={17} /> Registrar erro</button></div>
        <div className="error-summary"><strong>{pending.length}</strong><span>erros pendentes para revisar</span></div>
        <div className="error-list">
          {entries.length ? entries.map((entry) => <article className={`error-card ${entry.resolved ? "resolved" : ""}`} key={entry.id}><div className="error-card-top"><span className={`error-type error-${entry.errorType}`}>{errorTypeLabel(entry.errorType)}</span><span>{formatDate(entry.createdAt.slice(0, 10))}</span></div><h3>{entry.title}</h3><p>{entry.subject}{entry.topic ? ` · ${entry.topic}` : ""}</p>{entry.details ? <small>{entry.details}</small> : null}<button className="ghost-button compact-button" type="button" onClick={() => onToggle(entry)}>{entry.resolved ? <><RotateCcw size={15} /> Reabrir</> : <><Check size={15} /> Marcar dominado</>}</button></article>) : <div className="empty-state">Seu caderno está vazio. Registre erros encontrados em questões e simulados.</div>}
        </div>
      </section>
      {open ? <div className="modal-backdrop" role="presentation"><form className="modal-card" onSubmit={submit}><h2>Registrar erro</h2><label>Título<input name="title" required autoFocus placeholder="Ex.: Confundi competência concorrente" /></label><div className="form-row"><label>Disciplina<select name="subject">{subjects.map((subject) => <option key={subject.name}>{subject.name}</option>)}</select></label><label>Tipo<select name="errorType"><option value="content">Conteúdo</option><option value="interpretation">Interpretação</option><option value="attention">Atenção</option><option value="calculation">Cálculo</option></select></label></div><label>Subtópico<input name="topic" /></label><label>Fonte<input name="source" placeholder="Prova, banca ou material" /></label><label>O que aconteceu?<textarea name="details" /></label><div className="modal-actions"><button className="ghost-button" type="button" onClick={() => setOpen(false)}>Cancelar</button><button className="primary-button" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar erro"}</button></div></form></div> : null}
    </>
  );
}

export function SimulationsView({ schedule, sessions, subjects, simulations, examDate, onCreate }: {
  schedule: ScheduleItem[];
  sessions: StudySessionRecord[];
  subjects: AdaptiveSubject[];
  simulations: SimulationRecord[];
  examDate: string;
  onCreate: (simulation: Omit<SimulationRecord, "id">) => Promise<void>;
}) {
  const [extraHours, setExtraHours] = useState(0);
  const [lostDays, setLostDays] = useState(0);
  const [scenarioDate, setScenarioDate] = useState(examDate);
  const [open, setOpen] = useState(false);
  const base = calculatePlanBudget(schedule, examDate || todayIso());
  const scenario = calculatePlanBudget(schedule, scenarioDate || examDate || todayIso(), addDays(new Date(), lostDays), extraHours * 60);
  const questions = simulations.reduce((sum, item) => sum + item.totalQuestions, 0);
  const correct = simulations.reduce((sum, item) => sum + item.correct, 0);
  const adherence = weeklyReview(schedule, sessions).adherence;
  const readiness = Math.round(base.coveragePercent * 0.35 + (questions ? correct / questions * 100 : 0) * 0.4 + adherence * 0.25);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const results = subjects.map((subject, index) => ({ subjectId: subject.id, subject: subject.name, questions: Number(form.get(`subjectQuestions-${index}`) || 0), correct: Number(form.get(`subjectCorrect-${index}`) || 0) })).filter((result) => result.questions > 0);
    await onCreate({ title: String(form.get("title")), date: String(form.get("date")), totalQuestions: Number(form.get("totalQuestions")), correct: Number(form.get("correct")), durationMinutes: Number(form.get("durationMinutes")), notes: String(form.get("notes") || ""), results });
    setOpen(false);
  }

  return <>
    <div className="adaptive-page-grid">
      <section className="panel readiness-panel"><span className="adaptive-kicker"><BookOpenCheck size={15} /> Preparação atual</span><div className="readiness-score"><strong>{readiness}</strong><span>/ 100</span></div><p>Indicador de cobertura, aderência e desempenho. Não é uma previsão de aprovação.</p><div className="readiness-parts"><span>Cobertura <b>{base.coveragePercent}%</b></span><span>Aderência <b>{adherence}%</b></span><span>Simulados <b>{questions ? Math.round(correct / questions * 100) : 0}%</b></span></div></section>
      <section className="panel scenario-panel"><div className="panel-header"><div><h2>Simulador de cenários</h2><p className="muted">Veja o impacto antes de mudar sua rotina.</p></div></div><div className="form-row"><label>Horas extras por dia<input type="number" min="0" max="8" step="0.5" value={extraHours} onChange={(event) => setExtraHours(Number(event.target.value))} /></label><label>Dias sem estudar<input type="number" min="0" max="30" value={lostDays} onChange={(event) => setLostDays(Number(event.target.value))} /></label></div><label>Nova data da prova<input type="date" value={scenarioDate} onChange={(event) => setScenarioDate(event.target.value)} /></label><div className={`scenario-result route-risk-${scenario.risk}`}><strong>{riskLabel(scenario.risk)}</strong><span>{formatMinutes(scenario.remainingMinutes)} restantes · {scenario.daysLeft} dias disponíveis</span></div></section>
    </div>
    <section className="panel simulations-history"><div className="panel-header"><div><h2>Simulados</h2><p className="muted">Registre resultados para ajustar seu mapa de risco.</p></div><button className="primary-button" type="button" onClick={() => setOpen(true)}><Plus size={17} /> Novo simulado</button></div><div className="simulation-list">{simulations.length ? simulations.map((item) => <article key={item.id}><div><strong>{item.title}</strong><span>{formatDate(item.date)} · {formatMinutes(item.durationMinutes)}</span></div><b>{item.totalQuestions ? Math.round(item.correct / item.totalQuestions * 100) : 0}%</b></article>) : <div className="empty-state">Nenhum simulado registrado.</div>}</div></section>
    {open ? <div className="modal-backdrop" role="presentation"><form className="modal-card simulation-modal" onSubmit={submit}><h2>Novo simulado</h2><label>Nome<input name="title" required autoFocus placeholder="Ex.: Simulado completo 01" /></label><div className="form-row"><label>Data<input name="date" type="date" defaultValue={todayIso()} required /></label><label>Duração em minutos<input name="durationMinutes" type="number" min="1" required /></label></div><div className="form-row"><label>Questões<input name="totalQuestions" type="number" min="1" required /></label><label>Acertos<input name="correct" type="number" min="0" required /></label></div><fieldset className="simulation-breakdown"><legend>Resultado por disciplina (opcional)</legend>{subjects.map((subject, index) => <div key={subject.name}><span>{subject.name}</span><label>Questões<input name={`subjectQuestions-${index}`} type="number" min="0" defaultValue="0" /></label><label>Acertos<input name={`subjectCorrect-${index}`} type="number" min="0" defaultValue="0" /></label></div>)}</fieldset><label>Observações<textarea name="notes" /></label><div className="modal-actions"><button className="ghost-button" type="button" onClick={() => setOpen(false)}>Cancelar</button><button className="primary-button" type="submit">Salvar simulado</button></div></form></div> : null}
  </>;
}

type StudyPack = {
  id: string;
  sourceName: string;
  subject: string;
  topic: string;
  title: string;
  summary: string;
  flashcards: Array<{ front: string; back: string; sourceExcerpt: string }>;
  quiz: Array<{ question: string; options: string[]; correctIndex: number; explanation: string; sourceExcerpt: string }>;
};

export function MaterialsView({ planId, subjects, onAddError }: {
  planId: string;
  subjects: AdaptiveSubject[];
  onAddError: (entry: Omit<ErrorEntry, "id" | "createdAt" | "resolved">) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pack, setPack] = useState<StudyPack | null>(null);
  const [flipped, setFlipped] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [savedErrors, setSavedErrors] = useState<number[]>([]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !planId) return;
    let active = true;
    supabase.from("study_material_packs").select("id,subject_name,topic_title,source_name,generated_content").eq("plan_id", planId).order("created_at", { ascending: false }).limit(1).maybeSingle().then(({ data }) => {
      if (!active || !data?.generated_content) return;
      setPack({ id: data.id, sourceName: data.source_name, subject: data.subject_name, topic: data.topic_title || "", ...(data.generated_content as Omit<StudyPack, "id" | "sourceName" | "subject" | "topic">) });
    });
    return () => { active = false; };
  }, [planId]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("planId", planId);
    setLoading(true);
    setError("");
    setPack(null);
    try {
      const token = await accessToken();
      const response = await fetch("/api/ai/study-materials", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível gerar o material.");
      setPack(data.pack);
      setAnswers({});
      setFlipped(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível gerar o material.");
    } finally {
      setLoading(false);
    }
  }

  async function addQuizError(index: number) {
    if (!pack) return;
    const question = pack.quiz[index];
    await onAddError({ subject: pack.subject, topic: pack.topic, title: question.question, details: question.explanation, errorType: "content", source: pack.sourceName });
    setSavedErrors((current) => [...current, index]);
  }

  return <>
    <section className="panel material-builder">
      <div className="panel-header"><div><h2>Estudar a partir do seu material</h2><p className="muted">A IA só pode usar o texto ou arquivo enviado e mostra a fonte em cada resposta.</p></div><FileText size={24} /></div>
      <form className="create-form" onSubmit={submit}>
        <div className="form-row"><label>Disciplina<select name="subject">{subjects.map((subject) => <option key={subject.name}>{subject.name}</option>)}</select></label><label>Subtópico<input name="topic" placeholder="Ex.: Direitos fundamentais" /></label></div>
        <label>Arquivo de estudo<input name="materialFile" type="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" /></label>
        <label>Ou cole o conteúdo<textarea name="materialText" placeholder="Cole aqui lei seca, resumo, caderno ou trecho de apostila..." /></label>
        {error ? <div className="notice">{error}</div> : null}
        <button className="primary-button" type="submit" disabled={loading}><WandSparkles size={18} /> {loading ? "Gerando com a fonte..." : "Gerar quiz e flashcards"}</button>
      </form>
    </section>

    {pack ? <section className="material-pack">
      <div className="material-pack-heading"><span className="adaptive-kicker"><Layers3 size={15} /> Material gerado</span><h2>{pack.title}</h2><p>{pack.summary}</p><small>Fonte: {pack.sourceName}</small></div>
      <div className="material-section"><h3>Flashcards</h3><div className="flashcard-grid">{pack.flashcards.map((card, index) => <button className={`flashcard ${flipped === index ? "flipped" : ""}`} type="button" key={`${card.front}-${index}`} onClick={() => setFlipped(flipped === index ? null : index)}><span>{flipped === index ? card.back : card.front}</span><small>{flipped === index ? `Fonte: ${card.sourceExcerpt}` : "Toque para revelar"}</small></button>)}</div></div>
      <div className="material-section"><h3>Quiz</h3><div className="generated-quiz">{pack.quiz.map((question, index) => { const selected = answers[index]; const answered = selected !== undefined; const correct = selected === question.correctIndex; return <article key={`${question.question}-${index}`}><span className="question-number">{String(index + 1).padStart(2, "0")}</span><h4>{question.question}</h4><div className="quiz-answer-grid">{question.options.map((option, optionIndex) => <button className={`${answered && optionIndex === question.correctIndex ? "correct" : ""} ${answered && selected === optionIndex && !correct ? "wrong" : ""}`} type="button" key={option} disabled={answered} onClick={() => setAnswers((current) => ({ ...current, [index]: optionIndex }))}>{option}</button>)}</div>{answered ? <div className={`quiz-feedback ${correct ? "correct" : "wrong"}`}><strong>{correct ? "Resposta correta" : "Vale revisar"}</strong><p>{question.explanation}</p><small>Fonte: {question.sourceExcerpt}</small>{!correct ? <button className="ghost-button compact-button" type="button" disabled={savedErrors.includes(index)} onClick={() => addQuizError(index)}>{savedErrors.includes(index) ? "Adicionado ao caderno" : "Adicionar ao caderno de erros"}</button> : null}</div> : null}</article>; })}</div></div>
    </section> : null}
  </>;
}

function buildMastery(subjects: AdaptiveSubject[], sessions: StudySessionRecord[], dueByTopic = new Map<string, string>()) {
  return subjects.flatMap((subject) => subject.topics.map((topic, index) => ({
    ...calculateTopicMastery(subject.name, topic, sessions, dueByTopic.get(subject.topicIds?.[index] || "")),
    topicId: subject.topicIds?.[index]
  })));
}

function masteryToReview(item: TopicMastery): ScheduleItem {
  return { id: undefined, topicId: item.topicId, date: todayIso(), weekday: weekdayFromIso(todayIso()), period: currentPeriod(), subject: item.subject, topic: item.topic, kind: "revisao", minutes: 30, status: "planned", completionPercent: 0 };
}

async function accessToken() {
  const supabase = createBrowserSupabaseClient();
  const token = supabase ? (await supabase.auth.getSession()).data.session?.access_token : undefined;
  if (!token) throw new Error("Sua sessão expirou. Entre novamente.");
  return token;
}

function riskLabel(risk: RebalancePreview["risk"]) { return { comfortable: "Rota confortável", tight: "Rota apertada", unviable: "Rota inviável" }[risk]; }
function statusLabel(status: string) { return { completed: "Concluída", partial: "Parcial", postponed: "Adiada", missed: "Não realizada" }[status] || status; }
function ratingLabel(rating: RecallRating) { return { forgot: "Esqueci", hard: "Difícil", good: "Bom", easy: "Fácil" }[rating]; }
function errorTypeLabel(type: ErrorEntry["errorType"]) { return { content: "Conteúdo", interpretation: "Interpretação", attention: "Atenção", calculation: "Cálculo" }[type]; }
function displayKind(kind: ScheduleItem["kind"]) { return { teoria: "Teoria", questoes: "Questões", revisao: "Revisão", simulado: "Simulado" }[kind]; }
function weeklySuggestion(adherence: number, missed: number) { if (missed) return "Há pendências para redistribuir. Use o modo recuperação antes que a carga se acumule."; if (adherence >= 85) return "Ótimo ritmo. Preserve uma margem para revisão e imprevistos."; return "Ajuste a próxima semana à carga que você realmente consegue cumprir."; }
function formatMinutes(minutes: number) { const hours = Math.floor(minutes / 60); const rest = minutes % 60; return hours ? `${hours}h${rest ? ` ${rest}min` : ""}` : `${rest}min`; }
function formatClock(seconds: number) { return `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds % 3600 / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }
function formatDate(value: string) { const [year, month, day] = value.slice(0, 10).split("-"); return `${day}/${month}/${year}`; }
function todayIso() { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
function addDays(date: Date, amount: number) { const copy = new Date(date); copy.setDate(copy.getDate() + amount); return copy; }
function currentPeriod(): ScheduleItem["period"] { const hour = Number(new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", hour12: false }).format(new Date())); return hour < 12 ? "Manha" : hour < 18 ? "Tarde" : "Noite"; }
function weekdayFromIso(value: string) { const [year, month, day] = value.split("-").map(Number); return ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"][new Date(year, month - 1, day).getDay()]; }

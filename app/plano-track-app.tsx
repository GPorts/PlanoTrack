"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ClipboardList, LayoutDashboard, ListChecks, Plus, Sparkles } from "lucide-react";
import type { GeneratedPlan, ScheduleItem, SubjectInput } from "@/lib/types";

type View = "dashboard" | "create" | "calendar" | "goals" | "subjects" | "sessions";

type Subject = SubjectInput & {
  color: string;
  progress: number;
};

type Goal = {
  id: string;
  title: string;
  subject: string;
  due: string;
  done: boolean;
};

type Session = {
  id: string;
  date: string;
  subject: string;
  minutes: number;
  questions: number;
  correct: number;
  notes: string;
};

const colors = ["#c92a2a", "#2563eb", "#149b7e", "#7c3aed", "#d97706", "#0891b2", "#b91c1c", "#4f46e5", "#15803d", "#0f766e"];

const initialSubjects: Subject[] = [
  {
    name: "Lingua Portuguesa",
    questions: 6,
    weight: 9,
    color: colors[0],
    progress: 0,
    topics: ["Interpretacao de texto", "Generos textuais", "Coesao e coerencia", "Classes de palavras", "Sintaxe"]
  },
  {
    name: "Direito Constitucional",
    questions: 8,
    weight: 12,
    color: colors[1],
    progress: 0,
    topics: ["Controle de constitucionalidade", "Direitos fundamentais", "Organizacao do Estado", "Organizacao dos Poderes"]
  },
  {
    name: "Direito Administrativo",
    questions: 8,
    weight: 12,
    color: colors[2],
    progress: 0,
    topics: ["Principios administrativos", "Atos administrativos", "Agentes publicos", "Licitacoes", "Responsabilidade civil do Estado"]
  },
  {
    name: "Direito Processual Civil e Direito Civil",
    questions: 5,
    weight: 10,
    color: colors[3],
    progress: 0,
    topics: ["Processo de conhecimento", "Recursos", "Fazenda Publica em juizo", "LINDB", "Obrigacoes e contratos"]
  },
  {
    name: "Direito Processual Penal e Direito Penal",
    questions: 5,
    weight: 10,
    color: colors[4],
    progress: 0,
    topics: ["Inquerito policial", "Acao penal", "Provas", "Crimes contra a Administracao Publica", "Abuso de autoridade"]
  },
  {
    name: "Direito Tributario, Financeiro e Orcamentario",
    questions: 8,
    weight: 12,
    color: colors[5],
    progress: 0,
    topics: ["Sistema Tributario Nacional", "Credito tributario", "Tributos municipais", "PPA, LDO e LOA", "LRF"]
  },
  {
    name: "Direito do Trabalho e Direito Processual do Trabalho",
    questions: 5,
    weight: 10,
    color: colors[6],
    progress: 0,
    topics: ["Contrato de trabalho", "Jornada", "Verbas rescisorias", "Recursos trabalhistas", "Execucao trabalhista"]
  },
  {
    name: "Direito Urbanistico",
    questions: 5,
    weight: 7.5,
    color: colors[7],
    progress: 0,
    topics: ["Estatuto da Cidade", "Plano Diretor", "Zoneamento", "Regularizacao fundiaria", "Licenciamento urbanistico"]
  },
  {
    name: "Direito Ambiental",
    questions: 5,
    weight: 7.5,
    color: colors[8],
    progress: 0,
    topics: ["Politica Nacional do Meio Ambiente", "Licenciamento ambiental", "EIA/RIMA", "Crimes ambientais", "Competencias municipais"]
  },
  {
    name: "Legislacao Municipal",
    questions: 5,
    weight: 10,
    color: colors[9],
    progress: 0,
    topics: ["Lei Organica", "Estatuto dos Servidores", "Plano de cargos", "Estrutura administrativa"]
  }
];

const initialSchedule: ScheduleItem[] = [
  item("2026-06-29", "Segunda-feira", "Manha", "Direito Processual Penal e Direito Penal", "Direito Penal: principios constitucionais e gerais", "teoria"),
  item("2026-06-29", "Segunda-feira", "Tarde", "Direito Processual Penal e Direito Penal", "Direito Processual Penal: principios constitucionais e gerais", "teoria"),
  item("2026-06-29", "Segunda-feira", "Noite", "Direito Administrativo", "Questoes do tema: Administracao Publica direta e indireta", "questoes"),
  item("2026-06-30", "Terca-feira", "Manha", "Direito Processual Civil e Direito Civil", "Direito Civil: LINDB", "teoria"),
  item("2026-06-30", "Terca-feira", "Tarde", "Direito Processual Civil e Direito Civil", "Processo Civil: normas fundamentais", "teoria"),
  item("2026-06-30", "Terca-feira", "Noite", "Lingua Portuguesa", "Questoes: interpretacao de texto", "questoes")
];

const initialGoals: Goal[] = initialSubjects.flatMap((subject, subjectIndex) =>
  subject.topics.map((topic, topicIndex) => ({
    id: `${subjectIndex}-${topicIndex}`,
    title: topic,
    subject: subject.name,
    due: topicIndex < 2 ? "2026-07-10" : "2026-08-20",
    done: subjectIndex === 0 && topicIndex < 2
  }))
);

function item(date: string, weekday: string, period: ScheduleItem["period"], subject: string, topic: string, kind: ScheduleItem["kind"]): ScheduleItem {
  return { date, weekday, period, subject, topic, kind, minutes: 120 };
}

export function PlanoTrackApp() {
  const [view, setView] = useState<View>("dashboard");
  const [subjects, setSubjects] = useState(initialSubjects);
  const [goals, setGoals] = useState(initialGoals);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [sessions, setSessions] = useState<Session[]>([
    { id: "1", date: "2026-06-28", subject: "Lingua Portuguesa", minutes: 100, questions: 0, correct: 0, notes: "Teste inicial" }
  ]);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  const stats = useMemo(() => {
    const minutes = sessions.reduce((sum, session) => sum + session.minutes, 0);
    const questions = sessions.reduce((sum, session) => sum + session.questions, 0);
    const correct = sessions.reduce((sum, session) => sum + session.correct, 0);
    const doneGoals = goals.filter((goal) => goal.done).length;

    return {
      minutes,
      questions,
      accuracy: questions ? Math.round((correct / questions) * 100) : 0,
      doneGoals
    };
  }, [sessions, goals]);

  const viewTitle = {
    dashboard: "Painel",
    create: "Criar plano",
    calendar: "Calendario",
    goals: "Metas",
    subjects: "Disciplinas",
    sessions: "Sessoes"
  }[view];

  function importGeneratedPlan(plan: GeneratedPlan) {
    const mappedSubjects = plan.subjects.map((subject, index) => ({
      ...subject,
      color: colors[index % colors.length],
      progress: 0
    }));
    const mappedGoals = mappedSubjects.flatMap((subject, subjectIndex) =>
      subject.topics.map((topic, topicIndex) => ({
        id: `generated-${subjectIndex}-${topicIndex}`,
        title: topic,
        subject: subject.name,
        due: plan.examDate,
        done: false
      }))
    );

    setSubjects(mappedSubjects);
    setGoals(mappedGoals);
    setSchedule(plan.schedule);
    setView("dashboard");
  }

  function openGoalModal(goal?: Goal) {
    setEditingGoal(goal || null);
    setIsGoalModalOpen(true);
  }

  function saveGoal(goal: Goal) {
    setGoals((currentGoals) => {
      const exists = currentGoals.some((item) => item.id === goal.id);
      return exists ? currentGoals.map((item) => (item.id === goal.id ? goal : item)) : [...currentGoals, goal];
    });
    setIsGoalModalOpen(false);
    setEditingGoal(null);
  }

  function openSubjectModal(subject?: Subject) {
    setEditingSubject(subject || null);
    setIsSubjectModalOpen(true);
  }

  function saveSubject(subject: Subject) {
    setSubjects((currentSubjects) => {
      const exists = currentSubjects.some((item) => item.name === editingSubject?.name);
      return exists ? currentSubjects.map((item) => (item.name === editingSubject?.name ? subject : item)) : [...currentSubjects, subject];
    });
    setIsSubjectModalOpen(false);
    setEditingSubject(null);
  }

  return (
    <div className="planner-shell">
      <aside className="planner-sidebar">
        <div className="planner-brand">
          <div className="planner-mark">PT</div>
          <div>
            <strong>PlanoTrack</strong>
            <span>Estudo organizado</span>
          </div>
        </div>

        <nav className="planner-nav" aria-label="Navegacao principal">
          <NavButton active={view === "dashboard"} icon={<LayoutDashboard size={18} />} label="Painel" onClick={() => setView("dashboard")} />
          <NavButton active={view === "create"} icon={<Sparkles size={18} />} label="Criar plano" onClick={() => setView("create")} />
          <NavButton active={view === "calendar"} icon={<CalendarDays size={18} />} label="Calendario" onClick={() => setView("calendar")} />
          <NavButton active={view === "goals"} icon={<ListChecks size={18} />} label="Metas" onClick={() => setView("goals")} />
          <NavButton active={view === "subjects"} icon={<ClipboardList size={18} />} label="Disciplinas" onClick={() => setView("subjects")} />
          <NavButton active={view === "sessions"} icon={<Plus size={18} />} label="Sessoes" onClick={() => setView("sessions")} />
        </nav>

        <div className="sidebar-block">
          <div className="block-title">Progresso geral</div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${Math.round((stats.doneGoals / goals.length) * 100)}%` }} />
          </div>
          <div className="small-muted">{Math.round((stats.doneGoals / goals.length) * 100)}% concluido</div>
        </div>
      </aside>

      <main className="planner-main">
        <header className="planner-topbar">
          <div>
            <p className="eyebrow">Planejamento inteligente</p>
            <h1>{viewTitle}</h1>
          </div>
          <div className="top-actions">
            <button className="primary-button" type="button" onClick={() => setView("sessions")}>
              Nova sessao
            </button>
          </div>
        </header>

        {view === "dashboard" ? (
          <Dashboard stats={stats} goals={goals} subjects={subjects} schedule={schedule} sessions={sessions} setView={setView} />
        ) : null}
        {view === "create" ? <CreatePlan onPlanGenerated={importGeneratedPlan} /> : null}
        {view === "calendar" ? <Calendar schedule={schedule} /> : null}
        {view === "goals" ? <Goals goals={goals} setGoals={setGoals} openGoalModal={openGoalModal} /> : null}
        {view === "subjects" ? <Subjects subjects={subjects} setSubjects={setSubjects} openSubjectModal={openSubjectModal} /> : null}
        {view === "sessions" ? <Sessions subjects={subjects} sessions={sessions} setSessions={setSessions} /> : null}
      </main>

      {isGoalModalOpen ? (
        <GoalModal
          goal={editingGoal}
          subjects={subjects}
          onClose={() => {
            setIsGoalModalOpen(false);
            setEditingGoal(null);
          }}
          onSave={saveGoal}
        />
      ) : null}

      {isSubjectModalOpen ? (
        <SubjectModal
          subject={editingSubject}
          fallbackColor={colors[subjects.length % colors.length]}
          onClose={() => {
            setIsSubjectModalOpen(false);
            setEditingSubject(null);
          }}
          onSave={saveSubject}
        />
      ) : null}
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`} type="button" onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Dashboard({
  stats,
  goals,
  subjects,
  schedule,
  sessions,
  setView
}: {
  stats: { minutes: number; questions: number; accuracy: number; doneGoals: number };
  goals: Goal[];
  subjects: Subject[];
  schedule: ScheduleItem[];
  sessions: Session[];
  setView: (view: View) => void;
}) {
  return (
    <>
      <div className="stats-grid">
        <Stat label="Horas estudadas" value={formatMinutes(stats.minutes)} />
        <Stat label="Questoes feitas" value={String(stats.questions)} />
        <Stat label="Taxa de acerto" value={`${stats.accuracy}%`} />
        <Stat label="Metas concluidas" value={`${stats.doneGoals}/${goals.length}`} />
      </div>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Foco de hoje</h2>
            <button className="text-button" type="button" onClick={() => setView("calendar")}>
              Ver calendario
            </button>
          </div>
          <div className="stack-list">{schedule.slice(0, 3).map((slot, index) => <StudySlot key={index} slot={slot} />)}</div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Desempenho por materia</h2>
            <button className="text-button" type="button" onClick={() => setView("subjects")}>
              Editar
            </button>
          </div>
          <div className="subject-list">{subjects.map((subject) => <SubjectRow key={subject.name} subject={subject} sessions={sessions} />)}</div>
        </section>
      </div>
    </>
  );
}

function CreatePlan({ onPlanGenerated }: { onPlanGenerated: (plan: GeneratedPlan) => void }) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"manual" | "ai">("ai");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const days = ["Segunda-feira", "Terca-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sabado", "Domingo"].filter(
      (day) => form.get(day) === "on"
    );

    const response = await fetch("/api/ai/generate-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        routine: {
          examName: form.get("examName"),
          examDate: form.get("examDate"),
          hoursPerDay: Number(form.get("hoursPerDay") || 6),
          studyDays: days,
          preferredBlocks: form.get("preferredBlocks")
        },
        editalText: form.get("editalText")
      })
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Nao foi possivel criar o plano.");
      return;
    }

    onPlanGenerated(data.plan);
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Criar novo plano</h2>
          <p className="muted">Cole o edital, defina a rotina e gere um cronograma completo.</p>
        </div>
        <div className="credit-box">Assinatura ativa = planos ilimitados</div>
      </div>

      <form className="create-form" onSubmit={submit}>
        <div className="form-row">
          <label>
            Nome da prova
            <input name="examName" defaultValue="Concurso PGM" required />
          </label>
          <label>
            Data da prova
            <input name="examDate" type="date" required />
          </label>
        </div>
        <div className="form-row">
          <label>
            Horas por dia
            <input name="hoursPerDay" type="number" min="1" max="12" defaultValue="6" required />
          </label>
          <label>
            Tipo de criacao
            <select value={mode} onChange={(event) => setMode(event.target.value as "manual" | "ai")}>
              <option value="ai">Gerar plano com IA</option>
              <option value="manual">Criar estrutura manual gratis</option>
            </select>
          </label>
        </div>

        <fieldset className="day-picker">
          <legend>Dias de estudo</legend>
          {["Segunda-feira", "Terca-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sabado", "Domingo"].map((day) => (
            <label key={day}>
              <input name={day} type="checkbox" defaultChecked />
              {day.replace("-feira", "")}
            </label>
          ))}
        </fieldset>

        <label>
          Rotina desejada
          <input name="preferredBlocks" defaultValue="Manha e tarde para teoria; noite para questoes e revisao." />
        </label>
        <label>
          Edital
          <textarea name="editalText" placeholder="Cole aqui o conteudo programatico do edital..." />
        </label>

        {mode === "manual" ? (
          <div className="notice">
            Manual gratis cria a estrutura inicial. Com assinatura ativa, o usuario pode gerar planos ilimitados com IA.
          </div>
        ) : null}
        {error ? <div className="notice">{error}</div> : null}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Criando..." : mode === "ai" ? "Gerar plano com IA" : "Criar plano manual"}
        </button>
      </form>
    </section>
  );
}

function Calendar({ schedule }: { schedule: ScheduleItem[] }) {
  const days = Object.values(
    schedule.reduce<Record<string, ScheduleItem[]>>((acc, item) => {
      acc[item.date] ||= [];
      acc[item.date].push(item);
      return acc;
    }, {})
  );

  return <div className="calendar-grid">{days.map((day) => <DayCard key={day[0].date} day={day} />)}</div>;
}

function Goals({
  goals,
  setGoals,
  openGoalModal
}: {
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  openGoalModal: (goal?: Goal) => void;
}) {
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  function deleteGoal(goal: Goal) {
    setGoals(goals.filter((item) => item.id !== goal.id));
    setGoalToDelete(null);
  }

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Quadro de metas</h2>
            <p className="muted">Acompanhe entregas, revisoes e simulados.</p>
          </div>
          <button className="primary-button" type="button" onClick={() => openGoalModal()}>
            Nova meta
          </button>
        </div>
        <div className="stack-list">
          {goals.map((goal) => (
            <article className="goal-item" key={goal.id}>
              <div>
                <strong>{goal.title}</strong>
                <div className="mini-meta">{goal.subject} | Prazo {formatDate(goal.due)}</div>
              </div>
              <div className="item-actions">
                <span className={`status-pill ${goal.done ? "done" : ""}`}>{goal.done ? "Concluida" : "Pendente"}</span>
                <button
                  className="icon-button"
                  type="button"
                  title="Alternar status"
                  onClick={() => setGoals(goals.map((item) => (item.id === goal.id ? { ...item, done: !item.done } : item)))}
                >
                  OK
                </button>
                <button className="icon-button" type="button" title="Editar" onClick={() => openGoalModal(goal)}>
                  E
                </button>
                <button className="icon-button" type="button" title="Excluir" onClick={() => setGoalToDelete(goal)}>
                  X
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {goalToDelete ? (
        <ConfirmModal
          title="Excluir meta"
          message={`Tem certeza que quer excluir "${goalToDelete.title}"?`}
          confirmLabel="Sim"
          cancelLabel="Nao"
          onCancel={() => setGoalToDelete(null)}
          onConfirm={() => deleteGoal(goalToDelete)}
        />
      ) : null}
    </>
  );
}

function Subjects({
  subjects,
  setSubjects,
  openSubjectModal
}: {
  subjects: Subject[];
  setSubjects: (subjects: Subject[]) => void;
  openSubjectModal: (subject?: Subject) => void;
}) {
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  function deleteSubject(subject: Subject) {
    setSubjects(subjects.filter((item) => item.name !== subject.name));
    setSubjectToDelete(null);
  }

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Disciplinas</h2>
            <p className="muted">Defina peso, cor e progresso manual de cada materia.</p>
          </div>
          <button className="primary-button" type="button" onClick={() => openSubjectModal()}>
            Nova disciplina
          </button>
        </div>
        <div className="subject-cards">
          {subjects.map((subject) => (
            <article className="subject-card" key={subject.name}>
              <div className="subject-card-head">
                <div className="subject-name">
                  <span className="dot" style={{ background: subject.color }} />
                  <span>{subject.name}</span>
                </div>
                <div className="item-actions">
                  <button className="icon-button" type="button" title="Editar" onClick={() => openSubjectModal(subject)}>
                    E
                  </button>
                  <button className="icon-button" type="button" title="Excluir" onClick={() => setSubjectToDelete(subject)}>
                    X
                  </button>
                </div>
              </div>
              <div className="mini-meta">
                {subject.questions || 0} questoes | peso {formatWeight(subject)} | {subject.weight || 0} pontos
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${subject.progress}%`, background: subject.color }} />
              </div>
              <details className="topic-details">
                <summary>{subject.topics.length} subtopicos</summary>
                <ol>{subject.topics.map((topic) => <li key={topic}>{topic}</li>)}</ol>
              </details>
            </article>
          ))}
        </div>
      </section>

      {subjectToDelete ? (
        <ConfirmModal
          title="Excluir disciplina"
          message={`Tem certeza que quer excluir "${subjectToDelete.name}"?`}
          confirmLabel="Sim"
          cancelLabel="Nao"
          onCancel={() => setSubjectToDelete(null)}
          onConfirm={() => deleteSubject(subjectToDelete)}
        />
      ) : null}
    </>
  );
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel
}: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-card confirm-card" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h2 id="confirm-title">{title}</h2>
        <p className="muted">{message}</p>
        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="primary-button" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Sessions({ subjects, sessions, setSessions }: { subjects: Subject[]; sessions: Session[]; setSessions: (sessions: Session[]) => void }) {
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSessions([
      ...sessions,
      {
        id: crypto.randomUUID(),
        date: String(form.get("date")),
        subject: String(form.get("subject")),
        minutes: Number(form.get("minutes")),
        questions: Number(form.get("questions")),
        correct: Number(form.get("correct")),
        notes: String(form.get("notes") || "")
      }
    ]);
    event.currentTarget.reset();
  }

  return (
    <div className="content-grid">
      <section className="panel">
        <div className="panel-header">
          <h2>Registrar sessao</h2>
        </div>
        <form className="create-form" onSubmit={submit}>
          <div className="form-row">
            <label>
              Data
              <input name="date" type="date" required />
            </label>
            <label>
              Disciplina
              <select name="subject">{subjects.map((subject) => <option key={subject.name}>{subject.name}</option>)}</select>
            </label>
          </div>
          <div className="form-row">
            <label>
              Minutos
              <input name="minutes" type="number" min="1" defaultValue="60" required />
            </label>
            <label>
              Questoes
              <input name="questions" type="number" min="0" defaultValue="0" required />
            </label>
          </div>
          <label>
            Acertos
            <input name="correct" type="number" min="0" defaultValue="0" required />
          </label>
          <label>
            Observacoes
            <textarea name="notes" />
          </label>
          <button className="primary-button" type="submit">Salvar sessao</button>
        </form>
      </section>
      <section className="panel">
        <h2>Historico</h2>
        <div className="stack-list">{sessions.map((session) => <div className="session-item" key={session.id}><strong>{session.subject}</strong><span>{formatMinutes(session.minutes)} | {session.questions} questoes</span></div>)}</div>
      </section>
    </div>
  );
}

function GoalModal({
  goal,
  subjects,
  onClose,
  onSave
}: {
  goal: Goal | null;
  subjects: Subject[];
  onClose: () => void;
  onSave: (goal: Goal) => void;
}) {
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSave({
      id: goal?.id || crypto.randomUUID(),
      title: String(form.get("title") || ""),
      subject: String(form.get("subject") || subjects[0]?.name || "Geral"),
      due: String(form.get("due") || "2026-08-29"),
      done: form.get("done") === "on"
    });
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal-card" onSubmit={submit}>
        <h2>{goal ? "Editar meta" : "Nova meta"}</h2>
        <label>
          Titulo
          <input name="title" defaultValue={goal?.title || ""} required autoFocus />
        </label>
        <label>
          Disciplina
          <select name="subject" defaultValue={goal?.subject || subjects[0]?.name}>
            {subjects.map((subject) => (
              <option key={subject.name} value={subject.name}>
                {subject.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Prazo
          <input name="due" type="date" defaultValue={goal?.due || "2026-08-29"} required />
        </label>
        <label className="checkbox-row">
          <input name="done" type="checkbox" defaultChecked={Boolean(goal?.done)} />
          Meta concluida
        </label>
        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary-button" type="submit">
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}

function SubjectModal({
  subject,
  fallbackColor,
  onClose,
  onSave
}: {
  subject: Subject | null;
  fallbackColor: string;
  onClose: () => void;
  onSave: (subject: Subject) => void;
}) {
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const topicsText = String(form.get("topics") || "");
    const topics = topicsText
      .split("\n")
      .map((topic) => topic.trim())
      .filter(Boolean);

    onSave({
      name: String(form.get("name") || ""),
      questions: Number(form.get("questions") || 0),
      weight: Number(form.get("weight") || 0),
      progress: Number(form.get("progress") || 0),
      color: String(form.get("color") || fallbackColor),
      topics: topics.length ? topics : ["Revisao geral"]
    });
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal-card" onSubmit={submit}>
        <h2>{subject ? "Editar disciplina" : "Nova disciplina"}</h2>
        <label>
          Nome
          <input name="name" defaultValue={subject?.name || ""} required autoFocus />
        </label>
        <div className="form-row">
          <label>
            Questoes
            <input name="questions" type="number" min="0" defaultValue={subject?.questions || 5} required />
          </label>
          <label>
            Pontos
            <input name="weight" type="number" min="0" step="0.5" defaultValue={subject?.weight || 10} required />
          </label>
        </div>
        <label>
          Progresso (%)
          <input name="progress" type="number" min="0" max="100" defaultValue={subject?.progress || 0} required />
        </label>
        <label>
          Cor
          <input name="color" type="color" defaultValue={subject?.color || fallbackColor} required />
        </label>
        <label>
          Subtopicos
          <textarea name="topics" defaultValue={(subject?.topics || ["Revisao geral"]).join("\n")} />
        </label>
        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary-button" type="submit">
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <article className="stat-card"><span>{label}</span><strong>{value}</strong></article>;
}

function StudySlot({ slot }: { slot: ScheduleItem }) {
  return (
    <article className="session-item">
      <div>
        <strong>{slot.period} - {slot.subject}</strong>
        <span>{slot.minutes / 60}h | {slot.topic}</span>
      </div>
      <span className="status-pill">{slot.kind === "questoes" ? "Questoes" : "Teoria"}</span>
    </article>
  );
}

function SubjectRow({ subject, sessions }: { subject: Subject; sessions: Session[] }) {
  const subjectSessions = sessions.filter((session) => session.subject === subject.name);
  const minutes = subjectSessions.reduce((sum, session) => sum + session.minutes, 0);
  const questions = subjectSessions.reduce((sum, session) => sum + session.questions, 0);
  const correct = subjectSessions.reduce((sum, session) => sum + session.correct, 0);
  const accuracy = questions ? Math.round((correct / questions) * 100) : 0;

  return (
    <div className="subject-row">
      <div>
        <div className="subject-name">
          <span className="dot" style={{ background: subject.color }} />
          <span>{subject.name}</span>
        </div>
        <div className="mini-meta">{formatMinutes(minutes)} | {questions} questoes | {accuracy}% acerto</div>
      </div>
      <strong>{subject.progress}%</strong>
    </div>
  );
}

function DayCard({ day }: { day: ScheduleItem[] }) {
  return (
    <article className="calendar-card day-plan">
      <div className="calendar-head">
        <strong>{formatDate(day[0].date)}</strong>
        <span>{day[0].weekday}</span>
      </div>
      <div className="calendar-body">
        {day.map((slot) => (
          <div className="study-slot" key={`${slot.date}-${slot.period}`}>
            <div className="slot-time">{slot.period}<span>{slot.minutes / 60}h</span></div>
            <div><strong>{slot.subject}</strong><p>{slot.topic}</p><span className="mini-meta">{slot.kind}</span></div>
          </div>
        ))}
      </div>
    </article>
  );
}

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}min`;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!day) return value;
  return `${day}/${month}/${year}`;
}

function formatWeight(subject: Subject) {
  if (!subject.questions || !subject.weight) return "0";
  const value = subject.weight / subject.questions;
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

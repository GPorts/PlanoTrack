"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardList, LayoutDashboard, ListChecks, LogOut, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import type { GeneratedPlan, ScheduleItem, SubjectInput } from "@/lib/types";

type View = "dashboard" | "create" | "calendar" | "goals" | "subjects" | "sessions";

type Subject = SubjectInput & {
  id?: string;
  color: string;
  progress: number;
  topicIds?: string[];
};

type Goal = {
  id: string;
  title: string;
  subject: string;
  subjectId?: string;
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

type StoredPlan = {
  id: string;
  title: string;
  exam_date: string;
  summary: string | null;
  subjects: Array<{
    id: string;
    name: string;
    questions: number | null;
    weight: number | null;
    color: string | null;
    progress: number | null;
    topics: Array<{
      id: string;
      title: string;
      status: string;
      due_date: string | null;
      position: number;
    }>;
  }>;
  schedule_items: Array<{
    id: string;
    date: string;
    period: ScheduleItem["period"];
    kind: ScheduleItem["kind"];
    minutes: number;
    subject_name: string;
    topic_title: string;
  }>;
  study_sessions: Array<{
    id: string;
    studied_at: string;
    subject_name: string | null;
    minutes: number;
    questions: number;
    correct: number;
    notes: string | null;
  }>;
};

type PlanOption = {
  id: string;
  title: string;
  exam_date: string;
  created_at: string;
};

const storedPlanSelect =
  "id,title,exam_date,summary,subjects(id,name,questions,weight,color,progress,topics(id,title,status,due_date,position)),schedule_items(id,date,period,kind,minutes,subject_name,topic_title),study_sessions(id,studied_at,subject_name,minutes,questions,correct,notes)";

const colors = ["#176b5f", "#2563eb", "#149b7e", "#0f766e", "#d97706", "#0891b2", "#2f6f43", "#4f46e5", "#15803d", "#64748b"];
const calendarColors = ["#176b5f", "#2458a6", "#0f766e", "#6d3fb6", "#2f6f43", "#0e7490", "#8a5a12"];
const initialSubjects: Subject[] = [];
const initialSchedule: ScheduleItem[] = [];
const initialGoals: Goal[] = [];

export function PlanoTrackerApp({ userId }: { userId: string }) {
  const [view, setView] = useState<View>("dashboard");
  const [subjects, setSubjects] = useState(initialSubjects);
  const [goals, setGoals] = useState(initialGoals);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [lastPlanSource, setLastPlanSource] = useState<GeneratedPlan["source"]>();
  const [currentPlanId, setCurrentPlanId] = useState("");
  const [planOptions, setPlanOptions] = useState<PlanOption[]>([]);
  const [storageMessage, setStorageMessage] = useState("");
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadLatestPlan() {
      const supabase = createBrowserSupabaseClient();

      if (!supabase || !userId) {
        if (active) setIsLoadingPlan(false);
        return;
      }

      const { data: options, error: optionsError } = await supabase
        .from("study_plans")
        .select("id,title,exam_date,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (optionsError) {
        if (active) {
          setStorageMessage("Não foi possível carregar seus planos salvos.");
          setIsLoadingPlan(false);
        }
        return;
      }

      if (!active) return;
      setPlanOptions((options || []) as PlanOption[]);

      const latestId = options?.[0]?.id;
      if (!latestId) {
        setIsLoadingPlan(false);
        return;
      }

      const { data, error } = await supabase
        .from("study_plans")
        .select(storedPlanSelect)
        .eq("user_id", userId)
        .eq("id", latestId)
        .single();

      if (!active) return;

      if (error) {
        setStorageMessage("Não foi possível carregar seu último plano salvo.");
        setIsLoadingPlan(false);
        return;
      }

      if (data) {
        importStoredPlan(data as StoredPlan);
      }

      setIsLoadingPlan(false);
    }

    loadLatestPlan();

    return () => {
      active = false;
    };
  }, [userId]);

  async function selectStoredPlan(planId: string) {
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !userId || planId === currentPlanId) return;

    setIsLoadingPlan(true);
    setStorageMessage("Carregando plano...");
    const { data, error } = await supabase
      .from("study_plans")
      .select(storedPlanSelect)
      .eq("user_id", userId)
      .eq("id", planId)
      .single();

    if (error || !data) {
      setStorageMessage("Não foi possível carregar o plano selecionado.");
      setIsLoadingPlan(false);
      return;
    }

    importStoredPlan(data as StoredPlan);
    setStorageMessage("");
    setIsLoadingPlan(false);
  }

  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase?.auth.signOut();
    window.location.assign("/login");
  }

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
    calendar: "Calendário",
    goals: "Metas",
    subjects: "Disciplinas",
    sessions: "Sessões"
  }[view];
  const totalGoals = goals.length || 1;
  const progressPercent = Math.round((stats.doneGoals / totalGoals) * 100);

  function applyGeneratedPlan(plan: GeneratedPlan) {
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
    setSessions([]);
    setCurrentPlanId("");
    setLastPlanSource(plan.source);
    setView("dashboard");

    return { mappedSubjects, mappedGoals };
  }

  function importGeneratedPlan(plan: GeneratedPlan) {
    applyGeneratedPlan(plan);
    saveGeneratedPlan(plan).catch(() => {
      setStorageMessage("Plano criado, mas não foi possível salvar no Supabase.");
    });
  }

  function importStoredPlan(plan: StoredPlan) {
    const sortedSubjects = [...(plan.subjects || [])].sort((a, b) => a.name.localeCompare(b.name));
    const mappedSubjects = sortedSubjects.map((subject, index) => ({
      id: subject.id,
      name: subject.name,
      questions: subject.questions || 0,
      weight: Number(subject.weight || 0),
      color: subject.color || colors[index % colors.length],
      progress: Number(subject.progress || calculateSubjectProgress(subject.topics || [])),
      topics: [...(subject.topics || [])].sort((a, b) => a.position - b.position).map((topic) => topic.title),
      topicIds: [...(subject.topics || [])].sort((a, b) => a.position - b.position).map((topic) => topic.id)
    }));
    const mappedGoals = sortedSubjects.flatMap((subject) =>
      [...(subject.topics || [])]
        .sort((a, b) => a.position - b.position)
        .map((topic) => ({
          id: topic.id,
          title: topic.title,
          subject: subject.name,
          subjectId: subject.id,
          due: topic.due_date || plan.exam_date,
          done: topic.status === "done"
        }))
    );
    const mappedSchedule = [...(plan.schedule_items || [])]
      .sort((a, b) => `${a.date}-${periodOrder(a.period)}`.localeCompare(`${b.date}-${periodOrder(b.period)}`))
      .map((item) => ({
        id: item.id,
        date: item.date,
        weekday: weekdayFromIso(item.date),
        period: item.period,
        subject: item.subject_name,
        topic: item.topic_title,
        kind: item.kind,
        minutes: item.minutes
      }));
    const mappedSessions = [...(plan.study_sessions || [])]
      .sort((a, b) => String(b.studied_at).localeCompare(String(a.studied_at)))
      .map((session) => ({
        id: session.id,
        date: session.studied_at,
        subject: session.subject_name || "Geral",
        minutes: session.minutes || 0,
        questions: session.questions || 0,
        correct: session.correct || 0,
        notes: session.notes || ""
      }));

    setCurrentPlanId(plan.id);
    setSubjects(mappedSubjects);
    setGoals(mappedGoals);
    setSchedule(mappedSchedule);
    setSessions(mappedSessions);
  }

  async function saveGeneratedPlan(plan: GeneratedPlan) {
    const supabase = createBrowserSupabaseClient();

    if (!supabase || !userId) return;

    setStorageMessage("Salvando plano...");

    const { data: savedPlan, error: planError } = await supabase
      .from("study_plans")
      .insert({
        user_id: userId,
        title: plan.title,
        exam_date: plan.examDate,
        mode: "ai",
        summary: plan.summary
      })
      .select("id")
      .single();

    if (planError || !savedPlan) throw planError || new Error("Plano não salvo.");

    const planId = savedPlan.id as string;
    const subjectIdByName = new Map<string, string>();
    const topicIdsBySubject = new Map<string, string[]>();
    const generatedGoalIdMap = new Map<string, { id: string; subjectId: string }>();

    for (const [subjectIndex, subject] of plan.subjects.entries()) {
      const color = colors[subjectIndex % colors.length];
      const { data: savedSubject, error: subjectError } = await supabase
        .from("subjects")
        .insert({
          plan_id: planId,
          name: subject.name,
          questions: subject.questions || 0,
          weight: subject.weight || 0,
          color,
          progress: 0
        })
        .select("id")
        .single();

      if (subjectError || !savedSubject) throw subjectError || new Error("Disciplina não salva.");

      const subjectId = savedSubject.id as string;
      subjectIdByName.set(subject.name, subjectId);

      if (subject.topics.length) {
        const { data: savedTopics, error: topicsError } = await supabase.from("topics").insert(
          subject.topics.map((topic, index) => ({
            subject_id: subjectId,
            title: topic,
            due_date: plan.examDate,
            position: index
          }))
        ).select("id,position");

        if (topicsError) throw topicsError;

        const orderedTopicIds = [...(savedTopics || [])]
          .sort((a, b) => Number(a.position) - Number(b.position))
          .map((topic) => String(topic.id));
        topicIdsBySubject.set(subject.name, orderedTopicIds);
        orderedTopicIds.forEach((topicId, topicIndex) => {
          generatedGoalIdMap.set(`generated-${subjectIndex}-${topicIndex}`, { id: topicId, subjectId });
        });
      }
    }

    if (plan.schedule.length) {
      const scheduleWithIds = plan.schedule.map((item) => ({ ...item, id: crypto.randomUUID() }));
      const { error: scheduleError } = await supabase.from("schedule_items").insert(
        scheduleWithIds.map((item) => ({
          id: item.id,
          plan_id: planId,
          date: item.date,
          period: item.period,
          kind: item.kind,
          minutes: item.minutes,
          subject_name: item.subject,
          topic_title: item.topic
        }))
      );

      if (scheduleError) throw scheduleError;
      setSchedule(scheduleWithIds);
    }

    setCurrentPlanId(planId);
    setPlanOptions((current) => [
      { id: planId, title: plan.title, exam_date: plan.examDate, created_at: new Date().toISOString() },
      ...current.filter((item) => item.id !== planId)
    ]);
    setSubjects((currentSubjects) =>
      currentSubjects.map((subject) => ({
        ...subject,
        id: subjectIdByName.get(subject.name),
        topicIds: topicIdsBySubject.get(subject.name) || subject.topicIds
      }))
    );
    setGoals((currentGoals) =>
      currentGoals.map((goal) => {
        const savedGoal = generatedGoalIdMap.get(goal.id);
        return savedGoal ? { ...goal, id: savedGoal.id, subjectId: savedGoal.subjectId } : goal;
      })
    );
    setStorageMessage("Plano salvo automaticamente.");
    window.setTimeout(() => setStorageMessage(""), 3000);
  }

  function openGoalModal(goal?: Goal) {
    setEditingGoal(goal || null);
    setIsGoalModalOpen(true);
  }

  function saveGoal(goal: Goal) {
    const subject = subjects.find((item) => item.name === goal.subject || item.id === goal.subjectId);
    const goalToSave = { ...goal, subjectId: subject?.id || goal.subjectId };

    setGoals((currentGoals) => {
      const exists = currentGoals.some((item) => item.id === goalToSave.id);
      return exists ? currentGoals.map((item) => (item.id === goalToSave.id ? goalToSave : item)) : [...currentGoals, goalToSave];
    });
    setIsGoalModalOpen(false);
    setEditingGoal(null);
    persistGoal(goalToSave, subject).catch(() => {
      setStorageMessage("Meta atualizada na tela, mas não foi possível salvar no Supabase.");
    });
  }

  function openSubjectModal(subject?: Subject) {
    setEditingSubject(subject || null);
    setIsSubjectModalOpen(true);
  }

  function saveSubject(subject: Subject) {
    const subjectToSave = {
      ...subject,
      id: editingSubject?.id || subject.id || crypto.randomUUID(),
      topicIds: subject.topics.map((_, index) => editingSubject?.topicIds?.[index] || crypto.randomUUID())
    };

    setSubjects((currentSubjects) => {
      const exists = currentSubjects.some((item) => item.name === editingSubject?.name);
      return exists ? currentSubjects.map((item) => (item.name === editingSubject?.name ? subjectToSave : item)) : [...currentSubjects, subjectToSave];
    });
    if (editingSubject?.name && editingSubject.name !== subjectToSave.name) {
      setGoals((currentGoals) =>
        currentGoals.map((goal) => (goal.subject === editingSubject.name ? { ...goal, subject: subjectToSave.name, subjectId: subjectToSave.id } : goal))
      );
      setSchedule((current) => current.map((item) => (item.subject === editingSubject.name ? { ...item, subject: subjectToSave.name } : item)));
      setSessions((current) => current.map((item) => (item.subject === editingSubject.name ? { ...item, subject: subjectToSave.name } : item)));
    }
    setIsSubjectModalOpen(false);
    setEditingSubject(null);
    persistSubject(subjectToSave, editingSubject?.name).catch(() => {
      setStorageMessage("Disciplina atualizada na tela, mas não foi possível salvar no Supabase.");
    });
  }

  async function persistGoal(goal: Goal, subject?: Subject) {
    const supabase = createBrowserSupabaseClient();
    const subjectId = goal.subjectId || subject?.id;
    if (!supabase || !currentPlanId || !subjectId) return;

    const { error } = await supabase.from("topics").upsert({
      id: goal.id,
      subject_id: subjectId,
      title: goal.title,
      status: goal.done ? "done" : "pending",
      due_date: goal.due,
      position: Math.max(0, goals.findIndex((item) => item.id === goal.id))
    });
    if (error) throw error;
  }

  async function deleteGoalFromStorage(goal: Goal) {
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !currentPlanId) return;
    const { error } = await supabase.from("topics").delete().eq("id", goal.id);
    if (error) throw error;
  }

  async function persistSubject(subject: Subject, previousName?: string) {
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !currentPlanId || !subject.id) return;

    const { error: subjectError } = await supabase.from("subjects").upsert({
      id: subject.id,
      plan_id: currentPlanId,
      name: subject.name,
      questions: subject.questions || 0,
      weight: subject.weight || 0,
      color: subject.color,
      progress: subject.progress || 0
    });
    if (subjectError) throw subjectError;

    if (subject.topics.length) {
      const { error: topicsError } = await supabase.from("topics").upsert(
        subject.topics.map((topic, index) => ({
          id: subject.topicIds?.[index] || crypto.randomUUID(),
          subject_id: subject.id,
          title: topic,
          status: goals.find((goal) => goal.id === subject.topicIds?.[index])?.done ? "done" : "pending",
          position: index
        }))
      );
      if (topicsError) throw topicsError;
    }

    const { data: storedTopics, error: storedTopicsError } = await supabase.from("topics").select("id").eq("subject_id", subject.id);
    if (storedTopicsError) throw storedTopicsError;
    const keptTopicIds = new Set(subject.topicIds || []);
    const staleTopicIds = (storedTopics || []).map((topic) => String(topic.id)).filter((id) => !keptTopicIds.has(id));
    if (staleTopicIds.length) {
      const { error: staleTopicsError } = await supabase.from("topics").delete().in("id", staleTopicIds);
      if (staleTopicsError) throw staleTopicsError;
    }

    if (previousName && previousName !== subject.name) {
      const { error: scheduleError } = await supabase
        .from("schedule_items")
        .update({ subject_name: subject.name })
        .eq("plan_id", currentPlanId)
        .eq("subject_name", previousName);
      if (scheduleError) throw scheduleError;

      const { error: sessionsError } = await supabase
        .from("study_sessions")
        .update({ subject_name: subject.name })
        .eq("plan_id", currentPlanId)
        .eq("subject_name", previousName);
      if (sessionsError) throw sessionsError;
    }
  }

  async function deleteSubjectFromStorage(subject: Subject) {
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !currentPlanId || !subject.id) return;
    const { error: scheduleError } = await supabase
      .from("schedule_items")
      .delete()
      .eq("plan_id", currentPlanId)
      .eq("subject_name", subject.name);
    if (scheduleError) throw scheduleError;

    const { error } = await supabase.from("subjects").delete().eq("id", subject.id);
    if (error) throw error;
    setGoals((current) => current.filter((goal) => goal.subject !== subject.name));
    setSchedule((current) => current.filter((item) => item.subject !== subject.name));
  }

  async function persistSession(session: Session) {
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !currentPlanId || !userId) throw new Error("Crie e salve um plano antes de registrar uma sessão.");

    const { error } = await supabase.from("study_sessions").insert({
      id: session.id,
      plan_id: currentPlanId,
      user_id: userId,
      studied_at: session.date,
      subject_name: session.subject,
      minutes: session.minutes,
      questions: session.questions,
      correct: session.correct,
      notes: session.notes
    });

    if (error) throw error;
  }

  async function persistScheduleDay(originalDate: string | null, day: ScheduleItem[]) {
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !currentPlanId) throw new Error("Crie e salve um plano antes de alterar o calendário.");

    const currentDay = originalDate ? schedule.filter((item) => item.date === originalDate) : [];
    const preparedDay = day.map((item, index) => ({
      ...item,
      id: item.id || currentDay[index]?.id || crypto.randomUUID(),
      weekday: weekdayFromIso(item.date)
    }));

    const { error: saveError } = await supabase.from("schedule_items").upsert(
      preparedDay.map((item) => ({
        id: item.id,
        plan_id: currentPlanId,
        date: item.date,
        period: item.period,
        kind: item.kind,
        minutes: item.minutes,
        subject_name: item.subject,
        topic_title: item.topic
      }))
    );

    if (saveError) throw saveError;

    const keptIds = new Set(preparedDay.map((item) => item.id));
    const removedIds = currentDay.map((item) => item.id).filter((id): id is string => Boolean(id && !keptIds.has(id)));
    if (removedIds.length) {
      const { error: deleteError } = await supabase.from("schedule_items").delete().in("id", removedIds);
      if (deleteError) throw deleteError;
    }

    setSchedule((current) =>
      [...current.filter((item) => item.date !== originalDate), ...preparedDay].sort((a, b) =>
        `${a.date}-${periodOrder(a.period)}`.localeCompare(`${b.date}-${periodOrder(b.period)}`)
      )
    );
    setStorageMessage("Calendário salvo automaticamente.");
    window.setTimeout(() => setStorageMessage(""), 3000);
  }

  return (
    <div className="planner-shell">
      <aside className="planner-sidebar">
        <div className="planner-brand">
          <img className="planner-logo" src="/plano-tracker.png" alt="" aria-hidden="true" />
          <div>
            <strong>PlanoTracker</strong>
            <span>Estudo organizado</span>
          </div>
        </div>

        <nav className="planner-nav" aria-label="Navegação principal">
          <NavButton active={view === "dashboard"} icon={<LayoutDashboard size={18} />} label="Painel" onClick={() => setView("dashboard")} />
          <NavButton active={view === "create"} icon={<Sparkles size={18} />} label="Criar plano" onClick={() => setView("create")} />
          <NavButton active={view === "calendar"} icon={<CalendarDays size={18} />} label="Calendário" onClick={() => setView("calendar")} />
          <NavButton active={view === "goals"} icon={<ListChecks size={18} />} label="Metas" onClick={() => setView("goals")} />
          <NavButton active={view === "subjects"} icon={<ClipboardList size={18} />} label="Disciplinas" onClick={() => setView("subjects")} />
          <NavButton active={view === "sessions"} icon={<Plus size={18} />} label="Sessões" onClick={() => setView("sessions")} />
        </nav>

        <div className="sidebar-block">
          <div className="block-title">Progresso geral</div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="small-muted">{progressPercent}% concluído</div>
        </div>
      </aside>

      <main className="planner-main">
        <header className="planner-topbar">
          <div>
            <p className="eyebrow">Planejamento inteligente</p>
            <h1>{viewTitle}</h1>
            {currentPlanId ? <p className="mini-meta">Plano salvo</p> : null}
          </div>
          <div className="top-actions">
            {planOptions.length ? (
              <select
                className="plan-selector"
                aria-label="Plano ativo"
                value={currentPlanId}
                onChange={(event) => selectStoredPlan(event.target.value)}
                disabled={isLoadingPlan}
              >
                {planOptions.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.title} - {formatDate(plan.exam_date)}
                  </option>
                ))}
              </select>
            ) : null}
            <button className="primary-button" type="button" onClick={() => setView("sessions")}>
              Nova sessão
            </button>
            <button className="ghost-button" type="button" onClick={signOut} title="Sair da conta">
              <LogOut size={17} /> Sair
            </button>
          </div>
        </header>

        {view === "dashboard" ? (
          <Dashboard
            stats={stats}
            goals={goals}
            subjects={subjects}
            schedule={schedule}
            sessions={sessions}
            setView={setView}
            lastPlanSource={lastPlanSource}
            storageMessage={storageMessage}
            isLoadingPlan={isLoadingPlan}
          />
        ) : null}
        {view === "create" ? <CreatePlan onPlanGenerated={importGeneratedPlan} /> : null}
        {view === "calendar" ? <Calendar schedule={schedule} subjects={subjects} onSaveDay={persistScheduleDay} /> : null}
        {view === "goals" ? <Goals goals={goals} setGoals={setGoals} openGoalModal={openGoalModal} onPersistGoal={persistGoal} onDeleteGoal={deleteGoalFromStorage} onStorageError={setStorageMessage} /> : null}
        {view === "subjects" ? <Subjects subjects={subjects} setSubjects={setSubjects} openSubjectModal={openSubjectModal} onDeleteSubject={deleteSubjectFromStorage} onStorageError={setStorageMessage} /> : null}
        {view === "sessions" ? <Sessions subjects={subjects} sessions={sessions} setSessions={setSessions} onPersistSession={persistSession} /> : null}
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
  setView,
  lastPlanSource,
  storageMessage,
  isLoadingPlan
}: {
  stats: { minutes: number; questions: number; accuracy: number; doneGoals: number };
  goals: Goal[];
  subjects: Subject[];
  schedule: ScheduleItem[];
  sessions: Session[];
  setView: (view: View) => void;
  lastPlanSource?: GeneratedPlan["source"];
  storageMessage: string;
  isLoadingPlan: boolean;
}) {
  const todaySchedule = schedule.filter((slot) => slot.date === todayIso());

  return (
    <>
      {isLoadingPlan ? <div className="notice plan-source-notice">Carregando seu último plano salvo...</div> : null}
      {storageMessage ? <div className="notice plan-source-notice">{storageMessage}</div> : null}
      {lastPlanSource ? (
        <div className={`notice plan-source-notice ${lastPlanSource === "openai" ? "success-notice" : ""}`}>
          {lastPlanSource === "openai"
            ? "Último plano criado com IA real."
            : "Último plano criado em modo demonstração. Confira OPENAI_API_KEY e ENABLE_MOCK_AI na Vercel."}
        </div>
      ) : null}

      <div className="stats-grid">
        <Stat label="Horas estudadas" value={formatMinutes(stats.minutes)} />
        <Stat label="Questões feitas" value={String(stats.questions)} />
        <Stat label="Taxa de acerto" value={`${stats.accuracy}%`} />
        <Stat label="Metas concluídas" value={`${stats.doneGoals}/${goals.length}`} />
      </div>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-header">
            <h2>Foco de hoje</h2>
            <button className="text-button" type="button" onClick={() => setView("calendar")}>
              Ver calendário
            </button>
          </div>
          <div className="stack-list">
            {todaySchedule.length ? (
              todaySchedule.map((slot, index) => <StudySlot key={`${slot.date}-${slot.period}-${index}`} slot={slot} />)
            ) : schedule.length ? (
              <EmptyState text="Nenhum estudo marcado para hoje. Veja o calendário para conferir os próximos dias." />
            ) : (
              <EmptyState text="Crie seu primeiro plano para preencher o foco de hoje." />
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Desempenho por matéria</h2>
            <button className="text-button" type="button" onClick={() => setView("subjects")}>
              Editar
            </button>
          </div>
          <div className="subject-list">
            {subjects.length ? subjects.map((subject) => <SubjectRow key={subject.name} subject={subject} sessions={sessions} />) : <EmptyState text="As disciplinas aparecem aqui depois que o plano for gerado." />}
          </div>
        </section>
      </div>
    </>
  );
}

function CreatePlan({ onPlanGenerated }: { onPlanGenerated: (plan: GeneratedPlan) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const days = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"].filter(
      (day) => form.get(day) === "on"
    );

    form.set("studyDays", days.join(","));

    if (!days.length) {
      setLoading(false);
      setError("Selecione pelo menos um dia de estudo.");
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const session = supabase ? (await supabase.auth.getSession()).data.session : null;
    if (!session?.access_token) {
      setLoading(false);
      setError("Sua sessão expirou. Entre novamente para criar o plano.");
      return;
    }

    const response = await fetch("/api/ai/generate-plan", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: form
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error || "Não foi possível criar o plano.");
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
            <input name="examDate" type="date" min={todayIso()} required />
          </label>
        </div>
        <div className="form-row">
          <label>
            Horas por dia
            <input name="hoursPerDay" type="number" min="1" max="12" defaultValue="6" required />
          </label>
          <label>
            Edital em arquivo
            <input name="editalFile" type="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" />
          </label>
        </div>

        <fieldset className="day-picker">
          <legend>Dias de estudo</legend>
          {["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"].map((day) => (
            <label key={day}>
              <input name={day} type="checkbox" defaultChecked />
              {day.replace("-feira", "")}
            </label>
          ))}
        </fieldset>

        <label>
          Rotina desejada
          <input name="preferredBlocks" defaultValue="Ex: manhã e tarde para teoria; noite para questões e revisão." />
        </label>
        <label>
          Edital
          <textarea name="editalText" placeholder="Cole aqui o conteúdo programático do edital ou anexe o PDF acima..." />
        </label>

        <div className="notice">O PlanoTracker usa IA para ler o edital e monta o calendário completo até a data da prova.</div>
        {error ? <div className="notice">{error}</div> : null}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Criando..." : "Gerar plano com IA"}
        </button>
      </form>
    </section>
  );
}

function Calendar({
  schedule,
  subjects,
  onSaveDay
}: {
  schedule: ScheduleItem[];
  subjects: Subject[];
  onSaveDay: (originalDate: string | null, day: ScheduleItem[]) => Promise<void>;
}) {
  const [editingDay, setEditingDay] = useState<ScheduleItem[] | null>(null);
  const [isCreatingDay, setIsCreatingDay] = useState(false);
  const days = Object.values(
    schedule.reduce<Record<string, ScheduleItem[]>>((acc, item) => {
      acc[item.date] ||= [];
      acc[item.date].push(item);
      return acc;
    }, {})
  );

  return (
    <>
      <div className="calendar-toolbar">
        <div>
          <strong>Agenda de estudos</strong>
          <span>Crie novos dias ou ajuste os blocos gerados pela IA.</span>
        </div>
        <button className="primary-button" type="button" onClick={() => setIsCreatingDay(true)}>
          <Plus size={18} /> Novo dia
        </button>
      </div>

      {days.length ? (
        <div className="calendar-grid">
          {days.map((day, index) => (
            <DayCard key={day[0].date} day={day} color={calendarColors[index % calendarColors.length]} onEdit={() => setEditingDay(day)} />
          ))}
        </div>
      ) : (
        <EmptyPanel title="Calendário vazio" text="Crie um dia manualmente ou gere um plano com IA para montar sua agenda de estudos." />
      )}

      {editingDay || isCreatingDay ? (
        <ScheduleDayModal
          day={editingDay}
          subjects={subjects}
          unavailableDates={schedule.map((item) => item.date)}
          onClose={() => {
            setEditingDay(null);
            setIsCreatingDay(false);
          }}
          onSave={onSaveDay}
        />
      ) : null}
    </>
  );
}

function Goals({
  goals,
  setGoals,
  openGoalModal,
  onPersistGoal,
  onDeleteGoal,
  onStorageError
}: {
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  openGoalModal: (goal?: Goal) => void;
  onPersistGoal: (goal: Goal) => Promise<void>;
  onDeleteGoal: (goal: Goal) => Promise<void>;
  onStorageError: (message: string) => void;
}) {
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  function deleteGoal(goal: Goal) {
    setGoals(goals.filter((item) => item.id !== goal.id));
    setGoalToDelete(null);
    onDeleteGoal(goal).catch(() => onStorageError("A meta saiu da tela, mas não foi possível excluí-la do Supabase."));
  }

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Quadro de metas</h2>
            <p className="muted">Acompanhe entregas, revisões e simulados.</p>
          </div>
          <button className="primary-button" type="button" onClick={() => openGoalModal()}>
            Nova meta
          </button>
        </div>
        <div className="stack-list">
          {goals.length ? goals.map((goal) => (
            <article className="goal-item" key={goal.id}>
              <div>
                <strong>{goal.title}</strong>
                <div className="mini-meta">{goal.subject} | Prazo {formatDate(goal.due)}</div>
              </div>
              <div className="item-actions">
                <span className={`status-pill ${goal.done ? "done" : ""}`}>{goal.done ? "Concluída" : "Pendente"}</span>
                <button
                  className="icon-button"
                  type="button"
                  title="Alternar status"
                  onClick={() => {
                    const updatedGoal = { ...goal, done: !goal.done };
                    setGoals(goals.map((item) => (item.id === goal.id ? updatedGoal : item)));
                    onPersistGoal(updatedGoal).catch(() => onStorageError("O status mudou na tela, mas não foi possível salvá-lo no Supabase."));
                  }}
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
          )) : <EmptyState text="As metas serão criadas automaticamente a partir dos subtópicos do edital." />}
        </div>
      </section>

      {goalToDelete ? (
        <ConfirmModal
          title="Excluir meta"
          message={`Tem certeza que quer excluir "${goalToDelete.title}"?`}
          confirmLabel="Sim"
          cancelLabel="Não"
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
  openSubjectModal,
  onDeleteSubject,
  onStorageError
}: {
  subjects: Subject[];
  setSubjects: (subjects: Subject[]) => void;
  openSubjectModal: (subject?: Subject) => void;
  onDeleteSubject: (subject: Subject) => Promise<void>;
  onStorageError: (message: string) => void;
}) {
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  function deleteSubject(subject: Subject) {
    setSubjects(subjects.filter((item) => item.name !== subject.name));
    setSubjectToDelete(null);
    onDeleteSubject(subject).catch(() => onStorageError("A disciplina saiu da tela, mas não foi possível excluí-la do Supabase."));
  }

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Disciplinas</h2>
            <p className="muted">Defina peso, cor e progresso manual de cada matéria.</p>
          </div>
          <button className="primary-button" type="button" onClick={() => openSubjectModal()}>
            Nova disciplina
          </button>
        </div>
        <div className="subject-cards">
          {subjects.length ? subjects.map((subject) => (
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
                {subject.questions || 0} questões | peso {formatWeight(subject)} | {subject.weight || 0} pontos
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${subject.progress}%`, background: subject.color }} />
              </div>
              <details className="topic-details">
                <summary>{subject.topics.length} subtópicos</summary>
                <ol>{subject.topics.map((topic) => <li key={topic}>{topic}</li>)}</ol>
              </details>
            </article>
          )) : <EmptyState text="Nenhuma disciplina ainda. Gere um plano ou cadastre uma disciplina manualmente." />}
        </div>
      </section>

      {subjectToDelete ? (
        <ConfirmModal
          title="Excluir disciplina"
          message={`Tem certeza que quer excluir "${subjectToDelete.name}"?`}
          confirmLabel="Sim"
          cancelLabel="Não"
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

function Sessions({
  subjects,
  sessions,
  setSessions,
  onPersistSession
}: {
  subjects: Subject[];
  sessions: Session[];
  setSessions: (sessions: Session[]) => void;
  onPersistSession: (session: Session) => Promise<void>;
}) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const session = {
      id: crypto.randomUUID(),
      date: String(form.get("date")),
      subject: String(form.get("subject")),
      minutes: Number(form.get("minutes")),
      questions: Number(form.get("questions")),
      correct: Number(form.get("correct")),
      notes: String(form.get("notes") || "")
    };

    setIsSaving(true);
    setSaveError("");
    try {
      await onPersistSession(session);
      setSessions([session, ...sessions]);
      formElement.reset();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Não foi possível salvar a sessão.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div className="content-grid">
        <section className="panel">
        <div className="panel-header">
          <h2>Registrar sessão</h2>
        </div>
        <form className="create-form" onSubmit={submit}>
          <div className="form-row">
            <label>
              Data
              <input name="date" type="date" defaultValue={todayIso()} required />
            </label>
            <label>
              Disciplina
              <select name="subject">{subjects.length ? subjects.map((subject) => <option key={subject.name}>{subject.name}</option>) : <option>Geral</option>}</select>
            </label>
          </div>
          <div className="form-row">
            <label>
              Minutos
              <input name="minutes" type="number" min="1" defaultValue="60" required />
            </label>
            <label>
              Questões
              <input name="questions" type="number" min="0" defaultValue="0" required />
            </label>
          </div>
          <label>
            Acertos
            <input name="correct" type="number" min="0" defaultValue="0" required />
          </label>
          <label>
            Observações
            <textarea name="notes" />
          </label>
          {saveError ? <div className="notice">{saveError}</div> : null}
          <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar sessão"}</button>
        </form>
        </section>
        <section className="panel">
          <h2>Histórico</h2>
          <div className="stack-list">
            {sessions.length ? sessions.map((session) => (
              <button className="session-item session-history-button" type="button" key={session.id} onClick={() => setSelectedSession(session)}>
                <div>
                  <strong>{session.subject}</strong>
                  <span>{formatDate(session.date)} | {formatMinutes(session.minutes)} | {session.questions} questões</span>
                </div>
                <span className="session-view-label">Ver detalhes</span>
              </button>
            )) : <EmptyState text="Nenhuma sessão registrada ainda." />}
          </div>
        </section>
      </div>

      {selectedSession ? <SessionDetailsModal session={selectedSession} onClose={() => setSelectedSession(null)} /> : null}
    </>
  );
}

function ScheduleDayModal({
  day,
  subjects,
  unavailableDates,
  onClose,
  onSave
}: {
  day: ScheduleItem[] | null;
  subjects: Subject[];
  unavailableDates: string[];
  onClose: () => void;
  onSave: (originalDate: string | null, day: ScheduleItem[]) => Promise<void>;
}) {
  const originalDate = day?.[0]?.date || null;
  const [date, setDate] = useState(originalDate || todayIso());
  const [slots, setSlots] = useState<ScheduleItem[]>(
    day?.map((item) => ({ ...item })) || [createEmptyScheduleItem(todayIso(), subjects[0]?.name || "Geral")]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  function updateSlot(index: number, changes: Partial<ScheduleItem>) {
    setSlots((current) => current.map((slot, slotIndex) => (slotIndex === index ? { ...slot, ...changes } : slot)));
  }

  function addSlot() {
    setSlots((current) => [...current, createEmptyScheduleItem(date, subjects[0]?.name || "Geral")]);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const dateAlreadyUsed = unavailableDates.some((usedDate) => usedDate === date && usedDate !== originalDate);
    if (dateAlreadyUsed) {
      setError("Já existe um dia de estudo nessa data. Edite o cartão correspondente.");
      return;
    }
    if (!slots.length) {
      setError("Adicione pelo menos um bloco de estudo.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      await onSave(
        originalDate,
        slots.map((slot) => ({ ...slot, date, weekday: weekdayFromIso(date) }))
      );
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar o dia de estudo.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <form className="modal-card schedule-day-modal" onSubmit={submit}>
        <div className="modal-title-row">
          <div>
            <h2>{day ? "Editar dia de estudo" : "Novo dia de estudo"}</h2>
            <p className="muted">Organize os blocos na ordem em que serão realizados.</p>
          </div>
          <button className="ghost-button compact-button" type="button" onClick={addSlot}>
            <Plus size={17} /> Adicionar bloco
          </button>
        </div>

        <label>
          Data
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required autoFocus />
        </label>

        <div className="schedule-slot-list">
          {slots.map((slot, index) => (
            <fieldset className="schedule-slot-editor" key={slot.id || `new-slot-${index}`}>
              <legend>Bloco {index + 1}</legend>
              <button
                className="icon-button remove-slot-button"
                type="button"
                title="Remover bloco"
                aria-label={`Remover bloco ${index + 1}`}
                onClick={() => setSlots((current) => current.filter((_, slotIndex) => slotIndex !== index))}
              >
                <Trash2 size={17} />
              </button>
              <div className="form-row">
                <label>
                  Período
                  <select value={slot.period} onChange={(event) => updateSlot(index, { period: event.target.value as ScheduleItem["period"] })}>
                    <option value="Manha">Manhã</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noite">Noite</option>
                  </select>
                </label>
                <label>
                  Duração em minutos
                  <input type="number" min="1" value={slot.minutes} onChange={(event) => updateSlot(index, { minutes: Number(event.target.value) })} required />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Disciplina
                  <select value={slot.subject} onChange={(event) => updateSlot(index, { subject: event.target.value })}>
                    {subjects.length ? subjects.map((subject) => <option key={subject.name} value={subject.name}>{subject.name}</option>) : <option value="Geral">Geral</option>}
                  </select>
                </label>
                <label>
                  Tipo de estudo
                  <select value={slot.kind} onChange={(event) => updateSlot(index, { kind: event.target.value as ScheduleItem["kind"] })}>
                    <option value="teoria">Teoria</option>
                    <option value="questoes">Questões</option>
                    <option value="revisao">Revisão</option>
                  </select>
                </label>
              </div>
              <label>
                Conteúdo
                <input value={slot.topic} onChange={(event) => updateSlot(index, { topic: event.target.value })} placeholder="Assunto ou subtópico a estudar" required />
              </label>
            </fieldset>
          ))}
        </div>

        {error ? <div className="notice">{error}</div> : null}
        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={onClose}>Cancelar</button>
          <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar dia"}</button>
        </div>
      </form>
    </div>
  );
}

function SessionDetailsModal({ session, onClose }: { session: Session; onClose: () => void }) {
  const accuracy = session.questions ? Math.round((session.correct / session.questions) * 100) : 0;

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-card session-details-modal" role="dialog" aria-modal="true" aria-labelledby="session-details-title">
        <div>
          <h2 id="session-details-title">Detalhes da sessão</h2>
          <p className="muted">{session.subject} | {formatDate(session.date)}</p>
        </div>
        <dl className="session-details-grid">
          <div><dt>Tempo estudado</dt><dd>{formatMinutes(session.minutes)}</dd></div>
          <div><dt>Questões</dt><dd>{session.questions}</dd></div>
          <div><dt>Acertos</dt><dd>{session.correct}</dd></div>
          <div><dt>Taxa de acerto</dt><dd>{accuracy}%</dd></div>
        </dl>
        <div className="session-notes">
          <strong>Observações</strong>
          <p>{session.notes.trim() || "Nenhuma observação registrada nesta sessão."}</p>
        </div>
        <div className="modal-actions">
          <button className="primary-button" type="button" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

function createEmptyScheduleItem(date: string, subject: string): ScheduleItem {
  return {
    date,
    weekday: weekdayFromIso(date),
    period: "Manha",
    subject,
    topic: "",
    kind: "teoria",
    minutes: 60
  };
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
          Título
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
          Meta concluída
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
    const questions = Number(form.get("questions") || 0);
    const questionWeight = Number(form.get("questionWeight") || 0);
    const topics = topicsText
      .split("\n")
      .map((topic) => topic.trim())
      .filter(Boolean);

    onSave({
      name: String(form.get("name") || ""),
      questions,
      weight: questions * questionWeight,
      progress: Number(form.get("progress") || 0),
      color: String(form.get("color") || fallbackColor),
      topics: topics.length ? topics : ["Revisão geral"]
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
            Número de questões
            <input name="questions" type="number" min="0" defaultValue={subject?.questions || 5} required />
          </label>
          <label>
            Peso por questão
            <input name="questionWeight" type="number" min="0" step="0.1" defaultValue={formatWeight(subject || { questions: 5, weight: 10, name: "", topics: [], color: fallbackColor, progress: 0 })} required />
          </label>
        </div>
        <div className="notice compact-notice">O total de pontos é calculado automaticamente: número de questões x peso por questão.</div>
        <label>
          Progresso (%)
          <input name="progress" type="number" min="0" max="100" defaultValue={subject?.progress || 0} required />
        </label>
        <label>
          Cor
          <input name="color" type="color" defaultValue={subject?.color || fallbackColor} required />
        </label>
        <label>
          Subtópicos
          <textarea name="topics" defaultValue={(subject?.topics || ["Revisão geral"]).join("\n")} />
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
        <strong>{displayPeriod(slot.period)} - {slot.subject}</strong>
        <span>{formatHours(slot.minutes)} | {slot.topic}</span>
      </div>
      <span className="status-pill">{displayKind(slot.kind)}</span>
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
        <div className="mini-meta">{formatMinutes(minutes)} | {questions} questões | {accuracy}% acerto</div>
      </div>
      <strong>{subject.progress}%</strong>
    </div>
  );
}

function DayCard({ day, color, onEdit }: { day: ScheduleItem[]; color: string; onEdit: () => void }) {
  return (
    <article className="calendar-card day-plan">
      <div className="calendar-head" style={{ background: color }}>
        <strong>{formatDate(day[0].date)}</strong>
        <div className="calendar-head-actions">
          <span>{displayWeekday(day[0].weekday)}</span>
          <button className="calendar-edit-button" type="button" title="Editar dia" aria-label={`Editar dia ${formatDate(day[0].date)}`} onClick={onEdit}>
            <Pencil size={16} />
          </button>
        </div>
      </div>
      <div className="calendar-body">
        {day.map((slot) => (
          <div className="study-slot" key={`${slot.date}-${slot.period}`}>
            <div className="slot-time">{displayPeriod(slot.period)}<span>{formatHours(slot.minutes)}</span></div>
            <div><strong>{slot.subject}</strong><p>{slot.topic}</p><span className="mini-meta">{displayKind(slot.kind)}</span></div>
          </div>
        ))}
      </div>
    </article>
  );
}

function EmptyPanel({ title, text }: { title: string; text: string }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <EmptyState text={text} />
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}min`;
}

function formatHours(totalMinutes: number) {
  const value = totalMinutes / 60;
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${formatted}h`;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!day) return value;
  return `${day}/${month}/${year}`;
}

function weekdayFromIso(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const names = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  return names[date.getDay()] || "";
}

function todayIso() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateSubjectProgress(topics: Array<{ status: string }>) {
  if (!topics.length) return 0;
  const done = topics.filter((topic) => topic.status === "done").length;
  return Math.round((done / topics.length) * 100);
}

function periodOrder(period: ScheduleItem["period"]) {
  return { Manha: 1, Tarde: 2, Noite: 3 }[period] || 9;
}

function displayPeriod(period: ScheduleItem["period"]) {
  return { Manha: "Manhã", Tarde: "Tarde", Noite: "Noite" }[period] || period;
}

function displayKind(kind: ScheduleItem["kind"]) {
  return { teoria: "Teoria", questoes: "Questões", revisao: "Revisão" }[kind] || kind;
}

function displayWeekday(weekday: string) {
  return weekday.replace("Terca-feira", "Terça-feira").replace("Sabado", "Sábado");
}

function formatWeight(subject: Subject) {
  if (!subject.questions || !subject.weight) return "0";
  const value = subject.weight / subject.questions;
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

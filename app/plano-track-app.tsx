"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, Brain, CalendarDays, ChartSpline, Check, CirclePlay, ClipboardList, Download, LayoutDashboard, LibraryBig, ListChecks, LogOut, NotebookPen, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import type { ErrorEntry, GeneratedPlan, ReviewState, ScheduleItem, SimulationRecord, StudySessionRecord, StudyWeekday, SubjectInput } from "@/lib/types";
import { AdaptiveOverview, ErrorsView, MaterialsView, RecoveryModal, ReviewsView, SessionExecutionModal, SimulationsView } from "./adaptive-features";

type View = "dashboard" | "create" | "calendar" | "goals" | "subjects" | "sessions" | "reviews" | "errors" | "simulations" | "materials";

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

type Session = StudySessionRecord;

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
    topic_id: string | null;
    date: string;
    period: ScheduleItem["period"];
    kind: ScheduleItem["kind"];
    minutes: number;
    subject_name: string;
    topic_title: string;
  }>;
  study_sessions: Array<{
    id: string;
    schedule_item_id: string | null;
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
  "id,title,exam_date,summary,subjects(id,name,questions,weight,color,progress,topics(id,title,status,due_date,position)),schedule_items(id,topic_id,date,period,kind,minutes,subject_name,topic_title),study_sessions(id,schedule_item_id,studied_at,subject_name,minutes,questions,correct,notes)";

const colors = ["#087c68", "#1f5eff", "#f65d5b", "#0b1f3a", "#b4ca18", "#0e8aa5", "#4f46e5", "#187b4d", "#d97706", "#64748b"];
const calendarColors = ["#087c68", "#1f5eff", "#f65d5b", "#0b1f3a", "#82960d", "#0e8aa5", "#4f46e5"];
const studyWeekdays: StudyWeekday[] = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];
const initialSubjects: Subject[] = [];
const initialSchedule: ScheduleItem[] = [];
const initialGoals: Goal[] = [];

export function PlanoTrackerApp({ userId }: { userId: string }) {
  const [view, setView] = useState<View>("dashboard");
  const [subjects, setSubjects] = useState(initialSubjects);
  const [goals, setGoals] = useState(initialGoals);
  const [schedule, setSchedule] = useState(initialSchedule);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [reviewStates, setReviewStates] = useState<ReviewState[]>([]);
  const [errorEntries, setErrorEntries] = useState<ErrorEntry[]>([]);
  const [simulations, setSimulations] = useState<SimulationRecord[]>([]);
  const [executionItem, setExecutionItem] = useState<ScheduleItem | null>(null);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [currentExamDate, setCurrentExamDate] = useState("");
  const [adaptiveMessage, setAdaptiveMessage] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
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
      if (userId === "__preview__") {
        const previewSubjects: Subject[] = [
          { id: "subject-1", name: "Língua Portuguesa", questions: 10, weight: 15, color: colors[0], progress: 28, topics: ["Interpretação de texto", "Sintaxe e pontuação"], topicIds: ["topic-1", "topic-2"] },
          { id: "subject-2", name: "Direito Constitucional", questions: 12, weight: 18, color: colors[1], progress: 16, topics: ["Direitos fundamentais", "Organização do Estado"], topicIds: ["topic-3", "topic-4"] },
          { id: "subject-3", name: "Direito Administrativo", questions: 8, weight: 12, color: colors[2], progress: 8, topics: ["Atos administrativos", "Agentes públicos"], topicIds: ["topic-5", "topic-6"] }
        ];
        const previewSchedule: ScheduleItem[] = [
          { id: "slot-lost", topicId: "topic-5", date: offsetIso(-2), weekday: weekdayFromIso(offsetIso(-2)), period: "Tarde", subject: "Direito Administrativo", topic: "Atos administrativos", kind: "teoria", minutes: 60, status: "missed", completionPercent: 0 },
          { id: "slot-1", topicId: "topic-1", date: todayIso(), weekday: weekdayFromIso(todayIso()), period: "Manha", subject: "Língua Portuguesa", topic: "Interpretação de texto", kind: "teoria", minutes: 60, status: "completed", completionPercent: 100 },
          { id: "slot-2", topicId: "topic-3", date: todayIso(), weekday: weekdayFromIso(todayIso()), period: "Tarde", subject: "Direito Constitucional", topic: "Direitos fundamentais", kind: "teoria", minutes: 90, status: "planned", completionPercent: 0 },
          { id: "slot-3", topicId: "topic-3", date: todayIso(), weekday: weekdayFromIso(todayIso()), period: "Noite", subject: "Direito Constitucional", topic: "Questões sobre direitos fundamentais", kind: "questoes", minutes: 45, status: "planned", completionPercent: 0 },
          { id: "slot-4", topicId: "topic-2", date: offsetIso(1), weekday: weekdayFromIso(offsetIso(1)), period: "Manha", subject: "Língua Portuguesa", topic: "Sintaxe e pontuação", kind: "teoria", minutes: 60, status: "planned", completionPercent: 0 },
          { id: "slot-5", topicId: "topic-4", date: offsetIso(2), weekday: weekdayFromIso(offsetIso(2)), period: "Tarde", subject: "Direito Constitucional", topic: "Organização do Estado", kind: "revisao", minutes: 45, status: "planned", completionPercent: 0 },
          { id: "slot-6", topicId: "topic-6", date: offsetIso(3), weekday: weekdayFromIso(offsetIso(3)), period: "Noite", subject: "Direito Administrativo", topic: "Agentes públicos", kind: "questoes", minutes: 60, status: "planned", completionPercent: 0 }
        ];
        setSubjects(previewSubjects);
        setSchedule(previewSchedule);
        setSessions([{ id: "session-preview", date: todayIso(), subject: "Língua Portuguesa", topicId: "topic-1", topic: "Interpretação de texto", kind: "teoria", minutes: 52, questions: 10, correct: 8, difficulty: 2, confidence: 4, completionPercent: 100, recallRating: "good", notes: "Revisar inferência textual." }]);
        setReviewStates([{ topicId: "topic-5", dueAt: offsetIso(-1), stability: 2, difficulty: 5, scheduledDays: 2, reps: 1, lapses: 0, state: 2 }]);
        setErrorEntries([{ id: "error-preview", subject: "Língua Portuguesa", topic: "Interpretação de texto", title: "Errei uma inferência implícita", details: "Voltar ao trecho antes de escolher a alternativa.", errorType: "interpretation", source: "Questão de treino", resolved: false, createdAt: new Date().toISOString() }]);
        setSimulations([{ id: "simulation-preview", title: "Simulado diagnóstico", date: offsetIso(-7), totalQuestions: 60, correct: 41, durationMinutes: 180, notes: "" }]);
        setCurrentPlanId("00000000-0000-4000-8000-000000000001");
        setCurrentExamDate(offsetIso(60));
        setPlanOptions([{ id: "00000000-0000-4000-8000-000000000001", title: "Concurso de demonstração", exam_date: offsetIso(60), created_at: new Date().toISOString() }]);
        setIsLoadingPlan(false);
        return;
      }
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
        await loadAdaptiveData(latestId);
      }

      setIsLoadingPlan(false);
    }

    loadLatestPlan();

    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    setNotificationsEnabled(Notification.permission === "granted");
    if (Notification.permission !== "granted" || !schedule.length) return;
    const pending = schedule.find((item) => item.date === todayIso() && item.status !== "completed");
    const notificationKey = `planotracker-notified-${todayIso()}-${currentPlanId}`;
    if (!pending || window.localStorage.getItem(notificationKey)) return;
    navigator.serviceWorker?.ready.then((registration) => registration.showNotification("Seu próximo estudo está pronto", { body: `${pending.subject}: ${pending.topic}`, icon: "/plano-tracker.png", tag: notificationKey }));
    window.localStorage.setItem(notificationKey, "1");
  }, [schedule, currentPlanId]);

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
    await loadAdaptiveData(planId);
    setStorageMessage("");
    setIsLoadingPlan(false);
  }

  async function signOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase?.auth.signOut();
    window.location.assign("/login");
  }

  async function enableNotifications() {
    if (typeof Notification === "undefined") {
      setStorageMessage("Este navegador não oferece notificações.");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");
    const supabase = createBrowserSupabaseClient();
    if (supabase && userId !== "__preview__") await supabase.from("notification_preferences").upsert({ user_id: userId, browser_enabled: permission === "granted", updated_at: new Date().toISOString() });
    setStorageMessage(permission === "granted" ? "Lembretes do navegador ativados." : "Permissão de notificação não concedida.");
  }

  async function toggleEmailNotifications() {
    const enabled = !emailNotifications;
    const supabase = createBrowserSupabaseClient();
    if (!supabase || userId === "__preview__") {
      setEmailNotifications(enabled);
      return;
    }
    const { error } = await supabase.from("notification_preferences").upsert({ user_id: userId, email_enabled: enabled, updated_at: new Date().toISOString() });
    if (error) {
      setStorageMessage("Não foi possível alterar os lembretes por e-mail.");
      return;
    }
    setEmailNotifications(enabled);
    setStorageMessage(enabled ? "Resumo diário por e-mail ativado." : "Resumo diário por e-mail desativado.");
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
    sessions: "Sessões",
    reviews: "Revisões",
    errors: "Caderno de erros",
    simulations: "Simulados",
    materials: "Materiais"
  }[view];
  const totalGoals = goals.length || 1;
  const progressPercent = schedule.length
    ? Math.round(schedule.filter((item) => item.status === "completed").length / schedule.length * 100)
    : Math.round((stats.doneGoals / totalGoals) * 100);

  function applyGeneratedPlan(plan: GeneratedPlan) {
    const mappedSubjects = plan.subjects.map((subject, index) => ({
      ...subject,
      color: colors[index % colors.length],
      progress: 0
    }));

    setSubjects(mappedSubjects);
    setGoals([]);
    setSchedule(plan.schedule);
    setSessions([]);
    setCurrentPlanId("");
    setCurrentExamDate(plan.examDate);
    setReviewStates([]);
    setErrorEntries([]);
    setSimulations([]);
    setLastPlanSource(plan.source);
    setView("dashboard");

  }

  function importGeneratedPlan(plan: GeneratedPlan) {
    applyGeneratedPlan(plan);
    saveGeneratedPlan(plan).catch(() => {
      setStorageMessage("Plano criado, mas não foi possível salvar no Supabase.");
    });
  }

  function importStoredPlan(plan: StoredPlan) {
    const sortedSubjects = [...(plan.subjects || [])].sort((a, b) => a.name.localeCompare(b.name));
    const mappedSubjects = sortedSubjects.map((subject, index) => {
      const syllabusTopics = [...(subject.topics || [])]
        .filter((topic) => isSyllabusTopic(topic))
        .sort((a, b) => a.position - b.position);

      return {
        id: subject.id,
        name: subject.name,
        questions: subject.questions || 0,
        weight: Number(subject.weight || 0),
        color: subject.color || colors[index % colors.length],
        progress: Number(subject.progress || calculateSubjectProgress(syllabusTopics)),
        topics: syllabusTopics.map((topic) => topic.title),
        topicIds: syllabusTopics.map((topic) => topic.id)
      };
    });
    const mappedGoals = sortedSubjects.flatMap((subject) =>
      [...(subject.topics || [])]
        .filter((topic) => !isSyllabusTopic(topic))
        .sort((a, b) => a.position - b.position)
        .map((topic) => ({
          id: topic.id,
          title: topic.title,
          subject: subject.name,
          subjectId: subject.id,
          due: topic.due_date || plan.exam_date,
          done: topic.status === "goal_done"
        }))
    );
    const mappedSchedule = [...(plan.schedule_items || [])]
      .sort((a, b) => `${a.date}-${periodOrder(a.period)}`.localeCompare(`${b.date}-${periodOrder(b.period)}`))
      .map((item) => ({
        id: item.id,
        topicId: item.topic_id || undefined,
        date: item.date,
        weekday: weekdayFromIso(item.date),
        period: item.period,
        subject: item.subject_name,
        topic: item.topic_title,
        kind: item.kind,
        minutes: item.minutes,
        status: "planned" as const,
        completionPercent: 0
      }));
    const mappedSessions = [...(plan.study_sessions || [])]
      .sort((a, b) => String(b.studied_at).localeCompare(String(a.studied_at)))
      .map((session) => ({
        id: session.id,
        scheduleItemId: session.schedule_item_id || undefined,
        date: session.studied_at,
        subject: session.subject_name || "Geral",
        minutes: session.minutes || 0,
        questions: session.questions || 0,
        correct: session.correct || 0,
        notes: session.notes || ""
      }));

    setCurrentPlanId(plan.id);
    setCurrentExamDate(plan.exam_date);
    setSubjects(mappedSubjects);
    setGoals(mappedGoals);
    setSchedule(mappedSchedule);
    setSessions(mappedSessions);
  }

  async function loadAdaptiveData(planId: string) {
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !userId) return;

    const [scheduleResult, sessionResult, reviewResult, errorResult, simulationResult] = await Promise.all([
      supabase.from("schedule_items").select("id,status,completion_percent,completed_at,rescheduled_from_id").eq("plan_id", planId),
      supabase.from("study_sessions").select("id,topic_id,topic_title,kind,difficulty,confidence,completion_percent,recall_rating,schedule_item_id").eq("plan_id", planId),
      supabase.from("topic_review_states").select("topic_id,due_at,stability,difficulty,scheduled_days,reps,lapses,state,last_review_at").eq("plan_id", planId),
      supabase.from("error_entries").select("*").eq("plan_id", planId).order("created_at", { ascending: false }),
      supabase.from("simulations").select("*,simulation_results(subject_id,subject_name,questions,correct)").eq("plan_id", planId).order("simulated_at", { ascending: false })
    ]);

    const migrationMissing = [scheduleResult, sessionResult, reviewResult, errorResult, simulationResult]
      .some((result) => result.error && ["42703", "42P01"].includes(result.error.code || ""));
    setAdaptiveMessage(migrationMissing ? "Os recursos adaptativos precisam da nova migração do Supabase." : "");

    if (!scheduleResult.error) {
      const byId = new Map((scheduleResult.data || []).map((item) => [String(item.id), item]));
      setSchedule((current) => current.map((item) => {
        const stored = item.id ? byId.get(item.id) : undefined;
        return stored ? { ...item, status: stored.status, completionPercent: stored.completion_percent, completedAt: stored.completed_at || undefined, rescheduledFromId: stored.rescheduled_from_id || undefined } : item;
      }));
    }

    if (!sessionResult.error) {
      const byId = new Map((sessionResult.data || []).map((item) => [String(item.id), item]));
      setSessions((current) => current.map((session) => {
        const stored = byId.get(session.id);
        return stored ? { ...session, scheduleItemId: stored.schedule_item_id || undefined, topicId: stored.topic_id || undefined, topic: stored.topic_title || undefined, kind: stored.kind || undefined, difficulty: stored.difficulty || undefined, confidence: stored.confidence || undefined, completionPercent: stored.completion_percent, recallRating: stored.recall_rating || undefined } : session;
      }));
    }

    if (!reviewResult.error) {
      setReviewStates((reviewResult.data || []).map((item) => ({ topicId: item.topic_id, dueAt: item.due_at, stability: Number(item.stability), difficulty: Number(item.difficulty), scheduledDays: item.scheduled_days, reps: item.reps, lapses: item.lapses, state: item.state, lastReviewAt: item.last_review_at || undefined })));
    } else setReviewStates([]);

    if (!errorResult.error) {
      setErrorEntries((errorResult.data || []).map((item) => ({ id: item.id, subjectId: item.subject_id || undefined, topicId: item.topic_id || undefined, subject: item.subject_name, topic: item.topic_title || undefined, title: item.title, details: item.details || "", errorType: item.error_type, source: item.source || undefined, resolved: item.resolved, nextReviewAt: item.next_review_at || undefined, createdAt: item.created_at })));
    } else setErrorEntries([]);

    if (!simulationResult.error) {
      setSimulations((simulationResult.data || []).map((item) => ({ id: item.id, title: item.title, date: item.simulated_at, totalQuestions: item.total_questions, correct: item.correct, durationMinutes: item.duration_minutes, notes: item.notes || "", results: (item.simulation_results || []).map((result: { subject_id: string | null; subject_name: string; questions: number; correct: number }) => ({ subjectId: result.subject_id || undefined, subject: result.subject_name, questions: result.questions, correct: result.correct })) })));
    } else setSimulations([]);

    const { data: notificationPreference } = await supabase.from("notification_preferences").select("email_enabled,browser_enabled").eq("user_id", userId).maybeSingle();
    if (notificationPreference) {
      setEmailNotifications(Boolean(notificationPreference.email_enabled));
      setNotificationsEnabled(Boolean(notificationPreference.browser_enabled) && typeof Notification !== "undefined" && Notification.permission === "granted");
    }

    if (!migrationMissing) {
      const { data: lastEvent } = await supabase.from("study_events").select("created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      const returningAfterSevenDays = lastEvent?.created_at && Date.now() - new Date(lastEvent.created_at).getTime() >= 7 * 86_400_000;
      await supabase.from("study_events").insert({ user_id: userId, plan_id: planId, event_name: returningAfterSevenDays ? "returned_after_7_days" : "app_opened", metadata: {} });
    }
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
            status: "syllabus",
            due_date: null,
            position: index
          }))
        ).select("id,position");

        if (topicsError) throw topicsError;

        const orderedTopicIds = [...(savedTopics || [])]
          .sort((a, b) => Number(a.position) - Number(b.position))
          .map((topic) => String(topic.id));
        topicIdsBySubject.set(subject.name, orderedTopicIds);
      }
    }

    if (plan.schedule.length) {
      const scheduleWithIds = plan.schedule.map((item) => {
        const sourceSubject = plan.subjects.find((subject) => subject.name === item.subject);
        const topicIndex = sourceSubject?.topics.findIndex((topic) => topicsOverlap(topic, item.topic)) ?? -1;
        return {
          ...item,
          id: crypto.randomUUID(),
          topicId: topicIndex >= 0 ? topicIdsBySubject.get(item.subject)?.[topicIndex] : undefined,
          status: "planned" as const,
          completionPercent: 0
        };
      });
      const { error: scheduleError } = await supabase.from("schedule_items").insert(
        scheduleWithIds.map((item) => ({
          id: item.id,
          plan_id: planId,
          topic_id: item.topicId || null,
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
    setCurrentExamDate(plan.examDate);
    await supabase.from("study_events").insert({ user_id: userId, plan_id: planId, event_name: "plan_created", metadata: { source: plan.source || "rules", subjects: plan.subjects.length, scheduleItems: plan.schedule.length } });
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
      status: goal.done ? "goal_done" : "goal_pending",
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
          status: "syllabus",
          due_date: null,
          position: index
        }))
      );
      if (topicsError) throw topicsError;
    }

    const { data: storedTopics, error: storedTopicsError } = await supabase.from("topics").select("id").eq("subject_id", subject.id);
    if (storedTopicsError) throw storedTopicsError;
    const keptTopicIds = new Set(subject.topicIds || []);
    const goalIds = new Set(goals.filter((goal) => goal.subjectId === subject.id).map((goal) => goal.id));
    const staleTopicIds = (storedTopics || [])
      .map((topic) => String(topic.id))
      .filter((id) => !keptTopicIds.has(id) && !goalIds.has(id));
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
        topic_id: item.topicId || null,
        date: item.date,
        period: item.period,
        kind: item.kind,
        minutes: item.minutes,
        subject_name: item.subject,
        topic_title: item.topic,
        status: item.status || "planned",
        completion_percent: item.completionPercent || 0,
        completed_at: item.completedAt || null
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

  function completeAdaptiveSession(session: Session, updatedItem: ScheduleItem, review?: ReviewState) {
    setSessions((current) => [session, ...current.filter((item) => item.id !== session.id)]);
    if (updatedItem.id) {
      setSchedule((current) => current.map((item) => item.id === updatedItem.id ? updatedItem : item));
    }
    if (review) {
      setReviewStates((current) => [review, ...current.filter((item) => item.topicId !== review.topicId)]);
    }
  }

  async function createErrorEntry(entry: Omit<ErrorEntry, "id" | "createdAt" | "resolved">) {
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !currentPlanId) throw new Error("Selecione um plano antes de registrar um erro.");
    const subject = subjects.find((item) => item.name === entry.subject);
    const topicIndex = subject?.topics.findIndex((topic) => topic === entry.topic) ?? -1;
    const { data, error } = await supabase.from("error_entries").insert({
      user_id: userId,
      plan_id: currentPlanId,
      subject_id: subject?.id || null,
      topic_id: topicIndex >= 0 ? subject?.topicIds?.[topicIndex] || null : null,
      subject_name: entry.subject,
      topic_title: entry.topic || null,
      title: entry.title,
      details: entry.details || null,
      error_type: entry.errorType,
      source: entry.source || null
    }).select("*").single();
    if (error || !data) throw error || new Error("Não foi possível registrar o erro.");
    setErrorEntries((current) => [{ ...entry, id: data.id, resolved: false, createdAt: data.created_at }, ...current]);
  }

  async function toggleErrorEntry(entry: ErrorEntry) {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const resolved = !entry.resolved;
    const { error } = await supabase.from("error_entries").update({ resolved, resolved_at: resolved ? new Date().toISOString() : null }).eq("id", entry.id);
    if (error) throw error;
    setErrorEntries((current) => current.map((item) => item.id === entry.id ? { ...item, resolved } : item));
  }

  async function createSimulation(simulation: Omit<SimulationRecord, "id">) {
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !currentPlanId) throw new Error("Selecione um plano antes de registrar um simulado.");
    if (simulation.correct > simulation.totalQuestions) throw new Error("Os acertos não podem superar o total de questões.");
    if (simulation.results?.some((result) => result.correct > result.questions)) throw new Error("Em cada disciplina, os acertos devem ser menores ou iguais às questões.");
    const { data, error } = await supabase.from("simulations").insert({
      user_id: userId,
      plan_id: currentPlanId,
      title: simulation.title,
      simulated_at: simulation.date,
      total_questions: simulation.totalQuestions,
      correct: simulation.correct,
      duration_minutes: simulation.durationMinutes,
      notes: simulation.notes
    }).select("id").single();
    if (error || !data) throw error || new Error("Não foi possível registrar o simulado.");
    const results = simulation.results?.filter((result) => result.questions > 0) || [];
    if (results.length) {
      const { error: resultsError } = await supabase.from("simulation_results").insert(results.map((result) => ({ simulation_id: data.id, subject_id: result.subjectId || null, subject_name: result.subject, questions: result.questions, correct: result.correct })));
      if (resultsError) throw resultsError;
    }
    setSimulations((current) => [{ ...simulation, id: data.id }, ...current]);
  }

  return (
    <div className="planner-shell">
      <aside className="planner-sidebar">
        <div className="planner-brand">
          <img className="planner-logo" src="/plano-tracker.png" alt="" aria-hidden="true" />
          <div>
            <strong>PlanoTracker</strong>
            <span>Sua rota até a prova</span>
          </div>
        </div>

        <div className="planner-sidebar-signal" aria-hidden="true"><i /><i /><i /><i /></div>

        <nav className="planner-nav" aria-label="Navegação principal">
          <span className="planner-nav-label">Organização</span>
          <NavButton active={view === "dashboard"} icon={<LayoutDashboard size={18} />} label="Painel" onClick={() => setView("dashboard")} />
          <NavButton active={view === "create"} icon={<Sparkles size={18} />} label="Criar plano" onClick={() => setView("create")} />
          <NavButton active={view === "calendar"} icon={<CalendarDays size={18} />} label="Calendário" onClick={() => setView("calendar")} />
          <NavButton active={view === "goals"} icon={<ListChecks size={18} />} label="Metas" onClick={() => setView("goals")} />
          <NavButton active={view === "subjects"} icon={<ClipboardList size={18} />} label="Disciplinas" onClick={() => setView("subjects")} />
          <NavButton active={view === "sessions"} icon={<Plus size={18} />} label="Sessões" onClick={() => setView("sessions")} />
          <span className="planner-nav-label adaptive-nav-label">Aprendizado</span>
          <NavButton active={view === "reviews"} icon={<Brain size={18} />} label="Revisões" onClick={() => setView("reviews")} />
          <NavButton active={view === "materials"} icon={<LibraryBig size={18} />} label="Materiais" onClick={() => setView("materials")} />
          <NavButton active={view === "errors"} icon={<NotebookPen size={18} />} label="Caderno de erros" onClick={() => setView("errors")} />
          <NavButton active={view === "simulations"} icon={<ChartSpline size={18} />} label="Simulados" onClick={() => setView("simulations")} />
        </nav>

        <div className="sidebar-block">
          <div className="block-title">Progresso geral</div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="small-muted">{progressPercent}% concluído</div>
        </div>
        <button className={`sidebar-notification ${notificationsEnabled ? "enabled" : ""}`} type="button" onClick={enableNotifications} title="Ativar lembretes do navegador">
          <BellRing size={17} /> {notificationsEnabled ? "Lembretes ativos" : "Ativar lembretes"}
        </button>
        <button className={`sidebar-notification ${emailNotifications ? "enabled" : ""}`} type="button" onClick={toggleEmailNotifications} title="Ativar resumo diário por e-mail">
          <BellRing size={17} /> {emailNotifications ? "E-mail diário ativo" : "Ativar e-mail diário"}
        </button>
        <button className="sidebar-signout" type="button" onClick={signOut} title="Sair da conta">
          <LogOut size={17} /> Sair
        </button>
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
              <Plus size={18} /> Nova sessão
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
            examDate={currentExamDate}
            onStartSession={setExecutionItem}
            onOpenRecovery={() => setIsRecoveryOpen(true)}
            errors={errorEntries}
          />
        ) : null}
        {adaptiveMessage ? <div className="notice adaptive-migration-notice">{adaptiveMessage}</div> : null}
        {view === "create" ? <CreatePlan onPlanGenerated={importGeneratedPlan} /> : null}
        {view === "calendar" ? <Calendar schedule={schedule} subjects={subjects} onSaveDay={persistScheduleDay} onStartSession={setExecutionItem} /> : null}
        {view === "goals" ? <Goals goals={goals} setGoals={setGoals} openGoalModal={openGoalModal} onPersistGoal={persistGoal} onDeleteGoal={deleteGoalFromStorage} onStorageError={setStorageMessage} /> : null}
        {view === "subjects" ? <Subjects subjects={subjects} setSubjects={setSubjects} openSubjectModal={openSubjectModal} onDeleteSubject={deleteSubjectFromStorage} onStorageError={setStorageMessage} /> : null}
        {view === "sessions" ? <Sessions subjects={subjects} sessions={sessions} setSessions={setSessions} onPersistSession={persistSession} /> : null}
        {view === "reviews" ? <ReviewsView subjects={subjects} sessions={sessions} reviewStates={reviewStates} errors={errorEntries} onStart={setExecutionItem} /> : null}
        {view === "materials" ? <MaterialsView planId={currentPlanId} subjects={subjects} onAddError={createErrorEntry} /> : null}
        {view === "errors" ? <ErrorsView entries={errorEntries} subjects={subjects} onCreate={createErrorEntry} onToggle={toggleErrorEntry} /> : null}
        {view === "simulations" ? <SimulationsView schedule={schedule} sessions={sessions} subjects={subjects} simulations={simulations} examDate={currentExamDate} onCreate={createSimulation} /> : null}
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

      {executionItem && currentPlanId ? (
        <SessionExecutionModal item={executionItem} planId={currentPlanId} onClose={() => setExecutionItem(null)} onSaved={completeAdaptiveSession} />
      ) : null}

      {isRecoveryOpen && currentPlanId && currentExamDate ? (
        <RecoveryModal planId={currentPlanId} examDate={currentExamDate} schedule={schedule} onClose={() => setIsRecoveryOpen(false)} onApplied={setSchedule} />
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
  isLoadingPlan,
  examDate,
  onStartSession,
  onOpenRecovery,
  errors
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
  examDate: string;
  onStartSession: (item: ScheduleItem) => void;
  onOpenRecovery: () => void;
  errors: ErrorEntry[];
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

      <AdaptiveOverview
        schedule={schedule}
        sessions={sessions}
        subjects={subjects}
        examDate={examDate}
        onStart={onStartSession}
        onOpenRecovery={onOpenRecovery}
        onOpenReviews={() => setView("reviews")}
        errors={errors}
      />

      <WeeklyOverview schedule={schedule} onOpenCalendar={() => setView("calendar")} />

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
              todaySchedule.map((slot, index) => <StudySlot key={`${slot.date}-${slot.period}-${index}`} slot={slot} onStart={onStartSession} />)
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
  const [hoursByDay, setHoursByDay] = useState<Record<StudyWeekday, string>>(
    () => Object.fromEntries(studyWeekdays.map((day) => [day, ""])) as Record<StudyWeekday, string>
  );
  const weeklyHours = studyWeekdays.reduce((sum, day) => sum + (Number(hoursByDay[day]) || 0), 0);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const availability = Object.fromEntries(
      studyWeekdays
        .map((day) => [day, Number(hoursByDay[day])] as const)
        .filter(([, hours]) => Number.isFinite(hours) && hours > 0)
    );
    const days = Object.keys(availability);

    form.set("studyDays", days.join(","));
    form.set("hoursByDay", JSON.stringify(availability));

    if (!days.length) {
      setLoading(false);
      setError("Informe as horas de estudo de pelo menos um dia da semana.");
      return;
    }

    const editalText = String(form.get("editalText") || "").trim();
    const editalFile = form.get("editalFile");
    if (!editalText && (!(editalFile instanceof File) || editalFile.size === 0)) {
      setLoading(false);
      setError("Cole o conteúdo do edital ou anexe um arquivo para gerar o plano.");
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
            <input name="examName" required />
          </label>
          <label>
            Data da prova
            <input name="examDate" type="date" min={tomorrowIso()} required />
          </label>
        </div>
        <label>
          Edital em arquivo
          <input name="editalFile" type="file" accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown" />
        </label>

        <fieldset className="availability-picker">
          <legend>Horas de estudo por dia</legend>
          <div className="availability-heading">
            <p>Preencha somente os dias em que você pretende estudar. Use 1,5 para uma hora e meia.</p>
            <strong>{formatWeeklyHours(weeklyHours)} por semana</strong>
          </div>
          <div className="availability-grid">
            {studyWeekdays.map((day) => (
              <label className={Number(hoursByDay[day]) > 0 ? "active" : ""} key={day}>
                <span>{day.replace("-feira", "")}</span>
                <span className="hours-input">
                  <input
                    aria-label={`${day}: horas de estudo`}
                    inputMode="decimal"
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

        <label>
          Rotina desejada
          <textarea
            className="routine-input"
            name="preferredBlocks"
            rows={4}
            placeholder="Ex.: Estudar uma matéria por dia e intercalar ao longo da semana. Manhã para lei seca; tarde para doutrina; noite para questões da matéria do dia."
          />
        </label>
        <label>
          Edital
          <textarea name="editalText" placeholder="Cole aqui o conteúdo programático do edital ou anexe o PDF acima..." />
        </label>

        <div className="notice">O PlanoTracker usa IA para ler o edital e monta o calendário completo até a véspera da prova.</div>
        {error ? <div className="notice">{error}</div> : null}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Gerando..." : "Gerar plano"}
        </button>
      </form>
    </section>
  );
}

function Calendar({
  schedule,
  subjects,
  onSaveDay,
  onStartSession
}: {
  schedule: ScheduleItem[];
  subjects: Subject[];
  onSaveDay: (originalDate: string | null, day: ScheduleItem[]) => Promise<void>;
  onStartSession: (item: ScheduleItem) => void;
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
        <div className="calendar-toolbar-actions">
          {schedule.length ? <button className="ghost-button" type="button" onClick={() => downloadScheduleCalendar(schedule)}><Download size={17} /> Exportar agenda</button> : null}
          <button className="primary-button" type="button" onClick={() => setIsCreatingDay(true)}><Plus size={18} /> Novo dia</button>
        </div>
      </div>

      {days.length ? (
        <div className="calendar-grid">
          {days.map((day, index) => (
            <DayCard key={day[0].date} day={day} color={calendarColors[index % calendarColors.length]} onEdit={() => setEditingDay(day)} onStart={onStartSession} />
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
            <Plus size={18} /> Nova meta
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
                  <Check size={18} />
                </button>
                <button className="icon-button" type="button" title="Editar" aria-label={`Editar meta ${goal.title}`} onClick={() => openGoalModal(goal)}>
                  <Pencil size={18} />
                </button>
                <button className="icon-button danger-icon-button" type="button" title="Excluir" aria-label={`Excluir meta ${goal.title}`} onClick={() => setGoalToDelete(goal)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          )) : <EmptyState text="Crie metas próprias, como uma quantidade de questões, uma revisão ou um simulado com prazo definido." />}
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
            <Plus size={18} /> Nova disciplina
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
                  <button className="icon-button" type="button" title="Editar" aria-label={`Editar disciplina ${subject.name}`} onClick={() => openSubjectModal(subject)}>
                    <Pencil size={18} />
                  </button>
                  <button className="icon-button danger-icon-button" type="button" title="Excluir" aria-label={`Excluir disciplina ${subject.name}`} onClick={() => setSubjectToDelete(subject)}>
                    <Trash2 size={18} />
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
                    <option value="simulado">Simulado</option>
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

function WeeklyOverview({ schedule, onOpenCalendar }: { schedule: ScheduleItem[]; onOpenCalendar: () => void }) {
  if (!schedule.length) return null;

  const today = todayIso();
  const scheduledDates = [...new Set(schedule.map((slot) => slot.date))].sort();
  const anchor = scheduledDates.find((date) => date >= today) || scheduledDates[scheduledDates.length - 1];
  const week = weekDates(anchor);
  const weekSchedule = schedule.filter((slot) => week.includes(slot.date));
  const totalMinutes = weekSchedule.reduce((sum, slot) => sum + slot.minutes, 0);

  return (
    <section className="weekly-overview panel" aria-labelledby="weekly-overview-title">
      <div className="weekly-overview-header">
        <div>
          <span className="weekly-eyebrow">Ritmo da semana</span>
          <h2 id="weekly-overview-title">Minha semana</h2>
          <p>{formatDate(week[0]).slice(0, 5)} a {formatDate(week[6]).slice(0, 5)} · {formatMinutes(totalMinutes)} planejadas</p>
        </div>
        <button className="text-button" type="button" onClick={onOpenCalendar}>
          Ver calendário
        </button>
      </div>

      <div className="weekly-days" role="list" aria-label="Resumo do plano desta semana">
        {week.map((date) => {
          const slots = weekSchedule.filter((slot) => slot.date === date);
          const isToday = date === today;
          const isAnchor = date === anchor;

          return (
            <button
              className={`weekly-day ${isToday ? "today" : ""} ${isAnchor && !isToday ? "active" : ""}`}
              type="button"
              role="listitem"
              key={date}
              onClick={onOpenCalendar}
              aria-label={`${weekdayShort(date)}, ${formatDate(date)}: ${slots.length} ${slots.length === 1 ? "sessão" : "sessões"}`}
            >
              <span className="weekly-day-name">{weekdayShort(date)}</span>
              <strong>{Number(date.slice(-2))}</strong>
              <span className="weekly-blocks" aria-hidden="true">
                {slots.slice(0, 3).map((slot, index) => (
                  <i
                    key={`${slot.period}-${index}`}
                    style={{ background: subjectCalendarColor(slot.subject) }}
                    title={`${displayPeriod(slot.period)}: ${slot.subject}`}
                  />
                ))}
              </span>
              <span className="weekly-session-count">
                {slots.length ? `${slots.length} ${slots.length === 1 ? "sessão" : "sessões"}` : "Livre"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function StudySlot({ slot, onStart }: { slot: ScheduleItem; onStart: (item: ScheduleItem) => void }) {
  return (
    <article className={`session-item focus-session-item status-${slot.status || "planned"}`}>
      <div>
        <strong>{displayPeriod(slot.period)} - {slot.subject}</strong>
        <span>{formatHours(slot.minutes)} | {slot.topic}</span>
      </div>
      <div className="focus-session-actions">
        <span className={`status-pill ${slot.status === "completed" ? "done" : ""}`}>{scheduleStatusLabel(slot.status)}</span>
        {slot.status !== "completed" ? <button className="primary-button compact-button" type="button" onClick={() => onStart(slot)}>Iniciar</button> : null}
      </div>
    </article>
  );
}

function SubjectRow({ subject, sessions }: { subject: Subject; sessions: Session[] }) {
  const subjectSessions = sessions.filter((session) => session.subject === subject.name);
  const minutes = subjectSessions.reduce((sum, session) => sum + session.minutes, 0);
  const questions = subjectSessions.reduce((sum, session) => sum + session.questions, 0);
  const correct = subjectSessions.reduce((sum, session) => sum + session.correct, 0);
  const accuracy = questions ? Math.round((correct / questions) * 100) : 0;
  const calculatedProgress = minutes
    ? Math.min(100, Math.round(minutes / Math.max(60, subject.topics.length * 60) * 100))
    : subject.progress;

  return (
    <div className="subject-row">
      <div>
        <div className="subject-name">
          <span className="dot" style={{ background: subject.color }} />
          <span>{subject.name}</span>
        </div>
        <div className="mini-meta">{formatMinutes(minutes)} | {questions} questões | {accuracy}% acerto</div>
      </div>
      <strong>{calculatedProgress}%</strong>
    </div>
  );
}

function DayCard({ day, color, onEdit, onStart }: { day: ScheduleItem[]; color: string; onEdit: () => void; onStart: (item: ScheduleItem) => void }) {
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
          <div className={`study-slot status-${slot.status || "planned"}`} key={`${slot.date}-${slot.period}-${slot.id || slot.topic}`}>
            <div className="slot-time">{displayPeriod(slot.period)}<span>{formatHours(slot.minutes)}</span></div>
            <div><strong>{slot.subject}</strong><p>{slot.topic}</p><span className="calendar-slot-status">{scheduleStatusLabel(slot.status)}{slot.status === "partial" ? ` · ${slot.completionPercent || 0}%` : ""}</span></div>
            {slot.status !== "completed" ? <button className="calendar-start-button" type="button" onClick={() => onStart(slot)} title="Iniciar sessão"><CirclePlay size={18} /></button> : <Check size={18} aria-label="Concluída" />}
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
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes}min`;
  if (!minutes) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

function formatWeeklyHours(value: number) {
  const totalMinutes = Math.round(value * 60);
  if (!totalMinutes) return "0h";
  return formatHours(totalMinutes);
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
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function offsetIso(amount: number) {
  const date = new Date();
  date.setDate(date.getDate() + amount);
  return localDateIso(date);
}

function localDateIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function weekDates(anchor: string) {
  const [year, month, day] = anchor.split("-").map(Number);
  const start = new Date(year, month - 1, day);
  const dayOfWeek = start.getDay();
  start.setDate(start.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return localDateIso(date);
  });
}

function weekdayShort(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][new Date(year, month - 1, day).getDay()];
}

function subjectCalendarColor(subject: string) {
  const hash = [...subject].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return calendarColors[hash % calendarColors.length];
}

function tomorrowIso() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSyllabusTopic(topic: { status: string }) {
  return topic.status !== "goal_pending" && topic.status !== "goal_done";
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
  return { teoria: "Teoria", questoes: "Questões", revisao: "Revisão", simulado: "Simulado" }[kind] || kind;
}

function scheduleStatusLabel(status?: ScheduleItem["status"]) {
  return {
    planned: "Planejada",
    in_progress: "Em andamento",
    completed: "Concluída",
    partial: "Parcial",
    postponed: "Adiada",
    missed: "Não realizada"
  }[status || "planned"];
}

function topicsOverlap(a: string, b: string) {
  const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const first = normalize(a);
  const second = normalize(b);
  return first === second || first.includes(second) || second.includes(first);
}

function downloadScheduleCalendar(schedule: ScheduleItem[]) {
  const escape = (value: string) => value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PlanoTracker//Rota de Estudos//PT-BR", "CALSCALE:GREGORIAN"];
  schedule.forEach((item, index) => {
    const startHour = { Manha: 8, Tarde: 14, Noite: 19 }[item.period];
    const start = calendarTimestamp(item.date, startHour, 0);
    const endDate = new Date(`${item.date}T${String(startHour).padStart(2, "0")}:00:00`);
    endDate.setMinutes(endDate.getMinutes() + item.minutes);
    const end = `${localDateIso(endDate).replace(/-/g, "")}T${String(endDate.getHours()).padStart(2, "0")}${String(endDate.getMinutes()).padStart(2, "0")}00`;
    lines.push("BEGIN:VEVENT", `UID:${item.id || index}-${item.date}@planotracker`, `DTSTART;TZID=America/Sao_Paulo:${start}`, `DTEND;TZID=America/Sao_Paulo:${end}`, `SUMMARY:${escape(`${item.subject} - ${displayKind(item.kind)}`)}`, `DESCRIPTION:${escape(item.topic)}`, "END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "plano-de-estudos-planotracker.ics";
  link.click();
  URL.revokeObjectURL(url);
}

function calendarTimestamp(date: string, hour: number, minute: number) {
  return `${date.replace(/-/g, "")}T${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}00`;
}

function displayWeekday(weekday: string) {
  return weekday.replace("Terca-feira", "Terça-feira").replace("Sabado", "Sábado");
}

function formatWeight(subject: Subject) {
  if (!subject.questions || !subject.weight) return "0";
  const value = subject.weight / subject.questions;
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

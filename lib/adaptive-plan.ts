import { Rating, State, createEmptyCard, fsrs, type Card, type Grade } from "ts-fsrs";
import type {
  RecallRating,
  RebalancePreview,
  ReviewState,
  ScheduleItem,
  SessionFeedback,
  TopicMastery
} from "./types";

export type AdaptiveSession = {
  id: string;
  date: string;
  subject: string;
  topic?: string;
  topicId?: string;
  minutes: number;
  questions: number;
  correct: number;
  difficulty?: number;
  confidence?: number;
  completionPercent?: number;
};

export type PlanBudget = {
  risk: RebalancePreview["risk"];
  remainingMinutes: number;
  availableMinutes: number;
  backlogMinutes: number;
  daysLeft: number;
  coveragePercent: number;
  suggestions: string[];
};

const scheduler = fsrs({ maximum_interval: 365, request_retention: 0.9, enable_fuzz: false });

export function calculatePlanBudget(schedule: ScheduleItem[], examDate: string, now = new Date(), extraCapacityMinutes = 0): PlanBudget {
  const today = toIso(startOfDay(now));
  const end = addDays(parseIso(examDate), -1);
  const activeItems = schedule.filter((item) => item.status !== "completed");
  const remainingMinutes = activeItems.reduce((sum, item) => sum + Math.round(item.minutes * remainingFraction(item)), 0);
  const backlogMinutes = activeItems
    .filter((item) => item.date < today)
    .reduce((sum, item) => sum + Math.round(item.minutes * remainingFraction(item)), 0);
  const completed = schedule.filter((item) => item.status === "completed").length;
  const coveragePercent = schedule.length ? Math.round((completed / schedule.length) * 100) : 0;
  const studyWeekdays = new Set(schedule.map((item) => parseIso(item.date).getDay()));
  const dailyLoads = new Map<string, number>();
  schedule.forEach((item) => dailyLoads.set(item.date, (dailyLoads.get(item.date) || 0) + item.minutes));
  const capacityPerDay = Math.max(30, (median([...dailyLoads.values()]) || 60) + Math.max(0, extraCapacityMinutes));
  let daysLeft = 0;
  for (let date = startOfDay(now); date <= end; date = addDays(date, 1)) {
    if (!studyWeekdays.size || studyWeekdays.has(date.getDay())) daysLeft += 1;
  }
  const availableMinutes = daysLeft * capacityPerDay;
  const ratio = availableMinutes ? remainingMinutes / availableMinutes : remainingMinutes ? Infinity : 0;
  const risk: PlanBudget["risk"] = ratio <= 0.82 ? "comfortable" : ratio <= 1 ? "tight" : "unviable";
  const suggestions = budgetSuggestions(risk, backlogMinutes, ratio, capacityPerDay);

  return { risk, remainingMinutes, availableMinutes, backlogMinutes, daysLeft, coveragePercent, suggestions };
}

export function buildRebalancePreview(schedule: ScheduleItem[], examDate: string, now = new Date()): RebalancePreview {
  const today = toIso(startOfDay(now));
  const exam = parseIso(examDate);
  const movable = schedule
    .filter((item) => item.date < today && item.status !== "completed")
    .sort(scheduleOrder);
  const preserved = schedule.filter((item) => !movable.includes(item));
  const studyWeekdays = new Set(schedule.map((item) => parseIso(item.date).getDay()));
  const futureDates: string[] = [];
  for (let date = startOfDay(now); date < exam; date = addDays(date, 1)) {
    if (!studyWeekdays.size || studyWeekdays.has(date.getDay())) futureDates.push(toIso(date));
  }
  const loads = new Map<string, number>();
  const capacity = Math.max(30, median([...groupMinutes(schedule).values()]) || 60);
  preserved.filter((item) => item.date >= today).forEach((item) => loads.set(item.date, (loads.get(item.date) || 0) + item.minutes));
  const moves: RebalancePreview["moves"] = [];
  const rebalanced = [...preserved];

  movable.forEach((item) => {
    const target = futureDates
      .filter((date) => (loads.get(date) || 0) + item.minutes <= Math.round(capacity * 1.15))
      .filter((date) => !rebalanced.some((candidate) => candidate.date === date && candidate.period === item.period))
      .sort((a, b) => {
        const sameSubjectA = rebalanced.filter((candidate) => candidate.date === a && candidate.subject === item.subject).length;
        const sameSubjectB = rebalanced.filter((candidate) => candidate.date === b && candidate.subject === item.subject).length;
        return sameSubjectA - sameSubjectB || (loads.get(a) || 0) - (loads.get(b) || 0) || a.localeCompare(b);
      })[0];

    if (!target) {
      rebalanced.push(item);
      return;
    }
    loads.set(target, (loads.get(target) || 0) + item.minutes);
    const moved = {
      ...item,
      date: target,
      weekday: weekdayFromIso(target),
      status: "planned" as const,
      rescheduledFromId: item.id
    };
    rebalanced.push(moved);
    moves.push({
      itemId: item.id || `${item.date}-${item.period}-${item.subject}`,
      subject: item.subject,
      topic: item.topic,
      fromDate: item.date,
      toDate: target,
      period: item.period,
      minutes: item.minutes
    });
  });

  const unresolved = movable.length - moves.length;
  const budget = calculatePlanBudget(rebalanced, examDate, now);
  return {
    ...budget,
    risk: unresolved ? "unviable" : budget.risk,
    schedule: rebalanced.sort(scheduleOrder),
    moves,
    suggestions: unresolved
      ? [`${unresolved} bloco(s) ainda não cabem antes da prova. Reduza conteúdo ou aumente a disponibilidade.`, ...budget.suggestions]
      : budget.suggestions
  };
}

export function calculateTopicMastery(
  subject: string,
  topic: string,
  sessions: AdaptiveSession[],
  nextReviewAt?: string,
  now = new Date()
): TopicMastery {
  const normalizedTopic = normalizeTopic(topic);
  const matching = sessions.filter(
    (session) => session.subject === subject && (!session.topic || normalizeTopic(session.topic).includes(normalizedTopic) || normalizedTopic.includes(normalizeTopic(session.topic)))
  );
  const minutes = matching.reduce((sum, session) => sum + session.minutes, 0);
  const questions = matching.reduce((sum, session) => sum + session.questions, 0);
  const correct = matching.reduce((sum, session) => sum + session.correct, 0);
  const coverage = Math.min(100, Math.round((minutes / 90) * 100));
  const accuracy = questions ? Math.round((correct / questions) * 100) : coverage ? 60 : 0;
  const lastStudiedAt = matching.map((session) => session.date).sort().at(-1);
  const recencyDays = lastStudiedAt ? Math.max(0, diffDays(parseIso(lastStudiedAt), startOfDay(now))) : 999;
  const difficultyAverage = matching.length
    ? matching.reduce((sum, session) => sum + (session.difficulty || 2), 0) / matching.length
    : 4;
  const retention = lastStudiedAt ? Math.max(10, Math.round(100 * Math.exp(-recencyDays / Math.max(3, 18 - difficultyAverage * 2)))) : 0;
  const mastery = Math.round(coverage * 0.35 + accuracy * 0.4 + retention * 0.25);
  return { subject, topic, coverage, accuracy, retention, mastery, lastStudiedAt, nextReviewAt };
}

export function recommendNextSession(
  schedule: ScheduleItem[],
  mastery: TopicMastery[],
  priorities: Record<string, { weight?: number; unresolvedErrors?: number }> = {},
  now = new Date()
) {
  const today = toIso(startOfDay(now));
  const candidates = schedule.filter((item) => item.status !== "completed" && item.date <= today);
  const pool = candidates.length ? candidates : schedule.filter((item) => item.status !== "completed" && item.date >= today);
  return [...pool].sort((a, b) => sessionPriority(b, mastery, today, priorities) - sessionPriority(a, mastery, today, priorities) || scheduleOrder(a, b))[0];
}

export function scheduleReview(current: ReviewState | undefined, rating: RecallRating, now = new Date()): ReviewState {
  const card: Card = current
    ? {
        due: new Date(current.dueAt),
        stability: current.stability,
        difficulty: current.difficulty,
        elapsed_days: 0,
        scheduled_days: current.scheduledDays,
        learning_steps: 0,
        reps: current.reps,
        lapses: current.lapses,
        state: current.state as State,
        last_review: current.lastReviewAt ? new Date(current.lastReviewAt) : undefined
      }
    : createEmptyCard(now);
  const grade = ({ forgot: Rating.Again, hard: Rating.Hard, good: Rating.Good, easy: Rating.Easy } as const)[rating] as Grade;
  const result = scheduler.next(card, now, grade);
  return {
    topicId: current?.topicId || "",
    dueAt: result.card.due.toISOString(),
    stability: result.card.stability,
    difficulty: result.card.difficulty,
    scheduledDays: result.card.scheduled_days,
    reps: result.card.reps,
    lapses: result.card.lapses,
    state: result.card.state,
    lastReviewAt: now.toISOString()
  };
}

export function weeklyReview(schedule: ScheduleItem[], sessions: AdaptiveSession[], now = new Date()) {
  const end = startOfDay(now);
  const start = addDays(end, -6);
  const inRange = (value: string) => parseIso(value) >= start && parseIso(value) <= end;
  const planned = schedule.filter((item) => inRange(item.date));
  const completed = planned.filter((item) => item.status === "completed");
  const studied = sessions.filter((session) => inRange(session.date));
  const plannedMinutes = planned.reduce((sum, item) => sum + item.minutes, 0);
  const studiedMinutes = studied.reduce((sum, item) => sum + item.minutes, 0);
  const questions = studied.reduce((sum, item) => sum + item.questions, 0);
  const correct = studied.reduce((sum, item) => sum + item.correct, 0);
  return {
    plannedMinutes,
    studiedMinutes,
    adherence: plannedMinutes ? Math.min(100, Math.round((studiedMinutes / plannedMinutes) * 100)) : 0,
    completed: completed.length,
    missed: planned.filter((item) => item.status !== "completed" && item.date < toIso(end)).length,
    accuracy: questions ? Math.round((correct / questions) * 100) : 0
  };
}

export function feedbackToScheduleStatus(feedback: SessionFeedback) {
  return {
    status: feedback.status,
    completionPercent: feedback.completionPercent,
    completedAt: feedback.status === "completed" ? new Date().toISOString() : undefined
  };
}

function sessionPriority(item: ScheduleItem, mastery: TopicMastery[], today: string, priorities: Record<string, { weight?: number; unresolvedErrors?: number }>) {
  const topicMastery = mastery.find((entry) => entry.subject === item.subject && normalizeTopic(item.topic).includes(normalizeTopic(entry.topic)));
  const weakness = 100 - (topicMastery?.mastery || 0);
  const overdue = item.date < today ? 35 : item.date === today ? 20 : 0;
  const reviewDue = topicMastery?.nextReviewAt && topicMastery.nextReviewAt.slice(0, 10) <= today ? 30 : 0;
  const subjectPriority = priorities[item.subject];
  const weightBoost = Math.min(30, Number(subjectPriority?.weight || 0) * 0.5);
  const errorBoost = Math.min(25, Number(subjectPriority?.unresolvedErrors || 0) * 5);
  return weakness + overdue + reviewDue + weightBoost + errorBoost + (item.kind === "questoes" ? 5 : 0);
}

function budgetSuggestions(risk: PlanBudget["risk"], backlog: number, ratio: number, capacity: number) {
  const suggestions: string[] = [];
  if (backlog) suggestions.push(`Recupere ${formatMinutes(backlog)} de sessões atrasadas.`);
  if (risk === "tight") suggestions.push("Reserve uma pequena margem semanal para imprevistos.");
  if (risk === "unviable") {
    const extra = Math.max(30, Math.ceil(((ratio - 1) * capacity) / 30) * 30);
    suggestions.push(`Considere adicionar cerca de ${formatMinutes(extra)} por dia de estudo ou priorizar conteúdos de maior peso.`);
  }
  if (risk === "comfortable" && !backlog) suggestions.push("A carga atual cabe no prazo e ainda preserva margem para revisões.");
  return suggestions;
}

function remainingFraction(item: ScheduleItem) {
  if (item.status === "completed") return 0;
  if (item.status === "partial") return Math.max(0, 1 - (item.completionPercent || 50) / 100);
  return 1;
}

function groupMinutes(schedule: ScheduleItem[]) {
  const grouped = new Map<string, number>();
  schedule.forEach((item) => grouped.set(item.date, (grouped.get(item.date) || 0) + item.minutes));
  return grouped;
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function scheduleOrder(a: ScheduleItem, b: ScheduleItem) {
  return `${a.date}-${periodOrder(a.period)}`.localeCompare(`${b.date}-${periodOrder(b.period)}`);
}

function periodOrder(period: ScheduleItem["period"]) {
  return { Manha: 1, Tarde: 2, Noite: 3 }[period];
}

function normalizeTopic(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function parseIso(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function diffDays(from: Date, to: Date) {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

function toIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function weekdayFromIso(value: string) {
  const names = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  return names[parseIso(value).getDay()];
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h${rest ? ` ${rest}min` : ""}` : `${rest}min`;
}

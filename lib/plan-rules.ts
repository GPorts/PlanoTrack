import type { GeneratedPlan, StudyPlanRequest, SubjectInput, ScheduleItem } from "./types";

const weekdayNames = ["Domingo", "Segunda-feira", "Terca-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sabado"];

export function generateRuleBasedPlan(input: StudyPlanRequest): GeneratedPlan {
  const subjects = input.subjects?.length ? input.subjects : fallbackSubjects(input.editalText);
  const schedule = buildSchedule(subjects, input.routine.examDate, input.routine.hoursPerDay, input.routine.studyDays);

  return {
    title: input.routine.examName || "Novo plano de estudos",
    examDate: input.routine.examDate,
    summary: `Plano criado para ${subjects.length} disciplinas, com ${input.routine.hoursPerDay} horas por dia ate a data da prova.`,
    subjects,
    schedule,
    recommendations: [
      "Priorize disciplinas com mais pontos e mais topicos pendentes.",
      "Reserve o bloco da noite para questoes, revisao e caderno de erros.",
      "Replaneje semanalmente quando houver atraso relevante."
    ],
    source: "rules"
  };
}

function fallbackSubjects(editalText = ""): SubjectInput[] {
  const guessed = editalText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => /^[0-9]+\.?\s+[A-ZÁÉÍÓÚÃÕÇ\s]{6,}/.test(line))
    .slice(0, 8)
    .map((line) => line.replace(/^[0-9]+\.?\s+/, "").toLowerCase())
    .map((line) => line.charAt(0).toUpperCase() + line.slice(1).toLowerCase());

  const names = guessed.length ? guessed : ["Lingua Portuguesa", "Direito Administrativo", "Direito Constitucional"];

  return names.map((name) => ({
    name,
    questions: 5,
    weight: 10,
    topics: ["Topico 1 extraido do edital", "Topico 2 extraido do edital", "Revisao e questoes"]
  }));
}

function buildSchedule(subjects: SubjectInput[], examDate: string, hoursPerDay: number, studyDays: string[]): ScheduleItem[] {
  const start = new Date();
  const end = parseDate(examDate);
  const minutesPerBlock = Math.max(45, Math.round((hoursPerDay * 60) / 3));
  const schedule: ScheduleItem[] = [];
  const cursors = new Map<string, number>();
  const weightedSubjects = weightedQueue(subjects);

  for (let date = start; date <= end; date = addDays(date, 1)) {
    const weekday = weekdayNames[date.getDay()];
    if (studyDays.length && !studyDays.includes(weekday)) continue;

    const morningSubject = weightedSubjects[schedule.length % weightedSubjects.length];
    const afternoonSubject = weightedSubjects[(schedule.length + 1) % weightedSubjects.length];
    const nightSubject = weightedSubjects[(schedule.length + 2) % weightedSubjects.length];

    schedule.push(slot(date, "Manha", morningSubject, "teoria", minutesPerBlock, cursors));
    schedule.push(slot(date, "Tarde", afternoonSubject, "teoria", minutesPerBlock, cursors));
    schedule.push(slot(date, "Noite", nightSubject, "questoes", minutesPerBlock, cursors));
  }

  return schedule;
}

function weightedQueue(subjects: SubjectInput[]) {
  const queue = subjects.flatMap((subject) => Array(Math.max(1, Math.round((subject.weight || 5) / 4))).fill(subject));
  return queue.length ? queue : subjects;
}

function slot(
  date: Date,
  period: ScheduleItem["period"],
  subject: SubjectInput,
  kind: ScheduleItem["kind"],
  minutes: number,
  cursors: Map<string, number>
): ScheduleItem {
  const index = cursors.get(subject.name) || 0;
  cursors.set(subject.name, index + 1);
  const topic = subject.topics[index % subject.topics.length] || "Revisao geral";

  return {
    date: toIso(date),
    weekday: weekdayNames[date.getDay()],
    period,
    subject: subject.name,
    topic: kind === "questoes" ? `Questoes: ${topic}` : topic,
    kind,
    minutes
  };
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

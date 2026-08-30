import type { GeneratedPlan, ScheduleItem, StudyBlock, StudyPlanRequest, StudyRoutinePolicy, StudyWeekday, SubjectInput } from "./types";

const weekdayNames: StudyWeekday[] = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

export function generateRuleBasedPlan(input: StudyPlanRequest, interpretedPolicy?: StudyRoutinePolicy): GeneratedPlan {
  const subjects = input.subjects?.length ? input.subjects : fallbackSubjects(input.editalText);
  const policy = sanitizePolicy(enforceExplicitRoutineConstraints(interpretedPolicy, input.routine.preferredBlocks));
  const hoursByDay = resolveHoursByDay(input.routine);
  const schedule = buildSchedule(subjects, input.routine.examDate, hoursByDay, policy);
  const weeklyHours = Object.values(hoursByDay).reduce((sum, hours) => sum + hours, 0);
  const activeDays = Object.values(hoursByDay).filter((hours) => hours > 0).length;

  return {
    title: input.routine.examName || "Novo plano de estudos",
    examDate: input.routine.examDate,
    summary: `Plano criado para ${subjects.length} disciplinas, com ${formatHours(weeklyHours)} por semana distribuídas em ${activeDays} ${activeDays === 1 ? "dia" : "dias"} até a data da prova.`,
    subjects,
    schedule,
    recommendations: [
      "Use o calendário como ponto de partida e ajuste os dias quando a rotina mudar.",
      "Acompanhe questões e acertos nas sessões para identificar as disciplinas que precisam de reforço.",
      "Revise a distribuição semanalmente sem apagar o progresso já realizado."
    ],
    source: "rules"
  };
}

export function inferRoutinePolicy(preferredBlocks = ""): StudyRoutinePolicy {
  const normalized = normalize(preferredBlocks);
  if (!normalized) {
    return {
      blocks: [
        { period: "Manha", kind: "teoria", instruction: "Estudar teoria" },
        { period: "Tarde", kind: "questoes", instruction: "Resolver questões" },
        { period: "Noite", kind: "revisao", instruction: "Revisar o conteúdo estudado" }
      ],
      maxSubjectsPerDay: 1,
      avoidConsecutiveSubjectDays: true,
      maxStudyDaysPerSubjectPerWeek: 0
    };
  }

  const flags = routineFlags(normalized);
  const periodDefinitions: Array<{ key: string; period: StudyBlock["period"] }> = [
    { key: "manha", period: "Manha" },
    { key: "tarde", period: "Tarde" },
    { key: "noite", period: "Noite" }
  ];
  const mentionedPeriods = periodDefinitions.filter(({ key }) => normalized.includes(key));
  const selectedPeriods = mentionedPeriods.length ? mentionedPeriods : periodDefinitions;
  const blocks = selectedPeriods.map(({ key, period }) => {
    const instruction = instructionForPeriod(preferredBlocks, key);
    return {
      period,
      kind: inferKind(instruction || defaultInstruction(period)),
      instruction: instruction || defaultInstruction(period)
    };
  });

  return {
    blocks,
    maxSubjectsPerDay: flags.oneSubjectPerDay ? 1 : Math.min(3, blocks.length),
    avoidConsecutiveSubjectDays: flags.alternateSubjects,
    maxStudyDaysPerSubjectPerWeek: flags.noWeeklyRepeat ? 1 : 0
  };
}

function enforceExplicitRoutineConstraints(interpretedPolicy: StudyRoutinePolicy | undefined, preferredBlocks: string) {
  const localPolicy = inferRoutinePolicy(preferredBlocks);
  if (!interpretedPolicy) return localPolicy;

  const normalized = normalize(preferredBlocks);
  if (!normalized) return localPolicy;
  const flags = routineFlags(normalized);
  const hasExplicitPeriods = ["manha", "tarde", "noite"].some((period) => normalized.includes(period));
  const blocks = hasExplicitPeriods
    ? localPolicy.blocks.map((localBlock) => {
        const interpretedBlock = interpretedPolicy.blocks.find((block) => block.period === localBlock.period);
        return interpretedBlock
          ? {
              ...interpretedBlock,
              kind: inferKind(interpretedBlock.instruction || localBlock.instruction),
              instruction: interpretedBlock.instruction || localBlock.instruction
            }
          : localBlock;
      })
    : interpretedPolicy.blocks;

  return {
    blocks,
    maxSubjectsPerDay: flags.oneSubjectPerDay ? 1 : interpretedPolicy.maxSubjectsPerDay,
    avoidConsecutiveSubjectDays: flags.alternateSubjects || interpretedPolicy.avoidConsecutiveSubjectDays,
    maxStudyDaysPerSubjectPerWeek: flags.noWeeklyRepeat ? 1 : interpretedPolicy.maxStudyDaysPerSubjectPerWeek
  };
}

function routineFlags(normalized: string) {
  return {
    oneSubjectPerDay: [
      /(?:apenas|somente|so) uma (?:unica )?materia por dia/,
      /uma unica materia por dia/,
      /1 materia por dia/,
      /mesma materia (?:durante|em) (?:todo )?o dia/
    ].some((pattern) => pattern.test(normalized)),
    alternateSubjects: /intercal|altern|nao repetir|nao estudar a mesma materia.*(?:seguido|consecutiv)/.test(normalized),
    noWeeklyRepeat: /(?:nao|nunca|evit)[^.\n;]*mesma materia[^.\n;]*(?:na semana|mesma semana|durante a semana)/.test(normalized)
  };
}

function fallbackSubjects(editalText = ""): SubjectInput[] {
  const guessed = editalText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => /^[0-9]+\.?\s+[\p{Lu}\s]{6,}/u.test(line))
    .slice(0, 8)
    .map((line) => line.replace(/^[0-9]+\.?\s+/, "").toLowerCase())
    .map((line) => line.charAt(0).toUpperCase() + line.slice(1).toLowerCase());

  const names = guessed.length ? guessed : ["Língua Portuguesa", "Direito Administrativo", "Direito Constitucional"];

  return names.map((name) => ({
    name,
    topics: ["Tópico 1 extraído do edital", "Tópico 2 extraído do edital", "Revisão e questões"]
  }));
}

function buildSchedule(
  subjects: SubjectInput[],
  examDate: string,
  hoursByDay: Partial<Record<StudyWeekday, number>>,
  policy: StudyRoutinePolicy
): ScheduleItem[] {
  if (!subjects.length || !policy.blocks.length) return [];

  const start = startOfToday();
  const end = addDays(parseDate(examDate), -1);
  const schedule: ScheduleItem[] = [];
  const topicCursors = new Map<string, number>();
  const totalStudyMinutes = new Map<string, number>();
  const weeklyStudyDays = new Map<string, Map<string, number>>();
  let previousDaySubjects = new Set<string>();

  for (let date = start; date <= end; date = addDays(date, 1)) {
    const weekday = weekdayNames[date.getDay()];
    const availableMinutes = Math.round((hoursByDay[weekday] || 0) * 60);
    if (availableMinutes <= 0) continue;
    const minutesByBlock = splitMinutes(availableMinutes, policy.blocks.length);

    const week = weekKey(date);
    const weekCounts = weeklyStudyDays.get(week) || new Map<string, number>();
    weeklyStudyDays.set(week, weekCounts);
    const subjectCount = Math.min(policy.maxSubjectsPerDay, policy.blocks.length, subjects.length);
    const daySubjects = selectSubjectsForDay(
      subjects,
      subjectCount,
      totalStudyMinutes,
      weekCounts,
      previousDaySubjects,
      policy,
      availableMinutes
    );

    const minutesBySubject = new Map<string, number>();
    policy.blocks.forEach((block, index) => {
      const subject = daySubjects[index % daySubjects.length];
      schedule.push(createSlot(date, block, subject, minutesByBlock[index], topicCursors));
      minutesBySubject.set(subject.name, (minutesBySubject.get(subject.name) || 0) + minutesByBlock[index]);
    });

    daySubjects.forEach((subject) => {
      totalStudyMinutes.set(subject.name, (totalStudyMinutes.get(subject.name) || 0) + (minutesBySubject.get(subject.name) || 0));
      weekCounts.set(subject.name, (weekCounts.get(subject.name) || 0) + 1);
    });
    previousDaySubjects = new Set(daySubjects.map((subject) => subject.name));
  }

  return schedule;
}

function resolveHoursByDay(routine: StudyPlanRequest["routine"]): Partial<Record<StudyWeekday, number>> {
  return Object.fromEntries(
    routine.studyDays
      .map((day) => {
        const hours = Number(routine.hoursByDay?.[day] ?? routine.hoursPerDay ?? 0);
        return [day, Math.max(0, Math.min(12, hours))] as const;
      })
      .filter(([, hours]) => hours > 0)
  );
}

function splitMinutes(totalMinutes: number, blockCount: number) {
  const base = Math.floor(totalMinutes / blockCount);
  const remainder = totalMinutes % blockCount;
  return Array.from({ length: blockCount }, (_, index) => base + (index < remainder ? 1 : 0));
}

function formatHours(hours: number) {
  return `${Number.isInteger(hours) ? hours : hours.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ${hours === 1 ? "hora" : "horas"}`;
}

function selectSubjectsForDay(
  subjects: SubjectInput[],
  count: number,
  totalStudyMinutes: Map<string, number>,
  weekCounts: Map<string, number>,
  previousDaySubjects: Set<string>,
  policy: StudyRoutinePolicy,
  availableMinutes: number
) {
  const selected: SubjectInput[] = [];

  while (selected.length < count) {
    let candidates = subjects.filter((subject) => !selected.some((item) => item.name === subject.name));
    const withinWeeklyLimit = candidates.filter(
      (subject) => !policy.maxStudyDaysPerSubjectPerWeek || (weekCounts.get(subject.name) || 0) < policy.maxStudyDaysPerSubjectPerWeek
    );
    if (withinWeeklyLimit.length) candidates = withinWeeklyLimit;

    if (policy.avoidConsecutiveSubjectDays) {
      const nonConsecutive = candidates.filter((subject) => !previousDaySubjects.has(subject.name));
      if (nonConsecutive.length) candidates = nonConsecutive;
    }

    const next = [...candidates].sort((a, b) => {
      const estimatedMinutes = availableMinutes / Math.max(1, count);
      const aNeed = ((totalStudyMinutes.get(a.name) || 0) + estimatedMinutes) / subjectPriority(a);
      const bNeed = ((totalStudyMinutes.get(b.name) || 0) + estimatedMinutes) / subjectPriority(b);
      return aNeed - bNeed || a.name.localeCompare(b.name, "pt-BR");
    })[0];

    if (!next) break;
    selected.push(next);
  }

  return selected.length ? selected : [subjects[0]];
}

export function subjectPriority(subject: SubjectInput) {
  const calculatedPriority = positiveNumber(subject.priority);
  if (calculatedPriority) return calculatedPriority;

  const points = positiveNumber(subject.weight) || positiveNumber(subject.questions) || 1;
  const contentFactor = 1 + Math.log2(Math.max(1, subject.topics.length) + 1) / 20;
  return points * contentFactor;
}

function sanitizePolicy(policy: StudyRoutinePolicy): StudyRoutinePolicy {
  const uniqueBlocks = policy.blocks.filter(
    (block, index, blocks) => blocks.findIndex((candidate) => candidate.period === block.period) === index
  );
  const blocks = uniqueBlocks.length
    ? uniqueBlocks.slice(0, 3).map((block) => ({
        period: block.period,
        kind: block.kind,
        instruction: block.instruction.trim() || defaultInstruction(block.period)
      }))
    : inferRoutinePolicy("").blocks;

  return {
    blocks,
    maxSubjectsPerDay: Math.max(1, Math.min(3, Math.round(policy.maxSubjectsPerDay || blocks.length))),
    avoidConsecutiveSubjectDays: Boolean(policy.avoidConsecutiveSubjectDays),
    maxStudyDaysPerSubjectPerWeek: Math.max(0, Math.min(7, Math.round(policy.maxStudyDaysPerSubjectPerWeek || 0)))
  };
}

function instructionForPeriod(text: string, periodKey: string) {
  const clause = text
    .split(/[.;\n]+/)
    .map((item) => item.trim())
    .find((item) => normalize(item).includes(periodKey));

  if (!clause) return "";

  const sharedInstruction = clause.match(/\bpara\s+(.+)$/i)?.[1]?.trim();
  if (sharedInstruction) return sentenceCase(sharedInstruction);

  const words = clause.split(/\s+/);
  const periodIndex = words.findIndex((word) => normalize(word).replace(/[^a-z]/g, "") === periodKey);
  const withoutPeriod = periodIndex >= 0 ? words.slice(periodIndex + 1).join(" ").replace(/^[:,-]+\s*/, "").trim() : clause;
  return sentenceCase(withoutPeriod || clause);
}

function inferKind(text: string): StudyBlock["kind"] {
  const normalized = normalize(text);
  if (/quest|exerc|simulad|caderno de erros/.test(normalized)) return "questoes";
  if (/revis|resumo|flashcard/.test(normalized)) return "revisao";
  return "teoria";
}

function defaultInstruction(period: StudyBlock["period"]) {
  if (period === "Noite") return "Resolver questões";
  return "Estudar teoria";
}

function createSlot(
  date: Date,
  block: StudyBlock,
  subject: SubjectInput,
  minutes: number,
  cursors: Map<string, number>
): ScheduleItem {
  const index = cursors.get(subject.name) || 0;
  cursors.set(subject.name, index + 1);
  const topic = subject.topics[index % Math.max(1, subject.topics.length)] || "Revisão geral";

  return {
    date: toIso(date),
    weekday: weekdayNames[date.getDay()],
    period: block.period,
    subject: subject.name,
    topic: `${trimTrailingPunctuation(block.instruction)}: ${topic}`,
    kind: block.kind,
    minutes
  };
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function positiveNumber(value?: number | null) {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : 0;
}

function sentenceCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

function trimTrailingPunctuation(value: string) {
  return value.replace(/[:;,.-]+$/, "").trim();
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
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

function weekKey(date: Date) {
  const monday = new Date(date);
  const offset = (date.getDay() + 6) % 7;
  monday.setDate(date.getDate() - offset);
  return toIso(monday);
}

function toIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

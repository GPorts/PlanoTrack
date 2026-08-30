import type { ExamBlock, ExamTarget, SubjectInput } from "./types";

export class TargetSelectionRequiredError extends Error {
  targets: ExamTarget[];

  constructor(targets: ExamTarget[]) {
    super("Este edital possui mais de um cargo ou área. Escolha qual deles será usado no plano.");
    this.name = "TargetSelectionRequiredError";
    this.targets = targets;
  }
}

export function prepareExtractedSubjects(subjects: SubjectInput[], blocks: ExamBlock[]) {
  const uniqueSubjects = dedupeSubjects(subjects);
  const normalizedBlocks = blocks.map((block) => ({
    ...block,
    subjectNames: [...new Set(block.subjectNames.map((name) => name.trim()).filter(Boolean))]
  }));

  const blockSubjectNames = normalizedBlocks.flatMap((block) => block.subjectNames);
  const scopedSubjects = blockSubjectNames.length
    ? uniqueSubjects.filter((subject) => blockSubjectNames.some((name) => namesMatch(subject.name, name)))
    : uniqueSubjects;

  if (!scopedSubjects.length) {
    throw new Error("Não foi possível identificar as disciplinas do cargo ou área selecionada.");
  }

  const prepared = scopedSubjects.map((subject) => ({ ...subject }));
  const preparedByName = new Map(prepared.map((subject) => [normalize(subject.name), subject]));

  for (const block of normalizedBlocks) {
    const blockSubjects = block.subjectNames
      .map((name) => scopedSubjects.find((subject) => namesMatch(subject.name, name)))
      .filter((subject): subject is SubjectInput => Boolean(subject));
    if (!blockSubjects.length) continue;

    const blockPoints = positiveNumber(block.totalPoints)
      || positiveNumber(block.questions) * positiveNumber(block.pointsPerQuestion)
      || positiveNumber(block.questions)
      || 1;
    const fallbackPriority = blockPoints / blockSubjects.length;

    for (const sourceSubject of blockSubjects) {
      const subject = preparedByName.get(normalize(sourceSubject.name));
      if (!subject) continue;

      const copiedBlockTotal = blockSubjects.length > 1 && (
        samePositiveNumber(subject.questions, block.questions)
        || samePositiveNumber(subject.weight, block.totalPoints)
      );
      const explicitPriority = copiedBlockTotal ? 0 : positiveNumber(subject.weight) || positiveNumber(subject.questions);
      const contentAdjustment = 1 + Math.min(0.15, Math.log2(Math.max(1, subject.topics.length) + 1) / 25);

      subject.group = block.name;
      subject.priority = (explicitPriority || fallbackPriority) * contentAdjustment;
      if (copiedBlockTotal) {
        subject.questions = undefined;
        subject.weight = undefined;
      }
    }
  }

  const priorities = prepared.map((subject) => positiveNumber(subject.priority)).filter(Boolean);
  const fallback = priorities.length ? priorities.reduce((sum, value) => sum + value, 0) / priorities.length : 1;

  return prepared.map((subject) => ({
    ...subject,
    priority: positiveNumber(subject.priority) || fallback
  }));
}

export function targetMatchesSelection(target: ExamTarget, selectedTarget: string) {
  const selected = normalize(selectedTarget);
  return normalize(target.id) === selected
    || normalize(target.label) === selected
    || normalize(target.label).includes(selected)
    || selected.includes(normalize(target.label));
}

function dedupeSubjects(subjects: SubjectInput[]) {
  const unique = new Map<string, SubjectInput>();
  for (const subject of subjects) {
    const key = normalize(subject.name);
    if (!key || unique.has(key)) continue;
    unique.set(key, {
      ...subject,
      name: subject.name.trim(),
      topics: [...new Set(subject.topics.map((topic) => topic.trim()).filter(Boolean))]
    });
  }
  return [...unique.values()];
}

function samePositiveNumber(left?: number, right?: number | null) {
  const a = positiveNumber(left);
  const b = positiveNumber(right);
  return a > 0 && b > 0 && Math.abs(a - b) < 0.001;
}

function positiveNumber(value?: number | null) {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : 0;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function namesMatch(left: string, right: string) {
  const a = normalize(left);
  const b = normalize(right);
  return a === b || (Math.min(a.length, b.length) >= 8 && (a.includes(b) || b.includes(a)));
}

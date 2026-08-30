import assert from "node:assert/strict";
import test from "node:test";
import { generateRuleBasedPlan, inferRoutinePolicy } from "../lib/plan-rules.ts";
import { prepareExtractedSubjects, targetMatchesSelection } from "../lib/edital-plan.ts";

const weekdays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function iso(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function baseRequest(routine) {
  return {
    mode: "ai",
    routine: {
      examName: "Prova de teste",
      examDate: iso(addDays(new Date(), 24)),
      preferredBlocks: "Manhã para teoria; noite para questões.",
      ...routine
    },
    subjects: [
      { name: "Português", questions: 10, weight: 10, topics: ["Interpretação", "Gramática"] },
      { name: "Matemática", questions: 5, weight: 5, topics: ["Álgebra", "Geometria"] }
    ]
  };
}

test("usa a quantidade de horas configurada para cada dia da semana", () => {
  const hoursByDay = {
    "Segunda-feira": 1.5,
    "Terça-feira": 3,
    Sábado: 4
  };
  const plan = generateRuleBasedPlan(baseRequest({
    hoursByDay,
    studyDays: Object.keys(hoursByDay)
  }));
  const totalsByDate = new Map();

  for (const item of plan.schedule) {
    totalsByDate.set(item.date, (totalsByDate.get(item.date) || 0) + item.minutes);
    assert.ok(item.date < plan.examDate, "nenhuma sessão deve cair no dia da prova");
  }

  assert.ok(totalsByDate.size > 0);
  for (const [date, totalMinutes] of totalsByDate) {
    const [year, month, day] = date.split("-").map(Number);
    const weekday = weekdays[new Date(year, month - 1, day).getDay()];
    assert.equal(totalMinutes, hoursByDay[weekday] * 60);
  }
});

test("mantém compatibilidade com a carga fixa dos pedidos antigos", () => {
  const targetDay = weekdays[addDays(new Date(), 1).getDay()];
  const plan = generateRuleBasedPlan(baseRequest({
    hoursByDay: {},
    hoursPerDay: 2,
    studyDays: [targetDay]
  }));
  const firstDate = plan.schedule[0]?.date;
  const firstDayMinutes = plan.schedule
    .filter((item) => item.date === firstDate)
    .reduce((sum, item) => sum + item.minutes, 0);

  assert.ok(firstDate);
  assert.equal(firstDayMinutes, 120);
});

test("a divisão entre períodos preserva exatamente a carga diária", () => {
  const targetDay = weekdays[addDays(new Date(), 1).getDay()];
  const plan = generateRuleBasedPlan(baseRequest({
    hoursByDay: { [targetDay]: 2.5 },
    studyDays: [targetDay]
  }));
  const firstDate = plan.schedule[0]?.date;
  const blocks = plan.schedule.filter((item) => item.date === firstDate);

  assert.equal(blocks.reduce((sum, item) => sum + item.minutes, 0), 150);
  assert.ok(Math.max(...blocks.map((item) => item.minutes)) - Math.min(...blocks.map((item) => item.minutes)) <= 1);
});

test("usa uma rotina equilibrada quando o usuário deixa o campo em branco", () => {
  const policy = inferRoutinePolicy("");

  assert.equal(policy.maxSubjectsPerDay, 1);
  assert.equal(policy.avoidConsecutiveSubjectDays, true);
  assert.deepEqual(policy.blocks.map((block) => block.kind), ["teoria", "questoes", "revisao"]);
});

test("não atribui o total de um bloco a uma única disciplina", () => {
  const subjects = prepareExtractedSubjects([
    { name: "Língua Portuguesa", questions: 50, weight: 50, topics: ["Interpretação", "Gramática"] },
    { name: "Noções de Direito Eleitoral", questions: null, weight: null, topics: ["Eleições"] },
    { name: "Noções de Direito Administrativo", questions: null, weight: null, topics: ["Atos"] },
    { name: "Noções de Direito Constitucional", questions: null, weight: null, topics: ["Direitos fundamentais"] },
    { name: "Administração Pública", questions: 70, weight: 140, topics: ["Modelos"] },
    { name: "Gestão de Pessoas", questions: null, weight: null, topics: ["Liderança"] },
    { name: "Gestão de Contratos", questions: null, weight: null, topics: ["Contratos"] }
  ], [
    { name: "Conhecimentos Básicos", questions: 50, pointsPerQuestion: 1, totalPoints: 50, subjectNames: ["Língua Portuguesa", "Noções de Direito Eleitoral", "Noções de Direito Administrativo", "Noções de Direito Constitucional"] },
    { name: "Conhecimentos Específicos", questions: 70, pointsPerQuestion: 2, totalPoints: 140, subjectNames: ["Administração Pública", "Gestão de Pessoas", "Gestão de Contratos"] }
  ]);

  const portuguese = subjects.find((subject) => subject.name === "Língua Portuguesa");
  const publicAdministration = subjects.find((subject) => subject.name === "Administração Pública");
  assert.equal(portuguese.questions, undefined);
  assert.equal(portuguese.weight, undefined);
  assert.equal(publicAdministration.questions, undefined);
  assert.equal(publicAdministration.weight, undefined);
  assert.ok(publicAdministration.priority > portuguese.priority);
  assert.ok(publicAdministration.priority / portuguese.priority < 5);
});

test("distribui o calendário pelo peso dos blocos sem concentrar em Português", () => {
  const subjects = prepareExtractedSubjects([
    { name: "Língua Portuguesa", topics: ["Interpretação", "Gramática"] },
    { name: "Direito Eleitoral", topics: ["Eleições"] },
    { name: "Direito Administrativo", topics: ["Atos"] },
    { name: "Direito Constitucional", topics: ["Direitos fundamentais"] },
    { name: "Administração Pública", topics: ["Modelos"] },
    { name: "Gestão de Pessoas", topics: ["Liderança"] },
    { name: "Gestão de Contratos", topics: ["Contratos"] }
  ], [
    { name: "Básicos", questions: 50, pointsPerQuestion: 1, totalPoints: 50, subjectNames: ["Língua Portuguesa", "Direito Eleitoral", "Direito Administrativo", "Direito Constitucional"] },
    { name: "Específicos", questions: 70, pointsPerQuestion: 2, totalPoints: 140, subjectNames: ["Administração Pública", "Gestão de Pessoas", "Gestão de Contratos"] }
  ]);
  const plan = generateRuleBasedPlan({
    mode: "ai",
    routine: {
      examName: "Cargo 19",
      examDate: iso(addDays(new Date(), 120)),
      preferredBlocks: "",
      studyDays: weekdays,
      hoursPerDay: 3
    },
    subjects
  });
  const counts = Map.groupBy(plan.schedule, (item) => item.subject);
  const portugueseShare = (counts.get("Língua Portuguesa")?.length || 0) / plan.schedule.length;

  assert.ok(portugueseShare < 0.15);
  assert.equal(new Set(plan.schedule.filter((item) => item.date === plan.schedule[0].date).map((item) => item.subject)).size, 1);
});

test("reconhece uma escolha de cargo pelo código ou pelo nome", () => {
  const target = { id: "cargo-19", label: "Cargo 19 - Técnico Judiciário - Área Administrativa" };
  assert.equal(targetMatchesSelection(target, "cargo-19"), true);
  assert.equal(targetMatchesSelection(target, "Cargo 19 - Técnico Judiciário - Área Administrativa"), true);
  assert.equal(targetMatchesSelection(target, "cargo 20"), false);
});

test("remove disciplinas que não pertencem aos blocos do cargo selecionado", () => {
  const subjects = prepareExtractedSubjects([
    { name: "Língua Portuguesa", topics: ["Interpretação"] },
    { name: "Administração Pública", topics: ["Modelos"] },
    { name: "Direito Penal", topics: ["Crimes"] }
  ], [
    { name: "Cargo 19", questions: 120, pointsPerQuestion: 1, totalPoints: 120, subjectNames: ["Língua Portuguesa", "Administração Pública"] }
  ]);

  assert.deepEqual(subjects.map((subject) => subject.name), ["Língua Portuguesa", "Administração Pública"]);
});

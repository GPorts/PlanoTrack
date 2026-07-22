import assert from "node:assert/strict";
import test from "node:test";
import { generateRuleBasedPlan } from "../lib/plan-rules.ts";

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

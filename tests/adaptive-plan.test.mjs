import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRebalancePreview,
  calculatePlanBudget,
  calculateTopicMastery,
  recommendNextSession,
  scheduleReview,
  weeklyReview
} from "../lib/adaptive-plan.ts";

const now = new Date("2026-07-20T10:00:00-03:00");

function item(date, period = "Manha", status = "planned", completionPercent = 0) {
  return {
    id: `${date}-${period}`,
    date,
    weekday: "Segunda-feira",
    period,
    subject: period === "Manha" ? "Português" : "Constitucional",
    topic: `Tópico ${period}`,
    kind: "teoria",
    minutes: 60,
    status,
    completionPercent
  };
}

test("a recuperação não move sessões concluídas nem usa o dia da prova", () => {
  const schedule = [
    item("2026-07-17", "Manha", "completed", 100),
    item("2026-07-17", "Tarde", "missed"),
    item("2026-07-20", "Manha"),
    item("2026-07-22", "Tarde"),
    item("2026-07-24", "Noite")
  ];
  const preview = buildRebalancePreview(schedule, "2026-07-25", now);
  assert.equal(preview.moves.some((move) => move.itemId === "2026-07-17-Manha"), false);
  assert.equal(preview.moves.every((move) => move.toDate < "2026-07-25"), true);
});

test("vários dias perdidos produzem aviso quando não cabem no prazo", () => {
  const schedule = [
    item("2026-07-13", "Manha", "missed"),
    item("2026-07-14", "Manha", "missed"),
    item("2026-07-15", "Manha", "missed"),
    item("2026-07-20", "Manha")
  ];
  const preview = buildRebalancePreview(schedule, "2026-07-21", now);
  assert.equal(preview.risk, "unviable");
  assert.match(preview.suggestions.join(" "), /não cabem/i);
});

test("sessão parcial desconta somente o percentual já concluído", () => {
  const partial = item("2026-07-20", "Manha", "partial", 50);
  const budget = calculatePlanBudget([partial], "2026-07-25", now);
  assert.equal(budget.remainingMinutes, 30);
});

test("plano com poucos dias restantes expõe sobrecarga", () => {
  const schedule = [
    item("2026-07-19", "Manha", "missed"),
    item("2026-07-20", "Manha"),
    item("2026-07-20", "Tarde"),
    item("2026-07-20", "Noite")
  ];
  const budget = calculatePlanBudget(schedule, "2026-07-21", now);
  assert.equal(budget.risk, "unviable");
});

test("domínio funciona sem avaliação de dificuldade", () => {
  const mastery = calculateTopicMastery("Português", "Interpretação", [{
    id: "s1",
    date: "2026-07-20",
    subject: "Português",
    topic: "Interpretação de texto",
    minutes: 60,
    questions: 10,
    correct: 8
  }], undefined, now);
  assert.ok(mastery.mastery > 0);
  assert.equal(mastery.accuracy, 80);
});

test("FSRS agenda uma revisão futura e mantém histórico básico", () => {
  const review = scheduleReview(undefined, "good", now);
  assert.ok(new Date(review.dueAt) > now);
  assert.equal(review.reps, 1);
});

test("revisão semanal respeita datas locais fornecidas", () => {
  const review = weeklyReview([item("2026-07-20", "Manha", "completed", 100)], [{
    id: "s1",
    date: "2026-07-20",
    subject: "Português",
    minutes: 60,
    questions: 5,
    correct: 4
  }], now);
  assert.equal(review.adherence, 100);
  assert.equal(review.accuracy, 80);
});

test("maior peso e erros pendentes elevam a prioridade da próxima sessão", () => {
  const low = item("2026-07-20", "Manha");
  low.subject = "Português";
  const high = item("2026-07-20", "Tarde");
  high.subject = "Constitucional";
  const next = recommendNextSession([low, high], [], {
    Português: { weight: 5, unresolvedErrors: 0 },
    Constitucional: { weight: 20, unresolvedErrors: 3 }
  }, now);
  assert.equal(next.subject, "Constitucional");
});

test("horas extras aumentam a capacidade sem apagar conteúdo restante", () => {
  const schedule = [item("2026-07-20", "Manha"), item("2026-07-22", "Tarde")];
  const base = calculatePlanBudget(schedule, "2026-07-23", now);
  const expanded = calculatePlanBudget(schedule, "2026-07-23", now, 60);
  assert.equal(expanded.remainingMinutes, base.remainingMinutes);
  assert.ok(expanded.availableMinutes > base.availableMinutes);
});

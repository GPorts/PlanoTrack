import assert from "node:assert/strict";
import test from "node:test";
import { trialDaysRemaining, trialPeriodEnd } from "../lib/access.ts";

test("o teste termina exatamente sete dias após a primeira geração", () => {
  const start = new Date("2026-08-23T18:00:00-03:00");
  assert.equal(trialPeriodEnd(start).toISOString(), "2026-08-30T21:00:00.000Z");
});

test("a contagem mostra dias inteiros restantes e nunca fica negativa", () => {
  const end = "2026-08-30T21:00:00.000Z";
  assert.equal(trialDaysRemaining(end, new Date("2026-08-23T21:01:00.000Z")), 7);
  assert.equal(trialDaysRemaining(end, new Date("2026-08-30T20:59:00.000Z")), 1);
  assert.equal(trialDaysRemaining(end, new Date("2026-08-31T00:00:00.000Z")), 0);
});

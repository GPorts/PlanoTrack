import assert from "node:assert/strict";
import test from "node:test";
import { calculateElapsedSeconds, elapsedMinutes } from "../lib/session-timer.ts";

test("calcula o tempo real mesmo quando o navegador deixa de executar intervalos", () => {
  const startedAt = 1_000;
  const oneHourLater = startedAt + 60 * 60 * 1_000;
  assert.equal(calculateElapsedSeconds(0, startedAt, oneHourLater), 3_600);
});

test("pausar preserva o tempo acumulado e retomar soma apenas o novo período", () => {
  const pausedAt = calculateElapsedSeconds(125, 10_000, 15_000);
  assert.equal(pausedAt, 130);
  assert.equal(calculateElapsedSeconds(pausedAt, null, 50_000), 130);
  assert.equal(calculateElapsedSeconds(pausedAt, 60_000, 70_000), 140);
});

test("converte segundos do cronômetro em minutos reais arredondados para cima", () => {
  assert.equal(elapsedMinutes(1), 1);
  assert.equal(elapsedMinutes(60), 1);
  assert.equal(elapsedMinutes(61), 2);
});

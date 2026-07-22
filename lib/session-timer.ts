export function calculateElapsedSeconds(accumulatedSeconds: number, startedAtMs: number | null, nowMs = Date.now()) {
  if (startedAtMs === null) return Math.max(0, Math.floor(accumulatedSeconds));
  const currentRunSeconds = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
  return Math.max(0, Math.floor(accumulatedSeconds)) + currentRunSeconds;
}

export function elapsedMinutes(seconds: number) {
  return Math.max(1, Math.ceil(Math.max(0, seconds) / 60));
}

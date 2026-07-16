export function getEnv(name: string) {
  return process.env[name] || "";
}

export function isConfigured(names: string[]) {
  return names.every((name) => Boolean(getEnv(name)));
}

export function isMockAiEnabled() {
  return process.env.ENABLE_MOCK_AI === "true";
}

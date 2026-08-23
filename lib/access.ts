export const FREE_TRIAL_DAYS = 7;

export type TrialStatus = "pending" | "active" | "expired";

export type TrialAccess = {
  status: TrialStatus;
  startsAt: string | null;
  endsAt: string | null;
  daysRemaining: number | null;
  generationAvailable: boolean;
};

export type AppAccess = {
  active: boolean;
  accessType: "paid" | "trial" | "none";
  trial: TrialAccess | null;
};

export function trialPeriodEnd(startedAt: Date) {
  return new Date(startedAt.getTime() + FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

export function trialDaysRemaining(endsAt: string, now = new Date()) {
  const remainingMilliseconds = new Date(endsAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(remainingMilliseconds / (24 * 60 * 60 * 1000)));
}
